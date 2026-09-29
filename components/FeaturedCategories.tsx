import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { Link } from '../context/CartContext';
import { fetchAllProducts } from '../lib/commerce';
import { Product } from '../types';

const categoryKey = (value: string) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

const categoryHasProducts = (product: Product, category: string) =>
  categoryKey(product.category) === categoryKey(category);

const FeaturedCategories: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAllProducts()
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const availableCategories = useMemo(() => CATEGORIES.filter((category) =>
    products.some((product) => categoryHasProducts(product, category.slug || category.name)),
  ), [products]);

  return (
    <section className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">Shop by type</p>
          <h2 className="mt-2 text-3xl font-bold text-medical-text">Browse available categories</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Pick a category to narrow the product list.</p>
        </div>
        <Link to="/products" className="inline-flex min-h-11 items-center gap-2 font-bold text-medical-primary hover:text-medical-dark">
          View all products <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Loading available categories">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} aria-hidden="true" className="h-36 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : availableCategories.length > 0 ? (
        <div className="stagger-grid mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {availableCategories.map((category) => (
            <Link
              key={category.slug || category.name}
              to={`/products?category=${encodeURIComponent(category.slug || category.name)}`}
              className="group flex min-h-36 flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-medical-primary hover:shadow-lg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-medical-light text-medical-primary">{category.icon}</span>
              <span className="text-sm font-bold leading-5 text-slate-800 group-hover:text-medical-dark">{category.name}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="font-bold text-medical-text">No product categories are available right now.</p>
          <Link to="/contact" className="mt-3 inline-flex min-h-11 items-center font-bold text-medical-primary hover:text-medical-dark">Ask us to find a product</Link>
        </div>
      )}
    </section>
  );
};

export default FeaturedCategories;
