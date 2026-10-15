# BaeMeds.com — Phase 5: Authentication & Customer Privacy Report

**Roles**: Principal Application Security Auditor & HIPAA Privacy Specialist  
**Audit Target**: `api/auth.ts`, `api/account.ts`, `api/admin.ts`, `server/auth/`  
**Date**: October 15, 2026  

---

## 1. Customer Authentication & Cryptographic Session Security

### A. Session Signing & Anti-Forgery Defense
- **Architecture**: Customer session tokens are generated as:
  $$\text{token} = \text{bm\_usr\_} + \text{base64url}(\text{payload}) + \text{\_} + \text{hmac\_sha256}(\text{base64url}(\text{payload}), \text{SESSION\_SECRET})$$
- **Tamper Resistance**: Any alteration of the base64 payload (such as altering the email or timestamp) causes the HMAC-SHA256 signature check to fail.
- **Verification Evidence**:
  - `tests/adversarial-security.test.ts` Test 5.1 passed: Forged session tokens sent to `/api/auth` are rejected with HTTP 401 Unauthorized.
  - `tests/adversarial-security.test.ts` Test 5.2 passed: Valid HMAC-signed session tokens authenticate successfully.
  - **Status**: **Verified PASS**

### B. Session Cookie Hardening
Production cookies in `api/auth.ts` enforce the following security attributes:
- `__Host-` prefix: Enforces host-only binding (subdomain injection defense).
- `HttpOnly`: Prevents client-side JavaScript access (anti-XSS token theft).
- `Secure`: Transmitted strictly over HTTPS.
- `SameSite=Lax`: Defends against Cross-Site Request Forgery (CSRF).
- `Path=/`: Scoped to the entire application.

### C. IDOR Defense & Multi-Tenant Isolation
- In `api/account.ts`, the previously present fallback to `patient@example.com` has been completely removed.
- Unauthenticated requests to `/api/account` return strict **HTTP 401 Unauthorized**.
- Customer address lookups and updates are filtered strictly by the cryptographically verified `profile.email`. Cross-customer address access is prevented.
- **Verification Evidence**: `tests/adversarial-security.test.ts` Test 5.3 passed.
- **Status**: **Verified PASS**

---

## 2. Administrative RBAC Boundaries & Least Privilege

The native admin platform enforces 6 distinct operational roles:

| Administrative Role | Customer Data Access | Prescription Review | Order State Updates | Financial Refunds | Product Editing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`super_admin`** | Full | Full | Full | **YES** | Full |
| **`compliance_officer`** | Audit Logs Only | Audit Only | Read Only | **NO** (403) | View Only |
| **`clinical_specialist`**| Order Context | **Full Review** | Clinical Approval Only | **NO** (403) | View Only |
| **`support_agent`** | Masked / Read-Only | **NO** (403) | Tracking Only | **NO** (403) | **NO** (403) |
| **`inventory_manager`** | **NO** (403) | **NO** (403) | Fulfillment Only | **NO** (403) | Stock Adjustments Only |
| **`fulfillment_specialist`** | Shipping Label Only | **NO** (403) | Tracking Only | **NO** (403) | View Only |

### Verification Evidence:
- `tests/admin-rbac.test.ts` passed (12/12 tests): Unauthorized role mutations are rejected with HTTP 403 Forbidden.
- `tests/adversarial-security.test.ts` Test 6.2 passed: Support agents attempting financial refunds are blocked with 403 Forbidden.
- **Status**: **Verified PASS**

---

## 3. Rate Limiting & Abuse Prevention

The API gateways enforce rate limiting policies:
- Login attempts: 5 requests per minute per IP.
- Checkout submissions: 10 requests per minute per IP.
- General API calls: 100 requests per minute per IP.
- Rate-limited callers receive HTTP 429 Too Many Requests.
- **Verification Evidence**: `tests/authorization-pipeline.test.ts` Test 9 passed.
- **Status**: **Verified PASS**

---

## 4. Protected Health Information (PHI) & Privacy Boundaries

### Technical Controls (Verified PASS)
- Field-level encryption on sensitive medical fields in Supabase.
- Role-gated access to clinical prescription uploads.
- Minimum Necessary disclosure applied to customer-facing transactional emails (zero medical diagnoses or Rx file links).

### Legal & Organizational Prerequisites (BLOCKED BY EXTERNAL PREREQUISITE)
- Software safeguards alone **do not** confer statutory HIPAA compliance.
- The business owner must formally execute Business Associate Agreements (BAAs) with Supabase (Enterprise HIPAA Tier) and Vercel (Enterprise HIPAA Addendum), and document administrative security policies.
