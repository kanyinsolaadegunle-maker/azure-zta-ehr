export interface PatientClinicalRecord {
  id: string;
  fullName: string;
  dob: string;
  age: number;
  gender: string;
  bloodType: string;
  primaryCarePhysician: string;
  assignedDoctorUsername: string;
  vitals: {
    id: string;
    recordedDate: string;
    bloodPressure: string;
    heartRate: number;
    temperature: string;
    oxygenSaturation: number;
    height: string;
    weight: string;
    bmi: string;
  }[];
  allergies: {
    id: string;
    allergen: string;
    reaction: string;
  }[];
  immunizations: {
    id: string;
    vaccine: string;
    dateAdministered: string;
  }[];
  prescriptions: {
    id: string;
    dateIssued: string;
    issuingPhysician: string;
    dispensedBy: string;
    status: string;
    items: {
      id: string;
      medication: string;
      strength: string;
      dose: string;
      frequency: string;
      route: string;
      quantity: string;
      refills: string;
      indication: string;
      specialInstructions: string;
    }[];
  }[];
  labResults: {
    id: string;
    dateOrdered: string;
    dateReported: string;
    labFacility: string;
    comments: string;
    verifiedBy: string;
    signature: string;
    values: {
      id: string;
      panelName: string;
      testName: string;
      resultValue: string;
      referenceRange: string;
      flag: string;
    }[];
  }[];
}

