import { db } from '../../../db/index';
import * as schema from '../../../db/schema';
import { getSimulatedSession } from '../../../lib/session';
import { evaluateZtaAccess } from '../../../lib/zta-engine';
import { eq, desc } from 'drizzle-orm';
import { AccessDenied } from '../../../components/access-denied';
import { PrescriptionForm } from '../../../components/prescription-form';
import {
  FileText,
  Activity,
  Heart,
  Droplet,
  ShieldCheck,
  Download,
  AlertTriangle,
  Lock,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';

export default async function ClinicalPortal() {
  const session = await getSimulatedSession();

  // 1. ZTA Access Check
  const evaluation = await evaluateZtaAccess(session.username, 'patient-records', 'Read', session);
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
  const isDoctor = groups.includes('EHR-Doctors') || session.username === 'emergency.admin';
  const roleType = isDoctor ? 'Storage Blob Data Contributor (Read & Write)' : 'Storage Blob Data Reader (Read-Only)';

  // 3. Fetch Patient Clinical File
  const patientId = 'PR-2024-00142';
  const patient = await db.query.patients.findFirst({
    where: eq(schema.patients.id, patientId),
    with: {
      vitals: true,
      allergies: true,
      immunizations: true,
      history: true,
      prescriptions: {
        orderBy: desc(schema.prescriptions.dateIssued),
        with: {
          items: true,
        },
      },
      labResults: {
        with: {
          values: true,
        },
      },
    },
  });

  if (!patient) {
    return (
      <div className="flex-1 p-6 text-center text-slate-400">
        Patient record John A. Williams not found. Run db:seed script.
      </div>
    );
  }

  const latestVital = patient.vitals[0];

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-emerald-950/20">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Clinical Patient File</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Simulated secure EHR Clinical Records Viewer (patient-records container)
          </p>
        </div>
        <div className="flex flex-col items-end text-right">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              RBAC: {roleType}
            </span>
          </div>
        </div>
      </div>

      {/* Patient Demographic Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-6 gap-4 text-xs">
        <div>
          <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Patient Name</p>
          <p className="text-sm font-bold text-slate-200 mt-0.5">{patient.fullName}</p>
        </div>
        <div>
          <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Patient ID</p>
          <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{patient.id}</p>
        </div>
        <div>
          <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Date of Birth</p>
          <p className="text-sm font-bold text-slate-200 mt-0.5">{patient.dob}</p>
        </div>
        <div>
          <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Age / Gender</p>
          <p className="text-sm font-bold text-slate-200 mt-0.5">{patient.age} / {patient.gender}</p>
        </div>
        <div>
          <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Blood Type</p>
          <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{patient.bloodType}</p>
        </div>
        <div>
          <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Primary Care Provider</p>
          <p className="text-sm font-bold text-slate-200 mt-0.5">{patient.primaryCarePhysician}</p>
        </div>
      </div>

      {/* Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Vitals, Allergies, History */}
        <div className="space-y-6 lg:col-span-1">
          {/* Vitals Signs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500" /> Vital Signs
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Last: {latestVital?.recordedDate}</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                <p className="text-slate-500 font-bold">BP</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.bloodPressure}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                <p className="text-slate-500 font-bold">Heart Rate</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.heartRate} bpm</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                <p className="text-slate-500 font-bold">Temperature</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.temperature}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                <p className="text-slate-500 font-bold">O2 Saturation</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.oxygenSaturation}%</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                <p className="text-slate-500 font-bold">Height</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{latestVital?.height}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                <p className="text-slate-500 font-bold">Weight / BMI</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{latestVital?.weight} ({latestVital?.bmi})</p>
              </div>
            </div>
          </div>

          {/* Allergies on File */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-orange-400" /> Allergies
              </span>
            </div>
            <div className="p-4 space-y-2">
              {patient.allergies.map((alg) => (
                <div key={alg.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-start gap-2.5 text-xs">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-500/80 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-bold text-slate-200">{alg.allergen}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Reaction: {alg.reaction}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immunization History */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" /> Immunizations
              </span>
            </div>
            <div className="p-3 text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-800">
                    <th className="pb-2">Vaccine</th>
                    <th className="pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {patient.immunizations.map((imm) => (
                    <tr key={imm.id} className="text-slate-300">
                      <td className="py-2">{imm.vaccine}</td>
                      <td className="py-2 text-right font-mono">{imm.dateAdministered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Labs & Prescriptions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Lab Results Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Laboratory Reports
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Report ID: {patient.labResults[0]?.id}</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap gap-4 text-xs bg-slate-950 p-3 rounded-lg border border-slate-850">
                <div>
                  <span className="text-slate-500 font-bold">Ordered Date:</span>{' '}
                  <span className="text-slate-300 font-mono">{patient.labResults[0]?.dateOrdered}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">Reported Date:</span>{' '}
                  <span className="text-slate-300 font-mono">{patient.labResults[0]?.dateReported}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">Facility:</span>{' '}
                  <span className="text-slate-300">{patient.labResults[0]?.labFacility}</span>
                </div>
              </div>

              {/* Lab Values table */}
              <div className="border border-slate-850 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950">
                    <tr className="text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-850">
                      <th className="p-3">Panel / Test</th>
                      <th className="p-3 text-center">Result</th>
                      <th className="p-3 text-center">Reference Range</th>
                      <th className="p-3 text-right">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {patient.labResults[0]?.values.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-850/40">
                        <td className="p-3">
                          <span className="text-[10px] text-slate-500 block uppercase tracking-wide font-mono">
                            {v.panelName}
                          </span>
                          <span className="font-semibold text-slate-200 mt-0.5 block">{v.testName}</span>
                        </td>
                        <td className="p-3 text-center font-semibold font-mono text-slate-100">
                          {v.resultValue}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">
                          {v.referenceRange}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              v.flag === 'HIGH'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/25 animate-pulse'
                                : v.flag === 'LOW'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/25'
                                : 'bg-slate-950 text-slate-400 border border-slate-850'
                            }`}
                          >
                            {v.flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pathologist Comments */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
                <span className="font-bold text-slate-200">Pathologist Interpretive Comments:</span>
                <p className="text-slate-300 mt-1 italic leading-relaxed">
                  "{patient.labResults[0]?.comments}"
                </p>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-850">
                  <span>Verified By: {patient.labResults[0]?.verifiedBy}</span>
                  <span>Signature: {patient.labResults[0]?.signature}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Prescriptions Header & List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" /> Prescription Records
              </span>
              
              {/* If user is doctor, show create form. If nurse, show disabled banner */}
              {isDoctor ? (
                <PrescriptionForm patientId={patientId} />
              ) : (
                <span className="text-[10px] bg-slate-950 border border-slate-850 text-slate-400 px-2.5 py-1 rounded-lg">
                  Read-Only (Requires EHR-Doctors Group to Prescribe)
                </span>
              )}
            </div>
            
            <div className="p-4 space-y-4">
              {patient.prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="bg-slate-950 border border-slate-850 rounded-xl p-4 hover:border-slate-800 transition space-y-4"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-slate-850 pb-2 text-xs">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Rx ID</span>
                      <p className="font-bold text-slate-200 font-mono">{rx.id}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Issued On</span>
                      <p className="text-slate-300 font-mono">{rx.dateIssued}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Status</span>
                      <p className="text-emerald-400 font-bold uppercase">{rx.status}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {rx.items.map((item) => (
                      <div key={item.id} className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-200 text-sm">
                            {item.medication} {item.strength}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {item.dose} • {item.frequency}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 pt-1">
                          <span>Route: {item.route}</span>
                          <span>Dispense: {item.quantity}</span>
                          <span>Refills: {item.refills}</span>
                          <span className="truncate">Indication: {item.indication}</span>
                        </div>
                        {item.specialInstructions && (
                          <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-300 italic mt-1 font-mono border border-slate-850">
                            * {item.specialInstructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Doctor Signature */}
                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-850 pt-2 font-mono">
                    <span>Pharmacy: {rx.dispensedBy}</span>
                    <span>Signed By: {rx.issuingPhysician}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulated Azure Blob files list */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulated Cloud Storage blobs</h4>
            <p className="text-xs text-slate-400">
              The clinical records shown above represent virtual text blobs uploaded under private containers in the <code className="text-blue-300 font-mono">meditrustztestorage</code> storage account.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <a
                href="#"
                className="bg-slate-950 p-3 rounded-lg border border-slate-850 hover:border-slate-800 hover:bg-slate-900 transition flex items-center justify-between text-slate-300 hover:text-white"
              >
                <div className="truncate pr-2">
                  <p className="font-bold text-[10px] text-slate-500 leading-none">FILE BLOB</p>
                  <p className="mt-1 font-semibold truncate text-[11px]">patient_record_001.txt</p>
                </div>
                <Download className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </a>

              <a
                href="#"
                className="bg-slate-950 p-3 rounded-lg border border-slate-850 hover:border-slate-800 hover:bg-slate-900 transition flex items-center justify-between text-slate-300 hover:text-white"
              >
                <div className="truncate pr-2">
                  <p className="font-bold text-[10px] text-slate-500 leading-none">FILE BLOB</p>
                  <p className="mt-1 font-semibold truncate text-[11px]">lab_result_001.txt</p>
                </div>
                <Download className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </a>

              <a
                href="#"
                className="bg-slate-950 p-3 rounded-lg border border-slate-850 hover:border-slate-800 hover:bg-slate-900 transition flex items-center justify-between text-slate-300 hover:text-white"
              >
                <div className="truncate pr-2">
                  <p className="font-bold text-[10px] text-slate-500 leading-none">FILE BLOB</p>
                  <p className="mt-1 font-semibold truncate text-[11px]">prescription_001.txt</p>
                </div>
                <Download className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
