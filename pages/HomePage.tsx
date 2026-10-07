import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  PackageCheck,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SEO from '../components/SEO';
import TrustBadges from '../components/TrustBadges';
import TrustedBrandsMarquee from '../components/TrustedBrandsMarquee';
import { CATEGORIES, CONTACT_PHONE } from '../constants';
import { Link } from '../context/CartContext';
import { getRecentlyViewedProducts } from '../lib/recentlyViewed';
import { fetchAllProducts, resolveCategoryName } from '../lib/commerce';
import { useReveal } from '../lib/useReveal';
import { Product } from '../types';
import { formatPrice } from '../lib/marketConfig';
import { getHighResImageUrl, handleImageFallback } from '../utils/imageOptimizer';

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
              <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-100">BaeMeds Offer Window</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Save on Essential Home &amp; Hospital Equipment</h2>
              <p className="mt-1 text-sm text-rose-100">Inspected, factory-sealed equipment with manufacturer warranties and itemized FSA/HSA invoices.</p>
            </div>
          </div>
          <div className="shrink-0" aria-live="polite">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-100">Special Pricing Ends In</p>
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

const EquipmentPromotion: React.FC = () => (
  <section className="reveal-on-scroll container mx-auto px-4 pb-3 pt-4" aria-labelledby="equipment-promotion-title">
    <div className="relative overflow-hidden rounded-3xl bg-medical-dark text-white shadow-xl">
      <img src="/rental-hero.png" alt="Medical equipment available across the United States" className="absolute inset-0 h-full w-full object-cover object-right" />
      <div className="absolute inset-0 bg-gradient-to-r from-medical-dark via-medical-dark/95 to-medical-dark/20" aria-hidden="true" />
      <div className="relative max-w-xl px-6 py-9 sm:px-9 sm:py-12">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-300">Nationwide US Equipment</p>
        <h2 id="equipment-promotion-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Durable Medical Equipment &amp; Home Care Supplies</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-200 sm:text-base">Certified Oxygen Concentrators, BiPAP &amp; CPAP Systems, Wheelchairs, and ICU Patient Monitors with reliable insured carrier shipping across all 50 US states.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/products?category=Oxygen%20Concentrators" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 font-black text-slate-950 hover:bg-white transition duration-200"><ArrowRight size={18} /> Oxygen Concentrators</Link>
          <Link to="/products" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-5 font-bold text-white hover:bg-white/10 transition duration-200">Browse Full Catalog</Link>
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
        <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-300">Quality Assurance</p>
        <p className="mt-3 text-7xl font-black leading-none tracking-[-0.08em] sm:text-8xl">50</p>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">States Covered Nationwide</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-200">Providing patients, clinics, and care facilities with pre-calibrated, verified medical equipment and dedicated technical support.</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-medical-primary">Clinical Excellence</p><h2 className="mt-1 text-2xl font-black text-medical-dark">Biomedical Inspection &amp; Compliance</h2></div>
          <Link to="/about" className="text-sm font-bold text-medical-primary hover:text-medical-dark">Learn about our standards</Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-bold text-medical-dark">Pre-Shipment Calibration</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">Every oxygen concentrator, ventilator, and telemetry monitor undergoes certified multi-point biomedical functional verification.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-bold text-medical-dark">FSA &amp; HSA Qualified</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">Purchase qualifying medical devices using your pre-tax Flexible Spending Account or Health Savings Account payment cards.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-bold text-medical-dark">Carrier White-Glove Option</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">Insured delivery via FedEx and UPS, with specialized inside placement for heavy durable medical beds and patient lifts.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-bold text-medical-dark">Direct Home Delivery</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">Factory-sealed medical equipment delivered directly to your doorstep across all 50 states.</p>
          </div>
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
      className="category-tile motion-lift group relative min-w-[168px] snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft md:min-w-0"
    >
      <div className="relative h-36 overflow-hidden bg-slate-50">
        {image && !imageFailed ? (
          <img src={image} alt={`${name} medical equipment category`} className="h-full w-full object-contain bg-white p-3 transition duration-500 group-hover:scale-105" loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <span className="flex h-full items-center justify-center text-medical-primary">{icon}</span>
        )}
        <span className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl shadow-sm ${accent}`}>{icon}</span>
      </div>
      <div className="flex min-h-20 flex-col justify-center bg-white px-4 py-3 border-t border-slate-100">
        <span className="text-sm font-black leading-5 text-medical-dark group-hover:text-medical-primary transition">{name}</span>
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
  const [respiratoryProducts, setRespiratoryProducts] = useState<Product[]>([]);
  const [mobilityProducts, setMobilityProducts] = useState<Product[]>([]);
  const [diagnosticProducts, setDiagnosticProducts] = useState<Product[]>([]);
  const [catalogueProducts, setCatalogueProducts] = useState<Product[]>([]);
  const [recentlyViewedProducts] = useState(() => getRecentlyViewedProducts().slice(0, 4));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const allProducts = await fetchAllProducts();
        if (!isMounted) return;
        setCatalogueProducts(allProducts);

        // 1. Popular Products: Flagship verified equipment across categories
        const heroes = allProducts.filter((p) => p.isHeroProduct && p.inStock);
        const bestSellers = heroes.slice(0, 4);
        setPopularProducts(bestSellers.length > 0 ? bestSellers : allProducts.slice(0, 4));

        // 2. Respiratory care shelf: Oxygen Concentrators, CPAP, BiPAP, Nebulizers
        const respiratory = allProducts.filter(
          (p) =>
            p.inStock &&
            (/oxygen|concentrator|cpap|bipap|nebulizer/i.test(p.category) || /concentrator|oxygen|cpap|bipap|nebulizer/i.test(p.title)) &&
            !/tubing|filter|connector|adapter|clip|hose/i.test(p.title) &&
            p.price >= 45
        );
        const respiratoryHeroes = respiratory.filter((p) => p.isHeroProduct);
        setRespiratoryProducts(
          (respiratoryHeroes.length >= 4 ? respiratoryHeroes : respiratory).slice(0, 4)
        );

        // 3. Mobility shelf: Wheelchairs & clinical furnishings
        const mobility = allProducts.filter(
          (p) =>
            p.inStock &&
            /wheelchair|furniture/i.test(p.category) &&
            !/scale|stretcher|commode|anti-tipper|armrest pad/i.test(p.title) &&
            p.price >= 120
        );
        const mobilityHeroes = mobility.filter((p) => p.isHeroProduct);
        setMobilityProducts(
          (mobilityHeroes.length >= 4 ? mobilityHeroes : mobility).slice(0, 4)
        );

        // 4. Clinical diagnostics & monitoring shelf
        const diagnostics = allProducts.filter(
          (p) =>
            p.inStock &&
            (/monitor|glucometer|blood pressure/i.test(p.category) || /monitor|oximeter|sphygmomanometer|glucometer/i.test(p.title)) &&
            !/cuff only|sensor only|cable|strip|lancet|bracket/i.test(p.title) &&
            p.price >= 40
        );
        const diagHeroes = diagnostics.filter((p) => p.isHeroProduct);
        setDiagnosticProducts(
          (diagHeroes.length >= 4 ? diagHeroes : diagnostics).slice(0, 4)
        );
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
      const canonical = resolveCategoryName(category.slug || category.name);
      const matches = catalogueProducts.filter((product) => resolveCategoryName(product.category) === canonical);
      return {
        name: category.name,
        slug: category.slug || category.name,
        icon: category.icon,
        image: category.image || matches.find((product) => product.image)?.image,
        count: matches.length,
      };
    })
    .filter((category) => category.count > 0)
    .slice(0, 12), [catalogueProducts]);

  const revealRef = useReveal<HTMLDivElement>();

  // Showcase flagship products and core medical equipment across diverse categories in the continuous marquee reel
  const heroReel = useMemo(() => {
    if (!catalogueProducts.length) return [];

    const isPrimaryEquipment = (p: Product) => {
      if (!p.inStock || !p.image || p.price < 35 || p.price > 2500) return false;
      const nonMachineryPattern =
        /measuring wheel|filter|tubing|connector|adapter|wrench|bracket|screw|clip|cuff|case|bag|cannula|mask|valve|cleanser|wipes|upholstery|sheet|strip|battery|wheel only|headgear|chamber|unfilled|bottle only|cup only|pad|cord only|holder|tray|stand only|armrest|replacement/i;
      return !nonMachineryPattern.test(p.title);
    };

    const eligible = catalogueProducts.filter(isPrimaryEquipment);

    const categories = [
      'Oxygen Concentrators',
      'Wheelchairs',
      'Breast Pumps',
      'Patient Monitors',
      'Nebulizers',
      'Blood Pressure Monitors',
      'CPAP Machines',
      'BiPAP Machines',
    ];

    const byCat: Record<string, Product[]> = {};
    for (const p of eligible) {
      const cat = p.category || 'Equipment';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(p);
    }

    for (const cat in byCat) {
      byCat[cat].sort((a, b) => {
        if (a.isHeroProduct && !b.isHeroProduct) return -1;
        if (!a.isHeroProduct && b.isHeroProduct) return 1;
        return (b.price || 0) - (a.price || 0);
      });
    }

    const selected: Product[] = [];
    for (let round = 0; round < 3; round++) {
      for (const cat of categories) {
        if (selected.length >= 16) break;
        if (byCat[cat] && byCat[cat][round]) {
          selected.push(byCat[cat][round]);
        }
      }
    }

    if (selected.length >= 8) return selected;
    return catalogueProducts.filter((p) => p.inStock && p.image).slice(0, 16);
  }, [catalogueProducts]);

  return (
    <div ref={revealRef} className="bg-[#f6f3ee]">
      <SEO
        title="Durable Medical Equipment & Supplies | BaeMeds"
        description="Shop certified oxygen concentrators, BiPAP/CPAP systems, patient monitors, wheelchairs, and hospital supplies across the United States with fast nationwide shipping."
      />

      {/* Hero Stage */}
      <section className="hero-stage overflow-hidden bg-[#071d33] text-white">
        <div className="container mx-auto px-4 pt-10 pb-6 text-center sm:pt-14 sm:pb-8">
          <span className="inline-block rounded-full bg-amber-500 px-4 py-1 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-sm">
            HOME CARE, CLINICAL &amp; HOSPITAL EQUIPMENT
          </span>
          <h1 className="mx-auto mt-4 max-w-4xl text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
            Trusted medical equipment, delivered across the US.
          </h1>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/products"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition"
            >
              Shop all equipment <ArrowRight size={17} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Talk to product support
            </Link>
          </div>
        </div>

        {heroReel.length > 0 && (
          <div className="marquee-track relative overflow-hidden pb-10 sm:pb-14" aria-label="Featured equipment">
            <div className="marquee">
              {[...heroReel, ...heroReel].map((product, index) => {
                const eaVariant = product.variants?.find((v) =>
                  /ea|single|unit|each/i.test(v.title || '') ||
                  /ea|single|unit|each/i.test(v.size || '') ||
                  (v.packageQuantity && /1\s*(unit|ea|each)/i.test(v.packageQuantity))
                );
                const displayPrice = eaVariant ? eaVariant.price : product.price;

                return (
                  <Link
                    key={`${product.id}-${index}`}
                    to={`/products/${product.handle}`}
                    className="mx-2 sm:mx-2.5 flex w-44 sm:w-48 md:w-52 shrink-0 flex-col overflow-hidden rounded-2xl bg-white p-3.5 shadow-lg transition duration-200 hover:-translate-y-1"
                  >
                    <div className="flex h-32 sm:h-36 w-full items-center justify-center overflow-hidden">
                      <img
                        src={getHighResImageUrl(product.image)}
                        alt={product.title}
                        loading="lazy"
                        onError={(e) => handleImageFallback(e)}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="mt-2.5">
                      <p className="truncate text-xs font-bold text-slate-900" title={product.title}>
                        {product.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1 text-xs font-bold text-[#14539a]">
                        <span>{formatPrice(displayPrice)}</span>
                        {product.variants && product.variants.length > 1 && (
                          <span className="text-[10px] font-medium text-slate-500">/ Each</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Trusted Medical Brands Marquee */}
      <TrustedBrandsMarquee />

      {/* Category Grid: Browse by Need */}
      <section className="reveal-on-scroll border-b border-slate-200 bg-white py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-medical-dark md:text-3xl">Shop by need</h2>
              <p className="mt-1 text-sm text-slate-600">Browse equipment by category.</p>
            </div>
            <Link to="/products" className="text-sm font-bold text-medical-primary hover:text-medical-dark">
              Complete catalogue
            </Link>
          </div>

          {isLoading ? (
            <div className="-mx-4 flex gap-3 overflow-hidden px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-56 min-w-[168px] animate-pulse rounded-2xl bg-slate-100 md:min-w-0" />)}
            </div>
          ) : availableCategories.length > 0 ? (
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-6">
              {availableCategories.map((category, index) => (
                <CategoryTile key={category.slug} {...category} accent={tileAccents[index % tileAccents.length]} />
              ))}
            </div>
          ) : (
            <div className="surface-card px-5 py-8 text-center">
              <p className="font-black text-medical-dark">No product categories are available right now.</p>
              <Link to="/products" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-medical-primary px-5 font-bold text-white">Browse all products</Link>
            </div>
          )}
        </div>
      </section>

      {/* Shelf 1: Flagship Hospital & Home Care Equipment */}
      <ProductShelf
        title="Essential Hospital &amp; Home Equipment"
        description="Our highest-rated, verified flagship devices trusted by patients and healthcare practitioners."
        products={popularProducts}
        isLoading={isLoading}
        viewAllPath="/products"
      />

      {/* Trust Badges */}
      <TrustBadges />

      {/* Shelf 2: Respiratory Therapy & Oxygen Care */}
      <section className="border-y border-slate-200 bg-white">
        <ProductShelf
          title="Respiratory Therapy &amp; Oxygen Care"
          description="High-flow home oxygen concentrators, portable travel POCs, and clinical compressor nebulizer systems."
          products={respiratoryProducts}
          isLoading={isLoading}
          viewAllPath="/products?category=Oxygen%20Concentrators"
        />
      </section>

      {/* Quality Assurance & Compliance */}
      <LegacyAndReviews />

      {/* Shelf 3: Mobility & Wheelchairs */}
      <ProductShelf
        title="Mobility &amp; Wheelchairs"
        description="Lightweight transport chairs, high-strength dual-axle wheelchairs, and heavy-duty bariatric mobility systems."
        products={mobilityProducts}
        isLoading={isLoading}
        viewAllPath="/products?category=Wheelchairs"
      />

      {/* Shelf 4: Clinical Monitoring & Diagnostics */}
      <section className="border-y border-slate-200 bg-white">
        <ProductShelf
          title="Clinical Monitoring &amp; Diagnostics"
          description="OLED fingertip pulse oximeters, blood pressure monitors, sleep study recorders, and glucose testing kits."
          products={diagnosticProducts}
          isLoading={isLoading}
          viewAllPath="/products?category=Patient%20Monitors"
        />
      </section>

      {/* Equipment Promotion Banner */}
      <EquipmentPromotion />

      {/* Offer Countdown Banner */}
      <OfferCountdownBanner />

      {/* Recently Viewed Shelf */}
      {recentlyViewedProducts.length > 0 && (
        <section className="border-t border-slate-200 bg-white">
          <ProductShelf
            title="Recently Viewed"
            description="Products you recently inspected in this browser."
            products={recentlyViewedProducts}
            isLoading={false}
            viewAllPath="/products"
          />
        </section>
      )}

      {/* FAQ Section */}
      <section className="reveal-on-scroll border-t border-slate-200 bg-slate-50 px-4 py-14">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-medical-primary">Frequently Asked Questions</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Durable Medical Equipment &amp; Ordering FAQs</h2>
            <p className="mt-3 text-base text-slate-600">Everything you need to know about purchasing home medical equipment from BaeMeds.</p>
          </div>

          <div className="space-y-4">
            <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm [&_summary::-webkit-details-marker]:hidden" open>
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900 font-bold text-lg">
                <h3>How does medical equipment ordering and DME fulfillment work in the United States?</h3>
                <span className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-900 transition duration-300 group-open:-rotate-180">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-slate-600">
                BaeMeds supplies factory-sealed, hospital-grade 5L and 10L oxygen concentrators, portable concentrators (POCs), BiPAP and CPAP sleep therapy devices, wheelchairs, and diagnostic monitors. Simply order online with secure US checkout or call our toll-free customer desk ({CONTACT_PHONE}). We dispatch pre-calibrated medical equipment directly with full manufacturer warranties and itemized invoices for FSA/HSA and insurance reimbursement.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900 font-bold text-lg">
                <h3>How fast is delivery across the United States?</h3>
                <span className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-900 transition duration-300 group-open:-rotate-180">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-slate-600">
                We provide standard 2–4 business day ground delivery and expedited overnight air delivery across all 50 US states via USPS, UPS, and FedEx. Free standard ground shipping is included on all equipment orders over $99.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900 font-bold text-lg">
                <h3>Are all medical devices brand new with official warranty?</h3>
                <span className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-900 transition duration-300 group-open:-rotate-180">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-slate-600">
                Yes. Every piece of equipment sold on BaeMeds is 100% brand new, factory-sealed, and backed by a 1 to 5-year official manufacturer warranty. All devices meet FDA compliance standards and include brand new accessories, filters, and clinical manuals.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900 font-bold text-lg">
                <h3>Is BaeMeds an authorized medical equipment distributor?</h3>
                <span className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-900 transition duration-300 group-open:-rotate-180">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-slate-600">
                Yes, BaeMeds supplies leading global and US medical manufacturers including Drive DeVilbiss, Inogen, ResMed, Philips Respironics, and McKesson. All products include full manufacturer warranties, itemized invoices with HCPCS coding, and dedicated technical support.
              </p>
            </details>

            <details className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900 font-bold text-lg">
                <h3>Can I use my FSA or HSA card for purchases?</h3>
                <span className="shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-900 transition duration-300 group-open:-rotate-180">
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-slate-600">
                Yes. Qualifying durable medical equipment and respiratory care devices can be purchased using your flexible spending account (FSA) or health savings account (HSA) card. Every order includes an itemized invoice that can be submitted for insurance reimbursement.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Institutional / Bulk Orders */}
      <section className="reveal-on-scroll bg-medical-dark px-4 py-12 text-white">
        <div className="container mx-auto flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15"><Building2 size={25} /></span>
            <div>
              <h2 className="text-2xl font-black">Buying for a hospital, clinic, or institution?</h2>
              <p className="mt-1 text-sm text-white/85">Send a requirement list for institutional pricing, bulk availability, and formal quotation.</p>
            </div>
          </div>
          <Link to="/bulk-orders" className="flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-teal-400 px-6 font-black text-slate-950 hover:bg-white transition duration-200 md:w-auto">
            Request Institutional Quotation
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
