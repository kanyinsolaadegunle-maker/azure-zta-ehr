import { db } from '../../../db/index';
import * as schema from '../../../db/schema';
import { getSimulatedSession } from '../../../lib/session';
import { evaluateZtaAccess } from '../../../lib/zta-engine';
import { eq } from 'drizzle-orm';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Key,
  LogIn,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  FileText,
  CreditCard,
  Shield,
  Zap,
} from 'lucide-react';
import { RoleSelectorCard } from '../../../components/role-selector-card';

export default async function LoginDashboardPage() {
  const currentSession = await getSimulatedSession();

  // Fetch all users with their mapped security groups from DB
  const usersWithGroups = await db.query.users.findMany({
    with: {
      userGroups: {
        with: {
          group: true,
        },
      },
    },
  });

  // Evaluate access matrix for each user
  const userAccessMatrix = await Promise.all(
    usersWithGroups.map(async (u) => {
      const groupName = u.userGroups[0]?.group.name || 'None (Break-glass)';

      // Evaluate permissions under Low risk and default MFA context
      const testContext = {
        riskLevel: 'Low' as const,
        location: 'United States',
        ipAddress: '198.51.100.12',
        mfaCompleted: true,
      };

      const patientRead = await evaluateZtaAccess(u.username, 'patient-records', 'Read', testContext);
      const patientWrite = await evaluateZtaAccess(u.username, 'patient-records', 'Write', testContext);
      const adminRead = await evaluateZtaAccess(u.username, 'admin-records', 'Read', testContext);
      const auditRead = await evaluateZtaAccess(u.username, 'audit-evidence', 'Read', testContext);

      return {
        user: u,
        groupName,
        isCurrent: u.username === currentSession.username,
        access: {
          patientRead: patientRead.accessGranted,
          patientWrite: patientWrite.accessGranted,
          adminRead: adminRead.accessGranted,
          auditRead: auditRead.accessGranted,
        },
      };
    })
  );

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/30">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Entra ID User Login & RBAC Portal</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Switch simulated user identities and evaluate Microsoft Entra ID Security Group mappings & Azure RBAC permissions
          </p>
        </div>

        {/* Current Active Session Badge */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-blue-500/30 shadow-lg">
          <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ACTIVE LOGGED IN USER</p>
            <p className="text-sm font-bold text-white font-mono">{currentSession.username}</p>
          </div>
        </div>
      </div>

      {/* RBAC Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block font-mono">
            ROLE BASED ACCESS CONTROL (RBAC)
          </span>
          <p className="font-bold text-slate-200">Entra ID Security Group Enforcement</p>
          <p className="text-slate-400 text-[11px]">
            User permissions are strictly scoped based on directory security group memberships and storage container roles.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-mono">
            LEAST PRIVILEGE PRINCIPLE
          </span>
          <p className="font-bold text-slate-200">Segmented Clinical & Admin Data</p>
          <p className="text-slate-400 text-[11px]">
            Doctors have Read/Write access on clinical records; Nurses have Read-Only; Records Admins manage billing/calendar.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block font-mono">
            EMERGENCY BREAK-GLASS
          </span>
          <p className="font-bold text-slate-200">emergency.admin Account</p>
          <p className="text-slate-400 text-[11px]">
            Excluded from conditional access blocking rules to ensure emergency availability during system incidents.
          </p>
        </div>
      </div>

      {/* User Login Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400" /> Select User Account to Log In
          </h3>
          <span className="text-xs text-slate-400 font-mono">8 Accounts Configured</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {userAccessMatrix.map((item) => (
            <RoleSelectorCard key={item.user.username} item={item} />
          ))}
        </div>
      </div>

      {/* RBAC Access Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm text-slate-200">Complete Directory Access Matrix (Azure RBAC)</h3>
          </div>
          <span className="text-[10px] bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-400 font-mono">
            Standard Low-Risk Policy Context
          </span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                <th className="p-3">User Account</th>
                <th className="p-3">Assigned Security Group</th>
                <th className="p-3 text-center">patient-records (Read)</th>
                <th className="p-3 text-center">patient-records (Write)</th>
                <th className="p-3 text-center">admin-records (Read/Write)</th>
                <th className="p-3 text-center">audit-evidence (Read)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-mono">
              {userAccessMatrix.map((item) => (
                <tr
                  key={item.user.id}
                  className={`hover:bg-slate-850/40 transition ${
                    item.isCurrent ? 'bg-blue-950/20' : ''
                  }`}
                >
                  <td className="p-3 font-bold text-slate-200">
                    {item.user.username}
                    {item.isCurrent && (
                      <span className="ml-2 text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-300">{item.groupName}</td>
                  <td className="p-3 text-center">
                    {item.access.patientRead ? (
                      <span className="text-green-400 font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Allowed
                      </span>
                    ) : (
                      <span className="text-red-400/80 font-semibold flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Denied
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.access.patientWrite ? (
                      <span className="text-green-400 font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Allowed
                      </span>
                    ) : (
                      <span className="text-red-400/80 font-semibold flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Denied
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.access.adminRead ? (
                      <span className="text-green-400 font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Allowed
                      </span>
                    ) : (
                      <span className="text-red-400/80 font-semibold flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Denied
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.access.auditRead ? (
                      <span className="text-green-400 font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Allowed
                      </span>
                    ) : (
                      <span className="text-red-400/80 font-semibold flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Denied
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
