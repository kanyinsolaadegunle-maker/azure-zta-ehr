'use client';

import React, { useState } from 'react';
import { useSimulation } from './simulation-context';
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
  Users,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

const accounts = [
  {
    username: 'doctor01',
    password: 'DoctorPass2026!',
    displayName: 'Dr. User',
    group: 'EHR-Doctors',
    roleCategory: 'Clinical Doctor',
    accessSummary: 'Read & Write on patient-records',
    isSuperAdmin: false,
  },
  {
    username: 'nurse01',
    password: 'NursePass2026!',
    displayName: 'Nurse User',
    group: 'EHR-Nurses',
    roleCategory: 'Clinical Nurse',
    accessSummary: 'Read-Only on patient-records',
    isSuperAdmin: false,
  },
  {
    username: 'recordsadmin01',
    password: 'RecordsAdmin2026!',
    displayName: 'Records Admin User',
    group: 'EHR-Records-Admins',
    roleCategory: 'Records Administrator',
    accessSummary: 'Read & Write on admin-records',
    isSuperAdmin: false,
  },
  {
    username: 'itsecurityadmin01',
    password: 'SecurityAdmin2026#',
    displayName: 'IT Security Admin',
    group: 'EHR-IT-Security',
    roleCategory: 'IT Security Super Admin',
    accessSummary: 'Full audit evidence & log monitoring',
    isSuperAdmin: true,
  },
  {
    username: 'cloudadmin01',
    password: 'CloudAdmin2026#',
    displayName: 'Cloud Administrator',
    group: 'EHR-Cloud-Admins',
    roleCategory: 'Azure Infrastructure Super Admin',
    accessSummary: 'Full Azure cloud control plane & storage config',
    isSuperAdmin: true,
  },
  {
    username: 'vendor01',
    password: 'VendorPass2026!',
    displayName: 'Vendor User',
    group: 'EHR-Vendors',
    roleCategory: 'Third-Party Vendor',
    accessSummary: 'Restricted technical scope (Blocked from EHR)',
    isSuperAdmin: false,
  },
  {
    username: 'auditor01',
    password: 'AuditorPass2026!',
    displayName: 'Auditor User',
    group: 'EHR-Auditors',
    roleCategory: 'Compliance Auditor',
    accessSummary: 'Read-Only access to audit evidence & logs',
    isSuperAdmin: false,
  },
  {
    username: 'emergency.admin',
    password: 'BreakGlass#SuperAdmin2026',
    displayName: 'Emergency Super Admin',
    group: 'Break-glass Bypass',
    roleCategory: 'Break-glass Emergency Super Admin',
    accessSummary: 'Full emergency bypass for system outages',
    isSuperAdmin: true,
  },
];

