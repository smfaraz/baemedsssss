/**
 * BaeMeds USA Tiered Product-Based Flat Shipping Test Suite
 *
 * Verifies:
 * 1. Standard Items & Supplies -> Flat $12.00 minimum
 * 2. Large Machines (CPAP, Oxygen Concentrators, Monitors) -> Flat $25.00 minimum
 * 3. Heavy DME (Wheelchairs, Hospital Beds, Patient Lifts) -> Flat $45.00 minimum
 * 4. Mixed Carts -> Takes highest applicable tier (e.g. Supplies + Wheelchair = $45.00)
 * 5. High-Value Orders (e.g. $500, $2,500, $10,000) -> NEVER receive free shipping ($0.00 prohibited)
 * 6. Priority and White-Glove tier cost adjustments
 * 7. Server ShippingService and Client calculateTieredShippingFee agreement
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  classifyProductShippingTier,
  getBaseFlatShippingRate,
  calculateTieredShippingFee,
  FLAT_SHIPPING_RATES,
} from '../lib/shippingRates';
import { ShippingService } from '../server/shippingService';

describe('BaeMeds Tiered Product-Based Flat Shipping Engine', () => {
  const standardSupply = {
    id: 'prd-dexcom-g7',
    title: 'Dexcom G7 Continuous Glucose Monitoring System',
    category: 'Diabetes Care',
    price: 357.99,
    quantity: 1,
    weightLbs: 1,
  };

  const largeMachine = {
    id: 'prd-inogen-one-g5',
    title: 'Inogen One G5 Portable Oxygen Concentrator',
    category: 'Oxygen Concentrators',
    price: 2495.0,
    quantity: 1,
    weightLbs: 5,
  };

  const cpapMachine = {
    id: 'prd-resmed-airsense-11',
    title: 'ResMed AirSense 11 AutoSet CPAP Machine',
    category: 'CPAP Machines',
    price: 980.0,
    quantity: 1,
    weightLbs: 6,
  };

  const heavyWheelchair = {
    id: 'prd-drive-silver-sport',
    title: 'Drive Medical Silver Sport 2 Wheelchair 18" Armrest',
    category: 'Wheelchairs',
    price: 249.99,
    quantity: 1,
    weightLbs: 42,
  };

  const hospitalBed = {
    id: 'prd-invacare-bed',
    title: 'Invacare Full-Electric Hospital Bed with Mattress',
    category: 'Hospital Beds',
    price: 1850.0,
    quantity: 1,
    weightLbs: 165,
  };

  it('1. Correctly classifies items into respective product shipping tiers', () => {
    assert.strictEqual(classifyProductShippingTier(standardSupply), 'standard');
    assert.strictEqual(classifyProductShippingTier(largeMachine), 'large_machine');
    assert.strictEqual(classifyProductShippingTier(cpapMachine), 'large_machine');
    assert.strictEqual(classifyProductShippingTier(heavyWheelchair), 'heavy_dme');
    assert.strictEqual(classifyProductShippingTier(hospitalBed), 'heavy_dme');
  });

  it('2. Standard supplies enforce flat $4.00 minimum shipping', () => {
    const rate = getBaseFlatShippingRate([standardSupply]);
    assert.strictEqual(rate, FLAT_SHIPPING_RATES.STANDARD_ITEM_MINIMUM);
    assert.strictEqual(rate, 4.0);
  });

  it('3. Large machines (CPAP / Oxygen) enforce flat $11.00 minimum shipping', () => {
    const rate1 = getBaseFlatShippingRate([largeMachine]);
    const rate2 = getBaseFlatShippingRate([cpapMachine]);
    assert.strictEqual(rate1, FLAT_SHIPPING_RATES.LARGE_MACHINE_MINIMUM);
    assert.strictEqual(rate1, 11.0);
    assert.strictEqual(rate2, 11.0);
  });

  it('4. Heavy DME (Wheelchairs, Hospital Beds) enforce flat $15.00 minimum shipping', () => {
    const rate1 = getBaseFlatShippingRate([heavyWheelchair]);
    const rate2 = getBaseFlatShippingRate([hospitalBed]);
    assert.strictEqual(rate1, FLAT_SHIPPING_RATES.HEAVY_DME_MINIMUM);
    assert.strictEqual(rate1, 15.0);
    assert.strictEqual(rate2, 15.0);
  });

  it('5. Mixed carts resolve to the highest applicable product tier', () => {
    // Supplies ($4) + CPAP ($11) => $11
    const rateMix1 = getBaseFlatShippingRate([standardSupply, cpapMachine]);
    assert.strictEqual(rateMix1, 11.0);

    // Supplies ($4) + Wheelchair ($15) => $15
    const rateMix2 = getBaseFlatShippingRate([standardSupply, heavyWheelchair]);
    assert.strictEqual(rateMix2, 15.0);

    // CPAP ($11) + Wheelchair ($15) => $15
    const rateMix3 = getBaseFlatShippingRate([cpapMachine, heavyWheelchair]);
    assert.strictEqual(rateMix3, 15.0);
  });

  it('6. ZERO free shipping: High cart totals NEVER drop shipping to $0.00', () => {
    // Single order of $2,495 (Inogen Oxygen Concentrator)
    const calc = calculateTieredShippingFee([largeMachine], 'standard');
    assert.strictEqual(calc.shippingCost, 11.0);
    assert.notStrictEqual(calc.shippingCost, 0);

    // 10x Inogen Concentrators ($24,950 total)
    const bulkMachines = [{ ...largeMachine, quantity: 10 }];
    const bulkCalc = calculateTieredShippingFee(bulkMachines, 'standard');
    assert.strictEqual(bulkCalc.shippingCost, 11.0);
    assert.notStrictEqual(bulkCalc.shippingCost, 0);

    // High total on standard supplies ($500+ cart value)
    const bulkSupplies = [{ ...standardSupply, quantity: 5 }]; // 5 * 357.99 = $1,789.95
    const suppliesCalc = calculateTieredShippingFee(bulkSupplies, 'standard');
    assert.strictEqual(suppliesCalc.shippingCost, 4.0);
    assert.notStrictEqual(suppliesCalc.shippingCost, 0);
  });

  it('7. Priority courier and White-glove rates adjust proportionally', () => {
    // Standard supply: standard = $4, priority = $25, white-glove = $95
    const supplyStd = calculateTieredShippingFee([standardSupply], 'standard');
    const supplyPri = calculateTieredShippingFee([standardSupply], 'priority');
    const supplyWg = calculateTieredShippingFee([standardSupply], 'white_glove');
    assert.strictEqual(supplyStd.shippingCost, 4.0);
    assert.strictEqual(supplyPri.shippingCost, 25.0);
    assert.strictEqual(supplyWg.shippingCost, 95.0);

    // Heavy DME: standard = $15, priority = $30, white-glove = $115
    const dmeStd = calculateTieredShippingFee([heavyWheelchair], 'standard');
    const dmePri = calculateTieredShippingFee([heavyWheelchair], 'priority');
    const dmeWg = calculateTieredShippingFee([heavyWheelchair], 'white_glove');
    assert.strictEqual(dmeStd.shippingCost, 15.0);
    assert.strictEqual(dmePri.shippingCost, 30.0);
    assert.strictEqual(dmeWg.shippingCost, 115.0);
  });

  it('8. Server ShippingService matches client flat rate calculations', () => {
    const serverOptions = ShippingService.getAvailableOptions({
      destination: { state: 'TX', zip: '75001' },
      items: [cpapMachine],
    });

    const ground = serverOptions.find((o) => o.id === 'standard-ground');
    assert.ok(ground, 'standard-ground option must be available');
    assert.strictEqual(ground.price, 11.0, 'Server ground shipping must be $11.00 for CPAP machine');
    assert.notStrictEqual(ground.price, 0.0, 'Server must never return free shipping');
  });
});
