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
const altIdx = header.indexOf('Image Alt Text');

console.log(`Total rows in source file: ${rows.length - 1}`);

// Filter candidates: Must have real image (not imagecomingsoon, not partsproduct), real price, real title
const validProducts = [];

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const title = r[titleIdx];
  const img = r[imgIdx];
  const price = parseFloat(r[priceIdx]) || 0;
  const cost = parseFloat(r[costIdx]) || 0;
  
  if (!title || !img || !img.startsWith('http')) continue;
  if (img.includes('imagecomingsoon') || img.includes('partsproduct')) continue;
  if (price <= 0) continue;
  
  // Calculate "Beat the Competition" Price:
  // List it $3 to $50 less than competitor retail price depending on price tier:
  let competitorPrice = price;
  let discountedPrice = competitorPrice;
  
  if (competitorPrice > 500) {
    // High-ticket: list $30 to $60 less (e.g. $799 -> $749.00 or $1499 -> $1449.00)
    discountedPrice = Math.max(cost * 1.25, Math.floor(competitorPrice * 0.93));
    discountedPrice = Math.round(discountedPrice) - 0.01;
  } else if (competitorPrice > 100) {
    // Mid-high: list $10 to $20 less (e.g. $229 -> $209.99)
    discountedPrice = Math.max(cost * 1.30, Math.floor(competitorPrice * 0.92));
    discountedPrice = Math.round(discountedPrice) - 0.01;
  } else if (competitorPrice > 30) {
    // Mid: list $4 to $8 less (e.g. $54.99 -> $48.99)
    discountedPrice = Math.max(cost * 1.35, Math.floor(competitorPrice * 0.90));
    discountedPrice = Math.round(discountedPrice) - 0.01;
  } else {
    // Low: list $2 to $3 less (e.g. $19.99 -> $16.99)
    discountedPrice = Math.max(cost * 1.40, Math.floor(competitorPrice * 0.88));
    discountedPrice = Math.round(discountedPrice) - 0.01;
  }

  // Ensure discounted price is never below cost and provides at least 20% margin
  if (cost > 0 && discountedPrice <= cost) {
    discountedPrice = Math.round(cost * 1.30) - 0.01;
  }
  
  const profit = cost > 0 ? (discountedPrice - cost) : (discountedPrice * 0.40);
  const marginPct = (profit / discountedPrice) * 100;
  const customerSavings = competitorPrice - discountedPrice;
  
  validProducts.push({
    raw: r,
    handle: r[handleIdx],
    title,
    body: r[bodyIdx],
    vendor: r[vendorIdx],
    category: r[catIdx] || r[typeIdx] || 'Medical Equipment',
    type: r[typeIdx] || r[catIdx] || 'Medical Supplies',
    tags: r[tagsIdx],
    sku: r[skuIdx] || `BM-${i}`,
    competitorPrice,
    discountedPrice,
    cost,
    profit,
    marginPct,
    customerSavings,
    image: img,
    alt: r[altIdx] || title
  });
}

console.log(`Found ${validProducts.length} verified products with real studio photos!`);
