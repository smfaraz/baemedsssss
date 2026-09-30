import React, { useState, useEffect, useMemo } from 'react';
import {
  Rocket,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  Truck,
  CreditCard,
  Server,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowRight,
  Play,
  RotateCcw,
  Check,
  Building2,
  PhoneCall,
  Lock,
  Sparkles,
  Layers,
  Activity,
  FileCheck,
} from 'lucide-react';
import { Link } from '../context/CartContext';
import { APP_NAME } from '../constants';

interface RoadmapTask {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
}

interface RoadmapDay {
  day: number;
  date: string;
  phaseId: number;
  phaseTitle: string;
  title: string;
  subtitle: string;
  ownerType: 'Agency' | 'Client' | 'Client & Agency';
  criticality: 'CRITICAL' | 'HIGH' | 'STANDARD';
  deliverables: string[];
  riskMitigation: string;
  tasks: RoadmapTask[];
}

const PHASES = [
  { id: 0, label: 'All 15 Days', icon: Layers, range: 'Oct 01 – Oct 15' },
  { id: 1, label: 'Step 1: Website & Cards', icon: Server, range: 'Days 1–3 (Oct 01–03)' },
  { id: 2, label: 'Step 2: Suppliers & Shipping', icon: Truck, range: 'Days 4–6 (Oct 04–06)' },
  { id: 3, label: 'Step 3: Doctor Checks & Privacy', icon: ShieldCheck, range: 'Days 7–9 (Oct 07–09)' },
  { id: 4, label: 'Step 4: Practice & Testing', icon: Activity, range: 'Days 10–12 (Oct 10–12)' },
  { id: 5, label: 'Step 5: Clinic Preview & Phones', icon: PhoneCall, range: 'Days 13–14 (Oct 13–14)' },
  { id: 6, label: 'Step 6: Big Launch Day!', icon: Rocket, range: 'Day 15 (Oct 15)' },
];

