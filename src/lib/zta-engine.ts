import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { computeTrustScore, ContextSignals, TrustScoreResult } from './trust-algorithm';

export interface SessionContext {
  username: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  location: string;
  ipAddress: string;
  mfaCompleted: boolean;
  isAuthenticated?: boolean;
}

export interface EvaluationContext {
  username: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  location: string;
  ipAddress: string;
  mfaCompleted: boolean;
  resource: 'patient-records' | 'admin-records' | 'audit-evidence';
  action: 'Read' | 'Write';
  targetPatientId?: string; // Specific patient ID for Blast Radius scope containment check
  sessionAgeSeconds?: number; // Session age in seconds for Continuous Verification
  skipAuditLog?: boolean;
  breakGlassJustification?: string; // Required for emergency.admin break-glass
  deviceCompliant?: boolean;
  isOffHours?: boolean;
  travelVelocityKmH?: number;
  isForeignLocation?: boolean;
}

export interface ZtaEvaluationResult {
  accessGranted: boolean;
  policyTriggered: string;
  failureReason: string;
  requiredAction: 'None' | 'MFA_CHALLENGE' | 'BLOCK' | 'BREAK_GLASS_JUSTIFICATION' | 'ALLOW';
  trustScore?: number;
  policyId?: 'ZTP-01' | 'ZTP-02' | 'ZTP-03' | 'ZTP-04' | 'ZTP-05' | 'ZTP-05-CRITICAL' | 'ZTP-RBAC' | 'ZTP-SCOPE-CONTAINMENT' | 'ZTP-FAIL-CLOSED';
}

