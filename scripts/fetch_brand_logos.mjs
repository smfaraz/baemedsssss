import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../public/brands');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const wikiItems = [
  { filename: 'resmed.svg', title: 'File:ResMed_logo.svg' },
  { filename: 'philips.svg', title: 'File:Philips_logo_new.svg' },
  { filename: 'mckesson.svg', title: 'File:McKesson_logo.svg' },
  { filename: 'cardinal-health.svg', title: 'File:Cardinal_Health_Logo.svg' },
  { filename: 'omron.svg', title: 'File:OMRON_Logo.svg' },
  { filename: '3m.svg', title: 'File:3M_wordmark.svg' },
  { filename: 'fisher-paykel.svg', title: 'File:FPHcare-logo.svg' },
  { filename: 'medline.svg', title: 'File:Medline-logo.svg' },
  { filename: 'welch-allyn.svg', title: 'File:Welch_Allyn_logo.svg' },
  { filename: 'abbott.svg', title: 'File:Abbott_Laboratories_2025_logo.svg' },
  { filename: 'bd.svg', title: 'File:BD_(company)_logo.svg' },
  { filename: 'invacare.gif', title: 'File:Invacare_Corporation_Logo.gif' },
];

async function fetchFromWiki(item) {
  for (const host of ['en.wikipedia.org', 'commons.wikimedia.org']) {
    const apiUrl = `https://${host}/w/api.php?action=query&titles=${encodeURIComponent(item.title)}&prop=imageinfo&iiprop=url&format=json`;
    try {
      const res = await fetch(apiUrl, {
        headers: { 'User-Agent': 'BaeMedsBrandAssetDownloader/1.0 (support@baemeds.com)' },
      });
      const data = await res.json();
      const page = Object.values(data.query.pages)[0];
      if (page && page.imageinfo && page.imageinfo[0]?.url) {
        const fileUrl = page.imageinfo[0].url;
        const imgRes = await fetch(fileUrl, {
          headers: { 'User-Agent': 'BaeMedsBrandAssetDownloader/1.0 (support@baemeds.com)' },
        });
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          fs.writeFileSync(path.join(targetDir, item.filename), buffer);
          console.log(`✓ [${host}] Downloaded ${item.filename} (${buffer.length} bytes)`);
          return true;
        }
      }
    } catch (e) {
      // try next host
    }
  }
  console.log(`✗ Failed to download ${item.filename}`);
  return false;
}

async function run() {
  for (const item of wikiItems) {
    await fetchFromWiki(item);
  }
}

run().catch(console.error);