const INITIAL_DAYS: RoadmapDay[] = [
  {
    day: 1,
    date: 'Thu, Oct 01, 2026',
    phaseId: 1,
    phaseTitle: 'Step 1: Website & Cards',
    title: 'Connect the Real Web Address (baemeds.com)',
    subtitle: 'Make sure baemeds.com opens fast everywhere with the safe green lock icon.',
    ownerType: 'Agency',
    criticality: 'CRITICAL',
    deliverables: [
      'baemeds.com opens fast on both phones and computers',
      'The security lock shows safely with no warning screens',
      'All pictures, prices, and text show up clean and quick',
    ],
    riskMitigation: 'If the web address takes a few hours to update on some internet providers, keep our backup link ready.',
    tasks: [
      { id: 'd1-t1', title: 'Open baemeds.com on phone and computer', detail: 'Check that the safe green lock shows with no browser warnings.', completed: true },
      { id: 'd1-t2', title: 'Check all product pictures and text', detail: 'Make sure no images look broken or slow.', completed: true },
      { id: 'd1-t3', title: 'Test loading speed across different US cities', detail: 'Make sure pages open in under 1 second from anywhere.', completed: false },
    ],
  },
  {
    day: 2,
    date: 'Fri, Oct 02, 2026',
    phaseId: 1,
    phaseTitle: 'Step 1: Website & Cards',
    title: 'Turn on Real Cards & Health Savings Cards',
    subtitle: 'Let customers pay with regular cards, health benefit cards (FSA/HSA), and easy monthly payments.',
    ownerType: 'Agency',
    criticality: 'CRITICAL',
    deliverables: [
      'Take real credit cards safely with Stripe',
      'Accept FSA and HSA health benefit cards so patients can buy tax-free',
      'Offer monthly payment plans (Affirm & Klarna) for bigger equipment',
    ],
    riskMitigation: 'If a test payment goes through, refund the money back to the card right away with 1 click.',
    tasks: [
      { id: 'd2-t1', title: 'Turn on live card payments and run a small $1 test', detail: 'Make sure the payment goes through and refund it right away.', completed: true },
      { id: 'd2-t2', title: 'Check that orders show "Paid" instantly', detail: 'The admin dashboard should show the green Paid badge immediately.', completed: false },
      { id: 'd2-t3', title: 'Test a purchase with an FSA/HSA health card', detail: 'Make sure the bank accepts the medical equipment classification.', completed: false },
    ],
  },
  {
    day: 3,
    date: 'Sat, Oct 03, 2026',
    phaseId: 1,
    phaseTitle: 'Step 1: Website & Cards',
    title: 'Set up Email Receipts & Text Updates',
    subtitle: 'Send buyers clear receipts and friendly text messages when their package ships.',
    ownerType: 'Agency',
    criticality: 'HIGH',
    deliverables: [
      'Clear email receipt with the medical codes patients need for insurance payback',
      'Friendly email confirming: "We got your doctor prescription!"',
      'Text message sent to customer phones with their tracking link',
    ],
    riskMitigation: 'Put a big 1-click tracking button in every email so nobody gets confused.',
    tasks: [
      { id: 'd3-t1', title: 'Connect the email system so receipts send out automatically', detail: 'Make sure emails land directly in the inbox, not spam.', completed: false },
      { id: 'd3-t2', title: 'Check receipts on iPhone, Android, and Gmail', detail: 'Make sure receipts are super easy to read and print for insurance.', completed: false },
    ],
  },
  {
    day: 4,
    date: 'Sun, Oct 04, 2026',
    phaseId: 2,
    phaseTitle: 'Step 2: Suppliers & Shipping',
    title: 'Connect with Equipment Warehouses',
    subtitle: 'Send customer orders straight to our partner warehouses (Inogen, DeVilbiss, ResMed).',
    ownerType: 'Client',
    criticality: 'CRITICAL',
    deliverables: [
      'Orders go straight to the warehouse once the doctor approves the prescription',
      'Check our buying prices so every sale makes good profit',
      'Stock numbers update automatically so we never sell something that is sold out',
    ],
    riskMitigation: 'Hold a 3-item safety buffer so we never sell something that just ran out.',
    tasks: [
      { id: 'd4-t1', title: 'Check that oxygen orders include exact model and warranty info', detail: 'Make sure serial numbers and factory warranty codes are saved.', completed: false },
      { id: 'd4-t2', title: 'Send 1 practice order to the warehouse', detail: 'Confirm the warehouse receives the order number cleanly.', completed: false },
    ],
  },
  {
    day: 5,
    date: 'Mon, Oct 05, 2026',
    phaseId: 2,
    phaseTitle: 'Step 2: Suppliers & Shipping',
    title: 'Set up FedEx & UPS Shipping',
    subtitle: 'Print shipping labels and give customers working delivery tracking links.',
    ownerType: 'Client',
    criticality: 'HIGH',
    deliverables: [
      'FedEx fast medical shipping account ready',
      'Print UPS shipping labels with one click',
      'Special helper delivery ready for heavy motorized wheelchairs',
    ],
    riskMitigation: 'Offer 2-day fast delivery for urgent breathing equipment like oxygen machines.',
    tasks: [
      { id: 'd5-t1', title: 'Add a test tracking number in the admin panel', detail: 'Check that the order updates to "Shipped" and the customer gets their tracking link.', completed: true },
      { id: 'd5-t2', title: 'Check shipping rates on the checkout page', detail: 'Standard ($12 / Free over $99), Express ($25), In-Home Setup ($95).', completed: true },
    ],
  },
  {
    day: 6,
    date: 'Tue, Oct 06, 2026',
    phaseId: 2,
    phaseTitle: 'Step 2: Suppliers & Shipping',
    title: 'Write Clear Return & Warranty Rules',
    subtitle: 'Explain how returns work and how the 3-year factory warranty protects buyers.',
    ownerType: 'Client',
    criticality: 'STANDARD',
    deliverables: [
      'Simple 30-day return rule posted on the website',
      'Cleanliness rule: breathing machines must be unopened in the box to return',
      'Simple "Ask for Return" button inside the customer\'s account page',
    ],
    riskMitigation: 'To keep everyone healthy, unopened boxes can be returned, but opened breathing masks cannot.',
    tasks: [
      { id: 'd6-t1', title: 'Check warranty badges on every product page', detail: 'Make sure 3-year factory warranty badges show clearly on all machines.', completed: true },
      { id: 'd6-t2', title: 'Set up a clean table in the warehouse to inspect returned boxes', detail: 'Never put an uninspected box back on the sales shelf.', completed: false },
    ],
  },
  {
    day: 7,
    date: 'Wed, Oct 07, 2026',
    phaseId: 3,
    phaseTitle: 'Step 3: Doctor Checks & Privacy',
    title: 'Practice Doctor Prescription Reviews',
    subtitle: 'Our team doctor checks prescriptions fast so customer orders can ship right away.',
    ownerType: 'Client',
    criticality: 'CRITICAL',
    deliverables: [
      'Doctor reviews prescriptions within 4 hours during the day',
      'Easy lookup to confirm the doctor\'s official medical license',
      'Simple link to help patients get a prescription online if they don\'t have one',
    ],
    riskMitigation: 'No oxygen machine leaves the warehouse until our doctor gives the green light.',
    tasks: [
      { id: 'd7-t1', title: 'Practice approving a prescription in the admin panel', detail: 'Click approve on order BM-722730-720 and make sure it turns green.', completed: true },
      { id: 'd7-t2', title: 'Look up the doctor\'s official license number', detail: 'Check that the doctor name and clinic match official government records.', completed: false },
    ],
  },
  {
    day: 8,
    date: 'Thu, Oct 08, 2026',
    phaseId: 3,
    phaseTitle: 'Step 3: Doctor Checks & Privacy',
    title: 'Lock Down Patient Health Privacy (HIPAA)',
    subtitle: 'Keep customer health records and prescriptions completely safe and private.',
    ownerType: 'Agency',
    criticality: 'CRITICAL',
    deliverables: [
      'Top-level security so only doctors can view customer prescriptions',
      'Signed privacy promises with our software and hosting tools',
      'A safe log that tracks whenever anyone views a prescription',
    ],
    riskMitigation: 'Doctor links close automatically after 15 minutes to keep patient info safe.',
    tasks: [
      { id: 'd8-t1', title: 'Check the staff history log on /admin/audit-logs', detail: 'Make sure every staff login and prescription view is safely recorded.', completed: true },
      { id: 'd8-t2', title: 'Make sure warehouse packers only see the shipping box', detail: 'Packers see what box to ship, but never see personal medical diagnoses.', completed: true },
    ],
  },
  {
    day: 9,
    date: 'Fri, Oct 09, 2026',
    phaseId: 3,
    phaseTitle: 'Step 3: Doctor Checks & Privacy',
    title: 'Check State Sales Tax Rules',
    subtitle: 'Make sure we charge the right sales tax (or 0% tax when prescriptions are tax-free).',
    ownerType: 'Client',
    criticality: 'HIGH',
    deliverables: [
      'No sales tax ($0) in states where doctor-prescribed equipment is tax-free (like Delaware & Pennsylvania)',
      'Charge normal state tax on regular accessories when needed',
      'Clear receipts so patients can ask their health insurance for money back',
    ],
    riskMitigation: 'Save every tax receipt automatically so end-of-year tax filing is easy and painless.',
    tasks: [
      { id: 'd9-t1', title: 'Test an order to Delaware and Pennsylvania', detail: 'Verify the tax shows $0.00 as legally required for prescriptions.', completed: true },
      { id: 'd9-t2', title: 'Make sure the tax amount shows clearly on the receipt', detail: 'Needed for patients filing Medicare or private insurance payback claims.', completed: true },
    ],
  },
  {
    day: 10,
    date: 'Sat, Oct 10, 2026',
    phaseId: 4,
    phaseTitle: 'Step 4: Practice & Testing',
    title: 'Run 5 Practice Orders from Start to Finish',
    subtitle: 'Buy real machines with real cards, check prescriptions, and track delivery.',
    ownerType: 'Client & Agency',
    criticality: 'CRITICAL',
    deliverables: [
      'Place 5 test orders for different machines',
      'Doctor approves the test prescriptions in under 15 minutes',
      'Tracking text messages sent to test phones',
      'Refund test money back to the cards right away',
    ],
    riskMitigation: 'Have 3 people buy at the exact same second to make sure the site stays fast.',
    tasks: [
      { id: 'd10-t1', title: 'Order an oxygen machine and upload a test doctor note', detail: 'Check that the order appears in the admin queue waiting for the doctor.', completed: true },
      { id: 'd10-t2', title: 'Have Dr. Reed approve it in the admin panel', detail: 'Check that the status changes to approved and triggers the warehouse.', completed: true },
      { id: 'd10-t3', title: 'Type in a test FedEx tracking number', detail: 'Check that the tracking link shows up on the customer account page.', completed: true },
    ],
  },
  {
    day: 11,
    date: 'Sun, Oct 11, 2026',
    phaseId: 4,
    phaseTitle: 'Step 4: Practice & Testing',
    title: 'Test the Website on Phones & Tablets',
    subtitle: 'Make sure buttons are big and easy to tap, text is easy to read, and pages load fast.',
    ownerType: 'Agency',
    criticality: 'HIGH',
    deliverables: [
      'Pages open in 1 second on cell phones',
      'Big "Add to Cart" and "Buy Now" buttons that are easy to press',
      'Large, clear text that older folks can read without squinting',
    ],
    riskMitigation: 'Keep photos small in file size so pages open fast even on weak cell service.',
    tasks: [
      { id: 'd11-t1', title: 'Test the checkout page on iPhone and Android phones', detail: 'Make sure the order button is always easy to see and press.', completed: true },
      { id: 'd11-t2', title: 'Check font sizes and colors for seniors', detail: 'Ensure font sizes are large and text is clear and readable.', completed: true },
    ],
  },
  {
    day: 12,
    date: 'Mon, Oct 12, 2026',
    phaseId: 4,
    phaseTitle: 'Step 4: Practice & Testing',
    title: 'Connect Products to Google Search & Shopping',
    subtitle: 'Help customers find our equipment when they search on Google.',
    ownerType: 'Agency',
    criticality: 'STANDARD',
    deliverables: [
      'Send our product list to Google so our items show up in shopping searches',
      'Show real prices, photos, and in-stock badges right on Google Shopping',
      'Tell Google and Bing about all our web pages',
    ],
    riskMitigation: 'Include clear medical notes on every page so Google approves all ads smoothly.',
    tasks: [
      { id: 'd12-t1', title: 'Test how products look when searched on Google', detail: 'Confirm that prices, photos, and star ratings show up correctly.', completed: true },
      { id: 'd12-t2', title: 'Submit our website map to Google Search Console', detail: 'Make sure all category and product pages are ready for Google to find.', completed: false },
    ],
  },
  {
    day: 13,
    date: 'Tue, Oct 13, 2026',
    phaseId: 5,
    phaseTitle: 'Step 5: Clinic Preview & Phones',
    title: 'Let Partner Clinics Order First',
    subtitle: 'Invite 10 friendly sleep clinics and doctor offices to try ordering first.',
    ownerType: 'Client',
    criticality: 'CRITICAL',
    deliverables: [
      'Invite 10 local doctor offices with friendly discounts',
      'Bulk order page ready for clinics buying 5 or more machines',
      'Deliver the first 25 real orders and collect happy reviews',
    ],
    riskMitigation: 'Have our team watch every clinic order live to help immediately if anyone has questions.',
    tasks: [
      { id: 'd13-t1', title: 'Email invitations to 10 partner clinics with their login code', detail: 'Help clinic managers log in and place trial orders.', completed: false },
      { id: 'd13-t2', title: 'Watch the website live to ensure zero crashes and zero errors', detail: 'Make sure every clinic page loads instantly.', completed: false },
    ],
  },
  {
    day: 14,
    date: 'Wed, Oct 14, 2026',
    phaseId: 5,
    phaseTitle: 'Step 5: Clinic Preview & Phones',
    title: 'Test the 1-800 Phone Line & Help Desk',
    subtitle: 'Make sure customers can reach a friendly, helpful human within 3 rings.',
    ownerType: 'Client',
    criticality: 'HIGH',
    deliverables: [
      'Answer the 1-800 phone number in 3 rings with friendly, helpful staff',
      'Helpful live chat on the website for quick questions',
      'All 5 team leads give a green thumbs up for launch tomorrow',
    ],
    riskMitigation: 'Keep a staff member on call 24/7 for urgent oxygen questions.',
    tasks: [
      { id: 'd14-t1', title: 'Call 1-800-555-0199 from both iPhones and Androids', detail: 'Make sure the sound is crystal clear and calls connect fast.', completed: false },
      { id: 'd14-t2', title: 'Hold a 15-minute team check: All 5 leads say "Ready!"', detail: 'Everyone signs off that their department is 100% prepared.', completed: false },
    ],
  },
  {
    day: 15,
    date: 'Thu, Oct 15, 2026',
    phaseId: 6,
    phaseTitle: 'Step 6: Big Launch Day!',
    title: 'Official Launch Day across all 50 States!',
    subtitle: 'Open the store to the whole country and start welcoming customers!',
    ownerType: 'Client & Agency',
    criticality: 'CRITICAL',
    deliverables: [
      'Website is 100% open to all 50 US states',
      'Turn on Google ads for people looking to buy oxygen and sleep machines',
      'Send announcement email to 12,000 doctor offices and clinics',
      'Whole team stays on live chat and phone all day to help buyers',
    ],
    riskMitigation: 'Tech team watches servers closely all day to handle lots of visitors.',
    tasks: [
      { id: 'd15-t1', title: '08:00 AM: Final 10-minute check of payments, website, and products', detail: 'Make sure card checkout, database, and products are working cleanly.', completed: false },
      { id: 'd15-t2', title: '09:00 AM: Open the doors, send emails, and welcome our first shoppers', detail: 'Turn on Google ads and welcome our first nationwide customers.', completed: false },
      { id: 'd15-t3', title: 'All Day: Pack orders fast, answer calls with a smile, and celebrate!', detail: 'Track first day sales, doctor approvals, and customer happiness.', completed: false },
    ],
  },
];

