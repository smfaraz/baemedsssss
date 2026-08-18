import React from 'react';
import { CheckCircle2, CreditCard, LogIn, ShoppingCart } from 'lucide-react';

const steps = [
  {
    icon: ShoppingCart,
    title: 'Review your cart',
    text: 'Check the products, quantities, and subtotal before continuing.',
  },
  {
    icon: LogIn,
    title: 'Sign in or continue',
    text: 'Sign in for saved addresses and account order history, or continue as a guest.',
  },
  {
    icon: CreditCard,
    title: 'Complete Shopify checkout',
    text: 'Enter delivery details once, review shipping and tax, then choose payment.',
  },
  {
    icon: CheckCircle2,
    title: 'Confirm and track',
    text: 'Keep the Shopify order number. Tracking appears after the courier is assigned.',
  },
];

const OrderJourney: React.FC = () => (
  <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6" aria-labelledby="order-journey-title">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-medical-primary">What happens next</p>
    <h2 id="order-journey-title" className="mt-2 text-xl font-bold text-medical-dark">A clear checkout and delivery path</h2>
    <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map(({ icon: Icon, title, text }, index) => (
        <li key={title} className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-medical-light text-medical-primary"><Icon size={19} aria-hidden="true" /></span>
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Step {index + 1}</span>
          </div>
          <h3 className="mt-3 font-bold text-medical-dark">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
        </li>
      ))}
    </ol>
  </section>
);

export default OrderJourney;
