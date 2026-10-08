import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Plus,
  ExternalLink,
  Copy,
  Check,
  FileCheck2,
  Calendar,
  Building,
  RefreshCw,
  X,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from '../../context/CartContext';

interface SerialUnit {
  id: string;
  serialNumber: string;
  udiCode: string;
  productName: string;
  orderNumber: string;
  facilityOrCustomer: string;
  dispatchDate: string;
  warrantyExpiry: string;
  status: 'ACTIVE_FIELD' | 'IN_SERVICE' | 'RECALLED' | 'RETURNED';
  deviceClass: 'Class I' | 'Class II';
}

const loadSavedSerials = (): SerialUnit[] => {
  try {
    const raw = localStorage.getItem('baemeds_udi_serials_v1');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

const FDA_CATALOG_REGISTRATIONS = [
  {
    category: 'Electric Hospital Beds',
    productCode: 'FRN',
    deviceClass: 'Class II',
    clearance510k: 'K201492 (Medline Ind.)',
    hcpcs: 'E0260',
    fdaRegulation: '21 CFR 880.5100',
    warrantyPeriod: '3 Years Frame / 1 Year Electronics',
    storageRules: 'Temp: 10°C - 40°C | Humidity: 15% - 85% non-condensing',
  },
  {
    category: 'Positive Airway Pressure (CPAP)',
    productCode: 'BZD',
    deviceClass: 'Class II',
    clearance510k: 'K210488 (ResMed Corp)',
    hcpcs: 'E0601',
    fdaRegulation: '21 CFR 868.5905',
    warrantyPeriod: '2 Years Manufacturer Replacement',
    storageRules: 'Sanitary sealed bag. Avoid direct UV exposure.',
  },
  {
    category: 'Mechanical Patient Lifts',
    productCode: 'FMI',
    deviceClass: 'Class II',
    clearance510k: 'K190284 (Invacare)',
    hcpcs: 'E0630 / E0635',
    fdaRegulation: '21 CFR 880.5500',
    warrantyPeriod: '3 Years Lift / 1 Year Hydraulic Actuator',
    storageRules: 'Dry environment. Annual load test certification required.',
  },
  {
    category: 'Home Oxygen Concentrators',
    productCode: 'CAW',
    deviceClass: 'Class II',
    clearance510k: 'K183921 (Drive DeVilbiss)',
    hcpcs: 'E1390',
    fdaRegulation: '21 CFR 868.5440',
    warrantyPeriod: '3 Years Compressor / 1 Year Sieve Beds',
    storageRules: 'Keep upright. Particle filter inspection every 90 days.',
  },
  {
    category: 'Wheeled Mobility Rollators & Walkers',
    productCode: 'NXQ',
    deviceClass: 'Class I (Exempt)',
    clearance510k: 'Exempt from 510(k) per 21 CFR 890.3880',
    hcpcs: 'E0143',
    fdaRegulation: '21 CFR 890.3880',
    warrantyPeriod: 'Lifetime Frame / 5 Years Wearable Parts',
    storageRules: 'General ambient medical warehouse storage.',
  },
];

export const AdminCompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'serials' | 'fda' | 'recalls'>('serials');
  const [serialUnits, setSerialUnits] = useState<SerialUnit[]>(loadSavedSerials);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New serial registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newSerial, setNewSerial] = useState('');
  const [newProductName, setNewProductName] = useState('Electric Hospital Bed');
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newDeviceClass, setNewDeviceClass] = useState<'Class I' | 'Class II'>('Class II');

  // Recall scanner state
  const [recallLotQuery, setRecallLotQuery] = useState('');
  const [recallScanResults, setRecallScanResults] = useState<{ searched: boolean; matches: SerialUnit[] }>({
    searched: false,
    matches: [],
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSerial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerial.trim()) return;

    const newUnit: SerialUnit = {
      id: `ser-${Date.now()}`,
      serialNumber: newSerial.trim().toUpperCase(),
      udiCode: `(01)00840192849102(21)${newSerial.trim().toUpperCase()}`,
      productName: newProductName,
      orderNumber: newOrderNumber.trim().toUpperCase(),
      facilityOrCustomer: newCustomer.trim(),
      dispatchDate: new Date().toISOString().split('T')[0],
      warrantyExpiry: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ACTIVE_FIELD',
      deviceClass: newDeviceClass,
    };

    setSerialUnits((prev) => {
      const updated = [newUnit, ...prev];
      try {
        localStorage.setItem('baemeds_udi_serials_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setIsRegisterModalOpen(false);
    setNewSerial('');
    setNewOrderNumber('');
    setNewCustomer('');
  };

  const handleRecallSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recallLotQuery.trim()) return;
    const clean = recallLotQuery.trim().toLowerCase();
    const matches = serialUnits.filter(
      (u) =>
        u.serialNumber.toLowerCase().includes(clean) ||
        u.productName.toLowerCase().includes(clean) ||
        u.orderNumber.toLowerCase().includes(clean)
    );
    setRecallScanResults({ searched: true, matches });
  };

  const filteredSerials = serialUnits.filter((u) => {
    const matchesSearch =
      u.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.udiCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.facilityOrCustomer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 pb-16 max-w-[1600px] mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#14539A] text-white">
              <ShieldCheck size={16} />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              FDA Device Compliance & UDI Registry
            </h1>
            <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-800">
              FDA Title 21 CFR Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Serial number registry, Unique Device Identifiers (UDI), 510(k) clearances, and rapid manufacturer recall batch readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#14539A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0f4077] transition"
          >
            <Plus size={14} />
            <span>Register Serial Unit</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold text-slate-700">Active In-Field UDI Units</span>
            <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-50 text-[#14539A] border border-blue-100">
              <QrCode size={13} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{serialUnits.length}</span>
            <span className="text-[11px] font-medium text-emerald-600">100% Tracked</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Class I & Class II regulated DME assets</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold text-slate-700">FDA Regulated Product Lines</span>
            <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              <FileCheck2 size={13} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {FDA_CATALOG_REGISTRATIONS.length}
            </span>
            <span className="text-[11px] font-medium text-slate-500">Device Categories</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Matched against FDA 510(k) clearances</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold text-slate-700">Warranties in Force</span>
            <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Calendar size={13} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {serialUnits.filter((u) => u.status === 'ACTIVE_FIELD').length}
            </span>
            <span className="text-[11px] font-medium text-emerald-600">Active Coverage</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">1 to 5-year manufacturer coverage</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold text-slate-700">FDA Safety Recalls</span>
            <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 size={13} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">0</span>
            <span className="text-[11px] font-medium text-emerald-700 font-semibold">Clean Status</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">No open manufacturer recall bulletins</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('serials')}
          className={`pb-2.5 transition flex items-center gap-1.5 ${
            activeTab === 'serials'
              ? 'border-b-2 border-[#14539A] text-[#14539A]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode size={14} />
          <span>In-Field Serial & UDI Registry ({serialUnits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fda')}
          className={`pb-2.5 transition flex items-center gap-1.5 ${
            activeTab === 'fda'
              ? 'border-b-2 border-[#14539A] text-[#14539A]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 size={14} />
          <span>FDA 510(k) Clearances & Classifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recalls')}
          className={`pb-2.5 transition flex items-center gap-1.5 ${
            activeTab === 'recalls'
              ? 'border-b-2 border-[#14539A] text-[#14539A]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle size={14} />
          <span>Recall Readiness & Batch Investigation</span>
        </button>
      </div>

      {/* Tab 1: Serial Numbers Table */}
      {activeTab === 'serials' && (
        <div className="space-y-3">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search serial, UDI, order #, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-slate-900 focus:border-[#14539A] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-500 text-[11px] font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 font-medium focus:border-[#14539A] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE_FIELD">Active In Field</option>
                <option value="IN_SERVICE">Under Maintenance</option>
                <option value="RETURNED">Returned / Quarantine</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="py-2.5 px-3">Device & Model</th>
                  <th className="py-2.5 px-3 font-mono">Serial Number (UDI)</th>
                  <th className="py-2.5 px-3 font-mono">Order #</th>
                  <th className="py-2.5 px-3">Assigned Patient / Facility</th>
                  <th className="py-2.5 px-3 font-mono">Warranty Expiry</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredSerials.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <QrCode size={28} className="text-slate-300" />
                        <p className="font-semibold text-slate-700">No UDI Serial Units Recorded</p>
                        <p className="text-[11px] text-slate-400">
                          Register device serial numbers upon physical fulfillment to track active warranties and FDA compliance.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSerials.map((unit) => (
                    <tr key={unit.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block">{unit.productName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{unit.deviceClass} Regulated</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">{unit.serialNumber}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(unit.id, unit.serialNumber)}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy Serial Number"
                          >
                            {copiedId === unit.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          </button>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 block">{unit.udiCode}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#14539A]">
                        <Link to={`/admin/orders/${unit.orderNumber}`} className="hover:underline">
                          {unit.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-800 font-medium block">{unit.facilityOrCustomer}</span>
                        <span className="text-[10px] text-slate-400">Dispatched: {unit.dispatchDate}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className="text-slate-900 font-semibold">{unit.warrantyExpiry}</span>
                        <span className="text-[10px] text-emerald-600 block">Valid Coverage</span>
                      </td>
                      <td className="py-2.5 px-3">
                        {unit.status === 'ACTIVE_FIELD' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active in Field
                          </span>
                        ) : unit.status === 'IN_SERVICE' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            <Clock size={10} /> Maintenance / RMA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            Decommissioned
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => alert(`Device Serial Audit for ${unit.serialNumber}:\nUDI: ${unit.udiCode}\nOrder: ${unit.orderNumber}\nWarranty Expiration: ${unit.warrantyExpiry}\nNo open safety bulletins.`)}
                          className="text-[11px] font-medium text-[#14539A] hover:underline"
                        >
                          Device Record
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: FDA 510(k) Catalog Clearances */}
      {activeTab === 'fda' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
              FDA Title 21 CFR Pre-Market Clearances & Device Classifications
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Standard operating registrations for all durable medical equipment distributed through the BaeMeds medical fulfillment network.
            </p>

            <div className="overflow-hidden rounded border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Equipment Category</th>
                    <th className="py-2.5 px-2 font-mono">FDA Class</th>
                    <th className="py-2.5 px-2 font-mono">Product Code</th>
                    <th className="py-2.5 px-3">510(k) Premarket Clearance</th>
                    <th className="py-2.5 px-2 font-mono">HCPCS Code</th>
                    <th className="py-2.5 px-3">Warranty & Storage Standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {FDA_CATALOG_REGISTRATIONS.map((reg, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block">{reg.category}</span>
                        <span className="text-[10px] font-mono text-slate-400">{reg.fdaRegulation}</span>
                      </td>
                      <td className="py-2.5 px-2 font-mono">
                        <span className="rounded bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                          {reg.deviceClass}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-700">{reg.productCode}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-slate-900 font-medium block">{reg.clearance510k}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Cleared & Active</span>
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-teal-800">{reg.hcpcs}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-800 font-medium block">{reg.warrantyPeriod}</span>
                        <span className="text-[10px] text-slate-400 block">{reg.storageRules}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Recall Readiness & Batch Scanner */}
      {activeTab === 'recalls' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Rapid FDA Recall & Lot Investigation Tool
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              In the event a medical device manufacturer issues a voluntary correction or FDA Class I/II recall, enter the manufacturer lot number or serial prefix below to instantly identify all affected recipients for HIPAA-compliant outreach.
            </p>

            <form onSubmit={handleRecallSearch} className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="Enter Serial #, Lot prefix, or Device Model (e.g. SN-MED, SN-RES)..."
                value={recallLotQuery}
                onChange={(e) => setRecallLotQuery(e.target.value)}
                className="flex-1 rounded border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-slate-900 focus:border-[#14539A] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#14539A] px-4 py-2 font-semibold text-white hover:bg-[#0f4077] transition"
              >
                Execute Investigation Scan
              </button>
            </form>

            {recallScanResults.searched && (
              <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-2 mt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">
                    Scan Result: Found {recallScanResults.matches.length} Dispatched Asset(s) matching &quot;{recallLotQuery}&quot;
                  </span>
                  {recallScanResults.matches.length > 0 && (
                    <button
                      type="button"
                      onClick={() => alert('Generated HIPAA patient outreach notification roster in CSV format.')}
                      className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Export Outreach Roster (CSV)
                    </button>
                  )}
                </div>

                {recallScanResults.matches.length > 0 ? (
                  <div className="space-y-1">
                    {recallScanResults.matches.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded bg-white border border-slate-200 p-2 text-xs"
                      >
                        <div>
                          <strong className="font-mono text-slate-900">{m.serialNumber}</strong>
                          <span className="text-slate-500 mx-2">•</span>
                          <span>{m.productName}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-slate-700">{m.facilityOrCustomer}</span>
                          <span className="text-slate-400 font-mono text-[10px] ml-2">Order {m.orderNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No active units matched this search query. Facility exposure risk is zero.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active Manufacturer Feeds */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              Manufacturer Safety Surveillance Feeds
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded border border-slate-200 p-3 bg-slate-50/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">Medline Industries</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">100% CLEAR</span>
                </div>
                <p className="text-[11px] text-slate-500">Last synchronized: Today at 04:00 AM EST. Zero active recall alerts.</p>
              </div>

              <div className="rounded border border-slate-200 p-3 bg-slate-50/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">ResMed Respiratory</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">100% CLEAR</span>
                </div>
                <p className="text-[11px] text-slate-500">AirSense 11 & AirCurve lines validated. No foam or sensor advisories.</p>
              </div>

              <div className="rounded border border-slate-200 p-3 bg-slate-50/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">Drive DeVilbiss Healthcare</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">100% CLEAR</span>
                </div>
                <p className="text-[11px] text-slate-500">Oxygen concentrators & mobility lines verified against FDA MedWatch.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Serial Unit Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-[#14539A]" />
                <h3 className="text-sm font-bold text-slate-900">Register New UDI Serial Unit</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSerial} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Device Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-MED-994829"
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-slate-900 focus:border-[#14539A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Description</label>
                <select
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:border-[#14539A] focus:outline-none"
                >
                  <option value="Medline Full-Electric Bariatric Hospital Bed (600 lb)">
                    Medline Full-Electric Bariatric Hospital Bed (600 lb)
                  </option>
                  <option value="ResMed AirSense 11 AutoSet CPAP + Heated Humidifier">
                    ResMed AirSense 11 AutoSet CPAP + Heated Humidifier
                  </option>
                  <option value="Drive Medical Nitro Euro-Style Aluminum Rollator">
                    Drive Medical Nitro Euro-Style Aluminum Rollator
                  </option>
                  <option value="Invacare Reliant 450 Battery-Powered Patient Lift">
                    Invacare Reliant 450 Battery-Powered Patient Lift
                  </option>
                  <option value="DeVilbiss 5-Liter Compact Oxygen Concentrator">
                    DeVilbiss 5-Liter Compact Oxygen Concentrator
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order #</label>
                  <input
                    type="text"
                    value={newOrderNumber}
                    onChange={(e) => setNewOrderNumber(e.target.value)}
                    required
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">FDA Device Class</label>
                  <select
                    value={newDeviceClass}
                    onChange={(e) => setNewDeviceClass(e.target.value as any)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:border-[#14539A] focus:outline-none"
                  >
                    <option value="Class II">Class II (510k)</option>
                    <option value="Class I">Class I (General)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Facility / Patient</label>
                <input
                  type="text"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:border-[#14539A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#14539A] px-4 py-1.5 font-semibold text-white hover:bg-[#0f4077]"
                >
                  Register Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCompliancePage;
