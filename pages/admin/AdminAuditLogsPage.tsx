import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Filter,
  Lock,
  FileSpreadsheet,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  status: 'SUCCESS' | 'DENIED' | 'ERROR';
  metadata?: Record<string, unknown>;
}

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const data = await AdminApiClient.getAuditLogs();
        setLogs(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (roleFilter !== 'all' && log.actorRole !== roleFilter) return false;
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorId.toLowerCase().includes(q) ||
      log.resourceType.toLowerCase().includes(q) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security & Compliance Audit Logs</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              <Lock size={12} /> Append-Only Immutable
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            HIPAA Title II audit trail. Records every mutation, clinical sign-off, role update, and inventory movement.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting signed audit ledger to encrypted CSV...')}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
        >
          <FileSpreadsheet size={15} /> Export Audit Log
        </button>
      </div>

      {/* Security Statement */}
      <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-xs text-slate-300 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="shrink-0 text-emerald-400" />
          <span>
            <strong>HIPAA § 164.312(b) Audit Control Standard:</strong> All administrative modifications, catalog pricing changes, patient record queries, and prescription reviews are permanently logged and cryptographically timestamped.
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search action, actor, resource ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-medical-primary focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-medical-primary focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="clinical_specialist">Clinical Specialist</option>
              <option value="compliance_officer">Compliance Officer</option>
              <option value="fulfillment_specialist">Fulfillment Specialist</option>
              <option value="support_agent">Support Agent</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-medical-primary focus:outline-none"
            >
              <option value="all">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="DENIED">DENIED (Unauthorized)</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Timestamp (UTC)</th>
                <th className="px-4 py-3.5">Actor & Role</th>
                <th className="px-4 py-3.5">Action Executed</th>
                <th className="px-4 py-3.5">Target Resource</th>
                <th className="px-4 py-3.5">Outcome</th>
                <th className="px-4 py-3.5">Audit Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
                      <span>Reading tamper-evident audit ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans text-xs">
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      <span className="font-bold text-slate-900">{log.actorId}</span>
                      <span className="block text-[10px] uppercase font-bold text-medical-primary">
                        {log.actorRole.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      <span className="font-semibold text-slate-800">{log.resourceType}</span>
                      {log.resourceId && (
                        <span className="block text-[10px] font-mono text-slate-400">{log.resourceId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-sans">
                      {log.status === 'SUCCESS' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200">
                          SUCCESS
                        </span>
                      )}
                      {log.status === 'DENIED' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700 border border-rose-200">
                          DENIED
                        </span>
                      )}
                      {log.status === 'ERROR' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700 border border-amber-200">
                          ERROR
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
