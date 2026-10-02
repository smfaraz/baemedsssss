# BaeMeds — Native Commerce Test Plan & Verification Matrix

**Date:** September 15, 2026  
**Test Harness:** Vitest / TSX (`tests/us-market.test.ts`)  
**Scope:** Functional, Security, Adversarial, and Visual Regression Testing  

---

## 1. Test Coverage Matrix

### A. Catalog & Product Service Tests
- [x] Query all products from native catalog.
- [x] Query product by handle (slug).
- [x] Query products by category filter.
- [x] Live text search across titles, categories, specs, and keywords.
- [x] Ensure 100% of 119 products load with complete pricing and images.

### B. Cart & Pricing Authority Tests
- [x] Create cart session with unique token.
- [x] Add items to cart; verify quantity increments.
- [x] Update item quantity; remove line items.
- [x] Attempt client price manipulation: verify server recalculates from catalog price.
- [x] Negative quantity and zero price rejection.

### C. Checkout & Order Lifecycle Tests
- [x] Validate US shipping address (50 states + DC, 5-digit ZIP, E.164 phone).
- [x] Calculate destination sales tax via `taxService.ts`.
- [x] Calculate shipping method via `shippingService.ts`.
- [x] Gating: Orders with `requiresPrescription: true` must require attestation.
- [x] Order state transitions: `PAID` -> `CLINICAL_REVIEW` -> `PROCESSING` -> `SHIPPED`.
- [x] Illegal state transition prevention (`CANCELLED` -> `SHIPPED` rejected).

### D. Security & Isolation Tests
- [x] Customer IDOR: Customer A cannot read or modify Customer B's cart or order.
- [x] Mass Assignment: Submitting `{ role: 'super_admin' }` is stripped.
- [x] PHI Sanitization: Regex engine masks SSNs, emails, phones, and patient names.
- [x] Immutable Audit Logs: Updates and deletes rejected by database constraints.
- [x] Role boundaries: Fulfillment specialists cannot access clinical prescriptions.
