import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { getSimulatedSession } from '../lib/session';
import { SimulationProvider } from '../components/simulation-context';
import { SidebarFooter } from '../components/sidebar-footer';

import { db } from '../db/index';
import Link from 'next/link';

import {
  ShieldCheck,
  Activity,
  FileText,
  CreditCard,
  Settings,
  Shield,
  Fingerprint,
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
  title: 'Hallmark Health Center EHR - Azure ZTA Simulator',
  description: 'Azure Zero Trust Architecture Simulation over Hallmark Health Center EHR System',
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSimulatedSession();

  let avatarUrl =
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80';

  try {
    const activeUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, session.username),
    });
    if (activeUser?.avatarUrl) {
      avatarUrl = activeUser.avatarUrl;
    }
  } catch (err) {
    console.error('Layout user avatar fetch error (fallback used):', err);
  }


  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-slate-950 text-slate-100 font-sans">
        <SimulationProvider initialSession={session}>
          <div className="flex w-full min-h-screen">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
              <div className="flex flex-col">
                {/* Brand */}
                <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800 bg-slate-950/40">
                  <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="font-extrabold text-xs tracking-tight text-white uppercase font-mono">
                      HALLMARK MEDICAL
                    </h1>
                    <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase font-mono">
                      Health Center
                    </p>
                  </div>
                </div>

                {/* Nav Links */}
                <nav className="p-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-2">
                    EHR Portal Modules
                  </span>
                  
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold"
                  >
                    <Activity className="w-4 h-4 text-blue-400" />
                    Overview & Login
                  </Link>

                  <Link
                    href="/portal/clinical"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Clinical Records
                  </Link>

                  <Link
                    href="/portal/admin"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold"
                  >
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    Billing & Admin
                  </Link>

                  <Link
                    href="/portal/compliance"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold"
                  >
                    <Shield className="w-4 h-4 text-orange-400" />
                    Compliance & Logs
                  </Link>

                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mt-6 mb-2">
                    Azure Control Plane
                  </span>

                  <Link
                    href="/portal/login"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold"
                  >
                    <Users className="w-4 h-4 text-blue-400" />
                    User Directory & Roles
                  </Link>

                  <Link
                    href="/portal/azure"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-sm font-semibold"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Azure Configuration
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
            <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
              {children}
            </main>
          </div>
        </SimulationProvider>
      </body>
    </html>
  );
}

