import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');
const backupPath = path.resolve(__dirname, '../data/catalog_seed.json.bak_before_cases');

console.log('Reading catalog seed from:', catalogPath);
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Backup first if not exists
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(catalogPath, backupPath);
  console.log('Created backup at:', backupPath);
}

const productsDir = path.resolve(__dirname, '../products');
const allCsvs = fs.readdirSync(productsDir).filter(f => f.endsWith('.csv'));

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else current += ch;
  }
  result.push(current.trim());
  return result;
}

// Map CSV CS/ items by SKU
const csvCaseMap = new Map();

for (const file of allCsvs) {
  const filePath = path.join(productsDir, file);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  if (lines.length < 2) continue;
  const header = parseCsvLine(lines[0]);
  const skuIdx = header.findIndex(h => /sku|item/i.test(h));
  const uomIdx = header.findIndex(h => /uom/i.test(h));
  const dealerIdx = header.findIndex(h => /dealer/i.test(h));

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 5) continue;
    const sku = row[skuIdx]?.replace(/"/g, '') || '';
    const uom = row[uomIdx]?.replace(/"/g, '') || '';
    const dealer = parseFloat(row[dealerIdx]?.replace(/["$,]/g, '') || '') || 0;

    if (uom && uom.startsWith('CS/')) {
      const parts = uom.split('/');
      const qty = parseInt(parts[1], 10);
      if (qty && qty > 1 && !csvCaseMap.has(sku)) {
        csvCaseMap.set(sku, {
          sku,
          uom,
          qty,
          dealerCost: dealer,
          file: file.replace('catalog_', '').replace('_extracted_2026-09-29.csv', '')
        });
      }
    }
  }
}

console.log(`Loaded ${csvCaseMap.size} CS items from source CSVs.`);

function calculateSingleUnitPrice(casePrice, caseCost, qty) {
  const rawDividedPrice = casePrice / qty;
  const unitCost = caseCost / qty;

  // Retail markup: 18-22% increase over raw division, but ensuring at least 22% margin over cost
  const markupOverDiv = rawDividedPrice * 1.20;
  const markupOverCost = unitCost / 0.78; // 22% margin

  let targetPrice = Math.max(markupOverDiv, markupOverCost);

  // Round to realistic retail .99 cents
  if (targetPrice < 5) {
    targetPrice = Math.ceil(targetPrice) - 0.01;
    if (targetPrice < unitCost * 1.15) targetPrice = Math.ceil(targetPrice + 1) - 0.01;
  } else if (targetPrice < 20) {
    targetPrice = Math.ceil(targetPrice) - 0.01;
  } else {
    targetPrice = Math.ceil(targetPrice) - 0.01;
  }
  targetPrice = Number(targetPrice.toFixed(2));

  // Single unit compareAtPrice (MSRP): ~28-30% higher than selling price
  let singleCompareAt = Number((targetPrice / 0.72).toFixed(2));
  singleCompareAt = Math.ceil(singleCompareAt) - 0.01;

  return {
    rawDividedPrice: Number(rawDividedPrice.toFixed(2)),
    unitCost: Number(unitCost.toFixed(2)),
    singlePrice: targetPrice,
    singleCompareAt: Number(singleCompareAt.toFixed(2))
  };
}

let updatedCount = 0;
const updatedSummaryByCategory = {};

for (let i = 0; i < catalog.length; i++) {
  const p = catalog[i];
  const itemNo = p.mckessonItemNumber ? String(p.mckessonItemNumber) : '';
  const skuClean = p.sku ? String(p.sku).replace(/^MCK-/, '') : '';

  const match = csvCaseMap.get(itemNo) || csvCaseMap.get(skuClean);
  if (!match) continue;

  // If already configured like Zomee Z2 with >1 variants, preserve or verify
  if (p.variants && p.variants.length > 1 && p.id === 'prd-1181796') {
    updatedCount++;
    continue;
  }

  const casePrice = p.price;
  const caseCost = match.dealerCost || p.wholesaleCost || (casePrice * 0.8);
  const caseCompareAt = p.compareAtPrice || Number((casePrice / 0.72).toFixed(2));
  const qty = match.qty;

  const { singlePrice, singleCompareAt, unitCost } = calculateSingleUnitPrice(casePrice, caseCost, qty);

  const skuCode = p.sku || `MCK-${match.sku}`;
  const baseImg = p.image || 'https://placehold.co/600x600?text=DME';

  const singleVariant = {
    id: `var-${p.id.replace(/^prd-/, '')}-ea1`,
    title: 'Single Unit (1 Each / EA 1)',
    size: 'Single Unit (EA 1)',
    packageQuantity: '1 Each',
    price: singlePrice,
    compareAtPrice: singleCompareAt,
    wholesaleCost: unitCost,
    dealerPrice: unitCost,
    sku: `${skuCode}-EA1`,
    inStock: p.inStock !== false,
    inventoryQuantity: p.inventoryQuantity || 25,
    image: baseImg
  };

  const caseVariant = {
    id: `var-${p.id.replace(/^prd-/, '')}-cs${qty}`,
    title: `Case Pack (Case of ${qty} / CS ${qty})`,
    size: `Case of ${qty} (CS/${qty})`,
    packageQuantity: `Case of ${qty}`,
    price: casePrice,
    compareAtPrice: caseCompareAt,
    wholesaleCost: Number(caseCost.toFixed(2)),
    dealerPrice: Number(caseCost.toFixed(2)),
    sku: `${skuCode}-CS${qty}`,
    inStock: p.inStock !== false,
    inventoryQuantity: Math.max(5, Math.floor((p.inventoryQuantity || 25) / 2)),
    image: baseImg
  };

  // Update base product
  p.price = singlePrice;
  p.compareAtPrice = singleCompareAt;
  p.wholesaleCost = unitCost;
  p.costPerItem = unitCost;
  p.dealerPrice = unitCost;
  p.variantId = singleVariant.id;
  p.selectedVariantId = singleVariant.id;
  p.variants = [singleVariant, caseVariant];

  // Update specs and features if not already mentioning options
  if (p.specs && !p.specs.includes('Single Unit')) {
    p.specs = `${p.specs.trim()} Available in Single Unit (EA 1) or Clinic Case Pack (CS/${qty}).`;
  }
  if (Array.isArray(p.features) && !p.features.some(f => f.includes('Single Unit'))) {
    p.features = [`Available in Single Unit (EA 1) and Case of ${qty} (CS/${qty})`, ...p.features];
  }

  catalog[i] = p;
  updatedCount++;

  const cat = match.file;
  updatedSummaryByCategory[cat] = (updatedSummaryByCategory[cat] || 0) + 1;
}

console.log(`\nSuccessfully updated ${updatedCount} case products in catalog!`);
console.log('Category breakdown:', updatedSummaryByCategory);

// Write back to catalog_seed.json
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Saved catalog_seed.json successfully.');

// Also update Meta Catalog CSV and Google Merchant XML where these products appear
const metaPath = path.resolve(__dirname, '../public/feeds/meta-catalog.csv');
if (fs.existsSync(metaPath)) {
  let metaContent = fs.readFileSync(metaPath, 'utf8');
  for (const p of catalog) {
    if (p.variants && p.variants.length > 1) {
      // Find row for this product ID
      const regex = new RegExp(`("${p.id}",[^,]+,[^,]+,[^,]+,[^,]+,")[^"]+(".*)`, 'g');
      metaContent = metaContent.replace(regex, `$1${p.price.toFixed(2)} USD$2`);
    }
  }
  fs.writeFileSync(metaPath, metaContent, 'utf8');
  console.log('Updated public/feeds/meta-catalog.csv with new single unit starting prices.');
}

const gMerchantPath = path.resolve(__dirname, '../public/feeds/google-merchant.xml');
if (fs.existsSync(gMerchantPath)) {
  let gContent = fs.readFileSync(gMerchantPath, 'utf8');
  for (const p of catalog) {
    if (p.variants && p.variants.length > 1) {
      const gRegex = new RegExp(`(<g:id>${p.id}</g:id>[\\s\\S]*?<g:price>)[^<]+(</g:price>)`, 'g');
      gContent = gContent.replace(gRegex, `$1${p.price.toFixed(2)} USD$2`);
    }
  }
  fs.writeFileSync(gMerchantPath, gContent, 'utf8');
  console.log('Updated public/feeds/google-merchant.xml with new single unit starting prices.');
}
