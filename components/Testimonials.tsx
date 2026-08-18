import React from 'react';
import { MessageCircle, Phone, Search } from 'lucide-react';
import { CONTACT_PHONE } from '../constants';
import { Link } from '../context/CartContext';

const Testimonials: React.FC = () => {
  const whatsappNumber = CONTACT_PHONE.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello Baemeds, I need help choosing medical equipment.')}`;

  return (
    <section className="border-y border-slate-200 bg-medical-light/50 py-12 sm:py-16">
      <div className="container mx-auto grid max-w-6xl gap-7 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">Need help choosing?</p>
          <h2 className="mt-2 text-3xl font-bold text-medical-text sm:text-4xl">Ask before you order</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Share the product name or the feature you need. We can help you find the right page and confirm details that are not shown online.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
          <Link to="/search" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-primary px-4 py-3 font-bold text-white hover:bg-medical-dark">
            <Search size={18} aria-hidden="true" /> Search products
          </Link>
          <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-medical-text hover:border-medical-primary">
            <Phone size={18} aria-hidden="true" /> Call now
          </a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-medical-text hover:border-medical-primary">
            <MessageCircle size={18} aria-hidden="true" /> WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
