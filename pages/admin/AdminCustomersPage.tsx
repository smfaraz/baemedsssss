import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  ShoppingBag,
  DollarSign,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { Link } from '../../context/CartContext';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const data = await AdminApiClient.getCustomers();
        setCustomers(data);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to load customer profiles');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.state && c.state.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Patient accounts, commercial clinics, order histories, and lifetime commerce value.
          </p>
        </div>
      </div>

      {/* HIPAA / PHI Compliance Notice */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-800 flex items-center gap-3">
        <ShieldCheck size={18} className="shrink-0 text-blue-600" />
        <span>
          <strong>HIPAA Safeguard:</strong> All customer directory queries are monitored. Prescription details are segregated and accessible only to licensed clinical staff.
        </span>
      </div>

      {/* Search & Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, phone, state..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-medical-primary focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Customer / Organization</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Account Type</th>
                <th className="px-4 py-3.5 text-center">Orders</th>
                <th className="px-4 py-3.5 text-right">Lifetime Spend</th>
                <th className="px-4 py-3.5">Member Since</th>
                <th className="px-4 py-3.5 text-right">View Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
                      <span>Loading customer profiles...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users size={32} className="text-slate-300" />
                      <p className="font-semibold text-slate-600">No customers found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700">
                          {cust.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            to={`/admin/customers/${cust.id}`}
                            className="font-bold text-slate-900 hover:text-medical-primary hover:underline"
                          >
                            {cust.name}
                          </Link>
                          <p className="text-[11px] text-slate-400">ID: {cust.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail size={12} className="text-slate-400" />
                          <span>{cust.email}</span>
                        </div>
                        {cust.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone size={12} className="text-slate-400" />
                            <span>{cust.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        cust.status.includes('Commercial')
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {cust.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                      {cust.ordersCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900">
                      ${cust.lifetimeSpend.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(cust.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/admin/customers/${cust.id}`}
                        className="inline-flex items-center gap-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <ChevronRight size={16} />
                      </Link>
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

export default AdminCustomersPage;
