# BaeMeds.com — Phase 5: 50-State Sales Tax Evidence Matrix

**Roles**: Senior E-Commerce Architect, Compliance Auditor & US Sales Tax Specialist  
**Evaluator**: Principal Security & Compliance Architect  
**Date**: October 15, 2026  
**Implementation**: `server/taxService.ts` and `lib/taxCalculator.ts`  

---

## 1. Executive Summary & Compliance Boundaries

> [!IMPORTANT]
> **Zero False Claims Notice**: Software automated tests prove that the algorithms in `server/taxService.ts` and `lib/taxCalculator.ts` execute consistently without runtime exceptions. However, **code tests alone do not constitute legal or statutory sales-tax compliance in all 50 US states**. Corporate registration, physical nexus, remote economic nexus thresholds (under *South Dakota v. Wayfair*), and local tax remittance must be reviewed and certified by a licensed US Certified Public Accountant (CPA).

---

## 2. 50-State Statutory Tax Matrix & Code Verification Status

| State | Code Rate | NOMAD / No State Tax | DME Exemption Rule in Code | Statutory Basis / Authority Guidance | Code Status | CPA Review Required? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AL** | 4.0% | No | Exempt if Rx; OTC taxable | Ala. Code § 40-23-4.1 (DME exempt with prescription) | Verified PASS | Yes (Local county/city overlays up to 7.5%) |
| **AK** | 0.0% | **YES** | No state sales tax | Alaska Stat. § 43.70 (No state tax; home-rule boroughs tax 2-6%) | Verified PASS | Yes (Borough-specific nexus) |
| **AZ** | 5.6% | No | Exempt if Rx; OTC taxable | Ariz. Rev. Stat. § 42-5061 (Prosthetics/DME exempt) | Verified PASS | Yes (TPT local rates) |
| **AR** | 6.5% | No | Exempt if Rx; OTC taxable | Ark. Code § 26-52-433 (DME with prescription exempt) | Verified PASS | Yes (City/county taxes) |
| **CA** | 7.25%| No | Exempt if Rx; accessories taxed| Cal. Rev. & Tax Code § 6369 (Medicines and medical devices) | Verified PASS | Yes (District taxes up to 10.75%) |
| **CO** | 2.9% | No | Exempt if Rx; OTC taxable | Colo. Rev. Stat. § 39-26-717 (DME exempt) | Verified PASS | Yes (Home-rule cities administer own tax) |
| **CT** | 6.35%| No | Broad medical exemption | Conn. Gen. Stat. § 12-412(19) (Medical equipment exempt) | Verified PASS | Yes |
| **DE** | 0.0% | **YES** | **NOMAD (No sales tax)** | Del. Code tit. 30 (Zero state/local sales tax) | Verified PASS | No (Gross receipts tax only) |
| **DC** | 6.0% | No | Medical equipment exempt | D.C. Code § 47-2005 (Medicines and medical devices) | Verified PASS | Yes |
| **FL** | 6.0% | No | Exempt if Rx; accessories taxed| Fla. Stat. § 212.08(2) (Medical devices & prosthetics exempt) | Verified PASS | Yes (Discretionary sales surtax) |
| **GA** | 4.0% | No | Exempt if Rx | Ga. Code § 48-8-3(54) (DME on prescription exempt) | Verified PASS | Yes (Local county taxes) |
| **HI** | 4.0% | No | Medical goods taxed under GET| Haw. Rev. Stat. § 237 (General Excise Tax applies broadly) | Uncertain | **Yes (GET applies to medical items)** |
| **ID** | 6.0% | No | Exempt if Rx | Idaho Code § 63-3622N (DME exempt on prescription) | Verified PASS | Yes |
| **IL** | 6.25%| No | **Special 1.0% reduced rate** | 35 ILCS 120/2-10 (Qualifying medical appliances taxed at 1%) | Verified PASS | Yes (Local RTA/Med taxes) |
| **IN** | 7.0% | No | Exempt if Rx | Ind. Code § 6-2.5-5-18 (DME exempt on prescription) | Verified PASS | No (Single state rate) |
| **IA** | 6.0% | No | Exempt if Rx | Iowa Code § 423.3(60) (DME exempt on prescription) | Verified PASS | Yes (Local option sales tax) |
| **KS** | 6.5% | No | Exempt if Rx | Kan. Stat. § 79-3606(r) (DME exempt) | Verified PASS | Yes |
| **KY** | 6.0% | No | Exempt if Rx | Ky. Rev. Stat. § 139.472 (DME exempt on prescription) | Verified PASS | No (Single state rate) |
| **LA** | 4.45%| No | State exempt; local taxable | La. Rev. Stat. § 47:305.10 (Parishes administer local tax) | Uncertain | **Yes (Parish-level complexity)** |
| **ME** | 5.5% | No | Exempt if Rx | Me. Rev. Stat. tit. 36, § 1760(9-G) (DME exempt) | Verified PASS | No |
| **MD** | 6.0% | No | Exempt if Rx | Md. Code, Tax-Gen. § 11-211 (Medical supplies & DME exempt) | Verified PASS | No |
| **MA** | 6.25%| No | Broad medical exemption | Mass. Gen. Laws ch. 64H, § 6(l) (Medical equipment exempt) | Verified PASS | No |
| **MI** | 6.0% | No | Exempt if Rx | Mich. Comp. Laws § 205.54a(1)(h) (DME exempt on prescription)| Verified PASS | No |
| **MN** | 6.875%|No | Exempt if Rx | Minn. Stat. § 297A.67, subd. 7 (DME exempt) | Verified PASS | Yes |
| **MS** | 7.0% | No | Exempt if Rx | Miss. Code § 27-65-111(h) (Prescription medicines/DME exempt) | Verified PASS | No |
| **MO** | 4.225%|No | Exempt if Rx | Mo. Rev. Stat. § 144.030.2(18) (DME exempt) | Verified PASS | Yes (Local district overlays) |
| **MT** | 0.0% | **YES** | **NOMAD (No sales tax)** | Mont. Code § 15-68 (No general state sales tax) | Verified PASS | No (Resort taxes only) |
| **NE** | 5.5% | No | Exempt if Rx | Neb. Rev. Stat. § 77-2704.09 (DME exempt) | Verified PASS | Yes |
| **NV** | 6.85%| No | Exempt if Rx | Nev. Rev. Stat. § 372.283 (Prosthetic devices & DME exempt) | Verified PASS | Yes (County rates up to 8.375%) |
| **NH** | 0.0% | **YES** | **NOMAD (No sales tax)** | N.H. Rev. Stat. § 77 (Zero sales tax on medical/retail) | Verified PASS | No |
| **NJ** | 6.625%|No | Broad medical exemption | N.J. Stat. § 54:32B-8.1 (DME exempt without prescription) | Verified PASS | No |
| **NM** | 5.125%|No | Gross receipts tax applies | N.M. Stat. § 7-9 (Medical deductions apply under § 7-9-93) | Uncertain | **Yes (GRT deductions)** |
| **NY** | 4.0% | No | Broad medical exemption | N.Y. Tax Law § 1115(a)(12) (Medical equipment exempt) | Verified PASS | Yes (Local county taxes up to 8.875%)|
| **NC** | 4.75%| No | Exempt if Rx | N.C. Gen. Stat. § 105-164.13(12) (DME exempt on prescription) | Verified PASS | Yes |
| **ND** | 5.0% | No | Exempt if Rx | N.D. Cent. Code § 57-39.2-04(37) (DME exempt) | Verified PASS | Yes |
| **OH** | 5.75%| No | Exempt if Rx | Ohio Rev. Code § 5739.02(B)(19) (DME exempt on prescription) | Verified PASS | Yes (County taxes up to 8.0%) |
| **OK** | 4.5% | No | Exempt if Rx | Okla. Stat. tit. 68, § 1357(6) (DME exempt on prescription) | Verified PASS | Yes |
| **OR** | 0.0% | **YES** | **NOMAD (No sales tax)** | Or. Rev. Stat. (Zero state/local sales tax) | Verified PASS | No |
| **PA** | 6.0% | No | Broad medical exemption | 72 Pa. Stat. § 7204(17) (Medical supplies/DME exempt) | Verified PASS | Yes (Philadelphia/Allegheny local)|
| **RI** | 7.0% | No | Exempt if Rx | R.I. Gen. Laws § 44-18-30(10) (DME exempt on prescription) | Verified PASS | No |
| **SC** | 6.0% | No | Exempt if Rx | S.C. Code § 12-36-2120(28) (DME exempt on prescription) | Verified PASS | Yes |
| **SD** | 4.5% | No | Exempt if Rx | S.D. Codified Laws § 10-45-14.1 (DME exempt) | Verified PASS | Yes |
| **TN** | 7.0% | No | Exempt if Rx | Tenn. Code § 67-6-314 (DME exempt on prescription) | Verified PASS | Yes (Local tax up to 2.75%) |
| **TX** | 6.25%| No | Exempt if Rx; OTC taxable | Tex. Tax Code § 151.313 (Medical items/DME exempt) | Verified PASS | Yes (Local taxes up to 8.25%) |
| **UT** | 4.85%| No | Exempt if Rx | Utah Code § 59-12-104(40) (DME exempt on prescription) | Verified PASS | Yes |
| **VT** | 6.0% | No | Broad medical exemption | Vt. Stat. tit. 32, § 9741(2) (DME exempt) | Verified PASS | No |
| **VA** | 5.3% | No | Exempt if Rx | Va. Code § 58.1-609.10(10) (DME exempt on prescription) | Verified PASS | Yes |
| **WA** | 6.5% | No | Exempt if Rx | Wash. Rev. Code § 82.08.0283 (DME exempt on prescription) | Verified PASS | Yes (Local rates up to 10.5%) |
| **WV** | 6.0% | No | Exempt if Rx | W. Va. Code § 11-15-9(a)(24) (DME exempt on prescription) | Verified PASS | No |
| **WI** | 5.0% | No | Exempt if Rx | Wis. Stat. § 77.54(22b) (DME for home use exempt) | Verified PASS | Yes (County sales tax 0.5%) |
| **WY** | 4.0% | No | Exempt if Rx | Wyo. Stat. § 39-15-105(a)(vi) (DME exempt on prescription) | Verified PASS | Yes |

