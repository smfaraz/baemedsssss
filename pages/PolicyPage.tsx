import React from 'react';
import { ChevronRight, FileCheck2, Home, Mail, Phone, ShieldCheck } from 'lucide-react';
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE, LEGAL_ENTITY_NAME, SITE_DOMAIN, STORE_ADDRESS } from '../constants';
import { Link } from '../context/CartContext';

type PolicyType = 'privacy' | 'terms' | 'shipping' | 'returns';

const policies: Array<{ type: PolicyType; label: string; description: string }> = [
  { type: 'privacy', label: 'Privacy Policy', description: 'How customer and healthcare information is collected, protected, and handled.' },
  { type: 'terms', label: 'Terms of Service', description: 'The terms governing storefront browsing, prescription requirements, and purchases.' },
  { type: 'shipping', label: 'Shipping & Delivery', description: 'US nationwide carrier shipping, tracking, delivery timelines, and medical freight.' },
  { type: 'returns', label: 'Returns & Refunds', description: '30-day return policy, FDA hygiene exceptions, and refund procedures.' },
];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const match = title.match(/^(\d+)\.\s*(.+)$/);
  const number = match?.[1];
  const heading = match?.[2] || title;

  return (
    <section className="scroll-mt-28 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:rounded-2xl sm:p-6">
      <div className="flex items-start gap-3">
        {number && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-medical-light text-xs font-black text-medical-primary sm:h-8 sm:w-8 sm:text-sm">{number}</span>}
        <h2 className="pt-0.5 text-lg font-bold leading-6 text-medical-dark sm:text-2xl">{heading}</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{children}</div>
    </section>
  );
};