export const INITIAL_PATIENTS: PatientClinicalRecord[] = [
  {
    id: 'PR-2024-00142',
    fullName: 'John A. Williams',
    dob: '1978-04-12',
    age: 46,
    gender: 'Male',
    bloodType: 'O-Positive',
    primaryCarePhysician: 'Dr. Emily Carson, MD',
    assignedDoctorUsername: 'doctor01',
    vitals: [
      {
        id: 'v-001',
        recordedDate: '2024-10-24 09:30',
        bloodPressure: '128/82 mmHg',
        heartRate: 74,
        temperature: '98.6 °F',
        oxygenSaturation: 99,
        height: '5 ft 10 in',
        weight: '178 lbs',
        bmi: '25.5',
      },
    ],
    allergies: [
      { id: 'alg-01', allergen: 'Penicillin VK', reaction: 'Anaphylaxis / Severe Hives' },
      { id: 'alg-02', allergen: 'Sulfa Antibiotics', reaction: 'Moderate Cutaneous Rash' },
    ],
    immunizations: [
      { id: 'imm-01', vaccine: 'COVID-19 Bivalent Booster (Pfizer-BioNTech)', dateAdministered: '2023-11-04' },
      { id: 'imm-02', vaccine: 'Influenza Quadrivalent 2024', dateAdministered: '2024-09-15' },
      { id: 'imm-03', vaccine: 'Tdap (Tetanus, Diphtheria, Pertussis)', dateAdministered: '2020-05-12' },
    ],
    prescriptions: [
      {
        id: 'RX-884920',
        dateIssued: '2024-10-24',
        issuingPhysician: 'Dr. Emily Carson, MD',
        dispensedBy: 'Hallmark Outpatient Pharmacy',
        status: 'Active',
        items: [
          {
            id: 'rxitem-01',
            medication: 'Lisinopril',
            strength: '10 mg',
            dose: '1 tablet',
            frequency: 'Once Daily in Morning',
            route: 'Oral',
            quantity: '30 Tablets',
            refills: '3',
            indication: 'Essential Hypertension',
            specialInstructions: 'Take with food or glass of water.',
          },
        ],
      },
    ],
    labResults: [
      {
        id: 'LAB-2024-9931',
        dateOrdered: '2024-10-24',
        dateReported: '2024-10-24 14:15',
        labFacility: 'Hallmark Central Diagnostics Lab',
        comments: 'Lipid panel reveals mildly elevated LDL cholesterol. Fasting blood glucose is within normal limit.',
        verifiedBy: 'Dr. Robert Chen, MD (Pathology)',
        signature: 'R. Chen MD (Digitally Signed)',
        values: [
          { id: 'val-01', panelName: 'Lipid Panel', testName: 'Total Cholesterol', resultValue: '198 mg/dL', referenceRange: '< 200 mg/dL', flag: 'NORMAL' },
          { id: 'val-02', panelName: 'Lipid Panel', testName: 'LDL Cholesterol', resultValue: '132 mg/dL', referenceRange: '< 100 mg/dL', flag: 'HIGH' },
          { id: 'val-03', panelName: 'Lipid Panel', testName: 'HDL Cholesterol', resultValue: '48 mg/dL', referenceRange: '> 40 mg/dL', flag: 'NORMAL' },
          { id: 'val-04', panelName: 'Lipid Panel', testName: 'Triglycerides', resultValue: '142 mg/dL', referenceRange: '< 150 mg/dL', flag: 'NORMAL' },
          { id: 'val-05', panelName: 'Metabolic Panel', testName: 'Fasting Plasma Glucose', resultValue: '94 mg/dL', referenceRange: '70 - 99 mg/dL', flag: 'NORMAL' },
        ],
      },
    ],
  },
  {
    id: 'PR-2026-00201',
    fullName: 'Sophia R. Martinez',
    dob: '1990-08-22',
    age: 35,
    gender: 'Female',
    bloodType: 'A-Positive',
    primaryCarePhysician: 'Dr. Emily Carson, MD',
    assignedDoctorUsername: 'doctor01',
    vitals: [
      {
        id: 'v-002',
        recordedDate: '2026-01-15 10:15',
        bloodPressure: '116/76 mmHg',
        heartRate: 68,
        temperature: '98.4 °F',
        oxygenSaturation: 100,
        height: '5 ft 6 in',
        weight: '142 lbs',
        bmi: '22.9',
      },
    ],
    allergies: [
      { id: 'alg-03', allergen: 'Latex', reaction: 'Contact Dermatitis' },
    ],
    immunizations: [
      { id: 'imm-04', vaccine: 'HPV 9-valent Vaccine (Gardasil 9)', dateAdministered: '2022-03-10' },
      { id: 'imm-05', vaccine: 'Influenza Quadrivalent 2025', dateAdministered: '2025-10-02' },
    ],
    prescriptions: [
      {
        id: 'RX-901421',
        dateIssued: '2026-01-15',
        issuingPhysician: 'Dr. Emily Carson, MD',
        dispensedBy: 'Springfield Central Pharmacy',
        status: 'Active',
        items: [
          {
            id: 'rxitem-02',
            medication: 'Amoxicillin',
            strength: '500 mg',
            dose: '1 capsule',
            frequency: 'Every 8 hours for 10 days',
            route: 'Oral',
            quantity: '30 Capsules',
            refills: '0',
            indication: 'Acute Sinusitis',
            specialInstructions: 'Complete full course of antibiotics.',
          },
        ],
      },
    ],
    labResults: [
      {
        id: 'LAB-2026-1042',
        dateOrdered: '2026-01-15',
        dateReported: '2026-01-15 16:00',
        labFacility: 'Hallmark Central Diagnostics Lab',
        comments: 'Complete Blood Count (CBC) is within normal physiological parameters. No evidence of systemic leukocytosis.',
        verifiedBy: 'Dr. Robert Chen, MD (Pathology)',
        signature: 'R. Chen MD (Digitally Signed)',
        values: [
          { id: 'val-06', panelName: 'CBC Panel', testName: 'White Blood Cell Count', resultValue: '6.8 K/uL', referenceRange: '4.5 - 11.0 K/uL', flag: 'NORMAL' },
          { id: 'val-07', panelName: 'CBC Panel', testName: 'Hemoglobin', resultValue: '13.5 g/dL', referenceRange: '12.0 - 15.5 g/dL', flag: 'NORMAL' },
          { id: 'val-08', panelName: 'CBC Panel', testName: 'Platelet Count', resultValue: '250 K/uL', referenceRange: '150 - 450 K/uL', flag: 'NORMAL' },
        ],
      },
    ],
  },
  {
    id: 'PR-2026-00202',
    fullName: 'Robert T. Chen',
    dob: '1965-11-03',
    age: 60,
    gender: 'Male',
    bloodType: 'B-Positive',
    primaryCarePhysician: 'Dr. Marcus Vance, MD',
    assignedDoctorUsername: 'doctor02',
    vitals: [
      {
        id: 'v-003',
        recordedDate: '2026-02-01 11:00',
        bloodPressure: '138/88 mmHg',
        heartRate: 82,
        temperature: '98.8 °F',
        oxygenSaturation: 97,
        height: '6 ft 0 in',
        weight: '210 lbs',
        bmi: '28.5',
      },
    ],
    allergies: [
      { id: 'alg-04', allergen: 'Aspirin (NSAIDs)', reaction: 'Bronchospasm / Wheezing' },
    ],
    immunizations: [
      { id: 'imm-06', vaccine: 'Pneumococcal Conjugate (PCV20)', dateAdministered: '2024-06-20' },
      { id: 'imm-07', vaccine: 'Shingrix (Herpes Zoster)', dateAdministered: '2023-09-12' },
    ],
    prescriptions: [
      {
        id: 'RX-772109',
        dateIssued: '2026-02-01',
        issuingPhysician: 'Dr. Marcus Vance, MD',
        dispensedBy: 'Hallmark Outpatient Pharmacy',
        status: 'Active',
        items: [
          {
            id: 'rxitem-03',
            medication: 'Metformin HCl',
            strength: '500 mg',
            dose: '1 tablet',
            frequency: 'Twice daily with meals',
            route: 'Oral',
            quantity: '60 Tablets',
            refills: '5',
            indication: 'Type 2 Diabetes Mellitus',
            specialInstructions: 'Monitor blood glucose daily.',
          },
          {
            id: 'rxitem-04',
            medication: 'Atorvastatin',
            strength: '20 mg',
            dose: '1 tablet',
            frequency: 'Once daily at bedtime',
            route: 'Oral',
            quantity: '30 Tablets',
            refills: '3',
            indication: 'Hyperlipidemia',
            specialInstructions: 'Avoid excessive grapefruit juice.',
          },
        ],
      },
    ],
    labResults: [
      {
        id: 'LAB-2026-2201',
        dateOrdered: '2026-02-01',
        dateReported: '2026-02-01 15:30',
        labFacility: 'Hallmark Cardiology & Endocrinology Lab',
        comments: 'HbA1c elevated at 7.2%. Renal function normal (eGFR > 90 mL/min). Statins recommended for cardiac protection.',
        verifiedBy: 'Dr. Elena Rostova, MD',
        signature: 'E. Rostova MD (Digitally Signed)',
        values: [
          { id: 'val-09', panelName: 'Diabetes Panel', testName: 'Hemoglobin A1c', resultValue: '7.2 %', referenceRange: '< 5.7 %', flag: 'HIGH' },
          { id: 'val-10', panelName: 'Renal Panel', testName: 'Serum Creatinine', resultValue: '0.95 mg/dL', referenceRange: '0.74 - 1.35 mg/dL', flag: 'NORMAL' },
          { id: 'val-11', panelName: 'Renal Panel', testName: 'eGFR', resultValue: '> 90 mL/min', referenceRange: '> 60 mL/min', flag: 'NORMAL' },
        ],
      },
    ],
  },
  {
    id: 'PR-2026-00203',
    fullName: 'Amara K. Okafor',
    dob: '1985-03-29',
    age: 41,
    gender: 'Female',
    bloodType: 'AB-Positive',
    primaryCarePhysician: 'Dr. Marcus Vance, MD',
    assignedDoctorUsername: 'doctor02',
    vitals: [
      {
        id: 'v-004',
        recordedDate: '2026-01-28 14:20',
        bloodPressure: '122/78 mmHg',
        heartRate: 72,
        temperature: '98.5 °F',
        oxygenSaturation: 99,
        height: '5 ft 7 in',
        weight: '154 lbs',
        bmi: '24.1',
      },
    ],
    allergies: [
      { id: 'alg-05', allergen: 'Codeine', reaction: 'Severe Nausea & Dizziness' },
    ],
    immunizations: [
      { id: 'imm-08', vaccine: 'Tdap Booster', dateAdministered: '2022-11-14' },
    ],
    prescriptions: [
      {
        id: 'RX-661092',
        dateIssued: '2026-01-28',
        issuingPhysician: 'Dr. Marcus Vance, MD',
        dispensedBy: 'Springfield North Pharmacy',
        status: 'Active',
        items: [
          {
            id: 'rxitem-05',
            medication: 'Levothyroxine',
            strength: '75 mcg',
            dose: '1 tablet',
            frequency: 'Once daily in morning on empty stomach',
            route: 'Oral',
            quantity: '90 Tablets',
            refills: '3',
            indication: 'Hypothyroidism',
            specialInstructions: 'Wait 30-60 mins before eating breakfast.',
          },
        ],
      },
    ],
    labResults: [
      {
        id: 'LAB-2026-3310',
        dateOrdered: '2026-01-28',
        dateReported: '2026-01-28 17:00',
        labFacility: 'Hallmark Central Diagnostics Lab',
        comments: 'Thyroid panel shows TSH normalized on 75 mcg Levothyroxine dosing.',
        verifiedBy: 'Dr. Marcus Vance, MD',
        signature: 'M. Vance MD (Digitally Signed)',
        values: [
          { id: 'val-12', panelName: 'Thyroid Panel', testName: 'TSH (Thyroid Stimulating Hormone)', resultValue: '2.1 mIU/L', referenceRange: '0.4 - 4.0 mIU/L', flag: 'NORMAL' },
          { id: 'val-13', panelName: 'Thyroid Panel', testName: 'Free T4', resultValue: '1.2 ng/dL', referenceRange: '0.8 - 1.8 ng/dL', flag: 'NORMAL' },
        ],
      },
    ],
  },
  {
    id: 'PR-2026-00204',
    fullName: 'David L. Miller',
    dob: '1972-07-14',
    age: 54,
    gender: 'Male',
    bloodType: 'O-Negative',
    primaryCarePhysician: 'Dr. Elena Rostova, MD',
    assignedDoctorUsername: 'doctor03',
    vitals: [
      {
        id: 'v-005',
        recordedDate: '2026-02-05 08:45',
        bloodPressure: '130/84 mmHg',
        heartRate: 76,
        temperature: '98.7 °F',
        oxygenSaturation: 98,
        height: '5 ft 11 in',
        weight: '185 lbs',
        bmi: '25.8',
      },
    ],
    allergies: [],
    immunizations: [
      { id: 'imm-09', vaccine: 'Influenza Quadrivalent 2025', dateAdministered: '2025-10-15' },
    ],
    prescriptions: [
      {
        id: 'RX-554102',
        dateIssued: '2026-02-05',
        issuingPhysician: 'Dr. Elena Rostova, MD',
        dispensedBy: 'Hallmark Outpatient Pharmacy',
        status: 'Active',
        items: [
          {
            id: 'rxitem-06',
            medication: 'Gabapentin',
            strength: '300 mg',
            dose: '1 capsule',
            frequency: 'Three times daily',
            route: 'Oral',
            quantity: '90 Capsules',
            refills: '2',
            indication: 'Peripheral Neuropathy',
            specialInstructions: 'May cause drowsiness. Do not operate machinery.',
          },
        ],
      },
    ],
    labResults: [
      {
        id: 'LAB-2026-4402',
        dateOrdered: '2026-02-05',
        dateReported: '2026-02-05 13:10',
        labFacility: 'Hallmark Neurology Diagnostics Lab',
        comments: 'Electromyography (EMG) indicates mild lower extremity sensory polyneuropathy. No motor deficits.',
        verifiedBy: 'Dr. Elena Rostova, MD',
        signature: 'E. Rostova MD (Digitally Signed)',
        values: [
          { id: 'val-14', panelName: 'Neuro Panel', testName: 'Sural Nerve Conduction Velocity', resultValue: '41 m/s', referenceRange: '> 40 m/s', flag: 'NORMAL' },
          { id: 'val-15', panelName: 'Neuro Panel', testName: 'Vitamin B12 Level', resultValue: '520 pg/mL', referenceRange: '200 - 900 pg/mL', flag: 'NORMAL' },
        ],
      },
    ],
  },
  {
    id: 'PR-2026-00205',
    fullName: 'Emily J. Watson',
    dob: '1995-12-05',
    age: 30,
    gender: 'Female',
    bloodType: 'A-Negative',
    primaryCarePhysician: 'Dr. Elena Rostova, MD',
    assignedDoctorUsername: 'doctor03',
    vitals: [
      {
        id: 'v-006',
        recordedDate: '2026-02-10 15:00',
        bloodPressure: '112/72 mmHg',
        heartRate: 64,
        temperature: '98.2 °F',
        oxygenSaturation: 100,
        height: '5 ft 5 in',
        weight: '128 lbs',
        bmi: '21.3',
      },
    ],
    allergies: [
      { id: 'alg-06', allergen: 'Peanuts', reaction: 'Anaphylaxis' },
    ],
    immunizations: [
      { id: 'imm-10', vaccine: 'Meningococcal ACWY', dateAdministered: '2021-08-20' },
      { id: 'imm-11', vaccine: 'HPV 9-valent Vaccine', dateAdministered: '2020-04-15' },
    ],
    prescriptions: [
      {
        id: 'RX-443901',
        dateIssued: '2026-02-10',
        issuingPhysician: 'Dr. Elena Rostova, MD',
        dispensedBy: 'Hallmark Outpatient Pharmacy',
        status: 'Active',
        items: [
          {
            id: 'rxitem-07',
            medication: 'EpiPen Auto-Injector',
            strength: '0.3 mg',
            dose: 'Inject intramuscularly into outer thigh',
            frequency: 'As needed for emergency anaphylaxis',
            route: 'Intramuscular',
            quantity: '2 Auto-Injectors',
            refills: '1',
            indication: 'Peanut Anaphylaxis Emergency',
            specialInstructions: 'Carry auto-injector at all times. Seek ER care after use.',
          },
        ],
      },
    ],
    labResults: [
      {
        id: 'LAB-2026-5511',
        dateOrdered: '2026-02-10',
        dateReported: '2026-02-10 18:20',
        labFacility: 'Hallmark Central Diagnostics Lab',
        comments: 'Allergy IgE panel confirms high reactivity to Peanut component Ara h 2. Prescription auto-injector verified active.',
        verifiedBy: 'Dr. Emily Carson, MD',
        signature: 'E. Carson MD (Digitally Signed)',
        values: [
          { id: 'val-16', panelName: 'Allergy Panel', testName: 'Peanut IgE (f13)', resultValue: '18.4 kU/L', referenceRange: '< 0.35 kU/L', flag: 'HIGH' },
          { id: 'val-17', panelName: 'Allergy Panel', testName: 'Total Serum IgE', resultValue: '210 kU/L', referenceRange: '< 100 kU/L', flag: 'HIGH' },
        ],
      },
    ],
  },
];

