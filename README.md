# BaeMeds USA Storefront

Production-grade medical equipment, Durable Medical Equipment (DME), and healthcare supplies e-commerce platform for [baemeds.com](https://www.baemeds.com/).

## Overview

BaeMeds USA operates a nationwide US healthcare commerce platform tailored to consumer and commercial medical equipment needs, featuring:
- **US Regional Architecture**: Full 50-state + DC shipping, US ZIP/ZIP+4 address validation, +1 E.164 phone formatting, and USD pricing.
- **US Sales Tax Layer**: Automated state baseline and local tax calculations with medical/DME/Rx statutory exemptions.
- **Carrier Shipping Abstraction**: Real-time integration hooks for USPS, UPS, FedEx, and White Glove Medical Freight.
- **Healthcare & DME Cataloging**: HCPCS coding, FDA device classification, prescription badges, and FSA/HSA eligibility tags.
- **HIPAA-Conscious Safeguards**: Least-privilege RBAC architecture, audit logging with automatic PHI sanitization, and strict zero-PHI analytics protections.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Commerce Backend**: Shopify Storefront GraphQL API (Catalogue, Cart, Customer Accounts, Checkout, Orders)
- **Services & Storage**: Supabase (reviews, inquiries, RBAC, audit logging), Vercel Serverless Functions
- **Hosting**: Vercel (`https://www.baemeds.com/`)

## Local Development

Requires Node.js (v18+).

```powershell
npm install
npm run dev
```

### Environment Configuration

Copy `.env.example` to `.env.local` to override default store configuration:

```dotenv
# Market & Storefront Configuration
VITE_MARKET=US
VITE_COUNTRY=US
VITE_CURRENCY=USD
VITE_LOCALE=en-US
VITE_PUBLIC_DOMAIN=https://www.baemeds.com

# Shopify Storefront API
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-public-storefront-token

# Supabase Integration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

*Security Note*: Never expose Shopify Admin API secrets or service-role keys in `VITE_` prefixed variables.

## Testing & Validation

```powershell
# Type checking
npm run lint

# Architecture & US Market unit tests
npm test

# Production build validation
npm run build
```

## Compliance & Documentation

- [US Market Migration Guide](./US_MARKET_MIGRATION.md)
- [Security Architecture](./SECURITY.md)
- [Healthcare Compliance & Technical Safeguards](./COMPLIANCE.md)

