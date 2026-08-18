import React from 'react';
import { ChevronRight, FileCheck2, Home, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE, SITE_DOMAIN } from '../constants';
import { Link } from '../context/CartContext';

type PolicyType = 'privacy' | 'terms' | 'shipping' | 'returns';

const whatsappNumber = CONTACT_PHONE.replace(/\D/g, '');
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello Baemeds, I have a question about your website policies.')}`;

const policies: Array<{ type: PolicyType; label: string; description: string }> = [
  { type: 'privacy', label: 'Privacy Policy', description: 'How personal information is collected, used, stored, and shared.' },
  { type: 'terms', label: 'Terms of Service', description: 'The rules that apply when browsing, enquiring, or ordering.' },
  { type: 'shipping', label: 'Shipping & Delivery', description: 'Shipping charges, delivery estimates, tracking, and receiving an order.' },
  { type: 'returns', label: 'Returns & Refunds', description: 'Eligibility, exceptions, and the return request process.' },
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
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">Legal information</p>
      <h1 className="mt-2 text-3xl font-bold text-medical-dark sm:text-4xl">Privacy Policy</h1>
      <p className="mt-4 leading-7 text-slate-600">
        This policy explains how Mohsin Enterprises, operating the {APP_NAME} storefront, handles personal information when you browse {SITE_DOMAIN}, create an account, place an order, or contact us.
      </p>
      <p className="mt-3 text-sm font-medium text-slate-500">Last updated: 18 July 2026</p>
    </header>

    <Section title="1. Who is responsible for your information">
      <p>{APP_NAME} is operated by Mohsin Enterprises, which is responsible for the website and the personal information described in this policy.</p>
      <p>Privacy questions and requests can be sent to <a className="font-semibold text-medical-primary hover:text-medical-dark" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </Section>

    <Section title="2. Information we collect">
      <p>Depending on how you use the website, we may receive:</p>
      <ul className="list-disc space-y-2 pl-5 marker:text-medical-primary">
        <li><strong className="text-slate-800">Identity and contact details:</strong> name, email address, phone number, billing address, and delivery address.</li>
        <li><strong className="text-slate-800">Order information:</strong> products, quantities, prices, order status, returns, and customer-support history.</li>
        <li><strong className="text-slate-800">Account information:</strong> account identifiers and sign-in details handled through the connected commerce platform. We do not ask you to send passwords by email or WhatsApp.</li>
        <li><strong className="text-slate-800">Enquiry information:</strong> product questions, quotation requirements, uploaded-file names, and other details you choose to include in a message.</li>
        <li><strong className="text-slate-800">Device and usage information:</strong> browser type, device type, IP address, pages viewed, and essential website-storage data where provided by our hosting or commerce services. Recently viewed products may be kept in local storage on the customer&apos;s own device.</li>
        <li><strong className="text-slate-800">Payment and transaction information:</strong> payment status and transaction references provided by the payment or commerce platform. Complete card or banking credentials are processed by the payment provider, not entered into our support forms.</li>
      </ul>
    </Section>

    <Section title="3. How we use information">
      <ul className="list-disc space-y-2 pl-5 marker:text-medical-primary">
        <li>To provide the catalogue, account, cart, wishlist, checkout, and order functions you request.</li>
        <li>To verify, process, dispatch, support, cancel, return, or refund an order.</li>
        <li>To answer product, rental, bulk-order, and customer-service enquiries.</li>
        <li>To detect fraud, protect accounts, diagnose errors, and maintain website security.</li>
        <li>To comply with accounting, tax, regulatory, legal, and dispute-resolution obligations.</li>
        <li>To send marketing only where you have opted in or where otherwise permitted, with a way to opt out.</li>
      </ul>
      <p>We do not sell personal information. We do not use support messages to provide a medical diagnosis.</p>
    </Section>

    <Section title="4. When information is shared">
      <p>We share only what is reasonably necessary with service providers involved in running the store, such as:</p>
      <ul className="list-disc space-y-2 pl-5 marker:text-medical-primary">
        <li>Shopify or another connected commerce provider for products, accounts, cart, checkout, and orders.</li>
        <li>Payment processors, banks, and fraud-prevention providers for transaction handling.</li>
        <li>Courier, freight, installation, or logistics partners where needed to fulfil an order.</li>
        <li>Email, communications, hosting, security, and technical-support providers.</li>
        <li>Professional advisers, regulators, law-enforcement authorities, or courts when legally required.</li>
      </ul>
      <p>These providers may process information in other locations under their own privacy terms and applicable safeguards.</p>
    </Section>

    <Section title="5. Cookies and browser storage">
      <p>The website may use cookies or similar browser storage to keep you signed in, remember cart or wishlist choices, protect the session, and make core storefront functions work. Commerce, checkout, security, or analytics providers may also set their own cookies.</p>
      <p>You can restrict cookies in your browser, but account, cart, checkout, or other essential functions may stop working correctly.</p>
    </Section>

    <Section title="6. Health and sensitive information">
      <p>Do not send medical records, prescriptions, diagnoses, identity documents, or other sensitive information through a general contact form unless our team specifically confirms a secure and necessary route. Product information on this website is not a substitute for advice from a qualified healthcare professional.</p>
    </Section>

    <Section title="7. Retention and security">
      <p>We keep personal information only for as long as it is needed for the purposes above, including order support and legal, tax, accounting, warranty, fraud-prevention, and dispute records. Different categories may have different retention periods.</p>
      <p>We use reasonable organisational and technical measures to protect information. No internet transmission or storage method can be guaranteed to be completely secure, so never send passwords or complete payment credentials through email, forms, or WhatsApp.</p>
    </Section>

    <Section title="8. Your choices and requests">
      <p>Subject to applicable law, you may ask us to explain the information we hold about you, correct inaccurate details, delete information that is no longer required, withdraw a consent, or stop direct marketing.</p>
      <p>Send your request from the email address connected to your account or order. We may need enough information to verify your identity before acting. Some records may need to be retained where required by law or necessary for an unresolved transaction or dispute.</p>
    </Section>

    <Section title="9. Children">
      <p>The storefront is intended for adults who can enter a purchase contract. We do not knowingly seek personal information directly from children. A parent or guardian who believes a child has submitted information can contact us to request review or deletion.</p>
    </Section>

    <Section title="10. External links and policy changes">
      <p>Links to manufacturers, payment pages, shipping providers, or other third-party websites are governed by those organisations&apos; policies. We are not responsible for their independent privacy practices.</p>
      <p>We may update this policy as the storefront, providers, or legal requirements change. The updated date at the top identifies the current version.</p>
    </Section>
  </>
);

