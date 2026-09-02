import React, { useState } from 'react';
import { CheckCircle2, FileText, Mail, MapPin, PackageCheck, Phone, ShieldCheck } from 'lucide-react';
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE, SITE_DOMAIN } from '../constants';
import { Link } from '../context/CartContext';
import BrandMark from './BrandMark';
import { subscribeToNewsletter } from '../lib/newsletter';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitNewsletter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setStatus(''); setIsSubmitting(true);
    try { await subscribeToNewsletter(email); setEmail(''); setStatus('You are signed up for BaeMeds updates.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'We could not complete your signup. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <footer className="bg-medical-dark text-sm text-slate-300">
      <div className="border-b border-white/10">
        <div className="container mx-auto grid gap-4 px-4 py-6 sm:grid-cols-3">
          {[
            { icon: PackageCheck, title: 'Shipping calculated at checkout', text: 'See the final delivery charge and estimated timeline before payment.', to: '/policies/shipping' },
            { icon: FileText, title: 'GST invoice support', text: 'Need a GST invoice? Contact us before placing your order.', to: '/contact' },
            { icon: ShieldCheck, title: 'Order assistance', text: 'Get help with products, checkout, delivery, or an existing order.', to: '/contact' },
          ].map(({ icon: Icon, title, text, to }) => (
            <Link key={title} to={to} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical-accent">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-medical-primary text-white"><Icon size={21} /></span>
              <div>
                <p className="font-bold text-white">{title}</p>
                <p className="text-xs leading-5 text-slate-400">{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="container mx-auto grid gap-7 px-4 py-8 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1.25fr]">
        <div>
          <Link to="/" aria-label={`${APP_NAME} home`} className="inline-flex min-h-11 items-center"><BrandMark inverse /></Link>
          <p className="mt-3 max-w-sm leading-6 text-slate-400">
            Browse medical equipment for home care, clinics, and hospitals. Call or message us when you need help before ordering.
          </p>
          <p className="mt-3 text-xs font-bold tracking-[0.14em] text-medical-accent">BaeMeds.in</p>
          <div className="mt-5 max-w-sm">
            <h2 className="font-black text-white">Sign me up for the best deals</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">Get useful product updates and store offers by email.</p>
            <form onSubmit={submitNewsletter} className="mt-3 flex gap-2">
              <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
              <input id="footer-newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white px-3 text-sm text-slate-900 outline-none focus:border-medical-accent focus:ring-2 focus:ring-medical-accent/30" />
              <button type="submit" disabled={isSubmitting} className="min-h-11 shrink-0 rounded-xl bg-medical-accent px-4 text-sm font-black text-medical-dark hover:bg-white disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Saving…' : 'Sign up'}</button>
            </form>
            {status && <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-medical-accent" role="status"><CheckCircle2 size={14} className="mt-0.5 shrink-0" />{status}</p>}
          </div>
        </div>

        <div>
          <h2 className="font-black text-white">Shop &amp; Hyderabad Rentals</h2>
          <ul className="mt-3 space-y-1">
            <li><Link to="/products" className="inline-flex min-h-11 items-center hover:text-white">All products</Link></li>
            <li><Link to="/oxygen-concentrator-rental-hyderabad" className="inline-flex min-h-11 items-center text-emerald-400 font-semibold hover:text-white">Oxygen Concentrator Rental</Link></li>
            <li><Link to="/bipap-machine-on-rent-hyderabad" className="inline-flex min-h-11 items-center text-emerald-400 font-semibold hover:text-white">BiPAP Machine on Rent</Link></li>
            <li><Link to="/patient-monitor-price-hyderabad" className="inline-flex min-h-11 items-center text-emerald-400 font-semibold hover:text-white">Patient Monitor Rental &amp; Price</Link></li>
            <li><Link to="/products?category=Hospital%20Furniture" className="inline-flex min-h-11 items-center hover:text-white">ICU Hospital Beds</Link></li>
            <li><Link to="/bulk-orders" className="inline-flex min-h-11 items-center hover:text-white">Hospital Bulk Orders</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-black text-white">Help</h2>
          <ul className="mt-3 space-y-1">
            <li><Link to="/contact" className="inline-flex min-h-11 items-center hover:text-white">Contact support</Link></li>
            <li><Link to="/contact" className="inline-flex min-h-11 items-center hover:text-white">Order support</Link></li>
            <li><Link to="/policies/shipping" className="inline-flex min-h-11 items-center hover:text-white">Shipping &amp; delivery</Link></li>
            <li><Link to="/policies/returns" className="inline-flex min-h-11 items-center hover:text-white">Returns &amp; refunds</Link></li>
            <li><Link to="/policies/privacy" className="inline-flex min-h-11 items-center hover:text-white">Privacy policy</Link></li>
            <li><Link to="/policies/terms" className="inline-flex min-h-11 items-center hover:text-white">Terms of service</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="font-black text-white">Contact</h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-medical-accent" />
              <span className="leading-6"><span className="font-bold text-white">Corporate office</span><br />8-2-326/a/2, Banjara Hills Road No. 3, Plot No. 209, Hyderabad, Telangana 500034</span>
            </li>
            <li>
              <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className="flex min-h-11 items-center gap-3 hover:text-white">
                <Phone size={18} className="shrink-0 text-medical-accent" /> {CONTACT_PHONE}
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex min-h-11 items-center gap-3 break-all hover:text-white">
                <Mail size={18} className="shrink-0 text-medical-accent" /> {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-4 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>
            <p>Â© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
            <p className="mt-1">{APP_NAME} is operated by Mohsin Enterprises.</p>
          </div>
          <p className="md:text-right">Ask us about GST billing for your order.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
