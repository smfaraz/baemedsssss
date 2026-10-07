import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');
const top20Path = path.resolve(__dirname, '../data/top_20_flagship_products.json');

// Make a backup first
const backupPath = path.resolve(__dirname, '../data/catalog_seed.json.bak_before_price_increase');
fs.copyFileSync(catalogPath, backupPath);
console.log(`✓ Backup created at: ${backupPath}`);

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

/**
 * Calculates a 2% to 3% price increase with clean .99 retail psychological endings
 */
export function calculateNewPrice(oldPrice) {
  if (typeof oldPrice !== 'number' || oldPrice <= 0) return oldPrice;
  let newP;
  if (oldPrice >= 30) {
    // For products $30+: round oldPrice * 1.025 to clean .99 ending
    newP = Number((Math.round(oldPrice * 1.025 - 0.99) + 0.99).toFixed(2));
    if (newP <= oldPrice) {
      newP = Number((oldPrice + 1.00).toFixed(2));
    }
  } else {
    // For consumables/accessories under $30: +2.5% ending in 9-cents (.19, .29, .49, .69, .99)
    const raw = oldPrice * 1.025;
    newP = Number((Math.round(raw * 10) / 10 - 0.01).toFixed(2));
    if (newP <= oldPrice) {
      newP = Number((oldPrice + 0.10).toFixed(2));
    }
  }
  return newP;
}

/**
 * Calculates a realistic, competitive US Market MSRP / Street Compare-at Price
 */
export function calculateCompetitiveCompareAtPrice(price) {
  if (typeof price !== 'number' || price <= 0) return null;

  let calculated;
  if (price <= 25) {
    calculated = Math.ceil(price * 1.50) - 0.01;
  } else if (price <= 60) {
    calculated = Math.ceil(price * 1.45) - 0.01;
  } else if (price <= 150) {
    calculated = Math.round((price * 1.42) / 5) * 5 - 0.01;
  } else if (price <= 500) {
    calculated = Math.round((price * 1.38) / 10) * 10 - 0.01;
  } else if (price <= 1500) {
    calculated = Math.round((price * 1.35) / 25) * 25;
  } else {
    calculated = Math.round((price * 1.32) / 50) * 50;
  }

  return Number(calculated.toFixed(2));
}

let productsUpdated = 0;
let variantsUpdated = 0;
let totalOldSum = 0;
let totalNewSum = 0;

for (const product of catalog) {
  if (typeof product.price === 'number' && product.price > 0) {
    const oldPrice = product.price;
    const newPrice = calculateNewPrice(oldPrice);
    totalOldSum += oldPrice;
    totalNewSum += newPrice;
    product.price = newPrice;

    // Keep compareAtPrice higher than price
    if (product.compareAtPrice) {
      product.compareAtPrice = Math.max(
        Number((product.compareAtPrice * 1.025).toFixed(2)),
        calculateCompetitiveCompareAtPrice(newPrice) || Number((newPrice * 1.25).toFixed(2))
      );
    }
    productsUpdated++;
  }

  if (Array.isArray(product.variants)) {
    for (const variant of product.variants) {
      if (typeof variant.price === 'number' && variant.price > 0) {
        const oldVariantPrice = variant.price;
        const newVariantPrice = calculateNewPrice(oldVariantPrice);
        variant.price = newVariantPrice;

        if (variant.compareAtPrice) {
          variant.compareAtPrice = Math.max(
            Number((variant.compareAtPrice * 1.025).toFixed(2)),
            calculateCompetitiveCompareAtPrice(newVariantPrice) || Number((newVariantPrice * 1.25).toFixed(2))
          );
        }
        variantsUpdated++;
      }
    }
  }
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`✓ Updated data/catalog_seed.json:`);
console.log(`  - Products updated: ${productsUpdated}`);
console.log(`  - Variants updated: ${variantsUpdated}`);
console.log(`  - Average catalog price shift: ${(((totalNewSum - totalOldSum) / totalOldSum) * 100).toFixed(2)}%`);

// Also update top_20_flagship_products.json if exists
if (fs.existsSync(top20Path)) {
  const top20 = JSON.parse(fs.readFileSync(top20Path, 'utf8'));
  for (const item of top20) {
    if (typeof item.price === 'number' && item.price > 0) {
      const newPrice = calculateNewPrice(item.price);
      item.price = newPrice;
      if (item.compareAtPrice) {
        item.compareAtPrice = Math.max(
          Number((item.compareAtPrice * 1.025).toFixed(2)),
          calculateCompetitiveCompareAtPrice(newPrice) || Number((newPrice * 1.25).toFixed(2))
        );
      }
    }
  }
  fs.writeFileSync(top20Path, JSON.stringify(top20, null, 2), 'utf8');
  console.log(`✓ Updated data/top_20_flagship_products.json`);
}
