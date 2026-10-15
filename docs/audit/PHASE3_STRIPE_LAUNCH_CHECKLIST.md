# BaeMeds USA — Phase 3: Stripe Payment Lifecycle & Live-Mode Cutover Checklist

**Application**: BaeMeds.com (Durable Medical Equipment & Respiratory Devices)  
**Evaluator**: Payment Integration Specialist & Application Security Engineer  
**Date**: October 2026  
**Status**: TEST-MODE FULLY VERIFIED | LIVE-MODE CUTOVER READY  

---

## 1. Executive Summary & PCI DSS Scope

BaeMeds USA integrates Stripe via **Stripe Elements** (`@stripe/react-stripe-js`) and **Server-Side Payment Intents** (`api/payment-intent.ts`, `api/checkout.ts`, `api/webhooks/stripe.ts`).

- **PCI-DSS Compliance Scope**: **SAQ-A**.
  - All cardholder data (PAN, CVV, expiration) is typed directly into iframes hosted on Stripe's PCI Level 1 certified domain (`js.stripe.com`).
  - No cardholder data ever enters, traverses, or is stored on BaeMeds web servers, serverless lambdas, or Supabase databases.
- **Environment Safety Status**:
  - Live API testing against `https://www.baemeds.com/api/payment-intent` confirmed that the live system is operating safely with **Stripe Test Mode Keys** (`pk_test_...`).
  - Real customer cards will not be charged until the explicit live-mode cutover is executed by the project owner.

---

## 2. Technical Payment Controls Verification

| Payment Control | Implementation & Verification Details | Status |
| :--- | :--- | :---: |
| **1. Server-Authoritative Line Items & Prices** | In `api/checkout.ts`, product prices are fetched directly from the authoritative database table `products`. Request body prices submitted by the client are strictly ignored. | **VERIFIED** |
| **2. Server-Authoritative Tax & Shipping** | Sales tax is computed by `TaxService` on the server using state tax matrices and medical equipment exemption rules. Shipping rates are calculated server-side based on cart subtotal and DME freight rules ($0 standard ground delivery over $99). | **VERIFIED** |
| **3. Server-Authoritative Discounts** | Coupon codes are validated against the database table `discounts` on the server. Arbitrary client discounts are rejected with `HTTP 400 Bad Request`. | **VERIFIED** |
| **4. PaymentIntent Creation & Integrity** | `api/payment-intent.ts` calculates `amountInCents` based on the authoritative order subtotal. Live probe confirmed successful PaymentIntent creation (`pi_3UQsJORwbnSkw3XW08I39r27`) in test mode. | **VERIFIED** |
| **5. Idempotent Checkout & Replay Defense** | Re-sending the identical checkout request with the same `Idempotency-Key` returns the existing order and PaymentIntent without duplicating reservations or charges. Verified across 10 concurrent requests in `tests/concurrency-inventory.test.ts`. | **VERIFIED** |
| **6. Raw Webhook Signature Verification** | `api/webhooks/stripe.ts` captures the raw request text buffer and verifies HMAC-SHA256 signatures via `stripe.webhooks.constructEvent(rawBody, sig, secret)`. Unsigned or tampered requests are immediately rejected. | **VERIFIED** |
| **7. Duplicate Webhook Delivery Immunity** | Webhook handler performs idempotent updates: `status: 'PAID'` and `payment_status: 'paid'`. Receiving the same `payment_intent.succeeded` event multiple times does not duplicate order line items or trigger multiple fulfillment alerts. | **VERIFIED** |
| **8. Atomic Rollback on Payment Failure** | Mid-transaction failures (e.g., card declined, stock exhausted) automatically release inventory reservations and keep database inventory balances unchanged. Verified in `tests/concurrency-inventory.test.ts`. | **VERIFIED** |
| **9. Refund Lifecycle Support** | `api/admin.ts` implements refund processing via `stripe.refunds.create({ payment_intent: pi_id })`, records refund audit events, and updates order payment status to `refunded`. | **VERIFIED** |
| **10. Zero Secrets in Client Assets** | Source code, `dist/assets/*.js`, and Git history were scanned. No `sk_live_...`, `rk_live_...`, or `whsec_...` secrets are exposed in browser bundles or client-facing responses. | **VERIFIED** |

