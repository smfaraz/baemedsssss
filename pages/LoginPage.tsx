import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader, Lock, Mail } from 'lucide-react';
import { APP_NAME } from '../constants';
import { Link, useNavigate, useSearchParams } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { safeReturnPath } from '../lib/safeReturnPath';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { login, recoverPassword, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get('returnTo'));

  useEffect(() => {
    if (isAuthenticated) navigate(returnTo);
  }, [isAuthenticated, navigate, returnTo]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    try {
      if (isRecoveryMode) {
        await recoverPassword(email);
        setNotice('If the email is registered, password-reset instructions have been sent.');
        return;
      }

      await login(email, password);
      navigate(returnTo);
    } catch (caughtError: any) {
      setError(caughtError.message || (isRecoveryMode
        ? 'Unable to request a password reset right now.'
        : 'Sign-in failed. Check your email and password.'));
    }
  };

  return (
    <main className="flex min-h-[76vh] items-center justify-center px-4 py-10 sm:py-14" style={{ backgroundColor: '#f6f3ee' }}>
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8" aria-labelledby="login-title">
        <div className="mb-7">
          {isRecoveryMode && (
            <button
              type="button"
              onClick={() => {
                setIsRecoveryMode(false);
                setError('');
                setNotice('');
              }}
              className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-medical-primary hover:text-medical-dark"
            >
              <ArrowLeft size={17} /> Back to sign in
            </button>
          )}
          <p className="text-xs font-black uppercase tracking-[0.14em] text-medical-primary">{APP_NAME} account</p>
          <h1 id="login-title" className="mt-2 text-3xl font-black tracking-tight text-medical-dark">
            {isRecoveryMode ? 'Reset your password' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isRecoveryMode
              ? 'Enter your account email and we will request reset instructions from the store.'
              : 'Sign in to review account details, saved addresses, and order history.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-bold text-medical-text">Email address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-medical-text outline-none transition focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15"
                placeholder="name@example.com"
              />
            </div>
          </div>

          {!isRecoveryMode && (
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-bold text-medical-text">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-12 text-medical-text outline-none transition focus:border-medical-primary focus:ring-2 focus:ring-medical-primary/15"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="tap-target absolute right-0 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRecoveryMode(true);
                  setError('');
                  setNotice('');
                }}
                className="mt-2 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-bold text-medical-primary hover:text-medical-dark"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-medical-primary px-5 font-bold text-white hover:bg-medical-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader className="animate-spin" size={20} aria-hidden="true" /> : isRecoveryMode ? 'Send reset instructions' : 'Sign in'}
          </button>
        </form>

        {!isRecoveryMode && (
          <p className="mt-6 text-center text-sm text-slate-600">
            New to {APP_NAME}? <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="font-bold text-medical-primary hover:text-medical-dark">Create an account</Link>
          </p>
        )}
      </section>
    </main>
  );
};

export default LoginPage;
