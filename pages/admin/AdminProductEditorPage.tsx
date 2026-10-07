import React, { useEffect, useState, useMemo } from 'react';
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
  Star,
  Barcode,
  Package,
  Globe,
  TrendingUp,
  Percent,
  X,
  Sparkles,
  Info,
  Building2,
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

  // 1. General Info
  const [title, setTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('Inogen');
  const [category, setCategory] = useState('Oxygen Concentrators');

  // 2. Pricing & Margins
  const [price, setPrice] = useState<number>(0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(undefined);
  const [costPerItem, setCostPerItem] = useState<number | undefined>(undefined);
  const [dealerPrice, setDealerPrice] = useState<number | undefined>(undefined);

  // 3. Inventory & Dropshipping Identifiers
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [mckessonItemNumber, setMckessonItemNumber] = useState('');
  const [inventoryQuantity, setInventoryQuantity] = useState<number>(25);
  const [trackInventory, setTrackInventory] = useState(true);

  // 4. Hero Product Strategy (Top 100 Showcase)
  const [isHeroProduct, setIsHeroProduct] = useState(false);

  // 5. Media & Gallery
  const [image, setImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // 6. Features & Specs
  const [features, setFeatures] = useState<string[]>([
    'Lightweight & travel-friendly design',
    'Approved by the FAA for commercial airline travel',
    'Intelligent oxygen delivery pulse-dose technology',
  ]);
  const [newFeatureText, setNewFeatureText] = useState('');

  // 7. Healthcare & Regulatory
  const [hcpcsCode, setHcpcsCode] = useState('E1390');
  const [fdaClassification, setFdaClassification] = useState('Class II');
  const [prescriptionRequired, setPrescriptionRequired] = useState(true);
  const [fsaEligible, setFsaEligible] = useState(true);
  const [isRegulatoryVerified, setIsRegulatoryVerified] = useState(true);
  const [warranty, setWarranty] = useState('3-Year Manufacturer Warranty');

  // 8. SEO Metadata
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Real-time Financial Margin Calculations
  const profitDollars = useMemo(() => {
    if (!price || !costPerItem) return null;
    return price - costPerItem;
  }, [price, costPerItem]);

  const marginPercentage = useMemo(() => {
    if (!price || !costPerItem || price <= 0) return null;
    return Math.round(((price - costPerItem) / price) * 100);
  }, [price, costPerItem]);

  const dealerMarginPercentage = useMemo(() => {
    if (!price || !dealerPrice || price <= 0) return null;
    return Math.round(((price - dealerPrice) / price) * 100);
  }, [price, dealerPrice]);

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
            setVendor(prod.vendor || 'BaeMeds USA');
            setCategory(prod.category || 'Durable Medical Equipment');
            setPrice(prod.price || 0);
            setCompareAtPrice(prod.compareAtPrice);
            setCostPerItem(prod.wholesaleCost ?? prod.costPerItem ?? undefined);
            setDealerPrice(prod.dealerPrice ?? prod.wholesaleCost ?? prod.costPerItem ?? undefined);

            setSku(prod.sku || `BM-${id.substring(0, 8).toUpperCase()}`);
            setBarcode(prod.barcode || '');
            setMckessonItemNumber(prod.mckessonItemNumber || '');
            setInventoryQuantity(prod.inventoryQuantity !== undefined ? prod.inventoryQuantity : 25);
            setTrackInventory(prod.trackInventory ?? true);

            setIsHeroProduct(Boolean(prod.isHeroProduct));

            setImage(prod.image || '');
            setGalleryImages(prod.images && prod.images.length > 0 ? prod.images : (prod.image ? [prod.image] : []));

            if (prod.features && prod.features.length) {
              setFeatures(prod.features);
            }

            setHcpcsCode(prod.hcpcsCode || '');
            setFdaClassification(prod.fdaClassification || 'Class II');
            setPrescriptionRequired(Boolean(prod.prescriptionRequired));
            setFsaEligible(Boolean(prod.fsaEligible ?? true));
            setIsRegulatoryVerified(Boolean(prod.isRegulatoryVerified ?? true));
            setWarranty(prod.warranty || '3-Year Manufacturer Warranty');

            setSeoTitle(prod.seoTitle || prod.title || '');
            setSeoDescription(prod.seoDescription || (prod.description ? prod.description.substring(0, 155) : ''));
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
      if (!seoTitle) setSeoTitle(val);
    }
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([...features, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryImages([...galleryImages, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
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
        vendor,
        category,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        wholesaleCost: costPerItem ? Number(costPerItem) : (dealerPrice ? Number(dealerPrice) : undefined),
        costPerItem: costPerItem ? Number(costPerItem) : (dealerPrice ? Number(dealerPrice) : undefined),
        dealerPrice: dealerPrice ? Number(dealerPrice) : (costPerItem ? Number(costPerItem) : undefined),
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        mckessonItemNumber: mckessonItemNumber.trim() || undefined,
        inventoryQuantity: Number(inventoryQuantity),
        trackInventory,
        isHeroProduct,
        image: image || (galleryImages[0] ?? 'https://placehold.co/600x600?text=DME+Equipment'),
        images: galleryImages.length > 0 ? galleryImages : (image ? [image] : []),
        features,
        hcpcsCode: hcpcsCode.trim() || undefined,
        fdaClassification: fdaClassification as any || undefined,
        prescriptionRequired,
        fsaEligible,
        isRegulatoryVerified,
        warranty,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
      };

      const saved = await AdminApiClient.saveProduct(payload);
      setSuccessMessage(`Product "${saved.title}" saved successfully. All pricing and dropshipping records updated.`);
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
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span>Loading Shopify-grade product engine...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl pb-16 font-sans">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900">
                {isNew ? 'New Medical Product' : title || 'Edit Product'}
              </h1>
              {isHeroProduct && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800">
                  <Star size={11} className="fill-amber-500 text-amber-500" />
                  Top 100 Hero Item
                </span>
              )}
              {prescriptionRequired && (
                <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  Rx Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isNew ? 'Create a new authoritative catalog item' : `Editing SKU: ${sku || id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/products"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
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
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0 text-emerald-600" />
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
              <FileText size={16} className="text-teal-600" />
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
                placeholder="e.g. Inogen One G5 Portable Oxygen Concentrator System"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL Handle / Slug
              </label>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 text-xs overflow-hidden">
                <span className="bg-slate-100 px-3 py-2.5 text-slate-500 border-r border-slate-200 font-mono text-[11px]">
                  baemeds.com/products/
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="inogen-one-g5-system"
                  className="flex-1 bg-transparent px-3 py-2.5 text-slate-900 focus:outline-none font-mono text-[11px]"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none transition leading-relaxed"
              />
            </div>
          </div>

          {/* Pricing & Profit Intelligence Card (Shopify-Grade) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={16} className="text-teal-600" />
                Pricing & Profit Margin Engine
              </h2>
              {marginPercentage !== null && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                    marginPercentage >= 40
                      ? 'bg-emerald-100 text-emerald-800'
                      : marginPercentage >= 20
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <TrendingUp size={13} />
                  +{profitDollars ? `$${profitDollars.toFixed(2)}` : ''} ({marginPercentage}% Margin)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Set customer selling price and McKesson wholesale cost. Profit and gross margins are calculated instantly.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selling Price ($ USD) <span className="text-rose-500">*</span>
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
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
                    placeholder="e.g. 2195.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Cost per Item (Wholesale)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPerItem !== undefined ? costPerItem : ''}
                    onChange={(e) =>
                      setCostPerItem(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="e.g. 845.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-xs font-bold text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 size={13} className="text-indigo-600" />
                  Dealer Price ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dealerPrice !== undefined ? dealerPrice : ''}
                    onChange={(e) =>
                      setDealerPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="e.g. 1100.00"
                    className="w-full rounded-xl border border-indigo-200 bg-indigo-50/30 py-2.5 pl-8 pr-4 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-indigo-600 font-semibold">Price offered to authorized dealers &amp; distributors</span>
              </div>

              {dealerPrice && price > 0 && (
                <div className="flex items-center">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Dealer Margin</span>
                      <span className={`font-black text-sm ${
                        dealerMarginPercentage !== null && dealerMarginPercentage >= 30
                          ? 'text-emerald-700'
                          : dealerMarginPercentage !== null && dealerMarginPercentage >= 15
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}>
                        {dealerMarginPercentage !== null ? `${dealerMarginPercentage}%` : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-500">Spread (Retail − Dealer)</span>
                      <span className="font-bold text-slate-900">${(price - dealerPrice).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Profit Summary Banner */}
            {price > 0 && costPerItem && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs flex items-center justify-between text-slate-700">
                <span>
                  Customer pays: <strong>${price.toFixed(2)}</strong> • McKesson Dealer Cost:{' '}
                  <strong>${costPerItem.toFixed(2)}</strong>
                </span>
                <span className="font-bold text-emerald-700">
                  Gross Profit: ${((price - costPerItem)).toFixed(2)} per order
                </span>
              </div>
            )}
          </div>

          {/* Inventory & McKesson Dropshipping Identifiers Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package size={16} className="text-teal-600" />
              Inventory & McKesson Dropshipping Identifiers
            </h2>
            <p className="text-xs text-slate-500">
              Crucial codes required to map manual dropshipping orders directly to McKesson Supply Management.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  BaeMeds SKU
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="e.g. BM-OXY-G5"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Barcode (UPC / GTIN)
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. 084792100412"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-mono text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Used for Google Shopping product feed</span>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 flex items-center gap-1 text-teal-800">
                  <Barcode size={13} className="text-teal-600" />
                  McKesson Item #
                </label>
                <input
                  type="text"
                  value={mckessonItemNumber}
                  onChange={(e) => setMckessonItemNumber(e.target.value)}
                  placeholder="e.g. 918274 or 1102934"
                  className="w-full rounded-xl border border-teal-300 bg-teal-50/50 px-4 py-2.5 text-xs font-mono font-black text-teal-950 focus:border-teal-500 focus:bg-white focus:outline-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-teal-600 font-semibold">MMS McKesson catalog code</span>
                  {mckessonItemNumber.trim() && (
                    <a
                      href={`https://mms.mckesson.com/product/${mckessonItemNumber.trim()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 hover:underline"
                    >
                      Verify on mms.mckesson.com <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Track inventory stock count</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Available Stock:</span>
                <input
                  type="number"
                  min="0"
                  value={inventoryQuantity}
                  onChange={(e) => setInventoryQuantity(parseInt(e.target.value) || 0)}
                  className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-center text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Key Feature Bullet Points */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-teal-600" />
              Key Product Features (Bullet Points)
            </h2>
            <p className="text-xs text-slate-500">
              Displays prominent bullet points on the product page and Google Shopping listings.
            </p>

            <div className="space-y-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-800">
                  <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                  <span className="flex-1">{feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-slate-400 hover:text-rose-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="Add another feature (e.g. Ultra-quiet operation under 38 dBA)..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Media & Multi-Image Gallery */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon size={16} className="text-teal-600" />
              Media & High-Res Gallery
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Hero Image URL
              </label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Gallery Image Previews */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-4 gap-3 pt-2">
                {galleryImages.map((imgUrl, i) => (
                  <div key={i} className="group relative rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <img
                      src={imgUrl}
                      alt={`Gallery ${i}`}
                      className="h-24 w-full rounded-lg object-contain bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(i)}
                      className="absolute top-2 right-2 rounded-full bg-slate-900/80 p-1 text-white opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-2 left-2 rounded bg-slate-900/80 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <input
                type="url"
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                placeholder="Add additional angle or detail image URL..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddGalleryImage}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Add Image
              </button>
            </div>
          </div>

          {/* Search Engine Listing Preview (SEO) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Globe size={16} className="text-teal-600" />
              Search Engine Listing Preview (Google SEO)
            </h2>

            {/* Google SERP Simulator Box */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-sans">
                <span>baemeds.com</span>
                <span>›</span>
                <span>products</span>
                <span>›</span>
                <span className="text-slate-700">{handle || 'product-slug'}</span>
              </div>
              <h3 className="text-base font-medium text-blue-700 hover:underline cursor-pointer line-clamp-1">
                {seoTitle || title || 'Product Title on Google Search'}
              </h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {seoDescription ||
                  (description ? description.substring(0, 160) : 'Official authorized distributor. Free shipping nationwide.')}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Page Title</label>
                  <span className="text-[10px] text-slate-400">{seoTitle.length} of 70 characters</span>
                </div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Inogen One G5 Portable Oxygen Concentrator | BaeMeds USA"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Meta Description</label>
                  <span className="text-[10px] text-slate-400">{seoDescription.length} of 160 characters</span>
                </div>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Order the genuine Inogen One G5 with 3-year warranty, overnight shipping, and 100% FSA/HSA acceptance..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Strategy, Healthcare & Category */}
        <div className="space-y-6">
          {/* Top 100 Hero Product Strategy Card */}
          <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/70 to-orange-50/30 p-6 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wider">
                <Star size={15} className="fill-amber-500 text-amber-500" />
                Hero Product Strategy
              </span>
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-black text-amber-900">
                Top 100 Tier
              </span>
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isHeroProduct}
                onChange={(e) => setIsHeroProduct(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <div className="text-xs">
                <span className="font-black text-slate-900 block">
                  Feature in Top 100 Hero Products
                </span>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Highlights this item on the homepage showcase, sets up prioritized Google Shopping ads, and generates itemized insurance claims.
                </p>
              </div>
            </label>
          </div>

          {/* Healthcare & FDA Rules */}
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
                placeholder="e.g. E1390, E0601, K0001"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Printed on customer invoices for insurance reimbursement.
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
                <option value="Class I">Class I (General Controls - Walkers, Canes)</option>
                <option value="Class II">Class II (Special Controls - Concentrators, CPAP)</option>
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
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">Prescription Required (Rx)</span>
                  <p className="text-[11px] text-slate-500">
                    Requires valid doctor prescription before shipment.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fsaEligible}
                  onChange={(e) => setFsaEligible(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">FSA / HSA Eligible</span>
                  <p className="text-[11px] text-slate-500">
                    Accepts pre-tax health cards under MCC 5047.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRegulatoryVerified}
                  onChange={(e) => setIsRegulatoryVerified(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">Regulatory Verified</span>
                  <p className="text-[11px] text-slate-500">
                    Verified for commercial DME distribution in Delaware & 50 states.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Category & Organization */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-teal-600" />
              Brand & Organization
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Manufacturer / Brand Vendor
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Inogen, DeVilbiss, Drive Medical"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-teal-500 focus:outline-none"
              >
                <option value="Oxygen Concentrators">Oxygen Concentrators</option>
                <option value="Sleep Apnea & CPAP">Sleep Apnea & CPAP</option>
                <option value="Mobility Aids">Mobility Aids & Wheelchairs</option>
                <option value="Patient Monitoring">Patient Monitoring & Vitals</option>
                <option value="Hospital Beds">Hospital Beds & Mattresses</option>
                <option value="Respiratory Supplies">Respiratory Supplies</option>
                <option value="Durable Medical Equipment">Durable Medical Equipment</option>
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AdminProductEditorPage;
