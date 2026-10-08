import React, { useState, useEffect } from 'react';
import {
  FileText,
  Building,
  CheckCircle,
  Save,
  RotateCcw,
  Printer,
  ShieldCheck,
  CreditCard,
  QrCode,
  Eye,
  Hash,
  AlertCircle,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  InvoiceSettings,
  DEFAULT_INVOICE_SETTINGS,
  getInvoiceSettings,
  saveInvoiceSettings,
} from '../../lib/invoiceConfig';

export const AdminInvoiceSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState<'invoice' | 'packingslip' | 'cms1500'>('invoice');
  const [activeTab, setActiveTab] = useState<'company' | 'remit' | 'toggles' | 'payment' | 'disclaimers'>('company');

  useEffect(() => {
    setSettings(getInvoiceSettings());
  }, []);

  const handleUpdate = <K extends keyof InvoiceSettings>(key: K, value: InvoiceSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveInvoiceSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all invoice and packing slip customizations back to clinical defaults?')) {
      setSettings(DEFAULT_INVOICE_SETTINGS);
      saveInvoiceSettings(DEFAULT_INVOICE_SETTINGS);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handlePrintSample = () => {
    window.print();
  };

  // Mock order items for live invoice preview
  const sampleItems = [
    {
      name: 'Medline Full-Electric Bariatric Hospital Bed (600 lb Cap)',
      sku: 'MED-BED-600B',
      hcpcs: 'E0260',
      serial: 'SN-MED-994821',
      qty: 1,
      price: 1849.0,
      total: 1849.0,
    },
    {
      name: 'ResMed AirSense 11 AutoSet CPAP + Heated Humidifier',
      sku: 'RES-CPAP-11A',
      hcpcs: 'E0601',
      serial: 'SN-RES-441029',
      qty: 1,
      price: 899.0,
      total: 899.0,
    },
    {
      name: 'Drive Medical Nitro Euro-Style Aluminum Rollator',
      sku: 'DRV-NITRO-BLK',
      hcpcs: 'E0143',
      serial: 'SN-DRV-102948',
      qty: 2,
      price: 249.5,
      total: 499.0,
    },
  ];

  const subtotal = sampleItems.reduce((acc, it) => acc + it.total, 0);
  const tax = subtotal * 0.06;
  const shipping = 0.0;
  const grandTotal = subtotal + tax + shipping;

  return (
    <div className="space-y-5 pb-16 max-w-[1600px] mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#14539A] text-white">
              <FileText size={15} />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Invoice & Documentation Customizer
            </h1>
            <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-700">
              DMEPOS Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure legal remit-to headers, Medicare NPI/PTAN identifiers, HCPCS billing codes, and real-time print layouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handlePrintSample}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Printer size={13} />
            <span>Print Sample</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="flex items-center gap-1.5 rounded-lg bg-[#14539A] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0f4077] transition"
          >
            <Save size={13} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          <CheckCircle size={15} />
          <span>Invoice & packing slip preferences saved successfully. Orders and print modals will immediately use these defaults.</span>
        </div>
      )}

      {/* Main Grid: Studio Editor (Left) & Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Studio (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Section Navigation Tabs */}
          <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('company')}
              className={`flex-1 rounded py-1.5 px-2 font-medium transition ${
                activeTab === 'company'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Company & NPI
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('remit')}
              className={`flex-1 rounded py-1.5 px-2 font-medium transition ${
                activeTab === 'remit'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Remittance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('toggles')}
              className={`flex-1 rounded py-1.5 px-2 font-medium transition ${
                activeTab === 'toggles'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fields & Codes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`flex-1 rounded py-1.5 px-2 font-medium transition ${
                activeTab === 'payment'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Banking & Net
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('disclaimers')}
              className={`flex-1 rounded py-1.5 px-2 font-medium transition ${
                activeTab === 'disclaimers'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disclaimers
            </button>
          </div>

          {/* Tab 1: Company & Regulatory Identifiers */}
          {activeTab === 'company' && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building size={15} className="text-[#14539A]" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Corporate & Provider Registration
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Storefront Display Brand
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => handleUpdate('companyName', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Legal Entity (Operating LLC/Corp)
                  </label>
                  <input
                    type="text"
                    value={settings.legalEntity}
                    onChange={(e) => handleUpdate('legalEntity', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Appears on remit memos, checks, and legal liability footers.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Clinical Tagline / Category Subhead
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => handleUpdate('tagline', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Federal EIN / Tax ID
                    </label>
                    <input
                      type="text"
                      value={settings.einTaxId}
                      onChange={(e) => handleUpdate('einTaxId', e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-slate-900 focus:border-[#14539A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      State DME License #
                    </label>
                    <input
                      type="text"
                      value={settings.dmeLicenseNumber}
                      onChange={(e) => handleUpdate('dmeLicenseNumber', e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-slate-900 focus:border-[#14539A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      NPPES NPI Number
                    </label>
                    <input
                      type="text"
                      value={settings.npiNumber}
                      onChange={(e) => handleUpdate('npiNumber', e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-slate-900 focus:border-[#14539A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Medicare DMEPOS PTAN #
                    </label>
                    <input
                      type="text"
                      value={settings.medicarePtan}
                      onChange={(e) => handleUpdate('medicarePtan', e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-slate-900 focus:border-[#14539A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Custom Logo URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://yourdomain.com/logo.png"
                    value={settings.logoUrl || ''}
                    onChange={(e) => handleUpdate('logoUrl', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Leave blank to use the high-contrast BaeMeds clinical brandmark.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Remittance & Physical Address */}
          {activeTab === 'remit' && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building size={15} className="text-[#14539A]" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Remittance & Contact Coordinates
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Remit-To Address Line 1
                  </label>
                  <input
                    type="text"
                    value={settings.remitAddressLine1}
                    onChange={(e) => handleUpdate('remitAddressLine1', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Address Line 2 (Department / Suite)
                  </label>
                  <input
                    type="text"
                    value={settings.remitAddressLine2}
                    onChange={(e) => handleUpdate('remitAddressLine2', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City, State, Zip Code
                  </label>
                  <input
                    type="text"
                    value={settings.remitCityStateZip}
                    onChange={(e) => handleUpdate('remitCityStateZip', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Billing Phone / Hotline
                    </label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => handleUpdate('phone', e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-900 focus:border-[#14539A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Billing Department Email
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleUpdate('email', e.target.value)}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-900 focus:border-[#14539A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Storefront Website Domain
                  </label>
                  <input
                    type="text"
                    value={settings.website}
                    onChange={(e) => handleUpdate('website', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Display Fields & Healthcare Codes */}
          {activeTab === 'toggles' && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Hash size={15} className="text-[#14539A]" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Healthcare Fields & Code Visibilities
                </h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <label className="flex items-center justify-between rounded border border-slate-200 p-2.5 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Show HCPCS Medicare Billing Codes</span>
                    <span className="text-[11px] text-slate-500">Prints insurance reimbursement codes (e.g. E0260, E0601).</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showHcpcsCodes}
                    onChange={(e) => handleUpdate('showHcpcsCodes', e.target.checked)}
                    className="h-4 w-4 rounded text-[#14539A] focus:ring-[#14539A]"
                  />
                </label>

                <label className="flex items-center justify-between rounded border border-slate-200 p-2.5 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Show Item SKUs & Catalog Numbers</span>
                    <span className="text-[11px] text-slate-500">Displays internal warehouse SKU under each equipment line item.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showSku}
                    onChange={(e) => handleUpdate('showSku', e.target.checked)}
                    className="h-4 w-4 rounded text-[#14539A] focus:ring-[#14539A]"
                  />
                </label>

                <label className="flex items-center justify-between rounded border border-slate-200 p-2.5 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Show Device Serial & UDI Numbers</span>
                    <span className="text-[11px] text-slate-500">Required for FDA recall traceability and manufacturer warranty.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showSerialNumbers}
                    onChange={(e) => handleUpdate('showSerialNumbers', e.target.checked)}
                    className="h-4 w-4 rounded text-[#14539A] focus:ring-[#14539A]"
                  />
                </label>

                <label className="flex items-center justify-between rounded border border-slate-200 p-2.5 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Render Tracking Barcode / QR Matrix</span>
                    <span className="text-[11px] text-slate-500">Displays optical scannable barcode for courier and warehouse receiving.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showBarcodes}
                    onChange={(e) => handleUpdate('showBarcodes', e.target.checked)}
                    className="h-4 w-4 rounded text-[#14539A] focus:ring-[#14539A]"
                  />
                </label>

                <label className="flex items-center justify-between rounded border border-slate-200 p-2.5 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Include Prescribing Physician / Referral Block</span>
                    <span className="text-[11px] text-slate-500">Adds clinical provider and clinic referral accreditation field.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showPhysicianBlock}
                    onChange={(e) => handleUpdate('showPhysicianBlock', e.target.checked)}
                    className="h-4 w-4 rounded text-[#14539A] focus:ring-[#14539A]"
                  />
                </label>

                <label className="flex items-center justify-between rounded border border-slate-200 p-2.5 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">Include Delivery Receipt Signature Line</span>
                    <span className="text-[11px] text-slate-500">Physical signature acknowledgment for DME received in good order.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showSignatureLine}
                    onChange={(e) => handleUpdate('showSignatureLine', e.target.checked)}
                    className="h-4 w-4 rounded text-[#14539A] focus:ring-[#14539A]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tab 4: Banking, Wire & Net Terms */}
          {activeTab === 'payment' && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <CreditCard size={15} className="text-[#14539A]" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Payment Terms & Bank Remittance Instructions
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Invoice Terms Description
                  </label>
                  <textarea
                    rows={2}
                    value={settings.paymentTerms}
                    onChange={(e) => handleUpdate('paymentTerms', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">E.g. Due upon receipt or Net 30 for hospital procurement.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ACH / Electronic Wire Transfer Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={settings.bankRoutingInfo}
                    onChange={(e) => handleUpdate('bankRoutingInfo', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 font-mono text-[11px] text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Check Payable To & Mailing Memo
                  </label>
                  <input
                    type="text"
                    value={settings.checkPayableTo}
                    onChange={(e) => handleUpdate('checkPayableTo', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Clinical & Legal Disclaimers */}
          {activeTab === 'disclaimers' && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck size={15} className="text-[#14539A]" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Regulatory Footers & Clinical Disclaimers
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    FDA Establishment & Licensure Banner
                  </label>
                  <input
                    type="text"
                    value={settings.footerNote}
                    onChange={(e) => handleUpdate('footerNote', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Equipment Manufacturer Warranty Disclaimer
                  </label>
                  <textarea
                    rows={2}
                    value={settings.warrantyDisclaimer}
                    onChange={(e) => handleUpdate('warrantyDisclaimer', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hygiene & Sanitary Return Restriction Policy
                  </label>
                  <textarea
                    rows={2}
                    value={settings.hygienePolicyNotice}
                    onChange={(e) => handleUpdate('hygienePolicyNotice', e.target.value)}
                    className="w-full rounded border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:border-[#14539A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Split-Screen Interactive Document Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Document Preview Header Control */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-100 p-2">
            <div className="flex items-center gap-1">
              <Eye size={14} className="text-slate-500 ml-1" />
              <span className="text-xs font-bold text-slate-700">Live Preview:</span>
            </div>

            <div className="flex items-center gap-1 bg-white rounded border border-slate-200 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('invoice')}
                className={`rounded px-2.5 py-1 font-semibold transition ${
                  previewMode === 'invoice'
                    ? 'bg-[#14539A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Official Medical Invoice
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('packingslip')}
                className={`rounded px-2.5 py-1 font-semibold transition ${
                  previewMode === 'packingslip'
                    ? 'bg-[#14539A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fulfillment Packing Slip
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('cms1500')}
                className={`rounded px-2.5 py-1 font-semibold transition ${
                  previewMode === 'cms1500'
                    ? 'bg-[#14539A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                CMS-1500 Summary
              </button>
            </div>
          </div>

          {/* Authentic Document Canvas */}
          <div
            id="printable-invoice-canvas"
            className="rounded-lg border border-slate-300 bg-white p-7 shadow-md font-sans text-slate-900 space-y-6"
          >
            {/* Document Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-950 uppercase">
                    {settings.companyName}
                  </span>
                  <span className="rounded bg-teal-100 border border-teal-200 px-2 py-0.5 text-[9px] font-mono font-bold text-teal-900 uppercase">
                    DMEPOS Clinical
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-700">{settings.tagline}</p>
                <p className="text-[11px] text-slate-500">
                  {settings.remitAddressLine1}{settings.remitAddressLine2 ? `, ${settings.remitAddressLine2}` : ''} | {settings.remitCityStateZip}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Tel: {settings.phone} | Billing: {settings.email} | {settings.website}
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono text-slate-500">
                  <span>EIN: <strong>{settings.einTaxId}</strong></span>
                  <span>•</span>
                  <span>Lic: <strong>{settings.dmeLicenseNumber}</strong></span>
                  <span>•</span>
                  <span>NPI: <strong>{settings.npiNumber}</strong></span>
                  <span>•</span>
                  <span>PTAN: <strong>{settings.medicarePtan}</strong></span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-base font-black uppercase tracking-wider text-slate-900 block">
                  {previewMode === 'invoice'
                    ? 'TAX INVOICE'
                    : previewMode === 'packingslip'
                    ? 'PACKING SLIP'
                    : 'CMS-1500 DME STATEMENT'}
                </span>
                <p className="text-xs font-mono font-bold text-[#14539A]">
                  DOC #: BM-INV-2026-9042
                </p>
                <p className="text-[11px] text-slate-600">
                  Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-[11px] text-slate-600">
                  Order Reference: <strong className="font-mono">BM-10492-US</strong>
                </p>
                {settings.showBarcodes && (
                  <div className="pt-1 flex flex-col items-end">
                    <div className="flex items-center gap-0.5 h-6">
                      <div className="w-1 h-full bg-slate-900" />
                      <div className="w-0.5 h-full bg-slate-900" />
                      <div className="w-1.5 h-full bg-slate-900" />
                      <div className="w-0.5 h-full bg-slate-900" />
                      <div className="w-2 h-full bg-slate-900" />
                      <div className="w-1 h-full bg-slate-900" />
                      <div className="w-0.5 h-full bg-slate-900" />
                      <div className="w-1 h-full bg-slate-900" />
                      <div className="w-2 h-full bg-slate-900" />
                      <div className="w-0.5 h-full bg-slate-900" />
                      <div className="w-1 h-full bg-slate-900" />
                    </div>
                    <span className="text-[8px] font-mono text-slate-400">BM10492US-UDI</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recipient & Billing Entity Addresses */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded border border-slate-200 p-3 bg-slate-50/60 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider block">
                  Bill-To / Patient Record
                </span>
                <p className="font-bold text-slate-900">Mercy Hospital & Rehabilitation Center</p>
                <p className="text-slate-600">Attn: Central Clinical Supply (Room 402)</p>
                <p className="text-slate-600">700 Lea Blvd, Wilmington, DE 19802</p>
                <p className="text-slate-500 font-mono text-[11px]">Phone: (302) 764-5500</p>
              </div>

              <div className="rounded border border-slate-200 p-3 bg-slate-50/60 space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider block">
                  Remit Payment To
                </span>
                <p className="font-bold text-slate-900">{settings.legalEntity}</p>
                <p className="text-slate-600">{settings.remitAddressLine2}</p>
                <p className="text-slate-600">{settings.remitAddressLine1}</p>
                <p className="text-slate-600">{settings.remitCityStateZip}</p>
              </div>
            </div>

            {/* Optional Physician / Referral Block */}
            {settings.showPhysicianBlock && (
              <div className="rounded border border-slate-200 bg-slate-50/40 p-2.5 text-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                    Attending Physician / Referral
                  </span>
                  <span className="font-semibold text-slate-800">Dr. Sarah Jenkins, MD (Physical Medicine & Rehab)</span>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-500">
                  <span>Physician NPI: <strong>1487291041</strong></span>
                  <span className="mx-2">•</span>
                  <span>Order Prescription Status: <strong>Verified</strong></span>
                </div>
              </div>
            )}

            {/* Equipment Line Items Table */}
            <div className="overflow-hidden rounded border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-100 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Description & Clinical Equipment</th>
                    {settings.showHcpcsCodes && <th className="py-2.5 px-2 font-mono">HCPCS</th>}
                    {settings.showSku && <th className="py-2.5 px-2 font-mono">SKU</th>}
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    {previewMode !== 'packingslip' && <th className="py-2.5 px-3 text-right">Unit Price</th>}
                    {previewMode !== 'packingslip' && <th className="py-2.5 px-3 text-right">Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {sampleItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block">{item.name}</span>
                        {settings.showSerialNumbers && (
                          <span className="text-[10px] font-mono text-indigo-700">
                            Serial: <strong>{item.serial}</strong>
                          </span>
                        )}
                      </td>
                      {settings.showHcpcsCodes && (
                        <td className="py-2.5 px-2 font-mono font-semibold text-teal-800">
                          {item.hcpcs}
                        </td>
                      )}
                      {settings.showSku && (
                        <td className="py-2.5 px-2 font-mono text-slate-500">
                          {item.sku}
                        </td>
                      )}
                      <td className="py-2.5 px-2 text-center font-bold">{item.qty}</td>
                      {previewMode !== 'packingslip' && (
                        <td className="py-2.5 px-3 text-right font-mono">${item.price.toFixed(2)}</td>
                      )}
                      {previewMode !== 'packingslip' && (
                        <td className="py-2.5 px-3 text-right font-mono font-bold">${item.total.toFixed(2)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Payment Instructions */}
            {previewMode !== 'packingslip' && (
              <div className="grid grid-cols-2 gap-4 items-start pt-2">
                {/* Left: Terms & Banking */}
                <div className="rounded border border-slate-200 bg-slate-50/60 p-3 text-xs space-y-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                      Payment & Credit Terms
                    </span>
                    <p className="text-slate-700 font-medium">{settings.paymentTerms}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                      Electronic Bank Remittance (ACH)
                    </span>
                    <p className="text-[11px] font-mono text-slate-800">{settings.bankRoutingInfo}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                      Payable To
                    </span>
                    <p className="text-slate-800 font-semibold">{settings.checkPayableTo}</p>
                  </div>
                </div>

                {/* Right: Subtotal & Tax Calculation */}
                <div className="space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Sales Tax (6%):</span>
                    <span className="font-mono font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Insured Freight / White-Glove:</span>
                    <span className="font-mono font-medium text-emerald-700">COMPLIMENTARY</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-bold text-slate-900">
                    <span>Amount Due (USD):</span>
                    <span className="font-mono text-base font-black text-[#14539A]">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Signature Line */}
            {settings.showSignatureLine && (
              <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-8 text-xs text-slate-600">
                <div>
                  <div className="border-b border-slate-400 h-8" />
                  <span className="text-[10px] uppercase font-mono block mt-1">
                    Delivered By (Courier / Freight Specialist) • Signature & Date
                  </span>
                </div>
                <div>
                  <div className="border-b border-slate-400 h-8" />
                  <span className="text-[10px] uppercase font-mono block mt-1">
                    Received in Good Order (Patient / Clinical Facility Agent) • Date
                  </span>
                </div>
              </div>
            )}

            {/* Disclaimers & Footers */}
            <div className="border-t border-slate-200 pt-3 space-y-1 text-[10px] text-slate-500">
              <p className="font-semibold text-slate-700">{settings.footerNote}</p>
              <p>{settings.warrantyDisclaimer}</p>
              <p className="italic text-slate-400">{settings.hygienePolicyNotice}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceSettingsPage;
