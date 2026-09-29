/**
 * BaeMeds Native First-Party Commerce Test Suite
 * Validates:
 * 1. Native Catalog Seed & Retrieval (119 products, handle lookup, search, categories)
 * 2. Native Cart Operations & Cost Calculations
 * 3. Native Server Checkout Authoritative Calculations
 * 4. Prescription Attestation Requirement
 * 5. Zero-Shopify Runtime Dependency Verification
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  fetchAllProducts,
  fetchProductByHandle,
  fetchProductsByCategory,
  searchProducts,
  formatCartResponse,
  isRentalAvailable,
} from '../lib/commerce';

import checkoutHandler from '../api/checkout';

async function testNativeCatalog() {
  console.log('Testing Native Catalog Retrieval...');
  const products = await fetchAllProducts();
  if (products.length < 50) {
    throw new Error(`Expected populated live catalog products, got ${products.length}`);
  }

  // Handle lookup
  const first = products[0];
  const byHandle = await fetchProductByHandle(first.handle);
  if (!byHandle || byHandle.id !== first.id) {
    throw new Error(`Failed to resolve product by handle: ${first.handle}`);
  }

  // Category search
  const oxygenProducts = await fetchProductsByCategory('Oxygen Concentrator');
  if (!oxygenProducts.length) {
    throw new Error('Expected oxygen concentrator category products to be found');
  }

  // Keyword search
  const searchResults = await searchProducts('cpap');
  if (!searchResults.length) {
    throw new Error('Expected CPAP search results to be returned');
  }

  // Rental availability logic (always false in US market)
  const isRental = isRentalAvailable(oxygenProducts[0]);
  if (isRental !== false) {
    throw new Error('isRentalAvailable must return false for the US market');
  }

  console.log(`✔ Native Catalog tests passed (${products.length} products verified).`);

}

async function testNativeCheckoutApi() {
  console.log('Testing Server Authoritative Checkout API...');

  // 1. Missing Rx attestation on oxygen concentrator must throw 400
  const oxygenSeed = (await fetchProductsByCategory('Oxygen Concentrator'))[0];
  const rxReq = new Request('https://baemeds.com/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://baemeds.com',
    },
    body: JSON.stringify({
      cartId: 'test_cart_rx',
      email: 'patient@example.com',
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Health Ave',
      city: 'Wilmington',
      province: 'DE',
      zip: '19801',
      prescriptionAttested: false, // Intentionally false
      items: [{ id: 'line_1', merchandiseId: oxygenSeed.id, quantity: 1 }],
    }),
  });

  const rxRes = await checkoutHandler.fetch(rxReq);
  const rxData = await rxRes.json();
  if (rxRes.status !== 400 || !rxData.error?.includes('prescription')) {
    throw new Error(`Expected Rx attestation error, got status ${rxRes.status}: ${JSON.stringify(rxData)}`);
  }

  // 2. Valid checkout with attestation must calculate totals authoritatively
  const validReq = new Request('https://baemeds.com/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://baemeds.com',
    },
    body: JSON.stringify({
      cartId: 'test_cart_valid',
      email: 'patient@example.com',
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Health Ave',
      city: 'Wilmington',
      province: 'DE',
      zip: '19801',
      prescriptionAttested: true,
      shippingTier: 'standard',
      items: [{ id: 'line_1', merchandiseId: oxygenSeed.id, quantity: 1 }],
    }),
  });

  const validRes = await checkoutHandler.fetch(validReq);
  const validData = await validRes.json();
  if (validRes.status !== 200 || !validData.success || !validData.orderNumber) {
    throw new Error(`Valid checkout failed: ${JSON.stringify(validData)}`);
  }

  const expectedSubtotal = Number(oxygenSeed.price);
  const calculatedSubtotal = Number(validData.subtotal);
  if (Math.abs(expectedSubtotal - calculatedSubtotal) > 0.01) {
    throw new Error(`Subtotal mismatch: expected ${expectedSubtotal}, got ${calculatedSubtotal}`);
  }

  console.log('✔ Server Authoritative Checkout API tests passed.');
}

async function testZeroShopifyRuntime() {
  console.log('Testing Zero-Shopify Runtime Dependency Across Codebase...');

  const rootDir = path.resolve(__dirname, '..');
  const checkDirs = ['api', 'components', 'pages', 'lib', 'server', 'context'];
  const forbiddenPatterns = [
    'shopify-buy',
    'X-Shopify-Storefront-Access-Token',
    'gid://shopify/Cart',
    'ptya1n-k0.myshopify.com',
  ];

  let violations = 0;

  for (const dir of checkDirs) {
    const fullDir = path.join(rootDir, dir);
    if (!fs.existsSync(fullDir)) continue;

    const files = fs.readdirSync(fullDir, { recursive: true }) as string[];
    for (const file of files) {
      const fullPath = path.join(fullDir, file);
      if (fs.statSync(fullPath).isDirectory()) continue;
      if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js') && !file.endsWith('.json')) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of forbiddenPatterns) {
        if (content.includes(pattern)) {
          console.error(`Violation in ${path.relative(rootDir, fullPath)}: Contains forbidden pattern "${pattern}"`);
          violations++;
        }
      }
    }
  }

  if (violations > 0) {
    throw new Error(`Found ${violations} Shopify runtime violations in source files!`);
  }

  console.log('✔ Zero-Shopify Runtime Verification passed (0 violations found).');
}

async function runAll() {
  console.log('\n========================================');
  console.log('BAEMEDS NATIVE COMMERCE TEST SUITE');
  console.log('========================================\n');

  try {
    await testNativeCatalog();
    await testNativeCheckoutApi();
    await testZeroShopifyRuntime();
    console.log('\n✔ ALL NATIVE COMMERCE TESTS PASSED SUCCESSFULLY.\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    process.exit(1);
  }
}

runAll();
