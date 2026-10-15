import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Lock,
  ShieldCheck,
  Truck,
  AlertCircle,
  Phone,
  User,
  MapPin,
  Building2,
  FileCheck2,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { APP_NAME } from '../constants';
import { Link, useCart, useNavigate } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Analytics } from '../lib/analytics';
import { StripePaymentSection } from '../components/checkout/StripePaymentSection';
import { calculateTaxEstimate, DetailedTaxCalculation } from '../lib/clientTax';
import { US_STATES, US_STATE_CODES } from '../lib/marketConfig';
import { calculateTieredShippingFee } from '../lib/shippingRates';

export type CheckoutStepId = 'shipping' | 'delivery' | 'payment';

export const CheckoutPage: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { customer, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Stepper State (3 Streamlined Steps)
  const [currentStep, setCurrentStep] = useState<CheckoutStepId>('shipping');

  const stepList: { id: CheckoutStepId; title: string; shortTitle: string }[] = [
    { id: 'shipping', title: '1. Patient & Shipping Address', shortTitle: 'Shipping' },
    { id: 'delivery', title: '2. Delivery Speed', shortTitle: 'Delivery' },
    { id: 'payment', title: '3. Secure Payment', shortTitle: 'Payment' },
  ];

  const currentStepIndex = stepList.findIndex((s) => s.id === currentStep);

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

  // Institutional Tax Exemption State (Hospitals / 501(c)(3) / Clinics)
  const [customerIsTaxExempt, setCustomerIsTaxExempt] = useState(false);
  const [taxExemptionCertificate, setTaxExemptionCertificate] = useState('');

  // Promotional Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    discountAmount: number;
    message?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Stripe state
  const [stripeClientSecret, setStripeClientSecret] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState(
    (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || ''
  );
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isInitializingStripe, setIsInitializingStripe] = useState(true);
  const [paymentGatewayError, setPaymentGatewayError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step transition handlers
  const goToNextFromShipping = () => {
    setErrorMessage('');
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!firstName.trim()) {
      setErrorMessage('Please enter your first name.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Please enter your last name.');
      return;
    }
    if (!address1.trim()) {
      setErrorMessage('Please enter your street address.');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('Please enter your city.');
      return;
    }
    if (!province.trim() || !US_STATE_CODES.has(province.trim().toUpperCase())) {
      setErrorMessage('Please select a valid US state from the dropdown list.');
      return;
    }
    if (!zip.trim()) {
      setErrorMessage('Please enter your ZIP code.');
      return;
    }

    setCurrentStep('delivery');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const goToNextFromDelivery = () => {
    setErrorMessage('');
    setCurrentStep('payment');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

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

  // Coupon handlers
  const handleApplyCoupon = async () => {
    const trimmed = couponInput.trim().toUpperCase();
    if (!trimmed) return;
    setCouponError('');
    setCouponSuccess('');
    setIsApplyingCoupon(true);

    try {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, subtotal: cartTotal }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.valid) {
        setCouponError(data?.error || `Coupon code "${trimmed}" could not be applied.`);
        return;
      }
      setAppliedCoupon({
        code: data.code,
        type: data.type,
        value: data.value,
        discountAmount: data.discountAmount,
        message: data.message,
      });
      setCouponSuccess(data.message || `Coupon "${data.code}" applied!`);
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message || 'Unable to validate coupon code.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    setCouponSuccess('');
  };

  // Product-based tiered flat shipping calculation (Zero Free Delivery)
  const shippingInfo = useMemo(() => {
    return calculateTieredShippingFee(
      cart.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
      })),
      shippingTier
    );
  }, [cart, shippingTier]);

  const shippingCost = shippingInfo.shippingCost;
  const standardTierCost = shippingInfo.baseStandardRate;
  const priorityTierCost = standardTierCost === 12.0 ? 25.0 : standardTierCost + 15.0;
  const whiteGloveTierCost = standardTierCost === 45.0 ? 115.0 : 95.0;

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const discountedSubtotal = Math.max(0, cartTotal - discountAmount);

  // Authoritative destination-based sales tax and medical DME exemption calculation
  const taxCalc: DetailedTaxCalculation = useMemo(() => {
    return calculateTaxEstimate({
      items: cart.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        requiresPrescription: item.prescriptionRequired,
      })),
      shippingAddress: {
        state: province,
        zip,
        city,
      },
      customerIsTaxExempt,
      taxExemptionCertificate,
    });
  }, [cart, province, zip, city, customerIsTaxExempt, taxExemptionCertificate]);

  const taxAmount = taxCalc.estimatedTax;
  const finalTotal = Number((discountedSubtotal + shippingCost + taxAmount).toFixed(2));

  // Handle redirect return from payment providers (Amazon Pay, Klarna, Cash App, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentId = urlParams.get('payment_intent');
    const redirectStatus = urlParams.get('redirect_status');

    if (paymentIntentId && redirectStatus === 'succeeded') {
      try {
        const saved = sessionStorage.getItem('baemeds_pending_checkout');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.firstName) setFirstName(parsed.firstName);
          if (parsed.lastName) setLastName(parsed.lastName);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.address1) setAddress1(parsed.address1);
          if (parsed.address2) setAddress2(parsed.address2);
          if (parsed.city) setCity(parsed.city);
          if (parsed.province) setProvince(parsed.province);
          if (parsed.zip) setZip(parsed.zip);
          if (parsed.shippingTier) setShippingTier(parsed.shippingTier);
          if (parsed.customerIsTaxExempt !== undefined) setCustomerIsTaxExempt(Boolean(parsed.customerIsTaxExempt));
          if (parsed.taxExemptionCertificate) setTaxExemptionCertificate(parsed.taxExemptionCertificate);

          handlePaymentSuccess(paymentIntentId, parsed);
        }
      } catch (e) {
        console.error('Error recovering payment redirect state:', e);
      }
    } else if (redirectStatus && redirectStatus !== 'succeeded') {
      setErrorMessage(`Payment authorization status: ${redirectStatus}. Please select your payment method again.`);
    }
  }, []);

  // Initialize or update Stripe PaymentIntent with debouncing and safe JSON handling
  useEffect(() => {
    // Only initialize payment intent once customer reaches delivery or payment step
    if (currentStep === 'shipping') {
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsInitializingStripe(true);
        setPaymentGatewayError('');

        const res = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: finalTotal,
            amountInCents: Math.round(finalTotal * 100),
            currency: 'usd',
            cartTotal,
            discountAmount,
            couponCode: appliedCoupon?.code,
            shippingCost,
            taxAmount,
            shippingTier,
            paymentIntentId,
            items: cart.map(i => ({
              id: i.id,
              merchandiseId: (i as any).merchandiseId || (i as any).variantId || i.id,
              quantity: i.quantity,
            })),
            metadata: {
              customer_email: email,
              items_count: cart.reduce((s, i) => s + i.quantity, 0),
            },
          }),
        });

        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          console.warn('[CheckoutPage] Non-JSON response from /api/payment-intent:', text.slice(0, 100));
        }

        if (!res.ok || !data) {
          const warnMsg = data?.error || 'Payment gateway connection will establish at Step 3.';
          console.warn('[CheckoutPage] Payment initialization note:', warnMsg);
          if (isMounted) {
            setPaymentGatewayError(warnMsg);
            if (currentStep === 'payment') {
              setErrorMessage(warnMsg);
            }
          }
          return;
        }

        if (isMounted) {
          if (data.clientSecret) setStripeClientSecret(data.clientSecret);
          if (data.paymentIntentId) setPaymentIntentId(data.paymentIntentId);
          if (data.publishableKey) setStripePublishableKey(data.publishableKey);
        }
      } catch (err: any) {
        console.warn('[CheckoutPage] Stripe init background error:', err);
        if (isMounted) {
          setPaymentGatewayError('Payment gateway will connect during payment review.');
          if (currentStep === 'payment') {
            setErrorMessage('Unable to connect to payment gateway. Please retry.');
          }
        }
      } finally {
        if (isMounted) {
          setIsInitializingStripe(false);
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentStep, finalTotal, shippingTier, province, zip]);

  // Validation before Stripe confirms payment
  const validateCheckoutForm = (): string | null => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      return 'Please enter a valid email address.';
    }
    if (!firstName.trim()) {
      return 'Please enter your first name.';
    }
    if (!lastName.trim()) {
      return 'Please enter your last name.';
    }
    if (!address1.trim()) {
      return 'Please enter your shipping street address.';
    }
    if (!city.trim()) {
      return 'Please enter your city.';
    }
    if (!province.trim()) {
      return 'Please enter your 2-letter state code (e.g. DE, CA, NY).';
    }
    if (!zip.trim()) {
      return 'Please enter your ZIP code.';
    }
    if (customerIsTaxExempt && !taxExemptionCertificate.trim()) {
      return 'Please enter your State Sales Tax Exemption Certificate Number or Federal EIN, or uncheck the tax-exempt entity option.';
    }

    try {
      sessionStorage.setItem('baemeds_pending_checkout', JSON.stringify({
        email,
        firstName,
        lastName,
        phone,
        address1,
        address2,
        city,
        province,
        zip,
        shippingTier,
        customerIsTaxExempt,
        taxExemptionCertificate,
        couponCode: appliedCoupon?.code,
        cart,
      }));
    } catch { }

    return null;
  };

  const handlePaymentSuccess = async (confirmedIntentId: string, overrideData?: any) => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const activeEmail = overrideData?.email || email;
      const activeFirstName = overrideData?.firstName || firstName;
      const activeLastName = overrideData?.lastName || lastName;
      const activePhone = overrideData?.phone || phone;
      const activeAddress1 = overrideData?.address1 || address1;
      const activeAddress2 = overrideData?.address2 || address2;
      const activeCity = overrideData?.city || city;
      const activeProvince = overrideData?.province || province;
      const activeZip = overrideData?.zip || zip;
      const activeShippingTier = overrideData?.shippingTier || shippingTier;
      const activeIsTaxExempt = overrideData?.customerIsTaxExempt !== undefined ? overrideData.customerIsTaxExempt : customerIsTaxExempt;
      const activeTaxCert = overrideData?.taxExemptionCertificate || taxExemptionCertificate;
      const activeCouponCode = overrideData?.couponCode || appliedCoupon?.code;
      const activeCart = (overrideData?.cart && overrideData.cart.length > 0) ? overrideData.cart : cart;

      const itemsPayload = activeCart.map((item: any) => ({
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
          email: activeEmail,
          firstName: activeFirstName,
          lastName: activeLastName,
          phone: activePhone,
          address1: activeAddress1,
          address2: activeAddress2,
          city: activeCity,
          province: activeProvince,
          zip: activeZip,
          country: 'United States',
          shippingTier: activeShippingTier,
          customerIsTaxExempt: activeIsTaxExempt,
          taxExemptionCertificate: activeTaxCert,
          couponCode: activeCouponCode,
          items: itemsPayload,
          paymentIntentId: confirmedIntentId,
          paymentToken: confirmedIntentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Payment processed, but order creation failed. Please contact customer support.');
      }

      // Order success!
      const orderRecord = {
        orderId: data.orderId,
        orderNumber: data.orderNumber || data.orderId,
        total: data.order?.total || finalTotal,
        customer: {
          email: activeEmail,
          firstName: activeFirstName,
          lastName: activeLastName,
          phone: activePhone,
        },
        shippingAddress: {
          address1: activeAddress1,
          address2: activeAddress2,
          city: activeCity,
          province: activeProvince,
          zip: activeZip,
          country: 'United States',
        },
        items: activeCart.map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
      };
      sessionStorage.setItem('baemeds_last_order', JSON.stringify(orderRecord));
      sessionStorage.setItem('last_placed_order', JSON.stringify(data));
      sessionStorage.removeItem('baemeds_pending_checkout');

      // Trigger GA4 & Meta Pixel Purchase event with Google Ads conversion
      Analytics.trackPurchase({
        orderNumber: data.orderNumber || data.orderId,
        totalAmount: orderRecord.total,
        currency: 'USD',
        items: activeCart.map((item: any) => ({
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
            <Lock size={14} className="text-medical-primary" /> 256-Bit Encrypted Secure Checkout
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step Progress Bar */}
        <div className="mb-8 rounded-2xl border border-medical-light bg-white p-4 sm:p-5 shadow-soft">
          <div className="flex items-center justify-between">
            {stepList.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (idx <= currentStepIndex) {
                        setCurrentStep(step.id);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }
                    }}
                    disabled={idx > currentStepIndex}
                    className={`group flex items-center gap-2.5 text-left transition ${isCurrent
                        ? 'cursor-default'
                        : isCompleted
                          ? 'cursor-pointer hover:opacity-85'
                          : 'cursor-not-allowed opacity-40'
                      }`}
                  >
                    <div
                      className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition ${isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isCurrent
                            ? 'bg-medical-primary text-white shadow-md shadow-medical-primary/20 ring-4 ring-medical-primary/15'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                      {isCompleted ? <Check size={18} className="stroke-[3]" /> : idx + 1}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider ${isCurrent
                            ? 'text-medical-primary font-bold'
                            : isCompleted
                              ? 'text-emerald-700'
                              : 'text-slate-400'
                          }`}
                      >
                        Step {idx + 1}
                      </p>
                      <p
                        className={`text-sm font-bold ${isCurrent ? 'text-slate-900' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                          }`}
                      >
                        {step.shortTitle}
                      </p>
                    </div>
                  </button>

                  {idx < stepList.length - 1 && (
                    <div className="flex-1 mx-2 sm:mx-4 h-0.5 bg-slate-200">
                      <div
                        className={`h-full transition-all duration-300 ${idx < currentStepIndex ? 'bg-emerald-600' : 'bg-transparent'
                          }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile Current Step Label */}
          <div className="mt-3 block sm:hidden text-center border-t border-slate-100 pt-2.5">
            <span className="text-xs font-bold text-medical-primary">
              Step {currentStepIndex + 1} of {stepList.length}: {stepList[currentStepIndex]?.title}
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Checkout Steps Form Area */}
          <div className="space-y-6 lg:col-span-7">

            {/* Completed Step 1 Summary Card */}
            {currentStepIndex > 0 && (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    <Check size={18} className="stroke-[3]" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-medical-primary">
                      1. Patient & Shipping Address
                    </span>
                    <p className="text-sm font-bold text-medical-dark mt-0.5">
                      {firstName} {lastName} • {city}, {province} {zip}
                    </p>
                    <p className="text-xs text-medical-text/60">
                      {address1}{address2 ? `, ${address2}` : ''} • {email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('shipping');
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className="rounded-xl border border-medical-light bg-medical-light/40 px-3.5 py-2 text-xs font-bold text-medical-primary hover:bg-medical-primary hover:text-white transition ml-3 shrink-0"
                >
                  Edit Address
                </button>
              </div>
            )}

            {/* STEP 1: Contact & Shipping Address Form */}
            {currentStep === 'shipping' && (
              <>
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
                        className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-3 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
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
                        className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-3 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
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
                        className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-3 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                        Phone Number (for delivery updates)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 000-0000"
                        className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-3 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </section>

                {/* Shipping Address */}
                <section className="rounded-2xl border border-medical-light bg-white p-6 shadow-soft sm:p-8">
                  <h2 className="border-b border-medical-light pb-4 text-lg font-bold text-medical-dark">
                    Shipping Destination Address
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
                        className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-3 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
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
                        className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-3 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
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
                        className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-3 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="checkout-state-select" className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                          State *
                        </label>
                        <select
                          id="checkout-state-select"
                          required
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-3 text-sm font-medium text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none cursor-pointer"
                        >
                          <option value="">Select State</option>
                          {US_STATES.map((st) => (
                            <option key={st.code} value={st.code}>
                              {st.name} ({st.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="checkout-zip-input" className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                          ZIP *
                        </label>
                        <input
                          id="checkout-zip-input"
                          type="text"
                          required
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          placeholder="19801"
                          className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-4 py-3 text-sm text-medical-dark focus:border-medical-primary focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Tax-Exempt Healthcare Facility / Institutional Buyer */}
                    <div className="sm:col-span-2 mt-2 rounded-2xl border border-medical-light bg-slate-50/70 p-4 transition-all">
                      <div className="flex items-start gap-3 select-none">
                        <input
                          id="tax-exempt-checkbox"
                          type="checkbox"
                          checked={customerIsTaxExempt}
                          onChange={(e) => setCustomerIsTaxExempt(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-medical-primary focus:ring-medical-primary cursor-pointer shrink-0"
                        />
                        <label htmlFor="tax-exempt-checkbox" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-1.5 font-bold text-medical-dark text-sm">
                            <Building2 size={16} className="text-medical-primary" />
                            <span>Tax-Exempt Healthcare Facility / Hospital / 501(c)(3)</span>
                          </div>
                          <p className="text-xs text-medical-text/70 mt-0.5">
                            Check this box if your organization holds a valid State Resale Certificate, Direct Pay Permit, or Federal Tax Exemption Certificate.
                          </p>
                        </label>
                      </div>

                      {customerIsTaxExempt && (
                        <div className="mt-3.5 pt-3 border-t border-slate-200/80">
                          <label htmlFor="tax-exempt-cert-input" className="block text-xs font-bold uppercase tracking-wider text-medical-text/80 mb-1">
                            State Exemption Certificate Number / Federal EIN *
                          </label>
                          <div className="relative">
                            <input
                              id="tax-exempt-cert-input"
                              type="text"
                              value={taxExemptionCertificate}
                              onChange={(e) => setTaxExemptionCertificate(e.target.value)}
                              placeholder="e.g. EX-984210-DE or 12-3456789"
                              className="w-full rounded-xl border border-medical-light bg-white px-4 py-2.5 pl-10 text-sm text-medical-dark focus:border-medical-primary focus:outline-none"
                            />
                            <FileCheck2 size={18} className="absolute left-3 top-3 text-emerald-600" />
                          </div>
                          <p className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <Check size={12} className="stroke-[3]" />
                            <span>Statutory healthcare exemption waives 100% of retail sales tax on this clinical order.</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 1 Continue Button */}
                  <div className="mt-8 pt-6 border-t border-medical-light flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ShieldCheck size={16} className="text-medical-primary" />
                      <span>Encrypted, confidential delivery</span>
                    </div>
                    <button
                      type="button"
                      onClick={goToNextFromShipping}
                      className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-8 py-3 text-base font-bold text-white shadow-soft hover:bg-medical-dark transition"
                    >
                      <span>Continue to Delivery Speed</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* Completed Step 2 (Delivery Speed) Summary Card */}
            {currentStepIndex > 1 && (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    <Check size={18} className="stroke-[3]" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-medical-primary">
                      2. Delivery Speed
                    </span>
                    <p className="text-sm font-bold text-medical-dark mt-0.5">
                      {shippingTier === 'standard' && `Standard Ground Delivery (3-5 Days) • $${standardTierCost.toFixed(2)}`}
                      {shippingTier === 'priority' && `Priority Medical Courier (1-2 Days) • $${priorityTierCost.toFixed(2)}`}
                      {shippingTier === 'white_glove' && `White-Glove DME Setup & In-Service • $${whiteGloveTierCost.toFixed(2)}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('delivery');
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className="rounded-xl border border-medical-light bg-medical-light/40 px-3.5 py-2 text-xs font-bold text-medical-primary hover:bg-medical-primary hover:text-white transition ml-3 shrink-0"
                >
                  Change Speed
                </button>
              </div>
            )}

            {/* STEP 2: Shipping Method */}
            {currentStep === 'delivery' && (
              <section className="rounded-2xl border border-medical-light bg-white p-6 shadow-soft sm:p-8">
                <h2 className="border-b border-medical-light pb-4 text-lg font-bold text-medical-dark">
                  2. Shipping & Delivery Tier
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
                      ${standardTierCost.toFixed(2)}
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
                    <span className="text-sm font-bold text-medical-dark">${priorityTierCost.toFixed(2)}</span>
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
                    <span className="text-sm font-bold text-medical-dark">${whiteGloveTierCost.toFixed(2)}</span>
                  </label>
                </div>

                {/* Step 2 Continue Button */}
                <div className="mt-8 pt-6 border-t border-medical-light flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('shipping');
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Address</span>
                  </button>
                  <button
                    type="button"
                    onClick={goToNextFromDelivery}
                    className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-8 py-3 text-base font-bold text-white shadow-soft hover:bg-medical-dark transition"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </section>
            )}

            {/* STEP 3: Payment Section */}
            {currentStep === 'payment' && (
              <section className="rounded-2xl border border-medical-light bg-white p-6 shadow-soft sm:p-8">
                <div className="flex items-center justify-between border-b border-medical-light pb-4 mb-4">
                  <h2 className="text-lg font-bold text-medical-dark">
                    3. Secure Payment
                  </h2>
                  <span className="flex items-center gap-1 text-xs text-medical-text/70">
                    <ShieldCheck size={16} className="text-medical-primary" /> PCI SAQ A Encrypted
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">Credit / Debit Card</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">Apple Pay</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">Google Pay</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">FSA / HSA Card</span>
                </div>

                {paymentGatewayError && !stripeClientSecret && (
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                      <span>{paymentGatewayError}</span>
                    </div>
                  </div>
                )}

                <StripePaymentSection
                  publishableKey={stripePublishableKey}
                  clientSecret={stripeClientSecret}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={(msg) => setErrorMessage(msg)}
                  onBeforeSubmit={validateCheckoutForm}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                  submitButtonText={`Place Order & Pay $${finalTotal.toFixed(2)}`}
                  disabled={isInitializingStripe}
                  returnUrl={`${typeof window !== 'undefined' ? window.location.origin : 'https://www.baemeds.com'}/checkout?payment_redirect=true`}
                />

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('delivery');
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-medical-primary"
                  >
                    <ArrowLeft size={14} />
                    <span>Change Delivery Options</span>
                  </button>
                  <span className="text-[11px] text-slate-400">
                    Final step: Click Place Order above to complete purchase
                  </span>
                </div>
              </section>
            )}
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

              {/* Promotional / Coupon Code Section */}
              <div className="mt-4 border-t border-medical-light pt-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-900 tracking-wide uppercase">{appliedCoupon.code}</span>
                        <span className="ml-1 text-emerald-700">
                          ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% OFF` : `$${appliedCoupon.value.toFixed(2)} OFF`})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="font-bold text-rose-600 hover:text-rose-800 text-xs px-2 py-1 rounded hover:bg-rose-50 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label htmlFor="promo-code-input" className="block text-xs font-bold uppercase tracking-wider text-medical-text/80">
                      Promo / Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          id="promo-code-input"
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponError('');
                            setCouponSuccess('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          placeholder="e.g. WELCOME10"
                          className="w-full rounded-xl border border-medical-light bg-[#fbfaf8] px-3.5 py-2.5 text-xs font-semibold text-medical-dark uppercase placeholder:normal-case placeholder:font-normal focus:border-medical-primary focus:bg-white focus:outline-none"
                        />
                        <Tag size={14} className="absolute right-3 top-3 text-slate-400" />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={!couponInput.trim() || isApplyingCoupon}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-medical-primary disabled:opacity-40 transition shrink-0"
                      >
                        {isApplyingCoupon ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                    )}
                    {couponSuccess && (
                      <p className="text-[11px] text-emerald-700 font-medium">{couponSuccess}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Calculations */}
              <div className="mt-4 space-y-2.5 border-t border-medical-light pt-4 text-sm text-medical-text/80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-medical-dark">${cartTotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag size={13} className="text-emerald-600" />
                      <span>Discount ({appliedCoupon.code})</span>
                    </span>
                    <span className="font-bold">-${appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-medical-dark">
                    ${shippingCost.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Estimated Tax</span>
                      <span className="text-xs font-mono text-slate-500">({taxCalc.rateLabel})</span>
                      {taxCalc.isExempt && (
                        <span className="rounded bg-emerald-100/90 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                          EXEMPT
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-medical-dark">
                      {taxAmount === 0 ? '$0.00' : `$${taxAmount.toFixed(2)}`}
                    </span>
                  </div>
                  {taxCalc.exemptionReason && (
                    <p className="text-[11px] text-emerald-700 leading-tight">
                      {taxCalc.exemptionReason}
                    </p>
                  )}
                </div>
                <div className="flex justify-between border-t border-medical-light pt-3 text-base font-bold text-medical-dark">
                  <span>Total Due</span>
                  <span className="text-xl text-medical-primary">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Dynamic Step Advance / Submit Button */}
              {currentStep === 'shipping' && (
                <button
                  type="button"
                  onClick={goToNextFromShipping}
                  className="mt-6 flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white shadow-soft transition hover:bg-medical-dark"
                >
                  <span>Continue to Step 2 (Delivery)</span>
                  <ArrowRight size={18} />
                </button>
              )}

              {currentStep === 'delivery' && (
                <button
                  type="button"
                  onClick={goToNextFromDelivery}
                  className="mt-6 flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white shadow-soft transition hover:bg-medical-dark"
                >
                  <span>Continue to Step 3 (Payment)</span>
                  <ArrowRight size={18} />
                </button>
              )}

              {currentStep === 'payment' && (
                <button
                  type="submit"
                  form="stripe-checkout-form"
                  disabled={isSubmitting || isInitializingStripe}
                  className="mt-6 flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white shadow-soft transition hover:bg-medical-dark disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Processing Secure Order...</span>
                  ) : isInitializingStripe ? (
                    <span>Connecting Gateway...</span>
                  ) : (
                    <>
                      <Lock size={16} /> Place Order — ${finalTotal.toFixed(2)}
                    </>
                  )}
                </button>
              )}

              <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-medical-text/60">
                <ShieldCheck size={14} className="text-medical-primary" />
                <span>Certified medical fulfillment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
