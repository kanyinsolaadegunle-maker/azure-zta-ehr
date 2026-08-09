# Hallmark Medical Center Health Cloud - Azure ZTA EHR Simulator

An academic full-stack web application demonstrating the implementation of **Azure Zero Trust Architecture (ZTA)** inside Hallmark Medical Center's cloud-hosted Electronic Health Record (EHR) system.


This application models and simulates the identity governance, Role-Based Access Control (RBAC), and Conditional Access Policies (MFA, sign-in risk blocks) required by the **Azure Zero Trust Architecture Configuration Procedure** to secure clinical data storage, billing, and compliance assets.

## Key Features

1. **EHR Portals Segregation (Micro-Segmentation)**
   - **Clinical Portal (`patient-records`):** Displays clinical files, pathologist lab panels, and active medications. Supports CRUD prescriptions. Only accessible to `EHR-Doctors` (Read & Write) and `EHR-Nurses` (Read-only).
   - **Administrative Portal (`admin-records`):** Shows appointment calendars, bills, and insurance coverage. Restriced to `EHR-Records-Admins`.
   - **Compliance Portal (`audit-evidence`):** Hosts the ZTA Compliance Evidence Table and real-time security audit trails. Restriced to `EHR-Auditors` and `EHR-IT-Security`.
2. **Interactive ZTA Environment Simulator**
   - Floating control panel widget allows swapping session parameters (simulated user, network IP, geolocation, risk level, MFA completion status).
   - Real-time ZTA Evaluation Engine enforces policy rules (`CA001`, `CA002`, `CA003`, `CA004`) on Server Actions and pages.
   - Interactive MFA authentication simulator dialog representing Authenticator App notification verification.
3. **Database Audit & Cost Protection**
   - Tracks every user authentication and resource access request inside SQLite database `audit_logs` table.
   - Dynamic monthly budget spent calculator showing billing limit alerts.

---

## Technology Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + Lucide React Icons
- **Database:** SQLite / LibSQL (Turso-ready)
- **Database ORM:** Drizzle ORM
- **Authentication:** Simulated Session Cookies (Microsoft Entra ID Logical Mapping)

---

## Folder Structure

```
├── drizzle/              # Drizzle migrations schema output
├── src/
│   ├── app/              # Next.js pages & server actions
│   │   ├── portal/       # EHR segment sub-folders
│   │   └── actions.ts    # Database mutations (prescription/admin logs)
│   ├── components/       # Simulation Context, Drawer, and Forms
│   ├── db/               # LibSQL client & database schema definition
│   ├── lib/              # ZTA policy verification engine & cookie helpers
│   └── scripts/          # Database seeding & policy integration tests
├── drizzle.config.ts     # Drizzle schema compilation config
├── package.json
└── README.md
```

---

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
DATABASE_URL=file:sqlite.db
DATABASE_AUTH_TOKEN=
```

### 3. Initialize Database & Seed Clinical Data
Push the schema to your local SQLite database and seed the mock patients, users, and groups:
```bash
npm run db:push
npm run db:seed
```

### 4. Run Policy Integration Tests
Verify the ZTA Evaluation Engine works by running the integration test suite:
```bash
npm run test:zta
```

### 5. Launch Local Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## Deployment Procedures

The application is structured to deploy smoothly using **GitHub → Turso → Vercel**.

### Turso (SQLite Database Hosting)
1. Sign in to your Turso CLI or dashboard.
2. Create a new database:
   ```bash
   turso db create meditrust-ehr-db
   ```
3. Fetch the database URL:
   ```bash
   turso db show meditrust-ehr-db --show-urls
   ```
4. Generate a secure authentication token:
   ```bash
   turso db tokens create meditrust-ehr-db
   ```
5. Apply migrations and seed remote data:
   Create a remote `.env` configuration pointing to Turso and execute:
   ```bash
   DATABASE_URL=<your-turso-connection-url> DATABASE_AUTH_TOKEN=<your-turso-token> npm run db:push
   DATABASE_URL=<your-turso-connection-url> DATABASE_AUTH_TOKEN=<your-turso-token> npm run db:seed
   ```

### Vercel (Frontend Hosting)
1. Push your local repository to GitHub.
2. Go to the Vercel Dashboard and click **Add New Project**.
3. Select your GitHub repository.
4. Configure the environment variables:
   - `DATABASE_URL`: Your Turso connection URL.
   - `DATABASE_AUTH_TOKEN`: Your Turso auth token.
5. Click **Deploy**. Vercel will build the project and output a production HTTPS address.
