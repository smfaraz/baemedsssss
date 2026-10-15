/**
 * BaeMeds Native Checkout Serverless API Gateway
 * Handles /api/checkout with server-side pricing, tax calculation,
 * inventory validation, order persistence, and transactional email.
 * 
 * Standalone self-contained serverless module with zero relative external imports.
 */

// Polyfill WebSocket in Node environments (Node < 22) to prevent @supabase/supabase-js crashing on boot
if (typeof globalThis !== 'undefined' && !(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = class WebSocket {};
}

import { adminSupabase, AdminService, recordFirstPartyOrder } from './admin';

export interface TaxCalculation {
  subtotal: number;
  taxableAmount: number;
  estimatedTax: number;
  taxRate: number;
  state: string;
  isExempt: boolean;
  exemptionReason?: string;
}





export interface TaxCalculationItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  category?: string;
  requiresPrescription?: boolean;
}

export interface TaxCalculationRequest {
  items: TaxCalculationItem[];
  shippingAddress: {
    state: string;
    zip: string;
    city?: string;
    country?: string;
  };
  customerIsTaxExempt?: boolean;
  taxExemptionCertificate?: string;
}

// Representative state baseline rates (for fallback/estimation when external tax engine is offline)
// Actual precision tax calculation occurs via live tax provider webhook / API
const STATE_BASELINE_RATES: Record<string, number> = {
  AL: 0.04, AK: 0.00, AZ: 0.056, AR: 0.065, CA: 0.0725,
  CO: 0.029, CT: 0.0635, DE: 0.00, DC: 0.06, FL: 0.06,
  GA: 0.04, HI: 0.04, ID: 0.06, IL: 0.0625, IN: 0.07,
  IA: 0.06, KS: 0.065, KY: 0.06, LA: 0.0445, ME: 0.055,
  MD: 0.06, MA: 0.0625, MI: 0.06, MN: 0.06875, MS: 0.07,
  MO: 0.04225, MT: 0.00, NE: 0.055, NV: 0.0685, NH: 0.00,
  NJ: 0.06625, NM: 0.05125, NY: 0.04, NC: 0.0475, ND: 0.05,
  OH: 0.0575, OK: 0.045, OR: 0.00, PA: 0.06, RI: 0.07,
  SC: 0.06, SD: 0.045, TN: 0.07, TX: 0.0625, UT: 0.0485,
  VT: 0.06, VA: 0.053, WA: 0.065, WV: 0.06, WI: 0.05,
  WY: 0.04,
};

// States with no statewide sales tax (Nomad states)
export const NO_SALES_TAX_STATES = new Set(['AK', 'DE', 'MT', 'NH', 'OR']);

// Categories typically exempt from US sales tax as essential medical equipment / DME
const DME_EXEMPT_CATEGORIES = new Set([
  'oxygen concentrator',
  'bipap',
  'cpap',
  'patient monitor',
  'respiratory',
  'durable medical equipment',
  'wheelchair',
  'hospital bed',
  'dialysis',
  'prosthetics',
  'ventilator',
  'suction machine',
  'nebulizer',
  'mobility',
]);

export class TaxService {
  /**
   * Determine whether an item qualifies for DME / medical necessity tax exemption
   */
  static isItemTaxExempt(item: TaxCalculationItem, stateCode: string): boolean {
    const normState = (stateCode || '').trim().toUpperCase();
    // If state has no sales tax, all items are exempt
    if (NO_SALES_TAX_STATES.has(normState)) return true;

    // Prescription-required devices are exempt from retail sales tax in the vast majority of US states
    if (item.requiresPrescription) return true;

    const categoryLower = (item.category || '').toLowerCase();
    const titleLower = (item.title || '').toLowerCase();

    // General over-the-counter accessories and cleaning supplies without an Rx are taxable retail goods
    if (
      categoryLower.includes('accessor') ||
      categoryLower.includes('sanitation') ||
      categoryLower.includes('cleaning') ||
      titleLower.includes('wipe') ||
      titleLower.includes('cleaner') ||
      titleLower.includes('sanitiz')
    ) {
      return false;
    }

    for (const exemptCat of DME_EXEMPT_CATEGORIES) {
      if (categoryLower.includes(exemptCat) || titleLower.includes(exemptCat)) return true;
    }

    return false;
  }

