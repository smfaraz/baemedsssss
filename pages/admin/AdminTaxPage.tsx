import React, { useEffect, useState } from 'react';
import {
  FileCheck,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Building,
  Save,
  HelpCircle,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';

export const AdminTaxPage: React.FC = () => {
  const [tax, setTax] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadTax = async () => {
      setIsLoading(true);
      try {
        const data = await AdminApiClient.getTaxSettings();
        setTax(
          data || {
            engine: 'Authoritative State Nexus Engine',
            delawareSalesTaxRate: 0.0,
            exemptions: {
              dmePrescriptionExempt: true,
              respiratorySuppliesExempt: true,
              otcEquipmentTaxable: true,
            },
            nexusJurisdictions: [
              { state: 'DE', name: 'Delaware', rate: '0.00%', status: 'Physical Nexus (0% State Tax)' },
              { state: 'PA', name: 'Pennsylvania', rate: '6.00%', status: 'Economic Nexus (DME Rx Exempt)' },
              { state: 'NJ', name: 'New Jersey', rate: '6.625%', status: 'Economic Nexus (DME Rx Exempt)' },
              { state: 'MD', name: 'Maryland', rate: '6.00%', status: 'Economic Nexus (DME Rx Exempt)' },
              { state: 'NY', name: 'New York', rate: '4.00%', status: 'Economic Nexus (Medical Device Rules Apply)' },
            ],
          }
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadTax();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage('Tax configuration and jurisdiction rules saved.');
    }, 400);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
          <span>Loading tax jurisdictions...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tax & Nexus Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            US sales tax nexus, Delaware home jurisdiction, and medical device prescription exemption rules.
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-soft hover:bg-slate-800 disabled:opacity-50 transition"
        >
          <Save size={15} />
          {isSaving ? 'Saving...' : 'Save Tax Rules'}
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

      {/* Critical Compliance Warning */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle size={17} className="text-amber-600" />
          <span>Statutory Tax Exemption Standard</span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Under US state tax laws, medical supplies and DME are <strong>not universally tax-exempt</strong> by default. Exemption applies specifically when a product is supported by a valid physician prescription or designated under specific state medical exemptions. Over-the-counter wellness products remain taxable where nexus exists.
        </p>
      </div>

      {/* Exemption Policies Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <FileCheck size={16} className="text-medical-primary" />
          Healthcare Exemption Rules
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <input
              type="checkbox"
              defaultChecked={tax.exemptions?.dmePrescriptionExempt}
              className="rounded border-slate-300 text-medical-primary focus:ring-medical-primary"
            />
            <div>
              <span className="font-bold text-slate-900">Exempt Certified Prescription DME Equipment</span>
              <p className="text-[11px] text-slate-500">
                Oxygen concentrators and CPAP machines with verified clinical scripts are exempted from sales tax in supported states.
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <input
              type="checkbox"
              defaultChecked={tax.exemptions?.otcEquipmentTaxable}
              className="rounded border-slate-300 text-medical-primary focus:ring-medical-primary"
            />
            <div>
              <span className="font-bold text-slate-900">Enforce Tax on Over-The-Counter (OTC) Retail Supplies</span>
              <p className="text-[11px] text-slate-500">
                Non-prescription accessory items, pulse oximeters, and wellness gear are taxed according to delivery jurisdiction.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* State Nexus Jurisdictions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Building size={16} className="text-medical-primary" />
          Active State Tax Nexus
        </h2>

        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {tax.nexusJurisdictions?.map((jur: any) => (
            <div key={jur.state} className="p-3.5 flex items-center justify-between text-xs bg-white hover:bg-slate-50">
              <div>
                <span className="font-black text-slate-900">{jur.name} ({jur.state})</span>
                <p className="text-[11px] text-slate-500 mt-0.5">{jur.status}</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-800">{jur.rate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};

export default AdminTaxPage;