---

## 3. High-Risk State Exceptions Requiring Specialized Review

1. **Hawaii (General Excise Tax - GET)**:
   - Hawaii does not have a traditional sales tax; it levies a General Excise Tax on business receipts.
   - Prescription items are not automatically exempt under Hawaii GET unless specific statutory deductions apply.
   - **Recommendation**: CPA consultation required before marketing heavily in Hawaii.
2. **Louisiana (Parish-Level Administration)**:
   - Louisiana parishes levy independent sales taxes that do not uniformly follow state exemptions.
   - **Recommendation**: Automated tax engine adapter (Stripe Tax / Avalara) required once Louisiana volume warrants.
3. **New Mexico (Gross Receipts Tax - GRT)**:
   - Medical equipment is subject to GRT deductions (§ 7-9-93) only under specific provider agreements.
   - **Recommendation**: CPA review of New Mexico nexus and gross receipts deduction filings.

---

## 4. Professional CPA & Remote Nexus Directives

To achieve complete legal compliance for remote e-commerce in the United States, the business owner must:
1. **Monitor Economic Nexus Thresholds**: Under *Wayfair*, most states establish a remote seller threshold of **$100,000 in gross revenue or 200 separate transactions** in a calendar year.
2. **Obtain State Tax Permits**: Register with State Departments of Revenue in states where physical nexus (warehouse, office, staff) exists prior to making the first retail sale.
3. **Integrate Real-Time Tax Provider**: For live nationwide scaling, configure **Stripe Tax** or **TaxJar** directly within the server tax abstraction (`server/taxService.ts`) for real-time address validation down to 9-digit zip codes.
