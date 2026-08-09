import { db } from '../db/index';
import * as schema from '../db/schema';
import { getSimulatedSession } from '../lib/session';
import { evaluateZtaAccess } from '../lib/zta-engine';
import { desc } from 'drizzle-orm';
import { LandingLoginPortal } from '../components/landing-login-portal';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  HardDrive,
  DollarSign,
  Lock,
  Unlock,
  FileText,
  Clock,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

export default async function Home() {
  const session = await getSimulatedSession();

  // Evaluate access statuses for display
  const clinicalRead = await evaluateZtaAccess(session.username, 'patient-records', 'Read', session);
  const clinicalWrite = await evaluateZtaAccess(session.username, 'patient-records', 'Write', session);
  const adminAccess = await evaluateZtaAccess(session.username, 'admin-records', 'Read', session);
  const auditAccess = await evaluateZtaAccess(session.username, 'audit-evidence', 'Read', session);

  // Fetch recent audit logs from DB
  const logs = await db
    .select()
    .from(schema.auditLogs)
    .orderBy(desc(schema.auditLogs.timestamp))
    .limit(5);

  // Fetch settings for display
  const settingsRows = await db.select().from(schema.systemSettings);
  const settingsMap = new Map(settingsRows.map((s) => [s.key, s.value]));

  const budgetSpent = parseFloat(settingsMap.get('budget_spent') || '0');
  const budgetLimit = parseFloat(settingsMap.get('budget_threshold') || '10');
  const budgetPercent = Math.min((budgetSpent / budgetLimit) * 100, 100);

  return (
    <div className="flex-1 p-6 space-y-8">
      {/* 1. Landing Page Login & Credentials Portal */}
      <LandingLoginPortal />

      {/* 2. Hallmark Medical Center System Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/20">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Hallmark Medical Center Health Cloud Overview</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Simulated Azure Zero Trust Architecture (ZTA) Management Dashboard over Cloud EHR Infrastructure
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-850">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Organization:
            </span>
          </div>
          <span className="text-xs text-white font-semibold font-mono">
            {settingsMap.get('simulated_organization') || 'Hallmark Medical Center Health Cloud'}
          </span>
        </div>
      </div>

      {/* 3. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Active Entra ID Users</p>
            <p className="text-2xl font-bold text-slate-100">8 Mock Users</p>
            <p className="text-[10px] text-slate-400">3 Super Admins Configured</p>
          </div>
          <div className="bg-blue-900/20 p-3 rounded-lg text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Storage */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Secure Containers</p>
            <p className="text-2xl font-bold text-slate-100">3 Private</p>
            <p className="text-[10px] text-slate-400">Anonymous block / TLS 1.2 required</p>
          </div>
          <div className="bg-emerald-900/20 p-3 rounded-lg text-emerald-400">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        {/* Budget spent */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Azure Monthly Spent</p>
              <p className="text-2xl font-bold text-slate-100">${budgetSpent.toFixed(2)}</p>
            </div>
            <div className="bg-purple-900/20 p-3 rounded-lg text-purple-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>Spent: {budgetPercent.toFixed(1)}%</span>
              <span>Limit: ${budgetLimit.toFixed(2)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  budgetPercent > 90 ? 'bg-red-500' : budgetPercent > 70 ? 'bg-yellow-500' : 'bg-purple-500'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* CA Policies */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">CA Policies Status</p>
            <p className="text-2xl font-bold text-emerald-400">4 Active</p>
            <p className="text-[10px] text-slate-400">Continuous protection enforced</p>
          </div>
          <div className="bg-orange-900/20 p-3 rounded-lg text-orange-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. Main Grid: Session Access Evaluation & Activity logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ZTA Session Access Evaluation (Takes 2 Columns on large screen) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-slate-200">ZTA Active Session Verification</h3>
              </div>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold font-mono">
                Evaluator Active
              </span>
            </div>

            {/* Session Info */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Active User</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">{session.username}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Location</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">{session.location}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">IP Address</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">{session.ipAddress}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Sign-in Risk</span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      session.riskLevel === 'High'
                        ? 'text-red-400'
                        : session.riskLevel === 'Medium'
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {session.riskLevel}
                  </span>
                </div>
              </div>

              {/* Resource Verification Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Container Access Matrix</h4>
                
                {/* patient-records */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h5 className="text-xs font-bold text-slate-200">patient-records container</h5>
                    </div>
                    <p className="text-[10px] text-slate-400">Contains clinical patient documents & vitals.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Read */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                      clinicalRead.accessGranted ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'
                    }`}>
                      {clinicalRead.accessGranted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      Read: {clinicalRead.accessGranted ? 'Allowed' : 'Blocked'}
                    </div>
                    {/* Write */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                      clinicalWrite.accessGranted ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'
                    }`}>
                      {clinicalWrite.accessGranted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      Write: {clinicalWrite.accessGranted ? 'Allowed' : 'Blocked'}
                    </div>
                  </div>
                </div>

                {/* admin-records */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <h5 className="text-xs font-bold text-slate-200">admin-records container</h5>
                    </div>
                    <p className="text-[10px] text-slate-400">Contains billing reports & appointment calendars.</p>
                  </div>
                  <div className="flex items-center">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                      adminAccess.accessGranted ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'
                    }`}>
                      {adminAccess.accessGranted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      Access: {adminAccess.accessGranted ? 'Allowed' : 'Blocked'}
                    </div>
                  </div>
                </div>

                {/* audit-evidence */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-orange-400" />
                      <h5 className="text-xs font-bold text-slate-200">audit-evidence container</h5>
                    </div>
                    <p className="text-[10px] text-slate-400">Contains governance audit evidence, logs, settings.</p>
                  </div>
                  <div className="flex items-center">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                      auditAccess.accessGranted ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'
                    }`}>
                      {auditAccess.accessGranted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      Access: {auditAccess.accessGranted ? 'Allowed' : 'Blocked'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic evaluation trace alert */}
              {(!clinicalRead.accessGranted || !adminAccess.accessGranted || !auditAccess.accessGranted) && (
                <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-xl flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-red-300">ZTA Restrictions Applied</h5>
                    <p className="text-xs text-slate-300">
                      Access to one or more modules is restricted. Active blocking criteria:
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1 mt-2 list-disc list-inside">
                      {!clinicalRead.accessGranted && (
                        <li><span className="font-semibold text-slate-300">patient-records:</span> {clinicalRead.failureReason} (Rule: {clinicalRead.policyTriggered})</li>
                      )}
                      {!adminAccess.accessGranted && (
                        <li><span className="font-semibold text-slate-300">admin-records:</span> {adminAccess.failureReason} (Rule: {adminAccess.policyTriggered})</li>
                      )}
                      {!auditAccess.accessGranted && (
                        <li><span className="font-semibold text-slate-300">audit-evidence:</span> {auditAccess.failureReason} (Rule: {auditAccess.policyTriggered})</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Logs Ticker (Takes 1 Column) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-sm text-slate-200">Recent ZTA Activity</h3>
            </div>
            <Link
              href="/portal/compliance"
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold transition uppercase tracking-wider"
            >
              View All
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950/80 p-3 rounded-lg border border-slate-850 hover:border-slate-800 transition flex flex-col gap-1.5 text-[11px]"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-300 font-mono truncate max-w-[120px]">
                      {log.username}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{log.action}</span>
                    <span
                      className={`font-semibold ${
                        log.accessGranted === 1 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {log.accessGranted === 1 ? 'Granted' : 'Blocked'}
                    </span>
                  </div>
                  {log.policyTriggered && (
                    <div className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-500 flex justify-between font-mono">
                      <span>Policy:</span>
                      <span className="text-slate-400 truncate max-w-[180px]">{log.policyTriggered}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No recent security logs found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
