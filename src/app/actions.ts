'use server';

import { getSimulatedSession, setSimulatedSession, resetSimulatedSession } from '../lib/session';
import { evaluateZtaAccess, SessionContext, ZtaEvaluationResult } from '../lib/zta-engine';
import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { sendMfaOtpEmail, getCachedDispatch } from '../lib/mfa-mailer';
import {
  getAllPatients,
  getPatientById,
  assignPatientToDoctor,
  updatePatientVitalsInMemory,
  addPatientAllergyInMemory,
  addPatientImmunizationInMemory,
  addPatientLabResultInMemory,
  updatePatientLabResultInMemory,
  deletePatientLabResultInMemory,
} from '../lib/patients-data';


// Update session state
export async function updateSessionAction(sessionData: Partial<SessionContext>) {
  await setSimulatedSession(sessionData);
  revalidatePath('/', 'layout');
}

// Reset session state
export async function resetSessionAction() {
  await resetSimulatedSession();
  revalidatePath('/', 'layout');
}

// Run ZTA evaluation check with all 8 signals
export async function checkZtaAccessAction(
  resource: 'patient-records' | 'admin-records' | 'audit-evidence',
  action: 'Read' | 'Write',
  contextOverride: {
    deviceCompliant?: boolean;
    targetPatientId?: string;
    sessionAgeSeconds?: number;
    isOffHours?: boolean;
    travelVelocityKmH?: number;
    isForeignLocation?: boolean;
    breakGlassJustification?: string;
  } = {}
): Promise<ZtaEvaluationResult> {
  const session = await getSimulatedSession();
  const sessionAgeSeconds = session.sessionStartedAt
    ? Math.floor((Date.now() - session.sessionStartedAt) / 1000)
    : 0;

  return await evaluateZtaAccess({
    username: session.username,
    resource,
    action,
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
    deviceCompliant: contextOverride.deviceCompliant !== undefined ? contextOverride.deviceCompliant : session.deviceCompliant,
    targetPatientId: contextOverride.targetPatientId,
    sessionAgeSeconds: contextOverride.sessionAgeSeconds !== undefined ? contextOverride.sessionAgeSeconds : sessionAgeSeconds,
    isOffHours: contextOverride.isOffHours,
    travelVelocityKmH: contextOverride.travelVelocityKmH,
    isForeignLocation: contextOverride.isForeignLocation,
    breakGlassJustification: contextOverride.breakGlassJustification,
  });
}

// Dedicated session trust verification action for continuous verification heartbeat (NO container RBAC)
export async function verifySessionTrustAction(): Promise<{
  valid: boolean;
  requiresReauth?: boolean;
  policyId?: string;
  trustScore?: number;
  sessionAgeSeconds?: number;
  failureReason?: string;
}> {
  const session = await getSimulatedSession();
  if (!session.isAuthenticated || !session.username) {
    return { valid: true, sessionAgeSeconds: 0 };
  }

  const sessionAgeSeconds = session.sessionStartedAt
    ? Math.floor((Date.now() - session.sessionStartedAt) / 1000)
    : 0;

  // 1. High Risk Sign-In check (ZTP-02)
  if (session.riskLevel === 'High') {
    return {
      valid: false,
      requiresReauth: true,
      policyId: 'ZTP-02',
      trustScore: 20,
      sessionAgeSeconds,
      failureReason: 'Continuous Trust Revocation (ZTP-02). Dynamic trust evaluation calculated a High risk level.',
    };
  }

  // 2. 90-Second Continuous Verification Re-Authentication Limit (ZTP-06)
  if (sessionAgeSeconds >= 90) {
    if (session.mfaCompleted) {
      await setSimulatedSession({ mfaCompleted: false });
    }
    return {
      valid: false,
      requiresReauth: true,
      policyId: 'ZTP-06',
      trustScore: 60,
      sessionAgeSeconds,
      failureReason: `Continuous Verification Timeout (ZTP-06). Session age (${sessionAgeSeconds}s) reached 90-second limit. Re-authentication required.`,
    };
  }

  return {
    valid: true,
    requiresReauth: false,
    trustScore: 100,
    sessionAgeSeconds,
  };
}

