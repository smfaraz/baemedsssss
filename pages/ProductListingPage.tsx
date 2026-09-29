import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Filter,
  MessageCircle,
  Phone,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SEO from '../components/SEO';
import { Link, useSearchParams } from '../context/CartContext';
import { APP_NAME, CATEGORIES, CONTACT_PHONE } from '../constants';
import { fetchAllProducts, searchProducts } from '../lib/commerce';
import { Product } from '../types';

type SortOption = 'availability' | 'price-asc' | 'price-desc' | 'name-asc';

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const categoryMatches = (product: Product, category: string) => {
  const productCategory = normalise(product.category || '');
  const target = normalise(category);
  if (!productCategory || !target) return false;
  return productCategory === target || productCategory.includes(target) || target.includes(productCategory);
};

const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('availability');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => setSelectedCategory(categoryParam), [categoryParam]);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const results = searchParam
          ? await searchProducts(searchParam.trim())
          : await fetchAllProducts();
        if (!cancelled) setProducts(results);
      } catch (error) {
        console.error('Unable to load products', error);
        if (!cancelled) {
          setProducts([]);
          setLoadError('The catalogue could not be loaded right now.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProducts();
    return () => { cancelled = true; };
  }, [searchParam, reloadKey]);

  useEffect(() => {
    if (!isMobileFiltersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileFiltersOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileFiltersOpen]);

  const categoryOptions = useMemo(() => CATEGORIES.map((category) => {
    const value = category.slug || category.name;
    return {
      label: category.name,
      value,
      count: products.filter((product) => categoryMatches(product, value)).length,
    };
  }).filter((category) => category.count > 0), [products]);

  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      if (product.vendor) counts.set(product.vendor, (counts.get(product.vendor) || 0) + 1);
    });
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const minPrice = priceRange.min === '' ? 0 : Number(priceRange.min);
    const maxPrice = priceRange.max === '' ? Number.POSITIVE_INFINITY : Number(priceRange.max);
    const validMin = Number.isFinite(minPrice) ? minPrice : 0;
    const validMax = Number.isFinite(maxPrice) ? maxPrice : Number.POSITIVE_INFINITY;

    const result = products.filter((product) => {
      if (selectedCategory && !categoryMatches(product, selectedCategory)) return false;
      if (selectedBrands.length && !selectedBrands.includes(product.vendor)) return false;
      if (!showOutOfStock && !product.inStock) return false;
      return product.price >= validMin && product.price <= validMax;
    });

    return result.sort((a, b) => {
      if (sortBy === 'availability') {
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        const aHero = a.tags?.includes('Flagship Hero') ? 1 : 0;
        const bHero = b.tags?.includes('Flagship Hero') ? 1 : 0;
        if (aHero !== bHero) return bHero - aHero;

        // Prioritize actual core equipment over small replacement parts & accessories
        const aIsPart = /filter|tubing|connector|adapter|wrench|bracket|screw|clip|cuff/i.test(a.title) && a.price < 40;
        const bIsPart = /filter|tubing|connector|adapter|wrench|bracket|screw|clip|cuff/i.test(b.title) && b.price < 40;
        if (aIsPart !== bIsPart) return aIsPart ? 1 : -1;
      }
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [priceRange, products, selectedBrands, selectedCategory, showOutOfStock, sortBy]);

  const activeFilterCount = (selectedCategory ? 1 : 0)
    + selectedBrands.length
    + (priceRange.min || priceRange.max ? 1 : 0)
    + (!showOutOfStock ? 1 : 0);

  const updateCategory = (category: string) => {
    const nextCategory = selectedCategory === category ? '' : category;
    setSelectedCategory(nextCategory);
    const nextParams = new URLSearchParams(searchParams);
    if (nextCategory) nextParams.set('category', nextCategory);
    else nextParams.delete('category');
    setSearchParams(nextParams);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((current) => current.includes(brand)
      ? current.filter((item) => item !== brand)
      : [...current, brand]);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrands([]);
    setPriceRange({ min: '', max: '' });
    setShowOutOfStock(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('category');
    setSearchParams(nextParams);
  };

  const clearSearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    nextParams.delete('q');
    setSearchParams(nextParams);
  };

  const phoneHref = `tel:${CONTACT_PHONE.replace(/[^+\d]/g, '')}`;

  const filters = (
    <div className="space-y-7">
      <section aria-labelledby="category-filter-heading">
        <h2 id="category-filter-heading" className="mb-3 text-sm font-bold text-medical-dark">Available categories</h2>
        {categoryOptions.length ? (
          <div className="space-y-1">
            {categoryOptions.map((category) => (
              <label key={category.value} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-medical-light">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCategory === category.value}
                    onChange={() => updateCategory(category.value)}
                    className="h-5 w-5 rounded border-slate-300 accent-medical-primary"
                  />
                  <span className={selectedCategory === category.value ? 'font-bold text-medical-dark' : 'text-medical-text'}>{category.label}</span>
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-medical-text">{category.count}</span>
              </label>
            ))}
          </div>
        ) : <p className="text-sm text-medical-text">No product categories are available.</p>}
      </section>

      {brandOptions.length > 0 && (
        <section aria-labelledby="brand-filter-heading">
          <h2 id="brand-filter-heading" className="mb-3 text-sm font-bold text-medical-dark">Brand</h2>
          <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
            {brandOptions.map(([brand, count]) => (
              <label key={brand} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm hover:bg-medical-light">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="h-5 w-5 rounded border-slate-300 accent-medical-primary"
                  />
                  <span className="text-medical-text">{brand}</span>
                </span>
                <span className="text-xs font-semibold text-medical-text">{count}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="price-filter-heading">
        <h2 id="price-filter-heading" className="mb-3 text-sm font-bold text-medical-dark">Price range</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-medical-text">
            Minimum
            <input type="number" min="0" inputMode="numeric" value={priceRange.min} onChange={(event) => setPriceRange((current) => ({ ...current, min: event.target.value }))} placeholder="$0" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-medical-primary" />
          </label>
          <label className="text-xs font-semibold text-medical-text">
            Maximum
            <input type="number" min="0" inputMode="numeric" value={priceRange.max} onChange={(event) => setPriceRange((current) => ({ ...current, max: event.target.value }))} placeholder="No limit" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-medical-primary" />
          </label>
        </div>
      </section>

      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
        <span className="font-semibold text-medical-text">Include out-of-stock products</span>
        <input type="checkbox" checked={showOutOfStock} onChange={(event) => setShowOutOfStock(event.target.checked)} className="h-5 w-5 accent-medical-primary" />
      </label>

      {activeFilterCount > 0 && (
        <button type="button" onClick={clearFilters} className="min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm font-bold text-medical-text hover:bg-medical-light">Clear all filters</button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-medical-light pb-16 pt-6 sm:pt-9">
      <SEO
        title={selectedCategory || (searchParam ? `Search: ${searchParam}` : 'Medical equipment')}
        description={`Browse ${APP_NAME} medical equipment by category, brand, price, and availability.`}
      />
      <div className="container mx-auto px-4">
        <header className="mb-6 rounded-3xl border border-medical-light bg-white p-5 shadow-soft sm:p-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-medical-primary">Clinical equipment catalogue</p>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">Medical equipment catalogue</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-medical-text sm:text-base">Filter by category, brand, price, or availability.</p>
              {searchParam && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-medical-light px-3 py-2 font-semibold text-teal-900">Results for “{searchParam}”</span>
                  <button type="button" onClick={clearSearch} className="min-h-11 rounded-xl px-3 font-bold text-medical-primary hover:bg-medical-light"><SearchX size={17} className="mr-2 inline" />Clear search</button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a href={phoneHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-medical-primary px-4 text-sm font-bold text-medical-primary hover:bg-medical-light"><Phone size={17} />Call Toll-Free</a>
              <Link to="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-primary px-4 text-sm font-bold text-white hover:bg-medical-dark">Contact Support</Link>
            </div>
          </div>
        </header>

        <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft" aria-label="Catalogue toolbar">
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3">
              <p className="px-1 text-sm font-semibold text-medical-text" aria-live="polite">{isLoading ? 'Loading catalogue…' : `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`}</p>
              <button type="button" onClick={() => setIsMobileFiltersOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:border-medical-primary hover:text-medical-primary lg:hidden"><SlidersHorizontal size={18} />Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</button>
            </div>
            <label className="flex min-h-11 items-center gap-2 rounded-xl bg-medical-light px-3 text-sm font-semibold text-medical-text">
              <ArrowUpDown size={17} aria-hidden="true" />
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} aria-label="Sort products" className="min-h-11 min-w-0 flex-1 bg-transparent pr-2 font-bold outline-none sm:min-w-48">
                <option value="availability">Availability</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </label>
          </div>

          <div className="border-t border-slate-200 px-3 pt-3">
            <div className="filter-toolbar-scroll flex items-center gap-2 overflow-x-auto pb-3" aria-label="Quick filters">
              <span className="inline-flex min-h-11 shrink-0 items-center gap-2 px-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <Filter size={16} aria-hidden="true" /> Quick filters
              </span>
              <button
                type="button"
                onClick={() => selectedCategory && updateCategory(selectedCategory)}
                aria-pressed={!selectedCategory}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors ${!selectedCategory ? 'border-medical-dark bg-medical-dark text-white' : 'border-slate-300 bg-white text-medical-text hover:border-medical-primary hover:text-medical-primary'}`}
              >
                All categories
              </button>
              {categoryOptions.map((category) => {
                const active = selectedCategory === category.value;
                return (
                  <button
                    type="button"
                    key={category.value}
                    onClick={() => updateCategory(category.value)}
                    aria-pressed={active}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${active ? 'border-medical-dark bg-medical-dark text-white' : 'border-slate-300 bg-white text-medical-text hover:border-medical-primary hover:text-medical-primary'}`}
                  >
                    {category.label}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>{category.count}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowOutOfStock((current) => !current)}
                aria-pressed={!showOutOfStock}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-bold transition-colors ${!showOutOfStock ? 'border-medical-primary bg-medical-light text-medical-primary' : 'border-slate-300 bg-white text-medical-text hover:border-medical-primary hover:text-medical-primary'}`}
              >
                In stock only
              </button>
              {selectedBrands.map((brand) => (
                <button type="button" key={brand} onClick={() => toggleBrand(brand)} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-medical-primary bg-medical-light px-4 text-sm font-bold text-medical-primary">
                  {brand}<X size={15} aria-hidden="true" />
                </button>
              ))}
              {(priceRange.min || priceRange.max) && (
                <button type="button" onClick={() => setPriceRange({ min: '', max: '' })} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-medical-primary bg-medical-light px-4 text-sm font-bold text-medical-primary">
                  Price {priceRange.min || '0'}â€“{priceRange.max || 'âˆž'}<X size={15} aria-hidden="true" />
                </button>
              )}
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} className="min-h-11 shrink-0 rounded-full px-3 text-sm font-bold text-medical-primary hover:bg-medical-light">Reset filters</button>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden max-h-[calc(100vh-9rem)] self-start overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-soft lg:sticky lg:top-32 lg:block">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="flex items-center gap-2 font-bold text-medical-dark"><Filter size={18} />Filters</span>
              {activeFilterCount > 0 && <span className="rounded-full bg-medical-light px-2 py-1 text-xs font-bold text-medical-primary">{activeFilterCount} active</span>}
            </div>
            {filters}
          </aside>

          <section aria-label="Products">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading products">
                {Array.from({ length: 6 }).map((_, index) => <ProductCardSkeleton key={index} />)}
              </div>
            ) : loadError ? (
              <div className="rounded-3xl border border-rose-200 bg-white p-7 text-center sm:p-12">
                <SearchX size={44} className="mx-auto text-rose-400" />
                <h2 className="mt-4 text-xl font-bold text-medical-dark">Catalogue temporarily unavailable</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-medical-text">{loadError} Retry, or contact the team for current availability and a quotation.</p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="min-h-11 rounded-xl bg-medical-primary px-5 font-bold text-white">Retry catalogue</button>
                  <Link to="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-slate-800">Contact us</Link>
                </div>
              </div>
            ) : filteredProducts.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-7 text-center sm:p-12">
                <SearchX size={44} className="mx-auto text-medical-text" />
                <h2 className="mt-4 text-xl font-bold text-medical-dark">No products match these filters</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-medical-text">Clear the filters to see the full catalogue, or ask the team to locate a specific model.</p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <button type="button" onClick={clearFilters} className="min-h-11 rounded-xl bg-medical-primary px-5 font-bold text-white">Clear filters</button>
                  <a href={phoneHref} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-slate-800"><Phone size={17} className="mr-2 inline" />Call Toll-Free</a>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-heading">
          <button type="button" className="absolute inset-0 bg-slate-950/50" onClick={() => setIsMobileFiltersOpen(false)} aria-label="Close filters" />
          <aside className="absolute inset-y-0 right-0 w-[min(92vw,390px)] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="sticky top-0 z-10 mb-5 flex items-center justify-between border-b border-slate-200 bg-white pb-4">
              <div>
                <h2 id="mobile-filter-heading" className="text-lg font-bold text-slate-950">Filter products</h2>
                <p className="text-xs text-medical-text">{filteredProducts.length} results currently shown</p>
              </div>
              <button type="button" onClick={() => setIsMobileFiltersOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" aria-label="Close filters"><X size={21} /></button>
            </div>
            {filters}
            <button type="button" onClick={() => setIsMobileFiltersOpen(false)} className="mt-6 min-h-12 w-full rounded-xl bg-medical-primary px-5 font-bold text-white">Show {filteredProducts.length} products</button>
          </aside>
        </div>
      )}
    </main>
  );
};

export default ProductListingPage;
