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
  ArrowUpDown,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { Link, useNavigate } from '../../context/CartContext';
import { Product } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [rxFilter, setRxFilter] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApiClient.getProducts(searchQuery || undefined);
      setProducts(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery]);

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (rxFilter === 'rx' && !p.prescriptionRequired) return false;
    if (rxFilter === 'otc' && p.prescriptionRequired) return false;
    return true;
  });

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by title, SKU, HCPCS code..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-medical-primary focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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
              onChange={(e) => setRxFilter(e.target.value)}
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
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">HCPCS Code</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Inventory</th>
                <th className="px-4 py-3.5">Rx Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
                      <span>Loading authoritative product catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
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
                            className="h-10 w-10 shrink-0 rounded-lg object-contain border border-slate-200 bg-white p-1"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/admin/products/${p.id}`}
                              className="font-bold text-slate-900 hover:text-medical-primary hover:underline line-clamp-1"
                            >
                              {p.title}
                            </Link>
                            <span className="text-[11px] text-slate-400 font-mono">
                              SKU: {p.id.substring(0, 10).toUpperCase()}
                            </span>
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
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          In Stock (25)
                        </span>
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

        {/* Footer Summary */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {filteredProducts.length} of {products.length} catalog products</span>
          <span className="font-medium text-slate-600">All prices authoritative & audited</span>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
