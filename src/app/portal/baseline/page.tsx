import { db } from '../../../db/index';
import * as schema from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getSimulatedSession } from '../../../lib/session';
import { evaluateZtaAccess } from '../../../lib/zta-engine';
import { AzureConfigForm } from '../../../components/azure-config-form';
import { AzureBlobManager } from '../../../components/azure-blob-manager';
import { AccessDenied } from '../../../components/access-denied';
import { SignOutButton } from '../../../components/signout-button';

import {
  Settings,
  ShieldCheck,
  Users,
  HardDrive,
  Activity,
  AlertTriangle,
  Lock,
  Compass,
  CheckCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const caPoliciesList = [
  {
    id: 'ZTP-01 (CA001)',
    name: 'Require MFA for EHR Users',
    target: 'EHR-Doctors, EHR-Nurses, EHR-Records-Admins, EHR-Auditors, EHR-IT-Security, EHR-Cloud-Admins, EHR-Vendors',
    condition: 'All cloud apps & EHR system container access',
    grant: 'Require multi-factor authentication',
    exclude: 'emergency.admin',
  },
  {
    id: 'ZTP-02 (CA002)',
    name: 'Block High Risk Sign-ins',
    target: 'All EHR user groups',
    condition: 'Sign-in risk: High (Trust Score < 50/100)',
    grant: 'Block Access completely',
    exclude: 'emergency.admin',
  },
  {
    id: 'ZTP-03 (CA003)',
    name: 'Require MFA for Medium Risk Sign-ins',
    target: 'All EHR user groups',
    condition: 'Sign-in risk: Medium (Trust Score 50-79/100)',
    grant: 'Require multi-factor authentication (MFA)',
    exclude: 'emergency.admin',
  },
  {
    id: 'ZTP-04 (CA004)',
    name: 'Require MFA for Admin Roles',
    target: 'cloudadmin01, itsecurityadmin01, officer@hmc.com',
    condition: 'Access to All system admin containers & baseline settings',
    grant: 'Require multi-factor authentication (MFA)',
    exclude: 'emergency.admin',
  },
];

export default async function BaselineControlPlanePage() {
  const session = await getSimulatedSession();
  const sessionAgeSeconds = session.sessionStartedAt
    ? Math.floor((Date.now() - session.sessionStartedAt) / 1000)
    : 0;

  // ZTA Access Check for baseline control plane
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'admin-records',
    action: 'Read',
    riskLevel: session.riskLevel,
    location: session.location,
    ipAddress: session.ipAddress,
    mfaCompleted: session.mfaCompleted,
    sessionAgeSeconds,
  });

  if (!evaluation.accessGranted) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <AccessDenied
          resource="Baseline Architecture Control Plane"
          policyTriggered={evaluation.policyTriggered}
          failureReason={evaluation.failureReason}
          requiredAction={evaluation.requiredAction}
        />
      </div>
    );
  }

  let userGroups: string[] = [];
  let userStatus = 'Active';

  const cleanUsername = (session.username || '').replace(/^@+/, '').toLowerCase();

  if (cleanUsername) {
    try {
      const userRows = await db.select().from(schema.users).where(eq(schema.users.username, cleanUsername));
      if (userRows && userRows.length > 0) {
        const u = userRows[0];
        userStatus = u.status;
        const ugRows = await db
          .select({ groupName: schema.securityGroups.name })
          .from(schema.userGroups)
          .innerJoin(schema.securityGroups, eq(schema.userGroups.groupId, schema.securityGroups.id))
          .where(eq(schema.userGroups.userId, u.id));
        userGroups = ugRows.map((r) => r.groupName);
      }
    } catch (e) {
      // Fallback
    }

    if (userGroups.length === 0) {
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
        userGroups = [mockMap[cleanUsername]];
      }
    }
  }

  const isSuperAdmin =
    cleanUsername === 'globaladmin01' ||
    cleanUsername === 'cloudadmin01' ||
    cleanUsername === 'itsecurityadmin01' ||
    cleanUsername === 'officer@hmc.com' ||
    userGroups.includes('EHR-Cloud-Admins') ||
    userGroups.includes('EHR-IT-Security');

  if (!session.username || !isSuperAdmin) {
    return (
      <AccessDenied
        resource="Baseline Environment Configuration Control Plane"
        policyTriggered="ZTP-04 - Privileged Account Scope"
        failureReason="Access Restricted: Only Cloud Super Administrators and Security Officers can access baseline control settings."
        requiredAction="BLOCK"
      />
    );
  }

  const dbSettings = await db.select().from(schema.systemSettings);
  const settingsMap = dbSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-mono font-bold">
            <Settings className="w-3.5 h-3.5" />
            <span>BASELINE CONTROL PLANE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Baseline Environment Configuration
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Configure system parameters, tenant definitions, container storage isolation rules, and baseline policy mappings.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <SignOutButton />
        </div>
      </div>

      {/* Baseline Policy Mapping Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Baseline Policy Rules</h2>
              <p className="text-xs text-slate-400">Mapped against commercial Entra ID baseline standards</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold rounded-full">
            4 Active Policies
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caPoliciesList.map((policy) => (
            <div
              key={policy.id}
              className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  {policy.id}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ENFORCED
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-200">{policy.name}</h3>
              <div className="space-y-1 text-xs text-slate-400 font-mono">
                <div><span className="text-slate-500">Target:</span> {policy.target}</div>
                <div><span className="text-slate-500">Condition:</span> {policy.condition}</div>
                <div><span className="text-slate-500">Grant:</span> {policy.grant}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Settings & Blob Container Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AzureConfigForm
          initialBudgetLimit={settingsMap['budget_threshold'] || '5000'}
          initialBudgetSpent={settingsMap['current_spend'] || '1240.50'}
        />
        <AzureBlobManager
          storageAccount="sthallmarkehrprod01"
          resourceGroup="rg-hallmark-ehr-prod"
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </div>
  );
}
