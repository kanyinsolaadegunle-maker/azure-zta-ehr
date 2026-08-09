'use client';

import React, { createContext, useContext, useState, useTransition } from 'react';
import { updateSessionAction, resetSessionAction } from '../app/actions';
import { useRouter } from 'next/navigation';
import { SessionContext } from '../lib/zta-engine';

interface SimulationContextType extends SessionContext {
  isPending: boolean;
  mfaPromptActive: boolean;
  setMfaPromptActive: (active: boolean) => void;
  updateSession: (data: Partial<SessionContext>) => Promise<void>;
  resetSession: () => Promise<void>;
  triggerMfaChallenge: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: SessionContext;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [session, setSession] = useState<SessionContext>(initialSession);
  const [mfaPromptActive, setMfaPromptActive] = useState(false);

  const updateSession = async (data: Partial<SessionContext>) => {
    // Optimistic local state update
    const newSession = { ...session, ...data };
    setSession(newSession);

    startTransition(async () => {
      await updateSessionAction(data);
      router.refresh();
    });
  };

  const resetSession = async () => {
    const guestSession: SessionContext = {
      username: '',
      riskLevel: 'Low',
      location: 'United States',
      ipAddress: '198.51.100.12',
      mfaCompleted: false,
      isAuthenticated: false,
    };
    setSession(guestSession);
    setMfaPromptActive(false);

    startTransition(async () => {
      await resetSessionAction();
      router.refresh();
    });
  };


  const triggerMfaChallenge = () => {
    setMfaPromptActive(true);
  };

  return (
    <SimulationContext.Provider
      value={{
        ...session,
        isPending,
        mfaPromptActive,
        setMfaPromptActive,
        updateSession,
        resetSession,
        triggerMfaChallenge,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
