import React, { useState, useId } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Droplets,
  ExternalLink,
  Flame,
  Gauge,
  HeartHandshake,
  HelpCircle,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
  Users,
  Zap,
} from 'lucide-react';
import { APP_NAME, CONTACT_PHONE, SITE_URL } from '../constants';
import { Link } from '../context/CartContext';
import SEO from '../components/SEO';

const HYDERABAD_LOCALITIES = [
  { name: 'Banjara Hills & Jubilee Hills', time: '45 - 60 mins', hub: 'Central Hub' },
  { name: 'Gachibowli & Hitec City', time: '60 - 90 mins', hub: 'Cyberabad Hub' },
  { name: 'Madhapur & Kondapur', time: '60 - 90 mins', hub: 'West Hub' },
  { name: 'Kukatpally & Miyapur', time: '60 - 90 mins', hub: 'North-West Hub' },
  { name: 'Secunderabad & Begumpet', time: '45 - 60 mins', hub: 'Secunderabad Hub' },
  { name: 'Mehdipatnam & Tolichowki', time: '45 - 60 mins', hub: 'Central Hub' },
  { name: 'Malakpet & Dilsukhnagar', time: '60 - 90 mins', hub: 'East Hub' },
  { name: 'LB Nagar & Nagole', time: '75 - 100 mins', hub: 'East Hub' },
  { name: 'Uppal & Tarnaka', time: '60 - 90 mins', hub: 'North-East Hub' },
  { name: 'Attapur & Rajendranagar', time: '60 - 90 mins', hub: 'South Hub' },
];

const RECOMMENDED_MODELS = [
  {
    name: 'Oxymed Mini 5L Oxygen Concentrator',
    badge: 'Most Popular for Home Care',
    flow: '1 - 5 LPM',
    purity: '93% ± 3% (Continuous)',
    weight: '13.9 kg (Compact & Portable)',
    noise: '< 45 dB (Whisper Quiet)',
    buyPrice: '₹35,000',
    rentPrice: '₹3,499 / month',
    handle: 'oxygen-concentrator-oxymed-mini-5lpm-for-sale',
    description: 'Ultra-compact medical concentrator with built-in digital purity monitor and low oxygen alarm.',
  },
  {
    name: 'Philips EverFlow 5L Concentrator',
    badge: 'Hospital Gold Standard',
    flow: '0.5 - 5 LPM',
    purity: '93% ± 3%',
    weight: '14.0 kg',
    noise: '< 43 dB',
    buyPrice: '₹52,000',
    rentPrice: '₹4,499 / month',
    handle: 'philips-everflow-oxygen-concentrator-5-lpm',
    description: 'Renowned worldwide for robust 24/7 continuous operation and low maintenance molecular sieve.',
  },
  {
    name: 'Evox 5S 5 LPM Oxygen Unit',
    badge: 'Best Value for Money',
    flow: '1 - 5 LPM',
    purity: '93% ± 3%',
    weight: '15.0 kg',
    noise: '< 45 dB',
    buyPrice: '₹33,000',
    rentPrice: '₹3,200 / month',
    handle: 'evox-5s-5lpm-oxygen-concentrator',
    description: 'Equipped with digital hour meter, nebulization port, and rugged casters for easy bedside transport.',
  },
  {
    name: 'Oxymed 10L High-Flow Concentrator',
    badge: 'High-Flow ICU & Dual Output',
    flow: '1 - 10 LPM (Dual Patient)',
    purity: '93% ± 3% at full 10 LPM',
    weight: '24.0 kg',
    noise: '< 50 dB',
    buyPrice: '₹68,000',
    rentPrice: '₹6,499 / month',
    handle: 'oxygen-concentrator-oxymed-10lpm',
    description: 'Dual-flow splitter capable of serving two patients simultaneously or single high-flow ICU needs.',
  },
];

