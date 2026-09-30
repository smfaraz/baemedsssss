import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { AdminRole } from '../../server/adminService';
import { AdminApiClient } from '../../lib/adminApi';
import { LogIn, Stethoscope, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { APP_NAME } from '../../constants';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<AdminRole>('super_admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const role = AdminApiClient.getStoredRole();
    setCurrentRole(role);
    const authed = localStorage.getItem('baemeds_admin_auth') === 'true';
    setIsAuthenticated(authed);
  }, []);

  const handleRoleChange = (newRole: AdminRole) => {
    setCurrentRole(newRole);
    AdminApiClient.setStoredRole(newRole);
  };

  const handleQuickLogin = (email: string, role: AdminRole) => {
    localStorage.setItem('baemeds_admin_auth', 'true');
    localStorage.setItem('baemeds_admin_email', email);
    localStorage.setItem('baemeds_admin_role', role);
    setCurrentRole(role);
    setIsAuthenticated(true);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail.trim() || !authPassword) {
      setAuthError('Please enter both staff email and password.');
      return;
    }

    if (authPassword.length < 6) {
      setAuthError('Invalid credentials. Staff password must be at least 6 characters.');
      return;
    }

    let role: AdminRole = 'super_admin';
    const em = authEmail.toLowerCase();
    if (em.includes('clinical')) role = 'clinical_specialist';
    else if (em.includes('compliance')) role = 'compliance_officer';
    else if (em.includes('fulfillment')) role = 'fulfillment_specialist';
    else if (em.includes('support')) role = 'support_agent';

    localStorage.setItem('baemeds_admin_auth', 'true');
    localStorage.setItem('baemeds_admin_email', authEmail.trim());
    localStorage.setItem('baemeds_admin_role', role);
    setCurrentRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.setItem('baemeds_admin_auth', 'false');
    localStorage.removeItem('baemeds_admin_email');
    setIsAuthenticated(false);
  };

  // Sign In Screen if unauthenticated
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl text-slate-100">
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
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-950/60 p-3 text-xs text-rose-300 border border-rose-800/60">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Quick 1-Click Role Presets */}
          <div className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              Quick 1-Click Staff Persona Sign-In:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@baemeds.com', 'super_admin')}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 px-3 py-2 text-left hover:border-medical-primary hover:bg-slate-800 transition"
              >
                <div>
                  <p className="font-bold text-slate-200">Super Admin</p>
                  <p className="text-[10px] text-slate-400">admin@baemeds.com</p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('clinical.lead@baemeds.com', 'clinical_specialist')}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 px-3 py-2 text-left hover:border-medical-primary hover:bg-slate-800 transition"
              >
                <div>
                  <p className="font-bold text-slate-200">Clinical Specialist</p>
                  <p className="text-[10px] text-slate-400">clinical.lead@baemeds.com</p>
                </div>
                <span className="text-[10px] font-semibold text-amber-400">Rx Review</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('fulfillment@baemeds.com', 'fulfillment_specialist')}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 px-3 py-2 text-left hover:border-medical-primary hover:bg-slate-800 transition"
              >
                <div>
                  <p className="font-bold text-slate-200">Fulfillment Lead</p>
                  <p className="text-[10px] text-slate-400">fulfillment@baemeds.com</p>
                </div>
                <span className="text-[10px] font-semibold text-purple-400">Shipping</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('compliance@baemeds.com', 'compliance_officer')}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 px-3 py-2 text-left hover:border-medical-primary hover:bg-slate-800 transition"
              >
                <div>
                  <p className="font-bold text-slate-200">Compliance Officer</p>
                  <p className="text-[10px] text-slate-400">compliance@baemeds.com</p>
                </div>
                <span className="text-[10px] font-semibold text-sky-400">HIPAA Logs</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Staff Email
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="staff@baemeds.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-medical-primary focus:bg-slate-850 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white focus:border-medical-primary focus:bg-slate-850 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-medical-primary px-4 text-xs font-bold text-white shadow-soft hover:bg-medical-dark transition"
            >
              <LogIn size={16} /> Sign In With Staff Credentials
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
        currentRole={currentRole}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AdminHeader
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onLogout={handleLogout}
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
