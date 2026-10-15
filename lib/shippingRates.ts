/**
 * BaeMeds USA Tiered Product-Based Flat Shipping Engine
 *
 * Implements authoritative product-based minimum flat shipping calculations:
 * - Heavy DME (Wheelchairs, Hospital Beds, Patient Lifts): $15.00 minimum
 * - Large Machines (CPAP / BiPAP, Oxygen Concentrators, Patient Monitors, Suction): $11.00 minimum
 * - Standard Items / Supplies / Consumables / Accessories: $4.00 minimum
 *
 * Invariant: Zero free shipping. All orders enforce product-based flat rate minimums.
 * Safe for client-side and server-side execution with zero external dependencies.
 */

export type ProductShippingTier = 'heavy_dme' | 'large_machine' | 'standard';

export interface ShippingProductItem {
  id?: string;
  title?: string;
  category?: string;
  weightLbs?: number;
  price?: number;
  quantity?: number;
}

export const FLAT_SHIPPING_RATES = {
  HEAVY_DME_MINIMUM: 15.0,
  LARGE_MACHINE_MINIMUM: 11.0,
  STANDARD_ITEM_MINIMUM: 4.0,
} as const;

/**
 * Classify a product into its respective shipping tier based on category, title, or weight
 */
export function classifyProductShippingTier(item: ShippingProductItem): ProductShippingTier {
  const cat = (item.category || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const weight = Number(item.weightLbs) || 0;

  // 1. Heavy DME ($45.00 minimum)
  if (
    weight >= 40 ||
    cat.includes('wheelchair') ||
    cat.includes('hospital bed') ||
    cat.includes('patient lift') ||
    cat.includes('mobility') ||
    title.includes('wheelchair') ||
    title.includes('hospital bed') ||
    title.includes('patient lift') ||
    title.includes('lift chair') ||
    title.includes('commode') ||
    title.includes('bariatric') ||
    title.includes('rollator')
  ) {
    return 'heavy_dme';
  }

  // 2. Large Machines ($25.00 minimum)
  if (
    weight >= 12 ||
    cat.includes('cpap machine') ||
    cat.includes('bipap') ||
    cat.includes('oxygen concentrator') ||
    cat.includes('suction machine') ||
    cat.includes('patient monitor') ||
    cat.includes('respiratory') ||
    title.includes('cpap machine') ||
    title.includes('bipap') ||
    title.includes('oxygen concentrator') ||
    title.includes('concentrator') ||
    title.includes('airsense') ||
    title.includes('aircurve') ||
    title.includes('suction machine') ||
    title.includes('patient monitor') ||
    title.includes('defibrillator') ||
    title.includes('ventilator')
  ) {
    return 'large_machine';
  }

  // 3. Standard Supplies & Accessories ($12.00 minimum)
  return 'standard';
}

/**
 * Determine the base standard ground flat rate for a cart or order
 */
export function getBaseFlatShippingRate(items: ShippingProductItem[]): number {
  if (!items || items.length === 0) {
    return FLAT_SHIPPING_RATES.STANDARD_ITEM_MINIMUM;
  }

  let hasHeavyDme = false;
  let hasLargeMachine = false;

  for (const item of items) {
    const tier = classifyProductShippingTier(item);
    if (tier === 'heavy_dme') {
      hasHeavyDme = true;
      break; // Highest possible tier reached
    }
    if (tier === 'large_machine') {
      hasLargeMachine = true;
    }
  }

  if (hasHeavyDme) {
    return FLAT_SHIPPING_RATES.HEAVY_DME_MINIMUM;
  }
  if (hasLargeMachine) {
    return FLAT_SHIPPING_RATES.LARGE_MACHINE_MINIMUM;
  }
  return FLAT_SHIPPING_RATES.STANDARD_ITEM_MINIMUM;
}

/**
 * Calculate final shipping fee for a specific shipping tier
 */
export function calculateTieredShippingFee(
  items: ShippingProductItem[],
  tier: 'standard' | 'priority' | 'white_glove' = 'standard'
): {
  shippingCost: number;
  baseStandardRate: number;
  tierName: string;
  description: string;
} {
  const baseStandardRate = getBaseFlatShippingRate(items);

  if (tier === 'priority') {
    // Priority courier: $25 min for standard, +$15 for larger tiers
    const priorityCost = baseStandardRate === FLAT_SHIPPING_RATES.STANDARD_ITEM_MINIMUM
      ? 25.0
      : baseStandardRate + 15.0;

    return {
      shippingCost: priorityCost,
      baseStandardRate,
      tierName: 'Priority Medical Courier (1-2 Days)',
      description: 'Expedited insured carrier delivery with priority handling.',
    };
  }

  if (tier === 'white_glove') {
    // White glove setup: $95 min, $115 for heavy DME
    const whiteGloveCost = baseStandardRate === FLAT_SHIPPING_RATES.HEAVY_DME_MINIMUM
      ? 115.0
      : 95.0;

    return {
      shippingCost: whiteGloveCost,
      baseStandardRate,
      tierName: 'White-Glove DME Setup & In-Service',
      description: 'Scheduled inside delivery, unpacking, placement, and clinical equipment demonstration.',
    };
  }

  // Standard Ground (No free delivery)
  return {
    shippingCost: baseStandardRate,
    baseStandardRate,
    tierName: `Standard Insured Ground Delivery (3-5 Days)`,
    description: `Flat-rate insured shipping based on medical equipment classification.`,
  };
}
