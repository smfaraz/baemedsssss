import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  Send,
  ShoppingCart,
  X,
} from 'lucide-react';
import { APP_NAME, CONTACT_EMAIL, CONTACT_PHONE, SUPPORT_EMAIL } from '../constants';
import { Link, useCart } from '../context/CartContext';
import { fetchAllProducts } from '../lib/commerce';
import { formatPrice } from '../lib/marketConfig';
import { Product } from '../types';

interface MessageAction {
  label: string;
  to: string;
  external?: boolean;
}

interface Message {
  role: 'user' | 'bot';
  content: string;
  products?: Product[];
  actions?: MessageAction[];
}

// Product-word suggestions: only shown when the catalogue actually has matches.
const productQuestions = [
  'Find oxygen',
  'BiPAP / CPAP',
  'Nebulizer',
  'Patient monitor',
  'Suction machine',
];

// Store-info suggestions: always available (not tied to a specific product).
const infoQuestions = [
  'FSA / HSA & DME',
  'Hospital quote',
  'Delivery & Tax',
  'Warranty',
  'Payment options',
];


// Rotating soft colours so the suggestion row reads friendly, not one-note.
const chipColors = [
  'bg-sky-50 text-sky-900 border-sky-200 hover:border-sky-400',
  'bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-400',
  'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400',
  'bg-violet-50 text-violet-900 border-violet-200 hover:border-violet-400',
  'bg-rose-50 text-rose-900 border-rose-200 hover:border-rose-400',
  'bg-indigo-50 text-indigo-900 border-indigo-200 hover:border-indigo-400',
];

const ignoredTerms = new Set([
  'a', 'about', 'and', 'are', 'equipment', 'find', 'for', 'help', 'i', 'in', 'is',
  'me', 'need', 'of', 'or', 'please', 'show', 'the', 'to', 'want', 'with', 'you',
]);

