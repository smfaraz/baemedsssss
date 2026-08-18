import React from 'react';
import { ArrowRight, Building2, CheckCircle2, Headphones, MapPin, PackageSearch, Phone } from 'lucide-react';
import { APP_NAME, CONTACT_PHONE } from '../constants';
import { Link } from '../context/CartContext';
import { useReveal } from '../lib/useReveal';
import aboutImg from '../public/assets/images/about.png';

const priorities = [
  {
    icon: PackageSearch,
    title: 'Easy product search',
    description: 'Browse by product type, compare the available options, and read the full product page before deciding.',
  },
  {
    icon: Headphones,
    title: 'Help from our team',
    description: 'Call or message us when you need help checking compatibility, stock, delivery, or how to order.',
  },
  {
    icon: Building2,
    title: 'Single and bulk orders',
    description: 'Buy individual products online or send us a list for a clinic, hospital, or larger order.',
  },
];

const AboutPage: React.FC = () => {
  const heroRef = useReveal<HTMLDivElement>();
  const prioritiesRef = useReveal<HTMLDivElement>();
  const enterpriseRef = useReveal<HTMLDivElement>();

  return (
    <main className="overflow-hidden" style={{ backgroundColor: '#f6f3ee' }}>
      <section className="relative border-b border-slate-200 bg-medical-dark text-white">
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-20 reveal-on-scroll" ref={heroRef}>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-medical-accent">About {APP_NAME}</p>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
              Medical equipment, made easier to find and order.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
              {APP_NAME} is an online medical equipment shop run by Mohsin Enterprises in Hyderabad. Browse products, contact us directly, or ask for a quote for a larger order.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-accent px-5 py-3 font-bold text-medical-dark transition-colors hover:bg-white"
              >
                Explore products <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a
                href={`tel:${CONTACT_PHONE}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-transparent px-5 py-3 font-bold text-white transition-colors hover:bg-white/10"
              >
                <Phone size={18} aria-hidden="true" /> Call {CONTACT_PHONE}
              </a>
            </div>
          </div>

          <div className="relative">
            <img
              src={aboutImg}
              alt="A selection of mobility and home-care medical equipment"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-soft"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16 reveal-on-scroll" ref={prioritiesRef}>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-medical-primary">What we focus on</p>
            <h2 className="mt-3 text-3xl font-bold text-medical-dark sm:text-4xl">Useful guidance from search to order</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Medical equipment often needs a closer look before you order. Read the product details, then call or message us when something needs to be confirmed.
            </p>
          </div>

          <div className="stagger-grid grid gap-4 sm:grid-cols-3">
            {priorities.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-medical-light text-medical-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-medical-dark">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16 reveal-on-scroll" ref={enterpriseRef}>
          <div>
            <div className="max-w-2xl rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p><strong className="font-semibold text-medical-dark">Business information</strong> — {APP_NAME} is operated by Mohsin Enterprises.</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Corporate office: 8-2-326/a/2, Banjara Hills Road No. 3, Plot No. 209, Hyderabad, Telangana 500034</p>
            </div>
          </div>

          <div className="rounded-2xl bg-medical-dark p-6 text-white shadow-soft sm:p-8">
            <h3 className="text-2xl font-bold">Choose the right way to order</h3>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
              {[
                'Browse the product list for items available through online checkout.',
                'Contact us before ordering when features or compatibility need confirmation.',
                'Use the bulk-order form when you need several products or a written quote.',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-medical-accent" size={19} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Link to="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-medical-accent px-4 py-3 font-bold text-medical-dark hover:bg-white">
                Contact the team
              </Link>
              <Link to="/bulk-orders" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-medical-accent px-4 py-3 font-bold text-medical-accent hover:bg-medical-accent/10">
                Request a quotation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
