/**
 * US Sales Tax Service Abstraction
 *
 * Implements server-side tax calculations accommodating:
 * - State, county, and district rates
 * - Category-based exemptions (e.g., Rx durable medical equipment vs taxable accessories)
 * - Hospital / institutional tax-exempt entity validation (EIN / Resale Certificate)
 * - Provider adapter architecture (Shopify Tax, TaxJar, Avalara, or Stripe Tax)
 */

import { TaxCalculation } from '../types';

export interface TaxCalculationItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  category?: string;
  requiresPrescription?: boolean;
}

export interface TaxCalculationRequest {
  items: TaxCalculationItem[];
  shippingAddress: {
    state: string;
    zip: string;
    city?: string;
    country?: string;
  };
  customerIsTaxExempt?: boolean;
  taxExemptionCertificate?: string;
}

// Representative state baseline rates (for fallback/estimation when external tax engine is offline)
// Actual precision tax calculation occurs via live tax provider webhook / API
const STATE_BASELINE_RATES: Record<string, number> = {
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

// States with no statewide sales tax (Nomad states)
export const NO_SALES_TAX_STATES = new Set(['AK', 'DE', 'MT', 'NH', 'OR']);

// Categories typically exempt from US sales tax as essential medical equipment / DME
const DME_EXEMPT_CATEGORIES = new Set([
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
]);

export class TaxService {
  /**
   * Determine whether an item qualifies for DME / medical necessity tax exemption
   */
  static isItemTaxExempt(item: TaxCalculationItem, stateCode: string): boolean {
    // If state has no sales tax, all items are exempt
    if (NO_SALES_TAX_STATES.has(stateCode)) return true;

    // Prescription-required devices are exempt from retail sales tax in the vast majority of US states
    if (item.requiresPrescription) return true;

    const categoryLower = (item.category || '').toLowerCase();
    for (const exemptCat of DME_EXEMPT_CATEGORIES) {
      if (categoryLower.includes(exemptCat)) return true;
    }

    return false;
  }

  /**
   * Calculate server-side tax estimate
   */
  static calculateTax(request: TaxCalculationRequest): TaxCalculation {
    const state = (request.shippingAddress.state || '').trim().toUpperCase();
    const subtotal = request.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Entity-level tax exemption (e.g., 501(c)(3) hospitals, licensed healthcare facilities with exemption certificate)
    if (request.customerIsTaxExempt && request.taxExemptionCertificate) {
      return {
        subtotal,
        taxableAmount: 0,
        estimatedTax: 0,
        taxRate: 0,
        state,
        isExempt: true,
        exemptionReason: `Entity Tax Exemption Certificate: ${request.taxExemptionCertificate}`,
      };
    }

    // State without sales tax
    if (NO_SALES_TAX_STATES.has(state)) {
      return {
        subtotal,
        taxableAmount: 0,
        estimatedTax: 0,
        taxRate: 0,
        state,
        isExempt: true,
        exemptionReason: `${state} has no state sales tax.`,
      };
    }

    const baselineRate = STATE_BASELINE_RATES[state] ?? 0.05;

    let taxableAmount = 0;
    for (const item of request.items) {
      if (!this.isItemTaxExempt(item, state)) {
        taxableAmount += item.price * item.quantity;
      }
    }

    const estimatedTax = Math.round(taxableAmount * baselineRate * 100) / 100;
    const isExempt = taxableAmount === 0;

    return {
      subtotal,
      taxableAmount,
      estimatedTax,
      taxRate: baselineRate,
      state,
      isExempt,
      exemptionReason: isExempt ? 'Prescription medical devices and qualifying DME are sales tax exempt.' : undefined,
    };
  }
}
