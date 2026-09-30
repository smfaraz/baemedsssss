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
  type: 'TECHNICAL' | 'NON_TECHNICAL';
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
    subtitle: 'Point domain DNS, turn on SSL encryption, configure edge servers, and verify brand readiness.',
    ownerType: 'Agency',
    criticality: 'CRITICAL',
    deliverables: [
      'baemeds.com and www.baemeds.com open with fast global CDN caching',
      '256-bit SSL / TLS 1.3 certificate active with zero browser warnings',
      'HSTS and 301 HTTPS force-redirect enabled on all requests',
      'All 549 product pictures, prices, and descriptions load cleanly',
      'Official business registry, phone, and Delaware address verified',
    ],
    riskMitigation: 'If DNS propagation takes a few hours on some local ISPs, keep the direct production Vercel edge URL ready.',
    tasks: [
      { id: 'd1-t1', title: 'Point DNS A-Records to production edge IP (76.76.21.21)', detail: 'Route apex domain @ with 300s TTL to global edge server cluster.', type: 'TECHNICAL', completed: true },
      { id: 'd1-t2', title: 'Configure DNS CNAME Record for www subdomain', detail: 'Route www.baemeds.com to edge server router cname.vercel-dns.com.', type: 'TECHNICAL', completed: true },
      { id: 'd1-t3', title: 'Issue 256-bit SSL / TLS 1.3 security certificate', detail: 'Deploy wildcard SSL certificate with automated 90-day renewal & OCSP stapling.', type: 'TECHNICAL', completed: true },
      { id: 'd1-t4', title: 'Enforce HSTS & 301 HTTPS force-redirects', detail: 'Route all insecure http:// requests to https:// with HSTS preload and includeSubDomains.', type: 'TECHNICAL', completed: true },
      { id: 'd1-t5', title: 'Enable Cloudflare / global edge CDN caching', detail: 'Cache 549 product photos, CSS stylesheets, and JS bundles to ensure sub-600ms load times nationwide.', type: 'TECHNICAL', completed: true },
      { id: 'd1-t6', title: 'Configure HTTP security response headers', detail: 'Set Content-Security-Policy (CSP), X-Frame-Options: DENY, and X-Content-Type-Options: nosniff.', type: 'TECHNICAL', completed: true },
      { id: 'd1-t7', title: 'Audit production environment variables (.env.production)', detail: 'Verify Supabase database URL, public anon key, and ensure service role secrets remain server-side.', type: 'TECHNICAL', completed: true },
      { id: 'd1-t8', title: 'Configure 60-second automated uptime health monitor', detail: 'Set up Pingdom / UptimeRobot to ping baemeds.com every 60 seconds with instant SMS alerts.', type: 'TECHNICAL', completed: false },
      { id: 'd1-t9', title: 'Verify domain registrar ownership & 2FA protection', detail: 'Confirm client login to GoDaddy / Namecheap, enable 2-factor authentication, and lock domain transfer.', type: 'NON_TECHNICAL', completed: true },
      { id: 'd1-t10', title: 'Audit all 549 medical product photos & descriptions', detail: 'Inspect catalog photos, manufacturer specs, and product blurbs so no items look broken or missing.', type: 'NON_TECHNICAL', completed: true },
      { id: 'd1-t11', title: 'Check senior readability & visual contrast', detail: 'Verify high-contrast color ratios (WCAG 2.1 AA) and minimum 16px body text so elderly patients can read without strain.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd1-t12', title: 'Verify official business entity & address in footer', detail: 'Confirm Delaware LLC name, physical office address, and toll-free phone number (+1 800 555-0199) match legal paperwork.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd1-t13', title: 'Publish legal policies (Terms, Privacy, HIPAA & Returns)', detail: 'Post official Terms of Service, HIPAA-compliant Privacy Policy, Shipping Guidelines, and 30-Day Guarantee.', type: 'NON_TECHNICAL', completed: true },
      { id: 'd1-t14', title: 'Establish agency & client emergency incident response protocol', detail: 'Document escalation phone numbers and emergency contacts in case of site downtime or payment provider issues.', type: 'NON_TECHNICAL', completed: false },
    ],
  },
  {
    day: 2,
    date: 'Fri, Oct 02, 2026',
    phaseId: 1,
    phaseTitle: 'Step 1: Website & Cards',
    title: 'Turn on Real Cards & Health Savings Cards (Stripe & FSA/HSA)',
    subtitle: 'Activate live credit cards, health benefit cards (FSA/HSA), monthly installment plans, and fraud defense.',
    ownerType: 'Agency',
    criticality: 'CRITICAL',
    deliverables: [
      'Stripe live mode active with verified Delaware LLC bank account',
      'Merchant Category Code MCC 5047 registered for certified medical equipment',
      'FSA and HSA health benefit cards accepted for 100% tax-free purchases',
      'Affirm and Klarna monthly financing ready for expensive concentrators',
      'Live $1 test transaction executed, verified in database, and refunded',
    ],
    riskMitigation: 'Stripe webhook signature validation prevents duplicate orders; 1-click test refund ready.',
    tasks: [
      { id: 'd2-t1', title: 'Replace Stripe test keys with live production keys', detail: 'Put pk_live_... on client application and sk_live_... in secure server environment.', type: 'TECHNICAL', completed: true },
      { id: 'd2-t2', title: 'Configure Stripe webhook endpoint with signature secret', detail: 'Route /api/webhooks/stripe with whsec_... to process payment_intent.succeeded in real-time.', type: 'TECHNICAL', completed: true },
      { id: 'd2-t3', title: 'Enable Stripe Radar 3D Secure (3DS) fraud protection', detail: 'Enforce machine-learning fraud rules and dynamic 3DS card verification to block fraudulent orders.', type: 'TECHNICAL', completed: false },
      { id: 'd2-t4', title: 'Integrate Apple Pay & Google Pay mobile 1-click checkout', detail: 'Deploy Apple merchant domain verification file at /.well-known/apple-developer-merchantid-domain-association.', type: 'TECHNICAL', completed: false },
      { id: 'd2-t5', title: 'Integrate Affirm and Klarna buy-now-pay-later widgets', detail: 'Embed monthly financing estimates on high-ticket concentrators and motorized wheelchairs.', type: 'TECHNICAL', completed: false },
      { id: 'd2-t6', title: 'Build frictionless guest checkout flow', detail: 'Enable quick checkout without forcing senior patients to remember or set up a password.', type: 'TECHNICAL', completed: true },
      { id: 'd2-t7', title: 'Implement secure client-side card tokenization (Stripe Elements)', detail: 'Ensure zero raw credit card or bank numbers ever touch BaeMeds application servers (PCI-DSS SAQ-A).', type: 'TECHNICAL', completed: true },
      { id: 'd2-t8', title: 'Execute live $1.00 production card charge and instant refund drill', detail: 'Process real credit card charge, verify database record creation, and issue immediate $1.00 refund.', type: 'TECHNICAL', completed: false },
      { id: 'd2-t9', title: 'Submit business EIN and bank routing to Stripe', detail: 'Provide company tax ID, IRS confirmation letter, and Delaware commercial bank account for automatic daily payouts.', type: 'NON_TECHNICAL', completed: true },
      { id: 'd2-t10', title: 'Register Merchant Category Code MCC 5047', detail: 'Classify merchant account under MCC 5047 (Medical Equipment & Supplies) with Visa and Mastercard card networks.', type: 'NON_TECHNICAL', completed: true },
      { id: 'd2-t11', title: 'Enable FSA and HSA health benefit card acceptance (SIGIS/IIAS)', detail: 'Register with SIGIS to allow patients to purchase approved equipment using pre-tax health cards.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd2-t12', title: 'Verify Affirm and Klarna merchant agreement & payout schedule', detail: 'Confirm installment financing terms, merchant fee percentages, and 0% APR promotional tiers.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd2-t13', title: 'Test purchase using a real pre-tax FSA / HSA card', detail: 'Swipe a physical health savings card to verify the bank recognizes medical equipment classification without declining.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd2-t14', title: 'Establish merchant chargeback & payment dispute procedure', detail: 'Set up standardized dispute response package with delivery signature proof and doctor prescription documentation.', type: 'NON_TECHNICAL', completed: false },
    ],
  },
  {
    day: 3,
    date: 'Sat, Oct 03, 2026',
    phaseId: 1,
    phaseTitle: 'Step 1: Website & Cards',
    title: 'Automated Receipts, Doctor Prescriptions & SMS Tracking',
    subtitle: 'Deploy transactional email servers, DNS anti-spam records, itemized insurance receipts, and text alerts.',
    ownerType: 'Agency',
    criticality: 'HIGH',
    deliverables: [
      'Itemized medical invoice with patient name, NPI, and HCPCS codes for insurance claims',
      'Transactional email server (SendGrid/Resend) configured with 100% inbox delivery',
      'SPF, DKIM, and DMARC DNS records added so receipts never land in spam folders',
      'Automated prescription receipt email confirming doctor review has begun',
      'Twilio SMS API connected to text delivery tracking numbers to customer phones',
    ],
    riskMitigation: 'Include big 1-click tracking buttons in every email so customers never have to hunt for their order.',
    tasks: [
      { id: 'd3-t1', title: 'Configure transactional email provider (SendGrid / Resend)', detail: 'Connect production SMTP credentials and dedicated API keys for automated system email delivery.', type: 'TECHNICAL', completed: false },
      { id: 'd3-t2', title: 'Add SPF, DKIM, and DMARC TXT records in DNS', detail: 'Authorize sending IP addresses in domain DNS to guarantee 100% inbox deliverability and eliminate spam flags.', type: 'TECHNICAL', completed: false },
      { id: 'd3-t3', title: 'Wire automated order confirmation email trigger', detail: 'Automatically dispatch branded HTML order confirmation within 3 seconds of Stripe webhook payment success.', type: 'TECHNICAL', completed: false },
      { id: 'd3-t4', title: 'Wire prescription upload confirmation email trigger', detail: 'Automatically notify patient as soon as their prescription PDF or doctor note is uploaded to the portal.', type: 'TECHNICAL', completed: false },
      { id: 'd3-t5', title: 'Generate dynamic itemized medical invoice PDF with HCPCS codes', detail: 'Create downloadable medical receipt including patient name, NPI, and HCPCS codes (e.g., E1390, E0601).', type: 'TECHNICAL', completed: true },
      { id: 'd3-t6', title: 'Connect Twilio SMS API for automated shipping tracking texts', detail: 'Send SMS tracking link to customer cell phones the moment carrier scans the package barcode.', type: 'TECHNICAL', completed: false },
      { id: 'd3-t7', title: 'Configure encrypted HIPAA-compliant private cloud storage', detail: 'Secure all uploaded prescription documents using AES-256 encryption in a private Supabase bucket.', type: 'TECHNICAL', completed: true },
      { id: 'd3-t8', title: 'Test email rendering across Gmail, Apple Mail, and Outlook', detail: 'Verify email layouts, buttons, and printable receipts look pixel-perfect in light and dark mode.', type: 'TECHNICAL', completed: false },
      { id: 'd3-t9', title: 'Create official business inboxes', detail: 'Provision Google Workspace / Microsoft 365 inboxes: support@baemeds.com, orders@baemeds.com, and prescriptions@baemeds.com.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd3-t10', title: 'Design insurance reimbursement receipt template', detail: 'Ensure receipt meets claims criteria for Medicare Supplement, Blue Cross, Aetna, and UnitedHealthcare payback.', type: 'NON_TECHNICAL', completed: true },
      { id: 'd3-t11', title: 'Write warm patient email copy', detail: 'Compose comforting, reassuring emails: "Order Received", "Prescription Review Started", and "Equipment On The Way".', type: 'NON_TECHNICAL', completed: true },
      { id: 'd3-t12', title: 'Add TCPA checkout SMS consent disclosure checkbox', detail: 'Ensure customer consent for text delivery updates complies with federal TCPA mobile carrier regulations.', type: 'NON_TECHNICAL', completed: true },
      { id: 'd3-t13', title: 'Establish 4-hour doctor prescription review turnaround SLA', detail: 'Dr. Evelyn Reed commits to checking uploaded patient prescriptions twice daily within 4 business hours.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd3-t14', title: 'Prepare customer support canned email templates', detail: 'Create ready-to-use email responses for order status inquiries, tracking questions, and prescription assistance.', type: 'NON_TECHNICAL', completed: false },
    ],
  },
  {
    day: 4,
    date: 'Sun, Oct 04, 2026',
    phaseId: 2,
    phaseTitle: 'Step 2: Suppliers & Shipping',
    title: 'Connect with Equipment Warehouses',
    subtitle: 'Link wholesale supplier feeds (Lake Court, McKesson, Inogen Direct) and automated inventory stock.',
    ownerType: 'Client',
    criticality: 'CRITICAL',
    deliverables: [
      'Direct order routing to wholesale warehouses as soon as doctor approves',
      'Wholesale buying prices locked in to protect 35%–50% profit margins',
      'Automated inventory count updates so sold-out items never accept orders',
    ],
    riskMitigation: 'Hold a 3-item safety buffer so we never sell something that just ran out.',
    tasks: [
      { id: 'd4-t1', title: 'Finalize wholesale distributor dealer accounts', detail: 'Lock in terms with Lake Court Medical Supplies and McKesson Medical-Surgical.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd4-t2', title: 'Map manufacturer model numbers & warranty codes', detail: 'Ensure Inogen G5 and DeVilbiss 525DS have exact serial numbers captured.', type: 'TECHNICAL', completed: false },
      { id: 'd4-t3', title: 'Send 1 practice order to the warehouse', detail: 'Confirm warehouse portal receives order number and shipping address cleanly.', type: 'TECHNICAL', completed: false },
      { id: 'd4-t4', title: 'Set minimum advertised price (MAP) compliance', detail: 'Ensure selling prices respect manufacturer brand guidelines.', type: 'NON_TECHNICAL', completed: true },
    ],
  },
  {
    day: 5,
    date: 'Mon, Oct 05, 2026',
    phaseId: 2,
    phaseTitle: 'Step 2: Suppliers & Shipping',
    title: 'Set up FedEx & UPS Shipping',
    subtitle: 'Integrate carrier rate calculation, print shipping labels, and configure tracking webhooks.',
    ownerType: 'Client',
    criticality: 'HIGH',
    deliverables: [
      'FedEx fast medical shipping account ready',
      'Print UPS shipping labels with one click',
      'Special helper delivery ready for heavy motorized wheelchairs',
    ],
    riskMitigation: 'Offer 2-day fast delivery for urgent breathing equipment like oxygen machines.',
    tasks: [
      { id: 'd5-t1', title: 'Open FedEx Healthcare Priority shipping account', detail: 'Secure negotiated commercial rates for urgent medical equipment delivery.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd5-t2', title: 'Add test tracking number in admin panel', detail: 'Verify order shifts to "Shipped" and customer receives tracking email.', type: 'TECHNICAL', completed: true },
      { id: 'd5-t3', title: 'Check checkout shipping price tiers', detail: 'Standard ($12 / Free over $99), Express ($25), In-Home Setup ($95).', type: 'TECHNICAL', completed: true },
      { id: 'd5-t4', title: 'Configure freight carrier for heavy bariatric chairs', detail: 'Partner with white-glove courier for unboxing and room-of-choice setup.', type: 'NON_TECHNICAL', completed: false },
    ],
  },
  {
    day: 6,
    date: 'Tue, Oct 06, 2026',
    phaseId: 2,
    phaseTitle: 'Step 2: Suppliers & Shipping',
    title: 'Write Clear Return & Warranty Rules',
    subtitle: 'Publish hygiene return guidelines, RMA return request button, and 3-year factory warranty coverage.',
    ownerType: 'Client',
    criticality: 'STANDARD',
    deliverables: [
      'Simple 30-day return rule posted on the website',
      'Cleanliness rule: breathing machines must be unopened in the box to return',
      'Simple "Ask for Return" button inside customer account page',
    ],
    riskMitigation: 'To keep everyone healthy, unopened boxes can be returned, but opened breathing masks cannot.',
    tasks: [
      { id: 'd6-t1', title: 'Publish 30-day medical return policy', detail: 'Clearly explain FDA hygiene rules: unopened machines returnable, opened masks not.', type: 'NON_TECHNICAL', completed: true },
      { id: 'd6-t2', title: 'Check warranty badges on all 549 product pages', detail: 'Verify 3-year factory warranty badges show on concentrators and wheelchairs.', type: 'TECHNICAL', completed: true },
      { id: 'd6-t3', title: 'Set up warehouse returns inspection table', detail: 'Establish quarantine desk to inspect returned boxes before processing refunds.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd6-t4', title: 'Enable 1-click Return RMA button in customer portal', detail: 'Let customers generate pre-paid return labels if an unopened item is returned.', type: 'TECHNICAL', completed: false },
    ],
  },
  {
    day: 7,
    date: 'Wed, Oct 07, 2026',
    phaseId: 3,
    phaseTitle: 'Step 3: Doctor Checks & Privacy',
    title: 'Practice Doctor Prescription Reviews',
    subtitle: 'Physician NPI validation, 4-hour clinical review queue, and optional online doctor referral link.',
    ownerType: 'Client',
    criticality: 'CRITICAL',
    deliverables: [
      'Doctor reviews prescriptions within 4 hours during the day',
      'Easy lookup to confirm doctor official medical license (NPI)',
      'Simple link to help patients get a prescription online if they need one',
    ],
    riskMitigation: 'No regulated oxygen machine leaves the warehouse until our doctor gives the green light.',
    tasks: [
      { id: 'd7-t1', title: 'Practice approving a prescription in admin panel', detail: 'Click approve on order BM-722730-720 and make sure it changes to approved.', type: 'TECHNICAL', completed: true },
      { id: 'd7-t2', title: 'Connect National Provider Identifier (NPI) lookup', detail: 'Check that doctor name and clinic match official government medical registry.', type: 'TECHNICAL', completed: false },
      { id: 'd7-t3', title: 'Establish 4-hour daytime clinical review SLA', detail: 'Ensure Dr. Evelyn Reed reviews all uploaded prescriptions twice daily.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd7-t4', title: 'Add telehealth partner link for patients without prescription', detail: 'Direct customers without an Rx to partner online doctor service.', type: 'NON_TECHNICAL', completed: true },
    ],
  },
  {
    day: 8,
    date: 'Thu, Oct 08, 2026',
    phaseId: 3,
    phaseTitle: 'Step 3: Doctor Checks & Privacy',
    title: 'Lock Down Patient Health Privacy (HIPAA)',
    subtitle: 'AES-256 data encryption, signed Business Associate Agreements (BAA), and tamper-evident audit logs.',
    ownerType: 'Agency',
    criticality: 'CRITICAL',
    deliverables: [
      'Top-level security so only doctors can view customer prescriptions',
      'Signed privacy promises (BAA) with all software and hosting providers',
      'A safe log that tracks whenever anyone views a prescription',
    ],
    riskMitigation: 'Doctor links close automatically after 15 minutes to keep patient info safe.',
    tasks: [
      { id: 'd8-t1', title: 'Review staff activity log on /admin/audit-logs', detail: 'Ensure every staff login and prescription view is safely recorded.', type: 'TECHNICAL', completed: true },
      { id: 'd8-t2', title: 'Verify warehouse packers only see shipping box', detail: 'Packers see what box to ship, but never personal medical diagnoses.', type: 'TECHNICAL', completed: true },
      { id: 'd8-t3', title: 'Execute Business Associate Agreements (BAA)', detail: 'Sign HIPAA privacy agreements with cloud database and email providers.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd8-t4', title: 'Enforce 15-minute prescription view auto-expiry', detail: 'Doctor prescription preview links expire after 15 minutes for safety.', type: 'TECHNICAL', completed: true },
    ],
  },
  {
    day: 9,
    date: 'Fri, Oct 09, 2026',
    phaseId: 3,
    phaseTitle: 'Step 3: Doctor Checks & Privacy',
    title: 'Check State Sales Tax Rules',
    subtitle: 'Configure automated 50-state tax rules, 0% prescription exemptions (PA, DE, etc.), and insurance receipts.',
    ownerType: 'Client',
    criticality: 'HIGH',
    deliverables: [
      'No sales tax ($0) in states where doctor-prescribed equipment is tax-free',
      'Charge normal state tax on regular accessories when needed',
      'Clear receipts so patients can ask their health insurance for money back',
    ],
    riskMitigation: 'Save every tax receipt automatically so end-of-year tax filing is easy and painless.',
    tasks: [
      { id: 'd9-t1', title: 'Test order to Delaware and Pennsylvania', detail: 'Verify tax shows $0.00 as legally required for prescription medical equipment.', type: 'TECHNICAL', completed: true },
      { id: 'd9-t2', title: 'Make sure tax amount shows clearly on receipt', detail: 'Needed for patients filing Medicare or private insurance payback claims.', type: 'TECHNICAL', completed: true },
      { id: 'd9-t3', title: 'Confirm tax nexus registration with company CPA', detail: 'Verify economic nexus thresholds across key target states.', type: 'NON_TECHNICAL', completed: false },
    ],
  },
  {
    day: 10,
    date: 'Sat, Oct 10, 2026',
    phaseId: 4,
    phaseTitle: 'Step 4: Practice & Testing',
    title: 'Run 5 Practice Orders from Start to Finish',
    subtitle: 'Place real orders for concentrator, wheelchair, and CPAP mask, approve prescriptions, and test refunds.',
    ownerType: 'Client & Agency',
    criticality: 'CRITICAL',
    deliverables: [
      'Place 5 test orders for different machines across categories',
      'Doctor approves test prescriptions in under 15 minutes',
      'Tracking text messages sent to test phones',
      'Refund test money back to cards right away',
    ],
    riskMitigation: 'Have 3 people buy at the exact same second to make sure the site stays fast.',
    tasks: [
      { id: 'd10-t1', title: 'Order oxygen machine and upload test doctor note', detail: 'Check that order appears in admin queue waiting for doctor approval.', type: 'TECHNICAL', completed: true },
      { id: 'd10-t2', title: 'Have Dr. Reed approve prescription in admin panel', detail: 'Check that status changes to approved and triggers warehouse.', type: 'NON_TECHNICAL', completed: true },
      { id: 'd10-t3', title: 'Type in test FedEx tracking number', detail: 'Check that tracking link shows up on customer account page.', type: 'TECHNICAL', completed: true },
      { id: 'd10-t4', title: 'Execute instant 1-click test refund in Stripe', detail: 'Confirm test charge returns to bank card with zero fees.', type: 'TECHNICAL', completed: true },
    ],
  },
  {
    day: 11,
    date: 'Sun, Oct 11, 2026',
    phaseId: 4,
    phaseTitle: 'Step 4: Practice & Testing',
    title: 'Test the Website on Phones & Tablets',
    subtitle: 'Mobile cellular speed, tap-target size for older adults, and cross-browser visual QA.',
    ownerType: 'Agency',
    criticality: 'HIGH',
    deliverables: [
      'Pages open in 1 second on cell phones',
      'Big "Add to Cart" and "Buy Now" buttons that are easy to press',
      'Large, clear text that older folks can read without squinting',
    ],
    riskMitigation: 'Keep photos small in file size so pages open fast even on weak cell service.',
    tasks: [
      { id: 'd11-t1', title: 'Test checkout page on iPhone and Android phones', detail: 'Make sure order button is always easy to see and press.', type: 'TECHNICAL', completed: true },
      { id: 'd11-t2', title: 'Check font sizes and colors for seniors', detail: 'Ensure font sizes are large and text is clear and readable.', type: 'NON_TECHNICAL', completed: true },
      { id: 'd11-t3', title: 'Audit Google Lighthouse mobile performance score', detail: 'Verify performance score exceeds 90 on mobile cellular connection.', type: 'TECHNICAL', completed: false },
    ],
  },
  {
    day: 12,
    date: 'Mon, Oct 12, 2026',
    phaseId: 4,
    phaseTitle: 'Step 4: Practice & Testing',
    title: 'Connect Products to Google Search & Shopping',
    subtitle: 'Submit Google Merchant Center XML feed, schema.org medical structured data, and sitemaps.',
    ownerType: 'Agency',
    criticality: 'STANDARD',
    deliverables: [
      'Send our product list to Google so our items show up in shopping searches',
      'Show real prices, photos, and in-stock badges right on Google Shopping',
      'Tell Google and Bing about all our web pages',
    ],
    riskMitigation: 'Include clear medical notes on every page so Google approves all ads smoothly.',
    tasks: [
      { id: 'd12-t1', title: 'Test how products look when searched on Google', detail: 'Confirm that prices, photos, and star ratings show up correctly.', type: 'TECHNICAL', completed: true },
      { id: 'd12-t2', title: 'Submit website map to Google Search Console', detail: 'Make sure all category and product pages are ready for Google to find.', type: 'TECHNICAL', completed: false },
      { id: 'd12-t3', title: 'Submit Google Merchant Center product feed', detail: 'Sync 549 products with real-time prices and stock availability.', type: 'TECHNICAL', completed: false },
    ],
  },
  {
    day: 13,
    date: 'Tue, Oct 13, 2026',
    phaseId: 5,
    phaseTitle: 'Step 5: Clinic Preview & Phones',
    title: 'Let Partner Clinics Order First',
    subtitle: 'Private trial launch with 10 partner sleep clinics and select previous patients.',
    ownerType: 'Client',
    criticality: 'CRITICAL',
    deliverables: [
      'Invite 10 local doctor offices with friendly discounts',
      'Bulk order page ready for clinics buying 5 or more machines',
      'Deliver first 25 real orders and collect happy reviews',
    ],
    riskMitigation: 'Have our team watch every clinic order live to help immediately if anyone has questions.',
    tasks: [
      { id: 'd13-t1', title: 'Email invitations to 10 partner clinics with login code', detail: 'Help clinic managers log in and place trial orders.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd13-t2', title: 'Watch website live to ensure zero crashes and zero errors', detail: 'Make sure every clinic page loads instantly without delay.', type: 'TECHNICAL', completed: false },
      { id: 'd13-t3', title: 'Collect initial clinic feedback on bulk order experience', detail: 'Note any small adjustments requested by doctor office managers.', type: 'NON_TECHNICAL', completed: false },
    ],
  },
  {
    day: 14,
    date: 'Wed, Oct 14, 2026',
    phaseId: 5,
    phaseTitle: 'Step 5: Clinic Preview & Phones',
    title: 'Test the 1-800 Phone Line & Help Desk',
    subtitle: 'Call routing test, live chat staff dashboard, and final 5-department executive sign-off.',
    ownerType: 'Client',
    criticality: 'HIGH',
    deliverables: [
      'Answer 1-800 phone number in 3 rings with friendly, helpful staff',
      'Helpful live chat on the website for quick questions',
      'All 5 team leads give green thumbs up for launch tomorrow',
    ],
    riskMitigation: 'Keep a staff member on call 24/7 for urgent oxygen questions.',
    tasks: [
      { id: 'd14-t1', title: 'Call 1-800-555-0199 from both iPhones and Androids', detail: 'Make sure audio is crystal clear and calls connect fast.', type: 'TECHNICAL', completed: false },
      { id: 'd14-t2', title: 'Hold 15-minute team check: All leads say "Ready!"', detail: 'Everyone signs off that their department is 100% prepared.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd14-t3', title: 'Test live chat triage & prescription help desk', detail: 'Simulate customer asking about FSA/HSA cards and ensure rapid reply.', type: 'TECHNICAL', completed: false },
    ],
  },
  {
    day: 15,
    date: 'Thu, Oct 15, 2026',
    phaseId: 6,
    phaseTitle: 'Step 6: Big Launch Day!',
    title: 'Official Launch Day across all 50 States!',
    subtitle: 'Open the store to the whole country, trigger announcement emails, and turn on Google Ads.',
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
      { id: 'd15-t1', title: '08:00 AM: Final 10-minute system health check', detail: 'Verify card checkout, database latency, and products are working cleanly.', type: 'TECHNICAL', completed: false },
      { id: 'd15-t2', title: '09:00 AM: Open doors and send 12,000-contact announcement email', detail: 'Lift staging gates and send official commercial launch announcement.', type: 'NON_TECHNICAL', completed: false },
      { id: 'd15-t3', title: '09:30 AM: Activate Google search advertising campaigns', detail: 'Turn on targeted ads for oxygen concentrators and CPAP therapy.', type: 'TECHNICAL', completed: false },
      { id: 'd15-t4', title: 'All Day: Pack orders fast, answer calls, and celebrate!', detail: 'Track first day sales, doctor approvals, and customer happiness.', type: 'NON_TECHNICAL', completed: false },
    ],
  },
];

