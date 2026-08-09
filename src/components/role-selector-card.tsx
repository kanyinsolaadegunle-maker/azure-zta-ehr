'use client';

import React from 'react';
import { useSimulation } from './simulation-context';
import { LogIn, ShieldCheck, UserCheck } from 'lucide-react';

interface RoleSelectorCardProps {
  item: {
    user: {
      id: string;
      username: string;
      displayName: string;
      description: string;
      projectMeaning: string;
    };
    groupName: string;
    isCurrent: boolean;
    access: {
      patientRead: boolean;
      patientWrite: boolean;
      adminRead: boolean;
      auditRead: boolean;
    };
  };
}

export function RoleSelectorCard({ item }: RoleSelectorCardProps) {
  const { updateSession, isPending } = useSimulation();

  const handleLogin = () => {
    updateSession({ username: item.user.username });
  };

  return (
    <div
      className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-slate-700 ${
        item.isCurrent
          ? 'border-blue-500 ring-1 ring-blue-500/50 bg-slate-900/90 shadow-xl'
          : 'border-slate-800'
      }`}
    >
      <div className="space-y-2">
        {/* User Badge */}
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-slate-100 text-sm">{item.user.displayName}</h4>
            <p className="text-xs text-blue-400 font-mono font-semibold">@{item.user.username}</p>
          </div>
          {item.isCurrent && (
            <span className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
              <UserCheck className="w-3 h-3" /> LOGGED IN
            </span>
          )}
        </div>

        {/* Security Group */}
        <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 space-y-1">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Assigned Security Group</span>
          <p className="text-xs font-mono font-bold text-emerald-400 truncate">{item.groupName}</p>
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {item.user.projectMeaning}
        </p>
      </div>

      {/* Login Action Button */}
      <button
        onClick={handleLogin}
        disabled={item.isCurrent || isPending}
        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
          item.isCurrent
            ? 'bg-slate-850 text-slate-500 cursor-default border border-slate-800'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-blue-500/20'
        }`}
      >
        <LogIn className="w-3.5 h-3.5" />
        {item.isCurrent ? 'Current Account' : `Log in as ${item.user.username}`}
      </button>
    </div>
  );
}
