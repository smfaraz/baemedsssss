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
  MapPin,
  MessageCircle,
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
  { name: 'LB Nagar & Nagole', time: '75 - 90 mins', hub: 'East Hub', landmark: 'Near Kamineni Hospitals' },
];

const BIPAP_MODELS = [
  {
    model: 'ResMed Lumis 150 VPAP ST',
    brand: 'ResMed (Australia / USA)',
    modes: 'CPAP, S, T, S/T, PAC, iVAPS (Intelligent Volume-Assured)',
    ipapEpap: 'IPAP: 4–30 cmH2O | EPAP: 2–25 cmH2O',
    features: 'Auto-Trigger, ClimateLineAir Heated Humidifier, Built-in Cellular Data',
    sound: '26.6 dBA (Ultra-Quiet)',
    idealFor: 'Severe COPD, Type 2 Respiratory Failure, Motor Neuron Disease (MND/ALS), Post-Extubation ICU stepdown',
    rentalPrice: '₹6,499 / mo',
    dailyRate: '₹400 / day',
    buyPrice: '₹95,000',
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'BMC RESmart GII Auto BiPAP (Y30T)',
    brand: 'BMC Medical (Hospital Standard)',
    modes: 'CPAP, S, T, S/T, Target Tidal Volume (TTV)',
    ipapEpap: 'IPAP: 4–30 cmH2O | EPAP: 4–25 cmH2O',
    features: 'Eco-Smart Humidifier, 3.5-inch Color LCD, Real-time Flow Curve',
    sound: '28 dBA',
    idealFor: 'Sleep Apnea with Hypercapnia, Moderate COPD, Acute Bronchiectasis, Home Convalescence',
    rentalPrice: '₹4,999 / mo',
    dailyRate: '₹300 / day',
    buyPrice: '₹48,000',
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'Philips DreamStation BiPAP Auto',
    brand: 'Philips Respironics',
    modes: 'Auto-BiPAP, Fixed BiPAP, CPAP',
    ipapEpap: 'IPAP: 4–25 cmH2O | EPAP: 4–25 cmH2O',
    features: 'Auto-Adjusting Pressure, Bi-Flex Comfort, Heated Humidification',
    sound: '27 dBA',
    idealFor: 'Complex Sleep Apnea, OSA intolerant to standard CPAP, Mild-to-moderate respiratory distress',
    rentalPrice: '₹5,499 / mo',
    dailyRate: '₹350 / day',
    buyPrice: '₹65,000',
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'ResMed AirSense 10 AutoSet CPAP',
    brand: 'ResMed',
    modes: 'AutoSet CPAP, Fixed CPAP',
    ipapEpap: 'Pressure Range: 4–20 cmH2O',
    features: 'AutoRamp, EPR (Expiratory Pressure Relief), HumidAir heated chamber',
    sound: '26 dBA',
    idealFor: 'Obstructive Sleep Apnea (OSA), Heavy Snoring, Sleep Disordered Breathing',
    rentalPrice: '₹3,499 / mo',
    dailyRate: '₹250 / day',
    buyPrice: '₹44,000',
    stockStatus: 'Ready for Immediate Dispatch',
  },
];

