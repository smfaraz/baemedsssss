# BaeMeds Native Admin Role-Based Access Control (RBAC) Specification

## 1. Governance Principles & Healthcare Compliance

Under HIPAA Security Rule § 164.312(a)(1) (Access Control) and § 164.312(d) (Person or Entity Authentication), the BaeMeds commerce system enforces strict least-privilege administrative access control.

### Core Principles
1. **Server-Side Authoritative Enforcement**: Permissions are evaluated directly in `server/adminService.ts` and `api/admin.ts`. The frontend UI reflects permission states for ergonomics, but never functions as the security perimeter.
2. **Strict PHI Segregation**: Clinical records, physician prescriptions, and patient diagnostic parameters are segregated and completely inaccessible to fulfillment personnel or support agents.
3. **Immutable Auditing**: Every authorization check, whether permitted (`SUCCESS`) or rejected (`DENIED`), is logged with actor identification, timestamp, and target resource ID.
4. **Anti-Escalation Safeguards**: Non-super-admin accounts cannot elevate themselves or other staff members.

---

## 2. Complete Role Permission Matrix

| Permission Key | Description | `super_admin` | `compliance_officer` | `clinical_specialist` | `fulfillment_specialist` | `support_agent` | `customer` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `dashboard:view` | Access executive dashboard & metrics | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `orders:view` | View orders, line items, and addresses | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `orders:manage` | Perform order status state machine updates | **YES** | NO | NO | **YES** | NO | NO |
| `orders:refund` | Issue payment reversals and refunds | **YES** | NO | NO | NO | NO | NO |
| `products:view` | Browse and view catalog medical equipment | **YES** | **YES** | **YES** | **YES** | **YES** | NO |
| `products:manage` | Create/edit products, pricing, and variants | **YES** | NO | NO | NO | NO | NO |
| `products:delete` | Delete or archive catalog items | **YES** | NO | NO | NO | NO | NO |
| `inventory:view` | Inspect stock counts & reserved items | **YES** | NO | NO | **YES** | NO | NO |
| `inventory:manage`| Perform audited stock adjustments | **YES** | NO | NO | **YES** | NO | NO |
| `customers:view` | Access customer profiles & spend metrics | **YES** | NO | NO | NO | **YES** | NO |
| `customers:manage`| Update customer details and addresses | **YES** | NO | NO | NO | NO | NO |
| `prescriptions:view` | Inspect prescription queue & scripts | **YES** | **YES** | **YES** | NO | NO | NO |
| `prescriptions:review` | Clinically approve/reject Rx orders | **YES** | NO | **YES** | NO | NO | NO |
| `discounts:view` | View promotional coupon codes | **YES** | NO | NO | NO | NO | NO |
| `discounts:manage`| Create and modify discount codes | **YES** | NO | NO | NO | NO | NO |
| `shipping:view` | View shipping carriers and tiers | **YES** | NO | NO | **YES** | NO | NO |
| `shipping:manage` | Configure carrier delivery rates & rules | **YES** | NO | NO | NO | NO | NO |
| `tax:view` | View state sales tax nexus configuration | **YES** | **YES** | NO | NO | NO | NO |
| `tax:manage` | Configure tax nexus rules and exemptions | **YES** | NO | NO | NO | NO | NO |
| `analytics:view` | Access revenue and sales reports | **YES** | **YES** | NO | NO | NO | NO |
| `audit_logs:view` | Inspect HIPAA audit trail | **YES** | **YES** | NO | NO | NO | NO |
| `staff:view` | View staff roster and assigned roles | **YES** | NO | NO | NO | NO | NO |
| `staff:manage` | Assign roles, invite staff, revoke access | **YES** | NO | NO | NO | NO | NO |
| `roles:view` | Inspect RBAC permission matrix | **YES** | **YES** | NO | NO | NO | NO |
| `settings:view` | View store and regulatory settings | **YES** | **YES** | NO | NO | NO | NO |
| `settings:manage`| Update corporate store configuration | **YES** | NO | NO | NO | NO | NO |

---

## 3. Role Profiles & Operational Boundaries

### 3.1 Super Admin (`super_admin`)
- **Scope**: Complete administrative oversight over all commerce systems, pricing, catalog items, staff assignments, and platform settings.
- **Auditing Requirement**: Even Super Admin operations are subject to mandatory immutable logging. Super Admins cannot delete audit records.

### 3.2 Compliance Officer (`compliance_officer`)
- **Scope**: Dedicated regulatory auditor. Access to audit logs, orders, and read-only prescription records to ensure HIPAA and Delaware DPH compliance.
- **Boundaries**: Strictly prohibited from mutating prices, stock counts, shipping rates, or issuing refunds.

### 3.3 Clinical Specialist (`clinical_specialist`)
- **Scope**: Licensed healthcare professional responsible for adjudicating prescription equipment (oxygen concentrators, CPAP machines).
- **Boundaries**: Granted access to patient prescriptions and linked order clinical states. Strictly prohibited from accessing payment credentials, staff administration, or inventory ledgers.

### 3.4 Fulfillment Specialist (`fulfillment_specialist`)
- **Scope**: Warehouse and logistics coordinator. Access to order fulfillment queues, inventory stock levels, audited stock adjustments, and shipping carrier assignments.
- **Boundaries**: Prohibited from viewing patient clinical documents or modifying authoritative product pricing.

### 3.5 Support Agent (`support_agent`)
- **Scope**: Customer care team member. Access to customer contact information, order tracking status, and delivery addresses.
- **Boundaries**: Prohibited from viewing sensitive clinical prescription files or modifying catalog prices.

### 3.6 Customer (`customer`)
- **Scope**: Public storefront purchaser.
- **Boundaries**: Explicitly barred from accessing `/admin` or any `/api/admin/*` endpoint. Customer tokens attempting administrative access receive an immediate `HTTP 403 Forbidden` rejection.
