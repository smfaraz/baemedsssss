# BaeMeds USA — Comprehensive Cybersecurity & Compliance Audit Report

**Date**: October 15, 2026  
**Auditor**: Principal Cybersecurity Auditor & Compliance Engineer  
**Classification**: Confirmed Technical Controls & Hardening Assessment  

---

## 1. Security & Compliance Posture Overview

BaeMeds USA operates a healthcare durable medical equipment (DME) commerce architecture. The security posture was evaluated against:
1. **PCI-DSS v4.0 SAQ-A** (Cardholder Data Protection)
2. **HIPAA Security Rule 45 CFR Part 164 Subpart C** (PHI Safeguards & Immutable Audit Trails)
3. **OWASP Top 10 API Security Risks (2023)**
4. **Principle of Least Privilege (PoLP) & Zero-Trust Architecture**

### Key Security Achievements
- **Zero Raw Cardholder Data Exposure**: All card payments are captured strictly within client-side iframe sandboxes hosted by Stripe. Zero primary account numbers (PAN) touch BaeMeds servers.
- **Server-Authoritative RBAC**: Authorization is evaluated on the server in `api/admin.ts`. Header-spoofing (`X-Admin-Role`) was tested and verified to be unconditionally rejected.
- **Customer Account Isolation**: Customer bearer/cookie tokens cannot access administrative subroutes (`/api/admin/*` returns HTTP 403 Forbidden).
- **Immutable Audit Trail**: All administrative status transitions, stock alterations, and prescription reviews generate timestamped events in the `audit_logs` table.

---

## 2. Threat Vector Assessment & Penetration Test Results

| Attack Vector | Target Surface | Test Description | Result | Status |
| :--- | :--- | :--- | :---: | :---: |
| **SEC-01: Client Header Role Spoofing** | `/api/admin/*` | Attacker sends `X-Admin-Role: super_admin` with anonymous or unprivileged token | **REPELLED (401/403)** | **PASS** |
| **SEC-02: Customer Privilege Escalation** | `/api/admin/dashboard` | Authenticated customer token (`bm_usr_...`) requests administrative back-office | **REPELLED (403)** | **PASS** |
| **SEC-03: Negative Stock Manipulation** | `/api/admin/inventory` | Attacker attempts to adjust inventory below zero (`delta: -99999`) | **REPELLED (400)** | **PASS** |
| **SEC-04: Cross-Origin Request Forgery** | `/api/checkout` | Attacker submits checkout request from unauthorized foreign origin | **REPELLED (403)** | **PASS** |
| **SEC-05: Illegal State Transition** | `/api/admin/orders` | Attacker attempts to transition `PENDING_PAYMENT` order directly to `DELIVERED` | **REPELLED (400)** | **PASS** |
| **SEC-06: Clinical Prescription Bypass** | `/api/admin/orders` | Non-clinical user attempts to grant `CLINICAL_APPROVED` status | **REPELLED (403)** | **PASS** |
| **SEC-07: SQL Injection via Query Params** | `/api/admin/products` | Attacker injects `' OR 1=1 --` into search query parameter | **REPELLED** (Parameterized range queries) | **PASS** |

---

## 3. Cryptographic & Secrets Management

- **Database Credentials**: Managed via secure environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Payment Keys**: Stripe Secret Key (`STRIPE_SECRET_KEY`) is stored exclusively in server environment variables and never exposed to client bundles or source files.
- **Publishable Key**: Client bundle receives only the safe public Stripe key (`pk_live_...`).
- **Cookie Security**: Authentication session cookies use `SameSite=Strict`, `HttpOnly`, and `Secure` attributes with `__Host-` prefix where supported.

---

## 4. HTTP Security Headers Configuration

Configured in `vercel.json` for all production requests:

```json
{
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self' ...; frame-ancestors 'none'; upgrade-insecure-requests"
}
```

- **Clickjacking Protection**: `X-Frame-Options: DENY` and `frame-ancestors 'none'` prevent malicious framing.
- **MIME Sniffing**: `nosniff` prevents browser MIME-type confusion attacks.
- **HSTS**: 1-year max age with subdomain coverage enforces TLS 1.3 across all visitors.

---

## 5. Security Recommendations

1. **Rotate Service Keys Periodically**: Implement a 90-day rotation cadence for Supabase Service Role Keys and Stripe Webhook Signing Secrets.
2. **Two-Factor Authentication (MFA)**: Require mandatory TOTP (Time-based One-Time Password) for all accounts assigned `super_admin` or `clinical_specialist` roles.
3. **Automated Dependency Audits**: Maintain automated `npm audit` scans in CI to identify transitive dependency CVEs before production releases.
