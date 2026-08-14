import { cookies } from 'next/headers';
import crypto from 'crypto';

const rawHmacSecret = process.env.ZTP_HMAC_SECRET;
if (!rawHmacSecret && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ ZTP_HMAC_SECRET environment variable is missing. Set ZTP_HMAC_SECRET in Vercel environment variables for production security.');
}
const HMAC_SECRET = rawHmacSecret || 'ztp-engine-hmac-secret-key-2026-sha256';

export interface IdentitySession {
  username: string;
  mfaCompleted: boolean;
  isAuthenticated: boolean;
  sessionStartedAt: number; // Unix timestamp in ms for Continuous Verification session decay
}

export interface InjectedContextSignals {
  riskLevel: 'Low' | 'Medium' | 'High';
  location: string;
  ipAddress: string;
  deviceCompliant: boolean;
}

export interface CompleteSessionContext extends IdentitySession, InjectedContextSignals {}

// Helper function to sign a string using HMAC SHA-256
function sign(data: string): string {
  const hmac = crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
  return `${data}.${hmac}`;
}

// Helper function to verify and unsign an HMAC string
function unsign(signedData: string): string | null {
  if (!signedData || !signedData.includes('.')) return null;
  const lastDotIndex = signedData.lastIndexOf('.');
  const data = signedData.substring(0, lastDotIndex);
  const signature = signedData.substring(lastDotIndex + 1);

  const expectedHmac = crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedHmac);

  // Length guard to prevent crypto.timingSafeEqual RangeError crash on tampered cookies
  if (sigBuf.length !== expBuf.length) {
    return null;
  }

  if (crypto.timingSafeEqual(sigBuf, expBuf)) {
    return data;
  }
  return null;
}

export async function getSimulatedSession(): Promise<CompleteSessionContext> {
  const cookieStore = await cookies();

  // 1. Server-Authoritative Signed Identity Cookie
  const rawIdentityCookie = cookieStore.get('ztp_identity_session')?.value || '';
  const verifiedIdentityStr = unsign(rawIdentityCookie);

  let identity: IdentitySession = {
    username: '',
    mfaCompleted: false,
    isAuthenticated: false,
    sessionStartedAt: Date.now(),
  };

  if (verifiedIdentityStr) {
    try {
      const parsed = JSON.parse(verifiedIdentityStr);
      identity = {
        ...identity,
        ...parsed,
        sessionStartedAt: parsed.sessionStartedAt || identity.sessionStartedAt,
      };
    } catch (e) {
      console.warn('HMAC Identity verification failed: invalid payload');
    }
  }

  // 2. Separate Simulator Context Cookie for Injected Test Signals
  const rawContextCookie = cookieStore.get('sim_context')?.value || '';
  let injectedContext: InjectedContextSignals = {
    riskLevel: 'Low',
    location: 'United States',
    ipAddress: '198.51.100.12',
    deviceCompliant: true,
  };

  if (rawContextCookie) {
    try {
      injectedContext = { ...injectedContext, ...JSON.parse(rawContextCookie) };
    } catch (e) {
      // ignore
    }
  }

  return {
    ...identity,
    ...injectedContext,
  };
}

export async function setSimulatedSession(sessionData: Partial<CompleteSessionContext>) {
  const cookieStore = await cookies();
  const currentSession = await getSimulatedSession();

  // Update Identity (Signed with HMAC)
  const newIdentity: IdentitySession = {
    username:
      sessionData.username !== undefined
        ? sessionData.username.replace(/^@+/, '').trim().toLowerCase()
        : currentSession.username,
    mfaCompleted:
      sessionData.mfaCompleted !== undefined ? sessionData.mfaCompleted : currentSession.mfaCompleted,
    isAuthenticated:
      sessionData.isAuthenticated !== undefined
        ? sessionData.isAuthenticated
        : !!(sessionData.username || currentSession.username),
    sessionStartedAt:
      sessionData.sessionStartedAt !== undefined
        ? sessionData.sessionStartedAt
        : currentSession.sessionStartedAt || Date.now(),
  };

  const signedIdentityPayload = sign(JSON.stringify(newIdentity));
  cookieStore.set('ztp_identity_session', signedIdentityPayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Update Injected Context (Unsigned, explicitly for test signal injection)
  const newContext: InjectedContextSignals = {
    riskLevel: sessionData.riskLevel || currentSession.riskLevel || 'Low',
    location: sessionData.location || currentSession.location || 'United States',
    ipAddress: sessionData.ipAddress || currentSession.ipAddress || '198.51.100.12',
    deviceCompliant:
      sessionData.deviceCompliant !== undefined
        ? sessionData.deviceCompliant
        : currentSession.deviceCompliant,
  };

  cookieStore.set('sim_context', JSON.stringify(newContext), {
    path: '/',
  });
}

export async function resetSimulatedSession() {
  const cookieStore = await cookies();
  cookieStore.set('ztp_identity_session', '', { path: '/', maxAge: 0 });
  cookieStore.set('sim_context', JSON.stringify({
    riskLevel: 'Low',
    location: 'United States',
    ipAddress: '198.51.100.12',
    deviceCompliant: true,
  }), { path: '/' });
}
