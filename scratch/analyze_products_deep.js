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
        if (inQuotes && line[i+1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
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
      if (cur.length > 1) {
        result.push(cur);
      }
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
const vendorIdx = header.indexOf('Vendor');
const catIdx = header.indexOf('Product Category');
const typeIdx = header.indexOf('Type');

const vendors = new Map();
const types = new Map();
for (let i = 1; i < rows.length; i++) {
  const v = rows[i][vendorIdx] || 'Unknown';
  const t = rows[i][typeIdx] || rows[i][catIdx] || 'General';
  vendors.set(v, (vendors.get(v) || 0) + 1);
  types.set(t, (types.get(t) || 0) + 1);
}

console.log('Vendors breakdown:');
for (const [v, c] of vendors.entries()) {
  console.log(`- ${v}: ${c} products`);
}

console.log('\nTop 15 Types:');
const sortedTypes = Array.from(types.entries()).sort((a,b) => b[1] - a[1]);
for (const [t, c] of sortedTypes.slice(0, 15)) {
  console.log(`- ${t}: ${c} products`);
}