export function LandingLoginPortal() {
  const { username: currentUsername, updateSession, isPending } = useSimulation();

  const [inputUsername, setInputUsername] = useState('doctor01');
  const [inputPassword, setInputPassword] = useState('DoctorPass2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const isLoggedIn = Boolean(currentUsername);
  const activeAccount = accounts.find((a) => a.username === currentUsername);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername || !inputPassword) {
      setAuthStatus({
        type: 'error',
        message: 'Please enter both your Entra ID username and assigned password to sign in.',
      });
      return;
    }

    const matched = accounts.find(
      (a) => a.username.toLowerCase() === inputUsername.toLowerCase() && a.password === inputPassword
    );

    if (matched) {
      updateSession({ username: matched.username, mfaCompleted: true, isAuthenticated: true });
      setAuthStatus({
        type: 'success',
        message: `Authenticated successfully as ${matched.displayName} (@${matched.username})! You can now access your EHR role dashboard.`,
      });
    } else {
      const userExists = accounts.find((a) => a.username.toLowerCase() === inputUsername.toLowerCase());
      if (!userExists) {
        setAuthStatus({
          type: 'error',
          message: `User '${inputUsername}' does not exist in Microsoft Entra ID directory.`,
        });
      } else {
        setAuthStatus({
          type: 'error',
          message: `Invalid password for account '@${inputUsername}'. Please use the assigned password.`,
        });
      }
    }
  };

  const handleFillCredential = (acc: (typeof accounts)[0]) => {
    setInputUsername(acc.username);
    setInputPassword(acc.password);
    setAuthStatus({
      type: 'idle',
      message: '',
    });
  };

  const copyCredential = (acc: (typeof accounts)[0]) => {
    navigator.clipboard.writeText(`Username: ${acc.username}\nPassword: ${acc.password}`);
    setCopiedAccount(acc.username);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Active Session Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider font-mono px-2.5 py-1 rounded-full border border-blue-500/20">
                Hallmark Health Center Identity Portal
              </span>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                isLoggedIn ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
              }`}>
                <ShieldCheck className="w-3 h-3" /> {isLoggedIn ? 'Authenticated' : 'Sign-In Required'}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              User Credentials & Authentication Gateway
            </h3>
            <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
              Enter your username and assigned password to authenticate into Hallmark Health Center's Azure Zero Trust Architecture EHR System.
            </p>
          </div>

          {/* Active Logged-in Badge */}
          <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 flex items-center gap-3 shadow-lg flex-shrink-0 min-w-[260px]">
            <div className={`p-2.5 rounded-xl text-white shadow-md ${isLoggedIn ? 'bg-blue-600' : 'bg-slate-800'}`}>
              {isLoggedIn ? <UserCheck className="w-6 h-6" /> : <Lock className="w-6 h-6 text-slate-400" />}
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block font-mono">
                {isLoggedIn ? 'ACTIVE USER SESSION' : 'NOT LOGGED IN'}
              </span>
              <p className="text-sm font-bold text-white font-mono">
                {isLoggedIn && activeAccount ? activeAccount.displayName : 'Guest User'}
              </p>
              <p className={`text-[10px] font-mono font-semibold ${isLoggedIn ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isLoggedIn && activeAccount ? `@${activeAccount.username} • ${activeAccount.group}` : 'Sign in on form below'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Login Form & Credentials Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Credentials Login Form (1 Column) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-400" />
              <h4 className="font-bold text-sm text-slate-100">Sign in with User Credentials</h4>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-300 font-mono font-bold px-2 py-0.5 rounded border border-blue-500/20">
              Credentials Gate
            </span>
          </div>

          <form onSubmit={handleManualLogin} className="p-6 space-y-4">
            {/* Feedback Alert */}
            {authStatus.type !== 'idle' && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  authStatus.type === 'success'
                    ? 'bg-green-950/40 text-green-300 border-green-500/30'
                    : 'bg-red-950/40 text-red-300 border-red-500/30'
                }`}
              >
                {authStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4.5 h-4.5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className="leading-snug">{authStatus.message}</p>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Entra ID Username
              </label>
              <input
                type="text"
                required
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder="Enter username (e.g. doctor01)"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 text-xs font-mono focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Password Input with Visibility Toggle */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Assigned Password</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="Enter assigned password..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 text-xs font-mono pr-10 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign In to Hallmark Health Center
            </button>

            {isLoggedIn && (
              <div className="pt-2 text-center">
                <Link
                  href="/portal/clinical"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold underline"
                >
                  Go to Clinical Records Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </form>

          {/* Quick Helper Note */}
          <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>Select any account from the right grid to fill credentials into the form.</span>
          </div>
        </div>

        {/* Right Column: User Accounts & Super Admin Directory (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-sm text-slate-200">
                Directory Credentials Helper & Password Directory
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">8 User Accounts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((acc) => {
              const isSelected = acc.username === currentUsername;

              return (
                <div
                  key={acc.username}
                  className={`bg-slate-900 border rounded-xl p-4 space-y-3 transition-all duration-200 hover:border-slate-700 ${
                    isSelected
                      ? 'border-blue-500 ring-1 ring-blue-500/50 bg-slate-900/90 shadow-xl'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-100 text-xs">{acc.displayName}</h5>
                        {acc.isSuperAdmin && (
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold border border-purple-500/30">
                            SUPER ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-blue-400 font-mono font-semibold">@{acc.username}</p>
                    </div>

                    <button
                      onClick={() => copyCredential(acc)}
                      title="Copy Credentials"
                      className="text-slate-400 hover:text-slate-200 bg-slate-950 p-1.5 rounded-lg border border-slate-850 transition text-[10px] flex items-center gap-1 font-mono"
                    >
                      {copiedAccount === acc.username ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Credentials Detail */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Group:</span>
                      <span className="text-emerald-400 font-semibold">{acc.group}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Password:</span>
                      <span className="text-slate-200 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {acc.password}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-snug">{acc.accessSummary}</p>

                  {/* Actions */}
                  <button
                    onClick={() => handleFillCredential(acc)}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-750 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    Fill @{acc.username} Credentials into Form
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
