import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalog = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/catalog_seed.json'), 'utf8'));
const catalogMap = new Map();
for (const p of catalog) {
  if (p.mckessonItemNumber) catalogMap.set(String(p.mckessonItemNumber), p);
  if (p.sku) catalogMap.set(String(p.sku).replace(/^MCK-/, ''), p);
}

const keyFiles = [
  'catalog_breast_pump_extracted_2026-09-29.csv',
  'catalog_nebulizer_extracted_2026-09-29.csv',
  'catalog_blood_pressure_monitor_extracted_2026-09-29.csv',
  'catalog_pulse_oximeter_extracted_2026-09-29.csv',
  'catalog_suction_ma_extracted_2026-09-29.csv',
  'catalog_cpap_extracted_2026-09-29.csv',
  'catalog_bipap_extracted_2026-09-29.csv'
];

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

for (const file of keyFiles) {
  const filePath = path.resolve(__dirname, '../products', file);
  if (!fs.existsSync(filePath)) continue;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  const skuIdx = header.findIndex(h => /sku|item/i.test(h));
  const titleIdx = header.findIndex(h => /name|title/i.test(h));
  const dealerIdx = header.findIndex(h => /dealer/i.test(h));
  const uomIdx = header.findIndex(h => /uom/i.test(h));

  const list = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length < 5) continue;
    const sku = row[skuIdx]?.replace(/"/g, '') || '';
    const uom = row[uomIdx]?.replace(/"/g, '') || '';
    const dealer = parseFloat(row[dealerIdx]?.replace(/["$,]/g, '') || '') || 0;
    
    if (uom && (uom.startsWith('CS/') || uom.startsWith('BX/') || uom.startsWith('PK/'))) {
      const qty = parseInt(uom.split('/')[1], 10);
      if (qty > 1) {
        const cat = catalogMap.get(sku);
        if (cat) {
          list.push({
            id: cat.id,
            sku,
            uom,
            qty,
            title: cat.title,
            catalogPrice: cat.price,
            dealerCost: dealer,
            hasVariants: !!(cat.variants && cat.variants.length > 1),
            perUnitCost: (dealer / qty).toFixed(2),
            perUnitRawRetail: (cat.price / qty).toFixed(2)
          });
        }
      }
    }
  }
  console.log(`\n=================== FILE: ${file} (Found: ${list.length} products) ===================`);
  for (const item of list) {
    console.log(`* [${item.id}] SKU: ${item.sku} | UOM: ${item.uom} | Catalog Price: $${item.catalogPrice} | Per-Unit Retail: $${item.perUnitRawRetail}`);
    console.log(`  Title: ${item.title}`);
    console.log(`  Case Wholesale: $${item.dealerCost} | Per-Unit Wholesale Cost: $${item.perUnitCost} | HasVariants: ${item.hasVariants}`);
  }
}
