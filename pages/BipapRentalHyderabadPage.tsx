import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  HeartPulse,
  HelpCircle,
  Hospital,
  Info,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
  UserCheck,
  Volume2,
  Wind,
  Zap,
} from 'lucide-react';
import { APP_NAME, CONTACT_PHONE, SITE_URL, SUPPORT_EMAIL } from '../constants';
import { Link } from '../context/CartContext';
import SEO from '../components/SEO';
import { formatPrice } from '../lib/marketConfig';

const US_DELIVERY_ZONES = [
  { name: 'Northeast & Mid-Atlantic (NY, NJ, PA, DE, MD, MA)', time: '1–2 Business Days', hub: 'East Coast Distribution Center', landmark: 'Express Delivery via UPS Healthcare' },
  { name: 'Southeast (FL, GA, NC, SC, TN, VA)', time: '1–2 Business Days', hub: 'Atlanta Regional Logistics Center', landmark: 'FedEx Priority Overnight Available' },
  { name: 'Midwest (IL, OH, MI, IN, WI, MN)', time: '2 Business Days', hub: 'Chicago Logistics Hub', landmark: 'Direct Ground & Expedited Air' },
  { name: 'South Central & Texas (TX, OK, LA, AR)', time: '1–2 Business Days', hub: 'Dallas-Fort Worth Freight Center', landmark: 'Next-Day Medical Transit Available' },
  { name: 'Mountain West (CO, UT, AZ, NV, NM)', time: '2 Business Days', hub: 'Denver Regional Terminal', landmark: 'Expedited Temperature-Controlled' },
  { name: 'Pacific Coast & Northwest (CA, WA, OR)', time: '2 Business Days', hub: 'West Coast Distribution Center', landmark: 'Priority Air & Secure Ground' },
];

const BIPAP_MODELS = [
  {
    model: 'ResMed Lumis 150 VPAP ST',
    brand: 'ResMed (FDA Cleared)',
    hcpcs: 'HCPCS E0471 (BiPAP with Backup Rate)',
    modes: 'CPAP, S, T, S/T, PAC, iVAPS (Intelligent Volume-Assured)',
    ipapEpap: 'IPAP: 4–30 cmH2O | EPAP: 2–25 cmH2O',
    features: 'Auto-Trigger, ClimateLineAir Heated Humidifier, Built-in Cellular Modem',
    sound: '26.6 dBA (Ultra-Quiet)',
    idealFor: 'Severe COPD, Type 2 Respiratory Failure, ALS / Motor Neuron Disease, Post-Extubation Stepdown',
    rentalPrice: 225,
    dailyRate: 18,
    buyPrice: 2150,
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'BMC RESmart GII Auto BiPAP (Y30T)',
    brand: 'BMC Medical (Clinical Grade)',
    hcpcs: 'HCPCS E0470 (BiPAP without Backup Rate)',
    modes: 'CPAP, S, T, S/T, Target Tidal Volume (TTV)',
    ipapEpap: 'IPAP: 4–30 cmH2O | EPAP: 4–25 cmH2O',
    features: 'Eco-Smart Humidifier, 3.5-inch Color LCD, Real-time Flow Waveform',
    sound: '28 dBA',
    idealFor: 'Sleep Apnea with Hypercapnia, Moderate COPD, Acute Bronchiectasis, Home Stepdown',
    rentalPrice: 175,
    dailyRate: 14,
    buyPrice: 1450,
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'Philips DreamStation BiPAP Auto',
    brand: 'Philips Respironics (FDA Cleared)',
    hcpcs: 'HCPCS E0470 (Auto-Bilevel)',
    modes: 'Auto-BiPAP, Fixed BiPAP, CPAP',
    ipapEpap: 'IPAP: 4–25 cmH2O | EPAP: 4–25 cmH2O',
    features: 'Auto-Adjusting Pressure, Bi-Flex Comfort, Heated Humidification',
    sound: '27 dBA',
    idealFor: 'Complex Sleep Apnea, OSA intolerant to standard CPAP, Mild-to-moderate respiratory distress',
    rentalPrice: 185,
    dailyRate: 15,
    buyPrice: 1650,
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'ResMed AirSense 10 AutoSet CPAP',
    brand: 'ResMed (FDA Cleared)',
    hcpcs: 'HCPCS E0601 (Continuous Positive Airway Pressure)',
    modes: 'AutoSet CPAP, Fixed CPAP',
    ipapEpap: 'Pressure Range: 4–20 cmH2O',
    features: 'AutoRamp, EPR (Expiratory Pressure Relief), HumidAir heated chamber',
    sound: '26 dBA',
    idealFor: 'Obstructive Sleep Apnea (OSA), Heavy Snoring, Sleep Disordered Breathing',
    rentalPrice: 115,
    dailyRate: 9,
    buyPrice: 895,
    stockStatus: 'Ready for Immediate Dispatch',
  },
];

