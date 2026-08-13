'use client';

import React, { useState } from 'react';
import { Search, UserCheck, ShieldAlert, ChevronDown, Check } from 'lucide-react';
import { PatientClinicalRecord } from '../lib/patients-data';

interface PatientSearchSelectorProps {
  patients: PatientClinicalRecord[];
  activePatientId: string;
  onSelectPatient: (patientId: string) => void;
  currentUsername: string;
}

export function PatientSearchSelector({
  patients,
  activePatientId,
  onSelectPatient,
  currentUsername,
}: PatientSearchSelectorProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const cleanUser = (currentUsername || '').replace(/^@+/, '').toLowerCase();

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase().includes(query.toLowerCase()) ||
      p.primaryCarePhysician.toLowerCase().includes(query.toLowerCase())
  );

  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];
  const isAssignedToMe = activePatient?.assignedDoctorUsername === cleanUser;

  return (
    <div className="relative w-full max-w-xl">
      {/* Selector Button / Trigger */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 text-blue-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">{activePatient.fullName}</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {activePatient.id}
              </span>
              {isAssignedToMe ? (
                <span className="text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Panel Assigned
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Unassigned (Restricted)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Attending Physician: <span className="text-slate-200 font-semibold">{activePatient.primaryCarePhysician}</span> (@{activePatient.assignedDoctorUsername})
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold flex items-center space-x-1 transition"
        >
          <span>Search / Switch Patient</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
          <div className="p-3 bg-slate-950 border-b border-slate-800">
            <input
              type="text"
              placeholder="Search patient by name, ID (e.g. PR-2026-00202), or doctor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-2.5 text-xs font-mono focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-850 custom-scrollbar">
            {filteredPatients.map((p) => {
              const isAssigned = p.assignedDoctorUsername === cleanUser;
              const isSelected = p.id === activePatientId;

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPatient(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 text-left flex items-center justify-between hover:bg-slate-800/80 transition ${
                    isSelected ? 'bg-slate-800/50' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100">{p.fullName}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                        {p.id}
                      </span>
                      {isAssigned ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 rounded font-semibold">
                          Assigned
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-950 text-slate-500 border border-slate-800 px-1.5 rounded">
                          Unassigned
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Attending: {p.primaryCarePhysician} (@{p.assignedDoctorUsername})
                    </p>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              );
            })}

            {filteredPatients.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs font-mono">
                No matching patients found in database directory.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
