import Stripe from 'stripe';
import { json } from '../../server/commerce.ts';
import { adminSupabase } from '../../server/adminSupabase.ts';
import { createVercelHandler } from '../../server/serverlessAdapter.ts';

export default createVercelHandler(async (request: Request) => {
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
});
