# BaeMeds — Native Commerce Database Schema Specification

**Date:** September 15, 2026  
**Database Engine:** PostgreSQL (Supabase Cloud 15+)  
**Migration:** `supabase/migrations/20260915170000_native_commerce_platform.sql`  
**Security Framework:** Row-Level Security (RLS) with Role-Based Access Control (RBAC)  

---

## 1. Schema Overview

The native commerce database schema replaces Shopify's external data store with first-party relational tables under our direct control. It establishes clear domain boundaries across:
1. **Catalog Domain:** `products`, `product_variants`, `product_images`, `promotions`
2. **Cart Domain:** `carts`, `cart_items`
3. **Order Domain:** `orders`, `order_items`, `order_status_history`
4. **Healthcare Domain:** `prescriptions` (existing table preserved and linked)
5. **Customer & Auth Domain:** `profiles`, `addresses`, `user_roles`
6. **Audit Domain:** `audit_logs` (immutable append-only)

---

## 2. Table Specifications

### A. Catalog Domain

#### `public.products`
Stores core durable medical equipment specifications and regulatory classifications.
- `id` (uuid, PK, default `gen_random_uuid()`)
- `handle` (text, UNIQUE, NOT NULL): SEO-friendly URL slug (e.g. `resmed-airsense-10-autoset`).
- `title` (text, NOT NULL): Product display name.
- `vendor` (text, NOT NULL, default `'BaeMeds'`): Manufacturer / brand.
- `category` (text, NOT NULL): Clinical category (e.g. `Oxygen Concentrator`, `CPAP`, `BiPAP`).
- `description` (text): Full HTML/markdown product description.
- `specs` (text): Technical biomedical specifications.
- `warranty` (text): Manufacturer warranty terms.
- `in_stock` (boolean, NOT NULL, default `true`).
- `requires_prescription` (boolean, NOT NULL, default `false`).
- `hcpcs_code` (text): CMS HCPCS reimbursement code (e.g. `E1390`, `E0601`).
- `fda_classification` (text): Check constraint `('Class I', 'Class II', 'Class III')`.
- `eligible_fsa_hsa` (boolean, NOT NULL, default `false`).
- `is_regulatory_verified` (boolean, NOT NULL, default `true`).
- `created_at`, `updated_at` (timestamptz).

#### `public.product_variants`
Stores purchasable product SKUs and authoritative prices.
- `id` (uuid, PK, default `gen_random_uuid()`)
- `product_id` (uuid, FK -> `products.id` ON DELETE CASCADE)
- `title` (text, NOT NULL, default `'Standard'`)
- `sku` (text): Internal inventory SKU.
- `price` (numeric(12, 2), NOT NULL, check `price >= 0`): Authoritative USD price.
- `compare_at_price` (numeric(12, 2)): Original MSRP / crossed-out price.
- `available_quantity` (integer, NOT NULL, default 100, check `>= 0`).
- `in_stock` (boolean, NOT NULL, default `true`).
- `created_at` (timestamptz).

#### `public.product_images`
High-resolution medical equipment photography.
- `id` (uuid, PK)
- `product_id` (uuid, FK -> `products.id` ON DELETE CASCADE)
- `url` (text, NOT NULL)
- `alt_text` (text)
- `display_order` (integer, NOT NULL, default 0)

#### `public.promotions`
Promotional codes and order discount rules.
- `id` (uuid, PK)
- `code` (text, UNIQUE, NOT NULL): Coupon code (e.g. `WELCOME10`).
- `discount_type` (text, check in `('percentage', 'fixed_amount')`).
- `value` (numeric(10, 2), NOT NULL, check `value > 0`).
- `minimum_order_amount` (numeric(10, 2), default 0).
- `is_active` (boolean, default `true`).
- `expires_at` (timestamptz).

---

### B. Cart Domain

