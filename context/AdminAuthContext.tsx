import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminRole, AdminUser } from '../types';
import { AdminApiClient } from '../lib/adminApi';
import { ROLE_PERMISSIONS } from '../lib/rbacConfig';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  role: AdminRole;
  hasPermission: (permission: string) => boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<AdminRole>('super_admin');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isAuthed = AdminApiClient.isAuthenticated();
    if (isAuthed) {
      const stored = AdminApiClient.getCurrentUser();
      if (stored) {
        setUser({
          id: `usr_staff_${stored.role}`,
          email: stored.email,
          name: stored.name,
          role: stored.role,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        setRole(stored.role);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated) return false;
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminApiClient.login(email, pass);
      setUser(data.user);
      setRole(data.user.role);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AdminApiClient.logout();
    setIsAuthenticated(false);
    setUser(null);
    setRole('super_admin');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        user,
        role,
        hasPermission,
        login,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
