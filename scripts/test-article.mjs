import { chromium } from 'playwright';

async function testArticle() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();

  const url = 'http://localhost:3000/guides/oxygen-concentrator-rental-hyderabad';
  console.log('Navigating to:', url);

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  const res = await page.goto(url, { waitUntil: 'networkidle' });
  console.log('HTTP Status:', res.status());

  const h1 = await page.locator('h1').textContent();
  console.log('H1 Title:', h1?.trim());

  // Test Calculator interaction
  const initialRental = await page.locator('#calculator p').first().textContent();
  console.log('Initial Recommended Monthly Rent:', initialRental?.trim());

  // Check Schema tags
  const schemas = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => {
      try { return JSON.parse(s.textContent)['@type']; } catch { return 'Invalid JSON'; }
    });
  });
  console.log('Rendered Schema Types:', schemas);
  console.log('Total Console Errors:', errors.length);

  await browser.close();
}

testArticle().catch(console.error);
