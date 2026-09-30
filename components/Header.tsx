import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  Heart,
  Hospital,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from '../context/CartContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { APP_NAME, CATEGORIES } from '../constants';
import { fetchAllProducts, searchProducts } from '../lib/commerce';
import { FLY_TO_CART_EVENT, FlyToCartDetail } from '../lib/flyToCart';
import { Product } from '../types';
import TopBar from './TopBar';
import BrandMark from './BrandMark';
import { formatPrice } from '../lib/marketConfig';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDevicesOpen, setIsDevicesOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogueProducts, setCatalogueProducts] = useState<Product[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const devicesRef = useRef<HTMLDivElement>(null);
  const cartIconRef = useRef<HTMLSpanElement>(null);
  const [cartBump, setCartBump] = useState(false);
  const prevCartCount = useRef(0);
  const { cartCount, wishlist } = useCart();
  const { isAuthenticated, customer, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    fetchAllProducts()
      .then((products) => {
        if (active) setCatalogueProducts(products);
      })
      .catch((error) => console.error('Failed to load navigation categories:', error))
      .finally(() => {
        if (active) setCategoriesLoaded(true);
      });
    return () => { active = false; };
  }, []);

  const visibleCategories = useMemo(() => {
    if (!categoriesLoaded) return CATEGORIES.slice(0, 12);
    return CATEGORIES.filter((category) => {
      const terms = (category.slug || category.name)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length > 1 && !['and', 'machine', 'machines', 'equipment', 'accessories', 'medical'].includes(term));
      return catalogueProducts.some((product) => {
        const searchable = `${product.title} ${product.category} ${product.vendor} ${(product.tags || []).join(' ')}`.toLowerCase();
        return terms.length > 0 && terms.some((term) => searchable.includes(term));
      });
    });
  }, [catalogueProducts, categoriesLoaded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (devicesRef.current && !devicesRef.current.contains(event.target as Node)) {
        setIsDevicesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsDevicesOpen(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const query = searchTerm.trim();
    const timer = window.setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchProducts(query);
        setSuggestions(results.slice(0, 6));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  // Pop the cart badge whenever the item count increases.
  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBump(true);
      const timer = window.setTimeout(() => setCartBump(false), 520);
      prevCartCount.current = cartCount;
      return () => window.clearTimeout(timer);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  // Fly-to-cart puck: arc a product thumbnail from its source into the cart icon.
  useEffect(() => {
    const handleFly = (event: Event) => {
      const detail = (event as CustomEvent<FlyToCartDetail>).detail;
      const target = cartIconRef.current;
      if (!detail || !target) return;

      const targetRect = target.getBoundingClientRect();
      const puck = document.createElement('div');
      puck.className = 'fly-puck';
      puck.style.left = `${detail.x}px`;
      puck.style.top = `${detail.y}px`;
      puck.style.transform = 'translate(0, 0) scale(1)';
      if (detail.image) {
        const img = document.createElement('img');
        img.src = detail.image;
        img.alt = '';
        puck.appendChild(img);
      }
      document.body.appendChild(puck);

      const dx = targetRect.left + targetRect.width / 2 - detail.x - 28;
      const dy = targetRect.top + targetRect.height / 2 - detail.y - 28;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          puck.style.transform = `translate(${dx}px, ${dy}px) scale(0.2)`;
          puck.style.opacity = '0.2';
        });
      });

      const cleanup = () => {
        puck.remove();
        target.classList.remove('cart-wiggle');
        void target.offsetWidth;
        target.classList.add('cart-wiggle');
        window.setTimeout(() => target.classList.remove('cart-wiggle'), 560);
      };
      puck.addEventListener('transitionend', cleanup, { once: true });
      window.setTimeout(cleanup, 900);
    };

    window.addEventListener(FLY_TO_CART_EVENT, handleFly);
    return () => window.removeEventListener(FLY_TO_CART_EVENT, handleFly);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;
    setShowSuggestions(false);
    closeMenu();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (window.location.pathname === '/search') navigate('/search');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_8px_30px_-24px_rgba(18,59,74,0.5)] backdrop-blur">
      <TopBar />

      <div className="container mx-auto flex flex-wrap items-center gap-3 px-4 py-3 lg:flex-nowrap lg:gap-6 lg:py-4">
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="tap-target -ml-2 inline-flex items-center justify-center rounded-xl text-slate-700 hover:bg-medical-light lg:hidden"
          aria-label="Open navigation menu"
          aria-expanded={isMenuOpen}
        >
          <Menu size={26} />
        </button>

        <Link to="/" className="shrink-0" aria-label={`${APP_NAME} home`}><BrandMark /></Link>

        <div ref={searchRef} className="relative order-3 w-full lg:order-none lg:mx-4 lg:flex-1">
          <form onSubmit={handleSearch} role="search" className="relative">
            <label htmlFor="site-search" className="sr-only">Search medical equipment</label>
            <input
              id="site-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={() => searchTerm.trim().length >= 2 && setShowSuggestions(true)}
              placeholder="Search products, brands or categories"
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-4 pr-24 text-sm text-slate-900 outline-none transition focus:border-medical-primary focus:bg-white focus:ring-4 focus:ring-medical-primary/10"
            />
            <div className="absolute inset-y-0 right-1 flex items-center gap-1">
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="tap-target inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
              <button
                type="submit"
                className="tap-target inline-flex items-center justify-center rounded-lg bg-medical-primary text-white hover:bg-medical-dark"
                aria-label="Submit search"
              >
                <Search size={20} className={isLoading ? 'animate-pulse' : ''} />
              </button>
            </div>
          </form>

          {showSuggestions && searchTerm.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" role="listbox">
              {suggestions.length > 0 ? (
                <>
                  <div className="max-h-[55vh] overflow-y-auto py-2">
                    {suggestions.map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.handle}`}
                        onClick={() => setShowSuggestions(false)}
                        className="flex min-h-14 items-center gap-3 px-3 py-2 hover:bg-medical-light"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                          <img src={product.image || undefined} alt={product.title} className="h-full w-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{product.title}</p>
                          <p className="text-xs font-bold text-medical-primary">{formatPrice(product.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuggestions(false);
                      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                    }}
                    className="min-h-12 w-full border-t border-slate-200 bg-slate-50 px-4 text-sm font-bold text-medical-dark hover:bg-medical-light"
                  >
                    View all search results
                  </button>
                </>
              ) : !isLoading ? (
                <div className="p-4 text-center text-sm text-slate-600">
                  No matching products. Try a category or brand name.
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-600">Searching catalogue...</div>
              )}
            </div>
          )}
        </div>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Account shortcuts">
          <Link
            to={isAuthenticated ? '/account' : '/login'}
            className="tap-target hidden items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-medical-light hover:text-medical-primary sm:inline-flex"
            aria-label={isAuthenticated ? 'Open account' : 'Sign in'}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-medical-light text-medical-primary">
              <User size={16} />
            </span>
            {isAuthenticated && customer ? (
              <span className="max-w-[110px] truncate font-bold text-medical-dark">
                {customer.firstName || 'Account'}
              </span>
            ) : (
              <span className="hidden xl:inline text-xs font-medium text-slate-600">Sign In</span>
            )}
          </Link>
          <Link
            to="/wishlist"
            className="tap-target relative inline-flex items-center justify-center rounded-xl text-slate-700 hover:bg-medical-light hover:text-medical-primary"
            aria-label={`Wishlist with ${wishlist.length} items`}
          >
            <Heart size={22} />
            {wishlist.length > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-medical-accent px-1 text-[10px] font-black text-medical-dark">
                {wishlist.length}
              </span>
            )}
          </Link>
          <span ref={cartIconRef} className="relative inline-flex">
            <Link
              to="/cart"
              className="tap-target relative inline-flex items-center justify-center rounded-xl text-slate-700 hover:bg-medical-light hover:text-medical-primary"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCart size={23} />
              {cartCount > 0 && (
                <span className={`absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-medical-accent px-1 text-[10px] font-black text-medical-dark ${cartBump ? 'cart-bump' : ''}`}>
                  {cartCount}
                </span>
              )}
            </Link>
          </span>
        </nav>
      </div>

      <nav className="hidden border-t border-slate-200 bg-white lg:block" aria-label="Primary navigation">
        <div className="container mx-auto flex min-h-12 items-center gap-7 px-4 text-sm font-bold text-slate-700">
          <Link to="/products" className="hover:text-medical-primary">All products</Link>
          <div ref={devicesRef} className="relative self-stretch">
            <button
              type="button"
              onClick={() => setIsDevicesOpen((current) => !current)}
              className="flex h-full min-h-12 items-center gap-1.5 hover:text-medical-primary"
              aria-haspopup="menu"
              aria-expanded={isDevicesOpen}
            >
              Medical devices <ChevronDown size={16} className={`transition-transform ${isDevicesOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDevicesOpen && (
              <div className="reveal-up absolute left-0 top-[calc(100%-1px)] z-[80] w-[min(820px,calc(100vw-2rem))] overflow-hidden rounded-b-2xl border border-slate-200 bg-white shadow-2xl" role="menu">
                <div className="grid max-h-[68vh] grid-cols-3 gap-1 overflow-y-auto p-4">
                  {visibleCategories.map((category) => (
                    <Link
                      key={category.slug || category.name}
                      to={`/products?category=${encodeURIComponent(category.slug || category.name)}`}
                      onClick={() => setIsDevicesOpen(false)}
                      className="flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-medical-light hover:text-medical-dark"
                      role="menuitem"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-medical-light text-medical-primary">{category.icon}</span>
                      <span>{category.name}</span>
                    </Link>
                  ))}
                </div>
                <Link to="/products" onClick={() => setIsDevicesOpen(false)} className="flex min-h-12 items-center justify-center border-t border-slate-200 bg-slate-50 text-sm font-black text-medical-dark hover:bg-medical-light">
                  View the complete catalogue
                </Link>
              </div>
            )}
          </div>
          <Link to="/products?category=Oxygen%20Concentrator" className="hover:text-medical-primary">Respiratory care</Link>
          <Link to="/guides/oxygen-concentrator-rental-guide" className="inline-flex items-center gap-1 text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/80 hover:bg-teal-100 hover:text-teal-950 font-bold transition text-xs">
            Oxygen Rentals &amp; Guide
          </Link>
          <Link to="/products?category=Patient%20Monitor" className="hover:text-medical-primary">Diagnostics</Link>
          <Link to="/products?category=Hospital%20Furniture" className="hover:text-medical-primary">Mobility & furniture</Link>
          <Link to="/bulk-orders" className="hover:text-medical-primary">Hospital orders</Link>
          <div className="ml-auto flex items-center gap-7">
            <Link to="/about" className="hover:text-medical-primary">About</Link>
            <Link to="/contact" className="hover:text-medical-primary">Support</Link>
          </div>
        </div>
      </nav>

      {createPortal((
        <div className={`fixed inset-0 z-[100] lg:hidden ${isMenuOpen ? 'visible' : 'invisible'}`} aria-hidden={!isMenuOpen}>
        <button
          type="button"
          className={`absolute inset-0 h-full w-full bg-slate-950/55 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeMenu}
          aria-label="Close navigation menu"
          tabIndex={isMenuOpen ? 0 : -1}
        />
        <aside
          className={`safe-bottom absolute bottom-0 left-0 top-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <BrandMark compact />
            <button type="button" onClick={closeMenu} className="tap-target inline-flex items-center justify-center rounded-xl hover:bg-slate-100" aria-label="Close menu">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-4 grid grid-cols-2 gap-2">
              <Link to="/products" onClick={closeMenu} className="flex min-h-12 items-center gap-2 rounded-xl bg-medical-dark px-3 text-sm font-bold text-white">
                <Hospital size={18} /> All products
              </Link>
              <Link to="/bulk-orders" onClick={closeMenu} className="flex min-h-12 items-center gap-2 rounded-xl border border-medical-primary px-3 text-sm font-bold text-medical-dark">
                <Hospital size={18} /> Hospital orders
              </Link>
            </div>

            <div className="mb-4">
              <Link
                to="/guides/oxygen-concentrator-rental-guide"
                onClick={closeMenu}
                className="flex min-h-12 items-center justify-between rounded-xl bg-teal-50 border border-teal-200 px-3 text-sm font-bold text-teal-900 shadow-sm"
              >
                <span>Oxygen Therapy &amp; Rentals</span>
                <span className="rounded bg-teal-700 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">US Delivery</span>
              </Link>
            </div>

            <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Shop by category</p>
            <div className="space-y-1">
              {visibleCategories.slice(0, 12).map((category) => (
                <Link
                  key={category.slug || category.name}
                  to={`/products?category=${encodeURIComponent(category.slug || category.name)}`}
                  onClick={closeMenu}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-medical-light hover:text-medical-dark"
                >
                  <span className="text-medical-primary">{category.icon}</span>
                  {category.name}
                </Link>
              ))}
            </div>

            <div className="my-4 border-t border-slate-200" />
            <Link to="/about" onClick={closeMenu} className="flex min-h-12 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">About Baemeds</Link>
            <Link to="/contact" onClick={closeMenu} className="flex min-h-12 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">Contact support</Link>
          </div>

          <div className="border-t border-slate-200 p-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-medical-dark font-bold text-white">
                  {customer?.firstName?.charAt(0) || 'A'}
                </span>
                <Link to="/account" onClick={closeMenu} className="min-w-0 flex-1 text-sm font-bold text-slate-800">My account</Link>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await logout();
                      closeMenu();
                    } catch {
                      // The account page exposes the actionable sign-out error.
                    }
                  }}
                  className="min-h-11 rounded-lg px-3 text-sm font-bold text-medical-alert hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={closeMenu} className="flex min-h-12 items-center justify-center rounded-xl bg-medical-primary text-sm font-bold text-white hover:bg-medical-dark">
                Sign in or create account
              </Link>
            )}
          </div>
        </aside>
        </div>
      ), document.body)}
    </header>
  );
};

export default Header;
