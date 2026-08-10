import { evaluateZtaAccess } from '../lib/zta-engine';
import * as dotenv from 'dotenv';
dotenv.config();

interface TestAssertion {
  name: string;
  username: string;
  resource: 'patient-records' | 'admin-records' | 'audit-evidence';
  action: 'Read' | 'Write';
  context: {
    riskLevel: 'Low' | 'Medium' | 'High';
    location: string;
    ipAddress: string;
    mfaCompleted: boolean;
    breakGlassJustification?: string;
    targetPatientId?: string;
    sessionAgeSeconds?: number;
  };
  expectedGranted: boolean;
  expectedPolicy?: string;
}

const testCases: TestAssertion[] = [
  {
    name: 'Case A: Authorized Doctor Access (Read Patient Records)',
    username: 'doctor01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: true,
  },
  {
    name: 'Case B: Authorized Doctor Access (Write Patient Records)',
    username: 'doctor01',
    resource: 'patient-records',
    action: 'Write',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: true,
  },
  {
    name: 'Case C: High Sign-in Risk Block (ZTP-02)',
    username: 'doctor01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'High', location: 'Unknown / VPN', ipAddress: '185.220.101.5', mfaCompleted: true },
    expectedGranted: false,
    expectedPolicy: 'ZTP-02',
  },
  {
    name: 'Case D: Nurse Read-Only Privilege Enforced (Read Patient Records)',
    username: 'nurse01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: true,
  },
  {
    name: 'Case E: Nurse Read-Only Privilege Enforced (Write Blocked)',
    username: 'nurse01',
    resource: 'patient-records',
    action: 'Write',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: false,
    expectedPolicy: 'ZTP-RBAC',
  },
  {
    name: 'Case F: Records Admin segregation (Read Admin Records)',
    username: 'recordsadmin01',
    resource: 'admin-records',
    action: 'Read',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: true,
  },
  {
    name: 'Case G: Records Admin segregation (Blocked from Patient Records)',
    username: 'recordsadmin01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: false,
    expectedPolicy: 'ZTP-RBAC',
  },
  {
    name: 'Case H: Vendor Access Restrictions (Blocked from Patient Records)',
    username: 'vendor01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: false,
    expectedPolicy: 'ZTP-RBAC',
  },
  {
    name: 'Case I: Auditor Scope Restricted (Read Audit Evidence)',
    username: 'auditor01',
    resource: 'audit-evidence',
    action: 'Read',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: true,
  },
  {
    name: 'Case J: Auditor Scope Restricted (Blocked from Patient Records)',
    username: 'auditor01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: false,
    expectedPolicy: 'ZTP-RBAC',
  },
  {
    name: 'Case K: Medium Risk MFA Policy Challenge (ZTP-03)',
    username: 'doctor01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'Medium', location: 'Nigeria', ipAddress: '102.89.2.14', mfaCompleted: false },
    expectedGranted: false,
    expectedPolicy: 'ZTP-03',
  },
  {
    name: 'Case L: Substring Bypass Blocked (fakeglobaladmin01 denied)',
    username: 'fakeglobaladmin01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: false,
    expectedPolicy: 'Directory Lookup Failed',
  },
  {
    name: 'Case M: Emergency Break-glass (Denied without justification)',
    username: 'emergency.admin',
    resource: 'patient-records',
    action: 'Write',
    context: { riskLevel: 'High', location: 'Unknown / VPN', ipAddress: '185.220.101.5', mfaCompleted: false },
    expectedGranted: false,
    expectedPolicy: 'ZTP-05',
  },
  {
    name: 'Case N: Emergency Break-glass (Granted with valid typed justification)',
    username: 'emergency.admin',
    resource: 'patient-records',
    action: 'Write',
    context: {
      riskLevel: 'High',
      location: 'Unknown / VPN',
      ipAddress: '185.220.101.5',
      mfaCompleted: false,
      breakGlassJustification: 'Emergency Trauma Surgery override for ICU Patient #1048',
    },
    expectedGranted: true,
    expectedPolicy: 'ZTP-05',
  },
  {
    name: 'Case O: Per-Patient Scope Containment (Unassigned patient blocked without break-glass)',
    username: 'doctor01',
    resource: 'patient-records',
    action: 'Read',
    context: {
      riskLevel: 'Low',
      location: 'United States',
      ipAddress: '198.51.100.12',
      mfaCompleted: true,
      targetPatientId: 'PR-2024-99999', // Unassigned patient ID
    },
    expectedGranted: false,
    expectedPolicy: 'ZTP-SCOPE-CONTAINMENT',
  },
  {
    name: 'Case P: Continuous Verification (Session age > 4h triggers trust score decay block)',
    username: 'doctor01',
    resource: 'patient-records',
    action: 'Read',
    context: {
      riskLevel: 'Low',
      location: 'United States',
      ipAddress: '198.51.100.12',
      mfaCompleted: true,
      sessionAgeSeconds: 15000, // 4.1 hours old session -> triggers -40 penalty
    },
    expectedGranted: true, // Evaluates score: 100 - 40 = 60 (Medium Risk -> MFA completed = true -> Granted)
  },
];


async function runTests() {
  console.log('=== Running ZT Policy Engine Integration Tests (zt-ehr-policy-engine) ===\n');
  let passCount = 0;
  let failCount = 0;

  for (const tc of testCases) {
    try {
      const res = await evaluateZtaAccess({
        username: tc.username,
        resource: tc.resource,
        action: tc.action,
        riskLevel: tc.context.riskLevel,
        location: tc.context.location,
        ipAddress: tc.context.ipAddress,
        mfaCompleted: tc.context.mfaCompleted,
        breakGlassJustification: tc.context.breakGlassJustification,
        targetPatientId: tc.context.targetPatientId,
        sessionAgeSeconds: tc.context.sessionAgeSeconds,
      });

      const statusMatch = res.accessGranted === tc.expectedGranted;
      const policyMatch = tc.expectedPolicy ? res.policyTriggered.includes(tc.expectedPolicy) : true;

      if (statusMatch && policyMatch) {
        console.log(`[PASS] ${tc.name}`);
        passCount++;
      } else {
        console.log(`[FAIL] ${tc.name}`);
        console.log(`  Expected Granted: ${tc.expectedGranted}, Actual: ${res.accessGranted}`);
        if (tc.expectedPolicy) {
          console.log(`  Expected Policy containing: "${tc.expectedPolicy}", Actual Triggered: "${res.policyTriggered}"`);
        }
        console.log(`  Denial Reason: "${res.failureReason}"`);
        failCount++;
      }
    } catch (err) {
      console.log(`[FAIL] ${tc.name}`);
      console.error(`  Error thrown:`, err);
      failCount++;
    }
  }

  console.log(`\n=== Integration Test Summary ===`);
  console.log(`Total tests: ${testCases.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);

  if (failCount > 0) {
    console.error('\nZT Engine integration test suite failed!');
    process.exit(1);
  } else {
    console.log('\nAll ZT Engine integration assertions passed successfully!');
    process.exit(0);
  }
}

runTests();
