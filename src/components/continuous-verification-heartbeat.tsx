'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkZtaAccessAction, resetSessionAction } from '../app/actions';
import { Activity, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';

interface HeartbeatProps {
  currentUsername: string;
}

export function ContinuousVerificationHeartbeat({ currentUsername }: HeartbeatProps) {
  const router = useRouter();
  const [lastCheckTime, setLastCheckTime] = useState<string>('Just now');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [status, setStatus] = useState<'HEALTHY' | 'DEGRADED' | 'REVOKED'>('HEALTHY');
  const [trustScore, setTrustScore] = useState<number | undefined>(100);
  const [revocationReason, setRevocationReason] = useState<string>('');

  const runVerificationHeartbeat = async () => {
    if (!currentUsername || currentUsername === 'guest') return;
    setIsVerifying(true);
    try {
      // Re-evaluate current active session with PEP
      const result = await checkZtaAccessAction('patient-records', 'Read');
      setTrustScore(result.trustScore);
      setLastCheckTime(new Date().toLocaleTimeString());

      if (!result.accessGranted) {
        if (result.policyId === 'ZTP-02' || result.requiredAction === 'BLOCK') {
          setStatus('REVOKED');
          setRevocationReason(result.failureReason);
          // Revoke session automatically when continuous verification trust drops below threshold
          setTimeout(async () => {
            await resetSessionAction();
            router.push('/portal/login?revoked=true');
          }, 3000);
        } else if (result.requiredAction === 'MFA_CHALLENGE') {
          setStatus('DEGRADED');
        }
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
    // 30-second interval continuous re-evaluation loop (Definitional to Zero Trust Continuous Access Evaluation)
    const interval = setInterval(() => {
      runVerificationHeartbeat();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUsername]);

  if (!currentUsername) return null;

  return (
    <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
      <div className="flex items-center space-x-1.5">
        <Activity className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
        <span className="font-semibold text-slate-200">Continuous Verification:</span>
      </div>

      {status === 'HEALTHY' && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3 mr-1" /> Active ({trustScore ?? 100}/100)
        </span>
      )}

      {status === 'DEGRADED' && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 mr-1" /> Challenge Needed
        </span>
      )}

      {status === 'REVOKED' && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
          <AlertTriangle className="w-3 h-3 mr-1" /> Session Revoked
        </span>
      )}

      <button
        onClick={runVerificationHeartbeat}
        title="Trigger immediate re-evaluation"
        className="text-slate-400 hover:text-cyan-400 transition-colors ml-1"
      >
        <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
      </button>

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
