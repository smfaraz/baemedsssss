import React from 'react';
import { ArrowLeft, MessageSquareText, SearchX } from 'lucide-react';
import { APP_NAME } from '../constants';
import { Link } from '../context/CartContext';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center px-4 py-14 md:py-20">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-soft md:px-10 md:py-14" aria-labelledby="not-found-title">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-medical-light text-medical-primary"><SearchX size={28} aria-hidden="true" /></span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-medical-primary">Page not found</p>
        <h1 id="not-found-title" className="mt-2 text-3xl font-black tracking-tight text-medical-dark md:text-4xl">We could not find that page.</h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-slate-600">The address may be outdated or mistyped. Return to the catalogue, search for a product, or contact our support team for help.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link to="/products" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-5 font-bold text-white hover:bg-medical-dark"><ArrowLeft size={18} aria-hidden="true" /> Browse products</Link>
          <Link to="/contact" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-medical-primary px-5 font-bold text-medical-dark hover:bg-medical-light"><MessageSquareText size={18} aria-hidden="true" /> Contact support</Link>
        </div>
      </section>
    </div>
  );
};

export default NotFoundPage;
