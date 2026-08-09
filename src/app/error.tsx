'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Server Error Boundary caught error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-fade-in">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">System Error Encountered</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            {error.message || 'An unexpected error occurred while communicating with the database or server.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCw className="w-4 h-4" /> Reload Portal
          </button>

          <Link
            href="/"
            className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 border border-slate-700"
          >
            <Home className="w-4 h-4" /> Go to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
