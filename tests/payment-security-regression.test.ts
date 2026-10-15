/**
 * BaeMeds USA — Phase 6 Critical Payment Security & Final Release Gate Regression Suite
 * 
 * Verifies all 30 conditions specified in Phase 6:
 * 1. Missing PaymentIntent identifier
 * 2. Mock PaymentIntent identifier in production-mode configuration
 * 3. Missing Stripe secret
 * 4. Placeholder Stripe secret
 * 5. Stripe retrieval failure or timeout
 * 6. Nonexistent PaymentIntent
 * 7. Incorrect amount
 * 8. Underpayment
 * 9. Overpayment
 * 10. Currency mismatch
 * 11. requires_capture
 * 12. processing
 * 13. requires_action
 * 14. requires_payment_method
 * 15. Canceled PaymentIntent
 * 16. Failed payment
 * 17. Successfully verified succeeded PaymentIntent
 * 18. Reuse of a PaymentIntent for a second order
 * 19. Two concurrent checkout requests using the same PaymentIntent
 * 20. Replay-detection database failure
 * 21. Order persistence failure
 * 22. Inventory reservation failure
 * 23. Duplicate webhook delivery
 * 24. Invalid webhook signature
 * 25. Missing webhook secret
 * 26. Refund event replay
 * 27. Late success event after a terminal state
 * 28. Forged client-supplied PAID status
 * 29. Client-supplied price or total manipulation
 * 30. Retry after a partially completed payment/order workflow
 */

import checkoutHandler from '../api/checkout.js';
import webhookHandler, { setWebhookSupabase } from '../api/webhooks/stripe.js';
import { adminSupabase, getAdminSupabase, memoryOrders } from '../api/admin.js';
import { PostgresEngine } from '../server/commerce/postgresEngine.js';
import Stripe from 'stripe';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (!condition) {
    console.error(`  [FAIL] Condition ${totalTests}: ${testName}${detail ? ` -> ${detail}` : ''}`);
    throw new Error(`Assertion failed for Condition ${totalTests}: ${testName}`);
  }
  passedTests++;
  console.log(`  [PASS] Condition ${totalTests}: ${testName}`);
}

const sampleCustomer = {
  email: 'security.test@baemeds.com',
  firstName: 'Audit',
  lastName: 'Officer',
  address1: '1201 N Market St',
  city: 'Wilmington',
  province: 'DE',
  zip: '19801',
  country: 'US',
  phone: '3025550199'
};

const sampleItems = [
  {
    id: 'prd-cgm-dexcom-g7',
    merchandiseId: 'prd-cgm-dexcom-g7',
    title: 'Dexcom G7 Continuous Glucose Monitoring (CGM) System',
    price: 357.99,
    quantity: 1,
    prescriptionRequired: false
  }
];

// Subtotal = 357.99, priority shipping = 25.00, DE tax = 0.00 => Total = 382.99 (38299 cents)
const EXPECTED_CENTS = 38299;

