import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.baemeds.com';
const BRAND = 'BaeMeds USA';

const escapeXml = (unsafe) => {
  return (unsafe || '')
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
};

const escapeCsv = (val) => {
  const str = String(val ?? '').replace(/"/g, '""');
  return `"${str}"`;
};

const getGoogleCategory = (cat) => {
  const norm = (cat || '').toLowerCase();
  if (norm.includes('respiratory') || norm.includes('cpap') || norm.includes('bipap') || norm.includes('nebulizer') || norm.includes('suction')) {
    return 'Health & Beauty > Health Care > Respiratory Care';
  }
  if (norm.includes('mobility') || norm.includes('wheelchair')) {
    return 'Health & Beauty > Health Care > Mobility & Accessibility';
  }
  if (norm.includes('monitor') || norm.includes('blood pressure') || norm.includes('glucometer') || norm.includes('pulse oximeter')) {
    return 'Health & Beauty > Health Care > Health Care Equipment > Medical Diagnostic Equipment';
  }
  return 'Health & Beauty > Health Care > Health Care Equipment';
};

const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');
const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Generate Google Merchant Center XML (Top 100 Flagship Heroes)
const heroProducts = products.filter(p => p.isHeroProduct);

const itemsXml = heroProducts.map((p) => {
  const id = p.id;
  const title = escapeXml(p.title);
  const description = escapeXml(p.specs || `${p.title} - Official DME Equipment`);
  const link = `${BASE_URL}/products/${p.handle || p.id}`;
  const imageLink = p.image || `${BASE_URL}/placeholder-dme.jpg`;
  const availability = 'in_stock';
  const price = `${Number(p.price || 0).toFixed(2)} USD`;
  const gpc = escapeXml(getGoogleCategory(p.category));
  const brand = escapeXml(p.vendor || BRAND);
  const mpn = escapeXml(p.sku || p.id);
  const mckNum = p.mckessonItemNumber ? `<g:custom_label_0>MCK_${escapeXml(p.mckessonItemNumber)}</g:custom_label_0>` : '';
  const heroTag = '<g:custom_label_1>TOP_100_HERO</g:custom_label_1>';
  const hcpcsTag = p.hcpcsCode ? `<g:custom_label_2>HCPCS_${escapeXml(p.hcpcsCode)}</g:custom_label_2>` : '';

  return `
    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${brand}</g:brand>
      <g:mpn>${mpn}</g:mpn>
      <g:google_product_category>${gpc}</g:google_product_category>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard Ground Delivery</g:service>
        <g:price>0.00 USD</g:price>
      </g:shipping>
      ${mckNum}
      ${heroTag}
      ${hcpcsTag}
    </item>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>BaeMeds USA - High-Quality Durable Medical Equipment</title>
    <link>${BASE_URL}</link>
    <description>Authoritative Google Shopping and Merchant Center product feed for BaeMeds USA certified medical devices.</description>
    ${itemsXml}
  </channel>
</rss>`;

// Generate Meta Catalog CSV
const headers = [
  'id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'link',
  'image_link',
  'brand',
  'google_product_category',
  'custom_label_0',
  'custom_label_1',
];

const rows = heroProducts.map((p) => {
  return [
    escapeCsv(p.id),
    escapeCsv(p.title),
    escapeCsv(p.specs || p.title),
    escapeCsv('in stock'),
    escapeCsv('new'),
    escapeCsv(`${Number(p.price || 0).toFixed(2)} USD`),
    escapeCsv(`${BASE_URL}/products/${p.handle || p.id}`),
    escapeCsv(p.image),
    escapeCsv(p.vendor || BRAND),
    escapeCsv(getGoogleCategory(p.category)),
    escapeCsv('TOP_100_HERO'),
    escapeCsv(p.mckessonItemNumber ? `MCK_${p.mckessonItemNumber}` : ''),
  ].join(',');
});

const csv = [headers.join(','), ...rows].join('\n');

fs.mkdirSync('./public/feeds', { recursive: true });
fs.writeFileSync('./public/feeds/google-merchant.xml', xml, 'utf8');
fs.writeFileSync('./public/feeds/meta-catalog.csv', csv, 'utf8');

console.log(`✓ Exported ${heroProducts.length} Hero Products to:`);
console.log(`  - public/feeds/google-merchant.xml (${xml.length} bytes)`);
console.log(`  - public/feeds/meta-catalog.csv (${csv.length} bytes)`);
