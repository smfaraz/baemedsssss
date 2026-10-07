import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://ifadlrhqsgdxeeebjblo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWRscmhxc2dkeGVlZWJqYmxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc4Nzg4NiwiZXhwIjoyMTA2MzYzODg2fQ.iqFzLb2dntbQuW4u_LZuxLA9Ki8AcFsRLO7jzUTRBco';

async function syncCategories() {
  const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`Loaded ${catalog.length} products from catalog_seed.json.`);

  // Create minimal payload for upsert: id and category (and handle/title to satisfy any non-null constraints if needed)
  // Let's check what upsert expects:
  // Using POST to /rest/v1/products with Prefer: resolution=merge-duplicates
  // Wait, if we upsert with only id and category, PostgreSQL UPSERT (ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category)
  // But PostgREST upsert requires all NOT NULL columns if it tries to insert, or we can use PATCH per id or batch upsert with existing schema.
  
  // Let's format the full object like seed_live_supabase_database.mjs so it safely upserts all 3,131 items:
  const formatted = catalog.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    description: p.description || '',
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
    prescription_required: false,
    hcpcs_code: p.hcpcsCode || null,
    fda_classification: p.fdaClassification || 'Class I / Exempt',
    is_regulatory_verified: true,
    seo_title: p.seoTitle || `${p.title} | BaeMeds USA`,
    seo_description: p.seoDescription || `Order ${p.title} online at BaeMeds. Fast US delivery, wholesale pricing, FSA/HSA eligible.`,
    is_active: true,
  }));

  const batchSize = 100;
  let updated = 0;

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
      const err = await res.text();
      console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, res.status, err);
    } else {
      updated += batch.length;
      if (updated % 500 === 0 || updated === formatted.length) {
        console.log(`✓ Synced ${updated} of ${formatted.length} products to Supabase...`);
      }
    }
  }

  console.log(`\n🎉 Complete! Successfully synced ${updated} products to Supabase.`);
}

syncCategories().catch(console.error);
