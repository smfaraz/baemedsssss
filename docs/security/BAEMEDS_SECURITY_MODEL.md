# BaeMeds — Native Commerce Security Model & Data Boundary Specification

**Date:** September 15, 2026  
**Architecture:** Zero-Trust Modular Monolith  
**Compliance Standards:** HIPAA Technical Safeguards (45 CFR § 164.312), PCI-DSS SAQ-A  

---

## 1. Zero-Trust Security Perimeter

The client browser is treated as an untrusted, potentially compromised environment:
1. **Client Price Rejection:** The browser can render prices and calculate estimates for UX, but edge functions NEVER accept prices, discounts, taxes, or shipping costs submitted by the client. All calculations are executed server-side.
2. **Cryptographic Cart Ownership:** Anonymous carts use high-entropy UUID tokens (`carts.token`). Upon authentication, carts are bound to `auth.users.id`. Users cannot query or mutate carts belonging to other users.
3. **Session Token Isolation:** Authentication tokens are kept inside an HttpOnly, Secure, SameSite=Lax cookie (`__Host-baemeds_session`). No bearer tokens exist in `localStorage` or `sessionStorage`.
4. **Input Sanitization:** All text inputs are filtered through `sanitizeInput` to strip HTML brackets, script execution tags, event handlers (`\bon\w+\s*=`), `javascript:` protocols, and null bytes (`\x00`).

---

## 2. Healthcare & PHI Data Boundary

Prescription records and clinical notes are segregated from standard commerce data:
- **Storage:** Stored in `public.prescriptions` and a private Supabase Storage bucket.
- **Access Control:** Customers can access only their own uploads. Support staff and fulfillment specialists CANNOT access prescription records or clinical diagnoses.
- **Clinical Review:** Only users verified with the `clinical_specialist` or `super_admin` role can review, approve, or reject prescriptions.
- **Audit Logging:** Every prescription document access or status transition triggers an immutable audit log entry in `public.audit_logs`.
- **PHI Scrubbing:** All audit log metadata is processed through `AuditLogger.sanitizeMetadata()`, which masks patient names, emails, phone numbers, SSNs, and clinical notes before persistence.

---

## 3. Order State Machine Transition Matrix

To prevent illegal state transitions (e.g. shipping an unverified or cancelled order):

| Current State | Permitted Next States | Authorized Roles |
| :--- | :--- | :--- |
| `PENDING_PAYMENT` | `PAID`, `CANCELLED` | System / Checkout Service |
| `PAID` | `CLINICAL_REVIEW` (if Rx required), `PROCESSING` | System |
| `CLINICAL_REVIEW` | `CLINICAL_APPROVED`, `CLINICAL_REJECTED` | `clinical_specialist`, `super_admin` |
| `CLINICAL_APPROVED` | `PROCESSING` | System / Staff |
| `CLINICAL_REJECTED` | `CANCELLED`, `REFUNDED` | `clinical_specialist`, `super_admin` |
| `PROCESSING` | `FULFILLMENT`, `CANCELLED` | `fulfillment_specialist`, `super_admin` |
| `FULFILLMENT` | `SHIPPED` | `fulfillment_specialist`, `super_admin` |
| `SHIPPED` | `DELIVERED` | `fulfillment_specialist`, `super_admin`, Webhook |
| `CANCELLED` | `REFUNDED` | `super_admin` |
| `DELIVERED` | `REFUNDED` | `super_admin` |
