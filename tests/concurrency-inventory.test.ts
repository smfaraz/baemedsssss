/**
 * BaeMeds USA — Concurrency, Idempotency & Transactional Core Test Suite
 * 
 * Verifies:
 * 1. Atomic Row-Level Locking (SELECT ... FOR UPDATE in PostgreSQL)
 * 2. 2 Simultaneous Buyers competing for 1 unit of stock -> exactly 1 SUCCESS, 1 OUT_OF_STOCK
 * 3. 10 Simultaneous Buyers competing for 1 unit of stock -> exactly 1 SUCCESS, 9 OUT_OF_STOCK
 * 4. Zero negative stock (available never equals -1)
 * 5. Idempotency Key deduplication (same request x2, x5, concurrently x10)
 * 6. Reservation Lifecycle (RESERVED -> RELEASED on order cancel -> stock restored)
 * 7. Reservation Lifecycle (RESERVED -> FULFILLED on shipment -> on_hand decremented)
 * 8. Inventory Movement Ledger reconstruction & immutability trigger protection
 * 9. Order Status History timeline audit generation
 * 10. Failure Recovery (Transaction Rollback consistency on mid-flight failure)
 */

import { PostgresEngine } from '../server/commerce/postgresEngine.js';
import { InventoryLedgerService } from '../server/commerce/inventoryLedgerService.js';
import { OrderTransactionService } from '../server/commerce/orderTransactionService.js';
import { IdempotencyService } from '../server/commerce/idempotencyService.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passedTests++;
  console.log(`  ✔ ${msg}`);
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('BAEMEDS USA — TRANSACTIONAL COMMERCE & CONCURRENCY SUITE');
  console.log('======================================================\n');

  // 1. Initialize PostgreSQL Database
  const db = await PostgresEngine.reset();
  console.log('✔ PostgreSQL Database Initialized with Master Schema & Transactional Ledger.');

  // Seed Test Products
  await db.exec(`
    INSERT INTO public.products (id, title, handle, category, price, sku, inventory_quantity, is_active)
    VALUES 
      ('prod_concurrency_a', 'BaeMeds High-Flow Oxygen Concentrator', 'baemeds-oxygen-conc-a', 'Respiratory', 899.00, 'BM-OXY-CONC-A', 1, true),
      ('prod_concurrency_b', 'BaeMeds Titanium Ultra Wheelchair', 'baemeds-wheelchair-b', 'Mobility', 1250.00, 'BM-WCH-TITAN', 1, true),
      ('prod_concurrency_c', 'BaeMeds Electric Hospital Bed', 'baemeds-hospital-bed-c', 'Beds', 2499.00, 'BM-BED-ELEC-C', 10, true)
    ON CONFLICT (id) DO UPDATE SET is_active = true;

    INSERT INTO public.warehouse_inventory (warehouse_id, product_id, sku, on_hand, reserved)
    VALUES 
      ('wh_primary_us_east', 'prod_concurrency_a', 'BM-OXY-CONC-A', 1, 0),
      ('wh_primary_us_east', 'prod_concurrency_b', 'BM-WCH-TITAN', 1, 0),
      ('wh_primary_us_east', 'prod_concurrency_c', 'BM-BED-ELEC-C', 10, 0)
    ON CONFLICT (warehouse_id, product_id) DO UPDATE SET on_hand = excluded.on_hand, reserved = 0;

    INSERT INTO public.inventory_movements (warehouse_id, product_id, movement_type, delta, resulting_on_hand, resulting_reserved, actor_id, reason)
    VALUES 
      ('wh_primary_us_east', 'prod_concurrency_a', 'RECEIPT', 1, 1, 0, 'seed', 'Initial receipt test stock'),
      ('wh_primary_us_east', 'prod_concurrency_b', 'RECEIPT', 1, 1, 0, 'seed', 'Initial receipt test stock'),
      ('wh_primary_us_east', 'prod_concurrency_c', 'RECEIPT', 10, 10, 0, 'seed', 'Initial receipt test stock');
  `);

  // =========================================================================
  // TEST 1: CONCURRENT 2 BUYERS COMPETING FOR 1 ITEM
  // =========================================================================
  console.log('\n--- 1. Testing Concurrency: 2 Simultaneous Buyers for Product A (Available = 1) ---');
  
  const buyer1Promise = OrderTransactionService.placeOrder({
    customer_email: 'buyer1@test.baemeds.com',
    items: [{ product_id: 'prod_concurrency_a', quantity: 1 }],
    shipping_address: {
      address1: '100 Main St',
      city: 'Wilmington',
      province: 'DE',
      zip: '19801'
    },
    idempotency_key: 'idemp_buyer_1_' + Date.now()
  });

  const buyer2Promise = OrderTransactionService.placeOrder({
    customer_email: 'buyer2@test.baemeds.com',
    items: [{ product_id: 'prod_concurrency_a', quantity: 1 }],
    shipping_address: {
      address1: '200 Market St',
      city: 'Wilmington',
      province: 'DE',
      zip: '19801'
    },
    idempotency_key: 'idemp_buyer_2_' + Date.now()
  });

  const [res1, res2] = await Promise.all([buyer1Promise, buyer2Promise]);

  if (!res1.success || !res2.success) {
    console.log('Buyer 1 Result:', res1);
    console.log('Buyer 2 Result:', res2);
  }

  const successCount2 = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
  const failureCount2 = (!res1.success ? 1 : 0) + (!res2.success ? 1 : 0);

  assert(successCount2 === 1, `Exactly 1 of 2 concurrent buyers succeeded (Got: ${successCount2})`);
  assert(failureCount2 === 1, `Exactly 1 of 2 concurrent buyers failed with OUT_OF_STOCK (Got: ${failureCount2})`);

  // Verify final database state for Product A
  const invA = await InventoryLedgerService.getInventory('prod_concurrency_a');
  assert(invA !== null, 'Product A inventory record exists');
  assert(invA!.on_hand === 1, `Final on_hand must be exactly 1 (Got: ${invA!.on_hand})`);
  assert(invA!.reserved === 1, `Final reserved must be exactly 1 (Got: ${invA!.reserved})`);
  assert(invA!.available === 0, `Final available must be exactly 0 (Got: ${invA!.available})`);
  assert(invA!.available >= 0, `CRITICAL: Available inventory NEVER drops below zero (Available = ${invA!.available})`);

  // Verify order records in database
  const ordersA = await db.query(
    `SELECT id, customer_email, total_amount, status FROM public.orders 
     WHERE id IN ($1, $2);`,
    [res1.order?.id || 'none', res2.order?.id || 'none']
  );
  assert(ordersA.rows.length === 1, `Database contains exactly 1 order record (Got: ${ordersA.rows.length})`);

  // =========================================================================
  // TEST 2: CONCURRENT 10 BUYERS COMPETING FOR 1 ITEM
  // =========================================================================
  console.log('\n--- 2. Testing Concurrency: 10 Simultaneous Buyers for Product B (Available = 1) ---');

  const tenBuyersPromises = Array.from({ length: 10 }).map((_, index) =>
    OrderTransactionService.placeOrder({
      customer_email: `concurrent_buyer_${index}@test.baemeds.com`,
      items: [{ product_id: 'prod_concurrency_b', quantity: 1 }],
      shipping_address: {
        address1: `${index + 100} Pennsylvania Ave`,
        city: 'Wilmington',
        province: 'DE',
        zip: '19801'
      },
      idempotency_key: `idemp_ten_buyer_${index}_${Date.now()}`
    })
  );

  const tenResults = await Promise.all(tenBuyersPromises);

  const tenSuccess = tenResults.filter((r) => r.success);
  const tenFailed = tenResults.filter((r) => !r.success);

  assert(tenSuccess.length === 1, `Exactly 1 of 10 simultaneous buyers succeeded (Got: ${tenSuccess.length})`);
  assert(tenFailed.length === 9, `Exactly 9 of 10 simultaneous buyers rejected with OUT_OF_STOCK (Got: ${tenFailed.length})`);

  const invB = await InventoryLedgerService.getInventory('prod_concurrency_b');
  assert(invB!.on_hand === 1, `Product B final on_hand is 1 (Got: ${invB!.on_hand})`);
  assert(invB!.reserved === 1, `Product B final reserved is 1 (Got: ${invB!.reserved})`);
  assert(invB!.available === 0, `Product B final available is 0 (Got: ${invB!.available})`);
  assert(invB!.available >= 0, `CRITICAL: Available stock is NEVER negative under 10 concurrent requests`);

  // =========================================================================
  // TEST 3: IDEMPOTENCY KEY DEDUPLICATION
  // =========================================================================
  console.log('\n--- 3. Testing Idempotency: Same Request x2, x5, and Concurrently x10 ---');

  const fixedIdempotencyKey = 'idemp_key_unique_checkout_9999';
  const orderInputPayload = {
    customer_email: 'idempotent_customer@test.baemeds.com',
    items: [{ product_id: 'prod_concurrency_c', quantity: 2 }],
    shipping_address: {
      address1: '500 Concord Pike',
      city: 'Wilmington',
      province: 'DE',
      zip: '19803'
    },
    idempotency_key: fixedIdempotencyKey
  };

  // First Request
  const idempReq1 = await OrderTransactionService.placeOrder(orderInputPayload);
  assert(idempReq1.success === true, 'First idempotent order request succeeds');
  const initialOrderId = idempReq1.order!.id;
  const initialOrderNumber = idempReq1.order!.order_number;

  // Immediate Second Request with same key
  const idempReq2 = await OrderTransactionService.placeOrder(orderInputPayload);
  assert(idempReq2.success === true, 'Second request with same key returns success');
  assert(idempReq2.idempotent_replay === true, 'Second request is recognized as IDEMPOTENT_REPLAY');
  assert(idempReq2.order!.id === initialOrderId, 'Second request returns identical order ID');
  assert(idempReq2.order!.order_number === initialOrderNumber, 'Second request returns identical order number');

  // Repeat 5 times sequentially
  for (let i = 0; i < 5; i++) {
    const replayRes = await OrderTransactionService.placeOrder(orderInputPayload);
    assert(replayRes.order!.id === initialOrderId, `Sequential replay #${i + 1} resolves to original order`);
  }

  // Repeat 10 times concurrently with the exact same key
  const concurrentReplayPromises = Array.from({ length: 10 }).map(() =>
    OrderTransactionService.placeOrder(orderInputPayload)
  );
  const concurrentReplayResults = await Promise.all(concurrentReplayPromises);
  const allReplayedSameOrder = concurrentReplayResults.every(
    (r) => r.order && r.order.id === initialOrderId && r.order.order_number === initialOrderNumber
  );
  assert(allReplayedSameOrder, 'All 10 concurrent requests with identical key resolved to exactly the same order');

  // Verify that only 1 order and 1 reservation was created in DB for this key
  const idempOrderCount = await db.query<{ count: number }>(
    `SELECT count(*)::int as count FROM public.orders WHERE id = $1;`,
    [initialOrderId]
  );
  assert(idempOrderCount.rows[0].count === 1, `Exactly 1 order created in DB for key (Got: ${idempOrderCount.rows[0].count})`);

  const idempResCount = await db.query<{ count: number }>(
    `SELECT count(*)::int as count FROM public.inventory_reservations WHERE order_id = $1;`,
    [initialOrderId]
  );
  assert(idempResCount.rows[0].count === 1, `Exactly 1 inventory reservation created in DB for key (Got: ${idempResCount.rows[0].count})`);

  // =========================================================================
  // TEST 4: RESERVATION LIFECYCLE & RELEASE
  // =========================================================================
  console.log('\n--- 4. Testing Reservation Lifecycle: Cancellation & Release ---');

  // Product C had on_hand: 10, reserved: 2 (from previous test), available: 8
  const preCancelInv = await InventoryLedgerService.getInventory('prod_concurrency_c');
  assert(preCancelInv!.reserved === 2, `Reserved stock is 2 before cancel (Got: ${preCancelInv!.reserved})`);
  assert(preCancelInv!.available === 8, `Available stock is 8 before cancel (Got: ${preCancelInv!.available})`);

  // Cancel order -> should release reservation
  const cancelResult = await OrderTransactionService.cancelOrder(
    initialOrderId,
    'Customer cancelled prior to clinical review',
    'support_agent_01'
  );
  assert(cancelResult.success === true, 'Order cancellation succeeded');
  assert(cancelResult.releasedReservations === 1, 'Exactly 1 reservation was released');

  // Verify stock restored
  const postCancelInv = await InventoryLedgerService.getInventory('prod_concurrency_c');
  assert(postCancelInv!.reserved === 0, `Reserved stock restored to 0 (Got: ${postCancelInv!.reserved})`);
  assert(postCancelInv!.available === 10, `Available stock restored to 10 (Got: ${postCancelInv!.available})`);

  // Verify reservation record status is RELEASED
  const resRows = await db.query<{ status: string; release_reason: string }>(
    `SELECT status, release_reason FROM public.inventory_reservations WHERE order_id = $1;`,
    [initialOrderId]
  );
  assert(resRows.rows[0].status === 'RELEASED', `Reservation status updated to RELEASED (Got: ${resRows.rows[0].status})`);
  assert(resRows.rows[0].release_reason.includes('Customer cancelled'), 'Release reason recorded');

  // Test Fulfillment Lifecycle on Product A
  const successfulOrderA = res1.success ? res1.order! : res2.order!;
  const resARows = await db.query<{ id: string }>(
    `SELECT id FROM public.inventory_reservations WHERE order_id = $1;`,
    [successfulOrderA.id]
  );
  const resAId = resARows.rows[0].id;

  const fulfillRes = await InventoryLedgerService.fulfillReservation({
    reservationId: resAId,
    actorId: 'warehouse_dispatch_team'
  });
  assert(fulfillRes.success === true, 'Reservation fulfillment succeeded');
  assert(fulfillRes.on_hand === 0, `Product A on_hand decremented to 0 upon fulfillment (Got: ${fulfillRes.on_hand})`);
  assert(fulfillRes.reserved === 0, `Product A reserved decremented to 0 upon fulfillment (Got: ${fulfillRes.reserved})`);
  assert(fulfillRes.available === 0, `Product A available remains 0 (Got: ${fulfillRes.available})`);

  // =========================================================================
  // TEST 5: INVENTORY MOVEMENT LEDGER & RECONSTRUCTION
  // =========================================================================
  console.log('\n--- 5. Testing Inventory Movement Ledger: Immutability & Stock Reconstruction ---');

  // Reconstruct Product C stock from ledger
  const reconstruction = await InventoryLedgerService.reconstructFromLedger('prod_concurrency_c');
  assert(reconstruction.movements.length >= 3, `Ledger recorded all movements (Found: ${reconstruction.movements.length})`);
  assert(
    reconstruction.calculated_available === postCancelInv!.available,
    `Calculated stock from ledger matches database table (${reconstruction.calculated_available} == ${postCancelInv!.available})`
  );

  // Test Immutability: Attacking the movement ledger with an UPDATE
  let tamperBlocked = false;
  try {
    await db.query(`UPDATE public.inventory_movements SET delta = 9999 WHERE product_id = 'prod_concurrency_c';`);
  } catch (err: any) {
    tamperBlocked = true;
    assert(err.message.includes('immutable audit ledger'), `Tamper trigger blocked UPDATE: ${err.message}`);
  }
  assert(tamperBlocked, 'Immutable trigger successfully defended ledger against modification');

  // =========================================================================
  // TEST 6: ORDER STATUS HISTORY TIMELINE
  // =========================================================================
  console.log('\n--- 6. Testing Order Status History Timeline Generation ---');

  const timeline = await OrderTransactionService.getOrderTimeline(initialOrderId);
  assert(timeline.length === 2, `Timeline generated 2 distinct events (Got: ${timeline.length})`);
  assert(timeline[0].to_status === 'PAID', 'First event records order creation');
  assert(timeline[1].to_status === 'CANCELLED', 'Second event records cancellation');
  assert(timeline[1].actor === 'support_agent_01', 'Actor recorded accurately in timeline');

  // =========================================================================
  // TEST 7: FAILURE RECOVERY & ROLLBACK INTEGRITY
  // =========================================================================
  console.log('\n--- 7. Testing Failure Recovery: Mid-Transaction Rollback Integrity ---');

  // Attempt to place an order where 1 product has stock and another product is out of stock / invalid
  const preFailureInv = await InventoryLedgerService.getInventory('prod_concurrency_c');
  const failurePromise = OrderTransactionService.placeOrder({
    customer_email: 'failing_order@test.baemeds.com',
    items: [
      { product_id: 'prod_concurrency_c', quantity: 1 }, // Valid (10 in stock)
      { product_id: 'prod_concurrency_a', quantity: 1 }  // Out of Stock (0 in stock)
    ],
    shipping_address: {
      address1: '700 Foulk Rd',
      city: 'Wilmington',
      province: 'DE',
      zip: '19803'
    }
  });

  const failureResult = await failurePromise;
  assert(failureResult.success === false, 'Multi-item order correctly failed when one item was OUT_OF_STOCK');

  // Verify that Product C stock was NOT reserved because transaction rolled back atomically
  const postFailureInv = await InventoryLedgerService.getInventory('prod_concurrency_c');
  assert(
    postFailureInv!.reserved === preFailureInv!.reserved,
    `Rollback integrity verified: Product C reserved stock remained unmutated (${postFailureInv!.reserved} == ${preFailureInv!.reserved})`
  );
  assert(
    postFailureInv!.available === preFailureInv!.available,
    `Rollback integrity verified: Product C available stock remained unmutated (${postFailureInv!.available} == ${preFailureInv!.available})`
  );

  console.log(`\n======================================================`);
  console.log(`ALL ${passedTests}/${totalTests} CONCURRENCY & TRANSACTIONAL TESTS PASSED!`);
  console.log(`======================================================\n`);

  return {
    success: passedTests === totalTests,
    passedTests,
    totalTests
  };
}

runTestSuite()
  .then((res) => {
    process.exit(res.success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
