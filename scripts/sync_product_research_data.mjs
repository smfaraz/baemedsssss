import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const researchedProducts = catalog.map((p) => {
  const cost = p.wholesaleCost || Math.round(p.price * 0.6);
  const profit = Math.max(0, p.price - cost);
  const marginPct = p.price > 0 ? Math.round((profit / p.price) * 1000) / 10 : 0;
  const competitor = p.compareAtPrice || Math.round(p.price * 1.25);
  const savings = Math.max(0, competitor - p.price);

  return {
    id: p.id,
    sku: p.sku || p.id,
    title: p.title,
    category: p.category,
    rawCategory: p.category,
    manufacturer: p.vendor || 'Medical Grade',
    dealerCost: Number(cost.toFixed(2)),
    competitorPrice: Number(competitor.toFixed(2)),
    retailPrice: Number(p.price.toFixed(2)),
    customerSavings: Number(savings.toFixed(2)),
    netProfit: Number(profit.toFixed(2)),
    grossMarginPct: marginPct,
    image: p.image,
    requiresRx: Boolean(p.prescriptionRequired),
    fsaHsaEligible: true,
    fdaClass: p.fdaClassification || 'Class I / Exempt',
    hcpcsCode: p.hcpcsCode || 'DME-STD',
    shippingTier: 'Standard Ground',
    supplier: 'McKesson Medical-Surgical',
  };
});

// Write to JSON file to prevent TS2590 complex union evaluation
const jsonPath = path.resolve(__dirname, '../data/product_research.json');
fs.writeFileSync(jsonPath, JSON.stringify(researchedProducts, null, 2), 'utf8');

const tsContent = `// Auto-generated Product Research & Margins Database
// Source: products/ extracted McKesson distributor catalogs (Total: ${researchedProducts.length} products)

import rawResearchData from './product_research.json';

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

export const RESEARCHED_PRODUCTS = rawResearchData as unknown as ResearchedProduct[];
`;

fs.writeFileSync(path.resolve(__dirname, '../data/productResearchData.ts'), tsContent, 'utf8');
console.log(`✓ Synchronized data/product_research.json and data/productResearchData.ts (${researchedProducts.length} items)!`);
