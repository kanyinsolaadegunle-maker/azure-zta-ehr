'use client';

import React, { useState } from 'react';
import { useSimulation } from './simulation-context';
import { usePathname } from 'next/navigation';
import {
  Shield,
  ShieldAlert,
  Users,
  Globe,
  Fingerprint,
  Settings,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Key,
} from 'lucide-react';

const mockUsersList = [
  { username: 'doctor01', label: 'Doctor User', meaning: 'Clinical user who requires access to patient records', group: 'EHR-Doctors' },
  { username: 'nurse01', label: 'Nurse User', meaning: 'Clinical user with limited patient-care access', group: 'EHR-Nurses' },
  { username: 'recordsadmin01', label: 'Records Admin User', meaning: 'Administrative user for non-clinical records', group: 'EHR-Records-Admins' },
  { username: 'itsecurityadmin01', label: 'IT Security Admin User', meaning: 'Security monitoring and incident response user', group: 'EHR-IT-Security' },
  { username: 'cloudadmin01', label: 'Cloud Admin User', meaning: 'Cloud resource management user', group: 'EHR-Cloud-Admins' },
  { username: 'vendor01', label: 'Vendor User', meaning: 'Third-party vendor with restricted technical access', group: 'EHR-Vendors' },
  { username: 'auditor01', label: 'Auditor User', meaning: 'Compliance/audit user for reviewing logs and evidence', group: 'EHR-Auditors' },
  { username: 'emergency.admin', label: 'Emergency Admin User', meaning: 'Emergency admin account, excluded from blocking policies', group: 'None (Bypasses CA)' },
];

const locationsList = [
  { name: 'United States', ip: '198.51.100.12', risk: 'Low' },
  { name: 'Nigeria (Meduim Risk IP)', ip: '102.89.2.14', risk: 'Medium' },
  { name: 'Unknown / VPN (High Risk IP)', ip: '185.220.101.5', risk: 'High' },
];

