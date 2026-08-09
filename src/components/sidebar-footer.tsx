'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SignOutButton } from './signout-button';

interface SidebarFooterProps {
  username: string;
  avatarUrl: string;
  riskLevel: string;
  isAuthenticated?: boolean;
}

export function SidebarFooter({
  username,
  avatarUrl,
  riskLevel,
  isAuthenticated,
}: SidebarFooterProps) {
  const pathname = usePathname();

  // Hide sidebar footer user card & sign-out button on landing page ('/') or when not authenticated
  if (pathname === '/' || !username || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
      <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-850">
        <img
          src={avatarUrl}
          alt={username}
          className="w-9 h-9 rounded-full object-cover border border-slate-700 bg-slate-900 flex-shrink-0"
          onError={(e) => {
            (e.target as any).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none">LOGGED IN AS</p>
          <p className="text-xs font-bold text-slate-100 font-mono truncate">@{username}</p>
          <p className="text-[9px] text-emerald-400 font-semibold truncate capitalize">
            {riskLevel} Risk Location
          </p>
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}
