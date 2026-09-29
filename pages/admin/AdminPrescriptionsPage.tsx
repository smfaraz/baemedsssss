import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  Building,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { Link } from '../../context/CartContext';

export const AdminPrescriptionsPage: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadPrescriptions = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApiClient.getPrescriptions();
      setPrescriptions(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load clinical prescription queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (activeTab !== 'ALL' && rx.status !== activeTab) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rx.patientName.toLowerCase().includes(q) ||
      rx.orderNumber.toLowerCase().includes(q) ||
      rx.physicianName.toLowerCase().includes(q) ||
      rx.prescribedDevice.toLowerCase().includes(q)
    );
  });

  const pendingCount = prescriptions.filter((rx) => rx.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Prescription Queue</h1>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-white">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Licensed practitioner verification, DME prescription compliance, and order release.
          </p>
        </div>
      </div>

      {/* HIPAA / Clinical Role Enforcement Banner */}
      <div className="rounded-2xl border border-medical-primary/20 bg-medical-light/40 p-4 text-xs text-medical-dark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="shrink-0 text-medical-primary" />
          <span>
            <strong>Clinical Review Authorization:</strong> Only licensed Clinical Specialists or authorized medical directors may sign off on DME equipment scripts.
          </span>
        </div>
      </div>

      {/* Queue Filter Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Scripts ({prescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('PENDING_REVIEW')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'PENDING_REVIEW'
                ? 'bg-amber-600 text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-700 text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'REJECTED'
                ? 'bg-rose-700 text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rejected
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, order, NPI..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-medical-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Rx ID & Patient</th>
                <th className="px-4 py-3.5">Linked Order</th>
                <th className="px-4 py-3.5">Prescribed Equipment & Settings</th>
                <th className="px-4 py-3.5">Prescribing Physician / NPI</th>
                <th className="px-4 py-3.5">Clinic / Hospital</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
                      <span>Loading clinical queue...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={32} className="text-slate-300" />
                      <p className="font-semibold text-slate-600">No prescriptions found in this view</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{rx.patientName}</div>
                      <span className="font-mono text-[11px] text-slate-400 font-bold">
                        {rx.id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/admin/orders/${rx.orderNumber}`}
                        className="font-mono text-xs font-bold text-medical-primary hover:underline"
                      >
                        {rx.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-900 line-clamp-1">
                        {rx.prescribedDevice}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-800">{rx.physicianName}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {rx.clinic}
                    </td>
                    <td className="px-4 py-3.5">
                      {rx.status === 'PENDING_REVIEW' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                          <Clock size={12} /> Pending Review
                        </span>
                      )}
                      {rx.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle size={12} /> Approved
                        </span>
                      )}
                      {rx.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/admin/prescriptions/${rx.id}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                      >
                        {rx.status === 'PENDING_REVIEW' ? 'Review Script' : 'View Script'}
                        <ChevronRight size={14} />
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

export default AdminPrescriptionsPage;
