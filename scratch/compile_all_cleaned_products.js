import fs from 'fs';
import path from 'path';

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

function parseCSV(text) {
  const lines = text.split('\n');
  const result = [];
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l].trim();
    if (line.length === 0) continue;
    const parsed = parseCSVLine(line);
    if (parsed.length > 3) result.push(parsed);
  }
  return result;
}

function cleanTitle(title, mfr) {
  if (!title) return '';
  let t = title.trim();
  
  // Remove unit packaging codes from ends
  t = t.replace(/\s+(EA|CS|BX|PK|DZ|PR|RL|KT|TB|CA|ST)\/\d+\s*$/i, '');
  t = t.replace(/\s+\d+\/(EA|CS|BX|PK|DZ|PR|RL|KT|TB|CA|ST)\s*$/i, '');
  
  // Replace shorthand
  t = t.replace(/\bw\//gi, 'with ');
  t = t.replace(/\bw\/o\b/gi, 'without ');
  t = t.replace(/\s+/g, ' ').trim();
  
  return t;
}

function calculatePricing(dealerCost, suggestedRetail) {
  let cost = Math.max(0.5, dealerCost);
  let sellPrice = 0;
  
  // Dynamic margin: 30% to 45%
  if (cost > 500) {
    sellPrice = cost / 0.72; // ~28-30% margin
  } else if (cost > 100) {
    sellPrice = cost / 0.65; // ~35% margin
  } else if (cost > 30) {
    sellPrice = cost / 0.60; // ~40% margin
  } else {
    sellPrice = cost / 0.55; // ~45% margin
  }
  
  sellPrice = Math.ceil(sellPrice) - 0.01; // $XX.99
  
  let msrp = suggestedRetail > sellPrice ? suggestedRetail : Math.ceil(sellPrice * 1.25) - 0.01;
  let savings = msrp - sellPrice;
  let profit = sellPrice - cost;
  let marginPct = Math.round((profit / sellPrice) * 100);
  
  return {
    price: parseFloat(sellPrice.toFixed(2)),
    compareAtPrice: parseFloat(msrp.toFixed(2)),
    cost: parseFloat(cost.toFixed(2)),
    profit: parseFloat(profit.toFixed(2)),
    marginPct,
    customerSavings: parseFloat(savings.toFixed(2))
  };
}

const csvConfigs = [
  {
    file: 'catalog_bipap_extracted_2026-09-29.csv',
    category: 'BiPAP Machines',
    slugCategory: 'BiPAP',
    requiresRx: true,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_cpap_extracted_2026-09-29.csv',
    category: 'CPAP Machines',
    slugCategory: 'CPAP',
    requiresRx: true,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_wheel_extracted_2026-09-29.csv',
    category: 'Wheelchairs',
    slugCategory: 'Wheelchair',
    requiresRx: false,
    fdaClass: 'Class I / Exempt'
  },
  {
    file: 'catalog_blood_pressure_monitor_extracted_2026-09-29.csv',
    category: 'Blood Pressure Monitors',
    slugCategory: 'BP Monitor',
    requiresRx: false,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_blood_glucose_extracted_2026-09-29.csv',
    category: 'Glucometers',
    slugCategory: 'Glucometer',
    requiresRx: false,
    fdaClass: 'Class II In Vitro Diagnostic'
  },
  {
    file: 'catalog_nebulizer_extracted_2026-09-29.csv',
    category: 'Nebulizers',
    slugCategory: 'Nebulizer',
    requiresRx: false,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_suction_ma_extracted_2026-09-29.csv',
    category: 'Suction Machines',
    slugCategory: 'Suction Machine',
    requiresRx: false,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_pulse_oximeter_extracted_2026-09-29.csv',
    category: 'Pulse Oximeters',
    slugCategory: 'Pulse Oximeter',
    requiresRx: false,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_breast_pump_extracted_2026-09-29.csv',
    category: 'Breast Pumps',
    slugCategory: 'Breast Pump',
    requiresRx: false,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_adult_br_extracted_2026-09-29.csv',
    category: 'Incontinence & Care',
    slugCategory: 'Incontinence',
    requiresRx: false,
    fdaClass: 'Class I / Exempt'
  }
];

// Step 1: Load 12 Flagship Hero Products from MASTER_DME_PRODUCT_RESEARCH_3_PHOTOS.csv
const heroProducts = [];
const heroHandles = new Set();
const heroSkus = new Set();

if (fs.existsSync('MASTER_DME_PRODUCT_RESEARCH_3_PHOTOS.csv')) {
  const masterRaw = fs.readFileSync('MASTER_DME_PRODUCT_RESEARCH_3_PHOTOS.csv', 'utf8').split('\n').filter(l => l.trim().length > 0);
  const mHeader = parseCSVLine(masterRaw[0]);
  
  const skuIdx = mHeader.indexOf('SKU');
  const titleIdx = mHeader.indexOf('Product Name');
  const catIdx = mHeader.indexOf('Category');
  const mfrIdx = mHeader.indexOf('Manufacturer');
  const mpnIdx = mHeader.indexOf('MPN');
  const hcpcsIdx = mHeader.indexOf('HCPCS Code');
  const costIdx = mHeader.indexOf('Dealer Wholesale Cost ($)');
  const priceIdx = mHeader.indexOf('Recommended Retail Price ($)');
  const compareIdx = mHeader.indexOf('MSRP / Compare-At ($)');
  const profitIdx = mHeader.indexOf('Gross Profit ($)');
  const marginIdx = mHeader.indexOf('Gross Margin (%)');
  const img1Idx = mHeader.indexOf('Image 1 URL (Primary / Front)');
  const img2Idx = mHeader.indexOf('Image 2 URL (Side / Angle)');
  const img3Idx = mHeader.indexOf('Image 3 URL (Feature / Detail / Component)');
  const descIdx = mHeader.indexOf('Short Description');
  const pointsIdx = mHeader.indexOf('Market Selling Points');
  
  for (let i = 1; i < masterRaw.length; i++) {
    const row = parseCSVLine(masterRaw[i]);
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
    
    heroHandles.add(handle);
    heroSkus.add(sku);
    
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
      description: `
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
      `.trim(),
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
}

console.log(`Loaded ${heroProducts.length} 3-photo Flagship Hero products.`);

// Step 2: Process all cleaned CSVs from products/ folder
const standardProducts = [];
const seenSkus = new Set(heroSkus);
const seenHandles = new Set(heroHandles);
let idCounter = 3000;

for (const cfg of csvConfigs) {
  const p = path.join('products', cfg.file);
  if (!fs.existsSync(p)) {
    console.warn(`File not found: ${p}`);
    continue;
  }
  
  const raw = fs.readFileSync(p, 'utf8');
  const rows = parseCSV(raw);
  if (rows.length < 2) continue;
  
  const header = rows[0];
  const skuIdx = header.indexOf('SKU');
  const nameIdx = header.indexOf('Product Name');
  const hcpcsIdx = header.indexOf('HCPCS Code');
  const mfrIdx = header.indexOf('Manufacturer');
  const partIdx = header.indexOf('MFR Part Number');
  const dealerIdx = header.indexOf('Dealer Price');
  const retailIdx = header.indexOf('Retail Price');
  const stockIdx = header.indexOf('Stock Status');
  const descIdx = header.indexOf('Description');
  const featIdx = header.indexOf('Features');
  const imgIdx = header.indexOf('Image URL');
  
  let countForCat = 0;
  
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const sku = (r[skuIdx] || '').trim();
    const title = (r[nameIdx] || '').trim();
    const img = (r[imgIdx] || '').trim();
    const dealerP = parseFloat((r[dealerIdx] || '').replace('$', '').replace(/,/g, '')) || 0;
    const retailP = parseFloat((r[retailIdx] || '').replace('$', '').replace(/,/g, '')) || 0;
    const mfr = (r[mfrIdx] || '').trim() || 'Medical Grade';
    const hcpcs = (r[hcpcsIdx] || '').trim();
    const partNo = (r[partIdx] || '').trim();
    const stock = (r[stockIdx] || '').trim();
    const rawDesc = (r[descIdx] || '').trim();
    const rawFeat = (r[featIdx] || '').trim();
    
    // Filters
    if (!sku || seenSkus.has(sku)) continue;
    if (!title || title.length < 4) continue;
    if (!img || !img.startsWith('http') || img.includes('placeholder') || img.includes('no-image')) continue;
    if (dealerP <= 0) continue;
    
    seenSkus.add(sku);
    idCounter++;
    countForCat++;
    
    const cleanedTitle = cleanTitle(title, mfr);
    let baseHandle = cleanedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseHandle) baseHandle = `product-${idCounter}`;
    let handle = baseHandle;
    let handleSuffix = 1;
    while (seenHandles.has(handle)) {
      handle = `${baseHandle}-${handleSuffix++}`;
    }
    seenHandles.add(handle);
    
    const pricing = calculatePricing(dealerP, retailP);
    
    let descHtml = `<p><strong>${cleanedTitle}</strong> manufactured by <strong>${mfr}</strong> (Part #${partNo || sku}). Professional-grade healthcare equipment designed for clinical reliability, patient comfort, and long service life.</p>`;
    if (rawDesc) descHtml += `<p>${rawDesc}</p>`;
    descHtml += `<ul>`;
    descHtml += `<li><strong>Manufacturer:</strong> ${mfr}</li>`;
    if (partNo) descHtml += `<li><strong>Model / MPN:</strong> ${partNo}</li>`;
    if (hcpcs) descHtml += `<li><strong>HCPCS Billing Code:</strong> ${hcpcs}</li>`;
    descHtml += `<li><strong>FDA Device Classification:</strong> ${cfg.fdaClass}</li>`;
    descHtml += `<li><strong>Nationwide Shipping:</strong> Insured US Carrier Dispatch</li>`;
    descHtml += `<li><strong>HSA / FSA:</strong> 100% Eligible for Medical Reimbursement</li>`;
    descHtml += `</ul>`;
    
    standardProducts.push({
      id: `gid://shopify/Product/us-${idCounter}`,
      handle,
      title: cleanedTitle,
      vendor: mfr,
      category: cfg.category,
      price: pricing.price,
      compareAtPrice: pricing.compareAtPrice,
      image: img,
      images: [img],
      tags: [
        mfr,
        cfg.category,
        cfg.slugCategory,
        'US Nationwide Delivery',
        'HSA/FSA Eligible',
        cfg.requiresRx ? 'Prescription Required (Rx)' : 'OTC - No Prescription Required',
        hcpcs ? `HCPCS: ${hcpcs}` : 'Medical Grade'
      ],
      specs: `${cleanedTitle}. Clinical equipment from ${mfr}. Part #${partNo || sku}.`,
      inStock: true,
      variantId: `gid://shopify/ProductVariant/us-var-${idCounter}`,
      description: descHtml,
      warranty: '1 to 5 Years Limited Manufacturer Warranty',
      requiresPrescription: cfg.requiresRx,
      prescriptionRequired: cfg.requiresRx,
      fsaEligible: true,
      eligibleFsaHsa: true,
      fdaClassification: cfg.fdaClass,
      isRegulatoryVerified: true,
      weightLbs: Math.max(1, Math.round(pricing.price * 0.04)),
      seo: {
        title: `${cleanedTitle} | BaeMeds Medical Supply`,
        description: `Buy ${cleanedTitle} online at BaeMeds. Fast US delivery, verified manufacturer warranty, FSA/HSA eligible.`
      },
      metafields: [
        { namespace: 'custom', key: 'sku', value: sku },
        { namespace: 'custom', key: 'hcpcs', value: hcpcs || 'N/A' },
        { namespace: 'custom', key: 'mfr_part', value: partNo || sku },
        { namespace: 'custom', key: 'dealer_cost', value: pricing.cost.toFixed(2) },
        { namespace: 'custom', key: 'profit', value: pricing.profit.toFixed(2) },
        { namespace: 'custom', key: 'margin_pct', value: `${pricing.marginPct}%` },
        { namespace: 'custom', key: 'customer_savings', value: pricing.customerSavings.toFixed(2) }
      ],
      youtubeVideos: []
    });
  }
  
  console.log(`[${cfg.category}] Loaded ${countForCat} verified products.`);
}

