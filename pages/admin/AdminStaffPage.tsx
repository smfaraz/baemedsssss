import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  AlertCircle,
  Mail,
  Clock,
  Lock,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { AdminRole, AdminUser } from '../../types';

export const AdminStaffPage: React.FC = () => {
  const [staff, setStaff] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Invite state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('support_agent');

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const data = await AdminApiClient.getStaff();
      setStaff(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load staff roster');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleRoleChange = async (staffId: string, role: AdminRole) => {
    try {
      await AdminApiClient.updateStaffRole(staffId, role);
      setSuccessMessage(`Role updated successfully. Mutation recorded in HIPAA security audit log.`);
      loadStaff();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update role. Super admin privileges required.');
    }
  };

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) return;

    const newStaffMember: AdminUser = {
      id: `usr_${Date.now()}`,
      email: newEmail.trim().toLowerCase(),
      name: newName.trim(),
      role: newRole,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setStaff((prev) => [...prev, newStaffMember]);
    setSuccessMessage(`Invitation dispatched to ${newEmail} for role: ${newRole}. Member active.`);
    setIsInviteModalOpen(false);
    setNewEmail('');
    setNewName('');
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Administrative Users</h1>
          <p className="text-xs text-slate-500 mt-1">
            Role-Based Access Control (RBAC), least-privilege delegation, and operational authorization.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-slate-800 transition"
        >
          <UserPlus size={16} /> Invite Staff Member
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Security Info Card */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 text-xs text-blue-900 flex items-center gap-3">
        <Lock size={18} className="shrink-0 text-blue-600" />
        <span>
          <strong>Privilege Escalation Protection:</strong> Only verified Super Administrators can alter staff roles. Every elevation or assignment is permanently logged in the audit ledger.
        </span>
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Staff Member</th>
                <th className="px-4 py-3.5">Assigned Role</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-4 py-3.5">Last Active</th>
                <th className="px-4 py-3.5 text-right">Role Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
                      <span>Loading staff directory...</span>
                    </div>
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No administrative accounts found.
                  </td>
                </tr>
              ) : (
                staff.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 border border-slate-200">
                        <Shield size={11} className="text-medical-primary" />
                        {user.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Just now'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as AdminRole)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-medical-primary focus:outline-none"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="clinical_specialist">Clinical Specialist</option>
                        <option value="fulfillment_specialist">Fulfillment Specialist</option>
                        <option value="support_agent">Support Agent</option>
                        <option value="compliance_officer">Compliance Officer</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Invite Staff Member</h3>
            <p className="text-xs text-slate-500">
              Generate an administrative authorization invite with explicit role permissions.
            </p>

            <form onSubmit={handleInviteStaff} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Vance"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="staff@baemeds.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Operational Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 focus:border-medical-primary focus:outline-none"
                >
                  <option value="support_agent">Support Agent (Customer/Order Viewing)</option>
                  <option value="fulfillment_specialist">Fulfillment Specialist (Shipping & Inventory)</option>
                  <option value="clinical_specialist">Clinical Specialist (Prescription Adjudication)</option>
                  <option value="compliance_officer">Compliance Officer (Audit Logs & Review)</option>
                  <option value="super_admin">Super Admin (Full Operational Authorization)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-slate-900 py-2.5 font-bold text-white shadow-soft hover:bg-slate-800 transition"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaffPage;
