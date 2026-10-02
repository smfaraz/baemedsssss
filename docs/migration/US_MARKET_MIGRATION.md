# BaeMeds USA — Market Migration Architecture Document

## 1. Executive Summary

This document details the architectural and code-level transformation of the BaeMeds healthcare commerce platform from an India-specific storefront (`baemeds.in`) into a nationwide US medical supplies and Durable Medical Equipment (DME) e-commerce platform hosted on **`baemeds.com`**.

The migration preserved all existing visual identity, component architectures, design tokens, and user flows while fully overhauling the underlying regional, regulatory, tax, shipping, payment, and data-privacy models to be native to the United States healthcare market.

---

## 2. Core Architectural & Market Transformations

### 2.1 Regional Configuration & Currency (`lib/marketConfig.ts`)
- **Centralized Market Registry**: Hardcoded INR (`₹`) symbols and regional assumptions were eliminated in favor of a single source of truth (`MARKET_CONFIG`).
- **Currency**: Standardized to USD (`$`) using `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.
- **Locale & Country**: Standardized to `en-US` and `US`.
- **Formatting Utilities**:
  - `formatPrice(amount)`: Formats numeric amounts to clean US currency strings (e.g., `$1,299.00`).
  - `isValidUSZip(zip)`: Validates 5-digit and 9-digit ZIP+4 formats (`^\d{5}(-\d{4})?$`).
  - `isValidUSPhone(phone)`: Validates US standard 10-digit formats with optional `+1` prefix.
  - `formatUSPhone(phone)`: Normalizes phone numbers to standard `(XXX) XXX-XXXX` presentation or E.164 (`+1XXXXXXXXXX`) storage.
  - `US_STATES`: Complete enumeration of all 50 US states plus the District of Columbia with standard 2-letter USPS abbreviations.

### 2.2 Corporate Identity & Domain (`constants.tsx` & `index.html`)
- **Domain**: Hosted on `https://www.baemeds.com`.
- **Corporate Entity**: BaeMeds Healthcare USA LLC.
- **Registered Address**: 1209 Orange Street, Wilmington, DE 19801.
- **Nationwide Support**: Toll-free hotline `+1 (800) 555-0199` and email `support@baemeds.com`.
- **Removed Channels**: India WhatsApp chat routing removed in favor of direct toll-free customer support and secure contact forms.

---

## 3. Taxation Architecture (`server/taxService.ts`)

In the US, sales tax cannot be treated as a flat national rate (like GST). It is destination-based and subject to state, county, municipal, and special district rules, alongside medical-specific exemptions:

1. **State Nexus Baseline Rates**: Modeled default baseline state rates (e.g., CA 7.25%, TX 6.25%, NY 4.00%, FL 6.00%) with automated zero-tax recognition for non-sales-tax states (AK, DE, MT, NH, OR).
2. **Statutory Medical Exemptions**:
   - Prescription equipment and pharmaceuticals are marked tax-exempt (`taxRate = 0%`).
   - Qualified DME categories (e.g., home oxygen concentrators, CPAP/BiPAP units) receive tax exemptions or reductions based on state-level medical device statutes.
3. **Pluggable Architecture**: Structured with clean interfaces (`TaxCalculationRequest`, `TaxCalculationResult`) ready for upstream enterprise provider adapters (e.g., TaxJar, Avalara AvaTax, Stripe Tax).

---

## 4. Shipping & Fulfillment Architecture (`server/shippingService.ts`)

Replaced local Indian courier hubs with a carrier-tier abstraction tailored to US domestic logistics:

1. **Integrated US Carriers**:
   - **USPS**: Priority Mail (2-3 business days) for lightweight consumables, accessories, and replacement filters.
   - **UPS**: Ground (3-5 business days) and 2nd Day Air for standard diagnostic and mobility equipment.
   - **FedEx**: Standard Overnight for critical respiratory and emergency patient care supplies.
   - **Freight / White Glove**: Specialized delivery tier for heavy DME (hospital beds, patient lifts, oxygen concentrators > 30 lbs) including inside placement and technician unboxing.
