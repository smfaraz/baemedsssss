import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://www.baemeds.com';

async function crawl() {
  console.log(`Connecting to ${SITE}...`);
  const pagesToVisit = [
    '/',
    '/products',
    '/about',
    '/contact',
  ];

  const foundImages = new Set();

  for (const page of pagesToVisit) {
    try {
      const url = `${SITE}${page}`;
      console.log(`Fetching ${url}...`);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!res.ok) {
        console.warn(`Failed ${url}: ${res.status}`);
        continue;
      }
      const html = await res.text();
      // Match full URLs
      const fullMatches = html.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|avif)/gi) || [];
      fullMatches.forEach((m) => foundImages.add(m));

      // Match relative URLs
      const relMatches = html.match(/(?:src|href)=["']([^"']+\.(?:jpg|jpeg|png|webp|avif))["']/gi) || [];
      relMatches.forEach((m) => {
        const clean = m.replace(/^(src|href)=["']/i, '').replace(/["']$/i, '');
        if (clean.startsWith('http')) {
          foundImages.add(clean);
        } else if (clean.startsWith('/')) {
          foundImages.add(`${SITE}${clean}`);
        }
      });
    } catch (err) {
      console.error(`Error on ${page}:`, err.message);
    }
  }

  // Also check sitemap.xml
  try {
    const sitemapRes = await fetch(`${SITE}/sitemap.xml`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    if (sitemapRes.ok) {
      const xml = await sitemapRes.text();
      const imgMatches = xml.match(/<image:loc>([^<]+)<\/image:loc>/gi) || [];
      console.log(`Found ${imgMatches.length} images in sitemap.xml`);
      imgMatches.forEach((tag) => {
        const url = tag.replace(/<\/?image:loc>/gi, '').trim();
        foundImages.add(url);
      });
    }
  } catch (err) {
    console.warn('Sitemap check failed:', err.message);
  }

  console.log(`\nTotal unique image URLs discovered: ${foundImages.size}`);
  const list = Array.from(foundImages);
  console.log('Sample images:');
  list.slice(0, 30).forEach((img) => console.log(' •', img));

  fs.writeFileSync('scripts/baemeds_live_images.json', JSON.stringify(list, null, 2), 'utf8');
}

crawl().catch(console.error);
