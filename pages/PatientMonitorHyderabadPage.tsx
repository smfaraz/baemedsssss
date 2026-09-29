import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  HeartPulse,
  HelpCircle,
  Hospital,
  Info,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
  UserCheck,
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

const MONITOR_MODELS = [
  {
    model: '5-Parameter ICU Bedside Multipara Monitor',
    brand: 'Contec / Bionet (FDA Cleared)',
    parameters: '5 Parameters: ECG (3/5 Lead), SpO2, NIBP (Blood Pressure), Respiration, Body Temperature',
    display: '12.1-inch High-Resolution Color TFT with Multi-Channel Real-time Waveforms',
    battery: 'Built-in Rechargeable Li-Ion (3–4 Hours Continuous Battery Backup)',
    alarms: 'Audible & Visual Multi-Tier Critical Limit Alarms',
    idealFor: 'Post-ICU Home Transition, Cardiac Stepdown, Stroke Recovery, Post-Surgical Home Care',
    rentalPrice: 120,
    dailyRate: 10,
    buyPrice: 895,
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: '7-Parameter Advanced Cardiac & ICU Monitor',
    brand: 'Mindray / BPL Standard (Hospital Grade)',
    parameters: '7 Parameters: ECG, SpO2, NIBP, Respiration, Dual Temp, Dual IBP & Microstream EtCO2 Ready',
    display: '15-inch Touchscreen Color Display with Trend Data Storage up to 168 Hours',
    battery: 'Heavy-Duty Dual Battery Backup (up to 5 Hours)',
    alarms: 'Arrhythmia & ST Segment Analysis with Priority Audio Warnings',
    idealFor: 'High-Acuity Home ICU, Post-CABG Open Heart Recovery, Ventilator-Dependent Patients',
    rentalPrice: 195,
    dailyRate: 15,
    buyPrice: 1750,
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'Compact Vital Signs Spot-Check Monitor',
    brand: 'Creative Medical / CMS (Portable)',
    parameters: '3 Parameters: SpO2, Rapid Digital NIBP, Pulse Rate & Infrared Temperature',
    display: '7-inch Color LED Screen (Lightweight 3.9 lbs)',
    battery: 'Extended 8-Hour Rechargeable Battery Life',
    alarms: 'Pulse & SpO2 Desaturation Audio Alerts',
    idealFor: 'Elderly Home Care, Daily Routine Vitals Monitoring, Physical Therapy Rehabilitation',
    rentalPrice: 85,
    dailyRate: 7,
    buyPrice: 595,
    stockStatus: 'Ready for Immediate Dispatch',
  },
];

const FAQS = [
  {
    q: 'How much does a patient monitor cost to rent or buy in the United States?',
    a: 'In the US, standard 5-parameter ICU bedside patient monitors rent for approximately $120 per month (or $10/day), while advanced 7-parameter cardiac monitors with invasive pressure or EtCO2 readiness rent for $195 per month. Outright purchases start at $895 for calibrated FDA-cleared units with a 1-year biomedical warranty. BaeMeds offers zero deposit rentals with all patient cables, cuffs, and finger sensors included.',
  },
  {
    q: 'What clinical parameters does a 5-parameter monitor measure?',
    a: 'A standard 5-parameter (5-Para) bedside monitor continuously measures: (1) ECG / Heart Rate with 3/5 lead waveform display and arrhythmia detection, (2) SpO2 (Pulse Oximetry / Oxygen Saturation), (3) NIBP (Non-Invasive Blood Pressure with automatic cycling intervals), (4) Respiration Rate (RESP), and (5) Body Temperature (TEMP).',
  },
  {
    q: 'Are all patient cables, probes, and accessories included with the rental?',
    a: 'Yes. Every monitor rental package includes: (1) Adult/pediatric reusable SpO2 sensor finger probe, (2) Blood pressure cuff with quick-connect air hose, (3) 5-lead ECG patient cable with 30 disposable electrodes, (4) Skin temperature probe, (5) Medical-grade hospital power cord, and (6) Freshly calibrated and sanitized main monitor.',
  },
  {
    q: 'How fast can a patient monitor be delivered to my home?',
    a: 'We provide expedited 1–2 business day delivery across all 50 states, with priority overnight shipping available for urgent hospital stepdown discharges. Each unit is tested and calibrated by biomedical engineers before shipping.',
  },
  {
    q: 'Can the patient monitor operate during power outages?',
    a: 'Yes. All our patient monitors feature integrated lithium-ion backup batteries providing 3 to 5 hours of uninterrupted monitoring during power failures. They automatically recharge when reconnected to any standard 120V US wall outlet.',
  },
];

export const PatientMonitorHyderabadPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>(MONITOR_MODELS[0].model);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [selectedLocality, setSelectedLocality] = useState<string>(US_DELIVERY_ZONES[0].name);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const cleanPhone = CONTACT_PHONE.replace(/\D/g, '');
  const currentModel = MONITOR_MODELS.find(m => m.model === selectedModel) || MONITOR_MODELS[0];

  const phoneRentalHref = `tel:${cleanPhone}`;
  const emailRentalHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Patient Monitor Inquiry: ${currentModel.model}`
  )}&body=${encodeURIComponent(
    `Hello BaeMeds Support, I would like to inquire about renting or purchasing a ${currentModel.model} for ${durationMonths} month(s) to ${selectedLocality}.`
  )}`;

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'ICU Bedside Patient Monitor Rental & Purchase Guide | 5-Para & 7-Para Monitors',
    headline: 'Patient Monitor Rental & Specifications: 5-Parameter & 7-Parameter ICU Vital Signs Equipment',
    description: 'Looking to rent or buy a 5-parameter or 7-parameter patient monitor? BaeMeds provides hospital-grade bedside monitors with SpO2, ECG, NIBP, and fast US nationwide shipping starting at $120/month.',
    url: `${SITE_URL}/guides/patient-monitor-guide`,
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
        title="Patient Monitor Rental & Buy Guide – 5-Para & 7-Para ICU Vital Signs Equipment"
        description="Rent or buy hospital-grade 5-para and 7-para ICU bedside patient monitors nationwide from $120/mo. SpO2, ECG, NIBP, Temp, Resp. Fast nationwide delivery, FSA/HSA eligible."
        canonical="/guides/patient-monitor-guide"
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
          <Link to="/products?category=Monitors" className="hover:text-teal-700">Diagnostic &amp; Monitoring</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-semibold truncate">Patient Monitor Guide</span>
        </nav>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-teal-800 border border-teal-200/60 flex items-center gap-1">
            <Activity size={13} /> Continuous Hemodynamic Monitoring
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs font-medium text-slate-500">Biomedical Certified</span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            Nationwide US Delivery
          </span>
        </div>

        {/* H1 Title */}
        <h1 className="mt-4 text-3xl font-serif font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[42px] lg:leading-[1.2]">
          Multipara Patient Monitor Rental &amp; Purchase Guide (5-Para &amp; 7-Para ICU Bedside Equipment)
        </h1>

        {/* First 100 Words */}
        <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
            Need to rent or purchase a certified <strong>multiparameter patient monitor</strong> for home healthcare or clinical recovery in the United States? <strong>BaeMeds</strong> supplies hospital-grade 5-parameter and 7-parameter bedside monitors with continuous ECG waveform analysis, digital pulse oximetry (SpO2), automated blood pressure cycling (NIBP), respiration, and temperature tracking. Each system comes pre-calibrated with adult and pediatric accessories, full battery backup, and dedicated biomedical support.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600 font-medium">
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>Starting at $120/month</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>Zero Security Deposit</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>All Sensors &amp; Cables Included</span>
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
            <span>Call Helpdesk: {CONTACT_PHONE}</span>
          </a>
          <a
            href={emailRentalHref}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 py-3.5 px-6 font-bold text-white shadow-md hover:bg-slate-800 transition"
          >
            <Mail size={18} className="text-teal-400" />
            <span>Email Clinical Inquiries</span>
          </a>
        </div>

        {/* Pricing & Machine Specifications Table */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                Patient Monitor Rental &amp; Purchase Rates (2026 US Standards)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Transparent monthly tariffs for ICU-grade hemodynamic monitoring equipment.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Monitor &amp; Brand</th>
                  <th className="py-3.5 px-4">Monitored Parameters</th>
                  <th className="py-3.5 px-4">Display &amp; Alarms</th>
                  <th className="py-3.5 px-4">Monthly Rental</th>
                  <th className="py-3.5 px-4">Outright Buy</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MONITOR_MODELS.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{item.model}</div>
                      <div className="text-xs text-slate-500">{item.brand}</div>
                      <div className="mt-1 text-[11px] text-teal-700 font-semibold">{item.idealFor}</div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-800">{item.parameters}</td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      <div>{item.display}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.alarms}</div>
                    </td>
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

        {/* Clinical Assurance */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Multi-Point Calibration</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Every patient monitor undergoes complete electrical safety testing, ECG simulator calibration, and NIBP transducer leak testing before dispatch.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <UserCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Complete Cable Kits</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Rentals arrive with clean, disinfected patient interfaces: adult and pediatric cuffs, reusable SpO2 sensors, 5-lead ECG trunk cables, and skin temperature probes.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <Zap size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">24/7 Biomedical Support</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Our clinical equipment specialists provide phone guidance for setting patient alarm limits, configuring cycle intervals, and interpreting hemodynamic waveforms.
            </p>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="mt-12">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
            Frequently Asked Questions: Bedside Patient Monitors
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Detailed clinical guidance for healthcare professionals, patients, and family caregivers.
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
            Need an ICU Patient Monitor for Home Recovery?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-teal-200 max-w-2xl mx-auto">
            Contact our biomedical support desk now for expedited dispatch, sensor sizing assistance, and nationwide delivery.
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

export default PatientMonitorHyderabadPage;
