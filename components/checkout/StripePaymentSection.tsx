import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';

interface StripePaymentSectionProps {
  publishableKey: string;
  clientSecret: string;
  onPaymentSuccess: (paymentIntentId: string) => Promise<void> | void;
  onPaymentError: (errorMessage: string) => void;
  onBeforeSubmit?: () => string | null;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  submitButtonText?: string;
  disabled?: boolean;
}

const PaymentFormInner: React.FC<{
  onPaymentSuccess: (paymentIntentId: string) => Promise<void> | void;
  onPaymentError: (errorMessage: string) => void;
  onBeforeSubmit?: () => string | null;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  submitButtonText?: string;
  disabled?: boolean;
}> = ({
  onPaymentSuccess,
  onPaymentError,
  onBeforeSubmit,
  isSubmitting,
  setIsSubmitting,
  submitButtonText,
  disabled,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [elementError, setElementError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || disabled || isSubmitting) return;

    if (onBeforeSubmit) {
      const validationError = onBeforeSubmit();
      if (validationError) {
        setElementError(validationError);
        onPaymentError(validationError);
        return;
      }
    }

    setIsSubmitting(true);
    setElementError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        const msg = error.message || 'Payment processing failed. Please check your card information.';
        setElementError(msg);
        onPaymentError(msg);
        setIsSubmitting(false);
        return;
      }

      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        await onPaymentSuccess(paymentIntent.id);
      } else {
        const msg = `Payment status: ${paymentIntent?.status || 'incomplete'}`;
        setElementError(msg);
        onPaymentError(msg);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      const msg = err.message || 'An unexpected error occurred during payment processing.';
      setElementError(msg);
      onPaymentError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <form id="stripe-checkout-form" onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: {
            applePay: 'auto',
            googlePay: 'auto',
          },
        }}
      />

      {elementError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{elementError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || disabled || isSubmitting}
        className="tap-target mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-medical-primary py-4 text-base font-bold text-white shadow-lg shadow-medical-primary/20 hover:bg-medical-dark disabled:cursor-not-allowed disabled:bg-slate-300 transition duration-200"
      >
        <Lock size={18} />
        {isSubmitting ? 'Processing Secure Payment...' : (submitButtonText || 'Complete Payment & Place Order')}
      </button>

      <div className="flex items-center justify-center gap-2 text-center text-xs text-medical-text/60 pt-1">
        <ShieldCheck size={14} className="text-medical-primary" />
        <span>256-Bit Encrypted • Verified Merchant Processing</span>
      </div>
    </form>
  );
};

export const StripePaymentSection: React.FC<StripePaymentSectionProps> = ({
  publishableKey,
  clientSecret,
  onPaymentSuccess,
  onPaymentError,
  onBeforeSubmit,
  isSubmitting,
  setIsSubmitting,
  submitButtonText,
  disabled,
}) => {
  const stripePromise = React.useMemo(() => {
    if (!publishableKey) return null;
    return loadStripe(publishableKey);
  }, [publishableKey]);

  if (!stripePromise || !clientSecret) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
        <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
        <span>Initializing secure payment gateway...</span>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0d9488',
            colorBackground: '#ffffff',
            colorText: '#0f172a',
            colorDanger: '#e11d48',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '12px',
          },
        },
      }}
    >
      <PaymentFormInner
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        onBeforeSubmit={onBeforeSubmit}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        submitButtonText={submitButtonText}
        disabled={disabled}
      />
    </Elements>
  );
};

export default StripePaymentSection;
