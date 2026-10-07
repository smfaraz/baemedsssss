import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.resolve(__dirname, '../public/brands');

async function downloadDirect(url, filename) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(targetDir, filename), buffer);
      console.log(`✓ Downloaded ${filename} (${buffer.length} bytes)`);
    } else {
      console.error(`Failed ${filename}: ${res.status}`);
    }
  } catch (err) {
    console.error(`Error ${filename}:`, err);
  }
}

async function run() {
  await downloadDirect(
    'https://23487842.fs1.hubspotusercontent-na1.net/hubfs/23487842/Drive_DeVilbiss-LOGO_CMYK_Horizontal.png',
    'drive-devilbiss.png'
  );
  await downloadDirect(
    'https://companieslogo.com/img/orig/INGN_BIG-a94e8aea.png',
    'inogen.png'
  );
}

run();
