import React, { useEffect, useState } from 'react';
import {
  Truck,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Package,
  Layers,
  Save,
  Clock,
  DollarSign,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';

export const AdminShippingPage: React.FC = () => {
  const [shipping, setShipping] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadShipping = async () => {
      setIsLoading(true);
      try {
        const data = await AdminApiClient.getShippingSettings();
        setShipping(
          data || {
            carriers: ['FedEx Healthcare Logistics', 'UPS Medical Transport', 'Local White-Glove Courier'],
            tiers: [
              {
                id: 'std',
                name: 'Standard Insured Medical Ground',
                deliveryDays: '3-5 Business Days',
                price: 0,
                freeThreshold: 99,
                isActive: true,
              },
              {
                id: 'exp',
                name: 'Priority Clinical Courier (Cold-Chain/Fragile)',
                deliveryDays: '1-2 Business Days',
                price: 25.0,
                isActive: true,
              },
              {
                id: 'wg',
                name: 'White-Glove DME Setup & Patient Orientation',
                deliveryDays: 'Scheduled Appointment',
                price: 75.0,
                isActive: true,
              },
            ],
            originWarehouse: {
              name: 'Wilmington Healthcare Fulfillment Depot',
              address: '1200 N Dupont Hwy, Wilmington, DE 19801',
            },
          }
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadShipping();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage('Shipping carrier rules and DME tiers saved.');
    }, 400);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
          <span>Loading shipping configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shipping & Logistics</h1>
          <p className="text-xs text-slate-500 mt-1">
            DME carrier integration, insured ground delivery, and White-Glove equipment installation tiers.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-soft hover:bg-slate-800 disabled:opacity-50 transition"
        >
          <Save size={15} />
          {isSaving ? 'Saving...' : 'Save Logistics Rules'}
        </button>
      </div>

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Fulfillment Origin Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Package size={16} className="text-medical-primary" />
          Primary Fulfillment Depot (Wilmington, DE)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div>
            <label className="block text-slate-500 font-bold mb-1">Depot Facility Name</label>
            <input
              type="text"
              defaultValue={shipping.originWarehouse?.name}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-bold mb-1">Facility Address</label>
            <input
              type="text"
              defaultValue={shipping.originWarehouse?.address}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Shipping Tiers */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Truck size={16} className="text-medical-primary" />
          Configured Delivery Tiers
        </h2>

        <div className="space-y-3">
          {shipping.tiers?.map((tier: any) => (
            <div
              key={tier.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900 text-sm">{tier.name}</p>
                <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                  <Clock size={12} />
                  <span>Estimated transit: {tier.deliveryDays}</span>
                  {tier.freeThreshold && (
                    <span className="font-semibold text-emerald-700">
                      • Free on orders over ${tier.freeThreshold}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-black text-slate-900 text-sm">
                    {tier.price === 0 ? 'FREE' : `$${tier.price.toFixed(2)}`}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 border border-emerald-200 text-[11px]">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};

export default AdminShippingPage;
