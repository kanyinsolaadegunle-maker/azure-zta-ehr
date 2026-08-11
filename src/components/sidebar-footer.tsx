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
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);


  // Hide sidebar footer user card & sign-out button on landing page ('/'), when unmounted or when not authenticated
  if (!mounted || pathname === '/' || !username || !isAuthenticated) {
    return null;
  }

  const cleanName = (username || '').replace(/^@+/, '');


  return (
    <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
      <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-850">
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-mono font-bold text-xs uppercase flex-shrink-0">
          {cleanName.substring(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none">LOGGED IN AS</p>
          <p className="text-xs font-bold text-slate-100 font-mono truncate">@{cleanName}</p>
          <p className="text-[9px] text-emerald-400 font-semibold truncate capitalize">
            {riskLevel} Risk Location
          </p>
        </div>
      </div>


      <SignOutButton />
    </div>
  );
}
