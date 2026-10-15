# BaeMeds USA — Comprehensive Test Results & Validation Log

**Date**: October 15, 2026  
**Environment**: Local Node.js 20.20.0 + Production Edge (`https://www.baemeds.com`)  
**Test Harness**: Native Node Test Runner, TypeScript execution (`tsx`), Playwright Static Renderer  

---

## 1. Test Suite Summary Matrix

| Test Suite File | Command | Tests Run | Passed | Failed | Execution Time | Scope / Coverage |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `tests/admin-rbac.test.ts` | `npx tsx tests/admin-rbac.test.ts` | 6 | 6 | 0 | 1.84s | RBAC 6-role permission matrix, anti-spoofing, order state machine, audit log immutability |
| `tests/admin-auth-login.test.ts` | `npx tsx tests/admin-auth-login.test.ts` | 21 | 21 | 0 | 2.15s | Supabase auth integration, staff roster fallback, session cookies, customer login isolation |
| `tests/concurrency-inventory.test.ts` | `npx tsx tests/concurrency-inventory.test.ts` | 50 | 50 | 0 | 3.42s | 10 simultaneous buyers, stock reservation, idempotency replay, inventory ledger immutability |
| `tests/storefront-pagination.test.ts` | `npx tsx tests/storefront-pagination.test.ts` | 7 | 7 | 0 | 1.95s | 3,165 product database catalog, 50-by-50 pagination, category & search queries |
| `tests/tax-checkout.test.ts` | `npx tsx tests/tax-checkout.test.ts` | 6 | 6 | 0 | 0.30s | US 50-state sales tax, Nomad states (0%), DME prescription exemption, entity certificates |
| `tests/us-market.test.ts` | `npx tsx tests/us-market.test.ts` | 8 | 8 | 0 | 1.45s | US address normalization, carrier shipping tiers, medical device compliance |
| `tests/coupon-api.test.ts` | `npx tsx tests/coupon-api.test.ts` | 4 | 4 | 0 | 0.85s | Fixed vs percentage promo codes, minimum order threshold, expired coupon rejection |
| `tests/native-commerce.test.ts` | `npx tsx tests/native-commerce.test.ts` | 3 | 3 | 0 | 1.22s | Zero-Shopify runtime verification, server-authoritative checkout calculation |
| `scripts/prerender.mjs` | `node scripts/prerender.mjs` | 24 | 24 | 0 | 38.80s | Static snapshot generation across 6 concurrent Playwright chromium workers |
| **Production Live API Suite** | Live HTTP fetch suite (`https://www.baemeds.com`) | 12 | 12 | 0 | 4.82s | End-to-end production verification of all 11 admin endpoints + checkout gateway |
| **TOTALS** | — | **141** | **141** | **0** | **~56s** | **100% Pass Rate Across All Executed Tests** |

---

## 2. Detailed Execution Logs

### A. Admin RBAC & Security Test Suite (`tests/admin-rbac.test.ts`)
```
======================================================
BAEMEDS NATIVE ADMIN PLATFORM RBAC & SECURITY SUITE
======================================================

Testing Authentication & Customer Route Protection...
✔ Anonymous (401) and Customer (403) route rejection passed.
Testing RBAC Role Boundaries across all 6 roles...
✔ RBAC least-privilege role boundaries and Anti-Spoofing verified.
Testing Order State Machine & Transition Rules...
✔ Order State Machine validation and illegal transition denial passed.
Testing Negative Inventory Denial & Adjustment Audit...
✔ Negative stock reduction blocked and audit reason verified.
Testing Mass Assignment & Privilege Escalation Prevention...
✔ Mass assignment & privilege escalation blocked.
Testing HIPAA Audit Log Generation & Read-Only Immutability...
✔ HIPAA Audit Logs verified: 200 immutable events recorded.

✔ ALL ADMIN RBAC & SECURITY TESTS PASSED SUCCESSFULLY.
```

### B. Authentication & Authorization Suite (`tests/admin-auth-login.test.ts`)
```
======================================================
BAEMEDS AUTHENTICATION & AUTHORIZATION TEST SUITE
======================================================

--- 1. Testing AdminService Credential Authentication ---
✔ Super admin login returns role super_admin
✔ Super admin login returns session token
✔ Super admin email matches
✔ Clinical specialist returns role clinical_specialist
✔ Invalid password throws credential error
✔ Invalid password rejected
✔ Unknown user rejected
✔ Unknown staff rejected

--- 2. Testing HTTP /api/admin/login Endpoint ---
✔ Empty email/password returns HTTP 400
✔ Bad credentials return HTTP 401
✔ Valid staff credentials return HTTP 200
✔ Returned user role is compliance_officer
✔ Session token provided upon login
✔ GET /api/admin/session returns 200 with valid token
✔ Session actor resolved correctly
✔ Compliance Officer denied from creating discounts (RBAC 403)

--- 3. Testing Customer Auth Isolation (No Auto-Creation Bypass) ---
✔ Unregistered customer login is rejected with HTTP 401 (auto-creation removed)
✔ Customer registration succeeds
✔ Customer session token issued in cookie upon registration
✔ Registered customer login succeeds with HTTP 200
✔ Customer account denied access to admin portal (HTTP 403)

======================================================
ALL 21 AUTHENTICATION & AUTHORIZATION CHECKS PASSED!
======================================================
```

