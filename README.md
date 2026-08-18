# BaeMeds India storefront

Customer-facing medical-equipment storefront for [baemeds.in](https://www.baemeds.in/).

## Stack

- React, TypeScript, Vite, and Tailwind CSS
- Shopify Storefront API for catalogue, cart, customers, checkout, orders, and fulfilment
- Vercel for hosting and same-origin serverless account endpoints

## Local development

Requires Node.js.

```powershell
npm install
npm run dev
```

Create `.env.local` only when overriding the configured public Shopify Storefront values:

```dotenv
VITE_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-public-storefront-token
```

Never place a Shopify Admin API token or private Storefront token in a `VITE_` variable.

## Validation

```powershell
npm run lint
npm run build
```

Production is deployed on Vercel and points to `https://www.baemeds.in/`.
