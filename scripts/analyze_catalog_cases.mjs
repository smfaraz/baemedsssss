import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsDir = path.resolve(__dirname, '../products');
const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const catalogMap = new Map();
for (const p of catalog) {
  if (p.mckessonItemNumber) catalogMap.set(String(p.mckessonItemNumber), p);
  if (p.sku) catalogMap.set(String(p.sku).replace(/^MCK-/, ''), p);
}

const csvFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.csv'));

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

const criticalFindings = [];

for (const file of csvFiles) {
  const filePath = path.join(productsDir, file);
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) continue;

  const header = parseCsvLine(lines[0]);
  const skuIdx = header.findIndex(h => /sku|item/i.test(h));
  const titleIdx = header.findIndex(h => /name|title/i.test(h));
  const dealerIdx = header.findIndex(h => /dealer/i.test(h));
  const uomIdx = header.findIndex(h => /uom/i.test(h));

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 5) continue;
    const sku = row[skuIdx]?.replace(/"/g, '') || '';
    const uom = row[uomIdx]?.replace(/"/g, '') || '';
    const dealerStr = row[dealerIdx]?.replace(/["$,]/g, '') || '';
    const dealer = parseFloat(dealerStr) || 0;

    if (uom && (uom.startsWith('CS/') || uom.startsWith('BX/') || uom.startsWith('PK/'))) {
      const parts = uom.split('/');
      const qty = parseInt(parts[1], 10);
      if (qty && qty > 1) {
        const catItem = catalogMap.get(sku);
        if (catItem) {
          criticalFindings.push({
            category: file.replace('catalog_', '').replace('_extracted_2026-09-29.csv', ''),
            sku,
            id: catItem.id,
            title: catItem.title,
            uom,
            packQty: qty,
            dealerPrice: dealer,
            catalogPrice: catItem.price,
            hasVariants: !!(catItem.variants && catItem.variants.length > 1),
            perUnitWholesale: (dealer / qty).toFixed(2),
            perUnitDivisionRetail: (catItem.price / qty).toFixed(2),
          });
        }
      }
    }
  }
}

// Focus on DME Devices & High-impact items first
const keyCategories = ['breast_pump', 'nebulizer', 'suction_ma', 'pulse_oximeter', 'cpap', 'blood_pressure_monitor'];

console.log('=== KEY MEDICAL DEVICES & DIAGNOSTICS WITH CASE PRICING ===');
const deviceMatches = criticalFindings.filter(x => keyCategories.includes(x.category));
for (const item of deviceMatches) {
  console.log(`\nCategory: [${item.category.toUpperCase()}] | SKU: ${item.sku} | ID: ${item.id} | UOM: ${item.uom}`);
  console.log(`  Title: ${item.title}`);
  console.log(`  Case Catalog Price: $${item.catalogPrice} | Case Dealer Cost: $${item.dealerPrice}`);
  console.log(`  => Single Unit Division: $${item.perUnitDivisionRetail} retail | $${item.perUnitWholesale} wholesale | Has Variants: ${item.hasVariants}`);
}

console.log('\n=== HIGH TICKET MOBILITY & REHAB EQUIPMENT WITH CASE PRICING (Catalog Price > $150) ===');
const mobilityMatches = criticalFindings.filter(x => !keyCategories.includes(x.category) && x.catalogPrice >= 150);
for (const item of mobilityMatches) {
  console.log(`\nCategory: [${item.category.toUpperCase()}] | SKU: ${item.sku} | ID: ${item.id} | UOM: ${item.uom}`);
  console.log(`  Title: ${item.title}`);
  console.log(`  Case Catalog Price: $${item.catalogPrice} | Case Dealer Cost: $${item.dealerPrice}`);
  console.log(`  => Single Unit Division: $${item.perUnitDivisionRetail} retail | $${item.perUnitWholesale} wholesale`);
}
