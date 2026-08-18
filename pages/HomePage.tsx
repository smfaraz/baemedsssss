import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Clock3,
  PackageCheck,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SEO from '../components/SEO';
import TrustBadges from '../components/TrustBadges';
import { APP_NAME, CATEGORIES } from '../constants';
import { Link } from '../context/CartContext';
import { getRecentlyViewedProducts } from '../lib/recentlyViewed';
import { fetchAllProducts, fetchProductsByCategory } from '../lib/shopify';
import { useReveal } from '../lib/useReveal';
import { Product } from '../types';

const categoryKey = (value: string) => value
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]/g, '');

const tileAccents = [
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
];

const OfferCountdownBanner: React.FC = () => {
  const [remaining, setRemaining] = useState(() => 42 * 24 * 60 * 60);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => (value > 0 ? value - 1 : 42 * 24 * 60 * 60)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const unit = (value: number) => String(value).padStart(2, '0');

  return (
    <section className="reveal-on-scroll container mx-auto px-4 pb-2 pt-2" aria-label="Limited time offer">
      <div className="overflow-hidden rounded-2xl border border-rose-300 bg-rose-600 text-white shadow-lg">
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><Clock3 size={23} /></span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-100">Baemeds offer window</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Save on essential equipment</h2>
              <p className="mt-1 text-sm text-rose-100">Offer pricing is item-specific and availability is confirmed before fulfilment.</p>
            </div>
          </div>
          <div className="shrink-0" aria-live="polite">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-100">Offer ends in</p>
            <div className="flex items-center gap-1.5 font-mono text-lg font-black sm:text-xl">
              <span className="rounded-lg bg-white px-2 py-1 text-rose-700">{days}d</span>
              <span>:</span><span className="rounded-lg bg-white px-2 py-1 text-rose-700">{unit(hours)}</span>
              <span>:</span><span className="rounded-lg bg-white px-2 py-1 text-rose-700">{unit(minutes)}</span>
              <span>:</span><span className="rounded-lg bg-white px-2 py-1 text-rose-700">{unit(seconds)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const RentalPromotion: React.FC = () => (
  <section className="reveal-on-scroll container mx-auto px-4 pb-3 pt-4" aria-labelledby="rental-promotion-title">
    <div className="relative overflow-hidden rounded-3xl bg-medical-dark text-white shadow-xl">
      <img src="/rental-hero.png" alt="Medical equipment available for rental" className="absolute inset-0 h-full w-full object-cover object-right" />
      <div className="absolute inset-0 bg-gradient-to-r from-medical-dark via-medical-dark/95 to-medical-dark/20" aria-hidden="true" />
      <div className="relative max-w-xl px-6 py-9 sm:px-9 sm:py-12">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-medical-accent">Flexible home care</p>
        <h2 id="rental-promotion-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Rent the equipment you need.</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-200 sm:text-base">Explore medical equipment for short-term recovery, home care, and changing needs. Ask our team about availability, duration, delivery, and rental terms.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/products" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-accent px-5 font-black text-medical-dark hover:bg-white"><ArrowRight size={18} /> Browse rental catalogue</Link>
          <Link to="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-5 font-bold text-white hover:bg-white/10">Enquire with our team</Link>
        </div>
      </div>
    </div>
  </section>
);

const LegacyAndReviews: React.FC = () => (
  <section className="border-y border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10 md:py-14">
    <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
      <div className="relative overflow-hidden rounded-3xl border border-medical-dark bg-medical-dark p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full border-[22px] border-white/15" aria-hidden="true" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-medical-accent">A legacy of care</p>
        <p className="mt-3 text-7xl font-black leading-none tracking-[-0.08em] sm:text-8xl">30</p>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">years of offline presence</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-200">Serving Hyderabad with practical product guidance, dependable equipment and human support since 1996.</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-medical-primary">Local proof</p><h2 className="mt-1 text-2xl font-black text-medical-dark">Google reviews &amp; store location</h2></div>
          <a href="https://www.google.com/maps/search/?api=1&query=Mohsin%20Surgicals%20Hyderabad" target="_blank" rel="noreferrer" className="text-sm font-bold text-medical-primary hover:text-medical-dark">Open in Google Maps</a>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <iframe title="Mohsin Surgicals on Google Maps" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.429303296483!2d78.4703847!3d17.3911734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb977cbb9a78dd%3A0x6e52bedb3efa8042!2sMohsin%20Surgicals%20-%20Surgical%20Shop%20In%20Hyderabad!5e0!3m2!1sen!2sin!4v1784574350220!5m2!1sen!2sin" className="h-64 w-full border-0 sm:h-72" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        </div>
      </div>
    </div>
  </section>
);

interface CategoryTileProps {
  name: string;
  slug: string;
  image?: string;
  icon: React.ReactNode;
  count: number;
  accent: string;
}

const CategoryTile: React.FC<CategoryTileProps> = ({ name, slug, image, icon, count, accent }) => {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Link
      to={`/products?category=${encodeURIComponent(slug)}`}
      className="category-tile motion-lift group relative min-w-[168px] snap-start overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-soft md:min-w-0"
    >
      <div className="relative h-36 overflow-hidden bg-medical-light">
        {image && !imageFailed ? (
          <img src={image} alt="" className="h-full w-full object-contain bg-white p-2 transition duration-500 group-hover:scale-105" loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <span className="flex h-full items-center justify-center text-medical-primary">{icon}</span>
        )}
        <span className={`absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ${accent}`}>{icon}</span>
      </div>
      <div className="flex min-h-20 flex-col justify-center bg-white px-4 py-3">
        <span className="text-sm font-black leading-5 text-medical-dark">{name}</span>
        <span className="mt-1 text-xs font-semibold text-slate-500">{count} {count === 1 ? 'product' : 'products'}</span>
      </div>
    </Link>
  );
};

interface ProductShelfProps {
  title: string;
  description: string;
  products: Product[];
  isLoading: boolean;
  viewAllPath: string;
}

const ProductShelf: React.FC<ProductShelfProps> = ({
  title,
  description,
  products,
  isLoading,
  viewAllPath,
}) => (
  <section className="container mx-auto px-4 py-10 md:py-14">
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-medical-text md:text-3xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 md:text-base">{description}</p>
      </div>
      <Link to={viewAllPath} className="hidden shrink-0 items-center gap-1 text-sm font-bold text-medical-primary hover:text-medical-dark sm:flex">
        View all <ArrowRight size={17} />
      </Link>
    </div>

    {isLoading ? (
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="min-w-[82vw] max-w-sm snap-start sm:min-w-0 sm:max-w-none"><ProductCardSkeleton /></div>)}
      </div>
    ) : products.length > 0 ? (
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((product) => <div key={product.id} className="reveal-up min-w-[82vw] max-w-sm snap-start sm:min-w-0 sm:max-w-none"><ProductCard product={product} /></div>)}
      </div>
    ) : (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center shadow-soft">
        <PackageCheck className="mx-auto text-medical-primary" size={30} />
        <p className="mt-3 font-bold text-slate-800">This product feed is temporarily unavailable.</p>
        <p className="mt-1 text-sm text-slate-600">Open the complete catalogue or contact the product team for availability.</p>
        <Link to={viewAllPath} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-medical-dark px-5 text-sm font-bold text-white hover:bg-medical-primary">
          Browse catalogue
        </Link>
      </div>
    )}

    <Link to={viewAllPath} className="mt-5 flex min-h-11 items-center justify-center gap-1 rounded-xl border border-medical-primary text-sm font-bold text-medical-dark sm:hidden">
      View all <ArrowRight size={17} />
    </Link>
  </section>
);

