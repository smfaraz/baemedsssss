import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Package, 
  Phone,
  Mail,
  ShieldCheck, 
  Truck 
} from 'lucide-react';
import { Link, useSearchParams } from '../context/CartContext';
import { useReveal } from '../lib/useReveal';
import { formatPrice } from '../lib/marketConfig';
import { CONTACT_EMAIL, CONTACT_PHONE } from '../constants';

interface StoredOrderDetails {
  orderId: string;
  orderNumber?: string;
  total: number;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  shippingAddress: {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country?: string;
  };
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    image?: string;
    specs?: string;
  }>;
}

const OrderSuccessPage: React.FC = () => {
  const sectionRef = useReveal<HTMLElement>();
  const [searchParams] = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<StoredOrderDetails | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof (window as any).gtag_report_conversion === 'function') {
      (window as any).gtag_report_conversion();
    }

    try {
      const stored = sessionStorage.getItem('baemeds_last_order') || localStorage.getItem('baemeds_last_order');
      if (stored) {
        setOrderDetails(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error reading order details from storage', e);
    }
  }, []);

  const orderNumberParam = searchParams.get('order_number') || searchParams.get('order_id');
  const displayOrderNumber = orderDetails?.orderNumber || orderDetails?.orderId || orderNumberParam || 'Confirmed';
  const phoneHref = `tel:${CONTACT_PHONE.replace(/\D/g, '')}`;

  return (
    <main ref={sectionRef} className="min-h-[80vh] px-4 py-8 sm:py-16 bg-[#f8f9fa]">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-3xl border border-medical-light bg-white p-6 sm:p-10 shadow-soft">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-medical-light">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-medical-secondary-soft text-medical-secondary shadow-sm">
                <CheckCircle2 size={36} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-medical-secondary">
                  Payment Verified &amp; Order Created
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-medical-dark mt-0.5">
                  Thank you for your order!
                </h1>
              </div>
            </div>

            <div className="sm:text-right bg-medical-light/50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
              <span className="text-xs font-semibold text-medical-text/60 block">Order Reference</span>
              <span className="text-lg font-bold font-mono text-medical-primary">
                {displayOrderNumber}
              </span>
            </div>
          </div>

          {/* Payment & Delivery Summary Alert */}
          <div className="mt-6 p-4 rounded-2xl bg-medical-secondary-soft/40 border border-medical-secondary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-medical-secondary shrink-0" />
              <div>
                <span className="font-bold text-medical-dark">Secure Electronic Settlement</span>
                <p className="text-xs text-medical-text/70">
                  {orderDetails?.customer.email ? `Receipt and invoice sent to ${orderDetails.customer.email}` : 'Confirmation and tracking sent to your email.'}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-medical-secondary bg-white px-3 py-1.5 rounded-full border border-medical-secondary/20 shrink-0">
              <Truck size={14} /> US Nationwide Delivery
            </div>
          </div>



          {/* Line items if available */}
          {orderDetails && orderDetails.items && orderDetails.items.length > 0 && (
            <div className="mt-6 pt-6 border-t border-medical-light">
              <h2 className="text-sm font-bold uppercase tracking-wider text-medical-dark mb-3">
                Items in this Order ({orderDetails.items.length})
              </h2>
              <div className="divide-y divide-medical-light rounded-2xl border border-medical-light bg-slate-50/50 p-3">
                {orderDetails.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5 px-2 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-slate-200 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-medical-dark line-clamp-1">{item.title}</p>
                        {item.specs && <p className="text-[11px] text-medical-text/60 line-clamp-1">{item.specs}</p>}
                        <p className="text-xs text-medical-text/70 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-medical-dark shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}

                <div className="pt-3 pb-1 px-2 flex justify-between items-center text-sm font-bold text-medical-dark border-t border-medical-light">
                  <span>Total Paid</span>
                  <span className="text-base text-medical-primary">{formatPrice(orderDetails.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address if available */}
          {orderDetails && orderDetails.shippingAddress && (
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-medical-light bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-medical-text/50 block mb-1">
                  Delivery Destination
                </span>
                <p className="text-sm font-semibold text-medical-dark">
                  {orderDetails.customer.firstName} {orderDetails.customer.lastName}
                </p>
                <p className="text-xs text-medical-text/75 mt-0.5">
                  {orderDetails.shippingAddress.address1}
                  {orderDetails.shippingAddress.address2 ? `, ${orderDetails.shippingAddress.address2}` : ''}
                </p>
                <p className="text-xs text-medical-text/75">
                  {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.province} {orderDetails.shippingAddress.zip}
                </p>
                {orderDetails.customer.phone && (
                  <p className="text-xs font-medium text-medical-text/70 mt-1">
                    Phone: {orderDetails.customer.phone}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl border border-medical-light bg-white flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-medical-text/50 block mb-1">
                    Clinical &amp; Order Assistance
                  </span>
                  <p className="text-xs text-medical-text/75">
                    Have questions about biomedical calibration, equipment delivery, or white-glove freight setup?
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={phoneHref}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-medical-secondary-soft text-medical-secondary border border-medical-secondary/30 px-3 py-2 text-xs font-bold hover:bg-emerald-100 transition"
                  >
                    <Phone size={14} /> Call Support
                  </a>
                  <a
                    href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Order Inquiry: ${displayOrderNumber}`)}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Mail size={14} /> Email Us
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-6 border-t border-medical-light">
            <Link
              to="/account"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white hover:bg-medical-dark transition"
            >
              <Package size={18} /> View Account &amp; Order History
            </Link>
            <Link
              to="/products"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-medical-primary px-6 py-3 font-bold text-medical-primary hover:bg-medical-light transition"
            >
              Continue Shopping <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default OrderSuccessPage;
