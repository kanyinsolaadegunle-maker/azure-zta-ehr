'use client';

import React, { useTransition } from 'react';
import { logoutUserAction } from '../app/actions';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSignOut = () => {
    startTransition(async () => {
      await logoutUserAction();
      router.push('/');
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="w-full bg-slate-950 hover:bg-red-950/40 text-slate-300 hover:text-red-300 border border-slate-800 hover:border-red-500/30 font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-2 group"
    >
      <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400 transition" />
      {isPending ? 'Signing out...' : 'Sign Out to Landing Page'}
    </button>
  );
}
