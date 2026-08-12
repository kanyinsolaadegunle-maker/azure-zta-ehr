/**
 * Zero Trust Policy Engine - Declarative Trust Weights & Thresholds Configuration
 * Clean declarative artefact defining numeric constants for trust scoring and evaluation thresholds.
 * Values MUST remain identical to preserve empirical evaluation benchmark validity.
 */

export const THRESHOLDS = {
  denyThreshold: 50,      // Score < 50 -> DENY / High Risk
  challengeThreshold: 80, // Score 50-79 -> CHALLENGE / Medium Risk
  allowThreshold: 80,     // Score >= 80 -> ALLOW / Low Risk
};

export const WEIGHTS = {
  EXTERNAL_RISK_HIGH: 55,     // High risk flag from federated IDP -> drops score to 45 (< 50 -> ZTP-02 Risk Block)
  EXTERNAL_RISK_MEDIUM: 25,   // Medium risk flag -> drops score to 75 (50-79 -> ZTP-03 Step-Up MFA)
  GEOLOCATION_ANOMALY: 25,    // Non-home region sign-in
  DEVICE_NON_COMPLIANT: 25,   // Unmanaged or non-compliant endpoint
  IMPOSSIBLE_TRAVEL: 30,      // Travel velocity > 900 km/h
  OFF_HOURS_ACCESS: 15,       // Access outside rostered/normal hours
  SESSION_DECAY_1H: 10,       // Session age > 1 hour
  SESSION_DECAY_2H: 20,       // Session age > 2 hours
  SESSION_DECAY_4H: 40,       // Session age > 4 hours
};

export const DEFAULT_HOME_REGIONS = ['nigeria', 'ng', 'united states', 'us'];
