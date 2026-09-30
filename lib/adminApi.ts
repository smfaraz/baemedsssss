/**
 * BaeMeds Native Admin API Client
 * Used by admin back-office components to communicate with /api/admin endpoints
 * with fallback to local mock data when offline or in standalone preview.
 */

import { AdminRole, AdminUser } from '../server/adminService';
import { Product } from '../types';

export interface AdminSessionState {
  user: AdminUser | null;
  role: AdminRole;
  isAuthenticated: boolean;
}

const getHeaders = (role?: AdminRole): HeadersInit => {
  const activeRole = role || (localStorage.getItem('baemeds_admin_role') as AdminRole) || 'super_admin';
  const email = (typeof localStorage !== 'undefined' && localStorage.getItem('baemeds_admin_email')) || 'admin@baemeds.com';
  const b64 = typeof btoa !== 'undefined' ? btoa(email) : Buffer.from(email).toString('base64');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer bm_admin_${b64}_token`,
    'X-Admin-Role': activeRole,
  };
};

export const AdminApiClient = {
  getStoredRole(): AdminRole {
    return (localStorage.getItem('baemeds_admin_role') as AdminRole) || 'super_admin';
  },

  setStoredRole(role: AdminRole) {
    localStorage.setItem('baemeds_admin_role', role);
  },

  async getDashboardMetrics(role?: AdminRole) {
    try {
      const res = await fetch('/api/admin/dashboard', { headers: getHeaders(role) });
      if (res.ok) {
        const data = await res.json();
        return data.metrics;
      }
    } catch {}

    // Fallback baseline
    return {
      revenueToday: 5480.00,
      ordersToday: 18,
      pendingOrders: 6,
      pendingPrescriptions: 2,
      lowStockProducts: 4,
      averageOrderValue: 304.44,
      conversionRate: '3.6%',
      recentOrders: [],
      recentActivity: [],
    };
  },

  async getOrders(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    try {
      const res = await fetch(`/api/admin/orders?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.orders || [];
      }
    } catch {}

    return [];
  },

  async getOrder(id: string) {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.order;
      }
    } catch {}
    return null;
  },

  async updateOrderStatus(id: string, status: string, reason?: string) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update order status');
    return data.order;
  },

  async updateOrderTracking(id: string, carrier: string, trackingNumber: string) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'tracking', carrier, trackingNumber }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update tracking');
    return data.order;
  },

  async getProducts(query?: string) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);

    try {
      const res = await fetch(`/api/admin/products?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.products || [];
      }
    } catch {}
    return [];
  },

  async getProduct(id: string) {
    try {
      const res = await fetch(`/api/admin/products/${id}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.product;
      }
    } catch {}
    return null;
  },

  async saveProduct(product: Partial<Product>) {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save product');
    return data.product;
  },

  async deleteProduct(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete product');
    return data;
  },

  async getInventory() {
    try {
      const res = await fetch('/api/admin/inventory', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.inventory || [];
      }
    } catch {}
    return [];
  },

  async adjustInventory(productId: string, delta: number, reason: string, notes?: string) {
    const res = await fetch('/api/admin/inventory', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ productId, delta, reason, notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to adjust stock');
    return data.adjustment;
  },

  async getCustomers() {
    try {
      const res = await fetch('/api/admin/customers', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.customers || [];
      }
    } catch {}
    return [];
  },

  async getPrescriptions() {
    try {
      const res = await fetch('/api/admin/prescriptions', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.prescriptions || [];
      }
    } catch {}
    return [];
  },

  async reviewPrescription(id: string, decision: 'APPROVED' | 'REJECTED', notes: string) {
    const res = await fetch(`/api/admin/prescriptions/${id}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ decision, notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Prescription review action failed');
    return data.prescription;
  },

  async getDiscounts() {
    try {
      const res = await fetch('/api/admin/discounts', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.discounts || [];
      }
    } catch {}
    return [];
  },

  async saveDiscount(discount: any) {
    const res = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(discount),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save discount code');
    return data.discount;
  },

  async getShippingSettings() {
    try {
      const res = await fetch('/api/admin/shipping', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.shipping;
      }
    } catch {}
    return null;
  },

  async getTaxSettings() {
    try {
      const res = await fetch('/api/admin/tax', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.tax;
      }
    } catch {}
    return null;
  },

  async getAuditLogs() {
    try {
      const res = await fetch('/api/admin/audit-logs', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.logs || [];
      }
    } catch {}
    return [];
  },

  async getStaff() {
    try {
      const res = await fetch('/api/admin/staff', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return data.staff || [];
      }
    } catch {}
    return [];
  },

  async updateStaffRole(staffId: string, role: AdminRole) {
    const res = await fetch(`/api/admin/staff/${staffId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update staff role');
    return data.staff;
  },
};
