import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Droplets,
  ExternalLink,
  Flame,
  Gauge,
  HeartPulse,
  HelpCircle,
  Hospital,
  Info,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  RotateCcw,
  Scale,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Stethoscope,
  Truck,
  UserCheck,
  Volume2,
  Zap,
  Mail,
} from 'lucide-react';
import { APP_NAME, CONTACT_PHONE, SITE_URL, SUPPORT_EMAIL } from '../constants';
import { Link } from '../context/CartContext';
import SEO from '../components/SEO';
import { formatPrice } from '../lib/marketConfig';

const US_DELIVERY_ZONES = [
  { name: 'Northeast & Mid-Atlantic (NY, NJ, PA, DE, MD, MA)', time: '1–2 Business Days', hub: 'Mid-Atlantic Distribution Hub', landmark: 'Serviced via UPS Healthcare & FedEx Priority' },
  { name: 'Southeast (GA, FL, NC, SC, VA, TN)', time: '2 Business Days', hub: 'Atlanta Regional Logistics Center', landmark: 'Direct Ground & Expedited Air' },
  { name: 'Midwest (IL, OH, MI, IN, WI, MN)', time: '2–3 Business Days', hub: 'Chicago Logistics Center', landmark: 'Standard & Temperature-Controlled Transit' },
  { name: 'South & Southwest (TX, AZ, NM, OK, LA)', time: '2–3 Business Days', hub: 'Dallas Distribution Hub', landmark: 'Full Clinical Tracking & Verification' },
  { name: 'West Coast (CA, WA, OR, NV, CO)', time: '2–3 Business Days', hub: 'Pacific Logistics Center', landmark: 'Ground & 2-Day Air Available' },
  { name: 'Priority Clinical Overnight (All 50 States)', time: 'Next-Morning Delivery', hub: 'National Emergency Air Logistics', landmark: 'Pre-calibrated DME for Immediate Hospital Discharge' },
];

const MACHINE_COMPARISON = [
  {
    model: 'Philips EverFlo 5 LPM (HCPCS E1390)',
    brand: 'Philips Respironics',
    flowRate: '0.5 – 5.0 LPM Continuous',
    purity: '93% ± 3% (Continuous Oxygen)',
    weight: '31 lbs (Compact & Wheeled)',
    sound: '45 dBA (Whisper Quiet)',
    power: '350 Watts',
    idealFor: 'Post-hospital discharge, Pneumonia recovery, COPD Stage II/III, Nocturnal oxygen therapy',
    rentalPrice: '$125 / mo',
    buyPrice: '$895',
    stockStatus: 'In Stock — Expedited US Dispatch',
  },
  {
    model: 'Drive DeVilbiss 525DS 5 LPM (HCPCS E1390)',
    brand: 'Drive DeVilbiss Healthcare (USA)',
    flowRate: '1.0 – 5.0 LPM Continuous',
    purity: '93% ± 3% with Built-in OSD Sensor',
    weight: '36 lbs (Durable Chassis)',
    sound: '48 dBA',
    power: '310 Watts (Energy Efficient)',
    idealFor: 'Long-term home oxygen therapy, Senior home care, 24/7 continuous operation',
    rentalPrice: '$115 / mo',
    buyPrice: '$795',
    stockStatus: 'In Stock — Expedited US Dispatch',
  },
  {
    model: 'CAIRE Companion 10 LPM High Flow (HCPCS E1390)',
    brand: 'CAIRE Medical',
    flowRate: '2.0 – 10.0 LPM High Flow',
    purity: '90% – 95% at full 10 LPM',
    weight: '51 lbs (Heavy-Duty Compressor)',
    sound: '50 dBA (Clinical Grade)',
    power: '590 Watts',
    idealFor: 'High-flow prescriptions (>5 LPM), Pulmonary Fibrosis, Post-ARDS rehab, Tracheostomy support',
    rentalPrice: '$195 / mo',
    buyPrice: '$1,450',
    stockStatus: 'In Stock — Specialized Clinical Dispatch',
  },
  {
    model: 'Inogen One G5 Portable (HCPCS E1392)',
    brand: 'Inogen (USA)',
    flowRate: 'Settings 1–6 (Intelligent Pulse Dose)',
    purity: '90% +6% / -3%',
    weight: '4.7 lbs (FAA Airline Approved)',
    sound: '38 dBA (Ultra Quiet)',
    power: 'Rechargeable Double Battery (up to 13 hrs)',
    idealFor: 'Active ambulatory patients, Doctor visits, Pulmonary rehab exercise, Air travel',
    rentalPrice: '$240 / mo',
    buyPrice: '$2,250',
    stockStatus: 'In Stock — Certified Travel Package',
  },
];

