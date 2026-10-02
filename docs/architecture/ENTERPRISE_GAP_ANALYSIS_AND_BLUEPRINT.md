# BaeMeds USA — Enterprise DME Operating Platform
## Comprehensive Architectural Reality Audit, Gap Analysis & Target Architecture Blueprint

**Document Version:** 2.0.0  
**Classification:** Enterprise Internal / Security & Engineering Architecture  
**Role Authority:** Principal Software Architect, Security Architect, Healthcare Technology Architect  

---

### Executive Mandate

This document serves as the foundational architectural baseline for **BaeMeds USA**, transitioning the platform from an early-stage prototype into an enterprise-grade, server-authoritative Durable Medical Equipment (DME) commerce, fulfillment, and clinical operations platform.

In strict adherence to engineering integrity:
- **No false compliance declarations:** Technical controls are explicitly documented; organizational policies, Business Associate Agreements (BAAs), clinical licensure, and third-party certifications are identified as external dependencies.
- **Zero frontend trust:** The browser client is treated as an untrusted, potentially compromised actor. All authorization, pricing, inventory allocation, and clinical state transitions are enforced server-side.
- **Concrete reality audit:** An uncompromising distinction is drawn between what is **Implemented**, what is **Partially Implemented**, what is **Mocked/Stubbed**, and what is **Architecturally Deficient**.

---

## 1. Reality Audit: Implementation Status

| Domain | Status | What Is Actually Implemented | What Is Mocked / Incomplete | Security & Architectural Vulnerabilities |
| :--- | :---: | :--- | :--- | :--- |
| **Catalog Data** | **IMPLEMENTED** | 3,099 real DME products extracted from supplier catalog; 100 Flagship Hero items; real McKesson wholesale costs, real product images from `imgcdn.mckesson.com`, specs, and HCPCS codes. | Category hierarchies are partially denormalized. Compatibility mapping is unindexed. | No draft/published lifecycle; updates directly modify active products without audit approval flow. |
| **Identity & Authentication** | **MOCKED** | Interactive login modal and persona selection UI in `AdminLayout.tsx`. | No Supabase Auth JWT validation; no real password hashing; no MFA; no session revocation; no email verification. | **VULN-01:** Fake tokens (`bm_admin_<base64>_token`) can be forged in browser console. Plaintext passwords in `server/commerce.ts`. |
| **Authorization (RBAC / ABAC)** | **PARTIAL** | Permission mapping dictionary (`ROLE_PERMISSIONS`) with 6 roles and 26 permission keys in `server/adminService.ts`. | Gating is enforced on in-memory functions; frontend layout hides routes ergonomically. | **VULN-02:** Server endpoint `api/admin.ts` reads client-supplied `X-Admin-Role` header. Any attacker sending `X-Admin-Role: super_admin` gains unauthorized privileges. |
| **Order Management (OMS)** | **PARTIAL** | State machine transition validator (`VALID_ORDER_TRANSITIONS`) in `server/adminService.ts`. Order status tabs and detail view in UI. | Dual persistence: orders write to `memoryOrders` array and optionally to Supabase `orders` table. No transactional boundaries. | **VULN-03:** Checkout does not verify external payment authorization; orders can be created with zero-dollar payloads or unchecked totals. |
| **Fulfillment & McKesson** | **STUBBED** | UI modal for entering McKesson PO Number, carrier, and tracking number; pre-formatted clipboard address copy. | **Zero supplier integration.** No EDI 850/855/856/810 or API communication; no purchase order acknowledgement; no automated tracking webhooks. | Calling manual PO entry a "McKesson Integration" is false. If an agent types an invalid PO, the system falsely marks the order as processed. |
| **Inventory Engine** | **DEFICIENT** | Single integer `inventory_quantity` on `products` table. UI modal for stock adjustments. | No inventory ledger. No concept of `on_hand`, `reserved`, `available`, `allocated`, `incoming`, or `quarantined`. No warehouse partitioning. | Concurrent checkouts can oversell stock; negative inventory checks are vulnerable to race conditions without database row locks (`SELECT FOR UPDATE`). |
| **Clinical Prescription Queue** | **PARTIAL** | UI queue at `/admin/prescriptions`; review modal with approval/rejection notes; order status progression trigger. | Prescription files use public placeholder images (`placehold.co`). No private S3/Supabase Storage bucket; no signed URL generation; no malware scanning. | **VULN-04:** PHI exposure risk. No magic-byte file signature validation; client MIME type is trusted blindly. |
| **HIPAA Security Audit Logs** | **PARTIAL** | PostgreSQL table `audit_logs` with PostgreSQL trigger preventing `UPDATE` and `DELETE`. UI audit log viewer with CSV export. | In-memory log buffer (`memoryAuditLogs`) used if Supabase write fails. No request correlation ID; no cryptographic hashing chain. | Audit logs contain unsanitized client inputs; no SIEM integration or automated anomaly detection. |
| **Payments & PCI** | **MOCKED** | Form fields in checkout UI accepting credit card numbers. | No real Stripe or PCI-compliant tokenization provider. Raw card fields exist in client forms without hosted fields/iframes. | **VULN-05:** Storing or receiving raw credit card fields in custom forms brings the entire web application into PCI-DSS Level 1 scope. |
| **Shipping & Tax** | **STUBBED** | In-memory configuration objects (`memoryShippingSettings`, `memoryTaxSettings`). | No carrier API (FedEx/UPS/USPS) rating or label generation; no tax engine integration (Avalara/TaxJar). | Fixed static tax rates and manual shipping prices fail US interstate commerce nexus requirements. |