const PrivacyPolicy = () => (
  <>
    <header>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">Legal &amp; Privacy</p>
      <h1 className="mt-2 text-3xl font-bold text-medical-dark sm:text-4xl">Privacy Policy</h1>
      <p className="mt-4 leading-7 text-slate-600">
        This policy explains how {LEGAL_ENTITY_NAME} (&quot;{APP_NAME}&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, protects, uses, and discloses information when you visit {SITE_DOMAIN}, create an account, purchase clinical medical supplies, or communicate with us.
      </p>
      <p className="mt-3 text-sm font-medium text-slate-500">Last updated: September 2026</p>
    </header>

    <Section title="1. Operator Information & Data Controller">
      <p>{APP_NAME} is operated by {LEGAL_ENTITY_NAME}, a Delaware entity with corporate offices at {STORE_ADDRESS}.</p>
      <p>For inquiries regarding privacy practices, consumer health data disclosures, or exercising data rights, contact our Privacy Officer at <a className="font-semibold text-medical-primary hover:text-medical-dark" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </Section>

    <Section title="2. Categories of Information We Collect">
      <p>In operating our healthcare e-commerce storefront, we may collect:</p>
      <ul className="list-disc space-y-2 pl-5 marker:text-medical-primary">
        <li><strong className="text-slate-800">Identity and Contact Data:</strong> Full name, shipping address, billing address, phone number, and email address.</li>
        <li><strong className="text-slate-800">Order and Financial Records:</strong> Products purchased, quantities, pricing, sales tax calculated, shipping carrier, tracking numbers, and transaction status tokens provided by our PCI-compliant payment gateways. We do not store full credit card numbers or CVVs on our servers.</li>
        <li><strong className="text-slate-800">Prescription and Health-Related Order Data:</strong> For items designated as requiring a prescription (Rx) or durable medical equipment (DME), we or our clinical fulfillment partners may collect physician prescriptions, NPI details, clinical authorizations, and diagnosis/intake documentation strictly for order verification.</li>
        <li><strong className="text-slate-800">Technical and Device Telemetry:</strong> IP address, device type, operating system, browser type, and timestamps collected for security logging, fraud prevention, and session maintenance. Protected health information is strictly excluded from analytics and marketing pixels.</li>
      </ul>
    </Section>

    <Section title="3. How We Use Your Information">
      <ul className="list-disc space-y-2 pl-5 marker:text-medical-primary">
        <li>To process, fulfill, and deliver orders for medical equipment and clinical supplies.</li>
        <li>To verify physician prescription compliance where required by FDA and state board regulations.</li>
        <li>To compute applicable state and local sales tax based on the delivery destination.</li>
        <li>To provide order confirmation, carrier tracking updates, and customer support.</li>
        <li>To maintain auditable transaction logs for accounting, compliance, and fraud prevention.</li>
        <li>To comply with state and federal legal obligations.</li>
      </ul>
      <p>We do not sell personal data, nor do we share consumer health data with third-party advertising brokers.</p>
    </Section>

    <Section title="4. Healthcare Privacy & HIPAA-Conscious Safeguards">
      <p>We recognize the sensitive nature of medical and health-related purchases. While standard direct-to-consumer retail transactions generally fall under FTC guidelines and state consumer privacy laws rather than HIPAA, our architecture implements technical and organizational safeguards aligned with HIPAA security standards:</p>
      <ul className="list-disc space-y-2 pl-5 marker:text-medical-primary">
        <li><strong>Role-Based Access Control (RBAC):</strong> Administrative access to order histories and prescription attachments is restricted strictly to authorized clinical fulfillment and compliance personnel.</li>
        <li><strong>Encryption in Transit and at Rest:</strong> All web traffic is encrypted via TLS 1.3, and sensitive databases employ AES-256 encryption at rest.</li>
        <li><strong>Audit Logging:</strong> Administrative events, access to prescription files, and customer account modifications are recorded in immutable audit logs with automatic PHI redaction.</li>
        <li><strong>Zero-PHI Analytics:</strong> Google Analytics and third-party advertising tags are strictly prohibited from collecting patient diagnosis, prescription, or clinical details.</li>
      </ul>
    </Section>

    <Section title="5. US State Privacy Rights (CCPA/CPRA, VCDPA, CPA)">
      <p>Residents of California, Virginia, Colorado, Connecticut, and other states with enacted consumer privacy laws have specific statutory rights:</p>
      <ul className="list-disc space-y-2 pl-5 marker:text-medical-primary">
        <li><strong>Right to Know / Access:</strong> Request disclosure of personal information collected over the preceding 12 months.</li>
        <li><strong>Right to Delete:</strong> Request deletion of personal data, subject to legal record-retention requirements for medical devices and tax compliance.</li>
        <li><strong>Right to Correct:</strong> Request correction of inaccurate personal or address information.</li>
        <li><strong>Right to Non-Discrimination:</strong> We will never discriminate against you for exercising your statutory privacy rights.</li>
      </ul>
      <p>To exercise these rights, submit a request to <a className="font-semibold text-medical-primary hover:text-medical-dark" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </Section>

    <Section title="6. Information Sharing & Third-Party Service Providers">
      <p>We share data only as necessary to execute our services with vetted providers under appropriate confidentiality and data protection agreements:</p>
      <ul className="list-disc space-y-2 pl-5 marker:text-medical-primary">
        <li>Commerce infrastructure (Shopify) for order processing and encrypted customer accounts.</li>
        <li>PCI-DSS Level 1 payment processors (e.g., Stripe, Shopify Payments, Apple Pay) for card tokenization.</li>
        <li>Shipping carriers (USPS, UPS, FedEx, Medical Freight) to deliver physical packages.</li>
        <li>Sales tax automation services for real-time state and local jurisdiction calculation.</li>
      </ul>
    </Section>
  </>
);

const TermsPolicy = () => (
  <>
    <header>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">Legal Terms</p>
      <h1 className="mt-2 text-3xl font-bold text-medical-dark sm:text-4xl">Terms of Service</h1>
      <p className="mt-4 leading-7 text-slate-600">These Terms of Service govern your access to and purchase of products through {SITE_DOMAIN}, operated by {LEGAL_ENTITY_NAME}.</p>
      <p className="mt-3 text-sm font-medium text-slate-500">Last updated: September 2026</p>
    </header>

    <Section title="1. Acceptance of Terms & Eligibility">
      <p>By accessing our storefront or placing an order, you represent that you are at least 18 years of age and legally capable of entering into binding contracts under US law.</p>
    </Section>

    <Section title="2. Clinical Medical Equipment & Medical Advice Disclaimer">
      <p>Product descriptions, specifications, HCPCS codes, and educational guides on {SITE_DOMAIN} are provided for informational and procurement purposes only and do not constitute medical advice, diagnosis, or treatment.</p>
      <p>Always consult a licensed physician or healthcare professional regarding medical conditions, device settings, oxygen flow rates, or sleep therapy equipment. You agree to follow all manufacturer guidelines and clinical operating instructions.</p>
    </Section>

    <Section title="3. Prescription-Required (Rx) Products">
      <p>Certain medical devices (such as CPAP machines, BiPAP systems, oxygen concentrators, and specialized clinical monitors) are classified as prescription-required devices under US FDA regulations.</p>
      <p>For these products, order fulfillment is contingent upon receipt and clinical verification of a valid physician prescription. Orders will not be dispatched until verification is complete.</p>
    </Section>

    <Section title="4. Pricing, Taxes & Payment">
      <p>All prices are listed in US Dollars (USD). Applicable state and local sales taxes are calculated at checkout based on the shipping address. We accept major US credit/debit cards (Visa, MasterCard, American Express, Discover), Apple Pay, Google Pay, and FSA/HSA payment cards.</p>
    </Section>

    <Section title="5. Governing Law & Dispute Resolution">
      <p>These terms and any disputes arising out of or related to your purchase shall be governed by the laws of the State of Delaware and applicable United States federal law, without regard to conflict of law principles.</p>
    </Section>
  </>
);

const ShippingPolicy = () => (
  <>
    <header>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">Order delivery</p>
      <h1 className="mt-2 text-3xl font-bold text-medical-dark sm:text-4xl">Shipping &amp; Delivery</h1>
      <p className="mt-4 leading-7 text-slate-600">The final available shipping method, charge, and estimated delivery window are shown in Shopify checkout before you place the order.</p>
      <p className="mt-3 text-sm font-medium text-slate-500">Last updated: 23 July 2026</p>
    </header>

    <Section title="1. Shipping charges">
      <p>Shipping is not calculated by the Baemeds product page or cart subtotal display. Shopify applies the configured shipping profile at checkout after it has the delivery location and the products and quantities in the cart.</p>
      <p>A rate can be affected by the configured delivery zone, shipment weight, package requirements, product mix, carrier or fulfilment-app rate, and any free-shipping or order-value rule. The rate shown at checkout is the charge that applies before payment.</p>
    </Section>

    <Section title="2. Delivery estimates">
      <p>Any business-day estimate shown at checkout begins from the applicable order-processing or dispatch stage, not necessarily from the moment the cart is created. Stock confirmation, weekends, public holidays, remote-area serviceability, carrier capacity, weather, and address issues can affect delivery.</p>
    </Section>

    <Section title="3. Order confirmation and tracking">
      <p>After a successful checkout, Shopify shows the order confirmation and sends the available receipt or notification. When the order is fulfilled and the courier details are recorded, the tracking number and tracking link appear on the Shopify order-status page and in the signed-in Baemeds order history.</p>
    </Section>

    <Section title="4. Receiving the shipment">
      <p>Provide a complete address and reachable phone number. Inspect the outer package when it arrives. Report visible damage, an incorrect item, or missing contents promptly, retain the packaging, and include the order number plus clear photos or video when contacting support.</p>
    </Section>

    <Section title="5. Delivery help">
      <p>For serviceability, a delayed shipment, or a tracking problem, contact {CONTACT_EMAIL} or {CONTACT_PHONE} with the Shopify order number. Shipping questions are handled separately from return eligibility, which is covered by the Returns &amp; Refunds policy.</p>
    </Section>
  </>
);

const ReturnsPolicy = () => (
  <>
    <header>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">Customer support</p>
      <h1 className="mt-2 text-3xl font-bold text-medical-dark sm:text-4xl">Returns &amp; Refunds</h1>
      <p className="mt-4 leading-7 text-slate-600">Contact us within 30 days of delivery to request a return authorization. Do not return equipment without an approved RMA (Return Merchandise Authorization) number and designated warehouse return address.</p>
      <p className="mt-3 text-sm font-medium text-slate-500">Last updated: September 2026</p>
    </header>

    <Section title="1. Start a return request">
      <p>Email {CONTACT_EMAIL} or call toll-free at {CONTACT_PHONE}. Provide your order number, item description, serial number if applicable, and reason for return.</p>
      <p>Keep all original manufacturer packaging, barcodes, tamper seals, accessories, and instruction manuals intact.</p>
    </Section>
    <Section title="2. 30-Day Standard Eligibility">
      <p>Unopened, unused medical supplies and equipment in original, undamaged factory packaging are eligible for return within 30 calendar days of verified carrier delivery.</p>
    </Section>
    <Section title="3. Hygiene & FDA Regulatory Return Exceptions">
      <p>In compliance with US FDA safety standards and state health department sanitation regulations, the following categories cannot be returned once opened or unsealed:</p>
      <ul className="list-disc space-y-2 pl-5 marker:text-medical-primary">
        <li>CPAP and BiPAP masks, tubing, headgear, water chambers, and nasal pillows once factory packaging or hygiene seal is broken.</li>
        <li>Oxygen cannulas, masks, suction tubing, filters, and respiratory consumables.</li>
        <li>Sterile wound-care supplies, disposable incontinence garments, and personal hygiene aids.</li>
        <li>Custom-configured hospital beds or motorized mobility units once assembled or used.</li>
      </ul>
      <p>This policy does not limit remedies for defective merchandise covered under manufacturer warranties.</p>
    </Section>
    <Section title="4. Damaged, Defective, or Incorrect Deliveries">
      <p>Inspect shipments upon arrival. If outer packaging shows significant transit damage or an incorrect product is delivered, notify us within 48 hours with photographic evidence so carrier claims can be initiated.</p>
    </Section>
    <Section title="5. Refunds & Restocking">
      <p>Approved returns are inspected upon receipt at our distribution center. Refunds are issued to the original payment method within 3 to 5 business days of inspection. Certain heavy freight equipment may be subject to a standard manufacturer restocking fee if returned due to customer preference.</p>
    </Section>
  </>
);

const PolicyPage: React.FC<{ type: PolicyType }> = ({ type }) => {
  const currentPolicy = policies.find((policy) => policy.type === type)!;

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f6f3ee' }}>
      <section className="border-b border-white/10 bg-medical-dark text-white">
        <div className="container mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-12">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-300 sm:mb-6">
            <Link to="/" className="inline-flex min-h-11 items-center gap-2 hover:text-white"><Home size={15} aria-hidden="true" /> Home</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="text-medical-accent">Policies</span>
          </nav>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-medical-accent">
              <ShieldCheck size={25} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-medical-accent">BaeMeds US Policy Center</p>
              <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">Clear Information &amp; Consumer Protections</h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-200">{currentPolicy.description}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto grid min-w-0 max-w-6xl gap-6 px-0 py-6 sm:px-6 sm:py-12 lg:grid-cols-[280px_1fr] lg:gap-10">
        <nav aria-label="Policy navigation" className="min-w-0 px-4 sm:px-0 lg:sticky lg:top-28 lg:self-start">
          <div className="grid min-w-0 grid-cols-2 gap-2 lg:block lg:space-y-2 lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:p-3 lg:shadow-soft">
            <p className="col-span-2 px-1 pb-1 text-xs font-black uppercase tracking-[0.15em] text-slate-500 lg:px-3 lg:pt-1">Choose a policy</p>
            {policies.map((policy) => {
              const active = type === policy.type;
              return (
                <Link
                  key={policy.type}
                  to={`/policies/${policy.type}`}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex min-h-[4.25rem] min-w-0 items-center rounded-xl px-3 py-3 text-left text-xs font-bold leading-5 transition-colors sm:px-4 sm:text-sm lg:min-h-11 lg:justify-between lg:gap-3 ${active ? 'bg-medical-dark text-white' : 'border border-slate-200 bg-white text-medical-text hover:border-medical-primary hover:bg-medical-light hover:text-medical-primary lg:border-0'}`}
                >
                  <span>
                    {policy.label}
                    <span className={`mt-1 hidden text-xs font-normal leading-5 lg:block ${active ? 'text-white/80' : 'text-slate-500'}`}>{policy.description}</span>
                  </span>
                  <ChevronRight size={17} className={`hidden shrink-0 lg:block ${active ? 'text-medical-accent' : 'text-slate-400 group-hover:text-medical-primary'}`} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </nav>

        <article className="min-w-0 overflow-hidden break-words border-y border-slate-200 bg-white p-4 sm:rounded-2xl sm:border sm:p-8 sm:shadow-soft lg:p-10">
          <div className="mx-auto max-w-3xl space-y-6">
            {type === 'privacy' && <PrivacyPolicy />}
            {type === 'terms' && <TermsPolicy />}
            {type === 'shipping' && <ShippingPolicy />}
            {type === 'returns' && <ReturnsPolicy />}
          </div>
        </article>
      </div>

      <section className="container mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="rounded-2xl bg-medical-dark p-6 text-white sm:p-8 shadow-soft">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-3">
              <FileCheck2 className="mt-1 shrink-0 text-medical-accent" size={25} aria-hidden="true" />
              <div>
                <h2 className="text-2xl font-bold">Questions about our {currentPolicy.label.toLowerCase()}?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Contact our US support specialists if you have questions regarding prescription requirements, return authorization, or state sales tax exemption.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <a href={`tel:${CONTACT_PHONE.replace(/\D/g, '')}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-accent px-4 py-3 font-bold text-medical-dark hover:bg-white"><Phone size={18} aria-hidden="true" /> Call {CONTACT_PHONE}</a>
              <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-medical-accent px-4 py-3 font-bold text-medical-accent hover:bg-medical-accent/10"><Mail size={18} aria-hidden="true" /> Email Support</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PolicyPage;
