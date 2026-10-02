# BaeMeds Native Admin API Specification

## 1. Overview & Protocol Standards

The BaeMeds Admin API provides authoritative server-side back-office operations for the BaeMeds commerce engine.

All endpoints reside under the base path:
```text
/api/admin/*
```

### Security & Headers
Every request must include:
- `Authorization: Bearer <session_token>`
- `X-Admin-Role: <role>` (validated against server session)
- `Content-Type: application/json`

### Error Status Codes
- `401 Unauthorized`: Missing or invalid session credentials.
- `403 Forbidden`: Authenticated identity does not possess the requisite role permission. Customer tokens receive immediate 403.
- `400 Bad Request`: Validation failure (e.g. negative stock adjustment, invalid state machine transition).
- `404 Not Found`: Resource ID not found in database.

---

## 2. API Endpoints

### 2.1 Dashboard & Metrics
#### `GET /api/admin/dashboard`
Returns live operational metrics tailored to the calling role.
- **Required Permission**: `dashboard:view`
- **Response `200 OK`**:
```json
{
  "actor": { "id": "usr_admin", "role": "super_admin", "name": "ADMIN" },
  "metrics": {
    "revenueToday": 5480.00,
    "ordersToday": 18,
    "pendingOrders": 6,
    "pendingPrescriptions": 2,
    "lowStockProducts": 4,
    "averageOrderValue": 304.44,
    "conversionRate": "3.6%",
    "recentOrders": [...],
    "recentActivity": [...]
  }
}
```

---

