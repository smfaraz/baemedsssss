import React from 'react';
import { FileText, Headphones, PackageSearch, Truck } from 'lucide-react';

const badges = [
  { icon: PackageSearch, title: 'DME & Clinical Supplies', description: 'Certified respiratory, diagnostic monitors, mobility, and medical consumables', color: 'bg-sky-100 text-sky-700' },
  { icon: Headphones, title: 'US Clinical Support', description: 'Toll-free customer assistance for product specs, compatibility, and ordering', color: 'bg-emerald-100 text-emerald-700' },
  { icon: Truck, title: 'Nationwide US Delivery', description: 'Tracked shipping via USPS, UPS & FedEx with free ground on orders $99+', color: 'bg-violet-100 text-violet-700' },
  { icon: FileText, title: 'FSA / HSA Eligible Receipts', description: 'Itemized medical receipts with HCPCS codes for reimbursement', color: 'bg-amber-100 text-amber-700' },
];

const marqueeItems = [
  'Nationwide US Shipping',
  'FSA / HSA Eligible Invoices',
  'FDA-Compliant Medical DME',
  'US Clinical & Technical Support',
  'Hospital & Clinic Procurement',
  'Fast Ground & Overnight Delivery',
];

const TrustBadges: React.FC = () => {
  return (
    <section aria-label="Store support information" className="border-b border-slate-200 bg-medical-light/60">
      <div className="marquee-track overflow-hidden border-b border-slate-200 bg-medical-dark py-2.5" aria-hidden="true">
        <div className="marquee">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span key={index} className="mx-6 flex items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-[0.14em] text-white/85">
              <span className="h-1.5 w-1.5 rounded-full bg-medical-accent" />
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map(({ icon: Icon, title, description, color }) => (
            <article key={title} className="motion-lift flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-medical-text">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
