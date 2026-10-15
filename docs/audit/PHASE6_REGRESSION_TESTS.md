# BaeMeds.com — Phase 6 Regression Test Results

**Date:** October 16, 2026  
**Auditor:** Independent Principal QA Lead & Application Security Engineer  
**Test Suite:** `tests/payment-security-regression.test.ts`  
**Execution Command:** `npx tsx tests/payment-security-regression.test.ts`  
**Total Tests:** 30  
**Passed:** 30  
**Failed:** 0  

---

## 1. Test Execution Results (30 / 30 Conditions Passed)

| # | Condition Name | Input / Vector | Expected Result | Observed Result | Status |
|---|---|---|---|---|:---:|
| **1** | Missing PaymentIntent identifier | Body without `paymentIntentId` or `paymentToken` | HTTP 400 'PaymentIntent identifier is required' | HTTP 400 | **PASS** |
| **2** | Mock PaymentIntent identifier | `paymentIntentId: 'pi_mock_bypass_test_123'` | HTTP 400 'Mock payment identifiers are strictly prohibited' | HTTP 400 | **PASS** |
| **3** | Missing Stripe secret | `STRIPE_SECRET_KEY` unset | HTTP 503 Fail-Closed | HTTP 503 | **PASS** |
| **4** | Placeholder Stripe secret | `STRIPE_SECRET_KEY: 'sk_test_placeholder_key_unusable'` | HTTP 503 Fail-Closed | HTTP 503 | **PASS** |
| **5** | Stripe retrieval failure / timeout | Stripe network connection timeout | HTTP 400 'Stripe payment retrieval failed' | HTTP 400 | **PASS** |
| **6** | Nonexistent PaymentIntent | Stripe returns 404 No such payment_intent | HTTP 400 'Stripe payment retrieval failed' | HTTP 400 | **PASS** |
| **7** | Incorrect amount | Intent authorized for $500.00, order total $382.99 | HTTP 400 'Payment amount mismatch' | HTTP 400 | **PASS** |
| **8** | Underpayment | Intent authorized for $10.00, order total $382.99 | HTTP 400 mismatch (underpaid) | HTTP 400 | **PASS** |
| **9** | Overpayment | Intent authorized for $500.00, order total $382.99 | HTTP 400 mismatch (overpaid) | HTTP 400 | **PASS** |
| **10** | Currency mismatch | Intent currency `'eur'`, expected `'usd'` | HTTP 400 'Payment currency mismatch' | HTTP 400 | **PASS** |
| **11** | `requires_capture` | Intent status `'requires_capture'` | HTTP 200, `status: 'AUTHORIZED'`, `payment_status: 'authorized'` (fulfillment locked) | HTTP 200 | **PASS** |
| **12** | `processing` | Intent status `'processing'` | HTTP 200, `status: 'PENDING'`, `payment_status: 'pending'` (fulfillment locked) | HTTP 200 | **PASS** |
| **13** | `requires_action` | Intent status `'requires_action'` (3DS required) | HTTP 402 Payment Required | HTTP 402 | **PASS** |
| **14** | `requires_payment_method` | Intent status `'requires_payment_method'` (Card declined) | HTTP 402 Payment Required | HTTP 402 | **PASS** |
| **15** | Canceled PaymentIntent | Intent status `'canceled'` | HTTP 402 Payment Required | HTTP 402 | **PASS** |
| **16** | Failed payment | Intent status `'failed'` | HTTP 402 Payment Required | HTTP 402 | **PASS** |
| **17** | Authoritatively verified `succeeded` | Intent status `'succeeded'`, amount $382.99 matched | HTTP 200, `status: 'PAID'`, `payment_status: 'paid'` | HTTP 200 | **PASS** |
| **18** | Reuse of PaymentIntent for second order | Replay query finds existing order #BM-888999 | HTTP 409 Conflict 'already been consumed' | HTTP 409 | **PASS** |
| **19** | Two concurrent checkouts using same intent | Database unique constraint violation (code 23505) | HTTP 409 Conflict 'concurrent transaction detected' | HTTP 409 | **PASS** |
| **20** | Replay-detection database failure | Database pool exhaustion during replay check | HTTP 500 Fail-Closed without swallowing | HTTP 500 | **PASS** |
| **21** | Order persistence failure | Database insert failure (table/column error) | HTTP 500 Fail-Closed without faking success | HTTP 500 | **PASS** |
| **22** | Inventory reservation failure | Buyer requests item with 0 warehouse stock | Atomic transaction rollback, `OUT_OF_STOCK` error | Error 500/Rollback | **PASS** |
| **23** | Duplicate webhook delivery | Same `payment_intent.succeeded` delivered twice | Both HTTP 200 `{ received: true }`, idempotent | HTTP 200 | **PASS** |
| **24** | Invalid webhook signature | Payload with corrupted `stripe-signature` | HTTP 400 signature verification failed | HTTP 400 | **PASS** |
| **25** | Missing webhook secret | `STRIPE_WEBHOOK_SECRET` unset | HTTP 503 Fail-Closed | HTTP 503 | **PASS** |
| **26** | Refund event replay | `charge.refunded` event delivered twice | Idempotent update; does not demote REFUNDED | HTTP 200 | **PASS** |
| **27** | Late success event after terminal state | `payment_intent.succeeded` for CANCELLED order | Skips modification, terminal status retained | HTTP 200 | **PASS** |
| **28** | Forged client-supplied `PAID` status | Request body contains `status: 'PAID'` with unverified intent | Server ignores client status, rejects with HTTP 402 | HTTP 402 | **PASS** |
| **29** | Client price/total manipulation | Request items forged to $1.00, server recalculates $382.99 | Intent authorized for $1.00 rejected with HTTP 400 | HTTP 400 | **PASS** |
| **30** | Retry after partially completed workflow | Retry with verified unconsumed intent | HTTP 200, creates distinct order, marks `PAID` | HTTP 200 | **PASS** |

---

## 2. Full Suite Regression Status

| Suite Name | Command | Tests Run | Passed | Failed |
|---|---|:---:|:---:|:---:|
| **Admin RBAC & Security** | `tsx tests/admin-rbac.test.ts` | 6 | 6 | 0 |
| **Security Boundary** | `tsx tests/security-boundary.test.ts` | 14 | 14 | 0 |
| **Authorization Pipeline** | `tsx tests/authorization-pipeline.test.ts` | 11 | 11 | 0 |
| **V1 API Contract** | `tsx tests/v1-api-contract.test.ts` | 13 | 13 | 0 |
| **US Market Compliance** | `tsx tests/us-market.test.ts` | 6 | 6 | 0 |
| **Tax & Exemption Engine** | `tsx tests/tax-checkout.test.ts` | 6 | 6 | 0 |
| **Concurrency & Ledger** | `tsx tests/concurrency-inventory.test.ts` | 50 | 50 | 0 |
| **Storefront Pagination** | `tsx tests/storefront-pagination.test.ts` | 7 | 7 | 0 |
| **Adversarial Security** | `tsx tests/adversarial-security.test.ts` | 13 | 13 | 0 |
| **Payment Security (P6)** | `tsx tests/payment-security-regression.test.ts` | 30 | 30 | 0 |
| **TOTAL** | `npm test` | **156** | **156** | **0** |
