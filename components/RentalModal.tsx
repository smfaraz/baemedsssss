import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Mail, Phone, Send, X } from 'lucide-react';
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE } from '../constants';
import { formatPrice } from '../lib/marketConfig';
import { Product } from '../types';
import { submitEnquiry } from '../lib/enquiries';

interface RentalModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const RentalModal: React.FC<RentalModalProps> = ({ product, isOpen, onClose }) => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', duration: '1 month', message: '' });
  const [emailDraftOpened, setEmailDraftOpened] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedPrice = formatPrice(product.price);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    const subject = encodeURIComponent(`Rental enquiry: ${product.title}`);
    const body = encodeURIComponent(
      `BaeMeds US rental enquiry\n\nProduct: ${product.title}\nListed product price: ${formattedPrice}\nName: ${formData.name}\nPhone: ${formData.phone}\nEmail: ${formData.email}\nRequested duration: ${formData.duration}\n\nMessage:\n${formData.message || 'No additional message'}`,
    );

    try {
      await submitEnquiry({ type: 'rental', product: product.title, name: formData.name, phone: formData.phone, email: formData.email, duration: formData.duration, message: formData.message || 'No additional message' });
      setSubmitted(true);
      setEmailDraftOpened(true);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    } catch (error) {
      console.error('Rental enquiry could not be saved', error);
      setSubmitError('We could not save your enquiry. Please try again or contact us directly.');
    }
  };

  const closeAndReset = () => {
    setEmailDraftOpened(false);
    setSubmitted(false);
    setSubmitError('');
    onClose();
  };

  const fieldClass = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-medical-primary';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAndReset();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="rental-modal-title"
        aria-describedby="rental-modal-description"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl reveal-up"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-medical-dark p-5 text-white sm:p-6">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-medical-accent">
              <Calendar size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="rental-modal-title" className="text-xl font-bold">Rental enquiry</h2>
              <p id="rental-modal-description" className="mt-1 line-clamp-2 text-sm leading-5 text-slate-200">Ask about rental availability and terms for {product.title}.</p>
            </div>
          </div>
          <button type="button" onClick={closeAndReset} aria-label="Close rental enquiry" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white hover:bg-white/10">
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-medical-primary">Selected product</p>
            <p className="mt-1 font-bold text-medical-text">{product.title}</p>
            <p className="mt-1 text-sm text-slate-600">Listed purchase price: {formattedPrice}. Rental price and availability require confirmation.</p>
          </div>

          {submitError && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">{submitError}</p>}

          {emailDraftOpened && (
            <div role="status" className="mt-5 rounded-2xl border border-medical-light bg-medical-light p-4">
              <div className="flex gap-3 text-sm leading-6 text-medical-dark">
                <CheckCircle2 className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
                <p>{submitted ? 'Your rental enquiry was saved successfully. An email draft was also opened for convenience.' : 'Your email draft was opened. Review it and press send in your email app.'}</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-primary px-4 py-3 text-sm font-bold text-white hover:bg-medical-dark">
                  <Mail size={17} aria-hidden="true" /> Email Support
                </a>
                <a href={`tel:${CONTACT_PHONE}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-medical-primary/40 bg-white px-4 py-3 text-sm font-bold text-medical-dark hover:border-medical-primary">
                  <Phone size={17} aria-hidden="true" /> Call
                </a>
                <button type="button" onClick={closeAndReset} className="min-h-11 rounded-xl border border-medical-primary/40 bg-white px-4 py-3 text-sm font-bold text-medical-dark hover:border-medical-primary">Close</button>
              </div>
            </div>
          )}

          {!emailDraftOpened && (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rental-name" className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                  <input id="rental-name" required type="text" autoComplete="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="rental-phone" className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
                  <input id="rental-phone" required type="tel" autoComplete="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} className={fieldClass} />
                </div>
              </div>

              <div>
                <label htmlFor="rental-email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                <input id="rental-email" required type="email" autoComplete="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className={fieldClass} />
              </div>

              <div>
                <label htmlFor="rental-duration" className="mb-2 block text-sm font-semibold text-slate-700">Preferred rental duration</label>
                <select id="rental-duration" value={formData.duration} onChange={(event) => setFormData({ ...formData, duration: event.target.value })} className={fieldClass}>
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months or more">6 months or more</option>
                </select>
              </div>

              <div>
                <label htmlFor="rental-message" className="mb-2 block text-sm font-semibold text-slate-700">Additional requirements <span className="font-normal text-slate-500">(optional)</span></label>
                <textarea id="rental-message" rows={3} value={formData.message} onChange={(event) => setFormData({ ...formData, message: event.target.value })} placeholder="Delivery location, required date, or questions about accessories." className={`${fieldClass} resize-y`} />
              </div>

              <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white hover:bg-medical-dark">
                <Send size={18} aria-hidden="true" /> Open rental email
              </button>
              <p className="text-center text-xs leading-5 text-slate-500">
                This opens a draft addressed to {CONTACT_EMAIL}. Rental price, stock, deposit, delivery, and terms are confirmed separately by {APP_NAME}.
              </p>
            </form>
          )}

          {!emailDraftOpened && (
            <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <a href={`tel:${CONTACT_PHONE.replace(/[^\d+]/g, '')}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-medical-text hover:border-medical-primary">
                <Phone size={17} aria-hidden="true" /> Call {CONTACT_PHONE}
              </a>
              <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Rental question: ${product.title}`)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-medical-text hover:border-medical-primary">
                <Mail size={17} aria-hidden="true" /> Email directly
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RentalModal;
