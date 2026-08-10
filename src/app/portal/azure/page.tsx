import { db } from '../../../db/index';
import * as schema from '../../../db/schema';
import { getSimulatedSession } from '../../../lib/session';
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
    id: 'CA001',
    name: 'Require MFA for EHR Users',
    target: 'EHR-Doctors, EHR-Nurses, EHR-Records-Admins, EHR-Auditors, EHR-IT-Security, EHR-Cloud-Admins, EHR-Vendors',
    condition: 'All cloud apps / Microsoft Azure Management access',
    grant: 'Require multi-factor authentication',
    exclude: 'emergency.admin',
  },
  {
    id: 'CA002',
    name: 'Block High Risk Sign-ins',
    target: 'All EHR user groups',
    condition: 'Sign-in risk: High detected by Entra ID Identity Protection P2',
    grant: 'Block Access completely',
    exclude: 'emergency.admin',
  },
  {
    id: 'CA003',
    name: 'Require MFA for Medium Risk Sign-ins',
    target: 'All EHR user groups',
    condition: 'Sign-in risk: Medium detected by Entra ID Identity Protection P2',
    grant: 'Require multi-factor authentication (MFA)',
    exclude: 'emergency.admin',
  },
  {
    id: 'CA004',
    name: 'Require MFA for Admin Roles',
    target: 'cloudadmin01, itsecurityadmin01 (or Directory admin roles)',
    condition: 'Access to All cloud apps & Azure management',
    grant: 'Require multi-factor authentication (MFA)',
    exclude: 'emergency.admin',
  },
];