---

## 2. Security Vulnerability & Threat Analysis (STRIDE)

### High-Priority Vulnerabilities Requiring Immediate Remediation

#### 1. Privilege Escalation via Client-Controlled Headers & Forged Tokens
- **Location:** [api/admin.ts](file:///c:/Users/FARAAZ/Downloads/beameds-main/baemeds%20usa/beameds-main/api/admin.ts#L49-L60)
- **Vulnerability:** `resolveAdminActor()` parses `X-Admin-Role` directly from request headers.
- **Exploitation:**
  ```bash
  curl -X POST https://baemeds.com/api/admin/products \
    -H "Authorization: Bearer bm_admin_attacker_token" \
    -H "X-Admin-Role: super_admin" \
    -d '{"title":"Exploited Item","price":0.01}'
  ```
- **Remediation:** Remove all header-based role overrides. Validate authenticated identity exclusively via Supabase Auth JWT cryptographically verified with JWT secret. Query authoritative user roles from PostgreSQL `user_roles` table server-side.

#### 2. Service Role Secret Exposure Hazard
- **Location:** [server/adminSupabase.ts](file:///c:/Users/FARAAZ/Downloads/beameds-main/baemeds%20usa/beameds-main/server/adminSupabase.ts) and [lib/adminApi.ts](file:///c:/Users/FARAAZ/Downloads/beameds-main/baemeds%20usa/beameds-main/lib/adminApi.ts)
- **Vulnerability:** `adminApi.ts` imported `AdminService`, which imported `adminSupabase.ts`. In a client-side bundle, Vite could bundle the service role key into client JavaScript if not strictly partitioned.
- **Remediation:** Strict boundary separation: `server/*` files must **never** be imported by `lib/*` or `pages/*`. The browser client interacts strictly through HTTP endpoints (`/api/v1/*`).

#### 3. Insecure Direct Object Reference (IDOR) & Unrestricted Customer Data
- **Location:** `server/adminService.ts` and `server/commerce.ts`
- **Vulnerability:** Lack of user/organization scoping. Any authenticated support agent can read all customer records, including sensitive delivery addresses and order histories, without access scope verification.
- **Remediation:** Implement ABAC scoping with `organization_id`, `patient_access_scope`, and field-level masking for non-clinical roles.

#### 4. Unvalidated File Uploads & Public Prescription Exposure
- **Location:** `server/adminService.ts` (`memoryPrescriptions`)
- **Vulnerability:** Prescription files stored as URLs without access control. Uploads trust client `Content-Type`.
- **Remediation:** Private Supabase Storage bucket with zero public access. Upload via presigned POST with size and magic-byte MIME validation. Downloads require short-lived (60-second) signed URLs generated only after clinical role authorization.

---

## 3. Target Enterprise Architecture

```
                                    UNTRUSTED BOUNDARY
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                   Client Applications                                 │
 │  ┌─────────────────────────────────┐           ┌───────────────────────────────────┐  │
 │  │        BaeMeds Web Store        │           │     Operations Control Plane      │  │
 │  │      (Next.js / React SPA)      │           │         (Staff Admin UI)          │  │
 │  └────────────────┬────────────────┘           └─────────────────┬─────────────────┘  │
 └───────────────────┼─────────────────────────────────────────────┼─────────────────────┘
                     │ HTTPS / TLS 1.3                             │ HTTPS / TLS 1.3
                     │ Origin + CSRF Checked                       │ Supabase Auth Bearer JWT
                     ▼                                             ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                                API Gateway & Security Edge                            │
 │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
 │  │ • Rate Limiting (Token Bucket / IP + User)   • Request Correlation ID Injection │  │
 │  │ • Strict CORS & Security Headers (CSP, HSTS) • Payload Size & Zod DTO Validation│  │
 │  │ • JWT Verification & Claims Extraction       • Request Sanitization             │  │
 │  └────────────────────────────────────────┬────────────────────────────────────────┘  │
 └───────────────────────────────────────────┼───────────────────────────────────────────┘
                                             │
                                             ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                               Domain Services Layer (Server)                          │
 │                                                                                       │
 │   ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────┐   │
 │   │   Identity & RBAC    │  │     Order Domain     │  │      Catalog Domain      │   │
 │   │  • Auth Verification │  │  • State Machine     │  │  • DME Product Specs     │   │
 │   │  • Permission Checks │  │  • Price Validation  │  │  • HCPCS Classification  │   │
 │   │  • ABAC Tenancy Scope│  │  • Order History Log │  │  • Lifecycle (Draft/Pub) │   │
 │   └──────────┬───────────┘  └──────────┬───────────┘  └────────────┬─────────────┘   │
 │              │                         │                           │                 │
 │   ┌──────────┴───────────┐  ┌──────────┴───────────┐  ┌────────────┴─────────────┐   │
 │   │  Clinical / Rx Domain│  │  Inventory Engine    │  │    Fulfillment Domain    │   │
 │   │  • Prescription Queue│  │  • Movement Ledger   │  │  • Multi-Warehouse Router│   │
 │   │  • License/NPI Check │  │  • Atomic Allocation │  │  • Drop-Ship Orchestrator│   │
 │   │  • PHI Redaction     │  │  • Concurrency Locks │  │  • Shipment Lifecycle    │   │
 │   └──────────┬───────────┘  └──────────┬───────────┘  └────────────┬─────────────┘   │
 │              │                         │                           │                 │
 │              └─────────────────────────┼───────────────────────────┘                 │
 │                                        ▼                                             │
 │   ┌──────────────────────────────────────────────────────────────────────────────┐   │
 │   │                          Integration Adapters Layer                          │   │
 │   │  ┌────────────────────┐ ┌────────────────────┐ ┌──────────────────────────┐  │   │
 │   │  │  SupplierAdapter   │ │   PaymentAdapter   │ │      CarrierAdapter      │  │   │
 │   │  │  (McKesson Direct) │ │  (PCI Hosted / Web)│ │   (FedEx / UPS / Courier)│  │   │
 │   │  └────────────────────┘ └────────────────────┘ └──────────────────────────┘  │   │
 │   └────────────────────────────────────┬─────────────────────────────────────────┘   │
 └────────────────────────────────────────┼─────────────────────────────────────────────┘
                                          │
                                          ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────┐
 │                               Transactional Persistence                               │
 │                                                                                       │
 │   ┌───────────────────────────────────────────────────────────────────────────────┐   │
 │   │                        PostgreSQL 16 Enterprise Schema                        │   │
 │   │  • 35+ Relational Tables with Foreign Key Constraints & Check Validations     │   │
 │   │  • Multi-Tier Inventory Ledger (on_hand, reserved, available, quarantined)    │   │
 │   │  • Append-Only Immutable Audit Ledger with Anti-Tamper Row Triggers           │   │
 │   │  • Row-Level Security (RLS) enforcing Tenant & Role Isolation                 │   │
 │   └───────────────────────────────────────────────────────────────────────────────┘   │
 │                                                                                       │
 │   ┌───────────────────────────────────────┐   ┌───────────────────────────────────┐   │
 │   │     Private Encrypted Storage         │   │      Asynchronous Event Bus       │   │
 │   │   • AES-256 Encrypted Rx Buckets      │   │   • Transactional Outbox Pattern  │   │
 │   │   • Signed Ephemeral URLs (60s TTL)   │   │   • Webhook Processing Worker     │   │
 │   └───────────────────────────────────────┘   └───────────────────────────────────┘   │
 └───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Multi-Domain Relational Database Schema Plan

To replace the single `MASTER_COMPLETE_SETUP.sql` flat structure, the database will be structured into distinct domain migrations:

### Migration 01: Core Platform, Tenancy & Identity
```sql
-- Organizations (Multi-Tenancy Foundation)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Profiles linked to auth.users
CREATE TABLE staff_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  npi_number TEXT, -- For Clinical Reviewers
  state_license_number TEXT,
  license_expiration DATE,
  department TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Granular Permissions
CREATE TABLE permissions (
  key TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  description TEXT NOT NULL
);

-- RBAC Roles
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_system_role BOOLEAN DEFAULT TRUE
);

CREATE TABLE role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

### Migration 02: DME Catalog & Regulatory Specifications
```sql
CREATE TYPE catalog_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  category TEXT NOT NULL,
  description TEXT,
  status catalog_status DEFAULT 'PUBLISHED',
  is_hero_product BOOLEAN DEFAULT FALSE,
  hcpcs_code TEXT,
  fda_classification TEXT, -- Class I, Class II, 510(k)
  prescription_required BOOLEAN DEFAULT FALSE,
  is_rental_eligible BOOLEAN DEFAULT FALSE,
  is_fsa_eligible BOOLEAN DEFAULT TRUE,
  featured_image TEXT,
  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}'::jsonb,
  warranty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  title TEXT NOT NULL DEFAULT 'Standard',
  retail_price NUMERIC(10,2) NOT NULL CHECK (retail_price >= 0),
  compare_at_price NUMERIC(10,2),
  wholesale_cost NUMERIC(10,2) NOT NULL CHECK (wholesale_cost >= 0),
  map_price NUMERIC(10,2), -- Minimum Advertised Price
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 03: Multi-Warehouse Inventory Ledger & Concurrency
```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  code TEXT UNIQUE NOT NULL, -- e.g. 'DE-WILM-01', 'SUPPLIER-MCKESSON'
  name TEXT NOT NULL,
  is_supplier_direct BOOLEAN DEFAULT FALSE,
  address JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE warehouse_inventory (
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  on_hand INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  quarantined INTEGER NOT NULL DEFAULT 0 CHECK (quarantined >= 0),
  PRIMARY KEY (warehouse_id, variant_id)
);

CREATE TYPE inventory_movement_type AS ENUM (
  'RECEIPT', 'SALE_RESERVATION', 'RESERVATION_RELEASE', 'FULFILLMENT',
  'RETURN_RESTOCK', 'DAMAGE_QUARANTINE', 'CYCLE_COUNT_CORRECTION', 'TRANSFER'
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  movement_type inventory_movement_type NOT NULL,
  delta INTEGER NOT NULL,
  resulting_on_hand INTEGER NOT NULL,
  resulting_reserved INTEGER NOT NULL,
  order_id TEXT,
  actor_id UUID REFERENCES auth.users(id),
  reference_number TEXT, -- PO number, RMA number
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 04: Order State Machine & Transactional History
```sql
CREATE TYPE order_status AS ENUM (
  'PENDING_PAYMENT', 'PAYMENT_FAILED', 'PAID',
  'PRESCRIPTION_REQUIRED', 'CLINICAL_REVIEW', 'CLINICAL_REJECTED', 'CLINICAL_APPROVED',
  'FULFILLMENT_PENDING', 'PURCHASE_ORDER_CREATED', 'SUPPLIER_CONFIRMED',
  'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED',
  'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED'
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,
  status order_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal_amount NUMERIC(10,2) NOT NULL CHECK (subtotal_amount >= 0),
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  shipping_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  requires_prescription BOOLEAN DEFAULT FALSE,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  shipping_method TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 05: HIPAA Prescriptions & Document Storage Security
```sql
CREATE TYPE prescription_status AS ENUM (
  'PENDING_UPLOAD', 'PENDING_SCAN', 'PENDING_REVIEW',
  'APPROVED', 'REJECTED', 'NEEDS_INFORMATION', 'EXPIRED'
);

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES auth.users(id),
  prescribed_device_title TEXT NOT NULL,
  physician_name TEXT,
  physician_npi TEXT,
  physician_clinic TEXT,
  status prescription_status DEFAULT 'PENDING_REVIEW',
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  clinical_decision_notes TEXT,
  rejection_reason_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prescription_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  storage_bucket TEXT NOT NULL DEFAULT 'clinical-prescriptions-private',
  storage_path TEXT NOT NULL,
  file_hash_sha256 TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  is_virus_scanned BOOLEAN DEFAULT FALSE,
  scan_result TEXT DEFAULT 'CLEAN',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 06: Immutable HIPAA Audit Trail (§ 164.312(b))
```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  result TEXT NOT NULL CHECK (result IN ('SUCCESS', 'DENIED', 'ERROR')),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Anti-Tamper Immutability Trigger
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'CRITICAL SECURITY VIOLATION: Audit event logs are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_prevent_audit_tampering
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
```

---

## 5. Phased Implementation Roadmap

```
  Phase 1: Foundation & Security Infrastructure
  ├── Database Domain Migrations (01 - 06)
  ├── Supabase Auth JWT Token Verification
  ├── Server-Side RBAC & ABAC Middleware (Removal of X-Admin-Role)
  └── Zod DTO Validation Layer

  Phase 2: Commerce & Atomic Transaction Engine
  ├── PostgreSQL Transactional Order Placement RPC
  ├── Authoritative Server Pricing Engine
  └── Idempotency Guard on Checkout

  Phase 3: Clinical & Document Security
  ├── Private Storage Bucket Policy & Signed URL Generation
  ├── Clinical Reviewer Licensure/NPI Tracking
  └── Prescription State Machine with Order Cascade

  Phase 4: Inventory & Supplier Integration
  ├── Multi-Tier Inventory Ledger (on_hand, reserved, available)
  ├── Concurrency Lock Reservations
  └── SupplierAdapter Abstraction (McKesson Direct)

  Phase 5: Enterprise Governance & Observability
  ├── Immutable Audit Event Ingestion
  ├── Structured JSON Observability & Health Probes
  └── Operational Command Center

  Phase 6: Verification & Penetration Testing
  ├── STRIDE Automated Security Test Suite
  ├── IDOR & Concurrency Regression Tests
  └── Final Production Readiness Certification
```

---

## 6. Acceptance Criteria for Production Readiness

The platform cannot be deemed production-ready until:
1. **Automated Security Verification:** An unauthenticated or forged JWT receives `HTTP 401`. An authenticated request with invalid roles receives `HTTP 403`.
2. **Zero Header Trust:** Stripping or forging `X-Admin-Role` has zero effect on authorization.
3. **Transactional Isolation:** Two concurrent checkout requests for a product with remaining quantity = 1 results in exactly 1 successful order and 1 out-of-stock response without overselling.
4. **PHI Isolation:** Non-clinical staff queries to orders return masked clinical fields (`clinical_notes: [REDACTED]`, prescription storage URLs omitted).
5. **Audit Immutability:** Any `UPDATE` or `DELETE` executed against `audit_events` raises a database exception.
6. **No Fake Data:** The catalog runs strictly on the 3,099 DME records with real pricing, real HCPCS codes, and real supplier wholesale costs.
