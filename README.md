# BaeMeds USA — Production E-Commerce Platform

Enterprise-grade Durable Medical Equipment (DME) and healthcare supplies e-commerce platform for **[baemeds.com](https://www.baemeds.com/)**.

---

## 🗂️ Clean Project Directory Structure

```
baemeds-main/
│
├── 📁 products/           # 📦 Primary DME Catalogs (Extracted from McKesson by Category)
│   ├── catalog_bipap_extracted_2026-09-29.csv
│   ├── catalog_cpap_extracted_2026-09-29.csv
│   ├── catalog_wheel_extracted_2026-09-29.csv
│   ├── catalog_blood_pressure_monitor_extracted_2026-09-29.csv
│   ├── catalog_blood_glucose_extracted_2026-09-29.csv
│   ├── catalog_nebulizer_extracted_2026-09-29.csv
│   ├── catalog_suction_ma_extracted_2026-09-29.csv
│   ├── catalog_pulse_oximeter_extracted_2026-09-29.csv
│   ├── catalog_breast_pump_extracted_2026-09-29.csv
│   └── catalog_adult_br_extracted_2026-09-29.csv
│
├── 📁 pages/              # 🖥️ Customer Storefront & Admin Back-Office Pages
│   ├── HomePage.tsx, ProductDetailPage.tsx, CheckoutPage.tsx
│   ├── ProductResearchPage.tsx (Wholesale costs, margins, profit simulator)
│   └── 📁 admin/          # Admin Dashboard, Products, Orders, McKesson Dropshipping
│
├── 📁 components/         # 🧩 Reusable React UI Components (Cards, Nav, Footers, Modals)
│
├── 📁 api/                # ⚡ Serverless API Endpoints (Vercel & Vite Dev Gateway)
│   ├── admin.ts           # Admin RBAC & backend services
│   ├── checkout.ts        # Order creation, payments, address verification
│   └── feeds.ts           # Google Merchant Center XML & Meta Catalog CSV generator
│
├── 📁 server/             # 🛠️ Backend Business Logic, Taxes, Audit Logging, Dropshipping
│
├── 📁 lib/                # 📚 Core Utilities, Supabase Client & Omnichannel Tracking
│   ├── supabase.ts        # Supabase PostgreSQL client
│   ├── commerce.ts        # Catalog hydrator & search queries
│   └── analytics.ts       # Unified GA4 e-commerce & Meta Pixel tracking
│
├── 📁 data/               # 💾 Authoritative Seed & Research Datasets
│   ├── catalog_seed.json  # 3,099 Clean compiled products from products/
│   ├── product_research.json
│   └── 📁 archive_csvs/   # Historical research sheets and scratch backups
│
├── 📁 supabase/           # 🗄️ Database Schemas & Migrations (PostgreSQL)
│   └── MASTER_COMPLETE_SETUP.sql
│
├── 📁 scripts/            # 🚀 Database Seeding & Pipeline Automation
│   ├── compile_products_folder.mjs   # Compiles products/ into catalog_seed.json
│   ├── seed_live_supabase_database.mjs # Seeds Supabase products table
│   └── generate_static_feeds.mjs     # Generates Google & Meta feeds
│
├── 📁 public/             # 🌐 Static Assets & Marketing Feeds
│   └── 📁 feeds/          # google-merchant.xml & meta-catalog.csv
│
├── 📁 docs/               # 📖 Technical Architecture & Compliance Documentation
│   ├── 📁 architecture/   # System blueprints & schema docs
│   ├── 📁 security/       # HIPAA, RBAC, and security audit reports
│   ├── 📁 api/            # API specifications
│   ├── 📁 migration/      # Shopify migration & launch guides
│   └── 📁 testing/        # Test plans & readiness reports
│
└── 📁 reports/            # 📊 Client Deliverables, Presentations & HTML Roadmaps
```

---

## 🚀 Key Commands

```powershell
# 1. Start Local Development Server
npm run dev

# 2. Type-Check the Codebase
npx tsc --noEmit

# 3. Re-compile products/ into catalog_seed.json
node scripts/compile_products_folder.mjs

# 4. Re-seed Live Supabase Database
node scripts/seed_live_supabase_database.mjs

# 5. Re-generate Google Shopping & Meta Feeds
node scripts/generate_static_feeds.mjs
```

---

## 🔒 Environment Variables (`.env.local`)

```ini
VITE_SUPABASE_URL=https://ifadlrhqsgdxeeebjblo.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret
```
