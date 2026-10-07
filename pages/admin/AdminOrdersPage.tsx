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
    { id: 'CLINICAL_REVIEW', label: 'Clinical Review (Rx)' },
    { id: 'PAID', label: 'Paid / Unfulfilled' },
    { id: 'SHIPPED', label: 'Shipped' },
    { id: 'DELIVERED', label: 'Delivered' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CLINICAL_REVIEW':
        return <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">Clinical Review</span>;
      case 'PAID':
        return <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-900">Paid / Ready</span>;
      case 'SHIPPED':
        return <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-900">Shipped</span>;
      case 'DELIVERED':
        return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900">Delivered</span>;
      case 'CANCELLED':
        return <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-900">Cancelled</span>;
      default:
        return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">{status}</span>;
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders</h1>
          <p className="text-xs text-slate-500">
            Manage incoming medical supply orders, clinical verifications, and delivery fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-2 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by order number, customer name, email..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-medical-primary focus:outline-none"
        />
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Order #</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Shipping Method</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {order.order_number}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-slate-800">
                      <p className="font-bold">
                        {order.shipping_address?.first_name} {order.shipping_address?.last_name || 'Patient'}
                      </p>
                      <p className="text-[11px] text-slate-400">{order.customer_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {order.shipping_method || 'Standard Ground'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {(order.order_items || []).length} items
                    </td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">
                      ${Number(order.total_amount).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ChevronRight size={16} className="inline text-slate-400" />
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
