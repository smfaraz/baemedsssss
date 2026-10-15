/**
 * BaeMeds Native First-Party Commerce Test Suite
 * Validates:
 * 1. Native Catalog Seed & Retrieval (catalog items, handle lookup, search, categories)
 * 2. Native Cart Operations & Cost Calculations
 * 3. Native Server Checkout Authoritative Calculations
 * 4. Authoritative Pricing & Total Validation
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

  const sampleProduct = (await fetchAllProducts())[0];

  // 1. Missing required fields must throw 400
  const invalidReq = new Request('https://baemeds.com/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://baemeds.com',
    },
    body: JSON.stringify({
      cartId: 'test_cart_invalid',
      email: 'invalid-email-format',
      firstName: '',
      lastName: 'Doe',
      address1: '123 Health Ave',
      city: 'Wilmington',
      province: 'DE',
      zip: '19801',
      items: [{ id: 'line_1', merchandiseId: sampleProduct.id, quantity: 1 }],
    }),
  });

  const invalidRes = await checkoutHandler.fetch(invalidReq);
  if (invalidRes.status !== 400) {
    throw new Error(`Expected validation error 400, got status ${invalidRes.status}`);
  }

  // 2. Checkout without PaymentIntent must strictly throw 400 (security hardening)
  const noPaymentReq = new Request('https://baemeds.com/api/checkout', {
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
      shippingTier: 'standard',
      items: [{ id: 'line_1', merchandiseId: sampleProduct.id, quantity: 1 }],
    }),
  });

  const noPaymentRes = await checkoutHandler.fetch(noPaymentReq);
  const noPaymentData = await noPaymentRes.json();
  if (noPaymentRes.status !== 400 || !noPaymentData.error?.includes('PaymentIntent')) {
    throw new Error(`Expected PaymentIntent validation error 400, got status ${noPaymentRes.status}: ${JSON.stringify(noPaymentData)}`);
  }

  // 3. Native Cart calculation authoritative subtotal verification
  const cartFormatted = formatCartResponse('test_cart_math', [
    { merchandiseId: sampleProduct.id, quantity: 2 },
  ]);
  const expectedSubtotal = Number(sampleProduct.price) * 2;
  const calculatedSubtotal = Number(cartFormatted.cost.subtotalAmount.amount);
  if (Math.abs(expectedSubtotal - calculatedSubtotal) > 0.01) {
    throw new Error(`Subtotal mismatch: expected ${expectedSubtotal}, got ${calculatedSubtotal}`);
  }

  console.log('✔ Server Authoritative Checkout & Cart Calculation tests passed.');
}

async function testZeroShopifyRuntime() {
  console.log('Testing Zero-Shopify Runtime Dependency Across Codebase...');

  const rootDir = path.resolve(__dirname, '..');
  const checkDirs = ['api', 'components', 'pages', 'lib', 'server', 'context'];
  const forbiddenPatterns = [
    'shopify-buy',
    'X-Shopify-Storefront-Access-Token',
    'gid://shopify/Cart',
    'gid://shopify/Product',
    'ptya1n-k0.myshopify.com',
    'shopify_cart_id',
    'shopify_customer_token',
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
