import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  DollarSign,
  TrendingUp,
  Percent,
  Download,
  Eye,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  Truck,
  Package,
  Layers,
  Sparkles,
  Building2,
  Sliders,
  Check,
  X,
  RefreshCw,
  BarChart3,
  Rocket,
  Info,
  ChevronRight,
  Calculator,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { Link } from '../context/CartContext';
import { APP_NAME } from '../constants';
import { RESEARCHED_PRODUCTS, ResearchedProduct } from '../data/productResearchData';

export const ProductResearchPage: React.FC = () => {
  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedManufacturer, setSelectedManufacturer] = useState('ALL');
  const [selectedMarginTier, setSelectedMarginTier] = useState('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState('ALL');
  const [rxFilter, setRxFilter] = useState<'ALL' | 'RX' | 'NO_RX'>('ALL');
  const [sortBy, setSortBy] = useState<
    'PROFIT_HIGH' | 'MARGIN_HIGH' | 'COST_LOW' | 'PRICE_HIGH' | 'PRICE_LOW' | 'SAVINGS_HIGH'
  >('PROFIT_HIGH');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');
  const [selectedProduct, setSelectedProduct] = useState<ResearchedProduct | null>(null);

  // Bulk Calculator in Modal
  const [calcQuantity, setCalcQuantity] = useState<number>(5);

  // Profit Simulator Drawer / Box State
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);
  const [simMonthlyOrders, setSimMonthlyOrders] = useState<number>(100);
  const [simPriceAdjustment, setSimPriceAdjustment] = useState<number>(0); // -10% to +15%
  const [simSupplierDiscount, setSimSupplierDiscount] = useState<number>(0); // 0% to 10%

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    RESEARCHED_PRODUCTS.forEach((p) => set.add(p.category));
    return ['ALL', ...Array.from(set).sort()];
  }, []);

  // Manufacturers list
  const manufacturers = useMemo(() => {
    const set = new Set<string>();
    RESEARCHED_PRODUCTS.forEach((p) => set.add(p.manufacturer));
    return ['ALL', ...Array.from(set).sort()];
  }, []);

  // High-level Catalog Financial Statistics
  const overallStats = useMemo(() => {
    const total = RESEARCHED_PRODUCTS.length;
    const totalProfit = RESEARCHED_PRODUCTS.reduce((s, p) => s + p.netProfit, 0);
    const totalRevenue = RESEARCHED_PRODUCTS.reduce((s, p) => s + p.retailPrice, 0);
    const totalCost = RESEARCHED_PRODUCTS.reduce((s, p) => s + p.dealerCost, 0);
    const avgMargin = Math.round((totalProfit / (totalRevenue || 1)) * 1000) / 10;
    const avgProfit = Math.round(totalProfit / total);

    const highestProfitItem = [...RESEARCHED_PRODUCTS].sort((a, b) => b.netProfit - a.netProfit)[0];
    const highestMarginItem = [...RESEARCHED_PRODUCTS].sort((a, b) => b.grossMarginPct - a.grossMarginPct)[0];

    return {
      total,
      totalProfit,
      totalRevenue,
      totalCost,
      avgMargin,
      avgProfit,
      highestProfitItem,
      highestMarginItem,
    };
  }, []);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return RESEARCHED_PRODUCTS.filter((p) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.hcpcsCode.toLowerCase().includes(q);

      // Category
      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;

      // Manufacturer
      const matchesMfr = selectedManufacturer === 'ALL' || p.manufacturer === selectedManufacturer;

      // Margin Tier
      let matchesMargin = true;
      if (selectedMarginTier === 'HIGH') matchesMargin = p.grossMarginPct >= 50;
      else if (selectedMarginTier === 'HEALTHY') matchesMargin = p.grossMarginPct >= 35 && p.grossMarginPct < 50;
      else if (selectedMarginTier === 'VOLUME') matchesMargin = p.grossMarginPct < 35;

      // Price Range
      let matchesPrice = true;
      if (selectedPriceRange === 'UNDER_50') matchesPrice = p.retailPrice < 50;
      else if (selectedPriceRange === '50_TO_250') matchesPrice = p.retailPrice >= 50 && p.retailPrice <= 250;
      else if (selectedPriceRange === '250_TO_1000') matchesPrice = p.retailPrice > 250 && p.retailPrice <= 1000;
      else if (selectedPriceRange === 'OVER_1000') matchesPrice = p.retailPrice > 1000;

      // Rx
      let matchesRx = true;
      if (rxFilter === 'RX') matchesRx = p.requiresRx;
      else if (rxFilter === 'NO_RX') matchesRx = !p.requiresRx;

      return matchesSearch && matchesCat && matchesMfr && matchesMargin && matchesPrice && matchesRx;
    }).sort((a, b) => {
      if (sortBy === 'PROFIT_HIGH') return b.netProfit - a.netProfit;
      if (sortBy === 'MARGIN_HIGH') return b.grossMarginPct - a.grossMarginPct;
      if (sortBy === 'COST_LOW') return a.dealerCost - b.dealerCost;
      if (sortBy === 'PRICE_HIGH') return b.retailPrice - a.retailPrice;
      if (sortBy === 'PRICE_LOW') return a.retailPrice - b.retailPrice;
      if (sortBy === 'SAVINGS_HIGH') return b.customerSavings - a.customerSavings;
      return 0;
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedManufacturer,
    selectedMarginTier,
    selectedPriceRange,
    rxFilter,
    sortBy,
  ]);

  // Current Filtered Stats
  const filteredStats = useMemo(() => {
    const count = filteredProducts.length;
    if (count === 0) return { count: 0, avgCost: 0, avgPrice: 0, avgProfit: 0, avgMargin: 0 };
    const totalCost = filteredProducts.reduce((s, p) => s + p.dealerCost, 0);
    const totalPrice = filteredProducts.reduce((s, p) => s + p.retailPrice, 0);
    const totalProfit = filteredProducts.reduce((s, p) => s + p.netProfit, 0);
    return {
      count,
      avgCost: Math.round(totalCost / count),
      avgPrice: Math.round(totalPrice / count),
      avgProfit: Math.round(totalProfit / count),
      avgMargin: Math.round((totalProfit / (totalPrice || 1)) * 1000) / 10,
    };
  }, [filteredProducts]);

  // Projected Simulator Numbers
  const simResults = useMemo(() => {
    const samplePool = filteredProducts.length > 0 ? filteredProducts : RESEARCHED_PRODUCTS;
    const avgBaseCost = samplePool.reduce((s, p) => s + p.dealerCost, 0) / samplePool.length;
    const avgBasePrice = samplePool.reduce((s, p) => s + p.retailPrice, 0) / samplePool.length;

    const adjustedPrice = avgBasePrice * (1 + simPriceAdjustment / 100);
    const adjustedCost = avgBaseCost * (1 - simSupplierDiscount / 100);
    const profitPerOrder = Math.max(0, adjustedPrice - adjustedCost);
    const marginPct = Math.round((profitPerOrder / (adjustedPrice || 1)) * 1000) / 10;

    const monthlyRevenue = adjustedPrice * simMonthlyOrders;
    const monthlyCost = adjustedCost * simMonthlyOrders;
    const monthlyProfit = profitPerOrder * simMonthlyOrders;
    const annualProfit = monthlyProfit * 12;

    return {
      monthlyRevenue,
      monthlyCost,
      monthlyProfit,
      annualProfit,
      marginPct,
      profitPerOrder,
    };
  }, [filteredProducts, simMonthlyOrders, simPriceAdjustment, simSupplierDiscount]);

  // CSV Export
  const handleExportCSV = () => {
    const header = [
      'SKU',
      'Product Title',
      'Category',
      'Manufacturer',
      'Wholesale Cost ($)',
      'Competitor Price ($)',
      'BaeMeds Price ($)',
      'Customer Savings ($)',
      'Net Profit ($)',
      'Gross Margin (%)',
      'Fulfillment Classification',
      'HCPCS Code',
      'Supplier',
    ].join(',');

    const rows = filteredProducts.map((p) =>
      [
        `"${p.sku}"`,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${p.manufacturer}"`,
        p.dealerCost.toFixed(2),
        p.competitorPrice.toFixed(2),
        p.retailPrice.toFixed(2),
        p.customerSavings.toFixed(2),
        p.netProfit.toFixed(2),
        `${p.grossMarginPct}%`,
        p.requiresRx ? 'Yes (Rx)' : 'No (OTC)',
        `"${p.hcpcsCode}"`,
        `"${p.supplier}"`,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `baemeds_products_research_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedManufacturer('ALL');
    setSelectedMarginTier('ALL');
    setSelectedPriceRange('ALL');
    setRxFilter('ALL');
    setSortBy('PROFIT_HIGH');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
      {/* Top Ambient Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-teal-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/20"
            >
              <BarChart3 size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-white">{APP_NAME} USA</span>
                <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-400">
                  PRODUCT RESEARCH & MARGINS
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400">
                A to Z Catalog Intelligence • Buying Costs, Selling Prices & Profit Margins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSimulatorExpanded(!isSimulatorExpanded)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3.5 py-2 text-xs font-bold text-teal-300 shadow-sm hover:bg-teal-500/20 transition"
            >
              <Calculator size={14} />
              <span>Profit Simulator</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white hover:border-slate-700 transition"
            >
              <Download size={14} className="text-teal-400" />
              <span>Export CSV ({filteredProducts.length})</span>
            </button>

            <Link
              to="/roadmap"
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              <Rocket size={14} className="text-teal-400" />
              <span>Launch Roadmap</span>
            </Link>

            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
            >
              <Stethoscope size={14} className="text-teal-400" />
              <span>Admin Panel</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 space-y-8 relative">
        {/* Hero Section & Key Performance Metrics */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-400">
                <Sparkles size={14} />
                <span>COMPLETE A TO Z RESEARCH PLATFORM</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Product Research & Margin Intelligence
              </h1>
              <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
                Every medical machine and accessory researched with exact wholesale supplier costs, street market prices,
                selling prices, customer savings, and net profit per item.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 shrink-0">
              <Building2 size={15} className="text-teal-400" />
              <span>Suppliers: Lake Court Medical • McKesson • Direct Inogen / DeVilbiss</span>
            </div>
          </div>

          {/* 4 Key Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Researched Products</span>
                <Package size={16} className="text-teal-400" />
              </div>
              <p className="text-3xl font-black text-white font-mono">{overallStats.total}</p>
              <p className="text-xs text-slate-400">All 50 US States • Certified DME</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Average Profit Margin</span>
                <Percent size={16} className="text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-400 font-mono">{overallStats.avgMargin}%</p>
              <p className="text-xs text-slate-400">Range: 22% (High-Ticket) to 66% (Accessories)</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Average Profit / Sale</span>
                <DollarSign size={16} className="text-teal-400" />
              </div>
              <p className="text-3xl font-black text-white font-mono">${overallStats.avgProfit}</p>
              <p className="text-xs text-slate-400">Net dollars kept after wholesale cost</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Highest Profit Single Item</span>
                <TrendingUp size={16} className="text-amber-400" />
              </div>
              <p className="text-3xl font-black text-amber-400 font-mono">
                +${Math.round(overallStats.highestProfitItem?.netProfit || 0)}
              </p>
              <p className="text-xs text-slate-400 truncate" title={overallStats.highestProfitItem?.title}>
                {overallStats.highestProfitItem?.title || 'Inogen One G5 Double Battery'}
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Profit Simulator (Expandable) */}
        {isSimulatorExpanded && (
          <section className="rounded-3xl border border-teal-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/20 p-6 sm:p-8 space-y-6 shadow-2xl transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md">
                  <Calculator size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Live Store Profit Simulator</h2>
                  <p className="text-xs text-slate-400">
                    Adjust the sliders below to see your estimated monthly sales, revenue, and take-home profit.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSimMonthlyOrders(100);
                  setSimPriceAdjustment(0);
                  setSimSupplierDiscount(0);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              >
                <RefreshCw size={13} /> Reset Simulator
              </button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Sliders */}
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-300">Estimated Monthly Orders</span>
                    <span className="text-teal-400 font-mono text-sm">{simMonthlyOrders} orders / month</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={simMonthlyOrders}
                    onChange={(e) => setSimMonthlyOrders(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>10 (Starter)</span>
                    <span>250 (Growing)</span>
                    <span>500 (Scale)</span>
                    <span>1,000+ (Established)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-300">Price Adjustment vs Recommended</span>
                    <span className="text-teal-400 font-mono text-sm">
                      {simPriceAdjustment > 0 ? `+${simPriceAdjustment}%` : `${simPriceAdjustment}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-15"
                    max="20"
                    step="1"
                    value={simPriceAdjustment}
                    onChange={(e) => setSimPriceAdjustment(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>-15% (Aggressive Discount)</span>
                    <span>0% (Standard)</span>
                    <span>+20% (Higher Margin)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-300">Supplier Volume Discount</span>
                    <span className="text-emerald-400 font-mono text-sm">{simSupplierDiscount}% discount on cost</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={simSupplierDiscount}
                    onChange={(e) => setSimSupplierDiscount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0% (Standard Wholesale)</span>
                    <span>5% (Tier 1 Volume)</span>
                    <span>15% (Tier 2 Master)</span>
                  </div>
                </div>
              </div>

              {/* Real-Time Projected Outputs */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                  PROJECTED MONTHLY PERFORMANCE
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[11px] text-slate-400 block">Monthly Revenue</span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">
                      ${Math.round(simResults.monthlyRevenue).toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <span className="text-[11px] text-slate-400 block">Wholesale Product Cost</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-300 font-mono">
                      ${Math.round(simResults.monthlyCost).toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                    <span className="text-[11px] text-emerald-400 block font-bold">Monthly Net Profit</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                      +${Math.round(simResults.monthlyProfit).toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3">
                    <span className="text-[11px] text-teal-400 block font-bold">Annualized Profit</span>
                    <span className="text-xl sm:text-2xl font-black text-teal-300 font-mono">
                      +${Math.round(simResults.annualProfit).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>
                    Average profit per order: <strong className="text-white">${simResults.profitPerOrder.toFixed(2)}</strong>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    Portfolio Margin: {simResults.marginPct}%
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filter & Search Bar */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4 shadow-sm">
            {/* Top Search & Primary Filters */}
            <div className="grid gap-3 md:grid-cols-12 items-center">
              {/* Search Bar */}
              <div className="relative md:col-span-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 549 products by name, SKU, brand, HCPCS code..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="md:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="ALL">All Categories ({RESEARCHED_PRODUCTS.length})</option>
                  {categories.filter((c) => c !== 'ALL').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manufacturer Dropdown */}
              <div className="md:col-span-3">
                <select
                  value={selectedManufacturer}
                  onChange={(e) => setSelectedManufacturer(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs text-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="ALL">All Manufacturers ({manufacturers.length - 1})</option>
                  {manufacturers.filter((m) => m !== 'ALL').map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-xs font-bold text-teal-400 focus:border-teal-500 focus:outline-none"
                >
                  <option value="PROFIT_HIGH">Highest Profit ($)</option>
                  <option value="MARGIN_HIGH">Highest Margin (%)</option>
                  <option value="SAVINGS_HIGH">Biggest Savings ($)</option>
                  <option value="COST_LOW">Lowest Buying Cost</option>
                  <option value="PRICE_HIGH">Price: High to Low</option>
                  <option value="PRICE_LOW">Price: Low to High</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Badges Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Filters:</span>

                {/* Margin Filter */}
                <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedMarginTier('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      selectedMarginTier === 'ALL' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Margins
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMarginTier('HIGH')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      selectedMarginTier === 'HIGH' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    High Margin (50%+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMarginTier('HEALTHY')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      selectedMarginTier === 'HEALTHY' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-teal-300'
                    }`}
                  >
                    Healthy (35–50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMarginTier('VOLUME')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      selectedMarginTier === 'VOLUME' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    Volume (&lt;35%)
                  </button>
                </div>

                {/* Rx Filter */}
                <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setRxFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      rxFilter === 'ALL' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Items
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxFilter('NO_RX')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      rxFilter === 'NO_RX' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cash-Pay OTC (No Rx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxFilter('RX')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      rxFilter === 'RX' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    Doctor Rx Needed
                  </button>
                </div>

                {/* Price Range Filter */}
                <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedPriceRange('ALL')}
                    className={`px-2 py-1 rounded-lg font-semibold transition ${
                      selectedPriceRange === 'ALL' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Prices
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPriceRange('UNDER_50')}
                    className={`px-2 py-1 rounded-lg font-semibold transition ${
                      selectedPriceRange === 'UNDER_50' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    &lt; $50
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPriceRange('50_TO_250')}
                    className={`px-2 py-1 rounded-lg font-semibold transition ${
                      selectedPriceRange === '50_TO_250' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    $50–$250
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPriceRange('250_TO_1000')}
                    className={`px-2 py-1 rounded-lg font-semibold transition ${
                      selectedPriceRange === '250_TO_1000' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    $250–$1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPriceRange('OVER_1000')}
                    className={`px-2 py-1 rounded-lg font-semibold transition ${
                      selectedPriceRange === 'OVER_1000' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    $1,000+
                  </button>
                </div>
              </div>

              {/* View Switcher & Clear Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] text-slate-400 hover:text-white underline font-semibold mr-2"
                >
                  Reset Filters
                </button>

                <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('TABLE')}
                    title="Table View"
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'TABLE' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TableIcon size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('GRID')}
                    title="Grid Cards View"
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === 'GRID' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{filteredProducts.length}</strong> of{' '}
              <strong className="text-white">{RESEARCHED_PRODUCTS.length}</strong> products
            </span>
            <span>
              Filtered Average: Wholesale Cost <strong className="text-slate-200">${filteredStats.avgCost}</strong> • Selling
              Price <strong className="text-slate-200">${filteredStats.avgPrice}</strong> • Average Margin{' '}
              <strong className="text-emerald-400">{filteredStats.avgMargin}%</strong>
            </span>
          </div>
        </section>

        {/* View 1: Data Table View */}
        {viewMode === 'TABLE' && (
          <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Manufacturer</th>
                  <th className="py-3 px-3 text-right">Buying Cost</th>
                  <th className="py-3 px-3 text-right">Street Price</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-right text-emerald-400">Profit / Item</th>
                  <th className="py-3 px-3 text-center">Margin %</th>
                  <th className="py-3 px-3 text-center">Rx Rules</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <p className="text-sm font-semibold text-white">No products match your search filters.</p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs text-teal-400 underline font-semibold"
                      >
                        Reset all filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const marginColor =
                      p.grossMarginPct >= 50
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        : p.grossMarginPct >= 35
                        ? 'text-teal-400 bg-teal-500/10 border-teal-500/30'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-800/40 transition group cursor-pointer"
                        onClick={() => setSelectedProduct(p)}
                      >
                        {/* Product Photo & Title */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-lg border border-slate-800 bg-slate-950 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={p.image}
                                alt={p.title}
                                className="h-full w-full object-contain group-hover:scale-105 transition"
                                onError={(e) => {
                                  (e.target as any).src =
                                    'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_01_t.png';
                                }}
                              />
                            </div>
                            <div className="min-w-0 max-w-xs sm:max-w-md">
                              <p className="font-bold text-white group-hover:text-teal-300 transition truncate">
                                {p.title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="font-mono text-teal-400/90">{p.sku}</span>
                                <span>•</span>
                                <span>HCPCS: {p.hcpcsCode}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-[11px] text-slate-300 whitespace-nowrap">
                          {p.category}
                        </td>

                        {/* Manufacturer */}
                        <td className="py-3 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                          {p.manufacturer}
                        </td>

                        {/* Wholesale Cost */}
                        <td className="py-3 px-3 text-right font-mono text-xs text-slate-300 whitespace-nowrap">
                          ${p.dealerCost.toFixed(2)}
                        </td>

                        {/* Competitor Price */}
                        <td className="py-3 px-3 text-right font-mono text-xs text-slate-400 line-through whitespace-nowrap">
                          ${p.competitorPrice.toFixed(2)}
                        </td>

                        {/* BaeMeds Selling Price */}
                        <td className="py-3 px-3 text-right font-mono text-xs font-bold text-white whitespace-nowrap">
                          ${p.retailPrice.toFixed(2)}
                        </td>

                        {/* Net Profit */}
                        <td className="py-3 px-3 text-right font-mono text-xs font-black text-emerald-400 whitespace-nowrap">
                          +${p.netProfit.toFixed(2)}
                        </td>

                        {/* Margin % */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded-full border ${marginColor}`}
                          >
                            {p.grossMarginPct}%
                          </span>
                        </td>

                        {/* Rx requirement */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {p.requiresRx ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              Doctor Rx
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              No Rx (OTC)
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(p);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-teal-500 hover:text-white transition"
                          >
                            <Eye size={12} /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* View 2: Product Cards View */}
        {viewMode === 'GRID' && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => {
              const marginColor =
                p.grossMarginPct >= 50
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : p.grossMarginPct >= 35
                  ? 'text-teal-400 border-teal-500/30 bg-teal-500/10'
                  : 'text-amber-400 border-amber-500/30 bg-amber-500/10';

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 cursor-pointer hover:border-teal-500/60 transition shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-400 uppercase tracking-wider">{p.sku}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold border ${marginColor}`}>
                        {p.grossMarginPct}% Margin
                      </span>
                    </div>

                    {/* Photo Box */}
                    <div className="h-40 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-center overflow-hidden">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="h-full w-full object-contain group-hover:scale-105 transition"
                        onError={(e) => {
                          (e.target as any).src =
                            'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_01_t.png';
                        }}
                      />
                    </div>

                    {/* Titles */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-teal-400 uppercase">{p.category}</span>
                      <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-teal-300 transition">
                        {p.title}
                      </h3>
                      <p className="text-[11px] text-slate-400">{p.manufacturer}</p>
                    </div>
                  </div>

                  {/* Financial Bar Box */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="grid grid-cols-3 gap-1 text-center text-xs">
                      <div className="rounded-lg bg-slate-950 p-1.5 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Cost</span>
                        <span className="font-mono font-bold text-slate-300">${p.dealerCost.toFixed(0)}</span>
                      </div>
                      <div className="rounded-lg bg-slate-950 p-1.5 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Sell</span>
                        <span className="font-mono font-bold text-white">${p.retailPrice.toFixed(0)}</span>
                      </div>
                      <div className="rounded-lg bg-emerald-950/20 p-1.5 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-400 block font-semibold">Profit</span>
                        <span className="font-mono font-black text-emerald-300">+${p.netProfit.toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Customer saves: <strong className="text-teal-400">${p.customerSavings.toFixed(2)}</strong></span>
                      <span>{p.requiresRx ? 'Doctor Rx' : 'OTC / No Rx'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      {/* Product Detail & Bulk Order Simulator Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-950 p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-400 border border-teal-500/30">
                    {selectedProduct.category}
                  </span>
                  <span className="font-mono text-xs text-slate-400">SKU: {selectedProduct.sku}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">{selectedProduct.title}</h2>
                <p className="text-xs text-slate-400">
                  Manufacturer: <strong className="text-slate-200">{selectedProduct.manufacturer}</strong> • Supplier:{' '}
                  <strong className="text-slate-200">{selectedProduct.supplier}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg bg-slate-900 border border-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Photo & Financial Grid */}
            <div className="grid gap-6 md:grid-cols-2 items-center">
              {/* Photo Box */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex items-center justify-center h-64">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as any).src =
                      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_01_t.png';
                  }}
                />
              </div>

              {/* Financial Snapshot */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <span className="text-[11px] text-slate-400 block">Wholesale Buying Cost</span>
                    <span className="text-xl font-bold font-mono text-slate-200">
                      ${selectedProduct.dealerCost.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Paid to wholesale supplier</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <span className="text-[11px] text-slate-400 block">Market Street Price</span>
                    <span className="text-xl font-bold font-mono text-slate-400 line-through">
                      ${selectedProduct.competitorPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Amazon / Competitor price</span>
                  </div>

                  <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3">
                    <span className="text-[11px] text-teal-400 block font-semibold">BaeMeds Selling Price</span>
                    <span className="text-2xl font-black font-mono text-white">
                      ${selectedProduct.retailPrice.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-teal-300/80 block mt-0.5">
                      Customer saves ${selectedProduct.customerSavings.toFixed(2)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                    <span className="text-[11px] text-emerald-400 block font-semibold">Your Profit per Item</span>
                    <span className="text-2xl font-black font-mono text-emerald-300">
                      +${selectedProduct.netProfit.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">
                      {selectedProduct.grossMarginPct}% gross margin
                    </span>
                  </div>
                </div>

                {/* Regulatory & Insurance Specs */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <ShieldCheck size={14} className="text-teal-400" /> Medical Billing Code:
                    </span>
                    <strong className="font-mono text-white">{selectedProduct.hcpcsCode}</strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <ShieldCheck size={14} className="text-teal-400" /> Fulfillment Classification:
                    </span>
                    <span className="font-bold text-emerald-400">
                      Direct Home Delivery (Cash-Pay OTC)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Truck size={14} className="text-teal-400" /> Carrier Shipping:
                    </span>
                    <span className="text-slate-200">{selectedProduct.shippingTier}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <DollarSign size={14} className="text-teal-400" /> Health Benefit Cards:
                    </span>
                    <span className="text-emerald-400 font-bold">100% FSA / HSA Accepted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Order Simulator for Clinics & Hospitals */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-400">
                    BULK ORDER PROFIT CALCULATOR
                  </h4>
                  <p className="text-xs text-slate-400">
                    Simulate a wholesale order from a partner clinic or patient group.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Units:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={calcQuantity}
                    onChange={(e) => setCalcQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-center font-mono font-bold text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
                <div className="rounded-xl bg-slate-950 p-2.5">
                  <span className="text-[10px] text-slate-400 block">Total Customer Price</span>
                  <span className="font-mono font-bold text-white text-base">
                    ${(selectedProduct.retailPrice * calcQuantity).toFixed(2)}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-950 p-2.5">
                  <span className="text-[10px] text-slate-400 block">Total Wholesale Cost</span>
                  <span className="font-mono font-bold text-slate-300 text-base">
                    ${(selectedProduct.dealerCost * calcQuantity).toFixed(2)}
                  </span>
                </div>
                <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-2.5">
                  <span className="text-[10px] text-emerald-400 block font-bold">Total Net Profit</span>
                  <span className="font-mono font-black text-emerald-300 text-base">
                    +${(selectedProduct.netProfit * calcQuantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Supplier drop-ships directly to patient with tracking numbers.
              </span>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-white hover:bg-teal-600 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductResearchPage;
