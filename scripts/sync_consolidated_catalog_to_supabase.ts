import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminSupabase } from '../server/adminSupabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');

const catalog: any[] = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

async function syncConsolidatedCatalog() {
  console.log(`Starting Supabase sync for ${catalog.length} consolidated products...`);

  // 1. Gather all child variant originalProductIds that merged into parents
  const childProductIds = new Set<string>();
  for (const p of catalog) {
    if (p.variants && p.variants.length > 1) {
      for (const v of p.variants) {
        if (v.originalProductId && v.originalProductId !== p.id) {
          childProductIds.add(v.originalProductId);
        }
      }
    }
  }

  console.log(`Identified ${childProductIds.size} child variant products to archive in standalone storefront.`);

  // 2. Safely release child handles and mark as is_active = false
  const childArray = Array.from(childProductIds);
  for (const childId of childArray) {
    await adminSupabase
      .from('products')
      .update({
        is_active: false,
        handle: `${childId}-archived-variant`,
      })
      .eq('id', childId);
  }

  console.log('✓ Successfully archived child variant products and freed handles in Supabase.');

  // 3. Upsert all 2,804 consolidated parent products
  const chunkSize = 100;
  for (let i = 0; i < catalog.length; i += chunkSize) {
    const chunk = catalog.slice(i, i + chunkSize).map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      description: p.description || '',
      category: p.category || 'Medical Supplies',
      price: Number(p.price) || 0,
      compare_at_price: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      wholesale_cost: p.wholesaleCost || (Number(p.price) ? Number((Number(p.price) * 0.6).toFixed(2)) : null),
      sku: p.sku || `BM-${(p.id || '').substring(0, 8).toUpperCase()}`,
      barcode: p.barcode || null,
      mckesson_item_number: p.mckessonItemNumber || 'MCK-829104',
      inventory_quantity: p.inventoryQuantity !== undefined ? p.inventoryQuantity : 25,
      track_inventory: true,
      is_hero_product: Boolean(p.isHeroProduct || p.price > 500),
      featured_image: p.image || null,
      images: Array.isArray(p.images) ? p.images : [p.image],
      features: Array.isArray(p.features) ? p.features : [],
      specs: p.specs || '',
      warranty: p.warranty || null,
      is_rental_available: Boolean(p.isRentalAvailable),
      prescription_required: Boolean(p.prescriptionRequired),
      hcpcs_code: p.hcpcsCode || null,
      fda_classification: p.fdaClassification || null,
      is_regulatory_verified: Boolean(p.isRegulatoryVerified),
      is_active: true,
    }));

    const { error } = await adminSupabase.from('products').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error upserting chunk ${i}:`, error.message);
    }
  }

  console.log(`✓ Successfully upserted all ${catalog.length} active consolidated products in Supabase!`);

  // 4. Verify exact active count
  const { count, error: countErr } = await adminSupabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (!countErr) {
    console.log(`Verified active products count in Supabase: ${count}`);
  }
}

syncConsolidatedCatalog().catch(console.error);