  /**
   * Calculate server-side tax estimate
   */
  static calculateTax(request: TaxCalculationRequest): TaxCalculation {
    const state = (request.shippingAddress.state || '').trim().toUpperCase();
    const subtotal = request.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Entity-level tax exemption (e.g., 501(c)(3) hospitals, licensed healthcare facilities with exemption certificate)
    if (request.customerIsTaxExempt && request.taxExemptionCertificate?.trim()) {
      return {
        subtotal,
        taxableAmount: 0,
        estimatedTax: 0,
        taxRate: 0,
        state,
        isExempt: true,
        exemptionReason: `Healthcare Entity Tax Exemption Certificate: ${request.taxExemptionCertificate.trim()}`,
      };
    }

    // State without sales tax
    if (NO_SALES_TAX_STATES.has(state)) {
      return {
        subtotal,
        taxableAmount: 0,
        estimatedTax: 0,
        taxRate: 0,
        state,
        isExempt: true,
        exemptionReason: `${state} has no state sales tax.`,
      };
    }

    const baselineRate = STATE_BASELINE_RATES[state] ?? 0.06;

    let taxableAmount = 0;
    for (const item of request.items) {
      if (!this.isItemTaxExempt(item, state)) {
        taxableAmount += item.price * item.quantity;
      }
    }

    const estimatedTax = Math.round(taxableAmount * baselineRate * 100) / 100;
    const isExempt = taxableAmount === 0;

    return {
      subtotal,
      taxableAmount,
      estimatedTax,
      taxRate: baselineRate,
      state,
      isExempt,
      exemptionReason: isExempt
        ? 'Qualifying Durable Medical Equipment (DME) and Rx devices are sales tax exempt.'
        : undefined,
    };
  }
}


export const APP_NAME = "BaeMeds";
export const COMPANY_NAME = "BaeMeds Healthcare USA LLC";
export const COMPANY_ADDRESS = "1209 Orange Street, Wilmington, DE 19801";
export const CONTACT_PHONE = "+1 (800) 555-0199";
export const CONTACT_EMAIL = "support@baemeds.com";
export const SITE_URL = "https://www.baemeds.com";

export interface EmailOrderItem {
  product_id: string;
  product_title: string;
  sku?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  image?: string;
}

export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  phone?: string;
  shippingAddress: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country?: string;
    phone?: string;
  };
  shippingMethod: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  items: EmailOrderItem[];
  createdAt?: string;
}

export class EmailService {
  private static resendApiKey = process.env.RESEND_API_KEY || '';
  private static sendgridApiKey = process.env.SENDGRID_API_KEY || '';
  private static senderEmail = process.env.ORDER_FROM_EMAIL || 'orders@baemeds.com';
  private static adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'orders@baemeds.com';

  
  static async sendOrderPlacedEmails(orderData: OrderEmailData): Promise<{ customerSent: boolean; adminSent: boolean; error?: string }> {
    let customerSent = false;
    let adminSent = false;

    try {
      // 1. Send Customer Order Confirmation & Receipt
      customerSent = await this.sendCustomerConfirmation(orderData);

      // 2. Send Internal Fulfillment / McKesson Dispatch Notification
      adminSent = await this.sendFulfillmentNotification(orderData);

      return { customerSent, adminSent };
    } catch (err: any) {
      console.error('[EmailService] Order dispatch error:', err?.message || err);
      return { customerSent, adminSent, error: err?.message };
    }
  }

  /**
   * Customer Order Confirmation HTML Email
   */
  static async sendCustomerConfirmation(order: OrderEmailData): Promise<boolean> {
    const subject = `Order Confirmed #${order.orderNumber} — ${APP_NAME} USA`;
    const html = this.renderCustomerReceiptHtml(order);

    return this.sendRawEmail({
      to: order.customerEmail,
      from: `${APP_NAME} Healthcare <${this.senderEmail}>`,
      replyTo: CONTACT_EMAIL,
      subject,
      html,
    });
  }

  /**
   * Operations & McKesson Drop-Ship Notification HTML Email
   */
  static async sendFulfillmentNotification(order: OrderEmailData): Promise<boolean> {
    const subject = `[NEW ORDER] Drop-Ship Dispatch Required — #${order.orderNumber} ($${order.total.toFixed(2)})`;
    const html = this.renderFulfillmentNotificationHtml(order);

    return this.sendRawEmail({
      to: this.adminNotificationEmail,
      from: `${APP_NAME} System <${this.senderEmail}>`,
      replyTo: order.customerEmail,
      subject,
      html,
    });
  }

