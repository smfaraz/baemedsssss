/**
 * BaeMeds USA Healthcare Sales Tax Engine Verification Suite
 * Tests destination-based statutory sales tax, DME medical exemptions,
 * and hospital entity exemption certificates across client and server engines.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TaxService } from '../server/taxService';
import { calculateTaxEstimate, NO_SALES_TAX_STATES, STATE_BASELINE_RATES } from '../lib/clientTax';

describe('BaeMeds Healthcare Sales Tax Engine', () => {
  const dmeItem = {
    id: 'prd-inogen-one-g5',
    title: 'Inogen One G5 Portable Oxygen Concentrator',
    price: 2495.00,
    quantity: 1,
    category: 'Oxygen Concentrators',
    requiresPrescription: true,
  };

  const rxItem = {
    id: 'prd-resmed-airsense-11',
    title: 'ResMed AirSense 11 AutoSet CPAP Machine',
    price: 980.00,
    quantity: 1,
    category: 'Sleep Therapy',
    requiresPrescription: true,
  };

  const taxableAccessory = {
    id: 'prd-cleaning-wipes',
    title: 'CPAP Mask Disinfecting Wipes (Pack of 3)',
    price: 24.00,
    quantity: 2,
    category: 'Accessories & Sanitation',
    requiresPrescription: false,
  };

  it('1. Nomad States (DE, AK, MT, NH, OR) have 0% retail sales tax', () => {
    for (const state of NO_SALES_TAX_STATES) {
      const serverResult = TaxService.calculateTax({
        items: [taxableAccessory],
        shippingAddress: { state, zip: '19801' },
      });

      const clientResult = calculateTaxEstimate({
        items: [taxableAccessory],
        shippingAddress: { state, zip: '19801' },
      });

      assert.strictEqual(serverResult.estimatedTax, 0, `Server tax in ${state} must be $0`);
      assert.strictEqual(clientResult.estimatedTax, 0, `Client tax in ${state} must be $0`);
      assert.strictEqual(serverResult.isExempt, true);
      assert.strictEqual(clientResult.isExempt, true);
      assert.match(clientResult.rateLabel, /Nomad State/);
    }
  });

  it('2. DME and Prescription items are tax-exempt in taxing states (e.g., CA, NY, TX)', () => {
    const states = ['CA', 'NY', 'TX', 'FL', 'IL'];

    for (const state of states) {
      const serverResult = TaxService.calculateTax({
        items: [dmeItem, rxItem],
        shippingAddress: { state, zip: '90210' },
      });

      const clientResult = calculateTaxEstimate({
        items: [dmeItem, rxItem],
        shippingAddress: { state, zip: '90210' },
      });

      assert.strictEqual(serverResult.estimatedTax, 0, `DME tax in ${state} should be $0`);
      assert.strictEqual(clientResult.estimatedTax, 0, `DME client tax in ${state} should be $0`);
      assert.strictEqual(serverResult.isExempt, true);
      assert.strictEqual(clientResult.isExempt, true);
    }
  });

  it('3. Retail accessories are subject to statutory destination sales tax', () => {
    // California baseline: 7.25%
    // 2 * $24.00 = $48.00 * 0.0725 = $3.48
    const serverResult = TaxService.calculateTax({
      items: [taxableAccessory],
      shippingAddress: { state: 'CA', zip: '90001' },
    });

    const clientResult = calculateTaxEstimate({
      items: [taxableAccessory],
      shippingAddress: { state: 'CA', zip: '90001' },
    });

    assert.strictEqual(serverResult.estimatedTax, 3.48);
    assert.strictEqual(clientResult.estimatedTax, 3.48);
    assert.strictEqual(serverResult.taxRate, 0.0725);
    assert.strictEqual(clientResult.taxRate, 0.0725);
    assert.strictEqual(clientResult.isExempt, false);
    assert.strictEqual(clientResult.rateLabel, '7.25%');
  });

  it('4. Mixed cart: only accessories taxed, DME items remain tax-exempt', () => {
    // Total subtotal: $2495.00 (exempt) + $48.00 (taxable) = $2543.00
    // In CA (7.25%), tax is only on $48.00 -> $3.48
    const serverResult = TaxService.calculateTax({
      items: [dmeItem, taxableAccessory],
      shippingAddress: { state: 'CA', zip: '90210' },
    });

    const clientResult = calculateTaxEstimate({
      items: [dmeItem, taxableAccessory],
      shippingAddress: { state: 'CA', zip: '90210' },
    });

    assert.strictEqual(serverResult.taxableAmount, 48.00);
    assert.strictEqual(clientResult.taxableAmount, 48.00);
    assert.strictEqual(serverResult.estimatedTax, 3.48);
    assert.strictEqual(clientResult.estimatedTax, 3.48);
    assert.strictEqual(clientResult.exemptItemsCount, 1);
    assert.strictEqual(clientResult.taxableItemsCount, 2);
    assert.match(clientResult.exemptionReason || '', /medical item\(s\) sales tax exempt/);
  });

  it('5. Healthcare Entity Exemption Certificate waives 100% of sales tax', () => {
    const certNumber = 'EX-HOSP-9941-CA';

    const serverResult = TaxService.calculateTax({
      items: [taxableAccessory],
      shippingAddress: { state: 'CA', zip: '90210' },
      customerIsTaxExempt: true,
      taxExemptionCertificate: certNumber,
    });

    const clientResult = calculateTaxEstimate({
      items: [taxableAccessory],
      shippingAddress: { state: 'CA', zip: '90210' },
      customerIsTaxExempt: true,
      taxExemptionCertificate: certNumber,
    });

    assert.strictEqual(serverResult.estimatedTax, 0);
    assert.strictEqual(clientResult.estimatedTax, 0);
    assert.strictEqual(serverResult.isExempt, true);
    assert.strictEqual(clientResult.isExempt, true);
    assert.match(serverResult.exemptionReason || '', new RegExp(certNumber));
    assert.match(clientResult.exemptionReason || '', new RegExp(certNumber));
    assert.strictEqual(clientResult.rateLabel, '0.00% (Entity Exempt)');
  });

  it('6. Client and Server engines produce identical numbers across all 50 states', () => {
    for (const [state, expectedRate] of Object.entries(STATE_BASELINE_RATES)) {
      const serverResult = TaxService.calculateTax({
        items: [taxableAccessory],
        shippingAddress: { state, zip: '00000' },
      });

      const clientResult = calculateTaxEstimate({
        items: [taxableAccessory],
        shippingAddress: { state, zip: '00000' },
      });

      assert.strictEqual(
        serverResult.estimatedTax,
        clientResult.estimatedTax,
        `Tax discrepancy detected for state ${state}: Server=${serverResult.estimatedTax}, Client=${clientResult.estimatedTax}`
      );
    }
  });
});