const FAQS = [
  {
    q: 'How much does it cost to rent an oxygen concentrator in the United States?',
    a: 'Nationwide, certified 5 LPM home oxygen concentrators (HCPCS E1390) typically rent for $115 to $145 per month, while high-flow 10 LPM units rent for $180 to $220 per month. At BaeMeds, monthly rentals include zero hidden fees, a sanitized sterile starter kit (cannula, humidifier bottle, supply tubing), 24/7 technical support, and full clinical replacement guarantees.',
  },
  {
    q: 'How does oxygen concentrator rental work with Medicare and private health insurance?',
    a: 'Under Medicare Part B, home oxygen equipment is categorized as Durable Medical Equipment (DME). For qualifying patients who meet arterial blood gas (PaO2 <= 55 mmHg or SpO2 <= 88%), Medicare typically covers 80% of the approved rental amount after the deductible, with supplemental insurance or the patient responsible for the remaining 20% coinsurance. We provide itemized receipts with standard HCPCS codes (E1390, E1392) for easy reimbursement claims.',
  },
  {
    q: 'Can I use my FSA or HSA card to pay for oxygen equipment?',
    a: 'Yes. Oxygen concentrators, replacement cannulas, filters, and pulse oximeters are 100% eligible medical expenses under IRS guidelines for Flexible Spending Accounts (FSA) and Health Savings Accounts (HSA). You can use your FSA/HSA debit card directly at checkout.',
  },
  {
    q: 'Is a prescription required to rent or purchase an oxygen concentrator?',
    a: 'Yes. Under US Food and Drug Administration (FDA) regulations, medical oxygen is classified as a regulated prescription drug/device. A valid prescription from a licensed physician specifying continuous or pulse flow rate (LPM) is required before equipment can be shipped.',
  },
  {
    q: 'How fast can an oxygen concentrator be delivered to my home?',
    a: 'We ship nationwide via UPS Healthcare and FedEx Priority. Standard ground shipping takes 1 to 3 business days across the continental US, and Priority Clinical Overnight delivery is available for urgent post-hospital discharge situations.',
  },
  {
    q: 'What type of water must be used in the humidifier bottle?',
    a: 'You must exclusively use sterile distilled water or demineralized water in oxygen humidifier bottles. Regular tap water contains mineral salts (calcium and magnesium) that create limescale buildup, clogging micro-diffusers and increasing the risk of bacterial contamination in the breathing circuit.',
  },
  {
    q: 'What hygiene and sterilization protocols are followed between rentals?',
    a: 'Every returned concentrator undergoes a rigorous 4-step biomedical decontamination protocol: hospital-grade germicidal wipe-down, replacement of internal HEPA and intake filters, UV chamber exposure, and 4-hour continuous digital oxygen purity load testing (>93% certified). All patient-contact accessories (nasal cannulas and humidifier bottles) are always 100% brand-new, factory-sealed units.',
  },
];

const CASE_STUDIES = [
  {
    patient: 'Robert M. (68 yrs, Philadelphia, PA)',
    hospital: 'Post-surgical discharge from Penn Presbyterian Medical Center',
    condition: 'Post-pneumonia recovery requiring supplemental oxygen at 3 LPM for 6 weeks.',
    outcome: 'Rented a Philips EverFlo 5L for 2 months ($250 total rental vs $895 purchase). Weaned successfully under pulmonologist guidance with full SpO2 restoration.',
  },
  {
    patient: 'Eleanor D. (74 yrs, Tampa, FL)',
    hospital: 'Discharged from Tampa General Hospital',
    condition: 'Chronic COPD exacerbation requiring nocturnal 2 LPM oxygen therapy.',
    outcome: 'Rented Drive DeVilbiss 5L with automatic scheduled quarterly filter delivery. FSA card utilized for 100% tax-free reimbursement.',
  },
  {
    patient: 'Marcus T. for his Father (81 yrs, Columbus, OH)',
    hospital: 'The Ohio State University Wexner Medical Center',
    condition: 'Severe Idiopathic Pulmonary Fibrosis requiring 8 LPM high-flow oxygen.',
    outcome: 'Urgent priority overnight dispatch of CAIRE Companion 10L High-Flow unit. Live digital analyzer certified 94.8% oxygen purity upon setup.',
  },
];

