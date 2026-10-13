/**
 * BaeMeds USA Client-Side Healthcare Sales Tax Engine
 * Computes destination-based sales tax and Durable Medical Equipment (DME) exemptions.
 * Safe for client-side rendering with zero server-side imports.
 */

import { TaxCalculation } from '../types';

export interface ClientTaxItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  category?: string;
  requiresPrescription?: boolean;
}

export interface ClientTaxRequest {
  items: ClientTaxItem[];
  shippingAddress: {
    state: string;
    zip?: string;
    city?: string;
    country?: string;
  };
  customerIsTaxExempt?: boolean;
  taxExemptionCertificate?: string;
}

export interface DetailedTaxCalculation extends TaxCalculation {
  exemptItemsCount: number;
  taxableItemsCount: number;
  rateLabel: string;
}

// 50-State + DC baseline sales tax rates (destination-based)
export const STATE_BASELINE_RATES: Record<string, number> = {
  AL: 0.04, AK: 0.00, AZ: 0.056, AR: 0.065, CA: 0.0725,
  CO: 0.029, CT: 0.0635, DE: 0.00, DC: 0.06, FL: 0.06,
  GA: 0.04, HI: 0.04, ID: 0.06, IL: 0.0625, IN: 0.07,
  IA: 0.06, KS: 0.065, KY: 0.06, LA: 0.0445, ME: 0.055,
  MD: 0.06, MA: 0.0625, MI: 0.06, MN: 0.06875, MS: 0.07,
  MO: 0.04225, MT: 0.00, NE: 0.055, NV: 0.0685, NH: 0.00,
  NJ: 0.06625, NM: 0.05125, NY: 0.04, NC: 0.0475, ND: 0.05,
  OH: 0.0575, OK: 0.045, OR: 0.00, PA: 0.06, RI: 0.07,
  SC: 0.06, SD: 0.045, TN: 0.07, TX: 0.0625, UT: 0.0485,
  VT: 0.06, VA: 0.053, WA: 0.065, WV: 0.06, WI: 0.05,
  WY: 0.04,
};

// States with no statewide retail sales tax (Nomad states)
export const NO_SALES_TAX_STATES = new Set(['AK', 'DE', 'MT', 'NH', 'OR']);

// Categories qualifying for DME statutory medical exemption in US jurisdictions
export const DME_EXEMPT_CATEGORIES = new Set([
  'oxygen concentrator',
  'bipap',
  'cpap',
  'patient monitor',
  'respiratory',
  'durable medical equipment',
  'wheelchair',
  'hospital bed',
  'dialysis',
  'prosthetics',
  'ventilator',
  'suction machine',
  'nebulizer',
  'mobility',
]);

/**
 * Checks whether an item qualifies for DME or prescription exemption in the given state
 */
export function isItemTaxExempt(item: ClientTaxItem, stateCode: string): boolean {
  const normState = (stateCode || '').trim().toUpperCase();
  if (NO_SALES_TAX_STATES.has(normState)) return true;
  if (item.requiresPrescription) return true;

  const categoryLower = (item.category || '').toLowerCase();
  const titleLower = (item.title || '').toLowerCase();

  // General over-the-counter accessories and cleaning supplies without an Rx are taxable retail goods
  if (
    categoryLower.includes('accessor') ||
    categoryLower.includes('sanitation') ||
    categoryLower.includes('cleaning') ||
    titleLower.includes('wipe') ||
    titleLower.includes('cleaner') ||
    titleLower.includes('sanitiz')
  ) {
    return false;
  }

  for (const exemptCat of DME_EXEMPT_CATEGORIES) {
    if (categoryLower.includes(exemptCat) || titleLower.includes(exemptCat)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates itemized healthcare sales tax with full statutory exemption rules
 */
export function calculateTaxEstimate(request: ClientTaxRequest): DetailedTaxCalculation {
  const state = (request.shippingAddress.state || '').trim().toUpperCase();
  const subtotal = request.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 1. Entity-level tax exemption (Hospitals, 501(c)(3), Clinics with valid certificate)
  if (request.customerIsTaxExempt && request.taxExemptionCertificate?.trim()) {
    return {
      subtotal,
      taxableAmount: 0,
      estimatedTax: 0,
      taxRate: 0,
      state,
      isExempt: true,
      exemptionReason: `Healthcare Entity Tax Exemption Certificate: ${request.taxExemptionCertificate.trim()}`,
      exemptItemsCount: request.items.length,
      taxableItemsCount: 0,
      rateLabel: '0.00% (Entity Exempt)',
    };
  }

  // 2. State has no statewide sales tax
  if (NO_SALES_TAX_STATES.has(state)) {
    return {
      subtotal,
      taxableAmount: 0,
      estimatedTax: 0,
      taxRate: 0,
      state,
      isExempt: true,
      exemptionReason: `${state} has no state sales tax.`,
      exemptItemsCount: request.items.length,
      taxableItemsCount: 0,
      rateLabel: '0.00% (Nomad State)',
    };
  }

  const baselineRate = STATE_BASELINE_RATES[state] ?? 0.06;
  let taxableAmount = 0;
  let exemptCount = 0;
  let taxableCount = 0;

  for (const item of request.items) {
    if (isItemTaxExempt(item, state)) {
      exemptCount += item.quantity;
    } else {
      taxableAmount += item.price * item.quantity;
      taxableCount += item.quantity;
    }
  }

  const estimatedTax = Math.round(taxableAmount * baselineRate * 100) / 100;
  const isExempt = taxableAmount === 0;

  let reason: string | undefined = undefined;
  if (isExempt) {
    reason = 'Qualifying Durable Medical Equipment (DME) and Rx devices are sales tax exempt.';
  } else if (exemptCount > 0) {
    reason = `${exemptCount} medical item(s) sales tax exempt. Tax applied only to retail accessories.`;
  }

  return {
    subtotal,
    taxableAmount,
    estimatedTax,
    taxRate: baselineRate,
    state,
    isExempt,
    exemptionReason: reason,
    exemptItemsCount: exemptCount,
    taxableItemsCount: taxableCount,
    rateLabel: `${(baselineRate * 100).toFixed(2)}%`,
  };
}
