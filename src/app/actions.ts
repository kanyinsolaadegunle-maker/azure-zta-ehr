'use server';

import { getSimulatedSession, setSimulatedSession, resetSimulatedSession } from '../lib/session';
import { evaluateZtaAccess, SessionContext, ZtaEvaluationResult } from '../lib/zta-engine';
import { db } from '../db/index';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';


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
export async function verifySessionTrustAction(): Promise<{ valid: boolean; policyId?: string; trustScore?: number }> {
  const session = await getSimulatedSession();
  if (!session.isAuthenticated || !session.username) {
    return { valid: true };
  }

  const sessionAgeSeconds = session.sessionStartedAt
    ? Math.floor((Date.now() - session.sessionStartedAt) / 1000)
    : 0;

  const decision = await evaluateZtaAccess({
    username: session.username,
    resource: 'audit-evidence',
    action: 'Read',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
    deviceCompliant: session.deviceCompliant,
    sessionAgeSeconds,
    skipAuditLog: true,
  });

  const isRevoked = decision.policyId === 'ZTP-02' || (decision.policyId === 'ZTP-05' && decision.failureReason.includes('suspended'));
  return {
    valid: !isRevoked,
    policyId: decision.policyId,
    trustScore: decision.trustScore,
  };
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

  try {
    await db.insert(schema.prescriptions).values({
      id: rxId,
      patientId,
      dateIssued: todayStr,
      validUntil: validUntilStr,
      issuingPhysician: 'Dr. Emily Carson, MD',
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
      physicianSignature: 'Dr. Emily Carson, MD [Electronic Signature on File]',
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
export async function loginUserAction(username: string, password?: string) {
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
    mfaCompleted: true,
  });

  revalidatePath('/', 'layout');
  return { success: true };
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


