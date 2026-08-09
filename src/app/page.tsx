import { db } from '../db/index';
import * as schema from '../db/schema';
import { LandingLoginPortal } from '../components/landing-login-portal';
import { Building2, ShieldCheck, HardDrive, Lock, Users, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function Home() {
  let settingsMap = new Map<string, string>();

  try {
    const settingsRows = await db.select().from(schema.systemSettings);
    settingsMap = new Map(settingsRows.map((s) => [s.key, s.value]));
  } catch (err) {
    console.error('Home page DB fetch error (fallback used):', err);
  }

  return (
    <div className="flex-1 p-6 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* 1. Hallmark Medical Center Landing Header & Credentials Sign-In Gateway */}
      <LandingLoginPortal />

      {/* 2. System Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/20 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Hallmark Medical Center Overview</h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Simulated Azure Zero Trust Architecture (ZTA) Enterprise EHR Portal & Access Management System
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Organization:
            </span>
          </div>
          <span className="text-xs text-white font-semibold font-mono">
            {settingsMap.get('simulated_organization') || 'Hallmark Medical Center'}
          </span>
        </div>
      </div>


      {/* 3. EHR Capabilities & ZTA Security Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl w-fit border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm">Entra ID Directory</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Role-Based Access Control (RBAC) mapping users to EHR-Doctors, EHR-Nurses, Records-Admins, IT-Security, and Cloud-Admins.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl w-fit border border-emerald-500/20">
            <HardDrive className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm">Azure Blob Storage</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Isolated private storage containers for patient-records, admin-records, and audit-evidence with HTTPS TLS 1.2 encryption.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="bg-orange-500/10 text-orange-400 p-3 rounded-xl w-fit border border-orange-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm">Conditional Access</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Policies CA001 to CA005 enforcing Multi-Factor Authentication (MFA), location risk blocking, and account suspension.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl w-fit border border-purple-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-100 text-sm">Break-Glass Bypass</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Emergency administrative access for emergency.admin bypassing conditional blocking rules during system recovery.
          </p>
        </div>
      </div>
    </div>
  );
}
