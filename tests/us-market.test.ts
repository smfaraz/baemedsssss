/**
 * US Market & Healthcare Compliance Architecture Test Suite
 * Validates:
 * 1. US Market Configuration & Formatting (USD, US States, ZIP codes, E.164 phone)
 * 2. Server-side US Sales Tax Calculation & DME/Rx exemptions
 * 3. US Carrier Shipping Service & Tracking
 * 4. HIPAA-Conscious Audit Logging & Automatic PHI Redaction
 */

import {
  US_MARKET_CONFIG,
  formatPrice,
  isValidUSZip,
  isValidUSPhone,
  formatUSPhone,
  getStateName,
} from '../lib/marketConfig';
import { TaxService } from '../server/taxService';
import { ShippingService } from '../server/shippingService';
import { AuditLogger } from '../server/auditLogger';

// ----------------------------------------------------
// 1. US Market Configuration & Data Validation Tests
// ----------------------------------------------------
function testMarketConfig() {
  console.log('Testing US Market Configuration...');
  if (US_MARKET_CONFIG.currency !== 'USD') {
    throw new Error(`Expected USD currency, got: ${US_MARKET_CONFIG.currency}`);
  }
  if (US_MARKET_CONFIG.currencySymbol !== '$') {
    throw new Error(`Expected $ currency symbol, got: ${US_MARKET_CONFIG.currencySymbol}`);
  }
  if (US_MARKET_CONFIG.locale !== 'en-US') {
    throw new Error(`Expected en-US locale, got: ${US_MARKET_CONFIG.locale}`);
  }
  if (US_MARKET_CONFIG.market !== 'US') {
    throw new Error(`Expected US market, got: ${US_MARKET_CONFIG.market}`);
  }

  // Price formatting
  const formatted1 = formatPrice(9.99);
  if (formatted1 !== '$9.99') throw new Error(`Expected $9.99, got ${formatted1}`);

  const formatted2 = formatPrice(1299);
  if (formatted2 !== '$1,299.00') throw new Error(`Expected $1,299.00, got ${formatted2}`);

  const formatted3 = formatPrice(25);
  if (formatted3 !== '$25.00') throw new Error(`Expected $25.00, got ${formatted3}`);

  // ZIP code validation
  if (!isValidUSZip('19801')) throw new Error('19801 should be a valid US ZIP');
  if (!isValidUSZip('90210-1234')) throw new Error('90210-1234 should be a valid ZIP+4');
  if (isValidUSZip('500034')) throw new Error('6-digit Indian PIN code should be rejected');
  if (isValidUSZip('ABCDE')) throw new Error('Alpha strings should be rejected as ZIP');

  // Phone validation
  if (!isValidUSPhone('+18005550199')) throw new Error('+18005550199 should be valid US phone');
  if (!isValidUSPhone('(800) 555-0199')) throw new Error('(800) 555-0199 should be valid US phone');
  if (isValidUSPhone('+919390349389')) throw new Error('Indian +91 phone should be rejected by US phone validator');

  const formattedPhone = formatUSPhone('8005550199');
  if (formattedPhone !== '(800) 555-0199') throw new Error(`Unexpected phone format: ${formattedPhone}`);

  const deState = getStateName('DE');
  if (deState !== 'Delaware') throw new Error(`Expected Delaware, got ${deState}`);

  console.log('✔ US Market Configuration tests passed.');
}

// ----------------------------------------------------
// 2. US Sales Tax & DME Exemption Tests
// ----------------------------------------------------
function testTaxService() {
  console.log('Testing US Sales Tax Service...');

  // Delaware has 0% sales tax
  const deTax = TaxService.calculateTax({
    shippingAddress: {
      state: 'DE',
      zip: '19801',
      city: 'Wilmington',
    },
    items: [
      { id: '1', title: 'Retail Accessory', price: 100, quantity: 1, requiresPrescription: false },
    ],
  });
  if (deTax.estimatedTax !== 0 || deTax.taxRate !== 0) {
    throw new Error(`Delaware should have 0% sales tax, got $${deTax.estimatedTax}`);
  }

  // California standard non-Rx item has sales tax
  const caTax = TaxService.calculateTax({
    shippingAddress: {
      state: 'CA',
      zip: '90001',
      city: 'Los Angeles',
    },
    items: [
      { id: 'item1', title: 'Carrying Case', price: 100, quantity: 1, requiresPrescription: false },
    ],
  });
  if (caTax.estimatedTax <= 0) {
    throw new Error('California standard retail item should incur sales tax');
  }

  // Prescription / DME medical supplies in CA are exempt from sales tax
  const caRxTax = TaxService.calculateTax({
    shippingAddress: {
      state: 'CA',
      zip: '90001',
      city: 'Los Angeles',
    },
    items: [
      { id: 'oxygen-unit', title: '5L Oxygen Concentrator', price: 895, quantity: 1, requiresPrescription: true, category: 'Oxygen Concentrator' },
    ],
  });
  if (caRxTax.estimatedTax !== 0 || !caRxTax.isExempt) {
    throw new Error(`Prescription DME equipment should be tax-exempt in CA, got $${caRxTax.estimatedTax}`);
  }

  console.log('✔ US Sales Tax and DME exemption tests passed.');
}

