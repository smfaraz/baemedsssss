interface PaymentIntentBody {
  amount?: number;
  amountInCents?: number;
  currency?: string;
  orderNumber?: string;
  customerEmail?: string;
  paymentIntentId?: string;
}

interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
  isMock: boolean;
  status: string;
}

async function processPaymentIntent(body: PaymentIntentBody): Promise<PaymentIntentResult> {
  let amountInCents = 1000;
  if (typeof body.amountInCents === 'number' && body.amountInCents > 0) {
    amountInCents = Math.round(body.amountInCents);
  } else if (typeof body.amount === 'number' && body.amount > 0) {
    amountInCents = Math.round(body.amount * 100);
  }

  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  const publishableKey = (process.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();

  if (secretKey && !secretKey.includes('placeholder')) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia' as any,
      });

      // Update existing real payment intent if provided
      if (body.paymentIntentId && !body.paymentIntentId.startsWith('pi_mock_')) {
        try {
          const updated = await stripe.paymentIntents.update(body.paymentIntentId, {
            amount: amountInCents,
            ...(body.customerEmail ? { receipt_email: body.customerEmail } : {}),
            metadata: {
              orderNumber: body.orderNumber || '',
              store: 'BaeMeds USA',
            },
          });
          return {
            clientSecret: updated.client_secret || '',
            paymentIntentId: updated.id,
            publishableKey,
            isMock: false,
            status: updated.status,
          };
        } catch (updateErr: any) {
          console.warn('[PaymentIntent] Update failed, creating new intent:', updateErr.message);
        }
      }

      // Create new intent
      const created = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: (body.currency || 'usd').toLowerCase(),
        receipt_email: body.customerEmail,
        metadata: {
          orderNumber: body.orderNumber || '',
          store: 'BaeMeds USA',
        },
        automatic_payment_methods: { enabled: true },
      });

      return {
        clientSecret: created.client_secret || '',
        paymentIntentId: created.id,
        publishableKey,
        isMock: false,
        status: created.status,
      };
    } catch (stripeErr: any) {
      console.warn('[PaymentIntent] Stripe API fallback to mock:', stripeErr.message);
    }
  }

  // Graceful fallback while waiting for Stripe credentials
  const mockId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    clientSecret: `${mockId}_secret_${Math.random().toString(36).substring(2, 9)}`,
    paymentIntentId: mockId,
    publishableKey,
    isMock: true,
    status: 'requires_payment_method',
  };
}

async function handleWebStandard(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body: PaymentIntentBody = await request.json().catch(() => ({}));
    const result = await processPaymentIntent(body);
    return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    const fallback = await processPaymentIntent({});
    return new Response(JSON.stringify(fallback), { status: 200, headers: corsHeaders });
  }
}

export default async function handler(req: any, res?: any) {
  // If invoked with Web Standard Request (e.g. Vite dev middleware)
  if (req instanceof Request || (!res && typeof req.text === 'function')) {
    return handleWebStandard(req);
  }

  // Node.js Serverless runtime (Vercel Node Serverless)
  try {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    if ((req.method || '').toUpperCase() === 'OPTIONS') {
      if (res) {
        res.statusCode = 204;
        return res.end();
      }
      return;
    }

    if ((req.method || '').toUpperCase() !== 'POST') {
      if (res) {
        res.statusCode = 405;
        return res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
      return;
    }

    let body: PaymentIntentBody = {};
    if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    } else if (typeof req.body === 'string' && req.body.trim()) {
      try {
        body = JSON.parse(req.body);
      } catch {}
    }

    const result = await processPaymentIntent(body);

    if (res) {
      res.statusCode = 200;
      return res.end(JSON.stringify(result));
    }
    return result;
  } catch (error: any) {
    console.error('[PaymentIntent Fatal Catch]:', error);
    const fallback = await processPaymentIntent({});
    if (res && !res.headersSent) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify(fallback));
    }
  }
}

handler.fetch = handleWebStandard;