2. **Dynamic Rates**: Weight-based pricing calculations and free shipping tiers for orders over `$99`.
3. **Carrier Tracking**: Dynamic tracking URL generation resolving to official USPS, UPS, and FedEx tracking endpoints.

---

## 5. Medical Catalog & DME Data Model (`types.ts`)

Extended the product definitions to support United States healthcare and reimbursement standards:

- `requiresPrescription: boolean`: Identifies products requiring valid physician prescriptions prior to shipment.
- `hcpcsCode: string`: Healthcare Common Procedure Coding System code for insurance and Medicare reimbursement (e.g., `E1390` for Oxygen Concentrators, `E0470` for BiPAP machines).
- `fdaClassification: 'Class I' | 'Class II' | 'Class III'`: FDA medical device regulatory classification.
- `eligibleFsaHsa: boolean`: Badges products eligible for pre-tax Flexible Spending Account / Health Savings Account purchasing.
- `weightLbs: number`: Product weight in pounds for domestic carrier rate quoting and logistics classification.
- `ndcNumber` & `udi`: Optional fields for National Drug Codes and Unique Device Identifiers.

---

## 6. Security, RBAC & Audit Logging (`server/auditLogger.ts`)

- **Role-Based Access Control (RBAC)**: Defined least-privilege roles:
  - `super_admin`, `compliance_officer`, `clinical_specialist`, `support_agent`, `fulfillment_specialist`, `customer`.
- **Immutable Audit Logging**: Captures actor ID, IP address, user agent, event type, and outcome.
- **Automatic PHI Redaction**: Built-in sanitization scrubs patient names, Social Security numbers, dates of birth, phone numbers, and street addresses from logging payloads before storage.

---

## 7. Legal, Policies & Patient Rights (`pages/PolicyPage.tsx`)

Completely overhauled store policies to meet US federal and state standards:
1. **Privacy Policy**: Explicit CCPA/CPRA state disclosures for California consumers, consumer health data disclosures, zero third-party sale of health data, and HIPAA technical safeguard explanations.
2. **Terms of Service**: Governed under the laws of the State of Delaware, dispute resolution via binding arbitration, and medical disclaimer stating equipment is dispensed pursuant to lawful orders.
3. **Shipping Policy**: Carrier breakdown (USPS, UPS, FedEx), signature requirements for high-value DME, and freight terms.
4. **Return Policy**: 30-day standard return window on unopened items; clear hygiene guidelines for opened sterile or respiratory disposables under FDA sanitary rules.

---

## 8. Clinical Guides & Educational Content
- Converted city-specific guides (`/hyderabad/`) into national clinical reference guides:
  - `/guides/oxygen-concentrator-rental-guide`: HCPCS E1390/E1392 standards, pulse vs continuous flow, FAA travel compliance, and CMS criteria.
  - `/guides/bipap-machine-rental-guide`: HCPCS E0470/E0471 parameters, EPAP/IPAP titration, and OSA/COPD management.
  - `/guides/patient-monitor-guide`: 5-para vs 7-para ICU telemetry monitors, FDA Class II guidelines.
- Preserved legacy URLs as aliases in `App.tsx` to maintain 100% backward compatibility and prevent 404s.

---

## 9. Verification & Quality Assurance

- **Unit Testing**: `tests/us-market.test.ts` tests:
  - Market config validation, state abbreviations, and phone normalization.
  - Sales tax calculations across nexus states and DME exemption rules.
  - Carrier shipping options and heavy freight tier selection.
  - Audit logging and automated PHI sanitization.
- **Type Checking**: `npm run lint` (`tsc --noEmit`) passes with 0 errors across all 35+ components and pages.
- **SEO & Search**: `public/sitemap.xml` regenerated with 151 URLs for `https://baemeds.com`.
