import React, { useState } from 'react';
import { Building2, CheckCircle2, FileText, Mail, MessageCircle, PackageCheck, Phone, Send, Trash2, UploadCloud } from 'lucide-react';
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE } from '../constants';
import { Link } from '../context/CartContext';
import { useReveal } from '../lib/useReveal';
import { submitEnquiry } from '../lib/enquiries';

const whatsappNumber = CONTACT_PHONE.replace(/\D/g, '');
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello Baemeds, I need a quote for a bulk medical equipment order.')}`;

const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
];

const BulkOrderPage: React.FC = () => {
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [fileError, setFileError] = useState('');
  const [emailDraftOpened, setEmailDraftOpened] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError('');
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFileError('Choose a file smaller than 10 MB.');
      event.target.value = '';
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setFileError('Choose a PDF, Word, Excel, JPG, or PNG file.');
      event.target.value = '';
      return;
    }

    setAttachedFile({ name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` });
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFileError('');
    const fileInput = document.getElementById('bulk-rfp-file') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const organisation = String(formData.get('organisation') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const location = String(formData.get('location') || '').trim();
    const requirements = String(formData.get('requirements') || '').trim();
    await submitEnquiry({ type: 'bulk', name, email, phone, product: organisation, message: `Delivery location: ${location || 'Not provided'}\n${requirements}${attachedFile ? `\nAttachment selected: ${attachedFile.name} (${attachedFile.size})` : ''}` });
    const attachmentNote = attachedFile
      ? `\nDocument selected on website: ${attachedFile.name} (${attachedFile.size})\nPlease attach this file manually before sending the email.\n`
      : '';
    const subject = encodeURIComponent(`Bulk order quote request: ${organisation}`);
    const body = encodeURIComponent(
      `Baemeds bulk order quote request\n\nName: ${name}\nOrganisation: ${organisation}\nEmail: ${email}\nPhone: ${phone}\nDelivery location: ${location || 'Not provided'}\n${attachmentNote}\nProducts and details:\n${requirements}`,
    );

    setEmailDraftOpened(true);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const fieldClass = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-medical-text outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15';

  const revealRef = useReveal<HTMLElement>();

  return (
    <main ref={revealRef} className="min-h-screen">
      <section className="overflow-hidden bg-medical-dark text-white">
        <div className="container mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-medical-accent">Bulk orders</p>
            <h1 className="mt-3 max-w-2xl text-2xl font-bold leading-tight sm:text-3xl">Build a clearer medical equipment quotation request</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Send the product names, quantities, key details, and delivery city. The {APP_NAME} team will check the list and reply with the next steps.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href={`tel:${CONTACT_PHONE}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-medical-dark hover:bg-slate-100">
                <Phone size={18} aria-hidden="true" /> Call about a bulk order
              </a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-3 font-bold text-white hover:bg-white/10">
                <MessageCircle size={18} aria-hidden="true" /> Start on WhatsApp
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: FileText, title: 'Share your list', text: 'Add product names, quantities, key details, and preferred brands.' },
              { icon: PackageCheck, title: 'We check the details', text: 'We check stock, alternatives, delivery, and any help you may need.' },
              { icon: Building2, title: 'Get the next steps', text: 'Price and order terms are confirmed separately in writing.' },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="flex gap-3">
                  <Icon className="mt-0.5 shrink-0 text-medical-accent" size={21} aria-hidden="true" />
                  <div>
                    <h2 className="font-bold">{title}</h2>
                    <p className="mt-1 text-sm leading-5 text-slate-200">{text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-8">
        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-medical-dark">What to send us</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              {[
                'Product name, model, or important features',
                'Estimated quantity for each product',
                'Delivery location and required timeline',
                'Installation, training, or warranty questions',
                'Organisation and GST billing details if needed',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-medical-primary" size={18} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-medical-light p-5 text-sm leading-6 text-medical-text">
            <p className="font-bold">Need a single product?</p>
            <p className="mt-1">Use the online catalogue when you do not need a formal multi-item quotation.</p>
            <Link to="/products" className="mt-3 inline-flex min-h-11 items-center font-bold text-medical-primary hover:text-medical-dark">Browse products</Link>
          </div>
        </aside>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-8 reveal-on-scroll">
          <h2 className="text-2xl font-bold text-medical-dark">Request a quotation</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">This form opens a pre-filled email draft. Review it, attach any selected document manually, and send it from your email app.</p>

          {emailDraftOpened && (
            <div role="status" className="mt-6 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
              <p>Your email draft was opened. This does not mean the request has been sent yet; review the draft and press send in your email app.</p>
            </div>
          )}

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="bulk-name" className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                <input id="bulk-name" name="name" type="text" autoComplete="name" required className={fieldClass} />
              </div>
              <div>
                <label htmlFor="bulk-organisation" className="mb-2 block text-sm font-semibold text-slate-700">Organisation</label>
                <input id="bulk-organisation" name="organisation" type="text" autoComplete="organization" required className={fieldClass} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="bulk-email" className="mb-2 block text-sm font-semibold text-slate-700">Work email</label>
                <input id="bulk-email" name="email" type="email" autoComplete="email" required className={fieldClass} />
              </div>
              <div>
                <label htmlFor="bulk-phone" className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
                <input id="bulk-phone" name="phone" type="tel" autoComplete="tel" required className={fieldClass} />
              </div>
            </div>

            <div>
              <label htmlFor="bulk-location" className="mb-2 block text-sm font-semibold text-slate-700">Delivery city or location <span className="font-normal text-slate-500">(optional)</span></label>
              <input id="bulk-location" name="location" type="text" autoComplete="address-level2" className={fieldClass} />
            </div>

            <div>
              <label htmlFor="bulk-requirements" className="mb-2 block text-sm font-semibold text-slate-700">Products and details</label>
              <textarea id="bulk-requirements" name="requirements" rows={6} required placeholder="Example: 10 units of [product/model], important features, preferred delivery date, and any help you need." className={`${fieldClass} resize-y`} />
            </div>

            <div>
              <label htmlFor="bulk-rfp-file" className="mb-2 block text-sm font-semibold text-slate-700">Product list or document <span className="font-normal text-slate-500">(optional)</span></label>
              {!attachedFile ? (
                <div className="relative flex min-h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 text-center transition-colors hover:border-medical-primary">
                  <input id="bulk-rfp-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onChange={handleFileChange} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-describedby="bulk-file-help bulk-file-error" />
                  <div>
                    <UploadCloud className="mx-auto text-medical-primary" size={29} aria-hidden="true" />
                    <p className="mt-2 text-sm font-bold text-medical-dark">Choose PDF, Word, Excel, JPG, or PNG</p>
                    <p id="bulk-file-help" className="mt-1 text-xs text-slate-500">Maximum 10 MB. You will attach it manually to the email draft.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-medical-light p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="shrink-0 text-medical-primary" size={22} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-medical-dark">{attachedFile.name}</p>
                      <p className="text-xs text-slate-500">{attachedFile.size} Â· attach manually before sending</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleRemoveFile} aria-label={`Remove ${attachedFile.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-white hover:text-medical-alert">
                    <Trash2 size={19} aria-hidden="true" />
                  </button>
                </div>
              )}
              {fileError && <p id="bulk-file-error" role="alert" className="mt-2 text-sm font-semibold text-medical-alert">{fileError}</p>}
            </div>

            <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white hover:bg-medical-dark sm:w-auto">
              <Send size={18} aria-hidden="true" /> Open quotation email
            </button>
          </form>
        </div>
      </section>

      <section className="bg-white">
        <div className="container mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 sm:grid-cols-3">
          <a href={`tel:${CONTACT_PHONE}`} className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:border-medical-primary hover:bg-medical-light">
            <Phone className="shrink-0 text-medical-primary" size={21} aria-hidden="true" /><span><strong className="block text-sm text-medical-dark">Call</strong><span className="text-xs text-slate-500">{CONTACT_PHONE}</span></span>
          </a>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:border-medical-primary hover:bg-medical-light">
            <MessageCircle className="shrink-0 text-medical-primary" size={21} aria-hidden="true" /><span><strong className="block text-sm text-medical-dark">WhatsApp</strong><span className="text-xs text-slate-500">Send the requirement list</span></span>
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:border-medical-primary hover:bg-medical-light">
            <Mail className="shrink-0 text-medical-primary" size={21} aria-hidden="true" /><span className="min-w-0"><strong className="block text-sm text-medical-dark">Email</strong><span className="block truncate text-xs text-slate-500">{CONTACT_EMAIL}</span></span>
          </a>
        </div>
      </section>
    </main>
  );
};

export default BulkOrderPage;
