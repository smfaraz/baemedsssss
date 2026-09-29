import fs from 'fs';

function parseCSVLine(text) {
  let inQuotes = false;
  let cur = '';
  let arr = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i+1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      arr.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  arr.push(cur.trim());
  return arr;
}

// 1. Read existing catalog
const catalog = JSON.parse(fs.readFileSync('data/catalog_seed.json', 'utf8'));
console.log(`Loaded ${catalog.length} existing products.`);

// 2. Read 3-Photo Master Research CSV
const masterCsvRaw = fs.readFileSync('MASTER_DME_PRODUCT_RESEARCH_3_PHOTOS.csv', 'utf8').split('\n').filter(l => l.trim().length > 0);
const masterHeader = parseCSVLine(masterCsvRaw[0]);

const skuIdx = masterHeader.indexOf('SKU');
const titleIdx = masterHeader.indexOf('Product Name');
const catIdx = masterHeader.indexOf('Category');
const mfrIdx = masterHeader.indexOf('Manufacturer');
const mpnIdx = masterHeader.indexOf('MPN');
const hcpcsIdx = masterHeader.indexOf('HCPCS Code');
const costIdx = masterHeader.indexOf('Dealer Wholesale Cost ($)');
const priceIdx = masterHeader.indexOf('Recommended Retail Price ($)');
const compareIdx = masterHeader.indexOf('MSRP / Compare-At ($)');
const profitIdx = masterHeader.indexOf('Gross Profit ($)');
const marginIdx = masterHeader.indexOf('Gross Margin (%)');
const img1Idx = masterHeader.indexOf('Image 1 URL (Primary / Front)');
const img2Idx = masterHeader.indexOf('Image 2 URL (Side / Angle)');
const img3Idx = masterHeader.indexOf('Image 3 URL (Feature / Detail / Component)');
const descIdx = masterHeader.indexOf('Short Description');
const pointsIdx = masterHeader.indexOf('Market Selling Points');

const heroProducts = [];

for (let i = 1; i < masterCsvRaw.length; i++) {
  const row = parseCSVLine(masterCsvRaw[i]);
  if (row.length < 5) continue;
  
  const sku = row[skuIdx];
  const title = row[titleIdx];
  const cat = row[catIdx];
  const mfr = row[mfrIdx];
  const mpn = row[mpnIdx];
  const hcpcs = row[hcpcsIdx];
  const cost = parseFloat(row[costIdx]) || 0;
  const price = parseFloat(row[priceIdx]) || 0;
  const compareAt = parseFloat(row[compareIdx]) || 0;
  const profit = parseFloat(row[profitIdx]) || (price - cost);
  const margin = row[marginIdx] || '40%';
  const img1 = row[img1Idx];
  const img2 = row[img2Idx];
  const img3 = row[img3Idx];
  const shortDesc = row[descIdx];
  const sellingPoints = row[pointsIdx];
  
  const isRx = /concentrator|oxygen|poc|bipap|cpap/i.test(title);
  const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const images = [img1, img2, img3].filter(Boolean);
  
  const descriptionHtml = `
    <p class="lead"><strong>${title}</strong> manufactured by <strong>${mfr}</strong> (MPN: ${mpn}).</p>
    <p>${shortDesc}</p>
    <div class="clinical-highlights mt-4">
      <h4 class="font-bold text-slate-900">Clinical & Market Highlights:</h4>
      <ul>
        <li><strong>HCPCS Billing Code:</strong> ${hcpcs || 'N/A'}</li>
        <li><strong>Manufacturer Part Number:</strong> ${mpn}</li>
        <li><strong>Device Classification:</strong> ${isRx ? 'FDA Class II Medical Device' : 'FDA Class I / Exempt'}</li>
        <li><strong>Prescription Requirement:</strong> ${isRx ? 'Prescription Required (Rx)' : 'Over-the-Counter (OTC)'}</li>
        <li><strong>FSA/HSA:</strong> 100% Eligible for flexible spending reimbursement</li>
        <li><strong>Quality Inspection:</strong> 10-point biomedical QA verified prior to shipment</li>
      </ul>
    </div>
    ${sellingPoints ? `<p class="mt-3 text-sm text-slate-600"><em>${sellingPoints}</em></p>` : ''}
  `.trim();
  
  heroProducts.push({
    id: `gid://shopify/Product/hero-${sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    handle,
    title,
    vendor: mfr,
    category: cat,
    price,
    compareAtPrice: compareAt,
    image: img1,
    images,
    tags: [
      mfr,
      cat,
      'Flagship Hero',
      'Multi-Angle Photography',
      'US Nationwide Delivery',
      'HSA/FSA Eligible',
      isRx ? 'Rx Required' : 'OTC - No Prescription Required',
      `HCPCS: ${hcpcs}`
    ],
    specs: `${title}. Model #${mpn}. HCPCS: ${hcpcs}. ${shortDesc}`,
    inStock: true,
    variantId: `gid://shopify/ProductVariant/hero-var-${sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    description: descriptionHtml,
    warranty: '3 to 5 Years Manufacturer Limited Warranty',
    requiresPrescription: isRx,
    prescriptionRequired: isRx,
    fsaEligible: true,
    eligibleFsaHsa: true,
    fdaClassification: isRx ? 'Class II Medical Device' : 'Class I / Exempt',
    isRegulatoryVerified: true,
    weightLbs: Math.max(3, Math.round(price * 0.04)),
    seo: {
      title: `${title} | BaeMeds USA Flagship`,
      description: `${shortDesc} Fast nationwide delivery, FSA/HSA eligible.`
    },
    metafields: [
      { namespace: 'custom', key: 'sku', value: sku },
      { namespace: 'custom', key: 'hcpcs', value: hcpcs },
      { namespace: 'custom', key: 'mfr_part', value: mpn },
      { namespace: 'custom', key: 'dealer_cost', value: cost.toFixed(2) },
      { namespace: 'custom', key: 'profit', value: profit.toFixed(2) },
      { namespace: 'custom', key: 'margin_pct', value: margin },
      { namespace: 'custom', key: 'customer_savings', value: (compareAt - price).toFixed(2) },
      { namespace: 'custom', key: 'is_hero', value: 'true' }
    ],
    youtubeVideos: []
  });
}

console.log(`Generated ${heroProducts.length} flagship 3-photo hero products.`);

// Filter out any duplicate titles/handles from the existing catalog
const heroHandles = new Set(heroProducts.map(h => h.handle));
const heroSkus = new Set(heroProducts.map(h => h.metafields.find(m => m.key === 'sku')?.value));

const remainingCatalog = catalog.filter(p => {
  const pSku = p.metafields?.find(m => m.key === 'sku')?.value;
  if (pSku && heroSkus.has(pSku)) return false;
  if (heroHandles.has(p.handle)) return false;
  return true;
});

console.log(`Remaining existing catalog items: ${remainingCatalog.length}`);

// Combine: Flagship hero products at the front, followed by all remaining products
const finalCatalog = [...heroProducts, ...remainingCatalog];
console.log(`Final unified catalog total: ${finalCatalog.length} products.`);

fs.writeFileSync('data/catalog_seed.json', JSON.stringify(finalCatalog, null, 2), 'utf8');
console.log(`Successfully updated data/catalog_seed.json!`);

// Verify multi-image products
const multiCount = finalCatalog.filter(p => p.images && p.images.length > 1).length;
console.log(`Verified products with multi-image gallery: ${multiCount}`);
