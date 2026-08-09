'use server';

import { getSimulatedSession, setSimulatedSession, resetSimulatedSession } from '../lib/session';
import { evaluateZtaAccess, SessionContext, ZtaEvaluationResult } from '../lib/zta-engine';
import { db } from '../db/index';
import * as schema from '../db/schema';
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
