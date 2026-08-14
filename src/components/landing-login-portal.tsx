'use client';

import React, { useState } from 'react';
import { useSimulation } from './simulation-context';
import { loginUserAction, verifyMfaCodeAction, requestMfaOtpAction } from '../app/actions';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Building2,
  Shield,
  Activity,
  FileText,
  CreditCard,
  Settings,
  Fingerprint,
  Smartphone,
  ShieldAlert,
  Mail,
  Send,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

// Helper mapping to route users to their designated role dashboard
export function getTargetDashboard(username: string): string {
  const u = username.toLowerCase();
  if (u.startsWith('patient.')) {
    return '/portal/patient';
  }
  if (u === 'doctor01' || u === 'doctor02' || u === 'doctor03' || u === 'nurse01' || u === 'emergency.admin') {
    return '/portal/clinical';
  }
  if (u === 'recordsadmin01') {
    return '/portal/admin';
  }
  if (u === 'itsecurityadmin01' || u === 'auditor01') {
    return '/portal/compliance';
  }
  if (u === 'cloudadmin01') {
    return '/portal/baseline';
  }
  return '/portal/clinical';
}

export function LandingLoginPortal() {
  const { username: currentUsername, mfaCompleted, updateSession, isPending } = useSimulation();
  const router = useRouter();

  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<'password' | 'mfa'>('password');
  const [mfaCode, setMfaCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomEmail, setShowCustomEmail] = useState(false);
  const [dispatchedInfo, setDispatchedInfo] = useState<{
    maskedEmail: string;
    rawEmail: string;
    code?: string;
    mode: string;
    message: string;
  } | null>(null);

  const [authStatus, setAuthStatus] = useState<{
    type: 'idle' | 'success' | 'error' | 'info';
    message: string;
  }>({ type: 'idle', message: '' });

  const isLoggedIn = Boolean(currentUsername) && mfaCompleted;
  const targetDashboard = currentUsername ? getTargetDashboard(currentUsername) : '/portal/clinical';

  // Trigger server email OTP dispatch
  const triggerEmailOtp = async (targetUser: string, overrideEmail?: string) => {
    setIsSendingEmail(true);
    try {
      const result = await requestMfaOtpAction({
        username: targetUser,
        overrideEmail: overrideEmail || (customEmail ? customEmail.trim() : undefined),
      });
      if (result.success) {
        setDispatchedInfo({
          maskedEmail: result.maskedEmail,
          rawEmail: result.rawEmail,
          code: result.code,
          mode: result.mode,
          message: result.message,
        });
        setAuthStatus({
          type: 'info',
          message: `A 6-digit MFA passcode was sent to ${result.maskedEmail}. Check your inbox!`,
        });
      }
    } catch (err: any) {
      console.warn('Error dispatching OTP email:', err);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle Step 1: Username & Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername || !inputPassword) {
      setAuthStatus({
        type: 'error',
        message: 'Please enter both your Hallmark EHR directory username and password to sign in.',
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus({ type: 'idle', message: '' });

    try {
      await loginUserAction(inputUsername, inputPassword, false);
      await updateSession({ username: inputUsername.toLowerCase(), isAuthenticated: true, mfaCompleted: false });
      
      setLoginStep('mfa');
      // Automatically send email OTP to user's registered email
      await triggerEmailOtp(inputUsername);
    } catch (err: any) {
      setAuthStatus({
        type: 'error',
        message: err.message || 'Authentication failed. Please verify your username and password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: MFA Verification Code
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode) {
      setAuthStatus({
        type: 'error',
        message: 'Please enter the 6-digit MFA verification code.',
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus({ type: 'idle', message: '' });

    try {
      const res = await verifyMfaCodeAction(mfaCode, inputUsername);
      if (!res.success) {
        setAuthStatus({
          type: 'error',
          message: res.error || 'Invalid MFA passcode. Please try again.',
        });
        setIsLoading(false);
        return;
      }

      await updateSession({ mfaCompleted: true });
      const destination = getTargetDashboard(inputUsername);
      setAuthStatus({
        type: 'success',
        message: `Multi-Factor Authentication verified successfully! Redirecting to your dashboard...`,
      });

      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 600);
    } catch (err: any) {
      setAuthStatus({
        type: 'error',
        message: err.message || 'MFA verification failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider font-mono px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Hallmark Medical Center Enterprise EHR
              </span>
              <span
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border font-mono ${
                  isLoggedIn
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> {isLoggedIn ? 'Active Session (MFA Verified)' : 'Sign-In Required'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Zero Trust policy engine for EHR access control
            </h2>
            <p className="text-cyan-400 text-xs sm:text-sm font-semibold tracking-wide">
              An independent Zero Trust policy engine for EHR access control, benchmarked against a Microsoft Entra ID baseline configuration.
            </p>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Welcome to Hallmark Medical Center. Authenticate with your Hallmark directory credentials to access your designated role-based clinical, administrative, or cloud security dashboard.
            </p>
          </div>

          {/* Active Session Card */}
          <div className="bg-slate-950/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 flex items-center gap-4 shadow-xl flex-shrink-0 min-w-[280px]">
            <div className={`p-3.5 rounded-2xl text-white shadow-lg ${isLoggedIn ? 'bg-blue-600' : 'bg-slate-800'}`}>
              {isLoggedIn ? <UserCheck className="w-6 h-6" /> : <Lock className="w-6 h-6 text-slate-400" />}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block font-mono">
                {isLoggedIn ? 'LOGGED IN USER' : 'GUEST / UNAUTHENTICATED'}
              </span>
              <p className="text-base font-bold text-white font-mono">
                {isLoggedIn ? `@${currentUsername}` : 'Sign in below'}
              </p>
              {isLoggedIn ? (
                <Link
                  href={targetDashboard}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold font-mono"
                >
                  Proceed to Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="text-xs text-slate-500">Authentication Required</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center Sign In Card & Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sign In Form (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                {loginStep === 'password' ? <KeyRound className="w-4 h-4" /> : <Fingerprint className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">
                  {loginStep === 'password' ? 'User Sign In' : 'Step 2: MFA Verification'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {loginStep === 'password' ? 'Step 1 of 2: Enter Directory Credentials' : 'Enter 6-Digit Authenticator Code'}
                </p>
              </div>
            </div>

            <span className="text-[10px] bg-blue-500/10 text-blue-300 font-mono font-bold px-2.5 py-1 rounded-full border border-blue-500/20">
              {loginStep === 'password' ? 'Step 1 / 2' : 'Step 2 / 2'}
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Feedback Alert */}
            {authStatus.type !== 'idle' && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                  authStatus.type === 'success'
                    ? 'bg-green-950/50 text-green-300 border-green-500/30'
                    : authStatus.type === 'info'
                    ? 'bg-blue-950/50 text-blue-300 border-blue-500/30'
                    : 'bg-red-950/50 text-red-300 border-red-500/30'
                }`}
              >
                {authStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : authStatus.type === 'info' ? (
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className="leading-snug">{authStatus.message}</p>
              </div>
            )}

            {loginStep === 'password' ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl p-3.5 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl p-3.5 text-xs font-mono pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || isPending}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition shadow-xl flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> {isLoading ? 'Verifying Password...' : 'Continue to Step 2 (MFA)'}
                </button>
              </form>
            ) : (
              /* Step 2: MFA Code Form */
              <form onSubmit={handleMfaSubmit} className="space-y-5 animate-fade-in">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold font-mono block">Authenticating User</span>
                      <span className="font-bold text-slate-200 font-mono">@{inputUsername}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep('password');
                      setAuthStatus({ type: 'idle', message: '' });
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline font-mono"
                  >
                    Change user
                  </button>
                </div>

                {/* Server-Side Email MFA Dispatch Status Banner */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/20 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">
                          Dispatched via Server Mail Engine
                        </span>
                        <p className="text-xs font-mono text-slate-200 font-bold">
                          {dispatchedInfo ? dispatchedInfo.maskedEmail : `${inputUsername}@hallmarkmedical.com`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={() => triggerEmailOtp(inputUsername)}
                      className="text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg border border-blue-500/20 font-semibold flex items-center gap-1 transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSendingEmail ? 'animate-spin' : ''}`} />
                      {isSendingEmail ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    A secure 6-digit passcode has been generated by the Hallmark server and sent to your registered clinical email. Valid for 5 minutes.
                  </p>

                  {/* Optional Custom Email Input for live demonstration testing */}
                  <div className="pt-1">
                    {!showCustomEmail ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomEmail(true)}
                        className="text-[10px] text-slate-400 hover:text-blue-300 underline"
                      >
                        + Send to a specific personal/test email address
                      </button>
                    ) : (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="email"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          placeholder="e.g. your.email@example.com"
                          className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          disabled={!customEmail || isSendingEmail}
                          onClick={() => triggerEmailOtp(inputUsername, customEmail)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Send
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* MFA Verification Code Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                      Enter 6-Digit Passcode
                    </label>
                    <button
                      type="button"
                      onClick={() => setMfaCode(dispatchedInfo?.code || '123456')}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono font-bold"
                    >
                      {dispatchedInfo?.code ? `Fill OTP (${dispatchedInfo.code})` : 'Fill Test Code (123456)'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={8}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full bg-slate-950 border border-slate-800 text-emerald-400 rounded-2xl p-3.5 text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition font-bold"
                    />
                  </div>
                </div>

                {/* Submit MFA Button */}
                <button
                  type="submit"
                  disabled={isLoading || isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-2xl text-xs transition shadow-xl flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4" /> {isLoading ? 'Verifying Code...' : 'Verify MFA & Complete Sign-In'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Feature Overview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" /> Hallmark Health Center Module Features
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="bg-emerald-500/10 text-emerald-400 p-2.5 rounded-xl w-fit border border-emerald-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-100 text-sm">Clinical Records</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Access patient charts, vitals, immunizations, prescriptions, and lab diagnostic reports. Restrictable to EHR-Doctors and EHR-Nurses.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="bg-purple-500/10 text-purple-400 p-2.5 rounded-xl w-fit border border-purple-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-100 text-sm">Billing & Administration</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Manage administrative files, patient billing statements, and insurance records reserved for EHR-Records-Admins.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="bg-orange-500/10 text-orange-400 p-2.5 rounded-xl w-fit border border-orange-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-100 text-sm">Compliance & Audit Evidence</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Real-time security audit log monitoring, risk level analytics, and regulatory compliance evidence for EHR-Auditors and IT Security.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="bg-blue-500/10 text-blue-400 p-2.5 rounded-xl w-fit border border-blue-500/20">
                <Settings className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-100 text-sm">Baseline Environment Configuration</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Reference view of the baseline environment configuration and transport security settings, reserved for Cloud Admins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
