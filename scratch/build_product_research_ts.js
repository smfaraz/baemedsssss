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

const csvPath = 'c:/Users/FARAAZ/Downloads/beameds-main/baemeds usa/beameds-main/BAEMEDS_500_BEST_PRODUCTS_RESEARCH_SHEET.csv';
const raw = fs.readFileSync(csvPath, 'utf8').split('\n').filter(l => l.trim().length > 0);

console.log('Total CSV lines:', raw.length);

function getHcpcs(cat, title) {
  const l = (cat + ' ' + title).toLowerCase();
  if (l.includes('portable oxygen') || l.includes('inogen') || l.includes('lifechoice')) return 'E1390 / E1392';
  if (l.includes('10 liter') || l.includes('10l')) return 'E1392';
  if (l.includes('oxygen concentrator') || l.includes('525ds') || l.includes('5 liter')) return 'E1390';
  if (l.includes('bipap') || l.includes('bicough')) return 'E0470';
  if (l.includes('cpap')) return 'E0601';
  if (l.includes('suction')) return 'E0600';
  if (l.includes('nebulizer compressor') || l.includes('compair') || l.includes('power neb')) return 'E0570';
  if (l.includes('nebulizer') && (l.includes('filter') || l.includes('kit') || l.includes('mask'))) return 'A7003 / A7005';
  if (l.includes('cannula') || l.includes('tubing')) return 'A4615 / A4616';
  if (l.includes('wheelchair') && (l.includes('heavy') || l.includes('bariatric'))) return 'K0007';
  if (l.includes('wheelchair') && l.includes('lightweight')) return 'K0003';
  if (l.includes('wheelchair') || l.includes('transport chair')) return 'K0001';
  if (l.includes('commode')) return 'E0163';
  if (l.includes('shower') || l.includes('bench') || l.includes('bath')) return 'E0240';
  if (l.includes('pulse oximeter')) return 'E0445';
  if (l.includes('blood pressure') || l.includes('bp')) return 'A4670';
  if (l.includes('glucose')) return 'E0607';
  if (l.includes('tens')) return 'E0730';
  return 'A9900 (DME Misc)';
}

function getNormalizedCategory(rawCat, title) {
  const c = (rawCat + ' ' + title).toLowerCase();
  if (c.includes('oxygen concentrator') || c.includes('portable concentrator') || c.includes('5 liter') || c.includes('inogen') || c.includes('devilbiss 525') || c.includes('1025')) return 'Oxygen Concentrators';
  if (c.includes('cpap') || c.includes('bipap') || c.includes('airway clearance')) return 'Sleep & Respiratory Therapy';
  if (c.includes('wheelchair') || c.includes('transport chair') || c.includes('mobility')) return 'Wheelchairs & Mobility';
  if (c.includes('suction')) return 'Suction Machines';
  if (c.includes('nebulizer')) return 'Nebulizer Systems';
  if (c.includes('cannula') || c.includes('tubing') || c.includes('filter') || c.includes('accessory') || c.includes('parts')) return 'Consumables & Accessories';
  if (c.includes('commode') || c.includes('bath') || c.includes('shower') || c.includes('toilet') || c.includes('grab bar')) return 'Bath Safety & Hygiene';
  if (c.includes('pulse oximeter') || c.includes('blood pressure') || c.includes('monitor') || c.includes('glucose')) return 'Diagnostic Monitors';
  return 'Daily Living Aids';
}

function getRxRequirement(cat, title) {
  const l = (cat + ' ' + title).toLowerCase();
  if (l.includes('concentrator') || l.includes('bipap') || l.includes('cpap machine') || l.includes('suction machine') || l.includes('abm respiratory')) {
    return true;
  }
  return false;
}

const products = [];

