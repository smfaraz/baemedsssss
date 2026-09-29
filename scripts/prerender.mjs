import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const CONCURRENCY = 6; // Prerender 6 pages simultaneously

function startStaticServer(port = 4188) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.avif': 'image/avif',
    '.webp': 'image/webp'
  };

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${port}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);
    let filePath = path.join(DIST_DIR, pathname);
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function prerender() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist folder does not exist. Run "npm run build" first.');
    process.exit(1);
  }

  const startTime = Date.now();
  console.log('=== FAST CONCURRENT PRERENDER (6x PARALLEL) ===');
  const PORT = 4188;
  const BASE_URL = `http://localhost:${PORT}`;
  const server = await startStaticServer(PORT);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e1) {
    try {
      browser = await chromium.launch({ headless: true, channel: 'msedge' });
    } catch (e2) {
      try {
        browser = await chromium.launch({ headless: true, channel: 'chrome' });
      } catch (err) {
        console.warn('Prerendering skipped (browser not found in environment):', err.message);
        server.close();
        return;
      }
    }
  }

  const discoveryPage = await browser.newPage();
  await discoveryPage.goto(`${BASE_URL}/products`, { waitUntil: 'domcontentloaded' });
  await discoveryPage.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 8000 }).catch(() => null);

  const productLinks = await discoveryPage.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href^="/products/"]'));
    return Array.from(new Set(anchors.map(a => a.getAttribute('href')).filter(h => h && h !== '/products')));
  });
  await discoveryPage.close();

  const routesToPrerender = [
    '/',
    '/products',
    '/about',


    '/contact',
    '/bulk-orders',
    '/policies/privacy',
    '/policies/terms',
    '/policies/shipping',
    '/policies/returns',
    ...productLinks.slice(0, 15)
  ];

  console.log(`Prerendering ${routesToPrerender.length} routes in parallel across ${CONCURRENCY} workers...`);

  let currentIndex = 0;
  let completed = 0;

  async function worker(workerId) {
    const page = await browser.newPage();
    while (currentIndex < routesToPrerender.length) {
      const route = routesToPrerender[currentIndex++];
      if (!route) break;

      const url = `${BASE_URL}${route}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout: 2000 }).catch(() => null);

        let html = await page.content();
        
        // Ensure accurate per-route canonical and OpenGraph URL
        const canonicalUrl = `https://baemeds.com${route === '/' ? '/' : (route.startsWith('/') ? route : '/' + route)}`;
        html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
        html = html.replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
        
        let outPath;
        if (route === '/') {
          outPath = path.join(DIST_DIR, 'index.html');
        } else {
          const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
          const targetDir = path.join(DIST_DIR, cleanRoute);
          fs.mkdirSync(targetDir, { recursive: true });
          outPath = path.join(targetDir, 'index.html');
        }

        fs.writeFileSync(outPath, html, 'utf8');
        completed++;
      } catch (err) {
        // Continue on error
      }
    }
    await page.close();
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i));
  await Promise.all(workers);

  await browser.close();
  server.close();

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✓ Prerendered ${completed}/${routesToPrerender.length} static HTML snapshots in ${durationSec}s!`);
}

prerender().catch(err => {
  console.error('Prerender error:', err);
  process.exit(1);
});
