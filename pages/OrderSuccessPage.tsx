import React from 'react';
import { ArrowRight, CheckCircle, Package, ShieldCheck } from 'lucide-react';
import { Link } from '../context/CartContext';
import { useReveal } from '../lib/useReveal';

const OrderSuccessPage: React.FC = () => {
  const sectionRef = useReveal<HTMLElement>();

  return (
    <main ref={sectionRef} className="min-h-[78vh] px-4 py-12 sm:py-20">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-medical-light bg-white p-6 shadow-soft sm:p-10 reveal-on-scroll">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-medical-secondary-soft text-medical-secondary" aria-hidden="true"><CheckCircle size={32} /></span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-medical-primary">After checkout</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-medical-dark sm:text-4xl">Check your order confirmation</h1>
        <p className="mt-4 leading-7 text-medical-text/75">This page cannot verify a completed payment or create an order number. Use the confirmation page and receipt email as your order record.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-medical-light p-4 reveal-on-scroll" style={{ ['--reveal-delay' as any]: '80ms' }}><Package className="text-medical-primary" size={22} /><h2 className="mt-3 font-bold text-medical-dark">Review your orders</h2><p className="mt-1 text-sm leading-6 text-medical-text/75">Signed-in customers can check orders attached to their account.</p></div>
          <div className="rounded-xl bg-medical-light p-4 reveal-on-scroll" style={{ ['--reveal-delay' as any]: '160ms' }}><ShieldCheck className="text-medical-primary" size={22} /><h2 className="mt-3 font-bold text-medical-dark">Keep your receipt</h2><p className="mt-1 text-sm leading-6 text-medical-text/75">Use your receipt email for payment and delivery details.</p></div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/account" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white hover:bg-medical-dark transition">View account orders <ArrowRight size={18} /></Link>
          <Link to="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-medical-primary px-6 py-3 font-bold text-medical-primary hover:bg-medical-light transition">Contact support</Link>
        </div>
      </section>
    </main>
  );
};

export default OrderSuccessPage;
