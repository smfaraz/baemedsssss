import fs from 'fs';
import path from 'path';
import https from 'https';

const catalogPath = path.resolve('./data/catalog_seed.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 100,
  timeout: 4000,
});

const SUFFIXES = [
  '',
  '_front',
  '_left',
  '_right',
  '_side',
  '_pdet',
  '_pkit',
  '_pkgfront',
  '_ppkgleft',
  '_ppkgright',
];

const KNOWN_SUFFIX_REGEX =
  /^(.+?)(?:_(front|left|right|side|back|top|pdet|pkit|pkgfront|ppkgleft|ppkgright|family|pkg))?\.(jpg|jpeg|png)$/i;

const urlCache = new Map();

async function checkUrl(url) {
  if (urlCache.has(url)) return urlCache.get(url);

  return new Promise((resolve) => {
    try {
      const req = https.request(
        url,
        {
          method: 'HEAD',
          agent,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 3500,
        },
        (res) => {
          const len = parseInt(res.headers['content-length'] || '0', 10);
          const ok = res.statusCode === 200 && len > 1000;
          res.resume(); // Free the socket immediately back to the pool
          urlCache.set(url, ok);
          resolve(ok);
        }
      );

      req.on('timeout', () => {
        req.destroy();
        urlCache.set(url, false);
        resolve(false);
      });

      req.on('error', () => {
        urlCache.set(url, false);
        resolve(false);
      });

      req.end();
    } catch {
      urlCache.set(url, false);
      resolve(false);
    }
  });
}

async function probeProduct(product) {
  if (!product.image) return;

  const currentImages = Array.isArray(product.images) && product.images.length > 0
    ? [...product.images]
    : [product.image];

  // Cloudfront oxygen concentrators
  if (product.image.includes('cloudfront.net')) {
    const cfMatch = product.image.match(/(.+\/images\/[a-z0-9-]+_)01_l\.png/i);
    if (cfMatch) {
      const base = cfMatch[1];
      for (const num of ['02', '03', '04']) {
        const candidate = `${base}${num}_l.png`;
        if (!currentImages.includes(candidate)) {
          const exists = await checkUrl(candidate);
          if (exists) currentImages.push(candidate);
        }
      }
      product.images = [...new Set(currentImages)];
    }
    return;
  }

  // McKesson Products
  if (product.image.includes('imgcdn.mckesson.com')) {
    const filename = product.image.split('/').pop().split('?')[0];
    const match = filename.match(KNOWN_SUFFIX_REGEX);
    if (!match) return;

    const base = match[1];
    const ext = match[3];

    const probePromises = SUFFIXES.map(async (suffix) => {
      const candidateUrl = `https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Zoom/${base}${suffix}.${ext}`;
      if (candidateUrl === product.image) return null;
      const exists = await checkUrl(candidateUrl);
      return exists ? candidateUrl : null;
    });

    const results = await Promise.all(probePromises);
    const validAngles = results.filter(Boolean);

    if (validAngles.length > 0) {
      const combined = [product.image, ...currentImages, ...validAngles];
      product.images = [...new Set(combined)];
    } else {
      product.images = [...new Set(currentImages)];
    }
  }
}

async function run() {
  console.log(`Starting Multi-Angle Scanner for ${catalog.length} products...`);
  console.log('Testing up to 10 standard camera angles per item using 100-socket HTTP pool.');

  const batchSize = 35;
  const startTime = Date.now();

  for (let i = 0; i < catalog.length; i += batchSize) {
    const batch = catalog.slice(i, i + batchSize);
    await Promise.all(batch.map(probeProduct));

    const processed = Math.min(i + batchSize, catalog.length);
    if (processed % 140 === 0 || processed >= catalog.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const multiCount = catalog
        .slice(0, processed)
        .filter((p) => p.images && p.images.length > 1).length;
      console.log(
        `[${processed} / ${catalog.length}] in ${elapsed}s | ${multiCount} products have multi-angle galleries`
      );

      // Incremental checkpoint save
      fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
    }
  }

  const withMulti = catalog.filter((p) => p.images && p.images.length > 1);
  const with3Plus = catalog.filter((p) => p.images && p.images.length >= 3);
  const with4Plus = catalog.filter((p) => p.images && p.images.length >= 4);

  let totalImagesFound = 0;
  catalog.forEach((p) => {
    if (Array.isArray(p.images)) totalImagesFound += p.images.length;
  });

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');

  console.log('\n=== MULTI-ANGLE DISCOVERY COMPLETE ===');
  console.log(`Total Products: ${catalog.length}`);
  console.log(`Products with Multi-Angle Galleries (2+ photos): ${withMulti.length}`);
  console.log(`Products with 3+ Photo Galleries: ${with3Plus.length}`);
  console.log(`Products with 4+ Photo Galleries: ${with4Plus.length}`);
  console.log(`Total Image Assets in Catalog: ${totalImagesFound}`);
  console.log(`Completed in ${((Date.now() - startTime) / 1000).toFixed(1)} seconds.`);
}

run().catch((err) => {
  console.error('Error running scanner:', err);
});
