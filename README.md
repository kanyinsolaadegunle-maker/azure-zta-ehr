# Zero Trust Policy Engine for EHR Access Control (`zt-ehr-policy-engine`)

*(Formerly `azure-zta-ehr` — re-framed and re-architected as an independent Zero Trust policy evaluation engine evaluated against a Microsoft Entra ID baseline)*

An academic research software prototype demonstrating an independent **Zero Trust Policy Enforcement Point (PEP)** and dynamic trust evaluation engine for securing Electronic Health Record (EHR) systems.

---

## 🏛️ Executive & Architectural Overview

The **Zero Trust Policy Engine (`zt-ehr-policy-engine`)** implements continuous access evaluation, micro-segmentation, dynamic trust scoring, and least-privilege scope containment across protected health information (PHI) assets.

### Commercial Baseline Mapping

To validate the engine against commercial industry standards, policy rules are formally evaluated against a **Microsoft Entra ID baseline environment** (documented in `/docs/baseline/`).

| Engine Policy ID | Engine Policy Name | Baseline Entra ID Mapping | Policy Objective |
| :--- | :--- | :--- | :--- |
| **ZTP-01** | Authentication Strength & MFA Enforcement | CA001 (Require MFA for All Staff) | Require strong multi-factor authentication for protected containers |
| **ZTP-02** | Sign-In Risk Block | CA002 (Block High Risk Sign-Ins) | Immediately deny access when context risk is evaluated as High |
| **ZTP-03** | Medium Risk Step-Up Challenge | CA003 (MFA for Medium Risk Sign-Ins) | Trigger MFA verification when risk signals increase |
| **ZTP-04** | Privileged Account Scope Enforcement | CA004 (MFA for Cloud Admins) | Enforce mandatory MFA for administrative and security roles |
| **ZTP-05** | Account Status & Lifecycle Guard | CA005 (Account Status Checks) | Block suspended or lifecycle-terminated user accounts |

---

## ✨ Key Research & Technical Features

1. **Independent Policy Enforcement Point (PEP)**
   - All server actions and API file downloads route through a server-authoritative Policy Enforcement Point (`evaluateZtaAccess()`). No client-side bypasses exist.
2. **Micro-Segmentation & Container Isolation**
   - Three isolated data containers:
     - `patient-records`: Accessible to clinical staff (`EHR-Doctors` Read/Write, `EHR-Nurses` Read-Only).
     - `admin-records`: Accessible exclusively to `EHR-Records-Admins`.
     - `audit-evidence`: Accessible exclusively to `EHR-Auditors` and `EHR-IT-Security`.
3. **Dynamic Trust Score Calculator (`computeTrustScore()`)**
   - Evaluates a 0–100 numerical trust score derived from impossible travel velocity, device compliance posture, network location anomalies, and off-hours access.
4. **Controlled & Time-Boxed Break-Glass Override**
   - Emergency access (`emergency.admin`) requires a typed justification string, enforces a **15-minute time window**, generates a `CRITICAL` severity audit entry, and displays a persistent compliance banner.
5. **Fail-Closed & Accountability Guarantees**
   - Fail-closed design: If database directory lookups fail, the engine denies access (`ZTP-DIRECTORY-UNAVAILABLE`).
   - "No log, no access" principle: On audit log write failure, access requests are immediately denied.
6. **Quantitative Evaluation Harness (Chapter 5)**
   - Automated request corpus runner generating 500–1000 simulated access evaluations to measure Decision Latency (p95), Blast Radius Reduction %, Time-to-Revoke, and False-Positive Rates against a static RBAC baseline.

---

## 🛠️ Technology Stack

- **Engine & Backend:** Node.js / TypeScript + Express API Layer
- **Frontend UI:** React 19 / Next.js 16 (App Router) + Tailwind CSS + Lucide Icons
- **Database & ORM:** SQLite / LibSQL + Drizzle ORM
- **Analytics & Charts:** Recharts
- **Session Security:** Server-signed HMAC (SHA-256) Identity Cookies

---

## 📁 Repository Structure

```
├── docs/
│   └── baseline/         # Microsoft Entra ID commercial baseline documentation
├── drizzle/              # Database migrations schema output
├── src/
│   ├── app/              # Next.js pages & server actions
│   ├── components/       # UI panels, Enterprise Directory & Evaluation Harness
│   ├── db/               # Database client & Drizzle schema
│   ├── lib/              # Policy engine (ZTP rules, trust algorithm, HMAC session)
│   └── scripts/          # Database seeding & policy integration tests
├── package.json
└── README.md
```

---

## 🚀 Installation & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Initialization & Seeding
```bash
npm run db:push
npm run db:seed
```

### 3. Run Policy Integration Suite
```bash
npm run test:zta
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.
