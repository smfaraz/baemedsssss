import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  ArrowUpDown,
  Star,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { Link, useNavigate } from '../../context/CartContext';
import { Product } from '../../types';

const STANDARD_DME_CATEGORIES = [
  'BiPAP Machines',
  'CPAP Machines',
  'Wheelchairs',
  'Blood Pressure Monitors',
  'Glucometers',
  'Nebulizers',
  'Suction Machines',
  'Patient Monitors',
  'Breast Pumps',
  'Incontinence & Care',
  'Oxygen Concentrators',
  'Hospital Furniture',
  'Orthopedic Supports',
];

export const AdminProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [rxFilter, setRxFilter] = useState('all');
  const [heroFilter, setHeroFilter] = useState<'all' | 'heroes_only' | 'standard'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 50-by-50 pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApiClient.getProducts({
        page,
        pageSize,
        query: searchQuery.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        rx: rxFilter !== 'all' ? rxFilter : undefined,
        hero: heroFilter !== 'all' ? heroFilter : undefined,
      });
      setProducts(data.products);
      setTotalProducts(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, pageSize, searchQuery, selectedCategory, rxFilter, heroFilter]);

  const categories = Array.from(new Set([...STANDARD_DME_CATEGORIES, ...products.map((p) => p.category)])).filter(Boolean);
  const heroCount = products.filter((p) => p.isHeroProduct).length;

  const filteredProducts = products;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action will be audited.`)) {
      return;
    }
    try {
      await AdminApiClient.deleteProduct(id);
      setSuccessMessage(`Product "${title}" deleted successfully.`);
      setSelectedProductIds((prev) => prev.filter((i) => i !== id));
      loadProducts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete product. Check role permissions.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative DME catalog management, HCPCS codes, clinical verification, and variant pricing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-slate-800 transition"
          >
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Filters & Search Control Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft space-y-4">
        {/* Top 100 Hero Strategy Quick Filter Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => { setHeroFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                heroFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Products ({totalProducts.toLocaleString()})
            </button>
            <button
              onClick={() => { setHeroFilter('heroes_only'); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                heroFilter === 'heroes_only'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-700 hover:bg-amber-100/60'
              }`}
            >
              <Star size={13} className="fill-current" />
              Top 100 Flagship Heroes
            </button>
            <button
              onClick={() => { setHeroFilter('standard'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                heroFilter === 'standard'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standard DME Catalog
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <TrendingUp size={14} className="text-emerald-600" />
            <span>Top 100 Heroes actively synced to Google Shopping & Meta Ads</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search products by title, SKU, HCPCS code, or McKesson #..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-medical-primary focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-medical-primary focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Rx Requirement Filter */}
            <select
              value={rxFilter}
              onChange={(e) => {
                setRxFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-medical-primary focus:outline-none"
            >
              <option value="all">All Prescription Rules</option>
              <option value="rx">Prescription Required (Rx)</option>
              <option value="otc">Over The Counter (OTC)</option>
            </select>
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedProductIds.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white">
            <span className="font-semibold">{selectedProductIds.length} products selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert(`Bulk export of ${selectedProductIds.length} products initiated.`)}
                className="rounded-lg bg-slate-800 px-3 py-1.5 font-bold hover:bg-slate-700"
              >
                Export CSV
              </button>
              <button
                onClick={() => setSelectedProductIds([])}
                className="rounded-lg border border-slate-700 px-3 py-1.5 font-bold hover:bg-slate-800"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      selectedProductIds.length === filteredProducts.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-medical-primary focus:ring-medical-primary"
                  />
                </th>
                <th className="px-4 py-3.5">Product & Identifiers</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">HCPCS Code</th>
                <th className="px-4 py-3.5">Retail Price</th>
                <th className="px-4 py-3.5">Dealer Price</th>
                <th className="px-4 py-3.5">Wholesale & Margin</th>
                <th className="px-4 py-3.5">Inventory</th>
                <th className="px-4 py-3.5">Rx Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
                      <span>Loading authoritative product catalog from Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package size={32} className="text-slate-300" />
                      <p className="font-semibold text-slate-600">No products match the selected criteria</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your search terms or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const cost = p.wholesaleCost || 0;
                  const price = p.price || 0;
                  const marginPct = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
                  const profitAmt = Math.max(0, price - cost);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-medical-light/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded border-slate-300 text-medical-primary focus:ring-medical-primary"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || 'https://placehold.co/100x100?text=DME'}
                            alt={p.title}
                            className="h-11 w-11 shrink-0 rounded-lg object-contain border border-slate-200 bg-white p-1"
                          />
                          <div className="min-w-0 max-w-sm">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {p.isHeroProduct && (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800 border border-amber-200">
                                  <Star size={10} className="fill-amber-500 text-amber-600" /> TOP 100 HERO
                                </span>
                              )}
                              <Link
                                to={`/admin/products/${p.id}`}
                                className="font-bold text-slate-900 hover:text-medical-primary hover:underline line-clamp-1"
                              >
                                {p.title}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                              <span>SKU: {p.sku || p.id.substring(0, 8).toUpperCase()}</span>
                              {p.mckessonItemNumber && (
                                <a
                                  href={`https://mms.mckesson.com/product/${p.mckessonItemNumber}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 hover:underline inline-flex items-center gap-1 transition"
                                  title="View on MMS McKesson"
                                >
                                  MCK #{p.mckessonItemNumber}
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600">
                        {p.category}
                      </td>
                      <td className="px-4 py-3.5">
                        {p.hcpcsCode ? (
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 border border-blue-200">
                            {p.hcpcsCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5">
                        {p.dealerPrice && p.dealerPrice > 0 ? (
                          <div>
                            <div className="font-mono font-bold text-indigo-800 text-xs">
                              ${p.dealerPrice.toFixed(2)}
                            </div>
                            {p.price > 0 && (
                              <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                {Math.round(((p.price - p.dealerPrice) / p.price) * 100)}% margin
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {cost > 0 ? (
                          <div>
                            <div className="flex items-center gap-1 font-mono font-bold text-slate-700 text-xs">
                              <span>${cost.toFixed(2)} cost</span>
                              <span className="text-emerald-700 font-sans font-bold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                +{marginPct}%
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              +${profitAmt.toFixed(2)} gross profit
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unset</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {p.trackInventory ? (
                          <span
                            className={`inline-flex items-center gap-1.5 font-semibold ${
                              p.inventoryQuantity && p.inventoryQuantity > 10
                                ? 'text-emerald-700'
                                : p.inventoryQuantity && p.inventoryQuantity > 0
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                p.inventoryQuantity && p.inventoryQuantity > 10
                                  ? 'bg-emerald-500'
                                  : p.inventoryQuantity && p.inventoryQuantity > 0
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {p.inventoryQuantity ?? 0} in stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Dropship Only
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {p.prescriptionRequired ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                            <ShieldAlert size={12} /> Rx Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                            OTC
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/products/${p.id}`}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="Edit Product"
                          >
                            <Edit2 size={15} />
                          </Link>
                          <a
                            href={`/products/${p.handle || p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                            title="View on Storefront"
                          >
                            <ExternalLink size={15} />
                          </a>
                          <button
                            onClick={() => handleDelete(p.id, p.title)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer Controls */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Showing <span className="font-bold text-slate-900">{totalProducts === 0 ? 0 : (page - 1) * pageSize + 1}</span>–
              <span className="font-bold text-slate-900">{Math.min(page * pageSize, totalProducts)}</span> of{' '}
              <span className="font-bold text-slate-900">{totalProducts.toLocaleString()}</span> products (Page {page} of {totalPages})
            </span>
            <div className="flex items-center gap-1.5 text-slate-500 pl-2 border-l border-slate-200">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-medical-primary"
              >
                <option value={25}>25</option>
                <option value={50}>50 (Default)</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Page Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || isLoading}
              className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="First Page"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={15} /> Prev
            </button>

            {/* Numeric Page Buttons */}
            <div className="flex items-center gap-1 px-1">
              {getPageNumbers().map((pNum, idx) =>
                pNum === '...' ? (
                  <span key={`dots-${idx}`} className="px-1 text-slate-400">...</span>
                ) : (
                  <button
                    key={`page-${pNum}`}
                    onClick={() => setPage(Number(pNum))}
                    disabled={isLoading}
                    className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition ${
                      page === pNum
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    {pNum}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight size={15} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || isLoading}
              className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Last Page"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