const STORAGE_KEY = 'baemeds_launch_roadmap_v4';

export const LaunchRoadmapPage: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<number>(0);
  const [days, setDays] = useState<RoadmapDay[]>(() => {
    try {
      // Clear out legacy cached data that had DevOps Lead / Platform Engineering tags
      localStorage.removeItem('baemeds_launch_roadmap');
      localStorage.removeItem('baemeds_launch_roadmap_v2');
      localStorage.removeItem('baemeds_launch_roadmap_v3');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DAYS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorStep, setSimulatorStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);

  // Target Date: October 15, 2026, 09:00:00 EST
  const targetDate = useMemo(() => new Date('2026-10-15T09:00:00-05:00').getTime(), []);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 14,
    hours: 10,
    minutes: 51,
    seconds: 37,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Persist tasks in localStorage
  const handleToggleTask = (dayNumber: number, taskId: string) => {
    setDays((prev) => {
      const updated = prev.map((d) => {
        if (d.day !== dayNumber) return d;
        return {
          ...d,
          tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetChecklist = () => {
    if (window.confirm('Reset all checklist progress back to default?')) {
      localStorage.removeItem(STORAGE_KEY);
      setDays(INITIAL_DAYS);
    }
  };

  // Metrics
  const totalTasks = useMemo(() => days.reduce((sum, d) => sum + d.tasks.length, 0), [days]);
  const completedTasks = useMemo(
    () => days.reduce((sum, d) => sum + d.tasks.filter((t) => t.completed).length, 0),
    [days]
  );
  const readinessPercent = useMemo(
    () => Math.round((completedTasks / (totalTasks || 1)) * 100),
    [completedTasks, totalTasks]
  );

  const filteredDays = useMemo(() => {
    return days.filter((d) => {
      const matchesPhase = selectedPhase === 0 || d.phaseId === selectedPhase;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.subtitle.toLowerCase().includes(q) ||
        d.phaseTitle.toLowerCase().includes(q) ||
        d.ownerType.toLowerCase().includes(q) ||
        d.deliverables.some((del) => del.toLowerCase().includes(q));
      return matchesPhase && matchesSearch;
    });
  }, [days, selectedPhase, searchQuery]);

  // Quick System Test Drill
  const runSimulator = () => {
    setIsSimulatorOpen(true);
    setIsSimulating(true);
    setSimulatorStep(1);
    setSimLogs(['[00:00:01] Starting quick system check...']);

    const steps = [
      { step: 1, delay: 1000, log: '✓ [READY] Website address is connected and safe with the green lock.' },
      { step: 2, delay: 2200, log: '✓ [READY] Credit cards and health savings (FSA/HSA) cards work.' },
      { step: 3, delay: 3400, log: '✓ [READY] All medical machines are listed with photos and prices.' },
      { step: 4, delay: 4600, log: '✓ [READY] Doctor prescription review screen is ready for Dr. Reed.' },
      { step: 5, delay: 5800, log: '✓ [READY] Patient health privacy is safely locked in.' },
      { step: 6, delay: 7000, log: '🚀 [ALL READY] Everything is set for Opening Day!' },
    ];

    steps.forEach((s) => {
      setTimeout(() => {
        setSimulatorStep(s.step);
        setSimLogs((prev) => [...prev, s.log]);
        if (s.step === 6) setIsSimulating(false);
      }, s.delay);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-teal-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20"
            >
              <Rocket size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-white">{APP_NAME} USA</span>
                <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-400">
                  15-DAY LAUNCH PLAN
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                15-Day Plan to Open the Store • Launch Day: Oct 15, 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={runSimulator}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-teal-500/25 hover:brightness-110 transition"
            >
              <Play size={14} className="fill-white" /> Run Quick Check
            </button>

            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              <Stethoscope size={14} className="text-teal-400" />
              <span>Admin Panel</span>
            </Link>

            <Link
              to="/"
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              <ExternalLink size={14} />
              <span>Visit Store</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Roadmap Body */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12 space-y-10 relative">
        {/* Hero Banner with Countdown & Live Readiness */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-10 shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                <Sparkles size={14} />
                <span>15 DAYS UNTIL OPENING DAY</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Our 15-Day Launch Plan
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl font-normal">
                Our website is built and ready! We have the medical equipment, card checkout, doctor prescription reviews, and order tracking all in place. Here is our simple 15-day step-by-step plan to open the doors to customers across all 50 states on{' '}
                <strong className="text-white font-semibold">Thursday, October 15, 2026</strong>.
              </p>

              {/* Live Readiness Bar */}
              <div className="pt-2 max-w-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-teal-400" />
                    Tasks Completed
                  </span>
                  <span className="text-teal-400 font-mono text-sm">
                    {completedTasks} of {totalTasks} Tasks Done ({readinessPercent}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 transition-all duration-500 shadow-sm shadow-teal-500/50"
                    style={{ width: `${readinessPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Countdown Clock Display */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-xl backdrop-blur-xs">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 mb-4 flex items-center justify-between">
                <span>Countdown to Opening Day</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </p>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/90 p-3">
                  <span className="block font-mono text-2xl sm:text-3xl font-black text-white">{timeLeft.days}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days</span>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/90 p-3">
                  <span className="block font-mono text-2xl sm:text-3xl font-black text-white">{timeLeft.hours}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hours</span>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/90 p-3">
                  <span className="block font-mono text-2xl sm:text-3xl font-black text-white">{timeLeft.minutes}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mins</span>
                </div>
                <div className="rounded-xl border border-slate-800/80 bg-slate-900/90 p-3">
                  <span className="block font-mono text-2xl sm:text-3xl font-black text-teal-400">{timeLeft.seconds}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secs</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-teal-400" /> Oct 15, 09:00 AM EST
                </span>
                <span className="text-emerald-400 font-bold">● Everything on Track</span>
              </div>
            </div>
          </div>
        </section>

        {/* Phase Filter & Quick Actions */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Daily Steps & Checklist</h2>
              <p className="text-xs text-slate-400">Click any step below to see what needs to be done each day.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks or team names..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleResetChecklist}
                title="Start checklist over"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Phase Pill Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {PHASES.map((phase) => {
              const Icon = phase.icon;
              const isSelected = selectedPhase === phase.id;
              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setSelectedPhase(phase.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    isSelected
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                      : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-white' : 'text-teal-400'} />
                  <span>{phase.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Day-by-Day Detailed Timeline Cards */}
        <section className="space-y-4">
          {filteredDays.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400">
              <Layers size={32} className="mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-semibold text-white">No items found for this search.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPhase(0);
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-teal-400 underline font-semibold"
              >
                Show all 15 days
              </button>
            </div>
          ) : (
            filteredDays.map((d) => {
              const dayCompleted = d.tasks.every((t) => t.completed);

              return (
                <article
                  key={d.day}
                  className={`group relative rounded-2xl border p-5 sm:p-6 transition-all duration-200 ${
                    dayCompleted
                      ? 'border-emerald-500/30 bg-slate-900/40 hover:border-emerald-500/50'
                      : 'border-slate-800/80 bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black uppercase tracking-wider text-teal-400">
                          DAY {d.day.toString().padStart(2, '0')} • {d.date}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                          {d.phaseTitle}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase ${
                            d.criticality === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : d.criticality === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {d.criticality === 'CRITICAL' ? 'Top Priority' : d.criticality === 'HIGH' ? 'Important' : 'Normal'}
                        </span>
                        {dayCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            <CheckCircle2 size={11} /> Done ✓
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-white group-hover:text-teal-300 transition">
                        {d.title}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-3xl">{d.subtitle}</p>
                    </div>

                    {/* Responsible: Client or Agency */}
                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">Responsible:</span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black tracking-wide border shadow-sm ${
                          d.ownerType === 'Agency'
                            ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                            : d.ownerType === 'Client'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                            : 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                        }`}
                      >
                        {d.ownerType === 'Agency' && <Building2 size={13} className="text-cyan-400" />}
                        {d.ownerType === 'Client' && <Users size={13} className="text-emerald-400" />}
                        {d.ownerType === 'Client & Agency' && <Sparkles size={13} className="text-purple-400" />}
                        <span>{d.ownerType}</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Grid: Tasks vs Deliverables & Risk */}
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    {/* Left: Interactive Checklist */}
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileCheck size={13} className="text-teal-400" />
                        Checklist ({d.tasks.filter((t) => t.completed).length} of {d.tasks.length} done)
                      </p>

                      <div className="space-y-2">
                        {d.tasks.map((task) => (
                          <label
                            key={task.id}
                            className={`flex items-start gap-3 rounded-xl border p-2.5 cursor-pointer text-xs transition ${
                              task.completed
                                ? 'border-emerald-500/30 bg-emerald-950/10 text-slate-300'
                                : 'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleTask(d.day, task.id)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500"
                            />
                            <div className="min-w-0">
                              <p className={`font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                                {task.title}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5 font-normal">{task.detail}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Right: Key Deliverables & Risk Mitigation */}
                    <div className="space-y-4">
                      {/* Deliverables */}
                      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                          <Check size={13} />
                          What Needs to Be Done:
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {d.deliverables.map((del, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-teal-400 shrink-0 mt-0.5 font-bold">›</span>
                              <span>{del}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Contingency / Risk */}
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90 flex items-start gap-2">
                        <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-300 font-bold block mb-0.5">Backup Plan:</strong>
                          <span className="text-[11px] leading-relaxed text-amber-200/80">{d.riskMitigation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Client vs Agency Responsibilities Grid */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">RESPONSIBILITIES</span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-1">Client & Agency Breakdown</h2>
              <p className="text-xs text-slate-400">
                Clear division of work between the Agency (Website & Tech) and the Client (BaeMeds Healthcare Operations).
              </p>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              <Users size={14} /> Open Admin Panel
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Agency Card */}
            <div className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Agency</h3>
                    <p className="text-[11px] text-cyan-400 font-semibold">Website, Engineering & Digital Setup</p>
                  </div>
                </div>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-300 border border-cyan-500/20">
                  7 Key Deliverables
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Domain & SSL:</strong> Connect baemeds.com with fast edge routing and green lock security.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Card & Health Payments:</strong> Turn on Stripe live cards, FSA/HSA cards, and monthly plans.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Email & SMS:</strong> Automated itemized receipts, prescription receipts, and tracking links.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Data Privacy (HIPAA):</strong> Encrypted prescription files and secure staff audit logging.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Mobile & Speed:</strong> Sub-second load times on cell phones and senior-friendly font sizes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Google Shopping:</strong> Connect product feeds, prices, and star ratings for Google searches.</span>
                </li>
              </ul>
            </div>

            {/* Client Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Client</h3>
                    <p className="text-[11px] text-emerald-400 font-semibold">BaeMeds Healthcare Operations & Business</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/20">
                  8 Key Deliverables
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Equipment Warehouses:</strong> Finalize wholesale accounts with Inogen, DeVilbiss, and ResMed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Carrier Accounts:</strong> FedEx Healthcare and UPS Ground accounts for label printing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Returns & Warranties:</strong> 30-day return policy and clean return inspection table in warehouse.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Doctor Reviews:</strong> Dr. Evelyn Reed checks prescriptions within 4 hours in the admin panel.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>State Taxes:</strong> 50-state sales tax setup and 0% tax rules for prescribed machines.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Phone & Customer Care:</strong> Staff the 1-800 toll-free phone line (+1 800 555-0199) and live chat.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Joint Box */}
          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-purple-400 shrink-0" />
              <div>
                <strong className="text-purple-300 font-bold block">Joint Collaboration (Client & Agency):</strong>
                <span className="text-slate-300">
                  5 Practice test orders (Day 10), Partner clinic preview (Day 13), and Launch Day 50-state monitoring (Day 15).
                </span>
              </div>
            </div>
            <span className="shrink-0 rounded-xl bg-purple-500/20 px-3 py-1 text-[11px] font-bold text-purple-300 border border-purple-500/40">
              Shared Effort
            </span>
          </div>
        </section>

        {/* Day 15 Hour-by-Hour Launch Protocol */}
        <section className="rounded-3xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/20 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md">
              <Rocket size={20} />
            </span>
            <div>
              <h3 className="text-xl font-black text-white">Launch Day Schedule (Thursday, October 15, 2026)</h3>
              <p className="text-xs text-teal-400">What we do hour-by-hour on our big opening day.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1.5">
              <span className="font-mono text-xs font-black text-teal-400">08:00 AM EST</span>
              <p className="font-bold text-white">Quick Final Check</p>
              <p className="text-slate-400">Make sure card payments, website, and products are working fast.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1.5">
              <span className="font-mono text-xs font-black text-teal-400">09:00 AM EST</span>
              <p className="font-bold text-white">Open the Doors!</p>
              <p className="text-slate-400">Open the website to everyone across all 50 states and send the announcement email.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1.5">
              <span className="font-mono text-xs font-black text-teal-400">09:30 AM EST</span>
              <p className="font-bold text-white">Turn on Google Ads</p>
              <p className="text-slate-400">Help people searching for oxygen and sleep machines find us easily.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1.5">
              <span className="font-mono text-xs font-black text-teal-400">12:00 PM – Night</span>
              <p className="font-bold text-white">Watch Orders & Help Buyers</p>
              <p className="text-slate-400">Ship orders fast, review prescriptions, and answer calls with a smile.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-teal-400 animate-pulse" />
                <h3 className="font-bold text-sm text-white">BaeMeds Quick System Check</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="h-64 overflow-y-auto rounded-xl border border-slate-900 bg-black/60 p-4 font-mono text-[11px] space-y-2 text-slate-300">
              {simLogs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  {log.includes('[READY]') || log.includes('[ALL READY]') ? (
                    <span className="text-emerald-400 font-bold">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
              {isSimulating && (
                <div className="flex items-center gap-2 text-teal-400 animate-pulse">
                  <span>Checking step {simulatorStep} of 6...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {isSimulating ? 'Checking systems now...' : 'Check finished! All systems look great and ready.'}
              </span>
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(false)}
                className="rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-white hover:bg-teal-600 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaunchRoadmapPage;
