'use client';

import React, { useState } from 'react';
import { useSimulation } from './simulation-context';
import { loginUserAction } from '../app/actions';
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
} from 'lucide-react';
import Link from 'next/link';

// Helper mapping to route users to their designated role dashboard
export function getTargetDashboard(username: string): string {
  const u = username.toLowerCase();
  if (u === 'doctor01' || u === 'nurse01' || u === 'emergency.admin') {
    return '/portal/clinical';
  }
  if (u === 'recordsadmin01') {
    return '/portal/admin';
  }
  if (u === 'itsecurityadmin01' || u === 'auditor01') {
    return '/portal/compliance';
  }
  if (u === 'cloudadmin01') {
    return '/portal/azure';
  }
  return '/portal/clinical';
}

export function LandingLoginPortal() {
  const { username: currentUsername, updateSession, isPending } = useSimulation();
  const router = useRouter();

  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const isLoggedIn = Boolean(currentUsername);
  const targetDashboard = currentUsername ? getTargetDashboard(currentUsername) : '/portal/clinical';

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername || !inputPassword) {
      setAuthStatus({
        type: 'error',
        message: 'Please enter both your Entra ID username and password to sign in.',
      });
      return;
    }

    setIsLoading(true);
    setAuthStatus({ type: 'idle', message: '' });

    try {
      await loginUserAction(inputUsername, inputPassword);
      await updateSession({ username: inputUsername.toLowerCase(), mfaCompleted: true, isAuthenticated: true });
      
      const destination = getTargetDashboard(inputUsername);
      setAuthStatus({
        type: 'success',
        message: `Signed in successfully as @${inputUsername}! Redirecting to your dashboard...`,
      });

      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 600);
    } catch (err: any) {
      setAuthStatus({
        type: 'error',
        message: err.message || 'Authentication failed. Please verify your username and password.',
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
                <Building2 className="w-3.5 h-3.5" /> Hallmark Health Center Enterprise EHR
              </span>
              <span
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border font-mono ${
                  isLoggedIn
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> {isLoggedIn ? 'Active Session' : 'Sign-In Required'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Azure Zero Trust EHR System & Access Control
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Welcome to Hallmark Health Center. Authenticate with your Microsoft Entra ID credentials to access your designated role-based clinical, administrative, or cloud security dashboard.
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
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100">User Sign In</h3>
                <p className="text-[11px] text-slate-400">Enter Entra ID Credentials</p>
              </div>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-300 font-mono font-bold px-2.5 py-1 rounded-full border border-blue-500/20">
              Zero Trust Auth
            </span>
          </div>

          <form onSubmit={handleManualLogin} className="p-6 space-y-5">
            {/* Feedback Alert */}
            {authStatus.type !== 'idle' && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                  authStatus.type === 'success'
                    ? 'bg-green-950/50 text-green-300 border-green-500/30'
                    : 'bg-red-950/50 text-red-300 border-red-500/30'
                }`}
              >
                {authStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className="leading-snug">{authStatus.message}</p>
              </div>
            )}

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
              <LogIn className="w-4 h-4" /> {isLoading ? 'Authenticating...' : 'Sign In to Hallmark EHR'}
            </button>
          </form>
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
              <h4 className="font-bold text-slate-100 text-sm">Azure Cloud Configuration</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Configure TLS 1.2 minimum encryption, storage account policies, and budget thresholds reserved for Cloud Admins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