const FAQS = [
  {
    q: 'How much does it cost to rent a BiPAP machine in Hyderabad?',
    a: 'In Hyderabad, BiPAP machine rentals range from ₹4,999 to ₹6,499 per month depending on whether you need a standard S/T unit (like BMC RESmart GII) or an advanced high-acuity AVAPS/iVAPS ventilator (like ResMed Lumis 150). Daily rentals start at ₹300/day. BaeMeds provides zero deposit options, brand new sealed masks, heated humidifier chambers, and on-site clinical pressure calibration.',
  },
  {
    q: 'What is included in the BiPAP machine home rental package?',
    a: 'Every BiPAP rental package from BaeMeds includes: (1) Medical-grade BiPAP/NIV unit, (2) Heated humidifier chamber, (3) Clean air tubing, (4) Brand-new sealed Full-Face or Nasal Mask suited to patient face contours, (5) Power adapter and backup air filters, and (6) Doorstep biomedical technician setup and pressure setting as per your doctor prescription.',
  },
  {
    q: 'How quickly can a BiPAP machine be delivered and configured at home in Hyderabad?',
    a: 'We offer guaranteed 60-to-90-minute emergency delivery across all major Hyderabad micro-markets, including Banjara Hills, Jubilee Hills, Gachibowli, Hitec City, Secunderabad, Kukatpally, and Kondapur. Our trained biomedical team sets IPAP/EPAP, ramp time, and trigger sensitivity in the presence of the family.',
  },
  {
    q: 'What is the difference between CPAP and BiPAP machines?',
    a: 'CPAP (Continuous Positive Airway Pressure) delivers a single continuous pressure level throughout both inhalation and exhalation, primarily treating Obstructive Sleep Apnea (OSA). BiPAP (Bilevel Positive Airway Pressure) provides two distinct pressure levels: higher pressure during inhalation (IPAP) to assist breathing effort, and lower pressure during exhalation (EPAP) for effortless exhalation, making it essential for COPD, respiratory muscle weakness, and elevated CO2 (hypercapnia).',
  },
  {
    q: 'Can a BiPAP machine run on an inverter or UPS during power outages in Hyderabad?',
    a: 'Yes. BiPAP machines typically draw between 60W and 90W (up to 120W with heated humidifier active). They operate smoothly on standard home pure-sine-wave inverters (800VA to 1500VA). For critical post-ICU patients, we also provide dedicated medical UPS systems ensuring 6–8 hours of uninterrupted nocturnal ventilation.',
  },
  {
    q: 'What documents are required to rent a BiPAP machine in Hyderabad?',
    a: 'To rent a BiPAP machine, we require: (1) Pulmonologist or Intensivist prescription specifying machine mode (CPAP/S/ST/AVAPS) and target IPAP/EPAP pressures, and (2) Patient or Caregiver Government ID proof (Aadhaar Card or Driving License) for rental agreement verification.',
  },
];