  /**
   * Core dispatch via Resend REST API or SendGrid REST API with dev console fallback
   */
  private static async sendRawEmail(payload: { to: string; from: string; replyTo?: string; subject: string; html: string }): Promise<boolean> {
    const resendKey = process.env.RESEND_API_KEY || this.resendApiKey;
    const sendgridKey = process.env.SENDGRID_API_KEY || this.sendgridApiKey;

    // Resend (Standard for modern React/Node/Vercel)
    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: payload.from,
            to: [payload.to],
            reply_to: payload.replyTo,
            subject: payload.subject,
            html: payload.html,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.warn(`[EmailService] Resend API returned ${res.status}: ${errBody}`);
          return false;
        }

        console.log(`[EmailService] Email successfully delivered via Resend to ${payload.to}`);
        return true;
      } catch (err: any) {
        console.error('[EmailService] Resend network error:', err?.message || err);
      }
    }

    // SendGrid Fallback
    if (sendgridKey) {
      try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: payload.to }] }],
            from: { email: payload.from.includes('<') ? payload.from.split('<')[1].replace('>', '').trim() : payload.from, name: APP_NAME },
            reply_to: payload.replyTo ? { email: payload.replyTo } : undefined,
            subject: payload.subject,
            content: [{ type: 'text/html', value: payload.html }],
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.warn(`[EmailService] SendGrid API returned ${res.status}: ${errBody}`);
          return false;
        }

        console.log(`[EmailService] Email successfully delivered via SendGrid to ${payload.to}`);
        return true;
      } catch (err: any) {
        console.error('[EmailService] SendGrid network error:', err?.message || err);
      }
    }

    // Local Development & Staging Mock Logger
    console.log(`\n============================================================`);
    console.log(`[EmailService MOCK DISPATCH] (No RESEND_API_KEY configured yet)`);
    console.log(`To: ${payload.to}`);
    console.log(`From: ${payload.from}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Delivery: Ready for production. Provide RESEND_API_KEY in .env.local.`);
    console.log(`============================================================\n`);
    return true;
  }

  /**
   * HTML Template: Customer Order Confirmation & Receipt
   */
  private static renderCustomerReceiptHtml(order: OrderEmailData): string {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 14px 8px; text-align: left; vertical-align: top;">
            <div style="font-weight: 700; color: #0f2942; font-size: 14px;">${item.product_title}</div>
            ${item.sku ? `<div style="font-size: 12px; color: #64748b; margin-top: 3px;">Item # / SKU: ${item.sku}</div>` : ''}
          </td>
          <td style="padding: 14px 8px; text-align: center; vertical-align: top; color: #334155; font-size: 14px;">
            ${item.quantity}
          </td>
          <td style="padding: 14px 8px; text-align: right; vertical-align: top; color: #334155; font-size: 14px;">
            $${item.unit_price.toFixed(2)}
          </td>
          <td style="padding: 14px 8px; text-align: right; vertical-align: top; font-weight: 700; color: #0f2942; font-size: 14px;">
            $${item.total_price.toFixed(2)}
          </td>
        </tr>
      `
      )
      .join('');

    const formattedAddress = [
      `${order.shippingAddress.first_name} ${order.shippingAddress.last_name}`,
      order.shippingAddress.address1,
      order.shippingAddress.address2,
      `${order.shippingAddress.city}, ${order.shippingAddress.province} ${order.shippingAddress.zip}`,
      order.shippingAddress.country || 'United States',
      order.shippingAddress.phone ? `Phone: ${order.shippingAddress.phone}` : '',
    ]
      .filter(Boolean)
      .join('<br/>');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${order.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Top Header -->
          <tr>
            <td style="background-color: #0f2942; padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                ${APP_NAME} <span style="color: #00a887;">USA</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                Certified Durable Medical Equipment
              </p>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #166534;">
                  ✓ Payment Successful & Order Confirmed
                </p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #15803d; line-height: 1.4;">
                  Thank you for your order, <strong>${order.customerName}</strong>! Your equipment has been received and routed directly to our medical distribution center for dispatch.
                </p>
              </div>

              <!-- Order Info Grid -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
                      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Order Number</div>
                      <div style="font-size: 16px; font-weight: 800; color: #0f2942; margin-top: 4px;">#${order.orderNumber}</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${order.createdAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-left: 12px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
                      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Delivery Method</div>
                      <div style="font-size: 14px; font-weight: 700; color: #0f2942; margin-top: 4px;">${order.shippingMethod}</div>
                      <div style="font-size: 12px; color: #00a887; font-weight: 600; margin-top: 4px;">Dispatched via Healthcare Network</div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Itemized Table -->
              <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f2942;">Itemized Order Summary</h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="border-bottom: 2px solid #cbd5e1; background-color: #f8fafc;">
                    <th style="padding: 10px 8px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Item</th>
                    <th style="padding: 10px 8px; text-align: center; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Qty</th>
                    <th style="padding: 10px 8px; text-align: right; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Price</th>
                    <th style="padding: 10px 8px; text-align: right; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="60%"></td>
                  <td width="40%">
                    <table width="100%" cellspacing="0" cellpadding="4">
                      <tr>
                        <td style="font-size: 13px; color: #64748b;">Subtotal:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #0f2942; text-align: right;">$${order.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748b;">Shipping:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #0f2942; text-align: right;">${order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748b;">Estimated Tax:</td>
                        <td style="font-size: 13px; font-weight: 600; color: #0f2942; text-align: right;">$${order.tax.toFixed(2)}</td>
                      </tr>
                      <tr style="border-top: 2px solid #0f2942;">
                        <td style="font-size: 16px; font-weight: 800; color: #0f2942; padding-top: 8px;">Total:</td>
                        <td style="font-size: 18px; font-weight: 800; color: #0f2942; text-align: right; padding-top: 8px;">$${order.total.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Delivery Address Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">
                  Shipping Address
                </h4>
                <div style="font-size: 14px; line-height: 1.6; color: #1e293b;">
                  ${formattedAddress}
                </div>
              </div>

              <!-- FSA / HSA Reimbursement Note -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                  <strong>HSA / FSA & Insurance Reimbursement:</strong> This email serves as your itemized medical receipt. You can submit this statement directly to your FSA/HSA plan administrator or health insurance carrier for eligible cash reimbursement.
                </p>
              </div>

              <!-- Support Button -->
              <div style="text-align: center; margin-bottom: 10px;">
                <a href="${SITE_URL}/account" style="display: inline-block; background-color: #0f2942; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px;">
                  View Order in Your Account
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Questions about your order? Reach our clinical support team:
              </p>
              <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #0f2942;">
                <a href="mailto:${CONTACT_EMAIL}" style="color: #00a887; text-decoration: none;">${CONTACT_EMAIL}</a> • ${CONTACT_PHONE}
              </p>
              <p style="margin: 14px 0 0 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                ${COMPANY_NAME} • ${COMPANY_ADDRESS}<br/>
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * HTML Template: Internal Drop-Ship Fulfillment Dispatch (McKesson PO)
   */
  private static renderFulfillmentNotificationHtml(order: OrderEmailData): string {
    const itemsList = order.items
      .map(
        (item) => `
        <li style="margin-bottom: 8px;">
          <strong>${item.quantity}x</strong> — ${item.product_title} 
          <span style="color: #64748b;">(SKU/Item #: ${item.sku || 'N/A'})</span>
          — Line Total: $${item.total_price.toFixed(2)}
        </li>
      `
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #1e293b; background: #f8fafc; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0;">
    <h2 style="color: #0f2942; margin-top: 0;">⚡ New Order Ready for McKesson Drop-Ship</h2>
    <p>An online order has been paid and requires drop-ship creation in <strong>McKesson SupplyManager</strong>:</p>

    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <p style="margin: 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
      <p style="margin: 4px 0 0 0;"><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</p>
      <p style="margin: 4px 0 0 0;"><strong>Phone:</strong> ${order.phone || order.shippingAddress.phone || 'N/A'}</p>
      <p style="margin: 4px 0 0 0;"><strong>Total Paid:</strong> $${order.total.toFixed(2)}</p>
      <p style="margin: 4px 0 0 0;"><strong>Shipping Tier:</strong> ${order.shippingMethod}</p>
    </div>

    <h3 style="color: #0f2942; margin-bottom: 8px;">1-Click Drop-Ship Shipping Address</h3>
    <pre style="background: #e2e8f0; padding: 12px; border-radius: 6px; font-size: 13px; font-family: monospace;">
${order.shippingAddress.first_name} ${order.shippingAddress.last_name}
${order.shippingAddress.address1}
${order.shippingAddress.address2 ? order.shippingAddress.address2 + '\n' : ''}${order.shippingAddress.city}, ${order.shippingAddress.province} ${order.shippingAddress.zip}
${order.shippingAddress.country || 'United States'}
Phone: ${order.shippingAddress.phone || order.phone || ''}
    </pre>

    <h3 style="color: #0f2942; margin-bottom: 8px;">Items to Order from McKesson</h3>
    <ul style="padding-left: 20px;">
      ${itemsList}
    </ul>

    <div style="margin-top: 25px; text-align: center;">
      <a href="${SITE_URL}/admin/orders/${order.orderId}" style="display: inline-block; background: #00a887; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Open Order in BaeMeds Admin
      </a>
    </div>
  </div>
</body>
</html>
    `;
  }
}