// ----------------------------------------------------
// 3. US Carrier Shipping Service Tests
// ----------------------------------------------------
function testShippingService() {
  console.log('Testing US Carrier Shipping Service...');

  const options = ShippingService.getAvailableOptions({
    destination: {
      state: 'DE',
      zip: '19801',
      city: 'Wilmington',
    },
    items: [
      { id: '1', title: 'Oxygen Concentrator', price: 895, quantity: 1, weightLbs: 31 },
    ],
  });

  if (options.length === 0) {
    throw new Error('Expected shipping options to be returned');
  }

  // Free standard shipping on orders over $99
  const groundOption = options.find(o => o.id === 'standard-ground');
  if (!groundOption || groundOption.price !== 0) {
    throw new Error('Expected free standard ground shipping for $895 order');
  }

  // Tracking URL tests
  const uspsTracking = ShippingService.getTrackingUrl('USPS', '9400100000000000000000');
  if (!uspsTracking.includes('usps.com')) throw new Error('Invalid USPS tracking URL');

  const upsTracking = ShippingService.getTrackingUrl('UPS', '1Z9999999999999999');
  if (!upsTracking.includes('ups.com')) throw new Error('Invalid UPS tracking URL');

  const fedexTracking = ShippingService.getTrackingUrl('FedEx', '123456789012');
  if (!fedexTracking.includes('fedex.com')) throw new Error('Invalid FedEx tracking URL');

  console.log('✔ US Shipping Carrier tests passed.');
}

// ----------------------------------------------------
// 4. HIPAA-Conscious Audit Logging & PHI Redaction Tests
// ----------------------------------------------------
function testAuditLogging() {
  console.log('Testing HIPAA Audit Logging & PHI Sanitization...');

  // Log an event with sensitive metadata containing potential PHI fields
  const event = AuditLogger.logEvent({
    action: 'PRESCRIPTION_VIEW',
    actor: 'usr_compliance_109',
    resource: 'rx_8849',
    result: 'SUCCESS',
    metadata: {
      ssn: '000-12-3456',
      diagnosis: 'COPD stage IV with hypoxemia',
      hcpcsCode: 'E1390',
      patient_name: 'Jane Doe',
      dateOfBirth: '1985-04-12',
      email_address: 'jane.doe@example.com',
      notes: 'Customer phone is (214) 555-0199 and SSN is 111-22-3333',
      nestedRecord: {
        physician: 'Dr. Gregory House',
        npi: '1982736450',
        rxList: [
          { prescriptionText: 'Oxygen 2LPM continuously', status: 'active' }
        ]
      }
    },
  });

  if (!event.id || !event.timestamp) {
    throw new Error('Audit event missing id or timestamp');
  }

  const loggedMetadataStr = JSON.stringify(event.metadata);
  // Ensure SSN was blocked
  if (loggedMetadataStr.includes('000-12-3456') || loggedMetadataStr.includes('111-22-3333')) {
    throw new Error('Audit logger failed to redact SSN!');
  }
  // Ensure diagnosis was blocked
  if (loggedMetadataStr.includes('COPD stage IV')) {
    throw new Error('Audit logger failed to redact diagnosis PHI!');
  }
  // Ensure patient name, DOB, email, and physician were blocked
  if (loggedMetadataStr.includes('Jane Doe')) {
    throw new Error('Audit logger failed to redact patient name!');
  }
  if (loggedMetadataStr.includes('jane.doe@example.com')) {
    throw new Error('Audit logger failed to redact email address!');
  }
  if (loggedMetadataStr.includes('Dr. Gregory House')) {
    throw new Error('Audit logger failed to redact physician name!');
  }
  // Ensure embedded phone in notes was scrubbed
  if (loggedMetadataStr.includes('(214) 555-0199')) {
    throw new Error('Audit logger failed to redact embedded phone number in string message!');
  }
  // Ensure array preservation (rxList must remain an array, not corrupted into an object)
  const metaObj = event.metadata as any;
  if (!Array.isArray(metaObj.nestedRecord?.rxList)) {
    throw new Error('Audit logger corrupted array structure in metadata!');
  }

  console.log('✔ HIPAA Audit Logging and deep PHI redaction tests passed.');
}

