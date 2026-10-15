# BaeMeds.com — Phase 5: Checkout & Idempotency Report

**Roles**: Senior E-Commerce QA Engineer & Production Reliability Engineer  
**Audit Target**: `api/checkout.ts`, `server/commerce/orderService.ts`, `tests/concurrency-inventory.test.ts`  
**Date**: October 15, 2026  

---

## 1. Authoritative Checkout Pricing & Manipulation Resistance

In modern e-commerce, the server must act as the sole source of truth for all pricing components. We conducted manipulation probes across all checkout inputs:

| Parameter | Tampering Attempt | Server Defense Mechanism | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Product Unit Price** | Client passes $0.01 for $899 CPAP | Server queries Supabase `products` catalog and overrides client price | Authoritative catalog price applied ($899) | **Verified PASS** |
| **Quantity** | Client passes negative or fractional qty | Validation schema enforces positive integers (`quantity >= 1`) | Non-positive quantities rejected with 400 | **Verified PASS** |
| **Shipping Costs** | Client sets shipping to $0.00 | Server recalculates shipping tier from zip/state matrix | Authoritative shipping cost enforced | **Verified PASS** |
| **Discounts / Coupons** | Client supplies fake code or 90% off | Server queries `discounts` table, verifies active dates and minimum spend | Invalid/expired coupon rejected | **Verified PASS** |
| **Sales Tax** | Client passes $0.00 tax for taxable state | Server recalculates sales tax via `server/taxService.ts` | Authoritative tax added to subtotal | **Verified PASS** |
| **Currency** | Client submits `EUR` or `CAD` | Server forces `currency = 'USD'` and rejects mismatched intents | USD strictly enforced | **Verified PASS** |
| **Prescription Flag** | Client removes prescription flag on CPAP | Server reads `prescription_required` from database product row | Order flagged as requiring clinical Rx | **Verified PASS** |

---

## 2. Idempotency Key Replay Protection

During network disruptions or mobile connectivity handoffs, customers frequently trigger repeated checkout requests. The checkout pipeline employs strict idempotency controls:

### Test Case Execution (`tests/concurrency-inventory.test.ts` Section 3)
1. **Sequential Replays**: The same checkout payload with identical `Idempotency-Key` was submitted 5 times sequentially.
   - Result: Sequential replays #1 through #5 resolved to the original order ID. Zero duplicate orders created.
2. **Concurrent Replays**: 10 simultaneous promises submitted the exact same `Idempotency-Key` concurrently.
   - Result: All 10 concurrent requests returned the identical order ID and order number marked `IDEMPOTENT_REPLAY`.
   - Database verification confirmed exactly 1 order record and 1 inventory reservation were created.
   - **Status**: **Verified PASS**

---

## 3. Atomic Multi-Item Transactions & Failure Rollback

When a multi-item order is placed, stock must be reserved across all line items atomically. If any item is unavailable, no partial reservations may leak.

### Test Case Execution (`tests/concurrency-inventory.test.ts` Section 7)
- **Scenario**: An order contains 2 units of Item A (in stock, 10 available) and 1 unit of Item B (out of stock, 0 available).
- **Observed Behavior**:
  - The transaction aborted with `OUT_OF_STOCK`.
  - Rollback integrity verified: Item A's reserved stock remained 0; available stock remained 10.
  - Zero orphan reservations or phantom locks remained in the database.
  - **Status**: **Verified PASS**

---

## 4. Multi-Buyer Stock Contention Under High Load

| Workload | Initial Available | Concurrent Buyers | Orders Completed | Orders Rejected | Final Available | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Final Unit Contention** | 1 Unit | 2 Simultaneous Buyers | 1 Order | 1 Rejected (Out of Stock) | Exactly 0 Units | **Verified PASS** |
| **High Contention Burst**| 1 Unit | 10 Simultaneous Buyers | 1 Order | 9 Rejected (Out of Stock) | Exactly 0 Units | **Verified PASS** |
| **Batch Contention** | 10 Units | 50 Simultaneous Buyers | 10 Orders | 40 Rejected (Out of Stock) | Exactly 0 Units | **Verified PASS** |
| **Negative Stock Check** | Any | Concurrent requests | N/A | N/A | Stock **NEVER** dropped below zero | **Verified PASS** |
