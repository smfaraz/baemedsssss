import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Link } from '../../context/CartContext';

interface RequirePermissionProps {
  permission: string;
  resourceTitle?: string;
  children: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  resourceTitle,
  children,
}) => {
  const { role, hasPermission, isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return null; // AdminLayout will render the login screen
  }

  const isAuthorized = hasPermission(permission);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 mb-5 shadow-soft border border-rose-100">
          <ShieldAlert size={38} />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Access Restricted</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          Your active staff role (<span className="font-bold text-slate-900 capitalize">{role.replace('_', ' ')}</span>) does not possess authorization to access {resourceTitle || 'this administrative section'}.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600">
          <span className="text-slate-400">Required Privilege:</span>
          <span className="font-bold text-medical-primary">{permission}</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-medical-primary px-5 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-medical-dark transition"
          >
            <ArrowLeft size={15} /> Return to Dashboard
          </Link>
          <Link
            to="/admin/settings/roles"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Inspect Role Matrix
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequirePermission;
