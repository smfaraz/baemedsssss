import React from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Lock,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { ROLE_PERMISSIONS, AdminRole } from '../../server/adminService';

interface PermissionDefinition {
  key: string;
  name: string;
  category: string;
  description: string;
}

const PERMISSIONS_LIST: PermissionDefinition[] = [
  { key: 'products:view', name: 'View Products', category: 'Catalog', description: 'Browse and inspect catalog medical items' },
  { key: 'products:manage', name: 'Manage Products & Pricing', category: 'Catalog', description: 'Create, edit, and modify authoritative product pricing' },
  { key: 'products:delete', name: 'Delete Products', category: 'Catalog', description: 'Permanently remove or archive products from catalog' },
  { key: 'orders:view', name: 'View Orders', category: 'Sales', description: 'Access completed customer orders and line items' },
  { key: 'orders:manage', name: 'Manage Order Status Transitions', category: 'Sales', description: 'Transition order state machine through valid paths' },
  { key: 'orders:refund', name: 'Issue Refunds', category: 'Sales', description: 'Execute financial refunds and payment reversals' },
  { key: 'prescriptions:view', name: 'View Prescription Queue', category: 'Clinical', description: 'Access patient DME medical prescriptions' },
  { key: 'prescriptions:review', name: 'Adjudicate & Approve Prescriptions', category: 'Clinical', description: 'Sign off on medical scripts with NPI validation' },
  { key: 'inventory:view', name: 'View Stock Counts', category: 'Inventory', description: 'Check warehouse on-hand and available quantities' },
  { key: 'inventory:manage', name: 'Adjust Stock & Log Reasons', category: 'Inventory', description: 'Perform audited stock additions, deductions, corrections' },
  { key: 'customers:view', name: 'View Customer Accounts', category: 'CRM', description: 'Review patient contact and transaction metrics' },
  { key: 'customers:manage', name: 'Manage Customer Accounts', category: 'CRM', description: 'Update account profiles and communication records' },
  { key: 'discounts:manage', name: 'Create & Manage Discounts', category: 'Marketing', description: 'Authoritatively configure promotional coupon codes' },
  { key: 'shipping:manage', name: 'Configure Shipping Tiers', category: 'Operations', description: 'Manage carrier rates, White-Glove delivery rules' },
  { key: 'tax:manage', name: 'Configure Tax Jurisdictions', category: 'Operations', description: 'Set state sales tax nexus and DME exemption rules' },
  { key: 'audit_logs:view', name: 'Inspect HIPAA Audit Logs', category: 'Compliance', description: 'Review immutable append-only system mutation ledger' },
  { key: 'staff:manage', name: 'Manage Staff Accounts & Roles', category: 'Security', description: 'Invite staff members, assign roles, revoke access' },
];

const ROLES: { role: AdminRole; label: string; badgeColor: string }[] = [
  { role: 'customer', label: 'Customer', badgeColor: 'bg-slate-100 text-slate-700' },
  { role: 'support_agent', label: 'Support Agent', badgeColor: 'bg-blue-50 text-blue-700' },
  { role: 'fulfillment_specialist', label: 'Fulfillment', badgeColor: 'bg-amber-50 text-amber-700' },
  { role: 'clinical_specialist', label: 'Clinical Specialist', badgeColor: 'bg-emerald-50 text-emerald-700' },
  { role: 'compliance_officer', label: 'Compliance Officer', badgeColor: 'bg-purple-50 text-purple-700' },
  { role: 'super_admin', label: 'Super Admin', badgeColor: 'bg-slate-900 text-white' },
];

export const AdminRolesPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Role-Based Access Control (RBAC) Matrix</h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative permission specifications enforced at API gateway, service layer, and database boundaries.
          </p>
        </div>
      </div>

      {/* Enforcement Architecture Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft flex items-start gap-4">
        <div className="rounded-xl bg-medical-light p-3 text-medical-primary shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div className="text-xs space-y-1">
          <h2 className="font-black text-slate-900 text-sm">Server-Authoritative RBAC Architecture</h2>
          <p className="text-slate-600 leading-relaxed">
            The BaeMeds administrative platform enforces access control strictly on the server (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">api/admin.ts</code> and <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">server/adminService.ts</code>). Frontend route hiding is an ergonomic affordance, never the security boundary. Unauthorized API invocations return <code className="font-mono font-bold text-rose-700">HTTP 401 Unauthorized</code> or <code className="font-mono font-bold text-rose-700">HTTP 403 Forbidden</code> and generate an immutable audit entry.
          </p>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50/90 font-bold text-slate-600">
              <tr>
                <th className="px-4 py-3.5 w-1/3">Capability / Permission</th>
                {ROLES.map(({ role, label, badgeColor }) => (
                  <th key={role} className="px-3 py-3.5 text-center font-black">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] ${badgeColor}`}>
                      {label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSIONS_LIST.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{perm.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{perm.key}</span>
                  </td>
                  {ROLES.map(({ role }) => {
                    const permissions = ROLE_PERMISSIONS[role] || [];
                    const isGranted = permissions.includes(perm.key);
                    return (
                      <td key={role} className="px-3 py-3 text-center">
                        {isGranted ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                            <X size={13} strokeWidth={2} />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRolesPage;
