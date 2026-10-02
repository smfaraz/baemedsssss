# BaeMeds USA — Security Architecture & Policy

## 1. Overview

BaeMeds USA (`baemeds.com`) is committed to maintaining robust security controls to protect our storefront, administrative operations, and customer data. This document outlines the technical safeguards, defense-in-depth architecture, and vulnerability reporting procedures implemented across the application.

---

## 2. Core Security Controls

### 2.1 Encryption Standards
- **In-Transit**: All communications enforce TLS 1.3 / HTTPS. HTTP Strict Transport Security (HSTS) is enabled with preload directives.
- **At-Rest**: Sensitive database records in Supabase are encrypted using AES-256.
- **Payment Data**: Cardholder data (PAN, CVV) is never handled, processed, or stored on our servers. All payment transactions occur directly via PCI-DSS Level 1 certified hosted fields and tokens (Shopify Payments / Stripe).

### 2.2 Role-Based Access Control (RBAC)
Access to administrative and customer resources follows the principle of least privilege:

| Role | Permissions & Scope |
| :--- | :--- |
| `super_admin` | Global administrative access, security settings, role assignments, system audits |
| `compliance_officer`| Audit log inspection, HIPAA compliance verification, privacy request reviews |
| `clinical_specialist`| Prescription verification, clinical documentation review, medical clearance |
| `fulfillment_specialist`| Packing slip generation, carrier dispatch, tracking updates (No access to payment or clinical notes) |
| `support_agent` | Order status lookup, customer inquiry response (Restricted access to sensitive records) |
| `customer` | Access exclusively to own account profile, orders, and saved addresses |

### 2.3 Input Validation & Injection Defense
- **Type Safety**: Full TypeScript strict typing prevents type confusion vulnerabilities.
- **Sanitization**: All user-rendered HTML content is sanitized using DOMPurify.
- **Parameterized Data Access**: Supabase PostgREST client and Shopify GraphQL queries strictly utilize parameterized bindings, eliminating SQL/NoSQL injection vulnerabilities.
- **Phone & Address Validation**: Strict regex validation for US phone numbers (E.164) and ZIP/ZIP+4 codes prior to server transmission.

### 2.4 Content Security Policy (CSP) & Secure Headers
Configured via `vercel.json` and edge configurations:
- `Content-Security-Policy`: Restricts scripts, frames, and connections to trusted origins (`baemeds.com`, Shopify, Supabase, Cloudflare).
- `X-Frame-Options: DENY`: Protects against clickjacking.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `Referrer-Policy: strict-origin-when-cross-origin`: Minimizes referrer leakage.
- `Permissions-Policy`: Disables camera, microphone, and geolocation by default.

---

## 3. Audit Logging & Monitoring

The application utilizes an immutable audit logging service (`server/auditLogger.ts`) that logs:
- Customer authentication and password reset events.
- Prescription and medical documentation access.
- Role changes and administrative privilege grants.
- Order placement, cancellation, and refund operations.
- Data export and privacy request fulfillment.

**Automated PHI Scrubbing**: The audit logger automatically scrubs sensitive patient attributes (names, SSNs, DOBs, telephone numbers, and street addresses) before writing to audit tables to prevent secondary log compromise.

---

## 4. Zero-PHI Analytics Architecture

To comply with HHS guidance regarding the use of online tracking technologies by covered entities and business associates:
- No Protected Health Information (PHI), diagnosis codes, prescription details, or patient identifiers are passed to marketing pixels, session replay tools, or third-party analytics.
- Analytics events are confined to aggregate, de-identified e-commerce metrics (page views, cart totals, product SKU views).

---

## 5. Vulnerability Reporting

We welcome responsible security disclosures. If you identify a potential security vulnerability in BaeMeds USA:

1. Email our security response team at: **`security@baemeds.com`**
2. Provide a detailed summary of the vulnerability, reproduction steps, and proof-of-concept.
3. Please allow 48 hours for our security engineering team to acknowledge your report before any public disclosure.
4. We will coordinate remediation and verification promptly.