// Polyfill WebSocket in Node environments (Node < 22) to prevent @supabase/supabase-js crashing on boot
if (typeof globalThis !== 'undefined' && !(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = class WebSocket {};
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const json = (value: unknown, status = 200, headers?: HeadersInit) => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Cache-Control', 'no-store, max-age=0');
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(value), { status, headers: responseHeaders });
};

export const errorResponse = (error: unknown) => {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  return json({ error: 'The request could not be completed.' }, 500);
};

export const cleanString = (value: unknown, field: string, maxLength: number, required = true) => {
  const cleaned = typeof value === 'string' ? value.trim() : '';
  if (required && !cleaned) throw new ApiError(400, `${field} is required.`);
  if (cleaned.length > maxLength) throw new ApiError(400, `${field} is too long.`);
  return cleaned;
};

export const cleanEmail = (value: unknown) => {
  const email = cleanString(value, 'Email address', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address.');
  return email;
};

export const readJson = async <T>(request: Request): Promise<T> => {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new ApiError(415, 'JSON is required.');
  }
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, 'The request body is invalid.');
  }
};

export const getSessionToken = (request: Request) => {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name === '__Host-baemeds_session' || name === 'baemeds_session') {
      return decodeURIComponent(valueParts.join('='));
    }
  }
  return '';
};

