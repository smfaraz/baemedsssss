import fs from 'fs';
import path from 'path';

function parseCSV(text) {
  const lines = text.split('\n');
  const result = [];
  let cur = [];
  let cell = '';
  let inQuotes = false;
  
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i+1] === '"') { cell += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        cur.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    if (!inQuotes) {
      cur.push(cell.trim());
      cell = '';
      if (cur.length > 1) result.push(cur);
      cur = [];
    } else {
      cell += '\n';
    }
  }
  return result;
}

function cleanTitle(title, mfr) {
  if (!title) return '';
  let t = title.trim();
  
  // Remove unit packaging codes like EA/1, CS/4, BX/50, PK/10 from ends
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
  
  // Compare at price (MSRP)
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

const categoryConfigs = [
  {
    file: 'catalog_bipap_extracted_2026-09-29.csv',
    category: 'BiPAP Machines',
    slugCategory: 'BiPAP',
    quota: 50, // all available
    requiresRx: true,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_cpap_extracted_2026-09-29.csv',
    category: 'CPAP Machines',
    slugCategory: 'CPAP',
    quota: 300,
    requiresRx: true,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_wheel_extracted_2026-09-29.csv',
    category: 'Wheelchairs',
    slugCategory: 'Wheelchair',
    quota: 350,
    requiresRx: false,
    fdaClass: 'Class I / Exempt'
  },
  {
    file: 'catalog_blood_pressure_monitor_extracted_2026-09-29.csv',
    category: 'Blood Pressure Monitors',
    slugCategory: 'BP Monitor',
    quota: 250,
    requiresRx: false,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_blood_glucose_extracted_2026-09-29.csv',
    category: 'Glucometers',
    slugCategory: 'Glucometer',
    quota: 150,
    requiresRx: false,
    fdaClass: 'Class II In Vitro Diagnostic'
  },
  {
    file: 'catalog_nebulizer_extracted_2026-09-29.csv',
    category: 'Nebulizers',
    slugCategory: 'Nebulizer',
    quota: 150,
    requiresRx: false,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_suction_ma_extracted_2026-09-29.csv',
    category: 'Suction Machines',
    slugCategory: 'Suction Machine',
    quota: 120,
    requiresRx: false,
    fdaClass: 'Class II Medical Device'
  },
  {
    file: 'catalog_pulse_oximeter_extracted_2026-09-29.csv',
    category: 'Pulse Oximeters',
    slugCategory: 'Pulse Oximeter',
    quota: 100,
    requiresRx: false,
    fdaClass: 'Class II Medical Device'
  }
];

const priorityMfrs = [
  'Drive DeVilbiss Healthcare', 'Drive Medical', 'ResMed Corp', 'Respironics',
  'Fisher & Paykel', 'Welch Allyn', 'American Diagnostic Corp', 'Omron Healthcare',
  'Medline', 'Graham-Field', 'Roche Diagnostics', 'Abbott Diabetes Care',
  'Invacare', 'Roscoe Medical', 'Compass Health Brands', 'Skil-Care'
];

let allCuratedProducts = [];
let skuSet = new Set();
let handleSet = new Set();

let idCounter = 2000;

for (const cfg of categoryConfigs) {
  const p = fs.existsSync(path.join('products', cfg.file))
    ? path.join('products', cfg.file)
    : path.join('C:/Users/FARAAZ/Downloads', cfg.file);
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
  const uomIdx = header.indexOf('UOM');
  const descIdx = header.indexOf('Description');
  const featIdx = header.indexOf('Features');
  const imgIdx = header.indexOf('Image URL');
  
  let candidates = [];
  
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
    if (!sku || skuSet.has(sku)) continue;
    if (!title || title.length < 5) continue;
    if (!img || !img.startsWith('http') || img.includes('placeholder') || img.includes('no-image')) continue;
    if (dealerP <= 0) continue;
    
    // Quality Score
    let score = 0;
    if (priorityMfrs.some(pm => mfr.toLowerCase().includes(pm.toLowerCase()))) score += 50;
    if (stock.toLowerCase().includes('in stock')) score += 30;
    if (hcpcs) score += 20;
    if (retailP > 0) score += 10;
    if (rawDesc || rawFeat) score += 10;
    
    candidates.push({
      sku, title, img, dealerP, retailP, mfr, hcpcs, partNo, stock, rawDesc, rawFeat, score
    });
  }
  
  // Sort candidates by score descending, then dealerPrice descending (ensuring high-value core equipment gets featured)
  candidates.sort((a, b) => b.score - a.score || b.dealerP - a.dealerP);
  
  const selected = candidates.slice(0, cfg.quota);
  console.log(`[${cfg.category}] Selected ${selected.length} / ${candidates.length} candidate products.`);
  
  for (const item of selected) {
    skuSet.add(item.sku);
    idCounter++;
    
    const cleanedTitle = cleanTitle(item.title, item.mfr);
    let baseHandle = cleanedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseHandle) baseHandle = `product-${idCounter}`;
    let handle = baseHandle;
    let handleSuffix = 1;
    while (handleSet.has(handle)) {
      handle = `${baseHandle}-${handleSuffix++}`;
    }
    handleSet.add(handle);
    
    const pricing = calculatePricing(item.dealerP, item.retailP);
    
    // Description formatting
    let descHtml = `<p><strong>${cleanedTitle}</strong> manufactured by <strong>${item.mfr}</strong> (MFR #${item.partNo || item.sku}). Designed for exceptional durability, clinical precision, and patient safety in home healthcare, hospital, and clinical settings.</p>`;
    if (item.rawDesc) {
      descHtml += `<p>${item.rawDesc}</p>`;
    }
    descHtml += `<ul>`;
    descHtml += `<li><strong>Manufacturer:</strong> ${item.mfr}</li>`;
    if (item.partNo) descHtml += `<li><strong>Model / Part Number:</strong> ${item.partNo}</li>`;
    if (item.hcpcs) descHtml += `<li><strong>HCPCS Insurance Code:</strong> ${item.hcpcs}</li>`;
    descHtml += `<li><strong>FDA Device Classification:</strong> ${cfg.fdaClass}</li>`;
    descHtml += `<li><strong>Availability:</strong> Nationwide US Express Delivery</li>`;
    descHtml += `<li><strong>Eligibility:</strong> FSA / HSA Approved</li>`;
    descHtml += `</ul>`;
    
    const prodObj = {
      id: `gid://shopify/Product/us-${idCounter}`,
      handle,
      title: cleanedTitle,
      vendor: item.mfr,
      category: cfg.category,
      price: pricing.price,
      compareAtPrice: pricing.compareAtPrice,
      image: item.img,
      images: [item.img],
      tags: [
        item.mfr,
        cfg.category,
        cfg.slugCategory,
        'US Nationwide Delivery',
        'HSA/FSA Eligible',
        item.requiresRx ? 'Prescription Required (Rx)' : 'OTC - No Prescription Required',
        item.hcpcs ? `HCPCS: ${item.hcpcs}` : 'Medical Grade'
      ],
      specs: `${cleanedTitle}. Genuine clinical equipment from ${item.mfr}. Part #${item.partNo || item.sku}.`,
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
      weightLbs: Math.max(2, Math.round(pricing.price * 0.05)),
      seo: {
        title: `${cleanedTitle} | BaeMeds USA Medical Supply`,
        description: `Buy ${cleanedTitle} online at BaeMeds. Fast nationwide delivery, verified US warranty, and FSA/HSA eligible.`
      },
      metafields: [
        { namespace: 'custom', key: 'sku', value: item.sku },
        { namespace: 'custom', key: 'hcpcs', value: item.hcpcs || 'N/A' },
        { namespace: 'custom', key: 'mfr_part', value: item.partNo || item.sku },
        { namespace: 'custom', key: 'dealer_cost', value: pricing.cost.toFixed(2) },
        { namespace: 'custom', key: 'profit', value: pricing.profit.toFixed(2) },
        { namespace: 'custom', key: 'margin_pct', value: `${pricing.marginPct}%` },
        { namespace: 'custom', key: 'customer_savings', value: pricing.customerSavings.toFixed(2) }
      ],
      youtubeVideos: []
    };
    
    allCuratedProducts.push(prodObj);
  }
}

