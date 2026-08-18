import React, { useEffect, useState } from 'react';
import { ArrowRight, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Link, useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { fetchAllProducts } from '../lib/shopify';
import { useReveal } from '../lib/useReveal';
import { Product } from '../types';

const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const emptyRevealRef = useReveal<HTMLDivElement>();
  const gridRevealRef = useReveal<HTMLDivElement>();

  // Suggest a few in-stock products when the wishlist is empty.
  useEffect(() => {
    if (wishlist.length) return;
    let active = true;
    fetchAllProducts()
      .then((all) => {
        if (active) setSuggestions(all.filter((product) => product.inStock).slice(0, 4));
      })
      .catch((error) => console.error('Failed to load wishlist suggestions:', error));
    return () => { active = false; };
  }, [wishlist.length]);

  const moveToCart = async (product: typeof wishlist[number]) => {
    setMovingId(product.id);
    setActionError('');
    try {
      await addToCart(product);
      removeFromWishlist(product.id);
    } catch {
      setActionError('This product could not be moved to your cart. Please try again.');
    } finally {
      setMovingId(null);
    }
  };

  if (!wishlist.length) {
    return (
      <main className="min-h-[72vh] px-4 py-12 sm:py-20">
        <section ref={emptyRevealRef} className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-medical-light bg-white p-6 text-center shadow-soft sm:p-10 reveal-on-scroll">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-medical-light text-medical-primary" aria-hidden="true"><Heart size={30} /></span>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-medical-primary">Saved products</p>
          <h1 className="text-3xl font-bold tracking-tight text-medical-dark">Build a shortlist</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-medical-text/75">Save products while you compare equipment. Your shortlist will stay on this device.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/products" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white hover:bg-medical-dark transition">Browse products <ArrowRight size={18} /></Link>
            <Link to="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-medical-primary px-6 py-3 font-semibold text-medical-primary hover:bg-medical-light transition">Get product guidance</Link>
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

  return (
    <main className="min-h-screen py-8 sm:py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-medical-primary">Saved on this device</p>
            <h1 className="text-3xl font-bold tracking-tight text-medical-dark">Your wishlist <span className="text-lg font-medium text-medical-text/50">({wishlist.length})</span></h1>
          </div>
          <Link to="/products" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 font-semibold text-medical-primary hover:bg-medical-light transition">Continue browsing <ArrowRight size={18} /></Link>
        </div>
        {actionError && <div role="alert" className="mb-5 rounded-xl border border-medical-alert/30 bg-medical-alert/10 p-4 text-sm font-semibold text-medical-alert">{actionError}</div>}
        <div ref={gridRevealRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-grid">
          {wishlist.map((product) => (
            <article key={product.id} className="rounded-2xl border border-medical-light bg-white p-2 shadow-soft motion-lift">
              <ProductCard product={product} />
              <div className="grid grid-cols-[minmax(0,1fr)_3rem] gap-2 p-2 pt-3">
                <button type="button" onClick={() => moveToCart(product)} disabled={movingId === product.id || !product.inStock} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-primary px-3 py-2 text-sm font-bold text-white hover:bg-medical-dark disabled:cursor-not-allowed disabled:opacity-50 transition">
                  <ShoppingCart size={17} /> {movingId === product.id ? 'Moving…' : product.inStock ? 'Move to cart' : 'Out of stock'}
                </button>
                <button type="button" onClick={() => removeFromWishlist(product.id)} className="flex h-11 w-12 items-center justify-center rounded-xl border border-medical-alert/30 text-medical-alert hover:bg-medical-alert/10 transition" aria-label={`Remove ${product.title} from wishlist`}><Trash2 size={18} /></button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

export default WishlistPage;
