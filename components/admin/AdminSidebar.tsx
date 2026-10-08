import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  FileCheck2,
  FileText,
  Tag,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { Link, useLocation } from '../../context/CartContext';
import { AdminRole } from '../../types';
import { ROLE_PERMISSIONS } from '../../lib/rbacConfig';
import BrandMark from '../BrandMark';

interface AdminSidebarProps {
  currentRole: AdminRole;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  permission?: string;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentRole,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { pathname } = useLocation();

  const userPerms = ROLE_PERMISSIONS[currentRole] || [];

  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        {
          label: 'Operations Deck',
          href: '/admin',
          icon: LayoutDashboard,
          permission: 'dashboard:view',
        },
      ],
    },
    {
      title: 'COMMERCE & LOGISTICS',
      items: [
        {
          label: 'Orders & Fulfillment',
          href: '/admin/orders',
          icon: ShoppingCart,
          permission: 'orders:view',
        },
        {
          label: 'Product Catalog',
          href: '/admin/products',
          icon: Package,
          permission: 'products:view',
        },
        {
          label: 'Inventory Control',
          href: '/admin/inventory',
          icon: Boxes,
          permission: 'inventory:view',
        },
        {
          label: 'Customer Accounts',
          href: '/admin/customers',
          icon: Users,
          permission: 'customers:view',
        },
      ],
    },
    {
      title: 'COMPLIANCE & AUDIT',
      items: [
        {
          label: 'HIPAA Audit Trail',
          href: '/admin/audit-logs',
          icon: ShieldCheck,
          permission: 'audit_logs:view',
        },
        {
          label: 'FDA Device & UDI Registry',
          href: '/admin/compliance',
          icon: FileCheck2,
          permission: 'compliance:view',
        },
      ],
    },
    {
      title: 'STORE CONFIGURATION',
      items: [
        {
          label: 'Promotions & Coupons',
          href: '/admin/discounts',
          icon: Tag,
          permission: 'discounts:view',
        },
        {
          label: 'Invoice & Slip Design',
          href: '/admin/settings/invoices',
          icon: FileText,
          permission: 'settings:view',
        },
        {
          label: 'Tax Nexus Rules',
          href: '/admin/tax',
          icon: Receipt,
          permission: 'tax:view',
        },
        {
          label: 'Analytics & Revenue',
          href: '/admin/analytics',
          icon: BarChart3,
          permission: 'analytics:view',
        },
      ],
    },
    {
      title: 'SECURITY & GOVERNANCE',
      items: [
        {
          label: 'Staff Directory',
          href: '/admin/settings/users',
          icon: Users,
          permission: 'staff:view',
        },
        {
          label: 'Role Permissions (RBAC)',
          href: '/admin/settings/roles',
          icon: ShieldCheck,
          permission: 'roles:view',
        },
        {
          label: 'Platform Settings',
          href: '/admin/settings',
          icon: Settings,
          permission: 'settings:view',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800/80 bg-[#0B1F33] text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800/80 px-4">
          <Link to="/admin" className="flex items-center gap-2">
            <BrandMark inverse compact />
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-300 uppercase tracking-wider">
              Admin
            </span>
          </Link>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded border border-slate-700/80 bg-slate-800/50 px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-slate-600 hover:text-white transition"
            title="Open customer storefront in new tab"
          >
            <span>Store</span>
            <ExternalLink size={10} />
          </a>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3.5 space-y-4">
          {sections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || userPerms.includes(item.permission)
            );

            if (!visibleItems.length) return null;

            return (
              <div key={section.title}>
                <p className="px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
                <nav className="mt-1 space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive =
                      item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href);

                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={onCloseMobile}
                        className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                          isActive
                            ? 'bg-[#14539A] text-white shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            size={15}
                            className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeColor || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Footer Role & HIPAA Badge */}
        <div className="shrink-0 border-t border-slate-800/80 p-3 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  HIPAA Enforced
                </span>
              </div>
              <p className="truncate text-xs font-medium text-slate-200 capitalize">
                {currentRole.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
