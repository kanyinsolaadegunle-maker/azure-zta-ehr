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

// Run ZTA evaluation check
export async function checkZtaAccessAction(
  resource: 'patient-records' | 'admin-records' | 'audit-evidence',
  action: 'Read' | 'Write'
): Promise<ZtaEvaluationResult> {
  const session = await getSimulatedSession();
  return await evaluateZtaAccess(session.username, resource, action, session);
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
  const evaluation = await evaluateZtaAccess(session.username, 'patient-records', 'Write', session);
  if (!evaluation.accessGranted) {
    throw new Error(`ZTA Access Denied: ${evaluation.failureReason}`);
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
  const evaluation = await evaluateZtaAccess(session.username, 'admin-records', 'Write', session);
  if (!evaluation.accessGranted) {
    throw new Error(`ZTA Access Denied: ${evaluation.failureReason}`);
  }

  const recordId = `adm-${Math.floor(1000 + Math.random() * 9000)}`;
  const todayStr = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

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

  revalidatePath('/portal/admin');
  return { success: true, recordId };
}

// Update system settings (like budget limit or TLS version)
export async function updateSystemSettingAction(key: string, value: string) {
  const session = await getSimulatedSession();
  
  // ZTA check: only cloudadmin01 can manage Azure configuration settings
  const isCloudAdmin = session.username === 'cloudadmin01' || session.username === 'emergency.admin';
  if (!isCloudAdmin) {
    throw new Error('Unauthorized: Only Cloud Administrators (cloudadmin01) can modify Azure tenant settings.');
  }

  await db
    .insert(schema.systemSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.systemSettings.key, set: { value } });

  revalidatePath('/portal/azure');
  revalidatePath('/');
  return { success: true };
}

// Login Action
export async function loginUserAction(username: string, password?: string) {
  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, username.toLowerCase()),
    });

    if (user && password && user.password !== password) {
      throw new Error('Invalid password provided for this user account.');
    }
  } catch (err: any) {
    if (err.message.includes('Invalid password')) throw err;
    console.warn('DB check skipped in loginUserAction:', err);
  }

  await setSimulatedSession({
    username: username.toLowerCase(),
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
  const session = await getSimulatedSession();
  const isSuperAdmin =
    session.username === 'cloudadmin01' ||
    session.username === 'itsecurityadmin01' ||
    session.username === 'emergency.admin';

  if (!isSuperAdmin) {
    throw new Error('Unauthorized: Only Super Administrators can create new Enter ID users.');

  }

  const userId = `u-${data.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;

  await db.insert(schema.users).values({
    id: userId,
    username: data.username.toLowerCase(),
    password: data.password || 'Password2026!',
    displayName: data.displayName,
    description: data.description || data.username,
    projectMeaning: data.projectMeaning || 'Custom directory user',
    avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
    status: 'Active',
  });

  if (data.groupId) {
    await db.insert(schema.userGroups).values({
      userId: userId,
      groupId: data.groupId,
    });
  }

  revalidatePath('/portal/rbac');
  revalidatePath('/portal/login');
  revalidatePath('/');
  return { success: true, userId };
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
  const session = await getSimulatedSession();
  const isSuperAdmin =
    session.username === 'cloudadmin01' ||
    session.username === 'itsecurityadmin01' ||
    session.username === 'emergency.admin';

  const userToUpdate = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (!userToUpdate) throw new Error('User not found');

  // Allow users to update their own avatar or display name, but require super admin for group/status/password changes
  const isSelf = session.username === userToUpdate.username;
  if (!isSuperAdmin && !isSelf) {
    throw new Error('Unauthorized to modify this user account.');
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
    await db.delete(schema.userGroups).where(eq(schema.userGroups.userId, userId));
    await db.insert(schema.userGroups).values({
      userId: userId,
      groupId: data.groupId,
    });
  }

  revalidatePath('/portal/rbac');
  revalidatePath('/portal/login');
  revalidatePath('/');
  return { success: true };
}

// Super Admin: Toggle Ban / Unban Status
export async function toggleBanUserAction(userId: string) {
  const session = await getSimulatedSession();
  const isSuperAdmin =
    session.username === 'cloudadmin01' ||
    session.username === 'itsecurityadmin01' ||
    session.username === 'emergency.admin';

  if (!isSuperAdmin) {
    throw new Error('Unauthorized: Only Super Administrators can ban or unban accounts.');
  }

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (!user) throw new Error('User not found');
  if (user.username === 'emergency.admin') {
    throw new Error('Cannot ban Emergency Break-glass Super Admin account!');
  }

  const newStatus = user.status === 'Active' ? 'Banned' : 'Active';
  await db.update(schema.users).set({ status: newStatus }).where(eq(schema.users.id, userId));

  revalidatePath('/portal/rbac');
  revalidatePath('/portal/login');
  revalidatePath('/');
  return { success: true, newStatus };
}

// Super Admin: Delete User
export async function deleteUserAction(userId: string) {
  const session = await getSimulatedSession();
  const isSuperAdmin =
    session.username === 'cloudadmin01' ||
    session.username === 'itsecurityadmin01' ||
    session.username === 'emergency.admin';

  if (!isSuperAdmin) {
    throw new Error('Unauthorized: Only Super Administrators can delete user accounts.');
  }

  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (!user) throw new Error('User not found');
  if (user.username === 'emergency.admin') {
    throw new Error('Cannot delete Emergency Break-glass Super Admin account!');
  }

  await db.delete(schema.userGroups).where(eq(schema.userGroups.userId, userId));
  await db.delete(schema.users).where(eq(schema.users.id, userId));


  revalidatePath('/portal/rbac');
  revalidatePath('/portal/login');
  revalidatePath('/');
  return { success: true };
}

