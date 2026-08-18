/**
 * Mobile screenshot + visual-diff sweep for every BaeMeds route.
 *
 * Usage:
 *   node scripts/mobile-shots.mjs                 # capture into audit/mobile-shots/current
 *   node scripts/mobile-shots.mjs --base=http://127.0.0.1:5175
 *   node scripts/mobile-shots.mjs --promote       # copy current -> baseline (accept new look)
 *
 * On each run it captures every route, then (if a baseline exists) pixel-diffs
 * current vs baseline and writes diffs + a summary. First run seeds the baseline.
 */
import { chromium, devices } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'audit', 'mobile-shots');
const currentDir = path.join(outDir, 'current');
const baselineDir = path.join(outDir, 'baseline');
const diffDir = path.join(outDir, 'diff');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const baseURL = args.base || 'http://127.0.0.1:5175';

// name -> route. Names become the PNG filenames.
const routes = {
  'home': '/',
  'products': '/products',
  'search-oxygen': '/search?q=oxygen',
  'product-detail': '/products/resmed-airsense-10-autoset',
  'cart': '/cart',
  'wishlist': '/wishlist',
  'checkout': '/checkout',
  'bulk-orders': '/bulk-orders',
  'about': '/about',
  'contact': '/contact',
  'policy-privacy': '/policy?type=privacy',
  'policy-terms': '/policy?type=terms',
  'policy-returns': '/policy?type=returns',
  'login': '/login',
  'register': '/register',
  'account': '/account',
  'order-success': '/order-success',
  'thank-you': '/thank-you',
  'not-found': '/this-route-does-not-exist',
};

const ensure = (dir) => fs.mkdirSync(dir, { recursive: true });

const promote = () => {
  ensure(baselineDir);
  for (const file of fs.readdirSync(currentDir)) {
    fs.copyFileSync(path.join(currentDir, file), path.join(baselineDir, file));
  }
  console.log('Promoted current screenshots to baseline.');
};

const diff = () => {
  if (!fs.existsSync(baselineDir) || fs.readdirSync(baselineDir).length === 0) {
    ensure(baselineDir);
    for (const file of fs.readdirSync(currentDir)) {
      fs.copyFileSync(path.join(currentDir, file), path.join(baselineDir, file));
    }
    console.log('No baseline found — seeded baseline from this run. Re-run after changes to compare.');
    return;
  }
  ensure(diffDir);
  const report = [];
  for (const name of Object.keys(routes)) {
    const file = `${name}.png`;
    const curPath = path.join(currentDir, file);
    const basePath = path.join(baselineDir, file);
    if (!fs.existsSync(curPath) || !fs.existsSync(basePath)) {
      report.push({ name, status: 'missing' });
      continue;
    }
    const cur = PNG.sync.read(fs.readFileSync(curPath));
    const base = PNG.sync.read(fs.readFileSync(basePath));
    if (cur.width !== base.width || cur.height !== base.height) {
      report.push({ name, status: 'size-changed', base: `${base.width}x${base.height}`, cur: `${cur.width}x${cur.height}` });
      continue;
    }
    const out = new PNG({ width: cur.width, height: cur.height });
    const changed = pixelmatch(base.data, cur.data, out.data, cur.width, cur.height, { threshold: 0.1 });
    const pct = ((changed / (cur.width * cur.height)) * 100).toFixed(2);
    if (changed > 0) fs.writeFileSync(path.join(diffDir, file), PNG.sync.write(out));
    report.push({ name, status: changed === 0 ? 'identical' : 'changed', changedPx: changed, pct: `${pct}%` });
  }
  console.table(report);
  fs.writeFileSync(path.join(outDir, 'diff-report.json'), JSON.stringify(report, null, 2));
  const changedCount = report.filter((r) => r.status === 'changed' || r.status === 'size-changed').length;
  console.log(changedCount === 0 ? 'No visual changes vs baseline.' : `${changedCount} route(s) changed vs baseline. See audit/mobile-shots/diff/.`);
};

const run = async () => {
  ensure(currentDir);
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();

  for (const [name, route] of Object.entries(routes)) {
    const url = `${baseURL}${route}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    } catch {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    }
    await page.waitForTimeout(600); // let reveal/marquee settle
    await page.screenshot({ path: path.join(currentDir, `${name}.png`), fullPage: true });
    console.log(`captured ${name} (${route})`);
  }

  await browser.close();
  if (args.promote) return promote();
  diff();
};

if (args.promote && !fs.existsSync(currentDir)) {
  promote();
} else {
  run().catch((error) => { console.error(error); process.exit(1); });
}