const FAQS = [
  {
    q: 'How much does it cost to rent a BiPAP machine in the United States?',
    a: 'In the US, home BiPAP machine rentals range from $175 to $225 per month depending on whether you require a standard bilevel unit (HCPCS E0470) or an advanced high-acuity spontaneous/timed ventilator with backup rate (HCPCS E0471, such as ResMed Lumis 150 VPAP ST). BaeMeds provides zero security deposit options, brand new sealed mask kits, heated humidifier chambers, and clinical setup documentation for insurance reimbursement.',
  },
  {
    q: 'What is included in the BiPAP home rental package?',
    a: 'Every BiPAP rental package from BaeMeds includes: (1) Sanitized, calibrated FDA-cleared BiPAP/NIV unit, (2) Heated humidifier chamber, (3) Clean medical air tubing, (4) Brand-new sealed Full-Face or Nasal Mask suited to patient face measurements, (5) Medical-grade power supply and backup intake filters, and (6) Comprehensive titration report and compliance data logging.',
  },
  {
    q: 'How quickly can a BiPAP machine be shipped to my home?',
    a: 'We offer priority expedited shipping across all 50 US states, with overnight air transit available for urgent post-discharge transitions. Equipment is pre-calibrated according to your designated therapy parameters (IPAP, EPAP, backup rate, and rise time).',
  },
  {
    q: 'What is the clinical difference between CPAP and BiPAP machines?',
    a: 'CPAP (Continuous Positive Airway Pressure, HCPCS E0601) delivers a single continuous pressure level throughout inhalation and exhalation, primarily treating Obstructive Sleep Apnea (OSA). BiPAP (Bilevel Positive Airway Pressure, HCPCS E0470/E0471) provides two distinct pressure levels: higher pressure during inhalation (IPAP) to support ventilatory volume, and lower pressure during exhalation (EPAP) for ease of expiration, making it essential for COPD, hypercapnic respiratory failure, and neuromuscular conditions.',
  },
  {
    q: 'Are BiPAP rentals eligible for FSA/HSA and Medicare reimbursement?',
    a: 'Yes. BiPAP machines are classified as Durable Medical Equipment (DME). With itemized clinical documentation, rentals and purchases qualify for tax-free FSA/HSA payment and out-of-pocket insurance claim filing using HCPCS codes E0470 or E0471.',
  },
  {
    q: 'How are pressure settings configured on rental machines?',
    a: 'Every machine is calibrated to your recommended target therapy settings (IPAP/EPAP, backup rate, and rise time) prior to dispatch, ensuring immediate, comfortable therapy right out of the box.',
  },
];

