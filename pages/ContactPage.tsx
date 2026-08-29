import React, { useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import SEO from '../components/SEO';
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE } from '../constants';
import { Link } from '../context/CartContext';
import { useReveal } from '../lib/useReveal';
import { submitEnquiry } from '../lib/enquiries';

const whatsappNumber = CONTACT_PHONE.replace(/\D/g, '');
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello Baemeds, I have a medical equipment question.')}`;
const storeAddress = '8-2-326/a/2, Banjara Hills Road No. 3, Plot No. 209, Hyderabad, Telangana 500034';
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`;
const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(storeAddress)}&output=embed`;

const ContactPage: React.FC = () => {
  const [emailDraftOpened, setEmailDraftOpened] = useState(false);
  const contactCardsRef = useReveal<HTMLDivElement>();
  const formRef = useReveal<HTMLDivElement>();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const topic = String(formData.get('topic') || 'Product question');
    const message = String(formData.get('message') || '').trim();
    await submitEnquiry({ type: 'contact', name, email, phone: phone || 'Not provided', message: `${topic}: ${message}` });
    const subject = encodeURIComponent(`${topic} from ${name}`);
    const body = encodeURIComponent(
      `Baemeds website message\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nTopic: ${topic}\n\nMessage:\n${message}`,
    );

    setEmailDraftOpened(true);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f6f3ee' }}>
      <SEO
        title="Contact Us & 24/7 Medical Equipment Support Hyderabad"
        description="Get in touch with BaeMeds Hyderabad for emergency oxygen delivery, BiPAP machine rentals, wheelchair demos, and customer support. Call +91 93903 49389."
        canonical="/contact"
      />
      <section className="bg-medical-dark text-white">
        <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-medical-accent">Contact {APP_NAME}</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">Product, order, and quote help</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Tell us what you are looking for and include the product name, intended use, quantity, or order reference when available.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <a href={`tel:${CONTACT_PHONE}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-accent px-4 py-3 font-bold text-medical-dark hover:bg-white">
                <Phone size={18} aria-hidden="true" /> Call now
              </a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-medical-accent px-4 py-3 font-bold text-medical-accent hover:bg-medical-accent/10">
                <MessageCircle size={18} aria-hidden="true" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
        <div className="space-y-4 reveal-on-scroll" ref={contactCardsRef}>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-medical-light text-medical-primary">
              <Phone size={21} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-medical-dark">Call the store</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Call when you need a quick answer about a product, stock, or an order.</p>
            <a href={`tel:${CONTACT_PHONE}`} className="mt-3 inline-flex min-h-11 items-center font-bold text-medical-primary hover:text-medical-dark">
              {CONTACT_PHONE}
            </a>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-medical-light text-medical-primary">
              <Mail size={21} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-medical-dark">Email support</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Email a product list, photo, or any other details that help explain your question.</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 inline-flex min-h-11 items-center break-all font-bold text-medical-primary hover:text-medical-dark">
              {CONTACT_EMAIL}
            </a>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-medical-light text-medical-primary">
              <MapPin size={21} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-medical-dark">Store address</h2>
            <address className="mt-2 not-italic text-sm leading-6 text-slate-600">
               {storeAddress}
            </address>
            <p className="mt-3 text-xs leading-5 text-slate-500">Call before visiting to confirm product availability.</p>
          </article>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-8 reveal-on-scroll" ref={formRef}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-medical-light text-medical-primary">
              <Send size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-medical-dark">Send us an email</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">This form opens a ready-to-send draft in your email app. Check it and send it from there.</p>
            </div>
          </div>

          {emailDraftOpened && (
            <div role="status" className="mt-6 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
              <p>Your email draft was opened. If no email app appeared, email us directly at {CONTACT_EMAIL}.</p>
            </div>
          )}

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-medical-text">Full name</label>
              <input id="contact-name" name="name" type="text" autoComplete="name" required className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-medical-text outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-medical-text">Email address</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" required className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-medical-text outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15" />
              </div>
              <div>
                <label htmlFor="contact-phone" className="mb-2 block text-sm font-semibold text-medical-text">Phone number <span className="font-normal text-slate-500">(optional)</span></label>
                <input id="contact-phone" name="phone" type="tel" autoComplete="tel" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-medical-text outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15" />
              </div>
            </div>
            <div>
              <label htmlFor="contact-topic" className="mb-2 block text-sm font-semibold text-medical-text">What do you need help with?</label>
              <select id="contact-topic" name="topic" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-medical-text outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15">
                <option>Product question</option>
                <option>Order status</option>
                <option>Return or refund</option>
                <option>Rental question</option>
                <option>Other support</option>
              </select>
            </div>
            <div>
              <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-medical-text">Message</label>
              <textarea id="contact-message" name="message" rows={5} required placeholder="Include the product name, quantity, order reference, or question." className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-medical-text outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15" />
            </div>
            <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white hover:bg-medical-dark sm:w-auto">
              <Send size={18} aria-hidden="true" /> Open email draft
            </button>
          </form>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 pb-14 sm:px-6" aria-labelledby="store-location-heading">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">Visit us</p>
              <h2 id="store-location-heading" className="mt-1 text-2xl font-bold text-medical-dark">Find the Baemeds store</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Use the map for directions. Call before visiting to confirm product availability.</p>
            </div>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-medical-primary px-5 py-3 font-bold text-medical-dark hover:bg-medical-light">Open in Google Maps</a>
          </div>
          <iframe
            title="Baemeds store location on Google Maps"
            src={mapsEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full border-0 sm:h-96"
          />
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 shadow-soft">
          <div className="flex gap-3">
            <Building2 className="mt-1 shrink-0 text-medical-primary" size={24} aria-hidden="true" />
            <div>
              <h2 className="text-xl font-bold text-medical-dark">Buying several products?</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Send the product names, quantities, and key details through the bulk-order form.</p>
            </div>
          </div>
          <Link to="/bulk-orders" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-medical-dark px-5 py-3 font-bold text-white hover:bg-medical-primary">
            Request a quotation <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
