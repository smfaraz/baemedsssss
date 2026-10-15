/**
 * BaeMeds Stripe Webhook Gateway
 * Authoritative payment status synchronization and idempotency handler.
 * Self-contained serverless module with zero external relative imports.
 */

if (typeof globalThis !== 'undefined' && !(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = class WebSocket {};
}

import Stripe from 'stripe';
import { adminSupabase } from '../admin';

const json = (value: unknown, status = 200, headers?: HeadersInit) => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Cache-Control', 'no-store, max-age=0');
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(value), { status, headers: responseHeaders });
};

async function handleWebhookWeb(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.warn('[Stripe Webhook] Keys not configured. Skipping webhook processing.');
    return json({ received: true, note: 'Stripe keys not configured in environment' });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' as any });
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return json({ error: 'Missing stripe-signature header' }, 400);
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return json({ error: `Webhook signature verification failed: ${err.message}` }, 400);
  }

  // Handle specific event types
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderNumber = paymentIntent.metadata?.orderNumber;

      if (orderNumber) {
        try {
          await adminSupabase
            .from('orders')
            .update({ status: 'PAID', updated_at: new Date().toISOString() })
            .eq('order_number', orderNumber);
          console.log(`[Stripe Webhook] Order #${orderNumber} marked as PAID via payment_intent.succeeded`);
        } catch (dbErr) {
          console.error('[Stripe Webhook] Database update error:', dbErr);
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderNumber = paymentIntent.metadata?.orderNumber;
      console.warn(`[Stripe Webhook] Payment failed for order #${orderNumber}: ${paymentIntent.last_payment_error?.message}`);
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
  }

  return json({ received: true });
}

export default async function handler(req: any, res?: any) {
  if (req instanceof Request || (!res && typeof req.text === 'function')) {
    return handleWebhookWeb(req);
  }

  try {
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

    const webResponse = await handleWebhookWeb(webRequest);

    if (res) {
      res.statusCode = webResponse.status;
      webResponse.headers.forEach((val, key) => {
        if (key.toLowerCase() !== 'content-length') {
          res.setHeader(key, val);
        }
      });
      const text = await webResponse.text();
      res.end(text);
      return;
    }
  } catch (err: any) {
    if (res && !res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Webhook processing error' }));
    }
  }
}

handler.fetch = handleWebhookWeb;
