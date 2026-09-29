import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, LogIn, Minus, Plus, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react';
import { Link, useNavigate, useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import OrderJourney from '../components/OrderJourney';
import { fetchAllProducts } from '../lib/commerce';
import { useReveal } from '../lib/useReveal';
import { formatPrice } from '../lib/marketConfig';
import { Product } from '../types';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const emptyRevealRef = useReveal<HTMLDivElement>();

  // Load a few in-stock products to suggest when the cart is empty.
  useEffect(() => {
    if (cart.length) return;
    let active = true;
    fetchAllProducts()
      .then((all) => {
        if (active) setSuggestions(all.filter((product) => product.inStock).slice(0, 4));
      })
      .catch((error) => console.error('Failed to load cart suggestions:', error));
    return () => { active = false; };
  }, [cart.length]);

  if (isLoading && !cart.length) {
    return (
      <main className="min-h-[72vh] px-4 py-12 sm:py-20" aria-busy="true" aria-label="Loading cart">
        <section className="mx-auto max-w-2xl rounded-2xl border border-medical-light bg-white p-8 text-center shadow-soft">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-medical-light" />
          <p className="mt-5 text-sm font-semibold text-medical-text/70">Loading your cart...</p>
        </section>
      </main>
    );
  }

  const changeQuantity = async (lineItemId: string | undefined, quantity: number) => {
    if (!lineItemId) {
      setActionError('This item could not be updated. Refresh the page and try again.');
      return;
    }
    setActionError('');
    try {
      await updateQuantity(lineItemId, quantity);
    } catch {
      setActionError('The item quantity could not be updated. Please try again.');
    }
  };

  const removeItem = async (lineItemId: string | undefined) => {
    if (!lineItemId) {
      setActionError('This item could not be removed. Refresh the page and try again.');
      return;
    }
    setActionError('');
    try {
      await removeFromCart(lineItemId);
    } catch {
      setActionError('The item could not be removed. Please try again.');
    }
  };

  if (!cart.length) {
    return (
      <main className="min-h-[72vh] px-4 py-12 sm:py-20">
        <section ref={emptyRevealRef} className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-medical-light bg-white p-6 text-center shadow-soft sm:p-10 reveal-on-scroll">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-medical-light text-medical-primary" aria-hidden="true">
            <ShoppingCart size={30} />
          </span>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-medical-primary">Your basket</p>
          <h1 className="text-3xl font-bold tracking-tight text-medical-dark">Your cart is empty</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-medical-text/75">Browse the catalogue, compare the specifications, and add the equipment you need.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/products" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white hover:bg-medical-dark transition">
              Browse products <ArrowRight size={18} />
            </Link>
            <Link to="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-medical-primary px-6 py-3 font-semibold text-medical-primary hover:bg-medical-light transition">Ask for help</Link>
          </div>
        </section>

        {suggestions.length > 0 && (
          <section className="mx-auto mt-12 max-w-6xl" aria-label="Popular products">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-medical-dark sm:text-2xl">Popular right now</h2>
              <Link to="/products" className="inline-flex items-center gap-1 text-sm font-bold text-medical-primary hover:text-medical-dark">View all <ArrowRight size={16} /></Link>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {suggestions.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}
      </main>
    );
  }

  const hasPrescriptionItem = cart.some((item) => item.requiresPrescription);
  const [rxAttested, setRxAttested] = useState(false);

  return (
    <main className="min-h-screen py-8 sm:py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-medical-primary">Review your selection</p>
            <h1 className="text-3xl font-bold tracking-tight text-medical-dark">Cart <span className="text-lg font-medium text-medical-text/50">({cartCount} {cartCount === 1 ? 'item' : 'items'})</span></h1>
          </div>
          <Link to="/products" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 font-semibold text-medical-primary hover:bg-medical-light transition">
            <ArrowLeft size={18} /> Continue shopping
          </Link>
        </div>

        {actionError && <div role="alert" className="mb-5 rounded-xl border border-medical-alert/30 bg-medical-alert/10 p-4 text-sm font-semibold text-medical-alert">{actionError}</div>}

        {hasPrescriptionItem && (
          <div role="alert" className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-900 font-black text-sm">Rx</span>
              <div>
                <h3 className="font-bold text-amber-950">Clinical Prescription Requirement</h3>
                <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
                  Your order contains medical devices subject to FDA and state DME regulations. A valid prescription from a licensed US healthcare provider is required prior to equipment shipment. You can upload your prescription document or provide physician contact information after checkout in your account portal.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
          <section className="overflow-hidden rounded-2xl border border-medical-light bg-white shadow-soft" aria-label="Cart items">
            <ul className="divide-y divide-medical-light">
              {cart.map((item, idx) => (
                <li key={item.lineItemId || item.id} className="grid gap-4 p-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-6 motion-lift" style={{ ['--reveal-delay' as any]: `${idx * 50}ms` }}>
                  <Link to={`/products/${item.handle || item.id}`} className="flex aspect-square w-24 items-center justify-center overflow-hidden rounded-xl bg-medical-light sm:w-28" aria-label={`View ${item.title}`}>
                    {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-contain p-2" /> : <ShoppingCart className="text-medical-text/20" />}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-medical-text/50">{/mohsin/i.test(item.vendor || '') ? 'Baemeds' : item.vendor || 'Baemeds catalogue'}</p>
                          {item.requiresPrescription && (
                            <span className="rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 uppercase tracking-wider">Rx Required</span>
                          )}
                        </div>
                        <h2 className="mt-1 font-bold leading-snug text-medical-dark"><Link to={`/products/${item.handle || item.id}`} className="hover:text-medical-primary transition">{item.title}</Link></h2>
                        {item.specs && <p className="mt-1 line-clamp-2 text-sm text-medical-text/60">{item.specs}</p>}
                      </div>
                      <p className="shrink-0 text-lg font-bold text-medical-dark">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex min-h-11 items-center rounded-xl border border-medical-light bg-white" aria-label={`Quantity for ${item.title}`}>
                        <button type="button" onClick={() => changeQuantity(item.lineItemId, item.quantity - 1)} disabled={isLoading} className="flex h-11 w-11 items-center justify-center rounded-l-xl text-medical-text hover:bg-medical-light disabled:opacity-50 transition" aria-label={`Decrease ${item.title} quantity`}><Minus size={16} /></button>
                        <span className="w-10 text-center text-sm font-bold text-medical-dark" aria-live="polite">{item.quantity}</span>
                        <button type="button" onClick={() => changeQuantity(item.lineItemId, item.quantity + 1)} disabled={isLoading} className="flex h-11 w-11 items-center justify-center rounded-r-xl text-medical-text hover:bg-medical-light disabled:opacity-50 transition" aria-label={`Increase ${item.title} quantity`}><Plus size={16} /></button>
                      </div>
                      <button type="button" onClick={() => removeItem(item.lineItemId)} disabled={isLoading} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-medical-alert hover:bg-medical-alert/10 disabled:opacity-50 transition" aria-label={`Remove ${item.title} from cart`}><Trash2 size={17} /> Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="rounded-2xl border border-medical-light bg-white p-5 shadow-soft lg:sticky lg:top-28 sm:p-6" aria-label="Order summary">
            <h2 className="text-xl font-bold text-medical-dark">Order summary</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-medical-text/60">Subtotal</dt><dd className="font-semibold text-medical-dark">{formatPrice(cartTotal)}</dd></div>
              <div className="flex justify-between gap-4 border-t border-medical-light pt-4"><dt className="text-medical-text/60">Shipping and taxes</dt><dd className="max-w-40 text-right text-medical-text/50">Confirmed at checkout</dd></div>
              <div className="flex justify-between gap-4 border-t border-medical-light pt-4 text-lg"><dt className="font-bold text-medical-dark">Total</dt><dd className="font-bold text-medical-dark">{formatPrice(cartTotal)}</dd></div>
            </dl>

            {hasPrescriptionItem && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-amber-950 font-medium">
                  <input
                    type="checkbox"
                    checked={rxAttested}
                    onChange={(e) => setRxAttested(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-400 text-medical-primary focus:ring-medical-primary"
                  />
                  <span>
                    I certify that I have or will provide a valid medical prescription from a licensed healthcare provider for Rx equipment prior to shipment.
                  </span>
                </label>
              </div>
            )}

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-medical-light p-3 text-sm text-medical-dark">
              <ShieldCheck className="mt-0.5 shrink-0 text-medical-primary" size={19} />
              <p>You will review final shipping, tax, and payment details before placing the order.</p>
            </div>
            {!isAuthenticated && (
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-600">
                <LogIn className="mt-0.5 shrink-0 text-medical-primary" size={19} />
                <p><Link to="/login?returnTo=%2Fcart" className="font-bold text-medical-primary hover:underline">Sign in</Link> to connect this cart to saved addresses and account order history, or continue as a guest.</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              disabled={isLoading || (hasPrescriptionItem && !rxAttested)}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-medical-primary px-5 py-3 font-bold text-white hover:bg-medical-dark disabled:cursor-not-allowed disabled:opacity-60 transition"
            >
              {isLoading ? 'Updating cart...' : hasPrescriptionItem && !rxAttested ? 'Acknowledge Rx to continue' : 'Continue to checkout'}
              {!isLoading && (!hasPrescriptionItem || rxAttested) && <ArrowRight size={18} />}
            </button>
            <Link to="/contact" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-medical-primary hover:bg-medical-light transition">Need help with this order?</Link>
          </aside>
        </div>
        <OrderJourney />
      </div>
    </main>
  );
};

export default CartPage;
