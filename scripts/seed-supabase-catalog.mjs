import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://psyeixlohgkpvaymjyxh.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzeWVpeGxvaGdrcHZheW1qeXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MjA3MjIsImV4cCI6MjEwNDk5NjcyMn0.dswCTpddP5tWk_RodrPiOewHbVZymtGYdUrQljfKjbE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedCatalog() {
  console.log(`\nConnecting to Supabase: ${SUPABASE_URL}...`);
  const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');
  if (!fs.existsSync(catalogPath)) {
    console.error('Catalog seed not found at:', catalogPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(catalogPath, 'utf8');
  const products = JSON.parse(raw);
  console.log(`Loaded ${products.length} products from seed.`);

  const formattedProducts = products.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    description: p.description || '',
    category: p.category || 'Medical Supplies',
    price: Number(p.price) || 0,
    compare_at_price: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    featured_image: p.image || null,
    images: Array.isArray(p.images) ? p.images : [p.image],
    specs: p.specs || {},
    warranty: p.warranty || null,
    is_rental_available: Boolean(p.isRentalAvailable),
    prescription_required: Boolean(p.prescriptionRequired),
    hcpcs_code: p.hcpcsCode || null,
    fda_classification: p.fdaClassification || null,
    is_regulatory_verified: Boolean(p.isRegulatoryVerified),
    is_active: true,
  }));

  const { data, error } = await supabase.from('products').upsert(formattedProducts, { onConflict: 'id' });
  if (error) {
    console.error('Failed to seed products table:', error.message);
    console.log('Hint: Run supabase/MASTER_COMPLETE_SETUP.sql in Supabase SQL editor first.');
    return;
  }

  console.log(`✓ Successfully synced ${formattedProducts.length} products into Supabase!`);
}

seedCatalog().catch(console.error);