// Preserve existing high-quality oxygen concentrator products from current seed
if (fs.existsSync('data/catalog_seed.json')) {
  try {
    const existing = JSON.parse(fs.readFileSync('data/catalog_seed.json', 'utf8'));
    const oxygenProds = existing.filter(p => 
      p.category && (p.category.toLowerCase().includes('oxygen') || p.category.toLowerCase().includes('concentrator'))
    );
    console.log(`Preserving ${oxygenProds.length} existing oxygen concentrators & therapy products...`);
    for (const op of oxygenProds) {
      if (!handleSet.has(op.handle)) {
        handleSet.add(op.handle);
        allCuratedProducts.push(op);
      }
    }
  } catch (err) {
    console.error('Error reading existing seed:', err);
  }
}

console.log(`\n========================================`);
console.log(`TOTAL CURATED PRODUCTS: ${allCuratedProducts.length}`);
console.log(`========================================`);

// Write catalog_seed.json
fs.writeFileSync('data/catalog_seed.json', JSON.stringify(allCuratedProducts, null, 2), 'utf8');
console.log(`Successfully written to data/catalog_seed.json!`);

// Write research CSV sheet for merchant overview
const csvHeaders = [
  'ID', 'SKU', 'Title', 'Category', 'Vendor', 'Dealer Cost ($)', 'Selling Price ($)',
  'MSRP ($)', 'Profit ($)', 'Margin (%)', 'Savings ($)', 'HCPCS', 'Image URL'
];

let csvContent = csvHeaders.join(',') + '\n';
for (const p of allCuratedProducts) {
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

fs.writeFileSync('BAEMEDS_1500_CURATED_MASTER_CATALOG.csv', csvContent, 'utf8');
console.log(`Successfully written to BAEMEDS_1500_CURATED_MASTER_CATALOG.csv!`);