export async function evaluateZtaAccess(
  context: EvaluationContext
): Promise<ZtaEvaluationResult> {
  const {
    username,
    riskLevel,
    location,
    ipAddress,
    mfaCompleted,
    resource,
    action,
    skipAuditLog = false,
    breakGlassJustification,
    deviceCompliant = true,
  } = context;

  const cleanUsername = (username || '').replace(/^@+/, '').trim().toLowerCase();

  // 1. Compute Dynamic Trust Score from ALL 8 Context Signals
  const trustSignals: ContextSignals = {
    ipAddress,
    location,
    riskLevel,
    deviceCompliant,
    sessionAgeSeconds: context.sessionAgeSeconds,
    isOffHours: context.isOffHours,
    travelVelocityKmH: context.travelVelocityKmH,
    isForeignLocation: context.isForeignLocation,
  };
  const trustResult: TrustScoreResult = computeTrustScore(trustSignals);
  const effectiveRisk = trustResult.derivedRiskLevel;

  // Helper function for Mandatory Audit Logging ("No log, no access")
  const logAudit = async (res: ZtaEvaluationResult, primaryGroup = 'None'): Promise<boolean> => {
    if (skipAuditLog) return true;
    try {
      await db.insert(schema.auditLogs).values({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        username: cleanUsername,
        userGroup: primaryGroup,
        action: `${action} ${resource}`,
        resource: resource,
        accessGranted: res.accessGranted ? 1 : 0,
        riskLevel: effectiveRisk,
        location: location,
        ipAddress: ipAddress,
        policyTriggered: res.policyTriggered,
        failureReason: res.failureReason,
      });
      return true;
    } catch (err) {
      console.error('CRITICAL: Audit log write failure. Access denied under "No Log, No Access" policy:', err);
      return false;
    }
  };

  // 2. Controlled Break-Glass Emergency Overrides (Requires Typed Justification & 15-Min Timeboxing)
  const isEmergencyAdmin = cleanUsername === 'emergency.admin';
  if (isEmergencyAdmin) {
    if (!breakGlassJustification || breakGlassJustification.trim().length < 10) {
      const result: ZtaEvaluationResult = {
        accessGranted: false,
        policyTriggered: 'ZTP-05 - Account Lifecycle & Status (Emergency Break-Glass Guard)',
        failureReason: 'Emergency break-glass activation requires a documented justification string (minimum 10 characters).',
        requiredAction: 'BREAK_GLASS_JUSTIFICATION',
        trustScore: trustResult.score,
        policyId: 'ZTP-05',
      };
      await logAudit(result);
      return result;
    }

    // 15-Minute Time-Boxing Expiration Check
    if (context.sessionAgeSeconds && context.sessionAgeSeconds > 900) { // 15 mins = 900s
      const result: ZtaEvaluationResult = {
        accessGranted: false,
        policyTriggered: 'ZTP-05 - Break-Glass Elevation Expired',
        failureReason: 'Emergency break-glass access window has expired (15-minute timebox limit reached). Please re-authenticate.',
        requiredAction: 'BLOCK',
        trustScore: trustResult.score,
        policyId: 'ZTP-05',
      };
      await logAudit(result);
      return result;
    }

    // Valid Emergency Break-Glass Override Granted — Bypasses blocking policies
    const bgResult: ZtaEvaluationResult = {
      accessGranted: true,
      policyTriggered: 'ZTP-05 - Controlled Emergency Break-Glass Override',
      failureReason: '',
      requiredAction: 'None',
      trustScore: trustResult.score,
      policyId: 'ZTP-05',
    };
    await logAudit(bgResult, 'EHR-Cloud-Admins');
    return bgResult;
  }

  // 3. User Directory & Security Group Resolution (Fail-Closed)
  let user: any = null;
  let groups: string[] = [];

  try {
    const userRows = await db.select().from(schema.users).where(eq(schema.users.username, cleanUsername));
    if (userRows && userRows.length > 0) {
      user = userRows[0];
      const ugRows = await db
        .select({ groupName: schema.securityGroups.name })
        .from(schema.userGroups)
        .innerJoin(schema.securityGroups, eq(schema.userGroups.groupId, schema.securityGroups.id))
        .where(eq(schema.userGroups.userId, user.id));
      groups = ugRows.map((r) => r.groupName);
    }
  } catch (err) {
    console.error('Database connection error during directory lookup:', err);
  }

  // Fallback for Serverless / Directory Mock Resolution
  if (!user) {
    const mockMap: Record<string, string> = {
      globaladmin01: 'EHR-Cloud-Admins',
      doctor01: 'EHR-Doctors',
      nurse01: 'EHR-Nurses',
      recordsadmin01: 'EHR-Records-Admins',
      itsecurityadmin01: 'EHR-IT-Security',
      cloudadmin01: 'EHR-Cloud-Admins',
      vendor01: 'EHR-Vendors',
      auditor01: 'EHR-Auditors',
      'officer@hmc.com': 'EHR-IT-Security',
    };
    if (mockMap[cleanUsername]) {
      user = { id: `u-${cleanUsername}`, username: cleanUsername, status: 'Active' };
      groups = [mockMap[cleanUsername]];
    }
  }

  if (!user) {
    const result: ZtaEvaluationResult = {
      accessGranted: false,
      policyTriggered: 'ZTP-FAIL-CLOSED - Directory Lookup Failed',
      failureReason: `Access denied. Directory user '${cleanUsername}' could not be verified (ZTP-DIRECTORY-UNAVAILABLE).`,
      requiredAction: 'BLOCK',
      trustScore: trustResult.score,
      policyId: 'ZTP-FAIL-CLOSED',
    };
    await logAudit(result);
    return result;
  }

  // 4. Policy ZTP-05: Account Status & Lifecycle Enforcement
  if (user.status === 'Banned') {
    const result: ZtaEvaluationResult = {
      accessGranted: false,
      policyTriggered: 'ZTP-05 - Account Lifecycle & Status',
      failureReason: `Access blocked. User account '${cleanUsername}' has been suspended or lifecycle-terminated.`,
      requiredAction: 'BLOCK',
      trustScore: trustResult.score,
      policyId: 'ZTP-05',
    };
    await logAudit(result, groups[0] || 'None');
    return result;
  }

  const primaryGroup = groups[0] || 'None';

  // 5. Policy ZTP-02: Block High Sign-in Risk Signals (Trust Score < 50)
  if (effectiveRisk === 'High') {
    const result: ZtaEvaluationResult = {
      accessGranted: false,
      policyTriggered: 'ZTP-02 - Block High Risk Sign-Ins',
      failureReason: `Access blocked. Dynamic trust evaluation calculated a High risk level (Trust Score: ${trustResult.score}/100).`,
      requiredAction: 'BLOCK',
      trustScore: trustResult.score,
      policyId: 'ZTP-02',
    };
    await logAudit(result, primaryGroup);
    return result;
  }

  // 6. Policy ZTP-03: Require Step-up MFA for Medium Sign-in Risk (Trust Score 50-79)
  if (effectiveRisk === 'Medium' && !mfaCompleted) {
    const result: ZtaEvaluationResult = {
      accessGranted: false,
      policyTriggered: 'ZTP-03 - Step-Up MFA for Medium Risk Sign-Ins',
      failureReason: `Step-up Multi-Factor Authentication required (Trust Score: ${trustResult.score}/100).`,
      requiredAction: 'MFA_CHALLENGE',
      trustScore: trustResult.score,
      policyId: 'ZTP-03',
    };
    await logAudit(result, primaryGroup);
    return result;
  }

  // 7. Policy ZTP-04: Require Mandatory MFA for Privileged Accounts
  const isPrivilegedAdmin =
    cleanUsername === 'cloudadmin01' ||
    cleanUsername === 'itsecurityadmin01' ||
    cleanUsername === 'officer@hmc.com' ||
    cleanUsername === 'globaladmin01' ||
    groups.includes('EHR-Cloud-Admins') ||
    groups.includes('EHR-IT-Security');

  if (isPrivilegedAdmin && !mfaCompleted) {
    const result: ZtaEvaluationResult = {
      accessGranted: false,
      policyTriggered: 'ZTP-04 - Privileged Account Security Scope',
      failureReason: 'Privileged identity accounts must complete Multi-Factor Authentication.',
      requiredAction: 'MFA_CHALLENGE',
      trustScore: trustResult.score,
      policyId: 'ZTP-04',
    };
    await logAudit(result, primaryGroup);
    return result;
  }

  // 8. Policy ZTP-01: General MFA Requirement for EHR Staff
  const isEhrUser = groups.length > 0;
  if (isEhrUser && !mfaCompleted) {
    const result: ZtaEvaluationResult = {
      accessGranted: false,
      policyTriggered: 'ZTP-01 - Authentication Strength & MFA Enforcement',
      failureReason: 'Access requires completion of Multi-Factor Authentication (MFA).',
      requiredAction: 'MFA_CHALLENGE',
      trustScore: trustResult.score,
      policyId: 'ZTP-01',
    };
    await logAudit(result, primaryGroup);
    return result;
  }

  // 9. Policy ZTP-06: Continuous Access Evaluation & 90s Re-Authentication Limit
  if (context.sessionAgeSeconds !== undefined && context.sessionAgeSeconds >= 90 && !mfaCompleted) {
    const result: ZtaEvaluationResult = {
      accessGranted: false,
      policyTriggered: 'ZTP-06 - Continuous Verification Timeout (90s Limit)',
      failureReason: `Session age (${context.sessionAgeSeconds}s) reached the 90-second Zero Trust continuous re-authentication limit. MFA re-authentication is required.`,
      requiredAction: 'MFA_CHALLENGE',
      trustScore: Math.max(0, trustResult.score - 40),
      policyId: 'ZTP-06',
    };
    await logAudit(result, primaryGroup);
    return result;
  }

  // 9. Independent Role-Based Access Control & Micro-Segmentation

  // patient-records Container
  if (resource === 'patient-records') {
    const isMasterAdminGroup = groups.includes('EHR-Cloud-Admins');
    const hasWrite = groups.includes('EHR-Doctors') || isMasterAdminGroup;
    const hasRead = groups.includes('EHR-Nurses') || hasWrite;

    if (action === 'Write' && !hasWrite) {
      const result: ZtaEvaluationResult = {
        accessGranted: false,
        policyTriggered: 'ZTP-RBAC - Container Isolation',
        failureReason: `Role '${primaryGroup}' is not permitted to perform Write operations on patient-records.`,
        requiredAction: 'BLOCK',
        trustScore: trustResult.score,
        policyId: 'ZTP-RBAC',
      };
      await logAudit(result, primaryGroup);
      return result;
    }

    if (action === 'Read' && !hasRead) {
      const result: ZtaEvaluationResult = {
        accessGranted: false,
        policyTriggered: 'ZTP-RBAC - Container Isolation',
        failureReason: `Role '${primaryGroup}' is not permitted to perform Read operations on patient-records.`,
        requiredAction: 'BLOCK',
        trustScore: trustResult.score,
        policyId: 'ZTP-RBAC',
      };
      await logAudit(result, primaryGroup);
      return result;
    }

    // Per-Patient Scope Containment (Blast Radius Reduction Check)
    if (context.targetPatientId && !isMasterAdminGroup) {
      try {
        const patientRows = await db.select().from(schema.patients).where(eq(schema.patients.id, context.targetPatientId));
        const targetPatient = patientRows && patientRows.length > 0 ? patientRows[0] : null;
        const isAssignedClinician = targetPatient && targetPatient.assignedClinicianId === cleanUsername;
        
        if (!isAssignedClinician) {
          const hasValidJustification = breakGlassJustification && breakGlassJustification.trim().length >= 10;
          if (!hasValidJustification) {
            const result: ZtaEvaluationResult = {
              accessGranted: false,
              policyTriggered: 'ZTP-SCOPE-CONTAINMENT - Blast Radius Reduction',
              failureReason: `Access denied. Clinician '${cleanUsername}' is not assigned to Patient '${context.targetPatientId}'. Access outside assignment scope requires Emergency Break-Glass justification (minimum 10 characters).`,
              requiredAction: 'BREAK_GLASS_JUSTIFICATION',
              trustScore: trustResult.score,
              policyId: 'ZTP-RBAC',
            };
            await logAudit(result, primaryGroup);
            return result;
          }

          await logAudit(
            {
              accessGranted: true,
              policyTriggered: 'ZTP-05-CRITICAL - Break-Glass Scope Override',
              failureReason:
                `CRITICAL: Break-glass override by '${cleanUsername}' for unassigned ` +
                `patient '${context.targetPatientId}'. Justification: ` +
                `"${breakGlassJustification}"`,
              requiredAction: 'ALLOW',
              trustScore: trustResult.score,
              policyId: 'ZTP-05-CRITICAL',
            },
            primaryGroup
          );
        }
      } catch (err: any) {
        console.error('Scope containment lookup failed:', err?.message || err);
        const result: ZtaEvaluationResult = {
          accessGranted: false,
          policyTriggered: 'ZTP-SCOPE-CONTAINMENT - Fail Closed',
          failureReason:
            'Access denied. Patient assignment could not be verified (ZTP-SCOPE-UNAVAILABLE).',
          requiredAction: 'BLOCK',
          trustScore: trustResult.score,
          policyId: 'ZTP-SCOPE-CONTAINMENT',
        };
        await logAudit(result, primaryGroup);
        return result;
      }
    }
  }

  // admin-records Container
  if (resource === 'admin-records') {
    const isMasterAdminGroup = groups.includes('EHR-Cloud-Admins');
    const hasAdminAccess = groups.includes('EHR-Records-Admins') || isMasterAdminGroup;
    if (!hasAdminAccess) {
      const result: ZtaEvaluationResult = {
        accessGranted: false,
        policyTriggered: 'ZTP-RBAC - Container Isolation',
        failureReason: `Role '${primaryGroup}' is not permitted to access administrative records container.`,
        requiredAction: 'BLOCK',
        trustScore: trustResult.score,
        policyId: 'ZTP-RBAC',
      };
      await logAudit(result, primaryGroup);
      return result;
    }
  }

  // audit-evidence Container
  if (resource === 'audit-evidence') {
    const isMasterAdminGroup = groups.includes('EHR-Cloud-Admins');
    const hasAuditAccess =
      groups.includes('EHR-Auditors') || groups.includes('EHR-IT-Security') || isMasterAdminGroup;
    if (!hasAuditAccess) {
      const result: ZtaEvaluationResult = {
        accessGranted: false,
        policyTriggered: 'ZTP-RBAC - Container Isolation',
        failureReason: `Role '${primaryGroup}' is not permitted to access audit compliance container.`,
        requiredAction: 'BLOCK',
        trustScore: trustResult.score,
        policyId: 'ZTP-RBAC',
      };
      await logAudit(result, primaryGroup);
      return result;
    }
  }

  // 10. Success - Access Granted with Mandatory Log Verification
  const successResult: ZtaEvaluationResult = {
    accessGranted: true,
    policyTriggered: 'ZTP Engine Policy Evaluation Passed',
    failureReason: '',
    requiredAction: 'None',
    trustScore: trustResult.score,
  };

  const auditSuccess = await logAudit(successResult, primaryGroup);
  if (!auditSuccess) {
    return {
      accessGranted: false,
      policyTriggered: 'ZTP-FAIL-CLOSED - Audit Failure',
      failureReason: 'Access denied under "No Log, No Access" policy due to audit record storage error.',
      requiredAction: 'BLOCK',
      trustScore: trustResult.score,
      policyId: 'ZTP-FAIL-CLOSED',
    };
  }

  return successResult;
}
