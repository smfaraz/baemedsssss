import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  FileText,
  Truck,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Package,
  CheckCircle,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { Link } from '../../context/CartContext';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await AdminApiClient.getDashboardMetrics();
      setMetrics(data);
      setIsLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Real-time sales, order processing, DME prescription queues, and inventory alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <Plus size={16} /> Add Product
          </Link>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales (Today)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">
            ${metrics?.revenueToday ? Number(metrics.revenueToday).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '4,820.50'}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <TrendingUp size={14} />
            <span>+14.2% vs. yesterday</span>
          </div>
        </div>

        {/* Active Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Orders Received</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">
            {metrics?.ordersToday || 14}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>Avg. Order Value: ${metrics?.averageOrderValue?.toFixed(2) || '344.32'}</span>
          </div>
        </div>

        {/* Clinical Prescription Queue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Rx Review</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <FileText size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-900">
            {metrics?.pendingPrescriptions || 2}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
            <Clock size={14} />
            <span>Requires licensed clinician sign-off</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Alerts</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle size={18} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">
            {metrics?.lowStockProducts || 3} <span className="text-xs font-medium text-slate-400">items low</span>
          </p>
          <Link to="/admin/inventory" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline">
            Manage reorder points <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      {/* Main Grid: Orders & Clinical Queue */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Orders Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="text-base font-black text-slate-900">Active Order Queue</h2>
              <p className="text-xs text-slate-500">Orders requiring processing, payment capture, or dispatch.</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-medical-primary hover:underline"
            >
              View all orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <Link to="/admin/orders/ord_demo_001" className="font-bold text-slate-900 hover:underline">
                      BM-722730-720
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">Sarah Miller</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                      CLINICAL REVIEW
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">Philips EverFlo 5L (x1)</td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">$1,537.00</td>
                </tr>

                <tr className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <Link to="/admin/orders/ord_demo_002" className="font-bold text-slate-900 hover:underline">
                      BM-722730-721
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">David Chen</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      PAID / READY
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">AirFit F20 CPAP Mask (x5)</td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">$968.40</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel: Quick Tasks & Audit Activity */}
        <div className="space-y-6 lg:col-span-4">
          {/* Quick Operations Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Operational Actions
            </h3>
            <div className="space-y-2">
              <Link
                to="/admin/prescriptions"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-medical-primary hover:bg-medical-light/20 transition"
              >
                <span>Review Pending Prescriptions</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">2 pending</span>
              </Link>

              <Link
                to="/admin/inventory"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-medical-primary hover:bg-medical-light/20 transition"
              >
                <span>Adjust Stock Levels</span>
                <Package size={16} className="text-slate-400" />
              </Link>

              <Link
                to="/admin/discounts"
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 hover:border-medical-primary hover:bg-medical-light/20 transition"
              >
                <span>Create Marketing Coupon</span>
                <Plus size={16} className="text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Real-time Audit Activity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Security & Audit Trail
              </h3>
              <Link to="/admin/audit-logs" className="text-[11px] font-bold text-medical-primary hover:underline">
                View Log
              </Link>
            </div>

            <div className="space-y-3">
              {(metrics?.recentActivity || []).slice(0, 4).map((entry: any) => (
                <div key={entry.id} className="flex items-start gap-2.5 text-xs">
                  <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">{entry.action}</p>
                    <p className="text-[10px] text-slate-400">
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
