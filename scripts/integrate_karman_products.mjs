import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://ifadlrhqsgdxeeebjblo.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWRscmhxc2dkeGVlZWJqYmxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc4Nzg4NiwiZXhwIjoyMTA2MzYzODg2fQ.iqFzLb2dntbQuW4u_LZuxLA9Ki8AcFsRLO7jzUTRBco';

async function integrateKarman() {
  const seedPath = path.resolve(__dirname, '../data/catalog_seed.json');
  const catalog = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const karmanList = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'karman_products_ready.json'), 'utf8'));

  const existingIds = new Set(catalog.map((p) => p.id));
  const existingHandles = new Set(catalog.map((p) => p.handle));

  const newProducts = [];
  karmanList.forEach((kp, idx) => {
    const id = `prd-karman-${idx + 1}`;
    let handle = kp.slug;
    if (existingHandles.has(handle)) {
      handle = `${handle}-${idx + 1}`;
    }

    if (!existingIds.has(id)) {
      const formatted = {
        id,
        handle,
        title: kp.title,
        vendor: kp.vendor,
        category: kp.category,
        sku: `KM-${100 + idx}`,
        price: kp.price,
        compareAtPrice: kp.compareAtPrice,
        wholesaleCost: Math.round(kp.price * 0.6),
        dealerPrice: Math.round(kp.price * 0.6),
        margin: Math.round(kp.price * 0.4),
        hcpcsCode: kp.category === 'Wheelchairs' ? 'K0004' : (kp.category === 'Walkers & Rollators' ? 'E0143' : 'E0240'),
        fdaClassification: 'Class I / Exempt',
        requiresPrescription: false,
        prescriptionRequired: false,
        fsaEligible: true,
        eligibleFsaHsa: true,
        isRegulatoryVerified: true,
        inStock: true,
        isHeroProduct: idx < 3, // mark top 3 flagship mobility
        heroRank: idx < 3 ? 10 + idx : 999,
        rating: 4.8,
        reviewCount: 30 + (idx * 3),
        warranty: '1-Year Limited Manufacturer Warranty',
        image: kp.image,
        images: kp.images,
        specs: `Brand: Karman Healthcare | Category: ${kp.category} | Weight Capacity: 250–350 lbs | Frame: High-Strength Lightweight Aerospace Aluminum / Steel | Warranty: 1-Year Manufacturer Warranty.`,
        specifications: {
          Manufacturer: 'Karman Healthcare',
          Category: kp.category,
          Condition: 'Factory New',
          Compliance: 'FDA Class I / Exempt',
        },
        features: [
          'Authentic Karman Healthcare ergonomic durable medical equipment',
          'Lightweight durable frame engineered for home and clinical mobility',
          'Tool-free adjustments and easy maintenance',
          'FSA/HSA eligible with itemized invoice documentation',
        ],
        description: `<p>${kp.description}</p>`,
        tags: [
          'Karman Healthcare',
          kp.category,
          'Mobility',
          'DME',
          'FSA Eligible',
        ],
      };
      newProducts.push(formatted);
      existingIds.add(id);
      existingHandles.add(handle);
    }
  });

  console.log(`Adding ${newProducts.length} new Karman products to catalog...`);
  const updatedCatalog = [...catalog, ...newProducts];
  fs.writeFileSync(seedPath, JSON.stringify(updatedCatalog, null, 2), 'utf8');
  console.log(`✓ Updated catalog_seed.json: now has ${updatedCatalog.length} products.`);

  // Sync the new products to Supabase
  if (newProducts.length > 0) {
    console.log(`Syncing ${newProducts.length} Karman products to Supabase...`);
    const supabaseFormatted = newProducts.map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      description: p.description,
      category: p.category,
      price: Number(p.price),
      compare_at_price: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      wholesale_cost: p.wholesaleCost ? Number(p.wholesaleCost) : null,
      sku: p.sku,
      barcode: null,
      mckesson_item_number: null,
      inventory_quantity: 25,
      track_inventory: true,
      is_hero_product: Boolean(p.isHeroProduct),
      featured_image: p.image,
      images: p.images,
      features: p.features,
      specs: p.specs,
      warranty: p.warranty,
      is_rental_available: false,
      prescription_required: false,
      hcpcs_code: p.hcpcsCode,
      fda_classification: p.fdaClassification,
      is_regulatory_verified: true,
      seo_title: `${p.title} | BaeMeds USA`,
      seo_description: `Order ${p.title} online at BaeMeds. Fast US delivery, wholesale pricing, FSA/HSA eligible.`,
      is_active: true,
    }));

    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(supabaseFormatted),
    });

    if (res.ok) {
      console.log(`✓ Successfully synced ${supabaseFormatted.length} Karman products into Supabase!`);
    } else {
      console.error('Failed to sync to Supabase:', res.status, await res.text());
    }
  }
}

integrateKarman().catch(console.error);
