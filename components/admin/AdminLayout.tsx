import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { LogIn, Stethoscope, Lock, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { APP_NAME } from '../../constants';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isAuthenticated, role, user, login, logout, isLoading } = useAdminAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both staff email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(authEmail.trim(), authPassword);
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Invalid staff credentials. Access denied.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign In Screen if unauthenticated
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl text-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-medical-primary text-white shadow-md shadow-medical-primary/20">
              <Stethoscope size={24} />
            </span>
            <div>
              <h1 className="text-xl font-black text-white">{APP_NAME} Admin</h1>
              <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Clinical Control Plane & Back-Office
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-400 mb-6">
            Authorized medical equipment staff operations. Secured under HIPAA Title II safeguards with continuous cryptographic audit logging.
          </p>

          {authError && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-950/60 p-3.5 text-xs text-rose-300 border border-rose-800/60" role="alert">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="staff-email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Staff Email
              </label>
              <input
                id="staff-email-input"
                type="email"
                required
                autoComplete="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="staff@baemeds.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:border-medical-primary focus:bg-slate-850 focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="staff-password-input" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="staff-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 pr-10 text-xs text-white placeholder:text-slate-500 focus:border-medical-primary focus:bg-slate-850 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-medical-primary px-4 text-xs font-bold text-white shadow-soft hover:bg-medical-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <LogIn size={16} /> Authenticate Staff Session
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between text-slate-400 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Lock size={12} className="text-emerald-400" />
              <span>256-bit encrypted administrative gateway</span>
            </div>
            <a href="/" className="text-slate-400 hover:text-white transition">
              Return to Storefront →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Persistent Sidebar */}
      <AdminSidebar
        currentRole={role}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AdminHeader
          currentRole={role}
          currentUser={user}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <AdminBreadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
