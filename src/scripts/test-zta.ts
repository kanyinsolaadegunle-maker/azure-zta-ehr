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
    name: 'Case C: High Sign-in Risk Block (CA002)',
    username: 'doctor01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'High', location: 'Unknown / VPN', ipAddress: '185.220.101.5', mfaCompleted: true },
    expectedGranted: false,
    expectedPolicy: 'CA002 - Block High Risk Sign-ins',
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
    expectedPolicy: 'Azure RBAC Role Control',
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
    expectedPolicy: 'Azure RBAC Role Control',
  },
  {
    name: 'Case H: Vendor Access Restrictions (Blocked from Patient Records)',
    username: 'vendor01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'Low', location: 'United States', ipAddress: '198.51.100.12', mfaCompleted: true },
    expectedGranted: false,
    expectedPolicy: 'Azure RBAC Role Control',
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
    expectedPolicy: 'Azure RBAC Role Control',
  },
  {
    name: 'Case K: Medium Risk MFA Policy Challenge (CA003)',
    username: 'doctor01',
    resource: 'patient-records',
    action: 'Read',
    context: { riskLevel: 'Medium', location: 'Nigeria', ipAddress: '102.89.2.14', mfaCompleted: false },
    expectedGranted: false,
    expectedPolicy: 'CA003 - Require MFA for Medium Risk Sign-ins',
  },
  {
    name: 'Case L: Emergency Break-glass Override (Bypasses CA rules)',
    username: 'emergency.admin',
    resource: 'patient-records',
    action: 'Write',
    context: { riskLevel: 'High', location: 'Unknown / VPN', ipAddress: '185.220.101.5', mfaCompleted: false },
    expectedGranted: true,
  },
];

async function runTests() {
  console.log('=== Running ZTA Evaluation Engine Integration Tests ===\n');
  let passCount = 0;
  let failCount = 0;

  for (const tc of testCases) {
    try {
      const res = await evaluateZtaAccess(tc.username, tc.resource, tc.action, tc.context);
      
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
    console.error('\nZTA Engine integration test suite failed!');
    process.exit(1);
  } else {
    console.log('\nAll ZTA Engine integration assertions passed successfully!');
    process.exit(0);
  }
}

runTests();
