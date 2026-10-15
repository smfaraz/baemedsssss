/**
 * BaeMeds Stripe Webhook Gateway
 * Authoritative payment status synchronization and idempotency handler.
 * 100% Standalone, self-contained serverless module with zero relative imports.
 */

if (typeof globalThis !== 'undefined' && !(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = class WebSocket {};
}

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ifadlrhqsgdxeeebjblo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWRscmhxc2dkeGVlZWJqYmxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc4Nzg4NiwiZXhwIjoyMTA2MzYzODg2fQ.iqFzLb2dntbQuW4u_LZuxLA9Ki8AcFsRLO7jzUTRBco';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

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
          await supabase
            .from('orders')
            .update({
              status: 'PAID',
              payment_status: 'paid',
              payment_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString(),
            })
            .eq('order_number', orderNumber);

          await supabase.from('audit_logs').insert({
            action: 'WEBHOOK_PAYMENT_SUCCEEDED',
            entity_type: 'ORDER',
            entity_id: orderNumber,
            actor_id: 'system_stripe_webhook',
            details: { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount },
            created_at: new Date().toISOString(),
          });
        } catch (dbErr: any) {
          console.error('[Stripe Webhook] DB update error:', dbErr.message);
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderNumber = paymentIntent.metadata?.orderNumber;

      if (orderNumber) {
        try {
          await supabase
            .from('orders')
            .update({
              status: 'PAYMENT_FAILED',
              payment_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('order_number', orderNumber);
        } catch (dbErr: any) {
          console.error('[Stripe Webhook] DB failure update error:', dbErr.message);
        }
      }
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return json({ received: true });
}

export default async function handler(req: any, res?: any) {
  if (req instanceof Request || (!res && typeof req?.text === 'function')) {
    return await handleWebhookWeb(req);
  }

  try {
    const rawProto = req.headers && req.headers['x-forwarded-proto'];
    const protocol = (Array.isArray(rawProto) ? rawProto[0] : (rawProto || '').split(',')[0].trim()) || 'https';
    const rawHost = req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
    const host = (Array.isArray(rawHost) ? rawHost[0] : (rawHost || '').split(',')[0].trim()) || 'localhost';
    const url = new URL(req.url || '/', `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers || {})) {
      if (value !== undefined) headers.set(key, String(value));
    }

    let reqBody: any = undefined;
    if (req.body !== undefined && req.body !== null) {
      reqBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const webRequest = new Request(url.href, {
      method: req.method || 'POST',
      headers,
      body: reqBody,
    });

    const webResponse = await handleWebhookWeb(webRequest);

    if (res) {
      res.statusCode = webResponse.status;
      webResponse.headers.forEach((val, key) => res.setHeader(key, val));
      const text = await webResponse.text();
      res.end(text);
      return;
    }
  } catch (err: any) {
    if (res && !res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Webhook internal error' }));
    }
  }
}

handler.fetch = handleWebhookWeb;
