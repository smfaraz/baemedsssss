/**
 * BaeMeds Enterprise /api/v1 API Contract & Security Integration Test Suite
 * Mandated by Section 9: API Contract & Section 56: Error Handling.
 */

import { V1Gateway } from '../server/api/v1/v1Gateway.js';
import { RateLimiter } from '../server/middleware/rateLimiter.js';

process.env.ALLOW_DEV_IMPERSONATION = 'true';

async function runContractTests() {
  console.log('======================================================');
  console.log('BAEMEDS ENTERPRISE /api/v1 API CONTRACT & SECURITY SUITE');
  console.log('======================================================\n');

  let passed = 0;

  // TEST 1: Missing Token -> 401 Structured Error
  console.log('1. Testing Unauthenticated Access to /api/v1/orders...');
  const req1 = new Request('https://baemeds.com/api/v1/orders', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const res1 = await V1Gateway.dispatch(req1);
  const json1 = await res1.json();

  if (
    res1.status === 401 &&
    json1.error?.code === 'AUTHENTICATION_REQUIRED' &&
    res1.headers.get('X-Request-Id') &&
    json1.error.requestId
  ) {
    console.log('  ✔ Correctly returned 401 structured error with X-Request-Id');
    passed++;
  } else {
    throw new Error(`Failed Test 1: ${JSON.stringify(json1)}`);
  }

  // TEST 2: Zod Schema Validation Failure -> 400 Structured Error with field details
  console.log('2. Testing Zod Validation Failure on /api/v1/auth/login (bad email format)...');
  const req2 = new Request('https://baemeds.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: '123' }), // Invalid email & password < 6 chars
  });
  const res2 = await V1Gateway.dispatch(req2);
  const json2 = await res2.json();

  if (
    res2.status === 400 &&
    json2.error?.code === 'VALIDATION_ERROR' &&
    Array.isArray(json2.error.details) &&
    json2.error.details.length >= 2
  ) {
    console.log('  ✔ Correctly returned 400 VALIDATION_ERROR with structured issue details');
    passed++;
  } else {
    throw new Error(`Failed Test 2: ${JSON.stringify(json2)}`);
  }

  // TEST 3: Rate Limiting Enforcement on Login -> 429
  console.log('3. Testing Rate Limiting on /api/v1/auth/login...');
  RateLimiter.reset();
  const loginBody = JSON.stringify({ email: 'rate_test@baemeds.com', password: 'password123' });
  const makeReq = () =>
    new Request('https://baemeds.com/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Real-IP': '10.0.0.99' },
      body: loginBody,
    });

  let throttledResponse: Response | null = null;
  for (let i = 0; i < 7; i++) {
    const res = await V1Gateway.dispatch(makeReq());
    if (res.status === 429) {
      throttledResponse = res;
      break;
    }
  }

  if (throttledResponse && throttledResponse.headers.get('Retry-After')) {
    const json3 = await throttledResponse.json();
    if (json3.error?.code === 'RATE_LIMITED') {
      console.log('  ✔ Rate limit triggered (429) with Retry-After header');
      passed++;
    } else {
      throw new Error(`Expected RATE_LIMITED code, got: ${JSON.stringify(json3)}`);
    }
  } else {
    throw new Error('Rate limiter did not throttle requests after limit exceeded');
  }

  // TEST 4: RBAC Authorization -> Support Agent Forbidden from updating tracking (orders:manage required)
  console.log('4. Testing Role Authorization (Support agent attempting order status update)...');
  const supportToken = `bm_admin_${Buffer.from('support@baemeds.com').toString('base64')}_token`;
  const req4 = new Request('https://baemeds.com/api/v1/orders/ord_1001/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supportToken}`,
    },
    body: JSON.stringify({ status: 'CANCELLED', reason: 'Customer requested' }),
  });
  const res4 = await V1Gateway.dispatch(req4);
  const json4 = await res4.json();

  // Support role DOES have orders:manage in matrix, so let's test a role that DOES NOT have orders:manage: compliance_officer
  const complianceToken = `bm_admin_${Buffer.from('compliance@baemeds.com').toString('base64')}_token`;
  const reqCompliance = new Request('https://baemeds.com/api/v1/orders/ord_1001/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${complianceToken}`,
    },
    body: JSON.stringify({ status: 'CANCELLED', reason: 'Audit cancellation' }),
  });
  const resComp = await V1Gateway.dispatch(reqCompliance);
  const jsonComp = await resComp.json();

  if (resComp.status === 403 && jsonComp.error?.code === 'INSUFFICIENT_PERMISSIONS') {
    console.log('  ✔ Compliance officer correctly forbidden (403) from order mutation');
    passed++;
  } else {
    throw new Error(`Failed Test 4: ${JSON.stringify(jsonComp)}`);
  }

  // TEST 5: PHI Minimum-Necessary Isolation on Clinical Router
  console.log('5. Testing PHI Minimum-Necessary Isolation on /api/v1/prescriptions...');
  const fulfillmentToken = `bm_admin_${Buffer.from('fulfillment@baemeds.com').toString('base64')}_token`;
  const req5 = new Request('https://baemeds.com/api/v1/prescriptions', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${fulfillmentToken}`,
    },
  });
  const res5 = await V1Gateway.dispatch(req5);
  const json5 = await res5.json();

  if (res5.status === 403 && json5.error?.code === 'PHI_ACCESS_RESTRICTED') {
    console.log('  ✔ Fulfillment specialist blocked (403) from accessing clinical prescriptions');
    passed++;
  } else {
    throw new Error(`Failed Test 5: ${JSON.stringify(json5)}`);
  }

  // TEST 6: Red-Line Error Masking Test
  console.log('6. Testing Red-Line Error Masking (zero system internals leaked)...');
  const errorJsonStr = JSON.stringify(json5);
  if (
    !errorJsonStr.includes('postgres') &&
    !errorJsonStr.includes('SELECT') &&
    !errorJsonStr.includes('stack') &&
    !errorJsonStr.includes('SERVICE_KEY')
  ) {
    console.log('  ✔ Red-line masking verified: zero database internals or secrets leaked');
    passed++;
  } else {
    throw new Error('VULNERABILITY: Internal details leaked in error response');
  }

  console.log(`\n✔ ALL ${passed}/6 API CONTRACT & SECURITY TESTS PASSED SUCCESSFULLY.\n`);
}

runContractTests().catch((e) => {
  console.error('\n❌ API Contract Test Failed:\n', e);
  process.exit(1);
});
