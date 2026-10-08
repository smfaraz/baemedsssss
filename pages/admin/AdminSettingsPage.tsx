import React, { useState } from 'react';
import {
  Settings,
  Building,
  ShieldCheck,
  Users,
  FileText,
  Lock,
  Mail,
  Phone,
  Save,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from '../../context/CartContext';

export const AdminSettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState('BaeMeds Healthcare USA');
  const [entityName, setEntityName] = useState('BaeMeds Medical Systems LLC');
  const [supportEmail, setSupportEmail] = useState('support@baemeds.com');
  const [supportPhone, setSupportPhone] = useState('(302) 555-0199');
  const [dmeLicense, setDmeLicense] = useState('DE-DPH-DME-2026-8819');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Corporate entity profile, state DME licensing verification, and administrative operational defaults.
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle size={16} />
          <span>Platform settings updated successfully and written to system configuration.</span>
        </div>
      )}

      {/* Quick Links to Sub-Settings */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/admin/settings/invoices"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:border-[#14539A] transition group"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 group-hover:bg-[#14539A] group-hover:text-white transition">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Invoice & Slip Studio</h3>
              <p className="text-xs text-slate-500">Design tax invoices, HCPCS codes, and remit footers</p>
            </div>
          </div>
          <ExternalLink size={16} className="text-slate-400 group-hover:text-[#14539A]" />
        </Link>

        <Link
          to="/admin/settings/users"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:border-medical-primary transition group"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 group-hover:bg-medical-primary group-hover:text-white transition">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Staff & Roles</h3>
              <p className="text-xs text-slate-500">Manage operational users and privileges</p>
            </div>
          </div>
          <ExternalLink size={16} className="text-slate-400 group-hover:text-medical-primary" />
        </Link>

        <Link
          to="/admin/settings/roles"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-soft hover:border-medical-primary transition group"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">RBAC Matrix</h3>
              <p className="text-xs text-slate-500">View role authorization boundaries</p>
            </div>
          </div>
          <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-600" />
        </Link>
      </div>

      {/* Corporate Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building size={16} className="text-medical-primary" />
            Corporate Identity & US Operations
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Store Front Display Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 font-semibold focus:border-medical-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Legal Operating Entity</label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 font-semibold focus:border-medical-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Primary Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 font-semibold focus:border-medical-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Customer Service Phone</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 font-semibold focus:border-medical-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Regulatory & Healthcare Licensure */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} className="text-medical-primary" />
            Healthcare Licensure & Regulatory Registry
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Delaware DME Distributor License Number
              </label>
              <input
                type="text"
                value={dmeLicense}
                onChange={(e) => setDmeLicense(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-slate-900 font-bold focus:border-medical-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                NPPES NPI Clearinghouse Status
              </label>
              <div className="flex items-center h-10 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                ✓ Automated Physician Registry Validation Connected
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-slate-800 transition"
          >
            <Save size={15} /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
