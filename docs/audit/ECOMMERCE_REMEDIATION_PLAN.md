# BaeMeds USA — Prioritized Remediation Plan & Roadmap

**Date**: October 15, 2026  
**Status**: Active Execution  

---

## 1. Remediation Status Overview

| Phase | Priority Level | Total Items | Completed | In Progress | Planned |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Phase 1: Immediate Critical Stability & Boot Fixes** | **P0** | 2 | 2 (100%) | 0 | 0 |
| **Phase 2: Gateway Decoupling & Checkout Integrity** | **P1** | 4 | 4 (100%) | 0 | 0 |
| **Phase 3: SEO Canonicalization & Sitemap Alignment** | **P2** | 2 | 2 (100%) | 0 | 0 |
| **Phase 4: Operational Key Configuration & Cloud Hooks** | **P2** | 3 | 1 (33%) | 1 | 1 |
| **Phase 5: Performance Chunking & Micro-Optimizations** | **P3** | 5 | 2 (40%) | 0 | 3 |

---

## 2. Completed Remediations (Live in Production)

### REM-01: Self-Contained Administrative API Gateway (`/api/admin/*`)
- **Status**: **COMPLETED (Verified Live)**
- **Action Taken**: Inlined database connection, role-based access control, state machine, and data access logic into `api/admin.ts`.
- **Commit**: `d238f54`
- **Acceptance Criteria Met**: `/api/admin/orders`, `/api/admin/products`, `/api/admin/inventory`, `/api/admin/dashboard` return HTTP 200 with live Supabase data.

### REM-02: Universal WebSocket Polyfill for Node Runtime Compatibility
- **Status**: **COMPLETED (Verified Live)**
- **Action Taken**: Added `globalThis.WebSocket` fallback class preventing `@supabase/supabase-js` v2.110.8 crash on Node < 22 lambdas.
- **Commit**: `d238f54`, `5f38d49`
- **Acceptance Criteria Met**: Zero `Node.js detected but native WebSocket not found` exceptions across all endpoints.

### REM-03: Self-Contained Checkout Gateway (`/api/checkout`)
- **Status**: **COMPLETED (Verified Live)**
- **Action Taken**: Inlined `TaxService` and decoupled `EmailService` from React DOM / `.tsx` imports.
- **Commit**: `513fe34`
- **Acceptance Criteria Met**: `/api/checkout` calculates exact state taxes, checks inventory, and records order in Supabase without runtime import resolution errors.

### REM-04: Canonical Domain Standardization in Sitemaps & OpenGraph
- **Status**: **COMPLETED (Verified Live)**
- **Action Taken**: Aligned all 3,181 URLs in `public/sitemap.xml`, `public/robots.txt`, and `index.html` to canonical `https://www.baemeds.com`.
- **Commit**: `513fe34`
- **Acceptance Criteria Met**: Crawlers inspect canonical URLs directly with zero 301 hop redirects.

### REM-05: Customer Authentication Isolation
- **Status**: **COMPLETED (Verified Live)**
- **Action Taken**: Added credential validation preventing unauthorized session creation for unregistered emails.
- **Commit**: `d238f54`
- **Acceptance Criteria Met**: Unregistered emails receive HTTP 401; registered customers receive HTTP 200 with session cookie.

---

## 3. Recommended Future Enhancements

### REM-06: Add Production Resend API Key in Vercel
- **Priority**: **P2 — Medium**
- **Effort**: 10 minutes (Configuration only)
- **Dependency**: Resend account & domain DNS verification
- **Steps**:
  1. Add `RESEND_API_KEY=re_...` to Vercel Environment Variables (Production & Preview).
  2. Verify `orders@baemeds.com` sending identity in Resend dashboard.
  3. Confirm test email receipt in patient inbox upon checkout completion.

### REM-07: Split Vendor JS Chunks via Vite Rollup Options
- **Priority**: **P3 — Low**
- **Effort**: 30 minutes
- **Steps**:
  1. Update `vite.config.ts`:
     ```ts
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
             motion: ['motion', 'framer-motion'],
             icons: ['lucide-react']
           }
         }
       }
     }
     ```
  2. Rebuild and verify vendor bundle drops below 300KB.

### REM-08: Add Automated Lighthouse CI Action
- **Priority**: **P3 — Low**
- **Effort**: 1 hour
- **Steps**:
  1. Add `.github/workflows/lighthouse.yml` to trigger on pull requests.
  2. Enforce minimum score of 90 across SEO, Best Practices, and Accessibility.
