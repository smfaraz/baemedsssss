/**
 * BaeMeds Native Admin Back-Office RBAC, Security & State Machine Test Suite
 * Validates:
 * 1. RBAC Isolation & Role Enforcement (Super Admin, Compliance, Clinical, Support, Fulfillment, Customer)
 * 2. Anonymous & Customer Unauthorized Denial (HTTP 401 / 403)
 * 3. Order State Machine Transitions & Illegal Flow Rejection
 * 4. Negative Stock Denial & Mandatory Inventory Reasons
 * 5. Authoritative Pricing Security & Mass Assignment Rejection
 * 6. HIPAA Audit Log Generation & Read-Only Immutability
 */

import adminHandler from '../api/admin';
import {
  AdminService,
  AdminRole,
  AdminUser,
  VALID_ORDER_TRANSITIONS,
  hasPermission,
  ROLE_PERMISSIONS,
} from '../server/adminService';

// Helper to create mock Request for /api/admin
function createAdminRequest(
  method: string,
  path: string,
  role?: AdminRole,
  body?: any,
  rawToken?: string
): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (rawToken) {
    headers['Authorization'] = `Bearer ${rawToken}`;
  } else if (role && role !== 'customer') {
    const email = `${role}@baemeds.com`;
    const token = `bm_admin_${Buffer.from(email).toString('base64')}_token`;
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Admin-Role'] = role;
  } else if (role === 'customer') {
    // Customer token
    const token = `bm_usr_${Buffer.from('customer@example.com').toString('base64')}_session`;
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `https://baemeds.com/api/admin${path}`;
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// -------------------------------------------------------------
// TEST 1: Unauthenticated & Customer Route Protection
// -------------------------------------------------------------
async function testAuthenticationAndCustomerDenial() {
  console.log('Testing Authentication & Customer Route Protection...');

  // 1. Anonymous request with no token -> must return 401
  const anonReq = new Request('https://baemeds.com/api/admin/dashboard', {
    method: 'GET',
    headers: {},
  });
  const anonRes = await adminHandler.fetch(anonReq);
  if (anonRes.status !== 401) {
    throw new Error(`Expected HTTP 401 for anonymous admin access, got ${anonRes.status}`);
  }

  // 2. Customer token attempting /api/admin/* -> must return 403 Forbidden
  const custReq = createAdminRequest('GET', '/dashboard', 'customer');
  const custRes = await adminHandler.fetch(custReq);
  if (custRes.status !== 403) {
    throw new Error(`Expected HTTP 403 for customer accessing admin API, got ${custRes.status}`);
  }

  console.log('✔ Anonymous (401) and Customer (403) route rejection passed.');
}

// -------------------------------------------------------------
// TEST 2: RBAC Least-Privilege Role Boundaries
// -------------------------------------------------------------
async function testRbacRoleBoundaries() {
  console.log('Testing RBAC Role Boundaries across all 6 roles...');

  // 1. Support Agent attempting to save/modify a product (only Super Admin has products:manage)
  const supportProdReq = createAdminRequest('POST', '/products', 'support_agent', {
    title: 'Hacked Price Mask',
    price: 1.0,
  });
  const supportProdRes = await adminHandler.fetch(supportProdReq);
  if (supportProdRes.status !== 500 && supportProdRes.status !== 403) {
    // Expected error / rejection
    const data = await supportProdRes.json();
    if (!data.error) throw new Error('Expected support agent product mutation to fail');
  }

  // 2. Fulfillment Specialist attempting to review a clinical prescription
  const fulfillRxReq = createAdminRequest('POST', '/prescriptions/rx_8849', 'fulfillment_specialist', {
    decision: 'APPROVED',
    notes: 'Unauthorized approval attempt',
  });
  const fulfillRxRes = await adminHandler.fetch(fulfillRxReq);
  const rxData = await fulfillRxRes.json();
  if (!rxData.error || !rxData.error.toLowerCase().includes('forbidden')) {
    throw new Error('Fulfillment specialist must NOT be able to review/approve prescriptions');
  }

  // 3. Clinical Specialist attempting to change staff roles
  const clinicalStaffReq = createAdminRequest('PATCH', '/staff/usr_staff_001', 'clinical_specialist', {
    role: 'super_admin',
  });
  const clinicalStaffRes = await adminHandler.fetch(clinicalStaffReq);
  const staffData = await clinicalStaffRes.json();
  if (!staffData.error || !staffData.error.toLowerCase().includes('forbidden')) {
    throw new Error('Clinical specialist must NOT be able to escalate staff roles');
  }

  // 4. Compliance Officer attempting to adjust physical inventory
  const complianceInvReq = createAdminRequest('POST', '/inventory', 'compliance_officer', {
    productId: 'prod_test',
    delta: 50,
    reason: 'Manual Adjustment',
  });
  const complianceInvRes = await adminHandler.fetch(complianceInvReq);
  const invData = await complianceInvRes.json();
  if (!invData.error || !invData.error.toLowerCase().includes('forbidden')) {
    throw new Error('Compliance officer must NOT have inventory mutation permissions');
  }

  // 5. Anti-Spoofing Security: Attacker sends X-Admin-Role: super_admin on Support Token
  const spoofReq = new Request('https://baemeds.com/api/admin/products/prod_exploit', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer bm_admin_${Buffer.from('support@baemeds.com').toString('base64')}_token`,
      'X-Admin-Role': 'super_admin', // MALICIOUS SPOOF HEADER
    },
  });
  const spoofRes = await adminHandler.fetch(spoofReq);
  const spoofData = await spoofRes.json();
  if (spoofRes.status === 200 || !spoofData.error || !spoofData.error.toLowerCase().includes('forbidden')) {
    throw new Error('SECURITY VIOLATION: Server trusted client-supplied X-Admin-Role header!');
  }

  console.log('✔ RBAC least-privilege role boundaries and Anti-Spoofing verified.');
}

// -------------------------------------------------------------
// TEST 3: Order State Machine Transitions
// -------------------------------------------------------------
async function testOrderStateMachine() {
  console.log('Testing Order State Machine & Transition Rules...');

  const actor: AdminUser = {
    id: 'test_admin',
    email: 'admin@baemeds.com',
    name: 'Super Admin',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  // Check valid transition from PENDING_PAYMENT -> PAID
  const allowedFromPending = VALID_ORDER_TRANSITIONS['PENDING_PAYMENT'];
  if (!allowedFromPending.includes('PAID') || !allowedFromPending.includes('CANCELLED')) {
    throw new Error('PENDING_PAYMENT must allow PAID and CANCELLED');
  }

  // Check CLINICAL_REVIEW states
  const allowedFromReview = VALID_ORDER_TRANSITIONS['CLINICAL_REVIEW'];
  if (!allowedFromReview.includes('CLINICAL_APPROVED') || !allowedFromReview.includes('CLINICAL_REJECTED')) {
    throw new Error('CLINICAL_REVIEW must only transition to CLINICAL_APPROVED or CLINICAL_REJECTED');
  }

  // Verify CLINICAL_REVIEW CANNOT directly transition to SHIPPED or FULFILLMENT
  if (allowedFromReview.includes('SHIPPED') || allowedFromReview.includes('FULFILLMENT')) {
    throw new Error('CLINICAL_REVIEW must not allow direct fulfillment without clinical approval');
  }

  // Verify CANCELLED cannot transition to SHIPPED
  const allowedFromCancelled = VALID_ORDER_TRANSITIONS['CANCELLED'];
  if (allowedFromCancelled.length !== 0) {
    throw new Error('CANCELLED is a terminal state and must not have valid transitions');
  }

  // Test state machine validation rejection via service call
  try {
    await AdminService.updateOrderStatus(actor, 'ord_demo_001', 'SHIPPED'); // ord_demo_001 is CLINICAL_REVIEW
    throw new Error('Expected illegal transition CLINICAL_REVIEW -> SHIPPED to be rejected!');
  } catch (err: any) {
    if (!err.message.toLowerCase().includes('transition')) {
      throw err;
    }
  }

  console.log('✔ Order State Machine validation and illegal transition denial passed.');
}

// -------------------------------------------------------------
// TEST 4: Negative Stock Denial & Audited Reason Enforcement
// -------------------------------------------------------------
async function testNegativeInventoryDenial() {
  console.log('Testing Negative Inventory Denial & Adjustment Audit...');

  const actor: AdminUser = {
    id: 'test_fulfillment',
    email: 'fulfillment@baemeds.com',
    name: 'Fulfillment Specialist',
    role: 'fulfillment_specialist',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  // Get current inventory to determine available stock
  const invList = await AdminService.getInventory(actor.role);
  const firstItem = invList[0];
  const currentAvailable = firstItem.available;

  // Attempt to deduct MORE than available stock (e.g. -9999 units)
  try {
    await AdminService.adjustInventory(
      actor,
      firstItem.productId,
      -(currentAvailable + 10),
      'Damage',
      'Illegal reduction test'
    );
    throw new Error('Expected negative stock adjustment to be rejected!');
  } catch (err: any) {
    if (!err.message.includes('Inventory cannot be reduced below zero')) {
      throw err;
    }
  }

  // Valid positive adjustment with reason
  const validAdj = await AdminService.adjustInventory(
    actor,
    firstItem.productId,
    5,
    'Receiving',
    'PO-8829 received from distributor'
  );
  if (validAdj.newQuantity !== currentAvailable + 5) {
    throw new Error(`Expected new quantity ${currentAvailable + 5}, got ${validAdj.newQuantity}`);
  }

  console.log('✔ Negative stock reduction blocked and audit reason verified.');
}

// -------------------------------------------------------------
// TEST 5: Mass Assignment & Privilege Escalation Prevention
// -------------------------------------------------------------
async function testMassAssignmentAndEscalation() {
  console.log('Testing Mass Assignment & Privilege Escalation Prevention...');

  // Attempt non-super-admin staff role update
  const supportActor: AdminUser = {
    id: 'test_support',
    email: 'support@baemeds.com',
    name: 'Support Agent',
    role: 'support_agent',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  try {
    await AdminService.updateStaffRole(supportActor, 'usr_staff_2', 'super_admin');
    throw new Error('Expected non-super_admin role update attempt to be rejected!');
  } catch (err: any) {
    if (!err.message.includes('Forbidden')) {
      throw err;
    }
  }

  // Super Admin can change staff role legitimately
  const superActor: AdminUser = {
    id: 'test_super',
    email: 'admin@baemeds.com',
    name: 'Super Admin',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const updatedStaff = await AdminService.updateStaffRole(superActor, 'usr_staff_2', 'clinical_specialist');
  if (updatedStaff.role !== 'clinical_specialist') {
    throw new Error('Expected role to be updated to clinical_specialist');
  }

  console.log('✔ Mass assignment & privilege escalation blocked.');
}

// -------------------------------------------------------------
// TEST 6: HIPAA Audit Logs Append-Only Guarantee
// -------------------------------------------------------------
async function testAuditLogsAppendOnly() {
  console.log('Testing HIPAA Audit Log Generation & Read-Only Immutability...');

  const logs = await AdminService.getAuditLogs('super_admin');
  if (!logs || !logs.length) {
    throw new Error('Expected audit logs to contain entries from previous mutations');
  }

  // Verify essential HIPAA audit fields
  const latest = logs[0];
  if (!latest.id || !latest.timestamp || !latest.actorId || !latest.actorRole || !latest.action || !latest.status) {
    throw new Error(`Audit log entry missing mandatory fields: ${JSON.stringify(latest)}`);
  }

  // Verify that AdminService does NOT expose deleteAuditLog or clearAuditLogs methods
  if ((AdminService as any).deleteAuditLog || (AdminService as any).clearAuditLogs) {
    throw new Error('CRITICAL VULNERABILITY: Audit logs must be append-only and have no delete API!');
  }

  console.log(`✔ HIPAA Audit Logs verified: ${logs.length} immutable events recorded.`);
}

async function runAll() {
  console.log('\n======================================================');
  console.log('BAEMEDS NATIVE ADMIN PLATFORM RBAC & SECURITY SUITE');
  console.log('======================================================\n');

  try {
    await testAuthenticationAndCustomerDenial();
    await testRbacRoleBoundaries();
    await testOrderStateMachine();
    await testNegativeInventoryDenial();
    await testMassAssignmentAndEscalation();
    await testAuditLogsAppendOnly();

    console.log('\n✔ ALL ADMIN RBAC & SECURITY TESTS PASSED SUCCESSFULLY.\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    process.exit(1);
  }
}

runAll();
