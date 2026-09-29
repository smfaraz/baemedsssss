import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  RotateCcw,
  SlidersHorizontal,
  X,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';

interface InventoryItem {
  productId: string;
  title: string;
  sku: string;
  category: string;
  available: number;
  reserved: number;
  total: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export const AdminInventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Adjustment Modal State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(1);
  const [adjustmentReason, setAdjustmentReason] = useState<
    'Purchase' | 'Return' | 'Damage' | 'Correction' | 'Receiving' | 'Manual Adjustment'
  >('Receiving');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApiClient.getInventory();
      setInventory(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredInventory = inventory.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleOpenAdjustmentModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentDelta(1);
    setAdjustmentReason('Receiving');
    setAdjustmentNotes('');
    setErrorMessage('');
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (selectedItem.available + adjustmentDelta < 0) {
      setErrorMessage(
        `Invalid adjustment: available stock cannot be reduced below zero. Current available: ${selectedItem.available}`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await AdminApiClient.adjustInventory(
        selectedItem.productId,
        adjustmentDelta,
        adjustmentReason,
        adjustmentNotes || undefined
      );
      setSuccessMessage(
        `Adjusted stock for "${selectedItem.title}" by ${adjustmentDelta > 0 ? `+${adjustmentDelta}` : adjustmentDelta} units. Reason: ${adjustmentReason}`
      );
      setSelectedItem(null);
      await loadInventory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to adjust inventory. Check role permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time physical stock counts, warehouse reservations, and audited stock adjustments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exporting inventory ledger to CSV...')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <FileSpreadsheet size={15} /> Export Ledger
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
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

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by product name or SKU..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-medical-primary focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Inventory
            </button>
            <button
              onClick={() => setStatusFilter('LOW_STOCK')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === 'LOW_STOCK'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Low Stock (&lt; 5)
            </button>
            <button
              onClick={() => setStatusFilter('OUT_OF_STOCK')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === 'OUT_OF_STOCK'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Product & SKU</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-center">Available</th>
                <th className="px-4 py-3.5 text-center">Reserved</th>
                <th className="px-4 py-3.5 text-center">On Hand Total</th>
                <th className="px-4 py-3.5">Stock Status</th>
                <th className="px-4 py-3.5 text-right">Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
                      <span>Syncing warehouse inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Boxes size={32} className="text-slate-300" />
                      <p className="font-semibold text-slate-600">No inventory matches filter</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 line-clamp-1">{item.title}</div>
                      <span className="font-mono text-[11px] text-slate-400">SKU: {item.sku}</span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-600">
                      {item.category}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-900 text-sm">
                      {item.available}
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium text-slate-500">
                      {item.reserved}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      {item.total}
                    </td>
                    <td className="px-4 py-3.5">
                      {item.status === 'IN_STOCK' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> In Stock
                        </span>
                      )}
                      {item.status === 'LOW_STOCK' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Low Stock
                        </span>
                      )}
                      {item.status === 'OUT_OF_STOCK' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenAdjustmentModal(item)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-medical-primary hover:text-medical-primary transition"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Adjust Inventory Stock</h3>
                <p className="text-xs text-slate-500">{selectedItem.title}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 flex justify-between items-center">
                <span>Current Available Stock:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedItem.available} units</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity Adjustment Delta (+ / -)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentDelta((prev) => prev - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    required
                    value={adjustmentDelta}
                    onChange={(e) => setAdjustmentDelta(parseInt(e.target.value) || 0)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-black text-slate-900 focus:border-medical-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustmentDelta((prev) => prev + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="mt-1 text-right text-[11px] text-slate-500">
                  New available: <span className="font-bold text-slate-900">{selectedItem.available + adjustmentDelta} units</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adjustment Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e: any) => setAdjustmentReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-medical-primary focus:outline-none"
                >
                  <option value="Receiving">Receiving (New Shipment Received)</option>
                  <option value="Purchase">Purchase (Customer Order Fulfillment)</option>
                  <option value="Return">Return (Restocked from Return)</option>
                  <option value="Damage">Damage (Damaged / Expired / Quarantined)</option>
                  <option value="Correction">Correction (Inventory Cycle Count)</option>
                  <option value="Manual Adjustment">Manual Adjustment (Administrative Override)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Audit Notes / PO / RMA Reference
                </label>
                <input
                  type="text"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="e.g. PO-88902 received from ResMed Logistics"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-medical-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedItem.available + adjustmentDelta < 0}
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Recording...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventoryPage;
