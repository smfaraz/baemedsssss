import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { Link, useNavigate } from '../../context/CartContext';

export const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      const data = await AdminApiClient.getOrders(activeTab !== 'all' ? activeTab : undefined, searchQuery);
      setOrders(data);
      setIsLoading(false);
    };
    fetchOrders();
  }, [activeTab, searchQuery]);

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'PAID', label: 'Paid / Unfulfilled' },
    { id: 'PROCESSING', label: 'Staged / Processing' },
    { id: 'SHIPPED', label: 'Shipped' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-mono font-medium text-emerald-800">Ready to Pack</span>;
      case 'PROCESSING':
        return <span className="inline-flex rounded-full bg-sky-50 border border-sky-300 px-2.5 py-0.5 text-[10px] font-mono font-medium text-sky-800">Warehouse Staged</span>;
      case 'SHIPPED':
        return <span className="inline-flex rounded-full bg-purple-50 border border-purple-300 px-2.5 py-0.5 text-[10px] font-mono font-medium text-purple-800">In Transit</span>;
      case 'DELIVERED':
        return <span className="inline-flex rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-mono font-medium text-slate-800">Delivered</span>;
      case 'CANCELLED':
        return <span className="inline-flex rounded-full bg-rose-50 border border-rose-300 px-2.5 py-0.5 text-[10px] font-mono font-medium text-rose-800">Cancelled</span>;
      default:
        return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-mono font-medium text-slate-700">{status}</span>;
    }
  };

  const handleExportCsv = () => {
    if (!orders.length) {
      alert('No orders to export.');
      return;
    }
    const headers = [
      'Order Number',
      'Date Placed',
      'Customer Email',
      'Customer Name',
      'Status',
      'Total ($)',
      'Subtotal ($)',
      'Tax ($)',
      'Shipping ($)',
      'Special Handling',
      'Shipping Method',
      'Carrier',
      'Tracking Number',
      'McKesson PO',
    ];
    const rows = orders.map((o) => [
      `"${o.order_number || o.id}"`,
      `"${o.created_at || ''}"`,
      `"${o.customer_email || ''}"`,
      `"${o.shipping_address?.first_name ? `${o.shipping_address.first_name} ${o.shipping_address.last_name || ''}`.trim() : ''}"`,
      `"${o.status}"`,
      `"${Number(o.total_amount || 0).toFixed(2)}"`,
      `"${Number(o.subtotal_amount || 0).toFixed(2)}"`,
      `"${Number(o.tax_amount || 0).toFixed(2)}"`,
      `"${Number(o.shipping_amount || 0).toFixed(2)}"`,
      `"${o.requires_order ? 'Yes' : 'No'}"`,
      `"${o.shipping_method || 'Standard Ground'}"`,
      `"${o.carrier || ''}"`,
      `"${o.tracking_number || ''}"`,
      `"${o.mckesson_po_number || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `baemeds_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 antialiased pb-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Orders & Fulfillment</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600">
              {orders.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming medical supply orders, clinical verifications, and delivery fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* 2. Controls Ribbon: Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, patients..."
            className="w-full rounded border border-slate-200 bg-white py-1 pl-7 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#14539A] focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Orders Data Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/50 text-[10px] font-mono uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Order Ref</th>
                <th className="px-4 py-2.5">Placed Date</th>
                <th className="px-4 py-2.5">Customer / Patient</th>
                <th className="px-4 py-2.5">Regulatory Gate</th>
                <th className="px-4 py-2.5">Dispatch Method</th>
                <th className="px-4 py-2.5">Items</th>
                <th className="px-4 py-2.5 text-right">Settlement</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs font-mono text-slate-400">
                    Loading medical supply orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-[#14539A] hover:underline">
                        {order.order_number || order.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {order.shipping_address?.first_name
                          ? `${order.shipping_address.first_name} ${order.shipping_address.last_name || ''}`.trim()
                          : order.customer_email?.split('@')[0] || 'Registered Patient'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{order.customer_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[11px]">
                      {order.shipping_method || 'Standard Ground'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[11px] font-mono">
                      {(order.order_items || []).length || 1} pkg
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900">
                      ${Number(order.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs">
                        Inspect <ChevronRight size={12} className="text-slate-400" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
