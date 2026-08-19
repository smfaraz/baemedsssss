import { chromium } from 'playwright';

async function testSchema() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();
  
  // Test Home schema
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1000);
  const homeJsonLd = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    return scripts.map(s => JSON.parse(s.textContent));
  });
  console.log('✓ Home JSON-LD Schema Types:', homeJsonLd.map(j => j['@type']));
  console.log('  Business Name:', homeJsonLd[0]?.name);
  console.log('  Phone:', homeJsonLd[0]?.telephone);
  console.log('  Address:', homeJsonLd[0]?.address?.addressLocality);

  // Test Product schema
  await page.goto('http://localhost:3000/products/resmed-airsense-10-autoset');
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(1000);
  const prodJsonLd = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    return scripts.map(s => JSON.parse(s.textContent));
  });
  console.log('✓ Product JSON-LD Schema Types:', prodJsonLd.map(j => j['@type']));
  const prod = prodJsonLd.find(j => j['@type'] === 'Product');
  console.log('  Product Title:', prod?.name);
  console.log('  Price (INR):', prod?.offers?.price);
  console.log('  Availability:', prod?.offers?.availability);
  console.log('  Return Policy:', prod?.offers?.hasMerchantReturnPolicy?.returnPolicyCategory);

  await browser.close();
}

testSchema().catch(console.error);