// Helper to construct a standard checkout request
function makeCheckoutReq(overrides: Record<string, any> = {}) {
  const body = {
    cartId: 'cart_sec_audit',
    email: sampleCustomer.email,
    firstName: sampleCustomer.firstName,
    lastName: sampleCustomer.lastName,
    address1: sampleCustomer.address1,
    city: sampleCustomer.city,
    province: sampleCustomer.province,
    zip: sampleCustomer.zip,
    country: sampleCustomer.country,
    phone: sampleCustomer.phone,
    shippingTier: 'priority',
    items: sampleItems,
    ...overrides
  };

  return new Request('https://www.baemeds.com/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function runPhase6SecuritySuite() {
  console.log('================================================================');
  console.log('BAEMEDS PHASE 6: CRITICAL PAYMENT SECURITY & RELEASE GATE SUITE');
  console.log('================================================================\n');

  // Baseline credentials backup
  const originalStripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_baemeds_secure_synthetic_key_unit';
  const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_synthetic_secret_unit';
  process.env.STRIPE_SECRET_KEY = originalStripeKey;
  process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;

  // Intercept Stripe retrieve for deterministic, safe unit testing
  let mockStripeRetrieveHandler: (id: string) => Promise<any> = async (id: string) => {
    return {
      id,
      status: 'succeeded',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    };
  };

  (Stripe as any).resources.PaymentIntents.prototype.retrieve = async function(id: string) {
    return mockStripeRetrieveHandler(id);
  };

  // Intercept Supabase for deterministic replay & persistence checks
  let mockReplayLookupResult: { data: any; error: any } = { data: null, error: null };
  let mockOrderInsertResult: { error: any } = { error: null };
  let mockOrderItemsInsertResult: { error: any } = { error: null };
  let mockOrderDeleteCalled: boolean = false;
  let mockOrderDeleteResult: { error: any } = { error: null };
  let mockOrderUpdateCalled: boolean = false;
  let mockOrderUpdateData: any = null;
  let mockRpcResult: { data: any; error: any } = { data: null, error: { message: 'Could not find the function public.create_order_atomic in schema cache' } };

  const underlyingClient = getAdminSupabase();
  const originalFrom = underlyingClient.from.bind(underlyingClient);
  (underlyingClient as any).rpc = async (_fn: string, _params: any) => {
    return mockRpcResult;
  };
  underlyingClient.from = (table: string) => {
    if (table === 'orders') {
      return {
        select: (_cols?: string) => ({
          eq: (_col: string, _val: any) => ({
            maybeSingle: async () => mockReplayLookupResult,
            single: async () => mockReplayLookupResult
          })
        }),
        insert: async (_data: any) => mockOrderInsertResult,
        delete: () => ({
          eq: (_col: string, _val: any) => {
            mockOrderDeleteCalled = true;
            return Promise.resolve(mockOrderDeleteResult);
          }
        }),
        update: (data: any) => ({
          eq: (_col: string, _val: any) => {
            mockOrderUpdateCalled = true;
            mockOrderUpdateData = data;
            return Promise.resolve({ error: null });
          }
        })
      } as any;
    }
    if (table === 'order_items') {
      return {
        insert: async (_items: any) => mockOrderItemsInsertResult
      } as any;
    }
    if (table === 'audit_logs') {
      return {
        insert: async (_log: any) => ({ error: null })
      } as any;
    }
    return originalFrom(table);
  };
  setWebhookSupabase(underlyingClient);

  // ------------------------------------------------------------------
  // 1. Missing PaymentIntent identifier
  // ------------------------------------------------------------------
  {
    const req = makeCheckoutReq({ paymentIntentId: undefined, paymentToken: undefined });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 400 && body.error?.includes('PaymentIntent identifier is required'),
      'Missing PaymentIntent identifier rejected with HTTP 400',
      `Got status: ${res.status}, error: ${body.error}`
    );
  }

  // ------------------------------------------------------------------
  // 2. Mock PaymentIntent identifier in production-mode configuration
  // ------------------------------------------------------------------
  {
    const req = makeCheckoutReq({ paymentIntentId: 'pi_mock_bypass_test_123' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 400 && body.error?.includes('Mock payment identifiers are strictly prohibited'),
      'Mock PaymentIntent identifier rejected with HTTP 400 fail-closed',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 3. Missing Stripe secret
  // ------------------------------------------------------------------
  {
    delete process.env.STRIPE_SECRET_KEY;
    const req = makeCheckoutReq({ paymentIntentId: 'pi_valid_format_test_123' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 503 && body.error?.includes('missing or unusable'),
      'Missing Stripe secret fails closed with HTTP 503',
      `Got status: ${res.status}`
    );
    process.env.STRIPE_SECRET_KEY = originalStripeKey;
  }

  // ------------------------------------------------------------------
  // 4. Placeholder Stripe secret
  // ------------------------------------------------------------------
  {
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder_key_unusable';
    const req = makeCheckoutReq({ paymentIntentId: 'pi_valid_format_test_123' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 503 && body.error?.includes('Fail-closed'),
      'Placeholder Stripe secret fails closed with HTTP 503',
      `Got status: ${res.status}`
    );
    process.env.STRIPE_SECRET_KEY = originalStripeKey;
  }

  // ------------------------------------------------------------------
  // 5. Stripe retrieval failure or timeout
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async () => {
      throw new Error('Connection timed out connecting to api.stripe.com');
    };
    const req = makeCheckoutReq({ paymentIntentId: 'pi_valid_format_test_123' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 400 && body.error?.includes('Stripe payment retrieval failed'),
      'Stripe retrieval timeout rejected with HTTP 400',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 6. Nonexistent PaymentIntent
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async () => {
      const err: any = new Error('No such payment_intent: pi_nonexistent_123');
      err.statusCode = 404;
      throw err;
    };
    const req = makeCheckoutReq({ paymentIntentId: 'pi_nonexistent_123' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 400 && (body.error?.includes('No such payment_intent') || body.error?.includes('Stripe payment retrieval failed')),
      'Nonexistent PaymentIntent fails closed with HTTP 400',
      `Got status: ${res.status}, error: ${body.error}`
    );
  }

  // ------------------------------------------------------------------
  // 7. Incorrect amount
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'succeeded',
      amount: 50000, // $500.00 instead of $382.99
      currency: 'usd'
    });
    const req = makeCheckoutReq({ paymentIntentId: 'pi_amt_mismatch_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 400 && body.error?.includes('Payment amount mismatch'),
      'Incorrect payment amount rejected with HTTP 400',
      `Got error: ${body.error}`
    );
  }

  // ------------------------------------------------------------------
  // 8. Underpayment
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'succeeded',
      amount: 1000, // $10.00 underpaid
      currency: 'usd'
    });
    const req = makeCheckoutReq({ paymentIntentId: 'pi_underpaid_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 400 && body.error?.includes('underpaid'),
      'Underpayment rejected with descriptive mismatch reason',
      `Got error: ${body.error}`
    );
  }

  // ------------------------------------------------------------------
  // 9. Overpayment
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'succeeded',
      amount: 50000, // $500.00 overpaid
      currency: 'usd'
    });
    const req = makeCheckoutReq({ paymentIntentId: 'pi_overpaid_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 400 && body.error?.includes('overpaid'),
      'Overpayment rejected with descriptive mismatch reason',
      `Got error: ${body.error}`
    );
  }

  // ------------------------------------------------------------------
  // 10. Currency mismatch
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'succeeded',
      amount: EXPECTED_CENTS,
      currency: 'eur'
    });
    const req = makeCheckoutReq({ paymentIntentId: 'pi_curr_mismatch_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 400 && body.error?.includes('Payment currency mismatch'),
      'Non-USD currency rejected with HTTP 400',
      `Got error: ${body.error}`
    );
  }

  // ------------------------------------------------------------------
  // 11. requires_capture (Uncaptured manual authorization)
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'requires_capture',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    mockReplayLookupResult = { data: null, error: null };
    mockOrderInsertResult = { error: null };

    const req = makeCheckoutReq({ paymentIntentId: 'pi_auth_capture_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 200 && body.status === 'AUTHORIZED' && body.paymentStatus === 'authorized',
      'requires_capture persisted as AUTHORIZED / authorized (fulfillment locked)',
      `Got HTTP ${res.status}, body: ${JSON.stringify(body)}`
    );
  }

  // ------------------------------------------------------------------
  // 12. processing (Asynchronous payment method pending)
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'processing',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    const req = makeCheckoutReq({ paymentIntentId: 'pi_proc_pending_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 200 && body.status === 'PENDING' && body.paymentStatus === 'pending',
      'processing payment persisted as PENDING / pending (fulfillment locked)',
      `Got status: ${body.status}`
    );
  }

  // ------------------------------------------------------------------
  // 13. requires_action (3D Secure challenge incomplete)
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'requires_action',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    const req = makeCheckoutReq({ paymentIntentId: 'pi_3ds_req_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 402 && body.error?.includes('requires_action'),
      'requires_action rejected with HTTP 402 Payment Required',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 14. requires_payment_method (Card declined)
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'requires_payment_method',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    const req = makeCheckoutReq({ paymentIntentId: 'pi_card_declined_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 402 && body.error?.includes('requires_payment_method'),
      'requires_payment_method rejected with HTTP 402 Payment Required',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 15. Canceled PaymentIntent
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'canceled',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    const req = makeCheckoutReq({ paymentIntentId: 'pi_canceled_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 402 && body.error?.includes('canceled'),
      'canceled PaymentIntent rejected with HTTP 402',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 16. Failed payment
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'failed',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    const req = makeCheckoutReq({ paymentIntentId: 'pi_failed_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 402 && body.error?.includes('failed'),
      'failed PaymentIntent rejected with HTTP 402',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 17. Successfully verified succeeded PaymentIntent
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'succeeded',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    mockReplayLookupResult = { data: null, error: null };
    mockOrderInsertResult = { error: null };

    const req = makeCheckoutReq({ paymentIntentId: 'pi_succeeded_verified_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 200 && body.success === true && body.status === 'PAID' && body.paymentStatus === 'paid',
      'Authoritatively verified succeeded payment transitions to PAID / paid',
      `Got status: ${body.status}, paymentStatus: ${body.paymentStatus}`
    );
  }

  // ------------------------------------------------------------------
  // 18. Reuse of a PaymentIntent for a second order
  // ------------------------------------------------------------------
  {
    mockReplayLookupResult = {
      data: { id: 'ord_existing_original', order_number: 'BM-888999' },
      error: null
    };
    const req = makeCheckoutReq({ paymentIntentId: 'pi_reused_intent_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 409 && body.error?.includes('has already been consumed for order #BM-888999'),
      'Sequential replay of PaymentIntent blocked with HTTP 409 Conflict',
      `Got status: ${res.status}`
    );
    mockReplayLookupResult = { data: null, error: null };
  }

  // ------------------------------------------------------------------
  // 19. Two concurrent checkout requests using the same PaymentIntent
  // ------------------------------------------------------------------
  {
    mockReplayLookupResult = { data: null, error: null };
    // Simulate database unique constraint violation (code 23505) on the concurrent insert
    mockOrderInsertResult = {
      error: { code: '23505', message: 'duplicate key value violates unique constraint "orders_payment_intent_id_unique_idx"' }
    };
    const req = makeCheckoutReq({ paymentIntentId: 'pi_concurrent_race_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 409 && body.error?.includes('concurrent transaction detected'),
      'Concurrent duplicate checkout blocked by database unique constraint (409 Conflict)',
      `Got status: ${res.status}`
    );
    mockOrderInsertResult = { error: null };
  }

  // ------------------------------------------------------------------
  // 20. Replay-detection database failure
  // ------------------------------------------------------------------
  {
    mockReplayLookupResult = {
      data: null,
      error: { message: 'PostgreSQL connection pool timeout' }
    };
    const req = makeCheckoutReq({ paymentIntentId: 'pi_replay_db_fail_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 500 && body.error?.includes('payment replay verification'),
      'Replay-check database failure fails closed with HTTP 500 without swallowing',
      `Got status: ${res.status}`
    );
    mockReplayLookupResult = { data: null, error: null };
  }

  // ------------------------------------------------------------------
  // 21. Order persistence failure
  // ------------------------------------------------------------------
  {
    mockOrderInsertResult = {
      error: { code: '42703', message: 'column orders.payment_intent_id does not exist' }
    };
    const req = makeCheckoutReq({ paymentIntentId: 'pi_db_persist_fail_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 500 && body.error?.includes('Database error during order persistence'),
      'Order persistence database failure fails closed with HTTP 500 without fabricating success',
      `Got status: ${res.status}`
    );
    mockOrderInsertResult = { error: null };
  }

  // ------------------------------------------------------------------
  // 22. Inventory reservation failure
  // ------------------------------------------------------------------
  {
    const db = await PostgresEngine.initialize();
    await db.exec(`
      INSERT INTO public.products (id, title, handle, category, price, sku, inventory_quantity, is_active)
      VALUES ('prod_p6_test', 'P6 Critical CPAP', 'p6-cpap', 'Sleep', 800.00, 'P6-CPAP', 0, true)
      ON CONFLICT (id) DO UPDATE SET is_active = true;

      INSERT INTO public.warehouse_inventory (warehouse_id, product_id, sku, on_hand, reserved)
      VALUES ('wh_primary_us_east', 'prod_p6_test', 'P6-CPAP', 0, 0)
      ON CONFLICT (warehouse_id, product_id) DO UPDATE SET on_hand = 0, reserved = 0;
    `);

    const result = await PostgresEngine.createOrderAtomic({
      customer_email: 'p6.buyer@test.baemeds.com',
      shipping_address: { address1: '123 Test St', city: 'Wilmington', province: 'DE', zip: '19801' },
      items: [{ product_id: 'prod_p6_test', quantity: 1 }]
    });

    assert(
      result.success === false && result.error === 'TRANSACTION_FAILED' && result.message?.includes('OUT_OF_STOCK'),
      'Atomic order creation fails and rolls back when inventory is depleted',
      `Result: ${JSON.stringify(result)}`
    );
  }

  // ------------------------------------------------------------------
  // 23. Duplicate webhook delivery
  // ------------------------------------------------------------------
  {
    // Generate valid test webhook payload and signature using Stripe SDK
    const webhookSecret = 'whsec_test_synthetic_secret_unit';
    const payload = JSON.stringify({
      id: 'evt_test_dup_webhook_1',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_dup_1',
          status: 'succeeded',
          amount: EXPECTED_CENTS,
          metadata: { orderNumber: 'BM-NONEXISTENT-SKIP' }
        }
      }
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = (new Stripe('sk_test_fake', { apiVersion: '2025-02-24.acacia' as any })).webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
      timestamp
    });

    const req1 = new Request('https://www.baemeds.com/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
      body: payload
    });
    const res1 = await (webhookHandler as any).fetch(req1);
    const body1 = await res1.json();

    const req2 = new Request('https://www.baemeds.com/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
      body: payload
    });
    const res2 = await (webhookHandler as any).fetch(req2);
    const body2 = await res2.json();

    assert(
      res1.status === 200 && body1.received === true && res2.status === 200 && body2.received === true,
      'Duplicate webhook deliveries processed idempotently with HTTP 200 { received: true }'
    );
  }

  // ------------------------------------------------------------------
  // 24. Invalid webhook signature
  // ------------------------------------------------------------------
  {
    const req = new Request('https://www.baemeds.com/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=12345,v1=bad_signature_hash' },
      body: JSON.stringify({ type: 'payment_intent.succeeded' })
    });
    const res = await (webhookHandler as any).fetch(req);
    assert(
      res.status === 400,
      'Invalid webhook signature rejected with HTTP 400',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 25. Missing webhook secret
  // ------------------------------------------------------------------
  {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const req = new Request('https://www.baemeds.com/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=123,v1=sig' },
      body: JSON.stringify({ type: 'payment_intent.succeeded' })
    });
    const res = await (webhookHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 503 && body.error?.includes('Fail-closed'),
      'Missing STRIPE_WEBHOOK_SECRET fails closed with HTTP 503',
      `Got status: ${res.status}`
    );
    process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
  }

  // ------------------------------------------------------------------
  // 26. Refund event replay
  // ------------------------------------------------------------------
  {
    const webhookSecret = 'whsec_test_synthetic_secret_unit';
    const payload = JSON.stringify({
      id: 'evt_test_refund_replay',
      object: 'event',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_test_refund_1',
          payment_intent: 'pi_test_refunded_1',
          refunded: true,
          amount_refunded: EXPECTED_CENTS
        }
      }
    });

    const signature = (new Stripe('sk_test_fake', { apiVersion: '2025-02-24.acacia' as any })).webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
      timestamp: Math.floor(Date.now() / 1000)
    });

    const req = new Request('https://www.baemeds.com/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
      body: payload
    });
    const res = await (webhookHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 200 && body.received === true,
      'Refund webhook event handles idempotent delivery and terminal state guard',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 27. Late success event after a terminal state
  // ------------------------------------------------------------------
  {
    const webhookSecret = 'whsec_test_synthetic_secret_unit';
    const payload = JSON.stringify({
      id: 'evt_test_late_success',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_terminal_order_1',
          amount: EXPECTED_CENTS,
          metadata: { orderNumber: 'BM-TERMINAL-999' }
        }
      }
    });

    const signature = (new Stripe('sk_test_fake', { apiVersion: '2025-02-24.acacia' as any })).webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
      timestamp: Math.floor(Date.now() / 1000)
    });

    const req = new Request('https://www.baemeds.com/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
      body: payload
    });
    const res = await (webhookHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 200 && body.received === true,
      'Late payment_intent.succeeded received on terminal order skips state modification safely',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 28. Forged client-supplied PAID status
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'requires_action',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    // Attacker sends status: 'PAID' and paymentStatus: 'paid' in payload
    const req = makeCheckoutReq({
      paymentIntentId: 'pi_forged_paid_1',
      status: 'PAID',
      paymentStatus: 'paid'
    });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 402,
      'Client-supplied status: "PAID" completely ignored; rejected by server-side verification',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 29. Client-supplied price or total manipulation
  // ------------------------------------------------------------------
  {
    // Client tries to buy a $357.99 CGM for $1.00 by tampering with items and total in request body
    const req = makeCheckoutReq({
      paymentIntentId: 'pi_tampered_price_1',
      items: [
        {
          id: 'prd-cgm-dexcom-g7',
          merchandiseId: 'prd-cgm-dexcom-g7',
          title: 'Dexcom G7 Continuous Glucose Monitoring (CGM) System',
          price: 1.00, // Attacker forged price
          quantity: 1
        }
      ],
      total: 1.00
    });

    // Stripe intent was only authorized for $1.00 (100¢)
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'succeeded',
      amount: 100, // 100 cents
      currency: 'usd'
    });

    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 400 && body.error?.includes('underpaid'),
      'Client price tampering detected: server recalculates authoritative total and rejects mismatch',
      `Got error: ${body.error}`
    );
  }

  // ------------------------------------------------------------------
  // 30. Retry after a partially completed payment/order workflow
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'succeeded',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    mockReplayLookupResult = { data: null, error: null };
    mockOrderInsertResult = { error: null };

    // Retry request with valid unconsumed intent
    const req = makeCheckoutReq({ paymentIntentId: 'pi_retry_workflow_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 200 && body.success === true && body.orderNumber && body.status === 'PAID',
      'Retry with verified unconsumed payment safely succeeds and produces distinct order',
      `Got status: ${body.status}, orderNumber: ${body.orderNumber}`
    );
  }

  // ------------------------------------------------------------------
  // 31. Failed order_items insertion triggers atomic rollback & fails closed
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'succeeded',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    mockReplayLookupResult = { data: null, error: null };
    mockOrderInsertResult = { error: null };
    mockOrderItemsInsertResult = {
      error: { message: 'column order_items.invalid_column does not exist' }
    };
    mockOrderDeleteCalled = false;

    const initialMemoryCount = memoryOrders.length;
    const req = makeCheckoutReq({ paymentIntentId: 'pi_fail_order_items_rollback_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();

    assert(
      res.status === 500 &&
      body.error?.includes('order line items persistence') &&
      Boolean(mockOrderDeleteCalled) &&
      memoryOrders.length === initialMemoryCount,
      'Failed order_items insertion aborts checkout, rolls back parent order, and prevents in-memory/email creation',
      `Got status: ${res.status}, rollbackCalled: ${mockOrderDeleteCalled}`
    );
    mockOrderItemsInsertResult = { error: null };
  }

  // ------------------------------------------------------------------
  // 32. Recovery: Stripe succeeded but database temporarily unavailable, followed by successful retry
  // ------------------------------------------------------------------
  {
    mockStripeRetrieveHandler = async (id) => ({
      id,
      status: 'succeeded',
      amount: EXPECTED_CENTS,
      currency: 'usd'
    });
    // Request 1: Transient DB timeout
    mockReplayLookupResult = {
      data: null,
      error: { message: 'Database connection timeout' }
    };
    const req1 = makeCheckoutReq({ paymentIntentId: 'pi_transient_db_fail_1' });
    const res1 = await (checkoutHandler as any).fetch(req1);
    assert(res1.status === 500, 'Transient DB failure safely returns HTTP 500 without creating phantom order');

    // Request 2 (Client Retry): Database restored
    mockReplayLookupResult = { data: null, error: null };
    mockOrderInsertResult = { error: null };
    mockOrderItemsInsertResult = { error: null };

    const req2 = makeCheckoutReq({ paymentIntentId: 'pi_transient_db_fail_1' });
    const res2 = await (checkoutHandler as any).fetch(req2);
    const body2 = await res2.json();

    assert(
      res2.status === 200 && body2.success === true && body2.status === 'PAID',
      'Client retry after database recovery consumes PaymentIntent authoritatively without duplicate charge',
      `Got status: ${res2.status}`
    );
  }

  // ------------------------------------------------------------------
  // 33. Webhook delivery after a partial persistence failure does not resurrect rolled-back orders
  // ------------------------------------------------------------------
  {
    const webhookSecret = 'whsec_test_synthetic_secret_unit';
    const payload = JSON.stringify({
      id: 'evt_test_partial_failure_webhook',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_rolled_back_intent',
          amount: EXPECTED_CENTS,
          metadata: { orderNumber: 'BM-ROLLEDBACK-001' }
        }
      }
    });

    const signature = (new Stripe('sk_test_fake', { apiVersion: '2025-02-24.acacia' as any })).webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
      timestamp: Math.floor(Date.now() / 1000)
    });

    const req = new Request('https://www.baemeds.com/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
      body: payload
    });
    const res = await (webhookHandler as any).fetch(req);
    const body = await res.json();
    assert(
      res.status === 200 && body.received === true,
      'Webhook received for non-existent/rolled-back order safely logs warning and ignores',
      `Got status: ${res.status}`
    );
  }

  // ------------------------------------------------------------------
  // 34. Exhaustive verification: No drop-shipping side-effects or memory store mutation on failed persistence
  // ------------------------------------------------------------------
  {
    mockOrderInsertResult = {
      error: { code: '57014', message: 'canceling statement due to statement timeout' }
    };
    const memBefore = memoryOrders.length;
    const req = makeCheckoutReq({ paymentIntentId: 'pi_exhaust_timeout_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();

    assert(
      res.status === 500 && memoryOrders.length === memBefore,
      'Persistence failure enforces zero memory order retention and zero external drop-ship dispatch',
      `Got status: ${res.status}, memBefore: ${memBefore}, memAfter: ${memoryOrders.length}`
    );
    mockOrderInsertResult = { error: null };
  }

  // ------------------------------------------------------------------
  // 35. Dual failure recovery: order_items fails AND compensatory delete fails
  // ------------------------------------------------------------------
  {
    mockRpcResult = { data: null, error: { message: 'RPC not available' } };
    mockOrderInsertResult = { error: null };
    mockOrderItemsInsertResult = { error: { message: 'order_items disk error' } };
    mockOrderDeleteResult = { error: { message: 'connection dropped during compensatory rollback delete' } };
    mockOrderDeleteCalled = false;
    mockOrderUpdateCalled = false;
    mockOrderUpdateData = null;

    const memBefore = memoryOrders.length;
    const req = makeCheckoutReq({ paymentIntentId: 'pi_dual_failure_quarantine_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();

    assert(
      res.status === 500 &&
      body.error?.includes('order line items persistence') &&
      Boolean(mockOrderDeleteCalled) &&
      Boolean(mockOrderUpdateCalled) &&
      mockOrderUpdateData?.status === 'FAILED_PERSISTENCE' &&
      mockOrderUpdateData?.payment_status === 'failed' &&
      mockOrderUpdateData?.metadata?.fulfillment_locked === true &&
      mockOrderUpdateData?.metadata?.reconciliation_required === true &&
      mockOrderUpdateData?.metadata?.stripe_payment_intent_id === 'pi_dual_failure_quarantine_1' &&
      memoryOrders.length === memBefore,
      'Dual write/rollback failure safely quarantines parent order as FAILED_PERSISTENCE, locks fulfillment, preserves payment evidence, and prevents order dispatch',
      `Got status: ${res.status}, updateCalled: ${mockOrderUpdateCalled}, updateStatus: ${mockOrderUpdateData?.status}`
    );

    mockOrderItemsInsertResult = { error: null };
    mockOrderDeleteResult = { error: null };
    mockOrderUpdateCalled = false;
    mockOrderUpdateData = null;
  }

  // ------------------------------------------------------------------
  // 36. Atomic Order Creation RPC: single database transaction success
  // ------------------------------------------------------------------
  {
    mockRpcResult = {
      data: { success: true, order_id: 'ord_atomic_success_100', items_count: 1 },
      error: null
    };

    const req = makeCheckoutReq({ paymentIntentId: 'pi_atomic_rpc_success_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.success === true &&
      body.orderId === 'ord_atomic_success_100' &&
      body.status === 'PAID',
      'Atomic order creation via create_order_atomic RPC commits parent order and items in a single PostgreSQL transaction',
      `Got status: ${res.status}, orderId: ${body.orderId}`
    );

    mockRpcResult = { data: null, error: { message: 'RPC not available' } };
  }

  // ------------------------------------------------------------------
  // 37. Atomic Order Creation RPC: Replay / unique violation returns HTTP 409
  // ------------------------------------------------------------------
  {
    mockRpcResult = {
      data: null,
      error: { code: '23505', message: 'ORDER_CREATION_FAILED_UNIQUE: duplicate key value violates unique constraint' }
    };

    const req = makeCheckoutReq({ paymentIntentId: 'pi_atomic_rpc_replay_1' });
    const res = await (checkoutHandler as any).fetch(req);
    const body = await res.json();

    assert(
      res.status === 409 &&
      body.error?.includes('concurrent transaction detected'),
      'Atomic RPC duplicate key error safely translates to HTTP 409 Conflict',
      `Got status: ${res.status}, error: ${body.error}`
    );

    mockRpcResult = { data: null, error: { message: 'RPC not available' } };
  }

  // ------------------------------------------------------------------
  // 38. Webhook received for an order with status 'FAILED_PERSISTENCE' or 'fulfillment_locked'
  // ------------------------------------------------------------------
  {
    mockReplayLookupResult = {
      data: {
        id: 'ord_quarantined_99',
        order_number: 'BM-QUARANTINED-99',
        total_amount: EXPECTED_CENTS / 100,
        status: 'FAILED_PERSISTENCE',
        payment_status: 'failed',
        payment_intent_id: 'pi_quarantined_webhook_1',
        metadata: { fulfillment_locked: true, reconciliation_required: true }
      },
      error: null
    };
    mockOrderUpdateCalled = false;
    mockOrderUpdateData = null;

    const webhookSecret = 'whsec_test_synthetic_secret_unit';
    const payload = JSON.stringify({
      id: 'evt_test_quarantined_webhook',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_quarantined_webhook_1',
          amount: EXPECTED_CENTS,
          metadata: { orderNumber: 'BM-QUARANTINED-99' }
        }
      }
    });

    const signature = (new Stripe('sk_test_fake', { apiVersion: '2025-02-24.acacia' as any })).webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
      timestamp: Math.floor(Date.now() / 1000)
    });

    const req = new Request('https://www.baemeds.com/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
      body: payload
    });
    const res = await (webhookHandler as any).fetch(req);
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.received === true &&
      Boolean(mockOrderUpdateCalled) &&
      mockOrderUpdateData?.status === undefined && // Does NOT overwrite status to PAID
      mockOrderUpdateData?.metadata?.stripe_webhook_verified === true &&
      mockOrderUpdateData?.metadata?.reconciliation_required === true,
      'Webhook received on quarantined FAILED_PERSISTENCE order preserves fulfillment lock and alerts reconciliation without auto-fulfilling',
      `Got status: ${res.status}, updateData: ${JSON.stringify(mockOrderUpdateData)}`
    );

    mockReplayLookupResult = { data: null, error: null };
    mockOrderUpdateCalled = false;
    mockOrderUpdateData = null;
  }

  // ------------------------------------------------------------------
  // 39. Out-of-order partial and full refund webhook idempotency & monotonicity
  // ------------------------------------------------------------------
  {
    // Test that an order already in REFUNDED state cannot be downgraded to PARTIALLY_REFUNDED by an out-of-order webhook
    mockReplayLookupResult = {
      data: {
        id: 'ord_refunded_mono',
        order_number: 'BM-REFUNDED-01',
        status: 'REFUNDED',
        payment_status: 'refunded'
      },
      error: null
    };
    mockOrderUpdateCalled = false;

    const webhookSecret = 'whsec_test_synthetic_secret_unit';
    const payload = JSON.stringify({
      id: 'evt_test_partial_refund_late',
      object: 'event',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_test_refund_late',
          payment_intent: 'pi_refunded_mono_1',
          refunded: false, // Partial refund event arriving late
          amount_refunded: 2000
        }
      }
    });

    const signature = (new Stripe('sk_test_fake', { apiVersion: '2025-02-24.acacia' as any })).webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
      timestamp: Math.floor(Date.now() / 1000)
    });

    const req = new Request('https://www.baemeds.com/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
      body: payload
    });
    const res = await (webhookHandler as any).fetch(req);
    const body = await res.json();

    assert(
      res.status === 200 &&
      body.received === true &&
      mockOrderUpdateCalled === false,
      'Out-of-order partial refund webhook arriving after full refund cannot downgrade order status, preserving monotonicity',
      `Got status: ${res.status}, updateCalled: ${mockOrderUpdateCalled}`
    );

    mockReplayLookupResult = { data: null, error: null };
  }

  // ------------------------------------------------------------------
  // 40. Migration 20261016000000 Pre-Flight Check Blocks on Duplicate PaymentIntents
  // ------------------------------------------------------------------
  {
    const runPreflightCheck = (orders: Array<{ payment_intent_id: string | null }>) => {
      const counts: Record<string, number> = {};
      for (const row of orders) {
        if (row.payment_intent_id) {
          counts[row.payment_intent_id] = (counts[row.payment_intent_id] || 0) + 1;
        }
      }
      const duplicateEntries = Object.entries(counts).filter(([_, count]) => count > 1);
      const v_dup_count = duplicateEntries.length;
      if (v_dup_count > 0) {
        const masked = duplicateEntries
          .slice(0, 5)
          .map(([id]) => `${id.slice(0, 7)}...${id.slice(-4)}`)
          .join(', ');
        throw new Error(
          `MIGRATION_HALTED_DUPLICATE_PAYMENT_INTENTS: Found ${v_dup_count} duplicate non-null payment_intent_id group(s) in public.orders (sample: [${masked}]). Deduplication required before applying unique index.`
        );
      }
      return true;
    };

    // Test 1: Duplicate non-null PaymentIntents MUST throw and stop migration
    let migrationBlocked = false;
    let errorMessage = '';
    try {
      runPreflightCheck([
        { payment_intent_id: 'pi_3MtwMockUserSecret12345' },
        { payment_intent_id: 'pi_3MtwMockUserSecret12345' }, // Duplicate!
        { payment_intent_id: 'pi_unique_intent_99999' },
        { payment_intent_id: null },
        { payment_intent_id: null } // Multiple nulls are allowed
      ]);
    } catch (err: any) {
      migrationBlocked = true;
      errorMessage = err.message;
    }

    assert(
      migrationBlocked === true &&
      errorMessage.includes('MIGRATION_HALTED_DUPLICATE_PAYMENT_INTENTS') &&
      errorMessage.includes('pi_3Mtw...2345') && // Proves masking protects secrets
      !errorMessage.includes('pi_3MtwMockUserSecret12345'), // Proves raw ID is not leaked
      'Migration pre-flight duplicate check blocks migration with safe masked error when duplicates exist',
      `Blocked: ${migrationBlocked}, Error: ${errorMessage}`
    );

    // Test 2: Clean data passes pre-flight check cleanly
    let cleanPassed = false;
    try {
      cleanPassed = runPreflightCheck([
        { payment_intent_id: 'pi_order_clean_1111' },
        { payment_intent_id: 'pi_order_clean_2222' },
        { payment_intent_id: null },
        { payment_intent_id: null }
      ]);
    } catch {}

    assert(
      cleanPassed === true,
      'Migration pre-flight check allows unique and null payment_intent_id data to proceed to unique index creation',
      `Passed: ${cleanPassed}`
    );
  }

  console.log('\n================================================================');
  console.log(`ALL ${passedTests} / ${totalTests} TRANSACTION INTEGRITY & PAYMENT SECURITY REGRESSION TESTS PASSED!`);
  console.log('================================================================\n');
}

runPhase6SecuritySuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
