import { APP_NAME, COMPANY_NAME, COMPANY_ADDRESS, CONTACT_PHONE, CONTACT_EMAIL, SITE_URL } from '../constants.tsx';

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

  /**
   * Dispatches both Customer Confirmation and Internal Fulfillment Alert
   */
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