const HomePage: React.FC = () => {
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [respiratoryProducts, setRespiratoryProducts] = useState<Product[]>([]);
  const [catalogueProducts, setCatalogueProducts] = useState<Product[]>([]);
  const [recentlyViewedProducts] = useState(() => getRecentlyViewedProducts().slice(0, 4));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const [allProducts, oxygenProducts, bipapProducts] = await Promise.all([
          fetchAllProducts(),
          fetchProductsByCategory('Oxygen Concentrator'),
          fetchProductsByCategory('BiPAP'),
        ]);

        if (!isMounted) return;
        setCatalogueProducts(allProducts);
        const inStockProducts = allProducts.filter((product) => product.inStock);
        const respiratoryMap = new Map<string, Product>();
        [...oxygenProducts, ...bipapProducts]
          .filter((product) => product.inStock)
          .forEach((product) => respiratoryMap.set(product.id, product));

        setPopularProducts(inStockProducts.slice(0, 4));
        setNewArrivals(inStockProducts.slice(4, 8));
        setRespiratoryProducts(Array.from(respiratoryMap.values()).slice(0, 4));
      } catch (error) {
        console.error('Failed to load homepage products:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);


  const availableCategories = useMemo(() => CATEGORIES
    .filter((category) => category.name !== 'ECG Machines')
    .map((category) => {
      const requestedCategory = categoryKey(category.slug || category.name);
      const matches = catalogueProducts.filter((product) => categoryKey(product.category) === requestedCategory);
      return {
        name: category.name,
        slug: category.slug || category.name,
        icon: category.icon,
        image: matches.find((product) => product.image)?.image || category.image,
        count: matches.length,
      };
    })
    .filter((category) => category.count > 0)
    .slice(0, 12), [catalogueProducts]);

  const revealRef = useReveal<HTMLDivElement>();

  // Shuffled in-stock products for the continuously scrolling hero reel.
  const heroReel = useMemo(() => {
    const inStock = catalogueProducts.filter((product) => product.inStock && product.image);
    const shuffled = [...inStock];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 12);
  }, [catalogueProducts]);

  return (
    <div ref={revealRef} className="bg-[#f6f3ee]">
      <SEO
        title="Medical equipment for home and hospitals"
        description="Shop oxygen concentrators, BiPAP and CPAP machines, patient monitors, mobility aids, and hospital equipment from Baemeds."
      />

      <section className="hero-stage overflow-hidden bg-medical-dark text-white">
        <div className="container mx-auto px-4 py-9 text-center md:py-12">
          <p className="chip-accent inline-flex rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.14em]">
            Home care, clinical &amp; hospital equipment
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-2xl font-black leading-tight tracking-tight sm:text-3xl">
            Trusted medical equipment, delivered across India.
          </h1>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/products" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-bold text-medical-dark hover:bg-medical-accent">
              Shop all equipment <ArrowRight size={19} />
            </Link>
            <Link to="/contact" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/45 px-6 font-bold text-white hover:bg-white/10">
              Talk to product support
            </Link>
          </div>
        </div>

        {heroReel.length > 0 && (
          <div className="marquee-track relative overflow-hidden pb-10 md:pb-12" aria-label="Featured products">
            <div className="marquee">
              {[...heroReel, ...heroReel].map((product, index) => (
                <Link
                  key={`${product.id}-${index}`}
                  to={`/products/${product.handle}`}
                  className="mx-2 flex w-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-white/15 bg-white shadow-xl sm:w-48"
                >
                  <div className="h-28 bg-white p-3 sm:h-32">
                    <img src={product.image} alt="" loading="lazy" className="h-full w-full object-contain" />
                  </div>
                  <div className="border-t border-slate-100 px-3 py-2.5">
                    <p className="line-clamp-1 text-xs font-black text-medical-dark">{product.title}</p>
                    <p className="mt-0.5 text-xs font-black text-medical-primary">₹{product.price.toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="reveal-on-scroll border-b border-slate-200 bg-white py-9 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-medical-text md:text-3xl">Shop by need</h2>
              <p className="mt-1 text-sm text-slate-600">Browse equipment by category.</p>
            </div>
            <Link to="/products" className="hidden text-sm font-bold text-medical-primary hover:text-medical-dark sm:block">Complete catalogue</Link>
          </div>

          {isLoading ? (
            <div className="-mx-4 flex gap-3 overflow-hidden px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0 lg:grid-cols-5">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 min-w-[168px] animate-pulse rounded-2xl bg-slate-100 md:min-w-0" />)}
            </div>
          ) : availableCategories.length > 0 ? (
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:flex lg:flex-wrap lg:justify-center">
              {availableCategories.map((category, index) => <CategoryTile key={category.slug} {...category} accent={tileAccents[index % tileAccents.length]} />)}
            </div>
          ) : (
            <div className="surface-card px-5 py-8 text-center">
              <p className="font-black text-medical-dark">No product categories are available right now.</p>
              <Link to="/products" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-medical-primary px-5 font-bold text-white">Browse all products</Link>
            </div>
          )}
        </div>
      </section>

      <TrustBadges />

      <LegacyAndReviews />

      <RentalPromotion />

      <OfferCountdownBanner />

      <ProductShelf
        title="Essential equipment"
        description="Home-care and clinical equipment."
        products={popularProducts}
        isLoading={isLoading}
        viewAllPath="/products"
      />

      <section className="border-y border-slate-200 bg-white">
        <ProductShelf
          title="Respiratory care"
          description="Oxygen concentrators, BiPAP and CPAP equipment with support for selection and setup."
          products={respiratoryProducts}
          isLoading={isLoading}
          viewAllPath="/products?category=Oxygen%20Concentrator"
        />
      </section>

      <ProductShelf
        title="Recently added"
        description="New products currently in stock."
        products={newArrivals}
        isLoading={isLoading}
        viewAllPath="/products"
      />

      {recentlyViewedProducts.length > 0 && (
        <section className="border-t border-slate-200 bg-white">
          <ProductShelf
            title="Recently viewed"
            description="Products viewed in this browser."
            products={recentlyViewedProducts}
            isLoading={false}
            viewAllPath="/products"
          />
        </section>
      )}

      <section className="reveal-on-scroll bg-medical-dark px-4 py-12 text-white">
        <div className="container mx-auto flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15"><Building2 size={25} /></span>
            <div>
              <h2 className="text-2xl font-black">Buying for a hospital, clinic, or institution?</h2>
              <p className="mt-1 text-sm text-white/85">Send a requirement list for availability, product matching, and a quotation.</p>
            </div>
          </div>
          <Link to="/bulk-orders" className="flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-white px-6 font-bold text-medical-dark hover:bg-medical-accent md:w-auto">
            Request a quotation
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
