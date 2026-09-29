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
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
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

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      if (id) {
        const data = await AdminApiClient.getOrder(id);
        setOrder(data);
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

          {['PAID', 'CLINICAL_APPROVED'].includes(order.status) && (
            <button
              type="button"
              onClick={() => handleStatusChange('PROCESSING', 'Order routed to fulfillment center')}
              className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Start Processing
            </button>
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
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs mb-2">
                <Truck size={16} /> Shipment Tracking Dispatched
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
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Dispatch Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetailPage;
