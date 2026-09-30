import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Address } from '../types';
import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerSession,
  loginCustomerSession,
  logoutCustomerSession,
  recoverCustomerSession,
  registerCustomerSession,
} from '../lib/accountApi';

interface AuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  refreshCustomer: () => Promise<Customer | null>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, first: string, last: string) => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  addNewAddress: (address: Omit<Address, 'id'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const errorMessage = (value: unknown, fallback: string) =>
    value instanceof Error && value.message ? value.message : fallback;

  const refreshCustomer = async () => {
      const customerData = await getCustomerSession();
      setCustomer(customerData);
      return customerData;
  };

  useEffect(() => {
    const initAuth = async () => {
      // Remove the legacy JavaScript-readable bearer token. New sessions use
      // a Secure, HttpOnly cookie issued by the same-origin Vercel function.
      localStorage.removeItem('shopify_customer_token');
      try {
        await refreshCustomer();
      } catch (sessionError) {
        console.error('The account session could not be restored.', sessionError);
        setCustomer(null);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginCustomerSession(email, pass);
      const customerData = await refreshCustomer();
      if (!customerData) throw new Error('Could not retrieve your BaeMeds customer profile.');
    } catch (loginError) {
      setCustomer(null);
      const message = errorMessage(loginError, 'Sign-in failed. Please check your details and try again.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, first: string, last: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await registerCustomerSession(email, pass, first, last);
      const customerData = await refreshCustomer();
      if (!customerData) throw new Error('Your account was created, but the signed-in profile could not be loaded.');
    } catch (registrationError) {
      const message = errorMessage(registrationError, 'Account creation failed. Please review your details and try again.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const recoverPassword = async (email: string) => {
      setError(null);
      try {
        await recoverCustomerSession(email);
      } catch (recoveryError) {
        const message = errorMessage(recoveryError, 'The password recovery request could not be submitted.');
        setError(message);
        throw new Error(message);
      }
  };

  const addNewAddress = async (address: Omit<Address, 'id'>) => {
      if (!customer) throw new Error('Sign in before adding a delivery address.');
      setIsLoading(true);
      setError(null);
      try {
        await createCustomerAddress(address);
        await refreshCustomer();
      } catch (addressError) {
        const message = errorMessage(addressError, 'The delivery address could not be saved.');
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
  };

  const removeAddress = async (id: string) => {
      if (!customer) throw new Error('Sign in before removing a delivery address.');
      setIsLoading(true);
      setError(null);
      try {
        await deleteCustomerAddress(id);
        await refreshCustomer();
      } catch (addressError) {
        const message = errorMessage(addressError, 'The delivery address could not be removed.');
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await logoutCustomerSession();
      setCustomer(null);
      window.location.href = '/login';
    } catch (logoutError) {
      const message = errorMessage(logoutError, 'Sign-out could not be completed. Please try again.');
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      customer, 
      isAuthenticated: !!customer, 
      isLoading, 
      error,
      clearError: () => setError(null),
      refreshCustomer,
      login, 
      register, 
      recoverPassword,
      logout,
      addNewAddress,
      removeAddress
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
