import React, { useState } from 'react';
import {
  Menu,
  Search,
  Shield,
  LogOut,
  User,
  Check,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { AdminRole } from '../../types';
import { useNavigate } from '../../context/CartContext';

interface AdminHeaderProps {
  currentRole: AdminRole;
  onRoleChange: (role: AdminRole) => void;
  onToggleMobileMenu: () => void;
  onLogout: () => void;
}

const ROLES: { role: AdminRole; label: string; desc: string }[] = [
  { role: 'super_admin', label: 'Super Admin', desc: 'Full unrestricted platform management' },
  { role: 'clinical_specialist', label: 'Clinical Specialist', desc: 'Equipment compliance & order fulfillment' },
  { role: 'fulfillment_specialist', label: 'Fulfillment Specialist', desc: 'Orders, shipping, & inventory' },
  { role: 'support_agent', label: 'Support Agent', desc: 'Customer service & non-PHI orders' },
  { role: 'compliance_officer', label: 'Compliance Officer', desc: 'HIPAA audit logs & governance' },
];

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentRole,
  onRoleChange,
  onToggleMobileMenu,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/products?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const activeEmail = localStorage.getItem('baemeds_admin_email') || 'admin@baemeds.com';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation sidebar"
        >
          <Menu size={20} />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-72 md:w-96">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, products, SKUs, customers..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-medical-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-medical-primary/20"
          />
        </form>
      </div>

      {/* Right: Role Switcher & User Menu */}
      <div className="flex items-center gap-3">
        {/* Role Switcher for QA & RBAC Demonstration */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Shield size={14} className="text-medical-primary" />
            <span className="hidden md:inline">Role:</span>
            <span className="font-bold text-slate-900 capitalize">
              {currentRole.replace('_', ' ')}
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Operational Persona (RBAC)
              </p>
              <div className="space-y-1 mt-1">
                {ROLES.map((r) => (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => {
                      onRoleChange(r.role);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                      currentRole === r.role
                        ? 'bg-medical-light/40 text-medical-dark font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{r.label}</p>
                      <p className="text-[11px] font-normal text-slate-500">{r.desc}</p>
                    </div>
                    {currentRole === r.role && (
                      <Check size={16} className="text-medical-primary shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
          >
            <User size={14} />
            <span className="hidden sm:inline font-mono text-[11px] font-normal text-slate-300">
              {activeEmail.split('@')[0]}
            </span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-bold text-slate-900 capitalize">{currentRole.replace('_', ' ')}</p>
                <p className="text-[11px] text-slate-500 truncate">{activeEmail}</p>
              </div>
              <div className="mt-1 space-y-1">
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink size={14} /> Return to Storefront
                </a>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