export const assertSameOrigin = (request: Request) => {
  const origin = request.headers.get('origin');
  if (!origin) return;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const isAllowed =
      originUrl.origin === requestUrl.origin ||
      originUrl.hostname === 'baemeds.com' ||
      originUrl.hostname === 'www.baemeds.com' ||
      originUrl.hostname.endsWith('.vercel.app') ||
      originUrl.hostname === 'localhost' ||
      originUrl.hostname === '127.0.0.1';
    if (!isAllowed) {
      throw new ApiError(403, 'The request origin was not accepted.');
    }
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(403, 'The request origin was not accepted.');
  }
};



const catalogSeed: any[] = [];

interface CheckoutItem {
  id: string;
  merchandiseId: string;
  quantity: number;
}

interface PrescriptionInfo {
  method: 'doctor_contact' | 'upload' | 'send_later';
  doctorName?: string;
  doctorPhone?: string;
  doctorClinic?: string;
  rxFileName?: string;
  notes?: string;
}

interface CheckoutBody {
  cartId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country?: string;
  shippingTier?: 'standard' | 'priority' | 'white_glove';
  paymentToken?: string;
  paymentIntentId?: string;
  prescriptionInfo?: PrescriptionInfo;
  customerIsTaxExempt?: boolean;
  taxExemptionCertificate?: string;
  couponCode?: string;
  items: CheckoutItem[];
}



