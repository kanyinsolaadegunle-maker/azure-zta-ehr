'use client';

import React, { useState } from 'react';
import { useSimulation } from './simulation-context';
import { loginUserAction } from '../app/actions';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Fingerprint, Lock, Shield, LogIn, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

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
  const { triggerMfaChallenge, updateSession } = useSimulation();
  const router = useRouter();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [inlineAuthStatus, setInlineAuthStatus] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthRequired = policyTriggered.includes('Auth Required') || policyTriggered.includes('Identity Governance');




  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) return;

    setIsLoggingIn(true);
    setInlineAuthStatus(null);

    try {
      await loginUserAction(usernameInput, passwordInput);
      await updateSession({ username: usernameInput.toLowerCase(), mfaCompleted: true, isAuthenticated: true });
      router.refresh();
    } catch (err: any) {
      setInlineAuthStatus(err.message || 'Invalid username or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
      {/* Banner */}
      <div className={`p-6 border-b border-slate-800 flex items-center gap-4 ${
        isAuthRequired ? 'bg-blue-950/40' : 'bg-red-950/40'
      }`}>
        <div className={`p-3 rounded-2xl border ${
          isAuthRequired ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {isAuthRequired ? <KeyRound className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">
            {isAuthRequired ? 'Authentication Required' : 'Access Denied by Azure Security'}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Hallmark Medical Center ZTA Gatekeeper</p>

        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Diagnostics Info */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs bg-slate-950 p-3 rounded-xl border border-slate-850">
            <span className="text-slate-400">Target Container:</span>
            <span className="font-mono text-slate-200 font-semibold">{resource}</span>
          </div>

          <div className="flex justify-between items-center text-xs bg-slate-950 p-3 rounded-xl border border-slate-850">
            <span className="text-slate-400">Triggered Policy:</span>
            <span className={`font-mono font-semibold ${isAuthRequired ? 'text-blue-400' : 'text-red-400'}`}>
              {policyTriggered}
            </span>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnostics:</span>
            <p className="text-slate-300 mt-1 font-mono leading-relaxed">{failureReason}</p>
          </div>
        </div>

        {/* Action Content */}
        <div className="pt-2">
          {isAuthRequired ? (
            /* Inline Sign-In Form */
            <form onSubmit={handleInlineLogin} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">Sign In to Continue</h4>
              </div>

              {inlineAuthStatus && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{inlineAuthStatus}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block uppercase">Username</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-3 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl p-3 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
              >
                <LogIn className="w-4 h-4" /> {isLoggingIn ? 'Signing In...' : 'Sign In & Access EHR Module'}
              </button>
            </form>
          ) : requiredAction === 'MFA_CHALLENGE' ? (
            <div className="space-y-4 text-center">
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-factor Authentication (MFA) verification is required before access can be established to this container.
              </p>
              <button
                onClick={triggerMfaChallenge}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-lg"
              >
                <Fingerprint className="w-4.5 h-4.5" /> Approve MFA Authentication Prompt
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-center">
              <div className="inline-flex bg-slate-950 p-3 rounded-full border border-slate-850 text-slate-500 mb-1">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your current account group membership lacks sufficient Azure RBAC privileges (e.g. Storage Blob Data Reader/Contributor role on this container), or access is blocked by a Conditional Access Policy (e.g. High Risk Sign-in).
              </p>

              <div className="pt-2">
                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-lg"
                >
                  <Shield className="w-4 h-4" /> Return to Home & Sign In as Authorized User
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