// Runtime serverless state for patient assignments
let patientAssignmentsMap: Record<string, string> = {
  'PR-2024-00142': 'doctor01',
  'PR-2026-00201': 'doctor01',
  'PR-2026-00202': 'doctor02',
  'PR-2026-00203': 'doctor02',
  'PR-2026-00204': 'doctor03',
  'PR-2026-00205': 'doctor03',
};

export function getAllPatients(): PatientClinicalRecord[] {
  return INITIAL_PATIENTS.map((patient) => {
    const assignedDoctorUsername = patientAssignmentsMap[patient.id] || patient.assignedDoctorUsername;
    let physicianTitle = 'Dr. Emily Carson, MD';
    if (assignedDoctorUsername === 'doctor02') physicianTitle = 'Dr. Marcus Vance, MD';
    if (assignedDoctorUsername === 'doctor03') physicianTitle = 'Dr. Elena Rostova, MD';

    return {
      ...patient,
      assignedDoctorUsername,
      primaryCarePhysician: physicianTitle,
    };
  });
}

export function getPatientById(id: string): PatientClinicalRecord | undefined {
  const patient = INITIAL_PATIENTS.find((p) => p.id === id);
  if (!patient) return undefined;

  const assignedDoctorUsername = patientAssignmentsMap[patient.id] || patient.assignedDoctorUsername;
  let physicianTitle = 'Dr. Emily Carson, MD';
  if (assignedDoctorUsername === 'doctor02') physicianTitle = 'Dr. Marcus Vance, MD';
  if (assignedDoctorUsername === 'doctor03') physicianTitle = 'Dr. Elena Rostova, MD';

  return {
    ...patient,
    assignedDoctorUsername,
    primaryCarePhysician: physicianTitle,
  };
}

export function assignPatientToDoctor(patientId: string, doctorUsername: string): boolean {
  patientAssignmentsMap[patientId] = doctorUsername;
  return true;
}
