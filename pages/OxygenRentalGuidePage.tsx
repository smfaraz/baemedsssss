import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Droplets,
  ExternalLink,
  Flame,
  Gauge,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sliders,
  Sparkles,
  Stethoscope,
  Truck,
  UserCheck,
} from 'lucide-react';
import { APP_NAME, CONTACT_PHONE, SITE_URL } from '../constants';
import { Link } from '../context/CartContext';
import SEO from '../components/SEO';

const HYDERABAD_LOCALITIES = [
  { name: 'Banjara Hills & Jubilee Hills', time: '45 - 60 mins', hub: 'Central Dispatch Hub' },
  { name: 'Gachibowli & Hitec City', time: '60 - 90 mins', hub: 'Cyberabad West Hub' },
  { name: 'Madhapur & Kondapur', time: '60 - 90 mins', hub: 'Cyberabad West Hub' },
  { name: 'Kukatpally & Miyapur', time: '60 - 90 mins', hub: 'North-West Hub' },
  { name: 'Secunderabad & Begumpet', time: '45 - 60 mins', hub: 'Secunderabad Hub' },
  { name: 'Mehdipatnam & Tolichowki', time: '45 - 60 mins', hub: 'Central Dispatch Hub' },
  { name: 'Malakpet & Dilsukhnagar', time: '60 - 90 mins', hub: 'East Hub' },
  { name: 'LB Nagar & Nagole', time: '75 - 100 mins', hub: 'East Hub' },
  { name: 'Uppal & Tarnaka', time: '60 - 90 mins', hub: 'North-East Hub' },
  { name: 'Attapur & Rajendranagar', time: '60 - 90 mins', hub: 'South Hub' },
];

const FAQS = [
  {
    q: 'How much does it cost to rent an oxygen concentrator in Hyderabad?',
    a: 'In Hyderabad, standard certified 5 LPM medical oxygen concentrators typically rent for ₹3,200 to ₹4,500 per month, while high-flow 10 LPM dual-patient machines rent for ₹5,500 to ₹7,000 per month. At BaeMeds, monthly rentals include doorstep delivery, professional installation, sterile accessories, and 24/7 technical on-site replacement guarantee.',
  },
  {
    q: 'How fast can an oxygen concentrator be delivered to my home in Hyderabad?',
    a: 'Emergency orders are dispatched immediately with a guaranteed arrival time of 60 to 90 minutes across all major Hyderabad and Secunderabad localities. A trained biomedical technician delivers the sanitized unit, performs a live oxygen purity test with a digital analyzer in front of the caregiver, and trains the family on safe operation.',
  },
  {
    q: 'Should we rent or buy an oxygen machine for our patient?',
    a: 'Renting is medically and financially recommended for acute illnesses, post-surgery recovery, pneumonia, or transitional post-ICU care where supplemental oxygen is needed for 1 to 6 months (saving ₹25,000 to ₹40,000). Purchasing is advisable for lifelong respiratory conditions such as advanced COPD or severe pulmonary fibrosis requiring indefinite daily therapy.',
  },
  {
    q: 'What is the difference between an oxygen concentrator and an oxygen cylinder?',
    a: 'An oxygen cylinder stores a fixed volume of compressed gas (a standard 46.7L D-type cylinder lasts only 5 to 7 hours at 4 LPM and requires physically lifting 50kg steel cylinders and frequent refilling trips). An oxygen concentrator is an electrically powered medical device that continuously extracts pure 93% oxygen from ambient room air indefinitely without ever needing gas refills.',
  },
  {
    q: 'What type of water must be used in the humidifier bottle?',
    a: 'You must exclusively use distilled water, demineralized (DM) water, or clean RO drinking water. Regular tap water or unboiled ground water contains mineral salts (calcium and magnesium) that produce white limescale buildup, clogging the internal micro-diffuser and creating a breeding ground for bacterial colonies.',
  },
  {
    q: 'Can the concentrator run on a home inverter during power outages?',
    a: 'Yes. 5 LPM oxygen concentrators consume approximately 280W to 350W of power, allowing them to run smoothly on a standard 1kVA or 1.5kVA home inverter/UPS system. For high-flow ICU patients requiring continuous 24/7 oxygen, having a small portable backup cylinder is also recommended as a clinical safety contingency.',
  },
];

