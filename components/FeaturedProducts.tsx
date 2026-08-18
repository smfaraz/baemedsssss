import React from 'react';
import { ArrowRight, PackageSearch } from 'lucide-react';
import { Link } from '../context/CartContext';
import { Product } from '../types';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

interface FeaturedProductsProps {
  products: Product[];
  isLoading: boolean;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, isLoading }) => {
  const visibleProducts = products.slice(0, 4);

  return (
    <section className="border-y border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-medical-primary">From the catalogue</p>
            <h2 className="mt-2 text-3xl font-bold text-medical-text sm:text-4xl">Medical equipment to explore</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Open a product to review its available details, price, and ordering options.</p>
          </div>
          <Link to="/products" className="inline-flex min-h-11 shrink-0 items-center gap-2 font-bold text-medical-primary hover:text-medical-dark">
            View all products <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading products">
            {Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        ) : visibleProducts.length > 0 ? (
          <div className="stagger-grid mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center sm:p-10">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-medical-light text-medical-primary">
              <PackageSearch size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-xl font-bold text-medical-text">Products are not available in this section yet</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Search the catalogue again or contact the team with the product name or specification you need.</p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/search" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-medical-primary px-5 py-3 font-bold text-white hover:bg-medical-dark">Search products</Link>
              <Link to="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-bold text-medical-text hover:border-medical-primary">Contact support</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
