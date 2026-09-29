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
const titleIdx = header.indexOf('Title');
const priceIdx = header.indexOf('Variant Price');
const compareIdx = header.indexOf('Variant Compare At Price');
const costIdx = header.indexOf('Cost per item');
const imgIdx = header.indexOf('Image Src');

console.log('Sample pricing check (first 10 rows):');
for (let i = 1; i <= 10; i++) {
  const r = rows[i];
  console.log({
    title: r[titleIdx]?.substring(0, 40),
    price: r[priceIdx],
    compare: r[compareIdx],
    cost: r[costIdx],
    image: r[imgIdx]?.substring(0, 60)
  });
}
