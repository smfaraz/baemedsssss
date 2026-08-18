import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams } from '../context/CartContext';
import { APP_NAME } from '../constants';
import { safeReturnPath } from '../lib/safeReturnPath';

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-3 text-sm text-medical-text outline-none focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15';

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('returnTo'));

  useEffect(() => { if (isAuthenticated) navigate(returnTo); }, [isAuthenticated, navigate, returnTo]);
  const update = (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    try { await register(form.email, form.password, form.firstName, form.lastName); navigate(returnTo); }
    catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Your account could not be created. Please try again.'); }
  };

  return (
    <main className="min-h-[82vh] px-4 py-10 sm:py-16" style={{ backgroundColor: '#f6f3ee' }}>
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft md:grid-cols-[0.85fr_1.15fr]">
        <section className="bg-medical-dark p-7 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-medical-accent">{APP_NAME} account</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Save your details for a faster return visit.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-200">Use your account to view order history and keep delivery addresses together.</p>
          <Link to="/products" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-medical-accent px-4 py-2 font-semibold text-medical-accent hover:bg-medical-accent/10">Browse without an account <ArrowRight size={18} aria-hidden="true" /></Link>
        </section>
        <section className="p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-medical-primary">Create account</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-medical-dark">Get started</h2>
          <p className="mt-2 text-sm text-slate-600">All fields are required.</p>
          {error && <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />{error}</div>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-1.5 block text-sm font-semibold text-medical-text">First name</span><span className="relative block"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" /><input className={inputClass} name="firstName" autoComplete="given-name" required value={form.firstName} onChange={update} /></span></label>
              <label><span className="mb-1.5 block text-sm font-semibold text-medical-text">Last name</span><span className="relative block"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" /><input className={inputClass} name="lastName" autoComplete="family-name" required value={form.lastName} onChange={update} /></span></label>
            </div>
            <label><span className="mb-1.5 block text-sm font-semibold text-medical-text">Email address</span><span className="relative block"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" /><input className={inputClass} type="email" name="email" autoComplete="email" required value={form.email} onChange={update} /></span></label>
            <label><span className="mb-1.5 block text-sm font-semibold text-medical-text">Password</span><span className="relative block"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" /><input className={`${inputClass} pr-12`} type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" minLength={6} required value={form.password} onChange={update} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></span><span className="mt-1.5 block text-xs text-slate-500">Minimum 6 characters</span></label>
            <button type="submit" disabled={isLoading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-medical-primary px-5 py-3 font-bold text-white hover:bg-medical-dark disabled:opacity-60">{isLoading ? 'Creating account…' : 'Create account'} {!isLoading && <ArrowRight size={18} aria-hidden="true" />}</button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">Already registered? <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="inline-flex min-h-11 items-center px-1 font-bold text-medical-primary">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
};

export default RegisterPage;
