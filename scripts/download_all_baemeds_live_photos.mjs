import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../public/assets/live-baemeds');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Lifestyle / Banner photos from actual baemeds.com (assets.zyrosite.com)
const lifestylePhotos = [
  {
    name: 'middleaged-man-in-wheelchair.jpg',
    url: 'https://assets.zyrosite.com/m2WER43b8bhQPrDX/middleaged-man-in-wheelchair-ALp2rRxjewSjDlzZ.jpg',
  },
  {
    name: 'durable-medical-equipment.jpg',
    url: 'https://assets.zyrosite.com/m2WER43b8bhQPrDX/durable-medical-equipment-mk3JR47Nz2uexen7.jpg',
  },
  {
    name: 'group-in-walkers.webp',
    url: 'https://assets.zyrosite.com/m2WER43b8bhQPrDX/group-in-walkers-YBgjKRnD4DTgEr3M.webp',
  },
  {
    name: 'lifestyle-wheelchair-assist.jpg',
    url: 'https://images.unsplash.com/photo-1705422292909-db7db933526b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'lifestyle-power-wheelchair.jpg',
    url: 'https://images.unsplash.com/photo-1723433892471-62f113c8c9a0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'lifestyle-rollator-outdoor.jpg',
    url: 'https://images.unsplash.com/photo-1706700504131-d3bd641838c2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'lifestyle-walker-town.jpg',
    url: 'https://images.unsplash.com/photo-1755157582305-413063a7aed5?auto=format&fit=crop&w=1200&q=80',
  },
];

// 2. All product photos from actual baemeds.com
const productJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'live_extracted_products.json'), 'utf8'));

async function downloadFile(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(destPath, buffer);
      console.log(`✓ Downloaded ${path.basename(destPath)} (${buffer.length} bytes)`);
      return true;
    } else {
      console.warn(`Failed ${url}: ${res.status}`);
      return false;
    }
  } catch (err) {
    console.error(`Error ${url}:`, err.message);
    return false;
  }
}

async function run() {
  console.log('Downloading lifestyle photos from actual baemeds.com...');
  for (const item of lifestylePhotos) {
    const dest = path.join(targetDir, item.name);
    await downloadFile(item.url, dest);
  }

  console.log('\nDownloading product photos from actual baemeds.com...');
  const downloadedProducts = [];
  for (let i = 0; i < productJson.length; i++) {
    const p = productJson[i];
    const ext = p.imgUrl.includes('.webp') ? '.webp' : '.jpg';
    const filename = `karman-product-${i + 1}${ext}`;
    const dest = path.join(targetDir, filename);
    const ok = await downloadFile(p.imgUrl, dest);
    if (ok) {
      downloadedProducts.push({
        ...p,
        localPath: `/assets/live-baemeds/${filename}`,
      });
    }
  }

  fs.writeFileSync(
    path.resolve(__dirname, 'downloaded_live_products.json'),
    JSON.stringify(downloadedProducts, null, 2),
    'utf8'
  );
  console.log(`\n🎉 Successfully downloaded and indexed ${downloadedProducts.length} live products!`);
}

run().catch(console.error);
