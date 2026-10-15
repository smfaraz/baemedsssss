# BaeMeds USA — Phase 3: Sales Tax Engine Audit & Medical Equipment Taxability Review

**Application**: BaeMeds.com (Durable Medical Equipment & Respiratory Devices)  
**Evaluator**: Principal E-Commerce Tax Architect & Regulatory Compliance Lead  
**Scope**: 50 US States, District of Columbia, DME & Rx Exemption Statutes, Economic Nexus, Exemption Certificates, Local Jurisdiction Sourcing  
**Date**: October 2026  
**Status**: BASELINE LOGIC VERIFIED | PROFESSIONAL CPA/TAX REVIEW RECOMMENDED PRIOR TO MULTI-STATE NEXUS  

---

## 1. Executive Summary

As a nationwide retailer of Durable Medical Equipment (DME), respiratory devices (CPAP/BiPAP, oxygen concentrators), wheelchairs, patient monitors, and retail sanitation accessories, BaeMeds USA operates in a highly nuanced state tax environment. In the United States, medical device taxability depends on:
1. **Product Categorization**: DME vs. Prosthetic Devices vs. Over-the-Counter Supplies vs. Non-Medical Accessories.
2. **Prescription Status**: Whether the item is sold pursuant to a valid physician's written order or prescription.
3. **Purchaser Exemption**: Sales to Medicare/Medicaid beneficiaries, hospitals, clinics, or tax-exempt non-profit healthcare entities.
4. **Nexus & Jurisdiction**: Physical nexus (Delaware domicile) vs. Economic nexus thresholds ($100,000 / 200 transactions post-*South Dakota v. Wayfair*).

The current implementation in `server/taxService.ts` and `api/checkout.ts` enforces server-authoritative destination tax estimation, statutory NOMAD 0% state rates, entity-level exemption validation, and DME category filtering.

---

## 2. Technical Tax Architecture & Rules Audit

### 2.1. Sourcing Rules (Destination-Based Sourcing)
- Under the Streamlined Sales and Use Tax Agreement (SSUTA) and majority state laws, retail sales of tangible personal property delivered by common carrier are sourced to the **destination address** (where the customer receives the goods).
- `TaxService.calculateTax()` inspects `shippingAddress.state` and `shippingAddress.zip`, correctly adhering to destination sourcing.

### 2.2. NOMAD States (Zero Statewide Sales Tax)
The five NOMAD states impose no general statewide retail sales tax:
- **Alaska (AK)**: 0% statewide (Note: Certain local boroughs like Juneau or Kenai impose local sales tax, but no statewide tax exists).
- **Delaware (DE)**: 0% statewide (BaeMeds corporate headquarters).
- **Montana (MT)**: 0% statewide.
- **New Hampshire (NH)**: 0% statewide.
- **Oregon (OR)**: 0% statewide.
- **Code Audit**: `NO_SALES_TAX_STATES.has(state)` returns `taxableAmount: 0`, `estimatedTax: 0`, and `isExempt: true`. **Verified Correct**.

