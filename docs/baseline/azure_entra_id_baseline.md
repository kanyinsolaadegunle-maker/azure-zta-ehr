# Commercial Baseline Architecture: Microsoft Entra ID

This directory contains baseline configuration documentation and reference policies used as the **commercial baseline environment** for evaluating the **`zt-ehr-policy-engine`**.

---

## 🏛️ Purpose & Scope

In accordance with NIST SP 800-207 guidelines, evaluating an independent Zero Trust Policy Enforcement Point (PEP) requires benchmarking policy decisions against an established commercial identity provider baseline. 

The baseline architecture mirrors an enterprise **Microsoft Entra ID (formerly Azure Active Directory) P2 tenant** with Conditional Access and Identity Protection policies configured for healthcare environment operations.

---

## 📊 Policy Mapping Matrix

The independent **Zero Trust Policy Engine (`zt-ehr-policy-engine`)** replaces proprietary cloud vendor policy engines with explicit, server-authoritative TypeScript policy rules. The table below maps engine policy rules to their commercial baseline equivalents:

| Engine Policy ID | Engine Policy Name | Commercial Entra ID Mapping | Commercial Baseline Description | Engine Policy Objective |
| :--- | :--- | :--- | :--- | :--- |
| **ZTP-01** | Authentication Strength & MFA Enforcement | **CA001** (Require MFA for All Staff) | Conditional Access rule requiring MFA for all cloud app access | Enforces mandatory Multi-Factor Authentication for all clinical & administrative data containers |
| **ZTP-02** | Sign-In Risk Block | **CA002** (Block High Risk Sign-Ins) | Entra ID Identity Protection P2 automated risk engine block | Immediately blocks access requests when dynamic contextual trust drops below threshold ($<50$/100) |
| **ZTP-03** | Medium Risk Step-Up Challenge | **CA003** (MFA for Medium Risk Sign-Ins) | Entra ID Identity Protection P2 step-up MFA challenge | Demands step-up authentication when context score indicates elevated risk ($50-79$/100) |
| **ZTP-04** | Privileged Account Scope Enforcement | **CA004** (MFA for Cloud Admins) | Privileged identity governance policy enforcing MFA for Directory Admins | Mandatory MFA for administrative roles (`cloudadmin01`, `itsecurityadmin01`) regardless of network context |
| **ZTP-05** | Account Status & Lifecycle Guard | **CA005** (Account Status & Emergency Break-Glass) | Account status monitoring & PIM emergency break-glass procedures | Enforces lifecycle termination checks (`Banned` accounts) and 15-min time-boxed emergency break-glass override |

---

## 📁 Baseline Reference Files

- [`azure full configuration document 2.pdf`](file:///c:/Users/mauri/.gemini/antigravity/scratch/zt-ehr-policy-engine/docs/baseline/azure%20full%20configuration%20document%202.pdf) — Complete commercial tenant baseline specification.
