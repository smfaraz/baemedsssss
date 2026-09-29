import fs from 'fs';

function parseCSV(text) {
  const lines = text.split('\n');
  const result = [];
  let cur = [];
  let cell = '';
  let inQuotes = false;
  
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i+1] === '"') { cell += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        cur.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    if (!inQuotes) {
      cur.push(cell.trim());
      cell = '';
      if (cur.length > 1) result.push(cur);
      cur = [];
    } else {
      cell += '\n';
    }
  }
  return result;
}

const file = 'c:\\Users\\FARAAZ\\Downloads\\shopify_products_import_2026-09-27_cleaned.csv';
const rows = parseCSV(fs.readFileSync(file, 'utf8'));
const header = rows[0];

const handleIdx = header.indexOf('Handle');
const titleIdx = header.indexOf('Title');
const bodyIdx = header.indexOf('Body (HTML)');
const vendorIdx = header.indexOf('Vendor');
const catIdx = header.indexOf('Product Category');
const typeIdx = header.indexOf('Type');
const tagsIdx = header.indexOf('Tags');
const skuIdx = header.indexOf('Variant SKU');
const priceIdx = header.indexOf('Variant Price');
const compareIdx = header.indexOf('Variant Compare At Price');
const costIdx = header.indexOf('Cost per item');
const imgIdx = header.indexOf('Image Src');

const products = [];
let index = 1000;

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const title = r[titleIdx];
  const img = r[imgIdx];
  const price = parseFloat(r[priceIdx]) || 0;
  const cost = parseFloat(r[costIdx]) || 0;
  
  if (!title || !img || !img.startsWith('http')) continue;
  if (img.includes('imagecomingsoon') || img.includes('partsproduct')) continue;
  if (price <= 0) continue;
  
  index++;
  let competitorPrice = price;
  let discountedPrice = competitorPrice;
  
  if (competitorPrice > 500) {
    discountedPrice = Math.max(cost * 1.25, Math.floor(competitorPrice * 0.93));
    discountedPrice = Math.round(discountedPrice) - 0.01;
  } else if (competitorPrice > 100) {
    discountedPrice = Math.max(cost * 1.30, Math.floor(competitorPrice * 0.92));
    discountedPrice = Math.round(discountedPrice) - 0.01;
  } else if (competitorPrice > 30) {
    discountedPrice = Math.max(cost * 1.35, Math.floor(competitorPrice * 0.90));
    discountedPrice = Math.round(discountedPrice) - 0.01;
  } else {
    discountedPrice = Math.max(cost * 1.40, Math.floor(competitorPrice * 0.88));
    discountedPrice = Math.round(discountedPrice) - 0.01;
  }

  if (cost > 0 && discountedPrice <= cost) {
    discountedPrice = Math.round(cost * 1.30) - 0.01;
  }

  const handle = r[handleIdx] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const category = r[typeIdx] || r[catIdx] || 'Medical Equipment';
  const vendor = r[vendorIdx] || 'Drive Medical';
  const sku = r[skuIdx] || `BM-${index}`;
  const isRx = /concentrator|bipap|cpap|suction machine/i.test(title);

  products.push({
    id: `gid://shopify/Product/us-${index}`,
    handle,
    title,
    vendor,
    category,
    price: discountedPrice,
    compareAtPrice: competitorPrice,
    image: img,
    images: [img],
    tags: [
      vendor,
      category,
      'US Nationwide Delivery',
      'HSA/FSA Eligible',
      'Verified Supplier',
      isRx ? 'Rx Required' : 'OTC - No Prescription Required'
    ],
    specs: `${title}. Genuine hospital-grade equipment distributed by McKesson / Lake Court Medical.`,
    inStock: true,
    variantId: `gid://shopify/ProductVariant/us-var-${index}`,
    description: r[bodyIdx] || `<p>${title}. Premium durable medical equipment designed for safety, longevity, and clinical compliance.</p>`,
    warranty: '1 to 5 Years Limited Manufacturer Warranty',
    requiresPrescription: isRx,
    prescriptionRequired: isRx,
    fsaEligible: true,
    eligibleFsaHsa: true,
    fdaClassification: isRx ? 'Class II' : 'Class I / Exempt',
    isRegulatoryVerified: true,
    weightLbs: 5,
    seo: {
      title: `${title} | BaeMeds Medical Supply`,
      description: `Buy ${title} online at BaeMeds. Fast US nationwide delivery, competitive retail pricing, FSA/HSA eligible.`
    },
    metafields: [
      { namespace: 'custom', key: 'sku', value: sku },
      { namespace: 'custom', key: 'dealer_cost', value: cost > 0 ? cost.toFixed(2) : 'N/A' },
      { namespace: 'custom', key: 'customer_savings', value: (competitorPrice - discountedPrice).toFixed(2) }
    ],
    youtubeVideos: []
  });
}

console.log(`Writing ${products.length} products to data/catalog_seed.json...`);
fs.writeFileSync('data/catalog_seed.json', JSON.stringify(products, null, 2), 'utf8');
console.log('Successfully updated data/catalog_seed.json!');
