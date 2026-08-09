import { db } from '../../../db/index';
import * as schema from '../../../db/schema';
import { getSimulatedSession } from '../../../lib/session';
import { evaluateZtaAccess } from '../../../lib/zta-engine';
import { eq, desc } from 'drizzle-orm';
import { AccessDenied } from '../../../components/access-denied';
import { AdminForm } from '../../../components/admin-form';
import { SignOutButton } from '../../../components/signout-button';

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

const fallbackPatientAdmin = {
  id: 'PR-2024-00142',
  fullName: 'John A. Williams',
  phoneHome: '(555) 234-5678',
  address: '742 Evergreen Terrace, Suite 4B, Seattle, WA 98101',
  email: 'j.williams@example.com',
  insuranceProvider: 'BlueCross Health Premier',
  policyNumber: 'POL-99482710',
  groupNumber: 'GRP-8849102',
  coverageType: 'Comprehensive PPO',
  adminRecords: [
    { id: 'adm-01', recordType: 'appointment', title: 'Cardiology Follow-up Consultation', recordDate: '2024-11-05 10:00 AM', status: 'Scheduled', details: 'Routine follow-up with Dr. Sarah Jenkins, MD.' },
    { id: 'adm-02', recordType: 'appointment', title: 'Diagnostic Lipid Screening', recordDate: '2024-10-24 08:30 AM', status: 'Completed', details: 'Fasting lipid panel ordered at Central Diagnostics.' },
    { id: 'adm-03', recordType: 'billing', title: 'Outpatient Clinical Consultation Fee', recordDate: '2024-10-24', amount: '250.00', status: 'Paid', invoiceNumber: 'INV-2024-8841' },
    { id: 'adm-04', recordType: 'billing', title: 'Diagnostic Pathology Lab Processing', recordDate: '2024-10-24', amount: '180.00', status: 'Pending Insurance', invoiceNumber: 'INV-2024-8842' },
    { id: 'adm-05', recordType: 'insurance', title: 'Primary PPO Active Policy', recordDate: '2024-01-01', details: 'Active comprehensive medical coverage with $25 copay per visit.' },
  ],
};

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

  // 2. Safe DB Queries with try/catch fallback
  let isRecordsAdmin = false;
  let patientData: any = fallbackPatientAdmin;
  const patientId = 'PR-2024-00142';

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
    isRecordsAdmin = groups.includes('EHR-Records-Admins') || session.username === 'emergency.admin';

    const dbPatient = await db.query.patients.findFirst({
      where: eq(schema.patients.id, patientId),
      with: {
        adminRecords: {
          orderBy: desc(schema.adminRecords.recordDate),
        },
      },
    });

    if (dbPatient) {
      patientData = dbPatient;
    }
  } catch (err) {
    console.error('AdminPortal DB fetch warning (using resilient fallback):', err);
    isRecordsAdmin = session.username === 'recordsadmin01' || session.username === 'emergency.admin';
  }

  const roleType = isRecordsAdmin ? 'Storage Blob Data Contributor (Read & Write)' : 'Storage Blob Data Reader (Read-Only)';
  const adminRecordsList = patientData.adminRecords || fallbackPatientAdmin.adminRecords;

  // Filter records safely
  const appointments = adminRecordsList.filter((r: any) => r.recordType === 'appointment');
  const bills = adminRecordsList.filter((r: any) => r.recordType === 'billing');
  const insuranceCase = adminRecordsList.find((r: any) => r.recordType === 'insurance') || adminRecordsList[4] || {};

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-purple-950/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Administrative & Billing Files</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Simulated secure EHR Administrative Portal (admin-records container)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 text-purple-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              RBAC: {roleType}
            </span>
          </div>
          <div className="w-full sm:w-auto min-w-[140px]">
            <SignOutButton />
          </div>
        </div>
      </div>


      {/* Demographics Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Account Holder</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5">{patientData.fullName}</p>
        </div>
        <div>
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Phone (Home)</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{patientData.phoneHome}</p>
        </div>
        <div>
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Billing Address</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5 truncate">{patientData.address}</p>
        </div>
        <div>
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Email Statement</span>
          <p className="text-sm font-bold text-slate-200 mt-0.5 truncate font-mono">{patientData.email}</p>
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
                    <span className="font-bold text-slate-200">{patientData.insuranceProvider}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                    <span className="text-slate-500 font-bold">Policy Number:</span>
                    <span className="font-mono text-slate-200">{patientData.policyNumber}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                    <span className="text-slate-500 font-bold">Group Number:</span>
                    <span className="font-mono text-slate-200">{patientData.groupNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Coverage Plan:</span>
                    <span className="text-slate-200">{patientData.coverageType}</span>
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
              {bills.map((bill: any) => (
                <div
                  key={bill.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-850 hover:border-slate-800 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{bill.title}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {bill.invoiceNumber || bill.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Statement Date: {bill.recordDate}</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-base font-bold text-slate-100 font-mono">${bill.amount}</span>
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        bill.status === 'Paid'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}
                    >
                      {bill.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scheduled Appointments */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-400" /> Patient Appointment Schedule
              </span>
            </div>
            <div className="p-4 space-y-3">
              {appointments.map((apt: any) => (
                <div
                  key={apt.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-200">{apt.title}</span>
                    <p className="text-[11px] text-slate-400">{apt.details}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-300 font-mono text-[11px] bg-slate-900 px-3 py-1 rounded-lg border border-slate-850">
                      {apt.recordDate}
                    </span>
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {apt.status}
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
