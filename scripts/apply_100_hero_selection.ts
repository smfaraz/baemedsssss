import fs from 'fs';
import path from 'path';
import { adminSupabase } from '../server/adminSupabase';

const catalogPath = path.resolve('./data/catalog_seed.json');
const raw = fs.readFileSync(catalogPath, 'utf-8');
const catalog = JSON.parse(raw);

const QUOTAS: Record<string, number> = {
  'Wheelchairs': 16,
  'CPAP Machines': 14,
  'Blood Pressure Monitors': 10,
  'Nebulizers': 10,
  'Patient Monitors': 10,
  'Suction Machines': 8,
  'Breast Pumps': 10,
  'Glucometers': 10,
  'Incontinence & Care': 8,
  'BiPAP Machines': 4,
};

const ACCESSORY_PENALTY_REGEX = /filter|tubing|tube|connector|adapter|wrench|bracket|screw|clip|hose|bulb|valve|strap|strip|lancet|fuse|cable|washer|cap|nut|cushion|headgear|mask frame|power cord|chamber|humidifier lid|mask clip|swivel|wipes|cleanser|solution|ampules|sensor only|replacement part/i;

const NON_CORE_CATEGORY_PENALTIES: Record<string, RegExp> = {
  'Wheelchairs': /scale|stretcher|commode|shower chair|drainage|anti-tipper|armrest pad|upholstery only|tote bag/i,
  'Blood Pressure Monitors': /cuff only|bladder only|bulb only|valve only|mounting bracket|mobile stand/i,
  'Nebulizers': /methacholine|solution|ampules|budesonide|replacement part|fit test/i,
  'Patient Monitors': /spO2 sensor|softcare foot|rd set finger|leadwires|cable|bracket/i,
  'Glucometers': /control solution|urine analyzer|test strips only/i,
  'CPAP Machines': /prewash cleanser|wipes|airway adapter set/i,
};

const CORE_BOOSTS: Record<string, RegExp[]> = {
  'BiPAP Machines': [/bi-level/i, /bilevel/i, /bipap unit/i, /ventilator/i, /vpap/i],
  'CPAP Machines': [/cpap unit/i, /sleep study/i, /auto cpap/i, /cpap starter kit/i, /sanitizing unit/i, /cpap mask kit/i, /airsense/i, /flow-safe/i],
  'Wheelchairs': [/wheelchair/i, /transport chair/i, /tilt-in-space/i, /cruiser/i, /bariatric/i, /lightweight/i, /ergonomic/i, /recline/i],
  'Blood Pressure Monitors': [/automatic digital blood pressure/i, /patient monitor/i, /vital signs monitor/i, /aneroid sphygmomanometer/i, /desk model/i, /diagnostic/i],
  'Glucometers': [/diabetes management analyzer/i, /blood glucose meter/i, /lipid and glucose analyzer/i, /cgm/i, /dexcom/i, /transmitter kit/i, /starter kit/i],
  'Nebulizers': [/compressor nebulizer system/i, /handheld compressor/i, /piston/i, /mesh nebulizer/i, /respiratory humidifier/i, /aerosol/i],
  'Suction Machines': [/oxygen mask/i, /ventilation mask/i, /resuscitator/i, /aspirator/i, /t-piece resuscitator/i, /suction/i],
  'Patient Monitors': [/handheld pulse oximeter/i, /pulse co-oximeter/i, /fingertip pulse oximeter/i, /vital signs/i, /patient monitor/i],
  'Breast Pumps': [/double electric breast pump/i, /wearable electric breast pump/i, /hands free double/i, /pump in style/i, /breast pump kit/i],
  'Incontinence & Care': [/absorbent underwear/i, /incontinence brief/i, /overnight/i, /bariatric/i, /heavy absorbency/i, /quilted/i]
};

function scoreProduct(p: any) {
  let score = 0;
  const title = p.title || '';
  const desc = p.description || '';
  const price = p.price || 0;
  const vendor = p.vendor || '';

  // 1. Accessory penalty
  if (ACCESSORY_PENALTY_REGEX.test(title)) {
    if (price < 45) score -= 1500;
    else if (price < 90) score -= 800;
    else score -= 400;
  }

  // 2. Category-specific non-core penalty
  const nonCore = NON_CORE_CATEGORY_PENALTIES[p.category];
  if (nonCore && nonCore.test(title)) {
    score -= 1200;
  }

  // 3. Core equipment boost
  const boosts = CORE_BOOSTS[p.category] || [];
  for (const b of boosts) {
    if (b.test(title)) score += 350;
    if (b.test(desc)) score += 60;
  }

  // 4. Value / Price weighting
  if (price >= 75 && price <= 3000) {
    score += Math.min(300, price / 5);
  } else if (price > 3000) {
    score += 250;
  } else if (price < 25) {
    score -= 500;
  }

  // 5. Image & Regulatory verification
  if (p.image && !p.image.includes('placehold.co')) score += 80;
  if (p.isRegulatoryVerified) score += 60;
  if (p.hcpcsCode) score += 40;
  if (p.inStock) score += 50;

  return score;
}

