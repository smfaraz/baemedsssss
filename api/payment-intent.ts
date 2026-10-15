import { ApiError, assertSameOrigin, errorResponse, json, readJson } from '../server/commerce';
import { createVercelHandler } from '../server/serverlessAdapter';
import { PaymentService } from '../server/paymentService';

interface PaymentIntentBody {
  amount?: number; // in USD (e.g. 149.99)
  amountInCents?: number; // in cents (e.g. 14999)
  currency?: string;
  orderNumber?: string;
  customerEmail?: string;
  paymentIntentId?: string;
}

export default createVercelHandler(async (request: Request) => {
  try {
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
    }
    try {
      assertSameOrigin(request);
    } catch (originErr: any) {
      console.warn('[PaymentIntent API] Origin check notice:', originErr.message);
    }

    const body = await readJson<PaymentIntentBody>(request).catch(() => ({} as PaymentIntentBody));

    let amountInCents = 1000;
    if (typeof body.amountInCents === 'number' && body.amountInCents > 0) {
      amountInCents = Math.round(body.amountInCents);
    } else if (typeof body.amount === 'number' && body.amount > 0) {
      amountInCents = Math.round(body.amount * 100);
    }

    const result = await PaymentService.createPaymentIntent({
      amountInCents,
      currency: body.currency || 'usd',
      orderNumber: body.orderNumber,
      customerEmail: body.customerEmail,
      paymentIntentId: body.paymentIntentId,
    });

    let publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    if (!publishableKey) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
        const match = envFile.match(/^VITE_STRIPE_PUBLISHABLE_KEY=(.*)$/m);
        if (match) publishableKey = match[1].trim();
      } catch {}
    }

    return json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      publishableKey,
      isMock: result.isMock,
      status: result.status,
    });
  } catch (error: any) {
    console.error('[PaymentIntent API Uncaught Error]:', error);
    return json({
      error: error.message || 'Payment initialization is temporarily unavailable.',
      isMock: true,
    }, 200);
  }
});
