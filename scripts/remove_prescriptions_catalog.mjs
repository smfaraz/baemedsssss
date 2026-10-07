import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function cleanText(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\bprescriptions\b/gi, 'therapy needs')
    .replace(/\bprescription\b/gi, 'therapy')
    .replace(/\bDoctor Rx Needed Prior to Shipment\b/gi, 'Standard Processing')
    .replace(/\bDoctor Rx\b/gi, 'Therapy')
    .replace(/\(Valid US Doctor Rx Needed Prior to Shipment\)/gi, '')
    .replace(/\bPrescription Required\b/gi, '')
    .replace(/\bRx Required\b/gi, '')
    .replace(/\bRx\b/g, '');
}

function cleanObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'requiresPrescription' || k === 'prescriptionRequired') {
        newObj[k] = false;
      } else if (typeof v === 'string') {
        newObj[k] = cleanText(v);
      } else if (typeof v === 'object') {
        newObj[k] = cleanObject(v);
      } else {
        newObj[k] = v;
      }
    }
    return newObj;
  }
  return obj;
}

const files = [
  path.join(rootDir, 'data', 'top_20_flagship_products.json'),
  path.join(rootDir, 'data', 'catalog_seed.json'),
];

for (const filePath of files) {
  if (fs.existsSync(filePath)) {
    console.log(`Processing: ${filePath}`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const cleaned = cleanObject(data);
    fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf-8');
    console.log(`Cleaned: ${filePath}`);
  }
}

console.log('Done cleaning catalog files!');
