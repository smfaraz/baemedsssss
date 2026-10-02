import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

console.log(`Initial total catalog size: ${catalog.length}`);

// Helper to determine if a product is an adult brief / absorbent underwear
const isBriefOrUnderwear = (p) => {
  const cat = (p.category || '').toLowerCase();
  const t = (p.title || '').toLowerCase();
  return (
    (cat.includes('incontinence') || t.includes('brief') || t.includes('underwear') || t.includes('diaper') || t.includes('pull on')) &&
    (t.includes('brief') || t.includes('underwear') || t.includes('pull on') || t.includes('liner') || t.includes('diaper'))
  );
};

const briefProducts = catalog.filter(isBriefOrUnderwear);
const nonBriefProducts = catalog.filter((p) => !isBriefOrUnderwear(p));

console.log(`Found ${briefProducts.length} brief/underwear items to consolidate.`);
console.log(`Remaining non-brief products: ${nonBriefProducts.length}`);

function extractSize(title) {
  const m = title.match(/\b(Youth|Small\s*\/\s*Medium|X-Small|Small|Medium|Large|X-Large|XL|2X-Large|2XL|3X-Large|3XL|4X-Large|4XL|5X-Large|5XL|XX-Large|Bariatric|Adult Regular|Regular|Size\s+\d+|One Size Fits Most)\b/i);
  if (!m) return 'Regular';
  let s = m[0].trim();
  if (/^xl$/i.test(s)) return 'X-Large';
  if (/^2xl$/i.test(s) || /^xx-large$/i.test(s)) return '2X-Large';
  if (/^3xl$/i.test(s)) return '3X-Large';
  if (/^4xl$/i.test(s)) return '4X-Large';
  if (/^adult regular$/i.test(s)) return 'Regular';
  return s;
}

function getCleanFamilyTitle(title) {
  return title
    .replace(/\b(Adult\s+)?(Youth|Small\s*\/\s*Medium|X-Small|Small|Medium|Large|X-Large|XL|2X-Large|2XL|3X-Large|3XL|4X-Large|4XL|5X-Large|5XL|XX-Large|Bariatric|Adult Regular|Regular|Size\s+\d+|One Size Fits Most)\b/gi, '')
    .replace(/\b(Adult)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

const SIZE_ORDER = [
  'Youth',
  'X-Small',
  'Small',
  'Small / Medium',
  'Medium',
  'Regular',
  'Large',
  'X-Large',
  '2X-Large',
  '3X-Large',
  '4X-Large',
  '5X-Large',
  'Bariatric',
  'Size 1',
  'Size 2',
  'Size 3',
  'Size 4',
  'Size 5',
  'One Size Fits Most'
];

function sortSizes(a, b) {
  const idxA = SIZE_ORDER.indexOf(a.size);
  const idxB = SIZE_ORDER.indexOf(b.size);
  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;
  return a.price - b.price;
}

// Group brief products into family maps (case-insensitive key normalization)
const familyMap = new Map();

for (const p of briefProducts) {
  const cleanTitle = getCleanFamilyTitle(p.title);
  const vendor = p.vendor || 'BaeMeds';
  const normKey = `${vendor.toLowerCase().trim()} ::: ${cleanTitle.toLowerCase().trim()}`;

  if (!familyMap.has(normKey)) {
    familyMap.set(normKey, {
      vendor,
      cleanTitle,
      items: [],
    });
  }
  familyMap.get(normKey).items.push(p);
}

const consolidatedParents = [];

for (const [, group] of familyMap.entries()) {
  const { vendor, cleanTitle, items } = group;

  const variants = items.map((item) => {
    const size = extractSize(item.title);
    
    const sameSizeItems = items.filter(i => extractSize(i.title) === size);
    let packageQuantity = 'Standard Pack';
    if (sameSizeItems.length > 1) {
      const sortedByPrice = [...sameSizeItems].sort((a, b) => a.price - b.price);
      if (item.id === sortedByPrice[0].id) {
        packageQuantity = 'Standard Pack';
      } else {
        packageQuantity = 'Economy / Value Pack';
      }
    }

    return {
      id: item.variantId || `var-${item.id.replace(/^prd-/, '')}`,
      title: `${size}${packageQuantity !== 'Standard Pack' ? ` - ${packageQuantity}` : ''}`,
      size: size,
      packageQuantity: packageQuantity,
      price: Number(item.price),
      compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
      sku: item.sku || `SKU-${item.id}`,
      inStock: item.inStock ?? true,
      inventoryQuantity: item.inventoryQuantity ?? 25,
      image: item.image,
      originalProductId: item.id,
      handle: item.handle,
    };
  });

  variants.sort(sortSizes);

  const sortedByPrice = [...items].sort((a, b) => a.price - b.price);
  const rep = sortedByPrice.find((i) => i.image && !i.image.includes('placeholder')) || sortedByPrice[0];

  const allImages = [...new Set(items.flatMap((i) => [i.image, ...(i.images || [])]).filter(Boolean))];
  const lowestPrice = Math.min(...variants.map((v) => v.price));
  const minCompareAt = variants.some((v) => v.compareAtPrice)
    ? Math.max(...variants.map((v) => v.compareAtPrice || 0))
    : null;

  const canonicalHandle = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const consolidatedProduct = {
    ...rep,
    id: rep.id,
    handle: canonicalHandle || rep.handle,
    title: cleanTitle,
    vendor: vendor || rep.vendor,
    price: lowestPrice,
    compareAtPrice: minCompareAt && minCompareAt > lowestPrice ? minCompareAt : null,
    images: allImages.length > 0 ? allImages : [rep.image],
    image: allImages[0] || rep.image,
    variants: variants,
    variantId: variants[0].id,
    description: rep.description,
    features: [
      `Available in sizes: ${[...new Set(variants.map(v => v.size))].join(', ')}`,
      `Vendor: ${vendor}`,
      'Hospital Grade Absorbency & Skin Protection',
      'FSA / HSA Eligible Expense',
      ...(rep.features || []).filter(f => !f.toLowerCase().includes('size')),
    ],
    tags: [
      ...new Set([
        ...(rep.tags || []),
        'Adult Briefs',
        'Multiple Sizes',
        'Incontinence & Care',
      ]),
    ],
  };

  consolidatedParents.push(consolidatedProduct);
}

console.log(`Consolidated into ${consolidatedParents.length} parent products.`);

// Ensure all handles across the entire catalog are 100% globally unique
const usedHandles = new Set();
const newCatalog = [];

for (const p of [...nonBriefProducts, ...consolidatedParents]) {
  let baseHandle = p.handle;
  let finalHandle = baseHandle;
  let counter = 2;
  while (usedHandles.has(finalHandle)) {
    finalHandle = `${baseHandle}-${counter}`;
    counter++;
  }
  usedHandles.add(finalHandle);
  newCatalog.push({
    ...p,
    handle: finalHandle,
  });
}

console.log(`New total catalog size: ${newCatalog.length} products (all unique handles verified).`);

fs.writeFileSync(catalogPath, JSON.stringify(newCatalog, null, 2), 'utf8');
console.log('✓ Successfully wrote deduplicated consolidated catalog to data/catalog_seed.json!');