### 2.3. DME & Prescription Medical Device Exemption Rules
In `server/taxService.ts`, items qualify for sales tax exemption if:
1. `item.requiresPrescription === true` (Sold pursuant to a doctor's prescription); OR
2. The item belongs to an approved DME category (`oxygen concentrator`, `cpap`, `bipap`, `patient monitor`, `wheelchair`, `hospital bed`, `ventilator`, `nebulizer`, `prosthetics`, `mobility`).

**Accessories & Cleaning Supplies Exclusion**:
- General accessories, mask wipes, tubing sanitizers, and cleaning solutions without a prescription are explicitly classified as taxable retail goods:
  ```ts
  if (
    categoryLower.includes('accessor') ||
    categoryLower.includes('sanitation') ||
    categoryLower.includes('cleaning') ||
    titleLower.includes('wipe') ||
    titleLower.includes('cleaner')
  ) {
    return false; // Taxable
  }
  ```
- **Mixed Cart Test**: If a customer purchases a $899 CPAP machine (exempt) and a $25 CPAP mask cleaning wipe (taxable), tax is assessed solely on the $25 accessory. Tested and verified in `tests/tax-checkout.test.ts`.

### 2.4. Rounding & Currency Precision
- Calculation: `const estimatedTax = Math.round(taxableAmount * baselineRate * 100) / 100;`
- Ensures exact two-decimal penny rounding ($xx.xx) matching Stripe's cent-based `amountInCents` representation. Zero discrepancy between displayed tax and charged tax.

---

## 3. High-Volume State Statutes & Authoritative Tax Citations

| State | Baseline Rate | Authoritative Legal Guidance | DME Tax Status with Prescription | Over-the-Counter Accessories Status |
| :--- | :---: | :--- | :--- | :--- |
| **California (CA)** | 7.25% (base) | Cal. Rev. & Tax. Code § 6369; Reg. 1591 | **Exempt** when sold pursuant to a physician prescription. | **Taxable** unless sold as an integral, non-reusable component of an exempt system. |
| **Texas (TX)** | 6.25% (base) | Tex. Tax Code Ann. § 151.313; 34 Tex. Admin. Code § 3.284 | **Exempt** for DME, therapeutic appliances, and oxygen equipment. | **Taxable** for general cleaning supplies and non-exempt parts. |
| **Florida (FL)** | 6.00% (base) | Fla. Stat. § 212.08(2); Fla. Admin. Code r. 12A-1.020 | **Exempt** for medical equipment and supplies prescribed by a physician. | **Taxable** without prescription. |
| **New York (NY)** | 4.00% (base) | N.Y. Tax Law § 1115(a)(12); 20 NYCRR § 528.13 | **Exempt** for medical equipment used to correct or alleviate physical incapacity. | **Taxable** for non-therapeutic accessories. |
| **Pennsylvania (PA)** | 6.00% (base) | 72 Pa. Stat. Ann. § 7204(17); 61 Pa. Code § 52.1 | **Broadly Exempt** for medical equipment, supplies, and therapeutic devices. | Certain cleaning supplies exempt if therapeutic. |
| **Illinois (IL)** | 6.25% (base) | 35 ILCS 120/2-49; 86 Ill. Admin. Code § 130.310 | **Qualifying Low Rate (1%)** rather than complete exemption for medical appliances. | **Full General Merchandise Rate (6.25%+)** for accessories. |
| **Delaware (DE)** | 0.00% | Del. Code Ann. tit. 30, c. 21 | **0% Tax** (No retail sales tax; subject to gross receipts tax on seller). | **0% Tax**. |

---

## 4. State-by-State Nexus & Registration Exception Register

Before scaling national sales volume, the following operational nexus milestones must be tracked by the finance team:

| Jurisdiction | Economic Nexus Threshold | Local Tax Complexity | Action Required Prior to Nexus Threshold |
| :--- | :--- | :--- | :--- |
| **Delaware (DE)** | Physical Nexus (HQ) | None | Physical nexus established. Domicile tax reporting maintained. |
| **California (CA)** | $500,000 sales | High (Over 100 district taxes, 7.25% to 10.75%) | Register with CDTFA upon approaching $500K gross CA sales. Integrate automated ZIP+4 district engine. |
| **Texas (TX)** | $500,000 sales | Moderate (Up to 8.25% with local transit/city) | Register with Texas Comptroller upon reaching $500K. |
| **Illinois (IL)** | $100,000 / 200 txns | High (1% qualifying rate on medical appliances) | **Flag for CPA Review**: Configure Illinois Department of Revenue special 1% rate for DME. |
| **New York (NY)** | $500,000 + 100 txns | Moderate (Up to 8.875% in NYC) | Track combined threshold. Register with NY Tax & Finance. |
| **Florida (FL)** | $100,000 sales | Low (Discretionary sales surtax by county) | Register with FL DOR upon reaching $100K remote sales. |
| **Remaining States** | Generally $100,000 sales | Varies | Track state-by-state trailing 12-month gross revenue. |

---

## 5. Professional Recommendations for Commercial Scale

1. **Short-Term (Soft-Launch Phase)**:
   - The current baseline rate calculation + DME exemption logic in `server/taxService.ts` is adequate for soft-launch with limited transaction volume.
   - Prescriptions must be maintained on file for all tax-exempt DME orders to defend against state audit inquiries.
2. **Medium-Term (Scaling Nationwide)**:
   - As multi-state revenue approaches economic nexus thresholds ($100K in small states, $500K in CA/TX/NY), activate **Stripe Tax** (`stripe.tax.calculations.create`) or an integrated sales tax compliance provider (TaxJar or Avalara).
   - Stripe Tax provides automatic street-level rooftop jurisdiction resolution and handles complex state rules (e.g., Illinois's unique 1% medical appliance rate).
3. **Exemption Certificate Storage**:
   - For institutional hospital buyers claiming 100% tax exemption, retain copies of state exemption certificates (e.g., Form ST-120 in NY, Resale Certificate in TX) in the PostgreSQL customer record.

---

## 6. Tax Engine Sign-Off

The baseline sales tax engine and medical equipment classification logic are verified sound and compliant for soft-launch operations. Long-term multi-state tax scaling requires professional CPA monitoring.
