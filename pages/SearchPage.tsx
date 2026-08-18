import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpDown, MessageCircle, Phone, Search, SearchX } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import SEO from '../components/SEO';
import { CONTACT_PHONE } from '../constants';
import { Link, useNavigate, useSearchParams } from '../context/CartContext';
import { fetchAllProducts, searchProducts } from '../lib/shopify';
import { Product } from '../types';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc';

const searchableText = (product: Product) => [
  product.title,
  product.handle,
  product.vendor,
  product.category,
  product.tags?.join(' '),
  product.description,
  product.specs,
].filter(Boolean).join(' ').toLowerCase();

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(query));
  const [loadError, setLoadError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => setSearchInput(query), [query]);

  useEffect(() => {
    let cancelled = false;

    const performSearch = async () => {
      if (!query) {
        setProducts([]);
        setLoadError('');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError('');
      try {
        let results = await searchProducts(query);

        // Shopify search syntax can miss short catalogue words. A local indexed
        // fallback keeps one-word title, vendor, tag and category searches useful.
        if (!results.length) {
          const allProducts = await fetchAllProducts();
          const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
          results = allProducts.filter((product) => terms.every((term) => searchableText(product).includes(term)));
        }

        if (!cancelled) setProducts(results);
      } catch (error) {
        console.error('Search failed', error);
        if (!cancelled) {
          setProducts([]);
          setLoadError('Search is temporarily unavailable.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    performSearch();
    return () => { cancelled = true; };
  }, [query, reloadKey]);

  const sortedProducts = useMemo(() => {
    const result = [...products];
    if (sortBy === 'price-asc') return result.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return result.sort((a, b) => b.price - a.price);
    if (sortBy === 'name-asc') return result.sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [products, sortBy]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    if (nextQuery) navigate(`/search?q=${encodeURIComponent(nextQuery)}`);
  };

  const phoneHref = `tel:${CONTACT_PHONE.replace(/[^+\d]/g, '')}`;
  const whatsappHref = `https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello Baemeds, I am looking for ${query || 'medical equipment'}.`)}`;

  return (
    <main className="min-h-screen bg-medical-light pb-16 pt-6 sm:pt-9">
      <SEO title={query ? `Search results for ${query}` : 'Search medical equipment'} description="Search the Baemeds medical equipment catalogue by product, model, category or brand." />
      <div className="container mx-auto px-4">
        <header className="rounded-3xl bg-medical-dark p-5 text-white shadow-soft sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Catalogue search</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Search by product, model, brand or category.</h1>
          <form onSubmit={submitSearch} role="search" className="mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search the product catalogue</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-medical-text" size={20} />
              <input autoFocus={!query} type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Try oxygen, CPAP, wheelchairâ€¦" className="min-h-12 w-full rounded-xl border border-white/20 bg-white py-3 pl-12 pr-4 text-base text-medical-dark outline-none placeholder:text-medical-text focus:ring-2 focus:ring-teal-300" />
            </label>
            <button type="submit" disabled={!searchInput.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 font-bold text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50">Search catalogue<ArrowRight size={18} /></button>
          </form>
        </header>

        {!query ? (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 text-center sm:p-12">
            <Search size={44} className="mx-auto text-medical-primary" />
            <h2 className="mt-4 text-xl font-bold text-medical-dark">What equipment do you need?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-medical-text">Search by product, model, brand, or category.</p>
            <Link to="/products" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-medical-primary px-5 font-bold text-medical-primary hover:bg-medical-light">Browse all products</Link>
          </section>
        ) : isLoading ? (
          <section className="mt-6">
            <p className="mb-4 text-sm font-semibold text-medical-text" aria-live="polite">Searching for â€œ{query}â€â€¦</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
              {Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)}
            </div>
          </section>
        ) : loadError ? (
          <section className="mt-6 rounded-3xl border border-medical-alert bg-white shadow-soft p-7 text-center sm:p-12">
            <SearchX size={44} className="mx-auto text-medical-alert" />
            <h2 className="mt-4 text-xl font-bold text-medical-dark">Search could not be completed</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-medical-text">{loadError} Retry or contact the team for a current quotation.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="min-h-11 rounded-xl bg-medical-primary px-5 font-bold text-white">Retry search</button>
              <a href={phoneHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold text-medical-dark"><Phone size={17} />Call us</a>
            </div>
          </section>
        ) : sortedProducts.length ? (
          <section className="mt-6" aria-labelledby="search-results-heading">
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="px-1">
                <h2 id="search-results-heading" className="font-bold text-medical-dark">Results for â€œ{query}â€</h2>
                <p className="text-sm text-medical-text">{sortedProducts.length} product{sortedProducts.length === 1 ? '' : 's'} found</p>
              </div>
              <label className="flex min-h-11 items-center gap-2 rounded-xl bg-medical-light px-3 text-sm font-semibold text-slate-700">
                <ArrowUpDown size={17} aria-hidden="true" /><span>Sort</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="min-h-11 flex-1 bg-transparent font-bold outline-none sm:min-w-48" aria-label="Sort search results">
                  <option value="relevance">Relevance</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 text-center sm:p-12">
            <SearchX size={44} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-xl font-bold text-medical-dark">No catalogue match for â€œ{query}â€</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-medical-text">Check the spelling, try a broader product word, or send the team the model name or a photo.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/products" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-medical-primary px-5 font-bold text-white">Browse all products</Link>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 font-bold text-medical-dark"><MessageCircle size={17} />Ask on WhatsApp</a>
              <Link to="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-bold text-medical-dark">Contact us</Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default SearchPage;
