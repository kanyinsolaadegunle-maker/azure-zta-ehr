import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { computeTrustScore, ContextSignals, TrustScoreResult } from './trust-algorithm';

export interface EvaluationContext {
  username: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  location: string;
  ipAddress: string;
  mfaCompleted: boolean;
  resource: 'patient-records' | 'admin-records' | 'audit-evidence';
  action: 'Read' | 'Write';
  skipAuditLog?: boolean;
  breakGlassJustification?: string; // Required for emergency.admin break-glass
  deviceCompliant?: boolean;
}

export interface ZtaEvaluationResult {
  accessGranted: boolean;
  policyTriggered: string;
  failureReason: string;
  requiredAction: 'None' | 'MFA_CHALLENGE' | 'BLOCK' | 'BREAK_GLASS_JUSTIFICATION';
  trustScore?: number;
  policyId?: 'ZTP-01' | 'ZTP-02' | 'ZTP-03' | 'ZTP-04' | 'ZTP-05' | 'ZTP-RBAC' | 'ZTP-FAIL-CLOSED';
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

  // 1. Compute Dynamic Trust Score from signals
  const trustSignals: ContextSignals = {
    ipAddress,
    location,
    riskLevel,
    deviceCompliant,
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

  // 2. Controlled Break-Glass Emergency Overrides (Requires Typed Justification)
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
      await logAudit(result, 'Emergency-Break-Glass');
      return result;
    }

    const result: ZtaEvaluationResult = {
      accessGranted: true,
      policyTriggered: 'ZTP-05 - Emergency Break-Glass Override Activated (15-min window)',
      failureReason: '',
      requiredAction: 'None',
      trustScore: trustResult.score,
      policyId: 'ZTP-05',
    };

    const auditLogged = await logAudit(result, 'Emergency-Break-Glass');
    if (!auditLogged) {
      return {
        accessGranted: false,
        policyTriggered: 'ZTP-FAIL-CLOSED - Audit Failure',
        failureReason: 'Access denied: Audit log failure during emergency break-glass procedures.',
        requiredAction: 'BLOCK',
      };
    }
    return result;
  }

  // 3. User Directory Lookup (Fail-Closed Strategy)
  let user: any = null;
  let groups: string[] = [];

  try {
    const userList = await db.select().from(schema.users).where(eq(schema.users.username, cleanUsername));
    if (userList.length > 0) {
      user = userList[0];
      const userGroupRows = await db
        .select({
          groupName: schema.securityGroups.name,
        })
        .from(schema.userGroups)
        .innerJoin(schema.securityGroups, eq(schema.userGroups.groupId, schema.securityGroups.id))
        .where(eq(schema.userGroups.userId, user.id));
      groups = userGroupRows.map((g) => g.groupName);
    }
  } catch (err) {
    console.error('ZTA Directory lookup error:', err);
    // Dev seed mode fallback behind explicit environment flag
    if (process.env.SEED_MODE === 'true') {
      const mockMap: Record<string, string> = {
        globaladmin01: 'EHR-Cloud-Admins',
        doctor01: 'EHR-Doctors',
        nurse01: 'EHR-Nurses',
        recordsadmin01: 'EHR-Records-Admins',
        itsecurityadmin01: 'EHR-IT-Security',
        cloudadmin01: 'EHR-Cloud-Admins',
        vendor01: 'EHR-Vendors',
        auditor01: 'EHR-Auditors',
      };
      if (mockMap[cleanUsername]) {
        user = { id: `u-${cleanUsername}`, username: cleanUsername, status: 'Active' };
        groups = [mockMap[cleanUsername]];
      }
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

  // 5. Policy ZTP-02: Block High Sign-in Risk Signals
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

  // 6. Policy ZTP-03: Require Step-up MFA for Medium Sign-in Risk
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

  // 9. Independent Role-Based Access Control (Micro-Segmentation)

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
