import { NextRequest, NextResponse } from 'next/server';
import { getSimulatedSession } from '../../../../lib/session';
import { evaluateZtaAccess } from '../../../../lib/zta-engine';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file') || 'patient_record_001.txt';
  const session = await getSimulatedSession();

  // Determine container resource based on requested file
  let container: 'patient-records' | 'admin-records' | 'audit-evidence' = 'patient-records';
  if (file.includes('admin') || file.includes('invoice') || file.includes('billing')) {
    container = 'admin-records';
  } else if (file.includes('audit') || file.includes('evidence') || file.includes('log')) {
    container = 'audit-evidence';
  }

  // ZTA Access Check
  const evalResult = await evaluateZtaAccess(session.username, container, 'Read', session);
  if (!evalResult.accessGranted) {
    return NextResponse.json(
      {
        error: 'ZTA Access Denied',
        reason: evalResult.failureReason,
        policy: evalResult.policyTriggered,
      },
      { status: 403 }
    );
  }

  // Generate file content based on requested file name
  let content = '';
  let contentType = 'text/plain';

  if (file === 'patient_record_001.txt') {
    content = `================================================================================
HALLMARK MEDICAL CENTER - CONFIDENTIAL EHR CLINICAL RECORD
================================================================================
PATIENT NAME: John A. Williams
PATIENT ID: PR-2024-00142
DATE OF BIRTH: 1978-04-12 (Age: 46)
GENDER: Male | BLOOD TYPE: O-Positive
PRIMARY CARE PHYSICIAN: Dr. Sarah Jenkins, MD
CONTAINER: patient-records (Private Blob / Encrypted TLS 1.2)

--------------------------------------------------------------------------------
VITAL SIGNS (Recorded: 2024-10-24 09:30 AM)
--------------------------------------------------------------------------------
Blood Pressure: 128/82 mmHg
Heart Rate: 74 bpm
Temperature: 98.6 °F
Oxygen Saturation: 99%
Height: 5 ft 10 in
Weight: 178 lbs (BMI: 25.5 - Normal)

--------------------------------------------------------------------------------
ALLERGIES ON FILE
--------------------------------------------------------------------------------
1. Penicillin VK -> Reaction: Anaphylaxis / Severe Hives (HIGH RISK)
2. Sulfa Antibiotics -> Reaction: Moderate Cutaneous Rash

--------------------------------------------------------------------------------
IMMUNIZATION HISTORY
--------------------------------------------------------------------------------
- COVID-19 Bivalent Booster (Pfizer-BioNTech) [2023-11-04]
- Influenza Quadrivalent 2024 [2024-09-15]
- Tdap (Tetanus, Diphtheria, Pertussis) [2020-05-12]

================================================================================
CONFIDENTIALITY NOTICE: This document contains protected health information (PHI)
governed under HIPAA regulations. Unauthorised distribution is strictly prohibited.
================================================================================`;
  } else if (file === 'lab_result_001.txt') {
    content = `================================================================================
HALLMARK CENTRAL DIAGNOSTICS LAB REPORT
================================================================================
PATIENT: John A. Williams (PR-2024-00142)
REPORT ID: LAB-2024-9931
ORDERED DATE: 2024-10-24 | REPORTED DATE: 2024-10-24 14:15
FACILITY: Hallmark Central Diagnostics Laboratory

TEST PANELS & RESULTS:
1. Total Cholesterol ........ 198 mg/dL (Reference Range: < 200 mg/dL) [NORMAL]
2. LDL Cholesterol .......... 132 mg/dL (Reference Range: < 100 mg/dL) [HIGH]
3. HDL Cholesterol .......... 48 mg/dL  (Reference Range: > 40 mg/dL)  [NORMAL]
4. Triglycerides ............ 142 mg/dL (Reference Range: < 150 mg/dL) [NORMAL]
5. Fasting Glucose .......... 94 mg/dL  (Reference Range: 70-99 mg/dL) [NORMAL]

PATHOLOGIST INTERPRETIVE COMMENT:
"Lipid panel reveals mildly elevated LDL cholesterol. Fasting blood glucose is
within normal limit. Lifestyle modifications and dietary counseling recommended."

VERIFIED BY: Dr. Robert Chen, MD (Pathology)
DIGITAL SIGNATURE: R. Chen MD (SHA-256 Verified)
================================================================================`;
  } else if (file === 'prescription_001.txt') {
    content = `================================================================================
HALLMARK MEDICAL CENTER - PRESCRIPTION DISPENSING RECORD
================================================================================
PRESCRIPTION ID: RX-884920
PATIENT: John A. Williams (PR-2024-00142)
DATE ISSUED: 2024-10-24
ISSUING PHYSICIAN: Dr. Sarah Jenkins, MD
DISPENSED BY: Hallmark Outpatient Pharmacy

MEDICATION DETAILS:
Medication: Lisinopril 10 mg Oral Tablet
Dose: 1 Tablet
Frequency: Once Daily in Morning
Quantity: 30 Tablets
Refills Remaining: 3
Indication: Essential Hypertension

SPECIAL INSTRUCTIONS: Take with food or full glass of water in the morning.
Monitor blood pressure weekly.

PHYSICIAN SIGNATURE: S. Jenkins MD (Electronic Prescription Vault)
================================================================================`;
  } else {
    content = `================================================================================
HALLMARK MEDICAL CENTER - AZURE BLOB STORAGE DOCUMENT
================================================================================
FILE NAME: ${file}
CONTAINER: ${container}
ACCESSED BY: @${session.username}
TIME OF ACCESS: ${new Date().toISOString()}

AZURE ZTA EVALUATION:
- Role-Based Access Control (RBAC): GRANTED
- Conditional Access Evaluation: PASS (TLS 1.2 / Low Risk Context)
- Encryption: Customer-Managed Key (Azure Key Vault AES-256)
================================================================================`;
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${file}"`,
    },
  });
}
