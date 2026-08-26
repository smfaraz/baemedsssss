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
  { name: 'Uppal & Tarnaka', time: '60 - 90 mins', hub: 'North-East Hub', landmark: 'Near TX Hospitals' },
  { name: 'Attapur & Rajendranagar', time: '60 - 90 mins', hub: 'South Hub', landmark: 'Near Mythri & ZOI Hospitals' },
];

const MACHINE_COMPARISON = [
  {
    model: 'Philips EverFlo 5 LPM',
    brand: 'Philips Respironics (USA)',
    flowRate: '0.5 – 5.0 LPM',
    purity: '93% ± 3% (Continuous)',
    weight: '14.0 kg (Compact)',
    sound: '45 dBA (Whisper Quiet)',
    power: '350 Watts',
    idealFor: 'Post-ICU discharge, Pneumonia recovery, COPD Stage II/III, Sleep-time oxygen',
    rentalPrice: '₹3,499 / mo',
    buyPrice: '₹42,000',
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'Oxymed Mini 5 LPM',
    brand: 'Oxymed (Germany Certified)',
    flowRate: '1.0 – 5.0 LPM',
    purity: '93% ± 3% with Built-in OPI',
    weight: '13.9 kg (Ultra Lightweight)',
    sound: '43 dBA (Ultra Silent)',
    power: '320 Watts (Inverter Friendly)',
    idealFor: 'Senior home care, Long-term oxygen therapy, Inverter-backed home setups',
    rentalPrice: '₹3,299 / mo',
    buyPrice: '₹38,500',
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'EVOX 10 LPM High Flow',
    brand: 'EVOX Medical Instruments',
    flowRate: '1.0 – 10.0 LPM (Dual Outlets)',
    purity: '93% ± 3% at full 10 LPM',
    weight: '24.5 kg (Heavy-Duty Compressor)',
    sound: '52 dBA (Hospital Grade)',
    power: '650 Watts',
    idealFor: 'High-flow prescriptions (>5 LPM), Post-ARDS, Severe Fibrosis, Dual patient sharing',
    rentalPrice: '₹6,499 / mo',
    buyPrice: '₹68,000',
    stockStatus: 'Ready for Immediate Dispatch',
  },
  {
    model: 'Inogen One G5 (Portable)',
    brand: 'Inogen (USA)',
    flowRate: 'Settings 1–6 (Pulse Dose)',
    purity: '90% +6% / -3%',
    weight: '2.2 kg (FAA Airline Approved)',
    sound: '38 dBA',
    power: 'Rechargeable Li-Ion Battery',
    idealFor: 'Active ambulatory patients, Doctor visits, Hospital transfers, Inter-city travel',
    rentalPrice: '₹9,999 / mo',
    buyPrice: '₹2,10,000',
    stockStatus: 'Special Reservation',
  },
];

