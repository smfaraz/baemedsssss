import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  FileCheck2,
  Tag,
  Truck,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronRight,
  Stethoscope,
  ExternalLink,
  Rocket,
} from 'lucide-react';
import { Link, useLocation } from '../../context/CartContext';
import { AdminRole, ROLE_PERMISSIONS } from '../../server/adminService';
import { APP_NAME } from '../../constants';

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
          label: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
          permission: 'dashboard:view',
        },
        {
          label: '15-Day Launch Roadmap',
          href: '/admin/roadmap',
          icon: Rocket,
          permission: 'dashboard:view',
          badge: 'Oct 15',
          badgeColor: 'bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30',
        },
      ],
    },
    {
      title: 'COMMERCE',
      items: [
        {
          label: 'Orders',
          href: '/admin/orders',
          icon: ShoppingCart,
          permission: 'orders:view',
          badge: 'Live',
          badgeColor: 'bg-emerald-100 text-emerald-800',
        },
        {
          label: 'Products',
          href: '/admin/products',
          icon: Package,
          permission: 'products:view',
        },
        {
          label: 'Product Research & Margins',
          href: '/admin/research',
          icon: BarChart3,
          permission: 'products:view',
          badge: '549 SKUs',
          badgeColor: 'bg-teal-500/20 text-teal-400 font-bold border border-teal-500/30',
        },
        {
          label: 'Inventory',
          href: '/admin/inventory',
          icon: Boxes,
          permission: 'inventory:view',
        },
        {
          label: 'Customers',
          href: '/admin/customers',
          icon: Users,
          permission: 'customers:view',
        },
      ],
    },
    {
      title: 'CLINICAL & COMPLIANCE',
      items: [
        {
          label: 'Prescription Queue',
          href: '/admin/prescriptions',
          icon: FileCheck2,
          permission: 'prescriptions:view',
          badge: 'Rx',
          badgeColor: 'bg-amber-100 text-amber-800',
        },
        {
          label: 'Audit Logs',
          href: '/admin/audit-logs',
          icon: ShieldCheck,
          permission: 'audit_logs:view',
        },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          label: 'Discounts',
          href: '/admin/discounts',
          icon: Tag,
          permission: 'discounts:view',
        },
        {
          label: 'Shipping Tiers',
          href: '/admin/shipping',
          icon: Truck,
          permission: 'shipping:view',
        },
        {
          label: 'Tax & Nexus',
          href: '/admin/tax',
          icon: Receipt,
          permission: 'tax:view',
        },
        {
          label: 'Analytics',
          href: '/admin/analytics',
          icon: BarChart3,
          permission: 'analytics:view',
        },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        {
          label: 'Staff Accounts',
          href: '/admin/settings/users',
          icon: Users,
          permission: 'staff:view',
        },
        {
          label: 'Role Permissions',
          href: '/admin/settings/roles',
          icon: Settings,
          permission: 'roles:view',
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-medical-primary text-white shadow-xs">
              <Stethoscope size={20} />
            </span>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900">
                {APP_NAME}
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-medical-primary">
                Control Plane
              </span>
            </div>
          </Link>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title="Open customer storefront in new tab"
          >
            Store <ExternalLink size={12} />
          </a>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map((section) => {
            // Filter items by current user permissions
            const visibleItems = section.items.filter(
              (item) => !item.permission || userPerms.includes(item.permission)
            );

            if (!visibleItems.length) return null;

            return (
              <div key={section.title}>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
                <nav className="mt-2 space-y-1">
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
                        className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            size={17}
                            className={isActive ? 'text-medical-light' : 'text-slate-400 group-hover:text-slate-600'}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeColor || 'bg-slate-100 text-slate-700'
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

        {/* Footer Role Info */}
        <div className="shrink-0 border-t border-slate-200 p-4 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Operating Role
              </p>
              <p className="truncate text-xs font-black capitalize text-slate-900">
                {currentRole.replace('_', ' ')}
              </p>
            </div>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
