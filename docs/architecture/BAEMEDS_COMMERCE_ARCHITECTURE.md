# BaeMeds — First-Party Native Commerce Architecture Specification

**Date:** September 15, 2026  
**Status:** In Production Migration  
**Target:** 100% Zero-Shopify Native Healthcare Commerce  

---

## 1. Architectural Philosophy

The BaeMeds native commerce platform is designed as a **secure, modular monolith** combining client-side React 19 presentation, Vercel Edge routing functions, and Supabase PostgreSQL storage.

### Core Architectural Principles:
1. **Frontend Contract Immutability:** The existing user interface components, layouts, styling, props, and design tokens remain 100% untouched.
2. **Server-Side Financial Authority:** The client browser is never trusted for item prices, discount amounts, shipping fees, sales taxes, or final totals.
3. **PCI-DSS SAQ-A Compliance:** Zero cardholder PAN or CVV data is collected or stored on our servers. Payment processing uses tokenized client-to-gateway architecture.
4. **Clinical Data Isolation:** Prescription records, clinical diagnoses, and physician information are governed by strict Row-Level Security (RLS) policies separate from standard commerce items.

---

## 2. High-Level Service Boundaries

```text
[ Browser Client ]
        │
        ├── (Direct Fast Read) ──────> [ lib/commerce.ts ] (Native Product & Catalog Cache)
        │
        └── (Mutations & Checkout) ──> [ /api/* Edge Endpoints ]
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               │                               │                               │
        [ /api/auth ]                   [ /api/cart ]                  [ /api/checkout ]
        Session Cookie                  Cart Mutator                   Order Engine & Tax
               │                               │                               │
               └───────────────────────────────┴───────────────────────────────┘
                                               │
                                               ▼
                              [ Supabase PostgreSQL & RLS ]
                              - products & variants
                              - carts & cart_items
                              - orders & order_items
                              - prescriptions (HIPAA isolated)
                              - audit_logs (append-only)
```

---

## 3. Component Replacement Mapping

| Shopify Component | Native BaeMeds Replacement | Implementation File |
| :--- | :--- | :--- |
| Shopify Storefront API | First-Party Catalog Service & Database | `lib/commerce.ts`, `server/commerce.ts` |
| Shopify Cart API | First-Party Cart Engine & Database | `lib/commerce.ts`, `api/cart.ts` |
| Shopify Customer API | Native Session Authentication | `api/auth.ts`, `server/commerce.ts` |
| Shopify Mailing Addresses | Native Address Management & RLS | `api/account.ts`, `public.addresses` |
| Shopify Hosted Checkout | In-App Native Medical Checkout | `pages/CheckoutPage.tsx`, `api/checkout.ts` |
| Shopify Order System | First-Party Order State Machine | `public.orders`, `api/orders.ts` |
| Shopify Webhooks | First-Party Event Bus & Audit Logger | `server/auditLogger.ts`, `server/commerce.ts` |
