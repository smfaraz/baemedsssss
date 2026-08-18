import { Address, Customer } from '../types';

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

export const getCustomerSession = async () => {
  const response = await fetch('/api/auth', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json' },
  });
  const payload = await parseResponse<{ customer: Customer | null }>(response);
  return payload.customer;
};

export const loginCustomerSession = (email: string, password: string) =>
  postAuth({ action: 'login', email, password });

export const registerCustomerSession = (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) => postAuth({ action: 'register', email, password, firstName, lastName });

export const recoverCustomerSession = (email: string) =>
  postAuth({ action: 'recover', email });

export const logoutCustomerSession = () =>
  postAuth({ action: 'logout' });

export const createCustomerAddress = (address: Omit<Address, 'id'>) => fetch('/api/account', {
  method: 'POST',
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(address),
}).then((response) => parseResponse<{ ok: true }>(response));

export const deleteCustomerAddress = (id: string) => fetch('/api/account', {
  method: 'DELETE',
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id }),
}).then((response) => parseResponse<{ ok: true }>(response));

export const attachCustomerSessionToCart = async (cartId: string) => {
  const response = await fetch('/api/cart', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cartId }),
  });
  if (response.status === 401) return null;
  const payload = await parseResponse<{ cart: any }>(response);
  return payload.cart;
};
