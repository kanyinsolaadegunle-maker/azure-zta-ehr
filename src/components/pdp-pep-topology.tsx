'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Database,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Users,
  Server,
  Zap,
} from 'lucide-react';

export function PdpPepTopologyCard() {
  const [activeStep, setActiveStep] = useState<'PIP' | 'PDP' | 'PEP' | 'PAP'>('PDP');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-mono font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>NIST SP 800-207 ARCHITECTURE TOPOLOGY</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Policy Decision Point (PDP) & Policy Enforcement Point (PEP) Engine
          </h2>
          <p className="text-slate-400 text-xs">
            Interactive logical component mapping for Zero Trust EHR access control
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            PDP Status: Active (0.72ms Latency)
          </span>
        </div>
      </div>

      {/* Topology Pipeline Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {/* Step 1: PIP (Policy Information Point) */}
        <div
          onClick={() => setActiveStep('PIP')}
          className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
            activeStep === 'PIP'
              ? 'bg-slate-950 border-cyan-500/50 ring-2 ring-cyan-500/20 shadow-lg'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              PIP (Information Point)
            </span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">Context Telemetry</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Feeds 8 live contextual signals (Risk Level, IP Location, Device Posture, Session Age, Travel Speed).
          </p>
          <div className="text-[10px] font-mono text-slate-500">
            Source: <span className="text-slate-300">`src/lib/session.ts`</span>
          </div>
        </div>

        {/* Step 2: PDP (Policy Decision Point) */}
        <div
          onClick={() => setActiveStep('PDP')}
          className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
            activeStep === 'PDP'
              ? 'bg-slate-950 border-indigo-500/50 ring-2 ring-indigo-500/20 shadow-lg'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              PDP (Decision Point)
            </span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">Trust Scoring & Policy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Computes dynamic 0-100 score and evaluates ZTP-01 to ZTP-05 rules (Allow / Block / Challenge).
          </p>
          <div className="text-[10px] font-mono text-slate-500">
            Engine: <span className="text-slate-300">`src/lib/zta-engine.ts`</span>
          </div>
        </div>

        {/* Step 3: PEP (Policy Enforcement Point) */}
        <div
          onClick={() => setActiveStep('PEP')}
          className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
            activeStep === 'PEP'
              ? 'bg-slate-950 border-emerald-500/50 ring-2 ring-emerald-500/20 shadow-lg'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              PEP (Enforcement Point)
            </span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">Resource Gatekeeper</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Intercepts requests & enforces isolation for patient-records, admin-records, and audit-evidence.
          </p>
          <div className="text-[10px] font-mono text-slate-500">
            Actions: <span className="text-slate-300">`src/app/actions.ts`</span>
          </div>
        </div>

        {/* Step 4: PAP (Policy Administration Point) */}
        <div
          onClick={() => setActiveStep('PAP')}
          className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
            activeStep === 'PAP'
              ? 'bg-slate-950 border-purple-500/50 ring-2 ring-purple-500/20 shadow-lg'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              PAP (Administration)
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">Control & Compliance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Security control plane managing baseline settings, break-glass rules, and audit trails.
          </p>
          <div className="text-[10px] font-mono text-slate-500">
            Control: <span className="text-slate-300">`/portal/baseline`</span>
          </div>
        </div>
      </div>

      {/* Active Component Deep Dive Detail */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h4 className="font-bold text-sm text-slate-200">
            {activeStep === 'PIP' && 'PIP (Policy Information Point) Technical Specification'}
            {activeStep === 'PDP' && 'PDP (Policy Decision Point) Technical Specification'}
            {activeStep === 'PEP' && 'PEP (Policy Enforcement Point) Technical Specification'}
            {activeStep === 'PAP' && 'PAP (Policy Administration Point) Technical Specification'}
          </h4>
        </div>

        <p className="text-xs text-slate-300 font-mono leading-relaxed">
          {activeStep === 'PIP' &&
            'Retrieves live risk telemetry from Entra ID federated sign-in signals, client IP geolocation lookup, endpoint compliance flags, session age timestamp, and rostered duty hours. Encapsulated in SessionContext and passed directly to evaluateZtaAccess().'}
          {activeStep === 'PDP' &&
            'The core decision engine inside src/lib/zta-engine.ts & src/lib/trust-algorithm.ts. Calculates a dynamic numerical trust score (0-100) from weighted context signals, maps derived risk levels (Low >=80, Medium 50-79, High <50), and executes policy rules ZTP-01 (MFA), ZTP-02 (Risk Block), ZTP-03 (Step-Up MFA), ZTP-04 (Admin MFA), and ZTP-05 (Break-Glass Override).'}
          {activeStep === 'PEP' &&
            'The enforcement boundary inside Server Actions (src/app/actions.ts) and Next.js portal page guards. Intercepts incoming user requests before database operations occur, invokes checkZtaAccessAction(), and rejects unauthorized requests with a standardized ZtaEvaluationResult decision.'}
          {activeStep === 'PAP' &&
            'The administrative interface located at /portal/baseline and /portal/compliance. Allows security administrators to manage system settings, inspect audit log evidence, review trust score weight journal records, and monitor blast radius reduction metrics.'}
        </p>
      </div>
    </div>
  );
}