function getTitleStem(title: string) {
  return title
    .toLowerCase()
    .replace(/\b(\d+)\s*(inch|in|"|mm|cm|oz|ml|pack|ct|count|pk|ea|case|cs)\b/gi, '')
    .replace(/\b(small|medium|large|x-large|adult|pediatric|black|navy|blue|grey)\b/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 28);
}

async function runHeroSelection() {
  console.log('\n======================================================');
  console.log('AI-DRIVEN SELECTION OF TOP 100 FLAGSHIP HERO PRODUCTS');
  console.log('======================================================\n');

  const selectedHeroes: any[] = [];
  const heroesByCategory: Record<string, any[]> = {};

  Object.entries(QUOTAS).forEach(([category, quota]) => {
    const candidates = catalog.filter((p: any) => p.category === category);
    
    const scored = candidates.map((p: any) => ({
      product: p,
      score: scoreProduct(p),
      stem: getTitleStem(p.title),
    }));

    scored.sort((a, b) => b.score - a.score);

    const picked: any[] = [];
    const seenStems = new Set<string>();
    const vendorCounts: Record<string, number> = {};
    const maxPerVendor = Math.max(2, Math.floor(quota * 0.35));

    for (const item of scored) {
      if (picked.length >= quota) break;
      const v = item.product.vendor || 'Unknown';
      const vCount = vendorCounts[v] || 0;

      if (seenStems.has(item.stem) && picked.length < quota - 1) {
        continue;
      }

      if (vCount >= maxPerVendor && picked.length < quota - 1) {
        continue;
      }

      picked.push(item.product);
      seenStems.add(item.stem);
      vendorCounts[v] = vCount + 1;
    }

    if (picked.length < quota) {
      for (const item of scored) {
        if (picked.length >= quota) break;
        if (!picked.some((p) => p.id === item.product.id)) {
          picked.push(item.product);
        }
      }
    }

    heroesByCategory[category] = picked;
    selectedHeroes.push(...picked);
  });

  if (selectedHeroes.length !== 100) {
    throw new Error(`Expected exactly 100 hero products, got ${selectedHeroes.length}`);
  }

  const selectedIds = new Set(selectedHeroes.map((p) => p.id));
  const distinctVendors = new Set(selectedHeroes.map((p) => p.vendor)).size;

  console.log(`✔ Selected exactly ${selectedHeroes.length} hero products.`);
  console.log(`✔ Spans ${Object.keys(heroesByCategory).length} categories with ${distinctVendors} distinct brands.`);

  // 1. Update data/catalog_seed.json
  console.log('\n1. Updating data/catalog_seed.json...');
  let updatedCount = 0;
  for (const product of catalog) {
    const isHero = selectedIds.has(product.id);
    product.isHeroProduct = isHero;
    if (isHero) {
      if (!Array.isArray(product.tags)) product.tags = [];
      if (!product.tags.includes('Flagship Hero')) {
        product.tags.unshift('Flagship Hero');
      }
      updatedCount++;
    } else {
      if (Array.isArray(product.tags)) {
        product.tags = product.tags.filter((t: string) => t !== 'Flagship Hero');
      }
    }
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`✔ catalog_seed.json updated with ${updatedCount} flagship hero products.`);

  // 2. Update Supabase database
  console.log('\n2. Updating Supabase database products table...');
  const { error: resetError } = await adminSupabase
    .from('products')
    .update({ is_hero_product: false })
    .neq('id', 'dummy_id');

  if (resetError) {
    console.warn('Warning resetting hero products in Supabase:', resetError);
  }

  // Update in batches of 25
  const heroIdList = Array.from(selectedIds);
  for (let i = 0; i < heroIdList.length; i += 25) {
    const batch = heroIdList.slice(i, i + 25);
    const { error: updateError } = await adminSupabase
      .from('products')
      .update({ is_hero_product: true })
      .in('id', batch);

    if (updateError) {
      console.error(`Error updating batch ${i}:`, updateError);
    }
  }

  // Verify in Supabase
  const { count: supabaseHeroCount, error: countError } = await adminSupabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_hero_product', true);

  console.log(`✔ Supabase verification: ${supabaseHeroCount} products flagged as is_hero_product = true (error: ${countError?.message || 'none'}).`);

  console.log('\n======================================================');
  console.log('CATEGORY BREAKDOWN OF SELECTED 100 HERO PRODUCTS:');
  console.log('======================================================');
  Object.entries(heroesByCategory).forEach(([cat, list]) => {
    console.log(`\n### ${cat.toUpperCase()} (${list.length} Products):`);
    list.forEach((p, idx) => {
      console.log(`  ${String(idx + 1).padStart(2)}. [${p.sku || p.id}] $${p.price.toFixed(2)} | ${p.vendor} | ${p.title.slice(0, 65)}`);
    });
  });
}

runHeroSelection().catch((err) => {
  console.error('Hero selection error:', err);
  process.exit(1);
});
