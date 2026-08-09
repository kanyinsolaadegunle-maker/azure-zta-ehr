import { db } from '../../../db/index';
import * as schema from '../../../db/schema';
import { getSimulatedSession } from '../../../lib/session';
import { evaluateZtaAccess } from '../../../lib/zta-engine';
import { eq, desc } from 'drizzle-orm';
import { AccessDenied } from '../../../components/access-denied';
import { AdminForm } from '../../../components/admin-form';
import {
  CreditCard,
  ShieldCheck,
  Calendar,
  DollarSign,
  FileText,
  BadgeAlert,
  Clock,
  Briefcase,
} from 'lucide-react';

export default async function AdminPortal() {
  const session = await getSimulatedSession();

  // 1. ZTA Access Check
  const evaluation = await evaluateZtaAccess(session.username, 'admin-records', 'Read', session);
  if (!evaluation.accessGranted) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <AccessDenied
          resource="admin-records"
          policyTriggered={evaluation.policyTriggered}
          failureReason={evaluation.failureReason}
          requiredAction={evaluation.requiredAction}
        />
      </div>
    );
  }

  // 2. Fetch User Groups for RBAC write check
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
  const isRecordsAdmin = groups.includes('EHR-Records-Admins') || session.username === 'emergency.admin';
  const roleType = isRecordsAdmin ? 'Storage Blob Data Contributor (Read & Write)' : 'Storage Blob Data Reader (Read-Only)';

  const patientId = 'PR-2024-00142';
  const patient = await db.query.patients.findFirst({
    where: eq(schema.patients.id, patientId),
    with: {
      adminRecords: {
        orderBy: desc(schema.adminRecords.recordDate),
      },
    },
  });

  if (!patient) {
    return (
      <div className="flex-1 p-6 text-center text-slate-400">
        Patient record not found. Run db:seed script.
      </div>
    );
  }

  // Filter records
  const appointments = patient.adminRecords.filter((r) => r.recordType === 'appointment');
  const bills = patient.adminRecords.filter((r) => r.recordType === 'billing');
  const insuranceCase = patient.adminRecords.filter((r) => r.recordType === 'insurance')[0];

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-purple-950/20">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Administrative & Billing Files</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Simulated secure EHR Administrative Portal (admin-records container)
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 text-purple-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
            RBAC: {roleType}
          </span>
        </div>
      </div>

      {/* Demographics Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Account Holder</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5">{patient.fullName}</p>
        </div>
        <div>
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Phone (Home)</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{patient.phoneHome}</p>
        </div>
        <div>
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Billing Address</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5 truncate">{patient.address}</p>
        </div>
        <div>
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Email Statement</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5 truncate font-mono">{patient.email}</p>
        </div>
      </div>

      {/* Dashboard split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Insurance Case Detail */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-purple-400" /> Insurance Verification
              </span>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                    <span className="text-slate-500 font-bold">Provider:</span>
                    <span className="font-bold text-slate-200">{patient.insuranceProvider}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                    <span className="text-slate-500 font-bold">Policy Number:</span>
                    <span className="font-mono text-slate-200">{patient.policyNumber}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                    <span className="text-slate-500 font-bold">Group Number:</span>
                    <span className="font-mono text-slate-200">{patient.groupNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Coverage Plan:</span>
                    <span className="text-slate-200">{patient.coverageType}</span>
                  </div>
                </div>

                {insuranceCase && (
                  <div className="bg-purple-950/10 border border-purple-500/10 p-3 rounded-lg text-[11px] text-slate-300 space-y-1">
                    <span className="font-bold text-purple-400">{insuranceCase.title}</span>
                    <p className="leading-relaxed mt-0.5">{insuranceCase.details}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Verified: {insuranceCase.recordDate}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Appointments & Billing Lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Billing and Invoices */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-400" /> Billing Invoices & Statements
              </span>
              {/* Add form if Records Admin */}
              {isRecordsAdmin ? (
                <AdminForm patientId={patientId} />
              ) : (
                <span className="text-[10px] bg-slate-950 border border-slate-850 text-slate-400 px-2.5 py-1 rounded-lg">
                  Read-Only (Requires EHR-Records-Admins to edit)
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-800 transition text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">{bill.title}</span>
                      <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
                        {bill.id}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed max-w-md">{bill.details}</p>
                    <div className="text-[10px] text-slate-500 font-mono">Date: {bill.recordDate}</div>
                  </div>
                  
                  <div className="flex sm:flex-col items-start sm:items-end justify-between w-full sm:w-auto border-t border-slate-850 sm:border-0 pt-2 sm:pt-0">
                    <span className="text-base font-bold text-slate-100 font-mono">
                      ${bill.amount?.toFixed(2)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase ${
                        bill.status === 'Paid'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/25'
                          : 'bg-red-500/20 text-red-300 border border-red-500/25 animate-pulse'
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Appointments Calendar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-400" /> Patient Appointment Calendar
              </span>
            </div>
            
            <div className="p-4 space-y-3">
              {appointments.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex justify-between items-center hover:border-slate-800 transition text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{app.title}</span>
                      <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
                        {app.id}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed max-w-md">{app.details}</p>
                  </div>
                  
                  <div className="text-right space-y-1.5 flex-shrink-0">
                    <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-1 rounded text-slate-300 font-mono font-bold block">
                      {app.recordDate}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        app.status === 'Completed'
                          ? 'bg-slate-900 border border-slate-800 text-slate-400'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/25'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
