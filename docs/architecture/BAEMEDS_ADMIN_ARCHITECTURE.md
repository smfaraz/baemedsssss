# BaeMeds Native Admin Platform — Architecture & System Design

## 1. Executive Summary & Operational Objective

The **BaeMeds Native Admin Platform** is a first-party, enterprise-grade back-office commerce operations system built to completely replace external third-party administrative control planes (such as Shopify Admin).

Operating under `/admin`, the platform serves as the single authoritative operational center for BaeMeds commerce, clinical operations, warehouse logistics, patient relations, and compliance governance.

---

## 2. Absolute Storefront UI Freeze Guarantee

The customer-facing application is strictly isolated and frozen:
- **Zero Storefront Regressions**: The public website (`/`, `/products`, `/cart`, `/checkout`, `/account`, `/wishlist`, etc.) maintains 100% visual and behavioral parity.
- **Independent Layout Boundary**: In `App.tsx`, route routing dynamically detects `/admin/*` subpaths and branches into the dedicated `AdminLayout` without loading the customer `Header`, `Footer`, or `SupportCenter`.
- **Authoritative Data Independence**: Customer sessions have zero access to administrative mutation capabilities or internal clinical logs.

---

## 3. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                           BAEMEDS APPLICATION RUNTIME                             |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +---------------------------------------+   +-------------------------------+   |
|   |         PUBLIC STOREFRONT             |   |      ADMIN BACK-OFFICE        |   |
|   |   (Catalog, Cart, Checkout, Account)  |   |   (All Routes Under /admin/*) |   |
|   |   - Unchanged UI & UX                 |   |   - AdminLayout & Sidebar     |   |
|   |   - Customer Auth & Profiles          |   |   - Role Switcher & Badges    |   |
|   |   - Read-Only Active Catalog          |   |   - 18 Specialized Pages      |   |
|   +---------------------------------------+   +-------------------------------+   |
|                       |                                       |                   |
|                       v                                       v                   |
|   +---------------------------------------+   +-------------------------------+   |
|   |          STOREFRONT APIS              |   |       ADMIN API GATEWAY       |   |
|   |     /api/cart, /api/checkout          |   |          /api/admin/*         |   |
|   +---------------------------------------+   +-------------------------------+   |
|                       \                                       /                   |
|                        \                                     /                    |
|                         v                                   v                     |
|   +---------------------------------------------------------------------------+   |
|   |                  NATIVE SERVICE LAYER (server/*.ts)                       |   |
|   |   - AdminService (Authoritative RBAC, State Machine, Audited Mutations)   |   |
|   |   - CommerceService (Cart Calculations, Nexus Tax, Insured Carrier Rules) |   |
|   +---------------------------------------------------------------------------+   |
|                                       |                                           |
|                                       v                                           |
|   +---------------------------------------------------------------------------+   |
|   |                 PERSISTENCE & COMPLIANCE DATABASE                         |   |
|   |   - Supabase PostgreSQL (psyeixlohgkpvaymjyxh.supabase.co)                |   |
|   |   - Products, Orders, Prescriptions, Audit Logs, Inventory, Staff         |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 4. Administrative Subroute Topology

The admin platform provides complete routing for all commerce operational dimensions:

| Route | View Component | Authorized Roles | Functional Capability |
| :--- | :--- | :--- | :--- |
| `/admin` | `AdminDashboardPage` | All Staff Roles | Live KPIs, revenue trend, pending orders, urgent prescriptions |
| `/admin/orders` | `AdminOrdersPage` | Super Admin, Compliance, Clinical, Support, Fulfillment | Order table, multi-status filter tabs, customer search, totals |
| `/admin/orders/:id` | `AdminOrderDetailPage` | Super Admin, Compliance, Clinical, Support, Fulfillment | Order inspection, state machine actions, tracking modal, addresses |
| `/admin/products` | `AdminProductsPage` | Super Admin, Compliance, Clinical | Catalog table, HCPCS codes, inventory badges, bulk actions |
| `/admin/products/new` | `AdminProductEditorPage`| Super Admin | Product creation, FDA classification, warranty, pricing rules |
| `/admin/products/:id` | `AdminProductEditorPage`| Super Admin | Full product and variant editor, pricing mutations, HCPCS codes |
| `/admin/inventory` | `AdminInventoryPage` | Super Admin, Fulfillment | Physical stock counts, status badges, audited adjustments |
| `/admin/customers` | `AdminCustomersPage` | Super Admin, Support | Customer directory, lifetime spend, order count, contact details |
| `/admin/customers/:id`| `AdminCustomerDetailPage`| Super Admin, Support | Patient profile, order history, address details, HIPAA protections |
| `/admin/prescriptions`| `AdminPrescriptionsPage`| Super Admin, Clinical, Compliance | Prescription queue, filter tabs, physician NPI lookup |
| `/admin/prescriptions/:id` | `AdminPrescriptionDetailPage`| Super Admin, Clinical | Official script preview, approval/rejection notes, order release |
| `/admin/discounts` | `AdminDiscountsPage` | Super Admin | Coupon management, percentage/fixed discounts, usage limits |
| `/admin/shipping` | `AdminShippingPage` | Super Admin, Fulfillment | Carrier tiers, delivery timeframes, White-Glove DME rules |
| `/admin/tax` | `AdminTaxPage` | Super Admin, Compliance | State sales tax nexus, Delaware home rules, DME exemptions |
| `/admin/analytics` | `AdminAnalyticsPage` | Super Admin, Compliance | Revenue trend charts, order conversion, top DME equipment |
| `/admin/audit-logs` | `AdminAuditLogsPage` | Super Admin, Compliance | Read-only HIPAA audit trail, tamper-evident action ledger |
| `/admin/settings` | `AdminSettingsPage` | Super Admin | Corporate identity, Delaware DME distributor license, NPPES NPI |
| `/admin/settings/users`| `AdminStaffPage` | Super Admin | Staff roster, role escalation protection, staff invitations |
| `/admin/settings/roles`| `AdminRolesPage` | Super Admin, Compliance | Authoritative RBAC matrix displaying all permissions |

---

## 5. Security & Authentication Architecture

### 5.1 Server-Authoritative Identity Verification
- Authentication is enforced via `resolveAdminActor()` in `api/admin.ts`.
- Every incoming administrative request requires a validated session token (`bm_admin_...`).
- Customer tokens (`bm_usr_...`) are explicitly denied with `HTTP 403 Forbidden`.
- Missing credentials immediately yield `HTTP 401 Unauthorized`.

### 5.2 Least-Privilege Role-Based Access Control (RBAC)
The platform defines 6 distinct roles:
1. `super_admin`: Full system authorization, catalog pricing, staff role assignment.
2. `compliance_officer`: Read-only access to audit logs, orders, and regulatory records.
3. `clinical_specialist`: Prescription queue review, physician NPI validation, clinical sign-off.
4. `fulfillment_specialist`: Warehouse inventory counts, carrier tracking updates, order fulfillment.
5. `support_agent`: Customer lookup, non-clinical order details, address inspection.
6. `customer`: Public storefront user with zero access to `/admin` or `/api/admin/*`.

---

## 6. Authoritative Order State Machine

The order lifecycle is governed by an immutable state transition graph defined in `server/adminService.ts`:

```
   PENDING_PAYMENT ──────────────> PAID ──────────────────> PROCESSING ───> FULFILLMENT ───> SHIPPED ───> DELIVERED
         │                           │                                            ▲
         │                           ▼ (Rx Required)                              │
         │                    CLINICAL_REVIEW                                     │
         │                           │                                            │
         │             ┌─────────────┴─────────────┐                              │
         │             ▼                           ▼                              │
         │      CLINICAL_APPROVED          CLINICAL_REJECTED                      │
         │             │                           │                              │
         │             └───────────────────────────┴──────────────────────────────┘
         ▼
     CANCELLED (Terminal)
```

- Any attempt to execute an invalid transition (e.g. `CLINICAL_REVIEW -> SHIPPED` or `CANCELLED -> FULFILLMENT`) is rejected by the server with `HTTP 400 Invalid State Transition` and logged to the security audit trail.

---

## 7. HIPAA Audit Logging & Data Segregation

Under HIPAA § 164.312(b):
- **Append-Only Immutability**: The audit ledger cannot be edited, purged, or deleted via the UI or API.
- **Deep PHI Redaction**: Prescription review notes and diagnostic parameters are segregated and only accessible to users with `prescriptions:view` or `prescriptions:review` permissions.
- **Every Mutation Tracked**: Product price updates, inventory adjustments, order state shifts, and staff role assignments record the Actor ID, Role, Timestamp, Action, Resource, Status, and sanitized Metadata.
