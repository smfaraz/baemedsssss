import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://ifadlrhqsgdxeeebjblo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWRscmhxc2dkeGVlZWJqYmxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc4Nzg4NiwiZXhwIjoyMTA2MzYzODg2fQ.iqFzLb2dntbQuW4u_LZuxLA9Ki8AcFsRLO7jzUTRBco';

const hdImage = '/assets/images/philips-simplygo-mini-hd.jpg';
const allImages = [
  '/assets/images/philips-simplygo-mini-hd.jpg',
  '/assets/images/philips-simplygo-mini-battery.jpg',
  '/assets/images/philips-simplygo-mini-backpack.jpg',
];

async function updateSimplyGo() {
  // 1. Update data/catalog_seed.json
  const seedPath = path.resolve(__dirname, '../data/catalog_seed.json');
  const catalog = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const target = catalog.find((p) => p.id === 'prd-o2-phil-simplygo-mini');
  if (target) {
    target.image = hdImage;
    target.images = allImages;
    target.tags = (target.tags || []).filter((t) => !/Rx Required/i.test(t));
    fs.writeFileSync(seedPath, JSON.stringify(catalog, null, 2), 'utf8');
    console.log('✓ Updated data/catalog_seed.json for prd-o2-phil-simplygo-mini');
  } else {
    console.warn('Target prd-o2-phil-simplygo-mini not found in catalog_seed.json');
  }

  // 2. Update data/top_20_flagship_products.json if present
  const top20Path = path.resolve(__dirname, '../data/top_20_flagship_products.json');
  if (fs.existsSync(top20Path)) {
    const top20 = JSON.parse(fs.readFileSync(top20Path, 'utf8'));
    const t20Item = top20.find((p) => p.id === 'prd-o2-phil-simplygo-mini');
    if (t20Item) {
      t20Item.image = hdImage;
      t20Item.images = allImages;
      t20Item.tags = (t20Item.tags || []).filter((t) => !/Rx Required/i.test(t));
      fs.writeFileSync(top20Path, JSON.stringify(top20, null, 2), 'utf8');
      console.log('✓ Updated data/top_20_flagship_products.json');
    }
  }

  // 3. Update Supabase Database
  console.log('Updating Supabase database...');
  const patchPayload = {
    featured_image: hdImage,
    images: allImages,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.prd-o2-phil-simplygo-mini`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patchPayload),
  });

  if (res.ok) {
    const updatedRows = await res.json();
    console.log('✓ Successfully patched product in Supabase:', updatedRows[0]?.id, updatedRows[0]?.featured_image);
  } else {
    console.error('Failed to patch Supabase:', res.status, await res.text());
  }
}

updateSimplyGo().catch(console.error);
