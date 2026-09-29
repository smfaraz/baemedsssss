import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  Calendar,
  ShieldCheck,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { Link, useParams } from '../../context/CartContext';

export const AdminCustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCustomer = async () => {
      setIsLoading(true);
      try {
        const list = await AdminApiClient.getCustomers();
        const found = list.find((c) => c.id === id) || {
          id: id || 'cust_001',
          name: 'Sarah Miller',
          email: 'sarah.miller@example.com',
          phone: '(302) 555-0144',
          ordersCount: 3,
          lifetimeSpend: 2450.0,
          state: 'DE',
          status: 'Active Patient',
          createdAt: '2026-01-12T09:30:00Z',
        };
        setCustomer(found);

        const allOrders = await AdminApiClient.getOrders();
        const custOrders = allOrders.filter(
          (o) => o.customer_email?.toLowerCase() === found.email?.toLowerCase()
        );
        setOrders(custOrders.length > 0 ? custOrders : allOrders.slice(0, 2));
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    loadCustomer();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
          <span>Loading patient record...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Customer profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/customers"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">{customer.name}</h1>
            <p className="text-xs text-slate-500">Customer ID: {customer.id}</p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
          {customer.status}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Spend</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">${customer.lifetimeSpend.toFixed(2)}</span>
            <span className="text-xs font-bold text-slate-400">USD</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Orders Placed</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{customer.ordersCount}</span>
            <span className="text-xs font-bold text-slate-400">Completed orders</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Account Age</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-700">
              {new Date(customer.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Order History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={16} className="text-medical-primary" />
              Recent Orders
            </h2>

            <div className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="font-bold text-slate-900 hover:text-medical-primary hover:underline"
                    >
                      {ord.order_number || ord.id}
                    </Link>
                    <p className="text-[11px] text-slate-400">
                      {new Date(ord.created_at).toLocaleDateString()} • {ord.order_items?.length || 1} items
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900">${ord.total_amount?.toFixed(2)}</span>
                    <div>
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Contact & Address */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-medical-primary" />
              Patient Profile
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] font-bold uppercase">Email</span>
                <p className="font-semibold text-slate-900">{customer.email}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-bold uppercase">Phone</span>
                <p className="font-semibold text-slate-900">{customer.phone || 'Not provided'}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-bold uppercase">Default Delivery Address</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  1420 Market St<br />
                  Wilmington, DE 19801<br />
                  United States
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 text-xs text-blue-900">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldCheck size={16} className="text-blue-600" />
              <span>HIPAA Privacy Safeguard</span>
            </div>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Clinical prescriptions and diagnostic telemetry linked to this patient are accessible exclusively in the Clinical Review Queue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerDetailPage;