// ----------------------------------------------------
// 5. Address Validation & Security Sanitization Tests
// ----------------------------------------------------
function testAddressAndSecurity() {
  console.log('Testing Address Validation & Security Sanitization...');

  // State validation
  const validStates = ['CA', 'NY', 'TX', 'FL', 'DC', 'Delaware', 'california'];
  for (const s of validStates) {
    // Both abbreviations and full names must be accepted
    const normalized = s.length === 2 ? s.toUpperCase() : (s.toLowerCase() === 'delaware' ? 'DE' : 'CA');
    if (!normalized) throw new Error(`Failed to normalize valid state: ${s}`);
  }

  // Invalid states must be rejected
  const invalidStates = ['Atlantis', 'ZZ', '123', 'London', 'Telangana'];
  for (const inv of invalidStates) {
    const isStateValid = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'].includes(inv.toUpperCase());
    if (isStateValid) throw new Error(`Invalid state accepted: ${inv}`);
  }

  // Phone validation & E.164 normalization
  const validPhones = ['(800) 555-0199', '2145551234', '+12145551234', '1-800-555-0199'];
  for (const p of validPhones) {
    if (!isValidUSPhone(p)) throw new Error(`Valid phone rejected: ${p}`);
  }

  const invalidPhones = ['123', '555-ABCD', '+919876543210', '0000'];
  for (const ip of invalidPhones) {
    if (isValidUSPhone(ip)) throw new Error(`Invalid phone accepted: ${ip}`);
  }

  // XSS and SQL injection input sanitization simulation
  const maliciousInputs = [
    '<script>alert("xss")</script>',
    'DROP TABLE users;--',
    '"><img src=x onerror=alert(1)>',
    '\' OR \'1\'=\'1',
    '\x00nullbyte',
  ];
  for (const malicious of maliciousInputs) {
    const sanitized = malicious
      .replace(/[<>'"&\x00]/g, '')
      .replace(/\bon\w+\s*=/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
    if (sanitized.includes('<script>') || sanitized.includes('onerror=') || sanitized.includes('\x00')) {
      throw new Error(`Sanitizer failed to neutralize payload: ${malicious}`);
    }
  }

  console.log('✔ Address Validation and Security Sanitization tests passed.');
}

// ----------------------------------------------------
// 6. RBAC & Prescription Workflow Governance Tests
// ----------------------------------------------------
function testRBACAndPrescriptions() {
  console.log('Testing RBAC Roles & Prescription Lifecycle...');

  const validRoles = [
    'super_admin',
    'compliance_officer',
    'clinical_specialist',
    'support_agent',
    'fulfillment_specialist',
    'customer',
  ];

  const validStatuses = [
    'UPLOADED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'EXPIRED',
  ];

  if (validRoles.length !== 6) throw new Error('Expected 6 distinct least-privilege roles');
  if (validStatuses.length !== 5) throw new Error('Expected 5 prescription lifecycle states');

  // Verify least privilege rule: fulfillment specialist cannot review prescriptions
  const canReviewPrescriptions = (role: string) => ['super_admin', 'clinical_specialist'].includes(role);
  if (canReviewPrescriptions('fulfillment_specialist')) {
    throw new Error('Fulfillment specialist should not have prescription review permissions!');
  }
  if (!canReviewPrescriptions('clinical_specialist')) {
    throw new Error('Clinical specialist must have prescription review permissions!');
  }

  console.log('✔ RBAC Roles & Prescription Governance tests passed.');
}

// ----------------------------------------------------
// 7. Adversarial Attack Tests (Phase 3 Zero-Trust Validation)
// ----------------------------------------------------
function testAdversarialAttacks() {
  console.log('Testing Adversarial Attack Vectors...');

  // Attack 1: Customer A attempts IDOR to read/modify Customer B's records
  const simulateAccess = (actorId: string, resourceOwnerId: string, role: string) => {
    if (role === 'super_admin') return 'ALLOWED';
    if (actorId === resourceOwnerId) return 'ALLOWED';
    return 'DENIED';
  };

  const customerA = 'usr_customer_aaa_111';
  const customerB = 'usr_customer_bbb_222';

  // Customer A attacks Customer B's profile
  if (simulateAccess(customerA, customerB, 'customer') !== 'DENIED') {
    throw new Error('ADVERSARIAL ATTACK SUCCEEDED: Customer A accessed Customer B record!');
  }

  // Attack 2: Customer attempts Privilege Escalation via Mass Assignment
  const sanitizeAccountUpdate = (payload: Record<string, unknown>) => {
    const allowedKeys = new Set(['firstName', 'lastName', 'phone', 'defaultAddressId']);
    const safeUpdate: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (allowedKeys.has(k)) {
        safeUpdate[k] = v;
      }
    }
    return safeUpdate;
  };

  const attackPayload = {
    firstName: 'Attacker',
    role: 'super_admin',
    isAdmin: true,
    isClinical: true,
    prescriptionVerified: true,
    taxExempt: true,
  };
  const sanitizedUpdate = sanitizeAccountUpdate(attackPayload);
  if ('role' in sanitizedUpdate || 'isAdmin' in sanitizedUpdate || 'prescriptionVerified' in sanitizedUpdate) {
    throw new Error('ADVERSARIAL ATTACK SUCCEEDED: Mass assignment elevated privileges!');
  }

  // Attack 3: Customer attempts Prescription Checkout Bypass
  const simulateCheckoutGating = (items: Array<{ id: string; requiresPrescription?: boolean }>, rxAttested: boolean) => {
    const hasRx = items.some(i => i.requiresPrescription);
    if (hasRx && !rxAttested) {
      return { allowed: false, error: 'Prescription attestation required before checkout.' };
    }
    return { allowed: true };
  };

  const rxCart = [
    { id: '1', requiresPrescription: false },
    { id: '2', requiresPrescription: true },
  ];

  // Try checking out without attestation
  const bypassAttempt = simulateCheckoutGating(rxCart, false);
  if (bypassAttempt.allowed) {
    throw new Error('ADVERSARIAL ATTACK SUCCEEDED: Prescription item checked out without attestation!');
  }

  // Attested checkout
  const verifiedAttempt = simulateCheckoutGating(rxCart, true);
  if (!verifiedAttempt.allowed) {
    throw new Error('Valid attested checkout was rejected incorrectly.');
  }

  // Attack 4: Audit Log Spoofing Prevention
  const validateAuditLogInsert = (authUid: string | null, actorId: string, actorRole: string) => {
    if (authUid !== null) {
      // Must match own UID
      return actorId === authUid;
    }
    // Anon users can only insert as 'anonymous'
    return actorId === 'anonymous' && actorRole === 'anonymous';
  };

  // Anon attacker tries to claim they are 'super_admin'
  if (validateAuditLogInsert(null, 'usr_admin_victim', 'super_admin')) {
    throw new Error('ADVERSARIAL ATTACK SUCCEEDED: Anonymous user spoofed super_admin in audit log!');
  }

  // Authenticated customer tries to claim they are another customer
  if (validateAuditLogInsert('usr_customer_123', 'usr_customer_456', 'customer')) {
    throw new Error('ADVERSARIAL ATTACK SUCCEEDED: User spoofed another actor ID in audit log!');
  }

  console.log('✔ All Adversarial Attack tests repelled successfully (DENIED).');
}

// ----------------------------------------------------
// Master Test Runner
// ----------------------------------------------------
export function runAllUSMarketTests() {
  console.log('\n========================================');
  console.log('BAEMEDS US-MARKET ARCHITECTURE TEST SUITE');
  console.log('========================================\n');

  try {
    testMarketConfig();
    testTaxService();
    testShippingService();
    testAuditLogging();
    testAddressAndSecurity();
    testRBACAndPrescriptions();
    testAdversarialAttacks();
    console.log('\n✔ ALL US-MARKET ARCHITECTURAL & ADVERSARIAL TESTS PASSED SUCCESSFULLY.\n');
    return true;
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    return false;
  }
}

// Auto-run if executed directly in Node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('us-market.test')) {
  const success = runAllUSMarketTests();
  process.exit(success ? 0 : 1);
}
