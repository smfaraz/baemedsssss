import React from 'react';
import { ArrowRight, MessageCircle, Search, Truck } from 'lucide-react';
import { Link } from '../context/CartContext';
import aboutImage from '../pages/about.png';

const Hero: React.FC = () => {
  return (
    <section className="overflow-hidden border-b border-slate-200 bg-medical-light/50">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
        <div className="reveal-up">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-medical-primary">Medical equipment online</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-medical-text sm:text-5xl lg:text-6xl">
            Find the product. Check the details. Ask us if you need help.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Browse the current product list for home care, clinics, and hospitals. Prices, stock, and final shipping details are confirmed through the product and checkout pages.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/products" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white hover:bg-medical-dark">
              Browse products <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link to="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-medical-text hover:border-medical-primary">
              <MessageCircle size={19} aria-hidden="true" /> Ask a product question
            </Link>
          </div>
          <ul className="mt-7 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <li className="flex items-center gap-2"><Search className="shrink-0 text-medical-primary" size={18} aria-hidden="true" /> Search the live list</li>
            <li className="flex items-center gap-2"><MessageCircle className="shrink-0 text-medical-primary" size={18} aria-hidden="true" /> Call or WhatsApp</li>
            <li className="flex items-center gap-2"><Truck className="shrink-0 text-medical-primary" size={18} aria-hidden="true" /> Shipping at checkout</li>
          </ul>
        </div>

        <div className="relative reveal-up">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-medical-primary/10 blur-2xl" aria-hidden="true" />
          <img src={aboutImage} alt="A selection of home-care and mobility equipment" className="aspect-[4/3] w-full rounded-3xl border border-slate-200 bg-white object-cover shadow-xl" />
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/60 bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:left-6 sm:right-auto sm:max-w-xs">
            <p className="font-bold text-medical-text">Buying several products?</p>
            <p className="mt-1 text-sm leading-5 text-slate-600">Send your list and quantities for a written quote.</p>
            <Link to="/bulk-orders" className="mt-2 inline-flex min-h-11 items-center gap-2 font-bold text-medical-primary hover:text-medical-dark">Request a quote <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