### 2.2 Orders & State Machine
#### `GET /api/admin/orders`
List orders with optional status or customer query filters.
- **Query Parameters**:
  - `status`: Filter by state (`all`, `PAID`, `CLINICAL_REVIEW`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`)
  - `search`: Filter by order number or customer email
- **Required Permission**: `orders:view`
- **Response `200 OK`**: `{ "orders": [ ... ] }`

#### `GET /api/admin/orders/:id`
Retrieve detailed order record, customer addresses, line items, and audit history.
- **Required Permission**: `orders:view`
- **Response `200 OK`**: `{ "order": { "id": "ord_...", "order_items": [ ... ] } }`

#### `PATCH /api/admin/orders/:id`
Transition order state or assign carrier tracking number.
- **Required Permission**: `orders:manage`
- **State Transition Body**:
```json
{
  "status": "PROCESSING",
  "reason": "Payment verified and inventory allocated"
}
```
- **Carrier Tracking Body**:
```json
{
  "action": "tracking",
  "carrier": "FedEx Ground",
  "trackingNumber": "748901238491"
}
```
- **Response `200 OK`**: `{ "order": { ...updatedOrder } }`
- **Error `400 Bad Request`**: `{ "error": "Invalid state transition: Cannot transition from CLINICAL_REVIEW to SHIPPED" }`

---

### 2.3 Catalog & Products
#### `GET /api/admin/products`
List catalog products with search filtering.
- **Query Parameters**: `q` (search title, SKU, HCPCS code)
- **Required Permission**: `products:view`
- **Response `200 OK`**: `{ "products": [ ... ] }`

#### `GET /api/admin/products/:id`
Fetch single product record with full specifications, HCPCS code, and FDA classification.
- **Required Permission**: `products:view`
- **Response `200 OK`**: `{ "product": { ... } }`

#### `POST /api/admin/products`
Create or update authoritative catalog product.
- **Required Permission**: `products:manage` (Super Admin)
- **Request Body**:
```json
{
  "id": "optional_existing_id",
  "title": "Philips EverFlo Oxygen Concentrator 5L",
  "price": 1450.00,
  "compareAtPrice": 1650.00,
  "category": "Oxygen Concentrators",
  "hcpcsCode": "E1390",
  "fdaClassification": "Class II",
  "prescriptionRequired": true,
  "fsaEligible": true,
  "isRegulatoryVerified": true,
  "warranty": "3-Year Manufacturer Warranty"
}
```
- **Response `200 OK`**: `{ "product": { ... } }`

#### `DELETE /api/admin/products/:id`
Permanently delete or archive catalog product.
- **Required Permission**: `products:delete` (Super Admin)
- **Response `200 OK`**: `{ "success": true, "id": "prod_..." }`

---

### 2.4 Inventory & Adjustments
#### `GET /api/admin/inventory`
Fetch warehouse stock levels, available vs reserved quantities, and status badges.
- **Required Permission**: `inventory:view`
- **Response `200 OK`**:
```json
{
  "inventory": [
    {
      "productId": "philips-everflo",
      "title": "Philips EverFlo 5L",
      "sku": "EVF-500",
      "available": 25,
      "reserved": 2,
      "total": 27,
      "status": "IN_STOCK"
    }
  ]
}
```

#### `POST /api/admin/inventory`
Perform audited stock adjustment with reason.
- **Required Permission**: `inventory:manage`
- **Request Body**:
```json
{
  "productId": "philips-everflo",
  "delta": 10,
  "reason": "Receiving",
  "notes": "PO-8819 received from distributor"
}
```
- **Response `200 OK`**: `{ "adjustment": { "productId": "...", "newQuantity": 35, ... } }`
- **Error `400 Bad Request`**: `{ "error": "Inventory cannot be reduced below zero." }`

---

### 2.5 Customers & CRM
#### `GET /api/admin/customers`
List patient profiles and clinic procurement accounts.
- **Required Permission**: `customers:view`
- **Response `200 OK`**: `{ "customers": [ ... ] }`

---

### 2.6 Clinical Prescriptions
#### `GET /api/admin/prescriptions`
List pending, approved, and rejected prescription scripts.
- **Required Permission**: `prescriptions:view`
- **Response `200 OK`**: `{ "prescriptions": [ ... ] }`

#### `POST /api/admin/prescriptions/:id`
Adjudicate prescription with clinical decision.
- **Required Permission**: `prescriptions:review` (Clinical Specialist & Super Admin)
- **Request Body**:
```json
{
  "decision": "APPROVED",
  "notes": "Physician NPI verified active. Prescription parameters valid."
}
```
- **Response `200 OK`**: `{ "prescription": { "id": "rx_...", "status": "APPROVED", ... } }`

---

### 2.7 Discounts & Promotions
#### `GET /api/admin/discounts`
List configured coupon codes and usage metrics.
- **Required Permission**: `discounts:view`
- **Response `200 OK`**: `{ "discounts": [ ... ] }`

#### `POST /api/admin/discounts`
Create or update promotion code enforced server-side during checkout.
- **Required Permission**: `discounts:manage`
- **Request Body**:
```json
{
  "code": "HEALTH15",
  "type": "PERCENTAGE",
  "value": 15,
  "minOrderAmount": 100,
  "usageLimit": 200,
  "expiresAt": "2026-12-31"
}
```
- **Response `200 OK`**: `{ "discount": { ... } }`

---

### 2.8 Operations (Shipping & Tax)
#### `GET /api/admin/shipping`
Returns configured shipping carrier tiers, rates, and White-Glove rules.
- **Required Permission**: `shipping:view`
- **Response `200 OK`**: `{ "shipping": { "carriers": [...], "tiers": [...] } }`

#### `GET /api/admin/tax`
Returns sales tax nexus jurisdictions and DME exemption policies.
- **Required Permission**: `tax:view`
- **Response `200 OK`**: `{ "tax": { "engine": "...", "nexusJurisdictions": [...] } }`

---

### 2.9 HIPAA Audit Logs
#### `GET /api/admin/audit-logs`
Retrieve read-only, tamper-evident audit ledger entries.
- **Required Permission**: `audit_logs:view`
- **Response `200 OK`**:
```json
{
  "logs": [
    {
      "id": "audit_1789422830",
      "timestamp": "2026-09-14T22:23:35.468Z",
      "actorId": "usr_admin",
      "actorRole": "super_admin",
      "action": "PRODUCT_MUTATION_SAVED",
      "resourceType": "product",
      "resourceId": "philips-everflo",
      "status": "SUCCESS",
      "metadata": { "price": 1450.00 }
    }
  ]
}
```

---

### 2.10 Staff & Role Administration
#### `GET /api/admin/staff`
List administrative personnel and assigned roles.
- **Required Permission**: `staff:view`
- **Response `200 OK`**: `{ "staff": [ ... ] }`

#### `PATCH /api/admin/staff/:id`
Assign or alter staff role.
- **Required Permission**: `staff:manage` (Super Admin only)
- **Request Body**: `{ "role": "clinical_specialist" }`
- **Response `200 OK`**: `{ "staff": { ... } }`
- **Error `403 Forbidden`**: `{ "error": "Forbidden: Only Super Administrators may assign or modify staff roles." }`
