import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { getSimulatedSession } from '../lib/session';
import { SimulationProvider } from '../components/simulation-context';
import { SidebarFooter } from '../components/sidebar-footer';
import { MobileNav } from '../components/mobile-nav';
import { ContinuousVerificationHeartbeat } from '../components/continuous-verification-heartbeat';
import { SimulationDrawer } from '../components/simulation-drawer';
import { db } from '../db/index';
import * as schema from '../db/schema';

import Link from 'next/link';
import {
  ShieldCheck,
  Activity,
  FileText,
  CreditCard,
  Settings,
  Shield,
  Users,
} from 'lucide-react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hallmark Medical Center EHR - Zero Trust Policy Engine',
  description: 'Zero Trust Policy Engine for EHR Access Control (zt-ehr-policy-engine)',

  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSimulatedSession();

  let avatarUrl =
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80';

  try {
    if (session.username) {
      const usersList = await db.select().from(schema.users);
      const cleanSessionUser = (session.username || '').replace(/^@+/, '').toLowerCase();
      const activeUser = usersList.find((u) => (u.username || '').toLowerCase() === cleanSessionUser);
      if (activeUser?.avatarUrl) {
        avatarUrl = activeUser.avatarUrl;
      }
    }
  } catch (err: any) {

    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) throw err;
    console.error('Layout user avatar fetch error (fallback used):', err);
  }


  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
        <SimulationProvider initialSession={session}>
          {/* Mobile Sticky Header Navigation */}
          <MobileNav
            username={session.username}
            avatarUrl={avatarUrl}
            riskLevel={session.riskLevel}
            isAuthenticated={session.isAuthenticated}
          />

          <div className="flex w-full min-h-screen">
            {/* Desktop Sidebar Navigation (Hidden on mobile) */}
            <aside className="hidden md:flex w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex-col justify-between flex-shrink-0">
              <div className="flex flex-col">
                {/* Brand Header */}
                <Link
                  href="/"
                  className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 transition"
                >
                  <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-xl text-white shadow-md glow-blue">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-black text-xs tracking-wider text-white uppercase font-mono leading-none">
                      HALLMARK
                    </h1>
                    <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase font-mono mt-0.5">
                      Medical Center
                    </p>
                  </div>
                </Link>


                {/* Nav Links */}
                <nav className="p-4 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3 block mb-2">
                    EHR Portal Modules
                  </span>

                  <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold group"
                  >
                    <Activity className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Overview & Login</span>
                  </Link>

                  <Link
                    href="/portal/clinical"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold group"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Clinical Records</span>
                  </Link>

                  <Link
                    href="/portal/admin"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold group"
                  >
                    <CreditCard className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>Billing & Admin</span>
                  </Link>

                  <Link
                    href="/portal/compliance"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold group"
                  >
                    <Shield className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                    <span>Compliance & Logs</span>
                  </Link>

                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3 block mt-6 mb-2">
                    Baseline & Control Plane
                  </span>

                  <Link
                    href="/portal/login"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold group"
                  >
                    <Users className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>User Directory & Roles</span>
                  </Link>

                  <Link
                    href="/portal/azure"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold group"
                  >
                    <Settings className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                    <span>Baseline Architecture & Settings</span>

                  </Link>
                </nav>
              </div>

              {/* Sidebar Footer - Active user profile avatar & sign out (Hidden on Landing Page) */}
              <SidebarFooter
                username={session.username}
                avatarUrl={avatarUrl}
                riskLevel={session.riskLevel}
                isAuthenticated={session.isAuthenticated}
              />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 min-h-screen">
              {/* Context bar with Continuous Verification Heartbeat & Interactive Simulation Controls */}
              <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <ContinuousVerificationHeartbeat currentUsername={session.username} />
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Policy Engine Mode:</span>
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                    ZTP Engine (Server Authoritative)
                  </span>
                </div>
              </div>
              {children}
            </main>

            {/* Drawer for Injecting Simulation Context Signals */}
            <SimulationDrawer />
          </div>
        </SimulationProvider>
      </body>
    </html>
  );
}