export default async function AzurePortal() {
  const session = await getSimulatedSession();

  if (!session.username || !session.isAuthenticated) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <AccessDenied
          resource="azure-control-plane"
          policyTriggered="Identity Governance - Auth Required"
          failureReason="Authentication required. Please sign in with your credentials on the landing page to access Azure Configuration & Control Plane."
          requiredAction="BLOCK"
        />
      </div>
    );
  }

  const isSuperAdmin =
    session.username === 'cloudadmin01' ||
    session.username === 'itsecurityadmin01' ||
    session.username === 'emergency.admin';

  if (!isSuperAdmin) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <AccessDenied
          resource="azure-control-plane"
          policyTriggered="Azure RBAC Role Control"
          failureReason="Unauthorized. Accessing Azure Control Plane & Cloud Storage configurations requires Super Admin privileges (cloudadmin01, itsecurityadmin01, or emergency.admin)."
          requiredAction="BLOCK"
        />
      </div>
    );
  }

  let usersWithGroups: any[] = [];
  let settingsMap = new Map<string, string>();


  const budgetLimit = settingsMap.get('budget_threshold') || '10.00';
  const budgetSpentStr = settingsMap.get('budget_spent') || '1.45';
  const budgetSpent = parseFloat(budgetSpentStr);

  const storageAccount = settingsMap.get('storage_account') || 'hallmarkztestorage';
  const resourceGroup = settingsMap.get('resource_group') || 'rg-hallmark-ehr-zta';

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800/40">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-bold text-white">Azure Control Plane Configuration</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Microsoft Azure portal directory configurations, Storage Blob Integration, and ZTA security settings
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Licence: Entra ID P2 Active

            </span>
          </div>
          <div className="w-full sm:w-auto min-w-[140px]">
            <SignOutButton />
          </div>
        </div>
      </div>


      {/* Azure Blob Container Integration Suite */}
      <AzureBlobManager
        storageAccount={storageAccount}
        resourceGroup={resourceGroup}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entra ID users & Group Assignments (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Microsoft Entra ID Tenant */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm text-slate-200">Microsoft Entra ID (Users & Group RBAC)</h3>
            </div>

            <div className="border border-slate-850 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950">
                  <tr className="text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-850">
                    <th className="p-3">Display Name / Username</th>
                    <th className="p-3">Project Meaning / Description</th>
                    <th className="p-3">Assigned Security Group</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {usersWithGroups.map((u) => {
                    const groupName = u.userGroups[0]?.group.name || 'None (Bypasses CA)';
                    return (
                      <tr key={u.id} className="hover:bg-slate-850/20">
                        <td className="p-3">
                          <span className="font-bold text-slate-200 block">{u.displayName}</span>
                          <span className="text-[10px] text-slate-500 block font-mono mt-0.5">@{u.username}</span>
                        </td>
                        <td className="p-3 text-slate-400 italic">{u.projectMeaning}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                              groupName.includes('Doctors')
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                                : groupName.includes('Admins')
                                ? 'bg-blue-500/10 text-blue-300 border border-blue-500/25'
                                : groupName.includes('Security')
                                ? 'bg-red-500/10 text-red-300 border border-red-500/25'
                                : groupName === 'None (Bypasses CA)'
                                ? 'bg-slate-950 text-slate-500 border border-slate-850'
                                : 'bg-slate-950 text-slate-300 border border-slate-850'
                            }`}
                          >
                            {groupName}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conditional Access Policies */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lock className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-sm text-slate-200">Conditional Access Policies (MFA & Risk Engines)</h3>
            </div>

            <div className="space-y-4">
              {caPoliciesList.map((pol) => (
                <div
                  key={pol.id}
                  className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold font-mono text-orange-400 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/10">
                        {pol.id}
                      </span>
                      <h4 className="font-bold text-slate-200">{pol.name}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Enforced
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-0.5">
                      <span className="text-slate-500 font-bold">Included Users / Security Groups:</span>
                      <p className="text-slate-300 leading-relaxed font-mono text-[10px]">{pol.target}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-500 font-bold">Excluded Users:</span>
                      <p className="text-slate-400 font-mono text-[10px]">{pol.exclude}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-500 font-bold">Conditions / Sign-in Signals:</span>
                      <p className="text-slate-300 leading-relaxed">{pol.condition}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-500 font-bold">Access Grant Controls:</span>
                      <p className="text-slate-300 font-bold flex items-center gap-1 text-orange-300">
                        <Lock className="w-3 h-3" /> {pol.grant}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost Protection & Storage settings (1 Column) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Storage Security */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              <HardDrive className="w-4.5 h-4.5 text-blue-400" />
              <span className="text-xs font-bold text-slate-200">Storage Account Security Settings</span>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-bold">Storage Account:</span>
                  <span className="font-mono text-slate-200 font-bold">{storageAccount}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-bold">Resource Group:</span>
                  <span className="font-mono text-slate-200">{resourceGroup}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-bold">Allow Blob Anonymous Access:</span>
                  <span className="font-bold text-red-400">Disabled</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-bold">Secure Transfer Required:</span>
                  <span className="font-bold text-green-400">Enabled</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Minimum TLS Version:</span>
                  <span className="font-mono text-slate-200">TLS 1.2 or higher</span>
                </div>
              </div>

              <div className="bg-blue-950/15 border border-blue-500/10 p-3 rounded-xl flex gap-2">
                <Compass className="w-4.5 h-4.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-[11px] font-bold text-blue-300">Blob Security Verification</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Anonymous public container listing is blocked. Secure transfer ensures HTTPS encryption for all files in patient-records, admin-records, and audit-evidence containers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Protection Budgets */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">Cost Protection & Budget Alerts</span>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-bold">Budget spent:</span>
                  <span className="font-mono text-slate-200 font-bold">${budgetSpent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-bold">Threshold limit:</span>
                  <span className="font-mono text-slate-200 font-bold">${parseFloat(budgetLimit).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Alert recipient:</span>
                  <span
                    className="font-mono text-slate-200 font-bold truncate max-w-[150px]"
                    title={settingsMap.get('budget_alerts_recipient') || ''}
                  >
                    {settingsMap.get('budget_alerts_recipient') || 'kanyinsolaadegunle@gmail.com'}
                  </span>
                </div>
              </div>

              {/* Form config */}
              <AzureConfigForm
                initialBudgetLimit={budgetLimit}
                initialBudgetSpent={budgetSpentStr}
              />

              {budgetSpent >= parseFloat(budgetLimit) && (
                <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-lg text-xs text-red-400 flex items-center gap-2 animate-bounce">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Cost Alert Triggered! Budget threshold exceeded.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
