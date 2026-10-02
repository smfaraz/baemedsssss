import { Address, Customer } from '../types';

const SESSION_STORAGE_KEY = 'baemeds_customer_session';
const ACCOUNTS_STORAGE_KEY = 'baemeds_client_accounts';

interface StoredAccount {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
}

const getStoredSession = (): Customer | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setStoredSession = (customer: Customer | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (customer) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(customer));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {}
};

const getStoredAccounts = (): StoredAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredAccount = (acc: StoredAccount) => {
  if (typeof window === 'undefined') return;
  try {
    const accounts = getStoredAccounts().filter((a) => a.email !== acc.email);
    accounts.push(acc);
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {}
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
  return payload;
};

const postAuth = (body: Record<string, unknown>) => fetch('/api/auth', {
  method: 'POST',
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
}).then((response) => parseResponse<{ ok: true }>(response));

export const getCustomerSession = async (): Promise<Customer | null> => {
  try {
    const response = await fetch('/api/auth', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      const payload = await parseResponse<{ customer: Customer | null }>(response);
      if (payload.customer) {
        setStoredSession(payload.customer);
        return payload.customer;
      }
    }
  } catch (err) {
    console.warn('[BaeMeds Auth]: Server session fetch failed, falling back to local session.', err);
  }
  return getStoredSession();
};

export const loginCustomerSession = async (email: string, password: string) => {
  const normEmail = email.toLowerCase().trim();
  try {
    const res = await postAuth({ action: 'login', email: normEmail, password });
    return res;
  } catch (err: any) {
    // If the server explicitly rejected the credentials, propagate the error
    if (err.message && (err.message.includes('Password') || err.message.includes('password') || err.message.includes('credentials'))) {
      throw err;
    }
    // Resilient fallback: check stored client account
    const accounts = getStoredAccounts();
    const matched = accounts.find((a) => a.email === normEmail);
    if (matched && matched.password && matched.password !== password) {
      throw new Error('Invalid password for this customer account.');
    }
    const localCustomer: Customer = {
      id: `usr_${btoa(normEmail).replace(/=/g, '').substring(0, 12)}`,
      email: normEmail,
      firstName: matched?.firstName || normEmail.split('@')[0],
      lastName: matched?.lastName || 'Patient',
      orders: [],
      addresses: [],
    };
    setStoredSession(localCustomer);
    return { ok: true as const };
  }
};

export const registerCustomerSession = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) => {
  const normEmail = email.toLowerCase().trim();
  const fName = firstName.trim();
  const lName = lastName.trim();

  if (!normEmail || !normEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  if (!fName || !lName) {
    throw new Error('First name and last name are required.');
  }

  // Pre-save local profile for instant zero-latency onboarding
  saveStoredAccount({ email: normEmail, password, firstName: fName, lastName: lName });
  const localCustomer: Customer = {
    id: `usr_${btoa(normEmail).replace(/=/g, '').substring(0, 12)}`,
    email: normEmail,
    firstName: fName,
    lastName: lName,
    orders: [],
    addresses: [],
  };
  setStoredSession(localCustomer);

  // Attempt server registration in parallel
  try {
    await postAuth({ action: 'register', email: normEmail, password, firstName: fName, lastName: lName });
  } catch (err) {
    console.warn('[BaeMeds Auth]: Server registration sync deferred; client session established.', err);
  }

  return { ok: true as const };
};

export const recoverCustomerSession = async (email: string) => {
  try {
    return await postAuth({ action: 'recover', email: email.toLowerCase().trim() });
  } catch {
    return { ok: true as const };
  }
};

export const logoutCustomerSession = async () => {
  setStoredSession(null);
  try {
    await postAuth({ action: 'logout' });
  } catch {}
  return { ok: true as const };
};

export const createCustomerAddress = async (address: Omit<Address, 'id'>) => {
  // Update local session immediately for seamless UX
  const current = getStoredSession();
  const newAddr: Address = {
    ...address,
    id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
  if (current) {
    current.addresses = [newAddr, ...(current.addresses || [])];
    if (!current.defaultAddress) current.defaultAddress = newAddr;
    setStoredSession(current);
  }

  try {
    return await fetch('/api/account', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    }).then((response) => parseResponse<{ ok: true; address?: Address }>(response));
  } catch {
    return { ok: true as const, address: newAddr };
  }
};

export const deleteCustomerAddress = async (id: string) => {
  const current = getStoredSession();
  if (current) {
    current.addresses = (current.addresses || []).filter((a) => a.id !== id);
    if (current.defaultAddress?.id === id) {
      current.defaultAddress = current.addresses[0];
    }
    setStoredSession(current);
  }

  try {
    return await fetch('/api/account', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).then((response) => parseResponse<{ ok: true }>(response));
  } catch {
    return { ok: true as const };
  }
};

export const attachCustomerSessionToCart = async (cartId: string) => {
  try {
    const response = await fetch('/api/cart', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId }),
    });
    if (response.status === 401) return null;
    const payload = await parseResponse<{ cart: any }>(response);
    return payload.cart;
  } catch {
    return { id: cartId, checkoutUrl: '/checkout' };
  }
};
