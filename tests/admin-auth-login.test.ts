// Polyfill WebSocket for Supabase in Node 20
if (!globalThis.WebSocket) {
  (globalThis as any).WebSocket = class MockWebSocket {};
}

import { AdminService } from '../server/adminService';
import adminHandler from '../api/admin';
import authHandler from '../api/auth';

async function runTests() {
  console.log('======================================================');
  console.log('BAEMEDS AUTHENTICATION & AUTHORIZATION TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (!condition) {
      console.error(`❌ FAILED: ${msg}`);
      failed++;
      throw new Error(msg);
    } else {
      console.log(`✔ ${msg}`);
      passed++;
    }
  }

  // 1. Direct AdminService Credential Verification
  console.log('--- 1. Testing AdminService Credential Authentication ---');

  // Valid Super Admin
  const adminAuth = await AdminService.authenticateStaff('admin@baemeds.com', 'admin123');
  assert(adminAuth.user.role === 'super_admin', 'Super admin login returns role super_admin');
  assert(!!adminAuth.token, 'Super admin login returns session token');
  assert(adminAuth.user.email === 'admin@baemeds.com', 'Super admin email matches');

  // Valid Clinical Specialist
  const clinicalAuth = await AdminService.authenticateStaff('clinical.lead@baemeds.com', 'clinical123');
  assert(clinicalAuth.user.role === 'clinical_specialist', 'Clinical specialist returns role clinical_specialist');

  // Invalid password
  let badPassFailed = false;
  try {
    await AdminService.authenticateStaff('admin@baemeds.com', 'wrongpassword');
  } catch (err: any) {
    badPassFailed = true;
    assert(err.message.includes('Invalid email or password'), 'Invalid password throws credential error');
  }
  assert(badPassFailed, 'Invalid password rejected');

  // Non-existent staff
  let unknownStaffFailed = false;
  try {
    await AdminService.authenticateStaff('intruder@outside.com', 'admin123');
  } catch (err: any) {
    unknownStaffFailed = true;
    assert(err.message.includes('Invalid email or password'), 'Unknown user rejected');
  }
  assert(unknownStaffFailed, 'Unknown staff rejected');

  // 2. HTTP Admin Login API Endpoint
  console.log('\n--- 2. Testing HTTP /api/admin/login Endpoint ---');

  // Missing credentials -> 400
  const reqMissing = new Request('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '' }),
  });
  const resMissing = await adminHandler(reqMissing);
  assert(resMissing.status === 400, 'Empty email/password returns HTTP 400');

  // Wrong password -> 401
  const reqBadAuth = new Request('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@baemeds.com', password: 'incorrect' }),
  });
  const resBadAuth = await adminHandler(reqBadAuth);
  assert(resBadAuth.status === 401, 'Bad credentials return HTTP 401');

  // Correct credentials -> 200 + token
  const reqGoodAuth = new Request('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'compliance@baemeds.com', password: 'compliance123' }),
  });
  const resGoodAuth = await adminHandler(reqGoodAuth);
  assert(resGoodAuth.status === 200, 'Valid staff credentials return HTTP 200');
  const loginData = await resGoodAuth.json();
  assert(loginData.user.role === 'compliance_officer', 'Returned user role is compliance_officer');
  assert(!!loginData.token, 'Session token provided upon login');

  // Verify session endpoint with issued token
  const reqSession = new Request('http://localhost:3000/api/admin/session', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${loginData.token}`,
    },
  });
  const resSession = await adminHandler(reqSession);
  assert(resSession.status === 200, 'GET /api/admin/session returns 200 with valid token');
  const sessionData = await resSession.json();
  assert(sessionData.user.email === 'compliance@baemeds.com', 'Session actor resolved correctly');

  // Verify RBAC protection: Compliance Officer cannot access discount creation (financial privilege)
  const reqDiscounts = new Request('http://localhost:3000/api/admin/discounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({ code: 'HACK50', discountPercent: 50 }),
  });
  const resDiscounts = await adminHandler(reqDiscounts);
  assert(resDiscounts.status === 403, 'Compliance Officer denied from creating discounts (RBAC 403)');

  // 3. Customer Auth Login & Registration (No One-Click Bypass)
  console.log('\n--- 3. Testing Customer Auth Isolation (No Auto-Creation Bypass) ---');

  const randomEmail = `test_patient_${Date.now()}@example.com`;

  // Attempt login with non-existent user (previously would auto-create with one-click bypass!)
  const reqCustomerUnknown = new Request('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: randomEmail, password: 'password123' }),
  });
  const resCustomerUnknown = await authHandler(reqCustomerUnknown);
  assert(resCustomerUnknown.status === 401, 'Unregistered customer login is rejected with HTTP 401 (auto-creation removed)');

  // Register the customer account
  const reqCustomerReg = new Request('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      email: randomEmail,
      password: 'password123',
      firstName: 'Alice',
      lastName: 'Smith',
    }),
  });
  const resCustomerReg = await authHandler(reqCustomerReg);
  assert(resCustomerReg.status === 201, 'Customer registration succeeds');
  const getCookies = (resCustomerReg.headers as any).getSetCookie ? (resCustomerReg.headers as any).getSetCookie().join('; ') : (resCustomerReg.headers.get('set-cookie') || '');
  const tokenMatch = getCookies.match(/__Host-baemeds_session=([^;]+)/);
  const customerToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : '';
  assert(!!customerToken, 'Customer session token issued in cookie upon registration');

  // Successful customer login with registered credentials
  const reqCustomerLogin = new Request('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: randomEmail, password: 'password123' }),
  });
  const resCustomerLogin = await authHandler(reqCustomerLogin);
  assert(resCustomerLogin.status === 200, 'Registered customer login succeeds with HTTP 200');

  // Customer attempts to access admin dashboard -> Denied 403
  const reqAdminIntrusion = new Request('http://localhost:3000/api/admin/dashboard', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${customerToken}`,
    },
  });
  const resAdminIntrusion = await adminHandler(reqAdminIntrusion);
  assert(resAdminIntrusion.status === 403, 'Customer account denied access to admin portal (HTTP 403)');

  console.log(`\n======================================================`);
  console.log(`ALL ${passed} AUTHENTICATION & AUTHORIZATION CHECKS PASSED!`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error('Fatal error running auth test suite:', err);
  process.exit(1);
});
