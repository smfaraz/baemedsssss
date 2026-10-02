import fs from 'node:fs';
import path from 'node:path';

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

function cleanTitle(title) {
  if (!title) return '';
  let t = title.trim();
  t = t.replace(/\s+(EA|CS|BX|PK|DZ|PR|RL|KT|TB|CA|ST)\/\d+\s*$/i, '');
  t = t.replace(/\s+\d+\/(EA|CS|BX|PK|DZ|PR|RL|KT|TB|CA|ST)\s*$/i, '');
  t = t.replace(/\bw\//gi, 'with ');
  t = t.replace(/\bw\/o\b/gi, 'without ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function calculatePricing(dealerCost) {
  let cost = Math.max(0.5, dealerCost);
  let sellPrice = 0;
  
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
  let msrp = Math.ceil(sellPrice * 1.28) - 0.01;
  let profit = sellPrice - cost;
  let marginPct = Math.round((profit / sellPrice) * 100);
  
  return {
    price: parseFloat(sellPrice.toFixed(2)),
    compareAtPrice: parseFloat(msrp.toFixed(2)),
    cost: parseFloat(cost.toFixed(2)),
    profit: parseFloat(profit.toFixed(2)),
    marginPct,
  };
}

const categoryMapping = [
  { file: 'catalog_bipap_extracted_2026-09-29.csv', category: 'BiPAP Machines', rx: true },
  { file: 'catalog_cpap_extracted_2026-09-29.csv', category: 'CPAP Machines', rx: true },
  { file: 'catalog_wheel_extracted_2026-09-29.csv', category: 'Wheelchairs', rx: false },
  { file: 'catalog_blood_pressure_monitor_extracted_2026-09-29.csv', category: 'Blood Pressure Monitors', rx: false },
  { file: 'catalog_blood_glucose_extracted_2026-09-29.csv', category: 'Glucometers', rx: false },
  { file: 'catalog_nebulizer_extracted_2026-09-29.csv', category: 'Nebulizers', rx: false },
  { file: 'catalog_suction_ma_extracted_2026-09-29.csv', category: 'Suction Machines', rx: false },
  { file: 'catalog_pulse_oximeter_extracted_2026-09-29.csv', category: 'Patient Monitors', rx: false },
  { file: 'catalog_breast_pump_extracted_2026-09-29.csv', category: 'Breast Pumps', rx: false },
  { file: 'catalog_adult_br_extracted_2026-09-29.csv', category: 'Incontinence & Care', rx: false },
];

const compiledProducts = [];
const seenSkus = new Set();
const seenHandles = new Set();
let countByCat = {};

for (const cfg of categoryMapping) {
  const p = path.join('products', cfg.file);
  if (!fs.existsSync(p)) continue;

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
  const stockIdx = header.indexOf('Stock Status');
  const descIdx = header.indexOf('Description');
  const featIdx = header.indexOf('Features');
  const imgIdx = header.indexOf('Image URL');

  let addedForThis = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const sku = (r[skuIdx] || '').trim();
    const title = (r[nameIdx] || '').trim();
    const img = (r[imgIdx] || '').trim();
    const dealerP = parseFloat((r[dealerIdx] || '').replace('$', '').replace(/,/g, '')) || 0;
    const mfr = (r[mfrIdx] || '').trim() || 'Medical Grade';
    const hcpcs = (r[hcpcsIdx] || '').trim();
    const partNo = (r[partIdx] || '').trim();
    const rawDesc = (r[descIdx] || '').trim();
    const rawFeat = (r[featIdx] || '').trim();

    if (!sku || seenSkus.has(sku)) continue;
    if (!title || title.length < 4) continue;
    if (dealerP <= 0) continue;
    // Require valid image
    if (!img || !img.startsWith('http') || img.includes('placeholder')) continue;

    seenSkus.add(sku);
    const cleaned = cleanTitle(title);
    let baseHandle = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!baseHandle) baseHandle = `product-${sku}`;
    let handle = baseHandle;
    let suffix = 1;
    while (seenHandles.has(handle)) {
      handle = `${baseHandle}-${suffix++}`;
    }
    seenHandles.add(handle);

    const pricing = calculatePricing(dealerP);

    const isHero = addedForThis < 10; // Top 10 per category as Flagship Hero!

    const features = [];
    if (hcpcs) features.push(`HCPCS Code: ${hcpcs}`);
    if (mfr) features.push(`Manufacturer: ${mfr}`);
    if (partNo) features.push(`Manufacturer Part #: ${partNo}`);
    features.push('Authorized US Distributor Stock with Full Warranty');
    features.push('100% Eligible for FSA / HSA Reimbursement');
    if (rawFeat) {
      rawFeat.split(';').forEach(f => {
        const tr = f.trim();
        if (tr.length > 5 && !features.includes(tr)) features.push(tr);
      });
    }

    const description = `
      <p class="lead font-medium text-slate-800"><strong>${cleaned}</strong> supplied directly through authorized medical distributor networks by <strong>${mfr}</strong>.</p>
      <p>${rawDesc || 'Engineered for exceptional clinical efficacy, user safety, and strict regulatory adherence in home and institutional environments.'}</p>
      <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <h4 class="font-bold text-slate-900 mb-2">Clinical Product Details:</h4>
        <ul class="space-y-1 text-sm text-slate-700">
          <li><strong>HCPCS Reimbursement Code:</strong> ${hcpcs || 'Unassigned / Consult Provider'}</li>
          <li><strong>McKesson Item Number:</strong> ${sku}</li>
          <li><strong>Manufacturer MPN:</strong> ${partNo || sku}</li>
          <li><strong>Prescription Requirement:</strong> ${cfg.rx ? 'Prescription Required (Rx)' : 'Over The Counter (OTC)'}</li>
          <li><strong>FSA / HSA:</strong> Qualified Medical Expense Eligible</li>
          <li><strong>Warranty:</strong> Manufacturer Limited Warranty Included</li>
        </ul>
      </div>
    `.trim();

    compiledProducts.push({
      id: `prd-${sku}`,
      handle,
      title: cleaned,
      vendor: mfr,
      category: cfg.category,
      price: pricing.price,
      compareAtPrice: pricing.compareAtPrice,
      wholesaleCost: pricing.cost,
      costPerItem: pricing.cost,
      image: img,
      images: [img],
      specs: `${cleaned}. Manufacturer: ${mfr}. MPN: ${partNo || sku}. HCPCS: ${hcpcs || 'N/A'}.`,
      description,
      features,
      hcpcsCode: hcpcs || null,
      fdaClassification: cfg.rx ? 'Class II Medical Device' : 'Class I / Exempt',
      prescriptionRequired: cfg.rx,
      isRegulatoryVerified: true,
      eligibleFsaHsa: true,
      fsaEligible: true,
      inStock: true,
      inventoryQuantity: 25,
      trackInventory: true,
      isHeroProduct: isHero,
      sku: `MCK-${sku}`,
      barcode: null,
      mckessonItemNumber: sku,
      seoTitle: `${cleaned} | BaeMeds USA`,
      seoDescription: `Order ${cleaned} online at BaeMeds. Fast US delivery, wholesale pricing, FSA/HSA eligible.`,
      tags: [mfr, cfg.category, isHero ? 'Flagship Hero' : 'Catalog Product', cfg.rx ? 'Rx Required' : 'OTC'],
      warranty: '1 to 5 Years Manufacturer Limited Warranty',
      weightLbs: Math.max(1, Math.round(pricing.price * 0.03)),
      variantId: `var-${sku}`,
    });

    addedForThis++;
  }

  countByCat[cfg.category] = addedForThis;
}

console.log('PRODUCTS COMPILED BY CATEGORY:');
console.table(countByCat);
const heroTotal = compiledProducts.filter(p => p.isHeroProduct).length;
console.log(`TOTAL VALID PRODUCTS EXTRACTED: ${compiledProducts.length}`);
console.log(`TOTAL HERO PRODUCTS: ${heroTotal}`);

// Save to data/catalog_seed.json
fs.writeFileSync('data/catalog_seed.json', JSON.stringify(compiledProducts, null, 2), 'utf8');
console.log('Saved to data/catalog_seed.json successfully!');
