# BaeMeds Native Admin Platform — Master Test Plan

## 1. Quality Assurance Strategy & Scope

The BaeMeds Admin Platform QA framework validates both functional operational readiness and stringent healthcare security safeguards.

The test plan spans four testing tiers:
1. **Unit Tests**: State machines, RBAC permission verification, cost calculations, negative stock guards.
2. **Integration Tests**: Gateway request dispatching, authentication token verification, audit log emission.
3. **Adversarial Security Tests**: RBAC privilege escalation, customer token injection, IDOR across orders and prescriptions, mass assignment attacks.
4. **End-to-End Browser & Smoke Tests**: Complete UI walkthroughs across desktop, tablet, and mobile breakpoints.

---

## 2. Test Execution Commands

```bash
# 1. Run Complete Automated Master Test Suite (All 3 Suites)
npm test

# 2. Run Admin RBAC & Security Test Suite Specifically
npx tsx tests/admin-rbac.test.ts

# 3. Run Native Commerce First-Party Test Suite
npx tsx tests/native-commerce.test.ts

# 4. Run US-Market Architectural & Compliance Suite
npx tsx tests/us-market.test.ts

# 5. Execute Strict TypeScript Compilation Verification
npx tsc --noEmit

# 6. Execute Production Bundle Build Verification
npm run build
```

---

## 3. Test Suites & Verification Matrix

### 3.1 Security & RBAC Enforcement Suite (`tests/admin-rbac.test.ts`)
| Test ID | Test Scenario | Input / Attack Vector | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | Anonymous Admin Access | `GET /api/admin/dashboard` without token | `401 Unauthorized` | **PASS** |
| **SEC-02** | Customer Admin Bypass | Customer `bm_usr_...` token calling admin API | `403 Forbidden` | **PASS** |
| **SEC-03** | Support Catalog Tampering | Support Agent `POST /api/admin/products` | `403 Forbidden` | **PASS** |
| **SEC-04** | Fulfillment Clinical Bypass| Fulfillment user `POST /prescriptions/rx_8849` | `403 Forbidden` | **PASS** |
| **SEC-05** | Clinical Staff Escalation | Clinical user `PATCH /staff/usr_staff_1` | `403 Forbidden` | **PASS** |
| **SEC-06** | Compliance Inventory Tamper| Compliance user `POST /api/admin/inventory` | `403 Forbidden` | **PASS** |
| **SEC-07** | Mass Assignment Elevation | Non-admin submitting `{ role: 'super_admin' }` | Rejected & Audited | **PASS** |
| **SEC-08** | Order State Machine Guard | Illegal transition: `CLINICAL_REVIEW -> SHIPPED` | `400 Bad Request` | **PASS** |
| **SEC-09** | Negative Inventory Guard | Deduct stock below 0: `delta = -100` | Rejected with Error | **PASS** |
| **SEC-10** | Mandatory Adjustment Reason| Adjust inventory without reason | Rejected with Error | **PASS** |
| **SEC-11** | HIPAA Audit Immutability | Inspect audit logs for tamper/delete methods | Verified Append-Only | **PASS** |

### 3.2 Native Commerce Suite (`tests/native-commerce.test.ts`)
| Test ID | Test Scenario | Input / Attack Vector | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **COM-01** | Native 119 Product Catalog | Query `fetchAllProducts()` | 119 Live Products | **PASS** |
| **COM-02** | Product Handle Resolution | Query `fetchProductByHandle()` | Correct Metadata | **PASS** |
| **COM-03** | Zero-Shopify Runtime | Grep source files for Shopify runtime code | 0 Violations Found | **PASS** |
| **COM-04** | Server Checkout Calculation| Authoritative subtotal, tax, and shipping | Authoritative Totals | **PASS** |

### 3.3 US Market & Compliance Suite (`tests/us-market.test.ts`)
| Test ID | Test Scenario | Input / Attack Vector | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **US-01** | Delaware Sales Tax (0%) | Order delivered in Delaware | $0.00 State Tax | **PASS** |
| **US-02** | DME Prescription Exemption| Verified script in PA/NJ/MD | Tax Exempted | **PASS** |
| **US-03** | Insured Carrier Calculation| Weight-based tiers with FedEx/UPS | Exact Tier Rates | **PASS** |
| **US-04** | HIPAA PHI Redaction | Audit event creation | Deep PHI Sanitized | **PASS** |

---

## 4. End-to-End UI & Visual Validation Plan

### 4.1 Admin Shell Navigation
- [x] Verify persistent desktop sidebar with role-filtered navigation items.
- [x] Verify mobile slide-out navigation drawer with touch dismiss.
- [x] Verify top navigation header with active role switcher dropdown.
- [x] Verify breadcrumbs component showing route hierarchy (`Dashboard > Orders > Order Details`).
- [x] Verify global search shortcut (`Cmd/Ctrl + K`).

### 4.2 Order Management Flow
- [x] Navigate to `/admin/orders`.
- [x] Filter by status tabs (`All`, `Clinical Review`, `Paid`, `Shipped`).
- [x] Click an order to open `/admin/orders/:id`.
- [x] Verify line items, customer details, and valid next state machine action buttons.
- [x] Open tracking modal, enter carrier and tracking number, and commit shipment.

### 4.3 Product Management & Authoritative Pricing
- [x] Navigate to `/admin/products`.
- [x] Verify catalog table displays 119 products with images, categories, and HCPCS codes.
- [x] Click "Add Product" to open `/admin/products/new`.
- [x] Submit product with title, pricing, HCPCS code (`E1390`), and FDA classification.
- [x] Verify creation is reflected and logged to the audit trail.

### 4.4 Inventory Stock Adjustments
- [x] Navigate to `/admin/inventory`.
- [x] Filter by `Low Stock (< 5)` and `Out of Stock`.
- [x] Click "Adjust Stock" on an item.
- [x] Attempt to reduce stock below zero and verify client and server rejection.
- [x] Execute valid adjustment with reason (`Receiving`), notes, and verify immediate table update.

### 4.5 Clinical Prescription Queue
- [x] Navigate to `/admin/prescriptions`.
- [x] Inspect pending queue and click a prescription to open `/admin/prescriptions/:id`.
- [x] Verify watermarked Rx document preview, physician NPI status, and clinical notes input.
- [x] Submit "Approve Prescription" and verify status transition.
