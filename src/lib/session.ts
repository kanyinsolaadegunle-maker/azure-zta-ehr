import { cookies } from 'next/headers';
import { SessionContext } from './zta-engine';

export async function getSimulatedSession(): Promise<SessionContext> {
  const cookieStore = await cookies();
  
  const username = cookieStore.get('sim_username')?.value || 'doctor01';
  const riskLevel = (cookieStore.get('sim_risk_level')?.value || 'Low') as 'Low' | 'Medium' | 'High';
  const location = cookieStore.get('sim_location')?.value || 'United States';
  const ipAddress = cookieStore.get('sim_ip')?.value || '198.51.100.12';
  const mfaCompleted = cookieStore.get('sim_mfa')?.value === 'true';

  return {
    username,
    riskLevel,
    location,
    ipAddress,
    mfaCompleted,
  };
}

export async function setSimulatedSession(session: Partial<SessionContext>) {
  const cookieStore = await cookies();

  if (session.username !== undefined) {
    cookieStore.set('sim_username', session.username);
  }
  if (session.riskLevel !== undefined) {
    cookieStore.set('sim_risk_level', session.riskLevel);
  }
  if (session.location !== undefined) {
    cookieStore.set('sim_location', session.location);
  }
  if (session.ipAddress !== undefined) {
    cookieStore.set('sim_ip', session.ipAddress);
  }
  if (session.mfaCompleted !== undefined) {
    cookieStore.set('sim_mfa', session.mfaCompleted ? 'true' : 'false');
  }
}

export async function resetSimulatedSession() {
  const cookieStore = await cookies();
  cookieStore.set('sim_username', 'doctor01');
  cookieStore.set('sim_risk_level', 'Low');
  cookieStore.set('sim_location', 'United States');
  cookieStore.set('sim_ip', '198.51.100.12');
  cookieStore.set('sim_mfa', 'true');
}
