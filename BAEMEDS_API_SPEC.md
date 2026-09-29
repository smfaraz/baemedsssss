# BaeMeds — Native Commerce REST/JSON API Specification

**Protocol:** HTTPS / TLS 1.3  
**Content-Type:** `application/json; charset=utf-8`  
**Security:** Same-Origin enforcement (`assertSameOrigin`), HttpOnly session cookies (`__Host-baemeds_session`)  

---

## 1. Authentication Endpoints (`/api/auth`)

### `GET /api/auth`
Retrieves the current customer session profile.
- **Request Headers:** `Cookie: __Host-baemeds_session=...`
- **Response 200 OK:**
  ```json
  {
    "customer": {
      "id": "usr_98234",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+12145550199",
      "defaultAddress": { ... },
      "addresses": [ ... ],
      "orders": [ ... ]
    }
  }
  ```
- **Response (Unauthenticated):** `{ "customer": null }`

### `POST /api/auth`
Executes authentication mutations:
- `action: 'login'`: `{ "action": "login", "email": "...", "password": "..." }` -> Sets session cookie.
- `action: 'register'`: `{ "action": "register", "email": "...", "password": "...", "firstName": "...", "lastName": "..." }` -> Creates customer and sets session cookie.
- `action: 'recover'`: `{ "action": "recover", "email": "..." }` -> Triggers recovery email.
- `action: 'logout'`: Clears `__Host-baemeds_session` cookie.

---

## 2. Customer Account Endpoints (`/api/account`)

### `POST /api/account`
Adds a new validated US delivery address for the authenticated customer.
- **Request Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "1200 Market St",
    "address2": "Suite 400",
    "city": "Wilmington",
    "province": "DE",
    "zip": "19801",
    "phone": "2145550199"
  }
  ```
- **Validation:** 50 US States + DC, 5-digit ZIP, E.164 phone formatting, input sanitization.
- **Response 200 OK:** `{ "ok": true }`

### `DELETE /api/account`
Deletes a saved address: `{ "id": "addr_uuid" }`.

---

## 3. Cart Endpoints (`/api/cart`)

### `POST /api/cart`
Associates an anonymous cart token with an authenticated customer session upon sign-in.
- **Request Body:** `{ "cartId": "cart_uuid_or_token" }`
- **Response 200 OK:** `{ "cart": { "id": "...", "checkoutUrl": "/checkout", "lines": [ ... ] } }`

---

## 4. Checkout & Order Endpoints (`/api/checkout`)

### `POST /api/checkout`
Executes server-side authoritative checkout validation, tax calculation, shipping calculation, inventory validation, and creates an order.
- **Request Body:**
  ```json
  {
    "cartId": "cart_token",
    "customerEmail": "patient@example.com",
    "customerPhone": "+12145550199",
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "address1": "1200 Market St",
      "city": "Wilmington",
      "province": "DE",
      "zip": "19801"
    },
    "carrier": "USPS",
    "serviceName": "Priority Mail",
    "prescriptionAttested": true,
    "paymentToken": "tok_visa_4242"
  }
  ```
- **Server Authority Actions:**
  1. Recalculates exact line item subtotal from authoritative product prices.
  2. Validates prescription requirement and attestation.
  3. Computes destination sales tax via `taxService.ts`.
  4. Computes shipping fee via `shippingService.ts`.
  5. Computes authoritative total.
  6. Creates order in `public.orders` with status `PAID` or `CLINICAL_REVIEW`.
  7. Clears cart items.
- **Response 200 OK:**
  ```json
  {
    "ok": true,
    "order": {
      "id": "ord_uuid",
      "orderNumber": "BM-10024",
      "totalAmount": 480.00,
      "status": "PAID"
    }
  }
  ```
