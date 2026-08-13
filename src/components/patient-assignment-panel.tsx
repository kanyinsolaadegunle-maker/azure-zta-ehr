'use client';

import React, { useState } from 'react';
import { UserCheck, Shield, Check, Loader2, AlertCircle } from 'lucide-react';
import { PatientClinicalRecord } from '../lib/patients-data';
import { assignPatientDoctorAction } from '../app/actions';

interface PatientAssignmentPanelProps {
  patients: PatientClinicalRecord[];
  isAuthorizedAdmin: boolean;
}

const DOCTORS = [
  { username: 'doctor01', name: 'Dr. Emily Carson, MD', specialty: 'General Practice / Primary Care' },
  { username: 'doctor02', name: 'Dr. Marcus Vance, MD', specialty: 'Cardiology / Internal Medicine' },
  { username: 'doctor03', name: 'Dr. Elena Rostova, MD', specialty: 'Neurology / Critical Care' },
];

export function PatientAssignmentPanel({ patients, isAuthorizedAdmin }: PatientAssignmentPanelProps) {
  const [selectedDoctorMap, setSelectedDoctorMap] = useState<Record<string, string>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [successMap, setSuccessMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  const handleAssign = async (patientId: string) => {
    const doctorUsername = selectedDoctorMap[patientId];
    if (!doctorUsername) return;

    setLoadingMap((prev) => ({ ...prev, [patientId]: true }));
    setErrorMap((prev) => ({ ...prev, [patientId]: '' }));
    setSuccessMap((prev) => ({ ...prev, [patientId]: false }));

    try {
      const res = await assignPatientDoctorAction(patientId, doctorUsername);
      if (res.success) {
        setSuccessMap((prev) => ({ ...prev, [patientId]: true }));
        setTimeout(() => {
          setSuccessMap((prev) => ({ ...prev, [patientId]: false }));
        }, 3000);
      } else {
        setErrorMap((prev) => ({ ...prev, [patientId]: res.error || 'Assignment failed.' }));
      }
    } catch (err: any) {
      setErrorMap((prev) => ({ ...prev, [patientId]: err?.message || 'Assignment failed.' }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Patient-to-Doctor Panel Assignment Control</h3>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Governance interface for Records Administrators (`Records-Admins`) to route patient clinical care panels.
          </p>
        </div>
        <span className="text-[10px] font-mono bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-slate-300">
          RBAC: Records-Admins & Cloud-Admins
        </span>
      </div>

      {!isAuthorizedAdmin && (
        <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl text-xs text-amber-300 flex items-center gap-3 font-mono">
          <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>
            Read-Only Preview: You must log in as a Records Administrator (`@recordsadmin01`) or Cloud Admin (`@globaladmin01`) to modify physician panel assignments.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => {
          const currentDoctor = DOCTORS.find((d) => d.username === patient.assignedDoctorUsername) || DOCTORS[0];
          const selectedDoc = selectedDoctorMap[patient.id] || patient.assignedDoctorUsername;
          const isLoading = loadingMap[patient.id];
          const isSuccess = successMap[patient.id];
          const errorMsg = errorMap[patient.id];

          return (
            <div key={patient.id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-xs">{patient.fullName}</h4>
                  <span className="text-[10px] font-mono text-slate-400">{patient.id} • {patient.dob}</span>
                </div>
                <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {patient.gender} ({patient.age}y)
                </span>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                <p>Current Physician: <span className="text-emerald-400 font-semibold">{patient.primaryCarePhysician}</span></p>
                <p className="font-mono text-[10px] text-slate-500">Handle: @{patient.assignedDoctorUsername}</p>
              </div>

              {isAuthorizedAdmin && (
                <div className="pt-2 border-t border-slate-850 space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Reassign Attending Physician</label>
                  <div className="flex gap-2">
                    <select
                      value={selectedDoc}
                      onChange={(e) => setSelectedDoctorMap((prev) => ({ ...prev, [patient.id]: e.target.value }))}
                      className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-lg p-1.5 text-xs font-mono"
                    >
                      {DOCTORS.map((d) => (
                        <option key={d.username} value={d.username}>
                          {d.name} (@{d.username})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleAssign(patient.id)}
                      disabled={isLoading || selectedDoc === patient.assignedDoctorUsername}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Assign</span>}
                    </button>
                  </div>

                  {isSuccess && (
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <Check className="w-3 h-3" /> Panel reassigned successfully!
                    </div>
                  )}

                  {errorMsg && (
                    <div className="text-[10px] text-rose-400 flex items-center gap-1 font-mono">
                      <AlertCircle className="w-3 h-3" /> {errorMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