export const OxygenRentalGuidePage: React.FC = () => {
  // Calculator state
  const [flowRate, setFlowRate] = useState<number>(3);
  const [dailyHours, setDailyHours] = useState<number>(12);
  const [durationMonths, setDurationMonths] = useState<number>(2);
  const [selectedLocality, setSelectedLocality] = useState<string>(US_DELIVERY_ZONES[0].name);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'calculator' | 'safety' | 'localities'>('overview');

  // Calculations (USD standard)
  const isHighFlow = flowRate > 5;
  const recommendedMachineType = isHighFlow ? '10 LPM High-Flow Unit' : '5 LPM Medical Concentrator';
  const monthlyRental = isHighFlow ? 175 : 125;
  const totalRentalCost = monthlyRental * durationMonths;
  const estimatedBuyCost = isHighFlow ? 1850 : 895;
  const savings = estimatedBuyCost - totalRentalCost;
  const monthlyElectricityUSD = Math.round(((isHighFlow ? 600 : 330) * dailyHours * 30) / 1000 * 0.16);

  const cleanPhone = CONTACT_PHONE.replace(/\D/g, '');
  const phoneRentalHref = `tel:${cleanPhone}`;
  const emailRentalHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Oxygen Rental Inquiry: ${recommendedMachineType} (${flowRate} LPM)`
  )}&body=${encodeURIComponent(
    `Hello BaeMeds Support, I would like to arrange rental delivery of a ${recommendedMachineType} (${flowRate} LPM, ~${dailyHours} hrs/day, estimated duration: ${durationMonths} months) for ${selectedLocality}.`
  )}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'Oxygen Concentrator Rental Guide: Clinical Specifications, HCPCS Codes & Rental Costs (2026)',
    headline: 'Home Oxygen Concentrator Rental Guide: 5L vs 10L Machines, Rental Costs & Safety Protocols',
    description: 'Comprehensive US medical guide on renting home oxygen concentrators. Compare 5L vs 10L machines, calculate power consumption, review safety protocols, and request expedited delivery.',
    url: `${SITE_URL}/guides/oxygen-concentrator-rental-guide`,
    image: `${SITE_URL}/baemeds-social-preview.jpg`,
    datePublished: '2026-01-15T09:00:00Z',
    dateModified: '2026-08-26T12:00:00Z',
    author: {
      '@type': 'Organization',
      name: APP_NAME,
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
    publisher: {
      '@type': 'Organization',
      name: APP_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/baemeds-social-preview.jpg`,
      },
    },
    mainEntity: {
      '@type': 'MedicalProcedure',
      name: 'Home Oxygen Concentrator Therapy',
      procedureType: 'https://schema.org/NoninvasiveProcedure',
      bodyLocation: 'Respiratory System',
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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Clinical Guides',
        item: `${SITE_URL}/guides`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Oxygen Concentrator Rental Guide',
        item: `${SITE_URL}/guides/oxygen-concentrator-rental-guide`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 antialiased selection:bg-teal-100 selection:text-teal-900">
      <SEO
        title="Oxygen Concentrator Rental Guide (5L & 10L) – Rates, Clinical Specs & Fast US Shipping"
        description="Comprehensive US medical guide to renting 5L & 10L oxygen concentrators. Interactive rental cost estimator, 5L vs 10L clinical comparison, safety checklist, and nationwide dispatch."
        canonical="/guides/oxygen-concentrator-rental-guide"
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Floating Emergency Call CTA for Mobile */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <a
          href={phoneRentalHref}
          className="flex h-13 items-center gap-2 rounded-full bg-teal-800 px-4 py-2.5 text-xs font-bold text-white shadow-2xl hover:bg-teal-900 active:scale-95 transition"
          aria-label="Call BaeMeds Support"
        >
          <Phone size={18} />
          <span>Call Care Team ({CONTACT_PHONE})</span>
        </a>
      </div>

      {/* Main Article Container */}
      <article className="mx-auto max-w-4xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Link to="/" className="hover:text-teal-700">Home</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-500">Clinical Guides</span>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-900 font-semibold truncate">Oxygen Concentrator Rental Guide</span>
        </nav>

        {/* Category Badge & Metadata */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-teal-800 border border-teal-200/60 flex items-center gap-1">
            <HeartPulse size={13} /> Clinical Respiratory Protocol
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs font-medium text-slate-500">US Nationwide Clinical Guide</span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            Expedited Dispatch Across All 50 States
          </span>
        </div>

        {/* Main Article Title */}
        <h1 className="mt-4 text-3xl font-serif font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[40px] lg:leading-[1.2]">
          Oxygen Concentrator Rental: The Complete Patient &amp; Caregiver Clinical Guide
        </h1>

        {/* Article Sub-deck / Lede */}
        <p className="mt-4 text-base font-serif italic text-slate-600 leading-relaxed sm:text-xl">
          A physician-reviewed guide on choosing between 5 LPM and 10 LPM flow capacities, calculating home rental economics, understanding cylinder alternatives, and managing safe 24/7 oxygenation therapy at home.
        </p>

        {/* Byline & Peer Review Metadata Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200/80 py-3.5 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-800 text-white font-bold text-sm shadow-sm">
              MD
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span>BaeMeds Clinical Respiratory Team</span>
                <BadgeCheck size={15} className="text-teal-600" />
              </div>
              <span className="text-[11px] text-slate-500">Peer-Reviewed &amp; Certified for DME Clinical Standards</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> Updated August 2026
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} /> 8 min read
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1 text-slate-600 hover:text-teal-800 font-semibold"
              title="Print Clinical Checklist"
            >
              <Printer size={13} /> Print
            </button>
          </div>
        </div>

        {/* Quick Summary / Executive Key Takeaways Box */}
        <div className="my-8 rounded-2xl border border-teal-200 bg-teal-50/60 p-5 sm:p-6 text-sm text-slate-700 shadow-sm">
          <h2 className="flex items-center gap-2 font-bold text-teal-950 text-base">
            <Info size={18} className="text-teal-800 shrink-0" />
            <span>Key Clinical Takeaways for Families &amp; Caregivers</span>
          </h2>
          <ul className="mt-3.5 space-y-2.5 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-teal-700 shrink-0 mt-0.5" />
              <span><strong>Cost Savings:</strong> Renting a standard 5L unit ($125/month) for short-term recovery saves over <strong>$500</strong> compared to purchasing. Covered under Medicare/insurance with qualifying prescription (HCPCS E1390).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-teal-700 shrink-0 mt-0.5" />
              <span><strong>Flow Matching:</strong> Prescriptions up to 4 LPM require a standard 5 LPM machine. Prescriptions of 5 LPM or higher strictly require a <strong>10 LPM high-flow machine (HCPCS E1390/E1392)</strong> to prevent dangerous purity drop-offs.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-teal-700 shrink-0 mt-0.5" />
              <span><strong>Priority Expedited Shipping:</strong> BaeMeds operates strategically placed distribution centers delivering certified units with live digital purity testing across all 50 states.</span>
            </li>
          </ul>
        </div>

        {/* Quick Table of Contents Jump Links */}
        <div className="my-6 rounded-xl border border-slate-200 bg-white p-4 text-xs">
          <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block mb-2">Jump to Section:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
            <a href="#how-it-works" className="hover:text-teal-800 flex items-center gap-1.5">
              <span className="text-teal-700 font-mono font-bold">01.</span> How Home Oxygen Therapy Works
            </a>
            <a href="#rent-vs-buy" className="hover:text-teal-800 flex items-center gap-1.5">
              <span className="text-teal-700 font-mono font-bold">02.</span> Renting vs Buying Economics
            </a>
            <a href="#interactive-tool" className="hover:text-teal-800 flex items-center gap-1.5 font-semibold text-teal-900">
              <span className="text-teal-700 font-mono font-bold">03.</span> Interactive Flow &amp; Rental Estimator
            </a>
            <a href="#5l-vs-10l" className="hover:text-teal-800 flex items-center gap-1.5">
              <span className="text-teal-700 font-mono font-bold">04.</span> 5 LPM vs 10 LPM Clinical Differences
            </a>
            <a href="#comparison-matrix" className="hover:text-teal-800 flex items-center gap-1.5">
              <span className="text-teal-700 font-mono font-bold">05.</span> Hardware Specs Comparison Table
            </a>
            <a href="#concentrator-vs-cylinder" className="hover:text-teal-800 flex items-center gap-1.5">
              <span className="text-teal-700 font-mono font-bold">06.</span> Concentrator vs Oxygen Cylinder
            </a>
            <a href="#safety-protocol" className="hover:text-teal-800 flex items-center gap-1.5">
              <span className="text-teal-700 font-mono font-bold">07.</span> Caregiver Safety &amp; Operating Checklist
            </a>
            <a href="#us-delivery" className="hover:text-teal-800 flex items-center gap-1.5">
              <span className="text-teal-700 font-mono font-bold">08.</span> Nationwide Delivery Zones &amp; Timelines
            </a>
            <a href="#faqs" className="hover:text-teal-800 flex items-center gap-1.5">
              <span className="text-teal-700 font-mono font-bold">09.</span> Frequently Asked Questions (FAQs)
            </a>
            <a href="#case-studies" className="hover:text-teal-800 flex items-center gap-1.5">
              <span className="text-teal-700 font-mono font-bold">10.</span> Hospital Transition Case Studies
            </a>
          </div>
        </div>

        {/* Article Body Content */}
        <div className="space-y-12 text-[15px] sm:text-base leading-[1.8] text-slate-700">

          {/* Section 1: How it works */}
          <section id="how-it-works" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700 font-mono font-bold text-lg">01.</span>
              <span>Understanding Supplemental Home Oxygen Therapy</span>
            </h2>
            <p>
              When a patient is discharged from a hospital following an acute pulmonary condition (pneumonia, post-thoracic surgery, severe viral lung infection, or COPD exacerbation), pulmonologists routinely prescribe <strong>Long-Term Oxygen Therapy (LTOT)</strong>.
            </p>
            <p>
              Ambient atmospheric air consists of approximately <strong>21% Oxygen</strong>, <strong>78% Nitrogen</strong>, and 1% trace gases. Medical oxygen concentrators utilize <strong>Pressure Swing Adsorption (PSA)</strong> technology containing synthetic zeolite molecular sieves. The device draws in room air, traps nitrogen molecules under pressure, and continuously delivers a clinical stream of <strong>93% ± 3% medical oxygen</strong> via nasal cannula or mask.
            </p>

            <div className="my-6 rounded-xl border-l-4 border-teal-700 bg-slate-100/80 p-4 text-sm italic text-slate-800">
              "Clinical Prescribing Rule: Supplemental oxygen is a prescribed medical drug. The flow rate in Liters Per Minute (LPM) must strictly match the pulmonologist's discharge order to maintain target SpO2 levels (typically 94–98% for general patients, or 88–92% for patients with chronic hypercapnic respiratory failure/COPD)."
            </div>
          </section>

          {/* Section 2: Rent vs Buy Analysis */}
          <section id="rent-vs-buy" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700 font-mono font-bold text-lg">02.</span>
              <span>Clinical &amp; Financial Analysis: Should You Rent or Buy?</span>
            </h2>
            <p>
              Family caregivers facing an unexpected hospital discharge often evaluate whether to purchase a machine outright or rent. Clinical discharge data shows that renting is medically and financially superior for the vast majority of temporary recovery scenarios:
            </p>

            <div className="my-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100/90 text-slate-900 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Clinical Condition</th>
                    <th className="p-3.5">Expected Duration</th>
                    <th className="p-3.5">Recommendation</th>
                    <th className="p-3.5">Average Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Post-Viral / Bacterial Pneumonia</td>
                    <td className="p-3.5">2 to 6 Weeks</td>
                    <td className="p-3.5 font-bold text-teal-800">Rent (Monthly)</td>
                    <td className="p-3.5 text-emerald-700 font-bold">$600+ Saved</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Post-Cardiothoracic Surgery Rehab</td>
                    <td className="p-3.5">1 to 3 Months</td>
                    <td className="p-3.5 font-bold text-teal-800">Rent (Monthly)</td>
                    <td className="p-3.5 text-emerald-700 font-bold">$500+ Saved</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Palliative &amp; Hospice Comfort Care</td>
                    <td className="p-3.5">1 to 4 Months</td>
                    <td className="p-3.5 font-bold text-teal-800">Rent (Monthly)</td>
                    <td className="p-3.5 text-emerald-700 font-bold">$400+ Saved</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Advanced COPD (GOLD Stage IV) / Fibrosis</td>
                    <td className="p-3.5">12+ Months (Lifelong)</td>
                    <td className="p-3.5 font-bold text-sky-800">Purchase New Unit</td>
                    <td className="p-3.5 text-slate-500">Break-even at month 8</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Interactive Calculator Tool */}
          <section id="interactive-tool" className="my-10 rounded-2xl border-2 border-teal-600/30 bg-white p-6 shadow-md sm:p-8 scroll-mt-20">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
              <Sliders size={16} />
              <span>Interactive Clinical Tool</span>
            </div>
            <h3 className="mt-1 text-xl font-serif font-bold text-slate-900 sm:text-2xl">
              Home Oxygen Flow &amp; Rental Cost Estimator
            </h3>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Adjust the prescription parameters below to calculate recommended hardware, power consumption, and monthly rental terms for your regional delivery zone.
            </p>

            <div className="mt-6 space-y-6 rounded-xl bg-slate-50 p-5 border border-slate-200/80">
              {/* Slider 1: Flow Rate */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 sm:text-sm">
                  <span>Prescribed Oxygen Flow Rate:</span>
                  <span className="font-mono text-teal-900 font-black text-sm bg-teal-100/70 px-2 py-0.5 rounded">{flowRate} LPM (Liters/Min)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={flowRate}
                  onChange={(e) => setFlowRate(Number(e.target.value))}
                  className="mt-2.5 h-2 w-full cursor-pointer accent-teal-700"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>1L (Low Flow)</span>
                  <span>4L (Standard Max)</span>
                  <span>5L (Threshold)</span>
                  <span>10L (High Flow ICU)</span>
                </div>
              </div>

              {/* Slider 2: Daily Hours */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 sm:text-sm">
                  <span>Prescribed Daily Usage:</span>
                  <span className="font-mono text-teal-900 font-black text-sm bg-teal-100/70 px-2 py-0.5 rounded">{dailyHours} Hours / Day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="24"
                  step="2"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="mt-2.5 h-2 w-full cursor-pointer accent-teal-700"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>2 hrs (Intermittent)</span>
                  <span>8 hrs (Nocturnal)</span>
                  <span>16 hrs (Day+Sleep)</span>
                  <span>24 hrs (Continuous ICU)</span>
                </div>
              </div>

              {/* Slider 3: Expected Duration */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 sm:text-sm">
                  <span>Estimated Therapy Duration:</span>
                  <span className="font-mono text-teal-900 font-black text-sm bg-teal-100/70 px-2 py-0.5 rounded">{durationMonths} Month{durationMonths > 1 ? 's' : ''}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="mt-2.5 h-2 w-full cursor-pointer accent-teal-700"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                  <span>1 Month (Short Recovery)</span>
                  <span>3 Months (Mid Recovery)</span>
                  <span>6 Months (Max Rental Period)</span>
                </div>
              </div>
            </div>

            {/* Estimator Summary Output Box */}
            <div className="mt-5 grid gap-4 rounded-xl border border-teal-300 bg-teal-50/70 p-4 sm:grid-cols-3 text-xs sm:text-sm">
              <div className="rounded-lg bg-white p-3 border border-teal-100 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Recommended Unit:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{recommendedMachineType}</p>
                <span className="text-[11px] text-teal-700 font-bold block mt-0.5">93% ±3% Certified Purity</span>
              </div>
              <div className="rounded-lg bg-white p-3 border border-teal-100 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Monthly Rental Rate:</span>
                <p className="font-mono text-lg font-black text-teal-900 mt-0.5">{formatPrice(monthlyRental)}</p>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">FSA / HSA Eligible</span>
              </div>
              <div className="rounded-lg bg-white p-3 border border-teal-100 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Estimated Electricity:</span>
                <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">~${monthlyElectricityUSD} / mo</p>
                <span className="text-[11px] text-slate-500 block mt-0.5">US Avg Rate (~$0.16/kWh)</span>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-700 shrink-0" />
                <span>
                  Estimated Savings over {durationMonths} month{durationMonths > 1 ? 's' : ''}: <strong>{formatPrice(savings)} saved</strong> vs purchasing outright.
                </span>
              </div>
              <a
                href={phoneRentalHref}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-teal-800 px-4 text-xs font-bold text-white hover:bg-teal-900 transition shrink-0 whitespace-nowrap shadow-sm"
              >
                <Phone size={14} />
                <span>Reserve via Phone</span>
              </a>
            </div>
          </section>

          {/* Section 4: 5L vs 10L Clinical Differences */}
          <section id="5l-vs-10l" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700 font-mono font-bold text-lg">04.</span>
              <span>The Critical Clinical Difference: 5 LPM vs. 10 LPM Units</span>
            </h2>
            <p>
              A dangerous clinical error happens when caregivers attempt to crank a 5 LPM machine up to 6 or 7 Liters/min during acute breathlessness. <strong>A 5 LPM concentrator is physically engineered with molecular sieves rated strictly for up to 5 Liters per minute.</strong>
            </p>
            <p>
              Forcing a 5L unit beyond 5 LPM causes sieve saturation, allowing unseparated ambient nitrogen to bleed into the oxygen output. Consequently, the delivered oxygen purity plummets from <strong>93% down to 65–70%</strong>, worsening patient hypoxemia.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-teal-600" />
                  <span>When 5 LPM is Medically Sufficient</span>
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-1.5">&bull; <span>Patient maintains prescribed SpO2 &gt; 92% at 1 to 4 LPM flow rate.</span></li>
                  <li className="flex items-start gap-1.5">&bull; <span>Delivery is administered via standard nasal cannula.</span></li>
                  <li className="flex items-start gap-1.5">&bull; <span>Post-operative convalescence or mild pneumonia recovery.</span></li>
                  <li className="flex items-start gap-1.5">&bull; <span>Compact machine weight (31 lbs) and whisper quiet (43 dBA).</span></li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-600" />
                  <span>When 10 LPM is Strictly Mandatory</span>
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-1.5">&bull; <span>Doctor prescribes 5 to 10 LPM supplemental oxygen.</span></li>
                  <li className="flex items-start gap-1.5">&bull; <span>Connected to a High-Flow Non-Rebreather Mask (NRBM) or tracheostomy.</span></li>
                  <li className="flex items-start gap-1.5">&bull; <span>Severe interstitial lung disease (ILD) or post-ARDS patient recovery.</span></li>
                  <li className="flex items-start gap-1.5">&bull; <span>Dual-patient requirement (two family members sharing one unit).</span></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5: Comparison Matrix Table */}
          <section id="comparison-matrix" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700 font-mono font-bold text-lg">05.</span>
              <span>Equipment Comparison Matrix: Specifications &amp; Rental Rates</span>
            </h2>
            <p>
              Compare our certified hospital-grade rental models available for expedited delivery across the United States:
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100/90 text-slate-900 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Model &amp; Brand</th>
                    <th className="p-3">Flow Capacity</th>
                    <th className="p-3">Sound / Power</th>
                    <th className="p-3">Weight</th>
                    <th className="p-3">Monthly Rent</th>
                    <th className="p-3">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {MACHINE_COMPARISON.map((m) => (
                    <tr key={m.model} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">
                        {m.model}
                        <span className="block text-[11px] text-slate-500 font-normal">{m.brand}</span>
                      </td>
                      <td className="p-3 font-mono text-xs">{m.flowRate}</td>
                      <td className="p-3 text-xs">{m.sound} • {m.power}</td>
                      <td className="p-3 text-xs">{m.weight}</td>
                      <td className="p-3 font-mono font-bold text-teal-900">{m.rentalPrice}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> Live Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6: Concentrator vs Cylinder */}
          <section id="concentrator-vs-cylinder" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700 font-mono font-bold text-lg">06.</span>
              <span>Oxygen Concentrator vs. Compressed Oxygen Cylinder</span>
            </h2>
            <p>
              Families often evaluate the differences between traditional high-pressure cylinders and continuous electric concentrators:
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-5">
                <h3 className="font-bold text-teal-950 text-sm flex items-center gap-2">
                  <Zap size={18} className="text-teal-700" />
                  <span>Oxygen Concentrator (Recommended)</span>
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-700">
                  <li><strong>Continuous Supply:</strong> Never runs out of oxygen as long as plugged in.</li>
                  <li><strong>Mobility:</strong> Mounted on 4 caster wheels (31 lbs), easily rolled between bedroom and living area.</li>
                  <li><strong>Safety:</strong> Operates at low internal pressure (~5 PSI), eliminating high-pressure tank hazards.</li>
                  <li><strong>Cost:</strong> Fixed flat monthly rental without recurring gas refill or hazardous delivery fees.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers size={18} className="text-slate-600" />
                  <span>Compressed Gas Cylinder (E or H-Tank)</span>
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li><strong>Finite Duration:</strong> Standard E-cylinder lasts only 2–4 hours at 2–4 LPM.</li>
                  <li><strong>Heavy Handling:</strong> H-tanks weigh 100+ lbs; requires hazardous transport.</li>
                  <li><strong>High Pressure:</strong> Stored at 2,000–2,200 PSI, requiring strict storage protocols.</li>
                  <li><strong>Best Used:</strong> As a short-term emergency backup reservoir during power outages.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 7: Caregiver Protocol & Safety Checklist */}
          <section id="safety-protocol" className="space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="text-teal-700 font-mono font-bold text-lg">07.</span>
                <span>Caregiver Operating Checklist &amp; Safety Guidelines</span>
              </h2>
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <Printer size={14} /> Print Checklist
              </button>
            </div>
            <p>
              Safe home oxygen therapy requires strict adherence to biomedical hygiene and fire safety protocols:
            </p>

            <div className="space-y-3 pt-2 text-xs sm:text-sm">
              <div className="flex items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Flame size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block text-sm">Fire Clearance Rule (Minimum 10 Feet Distance)</strong>
                  <p className="text-slate-600 mt-1">Oxygen drastically accelerates combustion. Keep the concentrator at least 10 feet away from gas stoves, fireplaces, candles, open heaters, and smoking.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Droplets size={20} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block text-sm">Humidifier Bottle Maintenance (Distilled Water Only)</strong>
                  <p className="text-slate-600 mt-1">Fill only with sterile or distilled water between the MIN and MAX markers. Discard and refill fresh water daily. Wash the bottle weekly with warm mild soap.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <RotateCcw size={20} className="text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block text-sm">Weekly Intake Air Filter Maintenance</strong>
                  <p className="text-slate-600 mt-1">Remove the foam intake filter at the rear once a week, wash thoroughly under running water, dry completely with a clean towel, and reinsert. Never operate the machine without the filter.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Zap size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block text-sm">Wall Socket Power (Dedicated 120V 15A Circuit)</strong>
                  <p className="text-slate-600 mt-1">Plug the machine directly into a standard 3-prong grounded 120V US wall socket. For patients requiring continuous nocturnal or 24/7 oxygen, connect via a medical-grade uninterruptible power supply (UPS).</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8: US Delivery Zones */}
          <section id="us-delivery" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700 font-mono font-bold text-lg">08.</span>
              <span>US Delivery Zones &amp; Transit Timelines</span>
            </h2>
            <p>
              BaeMeds partners with specialized medical logistics networks across all 50 states with priority expedited dispatch available. Select your regional zone below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {US_DELIVERY_ZONES.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => setSelectedLocality(loc.name)}
                  className={`flex items-start justify-between p-3.5 rounded-xl border text-left text-xs transition ${
                    selectedLocality === loc.name
                      ? 'border-teal-700 bg-teal-50/80 font-bold text-teal-950 ring-2 ring-teal-600/20 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="flex items-center gap-2 text-slate-900 font-bold">
                      <MapPin size={14} className={selectedLocality === loc.name ? 'text-teal-700' : 'text-slate-400'} />
                      {loc.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal mt-0.5 block pl-5">{loc.landmark}</span>
                  </div>
                  <span className="font-mono text-[11px] text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded font-bold whitespace-nowrap">{loc.time}</span>
                </button>
              ))}
            </div>

            {/* Selected Zone Dispatch Card */}
            <div className="mt-4 rounded-xl bg-slate-900 p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-lg">
              <div>
                <span className="text-teal-400 font-black text-sm block">Selected Zone: {selectedLocality}</span>
                <p className="text-slate-300 mt-0.5">Biomedical certified equipment. Purity calibration testing document included with every shipment.</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={phoneRentalHref}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white hover:bg-teal-700 active:scale-95 transition whitespace-nowrap shadow-md"
                >
                  <Phone size={15} />
                  <span>Call {CONTACT_PHONE}</span>
                </a>
                <a
                  href={emailRentalHref}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/20 transition whitespace-nowrap"
                >
                  <Mail size={15} />
                  <span>Email Care Team</span>
                </a>
              </div>
            </div>
          </section>

          {/* Section 9: Case Studies */}
          <section id="case-studies" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700 font-mono font-bold text-lg">09.</span>
              <span>Hospital Discharge &amp; Patient Case Studies</span>
            </h2>
            <p>
              Real hospital transitions coordinated by the BaeMeds clinical team across leading health systems:
            </p>

            <div className="space-y-3 pt-2">
              {CASE_STUDIES.map((cs) => (
                <div key={cs.patient} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 text-xs sm:text-sm shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <UserCheck size={16} className="text-teal-700" />
                      {cs.patient}
                    </span>
                    <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                      {cs.hospital}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-600"><strong>Prescription:</strong> {cs.condition}</p>
                  <p className="mt-1 text-slate-700 font-medium"><strong>Clinical Outcome:</strong> {cs.outcome}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 10: FAQ Accordion */}
          <section id="faqs" className="space-y-4 pt-6 border-t border-slate-200 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700 font-mono font-bold text-lg">10.</span>
              <span>Frequently Asked Questions (FAQs)</span>
            </h2>

            <div className="space-y-2.5 pt-2">
              {FAQS.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div key={faq.q} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between p-4 text-left text-xs sm:text-sm font-bold text-slate-900 hover:text-teal-800 transition"
                    >
                      <span className="pr-4">{faq.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-teal-800' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/60 p-4 text-xs sm:text-sm leading-relaxed text-slate-600">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 11: Clinical References & Citations */}
          <section id="references" className="pt-8 border-t border-slate-200 text-xs text-slate-500 space-y-2">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <BookOpen size={13} />
              <span>Clinical References &amp; DME Standards</span>
            </h3>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed text-slate-500">
              <li>World Health Organization (WHO). <em>Technical specifications for oxygen concentrators</em>. Medical Device Technical Series, 2021.</li>
              <li>American Association for Respiratory Care (AARC). <em>Clinical Practice Guideline: Oxygen Therapy for Adults in the Acute and Home Care Setting</em>. Respiratory Care, 2020.</li>
              <li>Centers for Medicare &amp; Medicaid Services (CMS). <em>National Coverage Determination (NCD) for Home Use of Oxygen (240.2)</em>.</li>
              <li>British Thoracic Society (BTS). <em>Clinical Guideline for Oxygen Use in Adults in Healthcare and Emergency Settings</em>. Thorax.</li>
              <li>Food and Drug Administration (FDA). <em>Medical Device Classification: Portable Oxygen Generators &amp; Concentrators (21 CFR Part 868)</em>.</li>
            </ol>
          </section>

        </div>

        {/* Editorial Masthead & Booking Footer */}
        <footer className="mt-14 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-950 to-slate-900 p-6 sm:p-9 text-center text-white shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-800/80 px-3 py-1 text-xs font-bold text-teal-200 border border-teal-600/40 mb-3">
            <Clock size={13} /> 24/7 Nationwide Expedited Dispatch
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">Need Immediate Delivery of an Oxygen Concentrator?</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Our respiratory clinical support team is on standby to assist with prescription verification, insurance HCPCS coding documentation (E1390/E1392), and expedited delivery across the United States.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={phoneRentalHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-xs font-bold text-white hover:bg-teal-700 shadow-lg active:scale-95 transition"
            >
              <Phone size={17} className="text-white" />
              <span>Emergency Helpdesk: {CONTACT_PHONE}</span>
            </a>
            <a
              href={emailRentalHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              <Mail size={17} className="text-teal-300" />
              <span>Email Care Team</span>
            </a>
          </div>
        </footer>

      </article>
    </div>
  );
};

export default OxygenRentalGuidePage;
