import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Truck,
  CheckCircle,
  FileText,
  AlertTriangle,
  User,
  MapPin,
  CreditCard,
  Clock,
  ShieldCheck,
  Send,
  Building2,
  Copy,
  Check,
  ExternalLink,
  Package,
  Printer,
  Download,
  X,
  Sparkles,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { getInvoiceSettings, InvoiceSettings } from '../../lib/invoiceConfig';
import { Link, useParams, useNavigate } from '../../context/CartContext';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Tracking modal state
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [carrier, setCarrier] = useState('FedEx Ground');
  const [trackingNumber, setTrackingNumber] = useState('');

  // McKesson Dropshipping Modal state
  const [isMcKessonModalOpen, setIsMcKessonModalOpen] = useState(false);
  const [mckessonPoNumber, setMckessonPoNumber] = useState('');
  const [isCopiedAddress, setIsCopiedAddress] = useState(false);
  const [isCopiedPoScript, setIsCopiedPoScript] = useState(false);
  const [mckessonCarrier, setMckessonCarrier] = useState('FedEx Ground');
  const [mckessonTrackingNumber, setMckessonTrackingNumber] = useState('');

  // Printable Packing Slip & Invoice Modal state
  const [isPackingSlipModalOpen, setIsPackingSlipModalOpen] = useState(false);
  const [documentMode, setDocumentMode] = useState<'invoice' | 'slip'>('invoice');
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceSettings>(getInvoiceSettings());

  const handleOpenPrintModal = (mode: 'invoice' | 'slip' = 'invoice') => {
    setDocumentMode(mode);
    setInvoiceConfig(getInvoiceSettings());
    setIsPackingSlipModalOpen(true);
  };

  // Auto-detect carrier by tracking number pattern
  const handleTrackingNumberInput = (val: string, isMckesson: boolean = false) => {
    const clean = val.trim();
    if (isMckesson) {
      setMckessonTrackingNumber(val);
      if (clean.toUpperCase().startsWith('1Z')) {
        setMckessonCarrier('UPS Medical Express');
      } else if (/^\d{12}$|^\d{15}$/.test(clean)) {
        setMckessonCarrier('FedEx Ground');
      } else if (/^9\d{19,21}$/.test(clean)) {
        setMckessonCarrier('USPS Priority Mail');
      }
    } else {
      setTrackingNumber(val);
      if (clean.toUpperCase().startsWith('1Z')) {
        setCarrier('UPS Medical Express');
      } else if (/^\d{12}$|^\d{15}$/.test(clean)) {
        setCarrier('FedEx Ground');
      } else if (/^9\d{19,21}$/.test(clean)) {
        setCarrier('USPS Priority Mail');
      }
    }
  };

  const getCarrierUrl = (cName: string, tNum: string) => {
    if (!tNum) return null;
    const clean = tNum.trim();
    if (cName?.toLowerCase().includes('fedex') || /^\d{12}$|^\d{15}$/.test(clean)) {
      return `https://www.fedex.com/fedextrack/?trknbr=${clean}`;
    }
    if (cName?.toLowerCase().includes('ups') || clean.toUpperCase().startsWith('1Z')) {
      return `https://www.ups.com/track?tracknum=${clean}`;
    }
    if (cName?.toLowerCase().includes('usps') || /^9\d{19,21}$/.test(clean)) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${clean}`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(`${cName || 'Courier'} tracking ${clean}`)}`;
  };

  const handleCopyAddress = () => {
    if (!order?.shipping_address) return;
    const addr = order.shipping_address;
    const text = `${addr.first_name} ${addr.last_name}\n${addr.address1}${addr.address2 ? ` ${addr.address2}` : ''}\n${addr.city}, ${addr.province || 'DE'} ${addr.zip}\nPhone: ${addr.phone || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setIsCopiedAddress(true);
    setTimeout(() => setIsCopiedAddress(false), 2500);
  };

  const handleCopyPoScript = () => {
    if (!order) return;
    const addr = order.shipping_address || {};
    const poNum = mckessonPoNumber || `PO-MCK-${order.order_number}`;
    const itemsList = (order.order_items || [])
      .map(
        (it: any, idx: number) =>
          `Item ${idx + 1}: McKesson #${it.mckesson_item_number || 'N/A'} | Qty: ${it.quantity} | SKU: ${it.sku || 'DME-STD'} | Title: ${it.product_title}`
      )
      .join('\n');

    const script = `======================================================
MCKESSON MMS DROPSHIP PURCHASE ORDER
======================================================
PO Number: ${poNum}
Date: ${new Date(order.created_at).toLocaleDateString()}
Requested Speed: ${order.shipping_method || 'FedEx Ground Standard'}
Portal: mms.mckesson.com

--- RECIPIENT / PATIENT SHIP-TO ADDRESS ---
${addr.first_name || ''} ${addr.last_name || 'Patient'}
${addr.address1 || ''}${addr.address2 ? ` ${addr.address2}` : ''}
${addr.city || ''}, ${addr.province || 'DE'} ${addr.zip || ''}
Phone: ${addr.phone || '(302) 555-0199'}
Email: ${order.customer_email || 'orders@baemeds.com'}

--- ITEMS TO DISPATCH ---
${itemsList}

--- CRITICAL DROPSHIP INSTRUCTIONS ---
1. Blind Dropship: Return address must read "BaeMeds Logistics, Wilmington DE".
2. DO NOT include any pricing, dealer costs, or invoice inside the package.
3. Include standard BaeMeds clinical packing slip only.
======================================================`;

    navigator.clipboard.writeText(script);
    setIsCopiedPoScript(true);
    setTimeout(() => setIsCopiedPoScript(false), 2500);
  };

  const handleMcKessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const poNum = mckessonPoNumber.trim() || `PO-MCK-${order.order_number}`;
      if (mckessonTrackingNumber.trim()) {
        const updated = await AdminApiClient.updateOrderTracking(order.id, mckessonCarrier, mckessonTrackingNumber.trim());
        setOrder(updated);
        setIsMcKessonModalOpen(false);
        setSuccessMessage(`Order routed through McKesson Supply Management (PO: ${poNum}) and marked as SHIPPED with ${mckessonCarrier}. Automated customer text & email receipts dispatched.`);
      } else {
        const updated = await AdminApiClient.updateOrderStatus(order.id, 'PROCESSING', `Routed to McKesson Supply Management PO: ${poNum}`);
        setOrder(updated);
        setIsMcKessonModalOpen(false);
        setSuccessMessage(`Order recorded as placed on McKesson Supply Management (PO: ${poNum}). Status changed to PROCESSING.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update order for McKesson');
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      if (id) {
        const data = await AdminApiClient.getOrder(id);
        setOrder(data);
        if (data && data.order_number) {
          setMckessonPoNumber(`PO-MCK-${data.order_number}`);
        }
      }
      setIsLoading(false);
    };
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (nextStatus: string, reason?: string) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updated = await AdminApiClient.updateOrderStatus(order.id, nextStatus, reason);
      setOrder(updated);
      setSuccessMessage(`Order status successfully updated to ${nextStatus}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update order status');
    }
  };

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updated = await AdminApiClient.updateOrderTracking(order.id, carrier, trackingNumber);
      setOrder(updated);
      setIsTrackingModalOpen(false);
      setSuccessMessage('Tracking details assigned and order marked as SHIPPED.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to assign tracking');
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">The requested order does not exist or has been removed.</p>
        <Link to="/admin/orders" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-medical-primary">
          <ArrowLeft size={14} /> Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{order.order_number}</h1>
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* State Machine Transition Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Printable Invoice & Packing Slip Button */}
          <button
            type="button"
            onClick={() => handleOpenPrintModal('invoice')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs"
            title="Open and print official tax invoice or fulfillment packing slip"
          >
            <Printer size={14} className="text-slate-600" />
            Print Invoice / Slip
          </button>

          {order.status === 'CLINICAL_REVIEW' && (
            <>
              <button
                type="button"
                onClick={() => handleStatusChange('CLINICAL_APPROVED', 'Clinical prescription verified')}
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                Approve Clinical Rx
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('CLINICAL_REJECTED', 'Physician Rx missing or expired')}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                Reject Clinical Rx
              </button>
            </>
          )}

          {['PAID', 'CLINICAL_APPROVED', 'PROCESSING'].includes(order.status) && (
            <>
              <button
                type="button"
                onClick={() => setIsMcKessonModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3.5 py-2 text-xs font-bold text-teal-700 hover:bg-teal-500/20 transition shadow-xs"
              >
                <Building2 size={14} className="text-teal-600" />
                Fulfill via McKesson
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('PROCESSING', 'Order routed to fulfillment center')}
                className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Start Processing
              </button>
            </>
          )}

          {order.status === 'PROCESSING' && (
            <button
              type="button"
              onClick={() => handleStatusChange('FULFILLMENT', 'Items picked, packed, and awaiting courier pickup')}
              className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              Move to Fulfillment
            </button>
          )}

          {order.status === 'FULFILLMENT' && (
            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition"
            >
              <Truck size={14} /> Assign Tracking & Ship
            </button>
          )}

          {order.status === 'SHIPPED' && (
            <button
              type="button"
              onClick={() => handleStatusChange('DELIVERED', 'Carrier proof of delivery received')}
              className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
            >
              Confirm Delivered
            </button>
          )}

          {!['CANCELLED', 'REFUNDED'].includes(order.status) && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to cancel this order?')) {
                  handleStatusChange('CANCELLED', 'Order cancelled by administrator request');
                }
              }}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          {successMessage}
        </div>
      )}

      {/* Main Grid: Details + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 8 Cols: Items & Financial Breakdown */}
        <div className="space-y-6 lg:col-span-8">
          {/* Items Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Order Items ({(order.order_items || []).length})
            </h2>

            <div className="divide-y divide-slate-100">
              {(order.order_items || []).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{item.product_title}</p>
                    <p className="text-[11px] text-slate-400">SKU: {item.sku || 'DME-STD'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      ${Number(item.unit_price).toFixed(2)} × {item.quantity}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Total: ${Number(item.total_price || item.unit_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">${Number(order.subtotal_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping ({order.shipping_method || 'Ground'})</span>
                <span className="font-semibold text-slate-900">
                  {Number(order.shipping_amount) === 0 ? 'FREE' : `$${Number(order.shipping_amount).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Sales Tax</span>
                <span className="font-semibold text-slate-900">${Number(order.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black text-slate-900">
                <span>Total Paid</span>
                <span className="text-base text-medical-primary">${Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Tracking Details (if shipped) */}
          {order.tracking_number && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <Truck size={16} /> Shipment Tracking Dispatched
                </div>
                <div className="flex items-center gap-2">
                  {getCarrierUrl(order.carrier, order.tracking_number) && (
                    <a
                      href={getCarrierUrl(order.carrier, order.tracking_number)!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 transition shadow-2xs"
                    >
                      Track on Courier Site <ExternalLink size={12} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPackingSlipModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-100/70 px-3 py-1.5 text-xs font-bold text-purple-900 hover:bg-purple-200 transition"
                  >
                    <Printer size={12} /> Packing Slip
                  </button>
                </div>
              </div>
              <p className="text-xs text-purple-950">
                Carrier: <span className="font-bold">{order.carrier}</span>
              </p>
              <p className="text-xs text-purple-950 mt-1">
                Tracking Number: <span className="font-mono font-bold">{order.tracking_number}</span>
              </p>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Customer & Delivery Info */}
        <div className="space-y-6 lg:col-span-4">
          {/* Customer Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-xs space-y-3">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <User size={14} className="text-medical-primary" /> Customer Information
            </h3>
            <p className="font-bold text-slate-900">
              {order.shipping_address?.first_name} {order.shipping_address?.last_name || 'Patient'}
            </p>
            <p className="text-slate-600">{order.customer_email}</p>
            <p className="text-slate-600">{order.shipping_address?.phone || 'No phone supplied'}</p>
          </div>

          {/* Shipping Address Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-xs space-y-3">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <MapPin size={14} className="text-medical-primary" /> Delivery Address
            </h3>
            <div className="text-slate-700 space-y-0.5 leading-relaxed">
              <p>{order.shipping_address?.address1}</p>
              {order.shipping_address?.address2 && <p>{order.shipping_address.address2}</p>}
              <p>
                {order.shipping_address?.city}, {order.shipping_address?.province} {order.shipping_address?.zip}
              </p>
              <p>{order.shipping_address?.country || 'United States'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Assign Tracking */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Assign Courier Tracking</h3>
            <p className="mt-1 text-xs text-slate-500">
              Enter courier tracking information to mark this medical order as Shipped.
            </p>

            <form onSubmit={handleTrackingSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900"
                >
                  <option value="FedEx Ground">FedEx Ground</option>
                  <option value="FedEx Priority Health">FedEx Priority Health</option>
                  <option value="UPS Medical Express">UPS Medical Express</option>
                  <option value="USPS Priority Mail">USPS Priority Mail</option>
                  <option value="BaeMeds White-Glove Logistics">BaeMeds White-Glove Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tracking Number</label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 789201948210"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTrackingModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 transition"
                >
                  Dispatch Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* McKesson Dropshipping Fulfillment Modal */}
      {isMcKessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 border border-teal-500/20">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Fulfill via McKesson Supply Management
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Manual dropshipping order routing for order {order.order_number}
                  </p>
                </div>
              </div>
              <a
                href="https://mms.mckesson.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Open McKesson MMS Portal <ExternalLink size={12} />
              </a>
            </div>

            {/* Step 1: Customer Ship-To Address Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin size={14} className="text-teal-600" />
                  Step 1: Customer Ship-To Address & Quick Scripts
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPoScript}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs ${
                      isCopiedPoScript
                        ? 'bg-teal-700 text-white'
                        : 'border border-teal-500/40 bg-teal-50 text-teal-800 hover:bg-teal-100'
                    }`}
                    title="Copy full purchase order script for McKesson"
                  >
                    {isCopiedPoScript ? <Check size={12} /> : <FileText size={12} />}
                    {isCopiedPoScript ? 'PO Script Copied!' : 'Copy MMS PO Script'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      isCopiedAddress
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isCopiedAddress ? <Check size={12} /> : <Copy size={12} />}
                    {isCopiedAddress ? 'Address Copied!' : 'Copy Address'}
                  </button>
                </div>
              </div>

              {order.shipping_address ? (
                <div className="text-xs text-slate-800 font-mono bg-white p-3 rounded-lg border border-slate-200">
                  <p className="font-bold">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                  <p>{order.shipping_address.address1}{order.shipping_address.address2 ? ` ${order.shipping_address.address2}` : ''}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.province || 'DE'} {order.shipping_address.zip}</p>
                  <p className="text-slate-500 font-sans mt-1">Phone: {order.shipping_address.phone || '(302) 555-0199'}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No shipping address recorded.</p>
              )}
            </div>

            {/* Step 2: Line Items & McKesson Item Numbers */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Package size={14} className="text-teal-600" />
                Step 2: Order Items & McKesson Item Codes
              </span>

              <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white overflow-hidden">
                {(order.order_items || []).map((item: any) => (
                  <div key={item.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{item.product_title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.mckesson_item_number ? (
                          <a
                            href={`https://mms.mckesson.com/product/${item.mckesson_item_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-teal-800 border border-teal-200 hover:bg-teal-100 inline-flex items-center gap-1 transition"
                            title="Open on mms.mckesson.com"
                          >
                            McKesson #: {item.mckesson_item_number}
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 border border-slate-200">
                            McKesson #: N/A
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px]">SKU: {item.sku || 'DME-STD'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">Qty: {item.quantity}</span>
                      <p className="text-[11px] text-slate-500">Wholesale: ${(Number(item.unit_price) * 0.6).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Record McKesson PO and Tracking */}
            <form onSubmit={handleMcKessonSubmit} className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-700 block">
                Step 3: Confirm Dropshipping Order & Tracking
              </span>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    McKesson PO / Confirmation Number
                  </label>
                  <input
                    type="text"
                    value={mckessonPoNumber}
                    onChange={(e) => setMckessonPoNumber(e.target.value)}
                    placeholder="e.g. PO-MCK-1001"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shipping Carrier (Auto-detected)
                  </label>
                  <select
                    value={mckessonCarrier}
                    onChange={(e) => setMckessonCarrier(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-semibold"
                  >
                    <option value="FedEx Ground">FedEx Ground</option>
                    <option value="FedEx Priority Health">FedEx Priority Health</option>
                    <option value="UPS Medical Express">UPS Medical Express</option>
                    <option value="USPS Priority Mail">USPS Priority Mail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Courier Tracking Number (optional now, or enter once warehouse ships)
                </label>
                <input
                  type="text"
                  value={mckessonTrackingNumber}
                  onChange={(e) => handleTrackingNumberInput(e.target.value, true)}
                  placeholder="e.g. 748902849102 or 1Z9999999999999999"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Entering a tracking number auto-detects the carrier, marks the order as SHIPPED, and dispatches tracking receipts.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMcKessonModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition shadow-sm"
                >
                  Save & Update Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Packing Slip Modal */}
      {isPackingSlipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          {/* Print Stylesheet */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-packing-slip, #printable-packing-slip * {
                visibility: visible;
              }
              #printable-packing-slip {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl space-y-4 my-8 max-h-[92vh] flex flex-col">
            {/* Top Modal Controls (Hidden in Print) */}
            <div className="no-print flex items-center justify-between border-b border-slate-200 p-4 bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-slate-700" />
                <span className="text-sm font-bold text-slate-900">
                  {documentMode === 'invoice' ? 'Official Tax Invoice' : 'Fulfillment Packing Slip'}
                </span>
                <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-300 p-0.5 text-xs ml-2">
                  <button
                    type="button"
                    onClick={() => setDocumentMode('invoice')}
                    className={`rounded px-2.5 py-1 font-semibold transition ${
                      documentMode === 'invoice'
                        ? 'bg-[#14539A] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tax Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentMode('slip')}
                    className={`rounded px-2.5 py-1 font-semibold transition ${
                      documentMode === 'slip'
                        ? 'bg-[#14539A] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Packing Slip
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/admin/settings/invoices"
                  target="_blank"
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition inline-flex items-center gap-1"
                >
                  <FileText size={13} />
                  <span>Customize Template</span>
                </Link>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-sm"
                >
                  <Printer size={14} /> Print Document
                </button>
                <button
                  type="button"
                  onClick={() => setIsPackingSlipModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Document Sheet Container */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-900" id="printable-packing-slip">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                      {invoiceConfig.companyName}
                    </span>
                    <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-900 uppercase">
                      DMEPOS Clinical
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {invoiceConfig.tagline}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {invoiceConfig.remitAddressLine1}{invoiceConfig.remitAddressLine2 ? `, ${invoiceConfig.remitAddressLine2}` : ''} | {invoiceConfig.remitCityStateZip}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Tel: {invoiceConfig.phone} | Billing: {invoiceConfig.email} | {invoiceConfig.website}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono text-slate-500">
                    <span>EIN: <strong>{invoiceConfig.einTaxId}</strong></span>
                    <span>•</span>
                    <span>Lic: <strong>{invoiceConfig.dmeLicenseNumber}</strong></span>
                    <span>•</span>
                    <span>NPI: <strong>{invoiceConfig.npiNumber}</strong></span>
                    <span>•</span>
                    <span>PTAN: <strong>{invoiceConfig.medicarePtan}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black uppercase tracking-wider text-slate-900 block">
                    {documentMode === 'invoice' ? 'OFFICIAL TAX INVOICE' : 'PACKING SLIP'}
                  </span>
                  <p className="text-xs font-mono font-bold text-[#14539A] mt-1">
                    Order #: {order.order_number}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Date: {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Ship Speed: {order.shipping_method || 'Standard Ground'}
                  </p>
                </div>
              </div>

              {/* Meta Address Grid */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                {/* Ship To Block */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-1 bg-slate-50/50">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Ship-To Recipient
                  </span>
                  <p className="font-bold text-sm text-slate-900">
                    {order.shipping_address?.first_name} {order.shipping_address?.last_name || 'Patient'}
                  </p>
                  <p>{order.shipping_address?.address1}</p>
                  {order.shipping_address?.address2 && <p>{order.shipping_address.address2}</p>}
                  <p>
                    {order.shipping_address?.city}, {order.shipping_address?.province || 'DE'} {order.shipping_address?.zip}
                  </p>
                  <p className="text-slate-500 pt-1">Contact: {order.shipping_address?.phone || invoiceConfig.phone}</p>
                </div>

                {/* Dispatch & Remit Meta */}
                <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50/50">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    {documentMode === 'invoice' ? 'Remittance & Status' : 'Shipment & Compliance Details'}
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Carrier:</span>
                    <span className="font-bold">{order.carrier || 'FedEx / UPS Health'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tracking #:</span>
                    <span className="font-mono font-bold">{order.tracking_number || 'Generated at Courier Terminal'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer Email:</span>
                    <span className="font-medium text-slate-700">{order.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className="font-bold text-emerald-700">PAID & CLEARED</span>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="rounded-xl border border-slate-300 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">Item Description</th>
                      {invoiceConfig.showHcpcsCodes && <th className="p-3">HCPCS Code</th>}
                      {invoiceConfig.showSku && <th className="p-3">SKU</th>}
                      <th className="p-3 text-center">Qty</th>
                      {documentMode === 'invoice' && <th className="p-3 text-right">Unit Price</th>}
                      {documentMode === 'invoice' && <th className="p-3 text-right">Total</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans">
                    {(order.order_items || []).map((item: any, idx: number) => {
                      const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
                      const itemTotal = itemPrice * (item.quantity || 1);
                      return (
                        <tr key={item.id} className="text-slate-800">
                          <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{item.product_title}</p>
                            <p className="text-[11px] text-slate-500">Standard Clinical Packaging</p>
                          </td>
                          {invoiceConfig.showHcpcsCodes && (
                            <td className="p-3 font-mono font-semibold text-slate-700">
                              {item.hcpcs_code || 'E1399'}
                            </td>
                          )}
                          {invoiceConfig.showSku && (
                            <td className="p-3 font-mono text-slate-600">{item.sku || 'DME-STD'}</td>
                          )}
                          <td className="p-3 text-center font-black text-sm text-slate-900">
                            {item.quantity}
                          </td>
                          {documentMode === 'invoice' && (
                            <td className="p-3 text-right font-mono font-medium">${itemPrice.toFixed(2)}</td>
                          )}
                          {documentMode === 'invoice' && (
                            <td className="p-3 text-right font-mono font-bold">${itemTotal.toFixed(2)}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals for Invoice Mode */}
              {documentMode === 'invoice' && (
                <div className="grid grid-cols-2 gap-4 items-start pt-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                      Remittance Memo & Terms
                    </span>
                    <p className="text-slate-700 font-medium">{invoiceConfig.paymentTerms}</p>
                    <p className="text-[11px] font-mono text-slate-800">{invoiceConfig.bankRoutingInfo}</p>
                  </div>

                  <div className="space-y-1 text-xs text-right">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-medium">${(order.total_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Insured Freight Delivery:</span>
                      <span className="font-mono font-medium text-emerald-700">INCLUDED</span>
                    </div>
                    <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-bold text-slate-900">
                      <span>Total Paid:</span>
                      <span className="font-mono text-base font-black text-[#14539A]">
                        ${(order.total_amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification & QA Sign-Off for Packing Slip Mode */}
              {documentMode === 'slip' && (
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-4 text-[11px] text-slate-600 bg-slate-50/30">
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">
                      Quality Assurance & Inspection Checklist:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      <li>DMEPOS medical device integrity confirmed</li>
                      <li>Tamper-evident seals intact</li>
                      <li>Patient documentation and instructions enclosed</li>
                    </ul>
                  </div>

                  <div className="border-l border-slate-200 pl-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Inspected By:</span>
                      <span className="font-mono font-bold text-slate-800">QA #BM-802</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dispatch Hub:</span>
                      <span className="font-medium text-slate-800">Wilmington Medical Logistics</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Inspection Date:</span>
                      <span className="font-medium text-slate-800">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Care Support Footer */}
              <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">
                  {invoiceConfig.footerNote}
                </p>
                <p>
                  Need assistance with setup, calibration, or replacement parts? Contact Patient Support at{' '}
                  <span className="font-bold text-slate-800">{invoiceConfig.phone}</span> or email{' '}
                  <span className="font-bold text-slate-800">{invoiceConfig.email}</span>.
                </p>
                <p className="text-slate-400">
                  {invoiceConfig.hygienePolicyNotice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetailPage;
