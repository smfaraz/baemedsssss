import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATALOG_JSON_PATH = path.resolve(__dirname, '../data/catalog_seed.json');
const OUTPUT_CSV_PATH = path.resolve(__dirname, '../data/baemeds_all_products_master.csv');
const OUTPUT_PUBLIC_CSV_PATH = path.resolve(__dirname, '../public/baemeds_all_products_master.csv');

function escapeCsv(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Strip control characters that could break CSV parsing
  str = str.replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
  // Double quote any quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

function runExport() {
  console.log('Reading master catalog seed from:', CATALOG_JSON_PATH);
  const rawData = fs.readFileSync(CATALOG_JSON_PATH, 'utf8');
  const products = JSON.parse(rawData);
  console.log(`Found ${products.length} products to export.`);

  const headers = [
    'Product ID',
    'Handle',
    'Product URL',
    'Title',
    'Category',
    'Vendor / Brand',
    'Price (USD)',
    'Compare At Price (USD)',
    'Wholesale Cost (USD)',
    'SKU',
    'Barcode / UPC',
    'HCPCS Code',
    'FDA Classification',
    'Prescription Required',
    'FSA / HSA Eligible',
    'In Stock',
    'Inventory Quantity',
    'Weight (lbs)',
    'Rating',
    'Review Count',
    'Warranty',
    'Primary Image URL',
    'Additional Images',
    'Tags',
    'Specifications Summary',
    'Description (Plain Text)',
    'Description (HTML)'
  ];

  const rows = [headers.map(escapeCsv).join(',')];

  for (const p of products) {
    const handle = p.handle || p.id;
    const productUrl = `https://baemeds.com/products/${handle}`;
    const galleryImages = Array.isArray(p.images) ? p.images.filter(img => img && img !== p.image).join('; ') : '';
    const tagsStr = Array.isArray(p.tags) ? p.tags.join(', ') : '';
    const plainDesc = stripHtml(p.description || '');

    const row = [
      escapeCsv(p.id),
      escapeCsv(handle),
      escapeCsv(productUrl),
      escapeCsv(p.title),
      escapeCsv(p.category),
      escapeCsv(p.vendor),
      escapeCsv(typeof p.price === 'number' ? p.price.toFixed(2) : p.price),
      escapeCsv(p.compareAtPrice ? (typeof p.compareAtPrice === 'number' ? p.compareAtPrice.toFixed(2) : p.compareAtPrice) : ''),
      escapeCsv(p.wholesaleCost ? (typeof p.wholesaleCost === 'number' ? p.wholesaleCost.toFixed(2) : p.wholesaleCost) : ''),
      escapeCsv(p.sku || ''),
      escapeCsv(p.barcode || ''),
      escapeCsv(p.hcpcsCode || ''),
      escapeCsv(p.fdaClassification || ''),
      escapeCsv(p.requiresPrescription || p.prescriptionRequired ? 'Yes' : 'No'),
      escapeCsv(p.fsaEligible || p.eligibleFsaHsa ? 'Yes' : 'No'),
      escapeCsv(p.inStock ? 'Yes' : 'No'),
      escapeCsv(p.inventoryQuantity !== undefined ? p.inventoryQuantity : (p.inStock ? 50 : 0)),
      escapeCsv(p.weightLbs || ''),
      escapeCsv(p.rating || ''),
      escapeCsv(p.reviewCount || ''),
      escapeCsv(p.warranty || ''),
      escapeCsv(p.image || ''),
      escapeCsv(galleryImages),
      escapeCsv(tagsStr),
      escapeCsv(p.specs || ''),
      escapeCsv(plainDesc),
      escapeCsv(p.description || '')
    ];

    rows.push(row.join(','));
  }

  const csvContent = '\uFEFF' + rows.join('\r\n'); // UTF-8 BOM for seamless Excel compatibility

  fs.writeFileSync(OUTPUT_CSV_PATH, csvContent, 'utf8');
  console.log(`✓ Master CSV exported successfully to: ${OUTPUT_CSV_PATH} (${(fs.statSync(OUTPUT_CSV_PATH).size / (1024 * 1024)).toFixed(2)} MB)`);

  fs.writeFileSync(OUTPUT_PUBLIC_CSV_PATH, csvContent, 'utf8');
  console.log(`✓ Master CSV copied to public: ${OUTPUT_PUBLIC_CSV_PATH}`);
}

runExport();
