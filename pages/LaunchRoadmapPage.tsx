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
  Download,
  Share2,
  Check,
  Building2,
  PhoneCall,
  Lock,
  Sparkles,
  Layers,
  Activity,
  FileCheck,
  BadgeAlert,
  Sliders,
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
  owner: {
    name: string;
    role: string;
    avatar: string;
  };
  criticality: 'CRITICAL' | 'HIGH' | 'STANDARD';
  deliverables: string[];
  riskMitigation: string;
  tasks: RoadmapTask[];
}

const PHASES = [
  { id: 0, label: 'All 15 Days', icon: Layers, range: 'Oct 01 – Oct 15' },
  { id: 1, label: 'Phase 1: Edge & Merchant', icon: Server, range: 'Days 1–3 (Oct 01–03)' },
  { id: 2, label: 'Phase 2: Logistics & Dropship', icon: Truck, range: 'Days 4–6 (Oct 04–06)' },
  { id: 3, label: 'Phase 3: Regulatory & HIPAA', icon: ShieldCheck, range: 'Days 7–9 (Oct 07–09)' },
  { id: 4, label: 'Phase 4: Pilot & Stress QA', icon: Activity, range: 'Days 10–12 (Oct 10–12)' },
  { id: 5, label: 'Phase 5: Soft Launch & Care', icon: PhoneCall, range: 'Days 13–14 (Oct 13–14)' },
  { id: 6, label: 'Phase 6: Public Go-Live', icon: Rocket, range: 'Day 15 (Oct 15)' },
];

