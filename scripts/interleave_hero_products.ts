import fs from 'fs';
import path from 'path';
import { adminSupabase } from '../server/adminSupabase';

const catalogPath = path.resolve('./data/catalog_seed.json');
const raw = fs.readFileSync(catalogPath, 'utf-8');
const catalog = JSON.parse(raw);

// 1. Separate heroes and non-heroes
const currentHeroes = catalog.filter((p: any) => p.isHeroProduct);
const nonHeroes = catalog.filter((p: any) => !p.isHeroProduct);

console.log(`Found ${currentHeroes.length} hero products and ${nonHeroes.length} regular products.`);

// 2. Group heroes by category
const byCategory: Record<string, any[]> = {};
currentHeroes.forEach((p: any) => {
  byCategory[p.category] = byCategory[p.category] || [];
  byCategory[p.category].push(p);
});

// Sort each category internally so the most prominent/flagship equipment comes first
Object.values(byCategory).forEach((list) => {
  list.sort((a, b) => {
    const aFamous = /medela|spectra|momcozy|resmed|respironics|devilbiss|broda|masimo|nonin|welch allyn|dexcom|hemocue|ambu/i.test(a.vendor || '');
    const bFamous = /medela|spectra|momcozy|resmed|respironics|devilbiss|broda|masimo|nonin|welch allyn|dexcom|hemocue|ambu/i.test(b.vendor || '');
    if (aFamous !== bFamous) return aFamous ? -1 : 1;
    return b.price - a.price;
  });
});

const CATEGORY_ORDER = [
  'BiPAP Machines',
  'Wheelchairs',
  'CPAP Machines',
  'Patient Monitors',
  'Blood Pressure Monitors',
  'Nebulizers',
  'Breast Pumps',
  'Glucometers',
  'Suction Machines',
  'Incontinence & Care',
];

// 3. Round-robin category interleaving
const interleavedHeroes: any[] = [];
while (interleavedHeroes.length < currentHeroes.length) {
  let added = 0;
  for (const cat of CATEGORY_ORDER) {
    const list = byCategory[cat];
    if (list && list.length > 0) {
      interleavedHeroes.push(list.shift());
      added++;
    }
  }
  for (const cat of Object.keys(byCategory)) {
    if (!CATEGORY_ORDER.includes(cat) && byCategory[cat].length > 0) {
      interleavedHeroes.push(byCategory[cat].shift());
      added++;
    }
  }
  if (added === 0) break;
}

console.log(`\nSuccessfully interleaved all ${interleavedHeroes.length} hero products.`);

// Assign heroRank (1 to 100) and update catalog_seed.json
const heroRankMap = new Map<string, number>();
interleavedHeroes.forEach((p, idx) => {
  p.heroRank = idx + 1;
  heroRankMap.set(p.id, idx + 1);
});

nonHeroes.forEach((p: any) => {
  p.heroRank = 9999;
});

// Reassemble catalog with interleaved heroes at the front
const updatedCatalog = [...interleavedHeroes, ...nonHeroes];
fs.writeFileSync(catalogPath, JSON.stringify(updatedCatalog, null, 2), 'utf-8');
console.log('✔ Updated data/catalog_seed.json with heroRank and interleaved ordering.');

// 4. Update Supabase with descending updated_at timestamps so PostgreSQL orders them identically
async function syncToSupabase() {
  console.log('\nSyncing interleaved ordering to Supabase database...');
  
  // Base timestamp: 2026-10-01 20:00:00 UTC
  const baseTime = new Date('2026-10-01T20:00:00.000Z').getTime();

  for (let i = 0; i < interleavedHeroes.length; i++) {
    const hero = interleavedHeroes[i];
    // Each subsequent hero is 1 minute earlier
    const heroTime = new Date(baseTime - (i * 60 * 1000)).toISOString();

    const { error } = await adminSupabase
      .from('products')
      .update({
        is_hero_product: true,
        updated_at: heroTime
      })
      .eq('id', hero.id);

    if (error) {
      console.warn(`Failed to update timestamp for hero ${hero.id}:`, error.message);
    }
  }

  // Set non-heroes to older timestamp
  const nonHeroTime = new Date('2026-10-01T10:00:00.000Z').toISOString();
  await adminSupabase
    .from('products')
    .update({ updated_at: nonHeroTime })
    .eq('is_hero_product', false);

  console.log('✔ Supabase updated_at timestamps synchronized for interleaved sorting.');

  // Verify first 15 from Supabase
  const { data: top15, error: topError } = await adminSupabase
    .from('products')
    .select('id, category, vendor, title, price, updated_at')
    .eq('is_hero_product', true)
    .order('updated_at', { ascending: false })
    .limit(15);

  if (topError) {
    console.error('Error querying top heroes:', topError);
  } else {
    console.log('\nTop 15 Verified Live in Supabase (Clean Category Rotation):');
    top15?.forEach((p, idx) => {
      console.log(`  ${String(idx + 1).padStart(2)}. [${p.category}] $${Number(p.price).toFixed(2)} | ${p.vendor} | ${p.title.slice(0, 45)}`);
    });
  }
}

syncToSupabase().catch((err) => {
  console.error('Supabase sync error:', err);
  process.exit(1);
});
