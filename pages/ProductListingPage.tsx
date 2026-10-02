import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Phone,
  SearchX,
  SlidersHorizontal,
  X,
  CheckCircle2,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SEO from '../components/SEO';
import { Link, useSearchParams } from '../context/CartContext';
import { APP_NAME, CATEGORIES, CONTACT_PHONE } from '../constants';
import {
  resolveCategoryName,
  fetchStorefrontProducts,
  getCatalogCategoryCounts,
  getCatalogBrandCounts,
} from '../lib/commerce';
import { Product } from '../types';

type SortOption = 'availability' | 'price-asc' | 'price-desc' | 'name-asc';

// Storefront chunking: 50 products per page
const ITEMS_PER_PAGE = 50;

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Oxygen Concentrators": "Hospital-grade stationary 5L & 10L oxygen concentrators and lightweight portable travel POC units with pre-shipment calibration, manufacturer warranties, and insured US carrier delivery.",
  "CPAP Machines": "Advanced auto-adjusting CPAP systems engineered for quiet, compliant obstructive sleep apnea management with heated humidification and companion accessories.",
  "BiPAP Machines": "High-performance bi-level positive airway pressure units for non-invasive respiratory ventilation, COPD support, and complex sleep therapy.",
  "Wheelchairs": "Lightweight transport chairs, standard folding wheelchairs, and heavy-duty bariatric mobility systems with certified weight capacities.",
  "Patient Monitors": "Multiparameter clinical telemetry monitors, vital signs diagnostic stations, and OLED fingertip pulse oximeters.",
  "Nebulizers": "Heavy-duty piston compressor nebulizers and portable ultrasonic mesh inhalers for effective aerosol respiratory therapy.",
  "Blood Pressure Monitors": "Clinical digital upper arm blood pressure monitors and professional aneroid sphygmomanometer kits with calibrated cuffs.",
  "Glucometers": "Fast, accurate blood glucose meters, multi-test memory systems, and comprehensive diabetic monitoring kits.",
  "Suction Machines": "High-vacuum clinical suction units, surgical aspirators, and emergency phlegm clearance machines for hospital and home care.",
  "Breast Pumps": "Hospital-grade electric breast pumps, closed-system double pumping kits, and maternity lactation accessories.",
  "Incontinence & Care": "Premium absorbent briefs, protective underwear, and clinical disposable underpads for comprehensive patient hygiene.",
  "Hospital Furniture": "Durable clinical beds, overbed tables, exam stretchers, and specialized healthcare facility furnishings."
};

const renderPaginationPages = (
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
) => {
  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis-start');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('ellipsis-end');
    if (!pages.includes(totalPages)) pages.push(totalPages);
  }

  return pages.map((item, idx) => {
    if (typeof item === 'string') {
      return (
        <span key={`ellipsis-${idx}`} className="px-1 text-xs font-bold text-slate-400 select-none">
          …
        </span>
      );
    }
    const active = item === currentPage;
    return (
      <button
        key={item}
        type="button"
        onClick={() => onPageChange(item)}
        aria-label={`Go to page ${item}`}
        aria-current={active ? 'page' : undefined}
        className={`h-10 min-w-10 rounded-xl px-2.5 text-xs font-bold transition ${
          active
            ? 'bg-medical-dark text-white shadow-sm'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
        }`}
      >
        {item}
      </button>
    );
  });
};