const INITIAL_DAYS: RoadmapDay[] = [
  {
    day: 1,
    date: 'Thu, Oct 01, 2026',
    phaseId: 1,
    phaseTitle: 'Production Edge Infrastructure',
    title: 'Domain, Edge Routing, SSL & Security Headers',
    subtitle: 'Point apex domain, configure Cloudflare edge CDN, and enforce TLS 1.3/HSTS.',
    owner: {
      name: 'DevOps Lead',
      role: 'Platform Engineering',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'CRITICAL',
    deliverables: [
      'DNS A/CNAME records routed to edge host',
      'HSTS max-age=31536000 & TLS 1.3 enforced',
      'Content Security Policy (CSP) whitelisted for Stripe & AWS S3/CloudFront',
    ],
    riskMitigation: 'Have fallback apex redirect rules ready in Cloudflare if DNS propagation fluctuates.',
    tasks: [
      { id: 'd1-t1', title: 'Verify apex domain (baemeds.com) SSL cert issuance', detail: 'Zero downtime certificate handshake validation.', completed: true },
      { id: 'd1-t2', title: 'Audit CSP policy against live third-party endpoints', detail: 'Ensure Supabase, CloudFront images, and fonts load with zero console warnings.', completed: true },
      { id: 'd1-t3', title: 'Test multi-region latency benchmarks', detail: 'Sub-40ms response across US East (N. Virginia) and US West (Oregon).', completed: false },
    ],
  },
  {
    day: 2,
    date: 'Fri, Oct 02, 2026',
    phaseId: 1,
    phaseTitle: 'Production Edge Infrastructure',
    title: 'Live Merchant Processing & FSA/HSA Gateway',
    subtitle: 'Switch Stripe & merchant accounts from test sandbox to live 50-state payment processing.',
    owner: {
      name: 'Payment Ops',
      role: 'Finance & Compliance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'CRITICAL',
    deliverables: [
      'Stripe Production live API keys and webhook signing secrets',
      'MCC/SIC Code 5912/5047 registered for FSA & HSA debit card acceptance',
      'Affirm & Klarna medical equipment monthly financing active',
    ],
    riskMitigation: 'Confirm settlement accounts in Delaware commercial bank with automated payout schedules.',
    tasks: [
      { id: 'd2-t1', title: 'Input production STRIPE_SECRET_KEY into server environment', detail: 'Test with $1 authorization hold and verify instant void.', completed: true },
      { id: 'd2-t2', title: 'Verify SIGINT webhook handler for invoice.paid & payment_intent.succeeded', detail: 'Synchronous order state transition to PAID in AdminService.', completed: false },
      { id: 'd2-t3', title: 'Conduct trial purchase with actual Flex/FSA card', detail: 'Ensure 90/10 inventory rule passes for medical equipment.', completed: false },
    ],
  },
  {
    day: 3,
    date: 'Sat, Oct 03, 2026',
    phaseId: 1,
    phaseTitle: 'Production Edge Infrastructure',
    title: 'Branded Transactional Email & Patient SMS Alerts',
    subtitle: 'Establish automated receipting, prescription receipt confirmations, and carrier tracking emails.',
    owner: {
      name: 'Communications Eng',
      role: 'Patient Engagement',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'HIGH',
    deliverables: [
      'DKIM, SPF & DMARC 100% verified for mail.baemeds.com',
      'Custom HTML templates for Order Confirmation with HCPCS insurance breakdown',
      'Twilio SMS automated dispatch alerts',
    ],
    riskMitigation: 'Include unguessable tracking links so patients can track shipments without typing login details.',
    tasks: [
      { id: 'd3-t1', title: 'Configure Resend/SendGrid transactional routing', detail: 'Test bounce handling and rate limits under 1,000/hr bursts.', completed: false },
      { id: 'd3-t2', title: 'Preview email template on Gmail, Outlook, and Apple Mail', detail: 'Check responsive clinical invoice rendering.', completed: false },
    ],
  },
  {
    day: 4,
    date: 'Sun, Oct 04, 2026',
    phaseId: 2,
    phaseTitle: 'Logistics & Dropship Wholesale',
    title: 'Distributor Dropship Order Routing (EDI / Webhook)',
    subtitle: 'Automate order dispatch to Drive DeVilbiss, Inogen, ResMed, and wholesale depots.',
    owner: {
      name: 'Supply Chain Lead',
      role: 'Operations & Procurement',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'CRITICAL',
    deliverables: [
      'Automated EDI 850 / REST webhook order dispatch on CLINICAL_APPROVED status',
      'Wholesale pricing margin confirmation against MSRP rules',
      'Real-time inventory decrement sync',
    ],
    riskMitigation: 'Maintain 3-unit safety buffer so items do not sell out before wholesale feed refreshes.',
    tasks: [
      { id: 'd4-t1', title: 'Verify EDI 850 schema mapping for oxygen concentrators', detail: 'Map serial number tracking and lot code requirements.', completed: false },
      { id: 'd4-t2', title: 'Test distributor staging endpoint responses', detail: 'Confirm purchase order number echo BM-XXXXXX-XXX.', completed: false },
    ],
  },
  {
    day: 5,
    date: 'Mon, Oct 05, 2026',
    phaseId: 2,
    phaseTitle: 'Logistics & Dropship Wholesale',
    title: 'FedEx Priority Health, UPS & White-Glove Courier Setup',
    subtitle: 'Hook up carrier accounts and live tracking webhooks to auto-populate customer order views.',
    owner: {
      name: 'Logistics Coordinator',
      role: 'Fulfillment Specialist',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'HIGH',
    deliverables: [
      'Commercial FedEx Priority Healthcare account credentials',
      'UPS Ground automated label generation via /api/admin/orders',
      'White-glove regional technician delivery booking calendar for hospital beds',
    ],
    riskMitigation: 'Provide automatic 2-business-day delivery guarantees for critical respiratory equipment.',
    tasks: [
      { id: 'd5-t1', title: 'Test live tracking number webhook callback', detail: 'Verify SHIPPED status auto-transitions in memory & customer portal.', completed: true },
      { id: 'd5-t2', title: 'Validate carrier rates table in Admin Shipping settings', detail: 'Standard ($12 / Free over $99), Priority ($25), White-Glove ($95).', completed: true },
    ],
  },
  {
    day: 6,
    date: 'Tue, Oct 06, 2026',
    phaseId: 2,
    phaseTitle: 'Logistics & Dropship Wholesale',
    title: 'Return Merchandise Authorization (RMA) & Hygiene Protocols',
    subtitle: 'Standard Operating Procedures for unopened medical equipment returns and FDA seals.',
    owner: {
      name: 'QA & Operations',
      role: 'Warehouse Operations',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'STANDARD',
    deliverables: [
      'Published 30-Day Factory-Sealed Return Policy at /policies/returns',
      'Biomedical hygiene inspection checklist for returned units',
      'Automated RMA generation in Customer Account view',
    ],
    riskMitigation: 'Strictly prohibit returns of opened sleep masks or oxygen tubing per FDA infection control rules.',
    tasks: [
      { id: 'd6-t1', title: 'Review warranty disclaimer text on PDP pages', detail: 'Ensure 3-year manufacturer warranty terms are prominent.', completed: true },
      { id: 'd6-t2', title: 'Establish quarantine bin protocol for returned parcels', detail: 'Prevent uninspected units from re-entering active inventory.', completed: false },
    ],
  },
  {
    day: 7,
    date: 'Wed, Oct 07, 2026',
    phaseId: 3,
    phaseTitle: 'Regulatory, HIPAA & State Tax',
    title: 'Clinical Specialist Workflow & Telehealth Prescription Drill',
    subtitle: 'Dry run prescription triage queue with Dr. Evelyn Reed, MD and respiratory care team.',
    owner: {
      name: 'Dr. Evelyn Reed, MD',
      role: 'Clinical Specialist Lead',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'CRITICAL',
    deliverables: [
      '4-Hour Prescription Review SLA documented in clinical handbook',
      'Prescription validation checklist against state medical board registries',
      'Telehealth affiliate bridge for patients seeking immediate Rx consultation',
    ],
    riskMitigation: 'Automatic order hold enforcement: regulated DME cannot transition to SHIPPED without approval.',
    tasks: [
      { id: 'd7-t1', title: 'Conduct triage drill on /admin/prescriptions', detail: 'Approve test order BM-722730-720 and verify CLINICAL_APPROVED transition.', completed: true },
      { id: 'd7-t2', title: 'Verify NPI (National Provider Identifier) lookup integration', detail: 'Check doctor active status in CMS database.', completed: false },
    ],
  },
  {
    day: 8,
    date: 'Thu, Oct 08, 2026',
    phaseId: 3,
    phaseTitle: 'Regulatory, HIPAA & State Tax',
    title: 'HIPAA Title II Security Audit & Business Associate Agreements',
    subtitle: 'Sign BAAs with cloud infrastructure providers and verify immutable audit trail logging.',
    owner: {
      name: 'Marcus Vance, CCO',
      role: 'Compliance Officer',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'CRITICAL',
    deliverables: [
      'Signed BAAs with Supabase, AWS CloudFront, and Resend',
      'Verified AES-256 server-side encryption on all uploaded patient prescription files',
      'Immutable cryptographic event log verified at /admin/audit-logs',
    ],
    riskMitigation: 'Implement 15-minute expiring presigned URLs for all clinical document viewing.',
    tasks: [
      { id: 'd8-t1', title: 'Run automated HIPAA audit log inspection', detail: 'Verify every staff login, role switch, and prescription view is logged.', completed: true },
      { id: 'd8-t2', title: 'Confirm complete PHI redaction for support & fulfillment roles', detail: 'Non-clinical roles must not see physician notes or diagnoses.', completed: true },
    ],
  },
  {
    day: 9,
    date: 'Fri, Oct 09, 2026',
    phaseId: 3,
    phaseTitle: 'Regulatory, HIPAA & State Tax',
    title: '50-State Sales Tax Nexus & DME Exemption Testing',
    subtitle: 'Verify authoritative tax engine handles prescription exemptions and state reporting.',
    owner: {
      name: 'Tax Counsel',
      role: 'Finance Operations',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'HIGH',
    deliverables: [
      'Verified state tax table across DE (0%), MT, NH, OR, AK, PA, NY, CA',
      'DME exemption logic correctly applies 0% tax on prescription orders where legally mandated',
      'Commercial invoice template meets insurance claim reimbursement standards',
    ],
    riskMitigation: 'Tax nexus rules must be logged per transaction with audit reference code.',
    tasks: [
      { id: 'd9-t1', title: 'Simulate checkout in non-exempt vs. exempt states', detail: 'Validate 0% tax for Delaware and medical exemption in Pennsylvania.', completed: true },
      { id: 'd9-t2', title: 'Confirm separate tax line item in customer order receipt', detail: 'Fulfills Medicare Part B supplemental claim requirements.', completed: true },
    ],
  },
  {
    day: 10,
    date: 'Sat, Oct 10, 2026',
    phaseId: 4,
    phaseTitle: 'Pilot & Stress Testing',
    title: 'Order Zero Live Sandbox Drill (End-to-End Simulation)',
    subtitle: 'Run complete commercial transactions with actual staff members acting in all roles.',
    owner: {
      name: 'Super Admin',
      role: 'General Operations',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'CRITICAL',
    deliverables: [
      '5 distinct order types successfully processed end-to-end',
      'Clinical Rx review completed within 15 minutes of upload',
      'Fulfillment tracking generated and verified on mobile',
      'Test funds successfully settled and voided',
    ],
    riskMitigation: 'Conduct drill during simulated peak load with multiple concurrent sessions.',
    tasks: [
      { id: 'd10-t1', title: 'Place regulated Oxygen Concentrator order on /checkout', detail: 'Attest prescription, upload PDF, verify CLINICAL_REVIEW status.', completed: true },
      { id: 'd10-t2', title: 'Dr. Reed approves order on /admin/prescriptions', detail: 'Verify automatic status shift to CLINICAL_APPROVED.', completed: true },
      { id: 'd10-t3', title: 'Fulfillment Lead assigns FedEx tracking on /admin/orders', detail: 'Verify customer receives live tracking badge in /account.', completed: true },
    ],
  },
  {
    day: 11,
    date: 'Sun, Oct 11, 2026',
    phaseId: 4,
    phaseTitle: 'Pilot & Stress Testing',
    title: 'Cross-Device, Mobile Network & Accessibility Stress QA',
    subtitle: 'Validate flawless touch targets, marquee animations, and sub-1s load on mobile cellular.',
    owner: {
      name: 'Lead Frontend Eng',
      role: 'Frontend & UI Excellence',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'HIGH',
    deliverables: [
      'Lighthouse Performance score > 92 on mobile',
      'Sticky checkout button responsive on iPhone 13/14/15/16 and Samsung Galaxy',
      'Zero layout shifts (CLS < 0.05) on product image marquee',
    ],
    riskMitigation: 'Optimize all WebP images to under 45KB each with lazy-loading below fold.',
    tasks: [
      { id: 'd11-t1', title: 'Run mobile throttling test on simulated 3G/4G', detail: 'Verify catalog grid loads smoothly without layout jump.', completed: true },
      { id: 'd11-t2', title: 'Test screen reader & keyboard navigation (tabindex)', detail: 'Ensure accessibility compliance for senior patients.', completed: true },
    ],
  },
  {
    day: 12,
    date: 'Mon, Oct 12, 2026',
    phaseId: 4,
    phaseTitle: 'Pilot & Stress Testing',
    title: 'Google Merchant Center Feed & Medical SEO Validation',
    subtitle: 'Submit verified product feeds with GTIN, MPN, and HCPCS codes to search engines.',
    owner: {
      name: 'Growth & SEO Lead',
      role: 'Digital Acquisition',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'STANDARD',
    deliverables: [
      'Automated Google Merchant XML product feed published at /feeds/google-merchant.xml',
      'MedicalDevice schema structured data active on all PDP URLs',
      'XML sitemap with priority 1.0 submitted to Google Search Console',
    ],
    riskMitigation: 'Ensure medical device disclaimer tags are included in Google Shopping descriptions to avoid account suspension.',
    tasks: [
      { id: 'd12-t1', title: 'Inspect schema markup using Google Rich Results Test', detail: 'Confirm Product, Offer, and Brand snippets validate 100%.', completed: true },
      { id: 'd12-t2', title: 'Submit sitemap to Google and Bing Webmaster tools', detail: 'Verify all cleaned catalog URLs are indexed.', completed: false },
    ],
  },
  {
    day: 13,
    date: 'Tue, Oct 13, 2026',
    phaseId: 5,
    phaseTitle: 'Soft Launch & Customer Care',
    title: 'Soft Launch to Pilot Clinic Accounts & VIP Patients',
    subtitle: 'Lift maintenance mode for select pulmonary sleep clinics and partner care coordinators.',
    owner: {
      name: 'Commercial Lead',
      role: 'B2B Medical Sales',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'CRITICAL',
    deliverables: [
      '10 Partner Sleep Clinics onboarded with commercial pricing tiers',
      'Bulk PO order request form verified at /bulk-order',
      'First 25 real commercial equipment orders placed and tracked',
    ],
    riskMitigation: 'Keep customer success manager assigned to live watch every soft-launch transaction.',
    tasks: [
      { id: 'd13-t1', title: 'Send VIP access credentials to Delaware Sleep Clinic & Care Centers', detail: 'Track account logins and checkout completions.', completed: false },
      { id: 'd13-t2', title: 'Monitor server response times under initial organic traffic', detail: 'Confirm 0% 500 error rate in serverless runtime logs.', completed: false },
    ],
  },
  {
    day: 14,
    date: 'Wed, Oct 14, 2026',
    phaseId: 5,
    phaseTitle: 'Soft Launch & Customer Care',
    title: '1-800 Toll-Free Hotline & Clinical Live Chat Desk Drill',
    subtitle: 'Verify call routing to licensed respiratory therapists and customer support reps.',
    owner: {
      name: 'Support Director',
      role: 'Patient Care Operations',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'HIGH',
    deliverables: [
      '+1 (800) 555-0199 toll-free line answered within 3 rings by certified reps',
      'Live chat widget triage with automated medical bot and instant human escalation',
      'Comprehensive FAQs published for FSA/HSA reimbursement and carrier insurance',
    ],
    riskMitigation: 'Maintain 24/7 on-call escalation rotation for patient emergency oxygen inquiries.',
    tasks: [
      { id: 'd14-t1', title: 'Perform test inbound phone call from landline and mobile', detail: 'Verify IVR tree: 1 for Patient Orders, 2 for Clinical Rx, 3 for Wholesale.', completed: false },
      { id: 'd14-t2', title: 'Final Executive Go/No-Go Decision Meeting (16:00 EST)', detail: 'All 5 operational persona leads sign off on 100% readiness.', completed: false },
    ],
  },
  {
    day: 15,
    date: 'Thu, Oct 15, 2026',
    phaseId: 6,
    phaseTitle: 'Public Commercial Go-Live',
    title: 'Commercial Launch Day & Nationwide Campaign Activation',
    subtitle: 'Official public opening across all 50 US states with active search campaigns.',
    owner: {
      name: 'CEO & Super Admin',
      role: 'Executive Leadership',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80',
    },
    criticality: 'CRITICAL',
    deliverables: [
      'Commercial switch flipped to Public Nationwide Availability',
      'Google Ads campaign active for high-intent oxygen & CPAP searches',
      'Press release distributed across medical equipment trade journals',
      'Real-time war room active on /admin/dashboard with zero downtime',
    ],
    riskMitigation: 'Engineering on continuous standby with instant rollback and hourly database snapshots.',
    tasks: [
      { id: 'd15-t1', title: '08:00 EST: Final System Health & Database Sanity Check', detail: 'Verify zero pending errors across all services.', completed: false },
      { id: 'd15-t2', title: '09:00 EST: Official Nationwide Public Launch Announcement', detail: 'Newsletter dispatch to 12,000 pre-registered clinical leads.', completed: false },
      { id: 'd15-t3', title: '12:00 – 20:00 EST: Real-Time War Room Monitoring', detail: 'Track first day revenue, order fulfillment, and Rx approval speed.', completed: false },
    ],
  },
];

export const LaunchRoadmapPage: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<number>(0);
  const [days, setDays] = useState<RoadmapDay[]>(() => {
    try {
      const saved = localStorage.getItem('baemeds_launch_roadmap');
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
      localStorage.setItem('baemeds_launch_roadmap', JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetChecklist = () => {
    if (window.confirm('Reset all checklist progress back to default?')) {
      localStorage.removeItem('baemeds_launch_roadmap');
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
        d.owner.name.toLowerCase().includes(q) ||
        d.deliverables.some((del) => del.toLowerCase().includes(q));
      return matchesPhase && matchesSearch;
    });
  }, [days, selectedPhase, searchQuery]);

  // Simulated War Room Drill
  const runSimulator = () => {
    setIsSimulatorOpen(true);
    setIsSimulating(true);
    setSimulatorStep(1);
    setSimLogs(['[00:00:01] Initializing BaeMeds US 15-Day Readiness Automated Diagnostic...']);

    const steps = [
      { step: 1, delay: 1000, log: '✓ [PASS] Edge CDN & SSL: Cloudflare edge active with TLS 1.3 and HSTS 31536000.' },
      { step: 2, delay: 2200, log: '✓ [PASS] Merchant Rails: Stripe FSA/HSA MCC 5912 verified with test charge hold.' },
      { step: 3, delay: 3400, log: '✓ [PASS] Catalog Integrity: 24,000+ items indexed with HCPCS E1390 codes and multi-angle imagery.' },
      { step: 4, delay: 4600, log: '✓ [PASS] Clinical Triage: Prescription review queue verified with Dr. Evelyn Reed, MD.' },
      { step: 5, delay: 5800, log: '✓ [PASS] HIPAA Title II: Immutable cryptographic audit trail verified on /admin/audit-logs.' },
      { step: 6, delay: 7000, log: '🚀 [GO-LIVE CONFIRMED] All 15-day operational domains green. Readiness 100% verified!' },
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
                  LAUNCH WAR ROOM
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                15-Day Commercial Execution Roadmap • Target: Oct 15, 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={runSimulator}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-teal-500/25 hover:brightness-110 transition"
            >
              <Play size={14} className="fill-white" /> Run Readiness Drill
            </button>

            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              <Stethoscope size={14} className="text-teal-400" />
              <span>Admin Control Plane</span>
            </Link>

            <Link
              to="/"
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              <ExternalLink size={14} />
              <span>Storefront</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main War Room Body */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12 space-y-10 relative">
        {/* Hero Banner with Countdown & Live Readiness */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-10 shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
                <Sparkles size={14} />
                <span>NATIONWIDE COMMERCIAL LAUNCH CAMPAIGN</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                15 Days to Commercial Launch.
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl font-normal">
                Everything we have built—from high-converting storefront and 24,000+ cleaned DME equipment catalog to
                our 18-page administrative control plane, HIPAA prescription triage, and live state tax engine—converging
                for public commercial opening on <strong className="text-white font-semibold">Thursday, October 15, 2026</strong>.
              </p>

              {/* Live Readiness Bar */}
              <div className="pt-2 max-w-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-teal-400" />
                    Launch Checklist Progress
                  </span>
                  <span className="text-teal-400 font-mono text-sm">
                    {completedTasks} / {totalTasks} Tasks ({readinessPercent}%)
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
                <span>Target Go-Live T-Minus</span>
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
                  <Calendar size={13} className="text-teal-400" /> Oct 15, 09:00 EST
                </span>
                <span className="text-emerald-400 font-bold">● Systems Nominal</span>
              </div>
            </div>
          </div>
        </section>

        {/* Phase Filter & Quick Actions */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">15-Day Milestone Trajectory</h2>
              <p className="text-xs text-slate-400">Click any phase to isolate sprint deliverables and risk mitigations.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter deliverables, owners..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleResetChecklist}
                title="Reset checklist progress"
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
              <p className="text-sm font-semibold text-white">No roadmap items matched your filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPhase(0);
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-teal-400 underline font-semibold"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredDays.map((d) => {
              const dayCompleted = d.tasks.every((t) => t.completed);
              const dayPending = d.tasks.filter((t) => !t.completed).length;

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
                          {d.criticality}
                        </span>
                        {dayCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            <CheckCircle2 size={11} /> 100% DONE
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-black text-white group-hover:text-teal-300 transition">
                        {d.title}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-3xl">{d.subtitle}</p>
                    </div>

                    {/* Owner Card */}
                    <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 shrink-0 self-start">
                      <img
                        src={d.owner.avatar}
                        alt={d.owner.name}
                        className="h-8 w-8 rounded-full object-cover border border-teal-500/30"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">{d.owner.name}</p>
                        <p className="text-[10px] text-slate-400">{d.owner.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Body Grid: Tasks vs Deliverables & Risk */}
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    {/* Left: Interactive Checklist */}
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileCheck size={13} className="text-teal-400" />
                        Execution Checklist ({d.tasks.filter((t) => t.completed).length}/{d.tasks.length})
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
                          Required Launch Deliverables:
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
                          <strong className="text-amber-300 font-bold block mb-0.5">Contingency Safeguard:</strong>
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

        {/* RACI Matrix & Team Readiness Grid */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">COMMAND MATRIX</span>
              <h2 className="text-2xl font-black text-white tracking-tight mt-1">Operational Persona Responsibilities</h2>
              <p className="text-xs text-slate-400">
                Mapped directly to the RBAC authorization gates active inside our back-office.
              </p>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              <Users size={14} /> View Staff Registry ({INITIAL_DAYS.length} Days Mapped)
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="inline-block rounded-lg bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300">
                SUPER ADMIN
              </span>
              <h4 className="text-sm font-bold text-white">Platform Leadership</h4>
              <p className="text-xs text-slate-400">
                Final Go/No-Go authorization, payment merchant rails, commercial clinic onboarding.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="inline-block rounded-lg bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                CLINICAL LEAD
              </span>
              <h4 className="text-sm font-bold text-white">Dr. Evelyn Reed, MD</h4>
              <p className="text-xs text-slate-400">
                4-hour prescription triage queue, physician NPI validation, telehealth affiliate link.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="inline-block rounded-lg bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                COMPLIANCE
              </span>
              <h4 className="text-sm font-bold text-white">Marcus Vance, CCO</h4>
              <p className="text-xs text-slate-400">
                HIPAA Title II audit logging, BAA sign-offs, 50-state medical sales tax nexus.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="inline-block rounded-lg bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                FULFILLMENT
              </span>
              <h4 className="text-sm font-bold text-white">Logistics Director</h4>
              <p className="text-xs text-slate-400">
                FedEx Priority tracking generation, wholesale dropship EDI order routing, RMA bins.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2">
              <span className="inline-block rounded-lg bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                SUPPORT DESK
              </span>
              <h4 className="text-sm font-bold text-white">Patient Care Team</h4>
              <p className="text-xs text-slate-400">
                +1 (800) 555-0199 toll-free line, live chat triage, FSA/HSA reimbursement claims.
              </p>
            </div>
          </div>
        </section>

        {/* Day 15 Hour-by-Hour Launch Protocol */}
        <section className="rounded-3xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/20 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md">
              <Rocket size={20} />
            </span>
            <div>
              <h3 className="text-xl font-black text-white">Day 15 Go-Live Master Protocol (Oct 15, 2026)</h3>
              <p className="text-xs text-teal-400">Hour-by-hour operational countdown on commercial launch day.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1.5">
              <span className="font-mono text-xs font-black text-teal-400">08:00 EST</span>
              <p className="font-bold text-white">System Sanity Check</p>
              <p className="text-slate-400">Verify Supabase DB, Stripe live mode, and catalog search latency under 50ms.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1.5">
              <span className="font-mono text-xs font-black text-teal-400">09:00 EST</span>
              <p className="font-bold text-white">Public Switch & Announcement</p>
              <p className="text-slate-400">Lift private staging gates and distribute nationwide PR across medical journals.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1.5">
              <span className="font-mono text-xs font-black text-teal-400">09:30 EST</span>
              <p className="font-bold text-white">Google Ads Activation</p>
              <p className="text-slate-400">Turn on high-intent search campaigns for oxygen concentrators and CPAP therapy.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-1.5">
              <span className="font-mono text-xs font-black text-teal-400">12:00 – 20:00 EST</span>
              <p className="font-bold text-white">War Room Triage</p>
              <p className="text-slate-400">Monitor live /admin/dashboard throughput, order dispatch, and 4-hr Rx turnaround.</p>
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
                <h3 className="font-bold text-sm text-white">BaeMeds Automated Launch Readiness Diagnostic</h3>
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
                  {log.includes('[PASS]') || log.includes('[GO-LIVE') ? (
                    <span className="text-emerald-400 font-bold">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))}
              {isSimulating && (
                <div className="flex items-center gap-2 text-teal-400 animate-pulse">
                  <span>Executing step {simulatorStep}/6...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {isSimulating ? 'Running simulated traffic drill...' : 'Diagnostic complete. 100% verified.'}
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
