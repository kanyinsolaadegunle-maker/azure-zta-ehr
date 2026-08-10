import { db, client } from '../db/index';
import * as schema from '../db/schema';
import * as dotenv from 'dotenv';
dotenv.config();

async function runSeed() {
  console.log('--- Starting Data Seeding for zt-ehr-policy-engine ---');

  try {
    // 0. Ensure DDL tables exist
    console.log('Initializing DDL tables...');
    await client.execute(`CREATE TABLE IF NOT EXISTS admin_records (id text PRIMARY KEY NOT NULL, patient_id text NOT NULL, record_type text NOT NULL, title text NOT NULL, details text NOT NULL, amount real, status text NOT NULL, record_date text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS audit_logs (id text PRIMARY KEY NOT NULL, timestamp text NOT NULL, username text NOT NULL, user_group text NOT NULL, action text NOT NULL, resource text NOT NULL, access_granted integer NOT NULL, risk_level text NOT NULL, location text NOT NULL, ip_address text NOT NULL, policy_triggered text NOT NULL, failure_reason text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS lab_results (id text PRIMARY KEY NOT NULL, patient_id text NOT NULL, ordering_physician text NOT NULL, date_ordered text NOT NULL, date_collected text NOT NULL, date_reported text NOT NULL, lab_facility text NOT NULL, lab_address text NOT NULL, specimen_type text NOT NULL, collection_method text NOT NULL, collection_time text NOT NULL, processed_by text NOT NULL, verified_by text NOT NULL, signature text NOT NULL, report_date text NOT NULL, comments text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS lab_result_values (id text PRIMARY KEY NOT NULL, lab_result_id text NOT NULL, panel_name text NOT NULL, test_name text NOT NULL, result_value text NOT NULL, reference_range text NOT NULL, flag text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS patients (id text PRIMARY KEY NOT NULL, full_name text NOT NULL, dob text NOT NULL, age integer NOT NULL, gender text NOT NULL, blood_type text NOT NULL, nationality text NOT NULL, marital_status text NOT NULL, address text NOT NULL, phone_home text NOT NULL, phone_mobile text NOT NULL, email text NOT NULL, emergency_contact_name text NOT NULL, emergency_contact_relationship text NOT NULL, emergency_contact_phone text NOT NULL, insurance_provider text NOT NULL, policy_number text NOT NULL, group_number text NOT NULL, coverage_type text NOT NULL, primary_care_physician text NOT NULL, clinic_name text NOT NULL, clinic_phone text NOT NULL, last_visit_date text NOT NULL, next_visit_date text NOT NULL, clinical_notes text NOT NULL, department text DEFAULT 'Cardiology' NOT NULL, assigned_clinician_id text DEFAULT 'doctor01' NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS patient_vitals (id text PRIMARY KEY NOT NULL, patient_id text NOT NULL, recorded_date text NOT NULL, height text NOT NULL, weight text NOT NULL, bmi real NOT NULL, blood_pressure text NOT NULL, heart_rate integer NOT NULL, temperature text NOT NULL, oxygen_saturation integer NOT NULL, respiratory_rate integer NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS patient_allergies (id text PRIMARY KEY NOT NULL, patient_id text NOT NULL, allergen text NOT NULL, reaction text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS patient_history (id text PRIMARY KEY NOT NULL, patient_id text NOT NULL, condition text NOT NULL, details text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS patient_immunizations (id text PRIMARY KEY NOT NULL, patient_id text NOT NULL, vaccine text NOT NULL, date_administered text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS prescriptions (id text PRIMARY KEY NOT NULL, patient_id text NOT NULL, date_issued text NOT NULL, valid_until text NOT NULL, issuing_physician text NOT NULL, npi_number text NOT NULL, clinic_name text NOT NULL, clinic_address text NOT NULL, clinic_phone text NOT NULL, clinic_fax text NOT NULL, dispensed_by text NOT NULL, pharmacist text NOT NULL, pharmacy_address text NOT NULL, pharmacy_phone text NOT NULL, dispense_date text NOT NULL, patient_acknowledged integer NOT NULL, physician_signature text NOT NULL, status text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS prescription_items (id text PRIMARY KEY NOT NULL, prescription_id text NOT NULL, medication text NOT NULL, strength text NOT NULL, dosage_form text NOT NULL, dose text NOT NULL, frequency text NOT NULL, route text NOT NULL, quantity text NOT NULL, refills text NOT NULL, indication text NOT NULL, special_instructions text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS role_activations (id text PRIMARY KEY NOT NULL, user_id text NOT NULL, role_name text NOT NULL, justification text NOT NULL, activated_at text NOT NULL, expires_at text NOT NULL, status text DEFAULT 'ACTIVE' NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS security_groups (id text PRIMARY KEY NOT NULL, name text UNIQUE NOT NULL, description text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS system_settings (key text PRIMARY KEY NOT NULL, value text NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY NOT NULL, username text UNIQUE NOT NULL, password text DEFAULT 'Password2026!' NOT NULL, display_name text NOT NULL, description text NOT NULL, project_meaning text NOT NULL, avatar_url text DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=User' NOT NULL, status text DEFAULT 'Active' NOT NULL);`);
    await client.execute(`CREATE TABLE IF NOT EXISTS user_groups (user_id text NOT NULL, group_id text NOT NULL, PRIMARY KEY(user_id, group_id));`);

    // 1. Clean existing data
    console.log('Cleaning old records...');
    await db.delete(schema.auditLogs);
    await db.delete(schema.systemSettings);
    await db.delete(schema.adminRecords);
    await db.delete(schema.labResultValues);
    await db.delete(schema.labResults);
    await db.delete(schema.prescriptionItems);
    await db.delete(schema.prescriptions);
    await db.delete(schema.patientHistory);
    await db.delete(schema.patientImmunizations);
    await db.delete(schema.patientAllergies);
    await db.delete(schema.patientVitals);
    await db.delete(schema.patients);
    await db.delete(schema.userGroups);
    await db.delete(schema.securityGroups);
    await db.delete(schema.users);
    console.log('Clean complete.');

    // 2. Insert Security Groups
    console.log('Seeding security groups...');
    const groups = [
      { id: 'g-doctors', name: 'EHR-Doctors', description: 'Security group for doctors who require authorised access to cloud-based EHR patient records.' },
      { id: 'g-nurses', name: 'EHR-Nurses', description: 'Security group for nurses with limited access to approved patient-care EHR records.' },
      { id: 'g-records', name: 'EHR-Records-Admins', description: 'Security group for records and administrative staff who manage non-clinical EHR information.' },
      { id: 'g-security', name: 'EHR-IT-Security', description: 'Security group for IT security staff responsible for monitoring, access review and incident response.' },
      { id: 'g-admins', name: 'EHR-Cloud-Admins', description: 'Security group for cloud administrators responsible for managing Azure EHR cloud resources.' },
      { id: 'g-vendors', name: 'EHR-Vendors', description: 'Security group for third-party vendors with restricted and monitored access to approved technical resources.' },
      { id: 'g-auditors', name: 'EHR-Auditors', description: 'Security group for auditors who review access logs, compliance evidence and security reports.' },
    ];
    await db.insert(schema.securityGroups).values(groups);

    // 3. Insert Mock Users with Generated Passwords, Profile Avatars, and Active Status
    console.log('Seeding users...');
    const mockUsers = [
      {
        id: 'u-globaladmin01',
        username: 'globaladmin01',
        password: 'GlobalMasterAdmin2026!',
        displayName: 'Global Master Administrator',
        description: 'globaladmin01',
        projectMeaning: 'Master Administrator with unrestricted global access across all EHR modules and Azure configuration',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        status: 'Active',
      },
      {
        id: 'u-doctor01',
        username: 'doctor01',
        password: 'DoctorPass2026!',
        displayName: 'Doctor User',
        description: 'doctor01',
        projectMeaning: 'Clinical user who requires access to patient records',
        avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80',
        status: 'Active',
      },

      {
        id: 'u-nurse01',
        username: 'nurse01',
        password: 'NursePass2026!',
        displayName: 'Nurse User',
        description: 'nurse01',
        projectMeaning: 'Clinical user with limited patient-care access',
        avatarUrl: 'https://images.unsplash.com/photo-1594824813566-7885a65c9172?auto=format&fit=crop&w=256&q=80',
        status: 'Active',
      },
      {
        id: 'u-recordsadmin01',
        username: 'recordsadmin01',
        password: 'RecordsAdmin2026!',
        displayName: 'Records Admin User',
        description: 'recordsadmin01',
        projectMeaning: 'Administrative user for non-clinical records',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
        status: 'Active',
      },
      {
        id: 'u-itsecurityadmin01',
        username: 'itsecurityadmin01',
        password: 'SecurityAdmin2026#',
        displayName: 'IT Security Admin User',
        description: 'itsecurityadmin01',
        projectMeaning: 'Security monitoring and incident response user (Super Admin)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        status: 'Active',
      },
      {
        id: 'u-cloudadmin01',
        username: 'cloudadmin01',
        password: 'CloudAdmin2026#',
        displayName: 'Cloud Admin User',
        description: 'cloudadmin01',
        projectMeaning: 'Cloud resource management user (Super Admin)',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        status: 'Active',
      },
      {
        id: 'u-vendor01',
        username: 'vendor01',
        password: 'VendorPass2026!',
        displayName: 'Vendor User',
        description: 'vendor01',
        projectMeaning: 'Third-party vendor with restricted technical access',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
        status: 'Active',
      },
      {
        id: 'u-auditor01',
        username: 'auditor01',
        password: 'AuditorPass2026!',
        displayName: 'Auditor User',
        description: 'auditor01',
        projectMeaning: 'Compliance/audit user for reviewing logs and evidence',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
        status: 'Active',
      },
      {
        id: 'u-officer-hmc',
        username: 'officer@hmc.com',
        password: 'officer123',
        displayName: 'Security Officer',
        description: 'officer@hmc.com',
        projectMeaning: 'Security Officer and IT Security Administrator',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        status: 'Active',
      },
      {
        id: 'u-emergency-admin',
        username: 'emergency.admin',
        password: 'BreakGlass#SuperAdmin2026',
        displayName: 'Emergency Admin User',
        description: 'emergency.admin',
        projectMeaning: 'Emergency break-glass super admin account (Bypasses blocking policies)',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
        status: 'Active',
      },
    ];
    await db.insert(schema.users).values(mockUsers);



    // 4. Map Users to Security Groups
    console.log('Mapping users to groups...');
    const userGroupMappings = [
      { userId: 'u-globaladmin01', groupId: 'g-admins' },
      { userId: 'u-doctor01', groupId: 'g-doctors' },

      { userId: 'u-nurse01', groupId: 'g-nurses' },
      { userId: 'u-recordsadmin01', groupId: 'g-records' },
      { userId: 'u-itsecurityadmin01', groupId: 'g-security' },
      { userId: 'u-officer-hmc', groupId: 'g-security' },
      { userId: 'u-cloudadmin01', groupId: 'g-admins' },
      { userId: 'u-vendor01', groupId: 'g-vendors' },
      { userId: 'u-auditor01', groupId: 'g-auditors' },
      // emergency.admin is kept unbound to ordinary groups for isolation
    ];
    await db.insert(schema.userGroups).values(userGroupMappings);

    // 5. Insert Patient Record (John A. Williams)
    console.log('Seeding patient profile...');
    const patientId = 'PR-2024-00142';
    await db.insert(schema.patients).values({
      id: patientId,
      fullName: 'John A. Williams',
      dob: '14 March 1978',
      age: 46,
      gender: 'Male',
      bloodType: 'O+',
      nationality: 'American',
      maritalStatus: 'Married',
      address: '452 Maplewood Drive, Springfield, IL 62704',
      phoneHome: '(217) 555-0183',
      phoneMobile: '(217) 555-0247',
      email: 'j.williams.dummy@example.com',
      emergencyContactName: 'Sarah Williams',
      emergencyContactRelationship: 'Wife',
      emergencyContactPhone: '(217) 555-0312',
      insuranceProvider: 'DummyCare Health Insurance',
      policyNumber: 'DC-7734-001-WIL',
      groupNumber: 'GRP-44892',
      coverageType: 'Family Plan',
      primaryCarePhysician: 'Dr. Emily Carson, MD',
      clinicName: 'Hallmark Medical Center',
      clinicPhone: '(217) 555-0900',
      lastVisitDate: '10 January 2024',
      nextVisitDate: '10 July 2024',
      assignedClinicianId: 'doctor01',
      department: 'Cardiology',
      clinicalNotes: 'Patient presenting with mild hypertension and routine lipid monitoring requirement. Managed by Cardiology department.',
    });

    await db.insert(schema.patients).values({
      id: 'PR-2024-00199',
      fullName: 'Eleanor Vance',
      dob: '22 August 1985',
      age: 39,
      gender: 'Female',
      bloodType: 'A+',
      nationality: 'American',
      maritalStatus: 'Single',
      address: '789 Oakridge Ave, Springfield, IL 62702',
      phoneHome: '(217) 555-0899',
      phoneMobile: '(217) 555-0921',
      email: 'e.vance@example.com',
      emergencyContactName: 'Marcus Vance',
      emergencyContactRelationship: 'Brother',
      emergencyContactPhone: '(217) 555-0988',
      insuranceProvider: 'BlueCross Health Plan',
      policyNumber: 'BC-9921-002-VAN',
      groupNumber: 'GRP-10482',
      coverageType: 'Individual PPO',
      primaryCarePhysician: 'Dr. Robert Vance, MD',
      clinicName: 'Hallmark Medical Center',
      clinicPhone: '(217) 555-0900',
      lastVisitDate: '15 February 2024',
      nextVisitDate: '15 August 2024',
      clinicalNotes: 'Patient assigned to Dr. Robert Vance. Routine oncology screening.',
      assignedClinicianId: 'doctor02',
      department: 'Oncology',
    });


    // 6. Patient Vitals
    console.log('Seeding vitals...');
    await db.insert(schema.patientVitals).values({
      id: 'vit-001',
      patientId,
      recordedDate: '10 January 2024',
      height: '5\'11" (180 cm)',
      weight: '185 lbs (83.9 kg)',
      bmi: 25.8,
      bloodPressure: '122/78 mmHg',
      heartRate: 72,
      temperature: '98.6°F (37.0°C)',
      oxygenSaturation: 98,
      respiratoryRate: 16,
    });

    // 7. Patient Allergies
    console.log('Seeding allergies...');
    await db.insert(schema.patientAllergies).values([
      { id: 'alg-001', patientId, allergen: 'Penicillin', reaction: 'causes rash and hives' },
      { id: 'alg-002', patientId, allergen: 'Sulfa drugs', reaction: 'causes nausea' },
    ]);

    // 8. Patient Immunizations
    console.log('Seeding immunizations...');
    await db.insert(schema.patientImmunizations).values([
      { id: 'imm-001', patientId, vaccine: 'Influenza Vaccine', dateAdministered: 'Oct 2023' },
      { id: 'imm-002', patientId, vaccine: 'COVID-19 (Booster)', dateAdministered: 'Sep 2023' },
      { id: 'imm-003', patientId, vaccine: 'Tetanus (Td)', dateAdministered: '2019' },
      { id: 'imm-004', patientId, vaccine: 'Hepatitis B Series', dateAdministered: 'Completed 2005' },
    ]);

    // 9. Patient Medical History
    console.log('Seeding history...');
    await db.insert(schema.patientHistory).values([
      { id: 'his-001', patientId, condition: 'Hypertension', details: 'diagnosed 2015, managed with medication' },
      { id: 'his-002', patientId, condition: 'Type 2 Diabetes', details: 'diagnosed 2019, diet-controlled' },
      { id: 'his-003', patientId, condition: 'Appendectomy', details: '2003 surgical procedure' },
    ]);

    // 10. Prescription Header
    console.log('Seeding prescriptions...');
    const rxId = 'RX-2024-00876';
    await db.insert(schema.prescriptions).values({
      id: rxId,
      patientId,
      dateIssued: '10 January 2024',
      validUntil: '10 January 2025',
      issuingPhysician: 'Dr. Emily Carson, MD',
      npiNumber: '1234567890 (Dummy)',
      clinicName: 'Hallmark Medical Center',
      clinicAddress: '100 North Medical Pkwy, Springfield, IL 62701',
      clinicPhone: '(217) 555-0900',
      clinicFax: '(217) 555-0901',
      dispensedBy: 'Springfield Central Pharmacy (Dummy)',
      pharmacist: 'Pharm. David Lee, RPh (Dummy)',
      pharmacyAddress: '85 Oak Street, Springfield, IL 62702',
      pharmacyPhone: '(217) 555-0770',
      dispenseDate: '10 January 2024',
      patientAcknowledged: 1,
      physicianSignature: 'Dr. Emily Carson, MD [Electronic Signature on File]',
      status: 'Active',
    });

    // Prescription Items
    console.log('Seeding prescription items...');
    await db.insert(schema.prescriptionItems).values([
      {
        id: 'rxi-001',
        prescriptionId: rxId,
        medication: 'Lisinopril',
        strength: '10 mg',
        dosageForm: 'Oral Tablet',
        dose: '1 tablet',
        frequency: 'Once daily (morning)',
        route: 'Oral',
        quantity: '90 tablets',
        refills: '3 refills authorized',
        indication: 'Hypertension (blood pressure management)',
        specialInstructions: 'Take in the morning with or without food. Avoid potassium supplements unless advised by physician. Monitor for dizziness, especially in first few days. Report persistent dry cough to physician.',
      },
      {
        id: 'rxi-002',
        prescriptionId: rxId,
        medication: 'Metformin Hydrochloride',
        strength: '500 mg',
        dosageForm: 'Extended-Release Oral Tablet',
        dose: '1 tablet',
        frequency: 'Twice daily (morning and evening)',
        route: 'Oral',
        quantity: '180 tablets',
        refills: '3 refills authorized',
        indication: 'Type 2 Diabetes Mellitus (glycemic control)',
        specialInstructions: 'Take with meals to reduce gastrointestinal side effects. Do not crush or chew extended-release tablets. Monitor blood glucose as directed. Temporarily hold dose before any contrast imaging procedure.',
      },
      {
        id: 'rxi-003',
        prescriptionId: rxId,
        medication: 'Aspirin (Acetylsalicylic Acid)',
        strength: '81 mg',
        dosageForm: 'Enteric-Coated Oral Tablet',
        dose: '1 tablet',
        frequency: 'Once daily (morning)',
        route: 'Oral',
        quantity: '90 tablets',
        refills: '3 refills authorized',
        indication: 'Cardiovascular disease prevention (prophylactic)',
        specialInstructions: 'Take with food or a full glass of water. Do not take with ibuprofen at the same time. Inform dentist or surgeon of aspirin use before any procedure. Discontinue and contact physician if unusual bleeding occurs.',
      },
    ]);

    // 11. Laboratory Results Header
    console.log('Seeding lab reports...');
    const labId = 'LR-2024-00389';
    await db.insert(schema.labResults).values({
      id: labId,
      patientId,
      orderingPhysician: 'Dr. Emily Carson, MD',
      dateOrdered: '08 January 2024',
      dateCollected: '09 January 2024',
      dateReported: '10 January 2024',
      labFacility: 'Hallmark Medical Center Diagnostics Laboratory',
      labAddress: '200 West Clinic Blvd, Springfield, IL 62701',
      specimenType: 'Venous Blood',
      collectionMethod: 'Venipuncture',
      collectionTime: '07:45 AM (Fasting – 10 hrs)',
      processedBy: 'Lab Tech ID: LT-0045',
      verifiedBy: 'Dr. Rachel Moore, MD (Pathologist)',
      signature: '[Electronic Signature on File]',
      reportDate: '10 January 2024',
      comments: 'Fasting glucose and HbA1c are slightly elevated, consistent with known Type 2 Diabetes diagnosis. Patient is advised to continue Metformin and dietary modifications. Repeat HbA1c recommended in 3 months. All other panels within normal limits.',
    });

    // Laboratory Result Details
    console.log('Seeding lab values...');
    const labValues = [
      // Complete Blood Count (CBC)
      { id: 'lbv-001', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'WBC (White Blood Cells)', resultValue: '6.8 x10³/µL', referenceRange: '4.5–11.0', flag: 'Normal' },
      { id: 'lbv-002', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'RBC (Red Blood Cells)', resultValue: '5.1 x10⁶/µL', referenceRange: '4.5–5.9', flag: 'Normal' },
      { id: 'lbv-003', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'Hemoglobin (Hgb)', resultValue: '14.8 g/dL', referenceRange: '13.5–17.5', flag: 'Normal' },
      { id: 'lbv-004', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'Hematocrit (Hct)', resultValue: '44.2%', referenceRange: '41–53%', flag: 'Normal' },
      { id: 'lbv-005', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'MCV', resultValue: '88.4 fL', referenceRange: '80–100', flag: 'Normal' },
      { id: 'lbv-006', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'MCH', resultValue: '29.0 pg', referenceRange: '27–33', flag: 'Normal' },
      { id: 'lbv-007', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'MCHC', resultValue: '33.5 g/dL', referenceRange: '32–36', flag: 'Normal' },
      { id: 'lbv-008', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'Platelets', resultValue: '245 x10³/µL', referenceRange: '150–400', flag: 'Normal' },
      { id: 'lbv-009', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'Neutrophils', resultValue: '58%', referenceRange: '50–70%', flag: 'Normal' },
      { id: 'lbv-010', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'Lymphocytes', resultValue: '32%', referenceRange: '20–40%', flag: 'Normal' },
      { id: 'lbv-011', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'Monocytes', resultValue: '7%', referenceRange: '2–10%', flag: 'Normal' },
      { id: 'lbv-012', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'Eosinophils', resultValue: '2%', referenceRange: '1–4%', flag: 'Normal' },
      { id: 'lbv-013', labResultId: labId, panelName: 'Complete Blood Count (CBC)', testName: 'Basophils', resultValue: '1%', referenceRange: '0–1%', flag: 'Normal' },

      // Comprehensive Metabolic Panel (CMP)
      { id: 'lbv-014', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'Glucose (Fasting)', resultValue: '118 mg/dL', referenceRange: '70–99', flag: 'HIGH' },
      { id: 'lbv-015', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'BUN (Blood Urea Nitrogen)', resultValue: '17 mg/dL', referenceRange: '7–20', flag: 'Normal' },
      { id: 'lbv-016', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'Creatinine', resultValue: '0.9 mg/dL', referenceRange: '0.6–1.2', flag: 'Normal' },
      { id: 'lbv-017', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'eGFR', resultValue: '>60 mL/min', referenceRange: '>60', flag: 'Normal' },
      { id: 'lbv-018', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'Sodium', resultValue: '139 mEq/L', referenceRange: '136–145', flag: 'Normal' },
      { id: 'lbv-019', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'Potassium', resultValue: '4.1 mEq/L', referenceRange: '3.5–5.1', flag: 'Normal' },
      { id: 'lbv-020', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'Chloride', resultValue: '101 mEq/L', referenceRange: '98–107', flag: 'Normal' },
      { id: 'lbv-021', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'CO2 (Bicarbonate)', resultValue: '24 mEq/L', referenceRange: '22–29', flag: 'Normal' },
      { id: 'lbv-022', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'Calcium', resultValue: '9.4 mg/dL', referenceRange: '8.5–10.5', flag: 'Normal' },
      { id: 'lbv-023', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'Total Protein', resultValue: '7.2 g/dL', referenceRange: '6.3–8.2', flag: 'Normal' },
      { id: 'lbv-024', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'Albumin', resultValue: '4.0 g/dL', referenceRange: '3.5–5.0', flag: 'Normal' },
      { id: 'lbv-025', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'Total Bilirubin', resultValue: '0.6 mg/dL', referenceRange: '0.2–1.2', flag: 'Normal' },
      { id: 'lbv-026', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'ALP', resultValue: '72 U/L', referenceRange: '44–147', flag: 'Normal' },
      { id: 'lbv-027', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'AST', resultValue: '28 U/L', referenceRange: '10–40', flag: 'Normal' },
      { id: 'lbv-028', labResultId: labId, panelName: 'Comprehensive Metabolic Panel (CMP)', testName: 'ALT', resultValue: '31 U/L', referenceRange: '7–56', flag: 'Normal' },

      // Lipid Panel
      { id: 'lbv-029', labResultId: labId, panelName: 'Lipid Panel', testName: 'Total Cholesterol', resultValue: '198 mg/dL', referenceRange: '<200', flag: 'Normal' },
      { id: 'lbv-030', labResultId: labId, panelName: 'Lipid Panel', testName: 'LDL Cholesterol', resultValue: '118 mg/dL', referenceRange: '<130', flag: 'Normal' },
      { id: 'lbv-031', labResultId: labId, panelName: 'Lipid Panel', testName: 'HDL Cholesterol', resultValue: '52 mg/dL', referenceRange: '>40', flag: 'Normal' },
      { id: 'lbv-032', labResultId: labId, panelName: 'Lipid Panel', testName: 'Triglycerides', resultValue: '142 mg/dL', referenceRange: '<150', flag: 'Normal' },
      { id: 'lbv-033', labResultId: labId, panelName: 'Lipid Panel', testName: 'LDL/HDL Ratio', resultValue: '2.3', referenceRange: '<3.5', flag: 'Normal' },

      // Diabetes Markers
      { id: 'lbv-034', labResultId: labId, panelName: 'Diabetes Markers', testName: 'HbA1c', resultValue: '6.9%', referenceRange: '<5.7% (Normal)', flag: 'HIGH' },
    ];
    await db.insert(schema.labResultValues).values(labValues);

    // 12. Non-clinical Administrative Records
    console.log('Seeding admin records...');
    await db.insert(schema.adminRecords).values([
      {
        id: 'adm-001',
        patientId,
        recordType: 'appointment',
        title: 'Routine Health Checkup',
        details: 'Physician: Dr. Emily Carson. Notes: Discussion on Type 2 Diabetes maintenance and blood pressure levels. Routine blood collection ordered.',
        amount: 150.0,
        status: 'Completed',
        recordDate: '10 January 2024',
      },
      {
        id: 'adm-002',
        patientId,
        recordType: 'billing',
        title: 'CBC & CMP Diagnostic Lab Bill',
        details: 'Invoice: INV-9827361. Facility: Hallmark Medical Center Diagnostics Laboratory. Coverage applied: DummyCare Health Insurance.',
        amount: 85.0,
        status: 'Paid',
        recordDate: '11 January 2024',
      },
      {
        id: 'adm-003',
        patientId,
        recordType: 'appointment',
        title: 'Follow-up Clinical Visit',
        details: 'Physician: Dr. Emily Carson. Purpose: Review HbA1c levels after 6 months of metformin treatment. Patient scheduled in advance.',
        amount: 150.0,
        status: 'Scheduled',
        recordDate: '10 July 2024',
      },
      {
        id: 'adm-004',
        patientId,
        recordType: 'insurance',
        title: 'Coverage Verification',
        details: 'Policy Number: DC-7734-001-WIL. Active Family Plan. Group number GRP-44892. Deductible met: $500. Copay: $20.',
        amount: undefined,
        status: 'Active',
        recordDate: '01 January 2024',
      },
    ]);

    // 13. System Settings
    console.log('Seeding system settings...');
    await db.insert(schema.systemSettings).values([
      { key: 'simulated_organization', value: 'Hallmark Health Center' },

      { key: 'resource_group', value: 'rg-hallmark-ehr-zta' },
      { key: 'storage_account', value: 'hallmarkztestorage' },
      { key: 'allow_blob_anonymous_access', value: 'Disabled' },
      { key: 'secure_transfer_required', value: 'Enabled' },
      { key: 'minimum_tls_version', value: 'TLS 1.2 or higher' },
      { key: 'budget_threshold', value: '10.00' },
      { key: 'budget_spent', value: '1.45' },
      { key: 'budget_alerts_recipient', value: 'kanyinsolaadegunle@gmail.com' },
      { key: 'ca_require_mfa_all', value: 'CA001 - Active' },
      { key: 'ca_block_high_risk', value: 'CA002 - Active' },
      { key: 'ca_mfa_medium_risk', value: 'CA003 - Active' },
      { key: 'ca_require_mfa_admins', value: 'CA004 - Active' },
    ]);


    // 14. Audit Logs (Initial History)
    console.log('Seeding initial audit logs...');
    await db.insert(schema.auditLogs).values([
      {
        id: 'aud-log-001',
        timestamp: '2026-08-09T08:00:00.000Z',
        username: 'cloudadmin01',
        userGroup: 'EHR-Cloud-Admins',
        action: 'Create Storage Account',
        resource: 'meditrustztestorage',
        accessGranted: 1,
        riskLevel: 'Low',
        location: 'United States',
        ipAddress: '52.148.10.22',
        policyTriggered: 'RBAC',
        failureReason: '',
      },
      {
        id: 'aud-log-002',
        timestamp: '2026-08-09T08:05:00.000Z',
        username: 'cloudadmin01',
        userGroup: 'EHR-Cloud-Admins',
        action: 'Configure Storage Security Settings',
        resource: 'meditrustztestorage/Configuration',
        accessGranted: 1,
        riskLevel: 'Low',
        location: 'United States',
        ipAddress: '52.148.10.22',
        policyTriggered: 'RBAC',
        failureReason: '',
      },
      {
        id: 'aud-log-003',
        timestamp: '2026-08-09T08:10:00.000Z',
        username: 'cloudadmin01',
        userGroup: 'EHR-Cloud-Admins',
        action: 'Create Private Containers',
        resource: 'meditrustztestorage/containers',
        accessGranted: 1,
        riskLevel: 'Low',
        location: 'United States',
        ipAddress: '52.148.10.22',
        policyTriggered: 'RBAC',
        failureReason: '',
      },
      {
        id: 'aud-log-004',
        timestamp: '2026-08-09T08:15:00.000Z',
        username: 'doctor01',
        userGroup: 'EHR-Doctors',
        action: 'Upload Dummy EHR File',
        resource: 'patient-records/patient_record_001.txt',
        accessGranted: 1,
        riskLevel: 'Low',
        location: 'United States',
        ipAddress: '198.51.100.12',
        policyTriggered: 'RBAC',
        failureReason: '',
      },
    ]);

    console.log('--- Database Seeding Completed Successfully! ---');
  } catch (error) {
    console.error('Error during data seeding:', error);
    process.exit(1);
  }
}

runSeed();
