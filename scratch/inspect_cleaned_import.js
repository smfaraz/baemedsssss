import fs from 'fs';

const text = fs.readFileSync('c:\\Users\\FARAAZ\\Downloads\\shopify_products_import_2026-09-27_cleaned.csv', 'utf8');
const lines = text.split('\n');

console.log('Total lines:', lines.length);
console.log('Header:', lines[0]);
for (let i = 1; i <= 10; i++) {
  console.log(`Line ${i}:`, lines[i].substring(0, 150));
}