const normalize = (value: string) => value
  .toLowerCase()
  .replace(/<[^>]*>/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const productSearchText = (product: Product) => normalize([
  product.title,
  product.handle,
  product.vendor,
  product.category,
  ...(product.tags || []),
  product.description || '',
  product.specs || '',
].join(' '));

const getTerms = (question: string) => normalize(question)
  .split(' ')
  .filter((term) => term.length > 1 && !ignoredTerms.has(term));

const SupportCenter: React.FC = () => {
  const { addToCart } = useCart();
  const [isCenterOpen, setIsCenterOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: `I am ${APP_NAME} AI Assistant. Tell me what you need, or choose a question below. I can help you find products, check prescription requirements, and assist with checkout.`,
      actions: [
        { label: 'Browse catalogue', to: '/products' },
        { label: 'Contact us', to: '/contact' },
      ],
    },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState(false);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchAllProducts()
      .then((catalogue) => {
        if (!active) return;
        setProducts(catalogue);
        setCatalogueError(false);
      })
      .catch((error) => {
        console.error('Failed to preload AI Bot catalogue:', error);
        if (active) setCatalogueError(true);
      })
      .finally(() => {
        if (active) setCatalogueLoading(false);
      });
    return () => { active = false; };
  }, []);

  const searchableProducts = useMemo(() => products.map((product) => ({
    product,
    searchable: productSearchText(product),
    title: normalize(product.title),
    handle: normalize(product.handle),
  })), [products]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isChatOpen, addingProductId]);

  const lastQuestion = useMemo(() => {
    const userMessages = messages.filter((message) => message.role === 'user');
    return userMessages[userMessages.length - 1]?.content || 'medical equipment and ordering';
  }, [messages]);

  const emailDraftHref = useMemo(() => {
    const subject = encodeURIComponent(`Support request: ${lastQuestion.slice(0, 40)}`);
    const body = encodeURIComponent(
      `Hello ${APP_NAME} Support Team,\n\nI need assistance regarding: ${lastQuestion}\n\nPlease get back to me at your earliest convenience.\n`,
    );
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }, [lastQuestion]);

  const findMatchingProducts = (question: string) => {
    const normalizedQuestion = normalize(question);
    const terms = getTerms(question);
    if (!terms.length) return [];

    return searchableProducts
      .map(({ product, searchable, title, handle }) => {
        let score = 0;
        terms.forEach((term) => {
          if (title === term || handle === term) score += 12;
          else if (title.startsWith(term)) score += 9;
          else if (title.includes(term) || handle.includes(term)) score += 6;
          else if (searchable.includes(term)) score += 2;
        });
        if (title.includes(normalizedQuestion) || handle.includes(normalizedQuestion)) score += 8;
        return { product, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.product.title.localeCompare(b.product.title))
      .slice(0, 5)
      .map(({ product }) => product);
  };

  // Drop any product suggestion that has no catalogue match (e.g. "Wheelchair"
  // when no wheelchair is stocked), so the bot never offers a dead end.
  const quickQuestions = useMemo(() => {
    const available = catalogueLoading
      ? []
      : productQuestions.filter((question) => findMatchingProducts(question).length > 0);
    return [...available, ...infoQuestions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchableProducts, catalogueLoading]);

  const getStoreAnswer = (question: string) => {
    const normalizedQuestion = normalize(question);

    if (/^(hi|hello|hey|hii+|good morning|good afternoon|good evening)\b/.test(normalizedQuestion)) {
      return {
        content: `Hello! I am ${APP_NAME} AI Assistant. Tell me a product (oxygen, CPAP, wheelchair, nebulizer, monitor…) or ask about nationwide shipping, FSA/HSA eligibility, warranty, payment methods, or institutional quotes.`,
        actions: [
          { label: 'Browse catalogue', to: '/products' },
          { label: 'Institutional / PO Orders', to: '/bulk-orders' },
        ],
      };
    }

    if (/thank|thanks|thankyou|great|nice|good bot|awesome/.test(normalizedQuestion)) {
      return {
        content: 'Glad to help! Ask me for another product, or contact our US customer support team via phone or email anytime.',
        actions: [{ label: 'Contact us', to: '/contact' }],
      };
    }

    if (/rent|rental|lease|hire|monthly/.test(normalizedQuestion)) {
      return {
        content: 'BaeMeds supplies brand-new, factory-sealed medical equipment for direct purchase with manufacturer warranty, FSA/HSA reimbursement receipts, and HCPCS billing codes. We do not provide equipment rentals in the US market.',
        actions: [
          { label: 'Browse catalogue', to: '/products' },
          { label: 'Contact sales desk', to: '/contact' },
        ],
      };
    }


    if (/warranty|guarantee|install|installation|service|repair|demo|training/.test(normalizedQuestion)) {
      return {
        content: 'All our equipment includes standard manufacturer warranties (typically 1 to 5 years). OEM customer support, service parts, and device setup guides are included with every delivery.',
        actions: [
          { label: 'Contact support', to: '/contact' },
          { label: 'Browse catalogue', to: '/products' },
        ],
      };
    }

    if (/payment|pay|card|credit|debit|apple pay|google pay|fsa|hsa|financing/.test(normalizedQuestion)) {
      return {
        content: 'We accept all major US credit/debit cards (Visa, MasterCard, American Express, Discover), Apple Pay, Google Pay, and FSA/HSA cards. Itemized receipts suitable for insurance reimbursement are provided upon order completion.',
        actions: [
          { label: 'Go to cart', to: '/cart' },
          { label: 'Contact us', to: '/contact' },
        ],
      };
    }

    if (/brand|philips|resmed|invacare|drive|omron|make|company|manufacturer|original|genuine/.test(normalizedQuestion)) {
      return {
        content: 'We stock 100% genuine medical equipment from leading FDA-compliant healthcare manufacturers including Philips Respironics, ResMed, Drive DeVilbiss, Invacare, and Omron.',
        actions: [
          { label: 'Browse catalogue', to: '/products' },
          { label: 'Contact us', to: '/contact' },
        ],
      };
    }

    if (/location|address|store|shop|visit|showroom|timing|hours|open|where|headquarters/.test(normalizedQuestion)) {
      return {
        content: 'BaeMeds Healthcare USA is headquartered in Wilmington, DE with certified distribution centers servicing all 50 states via USPS, UPS, and FedEx.',
        actions: [
          { label: 'Contact & Info', to: '/contact' },
          { label: 'Call now', to: `tel:${CONTACT_PHONE.replace(/\D/g, '')}`, external: true },
        ],
      };
    }

    if (/price|cost|budget|discount|offer|deal|lowest|quote/.test(normalizedQuestion)) {
      return {
        content: 'Prices are listed in USD ($) on each product page. For clinic, hospital, or bulk institutional pricing with tax-exempt purchase orders, please submit a quotation request.',
        actions: [
          { label: 'Browse catalogue', to: '/products' },
          { label: 'Institutional quote', to: '/bulk-orders' },
        ],
      };
    }

    if (/contact|talk|human|agent|representative|number|phone|call|support/.test(normalizedQuestion)) {
      return {
        content: `You can reach our US support specialists toll-free at ${CONTACT_PHONE} (Mon–Fri 8am–8pm EST) or email ${CONTACT_EMAIL}.`,
        actions: [
          { label: 'Contact us', to: '/contact' },
          { label: 'Call toll-free', to: `tel:${CONTACT_PHONE.replace(/\D/g, '')}`, external: true },
        ],
      };
    }

    if (/hospital|bulk|quotation|quote|institution|tax exempt|ein/.test(normalizedQuestion)) {
      return {
        content: 'For hospitals, surgery centers, and government institutions, we accept Net 30 purchase orders and state sales tax exemption certificates. Submit your details through our institutional portal.',
        actions: [
          { label: 'Request quotation', to: '/bulk-orders' },
          { label: 'Contact us', to: '/contact' },
        ],
      };
    }

    if (/delivery|shipping|tax|sales tax/.test(normalizedQuestion)) {
      return {
        content: 'We offer standard and expedited carrier shipping across all 50 US states with full door-to-door tracking. State sales tax is calculated automatically at checkout based on the delivery destination.',
        actions: [
          { label: 'Shipping Policy', to: '/policies/shipping' },
          { label: 'Contact us', to: '/contact' },
        ],
      };
    }

    if (/return|refund|cancel/.test(normalizedQuestion)) {
      return {
        content: 'We offer a 30-day return policy for unopened, unsealed consumer supplies. Medical devices requiring prescriptions and hygiene-sensitive items are subject to FDA safety return guidelines.',
        actions: [
          { label: 'Read return policy', to: '/policies/returns' },
          { label: 'Contact us', to: '/contact' },
        ],
      };
    }

    if (/cart|checkout|order|buy/.test(normalizedQuestion)) {
      return {
        content: 'Open a product to check its price and availability, then add it to your cart. Request a quotation for larger orders.',
        actions: [
          { label: 'Go to cart', to: '/cart' },
          { label: 'Hospital order', to: '/bulk-orders' },
        ],
      };
    }

    return null;
  };

  const sendQuestion = (questionOverride?: string) => {
    const question = (questionOverride || input).trim();
    if (!question) return;

    setMessages((current) => [...current, { role: 'user', content: question }]);
    setInput('');

    const matches = findMatchingProducts(question);
    const storeAnswer = getStoreAnswer(question);

    const contactActions: MessageAction[] = [
      { label: 'Call Toll-Free', to: `tel:${CONTACT_PHONE.replace(/\s/g, '')}`, external: true },
      { label: 'Email Support', to: `mailto:${SUPPORT_EMAIL}`, external: true },
    ];

    // Preset store questions always use the reviewed answer instead of being
    // mistaken for product keywords such as â€œhospitalâ€ or â€œdeliveryâ€.
    if (storeAnswer) {
      setMessages((current) => [...current, {
        role: 'bot',
        ...storeAnswer,
        actions: [...(storeAnswer.actions || []), ...contactActions],
      }]);
      return;
    }

    if (matches.length) {
      setMessages((current) => [...current, {
        role: 'bot',
        content: matches.length === 1 ? 'Did you mean this product?' : 'Did you mean one of these products?',
        products: matches,
        actions: [
          { label: 'Contact us', to: '/contact' },
          { label: 'Hospital order', to: '/bulk-orders' },
          { label: 'Go to cart', to: '/cart' },
          ...contactActions,
        ],
      }]);
      return;
    }

    const content = catalogueLoading
      ? 'Still loading. Try again shortly or contact us.'
      : catalogueError
        ? 'Product search is temporarily unavailable. Use Contact Us, call toll-free, or email and our team will help you.'
        : 'I could not find that product. Try one product, brand, or category word such as oxygen, CPAP, monitor, suction, or nebulizer.';

    setMessages((current) => [...current, {
      role: 'bot',
      content,
      actions: [
        { label: 'Browse catalogue', to: '/products' },
        { label: 'Contact us', to: '/contact' },
      ],
    }]);
  };

  const handleAddProduct = async (product: Product) => {
    if (!product.inStock || addingProductId) return;
    setAddingProductId(product.id);
    try {
      await addToCart(product, 1);
      setMessages((current) => [...current, {
        role: 'bot',
        content: `${product.title} was added to your cart. Review the cart to change quantity or continue to checkout.`,
        actions: [
          { label: 'Go to cart', to: '/cart' },
          { label: 'Continue shopping', to: '/products' },
        ],
      }]);
    } catch (error) {
      console.error('AI Bot add-to-cart failed:', error);
      setMessages((current) => [...current, {
        role: 'bot',
        content: `I could not add ${product.title} to the cart. Open the product page and try again, or contact the team for ordering help.`,
        products: [product],
        actions: [{ label: 'Contact us', to: '/contact' }],
      }]);
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 font-sans md:bottom-6 md:right-6">
      {isChatOpen && (
        <section className="reveal-up flex h-[min(700px,calc(100dvh-104px))] w-[calc(100vw-32px)] max-w-[430px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" aria-label="Baemeds AI Bot">
          <header className="flex items-center justify-between bg-medical-dark px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-medical-primary" aria-hidden="true"><Bot size={20} /></span>
              <div className="min-w-0">
                <h2 className="text-sm font-black">AI Bot</h2>
                <p className="truncate text-[11px] text-white/70">Product and order support</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsChatOpen(false)} className="tap-target inline-flex items-center justify-center rounded-xl hover:bg-white/10" aria-label="Close AI Bot">
              <X size={20} />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[92%] rounded-2xl px-3.5 py-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-br-md bg-medical-primary text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                  <p>{message.content}</p>

                  {message.products && message.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.products.map((product) => (
                        <article key={product.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex gap-3">
                            <img src={product.image} alt={product.title} className="h-14 w-14 shrink-0 rounded-lg bg-white object-contain" loading="lazy" />
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-xs font-black leading-4 text-medical-dark">{product.title}</h3>
                              <p className="mt-1 text-xs font-bold text-medical-primary">{formatPrice(product.price)}</p>
                              <p className={`mt-0.5 text-[11px] font-bold ${product.inStock ? 'text-emerald-700' : 'text-rose-700'}`}>{product.inStock ? 'In stock' : 'Out of stock'}</p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Link to={`/products/${product.handle}`} className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-medical-primary px-2 text-[11px] font-black text-medical-dark hover:bg-medical-light">
                              View product <ExternalLink size={13} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleAddProduct(product)}
                              disabled={!product.inStock || addingProductId === product.id}
                              className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-medical-primary px-2 text-[11px] font-black text-white hover:bg-medical-dark disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              <ShoppingCart size={13} /> {addingProductId === product.id ? 'Addingâ€¦' : product.inStock ? 'Add to cart' : 'Unavailable'}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action) => action.external ? (
                        <a key={action.label} href={action.to} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-2.5 text-[11px] font-black text-medical-dark hover:border-medical-primary hover:bg-medical-light">{action.label}</a>
                      ) : (
                        <Link key={action.label} to={action.to} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-2.5 text-[11px] font-black text-medical-dark hover:border-medical-primary hover:bg-medical-light">{action.label}</Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {catalogueLoading && (
              <p className="flex items-center gap-2 text-xs font-bold text-medical-primary"><span className="h-2 w-2 animate-pulse rounded-full bg-medical-primary" /> Loading productsâ€¦</p>
            )}
          </div>

          <div className="safe-bottom border-t border-slate-200 bg-white p-3">
            <div className="mb-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto pb-1" aria-label="Suggested AI Bot questions">
              {quickQuestions.map((question, index) => (
                <button key={question} type="button" onClick={() => sendQuestion(question)} className={`min-h-9 rounded-full border px-3 text-xs font-bold transition-colors ${chipColors[index % chipColors.length]}`}>
                  {question}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <label htmlFor="support-message" className="sr-only">Search for a product or ask a store question</label>
              <input
                id="support-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    sendQuestion();
                  }
                }}
                placeholder="Type one product word"
                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-medical-primary focus:ring-4 focus:ring-medical-primary/10"
              />
              <button type="button" onClick={() => sendQuestion()} disabled={!input.trim()} className="tap-target inline-flex items-center justify-center rounded-xl bg-medical-primary text-white hover:bg-medical-dark disabled:opacity-40" aria-label="Send to AI Bot">
                <Send size={18} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={`tel:${CONTACT_PHONE.replace(/\D/g, '')}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-medical-primary text-xs font-black text-medical-dark hover:bg-medical-light">
                <Phone size={16} /> Call now
              </a>
              <a href={emailDraftHref} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-primary text-xs font-black text-white hover:bg-medical-dark">
                <Mail size={16} /> Email Support
              </a>
            </div>
          </div>
        </section>
      )}

      {isCenterOpen && !isChatOpen && (
        <div className="reveal-up flex flex-col items-end gap-2">
          <a href={`tel:${CONTACT_PHONE.replace(/\D/g, '')}`} className="flex min-h-11 items-center gap-3 rounded-full bg-white px-4 font-bold text-medical-dark shadow-lg ring-1 ring-slate-200">
            <Phone size={18} /> Call {CONTACT_PHONE}
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="flex min-h-11 items-center gap-3 rounded-full bg-medical-primary px-4 font-bold text-white shadow-lg">
            <Mail size={18} /> Email Support
          </a>
          <button type="button" onClick={() => { setIsChatOpen(true); setIsCenterOpen(false); }} className="flex min-h-11 items-center gap-3 rounded-full bg-medical-dark px-4 font-bold text-white shadow-lg">
            <Bot size={18} /> Open AI Assistant
          </button>
        </div>
      )}

      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsCenterOpen((current) => !current)}
          className={`tap-target inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-colors ${isCenterOpen ? 'bg-slate-800' : 'bg-medical-primary hover:bg-medical-dark'}`}
          aria-label={isCenterOpen ? 'Close support' : 'Open product support, call, and email'}
          aria-expanded={isCenterOpen}
        >
          {isCenterOpen ? <X size={23} /> : <MessageSquare size={24} />}
        </button>
      )}
    </div>
  );
};

export default SupportCenter;
