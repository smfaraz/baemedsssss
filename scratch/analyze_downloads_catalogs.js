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
      if (cur.length > 1 || (cur.length === 1 && cur[0] !== '')) {
        result.push(cur);
      }
      cur = [];
    } else {
      cell += '\n';
    }
  }
  return result;
}

const p1 = 'c:\\Users\\FARAAZ\\Downloads\\products_export_1.csv';
const p2 = 'c:\\Users\\FARAAZ\\Downloads\\shopify_products_import_2026-09-27_cleaned.csv';
const p3 = 'c:\\Users\\FARAAZ\\Downloads\\wheelchair.csv';
const p4 = 'c:\\Users\\FARAAZ\\Downloads\\bp monitor.csv';
const p5 = 'c:\\Users\\FARAAZ\\Downloads\\catalog_briefs_extracted_2026-09-15.csv';
const p6 = 'c:\\Users\\FARAAZ\\Downloads\\catalog_oxygen_concentrators_2026-09-07.csv';

[p1, p2, p3, p4, p5, p6].forEach(p => {
  if (fs.existsSync(p)) {
    const data = parseCSV(fs.readFileSync(p, 'utf8'));
    console.log(p.split('\\').pop(), 'Rows:', data.length, 'Header len:', data[0]?.length);
  }
});
