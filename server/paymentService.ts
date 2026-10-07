import Stripe from 'stripe';
import fs from 'node:fs';
import path from 'node:path';

export interface CreatePaymentIntentParams {
  amountInCents: number;
  currency?: string;
  orderNumber?: string;
  customerEmail?: string;
  paymentIntentId?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  isMock: boolean;
  status: string;
}

export class PaymentService {
  private static stripeInstance: Stripe | null = null;

  private static getStripe(): Stripe | null {
    let secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      try {
        const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
        const match = envFile.match(/^STRIPE_SECRET_KEY=(.*)$/m);
        if (match) secretKey = match[1].trim();
      } catch {}
    }
    if (!secretKey) return null;

    if (!this.stripeInstance) {
      this.stripeInstance = new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia' as any,
      });
    }
    return this.stripeInstance;
  }

  /**
   * Creates or updates a PaymentIntent with Stripe (or mock intent if waiting for client keys)
   */
  static async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const stripe = this.getStripe();
    const currency = (params.currency || 'usd').toLowerCase();

    if (stripe) {
      try {
        // If an existing intent ID was passed, update its amount directly
        if (params.paymentIntentId) {
          try {
            const updated = await stripe.paymentIntents.update(params.paymentIntentId, {
              amount: params.amountInCents,
              ...(params.customerEmail ? { receipt_email: params.customerEmail } : {}),
              metadata: {
                orderNumber: params.orderNumber || '',
                store: 'BaeMeds USA',
                ...(params.metadata || {}),
              },
            });
            return {
              clientSecret: updated.client_secret || '',
              paymentIntentId: updated.id,
              isMock: false,
              status: updated.status,
            };
          } catch (updateErr: any) {
            console.warn('[PaymentService] Failed to update intent, creating fresh intent:', updateErr.message);
          }
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: params.amountInCents,
          currency,
          receipt_email: params.customerEmail,
          metadata: {
            orderNumber: params.orderNumber || '',
            store: 'BaeMeds USA',
            ...(params.metadata || {}),
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        return {
          clientSecret: paymentIntent.client_secret || '',
          paymentIntentId: paymentIntent.id,
          isMock: false,
          status: paymentIntent.status,
        };
      } catch (err: any) {
        console.error('[PaymentService] Stripe payment intent error:', err.message);
        throw err;
      }
    }

    // Graceful fallback while waiting for client Stripe keys
    const mockId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      clientSecret: `${mockId}_secret_${Math.random().toString(36).substring(2, 9)}`,
      paymentIntentId: mockId,
      isMock: true,
      status: 'requires_payment_method',
    };
  }
}
