import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from '../../context/CartContext';

export const AdminBreadcrumbs: React.FC = () => {
  const { pathname } = useLocation();

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter((s) => s !== 'admin');

  if (segments.length === 0) return null;

  let currentPath = '/admin';

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      <Link to="/admin" className="flex items-center gap-1 hover:text-slate-900 transition">
        <Home size={13} />
        <span>Admin</span>
      </Link>

      {segments.map((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === segments.length - 1;

        // Clean label
        const formattedLabel = decodeURIComponent(segment)
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <React.Fragment key={currentPath}>
            <ChevronRight size={13} className="text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-bold text-slate-900 truncate max-w-xs">{formattedLabel}</span>
            ) : (
              <Link to={currentPath} className="hover:text-slate-900 transition truncate max-w-xs">
                {formattedLabel}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default AdminBreadcrumbs;
