import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://ifadlrhqsgdxeeebjblo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWRscmhxc2dkeGVlZWJqYmxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc4Nzg4NiwiZXhwIjoyMTA2MzYzODg2fQ.iqFzLb2dntbQuW4u_LZuxLA9Ki8AcFsRLO7jzUTRBco';

async function seedDatabase() {
  console.log(`\n======================================================`);
  console.log(`🚀 BAEMEDS USA — EXCLUSIVE PRODUCTS FOLDER SEEDING`);
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`======================================================\n`);

  // 1. Load compiled products exclusively from products/ folder
  const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');
  if (!fs.existsSync(catalogPath)) {
    console.error('data/catalog_seed.json not found! Run compile_products_folder.mjs first.');
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`✓ Loaded ${catalog.length} products strictly compiled from products/ folder.`);

  // 2. Format products for Supabase schema
  const formatted = catalog.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    description: p.description,
    category: p.category,
    price: Number(p.price),
    compare_at_price: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    wholesale_cost: p.wholesaleCost ? Number(p.wholesaleCost) : null,
    sku: p.sku || p.id,
    barcode: p.barcode || null,
    mckesson_item_number: p.mckessonItemNumber || null,
    inventory_quantity: p.inventoryQuantity ?? 25,
    track_inventory: Boolean(p.trackInventory ?? true),
    is_hero_product: Boolean(p.isHeroProduct),
    featured_image: p.image,
    images: Array.isArray(p.images) ? p.images : [p.image],
    features: Array.isArray(p.features) ? p.features : [],
    specs: p.specs || '',
    warranty: p.warranty || '1 Year Standard Manufacturer Warranty',
    is_rental_available: false,
    prescription_required: Boolean(p.prescriptionRequired),
    hcpcs_code: p.hcpcsCode || null,
    fda_classification: p.fdaClassification || 'Class I / Exempt',
    is_regulatory_verified: true,
    seo_title: p.seoTitle || `${p.title} | BaeMeds USA`,
    seo_description: p.seoDescription || `Order ${p.title} online at BaeMeds. Fast US delivery, wholesale pricing, FSA/HSA eligible.`,
    is_active: true,
  }));

  // 3. Purge existing products from Supabase to guarantee ONLY products/ folder items exist
  console.log('Clearing old product catalog in Supabase...');
  const delRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=neq.placeholder_nonexistent`, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'return=minimal',
    },
  });
  console.log(`Cleared existing products table. (Status: ${delRes.status})`);

  // 4. Insert formatted products in batches of 100
  const batchSize = 100;
  let totalInserted = 0;

  for (let i = 0; i < formatted.length; i += batchSize) {
    const batch = formatted.slice(i, i + batchSize);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, res.status, errText);
    } else {
      totalInserted += batch.length;
      if (totalInserted % 500 === 0 || totalInserted === formatted.length) {
        console.log(`✓ Inserted ${totalInserted} of ${formatted.length} products...`);
      }
    }
  }

  // 5. Verify total count & heroes in Supabase
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,is_hero_product`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  const liveRows = await countRes.json();
  const liveHeroes = Array.isArray(liveRows) ? liveRows.filter((r) => r.is_hero_product).length : 0;

  console.log(`\n======================================================`);
  console.log(`🎉 LIVE SEEDING FINISHED!`);
  console.log(`Total Authoritative Products in Supabase: ${Array.isArray(liveRows) ? liveRows.length : 0}`);
  console.log(`⭐ Curated Top 100 Flagship Hero Products: ${liveHeroes}`);
  console.log(`======================================================\n`);
}

seedDatabase().catch((err) => {
  console.error('Fatal Seeding Error:', err);
  process.exit(1);
});