const FAQS = [
  {
    q: 'How much does it cost to rent an oxygen concentrator in Hyderabad?',
    a: 'In Hyderabad, certified 5 LPM medical oxygen concentrators rent for ₹3,200 to ₹3,500 per month, while high-flow 10 LPM dual-patient machines rent for ₹5,500 to ₹6,500 per month. At BaeMeds, monthly rentals include zero security deposit, free sanitized sterile starter accessories (cannula, humidifier bottle, oxygen tubing), and 24/7 biomedical on-site replacement guarantee.',
  },
  {
    q: 'How fast can an oxygen concentrator be delivered to my home in Hyderabad?',
    a: 'Emergency orders are dispatched immediately from our 6 localized Hyderabad hubs with guaranteed delivery in 45 to 90 minutes across all major twin-city localities (Banjara Hills, Jubilee Hills, Hitec City, Gachibowli, Kukatpally, Secunderabad, Tolichowki, Malakpet). A trained biomedical technician delivers the unit, tests live purity with a digital analyzer in front of the family, and provides hands-on caregiver training.',
  },
  {
    q: 'Should we rent or buy an oxygen machine for our patient?',
    a: 'Renting is medically and financially optimal for temporary conditions (post-surgery recovery, pneumonia convalescence, post-ICU transition) requiring oxygen for 1 to 6 months—saving ₹25,000 to ₹40,000. Purchasing is recommended for lifelong irreversible respiratory ailments like End-Stage COPD or severe idiopathic pulmonary fibrosis requiring continuous daily oxygen beyond 9 months.',
  },
  {
    q: 'What is the operational difference between an oxygen concentrator and an oxygen cylinder?',
    a: 'A conventional D-type (46.7L) oxygen cylinder holds a finite supply (approx. 5 to 7 hours at 4 LPM), weighing over 50 kg and requiring recurring refilling trips and dangerous high-pressure handling. An oxygen concentrator is an electrical device that filters nitrogen from ambient room air continuously, producing infinite 93% pure oxygen without any gas refills.',
  },
  {
    q: 'What type of water must be used in the humidifier bottle?',
    a: 'You must exclusively use distilled water, demineralized (DM) water, or clean RO drinking water. Regular tap water or unboiled ground water contains mineral salts (calcium/magnesium) that create white limescale deposits, clogging the fine micro-diffuser nozzle and fostering bacterial biofilms in the respiratory circuit.',
  },
  {
    q: 'Can the oxygen concentrator run on a home inverter during Hyderabad power cuts?',
    a: 'Yes. Standard 5 LPM oxygen concentrators consume 300W to 350W of power, running seamlessly on a standard 1kVA or 1.5kVA pure sine wave home inverter/UPS system. For patients on 24/7 high-flow therapy, maintaining a small emergency backup cylinder or secondary battery UPS is also standard clinical protocol.',
  },
  {
    q: 'What hygiene and sanitation protocols are followed between rentals?',
    a: 'Every returned concentrator undergoes a 4-step biomedical sterilization protocol: complete outer chassis disinfection with hospital-grade quaternary ammonium solution, replacement of internal HEPA bacterial filters, autoclave/UV sterilization of the air chamber, and 4-hour continuous digital oxygen purity load testing (>93% certified). All patient-contact consumables (nasal cannula and humidifier bottle) are 100% brand new and sealed.',
  },
  {
    q: 'What documents are required to initiate an oxygen rental in Hyderabad?',
    a: 'Rental onboarding requires only 2 simple digital documents: (1) Pulmonologist/Doctor prescription indicating required LPM flow rate, and (2) Patient/Caregiver government ID proof (Aadhaar Card or Driving License) for delivery address verification. The rental agreement is signed digitally upon doorstep arrival.',
  },
];

const CASE_STUDIES = [
  {
    patient: 'Mr. Venkat Rao (68 yrs, Jubilee Hills)',
    hospital: 'Discharged from Apollo Hospitals, Jubilee Hills',
    condition: 'Post-viral pneumonia recovery requiring 3 LPM for 4 weeks.',
    outcome: 'Rented Philips EverFlo 5L for 1 month (Cost: ₹3,499 vs ₹42,000 buy). Successfully weaned off supplemental oxygen with regular SpO2 recovery.',
  },
  {
    patient: 'Mrs. Fatima Begum (72 yrs, Tolichowki)',
    hospital: 'Discharged from Care Hospitals, Banjara Hills',
    condition: 'Chronic COPD exacerbation requiring nocturnal 2 LPM oxygen.',
    outcome: 'Rented Oxymed Mini 5L on long-term rental plan with doorstep monthly filter replacements. 100% power reliability on home inverter.',
  },
  {
    patient: 'Dr. K. Srinivas for his Father (81 yrs, Secunderabad)',
    hospital: 'Post-Thoracic Surgery Care, KIMS Secunderabad',
    condition: 'Post-operative pulmonary rehab requiring continuous 6 LPM high-flow.',
    outcome: 'Emergency delivery of EVOX 10L High-Flow within 50 minutes. Live digital analyzer verified 94.2% oxygen purity upon setup.',
  },
];