const FAQS = [
  {
    q: 'How much does it cost to rent an oxygen concentrator in Hyderabad?',
    a: 'In Hyderabad, a certified 5 LPM medical oxygen concentrator typically costs between ₹3,200 to ₹4,500 per month on rental, while a high-flow 10 LPM machine costs between ₹5,500 to ₹7,000 per month. At BaeMeds, all rentals include doorstep delivery, installation, a free sterile nasal cannula, and a 24/7 standby replacement guarantee.',
  },
  {
    q: 'How fast can BaeMeds deliver an oxygen concentrator to my home in Hyderabad?',
    a: 'We provide express 60 to 90-minute emergency delivery across major Hyderabad areas (Banjara Hills, Jubilee Hills, Gachibowli, Hitec City, Madhapur, Kukatpally, Secunderabad, Mehdipatnam, etc.). A trained biomedical technician delivers the unit, tests oxygen purity on-site with an analyzer, and demonstrates operation to the caregiver.',
  },
  {
    q: 'Should I rent or buy an oxygen concentrator for my family member?',
    a: 'If the patient is recovering from an acute respiratory illness, post-surgery, pneumonia, or temporary post-COVID lung weakness (expected recovery under 3 to 6 months), renting is significantly more cost-effective (saving ₹25,000 to ₹45,000). If the patient has chronic long-term conditions like advanced COPD or pulmonary fibrosis requiring lifelong therapy, purchasing a machine with a 2 to 3-year warranty is recommended.',
  },
  {
    q: 'How is an oxygen concentrator different from an oxygen cylinder?',
    a: 'An oxygen cylinder stores a finite amount of compressed gas (a standard 46.7L D-type cylinder lasts only 5 to 7 hours at 4 LPM and requires heavy logistics and frequent refilling). An oxygen concentrator generates an endless supply of medical-grade 93% pure oxygen directly from ambient air by plugging into a regular electrical wall socket.',
  },
  {
    q: 'What water should be used in the humidifier bottle?',
    a: 'Always use distilled water, demineralized (DM) water, or clean RO/bottled drinking water. Never use regular tap water or unboiled well water, as mineral deposits (limescale) will clog the oxygen diffuser outlet and harbor bacterial growth.',
  },
  {
    q: 'What happens if there is a power cut during oxygen therapy at home?',
    a: 'Oxygen concentrators consume between 280W to 400W of electricity. They can be seamlessly powered by a 1kVA to 1.5kVA home inverter/UPS system or a portable emergency battery generator. For high-flow ICU patients, we also advise keeping a small backup cylinder for severe power outage contingencies.',
  },
];