const inMemoryPrescriptions: any[] = [];

export async function getInMemoryPrescriptions(patientId: string) {
  return inMemoryPrescriptions.filter((r) => r.patientId === patientId);
}

// Create a prescription (Write on patient-records)
export async function addPrescriptionAction(
  patientId: string,
  data: {
    medication: string;
    strength: string;
    dosageForm: string;
    dose: string;
    frequency: string;
    route: string;
    quantity: string;
    refills: string;
    indication: string;
    specialInstructions: string;
  }
) {
  const session = await getSimulatedSession();
  
  // 1. ZTA Access Check
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'patient-records',
    action: 'Write',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return {
      success: false,
      error: `ZTA Access Denied: ${evaluation.failureReason}`,
    };
  }

  // 2. Insert Prescription Header
  const rxId = `RX-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const todayStr = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  const validUntilDate = new Date();
  validUntilDate.setFullYear(validUntilDate.getFullYear() + 1);
  const validUntilStr = validUntilDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const physicianName = session.username ? `@${session.username} (EHR-Doctors)` : 'Dr. Emily Carson, MD';

  const newRxRecord = {
    id: rxId,
    patientId,
    dateIssued: todayStr,
    validUntil: validUntilStr,
    issuingPhysician: physicianName,
    npiNumber: '1234567890 (Dummy)',
    clinicName: 'Hallmark Medical Center',
    clinicAddress: '100 North Medical Pkwy, Springfield, IL 62701',
    clinicPhone: '(217) 555-0900',
    clinicFax: '(217) 555-0901',
    dispensedBy: 'Springfield Central Pharmacy (Dummy)',
    pharmacist: 'Pharm. David Lee, RPh (Dummy)',
    pharmacyAddress: '85 Oak Street, Springfield, IL 62702',
    pharmacyPhone: '(217) 555-0770',
    dispenseDate: todayStr,
    patientAcknowledged: 0,
    physicianSignature: `${physicianName} [Electronic Signature on File]`,
    status: 'Active',
    items: [
      {
        id: `rxi-${Math.floor(1000 + Math.random() * 9000)}`,
        prescriptionId: rxId,
        medication: data.medication,
        strength: data.strength,
        dosageForm: data.dosageForm,
        dose: data.dose,
        frequency: data.frequency,
        route: data.route,
        quantity: data.quantity,
        refills: `${data.refills} refills authorized`,
        indication: data.indication,
        specialInstructions: data.specialInstructions,
      },
    ],
  };

  // Add to serverless memory cache immediately
  inMemoryPrescriptions.unshift(newRxRecord);

  try {
    await db.insert(schema.prescriptions).values({
      id: rxId,
      patientId,
      dateIssued: todayStr,
      validUntil: validUntilStr,
      issuingPhysician: physicianName,
      npiNumber: '1234567890 (Dummy)',
      clinicName: 'Hallmark Medical Center',
      clinicAddress: '100 North Medical Pkwy, Springfield, IL 62701',
      clinicPhone: '(217) 555-0900',
      clinicFax: '(217) 555-0901',
      dispensedBy: 'Springfield Central Pharmacy (Dummy)',
      pharmacist: 'Pharm. David Lee, RPh (Dummy)',
      pharmacyAddress: '85 Oak Street, Springfield, IL 62702',
      pharmacyPhone: '(217) 555-0770',
      dispenseDate: todayStr,
      patientAcknowledged: 0,
      physicianSignature: `${physicianName} [Electronic Signature on File]`,
      status: 'Active',
    });

    // 3. Insert Prescription Item
    const itemId = `rxi-${Math.floor(1000 + Math.random() * 9000)}`;
    await db.insert(schema.prescriptionItems).values({
      id: itemId,
      prescriptionId: rxId,
      medication: data.medication,
      strength: data.strength,
      dosageForm: data.dosageForm,
      dose: data.dose,
      frequency: data.frequency,
      route: data.route,
      quantity: data.quantity,
      refills: `${data.refills} refills authorized`,
      indication: data.indication,
      specialInstructions: data.specialInstructions,
    });
  } catch (dbErr: any) {
    if (dbErr?.digest === 'DYNAMIC_SERVER_USAGE' || dbErr?.message?.includes('Dynamic server usage')) throw dbErr;
    console.error('Prescription DB write warning (fallback simulated record):', dbErr);
  }

  revalidatePath('/portal/clinical');
  return { success: true, rxId };
}

// Update an existing prescription (Doctor write access)
export async function updatePrescriptionAction(
  rxId: string,
  data: {
    status?: string;
    medication?: string;
    strength?: string;
    dose?: string;
    frequency?: string;
    specialInstructions?: string;
  }
) {
  const session = await getSimulatedSession();
  
  // ZTA Access Check for Write on patient-records
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'patient-records',
    action: 'Write',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return {
      success: false,
      error: `ZTA Access Denied: ${evaluation.failureReason}`,
    };
  }

  // Update in-memory cache record
  const inMemIndex = inMemoryPrescriptions.findIndex((rx) => rx.id === rxId);
  if (inMemIndex !== -1) {
    if (data.status) inMemoryPrescriptions[inMemIndex].status = data.status;
    if (inMemoryPrescriptions[inMemIndex].items?.[0]) {
      const item = inMemoryPrescriptions[inMemIndex].items[0];
      if (data.medication) item.medication = data.medication;
      if (data.strength) item.strength = data.strength;
      if (data.dose) item.dose = data.dose;
      if (data.frequency) item.frequency = data.frequency;
      if (data.specialInstructions !== undefined) item.specialInstructions = data.specialInstructions;
    }
  }

  try {
    if (data.status) {
      await db.update(schema.prescriptions).set({ status: data.status }).where(eq(schema.prescriptions.id, rxId));
    }
  } catch (dbErr: any) {
    if (dbErr?.digest === 'DYNAMIC_SERVER_USAGE' || dbErr?.message?.includes('Dynamic server usage')) throw dbErr;
    console.warn('Prescription DB update warning (in-memory update applied):', dbErr);
  }

  revalidatePath('/portal/clinical');
  return { success: true };
}

// Delete a prescription (Doctor write access)
export async function deletePrescriptionAction(rxId: string) {
  const session = await getSimulatedSession();
  
  // ZTA Access Check for Write on patient-records
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'patient-records',
    action: 'Write',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return {
      success: false,
      error: `ZTA Access Denied: ${evaluation.failureReason}`,
    };
  }

  // Remove from in-memory cache
  const inMemIndex = inMemoryPrescriptions.findIndex((rx) => rx.id === rxId);
  if (inMemIndex !== -1) {
    inMemoryPrescriptions.splice(inMemIndex, 1);
  }

  try {
    await db.delete(schema.prescriptionItems).where(eq(schema.prescriptionItems.prescriptionId, rxId));
    await db.delete(schema.prescriptions).where(eq(schema.prescriptions.id, rxId));
  } catch (dbErr: any) {
    if (dbErr?.digest === 'DYNAMIC_SERVER_USAGE' || dbErr?.message?.includes('Dynamic server usage')) throw dbErr;
    console.warn('Prescription DB delete warning (in-memory deletion applied):', dbErr);
  }

  revalidatePath('/portal/clinical');
  return { success: true };
}

// Create an admin record (Write on admin-records)
export async function addAdminRecordAction(
  patientId: string,
  data: {
    recordType: 'appointment' | 'billing';
    title: string;
    details: string;
    amount?: number;
  }
) {
  const session = await getSimulatedSession();
  
  // ZTA Access Check
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'admin-records',
    action: 'Write',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return {
      success: false,
      error: `ZTA Access Denied: ${evaluation.failureReason}`,
    };
  }

  const recordId = `adm-${Math.floor(1000 + Math.random() * 9000)}`;
  const todayStr = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  try {
    await db.insert(schema.adminRecords).values({
      id: recordId,
      patientId,
      recordType: data.recordType,
      title: data.title,
      details: data.details,
      amount: data.amount,
      status: data.recordType === 'billing' ? 'Unpaid' : 'Scheduled',
      recordDate: todayStr,
    });
  } catch (dbErr: any) {
    if (dbErr?.digest === 'DYNAMIC_SERVER_USAGE' || dbErr?.message?.includes('Dynamic server usage')) throw dbErr;
    console.error('Admin record DB write warning (fallback simulated record):', dbErr);
  }

  revalidatePath('/portal/admin');
  return { success: true, recordId };
}

// Update system settings (like budget limit or TLS version)
export async function updateSystemSettingAction(key: string, value: string) {
  const session = await getSimulatedSession();
  
  // ZTA check: only cloudadmin01, globaladmin01, or emergency.admin can manage configuration settings
  const cleanUser = (session.username || '').replace(/^@+/, '').toLowerCase();
  const isCloudAdmin =
    cleanUser === 'globaladmin01' ||
    cleanUser === 'cloudadmin01' ||
    cleanUser === 'emergency.admin';
  if (!isCloudAdmin) {
    throw new Error('Unauthorized: Only Cloud Administrators can modify tenant settings.');
  }



  await db
    .insert(schema.systemSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.systemSettings.key, set: { value } });

  revalidatePath('/portal/baseline');
  revalidatePath('/');
  return { success: true };
}

// Login Action
export async function loginUserAction(username: string, password?: string, skipMfa: boolean = false) {
  const cleanUsername = (username || '').replace(/^@+/, '').trim().toLowerCase();

  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, cleanUsername),
    });

    if (user && password && user.password !== password) {
      throw new Error('Invalid password provided for this user account.');
    }
  } catch (err: any) {
    if (err.message?.includes('Invalid password')) throw err;
    console.warn('DB check skipped in loginUserAction:', err);
  }

  await setSimulatedSession({
    username: cleanUsername,
    isAuthenticated: true,
    mfaCompleted: skipMfa ? true : false,
    sessionStartedAt: Date.now(),
  });

  revalidatePath('/', 'layout');
  return { success: true, requiresMfa: !skipMfa };
}

function maskEmailAddress(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [user, domain] = parts;
  if (user.length <= 2) return `${user[0] || ''}•••@${domain}`;
  return `${user.slice(0, 2)}••••${user.slice(-1)}@${domain}`;
}

// Request & Dispatch Server-Side MFA OTP Email
export async function requestMfaOtpAction(params?: { username?: string; overrideEmail?: string }) {
  const session = await getSimulatedSession();
  const targetUsername = (params?.username || session.username || 'doctor01').replace(/^@+/, '').trim().toLowerCase();

  let recipientEmail = params?.overrideEmail?.trim();

  if (!recipientEmail) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.username, targetUsername),
      });
      if (user?.email && user.email.trim().length > 0) {
        recipientEmail = user.email.trim();
      }
    } catch (err) {
      console.warn('Could not query user email from DB:', err);
    }
  }

  if (!recipientEmail) {
    recipientEmail = `${targetUsername}@hallmarkmedical.com`;
  }

  // Generate cryptographically random 6-digit OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  const nowStr = new Date().toISOString();

  // Save OTP record to database
  try {
    await db.insert(schema.mfaOtps).values({
      id: `otp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      username: targetUsername,
      email: recipientEmail,
      code: otpCode,
      expiresAt,
      attempts: 0,
      used: 0,
      dispatchStatus: 'SENT',
      ipAddress: session.ipAddress || '127.0.0.1',
      createdAt: nowStr,
    });
  } catch (err) {
    console.warn('Could not insert OTP to DB table, proceeding with email dispatch:', err);
  }

  // Dispatch Email directly via server engine
  const dispatch = await sendMfaOtpEmail({
    username: targetUsername,
    toEmail: recipientEmail,
    code: otpCode,
    ipAddress: session.ipAddress,
    location: session.location,
    riskLevel: session.riskLevel,
  });

  return {
    success: true,
    maskedEmail: maskEmailAddress(recipientEmail),
    rawEmail: recipientEmail,
    code: otpCode,
    mode: dispatch.mode,
    message: dispatch.message,
    expiresInSeconds: 300,
  };
}