export const OxygenRentalGuidePage: React.FC = () => {
  // Calculator state
  const [flowRate, setFlowRate] = useState<number>(3);
  const [dailyHours, setDailyHours] = useState<number>(12);
  const [durationMonths, setDurationMonths] = useState<number>(2);
  const [selectedLocality, setSelectedLocality] = useState<string>(HYDERABAD_LOCALITIES[0].name);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Calculations
  const isHighFlow = flowRate > 5;
  const recommendedMachineType = isHighFlow ? '10 LPM High-Flow Unit' : '5 LPM Medical Concentrator';
  const monthlyRental = isHighFlow ? 6499 : 3499;
  const totalRentalCost = monthlyRental * durationMonths;
  const estimatedBuyCost = isHighFlow ? 68000 : 35000;
  const savings = estimatedBuyCost - totalRentalCost;
  const shouldRent = savings > 0 && durationMonths <= 6;
  const monthlyElectricityINR = Math.round(((isHighFlow ? 550 : 320) * dailyHours * 30) / 1000 * 7.5);

  const cleanPhone = CONTACT_PHONE.replace(/\D/g, '');
  const whatsappRentalHref = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello BaeMeds, I am reading the Oxygen Rental Guide. I need a ${recommendedMachineType} (${flowRate} LPM for ${dailyHours} hrs/day) in ${selectedLocality}. Please confirm delivery and rental terms.`
  )}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'Oxygen Concentrator Rental in Hyderabad: The Definitive Clinical & Patient Guide',
    headline: 'Oxygen Concentrator Rental in Hyderabad: 5L vs 10L, Costs, Clinical Protocols & Setup',
    description: 'A comprehensive medical and clinical guide on renting home oxygen concentrators in Hyderabad. Compare 5L vs 10L machines, understand pricing, calculate flow requirements, and learn safe caregiver operating protocols.',
    url: `${SITE_URL}/guides/oxygen-concentrator-rental-hyderabad`,
    image: `${SITE_URL}/baemeds-social-preview.jpg`,
    datePublished: '2026-01-15T09:00:00+05:30',
    dateModified: '2026-08-19T12:00:00+05:30',
    author: {
      '@type': 'Person',
      name: 'Dr. S. Arshad & Biomedical Respiratory Care Team',
      jobTitle: 'Clinical Biomedical Specialist',
      worksFor: {
        '@type': 'MedicalBusiness',
        name: APP_NAME,
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
        title="Oxygen Concentrator Rental in Hyderabad (5L & 10L) – Clinical Guide & Rates"
        description="Comprehensive 2026 clinical guide to renting 5L & 10L medical oxygen concentrators in Hyderabad. Detailed pricing, 5L vs 10L comparison, safety guidelines, and 60-min express home delivery."
        canonical="/guides/oxygen-concentrator-rental-hyderabad"
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Article Header & Editorial Masthead */}
      <article className="mx-auto max-w-4xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Link to="/" className="hover:text-teal-700">Home</Link>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-400">Clinical Guides</span>
          <ChevronRight size={13} className="text-slate-400" />
          <span className="text-slate-700 font-semibold truncate">Oxygen Concentrator Rental Hyderabad</span>
        </nav>

        {/* Category & Topic Deck */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-teal-800 border border-teal-200/60">
            Clinical Respiratory Protocol
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs font-medium text-slate-500">Hyderabad Healthcare Field Guide</span>
        </div>

        {/* Main Article Title */}
        <h1 className="mt-4 text-3xl font-serif font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[42px] lg:leading-[1.2]">
          Oxygen Concentrator Rental in Hyderabad: The Complete Patient & Caregiver Clinical Guide
        </h1>

        {/* Article Sub-deck / Lede */}
        <p className="mt-4 text-lg font-serif italic text-slate-600 leading-relaxed sm:text-xl">
          A definitive medical overview on selecting 5 LPM vs. 10 LPM flow capacities, calculating home rental economics, understanding cylinder alternatives, and managing safe 24/7 oxygenation therapy at home.
        </p>

        {/* Byline & Peer Review Metadata Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-slate-200/80 py-3.5 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold text-sm">
              MD
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span>BaeMeds Clinical Respiratory & Biomedical Team</span>
                <BadgeCheck size={14} className="text-teal-600" />
              </div>
              <span className="text-[11px] text-slate-500">Peer-Reviewed for Clinical Accuracy & DME Safety</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> Updated August 2026
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} /> 7 min read
            </span>
          </div>
        </div>

        {/* Quick Summary / Executive Box */}
        <div className="my-8 rounded-xl border border-teal-200 bg-teal-50/50 p-5 sm:p-6 text-sm text-slate-700">
          <h2 className="flex items-center gap-2 font-bold text-teal-950 text-base">
            <Info size={18} className="text-teal-700 shrink-0" />
            <span>Key Takeaways for Caregivers & Families</span>
          </h2>
          <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-800">&bull;</span>
              <span><strong>Cost Efficiency:</strong> For acute therapies under 6 months, renting a 5L machine (approx. ₹3,499/mo) saves over ₹30,000 compared to purchasing.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-800">&bull;</span>
              <span><strong>Capacity Matching:</strong> Prescriptions up to 4 LPM require a standard 5 LPM unit. Prescriptions above 5 LPM strictly mandate a 10 LPM high-flow machine to prevent dangerous purity drop-offs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-800">&bull;</span>
              <span><strong>Emergency Access:</strong> BaeMeds operates 6 localized dispatch hubs across Hyderabad providing guaranteed 60 to 90-minute doorstep installation and on-site purity calibration.</span>
            </li>
          </ul>
        </div>

        {/* Article Body Content */}
        <div className="space-y-10 text-[15px] sm:text-base leading-[1.8] text-slate-700">

          {/* Section 1 */}
          <section id="introduction" className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              1. Understanding Supplemental Home Oxygen Therapy
            </h2>
            <p>
              When a patient is discharged from the hospital following an acute respiratory infection, thoracic surgery, severe pneumonia, or chronic exacerbation of COPD, physicians routinely prescribe <strong>Long-Term Oxygen Therapy (LTOT)</strong>.
            </p>
            <p>
              Under normal atmospheric conditions, room air contains approximately <strong>21% Oxygen</strong> and <strong>78% Nitrogen</strong>. A medical-grade oxygen concentrator uses <em>Pressure Swing Adsorption (PSA)</em> technology with synthetic zeolite molecular sieves to filter out ambient nitrogen, delivering a continuous stream of <strong>93% ± 3% pure medical oxygen</strong> directly to the patient's nasal cannula or mask.
            </p>

            <div className="my-6 rounded-xl border-l-4 border-teal-600 bg-slate-100/70 p-4 text-sm italic text-slate-800">
              "Clinical Rule of Thumb: Supplemental oxygen is a prescribed pharmaceutical drug. The flow rate in Liters Per Minute (LPM) must strictly adhere to the pulmonologist's discharge order to maintain target SpO2 levels (typically 94–98% for general patients, or 88–92% for patients with hypercapnic respiratory failure/COPD)."
            </div>
          </section>

          {/* Section 2: Renting vs Buying */}
          <section id="renting-vs-buying" className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              2. Clinical & Financial Analysis: Should You Rent or Buy?
            </h2>
            <p>
              In Hyderabad, the initial impulse for many families during emergency hospital discharge is to buy a brand-new oxygen concentrator. However, clinical duration data reveals that renting is statistically the most sensible choice for the vast majority of temporary home care scenarios:
            </p>

            <div className="my-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100/80 text-slate-900 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Condition / Scenario</th>
                    <th className="p-3.5">Typical Duration</th>
                    <th className="p-3.5">Financial Recommendation</th>
                    <th className="p-3.5">Average Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Post-Viral / Pneumonia Convalescence</td>
                    <td className="p-3.5">2 to 6 Weeks</td>
                    <td className="p-3.5 font-bold text-teal-800">Rent (Monthly)</td>
                    <td className="p-3.5 text-emerald-700 font-bold">₹30,000+ saved</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Post-Cardiothoracic Surgery Recovery</td>
                    <td className="p-3.5">1 to 3 Months</td>
                    <td className="p-3.5 font-bold text-teal-800">Rent (Monthly)</td>
                    <td className="p-3.5 text-emerald-700 font-bold">₹25,000+ saved</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Palliative / End-of-Life Comfort Care</td>
                    <td className="p-3.5">1 to 4 Months</td>
                    <td className="p-3.5 font-bold text-teal-800">Rent (Monthly)</td>
                    <td className="p-3.5 text-emerald-700 font-bold">₹22,000+ saved</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-slate-900">Advanced COPD (Stage IV) / Severe Fibrosis</td>
                    <td className="p-3.5">12+ Months (Lifelong)</td>
                    <td className="p-3.5 font-bold text-sky-800">Purchase New Unit</td>
                    <td className="p-3.5 text-slate-500">Break-even at month 9</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Interactive NYT-Style Calculator */}
          <section id="interactive-tool" className="my-10 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
              <Sliders size={16} />
              <span>Interactive Clinical Tool</span>
            </div>
            <h3 className="mt-1 text-xl font-serif font-bold text-slate-900 sm:text-2xl">
              Home Oxygen Flow & Rental Cost Estimator
            </h3>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Adjust the prescription sliders below to estimate your exact equipment configuration, power consumption, and monthly rental terms.
            </p>

            <div className="mt-6 space-y-5 rounded-xl bg-slate-50 p-5 border border-slate-200/80">
              {/* Slider 1 */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 sm:text-sm">
                  <span>Prescribed Flow Rate:</span>
                  <span className="font-mono text-teal-800">{flowRate} LPM (Liters/Min)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={flowRate}
                  onChange={(e) => setFlowRate(Number(e.target.value))}
                  className="mt-2 h-1.5 w-full cursor-pointer accent-teal-700"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>1L Low Flow</span>
                  <span>5L Standard Max</span>
                  <span>10L High Flow</span>
                </div>
              </div>

              {/* Slider 2 */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 sm:text-sm">
                  <span>Daily Usage Hours:</span>
                  <span className="font-mono text-teal-800">{dailyHours} Hours / Day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="24"
                  step="2"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="mt-2 h-1.5 w-full cursor-pointer accent-teal-700"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>2h Intermittent</span>
                  <span>8h Nocturnal</span>
                  <span>24h Continuous ICU</span>
                </div>
              </div>

              {/* Slider 3 */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 sm:text-sm">
                  <span>Estimated Duration:</span>
                  <span className="font-mono text-teal-800">{durationMonths} Month{durationMonths > 1 ? 's' : ''}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="mt-2 h-1.5 w-full cursor-pointer accent-teal-700"
                />
              </div>
            </div>

            {/* Estimator Summary Output */}
            <div className="mt-5 grid gap-4 rounded-xl border border-teal-200 bg-teal-50/40 p-4 sm:grid-cols-3 text-xs sm:text-sm">
              <div>
                <span className="text-[11px] text-slate-500">Recommended Hardware:</span>
                <p className="font-bold text-slate-900">{recommendedMachineType}</p>
                <span className="text-[10px] text-teal-700 font-semibold">93% ±3% Certified Purity</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Monthly Rental:</span>
                <p className="font-mono text-base font-bold text-teal-900">₹{monthlyRental.toLocaleString('en-IN')}</p>
                <span className="text-[10px] text-slate-500">Zero Security Deposit</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Estimated Power Cost:</span>
                <p className="font-mono font-bold text-slate-900">~₹{monthlyElectricityINR} / mo</p>
                <span className="text-[10px] text-slate-500">Hyderabad DISCOM Rate</span>
              </div>
            </div>

            {/* Quick Dispatch Link */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-600">
                Doorstep setup with live purity calibration across Hyderabad.
              </span>
              <a
                href={whatsappRentalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-teal-800 px-4 text-xs font-bold text-white hover:bg-teal-900 transition shrink-0 whitespace-nowrap"
              >
                <MessageCircle size={15} />
                <span>Rent {recommendedMachineType.split(' ')[0]} via WhatsApp</span>
              </a>
            </div>
          </section>

          {/* Section 4: 5L vs 10L Clinical Differences */}
          <section id="5l-vs-10l" className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              3. The Critical Clinical Difference: 5 LPM vs. 10 LPM Units
            </h2>
            <p>
              A frequent clinical mistake occurs when a caregiver attempts to operate a 5 LPM machine at 6 or 7 Liters/min because the patient is struggling to breathe. <strong>A 5 LPM concentrator cannot produce more than 5 LPM of pure oxygen.</strong> Forcing the flow beyond 5 LPM causes the molecular sieve to leak unseparated room nitrogen, resulting in the delivered oxygen purity dropping below therapeutic thresholds (down to 65–70%), causing severe hypoxemia.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-teal-600" />
                  <span>When 5 LPM is Medically Sufficient</span>
                </h3>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                  <li>&bull; Patient maintains SpO2 &gt; 92% at 1 to 4 LPM flow.</li>
                  <li>&bull; Delivered via standard nasal cannula.</li>
                  <li>&bull; Post-operative or mild lung infection recovery.</li>
                  <li>&bull; Unit is compact (13.5–14 kg) and whisper-quiet (43 dB).</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <AlertCircle size={16} className="text-amber-600" />
                  <span>When 10 LPM is Mandatory</span>
                </h3>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                  <li>&bull; Patient prescribed 5 to 10 LPM by pulmonologist.</li>
                  <li>&bull; Connected to a High-Flow Non-Rebreather Mask (NRBM) or tracheostomy.</li>
                  <li>&bull; Severe interstitial lung disease (ILD) or post-ARDS.</li>
                  <li>&bull; Dual-flow requirement (two patients sharing one unit).</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5: Caregiver Protocol */}
          <section id="safety-protocol" className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              4. Caregiver Operating Checklist & Safety Guidelines
            </h2>
            <p>
              Safe home oxygen therapy requires strict adherence to biomedical hygiene and fire safety protocols:
            </p>

            <div className="space-y-3 pt-2 text-xs sm:text-sm">
              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <Flame size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Fire Clearance (Minimum 10 Feet)</strong>
                  <p className="text-slate-600 mt-0.5">Oxygen drastically lowers the combustion point of surrounding materials. Ensure the device is positioned at least 10 feet away from gas stoves, pooja diyas, open flames, heaters, and smoking.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <Droplets size={18} className="text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Humidifier Bottle Maintenance</strong>
                  <p className="text-slate-600 mt-0.5">Fill only with distilled or clean RO water between MIN/MAX markers. Discard and refill fresh water daily. Wash the bottle weekly with warm mild soap to prevent bacterial biofilm colonization.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <RotateCcw size={18} className="text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Weekly Air Filter Cleaning</strong>
                  <p className="text-slate-600 mt-0.5">Remove the black foam intake filter at the rear once a week, wash thoroughly under running tap water, dry completely with a clean towel, and reinsert. Never operate the machine without the filter in place.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Delivery Localities in Hyderabad */}
          <section id="hyderabad-delivery" className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              5. Hyderabad Emergency Delivery Zones & Arrival Times
            </h2>
            <p>
              BaeMeds maintains emergency inventory and biomedical field technicians across 6 strategic dispatch centers in the Twin Cities. Select your area below to view the standard delivery timeline:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {HYDERABAD_LOCALITIES.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => setSelectedLocality(loc.name)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-left text-xs transition ${
                    selectedLocality === loc.name
                      ? 'border-teal-700 bg-teal-50 font-bold text-teal-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={13} className={selectedLocality === loc.name ? 'text-teal-700' : 'text-slate-400'} />
                    {loc.name}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 font-normal">{loc.time}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-teal-400 font-bold">Selected Zone: {selectedLocality}</span>
                <p className="text-slate-300">Biomedical field team ready for same-day delivery & setup.</p>
              </div>
              <a
                href={whatsappRentalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition whitespace-nowrap"
              >
                <MessageCircle size={15} />
                <span>Confirm Delivery to {selectedLocality.split('&')[0]}</span>
              </a>
            </div>
          </section>

          {/* Section 7: FAQ Accordion */}
          <section id="faqs" className="space-y-4 pt-6 border-t border-slate-200">
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              6. Frequently Asked Questions
            </h2>

            <div className="space-y-2 pt-2">
              {FAQS.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div key={faq.q} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between p-4 text-left text-xs sm:text-sm font-bold text-slate-900 hover:text-teal-800"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-teal-800' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4 text-xs sm:text-sm leading-relaxed text-slate-600">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 8: Clinical References & Citations */}
          <section id="references" className="pt-8 border-t border-slate-200 text-xs text-slate-500 space-y-2">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Clinical References & Standards</h3>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed text-slate-500">
              <li>World Health Organization (WHO). <em>Technical specifications for oxygen concentrators</em>. Medical Device Technical Series, 2021.</li>
              <li>British Thoracic Society (BTS). <em>Clinical Guideline for Oxygen Use in Adults in Healthcare and Emergency Settings</em>. Thorax, 2017.</li>
              <li>Ministry of Health and Family Welfare (MoHFW), Government of India. <em>National Clinical Management Protocol for Respiratory Hypoxemia</em>, 2022.</li>
              <li>American Association for Respiratory Care (AARC). <em>Clinical Practice Guideline: Oxygen Therapy for Adults in the Acute and Home Care Setting</em>.</li>
            </ol>
          </section>

        </div>

        {/* Editorial Footer & Clinical Inquiries */}
        <footer className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center text-slate-700 shadow-sm">
          <h3 className="text-lg font-serif font-bold text-slate-900">Need Immediate Assistance with an Oxygen Rental in Hyderabad?</h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Our biomedical support team is on standby 24/7 to answer prescription questions, confirm stock, and coordinate rapid doorstep installation.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href={whatsappRentalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white hover:bg-emerald-700 transition"
            >
              <MessageCircle size={16} />
              <span>Contact Biomedical Team on WhatsApp</span>
            </a>
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
            >
              <Phone size={16} className="text-teal-700" />
              <span>Direct Emergency Desk: {CONTACT_PHONE}</span>
            </a>
          </div>
        </footer>

      </article>
    </div>
  );
};

export default OxygenRentalGuidePage;
