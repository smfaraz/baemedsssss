# BaeMeds USA — Concurrency & Transactional Verification Report

**Execution Date**: 2026-10-01  
**Environment**: Native PostgreSQL / PGlite WASM (ACID Compliant)  
**Test Suite**: `tests/concurrency-inventory.test.ts`  
**Total Assertions Executed**: 50  
**Overall Result**: **100% PASS (50/50)**

---

## 1. Concurrency Test 1: 2 Simultaneous Buyers for 1 Unit

### Test Objective
Verify that when two concurrent purchase requests compete simultaneously for a single remaining unit of stock (`available = 1`), PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) guarantees that exactly one buyer succeeds and the other is rejected with `OUT_OF_STOCK`. Available stock must never drop below zero.

### Setup
* Product: `prod_concurrency_a` (*BaeMeds High-Flow Oxygen Concentrator*)
* Initial Inventory: `on_hand = 1`, `reserved = 0`, `available = 1`
* Simultaneous Requests: 2 concurrent `placeOrder` executions via `Promise.all`

### Observed Execution Log
```text
--- 1. Testing Concurrency: 2 Simultaneous Buyers for Product A (Available = 1) ---
Buyer 1 Result: {
  order: {
    id: 'ord_d550af197c0d4bba8298d132232de1d0',
    status: 'PAID',
    tax_amount: 0,
    order_number: 'BM-FBCB9A83',
    total_amount: 899,
    customer_email: 'buyer1@test.baemeds.com',
    discount_amount: 0,
    shipping_amount: 0,
    subtotal_amount: 899,
    requires_prescription: false
  },
  success: true
}
Buyer 2 Result: {
  success: false,
  error: 'TRANSACTION_FAILED',
  message: 'OUT_OF_STOCK: Insufficient stock for product prod_concurrency_a (Available: 0, Requested: 1)'
}
```

### Verification Metrics
| Metric | Expected | Actual | Status |
|---|---|---|---|
| Successful Orders | Exactly 1 | 1 | **PASS** |
| Rejected Orders (`OUT_OF_STOCK`) | Exactly 1 | 1 | **PASS** |
| Final `on_hand` | 1 | 1 | **PASS** |
| Final `reserved` | 1 | 1 | **PASS** |
| Final `available` | 0 | 0 | **PASS** |
| Negative Availability (`available < 0`) | Never | 0 (Never negative) | **PASS** |
| Total Orders Created in DB | Exactly 1 | 1 | **PASS** |

---

## 2. Concurrency Test 2: 10 Simultaneous Buyers for 1 Unit

### Test Objective
Verify that under hostile, high-concurrency conditions where 10 simultaneous buyers submit orders in parallel for a single unit of stock, exactly 1 order succeeds, 9 are rejected, and stock integrity is perfectly maintained.

### Setup
* Product: `prod_concurrency_b` (*BaeMeds Titanium Ultra Wheelchair*)
* Initial Inventory: `on_hand = 1`, `reserved = 0`, `available = 1`
* Simultaneous Requests: 10 concurrent `placeOrder` executions via `Promise.all`

### Verification Metrics
| Metric | Expected | Actual | Status |
|---|---|---|---|
| Successful Reservations | Exactly 1 | 1 | **PASS** |
| Rejected Requests (`OUT_OF_STOCK`) | Exactly 9 | 9 | **PASS** |
| Final `on_hand` | 1 | 1 | **PASS** |
| Final `reserved` | 1 | 1 | **PASS** |
| Final `available` | 0 | 0 | **PASS** |
| Final Available `< 0` | Strictly Forbidden | 0 | **PASS** |

---

## 3. Idempotency Test: Same Request x2, x5, and Concurrently x10

### Test Objective
Ensure that identical requests bearing the same `Idempotency-Key` resolve to the exact same order and response body without generating duplicate orders, multiple reservations, or extra credit charges.

### Setup
* Product: `prod_concurrency_c` (*BaeMeds Electric Hospital Bed*, Quantity: 2)
* Idempotency Key: `idemp_key_unique_checkout_9999`

### Verification Metrics
| Test Phase | Execution | Result | Status |
|---|---|---|---|
| Initial Request | Single POST | Returned Order `ord_...`, status 201 | **PASS** |
| Sequential Replay (x2) | Immediate second request | `idempotent_replay: true`, identical Order ID and Number | **PASS** |
| Sequential Replay (x5) | 5 sequential requests | All 5 returned identical Order ID | **PASS** |
| Concurrent Replay (x10) | 10 parallel requests | All 10 returned identical Order ID and Number | **PASS** |
| Total Orders in DB for Key | Exactly 1 | 1 | **PASS** |
| Total Reservations in DB for Key | Exactly 1 | 1 | **PASS** |

---

## 4. Reservation Lifecycle & Release Testing

### Test Objective
Validate the state progression `RESERVED` $\to$ `RELEASED` on cancellation/expiry and `RESERVED` $\to$ `FULFILLED` on shipment.

### Observations
1. **Cancellation & Release**:
   * Prior to cancellation: `reserved = 2`, `available = 8`.
   * Order cancelled via `OrderTransactionService.cancelOrder()`.
   * Exactly 1 reservation released with reason: *"Customer cancelled prior to clinical review"*.
   * Post-cancellation: `reserved = 0`, `available = 10` (Stock completely restored).
   * Reservation record status updated to `RELEASED`.
2. **Fulfillment**:
   * Reservation for Product A fulfilled via `InventoryLedgerService.fulfillReservation()`.
   * Post-fulfillment: `on_hand = 0`, `reserved = 0`, `available = 0`.
   * Movement ledger recorded `FULFILLMENT` with delta `-1`.

---

## 5. Movement Ledger Immutability & Stock Reconstruction

### Test Objective
Demonstrate that stock levels can be reconstructed from immutable audit movements and that malicious updates to historical ledger records are blocked by database triggers.

### Results
* **Audit Reconstruction**: `reconstructFromLedger('prod_concurrency_c')` calculated available stock as `10`, matching the database table balance `10 == 10`.
* **Tamper Defense**: Executed malicious query:
  ```sql
  UPDATE public.inventory_movements SET delta = 9999 WHERE product_id = 'prod_concurrency_c';
  ```
  Result: Database aborted with exception:
  `ERROR: Inventory movements are an immutable audit ledger. UPDATE or DELETE operations are strictly prohibited.`
  Ledger immutability verified.

---

## 6. Failure Recovery (Mid-Transaction Rollback)

### Test Objective
Verify that if an order contains multiple items and one item fails (e.g. out of stock), the entire transaction rolls back cleanly, leaving zero orphaned reservations.

### Results
* Multi-item order submitted: Item 1 has 10 units in stock; Item 2 has 0 units in stock.
* Database threw `OUT_OF_STOCK` exception for Item 2.
* Transaction rolled back.
* Item 1 reserved stock verified: `0` (Unchanged from pre-transaction state).
* Zero orphaned reservations or partial orders created.

---

## 7. Acceptance Criteria Checklist

- [x] Concurrency protection implemented in PostgreSQL (`SELECT ... FOR UPDATE`), not JavaScript.
- [x] 2 simultaneous buyers test passed (1 Success, 1 Out of Stock).
- [x] 10 simultaneous buyers test passed (1 Success, 9 Rejected).
- [x] Available inventory never drops below zero.
- [x] Idempotency table prevents duplicate orders and reservations under sequential and concurrent replay.
- [x] Reservations release cleanly on cancellation/failure.
- [x] Immutable movement ledger records all mutations.
- [x] Order history timeline generated accurately.
- [x] Full atomic rollback verified on transaction failure.
