# BaeMeds USA — Phase 3: Transactional Email & Domain Authentication Audit Report

**Application**: BaeMeds.com (Durable Medical Equipment & Respiratory Devices)  
**Evaluator**: Principal DevSecOps Engineer & Communications Architect  
**Date**: October 2026  
**Operational Status**: **ACTION REQUIRED / UNVERIFIED (PENDING LIVE PROVIDER API CREDENTIALS & DNS RECORDS)**  

---

## 1. Executive Summary

Transactional email communications (order receipts, shipping tracking, prescription status updates, and password resets) represent an essential operational and customer satisfaction component of an e-commerce platform.

In adherence to strict engineering integrity guidelines:
> **Status**: Email delivery to external mailboxes is **UNVERIFIED IN PRODUCTION** because neither `RESEND_API_KEY` nor `SENDGRID_API_KEY` is currently provisioned in the live Vercel environment, and sender-domain DNS records (SPF, DKIM, DMARC) have not yet been delegated to an email provider.
> **Code Readiness**: The transactional email infrastructure in `server/emailService.ts` and `api/checkout.ts` is fully implemented, headless, decoupled from client React DOM imports, and incorporates dual-provider REST dispatch (Resend API v1 with SendGrid v3 fallback) and console mock logging.

---

## 2. Technical Implementation Architecture

### 2.1. Supported Providers & Environment Variables
The application implementation in `server/emailService.ts` inspects the environment in the following hierarchy:

| Environment Variable Name | Target Provider | Description | Current Status in Live Production |
| :--- | :--- | :--- | :--- |
| `RESEND_API_KEY` | **Resend** (Primary) | API token for `https://api.resend.com/emails` | **NOT CONFIGURED** |
| `SENDGRID_API_KEY` | **SendGrid** (Fallback) | API token for `https://api.sendgrid.com/v3/mail/send` | **NOT CONFIGURED** |
| `ORDER_FROM_EMAIL` | Sender Address | Authorized sender mailbox (Default: `orders@baemeds.com`) | Defaults to `orders@baemeds.com` |
| `ADMIN_NOTIFICATION_EMAIL` | Operations Inbox | Internal drop-ship alert inbox (Default: `orders@baemeds.com`) | Defaults to `orders@baemeds.com` |

### 2.2. Error Handling & Non-Blocking Design
- When an API key is missing or an external provider returns an error (e.g., 401 Unauthorized or 429 Rate Limited), the email service logs the warning safely to server console logs without throwing an unhandled rejection.
- **Checkout Resiliency**: Failure of email delivery does **NOT** cause order creation or Stripe payment processing to fail. The customer's order remains safely recorded in the database, and the confirmation screen displays immediately.

### 2.3. Health Data Minimization (HIPAA Compliance Safeguards)
Under HIPAA Privacy Rule § 164.502(b) (Minimum Necessary Standard):
- Transactional receipts sent to patients contain order numbers, item names, quantities, and dollar amounts.
- Receipts **NEVER** include physician prescription uploads, medical diagnosis codes, health history notes, or clinical review comments.
- Raw credit card numbers, CVVs, and Stripe private client secrets are strictly excluded from email templates.

---

## 3. Domain Authentication Requirements (SPF, DKIM, DMARC)

Modern mail servers (Google Workspace, Microsoft 365, Yahoo Mail) will reject or quarantine transactional emails sent from `orders@baemeds.com` unless the domain owner configures proper DNS authentication records.

### 3.1. Required DNS Records for `baemeds.com`

#### A. Sender Policy Framework (SPF)
Add or update the TXT record on the root domain `baemeds.com`:
- **If using Resend**:
  - Name: `@` (or `baemeds.com`)
  - Type: `TXT`
  - Value: `v=spf1 include:resend.com ~all`
- **If using SendGrid**:
  - Name: `@` (or `baemeds.com`)
  - Type: `TXT`
  - Value: `v=spf1 include:sendgrid.net ~all`

#### B. DomainKeys Identified Mail (DKIM)
DKIM provides cryptographic signature verification confirming that the email originated from BaeMeds without transit tampering.
- Generated inside the provider dashboard (Resend or SendGrid) upon adding domain `baemeds.com`.
- Requires adding 3 `CNAME` records at the domain DNS registrar (e.g., GoDaddy, Cloudflare, or Namecheap).

#### C. Domain-based Message Authentication, Reporting, and Conformance (DMARC)
- Name: `_dmarc` (or `_dmarc.baemeds.com`)
- Type: `TXT`
- Recommended Pre-Launch Policy:
  `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@baemeds.com`

---

## 4. Prioritized Action Plan for Project Owner

To complete transactional email verification and enable live delivery:

1. **Step 1: Select Email Provider**
   - Recommendation: **Resend** (`https://resend.com`), as it offers native Next.js/Vercel integration, zero cold-start latency, and automated DKIM management.
2. **Step 2: Add and Verify Domain in Resend**
   - In Resend Dashboard -> Domains, click **Add Domain** -> enter `baemeds.com`.
   - Copy the DNS records provided by Resend into your domain DNS management console.
   - Wait 15–30 minutes for DNS propagation; click **Verify Domain** in Resend.
3. **Step 3: Generate API Key**
   - In Resend Dashboard -> API Keys -> Create API Key with `Full access` (or `Sending access`).
   - Copy the key (`re_...`).
4. **Step 4: Configure Vercel Environment Variables**
   - In Vercel Project Settings -> Environment Variables:
     - Add `RESEND_API_KEY` = `re_...` (Scope: Production & Preview)
     - Add `ORDER_FROM_EMAIL` = `orders@baemeds.com`
     - Add `ADMIN_NOTIFICATION_EMAIL` = `operations@baemeds.com` (or preferred internal inbox)
   - Redeploy or promote deployment.
5. **Step 5: Execute Controlled Delivery Probe**
   - Place a test checkout or trigger a test email dispatch to an authorized mailbox (`support@baemeds.com`).
   - Confirm receipt in inbox (not spam folder).
   - Inspect email headers to confirm `spf=pass`, `dkim=pass`, and `dmarc=pass`.

---

## 5. Audit Conclusion

The application's transactional email code is robust and structurally complete. Live delivery is classified as **UNVERIFIED / ACTION REQUIRED** until the owner provisions provider API credentials and DNS records.
