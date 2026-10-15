# BaeMeds.com — Phase 4: Authorization & Customer Privacy Report

**Focus**: Authentication Integrity, Session Security, Broken Object-Level Authorization (IDOR), Administrative RBAC, and Protected Health Information (PHI) Access Controls  
**Date**: October 15, 2026  
**Auditor**: Principal Application Security Engineer & DevSecOps Architect

---

## 1. Authentication Architecture & Session Security

### A. Customer Session Token Forgery (Remediated)
- **Initial Vulnerability**: In `api/auth.ts`, session tokens followed the pattern `bm_usr_${b64}_${timestamp}` without a cryptographic signature. Anyone could construct a base64 payload with another customer's email and forge an authenticated session.
- **Remediation**:
  - Implemented an HMAC-SHA256 signature scheme using the server's secret:
    $$\text{token} = \text{bm\_usr\_} + \text{base64url}(\text{payload}) + \text{\_} + \text{hmac\_sha256}(\text{base64url}(\text{payload}), \text{secret})$$
  - Delimited with unambiguous hex strings to prevent parsing collisions.
  - On every incoming request, the signature is computed and verified before deserializing the customer payload.
  - Forged tokens immediately fail verification and return HTTP 401 Unauthorized with a session-clearing cookie (`Set-Cookie: __Host-baemeds_session=; Max-Age=0`).

### B. Insecure Direct Object Reference (IDOR) & Anonymous Fallback (Remediated)
- **Initial Vulnerability**: In `api/account.ts`, when a request lacked a session cookie, the endpoint defaulted to an internal test profile (`patient@example.com`). This permitted anonymous callers to read and mutate addresses associated with that account.
- **Remediation**:
  - Eliminated the fallback entirely.
  - Calls lacking a valid, verified cryptographic token strictly return HTTP 401 Unauthorized (`{"error": "Unauthorized: Valid customer session is required."}`).
  - Cross-customer access is prevented because all address queries and mutations are filtered exclusively by the verified `profile.email` extracted from the cryptographically validated token.

---

## 2. Administrative Role-Based Access Control (RBAC)

The administrative gateway (`api/admin.ts`) enforces strict server-side least privilege across 6 operational roles:

| Role | Permitted Actions | Prohibited Actions | Security Controls |
| :--- | :--- | :--- | :--- |
| **`super_admin`** | Full platform management, orders, products, inventory, refunds, staff, compliance, audit logs | None | Multi-factor session token required, all actions audited |
| **`compliance_officer`** | View orders, compliance management, audit log inspection, analytics | Product updates, refunds, inventory mutations, customer mutations | Mutation endpoints blocked with HTTP 403 Forbidden |
| **`clinical_specialist`**| Review prescriptions, approve clinical DME orders, view medical documentation | Financial refunds, inventory adjustments, staff management | Required for `CLINICAL_APPROVED` order transition; blocked from refunds |
| **`support_agent`** | Customer lookup, address updates, tracking assignment | Issuing refunds, editing product prices, viewing unmasked payment data | Denied `orders:refund`; blocked from executing financial reversals |
| **`inventory_manager`** | Stock adjustments, receiving McKesson shipments, inventory counts | Customer PII access, prescription review, financial refunds | Scoped exclusively to inventory and product tables |
| **`fulfillment_specialist`** | Packing slips, order fulfillment, carrier tracking updates | Modifying order pricing, customer financial data, clinical approvals | Access restricted to logistics data |

---

## 3. Protected Health Information (PHI) & Prescription Safeguards

Under HIPAA guidelines, prescription uploads and clinical data require specialized safeguards:
1. **Prescription Gating**: Products with `prescriptionRequired: true` cannot proceed past checkout without clinical prescription submission.
2. **Access Boundary**: Fulfillment specialists and support agents are blocked from viewing clinical prescription files (verified via `tests/v1-api-contract.test.ts`).
3. **Audit Immutability**: All prescription reviews and order approvals generate structured audit log records in Supabase `audit_logs` with actor ID, timestamp, and action type.
4. **Professional Boundary**: Software controls alone do not constitute HIPAA certification. A signed Business Associate Agreement (BAA) with infrastructure providers (Supabase, Vercel) and formalized administrative policies remain an owner action.

---

## 4. Test Suite Verification

1. `Cryptographically forged session token rejected by /api/auth with 401`: **PASS**
2. `Valid HMAC-SHA256 signed session token verified successfully`: **PASS**
3. `Unauthenticated request to /api/account returns HTTP 401`: **PASS**
4. `Support agent blocked from issuing refunds`: **PASS**
5. `Fulfillment specialist blocked from accessing clinical prescriptions`: **PASS**
6. `Zero sensitive system internals leaked in red-line error masking`: **PASS**
