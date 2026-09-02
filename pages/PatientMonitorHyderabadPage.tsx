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
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
  UserCheck,
  Zap,
} from 'lucide-react';
import { APP_NAME, CONTACT_PHONE, SITE_URL } from '../constants';
import { Link } from '../context/CartContext';
import SEO from '../components/SEO';

const HYDERABAD_LOCALITIES = [
  { name: 'Banjara Hills & Jubilee Hills', time: '45 - 60 mins', hub: 'Central Dispatch Hub', landmark: 'Near Apollo & Care Hospitals' },
  { name: 'Gachibowli & Hitec City', time: '60 - 75 mins', hub: 'Cyberabad West Hub', landmark: 'Near AIG Hospitals & Financial District' },
  { name: 'Madhapur & Kondapur', time: '60 - 75 mins', hub: 'Cyberabad West Hub', landmark: 'Near Medicover Hospitals' },
  { name: 'Kukatpally & Miyapur', time: '60 - 90 mins', hub: 'North-West Hub', landmark: 'Near KIMS & Omni Hospitals' },
  { name: 'Secunderabad & Begumpet', time: '45 - 60 mins', hub: 'Secunderabad Hub', landmark: 'Near KIMS & Sunshine Hospitals' },
  { name: 'Mehdipatnam & Tolichowki', time: '45 - 60 mins', hub: 'Central Dispatch Hub', landmark: 'Near Olive & Premier Hospitals' },
  { name: 'Malakpet & Dilsukhnagar', time: '60 - 90 mins', hub: 'East Hub', landmark: 'Near Yashoda Malakpet' },
  { name: 'LB Nagar & Uppal', time: '75 - 90 mins', hub: 'East Hub', landmark: 'Near Kamineni Hospitals' },
];

const MONITOR_MODELS = [
  {
    model: '5-Para ICU Multipara Patient Monitor',
    brand: 'Contec / Bionet / Niscomed',
    parameters: '5 Parameters: ECG (3/5 Lead), SpO2, NIBP (Blood Pressure), Respiration, Temperature',
    display: '12.1-inch High-Resolution Color TFT with Multi-Channel Waveforms',
    battery: 'Built-in Rechargeable Li-Ion (3-4 Hours Continuous Backup)',
    alarms: 'Audible & Visual High/Low Critical Limit Alarms',
    idealFor: 'Post-ICU Home Transition, Cardiac Care, Stroke Recovery, Post-Surgical Stepdown',
    rentalPrice: '₹3,499 / mo',
    dailyRate: '₹250 / day',
    buyPrice: '₹24,500',
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: '7-Para Advanced ICU Cardiac Monitor (with Dual IBP & EtCO2 Ready)',
    brand: 'BPL Medical / Mindray Standard',
    parameters: '7 Parameters: ECG, SpO2, NIBP, Respiration, Dual Temp, Dual IBP & Microstream EtCO2',
    display: '15-inch Touchscreen Color Display with Trend Storage up to 168 Hours',
    battery: 'Heavy-Duty Dual Battery Backup (up to 5 Hours)',
    alarms: 'Arrhythmia & ST Segment Analysis with Multi-Tier Alarm Priority',
    idealFor: 'Critical ICU Home Setups, Post-CABG / Open Heart Surgery, Ventilator-Dependent Patients',
    rentalPrice: '₹5,999 / mo',
    dailyRate: '₹350 / day',
    buyPrice: '₹58,000',
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'Compact Vital Signs Spot-Check Monitor',
    brand: 'Creative Medical / Contec CMS',
    parameters: '3 Parameters: SpO2, Rapid Digital NIBP, Pulse Rate & Infrared Temp',
    display: '7-inch Color LED Screen (Ultra-Lightweight 1.8 kg)',
    battery: 'Extended 8-Hour Battery Life',
    alarms: 'Quick Pulse & SpO2 Desaturation Audio Alerts',
    idealFor: 'Elderly Home Care, Daily Routine Vitals Monitoring, Physiotherapy Clinics',
    rentalPrice: '₹2,499 / mo',
    dailyRate: '₹180 / day',
    buyPrice: '₹16,500',
    stockStatus: 'Ready for Immediate Dispatch',
  },
];

