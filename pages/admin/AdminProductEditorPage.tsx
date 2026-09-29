import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  DollarSign,
  Tag,
  Layers,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { Link, useParams, useNavigate } from '../../context/CartContext';
import { Product } from '../../types';

export const AdminProductEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Durable Medical Equipment');
  const [price, setPrice] = useState<number>(0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(undefined);
  const [image, setImage] = useState('');
  const [hcpcsCode, setHcpcsCode] = useState('');
  const [fdaClassification, setFdaClassification] = useState('Class II');
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [fsaEligible, setFsaEligible] = useState(true);
  const [isRegulatoryVerified, setIsRegulatoryVerified] = useState(true);
  const [warranty, setWarranty] = useState('3-Year Manufacturer Warranty');

  useEffect(() => {
    if (!isNew && id) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const prod = await AdminApiClient.getProduct(id);
          if (prod) {
            setTitle(prod.title || '');
            setHandle(prod.handle || '');
            setDescription(prod.description || '');
            setCategory(prod.category || 'Durable Medical Equipment');
            setPrice(prod.price || 0);
            setCompareAtPrice(prod.compareAtPrice);
            setImage(prod.image || '');
            setHcpcsCode(prod.hcpcsCode || '');
            setFdaClassification(prod.fdaClassification || 'Class II');
            setPrescriptionRequired(Boolean(prod.prescriptionRequired));
            setFsaEligible(Boolean(prod.fsaEligible ?? true));
            setIsRegulatoryVerified(Boolean(prod.isRegulatoryVerified ?? true));
            setWarranty(prod.warranty || '3-Year Manufacturer Warranty');
          } else {
            setErrorMessage(`Product with ID "${id}" could not be found.`);
          }
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to fetch product');
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isNew]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (isNew) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setHandle(slug);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim()) {
      setErrorMessage('Product title is required.');
      return;
    }

    if (isNaN(price) || price < 0) {
      setErrorMessage('Please provide a valid non-negative product price.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Product> = {
        id: isNew ? undefined : id,
        title,
        handle: handle.trim() || undefined,
        description,
        category,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        image: image || 'https://placehold.co/600x600?text=DME+Equipment',
        hcpcsCode: hcpcsCode.trim() || undefined,
        fdaClassification: fdaClassification || undefined,
        prescriptionRequired,
        fsaEligible,
        isRegulatoryVerified,
        warranty,
      };

      const saved = await AdminApiClient.saveProduct(payload);
      setSuccessMessage(`Product "${saved.title}" saved successfully. All pricing mutations audited.`);
      if (isNew && saved.id) {
        setTimeout(() => {
          navigate(`/admin/products/${saved.id}`);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product. Check role permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
          <span>Loading product details...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {isNew ? 'New Medical Product' : title || 'Edit Product'}
            </h1>
            <p className="text-xs text-slate-500">
              {isNew ? 'Create a new authoritative catalog item' : `Editing catalog ID: ${id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/products"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white shadow-soft hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Product'}
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
          <button type="button" onClick={() => setErrorMessage('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Core Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Details Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-medical-primary" />
              General Details
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. Philips EverFlo Oxygen Concentrator 5L"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Handle / Slug
              </label>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 text-xs overflow-hidden">
                <span className="bg-slate-100 px-3 py-2.5 text-slate-500 border-r border-slate-200">
                  /products/
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="philips-everflo-oxygen-concentrator-5l"
                  className="flex-1 bg-transparent px-3 py-2.5 text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & Clinical Summary
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide medical equipment specifications, operational parameters, indications for use..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} className="text-medical-primary" />
              Authoritative Pricing
            </h2>
            <p className="text-xs text-slate-500">
              Only authorized administrators can modify catalog prices. Every change is logged to the immutable audit trail.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Price ($ USD) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-xs font-bold text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Compare-At Price ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtPrice !== undefined ? compareAtPrice : ''}
                    onChange={(e) =>
                      setCompareAtPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="e.g. 1650.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-xs text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Media Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={16} className="text-medical-primary" />
              Primary Image & Media
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Image CDN URL
              </label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
              />
            </div>

            {image && (
              <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <img
                  src={image}
                  alt="Preview"
                  className="h-20 w-20 rounded-lg object-contain border border-slate-200 bg-white p-1"
                />
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-900">Featured Image Preview</p>
                  <p className="text-[11px] text-slate-400">High-resolution DME product asset</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Healthcare / Regulatory & Organization */}
        <div className="space-y-6">
          {/* Healthcare Regulatory Compliance */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-blue-950 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600" />
              US Healthcare & FDA Rules
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                HCPCS Reimbursement Code
              </label>
              <input
                type="text"
                value={hcpcsCode}
                onChange={(e) => setHcpcsCode(e.target.value.toUpperCase())}
                placeholder="e.g. E1390, E0601, A7030"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Standardized Healthcare Common Procedure Coding System code.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                FDA Device Classification
              </label>
              <select
                value={fdaClassification}
                onChange={(e) => setFdaClassification(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="Class I">Class I (General Controls)</option>
                <option value="Class II">Class II (Special Controls - DME / CPAP)</option>
                <option value="Class III">Class III (Premarket Approval)</option>
                <option value="Exempt">FDA Exempt</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prescriptionRequired}
                  onChange={(e) => setPrescriptionRequired(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">Prescription Required (Rx)</span>
                  <p className="text-[11px] text-slate-500">
                    Forces clinical review and valid physician NPI verification before order fulfillment.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fsaEligible}
                  onChange={(e) => setFsaEligible(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">FSA / HSA Eligible</span>
                  <p className="text-[11px] text-slate-500">
                    Permits payment using flexible spending and health savings accounts.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRegulatoryVerified}
                  onChange={(e) => setIsRegulatoryVerified(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-medical-primary focus:ring-medical-primary"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">Regulatory Verified</span>
                  <p className="text-[11px] text-slate-500">
                    Complies with Delaware Division of Public Health DME regulations.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Category & Organization Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-medical-primary" />
              Category & Warranty
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-medical-primary focus:outline-none"
              >
                <option value="Durable Medical Equipment">Durable Medical Equipment</option>
                <option value="Oxygen Concentrators">Oxygen Concentrators</option>
                <option value="Sleep Apnea & CPAP">Sleep Apnea & CPAP</option>
                <option value="Patient Monitoring">Patient Monitoring</option>
                <option value="Mobility Aids">Mobility Aids</option>
                <option value="Respiratory Supplies">Respiratory Supplies</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Warranty Terms
              </label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g. 3-Year Manufacturer Warranty"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:border-medical-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AdminProductEditorPage;