### C. Concurrency & Transactional Inventory Suite (`tests/concurrency-inventory.test.ts`)
```
======================================================
BAEMEDS USA — TRANSACTIONAL COMMERCE & CONCURRENCY SUITE
======================================================

✔ PostgreSQL Database Initialized with Master Schema & Transactional Ledger.

--- 1. Testing Concurrency: 2 Simultaneous Buyers for Product A (Available = 1) ---
  ✔ Exactly 1 of 2 concurrent buyers succeeded (Got: 1)
  ✔ Exactly 1 of 2 concurrent buyers failed with OUT_OF_STOCK (Got: 1)
  ✔ Product A inventory record exists
  ✔ Final on_hand must be exactly 1 (Got: 1)
  ✔ Final reserved must be exactly 1 (Got: 1)
  ✔ Final available must be exactly 0 (Got: 0)
  ✔ CRITICAL: Available inventory NEVER drops below zero (Available = 0)
  ✔ Database contains exactly 1 order record (Got: 1)

--- 2. Testing Concurrency: 10 Simultaneous Buyers for Product B (Available = 1) ---
  ✔ Exactly 1 of 10 simultaneous buyers succeeded (Got: 1)
  ✔ Exactly 9 of 10 simultaneous buyers rejected with OUT_OF_STOCK (Got: 9)
  ✔ Product B final on_hand is 1 (Got: 1)
  ✔ Product B final reserved is 1 (Got: 1)
  ✔ Product B final available is 0 (Got: 0)
  ✔ CRITICAL: Available stock is NEVER negative under 10 concurrent requests

--- 3. Testing Idempotency: Same Request x2, x5, and Concurrently x10 ---
  ✔ First idempotent order request succeeds
  ✔ Second request with same key returns success
  ✔ Second request is recognized as IDEMPOTENT_REPLAY
  ✔ Second request returns identical order ID
  ✔ Second request returns identical order number
  ✔ Sequential replay #1 resolves to original order
  ✔ Sequential replay #2 resolves to original order
  ✔ Sequential replay #3 resolves to original order
  ✔ Sequential replay #4 resolves to original order
  ✔ Sequential replay #5 resolves to original order
  ✔ All 10 concurrent requests with identical key resolved to exactly the same order
  ✔ Exactly 1 order created in DB for key (Got: 1)
  ✔ Exactly 1 inventory reservation created in DB for key (Got: 1)

--- 4. Testing Reservation Lifecycle: Cancellation & Release ---
  ✔ Reserved stock is 2 before cancel (Got: 2)
  ✔ Available stock is 8 before cancel (Got: 8)
  ✔ Order cancellation succeeded
  ✔ Exactly 1 reservation was released
  ✔ Reserved stock restored to 0 (Got: 0)
  ✔ Available stock restored to 10 (Got: 10)
  ✔ Reservation status updated to RELEASED (Got: RELEASED)
  ✔ Release reason recorded
  ✔ Reservation fulfillment succeeded
  ✔ Product A on_hand decremented to 0 upon fulfillment (Got: 0)
  ✔ Product A reserved decremented to 0 upon fulfillment (Got: 0)
  ✔ Product A available remains 0 (Got: 0)

--- 5. Testing Inventory Movement Ledger: Immutability & Stock Reconstruction ---
  ✔ Ledger recorded all movements (Found: 3)
  ✔ Calculated stock from ledger matches database table (10 == 10)
  ✔ Tamper trigger blocked UPDATE: Inventory movements are an immutable audit ledger.
  ✔ Immutable trigger successfully defended ledger against modification

--- 6. Testing Order Status History Timeline Generation ---
  ✔ Timeline generated 2 distinct events (Got: 2)
  ✔ First event records order creation
  ✔ Second event records cancellation
  ✔ Actor recorded accurately in timeline

--- 7. Testing Failure Recovery: Mid-Transaction Rollback Integrity ---
  ✔ Multi-item order correctly failed when one item was OUT_OF_STOCK
  ✔ Rollback integrity verified: Product C reserved stock remained unmutated (0 == 0)
  ✔ Rollback integrity verified: Product C available stock remained unmutated (10 == 10)

======================================================
ALL 50/50 CONCURRENCY & TRANSACTIONAL TESTS PASSED!
======================================================
```

### D. Production Live API Suite (`https://www.baemeds.com`)
```
--- LIVE PRODUCTION STATUS VERIFICATION ---
✅ /api/admin/orders                  --> HTTP 200 (7,168 bytes live orders)
✅ /api/admin/products?page=1&size=50 --> HTTP 200 (138,051 bytes catalog)
✅ /api/admin/inventory               --> HTTP 200 (11,787 bytes stock ledger)
✅ /api/admin/customers               --> HTTP 200 (959 bytes patient ledger)
✅ /api/admin/prescriptions           --> HTTP 200 (20 bytes review queue)
✅ /api/admin/discounts               --> HTTP 200 (430 bytes coupons)
✅ /api/admin/shipping                --> HTTP 200 (565 bytes carriers)
✅ /api/admin/tax                     --> HTTP 200 (212 bytes jurisdictions)
✅ /api/admin/audit-logs              --> HTTP 200 (60,641 bytes HIPAA trail)
✅ /api/admin/staff                   --> HTTP 200 (1,010 bytes roster)
✅ /api/admin/dashboard               --> HTTP 200 (5,454 bytes live KPIs)
✅ /api/payment-intent                --> HTTP 200 (Stripe client secret generated)

ALL ADMIN & COMMERCE GATEWAYS 100% OPERATIONAL IN PRODUCTION!
```

---

## 3. Test Coverage Boundaries & Known Limitations

1. **Transactional Email Dispatch**: Live email delivery via Resend/SendGrid operates in mock/fallback mode in development until a live production `RESEND_API_KEY` is added to Vercel environment variables.
2. **Third-Party Realtime WebSockets**: Disabled in Node < 22 environments to prevent runtime boot crashes; database queries operate synchronously over HTTPS REST.
3. **Credit Card Authorizations**: Real financial transactions were not executed on production live credit cards; payment integration was verified via Stripe test intents and mock checkout tokens.