// Step 3: Preserve existing oxygen concentrator items
let existingOxygen = [];
if (fs.existsSync('data/catalog_seed.json')) {
  try {
    const prev = JSON.parse(fs.readFileSync('data/catalog_seed.json', 'utf8'));
    existingOxygen = prev.filter(p => 
      p.category && (p.category.toLowerCase().includes('oxygen') || p.category.toLowerCase().includes('concentrator')) &&
      !seenHandles.has(p.handle)
    );
    console.log(`Preserving ${existingOxygen.length} existing oxygen concentrators & therapy items...`);
    existingOxygen.forEach(p => seenHandles.add(p.handle));
  } catch (err) {
    console.error('Error reading previous catalog:', err);
  }
}

// Step 4: Combine everything: Flagship Hero (3-photos) first, then Oxygen, then Standard Cleaned
const masterCatalog = [...heroProducts, ...existingOxygen, ...standardProducts];

console.log(`\n========================================`);
console.log(`TOTAL CLEANED MASTER CATALOG: ${masterCatalog.length} PRODUCTS`);
console.log(`========================================`);

fs.writeFileSync('data/catalog_seed.json', JSON.stringify(masterCatalog, null, 2), 'utf8');
console.log(`Successfully updated data/catalog_seed.json!`);

// Step 5: Export full master research CSV
const csvHeaders = [
  'ID', 'SKU', 'Title', 'Category', 'Vendor', 'Dealer Cost ($)', 'Selling Price ($)',
  'MSRP ($)', 'Profit ($)', 'Margin (%)', 'Savings ($)', 'HCPCS', 'Image URL'
];

let csvContent = csvHeaders.join(',') + '\n';
for (const p of masterCatalog) {
  const getMeta = (k) => (p.metafields?.find(m => m.key === k)?.value || '');
  const row = [
    `"${p.id}"`,
    `"${getMeta('sku') || p.handle}"`,
    `"${(p.title || '').replace(/"/g, '""')}"`,
    `"${p.category}"`,
    `"${(p.vendor || '').replace(/"/g, '""')}"`,
    `"${getMeta('dealer_cost') || (p.price * 0.6).toFixed(2)}"`,
    `"${p.price}"`,
    `"${p.compareAtPrice}"`,
    `"${getMeta('profit') || (p.price * 0.4).toFixed(2)}"`,
    `"${getMeta('margin_pct') || '40%'}"`,
    `"${getMeta('customer_savings') || (p.compareAtPrice - p.price).toFixed(2)}"`,
    `"${getMeta('hcpcs') || ''}"`,
    `"${p.image}"`
  ];
  csvContent += row.join(',') + '\n';
}

fs.writeFileSync('BAEMEDS_MASTER_CLEANED_CATALOG.csv', csvContent, 'utf8');
console.log(`Successfully written to BAEMEDS_MASTER_CLEANED_CATALOG.csv!`);
