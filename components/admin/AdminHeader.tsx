import React, { useState } from 'react';
import {
  Menu,
  Search,
  Shield,
  LogOut,
  User,
  ExternalLink,
} from 'lucide-react';
import { AdminRole, AdminUser } from '../../types';
import { useNavigate } from '../../context/CartContext';

interface AdminHeaderProps {
  currentRole: AdminRole;
  currentUser?: AdminUser | null;
  onToggleMobileMenu: () => void;
  onLogout: () => void;
}

const ROLE_BADGES: Record<AdminRole, { label: string; color: string; border: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-200' },
  clinical_specialist: { label: 'Clinical Specialist', color: 'bg-amber-50 text-amber-800', border: 'border-amber-200' },
  fulfillment_specialist: { label: 'Fulfillment Specialist', color: 'bg-purple-50 text-purple-800', border: 'border-purple-200' },
  support_agent: { label: 'Support Agent', color: 'bg-blue-50 text-blue-800', border: 'border-blue-200' },
  compliance_officer: { label: 'Compliance Officer', color: 'bg-sky-50 text-sky-800', border: 'border-sky-200' },
  customer: { label: 'Customer', color: 'bg-slate-50 text-slate-800', border: 'border-slate-200' },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentRole,
  currentUser,
  onToggleMobileMenu,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/products?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const activeEmail = currentUser?.email || localStorage.getItem('baemeds_admin_email') || 'staff@baemeds.com';
  const activeName = currentUser?.name || localStorage.getItem('baemeds_admin_name') || 'Staff Member';
  const roleBadge = ROLE_BADGES[currentRole] || ROLE_BADGES.super_admin;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-4">
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
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, SKUs, customer records..."
            className="w-full rounded-md border border-slate-200 bg-slate-50/80 py-1.5 pl-8 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#14539A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#14539A] transition"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 bg-white px-1 py-0.2 rounded">
            /
          </span>
        </form>

        {/* Clinical Operations Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/70 px-2.5 py-0.5 text-[10px] text-emerald-800 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-semibold">FDA & HIPAA Active</span>
        </div>
      </div>

      {/* Right: Authenticated Role Badge & User Menu */}
      <div className="flex items-center gap-2.5">
        {/* Verified Role Badge (Authoritative, Read-Only) */}
        <div
          className={`flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium ${roleBadge.border} ${roleBadge.color}`}
          title="Authoritative Staff Role assigned via secure administrative directory"
        >
          <Shield size={12} className="shrink-0 text-[#14539A]" />
          <span className="font-mono font-semibold">{roleBadge.label}</span>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-1.5 rounded bg-[#0B1F33] px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-[#0F3A63] transition"
          >
            <User size={13} className="text-[#F2A63C]" />
            <span className="hidden sm:inline font-mono text-[11px] text-slate-200">
              {activeEmail.split('@')[0]}
            </span>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="text-xs font-bold text-slate-900">{activeName}</p>
                <p className="text-[11px] text-slate-500 truncate font-mono">{activeEmail}</p>
                <span className={`inline-block mt-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${roleBadge.color} border ${roleBadge.border}`}>
                  {roleBadge.label}
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <ExternalLink size={13} /> Open Storefront
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut size={13} /> Sign Out
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
