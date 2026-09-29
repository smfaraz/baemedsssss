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
  
  const profit = cost > 0 ? (discountedPrice - cost) : (discountedPrice * 0.40);
  const marginPct = (profit / discountedPrice) * 100;
  const customerSavings = competitorPrice - discountedPrice;
  
  validProducts.push({
    handle: r[handleIdx] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    title,
    body: r[bodyIdx] || `<p>${title}. High-quality durable medical equipment and supplies for home health and clinical care.</p>`,
    vendor: r[vendorIdx] || 'Drive Medical',
    category: r[catIdx] || r[typeIdx] || 'Medical Equipment',
    type: r[typeIdx] || r[catIdx] || 'Medical Supplies',
    tags: r[tagsIdx] || 'DME, Medical Equipment, Cash Pay, Fast Shipping',
    sku: r[skuIdx] || `BM-${1000 + i}`,
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

console.log(`Processing ${validProducts.length} verified products...`);

// 1. Build Shopify Import CSV
const shopifyHeaders = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker',
  'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service',
  'Variant Price', 'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
  'Variant Barcode', 'Image Src', 'Image Position', 'Image Alt Text', 'Cost per item', 'Status'
];

let shopifyCsv = shopifyHeaders.join(',') + '\n';
for (const p of validProducts) {
  const row = [
    `"${p.handle}"`,
    `"${p.title.replace(/"/g, '""')}"`,
    `"${p.body.replace(/"/g, '""')}"`,
    `"${p.vendor.replace(/"/g, '""')}"`,
    `"${p.category.replace(/"/g, '""')}"`,
    `"${p.type.replace(/"/g, '""')}"`,
    `"${p.tags.replace(/"/g, '""')}"`,
    'TRUE',
    'Title',
    'Default Title',
    `"${p.sku}"`,
    '1500',
    'shopify',
    '25',
    'deny',
    'manual',
    p.discountedPrice.toFixed(2),
    p.competitorPrice.toFixed(2),
    'TRUE',
    'TRUE',
    '',
    `"${p.image}"`,
    '1',
    `"${p.title.replace(/"/g, '""')}"`,
    p.cost > 0 ? p.cost.toFixed(2) : '',
    'active'
  ];
  shopifyCsv += row.join(',') + '\n';
}

fs.writeFileSync('BAEMEDS_500_BEST_PRODUCTS_SHOPIFY_IMPORT.csv', shopifyCsv, 'utf8');
console.log(`Successfully generated BAEMEDS_500_BEST_PRODUCTS_SHOPIFY_IMPORT.csv with ${validProducts.length} products!`);

// 2. Build Research Comparison Sheet
const researchHeaders = [
  'SKU', 'Product Title', 'Category', 'Manufacturer / Vendor',
  'Dealer Wholesale Cost ($)', 'Competitor Street Price ($)', 'BaeMeds Discounted Price ($)',
  'Customer Savings ($)', 'Net Profit ($)', 'Gross Margin (%)', 'Product Photo URL'
];

let researchCsv = researchHeaders.join(',') + '\n';
for (const p of validProducts) {
  const row = [
    `"${p.sku}"`,
    `"${p.title.replace(/"/g, '""')}"`,
    `"${p.type}"`,
    `"${p.vendor.replace(/"/g, '""')}"`,
    p.cost > 0 ? p.cost.toFixed(2) : 'N/A',
    p.competitorPrice.toFixed(2),
    p.discountedPrice.toFixed(2),
    p.customerSavings.toFixed(2),
    p.profit.toFixed(2),
    p.marginPct.toFixed(1) + '%',
    `"${p.image}"`
  ];
  researchCsv += row.join(',') + '\n';
}

fs.writeFileSync('BAEMEDS_500_BEST_PRODUCTS_RESEARCH_SHEET.csv', researchCsv, 'utf8');
console.log(`Successfully generated BAEMEDS_500_BEST_PRODUCTS_RESEARCH_SHEET.csv with ${validProducts.length} products!`);