// Verify MFA Code Action (checks database OTPs, server memory, and fallback master code)
export async function verifyMfaCodeAction(code: string, usernameParam?: string) {
  const cleanCode = (code || '').replace(/\s+/g, '').trim();

  if (!cleanCode) {
    return { success: false, error: 'Please enter your 6-digit MFA verification code.' };
  }

  const session = await getSimulatedSession();
  const targetUsername = (usernameParam || session.username || '').replace(/^@+/, '').trim().toLowerCase();

  // 1. Check if matches active valid OTP in database
  let validDbOtp = false;
  try {
    const activeOtps = await db.select().from(schema.mfaOtps)
      .where(
        and(
          eq(schema.mfaOtps.code, cleanCode),
          eq(schema.mfaOtps.used, 0),
          gte(schema.mfaOtps.expiresAt, Date.now())
        )
      )
      .orderBy(desc(schema.mfaOtps.expiresAt))
      .limit(1);

    if (activeOtps && activeOtps.length > 0) {
      validDbOtp = true;
      // Mark as used
      await db.update(schema.mfaOtps)
        .set({ used: 1 })
        .where(eq(schema.mfaOtps.id, activeOtps[0].id));
    }
  } catch (err) {
    console.warn('DB OTP lookup error:', err);
  }

  // 2. Check cached in-memory dispatch or emergency demo codes (123456)
  const cached = targetUsername ? getCachedDispatch(targetUsername) : undefined;
  const isCachedMatch = cached && cached.code === cleanCode;
  const isDemoMasterCode = cleanCode === '123456' || cleanCode.toLowerCase() === 'mfa' || cleanCode.toLowerCase() === 'verify';

  if (validDbOtp || isCachedMatch || isDemoMasterCode) {
    await setSimulatedSession({
      mfaCompleted: true,
      sessionStartedAt: Date.now(),
    });
    revalidatePath('/', 'layout');
    return { success: true };
  }

  return {
    success: false,
    error: 'Invalid or expired MFA passcode. Please enter the latest 6-digit code sent to your email or use test code 123456.',
  };
}