const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState<number>(3099);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('availability');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // Sync category param from URL
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setCurrentPage(1);
  }, [categoryParam]);

  // Load products in 50-by-50 chunks on demand along with total count
  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const result = await fetchStorefrontProducts({
          page: currentPage,
          pageSize: ITEMS_PER_PAGE,
          category: selectedCategory,
          brands: selectedBrands,
          search: searchParam,
          minPrice: priceRange.min !== '' ? Number(priceRange.min) : undefined,
          maxPrice: priceRange.max !== '' ? Number(priceRange.max) : undefined,
          showOutOfStock,
          sortBy,
        });

        if (!cancelled) {
          setProducts(result.products);
          setTotalCount(result.total);
        }
      } catch (error) {
        console.error('Unable to load storefront products', error);
        if (!cancelled) {
          setProducts([]);
          setLoadError('The catalogue could not be loaded right now.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    selectedCategory,
    selectedBrands,
    priceRange.min,
    priceRange.max,
    showOutOfStock,
    sortBy,
    searchParam,
    reloadKey,
  ]);

  // Mobile filters drawer keyboard trap
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

  // Reset page when filtering or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBrands, priceRange.min, priceRange.max, showOutOfStock, sortBy, searchParam]);

  // Authoritative category counts across the full catalog
  const catalogCategoryCounts = useMemo(() => getCatalogCategoryCounts(), []);
  const allBrandCounts = useMemo(() => getCatalogBrandCounts(), []);

  const categoryOptions = useMemo(() => CATEGORIES.map((category) => {
    const value = category.slug || category.name;
    const canonical = resolveCategoryName(value);
    const count = catalogCategoryCounts[canonical] || catalogCategoryCounts[value] || 0;
    return {
      label: category.name,
      value,
      count,
    };
  }).filter((category) => category.count > 0), [catalogCategoryCounts]);

  const brandOptions = useMemo(() => allBrandCounts, [allBrandCounts]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 220, behavior: 'smooth' });
  };

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

  const currentCategoryDesc = selectedCategory
    ? CATEGORY_DESCRIPTIONS[resolveCategoryName(selectedCategory)] || CATEGORY_DESCRIPTIONS[selectedCategory] || "Browse certified medical equipment and clinical supplies."
    : "Browse our comprehensive 50-state certified medical equipment catalogue with official manufacturer warranties, FSA/HSA acceptance, and fast carrier shipping.";

  const filters = (
    <div className="space-y-7">
      <section aria-labelledby="category-filter-heading">
        <h2 id="category-filter-heading" className="mb-3 text-sm font-bold text-medical-dark">Categories</h2>
        {categoryOptions.length ? (
          <div className="space-y-1">
            {categoryOptions.map((category) => {
              const isChecked = selectedCategory === category.value || resolveCategoryName(selectedCategory) === resolveCategoryName(category.value);
              return (
                <label key={category.value} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-medical-light">
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => updateCategory(category.value)}
                      className="h-5 w-5 rounded border-slate-300 accent-medical-primary"
                    />
                    <span className={isChecked ? 'font-bold text-medical-dark' : 'text-medical-text'}>{category.label}</span>
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-medical-text">{category.count.toLocaleString()}</span>
                </label>
              );
            })}
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
                <span className="text-xs font-semibold text-medical-text">{count.toLocaleString()}</span>
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
        title={selectedCategory ? `${selectedCategory} | ${APP_NAME} USA` : (searchParam ? `Search: ${searchParam} | ${APP_NAME}` : 'Medical Equipment Catalog | BaeMeds')}
        description={currentCategoryDesc}
      />
      <div className="container mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-medical-primary">Home</Link>
          <span>/</span>
          <Link to="/products" className={!selectedCategory ? "text-medical-dark font-bold" : "hover:text-medical-primary"}>Equipment</Link>
          {selectedCategory && (
            <>
              <span>/</span>
              <span className="text-medical-dark font-bold">{selectedCategory}</span>
            </>
          )}
        </nav>

        {/* Page Header */}
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 border border-teal-200">
              <CheckCircle2 size={13} className="text-teal-600" /> 50-State Insured Delivery
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 border border-teal-200">
              FSA / HSA Eligible
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 border border-slate-200 text-slate-700">
              50 Products Per Page
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                {selectedCategory || (searchParam ? `Search: “${searchParam}”` : 'Medical Equipment Catalogue')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                {currentCategoryDesc}
              </p>
              {searchParam && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800">Showing matches for “{searchParam}”</span>
                  <button type="button" onClick={clearSearch} className="rounded-lg px-2 py-1 font-bold text-medical-primary hover:bg-medical-light"><SearchX size={15} className="mr-1 inline" />Clear</button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0 sm:flex-row">
              <a href={phoneHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-medical-primary px-4 text-sm font-bold text-medical-primary hover:bg-medical-light"><Phone size={17} />{CONTACT_PHONE}</a>
              <Link to="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-primary px-4 text-sm font-bold text-white hover:bg-medical-dark">Clinical Questions</Link>
            </div>
          </div>
        </header>

        {/* Toolbar & Filter Bar */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft" aria-label="Catalogue toolbar">
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3">
              <p className="px-1 text-sm font-bold text-slate-800" aria-live="polite">
                {isLoading ? 'Loading products…' : (
                  <>
                    <span>{totalCount.toLocaleString()}</span> products found
                    {totalPages > 1 && (
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        (Page {currentPage} of {totalPages})
                      </span>
                    )}
                  </>
                )}
              </p>
              <button type="button" onClick={() => setIsMobileFiltersOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:border-medical-primary hover:text-medical-primary lg:hidden"><SlidersHorizontal size={18} />Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}</button>
            </div>
            <label className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 text-sm font-semibold text-slate-700">
              <ArrowUpDown size={16} aria-hidden="true" className="text-slate-500" />
              <span>Sort by</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} aria-label="Sort products" className="min-h-11 min-w-0 flex-1 bg-transparent pr-2 font-bold outline-none sm:min-w-48 text-medical-dark">
                <option value="availability">Featured Equipment First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </label>
          </div>

          <div className="border-t border-slate-200 px-3 pt-3">
            <div className="filter-toolbar-scroll flex items-center gap-2 overflow-x-auto pb-3" aria-label="Quick filters">
              <span className="inline-flex min-h-11 shrink-0 items-center gap-2 px-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                <Filter size={15} aria-hidden="true" /> Categories
              </span>
              <button
                type="button"
                onClick={() => selectedCategory && updateCategory(selectedCategory)}
                aria-pressed={!selectedCategory}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-bold transition-colors ${!selectedCategory ? 'border-medical-dark bg-medical-dark text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-medical-primary hover:text-medical-primary'}`}
              >
                All Products
                <span className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${!selectedCategory ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>3,099</span>
              </button>
              {categoryOptions.map((category) => {
                const active = selectedCategory === category.value || resolveCategoryName(selectedCategory) === resolveCategoryName(category.value);
                return (
                  <button
                    type="button"
                    key={category.value}
                    onClick={() => updateCategory(category.value)}
                    aria-pressed={active}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors ${active ? 'border-medical-dark bg-medical-dark text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-medical-primary hover:text-medical-primary'}`}
                  >
                    {category.label}
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{category.count.toLocaleString()}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowOutOfStock((current) => !current)}
                aria-pressed={!showOutOfStock}
                className={`min-h-10 shrink-0 rounded-full border px-3.5 text-xs font-bold transition-colors ${!showOutOfStock ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-300 bg-white text-slate-700 hover:border-medical-primary'}`}
              >
                In Stock Only
              </button>
              {selectedBrands.map((brand) => (
                <button type="button" key={brand} onClick={() => toggleBrand(brand)} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-teal-600 bg-teal-50 px-3 text-xs font-bold text-teal-800">
                  {brand}<X size={14} aria-hidden="true" />
                </button>
              ))}
              {(priceRange.min || priceRange.max) && (
                <button type="button" onClick={() => setPriceRange({ min: '', max: '' })} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-teal-600 bg-teal-50 px-3 text-xs font-bold text-teal-800">
                  Price ${priceRange.min || '0'}–${priceRange.max || '∞'}<X size={14} aria-hidden="true" />
                </button>
              )}
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} className="min-h-10 shrink-0 rounded-full px-3 text-xs font-bold text-rose-600 hover:bg-rose-50">Reset Filters</button>
              )}
            </div>
          </div>
        </section>

        {/* Main Products Grid + Filter Sidebar */}
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
            ) : products.length ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <nav aria-label="Catalog pagination" className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-white px-5 py-4 rounded-2xl shadow-soft sm:flex-row">
                    <p className="text-xs font-semibold text-slate-600">
                      Showing <span className="font-bold text-slate-900">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span>–<span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of <span className="font-bold text-slate-900">{totalCount.toLocaleString()}</span> certified products
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="First page"
                      >
                        &laquo; First
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>

                      {/* Display numbered pages with window */}
                      {renderPaginationPages(currentPage, totalPages, handlePageChange)}

                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Last page"
                      >
                        Last &raquo;
                      </button>
                    </div>
                  </nav>
                )}
              </>
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
                <p className="text-xs text-medical-text">{totalCount.toLocaleString()} results currently found</p>
              </div>
              <button type="button" onClick={() => setIsMobileFiltersOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200" aria-label="Close filters"><X size={21} /></button>
            </div>
            {filters}
            <button type="button" onClick={() => setIsMobileFiltersOpen(false)} className="mt-6 min-h-12 w-full rounded-xl bg-medical-primary px-5 font-bold text-white">Show {totalCount.toLocaleString()} products</button>
          </aside>
        </div>
      )}
    </main>
  );
};

export default ProductListingPage;
