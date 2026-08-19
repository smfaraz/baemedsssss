import http from 'node:http';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 5183;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.end();
      });
      return true;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Server did not start within ${timeoutMs}ms at ${url}`);
}

async function runAudit() {
  console.log('=== STARTING COMPREHENSIVE SPA ROUTING & HYDRATION AUDIT ===');
  
  console.log(`Starting Vite server on port ${PORT}...`);
  const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    shell: true,
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  try {
    await waitForServer(BASE_URL);
    console.log(`Vite server is UP and responding at ${BASE_URL}`);

    let browser;
    try {
      browser = await chromium.launch({ headless: true, channel: 'msedge' });
    } catch (e) {
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    }
    
    const results = {
      routesTested: [],
      httpResults: [],
      hydrationResults: [],
      brokenLinks: [],
      errors: [],
      edgeCases: []
    };

    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await desktopContext.newPage();

    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({ url: page.url(), text: msg.text() });
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push({ url: page.url(), error: err.message });
    });

    // TEST 1: Homepage /
    console.log('\n--- 1. Testing Route: / (Homepage) ---');
    let res = await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    let status = res.status();
    let title = await page.title();
    console.log(`GET / -> HTTP ${status}, Title: "${title}"`);
    results.routesTested.push('/');
    results.httpResults.push({ route: '/', status, ok: status === 200 });
    
    let rootHasContent = await page.evaluate(() => (document.getElementById('root')?.innerHTML.length || 0) > 100);
    console.log(`Hydration check on /: root element populated? ${rootHasContent}`);
    results.hydrationResults.push({ route: '/', hydrated: rootHasContent });

    // Direct Refresh test on /
    res = await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    console.log(`Direct browser reload on / -> HTTP ${res.status()}`);

    // TEST 2: Product Listing /products
    console.log('\n--- 2. Testing Route: /products (Product Listing Page) ---');
    res = await page.goto(BASE_URL + '/products', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500); // Allow Shopify GraphQL fetch
    status = res.status();
    title = await page.title();
    console.log(`GET /products -> HTTP ${status}, Title: "${title}"`);
    results.routesTested.push('/products');
    results.httpResults.push({ route: '/products', status, ok: status === 200 });

    rootHasContent = await page.evaluate(() => (document.getElementById('root')?.innerHTML.length || 0) > 100);
    console.log(`Hydration check on /products: root element populated? ${rootHasContent}`);
    results.hydrationResults.push({ route: '/products', hydrated: rootHasContent });

    // Direct Refresh test on /products
    console.log('Testing direct reload on /products...');
    res = await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    console.log(`Direct reload on /products -> HTTP ${res.status()}`);

    // Extract product links from /products
    const productLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href^="/products/"]'));
      return Array.from(new Set(anchors.map(a => a.getAttribute('href')).filter(h => h && h !== '/products')));
    });
    console.log(`Found ${productLinks.length} product detail links on /products:`, productLinks);

    // TEST 3: All Available Category Filter Slugs
    const categories = [
      "Oxygen Concentrator",
      "BiPAP",
      "CPAP",
      "Patient Monitor",
      "Masks & Accessories",
      "ECG Machine",
      "BP Monitor",
      "Glucometer",
      "Nebulizer",
      "Suction Machine",
      "Thermometer",
      "Hospital Furniture",
      "Wheelchair",
      "Syringe Pump",
      "Defibrillator",
      "Sterilizer",
      "Orthopedic"
    ];

    console.log(`\n--- 3. Testing ${categories.length} Category Filter Routes ---`);
    for (const cat of categories) {
      const catPath = `/products?category=${encodeURIComponent(cat)}`;
      res = await page.goto(BASE_URL + catPath, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      status = res.status();
      const isHydrated = await page.evaluate(() => (document.getElementById('root')?.innerHTML.length || 0) > 100);
      const visibleProducts = await page.evaluate(() => document.querySelectorAll('a[href^="/products/"]').length);
      const isFilterActive = await page.evaluate((c) => document.body.innerText.toLowerCase().includes(c.toLowerCase()), cat);
      
      console.log(`Route "${catPath}" -> HTTP ${status}, Hydrated: ${isHydrated}, Category Detected: ${isFilterActive}, Products Shown: ${visibleProducts}`);
      results.routesTested.push(catPath);
      results.httpResults.push({ route: catPath, status, ok: status === 200 });
      results.hydrationResults.push({ route: `Category (${cat})`, hydrated: isHydrated });
    }

    // TEST 4: Product Detail Pages (/products/:id)
    const testSampleLinks = productLinks.slice(0, 20);
    console.log(`\n--- 4. Testing ${testSampleLinks.length} Sample Product Detail Routes (out of ${productLinks.length} total) ---`);
    for (const link of testSampleLinks) {
      res = await page.goto(BASE_URL + link, { waitUntil: 'domcontentloaded' });
      // Wait for loading skeleton to disappear
      await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 15000 }).catch(() => null);
      status = res.status();
      const h1Text = await page.evaluate(() => document.querySelector('h1')?.innerText || '');
      const hasPrice = await page.evaluate(() => document.body.innerText.includes('₹'));
      const hasActionBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some(b => b.innerText.includes('Add to cart') || b.innerText.includes('Enquire') || b.innerText.includes('Out of stock') || b.innerText.includes('Rent'));
      });
      
      console.log(`Product "${link}" -> HTTP ${status}, H1: "${h1Text}", Price: ${hasPrice}, Action Button: ${hasActionBtn}`);
      results.routesTested.push(link);
      results.httpResults.push({ route: link, status, ok: status === 200 && h1Text.length > 0 });
      results.hydrationResults.push({ route: link, hydrated: h1Text.length > 0 });

      // Test direct refresh on product page
      const reloadRes = await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 15000 }).catch(() => null);
      if (reloadRes.status() !== 200) {
        results.errors.push(`Reload failed for product ${link}: status ${reloadRes.status()}`);
      }
    }

    // TEST 5: Browser Navigation (Back / Forward)
    console.log('\n--- 5. Testing Client-Side Back / Forward Navigation ---');
    await page.goto(BASE_URL + '/products', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    if (productLinks.length > 0) {
      await page.click(`a[href="${productLinks[0]}"]`);
      await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 15000 }).catch(() => null);
      const detailUrl = page.url();
      console.log(`Navigated to product detail: ${detailUrl}`);
      
      await page.goBack({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      console.log(`Go Back -> URL: ${page.url()}`);
      const backOk = page.url().endsWith('/products');
      
      await page.goForward({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 15000 }).catch(() => null);
      console.log(`Go Forward -> URL: ${page.url()}`);
      const forwardOk = page.url().includes(productLinks[0]);

      results.edgeCases.push({
        test: 'Client-side history navigation (Back/Forward)',
        passed: backOk && forwardOk
      });
    }

    // TEST 6: Edge Cases
    console.log('\n--- 6. Testing Edge Cases ---');
    
    // 6a: Invalid product handle
    const invalidProductUrl = `${BASE_URL}/products/invalid-non-existent-product-id-999`;
    res = await page.goto(invalidProductUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 15000 }).catch(() => null);
    console.log(`Invalid Product URL -> HTTP ${res.status()}`);
    const notFoundRendered = await page.evaluate(() => 
      document.body.innerText.includes('Product not found') || 
      document.body.innerText.includes('Product temporarily unavailable') || 
      document.body.innerText.includes('Browse catalogue')
    );
    console.log(`Graceful 404 UI rendered? ${notFoundRendered}`);
    results.edgeCases.push({
      test: 'Invalid product handle renders graceful 404/not-found UI',
      passed: notFoundRendered
    });

    // 6b: Invalid category slug
    const invalidCategoryUrl = `${BASE_URL}/products?category=completely-invalid-category-xyz`;
    res = await page.goto(invalidCategoryUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    console.log(`Invalid Category URL -> HTTP ${res.status()}`);
    const emptyStateRendered = await page.evaluate(() => 
      document.body.innerText.includes('No products found') || 
      document.body.innerText.includes('Try adjusting your search') ||
      document.querySelectorAll('a[href^="/products/"]').length === 0
    );
    console.log(`Graceful empty category state rendered? ${emptyStateRendered}`);
    results.edgeCases.push({
      test: 'Invalid category slug renders graceful empty state',
      passed: emptyStateRendered
    });

    // TEST 7: Mobile Viewport (iPhone SE: 375x667)
    console.log('\n--- 7. Testing Mobile Viewport (375x667) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    });
    const mobilePage = await mobileContext.newPage();
    
    res = await mobilePage.goto(BASE_URL + '/products', { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(2000);
    console.log(`Mobile /products -> HTTP ${res.status()}`);
    const mobileHydrated = await mobilePage.evaluate(() => (document.getElementById('root')?.innerHTML.length || 0) > 100);
    console.log(`Mobile /products hydrated? ${mobileHydrated}`);

    if (productLinks.length > 0) {
      res = await mobilePage.goto(BASE_URL + productLinks[0], { waitUntil: 'domcontentloaded' });
      await mobilePage.waitForTimeout(2000);
      console.log(`Mobile Product Detail -> HTTP ${res.status()}`);
      const mobileH1 = await mobilePage.evaluate(() => document.querySelector('h1')?.innerText || '');
      console.log(`Mobile Product Detail H1: "${mobileH1}"`);
    }

    await browser.close();

    console.log('\n================ AUDIT SUMMARY ================');
    console.log(`Total Routes Tested: ${results.routesTested.length}`);
    console.log(`HTTP 200 Passed: ${results.httpResults.filter(r => r.ok).length}/${results.httpResults.length}`);
    console.log(`Hydration Passed: ${results.hydrationResults.filter(r => r.hydrated).length}/${results.hydrationResults.length}`);
    console.log(`Edge Cases Passed: ${results.edgeCases.filter(e => e.passed).length}/${results.edgeCases.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Page Runtime Exceptions: ${pageErrors.length}`);

    if (pageErrors.length > 0) {
      console.error('Page Errors encountered:', pageErrors);
    }

  } finally {
    server.kill();
  }
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