for (let i = 1; i < raw.length; i++) {
  const row = parseCSVLine(raw[i]);
  if (row.length < 9) continue;
  
  const sku = row[0].replace(/"/g, '').trim();
  const title = row[1].replace(/"/g, '').trim();
  const rawCategory = row[2].replace(/"/g, '').trim();
  const manufacturer = row[3].replace(/"/g, '').trim() || 'Drive DeVilbiss';
  const dealerCost = parseFloat((row[4] || '0').replace('$', '').replace(/,/g, '')) || 0;
  const competitorPrice = parseFloat((row[5] || '0').replace('$', '').replace(/,/g, '')) || 0;
  const retailPrice = parseFloat((row[6] || '0').replace('$', '').replace(/,/g, '')) || 0;
  const customerSavings = parseFloat((row[7] || '0').replace('$', '').replace(/,/g, '')) || 0;
  const netProfit = parseFloat((row[8] || '0').replace('$', '').replace(/,/g, '')) || (retailPrice - dealerCost);
  const grossMarginStr = row[9] || '0%';
  const grossMarginPct = parseFloat(grossMarginStr.replace('%', '')) || Math.round((netProfit / (retailPrice || 1)) * 100);
  const image = (row[10] || '').replace(/"/g, '').trim();

  if (!sku || !title || retailPrice <= 0) continue;

  const category = getNormalizedCategory(rawCategory, title);
  const hcpcsCode = getHcpcs(rawCategory, title);
  const requiresRx = getRxRequirement(rawCategory, title);
  const fdaClass = requiresRx ? 'Class II Medical Device' : 'Class I Medical Device';
  const shippingTier = dealerCost > 500 || title.toLowerCase().includes('concentrator') || title.toLowerCase().includes('wheelchair') 
    ? 'Fast Carrier / Insured Medical' 
    : 'Standard Ground';

  products.push({
    id: 'prd-' + sku.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    sku,
    title,
    category,
    rawCategory,
    manufacturer,
    dealerCost: parseFloat(dealerCost.toFixed(2)),
    competitorPrice: parseFloat(competitorPrice.toFixed(2)),
    retailPrice: parseFloat(retailPrice.toFixed(2)),
    customerSavings: parseFloat(customerSavings.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    grossMarginPct: Math.round(grossMarginPct * 10) / 10,
    image: image || 'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_01_t.png',
    requiresRx,
    fsaHsaEligible: true,
    fdaClass,
    hcpcsCode,
    shippingTier,
    supplier: manufacturer.includes('Inogen') ? 'Inogen Direct / Lake Court' : (manufacturer.includes('Drive') || manufacturer.includes('DeVilbiss')) ? 'Drive DeVilbiss / McKesson' : 'Lake Court Medical Supplies',
  });
}

console.log('Valid parsed products:', products.length);

const outTs = `// Auto-generated Product Research & Margins Database
// Source: BAEMEDS_500_BEST_PRODUCTS_RESEARCH_SHEET.csv & Supplier Catalogues

export interface ResearchedProduct {
  id: string;
  sku: string;
  title: string;
  category: string;
  rawCategory: string;
  manufacturer: string;
  dealerCost: number;       // Wholesale Cost paid to supplier
  competitorPrice: number;  // Amazon / Vitality Medical street price
  retailPrice: number;      // BaeMeds Selling Price
  customerSavings: number;  // Dollar savings for buyer vs competitor
  netProfit: number;        // Profit kept per unit = retailPrice - dealerCost
  grossMarginPct: number;   // Gross profit margin %
  image: string;
  requiresRx: boolean;      // True if regulated prescription required
  fsaHsaEligible: boolean;  // True for all certified DME
  fdaClass: string;
  hcpcsCode: string;        // Medical insurance reimbursement code
  shippingTier: string;
  supplier: string;
}

export const RESEARCHED_PRODUCTS: ResearchedProduct[] = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync('c:/Users/FARAAZ/Downloads/beameds-main/baemeds usa/beameds-main/data/productResearchData.ts', outTs, 'utf8');
console.log('Successfully wrote data/productResearchData.ts with', products.length, 'products');
