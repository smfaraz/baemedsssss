import React, { useEffect, useState } from 'react';
import { ArrowRight, Loader, LogOut, MapPin, Package, Plus, RefreshCw, ShoppingBag, Trash2, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from '../context/CartContext';
import { Address } from '../types';

const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];
const emptyAddress: Omit<Address, 'id'> = { firstName: '', lastName: '', address1: '', city: '', province: 'Telangana', zip: '', country: 'India', phone: '' };
const fieldClass = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-medical-text outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15';
const formatMoney = (amount: string, currency: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(amount));
const formatStatus = (status: string) => status.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const AccountPage: React.FC = () => {
  const { customer, logout, isAuthenticated, isLoading, refreshCustomer, addNewAddress, removeAddress } = useAuth();
  const navigate = useNavigate();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>(emptyAddress);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);

  useEffect(() => { if (!isLoading && !isAuthenticated) navigate('/login?returnTo=%2Faccount'); }, [isLoading, isAuthenticated, navigate]);
  const updateAddress = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setNewAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submitAddress = async (event: React.FormEvent) => {
    event.preventDefault(); setActionError(''); setActionMessage(''); setSavingAddress(true);
    try { await addNewAddress(newAddress); setNewAddress(emptyAddress); setShowAddressForm(false); setActionMessage('Delivery address saved to your Shopify customer account.'); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'The address could not be saved.'); }
    finally { setSavingAddress(false); }
  };
  const deleteAddress = async (address: Address) => {
    if (!window.confirm(`Remove the address at ${address.address1}?`)) return;
    setActionError('');
    setActionMessage('');
    try { await removeAddress(address.id); setActionMessage('Delivery address removed from your Shopify customer account.'); }
    catch (error) { setActionError(error instanceof Error ? error.message : 'The address could not be removed.'); }
  };
  const refreshOrders = async () => {
    setActionError('');
    setActionMessage('');
    setRefreshingOrders(true);
    try {
      await refreshCustomer();
      setActionMessage('Order, payment, fulfilment, and tracking details refreshed from Shopify.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Orders could not be refreshed.');
    } finally {
      setRefreshingOrders(false);
    }
  };

  if (isLoading || !customer) return <main className="flex min-h-[70vh] items-center justify-center" style={{ backgroundColor: '#f6f3ee' }}><div role="status" className="flex items-center gap-3 text-medical-text"><Loader className="animate-spin text-medical-primary" aria-hidden="true" /><span>Loading your account…</span></div></main>;

  return (
    <main className="min-h-screen py-8 sm:py-12" style={{ backgroundColor: '#f6f3ee' }}>
      <div className="container mx-auto max-w-7xl px-4">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-medical-primary">Customer account</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-medical-dark">Welcome, {customer.firstName || 'customer'}</h1><p className="mt-2 text-sm text-slate-600">Manage saved delivery addresses and review your orders.</p></div>
          <button type="button" onClick={() => logout().catch((error) => setActionError(error instanceof Error ? error.message : 'Sign-out could not be completed.'))} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-medical-alert bg-white px-4 py-2 text-sm font-bold text-medical-alert hover:bg-red-50"><LogOut size={17} aria-hidden="true" /> Sign out</button>
        </header>
        {actionError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{actionError}</div>}
        {actionMessage && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{actionMessage}</div>}

        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-medical-light text-medical-primary"><User size={22} aria-hidden="true" /></span><h2 className="text-xl font-bold text-medical-dark">Profile</h2></div>
              <dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Name</dt><dd className="mt-1 font-semibold text-medical-dark">{customer.firstName} {customer.lastName}</dd></div><div><dt className="text-slate-500">Email</dt><dd className="mt-1 break-all font-semibold text-medical-dark">{customer.email}</dd></div><div><dt className="text-slate-500">Phone</dt><dd className="mt-1 font-semibold text-medical-dark">{customer.phone || 'Not added'}</dd></div></dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-medical-light text-medical-primary"><MapPin size={22} aria-hidden="true" /></span><h2 className="text-xl font-bold text-medical-dark">Addresses</h2></div><button type="button" onClick={() => setShowAddressForm(true)} className="flex h-11 w-11 items-center justify-center rounded-xl text-medical-primary hover:bg-medical-light" aria-label="Add delivery address"><Plus aria-hidden="true" /></button></div>
              {showAddressForm ? (
                <form onSubmit={submitAddress} className="mt-5 space-y-4 border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between"><h3 className="font-bold text-medical-dark">New address</h3><button type="button" onClick={() => setShowAddressForm(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Close address form"><X size={19} aria-hidden="true" /></button></div>
                  <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-semibold text-medical-text">First name</span><input className={fieldClass} name="firstName" autoComplete="shipping given-name" required value={newAddress.firstName} onChange={updateAddress} /></label><label><span className="mb-1 block text-sm font-semibold text-medical-text">Last name</span><input className={fieldClass} name="lastName" autoComplete="shipping family-name" required value={newAddress.lastName} onChange={updateAddress} /></label></div>
                  <label><span className="mb-1 block text-sm font-semibold text-medical-text">Street address</span><input className={fieldClass} name="address1" autoComplete="shipping address-line1" required value={newAddress.address1} onChange={updateAddress} /></label>
                  <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-semibold text-medical-text">City</span><input className={fieldClass} name="city" autoComplete="shipping address-level2" required value={newAddress.city} onChange={updateAddress} /></label><label><span className="mb-1 block text-sm font-semibold text-medical-text">State</span><select className={fieldClass} name="province" autoComplete="shipping address-level1" required value={newAddress.province} onChange={updateAddress}>{INDIAN_STATES.map((state) => <option key={state}>{state}</option>)}</select></label></div>
                  <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-semibold text-medical-text">PIN code</span><input className={fieldClass} name="zip" autoComplete="shipping postal-code" inputMode="numeric" pattern="[0-9]{6}" required value={newAddress.zip} onChange={updateAddress} /></label><label><span className="mb-1 block text-sm font-semibold text-medical-text">Phone</span><input className={fieldClass} name="phone" type="tel" autoComplete="shipping tel" value={newAddress.phone || ''} onChange={updateAddress} /></label></div>
                  <button type="submit" disabled={savingAddress} className="min-h-11 w-full rounded-xl bg-medical-dark px-4 py-2 font-bold text-white hover:bg-medical-primary disabled:opacity-60">{savingAddress ? 'Saving…' : 'Save address'}</button>
                </form>
              ) : (
                <div className="mt-5 space-y-3">{customer.addresses?.length ? customer.addresses.map((address) => <article key={address.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><address className="not-italic text-sm leading-6 text-slate-600"><span className="flex flex-wrap items-center gap-2"><strong className="text-medical-dark">{address.firstName} {address.lastName}</strong>{customer.defaultAddress?.id === address.id && <span className="rounded-full bg-medical-light px-2 py-0.5 text-xs font-bold text-medical-primary">Default</span>}</span>{address.address1}<br />{address.city}, {address.province ? `${address.province}, ` : ''}{address.zip}<br />{address.country}{address.phone && <><br />{address.phone}</>}</address><button type="button" onClick={() => deleteAddress(address)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-medical-alert hover:bg-red-50" aria-label={`Remove address at ${address.address1}`}><Trash2 size={18} aria-hidden="true" /></button></div></article>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No delivery addresses saved yet.</p>}</div>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-medical-light text-medical-primary"><Package size={22} aria-hidden="true" /></span><div><h2 className="text-xl font-bold text-medical-dark">Order history</h2><p className="text-sm text-slate-500">Shopify payment, fulfilment, and courier tracking details.</p></div></div><button type="button" onClick={refreshOrders} disabled={refreshingOrders} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-medical-primary hover:bg-medical-light disabled:opacity-60"><RefreshCw size={17} className={refreshingOrders ? 'animate-spin' : ''} aria-hidden="true" /> Refresh</button></div>
            {customer.orders?.length ? <div className="mt-6 space-y-4">{customer.orders.map((order) => {
              const tracking = order.successfulFulfillments.flatMap((fulfillment) => fulfillment.trackingInfo.map((info) => ({ ...info, company: fulfillment.trackingCompany })));
              return <article key={order.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="grid gap-4 border-b border-slate-200 pb-4 sm:grid-cols-4">
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Order</p><p className="mt-1 font-bold text-medical-dark">#{order.orderNumber}</p></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Date</p><p className="mt-1 text-sm text-slate-700">{new Date(order.processedAt).toLocaleDateString('en-IN')}</p></div>
                  <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</p><p className="mt-1 font-bold text-medical-dark">{formatMoney(order.totalPrice.amount, order.totalPrice.currencyCode)}</p></div>
                  <div>{order.statusUrl ? <a href={order.statusUrl} className="inline-flex min-h-11 items-center font-bold text-medical-primary" target="_blank" rel="noreferrer">View Shopify status <ArrowRight size={16} aria-hidden="true" /></a> : <p className="text-sm text-slate-500">Status link unavailable</p>}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-medical-light px-3 py-1.5 text-medical-primary">Payment: {formatStatus(order.financialStatus)}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">Fulfilment: {formatStatus(order.fulfillmentStatus)}</span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-slate-500">Shipping charged</dt><dd className="font-semibold text-medical-dark">{formatMoney(order.totalShippingPrice.amount, order.totalShippingPrice.currencyCode)}</dd></div>
                  <div><dt className="text-slate-500">Tax</dt><dd className="font-semibold text-medical-dark">{order.totalTax ? formatMoney(order.totalTax.amount, order.totalTax.currencyCode) : 'Not separately reported'}</dd></div>
                </dl>
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Courier tracking</p>
                  {tracking.length ? <ul className="mt-2 space-y-2">{tracking.map((info, index) => <li key={`${info.number || 'tracking'}-${index}`} className="text-sm"><span className="text-slate-600">{info.company || 'Courier'}: </span>{info.url ? <a href={info.url} target="_blank" rel="noreferrer" className="font-bold text-medical-primary hover:underline">{info.number || 'Track shipment'}</a> : <strong className="text-medical-dark">{info.number || 'Tracking details pending'}</strong>}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Tracking will appear after Shopify records the shipment.</p>}
                </div>
                <ul className="mt-4 space-y-2">{order.lineItems.map((item, index) => <li key={`${item.title}-${index}`} className="flex justify-between gap-4 text-sm"><span className="text-slate-700">{item.title}</span><span className="shrink-0 text-slate-500">Qty {item.quantity}</span></li>)}</ul>
              </article>;
            })}</div> : <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-2xl bg-slate-50 p-6 text-center"><ShoppingBag className="text-slate-300" size={42} aria-hidden="true" /><h3 className="mt-4 text-lg font-bold text-medical-dark">No orders yet</h3><p className="mt-2 max-w-sm text-sm text-slate-600">Orders linked to this account will appear here.</p><Link to="/products" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-medical-primary px-5 py-2 font-bold text-white hover:bg-medical-dark">Browse products <ArrowRight size={17} aria-hidden="true" /></Link></div>}
          </section>
        </div>
      </div>
    </main>
  );
};

export default AccountPage;
