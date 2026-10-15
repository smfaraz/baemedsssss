# BaeMeds.com — Phase 4: Tax Engine Validation

**Focus**: 50-State Sales Tax Engine, Medical Exemption Rules, Destination-Based Calculation, and Professional Compliance Scope  
**Date**: October 15, 2026  
**Auditor**: Senior E-Commerce Architect & Compliance Specialist

---

## 1. Healthcare Sales Tax Engine Architecture

Sales tax for durable medical equipment (DME), respiratory devices, and medical accessories in the United States is jurisdiction-dependent and governed by state statutes. BaeMeds USA employs a synchronized dual-engine architecture:
- **Server Engine**: `server/taxService.ts` (Authoritative calculation during checkout)
- **Client Engine**: `lib/taxCalculator.ts` (Real-time cart preview)

Both engines share an identical jurisdictional ruleset and round to 2 decimal places using standard commercial rounding (`Math.round(val * 100) / 100`).

---

## 2. Product-Specific Medical Classifications & Rules

The tax engine evaluates products according to three statutory categories:
1. **Prescription Durable Medical Equipment (CPAP Machines, Oxygen Concentrators, BiPAPs)**:
   - Tax-exempt in 41+ states (e.g., California, Texas, Florida, New York, Pennsylvania, Massachusetts, Illinois).
2. **Medical Supplies & Replacement Parts (Tubing, Filters, Water Chambers)**:
   - Tax-exempt in states granting broad medical device exemptions; taxable in jurisdictions distinguishing durable equipment from consumable supplies.
3. **General Healthcare Accessories & Non-Medical Equipment (Travel Bags, Cleaning Kits, Comfort Pads)**:
   - Fully taxable at the applicable destination rate.

---

## 3. Special Jurisdictional Rules Tested

### A. Alaska Local Sales Taxes
- Alaska has **no statewide general sales tax** (state rate = 0%).
- However, home-rule municipalities (such as Juneau, Wasilla, and Kenai) levy local sales taxes ranging from 2% to 6%.
- The engine accurately defaults Alaska state tax to 0% while supporting local borough overlays.

### B. Illinois Medical Appliance Reduced Rate
- Illinois taxes qualifying medical appliances and DME at a **reduced state rate of 1.0%** instead of the general state sales tax rate of 6.25% (under 35 ILCS 120/2-10).
- The engine applies the reduced rate for Illinois destination addresses for eligible medical equipment.

### C. Zero-Tax States (NOMAD)
- New Hampshire, Oregon, Montana, and Delaware have zero statewide general sales tax. The engine reliably returns $0.00 tax for all product classes in these states.

### D. Healthcare Entity Exemption Certificates
- If a purchasing entity submits a verified Tax Exemption Certificate (e.g., non-profit clinic, hospital, educational institution), the engine waives 100% of sales tax upon validation.

---

## 4. Test Verification Results (`tests/tax-checkout.test.ts`)

| Test Case | Description | Result |
| :--- | :--- | :--- |
| **Test 1** | Pure DME cart in Florida (100% tax-exempt) | **PASS** ($0.00 tax) |
| **Test 2** | Accessory cart in California (fully taxable at 7.25% baseline) | **PASS** ($3.63 tax) |
| **Test 3** | Pure DME cart in Texas (100% tax-exempt under TX Tax Code § 151.313) | **PASS** ($0.00 tax) |
| **Test 4** | Mixed cart in CA: accessories taxed, CPAP machine remains tax-exempt | **PASS** (Selective tax) |
| **Test 5** | Healthcare Entity Exemption Certificate waives 100% of sales tax | **PASS** ($0.00 tax) |
| **Test 6** | Client and Server engines produce identical numbers across all 50 states | **PASS** (Zero divergence) |

---

## 5. Professional Disclaimer & Required Owner Actions

> [!WARNING]
> Software automated test suites **do not** substitute for legal or professional tax counsel.
> The company owner must engage a qualified US Certified Public Accountant (CPA) or State Tax Attorney to:
> 1. Formally establish corporate physical and economic nexus thresholds across applicable states.
> 2. Complete sales tax registration with state departments of revenue where nexus exists.
> 3. Verify filing schedules and integrate automated remittance (e.g., Stripe Tax, Avalara, or TaxJar) before exceeding remote seller thresholds ($100,000 / 200 transactions).
