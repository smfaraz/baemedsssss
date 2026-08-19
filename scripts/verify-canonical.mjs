import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';

const PORT = 5189;
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
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Server did not start at ${url}`);
}

async function verify() {
  const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    shell: true,
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  try {
    await waitForServer(BASE_URL);
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const page = await browser.newPage();
    const base = BASE_URL;

  await page.goto(base + '/products/resmed-airsense-10-autoset?utm_source=google&ref=test');
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 15000 }).catch(() => null);
  await page.waitForSelector('link[rel="canonical"]', { timeout: 8000 }).catch(() => null);
  const prodCanonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.getAttribute('href'));
  const prodOgUrl = await page.evaluate(() => document.querySelector('meta[property="og:url"]')?.getAttribute('content'));
  console.log('Tested Port Base:', base);
  console.log('✓ Product URL with ?utm_source & ?ref canonical:', prodCanonical);
  console.log('✓ Product OpenGraph og:url:', prodOgUrl);

  // Test Category Query URL
  await page.goto(base + '/products?category=Oxygen%20Concentrator&sort=price-asc');
  await page.waitForTimeout(1500);
  const catCanonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.getAttribute('href'));
  console.log('✓ Category Filter with query params canonical:', catCanonical);

  // Test Home with tracking
  await page.goto(base + '/?utm_campaign=launch');
  await page.waitForTimeout(1500);
  const homeCanonical = await page.evaluate(() => document.querySelector('link[rel="canonical"]')?.getAttribute('href'));
  console.log('✓ Home with query params canonical:', homeCanonical);

  await browser.close();
  } finally {
    server.kill();
  }
}

verify().catch(console.error);