#### `public.carts`
Server-side cart sessions supporting both authenticated users and anonymous guests.
- `id` (uuid, PK)
- `token` (text, UNIQUE, NOT NULL): Secret client cart token (UUID).
- `user_id` (uuid, FK -> `auth.users.id` ON DELETE SET NULL): Bound customer.
- `coupon_code` (text): Applied discount code.
- `created_at`, `updated_at` (timestamptz).

#### `public.cart_items`
Individual line items within a cart.
- `id` (uuid, PK)
- `cart_id` (uuid, FK -> `carts.id` ON DELETE CASCADE)
- `product_id` (uuid, FK -> `products.id` ON DELETE CASCADE)
- `variant_id` (uuid, FK -> `product_variants.id` ON DELETE CASCADE)
- `quantity` (integer, NOT NULL, check `quantity > 0`)
- `unique (cart_id, variant_id)` constraint preventing duplicate item rows.

---

### C. Order Domain

#### `public.orders`
Authoritative record of completed transactions and clinical fulfillment status.
- `id` (uuid, PK)
- `order_number` (text, UNIQUE, NOT NULL): Human-readable order number (e.g. `BM-10024`).
- `user_id` (uuid, FK -> `auth.users.id` ON DELETE SET NULL)
- `customer_email` (text, NOT NULL)
- `customer_phone` (text)
- `status` (text, NOT NULL): Enforced state machine:
  - `PENDING_PAYMENT`
  - `PAID`
  - `CLINICAL_REVIEW`
  - `CLINICAL_APPROVED`
  - `CLINICAL_REJECTED`
  - `PROCESSING`
  - `FULFILLMENT`
  - `SHIPPED`
  - `DELIVERED`
  - `CANCELLED`
  - `REFUNDED`
- `subtotal_amount` (numeric(12, 2), NOT NULL)
- `discount_amount` (numeric(12, 2), default 0)
- `shipping_amount` (numeric(12, 2), default 0)
- `tax_amount` (numeric(12, 2), default 0)
- `total_amount` (numeric(12, 2), NOT NULL)
- `currency` (text, default `'USD'`)
- `shipping_address` (jsonb, NOT NULL): Validated US delivery address.
- `billing_address` (jsonb, NOT NULL): Payment billing address.
- `carrier` (text): `USPS`, `FedEx`, `UPS`, or `Freight`.
- `service_name` (text): e.g. `Priority Mail`, `White-Glove Freight`.
- `tracking_number` (text)
- `tracking_url` (text)
- `requires_prescription` (boolean, default `false`)
- `prescription_attested` (boolean, default `false`)
- `payment_method` (text, default `'credit_card'`)
- `payment_reference` (text): Payment intent token from gateway.

#### `public.order_items`
Line items attached to an order.
- `id` (uuid, PK)
- `order_id` (uuid, FK -> `orders.id` ON DELETE CASCADE)
- `product_id` (uuid, FK -> `products.id` ON DELETE SET NULL)
- `variant_id` (uuid, FK -> `product_variants.id` ON DELETE SET NULL)
- `product_title` (text, NOT NULL)
- `variant_title` (text)
- `sku` (text)
- `price` (numeric(12, 2), NOT NULL)
- `quantity` (integer, NOT NULL, check `quantity > 0`)
- `total_price` (numeric(12, 2), NOT NULL)
- `requires_prescription` (boolean, default `false`)

---

## 3. Row-Level Security (RLS) Policies

All tables have RLS enabled:
- **`products`, `product_variants`, `product_images`, `promotions`:**
  - `SELECT`: Unrestricted public read (`true`).
  - `INSERT`, `UPDATE`, `DELETE`: Restricted strictly to `is_admin()`.
- **`carts`, `cart_items`:**
  - Access restricted to `user_id = auth.uid()` or the holder of the secret cart `token`.
- **`orders`, `order_items`:**
  - `SELECT`: Owning customer (`user_id = auth.uid()`), `super_admin`, `fulfillment_specialist`, `clinical_specialist`, `support_agent`.
  - `UPDATE`: Restricted strictly to authorized staff roles. Customers cannot alter placed orders.
