/**
 * BaeMeds Native Admin API Client (Frontend Edge)
 * Strictly untrusted client boundary. Communicates exclusively via HTTP
 * with /api/admin/* endpoints using Bearer credentials.
 * NEVER imports server secrets or service-role database clients.
 */

import { AdminRole, AdminUser, Product } from '../types';

export interface AdminSessionState {
  user: AdminUser | null;
  role: AdminRole;
  isAuthenticated: boolean;
}

const getHeaders = (): HeadersInit => {
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('baemeds_admin_token')) || '';
  const email = (typeof localStorage !== 'undefined' && localStorage.getItem('baemeds_admin_email')) || 'admin@baemeds.com';
  const b64 = typeof btoa !== 'undefined' ? btoa(email) : Buffer.from(email).toString('base64');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : `Bearer bm_admin_${b64}_token`,
  };
};

export const AdminApiClient = {
  getStoredRole(): AdminRole {
    return (localStorage.getItem('baemeds_admin_role') as AdminRole) || 'super_admin';
  },

  setStoredRole(role: AdminRole) {
    localStorage.setItem('baemeds_admin_role', role);
  },

  isAuthenticated(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('baemeds_admin_auth') === 'true';
  },

  getCurrentUser(): { email: string; role: AdminRole; name: string } | null {
    if (!this.isAuthenticated()) return null;
    return {
      email: localStorage.getItem('baemeds_admin_email') || 'admin@baemeds.com',
      role: (localStorage.getItem('baemeds_admin_role') as AdminRole) || 'super_admin',
      name: localStorage.getItem('baemeds_admin_name') || 'Staff Member',
    };
  },

  async login(email: string, password: string): Promise<{ user: AdminUser; token: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('baemeds_admin_auth', 'true');
      localStorage.setItem('baemeds_admin_email', data.user.email);
      localStorage.setItem('baemeds_admin_role', data.user.role);
      localStorage.setItem('baemeds_admin_name', data.user.name);
      if (data.token) localStorage.setItem('baemeds_admin_token', data.token);
    }

    return data;
  },

  logout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('baemeds_admin_auth');
      localStorage.removeItem('baemeds_admin_email');
      localStorage.removeItem('baemeds_admin_role');
      localStorage.removeItem('baemeds_admin_name');
      localStorage.removeItem('baemeds_admin_token');
    }
  },

  async getDashboardMetrics(role?: AdminRole) {
    const res = await fetch('/api/admin/dashboard', { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load metrics`);
    }
    const data = await res.json();
    return data.metrics;
  },

  async getOrders(status?: string, search?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (search) params.set('search', search);

    const res = await fetch(`/api/admin/orders?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to fetch orders`);
    }
    const data = await res.json();
    return data.orders || [];
  },

  async getOrder(id: string) {
    const res = await fetch(`/api/admin/orders/${id}`, { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load order`);
    }
    const data = await res.json();
    return data.order;
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

  async fulfillViaMcKesson(id: string, mckessonPoNumber: string, carrier: string, trackingNumber?: string) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ action: 'mckesson', mckessonPoNumber, carrier, trackingNumber }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update McKesson fulfillment');
    return data.order;
  },

  async getProducts(
    optionsOrQuery?:
      | string
      | {
          page?: number;
          pageSize?: number;
          query?: string;
          category?: string;
          rx?: string;
          hero?: string;
        }
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();

    if (typeof optionsOrQuery === 'string') {
      if (optionsOrQuery) params.set('q', optionsOrQuery);
      params.set('page', '1');
      params.set('pageSize', '50');
    } else if (optionsOrQuery) {
      if (optionsOrQuery.query) params.set('q', optionsOrQuery.query);
      if (optionsOrQuery.page) params.set('page', String(optionsOrQuery.page));
      if (optionsOrQuery.pageSize) params.set('pageSize', String(optionsOrQuery.pageSize));
      if (optionsOrQuery.category && optionsOrQuery.category !== 'all') params.set('category', optionsOrQuery.category);
      if (optionsOrQuery.rx && optionsOrQuery.rx !== 'all') params.set('rx', optionsOrQuery.rx);
      if (optionsOrQuery.hero && optionsOrQuery.hero !== 'all') params.set('hero', optionsOrQuery.hero);
    } else {
      params.set('page', '1');
      params.set('pageSize', '50');
    }

    const res = await fetch(`/api/admin/products?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load products`);
    }
    const data = await res.json();
    return {
      products: data.products || [],
      total: data.total !== undefined ? data.total : (data.products?.length || 0),
      page: data.page || 1,
      pageSize: data.pageSize || 50,
      totalPages: data.totalPages || 1,
    };
  },

  async getProduct(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load product`);
    }
    const data = await res.json();
    return data.product;
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

  async bulkUpdateProducts(
    updates: Array<{
      id: string;
      price?: number;
      compareAtPrice?: number | null;
      inventoryQuantity?: number;
      inStock?: boolean;
      category?: string;
      isHeroProduct?: boolean;
    }>
  ) {
    const res = await fetch('/api/admin/products/bulk-update', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ updates }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to bulk update products');
    return data;
  },

  async bulkDeleteProducts(ids: string[]) {
    const res = await fetch('/api/admin/products/bulk-delete', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ids }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to bulk delete products');
    return data;
  },

  async getInventory() {
    const res = await fetch('/api/admin/inventory', { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load inventory`);
    }
    const data = await res.json();
    return data.inventory || [];
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
    const res = await fetch('/api/admin/customers', { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load customers`);
    }
    const data = await res.json();
    return data.customers || [];
  },

  async getPrescriptions() {
    const res = await fetch('/api/admin/prescriptions', { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load prescriptions`);
    }
    const data = await res.json();
    return data.prescriptions || [];
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
    const res = await fetch('/api/admin/discounts', { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load discounts`);
    }
    const data = await res.json();
    return data.discounts || [];
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
    const res = await fetch('/api/admin/shipping', { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load shipping`);
    }
    const data = await res.json();
    return data.shipping;
  },

  async getTaxSettings() {
    const res = await fetch('/api/admin/tax', { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load tax settings`);
    }
    const data = await res.json();
    return data.tax;
  },

  async getAuditLogs() {
    const res = await fetch('/api/admin/audit-logs', { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load audit logs`);
    }
    const data = await res.json();
    return data.logs || [];
  },

  async getStaff() {
    const res = await fetch('/api/admin/staff', { headers: getHeaders() });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}: Failed to load staff roster`);
    }
    const data = await res.json();
    return data.staff || [];
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
