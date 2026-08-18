import React from 'react';
import { ArrowRight, CheckCircle, Mail, MessageCircle, Phone, ShoppingBag } from 'lucide-react';
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE } from '../constants';
import { Link } from '../context/CartContext';
import { useReveal } from '../lib/useReveal';

const cleanPhone = CONTACT_PHONE.replace(/\D/g, '');
const whatsappMessage = encodeURIComponent(`Hello ${APP_NAME}, I would like help with a medical equipment enquiry.`);

const ThankYouPage: React.FC = () => {
  const sectionRef = useReveal<HTMLDivElement>();
  const contactCardsRef = useReveal<HTMLDivElement>();
  const firstCardRef = useReveal<HTMLDivElement>();
  const secondCardRef = useReveal<HTMLDivElement>();
  const thirdCardRef = useReveal<HTMLDivElement>();

  return (
    <main className="min-h-[78vh] px-4 py-12 sm:py-20">
      <section ref={sectionRef} className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-medical-light bg-white shadow-soft reveal-on-scroll">
        <div className="bg-medical-dark p-7 text-white sm:p-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 motion-lift" aria-hidden="true"><CheckCircle size={30} /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-white/70">Contact options</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Continue your enquiry with {APP_NAME}.</h1>
          <p className="mt-4 max-w-xl leading-7 text-white/80">Choose call, WhatsApp, or email to contact the team. A message is confirmed only after you send it from the selected app.</p>
        </div>
        <div className="p-6 sm:p-10">
          <div ref={contactCardsRef} className="grid gap-3 sm:grid-cols-3 stagger-grid">
            <a href={`tel:+${cleanPhone}`} ref={firstCardRef} className="group rounded-2xl border border-medical-light p-4 hover:border-medical-primary hover:shadow-soft motion-lift transition"><Phone className="text-medical-primary" /><p className="mt-3 text-sm font-bold text-medical-dark">Call now</p><p className="mt-1 text-sm text-medical-text/60">{CONTACT_PHONE}</p></a>
            <a href={`https://wa.me/${cleanPhone}?text=${whatsappMessage}`} target="_blank" rel="noreferrer" ref={secondCardRef} className="group rounded-2xl border border-medical-light p-4 hover:border-medical-primary hover:shadow-soft motion-lift transition"><MessageCircle className="text-medical-primary" /><p className="mt-3 text-sm font-bold text-medical-dark">WhatsApp</p><p className="mt-1 text-sm text-medical-text/60">Open prefilled message</p></a>
            <a href={`mailto:${CONTACT_EMAIL}`} ref={thirdCardRef} className="group rounded-2xl border border-medical-light p-4 hover:border-medical-primary hover:shadow-soft motion-lift transition"><Mail className="text-medical-primary" /><p className="mt-3 text-sm font-bold text-medical-dark">Email</p><p className="mt-1 break-all text-sm text-medical-text/60">{CONTACT_EMAIL}</p></a>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/products" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white hover:bg-medical-dark transition"><ShoppingBag size={18} /> Browse products <ArrowRight size={18} /></Link>
            <Link to="/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-medical-primary px-6 py-3 font-bold text-medical-primary hover:bg-medical-light transition">Return home</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ThankYouPage;