const FAQS = [
  {
    q: 'How much does a patient monitor cost to rent or buy in Hyderabad?',
    a: 'In Hyderabad, standard 5-parameter ICU patient monitors rent for ₹3,499 per month (or ₹250/day), while advanced 7-parameter cardiac monitors rent for ₹5,999 per month. For outright purchase, 5-para monitors start at ₹24,500 with a 1-year on-site biomedical warranty. BaeMeds provides zero deposit rentals with all patient cables, cuffs, and probes included.',
  },
  {
    q: 'What parameters does a 5-parameter patient monitor measure?',
    a: 'A standard 5-parameter (5-Para) patient monitor continuously measures: (1) ECG / Heart Rate with 3/5 lead waveform display, (2) SpO2 (Pulse Oximetry / Oxygen Saturation), (3) NIBP (Non-Invasive Blood Pressure with automatic cycling intervals), (4) Respiration Rate (RESP), and (5) Body Temperature (TEMP).',
  },
  {
    q: 'Are all cables, probes, and accessories included with the rental in Hyderabad?',
    a: 'Yes. Every monitor rental package includes: (1) Reusable adult/pediatric SpO2 sensor finger probe, (2) NIBP cuff with extension hose, (3) 5-lead ECG cable with 30 disposable snap electrodes, (4) Skin temperature probe, (5) Medical-grade power cord, and (6) Freshly calibrated main unit.',
  },
  {
    q: 'How fast can an ICU patient monitor be delivered to my home in Hyderabad?',
    a: 'We guarantee 60-to-90-minute delivery across Hyderabad (including Banjara Hills, Jubilee Hills, Gachibowli, Secunderabad, Kukatpally, Tolichowki, and Kondapur). A certified biomedical technician sets up the monitor, connects the patient, tests alarm thresholds, and trains family caregivers on reading vitals.',
  },
  {
    q: 'Can the patient monitor run without mains electricity during power cuts?',
    a: 'Yes. All our patient monitors feature integrated lithium-ion backup batteries providing 3 to 5 hours of continuous monitoring during power interruptions. They also recharge automatically when plugged into a standard home inverter or AC wall socket.',
  },
];

export const PatientMonitorHyderabadPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>(MONITOR_MODELS[0].model);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [selectedLocality, setSelectedLocality] = useState<string>(HYDERABAD_LOCALITIES[0].name);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const cleanPhone = CONTACT_PHONE.replace(/\D/g, '');
  const currentModel = MONITOR_MODELS.find(m => m.model === selectedModel) || MONITOR_MODELS[0];

  const whatsappHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello BaeMeds, I want to inquire about Multipara Patient Monitor Rental & Sale in Hyderabad. Model: ${currentModel.model}, Locality: ${selectedLocality}, Duration: ${durationMonths} month(s). Please share availability and immediate setup timing.`
  )}`;

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'Multipara Patient Monitor Price & Rental in Hyderabad | 5-Para & 7-Para ICU Monitors',
    headline: 'Multipara Patient Monitor Price & Rental in Hyderabad (5-Para / 7-Para ICU Bedside Monitors)',
    description: 'Looking to rent or buy a 5-parameter or 7-parameter patient monitor in Hyderabad? BaeMeds provides ICU-grade monitors with SpO2, ECG, NIBP, and 24/7 technician doorstep setup starting ₹3,499/month.',
    url: `${SITE_URL}/patient-monitor-price-hyderabad`,
    publisher: {
      '@type': 'Organization',
      name: APP_NAME,
      url: SITE_URL,
      telephone: CONTACT_PHONE,
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
        title="Multipara Patient Monitor Price & Rental Hyderabad (5-Para ICU Monitors)"
        description="Rent or buy 5-para & 7-para ICU patient monitors in Hyderabad from ₹3,499/mo or ₹24,500 buy. SpO2, ECG, NIBP, Temp, Resp. 60-min delivery in Banjara Hills, Gachibowli, Secunderabad."
        canonical="/patient-monitor-price-hyderabad"
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(pageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Floating Action Button */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-13 items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xl hover:bg-emerald-700 active:scale-95 transition"
        >
          <MessageCircle size={18} />
          <span>Rent Patient Monitor (60m Setup)</span>
        </a>
      </div>

      <article className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Link to="/" className="hover:text-teal-700">Home</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <Link to="/products?category=Patient%20Monitor" className="hover:text-teal-700">Patient Monitors</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-semibold truncate">Patient Monitor Price Hyderabad</span>
        </nav>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-teal-800 border border-teal-200/60 flex items-center gap-1">
            <Activity size={13} /> ICU Bedside Vital Signs Monitoring
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs font-medium text-slate-500">Biomedically Calibrated</span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            Same-Day Dispatch Hyderabad
          </span>
        </div>

        {/* H1 Title */}
        <h1 className="mt-4 text-3xl font-serif font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[42px] lg:leading-[1.2]">
          Multipara Patient Monitor Price &amp; Rental in Hyderabad (5-Para / 7-Para ICU Monitors)
        </h1>

        {/* First 100 Words - Direct Keyword Intent Formula */}
        <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
            Looking to rent or buy a <strong>5-parameter or 7-parameter Multipara Patient Monitor in Hyderabad</strong>? <strong>BaeMeds</strong> provides hospital-grade bedside cardiac and vital signs monitors (measuring <strong>SpO2, ECG, NIBP, Respiration, and Temperature</strong>) with guaranteed same-day 60-to-90 minute delivery across <strong>Banjara Hills, Jubilee Hills, Secunderabad, Gachibowli, Hitec City, Kondapur, and Kukatpally</strong>. Every monitor comes pre-calibrated with all adult/pediatric cables, rechargeable battery backup, zero security deposit, and free on-site biomedical technician setup.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600 font-medium">
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>Rental: ₹3,499/mo | Buy: ₹24,500</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>Zero Security Deposit</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>All Probes &amp; Cuffs Included</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>Doorstep Technician Setup</span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 py-3.5 px-6 font-bold text-white shadow-md hover:bg-emerald-700 transition"
          >
            <MessageCircle size={20} />
            <span>Book Patient Monitor (WhatsApp)</span>
          </a>
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 py-3.5 px-6 font-bold text-white shadow-md hover:bg-slate-800 transition"
          >
            <Phone size={20} className="text-teal-400" />
            <span>Call 24/7 Helpline: {CONTACT_PHONE}</span>
          </a>
        </div>

        {/* Pricing & Comparison Table */}
        <section className="mt-12">
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Multipara Patient Monitor Pricing &amp; Specification Comparison (Hyderabad)
          </h2>
          <p className="text-sm text-slate-600 mt-1 mb-4">
            Compare rental vs purchase costs for 5-Para and 7-Para ICU bedside vital monitors.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Monitor Model</th>
                  <th className="py-3.5 px-4">Monitored Parameters</th>
                  <th className="py-3.5 px-4">Display &amp; Battery</th>
                  <th className="py-3.5 px-4">Monthly Rental</th>
                  <th className="py-3.5 px-4">Outright Buy</th>
                  <th className="py-3.5 px-4 text-center">Order</th>
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
                    <td className="py-4 px-4 text-xs font-mono text-slate-700">{item.parameters}</td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      <div>{item.display}</div>
                      <div className="text-emerald-700 font-medium mt-0.5">{item.battery}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-emerald-700 text-base">{item.rentalPrice}</div>
                      <div className="text-[11px] text-slate-500">{item.dailyRate}</div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900">{item.buyPrice}</td>
                    <td className="py-4 px-4 text-center">
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Hello BaeMeds, I want to book the ${item.model} in Hyderabad. Please confirm stock.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
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

        {/* Hyper-Local Neighborhood Grid */}
        <section className="mt-12 rounded-2xl bg-teal-950 p-6 sm:p-8 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-teal-300">
                Rapid ICU Equipment Dispatch
              </span>
              <h2 className="text-2xl font-serif font-bold text-white mt-1">
                60–90 Min Emergency Delivery Coverage Across Hyderabad
              </h2>
            </div>
            <div className="rounded-xl bg-teal-900/80 px-4 py-2 border border-teal-700/50 text-xs">
              <span className="text-emerald-400 font-bold">● Active Dispatch:</span> Central, West &amp; Secunderabad Hubs
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HYDERABAD_LOCALITIES.map((loc, idx) => (
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

        {/* Clinical Value Highlights */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Pre-Calibrated Accuracy</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Every unit is tested with digital medical calibrators to ensure 99.5% accuracy on NIBP, SpO2 sensor waveform, and ECG lead noise suppression.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <UserCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Doorstep Technician Onboarding</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Our biomedical engineer demonstrates how to attach ECG electrodes, place the NIBP cuff correctly, set custom alarm ranges, and interpret vitals.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <Zap size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Instant Accessory Replacement</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Need extra ECG electrodes, infant/pediatric probes, or replacement cuffs? Our local hubs deliver spare consumables within 60 minutes.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
            Frequently Asked Questions: Patient Monitor Rentals in Hyderabad
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Everything you need to know about pricing, parameter options, and home setup.
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

        {/* Bottom Banner */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 p-8 text-center text-white shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold">
            Need an ICU Multipara Patient Monitor in Hyderabad Today?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-teal-200 max-w-2xl mx-auto">
            Book now for guaranteed same-day doorstep setup with all cables and accessories. Call or WhatsApp our 24/7 biomedical support desk.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-emerald-500 transition"
            >
              <MessageCircle size={20} />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-900 shadow-lg hover:bg-slate-100 transition"
            >
              <Phone size={20} className="text-teal-700" />
              <span>Call: {CONTACT_PHONE}</span>
            </a>
          </div>
        </div>
      </article>
    </div>
  );
};

export default PatientMonitorHyderabadPage;
