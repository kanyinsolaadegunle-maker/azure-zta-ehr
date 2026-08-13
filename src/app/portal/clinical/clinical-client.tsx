'use client';

import React, { useState } from 'react';
import { PatientClinicalRecord } from '../../../lib/patients-data';
import { PatientSearchSelector } from '../../../components/patient-search-selector';
import { PrescriptionForm } from '../../../components/prescription-form';
import { PrescriptionItemActions } from '../../../components/prescription-item-actions';
import {
  UpdateVitalsModal,
  AddAllergyModal,
  AddImmunizationModal,
  AddLabReportModal,
} from '../../../components/clinical-record-modals';
import { SignOutButton } from '../../../components/signout-button';
import { AccessDenied } from '../../../components/access-denied';
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
  Plus,
} from 'lucide-react';

interface ClinicalClientProps {
  patients: PatientClinicalRecord[];
  currentUsername: string;
  isDoctor: boolean;
  roleType: string;
  inMemoryRxList: any[];
}

export function ClinicalClient({
  patients,
  currentUsername,
  isDoctor,
  roleType,
  inMemoryRxList,
}: ClinicalClientProps) {
  const [activePatientId, setActivePatientId] = useState(patients[0]?.id || 'PR-2024-00142');
  const [breakGlassJustified, setBreakGlassJustified] = useState(false);

  // Modal states for updating patient clinical records
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showImmunizationModal, setShowImmunizationModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);

  const cleanUser = (currentUsername || '').replace(/^@+/, '').toLowerCase();
  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];

  // ZTP-SCOPE-CONTAINMENT Check:
  // Is this doctor assigned to this patient?
  const isAssignedDoctor =
    activePatient.assignedDoctorUsername === cleanUser ||
    cleanUser === 'globaladmin01' ||
    cleanUser === 'emergency.admin';

  // If doctor is accessing an unassigned patient AND has not invoked break-glass:
  const isScopeBlocked = isDoctor && !isAssignedDoctor && !breakGlassJustified;

  const latestVital = activePatient.vitals?.[0];
  const primaryLabReport = activePatient.labResults?.[0];
  const labValues = primaryLabReport?.values || [];
  const allergiesList = activePatient.allergies || [];
  const immunizationsList = activePatient.immunizations || [];

  // Merge in-memory prescriptions with static/DB prescriptions
  const patientInMemoryRx = inMemoryRxList.filter((rx) => rx.patientId === activePatient.id);
  const existingIds = new Set(patientInMemoryRx.map((rx) => rx.id));
  const prescriptionsList = [
    ...patientInMemoryRx,
    ...(activePatient.prescriptions || []).filter((rx) => !existingIds.has(rx.id)),
  ];

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-emerald-950/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Clinical Patient File</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Simulated secure EHR Clinical Records Viewer (`patient-records` container)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 text-emerald-400">
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

      {/* Patient Search & Panel Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <PatientSearchSelector
          patients={patients}
          activePatientId={activePatientId}
          onSelectPatient={(id) => {
            setActivePatientId(id);
            setBreakGlassJustified(false);
          }}
          currentUsername={currentUsername}
        />

        {isScopeBlocked && (
          <div className="bg-amber-950/60 border border-amber-500/30 px-4 py-2.5 rounded-2xl text-xs text-amber-300 flex items-center gap-2 font-mono shadow-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>ZTP-SCOPE-CONTAINMENT: Patient unassigned to @{cleanUser}</span>
          </div>
        )}
      </div>

      {/* If scope is blocked, render AccessDenied card requiring Break-Glass */}
      {isScopeBlocked ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-2xl mx-auto space-y-6 text-center shadow-2xl">
          <AccessDenied
            resource="patient-records"
            policyTriggered="ZTP-SCOPE-CONTAINMENT - Unassigned Patient Scope Block"
            failureReason={`Patient ${activePatient.fullName} (${activePatient.id}) is assigned to @${activePatient.assignedDoctorUsername}. Access to unassigned patient files requires mandatory emergency break-glass audit override.`}
            requiredAction="BREAK_GLASS_JUSTIFICATION"
          />

          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-400 mb-3">
              If this is a clinical emergency, you may override scope containment by providing an audit justification:
            </p>
            <button
              onClick={() => setBreakGlassJustified(true)}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg transition"
            >
              Unlock Emergency Break-Glass Access for {activePatient.fullName}
            </button>
          </div>
        </div>
      ) : (
        /* Patient File Dashboard */
        <div className="space-y-6">
          {/* Patient Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Patient Name</span>
              <span className="font-bold text-slate-200 text-sm mt-0.5 block">{activePatient.fullName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">DOB / Age</span>
              <span className="font-semibold text-slate-300 mt-0.5 block">{activePatient.dob} ({activePatient.age} yrs)</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Blood Type / Gender</span>
              <span className="font-semibold text-slate-300 mt-0.5 block">{activePatient.bloodType} • {activePatient.gender}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Attending Physician</span>
              <span className="font-semibold text-emerald-400 mt-0.5 block">{activePatient.primaryCarePhysician}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Vitals, Allergies, Immunizations */}
            <div className="space-y-6 lg:col-span-1">
              {/* Vitals Signs */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-500" /> Vital Signs
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Last: {latestVital?.recordedDate || 'N/A'}</span>
                    {isDoctor && (
                      <button
                        onClick={() => setShowVitalsModal(true)}
                        className="px-2 py-0.5 rounded bg-red-600/20 hover:bg-red-600/40 text-red-300 font-bold text-[10px] border border-red-500/30 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Update Vitals
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <p className="text-slate-500 font-bold">BP</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.bloodPressure || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <p className="text-slate-500 font-bold">Heart Rate</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.heartRate ? `${latestVital.heartRate} bpm` : 'N/A'}</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <p className="text-slate-500 font-bold">Temperature</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.temperature || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <p className="text-slate-500 font-bold">O2 Saturation</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{latestVital?.oxygenSaturation ? `${latestVital.oxygenSaturation}%` : 'N/A'}</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <p className="text-slate-500 font-bold">Height</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">{latestVital?.height || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <p className="text-slate-500 font-bold">Weight / BMI</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">{latestVital?.weight || 'N/A'} ({latestVital?.bmi || 'N/A'})</p>
                  </div>
                </div>
              </div>

              {/* Allergies on File */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Droplet className="w-4 h-4 text-orange-400" /> Allergies
                  </span>
                  {isDoctor && (
                    <button
                      onClick={() => setShowAllergyModal(true)}
                      className="px-2 py-0.5 rounded bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 font-bold text-[10px] border border-orange-500/30 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Allergy
                    </button>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  {allergiesList.length > 0 ? (
                    allergiesList.map((alg: any) => (
                      <div key={alg.id} className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-start gap-2.5 text-xs">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-200">{alg.allergen}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">Reaction: {alg.reaction}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic p-2">No known drug allergies (NKDA).</p>
                  )}
                </div>
              </div>

              {/* Immunizations */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" /> Immunizations
                  </span>
                  {isDoctor && (
                    <button
                      onClick={() => setShowImmunizationModal(true)}
                      className="px-2 py-0.5 rounded bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 font-bold text-[10px] border border-teal-500/30 flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Vaccine
                    </button>
                  )}
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
                      {immunizationsList.map((imm: any) => (
                        <tr key={imm.id} className="text-slate-300">
                          <td className="py-2">{imm.vaccine}</td>
                          <td className="py-2 text-right font-mono text-slate-400">{imm.dateAdministered}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Labs & Prescriptions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Lab Reports */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Laboratory Reports
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Report ID: {primaryLabReport?.id || 'N/A'}</span>
                    {isDoctor && (
                      <button
                        onClick={() => setShowLabModal(true)}
                        className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Record Lab Result
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex flex-wrap gap-4 text-xs bg-slate-950 p-3 rounded-lg border border-slate-850">
                    <div>
                      <span className="text-slate-500 font-bold">Ordered Date:</span>{' '}
                      <span className="text-slate-300 font-mono">{primaryLabReport?.dateOrdered || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">Reported Date:</span>{' '}
                      <span className="text-slate-300 font-mono">{primaryLabReport?.dateReported || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold">Facility:</span>{' '}
                      <span className="text-slate-300">{primaryLabReport?.labFacility || 'N/A'}</span>
                    </div>
                  </div>

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
                        {labValues.map((v: any) => (
                          <tr key={v.id} className="hover:bg-slate-850/40">
                            <td className="p-3">
                              <span className="text-[10px] text-slate-500 block uppercase tracking-wide font-mono">{v.panelName}</span>
                              <span className="font-semibold text-slate-200 mt-0.5 block">{v.testName}</span>
                            </td>
                            <td className="p-3 text-center font-semibold font-mono text-slate-100">{v.resultValue}</td>
                            <td className="p-3 text-center font-mono text-slate-400">{v.referenceRange}</td>
                            <td className="p-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.flag === 'HIGH' ? 'bg-red-500/20 text-red-300 border border-red-500/25' : 'bg-slate-950 text-slate-400 border border-slate-850'}`}>
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
                      <span className="font-bold text-slate-200">Pathologist Interpretive Comments:</span>
                      <p className="text-slate-300 mt-1 italic leading-relaxed">"{primaryLabReport.comments}"</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-slate-850">
                        <span>Verified By: {primaryLabReport.verifiedBy}</span>
                        <span>Signature: {primaryLabReport.signature}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Prescriptions Header & List */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" /> Prescription Records
                  </span>
                  
                  {isDoctor ? (
                    <PrescriptionForm patientId={activePatient.id} />
                  ) : (
                    <span className="text-[10px] bg-slate-950 border border-slate-850 text-slate-400 px-2.5 py-1 rounded-lg">
                      Read-Only (Requires EHR-Doctors Group to Prescribe)
                    </span>
                  )}
                </div>
                
                <div className="p-4 space-y-4">
                  {prescriptionsList.map((rx: any) => (
                    <div key={rx.id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 hover:border-slate-800 transition space-y-4">
                      <div className="flex flex-wrap justify-between items-center border-b border-slate-850 pb-2 text-xs gap-2">
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
                        {isDoctor && (
                          <PrescriptionItemActions
                            rxId={rx.id}
                            currentStatus={rx.status}
                            currentMedication={rx.items?.[0]?.medication || ''}
                            currentStrength={rx.items?.[0]?.strength || ''}
                            currentDose={rx.items?.[0]?.dose || ''}
                            currentFrequency={rx.items?.[0]?.frequency || ''}
                            currentInstructions={rx.items?.[0]?.specialInstructions || ''}
                            isDoctor={isDoctor}
                          />
                        )}
                      </div>

                      <div className="space-y-3">
                        {(rx.items || []).map((item: any) => (
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

                      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-850 pt-2 font-mono">
                        <span>Pharmacy: {rx.dispensedBy}</span>
                        <span>Signed By: {rx.issuingPhysician}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Modals for Clinical Record Updates */}
      <UpdateVitalsModal
        patientId={activePatient.id}
        currentVitals={latestVital}
        isOpen={showVitalsModal}
        onClose={() => setShowVitalsModal(false)}
        onSuccess={() => {}}
      />

      <AddAllergyModal
        patientId={activePatient.id}
        isOpen={showAllergyModal}
        onClose={() => setShowAllergyModal(false)}
        onSuccess={() => {}}
      />

      <AddImmunizationModal
        patientId={activePatient.id}
        isOpen={showImmunizationModal}
        onClose={() => setShowImmunizationModal(false)}
        onSuccess={() => {}}
      />

      <AddLabReportModal
        patientId={activePatient.id}
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
