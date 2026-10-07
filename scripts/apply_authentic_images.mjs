import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {};
}
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://ifadlrhqsgdxeeebjblo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWRscmhxc2dkeGVlZWJqYmxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc4Nzg4NiwiZXhwIjoyMTA2MzYzODg2fQ.iqFzLb2dntbQuW4u_LZuxLA9Ki8AcFsRLO7jzUTRBco';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const UPDATES = [
  {
    id: 'prd-o2-ino-athome',
    image: '/assets/products/inogen-at-home-5l.png',
    images: ['/assets/products/inogen-at-home-5l.png'],
    gallery: ['/assets/products/inogen-at-home-5l.png']
  },
  {
    id: 'prd-o2-ino-g5-16',
    image: '/assets/products/inogen-one-g5.jpg',
    images: ['/assets/products/inogen-one-g5.jpg'],
    gallery: ['/assets/products/inogen-one-g5.jpg']
  },
  {
    id: 'prd-o2-airsep-10',
    image: '/assets/products/airsep-newlife-intensity-10.png',
    images: ['/assets/products/airsep-newlife-intensity-10.png'],
    gallery: ['/assets/products/airsep-newlife-intensity-10.png']
  },
  {
    id: 'prd-o2-react-10',
    image: '/assets/products/react-health-stratus.jpg',
    images: ['/assets/products/react-health-stratus.jpg'],
    gallery: ['/assets/products/react-health-stratus.jpg']
  },
  {
    id: 'prd-o2-o2c-oxlife',
    image: '/assets/products/oxlife-independence.jpg',
    images: ['/assets/products/oxlife-independence.jpg'],
    gallery: ['/assets/products/oxlife-independence.jpg']
  },
  {
    id: 'prd-o2-sequal-5',
    image: '/assets/products/sequal-eclipse-5.png',
    images: ['/assets/products/sequal-eclipse-5.png'],
    gallery: ['/assets/products/sequal-eclipse-5.png']
  },
  {
    id: 'prd-o2-rh-lm10a',
    image: '/assets/products/rhythm-lm10a.jpg',
    images: ['/assets/products/rhythm-lm10a.jpg'],
    gallery: ['/assets/products/rhythm-lm10a.jpg']
  },
  {
    id: 'prd-1117522',
    image: '/assets/products/welch-allyn-connex-csm.jpg',
    images: ['/assets/products/welch-allyn-connex-csm.jpg'],
    gallery: ['/assets/products/welch-allyn-connex-csm.jpg']
  },
  {
    id: 'prd-436397',
    image: '/assets/products/welch-allyn-durashock.png',
    images: ['/assets/products/welch-allyn-durashock.png'],
    gallery: ['/assets/products/welch-allyn-durashock.png']
  },
  {
    id: 'prd-846837',
    image: '/assets/products/welch-allyn-trimline-cuff.jpg',
    images: ['/assets/products/welch-allyn-trimline-cuff.jpg'],
    gallery: ['/assets/products/welch-allyn-trimline-cuff.jpg']
  },
  {
    id: 'prd-1139516',
    image: '/assets/products/welch-allyn-snapquik-cuff.jpg',
    images: ['/assets/products/welch-allyn-snapquik-cuff.jpg'],
    gallery: ['/assets/products/welch-allyn-snapquik-cuff.jpg']
  },
  {
    id: 'prd-665153',
    image: '/assets/products/posey-alarm-belt.jpg',
    images: ['/assets/products/posey-alarm-belt.jpg'],
    gallery: ['/assets/products/posey-alarm-belt.jpg']
  },
  {
    id: 'prd-1017547',
    image: '/assets/products/scale-tronix-6702-handrail.jpg',
    images: ['/assets/products/scale-tronix-6702-handrail.jpg'],
    gallery: ['/assets/products/scale-tronix-6702-handrail.jpg']
  }
];

async function run() {
  const seedPath = path.resolve(__dirname, '../data/catalog_seed.json');
  const catalog = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  const updateMap = new Map(UPDATES.map((u) => [u.id, u]));
  let seedModifiedCount = 0;

  for (const product of catalog) {
    if (updateMap.has(product.id)) {
      const u = updateMap.get(product.id);
      product.image = u.image;
      product.images = u.images;
      product.gallery = u.gallery;
      seedModifiedCount++;
    }
  }

  fs.writeFileSync(seedPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`✔ Updated ${seedModifiedCount} products in catalog_seed.json`);

  // Now sync to Supabase database
  console.log('\nSyncing corrected images to Supabase products table...');
  for (const u of UPDATES) {
    const { data, error } = await supabase
      .from('products')
      .update({
        featured_image: u.image,
        images: u.images
      })
      .eq('id', u.id)
      .select('id, title, featured_image');

    if (error) {
      console.error(`✖ Failed to update Supabase for ${u.id}:`, error.message);
    } else {
      console.log(`✔ Supabase updated ${u.id}:`, data?.[0]?.title, '->', data?.[0]?.featured_image);
    }
  }

  console.log('\nAll product images successfully synced!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