export const OxygenRentalGuidePage: React.FC = () => {
  // Calculator state
  const [flowRate, setFlowRate] = useState<number>(3);
  const [dailyHours, setDailyHours] = useState<number>(12);
  const [durationMonths, setDurationMonths] = useState<number>(2);
  const [selectedLocality, setSelectedLocality] = useState<string>(HYDERABAD_LOCALITIES[0].name);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'calculator' | 'safety' | 'localities'>('overview');

  // Calculations
  const isHighFlow = flowRate > 5;
  const recommendedMachineType = isHighFlow ? '10 LPM High-Flow Unit' : '5 LPM Medical Concentrator';
  const monthlyRental = isHighFlow ? 6499 : 3499;
  const totalRentalCost = monthlyRental * durationMonths;
  const estimatedBuyCost = isHighFlow ? 68000 : 38500;
  const savings = estimatedBuyCost - totalRentalCost;
  const monthlyElectricityINR = Math.round(((isHighFlow ? 600 : 330) * dailyHours * 30) / 1000 * 7.5);

  const cleanPhone = CONTACT_PHONE.replace(/\D/g, '');
  const whatsappRentalHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello BaeMeds, I am reading your Oxygen Rental Clinical Guide. I need to rent a ${recommendedMachineType} (${flowRate} LPM for ${dailyHours} hrs/day) in ${selectedLocality}. Please confirm delivery and rental terms.`
  )}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'Oxygen Concentrator Rental in Hyderabad: The Definitive Clinical & Patient Guide (2026)',
    headline: 'Oxygen Concentrator Rental in Hyderabad: 5L vs 10L Machines, Rental Costs, Setup Protocols & Locality Delivery',
    description: 'Comprehensive medical and clinical authority guide on renting home oxygen concentrators in Hyderabad. Compare 5L vs 10L machines, calculate flow costs, review safety protocols, and request rapid 60-minute delivery.',
    url: `${SITE_URL}/guides/oxygen-concentrator-rental-hyderabad`,
    image: `${SITE_URL}/baemeds-social-preview.jpg`,
    datePublished: '2026-01-15T09:00:00+05:30',
    dateModified: '2026-08-26T12:00:00+05:30',
    author: {
      '@type': 'Person',
      name: 'Dr. S. Arshad & Biomedical Respiratory Care Team',
      jobTitle: 'Lead Clinical Biomedical Specialist',
      worksFor: {
        '@type': 'MedicalBusiness',
        name: `${APP_NAME} (Mohsin Enterprises)`,
        telephone: CONTACT_PHONE,
        address: {
          '@type': 'PostalAddress',
          streetAddress: '8-2-326/a/2, Road No. 3, Banjara Hills',
          addressLocality: 'Hyderabad',
          addressRegion: 'Telangana',
          postalCode: '500034',
          addressCountry: 'IN',
        },
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
        name: 'Oxygen Concentrator Rental Hyderabad',
        item: `${SITE_URL}/guides/oxygen-concentrator-rental-hyderabad`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-800 antialiased selection:bg-teal-100 selection:text-teal-900">
      <SEO
        title="Oxygen Concentrator Rental in Hyderabad (5L & 10L) – Rates, Clinical Guide & Fast Delivery"
        description="Comprehensive 2026 medical guide to renting 5L & 10L oxygen concentrators in Hyderabad. Live rental cost calculator, 5L vs 10L comparison, safety checklist, and 60-min delivery."
        canonical="/guides/oxygen-concentrator-rental-hyderabad"
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      {/* Floating Emergency WhatsApp CTA for Mobile */}
      <div className="fixed bottom-4 right-4 z-40 sm:hidden">
        <a
          href={whatsappRentalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-13 items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xl hover:bg-emerald-700 active:scale-95 transition"
          aria-label="Rent Oxygen Machine on WhatsApp"
        >
          <MessageCircle size={18} />
          <span>Rent Oxygen Machine (60m Setup)</span>
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
          <span className="text-slate-900 font-semibold truncate">Oxygen Concentrator Rental Hyderabad</span>
        </nav>

        {/* Category Badge & Metadata */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-teal-800 border border-teal-200/60 flex items-center gap-1">
            <HeartPulse size={13} /> Clinical Respiratory Protocol
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs font-medium text-slate-500">Twin Cities Hospital Field Guide</span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            Active Stock in 6 Hyderabad Hubs
          </span>
        </div>

        {/* Main Article Title */}
        <h1 className="mt-4 text-3xl font-serif font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[40px] lg:leading-[1.2]">
          Oxygen Concentrator Rental in Hyderabad: The Complete Patient & Caregiver Clinical Guide
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
                <span>Dr. S. Arshad &amp; BaeMeds Biomedical Care Team</span>
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
              <span><strong>Cost Savings:</strong> Renting a standard 5L unit (₹3,299–₹3,499/mo) for short-term recovery saves over <strong>₹30,000</strong> compared to purchasing. Zero security deposit required.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-teal-700 shrink-0 mt-0.5" />
              <span><strong>Flow Matching:</strong> Prescriptions up to 4 LPM require a 5 LPM machine. Prescriptions of 5 LPM or higher strictly require a <strong>10 LPM high-flow machine</strong> to prevent dangerous purity drop-offs.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-teal-700 shrink-0 mt-0.5" />
              <span><strong>60-Min Emergency Delivery:</strong> BaeMeds operates 6 localized Twin City hubs delivering calibrated machines with live digital purity testing across Banjara Hills, Hitec City, Secunderabad, Kukatpally &amp; beyond.</span>
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
            <a href="#hyderabad-delivery" className="hover:text-teal-800 flex items-center gap-1.5">
              <span className="text-teal-700 font-mono font-bold">08.</span> Hyderabad Localities &amp; Delivery Timelines
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
              In Hyderabad, family caregivers facing an emergency discharge often wonder if they should purchase a machine immediately. Historical hospital discharge data shows that renting is medically and financially superior for the vast majority of temporary recovery scenarios:
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
                    <td className="p-3.5 text-emerald-700 font-bold">₹30,000+ Saved</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Post-Cardiothoracic Surgery Rehab</td>
                    <td className="p-3.5">1 to 3 Months</td>
                    <td className="p-3.5 font-bold text-teal-800">Rent (Monthly)</td>
                    <td className="p-3.5 text-emerald-700 font-bold">₹25,000+ Saved</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Palliative &amp; Home ICU Comfort Care</td>
                    <td className="p-3.5">1 to 4 Months</td>
                    <td className="p-3.5 font-bold text-teal-800">Rent (Monthly)</td>
                    <td className="p-3.5 text-emerald-700 font-bold">₹22,000+ Saved</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Advanced COPD (Stage IV) / Severe Fibrosis</td>
                    <td className="p-3.5">12+ Months (Lifelong)</td>
                    <td className="p-3.5 font-bold text-sky-800">Purchase New Unit</td>
                    <td className="p-3.5 text-slate-500">Break-even at month 10</td>
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
              Adjust the prescription parameters below to calculate recommended hardware, power consumption, and monthly rental terms for your Hyderabad locality.
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
                <p className="font-mono text-lg font-black text-teal-900 mt-0.5">₹{monthlyRental.toLocaleString('en-IN')}</p>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">Zero Security Deposit</span>
              </div>
              <div className="rounded-lg bg-white p-3 border border-teal-100 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Estimated Electricity:</span>
                <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">~₹{monthlyElectricityINR} / mo</p>
                <span className="text-[11px] text-slate-500 block mt-0.5">TSSPDCL Hyderabad Tariff</span>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-700 shrink-0" />
                <span>
                  Estimated Savings over {durationMonths} month{durationMonths > 1 ? 's' : ''}: <strong>₹{savings.toLocaleString('en-IN')} saved</strong> vs purchasing new machine.
                </span>
              </div>
              <a
                href={whatsappRentalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition shrink-0 whitespace-nowrap shadow-sm"
              >
                <MessageCircle size={15} />
                <span>Reserve on WhatsApp</span>
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
                  <li className="flex items-start gap-1.5">&bull; <span>Compact machine weight (13.5–14 kg) and whisper quiet (43 dBA).</span></li>
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
              Compare our certified hospital-grade rental models available for same-day delivery across Hyderabad:
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
              Families often struggle to decide between traditional heavy cylinders and modern electric concentrators. Here is the operational comparison:
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-5">
                <h3 className="font-bold text-teal-950 text-sm flex items-center gap-2">
                  <Zap size={18} className="text-teal-700" />
                  <span>Oxygen Concentrator (Recommended)</span>
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-700">
                  <li><strong>Continuous Supply:</strong> Never runs out of oxygen as long as plugged in.</li>
                  <li><strong>Mobility:</strong> Mounted on 4 caster wheels (14 kg), easily rolled between bedroom and living room.</li>
                  <li><strong>Safety:</strong> Operates at low internal pressure (~5 PSI), eliminating explosive tank hazards.</li>
                  <li><strong>Cost:</strong> Fixed flat monthly rental without recurring gas refill or transport fees.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers size={18} className="text-slate-600" />
                  <span>Compressed Gas Cylinder (D-Type)</span>
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  <li><strong>Finite Duration:</strong> Standard 46.7L cylinder lasts only 5–7 hours at 4 LPM.</li>
                  <li><strong>Heavy Handling:</strong> Weighs 50+ kg; requires physical transport for refills.</li>
                  <li><strong>High Pressure:</strong> Stored at 2000 PSI, requiring cautious handling.</li>
                  <li><strong>Best Used:</strong> As a 5L emergency power-backup reservoir for ICU patients.</li>
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
                  <p className="text-slate-600 mt-1">Oxygen drastically accelerates combustion. Keep the concentrator at least 10 feet away from gas stoves, pooja room oil lamps/diyas, incense sticks, open heaters, and smoking.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Droplets size={20} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block text-sm">Humidifier Bottle Maintenance (DM Water Only)</strong>
                  <p className="text-slate-600 mt-1">Fill only with distilled, demineralized (DM), or RO drinking water between the MIN and MAX markers. Discard and refill fresh water daily. Wash the bottle weekly with warm mild soap.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <RotateCcw size={20} className="text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block text-sm">Weekly Foam Air Filter Cleaning</strong>
                  <p className="text-slate-600 mt-1">Remove the black foam intake filter at the rear once a week, wash thoroughly under running tap water, dry completely with a clean towel, and reinsert. Never operate the machine without the filter.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Zap size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block text-sm">Wall Socket Power (Avoid Daisy-Chained Extensions)</strong>
                  <p className="text-slate-600 mt-1">Plug the machine directly into a 3-pin earthed 5A/15A wall socket. If using on an inverter, ensure the home inverter supports pure sine wave output (min 1kVA capacity).</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8: Delivery Localities in Hyderabad */}
          <section id="hyderabad-delivery" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700 font-mono font-bold text-lg">08.</span>
              <span>Hyderabad Emergency Delivery Hubs &amp; Arrival Timelines</span>
            </h2>
            <p>
              BaeMeds operates 6 localized inventory centers across the Twin Cities with emergency biomedical delivery teams on call 24/7. Select your locality below to view your guaranteed delivery window:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {HYDERABAD_LOCALITIES.map((loc) => (
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
                <p className="text-slate-300 mt-0.5">Biomedical technician on standby. Live digital purity calibration upon arrival.</p>
              </div>
              <a
                href={whatsappRentalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition whitespace-nowrap shadow-md"
              >
                <MessageCircle size={16} />
                <span>Confirm Delivery to {selectedLocality.split('&')[0]}</span>
              </a>
            </div>
          </section>

          {/* Section 9: Case Studies */}
          <section id="case-studies" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span className="text-teal-700 font-mono font-bold text-lg">09.</span>
              <span>Hospital Discharge &amp; Patient Case Studies in Hyderabad</span>
            </h2>
            <p>
              Real hospital transitions coordinated by the BaeMeds clinical team across top Hyderabad hospital networks:
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
              <li>British Thoracic Society (BTS). <em>Clinical Guideline for Oxygen Use in Adults in Healthcare and Emergency Settings</em>. Thorax, 2017.</li>
              <li>Ministry of Health and Family Welfare (MoHFW), Government of India. <em>National Clinical Management Protocol for Respiratory Hypoxemia</em>, 2022.</li>
              <li>American Association for Respiratory Care (AARC). <em>Clinical Practice Guideline: Oxygen Therapy for Adults in the Acute and Home Care Setting</em>.</li>
              <li>Bureau of Indian Standards (BIS). <em>IS/ISO 80601-2-69: Medical electrical equipment — Particular requirements for basic safety and essential performance of oxygen concentrators</em>.</li>
            </ol>
          </section>

        </div>

        {/* Editorial Masthead & Booking Footer */}
        <footer className="mt-14 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-950 to-slate-900 p-6 sm:p-9 text-center text-white shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-800/80 px-3 py-1 text-xs font-bold text-teal-200 border border-teal-600/40 mb-3">
            <Clock size={13} /> 24/7 Immediate Hyderabad Dispatch
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">Need Immediate Delivery of an Oxygen Concentrator in Hyderabad?</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Our biomedical support team is on standby 24/7 to verify prescriptions, confirm live stock, and dispatch rapid doorstep delivery with live digital purity calibration.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={whatsappRentalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white hover:bg-emerald-700 shadow-lg active:scale-95 transition"
            >
              <MessageCircle size={18} />
              <span>Contact Biomedical Team on WhatsApp</span>
            </a>
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              <Phone size={17} className="text-teal-300" />
              <span>Emergency Helpdesk: {CONTACT_PHONE}</span>
            </a>
          </div>
        </footer>

      </article>
    </div>
  );
};

export default OxygenRentalGuidePage;