export function SimulationDrawer() {
  const pathname = usePathname();

  const {
    username,
    riskLevel,
    location,
    ipAddress,
    mfaCompleted,
    mfaPromptActive,
    setMfaPromptActive,
    updateSession,
    resetSession,
    isPending,
  } = useSimulation();

  const [isOpen, setIsOpen] = useState(false);

  // Hide simulation drawer completely on landing page ('/')
  if (pathname === '/') {
    return null;
  }


  // Determine active ZTA policies based on settings
  const activePolicies = [];
  if (riskLevel === 'High' && username !== 'emergency.admin') {
    activePolicies.push('CA002 (Block High Risk)');
  }
  if (riskLevel === 'Medium' && !mfaCompleted && username !== 'emergency.admin') {
    activePolicies.push('CA003 (MFA for Medium Risk)');
  }
  if ((username === 'cloudadmin01' || username === 'itsecurityadmin01') && !mfaCompleted) {
    activePolicies.push('CA004 (MFA for Admins)');
  }
  if (username !== 'emergency.admin' && !mfaCompleted) {
    activePolicies.push('CA001 (Require MFA for EHR Users)');
  }

  const handleUserChange = (uName: string) => {
    updateSession({ username: uName });
  };

  const handleRiskChange = (rLevel: 'Low' | 'Medium' | 'High') => {
    // If High risk location, we also sync location
    let loc = location;
    let ip = ipAddress;
    if (rLevel === 'High') {
      loc = 'Unknown / VPN (High Risk IP)';
      ip = '185.220.101.5';
    } else if (rLevel === 'Medium') {
      loc = 'Nigeria (Meduim Risk IP)';
      ip = '102.89.2.14';
    } else {
      loc = 'United States';
      ip = '198.51.100.12';
    }
    updateSession({ riskLevel: rLevel, location: loc, ipAddress: ip });
  };

  const handleLocationChange = (locName: string) => {
    const locObj = locationsList.find((l) => l.name === locName);
    if (locObj) {
      updateSession({
        location: locObj.name,
        ipAddress: locObj.ip,
        riskLevel: locObj.risk as 'Low' | 'Medium' | 'High',
      });
    }
  };

  return (
    <>
      {/* Floating Control Panel Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-full shadow-2xl border border-blue-500/30 transition-all duration-300 transform hover:scale-105"
          >
            <Settings className={`w-5 h-5 text-blue-400 ${isPending ? 'animate-spin' : ''}`} />
            <span className="text-sm font-semibold">ZTA Simulator:</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
              {username}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                riskLevel === 'High' ? 'bg-red-500 animate-ping' : riskLevel === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            />
            <ChevronUp className="w-4 h-4 text-slate-400" />
          </button>
        ) : (
          <div className="w-[380px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500 animate-pulse" />
                <h3 className="font-bold text-sm text-slate-200">ZTA Environment Simulator</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded hover:bg-slate-800"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar">
              {/* Active User */}
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-400" /> Simulated Entra ID User
                </label>
                <select
                  value={username}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  {mockUsersList.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.label} ({u.username})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 italic">
                  {mockUsersList.find((u) => u.username === username)?.meaning}
                </p>
                <div className="flex justify-between items-center text-[10px] bg-slate-950/50 p-1.5 rounded border border-slate-850 mt-1">
                  <span className="text-slate-400">Security Group:</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    {mockUsersList.find((u) => u.username === username)?.group}
                  </span>
                </div>
              </div>

              {/* Location & IP */}
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-400" /> Sign-in Location / IP
                </label>
                <select
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  {locationsList.map((l) => (
                    <option key={l.name} value={l.name}>
                      {l.name} ({l.ip})
                    </option>
                  ))}
                </select>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                  <span>IP: {ipAddress}</span>
                  <span className={riskLevel === 'High' ? 'text-red-400' : riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'}>
                    Location Risk: {riskLevel}
                  </span>
                </div>
              </div>

              {/* Risk Level manual slider */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-blue-400" /> Override Sign-in Risk Level
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleRiskChange(lvl)}
                      className={`px-2 py-1.5 rounded-md text-[10px] font-bold border transition-all ${
                        riskLevel === lvl
                          ? lvl === 'High'
                            ? 'bg-red-500/20 text-red-300 border-red-500'
                            : lvl === 'Medium'
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500'
                            : 'bg-green-500/20 text-green-300 border-green-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {lvl} Risk
                    </button>
                  ))}
                </div>
              </div>

              {/* MFA Toggle */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <Fingerprint className={`w-4 h-4 ${mfaCompleted ? 'text-green-400' : 'text-yellow-400'}`} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">MFA Verification Status</h4>
                    <p className="text-[9px] text-slate-400">Simulate verification challenge completion</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSession({ mfaCompleted: !mfaCompleted })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    mfaCompleted ? 'bg-green-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3 h-3 w-3 transform rounded-full bg-white transition-transform ${
                      mfaCompleted ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Active CA Rules */}
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Triggered CA Policies</span>
                {activePolicies.length > 0 ? (
                  <ul className="space-y-0.5">
                    {activePolicies.map((pol) => (
                      <li key={pol} className="text-[10px] text-yellow-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {pol}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-[10px] text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> No restrictive policies triggered (Bypass/Low Risk)
                  </span>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="bg-slate-950 px-4 py-3 flex gap-2 border-t border-slate-800">
              <button
                onClick={resetSession}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1 border border-slate-850 hover:bg-slate-800 text-slate-300 font-semibold py-1.5 px-3 rounded-lg text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Default
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition text-center"
              >
                Apply Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MFA Challenge Modal Prompt */}
      {mfaPromptActive && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Key className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Microsoft Entra MFA verification</h3>
                <p className="text-xs text-slate-400">Hallmark Medical Center Identity Protection</p>

              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3 bg-blue-950/20 border border-blue-500/20 p-4 rounded-xl">
                <Unlock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-blue-300">Conditional Access Policy Triggered</h4>
                  <p className="text-xs text-slate-300">
                    A secure authentication rule requires verifying your identity to view patient details or system records.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-center py-4 bg-slate-950/50 rounded-xl border border-slate-850">
                <p className="text-xs text-slate-400">Signed in as:</p>
                <p className="text-sm font-bold font-mono text-slate-200">{username}</p>
                <p className="text-[10px] text-slate-500">IP: {ipAddress} | Risk Level: {riskLevel}</p>
              </div>
            </div>
            <div className="bg-slate-950 p-4 flex justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setMfaPromptActive(false)}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition"
              >
                Deny & Cancel
              </button>
              <button
                onClick={() => {
                  updateSession({ mfaCompleted: true });
                  setMfaPromptActive(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                <Fingerprint className="w-4 h-4" /> Approve Microsoft Authenticator
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
