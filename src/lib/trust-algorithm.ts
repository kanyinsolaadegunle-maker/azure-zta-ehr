/**
 * Zero Trust Dynamic Trust Algorithm (zt-ehr-policy-engine)
 * Computes a dynamic 0-100 numerical trust score from contextual security signals.
 * NIST SP 800-207 compliant trust score calculation engine with clinical setting adaptation.
 */

export interface ContextSignals {
  ipAddress?: string;
  location?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  deviceCompliant?: boolean;
  isForeignLocation?: boolean;
  isOffHours?: boolean;
  travelVelocityKmH?: number;
  sessionAgeSeconds?: number;
}

export interface TrustScoreResult {
  score: number; // 0 - 100
  derivedRiskLevel: 'Low' | 'Medium' | 'High';
  deductions: Array<{ signal: string; penalty: number; reason: string }>;
  rulesFired: string[];
}

import { THRESHOLDS, WEIGHTS } from '../policies/trust-weights';
export { THRESHOLDS, WEIGHTS };

// Configurable home regions with exact tokenized matching
function isHomeRegion(locationStr: string): boolean {
  if (!locationStr) return true;
  const rawHomeRegions = process.env.ZTP_HOME_REGIONS || 'nigeria,ng,united states,us';
  const homeRegions = rawHomeRegions.split(',').map((r) => r.trim().toLowerCase());

  const cleanLocation = locationStr.toLowerCase();
  const tokens = cleanLocation.split(/[\s,.\-/]+/);

  return homeRegions.some((region) => {
    if (region === 'us' || region === 'ng') {
      return tokens.includes(region);
    }
    return cleanLocation.includes(region);
  });
}

export function computeTrustScore(signals: ContextSignals): TrustScoreResult {
  let score = 100;
  const deductions: Array<{ signal: string; penalty: number; reason: string }> = [];
  const rulesFired: string[] = [];

  // 1. Federated External Identity Risk Signal
  if (signals.riskLevel === 'High') {
    score -= WEIGHTS.EXTERNAL_RISK_HIGH;
    deductions.push({ signal: 'External Identity Protection', penalty: WEIGHTS.EXTERNAL_RISK_HIGH, reason: 'High sign-in risk flag from federated identity provider' });
    rulesFired.push('external-risk-high');
  } else if (signals.riskLevel === 'Medium') {
    score -= WEIGHTS.EXTERNAL_RISK_MEDIUM;
    deductions.push({ signal: 'External Identity Protection', penalty: WEIGHTS.EXTERNAL_RISK_MEDIUM, reason: 'Medium sign-in risk flag from federated identity provider' });
    rulesFired.push('external-risk-medium');
  }

  // 2. Geolocation / Non-Home Region Anomaly (Exact token matching)
  const locationStr = (signals.location || '').trim();
  const isForeign =
    signals.isForeignLocation ||
    (locationStr.length > 0 && !isHomeRegion(locationStr));

  if (isForeign) {
    score -= WEIGHTS.GEOLOCATION_ANOMALY;
    deductions.push({ signal: 'Geolocation Anomaly', penalty: WEIGHTS.GEOLOCATION_ANOMALY, reason: `Sign-in from non-primary region (${signals.location})` });
    rulesFired.push('geolocation-anomaly');
  }

  // 3. Device Posture & Compliance
  if (signals.deviceCompliant === false) {
    score -= WEIGHTS.DEVICE_NON_COMPLIANT;
    deductions.push({ signal: 'Device Posture', penalty: WEIGHTS.DEVICE_NON_COMPLIANT, reason: 'Unmanaged or non-compliant device endpoint' });
    rulesFired.push('device-non-compliant');
  }

  // 4. Impossible Travel Velocity (> 900 km/h)
  if (signals.travelVelocityKmH && signals.travelVelocityKmH > 900) {
    score -= WEIGHTS.IMPOSSIBLE_TRAVEL;
    deductions.push({ signal: 'Impossible Travel', penalty: WEIGHTS.IMPOSSIBLE_TRAVEL, reason: `Excessive travel velocity (${Math.round(signals.travelVelocityKmH)} km/h)` });
    rulesFired.push('impossible-travel');
  }

  // 5. Off-Hours Access (e.g. out-of-hours window)
  if (signals.isOffHours) {
    score -= WEIGHTS.OFF_HOURS_ACCESS;
    deductions.push({ signal: 'Time Anomaly', penalty: WEIGHTS.OFF_HOURS_ACCESS, reason: 'Access request initiated during out-of-hours window' });
    rulesFired.push('off-hours-access');
  }

  // 6. Continuous Verification Session Longevity Decay
  if (signals.sessionAgeSeconds) {
    if (signals.sessionAgeSeconds > 14400) { // > 4 hours
      score -= WEIGHTS.SESSION_DECAY_4H;
      deductions.push({ signal: 'Session Longevity Decay', penalty: WEIGHTS.SESSION_DECAY_4H, reason: 'Session age exceeds maximum continuous threshold (4+ hours)' });
      rulesFired.push('session-decay');
    } else if (signals.sessionAgeSeconds > 7200) { // > 2 hours
      score -= WEIGHTS.SESSION_DECAY_2H;
      deductions.push({ signal: 'Session Longevity Decay', penalty: WEIGHTS.SESSION_DECAY_2H, reason: 'Session age exceeds 2 hours without re-authentication' });
      rulesFired.push('session-decay');
    } else if (signals.sessionAgeSeconds > 3600) { // > 1 hour
      score -= WEIGHTS.SESSION_DECAY_1H;
      deductions.push({ signal: 'Session Longevity Decay', penalty: WEIGHTS.SESSION_DECAY_1H, reason: 'Session age exceeds 1 hour without re-authentication' });
      rulesFired.push('session-decay');
    }
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  let derivedRiskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (finalScore < THRESHOLDS.denyThreshold) {
    derivedRiskLevel = 'High';
  } else if (finalScore < THRESHOLDS.challengeThreshold) {
    derivedRiskLevel = 'Medium';
  }

  return {
    score: finalScore,
    derivedRiskLevel,
    deductions,
    rulesFired,
  };
}

// Integrated Design Journal Documentation Export
export const DESIGN_JOURNAL = [
  {
    date: '2026-08-11',
    decision: 'Base score of 100',
    reasoning: 'Represents a fully verified request with no contextual anomalies.',
    rejected: 'Theoretical maximum nobody reaches in practice.',
  },
  {
    date: '2026-08-11',
    decision: 'External Identity High Risk set to -55 (Score = 45 < 50 -> ZTP-02 Block)',
    reasoning: 'High risk verdict from federated Identity Protection directly triggers ZTP-02 Risk Block policy.',
    rejected: 'Treating High risk as -15 which left score in Medium band.',
  },
  {
    date: '2026-08-11',
    decision: 'Tokenized Geolocation Matching against ZTP_HOME_REGIONS',
    reasoning: 'Prevents false-positive domestic matches for countries like Russia or Australia containing "us".',
    rejected: 'Naive substring matching (!includes("us")).',
  },
  {
    date: '2026-08-11',
    decision: 'Device Compliance penalty set to -25',
    reasoning: 'Balances clinical realities of shared nursing station workstations with endpoint integrity.',
    rejected: 'Heavy -40 penalty that produced constant false positives on shared hospital PCs.',
  },
];
