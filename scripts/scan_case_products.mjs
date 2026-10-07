import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsDir = path.resolve(__dirname, '../products');
const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');

console.log('Loading catalog seed...');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const catalogMap = new Map();
for (const p of catalog) {
  if (p.mckessonItemNumber) catalogMap.set(String(p.mckessonItemNumber), p);
  if (p.sku) catalogMap.set(String(p.sku).replace(/^MCK-/, ''), p);
}

const csvFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.csv'));
console.log('CSV files found:', csvFiles);

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const caseItems = [];

for (const file of csvFiles) {
  const filePath = path.join(productsDir, file);
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) continue;

  const header = parseCsvLine(lines[0]);
  const skuIdx = header.findIndex(h => /sku|item/i.test(h));
  const titleIdx = header.findIndex(h => /name|title/i.test(h));
  const dealerIdx = header.findIndex(h => /dealer/i.test(h));
  const retailIdx = header.findIndex(h => /retail/i.test(h));
  const uomIdx = header.findIndex(h => /uom/i.test(h));
  const mfrIdx = header.findIndex(h => /manufacturer|mfr/i.test(h));

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 5) continue;
    const sku = row[skuIdx]?.replace(/"/g, '') || '';
    const title = row[titleIdx]?.replace(/"/g, '') || '';
    const uom = row[uomIdx]?.replace(/"/g, '') || '';
    const dealerStr = row[dealerIdx]?.replace(/["$,]/g, '') || '';
    const retailStr = row[retailIdx]?.replace(/["$,]/g, '') || '';
    const dealer = parseFloat(dealerStr) || 0;
    const retail = parseFloat(retailStr) || 0;

    if (uom && (uom.startsWith('CS/') || uom.startsWith('BX/') || uom.startsWith('PK/') || uom.startsWith('DZ/'))) {
      const parts = uom.split('/');
      const qty = parseInt(parts[1], 10);
      if (qty && qty > 1) {
        const inCatalog = catalogMap.get(sku);
        caseItems.push({
          file: file.replace('catalog_', '').replace('_extracted_2026-09-29.csv', ''),
          sku,
          title,
          uom,
          packQty: qty,
          dealerPrice: dealer,
          retailPrice: retail,
          inCatalog: !!inCatalog,
          catalogPrice: inCatalog?.price,
          catalogVariantsCount: inCatalog?.variants?.length || 0,
          catalogId: inCatalog?.id
        });
      }
    }
  }
}

console.log(`\nTotal case pack products in CSVs: ${caseItems.length}`);
console.log(`Matched in active catalog: ${caseItems.filter(c => c.inCatalog).length}`);

// Group by category/file
const byFile = {};
for (const item of caseItems) {
  if (!byFile[item.file]) byFile[item.file] = [];
  byFile[item.file].push(item);
}

for (const [f, items] of Object.entries(byFile)) {
  const matched = items.filter(x => x.inCatalog);
  console.log(`\n[${f}]: Total CS/BX items = ${items.length}, In Catalog = ${matched.length}`);
  
  // Show high value or breast pump / equipment items
  for (const item of items) {
    if (item.dealerPrice > 50 || f === 'breast_pump' || f === 'nebulizer' || f === 'bipap' || f === 'cpap' || f === 'blood_pressure_monitor' || f === 'pulse_oximeter') {
      const perUnitDealer = (item.dealerPrice / item.packQty).toFixed(2);
      console.log(`  SKU ${item.sku} | ${item.uom} | Total: $${item.dealerPrice.toFixed(2)} (Per Unit: $${perUnitDealer}) | ${item.title.slice(0, 50)} | InCatalog: ${item.inCatalog ? `YES (id: ${item.catalogId}, Price: $${item.catalogPrice})` : 'NO'}`);
    }
  }
}
