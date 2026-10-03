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
  Download,
  Upload,
  FileSpreadsheet,
  DollarSign,
  Layers,
  Boxes,
  RefreshCw,
  X,
  FileText,
  Check,
  Copy,
  Sparkles,
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

  // Bulk Operations State
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkPriceMode, setBulkPriceMode] = useState<'percent_inc' | 'percent_dec' | 'fixed_inc' | 'fixed_dec' | 'set_price'>('percent_inc');
  const [bulkPriceValue, setBulkPriceValue] = useState<number>(10);

  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false);
  const [bulkStockInStock, setBulkStockInStock] = useState<boolean>(true);
  const [bulkStockQuantity, setBulkStockQuantity] = useState<number>(25);

  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState(false);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>(STANDARD_DME_CATEGORIES[0]);

  // CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

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

  // CSV Export utility
  const exportProductsToCsv = (itemsToExport: Product[], filename: string) => {
    const headers = [
      'ID',
      'SKU',
      'Title',
      'Category',
      'Retail Price',
      'Compare At Price',
      'Wholesale Cost',
      'Inventory Quantity',
      'In Stock',
      'Prescription Required',
      'HCPCS Code',
      'McKesson Item Number',
      'Hero Flag',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = itemsToExport.map((p) => [
      escapeCsv(p.id),
      escapeCsv(p.sku || ''),
      escapeCsv(p.title),
      escapeCsv(p.category),
      escapeCsv(Number(p.price || 0).toFixed(2)),
      escapeCsv(p.compareAtPrice ? Number(p.compareAtPrice).toFixed(2) : ''),
      escapeCsv(p.wholesaleCost ? Number(p.wholesaleCost).toFixed(2) : ''),
      escapeCsv(p.inventoryQuantity ?? 25),
      escapeCsv(p.inStock !== false ? 'TRUE' : 'FALSE'),
      escapeCsv(p.prescriptionRequired ? 'TRUE' : 'FALSE'),
      escapeCsv(p.hcpcsCode || ''),
      escapeCsv(p.mckessonItemNumber || ''),
      escapeCsv(p.isHeroProduct ? 'TRUE' : 'FALSE'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessMessage(`Successfully exported ${itemsToExport.length} products to ${filename}`);
  };

  const handleExportSelected = () => {
    const selectedItems = products.filter((p) => selectedProductIds.includes(p.id));
    if (!selectedItems.length) return;
    exportProductsToCsv(selectedItems, `baemeds_selected_products_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportAllFiltered = () => {
    exportProductsToCsv(filteredProducts, `baemeds_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const downloadSampleCsv = () => {
    const template = [
      'id,sku,title,category,price,compareAtPrice,inventoryQuantity,inStock,hcpcsCode,mckessonItemNumber,isHeroProduct',
      'prod_sample_1,DME-RES-AIR11,AirSense 11 AutoSet CPAP,CPAP Machines,995.00,1199.00,30,TRUE,E0601,1184920,TRUE',
      'prod_sample_2,DME-DRV-10257,Drive Silver Sport 2 Wheelchair,Wheelchairs,249.99,320.00,15,TRUE,K0001,894102,FALSE',
      'prod_sample_3,DME-INV-5410IVC,Invacare Semi-Electric Hospital Bed,Hospital Furniture,1450.00,1750.00,8,TRUE,E0260,938210,TRUE',
    ].join('\r\n');
    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'baemeds_product_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Bulk Operations Handlers
  const handleApplyBulkPrice = async () => {
    if (!selectedProductIds.length) return;
    setIsProcessingBulk(true);
    setErrorMessage('');
    try {
      const selected = products.filter((p) => selectedProductIds.includes(p.id));
      const updates = selected.map((p) => {
        let newPrice = Number(p.price || 0);
        if (bulkPriceMode === 'percent_inc') {
          newPrice = Math.round(newPrice * (1 + bulkPriceValue / 100) * 100) / 100;
        } else if (bulkPriceMode === 'percent_dec') {
          newPrice = Math.max(0, Math.round(newPrice * (1 - bulkPriceValue / 100) * 100) / 100);
        } else if (bulkPriceMode === 'fixed_inc') {
          newPrice = Math.round((newPrice + bulkPriceValue) * 100) / 100;
        } else if (bulkPriceMode === 'fixed_dec') {
          newPrice = Math.max(0, Math.round((newPrice - bulkPriceValue) * 100) / 100);
        } else if (bulkPriceMode === 'set_price') {
          newPrice = Math.max(0, Number(bulkPriceValue));
        }
        return {
          id: p.id,
          price: newPrice,
        };
      });

      await AdminApiClient.bulkUpdateProducts(updates);
      setSuccessMessage(`Successfully updated retail prices for ${updates.length} products.`);
      setIsBulkPriceModalOpen(false);
      setSelectedProductIds([]);
      loadProducts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply bulk price update.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleApplyBulkStock = async () => {
    if (!selectedProductIds.length) return;
    setIsProcessingBulk(true);
    setErrorMessage('');
    try {
      const updates = selectedProductIds.map((id) => ({
        id,
        inStock: bulkStockInStock,
        inventoryQuantity: Math.max(0, Number(bulkStockQuantity)),
      }));

      await AdminApiClient.bulkUpdateProducts(updates);
      setSuccessMessage(`Stock and inventory updated for ${updates.length} products.`);
      setIsBulkStockModalOpen(false);
      setSelectedProductIds([]);
      loadProducts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update stock.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleApplyBulkCategory = async () => {
    if (!selectedProductIds.length) return;
    setIsProcessingBulk(true);
    setErrorMessage('');
    try {
      const updates = selectedProductIds.map((id) => ({
        id,
        category: bulkCategoryTarget,
      }));

      await AdminApiClient.bulkUpdateProducts(updates);
      setSuccessMessage(`Moved ${updates.length} products to "${bulkCategoryTarget}".`);
      setIsBulkCategoryModalOpen(false);
      setSelectedProductIds([]);
      loadProducts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update categories.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleToggleBulkHero = async (enable: boolean) => {
    if (!selectedProductIds.length) return;
    setIsProcessingBulk(true);
    setErrorMessage('');
    try {
      const updates = selectedProductIds.map((id) => ({
        id,
        isHeroProduct: enable,
      }));

      await AdminApiClient.bulkUpdateProducts(updates);
      setSuccessMessage(
        enable
          ? `Added ${updates.length} products to Top 100 Flagship Heroes (Google/Meta feeds synced).`
          : `Removed ${updates.length} products from Flagship Heroes.`
      );
      setSelectedProductIds([]);
      loadProducts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update hero status.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProductIds.length) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${selectedProductIds.length} selected products? This action cannot be undone.`
      )
    ) {
      return;
    }
    setIsProcessingBulk(true);
    setErrorMessage('');
    try {
      await AdminApiClient.bulkDeleteProducts(selectedProductIds);
      setSuccessMessage(`Successfully deleted ${selectedProductIds.length} products.`);
      setSelectedProductIds([]);
      loadProducts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete selected products.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // CSV File Upload Handler
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setImportError('CSV file must have a header row and at least 1 data row.');
          return;
        }

        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const rows: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseLine(lines[i]);
          const row: any = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });

          // Match by id or sku
          const id = row.id || row.productid;
          const sku = row.sku;
          const price = row.price || row.retailprice;
          const qty = row.inventoryquantity || row.qty || row.inventory;
          const inStock = row.instock;
          const category = row.category;
          const hero = row.isheroproduct || row.hero;

          if (id || sku) {
            rows.push({
              id,
              sku,
              title: row.title || row.name || 'Unnamed item',
              price: price !== undefined && price !== '' ? Number(price) : undefined,
              inventoryQuantity: qty !== undefined && qty !== '' ? Number(qty) : undefined,
              inStock: inStock !== undefined && inStock !== '' ? inStock.toLowerCase() === 'true' || inStock === '1' : undefined,
              category: category || undefined,
              isHeroProduct: hero !== undefined && hero !== '' ? hero.toLowerCase() === 'true' || hero === '1' : undefined,
            });
          }
        }

        if (rows.length === 0) {
          setImportError('No valid rows containing "id" or "sku" columns found in CSV.');
          return;
        }

        setImportRows(rows);
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importRows.length) return;
    setIsImporting(true);
    setImportError('');
    try {
      // Find matching product IDs for any row specified only by SKU
      const resolvedUpdates: any[] = [];
      for (const row of importRows) {
        let targetId = row.id;
        if (!targetId && row.sku) {
          const match = products.find((p) => p.sku === row.sku);
          if (match) targetId = match.id;
        }
        if (targetId) {
          const updateObj: any = { id: targetId };
          if (row.price !== undefined && !isNaN(row.price)) updateObj.price = row.price;
          if (row.inventoryQuantity !== undefined && !isNaN(row.inventoryQuantity)) {
            updateObj.inventoryQuantity = row.inventoryQuantity;
          }
          if (row.inStock !== undefined) updateObj.inStock = row.inStock;
          if (row.category) updateObj.category = row.category;
          if (row.isHeroProduct !== undefined) updateObj.isHeroProduct = row.isHeroProduct;
          resolvedUpdates.push(updateObj);
        }
      }

      if (resolvedUpdates.length === 0) {
        throw new Error('None of the rows matched existing catalog product IDs or SKUs.');
      }

      await AdminApiClient.bulkUpdateProducts(resolvedUpdates);
      setSuccessMessage(`Successfully updated ${resolvedUpdates.length} products from CSV import.`);
      setIsImportModalOpen(false);
      setImportRows([]);
      setImportFileName('');
      loadProducts();
    } catch (err: any) {
      setImportError(err.message || 'Failed to process product import.');
    } finally {
      setIsImporting(false);
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
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleExportAllFiltered}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-soft hover:bg-slate-50 transition"
            title="Download CSV of all currently filtered products"
          >
            <Download size={15} /> Export Catalog CSV
          </button>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-50 px-3.5 py-2.5 text-xs font-bold text-teal-800 shadow-soft hover:bg-teal-100 transition"
            title="Bulk update products or prices via CSV file"
          >
            <Upload size={15} /> Import Products CSV
          </button>
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-3 text-xs text-white shadow-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-medical-primary text-[11px] font-black text-white">
                {selectedProductIds.length}
              </span>
              <span className="font-bold tracking-tight">Products Selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Bulk Price Adjust */}
              <button
                type="button"
                onClick={() => setIsBulkPriceModalOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 font-bold hover:bg-amber-500/30 transition shadow-xs"
              >
                <DollarSign size={13} />
                Bulk Price
              </button>

              {/* Bulk Stock Status */}
              <button
                type="button"
                onClick={() => setIsBulkStockModalOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 px-3 py-1.5 font-bold hover:bg-teal-500/30 transition shadow-xs"
              >
                <Boxes size={13} />
                Set Stock
              </button>

              {/* Bulk Category */}
              <button
                type="button"
                onClick={() => setIsBulkCategoryModalOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 px-3 py-1.5 font-bold hover:bg-sky-500/30 transition shadow-xs"
              >
                <Layers size={13} />
                Set Category
              </button>

              {/* Hero Toggle */}
              <button
                type="button"
                onClick={() => handleToggleBulkHero(true)}
                title="Mark selected as Top 100 Flagship Heroes (Google/Meta Sync)"
                className="flex items-center gap-1 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2.5 py-1.5 font-bold hover:bg-yellow-500/30 transition"
              >
                <Star size={12} className="fill-current" />
                Make Hero
              </button>
              <button
                type="button"
                onClick={() => handleToggleBulkHero(false)}
                title="Revert selected to Standard DME"
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                Standard
              </button>

              {/* Export Selected CSV */}
              <button
                type="button"
                onClick={handleExportSelected}
                className="flex items-center gap-1 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 font-bold hover:bg-emerald-600/40 transition shadow-xs"
              >
                <Download size={13} />
                Export CSV
              </button>

              {/* Delete Selected */}
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-1 rounded-lg bg-rose-600/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 font-bold hover:bg-rose-600/40 transition shadow-xs"
              >
                <Trash2 size={13} />
                Delete
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                title="Clear selection"
              >
                <X size={13} />
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
      {/* MODAL 1: Bulk Price Adjustment */}
      {isBulkPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Bulk Price Adjustment</h3>
                  <p className="text-[11px] text-slate-500">
                    Update pricing across {selectedProductIds.length} selected products simultaneously
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkPriceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Type</label>
                <select
                  value={bulkPriceMode}
                  onChange={(e) => setBulkPriceMode(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-semibold focus:border-medical-primary focus:outline-none"
                >
                  <option value="percent_inc">Percentage Increase (+%)</option>
                  <option value="percent_dec">Percentage Discount (-%)</option>
                  <option value="fixed_inc">Fixed Dollar Increase (+$)</option>
                  <option value="fixed_dec">Fixed Dollar Discount (-$)</option>
                  <option value="set_price">Set Exact Price ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {bulkPriceMode.startsWith('percent') ? 'Percentage Value (%)' : 'Dollar Value ($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bulkPriceValue}
                  onChange={(e) => setBulkPriceValue(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-bold focus:border-medical-primary focus:outline-none"
                />
              </div>

              {/* Live Preview of Price Calculation on up to 3 selected items */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Sample Price Preview
                </span>
                <div className="divide-y divide-slate-200">
                  {products
                    .filter((p) => selectedProductIds.includes(p.id))
                    .slice(0, 3)
                    .map((item) => {
                      const cur = Number(item.price || 0);
                      let nxt = cur;
                      if (bulkPriceMode === 'percent_inc') nxt = Math.round(cur * (1 + bulkPriceValue / 100) * 100) / 100;
                      else if (bulkPriceMode === 'percent_dec') nxt = Math.max(0, Math.round(cur * (1 - bulkPriceValue / 100) * 100) / 100);
                      else if (bulkPriceMode === 'fixed_inc') nxt = Math.round((cur + bulkPriceValue) * 100) / 100;
                      else if (bulkPriceMode === 'fixed_dec') nxt = Math.max(0, Math.round((cur - bulkPriceValue) * 100) / 100);
                      else if (bulkPriceMode === 'set_price') nxt = Math.max(0, bulkPriceValue);

                      return (
                        <div key={item.id} className="py-1.5 flex items-center justify-between text-xs">
                          <span className="truncate max-w-[240px] text-slate-700 font-medium">{item.title}</span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-slate-400 line-through">${cur.toFixed(2)}</span>
                            <span className="text-slate-400">→</span>
                            <span className="font-bold text-emerald-700">${nxt.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkPriceModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={handleApplyBulkPrice}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition disabled:opacity-50"
              >
                {isProcessingBulk ? <RefreshCw size={13} className="animate-spin" /> : <DollarSign size={13} />}
                Apply to {selectedProductIds.length} Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Stock & Inventory */}
      {isBulkStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                  <Boxes size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Bulk Stock & Inventory</h3>
                  <p className="text-[11px] text-slate-500">
                    Set inventory status for {selectedProductIds.length} items
                  </p>
                </div>
              </div>
              <button onClick={() => setIsBulkStockModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Availability Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkStockInStock(true)}
                    className={`rounded-xl border p-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                      bulkStockInStock
                        ? 'border-teal-500 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle size={15} className={bulkStockInStock ? 'text-teal-600' : 'text-slate-400'} />
                    In Stock (Available)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkStockInStock(false)}
                    className={`rounded-xl border p-3 text-xs font-bold transition flex items-center justify-center gap-2 ${
                      !bulkStockInStock
                        ? 'border-rose-500 bg-rose-50 text-rose-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <AlertCircle size={15} className={!bulkStockInStock ? 'text-rose-600' : 'text-slate-400'} />
                    Out of Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Set Inventory Quantity (Units)
                </label>
                <input
                  type="number"
                  min="0"
                  value={bulkStockQuantity}
                  onChange={(e) => setBulkStockQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-bold focus:border-medical-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkStockModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={handleApplyBulkStock}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition disabled:opacity-50"
              >
                {isProcessingBulk ? <RefreshCw size={13} className="animate-spin" /> : <Boxes size={13} />}
                Update {selectedProductIds.length} Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Bulk Category Assignment */}
      {isBulkCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Set Category</h3>
                  <p className="text-[11px] text-slate-500">
                    Re-categorize {selectedProductIds.length} selected items
                  </p>
                </div>
              </div>
              <button onClick={() => setIsBulkCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target DME Category</label>
              <select
                value={bulkCategoryTarget}
                onChange={(e) => setBulkCategoryTarget(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-semibold focus:border-medical-primary focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkCategoryModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingBulk}
                onClick={handleApplyBulkCategory}
                className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 transition disabled:opacity-50"
              >
                {isProcessingBulk ? <RefreshCw size={13} className="animate-spin" /> : <Layers size={13} />}
                Move {selectedProductIds.length} Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CSV Import */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Import & Update Products via CSV</h3>
                  <p className="text-[11px] text-slate-500">
                    Bulk update prices, inventory quantities, and stock availability from spreadsheet
                  </p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Template Download & Instructions */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="text-xs text-slate-600">
                <p className="font-bold text-slate-800">Supported Columns:</p>
                <p className="text-[11px] text-slate-500">
                  <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">id</code> or{' '}
                  <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">sku</code> (required for matching),{' '}
                  <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">price</code>,{' '}
                  <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">inventoryQuantity</code>,{' '}
                  <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">inStock</code>,{' '}
                  <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">category</code>,{' '}
                  <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">isHeroProduct</code>
                </p>
              </div>
              <button
                type="button"
                onClick={downloadSampleCsv}
                className="inline-flex items-center gap-1.5 shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                <Download size={13} /> Download Template
              </button>
            </div>

            {/* File Upload Drop Zone */}
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-teal-500 transition bg-slate-50/50">
              <input
                type="file"
                id="csvFileInput"
                accept=".csv"
                onChange={handleCsvFileUpload}
                className="hidden"
              />
              <label
                htmlFor="csvFileInput"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <FileSpreadsheet size={32} className="text-teal-600" />
                <span className="text-xs font-bold text-slate-800">
                  {importFileName ? importFileName : 'Click to select CSV file from your computer'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Accepts standard comma-separated .csv UTF-8 files
                </span>
              </label>
            </div>

            {importError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {importError}
              </div>
            )}

            {/* Preview Parsed Rows */}
            {importRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    Parsed Rows ({importRows.length} ready to apply)
                  </span>
                  <span className="text-slate-400 text-[11px]">Showing first 5 rows preview</span>
                </div>
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-2">ID / SKU</th>
                        <th className="p-2">Title</th>
                        <th className="p-2">Price</th>
                        <th className="p-2">Inventory</th>
                        <th className="p-2">In Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {importRows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 text-slate-900 font-bold">{r.id || r.sku}</td>
                          <td className="p-2 font-sans truncate max-w-[150px]">{r.title}</td>
                          <td className="p-2 text-emerald-700">{r.price !== undefined ? `$${r.price}` : '—'}</td>
                          <td className="p-2">{r.inventoryQuantity !== undefined ? r.inventoryQuantity : '—'}</td>
                          <td className="p-2">{r.inStock !== undefined ? (r.inStock ? 'TRUE' : 'FALSE') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportRows([]);
                  setImportFileName('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importRows.length || isImporting}
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition disabled:opacity-50 shadow-xs"
              >
                {isImporting ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                Apply Updates ({importRows.length} Items)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
