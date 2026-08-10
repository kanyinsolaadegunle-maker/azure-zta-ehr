import { db } from '../../../db/index';
import * as schema from '../../../db/schema';
import { getSimulatedSession } from '../../../lib/session';
import { evaluateZtaAccess } from '../../../lib/zta-engine';
import { UserManagementPanel } from '../../../components/user-management-panel';
import { AccessDenied } from '../../../components/access-denied';
import { SignOutButton } from '../../../components/signout-button';

import {
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Shield,
  Building2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const defaultFallbackUsers = [
  { id: 'u-globaladmin01', username: 'globaladmin01', password: 'GlobalMasterAdmin2026!', displayName: 'Global Master Administrator', description: 'globaladmin01', projectMeaning: 'Master Administrator with unrestricted global access across all EHR modules and Azure configuration', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', status: 'Active', userGroups: [{ group: { id: 'g-admins', name: 'EHR-Cloud-Admins' } }] },
  { id: 'u-doctor01', username: 'doctor01', password: 'DoctorPass2026!', displayName: 'Doctor User', description: 'doctor01', projectMeaning: 'Clinical user who requires access to patient records', avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80', status: 'Active', userGroups: [{ group: { id: 'g-doctors', name: 'EHR-Doctors' } }] },
  { id: 'u-nurse01', username: 'nurse01', password: 'NursePass2026!', displayName: 'Nurse User', description: 'nurse01', projectMeaning: 'Clinical user with limited patient-care access', avatarUrl: 'https://images.unsplash.com/photo-1594824813566-7885a65c9172?auto=format&fit=crop&w=256&q=80', status: 'Active', userGroups: [{ group: { id: 'g-nurses', name: 'EHR-Nurses' } }] },
  { id: 'u-recordsadmin01', username: 'recordsadmin01', password: 'RecordsAdmin2026!', displayName: 'Records Admin User', description: 'recordsadmin01', projectMeaning: 'Administrative user for non-clinical records', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80', status: 'Active', userGroups: [{ group: { id: 'g-records', name: 'EHR-Records-Admins' } }] },
  { id: 'u-itsecurityadmin01', username: 'itsecurityadmin01', password: 'SecurityAdmin2026#', displayName: 'IT Security Admin User', description: 'itsecurityadmin01', projectMeaning: 'Security monitoring and incident response user (Super Admin)', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', status: 'Active', userGroups: [{ group: { id: 'g-security', name: 'EHR-IT-Security' } }] },
  { id: 'u-cloudadmin01', username: 'cloudadmin01', password: 'CloudAdmin2026#', displayName: 'Cloud Admin User', description: 'cloudadmin01', projectMeaning: 'Cloud resource management user (Super Admin)', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80', status: 'Active', userGroups: [{ group: { id: 'g-admins', name: 'EHR-Cloud-Admins' } }] },
  { id: 'u-vendor01', username: 'vendor01', password: 'VendorPass2026!', displayName: 'Vendor User', description: 'vendor01', projectMeaning: 'Third-party vendor with restricted technical access', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80', status: 'Active', userGroups: [{ group: { id: 'g-vendors', name: 'EHR-Vendors' } }] },
  { id: 'u-auditor01', username: 'auditor01', password: 'AuditorPass2026!', displayName: 'Auditor User', description: 'auditor01', projectMeaning: 'Compliance auditor for access log review', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80', status: 'Active', userGroups: [{ group: { id: 'g-auditors', name: 'EHR-Auditors' } }] },
  { id: 'u-emergencyadmin', username: 'emergency.admin', password: 'BreakGlassPass2026!', displayName: 'Emergency Break-Glass Admin', description: 'emergency.admin', projectMeaning: 'Break-glass administrative override account', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emergency.admin', status: 'Active', userGroups: [] },
];

export default async function LoginDashboardPage() {
  try {
    const currentSession = await getSimulatedSession();

    if (!currentSession?.username || !currentSession?.isAuthenticated) {
      return (
        <div className="flex-1 p-6 flex items-center justify-center">
          <AccessDenied
            resource="entra-id-user-directory"
            policyTriggered="Identity Governance - Auth Required"
            failureReason="Authentication required. Please sign in with your credentials on the landing page to access User Directory & Roles."
            requiredAction="BLOCK"
          />
        </div>
      );
    }

    let usersList: any[] = [];
    let userGroupsList: any[] = [];
    let securityGroups: any[] = [];

    try {
      usersList = await db.select().from(schema.users);
      userGroupsList = await db.select().from(schema.userGroups);
      securityGroups = await db.select().from(schema.securityGroups);
    } catch (err: any) {
      if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) throw err;
      console.error('Portal login DB fetch warning (fallback used):', err);
    }

    const groupMap = new Map<string, string>();
    (securityGroups || []).forEach((g) => {
      if (g?.id) groupMap.set(g.id, g.name);
    });

    const userGroupMap = new Map<string, string>();
    (userGroupsList || []).forEach((ug) => {
      if (ug?.userId && ug?.groupId) {
        userGroupMap.set(ug.userId, groupMap.get(ug.groupId) || 'Assigned Group');
      }
    });

    const effectiveUsers = usersList.length > 0
      ? usersList.map((u) => ({
          ...u,
          groupName: userGroupMap.get(u.id) || (u.username === 'globaladmin01' ? 'EHR-Cloud-Admins' : 'EHR-Doctors'),
        }))
      : defaultFallbackUsers;


    const cleanUser = (currentSession.username || '').replace(/^@+/, '').toLowerCase();
    const isSuperAdmin =
      cleanUser === 'globaladmin01' ||
      cleanUser === 'cloudadmin01' ||
      cleanUser === 'itsecurityadmin01' ||
      cleanUser === 'emergency.admin';



    // Format users list for UserManagementPanel safely
    const userItems = effectiveUsers.map((u) => {
      const ug = u.userGroups?.[0];
      const usernameVal = u.username || 'user';
      return {
        id: u.id || `u-${usernameVal}`,
        username: usernameVal,

        password: u.password || '••••••••',
        displayName: u.displayName || usernameVal,
        description: u.description || usernameVal,
        projectMeaning: u.projectMeaning || 'Assigned EHR Account',
        avatarUrl: u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${usernameVal}`,
        status: u.status || 'Active',
        groupName: u.groupName || ug?.group?.name || 'None (Break-glass)',
        groupId: u.groupId || ug?.group?.id,
      };
    });


    // Evaluate access matrix instantly and safely without concurrent DB locking
    const userAccessMatrix = userItems.map((u) => {
      const g = u.groupName || '';
      const un = (u.username || '').toLowerCase().replace(/^@+/, '');
      const isMaster =
        un === 'globaladmin01' ||
        un === 'cloudadmin01' ||
        un === 'emergency.admin';

      return {
        user: u,
        groupName: g || 'Directory User',
        isCurrent: un === (currentSession.username || '').toLowerCase().replace(/^@+/, ''),
        access: {
          patientRead: isMaster || g.includes('Doctor') || g.includes('Nurse'),
          patientWrite: isMaster || g.includes('Doctor'),
          adminRead: isMaster || g.includes('Records') || g.includes('Admin'),
          auditRead: isMaster || g.includes('Security') || g.includes('Auditor'),
        },
      };
    });


    const cleanUserItems = JSON.parse(JSON.stringify(userItems || []));
    const cleanSecurityGroups = JSON.parse(JSON.stringify(securityGroups || []));

    return (
      <div className="flex-1 p-6 space-y-8">
        {/* Header Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/30">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Hallmark Medical Center User Portal</h2>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Microsoft Entra ID User Directory, Security Groups, Profile Avatars & Super Admin Management
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-blue-500/30 shadow-lg">
              <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ACTIVE USER</p>
                <p className="text-sm font-bold text-white font-mono">@{currentSession.username}</p>
              </div>
            </div>
            <div className="w-full sm:w-auto min-w-[140px]">
              <SignOutButton />
            </div>
          </div>
        </div>

        {/* Super Admin & Profile Management Panel */}
        <UserManagementPanel
          users={cleanUserItems}
          securityGroups={cleanSecurityGroups}
          currentUser={currentSession.username || ''}
          isSuperAdmin={isSuperAdmin}
        />


        {/* RBAC Access Matrix Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm text-slate-200">Complete Directory Access Matrix (Azure RBAC)</h3>
            </div>
            <span className="text-[10px] bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-400 font-mono">
              Low-Risk Context Evaluation
            </span>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  <th className="p-3">User Account</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned Security Group</th>
                  <th className="p-3 text-center">patient-records (Read)</th>
                  <th className="p-3 text-center">patient-records (Write)</th>
                  <th className="p-3 text-center">admin-records (Read/Write)</th>
                  <th className="p-3 text-center">audit-evidence (Read)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono">
                {userAccessMatrix.map((item) => {
                  const uObj = item?.user || {};
                  const uUsername = uObj.username || 'user';
                  const uDisplayName = uObj.displayName || uUsername;
                  const uAvatar = uObj.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uUsername}`;
                  const uStatus = uObj.status || 'Active';

                  return (
                    <tr
                      key={uObj.id || uUsername}
                      className={`hover:bg-slate-850/40 transition ${
                        item.isCurrent ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-200 flex items-center gap-2">
                        <img
                          src={uAvatar}
                          alt={uDisplayName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-700 bg-slate-950"
                          onError={(e) => {
                            (e.target as any).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${uUsername}`;
                          }}
                        />
                        <div>
                          <span>{uUsername}</span>
                          {item.isCurrent && (
                            <span className="ml-1.5 text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            uStatus === 'Banned'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                          }`}
                        >
                          {uStatus}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{item.groupName || 'Directory Group'}</td>
                      <td className="p-3 text-center">
                        {item.access?.patientRead ? (
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
                        {item.access?.patientWrite ? (
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
                        {item.access?.adminRead ? (
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
                        {item.access?.auditRead ? (
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch (outerErr: any) {
    if (outerErr?.digest === 'DYNAMIC_SERVER_USAGE' || outerErr?.message?.includes('Dynamic server usage')) {
      throw outerErr;
    }
    console.error('Outer portal login exception caught cleanly:', outerErr);
    // Render fail-safe fallback UI without ever throwing to Next error boundary
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <AccessDenied
          resource="entra-id-user-directory"
          policyTriggered="Identity Governance - Auth Required"
          failureReason="Authentication required. Please sign in with your credentials on the landing page to access User Directory & Roles."
          requiredAction="BLOCK"
        />
      </div>
    );
  }
}

