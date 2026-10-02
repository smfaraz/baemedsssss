import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  CreditCard, 
  FileText, 
  Lock, 
  ShieldCheck, 
  Truck, 
  AlertCircle 
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { Link, useCart, useNavigate } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Analytics } from '../lib/analytics';

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { customer, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Track begin_checkout in GA4 & Meta Pixel
  useEffect(() => {
    if (cart && cart.length > 0) {
      Analytics.trackBeginCheckout(cart, cartTotal);
    }
  }, []);

  // Form State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('DE');
  const [zip, setZip] = useState('');
  const [shippingTier, setShippingTier] = useState<'standard' | 'priority' | 'white_glove'>('standard');
  
  // Payment mock state (tokenized)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Prescription attestation
  const [rxAttested, setRxAttested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-populate if customer is authenticated
  useEffect(() => {
    if (customer) {
      if (customer.email) setEmail(customer.email);
      if (customer.firstName) setFirstName(customer.firstName);
      if (customer.lastName) setLastName(customer.lastName);
      if (customer.phone) setPhone(customer.phone);
      if (customer.defaultAddress) {
        setAddress1(customer.defaultAddress.address1 || '');
        setAddress2(customer.defaultAddress.address2 || '');
        setCity(customer.defaultAddress.city || '');
        setProvince(customer.defaultAddress.province || 'DE');
        setZip(customer.defaultAddress.zip || '');
      }
    }
  }, [customer]);

  // Check if any cart item requires Rx
  const hasRxItem = cart.some(
    (item) =>
      (item as any).prescriptionRequired ||
      item.category?.toLowerCase().includes('oxygen') ||
      item.category?.toLowerCase().includes('cpap') ||
      item.category?.toLowerCase().includes('bipap')
  );

  // Financial calculations
  let shippingCost = 0;
  if (shippingTier === 'priority') {
    shippingCost = 25.0;
  } else if (shippingTier === 'white_glove') {
    shippingCost = 95.0;
  } else {
    shippingCost = cartTotal >= 99 ? 0.0 : 12.0;
  }

  const taxAmount = Number((cartTotal * 0.06).toFixed(2));
  const finalTotal = Number((cartTotal + shippingCost + taxAmount).toFixed(2));

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!cart.length) {
      navigate('/cart');
      return;
    }

    if (hasRxItem && !rxAttested) {
      setErrorMessage('Please acknowledge the clinical prescription attestation to proceed.');
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsPayload = cart.map((item) => ({
        id: item.id,
        merchandiseId: item.variantId || item.id,
        quantity: item.quantity,
      }));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({
          cartId: localStorage.getItem('shopify_cart_id') || 'cart_default',
          email,
          firstName,
          lastName,
          phone,
          address1,
          address2,
          city,
          province,
          zip,
          country: 'United States',
          shippingTier,
          prescriptionAttested: rxAttested,
          items: itemsPayload,
          paymentToken: `tok_bm_${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to place order. Please check details.');
      }

      // Order success!
      const orderRecord = {
        orderId: data.orderId,
        orderNumber: data.orderNumber || data.orderId,
        total: data.order?.total || Number((cartTotal + shippingCost + taxAmount).toFixed(2)),
        customer: {
          email,
          firstName,
          lastName,
          phone,
        },
        shippingAddress: {
          address1,
          address2,
          city,
          province,
          zip,
          country: 'United States',
        },
        items: cart.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
      };
      sessionStorage.setItem('baemeds_last_order', JSON.stringify(orderRecord));
      sessionStorage.setItem('last_placed_order', JSON.stringify(data));

      // Trigger GA4 & Meta Pixel Purchase event with Google Ads conversion
      Analytics.trackPurchase({
        orderNumber: data.orderNumber || data.orderId,
        totalAmount: orderRecord.total,
        currency: 'USD',
        items: cart.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      clearCart();
      navigate(`/order-success?order_number=${encodeURIComponent(data.orderNumber || data.orderId)}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart.length) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f6f3ee] px-4 py-12">
        <section className="w-full max-w-md rounded-3xl border border-medical-light bg-white p-8 text-center shadow-soft">
          <ShieldCheck size={40} className="mx-auto text-medical-primary" />
          <h1 className="mt-4 text-2xl font-bold text-medical-dark">Your Cart is Empty</h1>
          <p className="mt-2 text-sm text-medical-text/70">Add products to your cart before proceeding to checkout.</p>
          <Link to="/products" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-medical-primary px-6 py-2.5 font-bold text-white hover:bg-medical-dark">
            Browse Medical Supplies
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f3ee] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-semibold text-medical-primary hover:text-medical-dark">
            <ArrowLeft size={16} /> Back to Cart
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-medical-text/70">
            <Lock size={14} className="text-medical-primary" /> 256-Bit Encrypted DME Checkout
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCheckoutSubmit} className="grid gap-8 lg:grid-cols-12">
          {/* Checkout Details Form */}
          <div className="space-y-6 lg:col-span-7">
            {/* Contact Information */}
            <section className="rounded-2xl border border-medical-light bg-white p-6 shadow-soft sm:p-8">
              <div className="flex items-center justify-between border-b border-medical-light pb-4">
                <h2 className="text-lg font-bold text-medical-dark">1. Patient / Contact Information</h2>
                {!isAuthenticated && (
                  <Link to="/login" className="text-xs font-semibold text-medical-primary hover:underline">
                    Sign in for faster checkout
                  </Link>
                )}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                    Phone Number (for delivery & clinical coordination)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="rounded-2xl border border-medical-light bg-white p-6 shadow-soft sm:p-8">
              <h2 className="border-b border-medical-light pb-4 text-lg font-bold text-medical-dark">
                2. Shipping Address
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    placeholder="123 Medical Center Way"
                    className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                    Apartment, Suite, Unit (optional)
                  </label>
                  <input
                    type="text"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    placeholder="Suite 400"
                    className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Wilmington"
                    className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={province}
                      onChange={(e) => setProvince(e.target.value.toUpperCase())}
                      placeholder="DE"
                      maxLength={2}
                      className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                      ZIP *
                    </label>
                    <input
                      type="text"
                      required
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="19801"
                      className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping Method */}
            <section className="rounded-2xl border border-medical-light bg-white p-6 shadow-soft sm:p-8">
              <h2 className="border-b border-medical-light pb-4 text-lg font-bold text-medical-dark">
                3. Shipping & Delivery Tier
              </h2>
              <div className="mt-4 space-y-3">
                <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${shippingTier === 'standard' ? 'border-medical-primary bg-medical-light/30' : 'border-medical-light hover:bg-[#faf9f6]'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingTier"
                      checked={shippingTier === 'standard'}
                      onChange={() => setShippingTier('standard')}
                      className="text-medical-primary focus:ring-medical-primary"
                    />
                    <div>
                      <p className="text-sm font-bold text-medical-dark">Standard Ground Delivery</p>
                      <p className="text-xs text-medical-text/70">3-5 business days across the contiguous United States</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-medical-dark">
                    {cartTotal >= 99 ? 'FREE' : '$12.00'}
                  </span>
                </label>

                <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${shippingTier === 'priority' ? 'border-medical-primary bg-medical-light/30' : 'border-medical-light hover:bg-[#faf9f6]'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingTier"
                      checked={shippingTier === 'priority'}
                      onChange={() => setShippingTier('priority')}
                      className="text-medical-primary focus:ring-medical-primary"
                    />
                    <div>
                      <p className="text-sm font-bold text-medical-dark">Priority Medical Courier</p>
                      <p className="text-xs text-medical-text/70">1-2 business days with temperature & handling protection</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-medical-dark">$25.00</span>
                </label>

                <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${shippingTier === 'white_glove' ? 'border-medical-primary bg-medical-light/30' : 'border-medical-light hover:bg-[#faf9f6]'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingTier"
                      checked={shippingTier === 'white_glove'}
                      onChange={() => setShippingTier('white_glove')}
                      className="text-medical-primary focus:ring-medical-primary"
                    />
                    <div>
                      <p className="text-sm font-bold text-medical-dark">White-Glove DME Setup & In-Service</p>
                      <p className="text-xs text-medical-text/70">Scheduled delivery, unpacking, room placement, and clinician device orientation</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-medical-dark">$95.00</span>
                </label>
              </div>
            </section>

            {/* Prescription Attestation (if applicable) */}
            {hasRxItem && (
              <section className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-6 shadow-soft">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 text-amber-700 shrink-0" size={22} />
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">Clinical DME Prescription Attestation</h3>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
                      Your order contains regulated medical supplies or equipment (e.g. Oxygen / CPAP / BiPAP). In compliance with FDA regulations and state pharmacy board mandates, a prescription is required.
                    </p>
                    <label className="mt-4 flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={rxAttested}
                        onChange={(e) => setRxAttested(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-amber-400 text-medical-primary focus:ring-medical-primary"
                      />
                      <span className="text-xs font-semibold text-amber-950">
                        I certify that I hold a valid doctor prescription for these items, and authorize {APP_NAME} clinical staff to verify prescription records with my healthcare provider prior to order fulfillment.
                      </span>
                    </label>
                  </div>
                </div>
              </section>
            )}

            {/* Payment Section */}
            <section className="rounded-2xl border border-medical-light bg-white p-6 shadow-soft sm:p-8">
              <div className="flex items-center justify-between border-b border-medical-light pb-4">
                <h2 className="text-lg font-bold text-medical-dark">4. Secure Payment</h2>
                <span className="flex items-center gap-1 text-xs text-medical-text/70">
                  <ShieldCheck size={16} className="text-medical-primary" /> PCI-DSS Compliant
                </span>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                    Name on Card *
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                    Card Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19))}
                      placeholder="4000 1234 5678 9010"
                      className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 pl-11 text-sm font-mono text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                    />
                    <CreditCard className="absolute left-3.5 top-3 text-medical-text/50" size={18} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                      Expiration (MM/YY) *
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value.replace(/\D/g, '').replace(/(\d{2})/, '$1/').trim().slice(0, 5))}
                      placeholder="12/28"
                      className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm font-mono text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                      Security Code (CVV) *
                    </label>
                    <input
                      type="password"
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-2.5 text-sm font-mono text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-2xl border border-medical-light bg-white p-6 shadow-soft sm:p-8">
              <h2 className="border-b border-medical-light pb-4 text-lg font-bold text-medical-dark">
                Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} items)
              </h2>

              {/* Items List */}
              <div className="mt-4 max-h-72 divide-y divide-medical-light overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-14 w-14 rounded-lg border border-medical-light object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-medical-dark">{item.title}</p>
                      <p className="text-[11px] text-medical-text/60">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold text-medical-dark">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="mt-4 space-y-2.5 border-t border-medical-light pt-4 text-sm text-medical-text/80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-medical-dark">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-medical-dark">
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (6%)</span>
                  <span className="font-semibold text-medical-dark">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-medical-light pt-3 text-base font-bold text-medical-dark">
                  <span>Total Due</span>
                  <span className="text-xl text-medical-primary">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white shadow-soft transition hover:bg-medical-dark disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Secure Order...</span>
                ) : (
                  <>
                    <Lock size={16} /> Place Order — ${finalTotal.toFixed(2)}
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-medical-text/60">
                <ShieldCheck size={14} className="text-medical-primary" />
                <span>HIPAA & FDA compliant medical fulfillment</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CheckoutPage;
