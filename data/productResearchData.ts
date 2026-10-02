// Auto-generated Product Research & Margins Database
// Source: products/ extracted McKesson distributor catalogs (Total: 3099 products)

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
