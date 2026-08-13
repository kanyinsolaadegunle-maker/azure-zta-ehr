import { getSimulatedSession } from '../../../lib/session';
import { getAllPatients } from '../../../lib/patients-data';
import { SignOutButton } from '../../../components/signout-button';
import {
  User,
  Heart,
  Droplet,
  Calendar,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PatientPortal() {
  const session = await getSimulatedSession();
  const allPatients = getAllPatients();

  // Match patient by username prefix (e.g., patient.john -> PR-2024-00142, patient.sophia -> PR-2026-00201)
  const cleanUser = (session.username || '').replace(/^@+/, '').toLowerCase();
  
  let patientRecord = allPatients.find((p) => {
    if (cleanUser === 'patient.john' && p.id === 'PR-2024-00142') return true;
    if (cleanUser === 'patient.sophia' && p.id === 'PR-2026-00201') return true;
    if (cleanUser === 'patient.robert' && p.id === 'PR-2026-00202') return true;
    if (cleanUser === 'patient.amara' && p.id === 'PR-2026-00203') return true;
    if (cleanUser === 'patient.david' && p.id === 'PR-2026-00204') return true;
    if (cleanUser === 'patient.emily' && p.id === 'PR-2026-00205') return true;
    return false;
  });

  // Fallback to John Williams if logged in as admin/doctor previewing patient portal
  if (!patientRecord) {
    patientRecord = allPatients[0];
  }

  const latestVital = patientRecord.vitals?.[0];
  const primaryLabReport = patientRecord.labResults?.[0];
  const labValues = primaryLabReport?.values || [];

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Patient Self-Service Portal</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Personal Health Information (PHI) Dashboard for <span className="text-indigo-300 font-semibold">{patientRecord.fullName}</span> ({patientRecord.id})
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider font-mono">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Scope: Read-Only Self Access</span>
          </div>
          <div className="w-full sm:w-auto min-w-[140px]">
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Patient Demographic Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Patient Name</span>
          <span className="font-bold text-slate-200 text-sm mt-0.5 block">{patientRecord.fullName}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Date of Birth / Age</span>
          <span className="font-semibold text-slate-300 mt-0.5 block">{patientRecord.dob} ({patientRecord.age} yrs)</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Blood Type / Gender</span>
          <span className="font-semibold text-slate-300 mt-0.5 block">{patientRecord.bloodType} • {patientRecord.gender}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">Primary Care Doctor</span>
          <span className="font-semibold text-emerald-400 mt-0.5 block">{patientRecord.primaryCarePhysician}</span>
        </div>
      </div>

      {/* Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Vitals, Allergies */}
        <div className="space-y-6 lg:col-span-1">
          {/* Vitals Signs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" /> Recent Vital Signs
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Recorded: {latestVital?.recordedDate || 'N/A'}</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <p className="text-slate-500 font-bold">Blood Pressure</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.bloodPressure || 'N/A'}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <p className="text-slate-500 font-bold">Heart Rate</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.heartRate ? `${latestVital.heartRate} bpm` : 'N/A'}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <p className="text-slate-500 font-bold">Temperature</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.temperature || 'N/A'}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                <p className="text-slate-500 font-bold">O2 Saturation</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.oxygenSaturation ? `${latestVital.oxygenSaturation}%` : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Allergies on File */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-orange-400" /> Documented Allergies
              </span>
            </div>
            <div className="p-4 space-y-2">
              {patientRecord.allergies.length > 0 ? (
                patientRecord.allergies.map((alg) => (
                  <div key={alg.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-start gap-2.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-200">{alg.allergen}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">Reaction: {alg.reaction}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic p-2">No known drug allergies on file (NKDA).</p>
              )}
            </div>
          </div>

          {/* Immunization History */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" /> Immunization History
              </span>
            </div>
            <div className="p-3 text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-800">
                    <th className="pb-2">Vaccine</th>
                    <th className="pb-2 text-right">Date Administered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {patientRecord.immunizations.map((imm) => (
                    <tr key={imm.id} className="text-slate-300">
                      <td className="py-2.5 font-semibold">{imm.vaccine}</td>
                      <td className="py-2.5 text-right font-mono text-slate-400">{imm.dateAdministered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Prescriptions & Labs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Prescriptions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" /> Active Medications & Prescriptions
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Issued by Attending Physician</span>
            </div>

            <div className="p-4 space-y-4">
              {patientRecord.prescriptions.map((rx) => (
                <div key={rx.id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2 text-xs font-mono">
                    <span className="font-bold text-slate-200">{rx.id}</span>
                    <span className="text-slate-400">Date: {rx.dateIssued}</span>
                    <span className="text-emerald-400 font-bold uppercase">{rx.status}</span>
                  </div>

                  <div className="space-y-2">
                    {rx.items.map((item) => (
                      <div key={item.id} className="text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-100">
                          <span>{item.medication} {item.strength}</span>
                          <span className="text-slate-400 font-normal">{item.dose} • {item.frequency}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Route: {item.route} | Quantity: {item.quantity} | Refills: {item.refills}</p>
                        {item.specialInstructions && (
                          <p className="text-[11px] text-indigo-300 italic font-mono bg-slate-900 p-2 rounded border border-slate-850">
                            * {item.specialInstructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-500 border-t border-slate-850 pt-2 font-mono flex justify-between">
                    <span>Prescriber: {rx.issuingPhysician}</span>
                    <span>Pharmacy: {rx.dispensedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Laboratory Reports */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" /> Diagnostic Lab Results
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Report ID: {primaryLabReport?.id || 'N/A'}</span>
            </div>

            <div className="p-4 space-y-4">
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
                    {labValues.map((v) => (
                      <tr key={v.id}>
                        <td className="p-3">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wide block font-mono">{v.panelName}</span>
                          <span className="font-semibold text-slate-200 mt-0.5 block">{v.testName}</span>
                        </td>
                        <td className="p-3 text-center font-bold font-mono text-white">{v.resultValue}</td>
                        <td className="p-3 text-center font-mono text-slate-400">{v.referenceRange}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.flag === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-950 text-slate-400 border border-slate-850'}`}>
                            {v.flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {primaryLabReport?.comments && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs">
                  <span className="font-bold text-slate-200 block">Pathologist Comments:</span>
                  <p className="text-slate-300 mt-1 italic leading-relaxed">"{primaryLabReport.comments}"</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-850">
                    Verified By: {primaryLabReport.verifiedBy} ({primaryLabReport.signature})
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