// Get last dispatched OTP for live UI inspection in demo/simulation
export async function getLastDispatchedOtpAction(username?: string) {
  const session = await getSimulatedSession();
  const targetUsername = (username || session.username || 'doctor01').replace(/^@+/, '').trim().toLowerCase();
  const cached = getCachedDispatch(targetUsername);
  if (cached) {
    return {
      ...cached,
      maskedRecipient: maskEmailAddress(cached.recipient),
    };
  }

  try {
    const lastOtp = await db.select().from(schema.mfaOtps)
      .where(eq(schema.mfaOtps.username, targetUsername))
      .orderBy(desc(schema.mfaOtps.expiresAt))
      .limit(1);

    if (lastOtp && lastOtp.length > 0) {
      return {
        success: true,
        code: lastOtp[0].code,
        recipient: lastOtp[0].email,
        maskedRecipient: maskEmailAddress(lastOtp[0].email),
        mode: 'SERVER_STREAM' as const,
        message: `Dispatched to ${lastOtp[0].email}`,
        timestamp: lastOtp[0].createdAt,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch last OTP:', err);
  }

  return { success: false };
}


// Log out action
export async function logoutUserAction() {
  await resetSimulatedSession();
  revalidatePath('/', 'layout');
}


// Super Admin: Create New User
export async function createUserAction(data: {
  username: string;
  password: string;
  displayName: string;
  description: string;
  projectMeaning: string;
  groupId: string;
  avatarUrl?: string;
}) {
  try {
    const session = await getSimulatedSession();
    const isSuperAdmin =
      session.username === 'cloudadmin01' ||
      session.username === 'itsecurityadmin01' ||
      session.username === 'emergency.admin';

    if (!isSuperAdmin) {
      return {
        success: false,
        error: `Unauthorized: User '@${session.username || 'guest'}' is not a Super Administrator. Only cloudadmin01, itsecurityadmin01, or emergency.admin can create directory users.`,
      };
    }

    const cleanUsername = data.username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    if (!cleanUsername) {
      return { success: false, error: 'Username cannot be empty or contain invalid characters.' };
    }

    // Check if username already exists in DB
    try {
      const existing = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.username, cleanUsername),
      });
      if (existing) {
        return {
          success: false,
          error: `Username '@${cleanUsername}' is already registered in the Entra ID directory. Please choose a different username.`,

        };
      }
    } catch (err) {
      console.warn('DB check warning during user creation:', err);
    }

    const userId = `u-${cleanUsername}-${Date.now().toString().slice(-4)}`;
    const avatar = data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`;

    // Insert user into DB safely
    try {
      await db.insert(schema.users).values({
        id: userId,
        username: cleanUsername,
        password: data.password || 'Password2026!',
        displayName: data.displayName,
        description: data.description || cleanUsername,
        projectMeaning: data.projectMeaning || 'Custom directory user',
        avatarUrl: avatar,
        status: 'Active',
      });

      if (data.groupId) {
        try {
          await db.insert(schema.userGroups).values({
            userId: userId,
            groupId: data.groupId,
          });
        } catch (groupErr) {
          console.warn('User group mapping warning:', groupErr);
        }
      }
    } catch (dbErr: any) {
      console.error('Failed to insert user into DB:', dbErr);
      return {
        success: false,
        error: `Database error creating user: ${dbErr.message || 'Failed to save user record'}`,
      };
    }

    revalidatePath('/portal/login');
    revalidatePath('/');
    return { success: true, userId };
  } catch (err: any) {
    console.error('Error in createUserAction:', err);
    return { success: false, error: err.message || 'An unexpected error occurred while creating user.' };
  }
}

// Super Admin: Edit User Details
export async function updateUserAction(
  userId: string,
  data: {
    displayName?: string;
    password?: string;
    projectMeaning?: string;
    groupId?: string;
    avatarUrl?: string;
    status?: 'Active' | 'Banned';
  }
) {
  try {
    const session = await getSimulatedSession();
    const isSuperAdmin =
      session.username === 'cloudadmin01' ||
      session.username === 'itsecurityadmin01' ||
      session.username === 'emergency.admin';

    const userToUpdate = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!userToUpdate) return { success: false, error: 'User not found.' };

    const isSelf = session.username === userToUpdate.username;
    if (!isSuperAdmin && !isSelf) {
      return { success: false, error: 'Unauthorized to modify this user account.' };
    }

    const updateFields: any = {};
    if (data.displayName) updateFields.displayName = data.displayName;
    if (data.password && isSuperAdmin) updateFields.password = data.password;
    if (data.projectMeaning && isSuperAdmin) updateFields.projectMeaning = data.projectMeaning;
    if (data.avatarUrl) updateFields.avatarUrl = data.avatarUrl;
    if (data.status && isSuperAdmin) updateFields.status = data.status;

    if (Object.keys(updateFields).length > 0) {
      await db.update(schema.users).set(updateFields).where(eq(schema.users.id, userId));
    }

    if (data.groupId && isSuperAdmin) {
      try {
        await db.delete(schema.userGroups).where(eq(schema.userGroups.userId, userId));
        await db.insert(schema.userGroups).values({
          userId: userId,
          groupId: data.groupId,
        });
      } catch (groupErr) {
        console.warn('Group update warning:', groupErr);
      }
    }

    revalidatePath('/portal/login');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user profile.' };
  }
}

// Super Admin: Toggle Ban User Status
export async function toggleBanUserAction(userIdentifier: string) {
  try {
    const session = await getSimulatedSession();
    const cleanSessionUser = (session.username || '').replace(/^@+/, '').toLowerCase();
    const isSuperAdmin =
      cleanSessionUser === 'globaladmin01' ||
      cleanSessionUser === 'cloudadmin01' ||
      cleanSessionUser === 'itsecurityadmin01' ||
      cleanSessionUser === 'officer@hmc.com' ||
      cleanSessionUser === 'emergency.admin';

    if (!isSuperAdmin) {
      return { success: false, error: 'Unauthorized: Only Super Administrators can ban or unban accounts.' };
    }

    const cleanTarget = (userIdentifier || '').replace(/^@+/, '').toLowerCase();
    const user = await db.query.users.findFirst({
      where: (u, { eq, or }) => or(eq(u.id, userIdentifier), eq(u.username, cleanTarget)),
    });

    if (!user) return { success: false, error: 'User not found.' };
    if (user.username === 'emergency.admin') {
      return { success: false, error: 'Cannot ban Emergency Break-glass Super Admin account!' };
    }

    const newStatus = user.status === 'Active' ? 'Banned' : 'Active';
    await db.update(schema.users).set({ status: newStatus }).where(eq(schema.users.id, user.id));

    revalidatePath('/portal/login');
    revalidatePath('/');
    return { success: true, newStatus };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle ban status.' };
  }
}


// Super Admin: Delete User
export async function deleteUserAction(userId: string) {
  try {
    const session = await getSimulatedSession();
    const isSuperAdmin =
      session.username === 'cloudadmin01' ||
      session.username === 'itsecurityadmin01' ||
      session.username === 'emergency.admin';

    if (!isSuperAdmin) {
      return { success: false, error: 'Unauthorized: Only Super Administrators can delete user accounts.' };
    }

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!user) return { success: false, error: 'User not found.' };
    if (user.username === 'emergency.admin') {
      return { success: false, error: 'Cannot delete Emergency Break-glass Super Admin account!' };
    }

    await db.delete(schema.userGroups).where(eq(schema.userGroups.userId, userId));
    await db.delete(schema.users).where(eq(schema.users.id, userId));

    revalidatePath('/portal/login');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete user.' };
  }
}

// Action: Search all patients in the database
export async function searchPatientsAction(query: string) {
  const allPatients = getAllPatients();
  const cleanQuery = (query || '').trim().toLowerCase();
  if (!cleanQuery) return allPatients;

  return allPatients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(cleanQuery) ||
      p.id.toLowerCase().includes(cleanQuery) ||
      p.dob.includes(cleanQuery)
  );
}

// Action: Records Admins & Cloud Admins assign a patient to a doctor
export async function assignPatientDoctorAction(patientId: string, doctorUsername: string) {
  const session = await getSimulatedSession();
  const cleanUser = (session.username || '').replace(/^@+/, '').toLowerCase();
  
  // ZTA Check: Only Records-Admins or Cloud-Admins can assign patients to doctors
  const isAuthorized =
    cleanUser === 'recordsadmin01' ||
    cleanUser === 'globaladmin01' ||
    cleanUser === 'cloudadmin01' ||
    cleanUser === 'emergency.admin';

  if (!isAuthorized) {
    return {
      success: false,
      error: 'ZTA Authorization Denied: Only Records Administrators or Cloud Admins can assign patient panels.',
    };
  }

  const success = assignPatientToDoctor(patientId, doctorUsername);
  revalidatePath('/portal/clinical');
  revalidatePath('/portal/admin');
  revalidatePath('/portal/patient');
  return { success };
}

// Doctor Action: Update Patient Vitals
export async function updatePatientVitalsAction(
  patientId: string,
  vitalsData: {
    bloodPressure: string;
    heartRate: number;
    temperature: string;
    oxygenSaturation: number;
    height: string;
    weight: string;
    bmi: string;
  }
) {
  const session = await getSimulatedSession();

  // ZTA Access Check for Write on patient-records
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'patient-records',
    action: 'Write',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return {
      success: false,
      error: `ZTA Access Denied: ${evaluation.failureReason}`,
    };
  }

  updatePatientVitalsInMemory(patientId, vitalsData);
  revalidatePath('/portal/clinical');
  revalidatePath('/portal/patient');
  return { success: true };
}

// Doctor Action: Add Patient Allergy
export async function addPatientAllergyAction(
  patientId: string,
  allergyData: { allergen: string; reaction: string }
) {
  const session = await getSimulatedSession();

  // ZTA Access Check for Write on patient-records
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'patient-records',
    action: 'Write',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return {
      success: false,
      error: `ZTA Access Denied: ${evaluation.failureReason}`,
    };
  }

  addPatientAllergyInMemory(patientId, allergyData);
  revalidatePath('/portal/clinical');
  revalidatePath('/portal/patient');
  return { success: true };
}

// Doctor Action: Add Patient Immunization
export async function addPatientImmunizationAction(
  patientId: string,
  immunizationData: { vaccine: string; dateAdministered: string }
) {
  const session = await getSimulatedSession();

  // ZTA Access Check for Write on patient-records
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'patient-records',
    action: 'Write',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return {
      success: false,
      error: `ZTA Access Denied: ${evaluation.failureReason}`,
    };
  }

  addPatientImmunizationInMemory(patientId, immunizationData);
  revalidatePath('/portal/clinical');
  revalidatePath('/portal/patient');
  return { success: true };
}

// Doctor Action: Add Laboratory Diagnostic Report
export async function addPatientLabResultAction(
  patientId: string,
  labData: {
    panelName: string;
    testName: string;
    resultValue: string;
    referenceRange: string;
    flag: string;
    comments: string;
    labFacility?: string;
  }
) {
  const session = await getSimulatedSession();

  // ZTA Access Check for Write on patient-records
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'patient-records',
    action: 'Write',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return {
      success: false,
      error: `ZTA Access Denied: ${evaluation.failureReason}`,
    };
  }

  addPatientLabResultInMemory(patientId, labData);
  revalidatePath('/portal/clinical');
  revalidatePath('/portal/patient');
  return { success: true };
}

// Doctor Action: Update Laboratory Diagnostic Report Item
export async function updatePatientLabResultAction(
  patientId: string,
  labValueId: string,
  updatedData: {
    panelName?: string;
    testName?: string;
    resultValue?: string;
    referenceRange?: string;
    flag?: string;
    comments?: string;
  }
) {
  const session = await getSimulatedSession();

  // ZTA Access Check for Write on patient-records
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'patient-records',
    action: 'Write',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return {
      success: false,
      error: `ZTA Access Denied: ${evaluation.failureReason}`,
    };
  }

  updatePatientLabResultInMemory(patientId, labValueId, updatedData);
  revalidatePath('/portal/clinical');
  revalidatePath('/portal/patient');
  return { success: true };
}

// Doctor Action: Delete Laboratory Diagnostic Report Item
export async function deletePatientLabResultAction(patientId: string, labValueId: string) {
  const session = await getSimulatedSession();

  // ZTA Access Check for Write on patient-records
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'patient-records',
    action: 'Write',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return {
      success: false,
      error: `ZTA Access Denied: ${evaluation.failureReason}`,
    };
  }

  deletePatientLabResultInMemory(patientId, labValueId);
  revalidatePath('/portal/clinical');
  revalidatePath('/portal/patient');
  return { success: true };
}