export const BipapRentalHyderabadPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>(BIPAP_MODELS[0].model);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [selectedLocality, setSelectedLocality] = useState<string>(US_DELIVERY_ZONES[0].name);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const cleanPhone = CONTACT_PHONE.replace(/\D/g, '');
  const currentModelData = BIPAP_MODELS.find(m => m.model === selectedModel) || BIPAP_MODELS[0];

  const phoneRentalHref = `tel:${cleanPhone}`;
  const emailRentalHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `BiPAP Rental Inquiry: ${currentModelData.model}`
  )}&body=${encodeURIComponent(
    `Hello BaeMeds Support, I would like to arrange rental of a ${currentModelData.model} for ${durationMonths} month(s) to ${selectedLocality}.`
  )}`;

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'BiPAP Machine Rental & Clinical Guide | ResMed & BMC NIV Devices',
    headline: 'BiPAP Machine Rental: HCPCS E0470/E0471, Specifications & Titration Protocol',
    description: 'Physician-reviewed guide to renting medical BiPAP and CPAP machines across the US. Compare ResMed Lumis 150, BMC Y30T, Philips Auto BiPAP with fast nationwide shipping and FSA/HSA eligibility.',
    url: `${SITE_URL}/guides/bipap-machine-rental-guide`,
    publisher: {
      '@type': 'Organization',
      name: APP_NAME,
      url: SITE_URL,
      telephone: CONTACT_PHONE,
      address: {
        '@type': 'PostalAddress',
        streetAddress: '1209 Orange Street',
        addressLocality: 'Wilmington',
        addressRegion: 'DE',
        postalCode: '19801',
        addressCountry: 'US',
      },
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 antialiased selection:bg-teal-100 selection:text-teal-900">
      <SEO
        title="BiPAP Machine Rental Guide – Rates, HCPCS Codes & Fast US Shipping"
        description="Rent or buy medical BiPAP machines nationwide from $175/mo. ResMed Lumis 150, BMC Y30T, Philips Auto BiPAP. Fast nationwide delivery, FSA/HSA eligible, zero security deposit."
        canonical="/guides/bipap-machine-rental-guide"
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(pageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <a
          href={phoneRentalHref}
          className="flex h-13 items-center gap-2 rounded-full bg-teal-800 px-4 py-2.5 text-xs font-bold text-white shadow-2xl hover:bg-teal-900 active:scale-95 transition"
        >
          <Phone size={18} />
          <span>Call Care Team ({CONTACT_PHONE})</span>
        </a>
      </div>

      <article className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Link to="/" className="hover:text-teal-700">Home</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <Link to="/products?category=BiPAP" className="hover:text-teal-700">Respiratory &amp; DME</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-semibold truncate">BiPAP Machine Rental Guide</span>
        </nav>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-teal-800 border border-teal-200/60 flex items-center gap-1">
            <Wind size={13} /> Non-Invasive Ventilation (NIV) Protocol
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs font-medium text-slate-500">24/7 Biomedical Support</span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            Priority Nationwide US Shipping
          </span>
        </div>

        {/* H1 Title */}
        <h1 className="mt-4 text-3xl font-serif font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[42px] lg:leading-[1.2]">
          BiPAP Machine Rental &amp; Clinical Guide (HCPCS E0470 / E0471 Titration &amp; Setup)
        </h1>

        {/* First 100 Words */}
        <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
            Looking to rent or purchase a hospital-grade <strong>BiPAP machine</strong> in the United States? <strong>BaeMeds</strong> supplies doctor-prescribed non-invasive ventilation (NIV) systems—including the <strong>ResMed Lumis 150 VPAP ST, BMC RESmart GII Y30T, and Philips DreamStation Auto BiPAP</strong>—with priority expedited dispatch across all 50 states. Every BiPAP rental includes a sanitized heated humidifier, brand new sealed mask kit, zero security deposit, and complete compliance data recording for physician review.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600 font-medium">
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>Starting at $175/month</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>Zero Security Deposit</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>FSA &amp; HSA Eligible</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>FDA 510(k) Cleared Hardware</span>
            </div>
          </div>
        </div>

        {/* Quick Action CTAs */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={phoneRentalHref}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-teal-800 py-3.5 px-6 font-bold text-white shadow-md hover:bg-teal-900 transition"
          >
            <Phone size={18} />
            <span>Call Clinical Helpdesk: {CONTACT_PHONE}</span>
          </a>
          <a
            href={emailRentalHref}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 py-3.5 px-6 font-bold text-white shadow-md hover:bg-slate-800 transition"
          >
            <Mail size={18} className="text-teal-400" />
            <span>Email Rx Verification</span>
          </a>
        </div>

        {/* Pricing & Machine Specifications Table */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                BiPAP Machine Rental &amp; Purchase Rates (2026 US DME Standards)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Transparent monthly tariffs for hospital-grade non-invasive ventilators and CPAP devices.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Machine &amp; Brand</th>
                  <th className="py-3.5 px-4">HCPCS Code</th>
                  <th className="py-3.5 px-4">Ventilation Modes</th>
                  <th className="py-3.5 px-4">Pressure Specs</th>
                  <th className="py-3.5 px-4">Monthly Rental</th>
                  <th className="py-3.5 px-4">Outright Buy</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {BIPAP_MODELS.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{item.model}</div>
                      <div className="text-xs text-slate-500">{item.brand}</div>
                      <div className="mt-1 text-[11px] text-teal-700 font-semibold">{item.idealFor}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-700 font-semibold">{item.hcpcs}</td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-800">{item.modes}</td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-600">{item.ipapEpap}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-emerald-700 text-base">{formatPrice(item.rentalPrice)}/mo</div>
                      <div className="text-[11px] text-slate-500">~{formatPrice(item.dailyRate)}/day</div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900">{formatPrice(item.buyPrice)}</td>
                    <td className="py-4 px-4 text-center">
                      <a
                        href={phoneRentalHref}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition shadow-sm"
                      >
                        Rent Now
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Regional Delivery Grid */}
        <section className="mt-12 rounded-2xl bg-teal-950 p-6 sm:p-8 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-teal-300">
                Medical Logistics Network
              </span>
              <h2 className="text-2xl font-serif font-bold text-white mt-1">
                Nationwide Expedited Shipping &amp; Logistics Coverage
              </h2>
            </div>
            <div className="rounded-xl bg-teal-900/80 px-4 py-2 border border-teal-700/50 text-xs">
              <span className="text-emerald-400 font-bold">● Active Dispatch:</span> All 50 US States
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {US_DELIVERY_ZONES.map((loc, idx) => (
              <div key={idx} className="rounded-xl bg-teal-900/50 p-4 border border-teal-800/80 hover:border-teal-600 transition">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-bold">
                  <MapPin size={14} />
                  <span>{loc.name}</span>
                </div>
                <div className="mt-2 text-lg font-bold text-white flex items-center gap-1.5">
                  <Clock size={16} className="text-amber-400" />
                  <span>{loc.time}</span>
                </div>
                <div className="mt-1 text-[11px] text-teal-200/70">{loc.landmark}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Clinical Setup Protocol & Inclusions */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hospital-Grade Disinfection</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Every returned BiPAP machine undergoes complete bacterial HEPA filter replacement, chamber disinfection, and multi-point clinical airflow calibration before redispatch.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <UserCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Physician Order Verification</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Our clinical respiratory specialists verify prescribed IPAP, EPAP, backup respiratory rate, and ramp time parameters to ensure safe, compliant home ventilation therapy.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <Zap size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">24/7 Technical Support</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Our biomedical engineering team provides round-the-clock troubleshooting, replacement assistance, and compliance data downloads for your attending physician.
            </p>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="mt-12">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
            Frequently Asked Questions: BiPAP Machine Rentals
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Detailed clinical and operational guidance for patients, caregivers, and healthcare providers.
          </p>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border transition-all ${
                    isOpen ? 'border-teal-700 bg-white shadow-md' : 'border-slate-200 bg-white/70 hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left font-serif text-base font-bold text-slate-900 sm:text-lg"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition ${isOpen ? 'rotate-180 bg-teal-800 text-white' : ''}`}>
                      ↓
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-sm leading-relaxed text-slate-600 border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Booking CTA Banner */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 p-8 text-center text-white shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold">
            Need Expedited Home Delivery of a BiPAP Machine?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-teal-200 max-w-2xl mx-auto">
            Contact our 24/7 clinical respiratory team now for equipment setup guidance, insurance coding assistance (HCPCS E0470/E0471), and priority dispatch across the United States.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href={phoneRentalHref}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-teal-500 transition"
            >
              <Phone size={18} />
              <span>Call: {CONTACT_PHONE}</span>
            </a>
            <a
              href={emailRentalHref}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-900 shadow-lg hover:bg-slate-100 transition"
            >
              <Mail size={18} className="text-teal-700" />
              <span>Email: {SUPPORT_EMAIL}</span>
            </a>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BipapRentalHyderabadPage;