export const OxygenRentalGuidePage: React.FC = () => {
  // Calculator state
  const [flowRate, setFlowRate] = useState<number>(3);
  const [dailyHours, setDailyHours] = useState<number>(12);
  const [durationMonths, setDurationMonths] = useState<number>(2);
  const [selectedLocality, setSelectedLocality] = useState<string>(HYDERABAD_LOCALITIES[0].name);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Math calculations
  const isHighFlow = flowRate > 5;
  const recommendedMachineType = isHighFlow ? '10 LPM High-Flow Unit' : '5 LPM Medical Concentrator';
  const monthlyRental = isHighFlow ? 6499 : 3499;
  const totalRentalCost = monthlyRental * durationMonths;
  const estimatedBuyCost = isHighFlow ? 68000 : 35000;
  const savings = estimatedBuyCost - totalRentalCost;
  const shouldRent = savings > 0 && durationMonths <= 6;

  // Approximate power cost (300W * dailyHours * 30 days / 1000 * ₹7/unit)
  const monthlyElectricityINR = Math.round(((isHighFlow ? 550 : 320) * dailyHours * 30) / 1000 * 7.5);

  const cleanPhone = CONTACT_PHONE.replace(/\D/g, '');
  const whatsappRentalHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello BaeMeds, I want to rent an oxygen concentrator in Hyderabad. Requirement: ${flowRate} LPM for ${dailyHours} hrs/day in ${selectedLocality}. Please confirm delivery time and quote.`
  )}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'Oxygen Concentrator Rental in Hyderabad: The Complete Caregiver Guide',
    headline: 'Oxygen Concentrator Rental in Hyderabad: 5L vs 10L Guide, Pricing & Same-Day Setup',
    description: 'Comprehensive 2026 medical guide for renting and operating hospital-grade oxygen concentrators in Hyderabad. Compare 5L vs 10L machines, calculate rental savings, and book 90-minute express doorstep delivery.',
    url: `${SITE_URL}/guides/oxygen-concentrator-rental-hyderabad`,
    image: `${SITE_URL}/baemeds-social-preview.jpg`,
    datePublished: '2026-01-15T09:00:00+05:30',
    dateModified: '2026-08-19T12:00:00+05:30',
    author: {
      '@type': 'MedicalBusiness',
      name: 'BaeMeds Biomedical Team',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/baemeds-social-preview.jpg`,
      },
    },
    about: [
      {
        '@type': 'MedicalDevice',
        name: 'Oxygen Concentrator',
        purpose: 'Supplemental Oxygen Therapy for Hypoxemia, COPD, and Post-Operative Respiratory Care',
      },
    ],
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
    <article className="min-h-screen bg-slate-50 text-slate-900 selection:bg-medical-primary selection:text-white">
      <SEO
        title="Oxygen Concentrator Rental in Hyderabad (5L & 10L) – Express Home Delivery"
        description="Rent certified 5L & 10L oxygen concentrators in Hyderabad from ₹3,200/mo. Express 60-90 min home delivery, free on-site purity testing, and zero security deposit options."
        canonical="/guides/oxygen-concentrator-rental-hyderabad"
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumbs" className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex min-h-12 items-center gap-1.5 px-4 text-xs font-medium text-slate-500 sm:text-sm">
          <Link to="/" className="hover:text-medical-primary">Home</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <Link to="/products?category=Oxygen%20Concentrator" className="hover:text-medical-primary">Oxygen Equipment</Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="truncate text-slate-800 font-semibold" aria-current="page">Oxygen Concentrator Rental Guide</span>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 py-12 text-white sm:py-16 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]" />
        
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold text-sky-300 backdrop-blur sm:text-sm">
              <Sparkles size={14} className="animate-pulse text-sky-400" />
              <span>Hyderabad DME Caregiver Guide &bull; 2026 Edition</span>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Oxygen Concentrator Rental in Hyderabad: <span className="bg-gradient-to-r from-sky-400 to-teal-300 bg-clip-text text-transparent">Complete Patient & Caregiver Guide</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base lg:text-lg">
              Everything you need to know about renting certified 5 LPM and 10 LPM medical oxygen machines in Hyderabad. Compare costs, calculate flow requirements, and access 60–90 minute doorstep emergency delivery.
            </p>

            {/* Quick Trust Ribbons */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                <Clock className="shrink-0 text-sky-400" size={20} />
                <span className="text-xs font-semibold text-slate-200">60-90 Min Delivery in Hyd</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                <ShieldCheck className="shrink-0 text-emerald-400" size={20} />
                <span className="text-xs font-semibold text-slate-200">93% ± 3% Certified Purity</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                <RotateCcw className="shrink-0 text-amber-400" size={20} />
                <span className="text-xs font-semibold text-slate-200">Zero Security Deposit Opt.</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                <Phone className="shrink-0 text-teal-400" size={20} />
                <span className="text-xs font-semibold text-slate-200">24/7 Biomedical Support</span>
              </div>
            </div>

            {/* Direct CTA Buttons */}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <a
                href={whatsappRentalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 active:scale-95"
              >
                <MessageCircle size={18} />
                <span>Book Rental on WhatsApp</span>
              </a>
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 active:scale-95"
              >
                <Phone size={18} />
                <span>Emergency Hotline: {CONTACT_PHONE}</span>
              </a>
            </div>

            {/* Medical Review Metadata */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <BadgeCheck size={15} className="text-sky-400" />
                <span>Clinically Reviewed by Biomedical Specialists</span>
              </div>
              <span>&bull;</span>
              <span>Updated: August 2026</span>
              <span>&bull;</span>
              <span>Reading Time: 6 mins</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          
          {/* Article Left Body (8 cols) */}
          <div className="space-y-12 lg:col-span-8">
            
            {/* Section 1: Renting vs Buying Analysis */}
            <section id="rent-vs-buy" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Activity size={22} />
                </div>
                <h2 className="text-xl font-bold sm:text-2xl text-slate-900">
                  1. Renting vs. Buying an Oxygen Concentrator
                </h2>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                For families in Hyderabad facing sudden respiratory discharge from hospitals like Apollo, Yashoda, KIMS, or NIMS, the first question is whether to purchase a brand-new unit or rent. The decision comes down to the <strong>expected clinical duration</strong> of oxygen therapy:
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <span className="inline-block rounded-md bg-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-900">RECOMMENDED: RENT</span>
                  <h3 className="mt-2 text-base font-bold text-emerald-950">Short-Term Recovery (1 to 6 Months)</h3>
                  <ul className="mt-3 space-y-2 text-xs text-emerald-900 sm:text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                      <span>Post-pneumonia, acute bronchitis, or viral lung recovery.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                      <span>Post-surgical convalescence & transitional ICU discharge.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                      <span><strong>Saves ₹25,000 to ₹40,000+</strong> vs full machine retail price.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                      <span>Zero maintenance or molecular sieve replacement liability.</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-5">
                  <span className="inline-block rounded-md bg-sky-200 px-2 py-0.5 text-xs font-bold text-sky-900">RECOMMENDED: BUY</span>
                  <h3 className="mt-2 text-base font-bold text-sky-950">Long-Term / Permanent (12+ Months)</h3>
                  <ul className="mt-3 space-y-2 text-xs text-sky-900 sm:text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-sky-600 mt-0.5" />
                      <span>Advanced Chronic Obstructive Pulmonary Disease (COPD).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-sky-600 mt-0.5" />
                      <span>Idiopathic Pulmonary Fibrosis (IPF) & interstitial lung disease.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-sky-600 mt-0.5" />
                      <span>Full 2 to 3-year manufacturer replacement warranty.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-sky-600 mt-0.5" />
                      <span>Ownership asset with long-term break-even after month 9.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2: Interactive Calculator */}
            <section id="calculator" className="rounded-3xl border-2 border-sky-500 bg-white p-6 shadow-md sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
                  <Calculator size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl text-slate-900">
                    2. Interactive Oxygen Rental & Flow Calculator
                  </h2>
                  <p className="text-xs text-slate-500 sm:text-sm">Calculate your recommended machine, monthly savings, and power requirements</p>
                </div>
              </div>

              <div className="mt-8 grid gap-6 rounded-2xl bg-slate-50 p-5 sm:p-7">
                {/* Flow Rate Slider */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="flow-rate-slider" className="text-sm font-bold text-slate-800">
                      Prescribed Oxygen Flow (LPM):
                    </label>
                    <span className="rounded-lg bg-sky-600 px-3 py-1 text-sm font-black text-white">
                      {flowRate} Liters / Min
                    </span>
                  </div>
                  <input
                    id="flow-rate-slider"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={flowRate}
                    onChange={(e) => setFlowRate(Number(e.target.value))}
                    className="mt-3 h-2 w-full cursor-pointer accent-sky-600"
                  />
                  <div className="mt-1 flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>1L (Low Flow)</span>
                    <span>3L (Standard)</span>
                    <span>5L (Home Max)</span>
                    <span>8L (High Flow)</span>
                    <span>10L (ICU Max)</span>
                  </div>
                </div>

                {/* Daily Usage Hours */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="daily-hours-slider" className="text-sm font-bold text-slate-800">
                      Daily Usage Duration:
                    </label>
                    <span className="rounded-lg bg-slate-800 px-3 py-1 text-sm font-black text-white">
                      {dailyHours} Hours / Day
                    </span>
                  </div>
                  <input
                    id="daily-hours-slider"
                    type="range"
                    min="2"
                    max="24"
                    step="2"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="mt-3 h-2 w-full cursor-pointer accent-slate-800"
                  />
                  <div className="mt-1 flex justify-between text-[11px] font-semibold text-slate-400">
                    <span>2 hrs (PRN / Exertion)</span>
                    <span>8 hrs (Sleep Only)</span>
                    <span>16 hrs (Day+Night)</span>
                    <span>24 hrs (Continuous ICU)</span>
                  </div>
                </div>

                {/* Duration Months */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="duration-months-slider" className="text-sm font-bold text-slate-800">
                      Estimated Requirement:
                    </label>
                    <span className="rounded-lg bg-emerald-700 px-3 py-1 text-sm font-black text-white">
                      {durationMonths} {durationMonths === 1 ? 'Month' : 'Months'}
                    </span>
                  </div>
                  <input
                    id="duration-months-slider"
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="mt-3 h-2 w-full cursor-pointer accent-emerald-700"
                  />
                </div>
              </div>

              {/* Calculator Output Matrix */}
              <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/70 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800">Recommended Hardware</span>
                  <span className="rounded-full bg-sky-600 px-3 py-0.5 text-xs font-extrabold text-white">
                    {recommendedMachineType}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <span className="text-xs text-slate-500">Estimated Monthly Rental:</span>
                    <p className="text-lg font-black text-slate-900">₹{monthlyRental.toLocaleString('en-IN')}</p>
                    <span className="text-[11px] text-emerald-700 font-semibold">Includes Doorstep Setup</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500">Estimated Savings vs Buying:</span>
                    <p className="text-lg font-black text-emerald-700">
                      {savings > 0 ? `₹${savings.toLocaleString('en-IN')}` : 'Consider Purchasing'}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {shouldRent ? `Saves ${Math.round((savings / estimatedBuyCost) * 100)}% of cost` : 'Break-even reached'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500">Approx. Power Cost:</span>
                    <p className="text-lg font-black text-slate-900">~₹{monthlyElectricityINR.toLocaleString('en-IN')} / mo</p>
                    <span className="text-[11px] text-slate-500">Based on Hyderabad DISCOM</span>
                  </div>
                </div>

                {/* Instant WhatsApp Calculation Action */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">Prescription match:</strong> {flowRate} LPM &bull; {dailyHours}h/day &bull; {durationMonths} mo in Hyderabad.
                  </div>
                  <a
                    href={whatsappRentalHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    <MessageCircle size={16} />
                    <span>Get this Machine on WhatsApp</span>
                  </a>
                </div>
              </div>
            </section>

            {/* Section 3: 5L vs 10L vs Portable Comparison */}
            <section id="machine-types" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Gauge size={22} />
                </div>
                <h2 className="text-xl font-bold sm:text-2xl text-slate-900">
                  3. 5 LPM vs. 10 LPM vs. Portable (POC) Units
                </h2>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Selecting the wrong flow capacity is the #1 mistake families make. If a doctor prescribes 6 LPM and you run a 5 LPM machine at maximum capacity, the oxygen purity drops significantly from 93% down to 70%, which can cause dangerous desaturation.
              </p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="rounded-l-xl p-3 sm:p-4">Feature</th>
                      <th className="p-3 sm:p-4">5 LPM Stationary</th>
                      <th className="p-3 sm:p-4">10 LPM High-Flow</th>
                      <th className="rounded-r-xl p-3 sm:p-4">Portable (POC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="p-3 sm:p-4 font-bold text-slate-900">Prescription Fit</td>
                      <td className="p-3 sm:p-4">1 to 4 LPM (90% of home patients)</td>
                      <td className="p-3 sm:p-4">5 to 10 LPM (ICU & severe fibrosis)</td>
                      <td className="p-3 sm:p-4">Pulse 1-5 settings (Ambulatory)</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-bold text-slate-900">Purity at Max Load</td>
                      <td className="p-3 sm:p-4">93% ± 3% up to 5L</td>
                      <td className="p-3 sm:p-4">93% ± 3% up to full 10L</td>
                      <td className="p-3 sm:p-4">90% ± 3% (Pulse Dose)</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-bold text-slate-900">Weight & Mobility</td>
                      <td className="p-3 sm:p-4">13.5 - 15 kg (Room wheels)</td>
                      <td className="p-3 sm:p-4">22 - 25 kg (Bedside stationary)</td>
                      <td className="p-3 sm:p-4">2.2 - 2.8 kg (Shoulder bag)</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-bold text-slate-900">Power Source</td>
                      <td className="p-3 sm:p-4">AC Wall Power (280-350W)</td>
                      <td className="p-3 sm:p-4">AC Wall Power (550-650W)</td>
                      <td className="p-3 sm:p-4">Rechargeable Li-Ion + Car DC</td>
                    </tr>
                    <tr>
                      <td className="p-3 sm:p-4 font-bold text-slate-900">Hyd Rental Rate</td>
                      <td className="p-3 sm:p-4 font-bold text-emerald-700">₹3,200 – ₹4,500 / mo</td>
                      <td className="p-3 sm:p-4 font-bold text-emerald-700">₹5,500 – ₹6,500 / mo</td>
                      <td className="p-3 sm:p-4 font-bold text-emerald-700">₹8,000 – ₹12,000 / mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4: Top Models Available for Rent */}
            <section id="models" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Stethoscope size={22} />
                </div>
                <h2 className="text-xl font-bold sm:text-2xl text-slate-900">
                  4. Top Tested Rental Machines Available in Hyderabad
                </h2>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {RECOMMENDED_MODELS.map((model) => (
                  <div key={model.name} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-medical-primary hover:shadow-md">
                    <div>
                      <span className="inline-block rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800">
                        {model.badge}
                      </span>
                      <h3 className="mt-2 text-base font-bold text-slate-900">{model.name}</h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{model.description}</p>
                      
                      <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-3 text-xs text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Flow Range:</span>
                          <span className="font-bold">{model.flow}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Purity:</span>
                          <span className="font-bold text-emerald-700">{model.purity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Noise Level:</span>
                          <span className="font-bold">{model.noise}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rental Rate:</span>
                          <span className="font-black text-medical-primary">{model.rentPrice}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2 pt-2">
                      <Link
                        to={`/products/${model.handle}`}
                        className="flex-1 rounded-xl border border-slate-300 bg-white py-2 text-center text-xs font-bold text-slate-700 hover:border-medical-primary hover:text-medical-primary"
                      >
                        View Specs
                      </Link>
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello BaeMeds, I want to rent the ${model.name} in Hyderabad.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-xl bg-emerald-600 py-2 text-center text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        Rent on WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: Caregiver Safety & Step-by-Step Operation */}
            <section id="safety-guide" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <ShieldCheck size={22} />
                </div>
                <h2 className="text-xl font-bold sm:text-2xl text-slate-900">
                  5. Caregiver Home Setup & Safety Protocol
                </h2>
              </div>

              <div className="mt-6 space-y-4 text-sm text-slate-700">
                <div className="flex items-start gap-3 rounded-2xl bg-amber-50/70 p-4 border border-amber-200">
                  <Flame size={20} className="shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-950">Fire Safety: 10-Foot Clearance</h3>
                    <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                      Oxygen vigorously accelerates combustion. Keep the concentrator and patient at least <strong>10 feet (3 meters)</strong> away from gas stoves, lit candles, pooja diyas, heaters, and smoking.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-sky-50/70 p-4 border border-sky-200">
                  <Droplets size={20} className="shrink-0 text-sky-700 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sky-950">Humidifier Bottle Water Hygiene</h3>
                    <p className="mt-1 text-xs text-sky-900 leading-relaxed">
                      Fill the bottle between the <strong>MIN and MAX</strong> lines exclusively with RO or distilled water. Empty and refill with fresh water every 24 hours. Wash the bottle weekly with warm mild soapy water.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-200">
                  <RotateCcw size={20} className="shrink-0 text-emerald-700 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-emerald-950">Air Filter Cleaning Routine</h3>
                    <p className="mt-1 text-xs text-emerald-900 leading-relaxed">
                      Every Sunday, remove the black sponge dust filter located at the rear/side. Rinse under running tap water, squeeze dry completely with a clean towel, and reinsert. Never run the unit without a dry filter.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Hyderabad Delivery Localities */}
            <section id="localities" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <MapPin size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl text-slate-900">
                    6. Hyderabad & Secunderabad Delivery Hubs
                  </h2>
                  <p className="text-xs text-slate-500">Select your area to check estimated doorstep arrival time</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {HYDERABAD_LOCALITIES.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => setSelectedLocality(loc.name)}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-xs transition ${
                      selectedLocality === loc.name
                        ? 'border-medical-primary bg-sky-50 font-bold text-medical-primary shadow-sm'
                        : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{loc.name}</span>
                    <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-xs">
                      {loc.time}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-sky-400 font-semibold">Selected Area: {selectedLocality}</span>
                  <p className="text-sm font-bold mt-0.5">Biomedical technician available for immediate dispatch</p>
                </div>
                <a
                  href={whatsappRentalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white transition hover:bg-emerald-700 whitespace-nowrap"
                >
                  <MessageCircle size={16} />
                  <span>Request Dispatch to {selectedLocality.split('&')[0]}</span>
                </a>
              </div>
            </section>

            {/* Section 7: FAQs */}
            <section id="faqs" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <HelpCircle size={22} />
                </div>
                <h2 className="text-xl font-bold sm:text-2xl text-slate-900">
                  7. Frequently Asked Questions (Doctor & Caregiver FAQs)
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                {FAQS.map((faq, index) => {
                  const isOpen = activeFaq === index;
                  return (
                    <div
                      key={faq.q}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden transition"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaq(isOpen ? null : index)}
                        className="flex w-full items-center justify-between p-4 text-left text-sm font-bold text-slate-900 hover:text-medical-primary"
                        aria-expanded={isOpen}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-medical-primary' : ''}`}
                        />
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-200/60 bg-white p-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sidebar (4 cols): Sticky Order Card & Fast Assistance */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Rental Booking Box */}
              <div className="rounded-3xl border-2 border-emerald-500 bg-white p-6 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500" />
                  <span>Doorstep Setup in 60-90 Mins</span>
                </div>

                <h3 className="mt-2 text-xl font-extrabold text-slate-900">Rent Oxygen Concentrator</h3>
                <p className="mt-1 text-xs text-slate-500">Hospital-grade 5L / 10L units delivered across Hyderabad.</p>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">5 LPM Monthly Rent:</span>
                    <strong className="text-slate-900 font-bold">₹3,499</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">10 LPM Monthly Rent:</span>
                    <strong className="text-slate-900 font-bold">₹6,499</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Deposit:</span>
                    <strong className="text-emerald-700 font-bold">Zero (Govt ID verification)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Accessories Included:</span>
                    <strong className="text-slate-900 font-bold">Free Nasal Cannula + Tubing</strong>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  <a
                    href={whatsappRentalHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-md transition hover:bg-emerald-700"
                  >
                    <MessageCircle size={18} />
                    <span>Book on WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                  >
                    <Phone size={18} className="text-medical-primary" />
                    <span>Call Desk: {CONTACT_PHONE}</span>
                  </a>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 text-center text-[11px] text-slate-400">
                  Certified sanitized units &bull; On-site purity demo &bull; GST invoice provided
                </div>
              </div>

              {/* Table of Contents Navigator */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900">Guide Table of Contents</h4>
                <nav className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
                  <a href="#rent-vs-buy" className="block py-1 hover:text-medical-primary">1. Renting vs. Buying Decision</a>
                  <a href="#calculator" className="block py-1 hover:text-medical-primary">2. Interactive Flow & Cost Calculator</a>
                  <a href="#machine-types" className="block py-1 hover:text-medical-primary">3. 5L vs. 10L vs. Portable POC</a>
                  <a href="#models" className="block py-1 hover:text-medical-primary">4. Top Tested Rental Machines</a>
                  <a href="#safety-guide" className="block py-1 hover:text-medical-primary">5. Caregiver Safety Protocol</a>
                  <a href="#localities" className="block py-1 hover:text-medical-primary">6. Hyderabad Delivery Speeds</a>
                  <a href="#faqs" className="block py-1 hover:text-medical-primary">7. Frequently Asked Questions</a>
                </nav>
              </div>

              {/* Browse Catalog Link */}
              <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-teal-50/40 p-6 text-center">
                <h4 className="text-sm font-bold text-slate-900">Looking to Purchase Outright?</h4>
                <p className="mt-1 text-xs text-slate-600">Browse all 87+ brand-certified medical equipment with official warranties.</p>
                <Link
                  to="/products?category=Oxygen%20Concentrator"
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-sky-700 px-5 text-xs font-bold text-white transition hover:bg-sky-800"
                >
                  <span>Explore Oxygen Catalogue</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

            </div>
          </aside>

        </div>
      </main>
    </article>
  );
};

export default OxygenRentalGuidePage;
