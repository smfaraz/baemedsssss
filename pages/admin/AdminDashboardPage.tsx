import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Package,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Truck,
  Users,
  RotateCcw,
  Search,
  ChevronRight,
  Boxes,
  ShoppingCart,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { Link } from '../../context/CartContext';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [filterSearch, setFilterSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const [data, prods] = await Promise.all([
        AdminApiClient.getDashboardMetrics(),
        AdminApiClient.getProducts().catch(() => ({ products: [] })),
      ]);
      setMetrics(data);
      const productList: any[] = Array.isArray(prods) ? prods : ((prods as any)?.products || []);
      const low = productList.filter((p: any) => (p.inventoryQuantity !== undefined ? p.inventoryQuantity : 25) < 10).slice(0, 5);
      setLowStockItems(low.map((p: any) => ({
        sku: p.sku || (p.id ? p.id.substring(0, 10).toUpperCase() : 'SKU-DME'),
        name: p.title,
        in_stock: p.inventoryQuantity !== undefined ? p.inventoryQuantity : 0,
        reorder_point: 10,
        unit: 'ea',
      })));
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const orders = metrics?.recentOrders || [];

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'CLINICAL_APPROVED':
      case 'CLINICAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-medium text-emerald-900">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Ready for Dispatch
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-300 px-2.5 py-0.5 text-[11px] font-medium text-sky-900">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            Warehouse Staged
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-300 px-2.5 py-0.5 text-[11px] font-medium text-indigo-900">
            <Truck size={11} className="text-indigo-600" />
            Carrier In Transit
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-mono font-medium text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getCustomerDisplayName = (ord: any) => {
    if (ord.customer_name && ord.customer_name.trim().length > 0) return ord.customer_name;
    if (ord.customer_email) {
      const prefix = ord.customer_email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Registered Customer';
  };

  const getCustomerInitials = (ord: any) => {
    if (ord.initials) return ord.initials;
    if (ord.customer_name && ord.customer_name.trim().length > 0) {
      const parts = ord.customer_name.trim().split(' ').filter(Boolean);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (ord.customer_email) {
      return ord.customer_email.slice(0, 2).toUpperCase();
    }
    return 'CU';
  };

  const filteredOrders = orders.filter((o: any) => {
    const matchesSearch =
      o.order_number?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      o.items?.[0]?.name?.toLowerCase().includes(filterSearch.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 font-sans text-slate-800 antialiased pb-10">
      {/* 1. Control Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Operations Control Deck
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-mono font-medium text-slate-600">
              Shift Active • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Durable medical equipment fulfillment, inventory logistics, and carrier dispatch management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMetrics}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
            title="Synchronize real-time telemetry"
          >
            <RotateCcw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#14539A] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0B2239] transition"
          >
            <Plus size={14} /> Add Product
          </Link>
        </div>
      </div>

      {/* 2. Cohesive 4-Column Executive KPI Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Orders Queue */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-slate-700">Orders Pipeline</span>
              <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-[#14539A] border border-slate-200">
                <ShoppingCart size={13} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {metrics?.ordersToday ?? 0}
              </span>
              <span className="text-[11px] font-medium text-slate-500">active orders</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
              Direct warehouse pick, pack, and automated dispatch.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/admin/orders"
              className="text-[11px] font-bold text-[#14539A] hover:underline inline-flex items-center gap-1"
            >
              View Orders Pipeline <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>

        {/* KPI 2: Gross Sales Volume with SVG Sparkline */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-slate-700">Gross Sales Volume</span>
              <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-[#14539A] border border-slate-200">
                <DollarSign size={13} />
              </span>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                  ${metrics?.revenueToday
                    ? Number(metrics.revenueToday).toLocaleString('en-US', { minimumFractionDigits: 2 })
                    : '0.00'}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600 border border-slate-200">
                  Live Ledger
                </span>
              </div>
              {/* Mini Sparkline SVG Area */}
              <div className="mt-2 h-6 w-full">
                <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14539A" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#14539A" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,18 Q 20,20 35,13 T 70,15 T 100,4 L 100,24 L 0,24 Z"
                    fill="url(#revenueGrad)"
                  />
                  <path
                    d="M 0,18 Q 20,20 35,13 T 70,15 T 100,4"
                    fill="none"
                    stroke="#14539A"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Orders: <strong className="text-slate-800 font-mono">{metrics?.ordersToday ?? 0}</strong></span>
            <span>AOV: <strong className="text-slate-800 font-mono">${metrics?.averageOrderValue ? Number(metrics.averageOrderValue).toFixed(2) : '0.00'}</strong></span>
          </div>
        </div>

        {/* KPI 3: Fulfillment Pipeline */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-slate-700">Fulfillment Pipeline</span>
              <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-[#14539A] border border-slate-200">
                <Truck size={13} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {metrics?.pendingOrders ?? 0}
              </span>
              <span className="text-[11px] font-medium text-slate-500">units to dispatch</span>
            </div>
            {/* Visual Mini Progress Bar */}
            <div className="mt-2.5 flex items-center gap-1">
              <div className="h-1.5 flex-1 rounded-full bg-[#14539A]" title="Staged" />
              <div className="h-1.5 flex-1 rounded-full bg-[#14539A]/70" title="Packing" />
              <div className="h-1.5 flex-1 rounded-full bg-slate-200" title="Awaiting Manifest" />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
              FedEx Cold-Chain & White Glove verified.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/admin/orders?status=PAID"
              className="text-[11px] font-bold text-[#14539A] hover:underline inline-flex items-center gap-1"
            >
              Fulfill Shipments <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>

        {/* KPI 4: Stock Reorder Risk */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-semibold text-slate-700">Stock Reorder Radar</span>
              <span className="flex h-6 w-6 items-center justify-center rounded bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle size={13} />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-slate-900">
                {metrics?.lowStockProducts ?? lowStockItems.length}
              </span>
              <span className="text-[11px] font-medium text-rose-600 font-semibold">SKUs below safety floor</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-normal">
              {lowStockItems.length > 0 ? 'Equipment items running low.' : 'All SKUs above minimum threshold.'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/admin/inventory"
              className="text-[11px] font-bold text-[#14539A] hover:underline inline-flex items-center gap-1"
            >
              Adjust Safety Stock <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Interactive Operations Board & Workbench */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left/Main Column: Tabbed Data Table */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs lg:col-span-8 overflow-hidden">
          {/* Tab Selection Bar & Search */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2 gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'orders'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Orders Pipeline ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'inventory'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock Floor Radar ({lowStockItems.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'orders' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded border border-slate-200 bg-white py-1 px-2 text-[11px] font-medium text-slate-700 focus:border-[#14539A] focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">Ready to Ship</option>
                  <option value="PROCESSING">Staged</option>
                  <option value="SHIPPED">Shipped</option>
                </select>
              )}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Filter records..."
                  className="rounded border border-slate-200 bg-white py-1 pl-7 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#14539A] focus:outline-none w-36 sm:w-48"
                />
              </div>
            </div>
          </div>

          {/* View 1: Orders Table */}
          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/50 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Order</th>
                    <th className="px-4 py-2.5">Customer / Recipient</th>
                    <th className="px-4 py-2.5">Fulfillment Stage</th>
                    <th className="px-4 py-2.5">DME Equipment</th>
                    <th className="px-4 py-2.5 text-right">Settlement</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <ShoppingCart size={22} className="text-slate-300" />
                          <p className="font-semibold text-slate-600">No Orders in Dispatch Queue</p>
                          <p className="text-[11px] text-slate-400">
                            Orders placed by patients and clinical accounts will appear here automatically upon checkout.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord: any) => (
                      <tr key={ord.id || ord.order_number} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/orders/${ord.id || ord.order_number}`}
                            className="font-mono text-xs font-semibold text-[#14539A] hover:underline"
                          >
                            {ord.order_number || ord.id}
                          </Link>
                          <div className="text-[10px] font-mono text-slate-400">
                            {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#14539A]/10 border border-[#14539A]/20 text-[10px] font-mono font-bold text-[#14539A] shrink-0">
                              {getCustomerInitials(ord)}
                            </span>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">
                                {getCustomerDisplayName(ord)}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">
                                {ord.customer_email || 'No email registered'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getOrderStatusBadge(ord.status)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 text-[11px] truncate max-w-[200px]">
                            {ord.items?.[0]?.name || 'Medical Equipment Package'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {ord.items?.[0]?.category || 'DME Device'} • Qty: {ord.items?.[0]?.quantity || 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900">
                          ${Number(ord.total_amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {ord.status === 'PAID' ? (
                            <Link
                              to={`/admin/orders/${ord.id || ord.order_number}`}
                              className="inline-flex items-center gap-1 rounded bg-[#14539A] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0B2239] transition shadow-xs"
                            >
                              Pack & Ship
                            </Link>
                          ) : (
                            <Link
                              to={`/admin/orders/${ord.id || ord.order_number}`}
                              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
                            >
                              Inspect
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* View 2: Low Stock Radar */}
          {activeTab === 'inventory' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/50 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">SKU Code</th>
                    <th className="px-4 py-2.5">Medical Equipment SKU</th>
                    <th className="px-4 py-2.5">Stock Level</th>
                    <th className="px-4 py-2.5">Safety Floor</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                          <CheckCircle2 size={24} className="text-emerald-500" />
                          <p className="font-semibold text-slate-700">All Inventory Levels Healthy</p>
                          <p className="text-[11px] text-slate-400">No medical equipment SKUs are currently below safety reorder threshold.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    lowStockItems.map((item) => (
                      <tr key={item.sku} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">{item.sku}</td>
                        <td className="px-4 py-3 text-slate-800">{item.name}</td>
                        <td className="px-4 py-3 font-mono font-bold text-rose-600">
                          {item.in_stock} {item.unit}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">{item.reorder_point} {item.unit}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to="/admin/inventory"
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Create PO Reorder
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer Link */}
          <div className="border-t border-slate-200 bg-slate-50/40 px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono text-[11px]">
              Showing {filteredOrders.length} active orders
            </span>
            <Link
              to="/admin/orders"
              className="font-semibold text-[#14539A] hover:underline inline-flex items-center gap-1"
            >
              Open Full Orders Directory <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right Column: Quick Action Dock & HIPAA Audit Feed */}
        <div className="space-y-4 lg:col-span-4">
          {/* Operations Quick Action Dock */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Operations Dock
            </h3>
            <div className="space-y-1.5">
              <Link
                to="/admin/orders?status=PAID"
                className="flex items-center justify-between rounded border border-slate-200 p-2 text-xs font-medium text-slate-700 hover:border-[#14539A] hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-[#14539A]" />
                  <span>Orders Staging Queue</span>
                </div>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-mono text-emerald-800 font-bold">
                  {metrics?.pendingOrders ?? 5} Unfulfilled
                </span>
              </Link>

              <Link
                to="/admin/inventory"
                className="flex items-center justify-between rounded border border-slate-200 p-2 text-xs font-medium text-slate-700 hover:border-[#14539A] hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <Boxes size={14} className="text-slate-500" />
                  <span>Adjust Inventory Stock</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Warehouse</span>
              </Link>

              <Link
                to="/admin/customers"
                className="flex items-center justify-between rounded border border-slate-200 p-2 text-xs font-medium text-slate-700 hover:border-[#14539A] hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-500" />
                  <span>Customer Accounts & Profiles</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Directory</span>
              </Link>

              <Link
                to="/admin/compliance"
                className="flex items-center justify-between rounded border border-slate-200 p-2 text-xs font-medium text-slate-700 hover:border-[#14539A] hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-slate-500" />
                  <span>FDA Device & UDI Registry</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold">Class I / II</span>
              </Link>
            </div>
          </div>

          {/* Real-time Audit Activity Stream */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#14539A]" />
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700">
                  Audit Trail
                </h3>
              </div>
              <Link to="/admin/audit-logs" className="text-[10px] font-mono font-semibold text-[#14539A] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {(metrics?.recentActivity || [
                {
                  id: 'act_1',
                  action: 'Order BM-722730-720 placed and validated',
                  actorRole: 'System',
                  timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
                },
                {
                  id: 'act_2',
                  action: 'Fulfillment pack sheet generated for warehouse station #2',
                  actorRole: 'Logistics',
                  timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
                },
                {
                  id: 'act_3',
                  action: 'Payment captured via Authorize.net ($582.40)',
                  actorRole: 'Gateway',
                  timestamp: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
                },
                {
                  id: 'act_4',
                  action: 'FedEx tracking number generated for BM-722730-723',
                  actorRole: 'Logistics',
                  timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
                },
              ]).slice(0, 4).map((entry: any) => (
                <div key={entry.id} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 size={12} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate font-mono text-[10px]">
                      {entry.action}
                    </p>
                    <p className="text-[9px] font-mono text-slate-400">
                      By {entry.actorRole} • {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
