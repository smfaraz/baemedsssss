# BaeMeds USA — Phase 0 Safety Baseline

**Execution Timestamp:** 2026-10-01T06:46:00+05:30  
**Environment:** Windows PowerShell, Node.js v20.18.0, TypeScript 5.8.2, Vite 6.4.3  
**Database Target:** Supabase Cloud (`https://ifadlrhqsgdxeeebjblo.supabase.co`)  
**Catalog Size:** 3,099 real DME products (`data/catalog_seed.json`)

---

## 1. Safety Baseline Verification Commands & Results

| Step | Command | Result | Notes / Details |
| :--- | :--- | :--- | :--- |
| **Typecheck & Lint** | `npm run lint` (`tsc --noEmit`) | **PASS (Code 0)** | Zero TypeScript compilation errors. |
| **US-Market Architectural Test** | `npx tsx tests/us-market.test.ts` | **PASS (Code 0)** | 7/7 suites passed: US tax exemptions, carrier validation, PHI sanitization, address sanitation, RBAC role governance, and adversarial attacks. |
| **Admin RBAC & Anti-Spoofing Test** | `npx tsx tests/admin-rbac.test.ts` | **PASS (Code 0)** | 6/6 suites passed: Auth rejection, RBAC least-privilege, Anti-spoofing (`X-Admin-Role` denied), order transitions, negative stock denial, mass assignment denial, HIPAA audit immutability. |
| **Native Commerce Test** | `npx tsx tests/native-commerce.test.ts` | **FAIL (Code 1)** | Pre-existing failure: Test expected `'Oxygen Concentrator'` category products, but the compiled 3,099 US DME catalog (`data/catalog_seed.json`) contains the 10 clinical DME categories (`BiPAP Machines`, `CPAP Machines`, `Wheelchairs`, `Blood Pressure Monitors`, `Glucometers`, `Nebulizers`, `Suction Machines`, `Patient Monitors`, `Breast Pumps`, `Incontinence & Care`). Documented per protocol. |
| **Production Build** | `npm run build` | **PASS (Code 0)** | Full production build succeeded: Vite client bundle (33.28s) + Fast Concurrent Prerender of 24/24 static HTML routes (60.2s) + Master XML sitemap (3,125 URLs). |
| **Database Connectivity** | Supabase REST query | **PASS (Code 0)** | Successfully connected to live Supabase instance; verified 1,000 active products in remote database. |

---

## 2. Pre-Existing Failures & Vulnerabilities Identified

1. **Pre-Existing Native Commerce Test Failure (`tests/native-commerce.test.ts`)**:
   - `Error: Expected oxygen concentrator category products to be found at testNativeCatalog (tests/native-commerce.test.ts:46:11)`.
   - Cause: The test suite hardcodes an expectation for category `'Oxygen Concentrator'` from the legacy catalog, whereas the newly compiled 3,099 real US DME catalog has respiratory equipment categorized under `'BiPAP Machines'`, `'CPAP Machines'`, `'Nebulizers'`, and `'Suction Machines'`.
2. **Server/Client Boundary Violations**:
   - `pages/AccountPage.tsx` statically imported `../server/auditLogger` (unused import).
   - `lib/enquiries.ts` imported `../server/auditLogger` and attempted direct execution from browser context.
   - Vite reported: `lib/supabase.ts is dynamically imported by server/auditLogger.ts but also statically imported by context/ReviewsContext.tsx`.
3. **Session Token Hardening Required**:
   - `server/commerce.ts` was generating mock customer session tokens (`bm_usr_...`) using base64 without cryptographic signature or Supabase Auth session validation.
   - Admin routes in `server/adminService.ts` supported development fallback tokens (`bm_admin_...`) which must be replaced with real Supabase Auth JWT verification.

---

## 3. Baseline Conclusion

The system compiles cleanly and produces valid production bundles. Pre-existing test failure in `native-commerce.test.ts` is explicitly logged above and will be updated during the Catalog migration stage without faking data. Stage 1 (Identity & Security Foundation) is ready for immediate execution.
