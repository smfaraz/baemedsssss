import fs from 'fs';

const files = [
  'catalog_suction_ma_extracted_2026-09-29.csv',
  'catalog_wheel_extracted_2026-09-29.csv',
  'catalog_blood_glucose_extracted_2026-09-29.csv',
  'catalog_blood_pressure_monitor_extracted_2026-09-29.csv',
  'catalog_bipap_extracted_2026-09-29.csv',
  'catalog_pulse_oximeter_extracted_2026-09-29.csv',
  'catalog_nebulizer_extracted_2026-09-29.csv',
  'catalog_cpap_extracted_2026-09-29.csv'
];

function parseCSVLine(text) {
  let inQuotes = false;
  let cur = '';
  let arr = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      arr.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  arr.push(cur.trim());
  return arr;
}

let totalRows = 0;
let withImg = 0;
let withPrice = 0;
let mfrs = new Map();
let catBreakdown = {};
let sampleProducts = [];

for (const f of files) {
  const p = 'C:/Users/FARAAZ/Downloads/' + f;
  if (!fs.existsSync(p)) continue;
  const raw = fs.readFileSync(p, 'utf8').split('\n').filter(l => l.trim().length > 0);
  const header = parseCSVLine(raw[0]);
  const imgIdx = header.indexOf('Image URL');
  const priceIdx = header.indexOf('Dealer Price');
  const retailIdx = header.indexOf('Retail Price');
  const mfrIdx = header.indexOf('Manufacturer');
  const catIdx = header.indexOf('Category');
  const titleIdx = header.indexOf('Product Name');
  const skuIdx = header.indexOf('SKU');
  
  const catName = f.replace('catalog_', '').replace('_extracted_2026-09-29.csv', '');
  
  for (let i = 1; i < raw.length; i++) {
    const row = parseCSVLine(raw[i]);
    if (row.length < 5) continue;
    totalRows++;
    const img = row[imgIdx];
    const dealerP = parseFloat((row[priceIdx] || '').replace('$', '').replace(/,/g, '')) || 0;
    const retailP = parseFloat((row[retailIdx] || '').replace('$', '').replace(/,/g, '')) || 0;
    const mfr = row[mfrIdx] || 'Unknown';
    const title = row[titleIdx] || '';
    const sku = row[skuIdx] || '';
    
    const hasValidImg = img && img.startsWith('http') && !img.includes('placeholder') && !img.includes('no-image');
    if (hasValidImg) withImg++;
    if (dealerP > 0 || retailP > 0) withPrice++;
    mfrs.set(mfr, (mfrs.get(mfr) || 0) + 1);
    catBreakdown[catName] = (catBreakdown[catName] || 0) + 1;

    if (hasValidImg && (dealerP > 0 || retailP > 0) && sampleProducts.length < 5) {
      sampleProducts.push({ cat: catName, title: title.slice(0, 50), mfr, dealerP, retailP, img: img.slice(0, 60) });
    }
  }
}

console.log('Total Products Extracted:', totalRows);
console.log('With valid image:', withImg, `(${Math.round(withImg/totalRows*100)}%)`);
console.log('With pricing info:', withPrice, `(${Math.round(withPrice/totalRows*100)}%)`);
console.log('Unique Manufacturers:', mfrs.size);
console.log('\nTop 10 Manufacturers:');
[...mfrs.entries()].sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([m, c]) => console.log(`  ${m}: ${c}`));
console.log('\nCategory Counts:');
for (const [k, v] of Object.entries(catBreakdown)) {
  console.log(`  ${k}: ${v}`);
}
console.log('\nSamples:');
console.log(sampleProducts);