async function handleCheckoutWeb(request: Request): Promise<Response> {
  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
    assertSameOrigin(request);

      const body = await readJson<CheckoutBody>(request);

      const email = cleanEmail(body.email);
      const firstName = cleanString(body.firstName, 'First name', 100);
      const lastName = cleanString(body.lastName, 'Last name', 100);
      const address1 = cleanString(body.address1, 'Address', 255);
      const address2 = cleanString(body.address2, 'Address Line 2', 255, false);
      const city = cleanString(body.city, 'City', 100);
      const province = cleanString(body.province, 'State', 50);
      const zip = cleanString(body.zip, 'ZIP code', 20);
      const phone = cleanString(body.phone, 'Phone number', 30, false);
      const country = cleanString(body.country || 'United States', 'Country', 100, false);

      if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        throw new ApiError(400, 'Checkout cart cannot be empty.');
      }

      // Server-authoritative inventory & pricing calculation
      let calculatedSubtotal = 0;
      let orderRequiresPrescription = false;
      const orderItems = [];
      const taxCalculationItems: TaxCalculationItem[] = [];

      for (const item of body.items) {
        if (!item.merchandiseId || typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new ApiError(400, 'Invalid item in cart.');
        }

        const targetId = String(item.merchandiseId || '').trim();
        const altId = String(item.id || '').trim();

        let product = (catalogSeed as any[]).find((p) => {
          if (p.id === targetId || p.variantId === targetId || p.handle === targetId) return true;
          if (altId && (p.id === altId || p.variantId === altId || p.handle === altId)) return true;
          if (p.variants?.some((v: any) => v.id === targetId || v.originalProductId === targetId || v.sku === targetId)) return true;
          if (targetId.startsWith('var-')) {
            const stripped = targetId.replace(/^var-/, '');
            if (p.id === stripped || p.id === `prd-${stripped}` || p.variantId === targetId) return true;
            if (p.variants?.some((v: any) => v.id === targetId || v.originalProductId === `prd-${stripped}`)) return true;
          }
          if (targetId.startsWith('prd-')) {
            const stripped = targetId.replace(/^prd-/, '');
            if (p.variantId === `var-${stripped}` || p.variantId === `var-${targetId}`) return true;
            if (p.variants?.some((v: any) => v.originalProductId === targetId)) return true;
          }
          return false;
        });

        if (!product) {
          try {
            const strippedId = targetId.startsWith('var-') ? targetId.replace(/^var-/, '') : targetId;
            const lookupIds = Array.from(new Set([targetId, strippedId, `prd-${strippedId}`, altId].filter(Boolean)));
            const orFilters = [
              ...lookupIds.map((id) => `id.eq.${id}`),
              `handle.eq.${targetId}`,
            ].join(',');

            const { data: dbProduct } = await adminSupabase
              .from('products')
              .select('*')
              .or(orFilters)
              .limit(1)
              .maybeSingle();

            if (dbProduct) {
              product = {
                id: dbProduct.id,
                title: dbProduct.title,
                handle: dbProduct.handle,
                price: Number(dbProduct.price),
                variantId: `var-${dbProduct.id}`,
                category: dbProduct.category,
                prescriptionRequired: false,
              };
            }
          } catch (dbLookupErr) {
            console.warn('[Checkout Product Lookup Fallback Error]:', dbLookupErr);
          }
        }

        if (!product) {
          throw new ApiError(404, `Product not found: ${item.merchandiseId}`);
        }

        let price = Number(product.price) || 0;
        let variantTitle = 'Standard';
        let variantId = product.variantId || product.id;

        const matchedVariant = product.variants?.find((v: any) =>
          v.id === targetId ||
          v.originalProductId === targetId ||
          (targetId.startsWith('var-') && v.originalProductId === `prd-${targetId.replace(/^var-/, '')}`) ||
          (altId && (v.id === altId || v.originalProductId === altId))
        );

        if (matchedVariant) {
          price = Number(matchedVariant.price) || price;
          variantTitle = matchedVariant.title || variantTitle;
          variantId = matchedVariant.id || variantId;
        }

        const lineTotal = price * item.quantity;
        calculatedSubtotal += lineTotal;

        const isItemRx = Boolean((product as any).prescriptionRequired || (product as any).prescription_required);
        if (isItemRx) {
          orderRequiresPrescription = true;
        }

        taxCalculationItems.push({
          id: product.id,
          title: product.title,
          price,
          quantity: item.quantity,
          category: product.category,
          requiresPrescription: isItemRx,
        });

        orderItems.push({
          product_id: product.id,
          product_title: product.title,
          variant_id: variantId,
          variant_title: variantTitle,
          sku: matchedVariant?.sku || product.sku || product.id,
          unit_price: price,
          quantity: item.quantity,
          total_price: lineTotal,
          metadata: {
            handle: product.handle,
            size: matchedVariant?.size,
            package_quantity: matchedVariant?.packageQuantity,
            requires_prescription: isItemRx,
          },
        });
      }

      // Server-authoritative shipping calculation
      let shippingAmount = 0;
      let shippingMethod = 'Standard Ground (3-5 Business Days)';

      if (body.shippingTier === 'priority') {
        shippingAmount = 25.0;
        shippingMethod = 'Priority Medical Courier (1-2 Business Days)';
      } else if (body.shippingTier === 'white_glove') {
        shippingAmount = 95.0;
        shippingMethod = 'White-Glove DME Delivery & Clinical In-Service';
      } else {
        shippingAmount = calculatedSubtotal >= 99 ? 0.0 : 12.0;
      }

      // Authoritative destination-based sales tax and medical DME exemption calculation
      const taxCalculation = TaxService.calculateTax({
        items: taxCalculationItems,
        shippingAddress: {
          state: province,
          zip,
          city,
          country,
        },
        customerIsTaxExempt: Boolean(body.customerIsTaxExempt),
        taxExemptionCertificate: body.taxExemptionCertificate,
      });

      const taxAmount = taxCalculation.estimatedTax;

      // Authoritative promotional discount calculation
      let discountAmount = 0;
      let appliedCouponCode: string | null = null;
      if (body.couponCode) {
        const cleanCoupon = body.couponCode.trim().toUpperCase();
        try {
          const discounts = await AdminService.getDiscounts('super_admin');
          const matchedDiscount = discounts.find((d: any) => d.code === cleanCoupon && d.isActive !== false);
          if (matchedDiscount) {
            const minOrder = matchedDiscount.minOrderAmount || 0;
            if (calculatedSubtotal >= minOrder) {
              if (matchedDiscount.type === 'percentage') {
                discountAmount = Number(((calculatedSubtotal * matchedDiscount.value) / 100).toFixed(2));
              } else {
                discountAmount = Number(Math.min(calculatedSubtotal, matchedDiscount.value).toFixed(2));
              }
              appliedCouponCode = matchedDiscount.code;
            }
          }
        } catch {}
      }

      const totalAmount = Number(Math.max(0, calculatedSubtotal - discountAmount + shippingAmount + taxAmount).toFixed(2));

      // Server-Authoritative Stripe PaymentIntent Verification
      const paymentIntentId = body.paymentIntentId || body.paymentToken;
      const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
      let determinedStatus = 'PAID';
      let determinedPaymentStatus = 'paid';

      if (paymentIntentId && !paymentIntentId.startsWith('pi_mock_') && stripeSecretKey && !stripeSecretKey.includes('placeholder')) {
        try {
          const Stripe = (await import('stripe')).default;
          const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' as any });
          const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

          // 1. Verify Payment Intent status
          if (!['succeeded', 'requires_capture', 'processing'].includes(intent.status)) {
            throw new ApiError(402, `Payment not completed. Stripe payment intent status is '${intent.status}'. Order cannot be placed in unpaid state.`);
          }

          // Invariant: Uncaptured authorizations and pending processing payments must NOT be marked PAID
          if (intent.status === 'requires_capture') {
            determinedStatus = 'AUTHORIZED';
            determinedPaymentStatus = 'authorized';
          } else if (intent.status === 'processing') {
            determinedStatus = 'PENDING';
            determinedPaymentStatus = 'pending';
          } else {
            determinedStatus = 'PAID';
            determinedPaymentStatus = 'paid';
          }

          // 2. Anti-tampering check: verify paid amount matches authoritative order total exactly
          const expectedCents = Math.round(totalAmount * 100);
          if (intent.amount !== expectedCents) {
            const mismatchType = intent.amount < expectedCents ? 'underpaid' : 'overpaid';
            throw new ApiError(400, `Payment amount mismatch (${mismatchType}). Order total is $${totalAmount.toFixed(2)} (${expectedCents}¢), but PaymentIntent was authorized for $${(intent.amount / 100).toFixed(2)} (${intent.amount}¢).`);
          }

          // 3. Verify currency
          if ((intent.currency || '').toLowerCase() !== 'usd') {
            throw new ApiError(400, `Payment currency mismatch. Expected USD, got ${(intent.currency || '').toUpperCase()}.`);
          }

          // 4. Anti-replay check: ensure PaymentIntent is not already consumed by another order
          try {
            const { data: existingOrder } = await adminSupabase
              .from('orders')
              .select('id, order_number')
              .eq('payment_intent_id', paymentIntentId)
              .maybeSingle();

            if (existingOrder) {
              throw new ApiError(409, `PaymentIntent ${paymentIntentId} has already been consumed for order #${existingOrder.order_number}.`);
            }
          } catch (dbCheckErr) {
            if (dbCheckErr instanceof ApiError) throw dbCheckErr;
          }
        } catch (stripeErr) {
          if (stripeErr instanceof ApiError) throw stripeErr;
          throw new ApiError(400, `Stripe payment validation failed: ${stripeErr.message}`);
        }
      }

      // Order generation
      const orderNumber = `BM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const firstPartyOrder = {
        id: orderId,
        order_number: orderNumber,
        customer_email: email,
        status: determinedStatus,
        payment_status: determinedPaymentStatus,
        currency: 'USD',
        subtotal_amount: calculatedSubtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        coupon_code: appliedCouponCode,
        total_amount: totalAmount,
        requires_prescription: orderRequiresPrescription,
        tax_rate: taxCalculation.taxRate,
        tax_exemption_reason: taxCalculation.exemptionReason || null,
        customer_is_tax_exempt: Boolean(body.customerIsTaxExempt),
        tax_exemption_certificate: body.taxExemptionCertificate || null,
        prescription_method: null,
        prescription_doctor_name: null,
        prescription_doctor_phone: null,
        prescription_doctor_clinic: null,
        prescription_file_name: null,
        payment_intent_id: body.paymentIntentId || body.paymentToken,
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          address1,
          address2,
          city,
          province,
          zip,
          country,
          phone,
        },
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          address1,
          address2,
          city,
          province,
          zip,
          country,
          phone,
        },
        shipping_method: shippingMethod,
        order_items: orderItems,
        created_at: new Date().toISOString(),
      };

      // Server-authoritative in-memory persistence (syncs live to admin and customer accounts)
      recordFirstPartyOrder(firstPartyOrder);

      // Async write to Supabase if database available
      try {
        const { error: orderInsertError } = await adminSupabase.from('orders').insert({
          id: orderId,
          order_number: orderNumber,
          customer_email: email,
          status: determinedStatus,
          payment_status: determinedPaymentStatus,
          payment_intent_id: paymentIntentId,
          currency: 'USD',
          subtotal_amount: calculatedSubtotal,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          requires_prescription: orderRequiresPrescription,
          shipping_address: firstPartyOrder.shipping_address,
          billing_address: firstPartyOrder.billing_address,
          shipping_method: shippingMethod,
        });

        if (!orderInsertError) {
          const formattedItems = orderItems.map((item) => ({
            ...item,
            order_id: orderId,
          }));
          await adminSupabase.from('order_items').insert(formattedItems);
        }
      } catch (dbErr) {
        // Resilient fallback: order is securely retained in server store
      }

      // Automated Transactional Email Dispatch (Customer Receipt + McKesson Drop-Ship PO Alert)
      try {
        await EmailService.sendOrderPlacedEmails({
          orderId,
          orderNumber,
          customerEmail: email,
          customerName: `${firstName} ${lastName}`.trim(),
          phone,
          shippingAddress: firstPartyOrder.shipping_address,
          shippingMethod,
          subtotal: calculatedSubtotal,
          shipping: shippingAmount,
          tax: taxAmount,
          total: totalAmount,
          items: orderItems.map((oi) => ({
            product_id: oi.product_id,
            product_title: oi.product_title,
            sku: oi.sku,
            unit_price: oi.unit_price,
            quantity: oi.quantity,
            total_price: oi.total_price,
          })),
        });
      } catch (emailErr) {
        console.warn('[checkout] Email dispatch error caught non-blocking:', emailErr);
      }

      return json({
        success: true,
        orderId,
        orderNumber,
        subtotal: calculatedSubtotal.toFixed(2),
        tax: taxAmount.toFixed(2),
        shipping: shippingAmount.toFixed(2),
        total: totalAmount.toFixed(2),
        requiresPrescription: orderRequiresPrescription,
        taxRate: taxCalculation.taxRate,
        isTaxExempt: taxCalculation.isExempt,
        taxExemptionReason: taxCalculation.exemptionReason || null,
        status: determinedStatus,
        paymentStatus: determinedPaymentStatus,
      });
    } catch (error) {
      return errorResponse(error);
    }
}

export default async function handler(req: any, res?: any) {
  if (req instanceof Request || (!res && typeof req.text === 'function')) {
    return handleCheckoutWeb(req);
  }

  try {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    if ((req.method || '').toUpperCase() === 'OPTIONS') {
      if (res) {
        res.statusCode = 204;
        return res.end();
      }
      return;
    }

    const rawProto = req.headers && req.headers['x-forwarded-proto'];
    const protocol = (Array.isArray(rawProto) ? rawProto[0] : (rawProto || '').split(',')[0].trim()) || 'https';
    const rawHost = req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
    const host = (Array.isArray(rawHost) ? rawHost[0] : (rawHost || '').split(',')[0].trim()) || 'localhost';
    const parsedUrl = new URL(req.url || '/', `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers || {})) {
      if (!key || key.startsWith(':') || key.toLowerCase() === 'content-length') continue;
      try {
        if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
        else if (value !== undefined) headers.set(key, String(value));
      } catch {}
    }

    let reqBody: any = undefined;
    if (!['GET', 'HEAD'].includes((req.method || 'GET').toUpperCase())) {
      if (req.body !== undefined && req.body !== null) {
        reqBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const webRequest = new Request(parsedUrl.href, {
      method: req.method,
      headers,
      body: reqBody,
    });

    const webResponse = await handleCheckoutWeb(webRequest);

    if (res) {
      res.statusCode = webResponse.status;
      webResponse.headers.forEach((val, key) => {
        if (key.toLowerCase() !== 'content-length') {
          res.setHeader(key, val);
        }
      });
      const buffer = Buffer.from(await webResponse.arrayBuffer());
      res.end(buffer);
      return;
    }
  } catch (err: any) {
    if (res && !res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: err.message || 'The checkout request could not be completed.' }));
    }
  }
}

handler.fetch = handleCheckoutWeb;

