import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Directory Users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().default(''),
  password: text('password').notNull().default('Password2026!'),
  displayName: text('display_name').notNull(),
  description: text('description').notNull(),
  projectMeaning: text('project_meaning').notNull(),
  avatarUrl: text('avatar_url').notNull().default('https://api.dicebear.com/7.x/avataaars/svg?seed=User'),
  status: text('status').notNull().default('Active'), // 'Active' | 'Banned'
});

// Multi-Factor Authentication (MFA) Dispatched OTPs table
export const mfaOtps = sqliteTable('mfa_otps', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: integer('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  used: integer('used').notNull().default(0),
  dispatchStatus: text('dispatch_status').notNull().default('SENT'), // 'SENT' | 'SIMULATED' | 'FAILED'
  ipAddress: text('ip_address').notNull().default('127.0.0.1'),
  createdAt: text('created_at').notNull(),
});



// Azure Entra ID Mock Security Groups
export const securityGroups = sqliteTable('security_groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
});

// Join table for users and security groups
export const userGroups = sqliteTable('user_groups', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  groupId: text('group_id').notNull().references(() => securityGroups.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.groupId] })
]);

// Privileged Identity Management (PIM / JIT) Role Activations table
export const roleActivations = sqliteTable('role_activations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleName: text('role_name').notNull(),
  justification: text('justification').notNull(),
  activatedAt: text('activated_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'EXPIRED' | 'REVOKED'
});


// Patients profile table
export const patients = sqliteTable('patients', {
  id: text('id').primaryKey(), // e.g. PR-2024-00142
  fullName: text('full_name').notNull(),
  dob: text('dob').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(),
  bloodType: text('blood_type').notNull(),
  nationality: text('nationality').notNull(),
  maritalStatus: text('marital_status').notNull(),
  address: text('address').notNull(),
  phoneHome: text('phone_home').notNull(),
  phoneMobile: text('phone_mobile').notNull(),
  email: text('email').notNull(),
  emergencyContactName: text('emergency_contact_name').notNull(),
  emergencyContactRelationship: text('emergency_contact_relationship').notNull(),
  emergencyContactPhone: text('emergency_contact_phone').notNull(),
  insuranceProvider: text('insurance_provider').notNull(),
  policyNumber: text('policy_number').notNull(),
  groupNumber: text('group_number').notNull(),
  coverageType: text('coverage_type').notNull(),
  primaryCarePhysician: text('primary_care_physician').notNull(),
  clinicName: text('clinic_name').notNull(),
  clinicPhone: text('clinic_phone').notNull(),
  lastVisitDate: text('last_visit_date').notNull(),
  nextVisitDate: text('next_visit_date').notNull(),
  clinicalNotes: text('clinical_notes').notNull(),
  department: text('department').notNull().default('Cardiology'),
  assignedClinicianId: text('assigned_clinician_id').notNull().default('doctor01'),
});


// Patient vitals
export const patientVitals = sqliteTable('patient_vitals', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  recordedDate: text('recorded_date').notNull(),
  height: text('height').notNull(), // e.g. 5'11" (180 cm)
  weight: text('weight').notNull(), // e.g. 185 lbs (83.9 kg)
  bmi: real('bmi').notNull(),
  bloodPressure: text('blood_pressure').notNull(),
  heartRate: integer('heart_rate').notNull(),
  temperature: text('temperature').notNull(),
  oxygenSaturation: integer('oxygen_saturation').notNull(),
  respiratoryRate: integer('respiratory_rate').notNull(),
});

// Patient Allergies
export const patientAllergies = sqliteTable('patient_allergies', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  allergen: text('allergen').notNull(),
  reaction: text('reaction').notNull(),
});

// Patient Immunization history
export const patientImmunizations = sqliteTable('patient_immunizations', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  vaccine: text('vaccine').notNull(),
  dateAdministered: text('date_administered').notNull(),
});

// Patient Medical History / Diagnoses
export const patientHistory = sqliteTable('patient_history', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  condition: text('condition').notNull(),
  details: text('details').notNull(),
});

// Prescriptions Header
export const prescriptions = sqliteTable('prescriptions', {
  id: text('id').primaryKey(), // RX-2024-00876
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  dateIssued: text('date_issued').notNull(),
  validUntil: text('valid_until').notNull(),
  issuingPhysician: text('issuing_physician').notNull(),
  npiNumber: text('npi_number').notNull(),
  clinicName: text('clinic_name').notNull(),
  clinicAddress: text('clinic_address').notNull(),
  clinicPhone: text('clinic_phone').notNull(),
  clinicFax: text('clinic_fax').notNull(),
  dispensedBy: text('dispensed_by').notNull(),
  pharmacist: text('pharmacist').notNull(),
  pharmacyAddress: text('pharmacy_address').notNull(),
  pharmacyPhone: text('pharmacy_phone').notNull(),
  dispenseDate: text('dispense_date').notNull(),
  patientAcknowledged: integer('patient_acknowledged').notNull(), // 0 or 1
  physicianSignature: text('physician_signature').notNull(),
  status: text('status').notNull(), // e.g. Active, Completed, Cancelled
});