---

## 3. Stripe Secret & Environment Variable Separation

To prevent accidental mixing of test and live credentials across environments, the following variable naming convention and scoping must be maintained:

```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│         Vercel Preview / Test         │        Vercel Production (Live)       │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ VITE_STRIPE_PUBLISHABLE_KEY           │ VITE_STRIPE_PUBLISHABLE_KEY           │
│ Value: pk_test_...                    │ Value: pk_live_...                    │
│ STRIPE_SECRET_KEY                     │ STRIPE_SECRET_KEY                     │
│ Value: sk_test_...                    │ Value: sk_live_... (or rk_live_...)   │
│ STRIPE_WEBHOOK_SECRET                 │ STRIPE_WEBHOOK_SECRET                 │
│ Value: whsec_test_...                 │ Value: whsec_live_...                 │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

> [!CAUTION]
> **Strict Environment Isolation Rule**:
> Never pair a `pk_live_...` publishable key with an `sk_test_...` secret key, or vice-versa. Stripe Elements will reject the client secret if the publishable key and secret key belong to different account modes.

---

## 4. Live-Mode Cutover Checklist (Owner Action Plan)

This step-by-step checklist must be executed by the authorized Stripe account administrator when ready to accept real customer payments:

### Step 1: Stripe Account Activation
- [ ] Log in to the Stripe Dashboard at `https://dashboard.stripe.com`.
- [ ] Complete Identity and Business Verification for **BaeMeds Healthcare USA LLC**.
- [ ] Verify legal entity name, EIN, and physical address: `1209 Orange Street, Wilmington, DE 19801`.
- [ ] Add the official corporate bank account for automated payouts.
- [ ] Toggle the dashboard mode switch from **Test Mode** to **Live Mode**.

### Step 2: Live API Key Generation
- [ ] Navigate to **Developers -> API keys** (`https://dashboard.stripe.com/apikeys`).
- [ ] Copy the **Publishable key** (`pk_live_...`).
- [ ] Create a **Restricted key** (or copy Secret key `rk_live_...`) with the following minimum-necessary permissions:
  - `PaymentIntents`: Read & Write
  - `Refunds`: Read & Write
  - `Customers`: Read & Write
  - `Webhook Endpoints`: Read
- [ ] Securely store the generated restricted key (do not email or commit to Git).

### Step 3: Live Webhook Endpoint Registration
- [ ] Navigate to **Developers -> Webhooks** (`https://dashboard.stripe.com/webhooks`).
- [ ] Click **Add destination / endpoint**.
- [ ] Endpoint URL: `https://www.baemeds.com/api/webhooks/stripe`.
- [ ] Select Events to listen for:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `payment_intent.canceled`
  - `charge.refunded`
- [ ] Click **Add endpoint**.
- [ ] Reveal the **Signing secret** (`whsec_...`).

### Step 4: Vercel Production Environment Update
- [ ] Log in to Vercel Dashboard -> Project `baemeds-main` -> **Settings -> Environment Variables**.
- [ ] Update the following variables under the **Production** environment:
  - `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
  - `STRIPE_SECRET_KEY` = `rk_live_...` (or `sk_live_...`)
  - `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- [ ] Trigger a production redeployment for the new variables to take effect.

### Step 5: Live Verification Transaction ($1.00 Verification Test)
- [ ] Visit `https://www.baemeds.com` in an incognito window.
- [ ] Add a low-cost item or temporary test accessory to cart.
- [ ] Proceed to checkout and enter a real credit card.
- [ ] Complete the purchase and record the Order Number (`BM-XXXXXX`).
- [ ] Verify that the order transitions to `PAID` in the BaeMeds Admin Back-Office (`/admin`).
- [ ] Verify that the webhook delivery shows **200 OK** in the Stripe Dashboard.
- [ ] In the Admin Back-Office or Stripe Dashboard, execute an **immediate 100% refund** to return the funds.
- [ ] Verify the order state updates to `REFUNDED` in BaeMeds database.

---

## 5. Architectural Payment Sign-Off

The payment lifecycle in BaeMeds USA satisfies all transactional integrity, anti-tampering, and PCI DSS SAQ-A boundary requirements. Live-mode cutover is documented and ready for owner execution.