const TermsPolicy = () => (
  <>
    <header>
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">Legal information</p>
      <h1 className="mt-2 text-3xl font-bold text-medical-dark sm:text-4xl">Terms of Service</h1>
      <p className="mt-4 leading-7 text-slate-600">These terms apply when you browse, contact, register, or order through {SITE_DOMAIN}. The storefront is operated by Mohsin Enterprises under the {APP_NAME} brand.</p>
      <p className="mt-3 text-sm font-medium text-slate-500">Last updated: 18 July 2026</p>
    </header>

    <Section title="1. Using the storefront">
      <p>You must provide accurate information, use the website lawfully, and keep account credentials confidential. Do not interfere with security, scrape protected services, introduce harmful code, impersonate another person, or use the website to commit fraud.</p>
    </Section>
    <Section title="2. Product information and medical use">
      <p>We aim to present product titles, images, specifications, prices, and availability accurately. Manufacturers can change packaging or specifications, and screen colours or scale may differ. Confirm critical compatibility or clinical requirements before ordering.</p>
      <p>Website content is general product information, not medical advice, diagnosis, or a prescription. Medical equipment must be selected, configured, and used according to manufacturer instructions and appropriate professional guidance.</p>
    </Section>
    <Section title="3. Prices, availability, and orders">
      <p>Prices, taxes, delivery charges, promotions, and stock may change until checkout confirms an order. Adding an item to a cart does not reserve stock. We may contact you to clarify an address, prescription requirement, compatibility, unusual quantity, pricing error, suspected fraud, or unavailable item.</p>
      <p>An automated acknowledgement does not guarantee acceptance. If an order cannot be fulfilled after payment, we will contact you about the available resolution, including a refund where applicable.</p>
    </Section>
    <Section title="4. Checkout, payment, and delivery">
      <p>Checkout and payment may be provided by Shopify and connected payment services under their terms. Use only a payment method you are authorised to use.</p>
      <p>Delivery estimates are estimates rather than guarantees. Delays can result from stock confirmation, address issues, carrier capacity, weather, regulatory checks, or other circumstances outside direct control. Inspect the shipment promptly and report visible damage or an incorrect item with supporting photos.</p>
    </Section>
    <Section title="5. Returns, refunds, cancellations, and warranties">
      <p>Return requests are governed by the Returns &amp; Refunds Policy and any product-specific hygiene, sterility, installation, warranty, or manufacturer conditions. A cancellation request may not be possible after dispatch or procurement has begun.</p>
      <p>Manufacturer warranties, where offered, remain subject to the manufacturer&apos;s terms, proof-of-purchase requirements, and service process.</p>
    </Section>
    <Section title="6. Institutional enquiries and rentals">
      <p>A bulk-order, quotation, or rental form is an enquiry, not a confirmed order or rental contract. Price, stock, delivery, installation, deposit, duration, maintenance, collection, and payment terms must be confirmed separately in writing.</p>
    </Section>
    <Section title="7. Intellectual property and third-party services">
      <p>The website design and original content may not be copied or commercially reused without permission. Product names, logos, images, and trademarks can belong to their respective owners.</p>
      <p>Third-party services and links operate under their own terms. We are not responsible for independent websites or services outside our control.</p>
    </Section>
    <Section title="8. Liability and applicable law">
      <p>Nothing in these terms excludes liability that cannot lawfully be excluded. To the extent permitted by law, Mohsin Enterprises is not responsible for indirect or consequential loss arising from website interruption, misuse of a product, failure to follow instructions, or third-party services.</p>
      <p>These terms are governed by applicable Indian law. Disputes are subject to courts with competent jurisdiction, without limiting any mandatory consumer rights.</p>
    </Section>
    <Section title="9. Contact">
      <p>Questions about an order or these terms can be sent to <a className="font-semibold text-medical-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or discussed by calling <a className="font-semibold text-medical-primary" href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a>.</p>
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
      <p className="mt-4 leading-7 text-slate-600">Contact us within seven days of delivery to request a return review. Do not send a product back until the team confirms the return instructions and destination.</p>
      <p className="mt-3 text-sm font-medium text-slate-500">Last updated: 18 July 2026</p>
    </header>

    <Section title="1. Start a return request">
      <p>Email {CONTACT_EMAIL} or call {CONTACT_PHONE}. Include your order reference, product name, reason for the request, and clear photos or video for damage, defect, missing contents, or an incorrect item.</p>
      <p>Keep the product, accessories, manuals, serial labels, seals, and original packaging until the review is complete.</p>
    </Section>
    <Section title="2. General eligibility">
      <p>A return is generally eligible for review when requested within seven days of delivery and the product is unused, complete, unaltered, and in its original saleable packaging. Approval also depends on the product type, condition, hygiene status, installation status, and manufacturer rules.</p>
    </Section>
    <Section title="3. Items that may not be returnable">
      <ul className="list-disc space-y-2 pl-5 marker:text-medical-primary">
        <li>Opened, used, fitted, worn, contaminated, or damaged products.</li>
        <li>Opened sterile, hygiene-sensitive, disposable, or personal-use products, including masks and cannulas.</li>
        <li>Custom-configured, specially procured, engraved, or made-to-order products.</li>
        <li>Products missing accessories, labels, manuals, warranty material, or original packaging.</li>
        <li>Damage caused by incorrect installation, voltage, storage, cleaning, handling, or use contrary to instructions.</li>
      </ul>
      <p>This does not remove remedies that cannot be excluded under applicable consumer law.</p>
    </Section>
    <Section title="4. Damaged, defective, or incorrect deliveries">
      <p>Report visible shipping damage, missing contents, or an incorrect item as soon as possible after delivery and retain the shipping packaging. We may request photos, video, serial numbers, or a technical assessment to determine the appropriate replacement, repair, return, or refund route.</p>
      <p>For manufacturer-warranty issues arising after delivery, the product may need to follow the authorised service process.</p>
    </Section>
    <Section title="5. Return shipping and inspection">
      <p>We will provide return instructions after approval. Return-shipping responsibility depends on the reason for return and the review outcome. Items remain subject to inspection when received. A returned parcel does not automatically guarantee a refund.</p>
    </Section>
    <Section title="6. Refunds">
      <p>If approved after inspection, the refund will be initiated through the applicable original payment route where possible. The time for funds to appear depends on the bank, payment provider, and transaction method. Any permitted deduction or non-refundable charge will be explained before the return is finalised.</p>
    </Section>
    <Section title="7. Cancellations">
      <p>Contact us immediately to request cancellation. We will check the procurement and dispatch status. A request cannot be guaranteed after an item has been procured, configured, handed to a carrier, or otherwise entered fulfilment.</p>
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
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-medical-accent">Baemeds policy centre</p>
              <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">Clear information before you order</h1>
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
                <h2 className="text-2xl font-bold">Questions about the {currentPolicy.label.toLowerCase()}?</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Contact the team before ordering if a return condition, product restriction, or privacy question needs clarification.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <a href={`tel:${CONTACT_PHONE}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-accent px-4 py-3 font-bold text-medical-dark hover:bg-white"><Phone size={18} aria-hidden="true" /> Call</a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-medical-accent px-4 py-3 font-bold text-medical-accent hover:bg-medical-accent/10"><MessageCircle size={18} aria-hidden="true" /> WhatsApp</a>
              <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-medical-accent px-4 py-3 font-bold text-medical-accent hover:bg-medical-accent/10"><Mail size={18} aria-hidden="true" /> Email</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PolicyPage;
