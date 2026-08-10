import { db } from '../../../db/index';
import * as schema from '../../../db/schema';
import { getSimulatedSession } from '../../../lib/session';
import { evaluateZtaAccess } from '../../../lib/zta-engine';
import { desc } from 'drizzle-orm';
import { AccessDenied } from '../../../components/access-denied';
import { AuditLogsTable } from '../../../components/audit-logs-table';
import { SignOutButton } from '../../../components/signout-button';
import { EvaluationDashboard } from '../../../components/evaluation-dashboard';

import { Shield, ShieldCheck, CheckCircle2, ClipboardList, Database } from 'lucide-react';


const complianceEvidence = [
  { component: 'Identity governance', evidence: 'Created mock healthcare users in Microsoft Entra ID (doctor01, nurse01, recordsadmin01, etc.)' },
  { component: 'Group-based access', evidence: 'Created security groups (EHR-Doctors, EHR-Nurses, EHR-Records-Admins, EHR-Vendors, EHR-Auditors, EHR-IT-Security, EHR-Cloud-Admins) with descriptions' },
  { component: 'Least privilege', evidence: 'Assigned limited Azure RBAC roles (Storage Blob Data Contributor/Reader) at container level' },
  { component: 'MFA', evidence: 'Created Conditional Access MFA policy (CA001) targeting EHR security groups' },
  { component: 'Continuous verification', evidence: 'Created risk-based conditional access policies (CA002, CA003) using Microsoft Entra ID P2' },
  { component: 'Privileged access management', evidence: 'Created admin MFA policy (CA004) and eligible role assignments' },
  { component: 'Data protection', evidence: 'Created private blob containers, disabled anonymous public access, and enabled secure transfer' },
  { component: 'Micro-segmentation', evidence: 'Separated patient clinical records, admin billing files, and audit evidence into distinct containers' },
  { component: 'Monitoring', evidence: 'Logged Entra ID sign-in events, directory audit trails, and Azure Storage activity actions' },
  { component: 'Governance', evidence: 'Structured screenshots, policies, roles, limitations, and verification testing checklists' },
];

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CompliancePortal() {

  const session = await getSimulatedSession();

  // 1. ZTA Access Check
  const evaluation = await evaluateZtaAccess({
    username: session.username,
    resource: 'audit-evidence',
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
          resource="audit-evidence"
          policyTriggered={evaluation.policyTriggered}
          failureReason={evaluation.failureReason}
          requiredAction={evaluation.requiredAction}
        />
      </div>
    );
  }

  // 2. Query Audit logs from DB with fallback
  let logs: any[] = [];
  try {
    logs = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.timestamp));
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) throw err;
    console.error('CompliancePortal DB fetch warning (using empty log array):', err);
  }



  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-orange-950/20">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Compliance & Governance Logs</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Simulated secure EHR Compliance Records Workspace (audit-evidence container)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 text-orange-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              RBAC: Reader / Blob Data Reader
            </span>
          </div>
          <div className="w-full sm:w-auto min-w-[140px]">
            <SignOutButton />
          </div>
        </div>
      </div>


      {/* Quantitative Evaluation Engine Dashboard */}
      <EvaluationDashboard />

      {/* Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        
        {/* Compliance Evidence Table (Left 1 Column) */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-orange-400" />
              <span className="text-xs font-bold text-slate-200">ZTA Evidence Mapping Table</span>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                This table maps critical Zero Trust components directly to our simulated Microsoft Azure tenant configuration.
              </p>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar text-xs">
                {complianceEvidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 space-y-1 hover:border-slate-800 transition"
                  >
                    <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                      <span>{ev.component}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed pl-5">{ev.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Table (Right 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-orange-400" />
                <h3 className="font-bold text-sm text-slate-200">Continuous Security Audit Trail</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Real-time Stream</span>
            </div>

            {/* Logs Table component */}
            <AuditLogsTable initialLogs={logs} />
          </div>
        </div>

      </div>
    </div>
  );
}
