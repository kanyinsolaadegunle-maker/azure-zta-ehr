'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from './signout-button';
import {
  ShieldCheck,
  Activity,
  FileText,
  CreditCard,
  Settings,
  Shield,
  Users,
  Menu,
  X,
  LogOut,
  Building2,
} from 'lucide-react';

interface MobileNavProps {
  username: string;
  avatarUrl: string;
  riskLevel: string;
  isAuthenticated?: boolean;
}

export function MobileNav({
  username,
  avatarUrl,
  riskLevel,
  isAuthenticated,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Overview & Login', icon: Activity, color: 'text-blue-400' },
    { href: '/portal/clinical', label: 'Clinical Records', icon: FileText, color: 'text-emerald-400' },
    { href: '/portal/admin', label: 'Billing & Admin', icon: CreditCard, color: 'text-purple-400' },
    { href: '/portal/compliance', label: 'Compliance & Logs', icon: Shield, color: 'text-orange-400' },
    { href: '/portal/login', label: 'User Directory & Roles', icon: Users, color: 'text-cyan-400' },
    { href: '/portal/azure', label: 'Azure Configuration', icon: Settings, color: 'text-slate-400' },
  ];

  return (
    <div className="md:hidden sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      {/* Brand Logo & Title */}
      <Link href="/" className="flex items-center gap-2.5">
        <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-1.5 rounded-xl text-white shadow-md">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-black text-xs tracking-wider text-white uppercase font-mono leading-none">
            HALLMARK
          </h1>
          <p className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase font-mono mt-0.5">
            Health Center
          </p>
        </div>
      </Link>

      {/* Right Controls: Active Badge & Menu Toggle */}
      <div className="flex items-center gap-2">
        {isAuthenticated && username && (
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            <img
              src={avatarUrl}
              alt={username}
              className="w-5 h-5 rounded-full object-cover border border-slate-700"
              onError={(e) => {
                (e.target as any).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
              }}
            />
            <span className="text-[10px] font-mono font-bold text-slate-200 truncate max-w-[80px]">
              @{username}
            </span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl transition border border-slate-700"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Backdrop & Sliding Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[57px] bg-black/80 backdrop-blur-md z-50 animate-fade-in flex flex-col justify-between p-4 overflow-y-auto">
          <nav className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-3 font-mono">
              EHR & Azure Portal Modules
            </span>

            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition font-semibold text-sm ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${link.color}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Footer: User Info & Sign Out */}
          {isAuthenticated && username && pathname !== '/' && (
            <div className="pt-4 border-t border-slate-800 space-y-3 mt-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-900"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">LOGGED IN AS</p>
                  <p className="text-xs font-bold text-slate-100 font-mono truncate">@{username}</p>
                  <p className="text-[9px] text-emerald-400 font-semibold truncate capitalize">
                    {riskLevel} Risk Location
                  </p>
                </div>
              </div>

              <SignOutButton />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