const STORAGE_KEY = 'baemeds_launch_roadmap_v5';

export const LaunchRoadmapPage: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<number>(0);
  const [taskTypeFilter, setTaskTypeFilter] = useState<'ALL' | 'TECHNICAL' | 'NON_TECHNICAL'>('ALL');
  const [days, setDays] = useState<RoadmapDay[]>(() => {
    try {
      // Clear out legacy cached data that had DevOps Lead / Platform Engineering tags
      localStorage.removeItem('baemeds_launch_roadmap');
      localStorage.removeItem('baemeds_launch_roadmap_v2');
      localStorage.removeItem('baemeds_launch_roadmap_v3');
      localStorage.removeItem('baemeds_launch_roadmap_v4');
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

          {/* Task Type Filter Bar (All / Technical Only / Business Only) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Filter size={13} className="text-teal-400" /> Filter:
              </span>
              <div className="flex flex-wrap items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTaskTypeFilter('ALL')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    taskTypeFilter === 'ALL'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Items ({totalTasks})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskTypeFilter('TECHNICAL')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    taskTypeFilter === 'TECHNICAL'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  <Server size={12} />
                  Technical Only ({days.reduce((sum, d) => sum + d.tasks.filter((t) => t.type === 'TECHNICAL').length, 0)})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskTypeFilter('NON_TECHNICAL')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    taskTypeFilter === 'NON_TECHNICAL'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  <Users size={12} />
                  Business & Non-Technical ({days.reduce((sum, d) => sum + d.tasks.filter((t) => t.type === 'NON_TECHNICAL').length, 0)})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block" /> Technical Tasks
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> Business / Non-Technical
              </span>
            </div>
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
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <FileCheck size={13} className="text-teal-400" />
                          Checklist ({d.tasks.filter((t) => t.completed).length} of {d.tasks.length} done)
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                          <span className="rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-cyan-300 border border-cyan-500/30">
                            {d.tasks.filter((t) => t.type === 'TECHNICAL').length} Tech
                          </span>
                          <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300 border border-emerald-500/30">
                            {d.tasks.filter((t) => t.type === 'NON_TECHNICAL').length} Business
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {d.tasks
                          .filter((task) => taskTypeFilter === 'ALL' || task.type === taskTypeFilter)
                          .map((task) => (
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
                              className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                                    task.type === 'TECHNICAL'
                                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                  }`}
                                >
                                  {task.type === 'TECHNICAL' ? 'Technical' : 'Business'}
                                </span>
                                <p className={`font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                                  {task.title}
                                </p>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 font-normal leading-relaxed">{task.detail}</p>
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
