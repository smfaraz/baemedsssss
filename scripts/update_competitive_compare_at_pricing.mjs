import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');
const rawData = fs.readFileSync(catalogPath, 'utf-8');
const products = JSON.parse(rawData);

/**
 * Calculates a realistic, competitive US Market MSRP / Street Compare-at Price
 * Reflects hospital pharmacy / standard retail DME street prices (26% - 35% higher).
 */
export function calculateCompetitiveCompareAtPrice(price) {
  if (typeof price !== 'number' || price <= 0) return null;

  let calculated;
  if (price <= 25) {
    // 50% markup for low-ticket consumables (e.g., $18 -> $26.99)
    calculated = Math.ceil(price * 1.50) - 0.01;
  } else if (price <= 60) {
    // 45% markup (e.g., $40 -> $57.99)
    calculated = Math.ceil(price * 1.45) - 0.01;
  } else if (price <= 150) {
    // 42% markup rounded to clean 5s (.99) (e.g., $99.99 -> $139.99)
    calculated = Math.round((price * 1.42) / 5) * 5 - 0.01;
  } else if (price <= 500) {
    // 38% markup rounded to clean 10s (.99) (e.g., $349 -> $479.99)
    calculated = Math.round((price * 1.38) / 10) * 10 - 0.01;
  } else if (price <= 1500) {
    // 35% markup rounded to clean 25s (e.g., $1195 -> $1625.00)
    calculated = Math.round((price * 1.35) / 25) * 25;
  } else {
    // 32% markup rounded to clean 50s (e.g., $2495 -> $3300.00)
    calculated = Math.round((price * 1.32) / 50) * 50;
  }

  return Number(calculated.toFixed(2));
}

let updatedCount = 0;
let variantsUpdatedCount = 0;

for (const product of products) {
  const currentPrice = Number(product.price) || 0;
  if (currentPrice > 0) {
    const targetCompareAt = calculateCompetitiveCompareAtPrice(currentPrice);
    const existing = Number(product.compareAtPrice) || 0;

    // Use the higher value between existing and newly calculated to preserve any special higher MSRPs
    const finalCompareAt = existing > currentPrice * 1.22 ? existing : targetCompareAt;
    
    if (product.compareAtPrice !== finalCompareAt) {
      product.compareAtPrice = finalCompareAt;
      updatedCount++;
    }
  }

  // Also update variants if present
  if (Array.isArray(product.variants)) {
    for (const v of product.variants) {
      const vPrice = Number(v.price) || currentPrice;
      if (vPrice > 0) {
        const vTargetCompareAt = calculateCompetitiveCompareAtPrice(vPrice);
        const vExisting = Number(v.compareAtPrice) || 0;
        const vFinal = vExisting > vPrice * 1.22 ? vExisting : vTargetCompareAt;
        if (v.compareAtPrice !== vFinal) {
          v.compareAtPrice = vFinal;
          variantsUpdatedCount++;
        }
      }
    }
  }
}

fs.writeFileSync(catalogPath, JSON.stringify(products, null, 2), 'utf-8');
console.log(`Successfully updated ${updatedCount} products and ${variantsUpdatedCount} variants in catalog_seed.json with competitive US market compareAtPrice!`);
