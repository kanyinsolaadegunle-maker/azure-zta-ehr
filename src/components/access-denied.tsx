'use client';

import React from 'react';
import { useSimulation } from './simulation-context';
import { ShieldAlert, Fingerprint, Lock, Shield } from 'lucide-react';

interface AccessDeniedProps {
  resource: string;
  policyTriggered: string;
  failureReason: string;
  requiredAction: 'None' | 'MFA_CHALLENGE' | 'BLOCK';
}

export function AccessDenied({
  resource,
  policyTriggered,
  failureReason,
  requiredAction,
}: AccessDeniedProps) {
  const { triggerMfaChallenge } = useSimulation();

  return (
    <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
      {/* Banner */}
      <div className="bg-red-950/40 p-6 border-b border-slate-800 flex items-center gap-4">
        <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Access Denied by Azure Security</h3>
          <p className="text-xs text-red-300/80 font-mono mt-0.5">MediTrust ZTA Gatekeeper</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs bg-slate-950 p-2.5 rounded border border-slate-850">
            <span className="text-slate-400">Target Container:</span>
            <span className="font-mono text-slate-200 font-semibold">{resource}</span>
          </div>

          <div className="flex justify-between items-center text-xs bg-slate-950 p-2.5 rounded border border-slate-850">
            <span className="text-slate-400">Triggered Policy:</span>
            <span className="font-mono text-red-400 font-semibold">{policyTriggered}</span>
          </div>

          <div className="space-y-1 bg-slate-950/40 p-3 rounded-lg border border-slate-850 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnostics:</span>
            <p className="text-slate-300 mt-1 font-mono leading-relaxed">{failureReason}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 text-center">
          {requiredAction === 'MFA_CHALLENGE' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-factor Authentication (MFA) verification is required before access can be established to this patient segment.
              </p>
              <button
                onClick={triggerMfaChallenge}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
              >
                <Fingerprint className="w-4.5 h-4.5" /> Approve MFA Authentication Prompt
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="inline-flex bg-slate-950 p-3 rounded-full border border-slate-850 text-slate-500 mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your simulated Azure Entra ID group membership lacks sufficient RBAC privileges (e.g. Storage Blob Data Reader/Contributor role on this container), or access has been completely blocked due to High sign-in risk location anomaly.
              </p>
              <p className="text-[10px] text-blue-400 italic">
                Tip: Use the simulator drawer in the bottom right corner to switch to an authorized user (e.g., doctor01 or nurse01) and set Sign-in Risk to Low.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
