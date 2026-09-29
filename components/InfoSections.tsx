import React from 'react';
import { ArrowRight, Building2, CheckCircle2, FileSearch, Headphones, PackageSearch } from 'lucide-react';
import { CONTACT_PHONE } from '../constants';
import { Link } from '../context/CartContext';

export const BulkSupplySection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-medical-dark py-12 text-white sm:py-16">
      <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-medical-accent">
              <Building2 size={22} aria-hidden="true" />
            </span>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-medical-accent">Larger orders</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Ordering several products for a hospital or clinic?</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
              Send the product names, quantities, key details, and delivery city. We will check the list and reply with the next steps for a quote.
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
              {['Simple order-list form', 'Add a document if helpful', 'Toll-Free Phone & Email'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="shrink-0 text-medical-accent" size={17} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-56 lg:grid-cols-1">
            <Link to="/bulk-orders" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-medical-dark hover:bg-slate-100">
              Request a quotation <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href={`tel:${CONTACT_PHONE}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-5 py-3 font-bold text-white hover:bg-white/10">
              Call {CONTACT_PHONE}
            </a>
          </div>
        </div>
      </div>
      <FileSearch className="pointer-events-none absolute -bottom-16 -right-14 text-white/[0.04]" size={310} aria-hidden="true" />
    </section>
  );
};

const guidance = [
  {
    icon: PackageSearch,
    title: 'Find respiratory equipment',
    description: 'Search the current catalogue for oxygen, CPAP, BiPAP, and related products.',
    to: '/search?q=oxygen',
    cta: 'Search respiratory products',
  },
  {
    icon: Headphones,
    title: 'Check product details',
    description: 'Ask us to confirm features, compatibility, stock, or ordering details.',
    to: '/contact',
    cta: 'Contact product support',
  },
  {
    icon: Building2,
    title: 'Prepare a larger order',
    description: 'Send your product list when you need several items or a written quote.',
    to: '/bulk-orders',
    cta: 'Request a quote',
  },
];

export const BlogSection: React.FC = () => {
  return (
    <section className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">Useful starting points</p>
          <h2 className="mt-2 text-3xl font-bold text-medical-text sm:text-4xl">Choose what you need next</h2>
        </div>
        <Link to="/products" className="inline-flex min-h-11 items-center gap-2 font-bold text-medical-primary hover:text-medical-dark">
          Browse the full catalogue <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>

      <div className="stagger-grid mt-8 grid gap-4 md:grid-cols-3">
        {guidance.map(({ icon: Icon, title, description, to, cta }) => (
          <article key={title} className="breathing-card flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-medical-light text-medical-primary">
              <Icon size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-xl font-bold text-medical-text">{title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{description}</p>
            <Link to={to} className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-medical-primary hover:text-medical-dark">
              {cta} <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
};
