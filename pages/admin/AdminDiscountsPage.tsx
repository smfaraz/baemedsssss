import React, { useEffect, useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Percent,
  DollarSign,
  Calendar,
  X,
  ShieldCheck,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';

interface DiscountCoupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number;
  timesUsed: number;
  usageLimit?: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export const AdminDiscountsPage: React.FC = () => {
  const [discounts, setDiscounts] = useState<DiscountCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(50);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(100);
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDiscounts = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApiClient.getDiscounts();
      setDiscounts(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load discount coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const filteredDiscounts = discounts.filter((d) =>
    searchQuery ? d.code.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMessage('Discount coupon code is required.');
      return;
    }
    if (value <= 0) {
      setErrorMessage('Discount value must be greater than zero.');
      return;
    }
    if (type === 'PERCENTAGE' && value > 100) {
      setErrorMessage('Percentage discount cannot exceed 100%.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await AdminApiClient.saveDiscount({
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minOrderAmount: Number(minOrderAmount) || 0,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        expiresAt: expiresAt || undefined,
        isActive: true,
      });

      setSuccessMessage(`Coupon code "${code.toUpperCase()}" created and enforced server-side.`);
      setIsModalOpen(false);
      setCode('');
      setValue(10);
      setMinOrderAmount(50);
      setUsageLimit(100);
      setExpiresAt('');
      await loadDiscounts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Discounts & Promotions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-authoritative promotion codes, minimum purchase requirements, and volume caps.
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setErrorMessage('');
            }}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-slate-800 transition"
          >
            <Plus size={16} /> Create Discount
          </button>
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

      {/* Security Callout */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-900 flex items-center gap-3">
        <ShieldCheck size={18} className="shrink-0 text-blue-600" />
        <span>
          <strong>Zero Trust Pricing:</strong> All coupon deductions are re-calculated on the server during checkout order completion. Client modifications to total amounts are rejected.
        </span>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupons by code..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-medical-primary focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Discounts Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Coupon Code</th>
                <th className="px-4 py-3.5">Type & Benefit</th>
                <th className="px-4 py-3.5 text-center">Min Order Req</th>
                <th className="px-4 py-3.5 text-center">Usage Count</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Expiration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
                      <span>Loading discount promotions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Tag size={32} className="text-slate-300" />
                      <p className="font-semibold text-slate-600">No active promotions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 font-mono text-xs font-black text-slate-900">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 border border-slate-200">
                          {d.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      {d.type === 'PERCENTAGE' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <Percent size={13} /> {d.value}% Off Order
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-700">
                          <DollarSign size={13} /> ${d.value.toFixed(2)} Off Order
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      ${d.minOrderAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-slate-900">{d.timesUsed}</span>
                      {d.usageLimit ? (
                        <span className="text-slate-400 text-[11px]"> / {d.usageLimit} max</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]"> / unlimited</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {d.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : 'No expiration'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">Create Promotion Coupon</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coupon Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HEALTH15"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-mono font-bold text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-medical-primary focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Value <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Order Subtotal ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-900 focus:border-medical-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Usage Cap (Redemptions)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit || ''}
                    onChange={(e) =>
                      setUsageLimit(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="Optional"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-900 focus:border-medical-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 focus:border-medical-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Creating...' : 'Save Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDiscountsPage;
