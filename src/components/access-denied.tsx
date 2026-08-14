'use client';

import React, { useState } from 'react';
import { useSimulation } from './simulation-context';
import { loginUserAction, verifyMfaCodeAction } from '../app/actions';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Fingerprint, Lock, Shield, LogIn, KeyRound, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';

interface AccessDeniedProps {
  resource: string;
  policyTriggered: string;
  failureReason: string;
  requiredAction: 'None' | 'MFA_CHALLENGE' | 'BLOCK' | 'BREAK_GLASS_JUSTIFICATION' | 'ALLOW';
}

export function AccessDenied({
  resource,
  policyTriggered,
  failureReason,
  requiredAction,
}: AccessDeniedProps) {
  const { triggerMfaChallenge, updateSession, username } = useSimulation();
  const router = useRouter();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [mfaCodeInput, setMfaCodeInput] = useState('');
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthRequired = policyTriggered.includes('Auth Required') || policyTriggered.includes('Identity Governance');

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) return;

    setIsSubmitting(true);
    setAuthStatus(null);

    try {
      await loginUserAction(usernameInput, passwordInput, false);
      await updateSession({ username: usernameInput.toLowerCase(), isAuthenticated: true, mfaCompleted: false });
      setIsMfaStep(true);
      setAuthStatus('Primary authentication successful. Enter your 6-digit MFA code below.');
    } catch (err: any) {
      setAuthStatus(err.message || 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCodeInput) return;

    setIsSubmitting(true);
    setAuthStatus(null);

    try {
      const res = await verifyMfaCodeAction(mfaCodeInput);
      if (!res.success) {
        setAuthStatus(res.error || 'Invalid MFA passcode.');
        setIsSubmitting(false);
        return;
      }

      await updateSession({ mfaCompleted: true });
      router.refresh();
    } catch (err: any) {
      setAuthStatus(err.message || 'MFA verification failed.');
    } finally {
      setIsSubmitting(false);
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
            {isAuthRequired ? 'Authentication Required' : 'Access Denied by Policy Enforcement Point'}
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
            !isMfaStep ? (
              <form onSubmit={handleInlineLogin} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Sign In to Continue</h4>
                </div>

                {authStatus && (
                  <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{authStatus}</span>
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
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <LogIn className="w-4 h-4" /> {isSubmitting ? 'Verifying Password...' : 'Continue to Step 2 (MFA)'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleMfaSubmit} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider">Step 2: Enter MFA Passcode</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMfaCodeInput('123456')}
                    className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-mono font-bold"
                  >
                    Test Code (123456)
                  </button>
                </div>

                {authStatus && (
                  <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>{authStatus}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 block uppercase">6-Digit Code</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={mfaCodeInput}
                    onChange={(e) => setMfaCodeInput(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl p-3 text-center text-base font-mono tracking-widest font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Fingerprint className="w-4 h-4" /> {isSubmitting ? 'Verifying Code...' : 'Submit MFA Code & Unlock Access'}
                </button>
              </form>
            )
          ) : requiredAction === 'MFA_CHALLENGE' ? (
            <form onSubmit={handleMfaSubmit} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">Step-Up MFA Verification Required</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setMfaCodeInput('123456')}
                  className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-mono font-bold"
                >
                  Test Code (123456)
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-Factor Authentication (MFA) step-up verification is required by Policy <span className="font-mono text-yellow-400">{policyTriggered}</span> for account <span className="font-mono text-slate-200 font-bold">@{username || 'user'}</span>.
              </p>

              {authStatus && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{authStatus}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 block uppercase">Enter 6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={mfaCodeInput}
                  onChange={(e) => setMfaCodeInput(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full bg-slate-900 border border-slate-800 text-emerald-400 rounded-xl p-3 text-center text-lg font-mono tracking-widest font-bold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={triggerMfaChallenge}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-3 rounded-xl text-xs transition"
                >
                  Authenticator Prompt
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Fingerprint className="w-4 h-4" /> {isSubmitting ? 'Verifying...' : 'Verify MFA Code'}
                </button>
              </div>
            </form>
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
