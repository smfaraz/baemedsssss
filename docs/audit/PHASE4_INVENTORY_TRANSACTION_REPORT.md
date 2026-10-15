# BaeMeds.com — Phase 4: Inventory, Concurrency & Transaction Report

**Focus**: Multi-Buyer Stock Contention, Reservation Lifecycles, Idempotency-Key Replays, and Atomic Stock Ledgers  
**Date**: October 15, 2026  
**Auditor**: Principal Reliability Engineer & Database Architect

---

## 1. Concurrency Architecture & Reservation Lifecycle

Durable medical equipment e-commerce cannot tolerate stock overallocations or negative inventory. We tested the system under aggressive concurrent workloads using isolated test environments.

### The 4-State Inventory Reservation Lifecycle:
1. **`ACTIVE`**: Stock is reserved immediately upon checkout initiation (`available = on_hand - reserved`).
2. **`FULFILLED`**: Upon shipment or order capture, physical `on_hand` is decremented and `reserved` is released.
3. **`RELEASED`**: If checkout is abandoned or payment fails, reserved stock is released back into `available`.
4. **`EXPIRED`**: Reservations older than TTL (15 minutes) are reaped by automated sweepers.

---

## 2. Adversarial Test Findings & Results

All tests were executed against an isolated PostgreSQL database engine via `tests/concurrency-inventory.test.ts`.

### A. Final-Unit Contention (2 Concurrent Buyers, 1 Unit Available)
- **Scenario**: Two buyers attempt to check out the last available ResMed AirSense 10 simultaneously.
- **Observed Behavior**:
  - Buyer 1 was granted the reservation and completed checkout (`BM-C893BBD9`).
  - Buyer 2 was rejected atomically with `OUT_OF_STOCK: Insufficient stock for product prod_concurrency_a (Available: 0, Requested: 1)`.
  - Database verification confirmed `on_hand: 1`, `reserved: 1`, `available: 0`. Exactly one order was created. Stock **never** dropped below zero.
  - **Result**: **PASS**

### B. High-Contention Burst (10 Simultaneous Buyers, 1 Unit Available)
- **Scenario**: 10 simultaneous promises launched against a single unit of Product B.
- **Observed Behavior**:
  - Exactly 1 request succeeded; exactly 9 requests were rejected with `OUT_OF_STOCK`.
  - Final available inventory remained precisely 0. No deadlocks or phantom reservations occurred.
  - **Result**: **PASS**

### C. Idempotency-Key Collision & Replay Protection
- **Scenario**: A network drop causes a client to submit the exact same checkout payload with identical `Idempotency-Key` 10 times concurrently.
- **Observed Behavior**:
  - Exactly 1 database order was created.
  - Exactly 1 inventory reservation was created.
  - All 10 concurrent requests returned the identical order ID and order number marked `IDEMPOTENT_REPLAY`.
  - No duplicate charges or double-decrements were created.
  - **Result**: **PASS**

### D. Multi-Item Checkout Rollback Integrity
- **Scenario**: Order contains 2 units of Item A (in stock) and 1 unit of Item B (out of stock).
- **Observed Behavior**:
  - The transaction aborted cleanly.
  - Item A's reserved stock remained 0; available stock remained unchanged (10). Zero partial reservations leaked into the database.
  - **Result**: **PASS**

### E. Immutable Movement Ledger & Anti-Tamper Trigger
- **Scenario**: An attacker or rogue script attempts to `UPDATE` or `DELETE` historical rows in `inventory_movements`.
- **Observed Behavior**:
  - Database trigger raised an exception: `Inventory movements are an immutable audit ledger. UPDATE or DELETE operations are strictly prohibited.`
  - Audit trail remained 100% intact and verifiable against on-hand totals.
  - **Result**: **PASS**

---

## 3. Concurrency Suite Metrics

- **Total Test Cases**: 50
- **Total Tests Passed**: 50 / 50 (100%)
- **Stock Inconsistencies Detected**: 0
- **Negative Stock Occurrences**: 0
