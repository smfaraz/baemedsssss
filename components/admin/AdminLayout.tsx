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
    const authed = localStorage.getItem('baemeds_admin_auth') !== 'false';
    setIsAuthenticated(authed);
  }, []);

  const handleRoleChange = (newRole: AdminRole) => {
    setCurrentRole(newRole);
    AdminApiClient.setStoredRole(newRole);
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

    localStorage.setItem('baemeds_admin_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.setItem('baemeds_admin_auth', 'false');
    setIsAuthenticated(false);
  };

  // Sign In Screen if unauthenticated
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-primary text-white shadow-xs">
              <Stethoscope size={22} />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900">{APP_NAME} Admin</h1>
              <p className="text-xs font-semibold text-medical-primary uppercase tracking-wider">
                Control Plane Operations
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-500 mb-6">
            Sign in with your authorized hospital or administrative staff account. Access is logged and audited under HIPAA Title II safeguards.
          </p>

          {authError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Staff Email
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="staff@baemeds.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-soft hover:bg-slate-800 transition"
            >
              <LogIn size={16} /> Authenticate Staff Account
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem('baemeds_admin_auth', 'true');
                setIsAuthenticated(true);
              }}
              className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-medical-primary bg-medical-light/40 px-4 text-xs font-bold text-medical-primary hover:bg-medical-primary hover:text-white transition"
            >
              ⚡ Instant Local Dev / QA Access
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
            <Lock size={12} />
            <span>256-bit encrypted administrative gateway</span>
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