export const BipapRentalHyderabadPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>(BIPAP_MODELS[0].model);
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [selectedLocality, setSelectedLocality] = useState<string>(HYDERABAD_LOCALITIES[0].name);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const cleanPhone = CONTACT_PHONE.replace(/\D/g, '');
  const currentModelData = BIPAP_MODELS.find(m => m.model === selectedModel) || BIPAP_MODELS[0];

  const whatsappHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello BaeMeds, I want to rent a BiPAP Machine in Hyderabad. Model: ${currentModelData.model}, Locality: ${selectedLocality}, Duration: ${durationMonths} month(s). Please share delivery timing & technician setup details.`
  )}`;

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'BiPAP Machine on Rent & Sale in Hyderabad | ResMed & BMC NIV Rentals',
    headline: 'BiPAP Machine on Rent in Hyderabad - Same-Day Setup, Free Titration & Mask',
    description: 'Looking to rent or buy a BiPAP machine in Hyderabad? Rent ResMed Lumis 150, BMC RESmart GII, Philips Auto BiPAP at ₹4,999/mo with 60-min delivery across Banjara Hills, Gachibowli, and Secunderabad.',
    url: `${SITE_URL}/bipap-machine-on-rent-hyderabad`,
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
        title="BiPAP Machine on Rent in Hyderabad – Same-Day Setup, Low Rates & Free Mask"
        description="Rent or buy medical BiPAP machines in Hyderabad from ₹4,999/mo. ResMed Lumis 150, BMC Y30T, Philips Auto BiPAP. 60-min doorstep setup in Banjara Hills, Hitec City, Jubilee Hills."
        canonical="/bipap-machine-on-rent-hyderabad"
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(pageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Floating WhatsApp Action Button */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-13 items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xl hover:bg-emerald-700 active:scale-95 transition"
        >
          <MessageCircle size={18} />
          <span>Rent BiPAP Machine (60m Setup)</span>
        </a>
      </div>

      <article className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Link to="/" className="hover:text-teal-700">Home</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <Link to="/products?category=BiPAP" className="hover:text-teal-700">BiPAP & CPAP</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-semibold truncate">BiPAP Machine on Rent Hyderabad</span>
        </nav>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-teal-800 border border-teal-200/60 flex items-center gap-1">
            <Wind size={13} /> Non-Invasive Ventilation (NIV) Care
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs font-medium text-slate-500">24/7 Biomedical Support</span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            Same-Day Dispatch Across Hyderabad
          </span>
        </div>

        {/* H1 Title */}
        <h1 className="mt-4 text-3xl font-serif font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[42px] lg:leading-[1.2]">
          BiPAP Machine on Rent &amp; Sale in Hyderabad (Same-Day Doorstep Setup &amp; Titration)
        </h1>

        {/* First 100 Words - Direct Unbranded Intent Formula */}
        <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80">
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
            Looking to rent or buy a <strong>BiPAP machine in Hyderabad</strong>? <strong>BaeMeds</strong> provides hospital-grade, doctor-prescribed non-invasive ventilation (NIV) equipment—including <strong>ResMed Lumis 150 VPAP ST, BMC RESmart GII Y30T, and Philips Auto BiPAP</strong>—with guaranteed same-day 60-to-90 minute delivery across <strong>Banjara Hills, Jubilee Hills, Secunderabad, Gachibowli, Hitec City, Madhapur, and Kukatpally</strong>. Every BiPAP rental comes with a sanitized heated humidifier, brand new sealed mask, zero hidden deposits, and doorstep pressure calibration by certified biomedical engineers.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600 font-medium">
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>Starting ₹4,999/month</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>Zero Security Deposit</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>Free Doorstep Titration &amp; Setup</span>
            </div>
            <div className="flex items-center gap-1.5 text-teal-800">
              <CheckCircle2 size={16} className="text-teal-600" />
              <span>24/7 Replacement Guarantee</span>
            </div>
          </div>
        </div>

        {/* Quick Action CTAs */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 py-3.5 px-6 font-bold text-white shadow-md hover:bg-emerald-700 transition"
          >
            <MessageCircle size={20} />
            <span>Book BiPAP on Rent (WhatsApp)</span>
          </a>
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center justify-center gap-2.5 rounded-xl bg-slate-900 py-3.5 px-6 font-bold text-white shadow-md hover:bg-slate-800 transition"
          >
            <Phone size={20} className="text-teal-400" />
            <span>Call 24/7 Helpline: {CONTACT_PHONE}</span>
          </a>
        </div>

        {/* Pricing & Machine Specifications Table */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                BiPAP Machine Rental &amp; Purchase Rates in Hyderabad (2026)
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Transparent monthly &amp; daily rental tariffs for hospital-grade non-invasive ventilators.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Machine &amp; Brand</th>
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
                    <td className="py-4 px-4 font-mono text-xs text-slate-800">{item.modes}</td>
                    <td className="py-4 px-4 text-xs font-mono text-slate-600">{item.ipapEpap}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-emerald-700 text-base">{item.rentalPrice}</div>
                      <div className="text-[11px] text-slate-500">{item.dailyRate}</div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900">{item.buyPrice}</td>
                    <td className="py-4 px-4 text-center">
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                          `Hello BaeMeds, I want to rent the ${item.model} in Hyderabad. Please confirm stock & delivery.`
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

        {/* Hyper-Local Neighborhood Delivery Grid */}
        <section className="mt-12 rounded-2xl bg-teal-950 p-6 sm:p-8 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-teal-300">
                Rapid Doorstep Medical Logistics
              </span>
              <h2 className="text-2xl font-serif font-bold text-white mt-1">
                Same-Day 60–90 Min Delivery Coverage Across Hyderabad
              </h2>
            </div>
            <div className="rounded-xl bg-teal-900/80 px-4 py-2 border border-teal-700/50 text-xs">
              <span className="text-emerald-400 font-bold">● Active Dispatch:</span> All 6 Twin-City Hubs
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

        {/* Clinical Setup Protocol & Inclusions */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <ShieldCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hospital-Grade Sterilization</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Every returned BiPAP machine undergoes complete bacterial HEPA filter replacement, autoclave humidifier chamber disinfection, and multi-point clinical load testing before redispatch.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <UserCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Biomedical Engineer Setup</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              A trained biomedical technician programs prescribed IPAP, EPAP, backup respiratory rate, and ramp time right in your home and ensures a leak-free mask fit.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800 mb-4">
              <Zap size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">24/7 Equipment Guarantee</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              In the unlikely event of any technical alarm or malfunction, our emergency response team provides immediate on-site replacement within 60 minutes.
            </p>
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="mt-12">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
            Frequently Asked Questions: BiPAP Machine Rentals in Hyderabad
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Detailed clinical and operational guidance for patients, caregivers, and doctors.
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
            Need an Urgent BiPAP Machine at Home in Hyderabad?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-teal-200 max-w-2xl mx-auto">
            Contact our 24/7 clinical respiratory team now. Same-day delivery with trained technician setup in 60 minutes across twin cities.
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

export default BipapRentalHyderabadPage;
