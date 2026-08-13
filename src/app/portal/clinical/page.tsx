import { db } from '../../../db/index';
import * as schema from '../../../db/schema';
import { getSimulatedSession } from '../../../lib/session';
import { evaluateZtaAccess } from '../../../lib/zta-engine';
import { eq } from 'drizzle-orm';
import { AccessDenied } from '../../../components/access-denied';
import { getInMemoryPrescriptions } from '../../actions';
import { getAllPatients } from '../../../lib/patients-data';
import { ClinicalClient } from './clinical-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ClinicalPortal() {
  const session = await getSimulatedSession();

  // 1. ZTA Access Check for patient-records container
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'patient-records',
    action: 'Read',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
  });

  if (!evaluation.accessGranted) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <AccessDenied
          resource="patient-records"
          policyTriggered={evaluation.policyTriggered}
          failureReason={evaluation.failureReason}
          requiredAction={evaluation.requiredAction}
        />
      </div>
    );
  }

  let isDoctor = false;
  const cleanUser = (session.username || '').replace(/^@+/, '').toLowerCase();

  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.username, session.username),
      with: {
        userGroups: {
          with: {
            group: true,
          },
        },
      },
    });

    const groups = user?.userGroups.map((ug) => ug.group.name) || [];
    isDoctor =
      groups.includes('EHR-Doctors') ||
      groups.includes('EHR-Cloud-Admins') ||
      cleanUser === 'doctor01' ||
      cleanUser === 'doctor02' ||
      cleanUser === 'doctor03' ||
      cleanUser === 'emergency.admin';
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) throw err;
    isDoctor =
      cleanUser === 'doctor01' ||
      cleanUser === 'doctor02' ||
      cleanUser === 'doctor03' ||
      cleanUser === 'globaladmin01' ||
      cleanUser === 'emergency.admin';
  }

  const roleType = isDoctor ? 'Storage Blob Data Contributor (Read & Write)' : 'Storage Blob Data Reader (Read-Only)';
  const patients = getAllPatients();
  const inMemoryRxList = await getInMemoryPrescriptions('PR-2024-00142');

  return (
    <ClinicalClient
      patients={patients}
      currentUsername={session.username}
      isDoctor={isDoctor}
      roleType={roleType}
      inMemoryRxList={inMemoryRxList}
    />
  );
}
