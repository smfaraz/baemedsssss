/**
 * BaeMeds USA — Catalog Category Reclassification Script
 * Reclassifies:
 * 1. Hospital Furniture: unifies hospital beds, bed frames, and overbed tables
 * 2. CPAP category: separates CPAP Masks & Accessories (554 items) from CPAP Machines (25 items)
 * 3. Mobility: separates Walkers & Rollators (136 items), Wheelchair Parts & Accessories (776 items),
 *    and Commodes & Bath Safety (51 items) from core Wheelchairs (181 items)
 * 4. Patient Monitors: absorbs clinical scales and monitoring sensors misplaced in wheelchairs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const catalogPath = path.join(rootDir, 'data', 'catalog_seed.json');
const rawData = fs.readFileSync(catalogPath, 'utf8');
const catalog = JSON.parse(rawData);

export function classifyProduct(p) {
  const title = (p.title || '').toLowerCase();
  const currentCat = p.category;

  // 1. Hospital Furniture (beds, overbed tables, trapezes, rails, patient lifts)
  if (
    /(overbed table|hospital bed|bed frame|trapeze|patient lift|bed rail|stretcher|gurney|fowler bed)/i.test(p.title) ||
    currentCat === 'Hospital Beds & Furnishings' ||
    currentCat === 'Hospital Furniture'
  ) {
    return 'Hospital Furniture';
  }

  // 2. Clinical scales & patient monitoring equipment misplaced in wheelchairs
  if (currentCat === 'Wheelchairs') {
    if (/(chair scale|wheelchair scale|digital weight indicator|display head.*scale|compliance kit.*scale|alarm belt sensor|chair sensor pad)/i.test(p.title)) {
      return 'Patient Monitors';
    }
  }

  // 3. Commodes & Bath Safety
  if (currentCat === 'Wheelchairs') {
    if (/(commode|shower chair|bath bench|transfer bench|toilet safety|toilet seat)/i.test(p.title)) {
      return 'Commodes & Bath Safety';
    }
  }

  // 4. Walkers, Rollators, Crutches & Canes
  if (currentCat === 'Wheelchairs') {
    if (/(walker|rollator|crutch|cane|forearm crutch|quad cane)/i.test(p.title) && !/(cushion|wheelchair)/i.test(p.title)) {
      return 'Walkers & Rollators';
    }
  }

  // 5. Wheelchair Parts & Accessories
  if (currentCat === 'Wheelchairs') {
    if (/(cushion|caster|footrest|armrest|brake|upholstery|legrest|anti-tipper|strap|holder|tray|pad|wheel only|tire|bearing|clutch|fork|hanger|belt|support|harness|restraint|positioning|pocket|bag|mount|bracket|hardware|repair kit|extension|guide|parts|replacement)/i.test(p.title)) {
      return 'Wheelchair Parts & Accessories';
    }
  }

  // 6. CPAP Masks & Accessories vs actual CPAP Machines
  if (currentCat === 'CPAP Machines') {
    if (/(mask|headgear|cushion|pillow|tubing|tube|hose|circuit|filter|strap|clip|connector|elbow|chinstrap|cannula|wipe|adapter|cord|cleaner|soclean|power supply|battery|seal|swivel|silencer)/i.test(p.title)) {
      return 'CPAP Masks & Accessories';
    }
    return 'CPAP Machines';
  }

  return currentCat;
}

const stats = {};
let changedCount = 0;

const updatedCatalog = catalog.map((p) => {
  const newCategory = classifyProduct(p);
  if (newCategory !== p.category) {
    changedCount++;
  }
  stats[newCategory] = (stats[newCategory] || 0) + 1;
  return {
    ...p,
    category: newCategory,
  };
});

fs.writeFileSync(catalogPath, JSON.stringify(updatedCatalog, null, 2), 'utf8');

console.log(`\n✔ Reclassified ${changedCount} of ${catalog.length} products in data/catalog_seed.json`);
console.log('\n=== NEW CATALOG CATEGORY BREAKDOWN ===');
for (const [cat, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
  console.log(` • ${cat.padEnd(32)}: ${count}`);
}
