'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifySessionTrustAction, resetSessionAction, verifyMfaCodeAction, requestMfaOtpAction } from '../app/actions';
import { useSimulation } from './simulation-context';
import { Activity, ShieldCheck, AlertTriangle, RefreshCw, Fingerprint, Clock, Lock, Mail } from 'lucide-react';

interface HeartbeatProps {
  currentUsername: string;
}

export function ContinuousVerificationHeartbeat({ currentUsername }: HeartbeatProps) {
  const router = useRouter();
  const { username: simUsername, updateSession } = useSimulation();
  const activeUser = simUsername || currentUsername;

  const [lastCheckTime, setLastCheckTime] = useState<string>('Just now');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [status, setStatus] = useState<'HEALTHY' | 'DEGRADED' | 'REVOKED' | 'EXPIRED'>('HEALTHY');
  const [trustScore, setTrustScore] = useState<number | undefined>(100);
  const [sessionAgeSeconds, setSessionAgeSeconds] = useState<number>(0);
  const [revocationReason, setRevocationReason] = useState<string>('');
  const [mfaInputCode, setMfaInputCode] = useState<string>('');
  const [mfaError, setMfaError] = useState<string>('');
  const [isSubmittingMfa, setIsSubmittingMfa] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [heartbeatOtp, setHeartbeatOtp] = useState<{
    maskedEmail: string;
    code?: string;
  } | null>(null);

  const runVerificationHeartbeat = async () => {
    if (!activeUser || activeUser === 'guest') return;
    setIsVerifying(true);
    try {
      const result = await verifySessionTrustAction();
      setTrustScore(result.trustScore);
      if (result.sessionAgeSeconds !== undefined) {
        setSessionAgeSeconds(result.sessionAgeSeconds);
      }
      setLastCheckTime(new Date().toLocaleTimeString());

      if (result.policyId === 'ZTP-06' || (result.sessionAgeSeconds !== undefined && result.sessionAgeSeconds >= 90)) {
        setStatus('EXPIRED');
        setRevocationReason(
          `Session age (${result.sessionAgeSeconds || 90}s) reached the 90-second Zero Trust continuous re-authentication limit (Policy ZTP-06). Re-authentication is required.`
        );
      } else if (!result.valid) {
        setStatus('REVOKED');
        setRevocationReason(`Continuous Trust Revocation (${result.policyId || 'ZTP-02'}). Trust score dropped below acceptable policy threshold.`);
        setTimeout(async () => {
          await resetSessionAction();
          router.push('/portal/login?revoked=true');
        }, 3000);
      } else if (result.trustScore !== undefined && result.trustScore < 80) {
        setStatus('DEGRADED');
      } else {
        setStatus('HEALTHY');
      }
    } catch (err) {
      console.error('Continuous Verification Heartbeat Error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    runVerificationHeartbeat();
    // 5-second tick interval for continuous evaluation and 90s session countdown
    const interval = setInterval(() => {
      setSessionAgeSeconds((prev) => prev + 5);
      runVerificationHeartbeat();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeUser]);

  const triggerHeartbeatEmailOtp = async () => {
    if (!activeUser || activeUser === 'guest') return;
    setIsSendingEmail(true);
    try {
      const res = await requestMfaOtpAction({ username: activeUser });
      if (res.success) {
        setHeartbeatOtp({
          maskedEmail: res.maskedEmail,
          code: res.code,
        });
      }
    } catch (err) {
      console.warn('Error sending heartbeat MFA email:', err);
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    if (status === 'EXPIRED') {
      triggerHeartbeatEmailOtp();
    }
  }, [status]);

  const handleReauthMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError('');
    setIsSubmittingMfa(true);

    try {
      const code = mfaInputCode || heartbeatOtp?.code || '123456';
      const res = await verifyMfaCodeAction(code, activeUser);
      if (!res.success) {
        setMfaError(res.error || 'Invalid MFA passcode.');
        return;
      }

      await updateSession({ mfaCompleted: true });
      setStatus('HEALTHY');
      setSessionAgeSeconds(0);
      setMfaInputCode('');
      router.refresh();
    } catch (err: any) {
      setMfaError(err.message || 'MFA verification failed.');
    } finally {
      setIsSubmittingMfa(false);
    }
  };

  if (!activeUser) return null;

  const secondsRemaining = Math.max(0, 90 - sessionAgeSeconds);

  return (
    <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
      <div className="flex items-center space-x-1.5">
        <Activity className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : 'text-emerald-400'}`} />
        <span className="font-semibold text-slate-200">Continuous Verification:</span>
      </div>

      {status === 'HEALTHY' && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3 mr-1" /> Active ({trustScore ?? 100}/100) • Re-auth: {secondsRemaining}s
        </span>
      )}

      {status === 'DEGRADED' && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 mr-1" /> Challenge Needed ({trustScore}/100)
        </span>
      )}

      {(status === 'EXPIRED' || status === 'REVOKED') && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
          <Lock className="w-3 h-3 mr-1" /> Re-Auth Required (90s Limit)
        </span>
      )}

      <button
        onClick={runVerificationHeartbeat}
        title="Trigger immediate re-evaluation"
        className="text-slate-400 hover:text-cyan-400 transition-colors ml-1"
      >
        <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
      </button>

      {/* 90-Second Continuous Verification Re-Authentication Modal */}
      {status === 'EXPIRED' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-yellow-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center text-yellow-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">90-Second Session Re-Authentication</h3>
                <p className="text-xs text-slate-400">Zero Trust Policy ZTP-06 (Continuous Access Evaluation)</p>
              </div>
            </div>

            {/* Email Dispatch Card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-300 block">Passcode Sent to Email</span>
                  <span className="text-xs font-mono text-slate-200 font-bold">{heartbeatOtp?.maskedEmail || `${activeUser}@hallmarkmedical.com`}</span>
                </div>
              </div>
              <button
                type="button"
                disabled={isSendingEmail}
                onClick={triggerHeartbeatEmailOtp}
                className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 font-semibold flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3 h-3 ${isSendingEmail ? 'animate-spin' : ''}`} />
                {isSendingEmail ? 'Sending...' : 'Resend'}
              </button>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono leading-relaxed">
              @{activeUser}: Session reached the <span className="text-yellow-400 font-bold">90s Zero Trust continuous limit</span>. Enter the 6-digit code sent to your email to renew access.
            </p>

            <form onSubmit={handleReauthMfaSubmit} className="space-y-4">
              {mfaError && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300">
                  {mfaError}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    6-Digit Passcode
                  </label>
                  <button
                    type="button"
                    onClick={() => setMfaInputCode(heartbeatOtp?.code || '123456')}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-bold"
                  >
                    {heartbeatOtp?.code ? `Fill OTP (${heartbeatOtp.code})` : 'Fill Test Code (123456)'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={8}
                  value={mfaInputCode}
                  onChange={(e) => setMfaInputCode(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-950 border border-slate-850 text-emerald-400 rounded-xl p-3 text-center text-lg font-mono tracking-widest font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingMfa}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Fingerprint className="w-4 h-4" /> {isSubmittingMfa ? 'Verifying Code...' : 'Verify MFA & Renew 90s Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Revocation Modal for High Risk Blocks */}
      {status === 'REVOKED' && revocationReason && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Continuous Verification Session Revocation</h3>
            <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 text-left">
              {revocationReason}
            </p>
            <p className="text-xs text-slate-400">
              Zero Trust Policy Engine continuously monitors context signals. Your session trust score degraded below the minimum baseline requirement. Redirecting to sign-in portal...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
