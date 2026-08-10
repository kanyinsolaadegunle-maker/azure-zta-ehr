/**
 * Zero Trust Dynamic Trust Algorithm (zt-ehr-policy-engine)
 * Computes a dynamic 0-100 numerical trust score from contextual security signals.
 * NIST SP 800-207 compliant trust score calculation engine.
 */

export interface ContextSignals {
  ipAddress?: string;
  location?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  deviceCompliant?: boolean;
  isForeignLocation?: boolean;
  isOffHours?: boolean;
  travelVelocityKmH?: number;
}

export interface TrustScoreResult {
  score: number; // 0 - 100
  derivedRiskLevel: 'Low' | 'Medium' | 'High';
  deductions: Array<{ signal: string; penalty: number; reason: string }>;
}

export function computeTrustScore(signals: ContextSignals): TrustScoreResult {
  let score = 100;
  const deductions: Array<{ signal: string; penalty: number; reason: string }> = [];

  // 1. Explicit Risk Level Signal
  if (signals.riskLevel === 'High') {
    score -= 55;
    deductions.push({ signal: 'Identity Protection', penalty: 55, reason: 'High sign-in risk flag detected' });
  } else if (signals.riskLevel === 'Medium') {
    score -= 25;
    deductions.push({ signal: 'Identity Protection', penalty: 25, reason: 'Medium sign-in risk flag detected' });
  }

  // 2. Geolocation / Foreign Location Anomaly
  const locationStr = (signals.location || '').toLowerCase();
  const isForeign =
    signals.isForeignLocation ||
    (!locationStr.includes('united states') && !locationStr.includes('us') && locationStr.length > 0);

  if (isForeign) {
    score -= 25;
    deductions.push({ signal: 'Geolocation Anomaly', penalty: 25, reason: `Sign-in from non-primary region (${signals.location})` });
  }

  // 3. Device Posture & Compliance
  if (signals.deviceCompliant === false) {
    score -= 30;
    deductions.push({ signal: 'Device Posture', penalty: 30, reason: 'Unmanaged or non-compliant device endpoint' });
  }

  // 4. Impossible Travel Velocity (> 900 km/h)
  if (signals.travelVelocityKmH && signals.travelVelocityKmH > 900) {
    score -= 40;
    deductions.push({ signal: 'Impossible Travel', penalty: 40, reason: `Excessive travel velocity (${Math.round(signals.travelVelocityKmH)} km/h)` });
  }

  // 5. Off-Hours Access (e.g. 1:00 AM - 4:00 AM)
  if (signals.isOffHours) {
    score -= 15;
    deductions.push({ signal: 'Time Anomaly', penalty: 15, reason: 'Access request initiated during out-of-hours window' });
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  let derivedRiskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (finalScore < 50) {
    derivedRiskLevel = 'High';
  } else if (finalScore < 80) {
    derivedRiskLevel = 'Medium';
  }

  return {
    score: finalScore,
    derivedRiskLevel,
    deductions,
  };
}
