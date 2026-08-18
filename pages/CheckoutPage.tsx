import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, Loader, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '../constants';
import { Link, useCart, useNavigate } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CheckoutPage: React.FC = () => {
  const { cart, checkoutUrl, isLoading, syncCartWithCustomer } = useCart();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const redirectStarted = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthLoading || redirectStarted.current) return;
    if (!cart.length) {
      navigate('/cart');
      return;
    }
    if (!checkoutUrl) {
      setError('Secure checkout is temporarily unavailable. Return to your cart and try again.');
      return;
    }

    redirectStarted.current = true;
    const openCheckout = async () => {
      const signedInCheckoutUrl = isAuthenticated ? await syncCartWithCustomer() : null;
      window.location.replace(signedInCheckoutUrl || checkoutUrl);
    };
    openCheckout().catch(() => {
      redirectStarted.current = false;
      setError('Secure checkout is temporarily unavailable. Return to your cart and try again.');
    });
  }, [cart.length, checkoutUrl, isAuthenticated, isAuthLoading, isLoading, navigate, syncCartWithCustomer]);

  return (
    <main className="flex min-h-[68vh] items-center justify-center bg-[#f6f3ee] px-4 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-medical-light bg-white p-6 text-center shadow-soft sm:p-10" aria-live="polite">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-medical-light text-medical-primary">
          {error ? <ShieldCheck size={30} aria-hidden="true" /> : <Loader className="animate-spin" size={30} aria-hidden="true" />}
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-medical-primary">{APP_NAME} secure checkout</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-medical-dark">
          {error ? 'Checkout needs another try' : 'Redirecting you to secure checkout…'}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-medical-text/70">
          {error || 'Create an account for faster checkout, sign in to use saved details, or continue as a guest.'}
        </p>
        {error ? (
          <Link to="/cart" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-6 py-3 font-bold text-white hover:bg-medical-dark">
            <ArrowLeft size={18} aria-hidden="true" /> Return to cart
          </Link>
        ) : (
          <p className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-medical-primary">Opening Shopify <ExternalLink size={17} aria-hidden="true" /></p>
        )}
      </section>
    </main>
  );
};

export default CheckoutPage;