// Prescription Items
export const prescriptionItems = sqliteTable('prescription_items', {
  id: text('id').primaryKey(),
  prescriptionId: text('prescription_id').notNull().references(() => prescriptions.id, { onDelete: 'cascade' }),
  medication: text('medication').notNull(),
  strength: text('strength').notNull(),
  dosageForm: text('dosage_form').notNull(),
  dose: text('dose').notNull(),
  frequency: text('frequency').notNull(),
  route: text('route').notNull(),
  quantity: text('quantity').notNull(),
  refills: text('refills').notNull(),
  indication: text('indication').notNull(),
  specialInstructions: text('special_instructions').notNull(),
});

// Lab Results Header
export const labResults = sqliteTable('lab_results', {
  id: text('id').primaryKey(), // LR-2024-00389
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  orderingPhysician: text('ordering_physician').notNull(),
  dateOrdered: text('date_ordered').notNull(),
  dateCollected: text('date_collected').notNull(),
  dateReported: text('date_reported').notNull(),
  labFacility: text('lab_facility').notNull(),
  labAddress: text('lab_address').notNull(),
  specimenType: text('specimen_type').notNull(),
  collectionMethod: text('collection_method').notNull(),
  collectionTime: text('collection_time').notNull(),
  processedBy: text('processed_by').notNull(),
  verifiedBy: text('verified_by').notNull(),
  signature: text('signature').notNull(),
  reportDate: text('report_date').notNull(),
  comments: text('comments').notNull(),
});

// Lab Result Details
export const labResultValues = sqliteTable('lab_result_values', {
  id: text('id').primaryKey(),
  labResultId: text('lab_result_id').notNull().references(() => labResults.id, { onDelete: 'cascade' }),
  panelName: text('panel_name').notNull(), // e.g. Complete Blood Count, Comprehensive Metabolic Panel
  testName: text('test_name').notNull(), // e.g. WBC, Glucose (Fasting)
  resultValue: text('result_value').notNull(),
  referenceRange: text('reference_range').notNull(),
  flag: text('flag').notNull(), // e.g. Normal, HIGH, LOW
});

// Non-clinical administrative records (billing, appointments, insurance cases)
export const adminRecords = sqliteTable('admin_records', {
  id: text('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
  recordType: text('record_type').notNull(), // 'appointment', 'billing', 'insurance'
  title: text('title').notNull(),
  details: text('details').notNull(),
  amount: real('amount'),
  status: text('status').notNull(),
  recordDate: text('record_date').notNull(),
});

// System Settings & Simulated Azure ZTA Config
export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// Simulated Azure ZTA Audit & Sign-in Logs
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  username: text('username').notNull(),
  userGroup: text('user_group').notNull(),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  accessGranted: integer('access_granted').notNull(), // 0 or 1
  riskLevel: text('risk_level').notNull(), // 'Low', 'Medium', 'High'
  location: text('location').notNull(),
  ipAddress: text('ip_address').notNull(),
  policyTriggered: text('policy_triggered').notNull(), // e.g. CA001, CA002, CA003, CA004, RBAC
  failureReason: text('failure_reason').notNull(),
});

// Relations setup
export const usersRelations = relations(users, ({ many }) => ({
  userGroups: many(userGroups),
}));

export const securityGroupsRelations = relations(securityGroups, ({ many }) => ({
  userGroups: many(userGroups),
}));

export const userGroupsRelations = relations(userGroups, ({ one }) => ({
  user: one(users, { fields: [userGroups.userId], references: [users.id] }),
  group: one(securityGroups, { fields: [userGroups.groupId], references: [securityGroups.id] }),
}));

export const patientRelations = relations(patients, ({ many }) => ({
  vitals: many(patientVitals),
  allergies: many(patientAllergies),
  immunizations: many(patientImmunizations),
  history: many(patientHistory),
  prescriptions: many(prescriptions),
  labResults: many(labResults),
  adminRecords: many(adminRecords),
}));

export const prescriptionRelations = relations(prescriptions, ({ one, many }) => ({
  patient: one(patients, { fields: [prescriptions.patientId], references: [patients.id] }),
  items: many(prescriptionItems),
}));

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one }) => ({
  prescription: one(prescriptions, { fields: [prescriptionItems.prescriptionId], references: [prescriptions.id] }),
}));

export const labResultRelations = relations(labResults, ({ one, many }) => ({
  patient: one(patients, { fields: [labResults.patientId], references: [patients.id] }),
  values: many(labResultValues),
}));

export const labResultValuesRelations = relations(labResultValues, ({ one }) => ({
  labResult: one(labResults, { fields: [labResultValues.labResultId], references: [labResults.id] }),
}));

export const adminRecordRelations = relations(adminRecords, ({ one }) => ({
  patient: one(patients, { fields: [adminRecords.patientId], references: [patients.id] }),
}));
