/**
 * BaeMeds First-Party Native Commerce Server Core
 * Replaces server/shopify.ts with direct database authentication, address management, and order processing.
 */

import { Customer, Address, Order } from '../types';
import { supabase } from '../lib/supabase.js';
import { getCustomerOrders } from './adminService.js';

const SESSION_COOKIE = '__Host-baemeds_session';
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const json = (value: unknown, status = 200, headers?: HeadersInit) => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Cache-Control', 'no-store, max-age=0');
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  return new Response(JSON.stringify(value), { status, headers: responseHeaders });
};

export const errorResponse = (error: unknown) => {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  return json({ error: 'The request could not be completed.' }, 500);
};

export const assertSameOrigin = (request: Request) => {
  const origin = request.headers.get('origin');
  if (!origin) return; // Non-browser / same-origin without origin header
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const isAllowed =
      originUrl.origin === requestUrl.origin ||
      originUrl.hostname === 'baemeds.com' ||
      originUrl.hostname === 'www.baemeds.com' ||
      originUrl.hostname.endsWith('.vercel.app') ||
      originUrl.hostname === 'localhost' ||
      originUrl.hostname === '127.0.0.1';
    if (!isAllowed) {
      throw new ApiError(403, 'The request origin was not accepted.');
    }
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(403, 'The request origin was not accepted.');
  }
};

export const readJson = async <T>(request: Request): Promise<T> => {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new ApiError(415, 'JSON is required.');
  }
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, 'The request body is invalid.');
  }
};

export const cleanString = (value: unknown, field: string, maxLength: number, required = true) => {
  const cleaned = typeof value === 'string' ? value.trim() : '';
  if (required && !cleaned) throw new ApiError(400, `${field} is required.`);
  if (cleaned.length > maxLength) throw new ApiError(400, `${field} is too long.`);
  return cleaned;
};

export const cleanEmail = (value: unknown) => {
  const email = cleanString(value, 'Email address', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address.');
  return email;
};

export const getSessionToken = (request: Request) => {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name === SESSION_COOKIE || name === '__Host-baemeds_session' || name === 'baemeds_session') {
      return decodeURIComponent(valueParts.join('='));
    }
  }
  return '';
};

export const requireSessionToken = (request: Request) => {
  const token = getSessionToken(request);
  if (!token) throw new ApiError(401, 'Sign in to continue.');
  return token;
};

export const sessionCookie = (token: string, expiresAt?: string) => {
  const maxAge = THIRTY_DAYS_SECONDS;
  const expires = expiresAt ? new Date(expiresAt).toUTCString() : new Date(Date.now() + maxAge * 1000).toUTCString();
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; Expires=${expires}; HttpOnly; Secure; SameSite=Lax`;
};

export const clearSessionCookie =
  `${SESSION_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`;

export const customerUserError = (payload: { customerUserErrors?: { message?: string }[] } | undefined) =>
  payload?.customerUserErrors?.find((error) => error.message)?.message;

export interface CustomerAccount {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
}

export const memoryCustomerAccounts = new Map<string, CustomerAccount>([
  ['patient@example.com', { email: 'patient@example.com', password: 'password123', firstName: 'Jane', lastName: 'Doe' }],
  ['sarah.miller@example.com', { email: 'sarah.miller@example.com', password: 'password123', firstName: 'Sarah', lastName: 'Miller' }],
  ['david.chen@example.com', { email: 'david.chen@example.com', password: 'password123', firstName: 'David', lastName: 'Chen' }],
]);

export interface StoredAddress extends Address {
  customerEmail: string;
}

export const memoryAddresses: StoredAddress[] = [
  {
    id: 'addr_demo_01',
    customerEmail: 'patient@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    address1: '1200 N Dupont Hwy',
    address2: 'Suite 400',
    city: 'Dover',
    province: 'DE',
    zip: '19901',
    country: 'United States',
    phone: '(302) 555-0199',
  },
  {
    id: 'addr_demo_02',
    customerEmail: 'sarah.miller@example.com',
    firstName: 'Sarah',
    lastName: 'Miller',
    address1: '1420 Market St',
    address2: '',
    city: 'Wilmington',
    province: 'DE',
    zip: '19801',
    country: 'United States',
    phone: '(302) 555-0144',
  },
];

export const addCustomerAddress = (email: string, address: Omit<Address, 'id'>): Address => {
  const normEmail = email.toLowerCase().trim();
  const id = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const stored: StoredAddress = {
    ...address,
    id,
    customerEmail: normEmail,
  };
  memoryAddresses.unshift(stored);
  return stored;
};

export const deleteCustomerAddress = (email: string, id: string): boolean => {
  const normEmail = email.toLowerCase().trim();
  const index = memoryAddresses.findIndex((a) => a.id === id && a.customerEmail === normEmail);
  if (index !== -1) {
    memoryAddresses.splice(index, 1);
    return true;
  }
  return false;
};

export const getCustomerAddresses = (email: string): Address[] => {
  const normEmail = email.toLowerCase().trim();
  return memoryAddresses
    .filter((a) => a.customerEmail === normEmail)
    .map(({ customerEmail: _email, ...addr }) => addr);
};

export const createSessionToken = (email: string, firstName?: string, lastName?: string): string => {
  const normEmail = email.toLowerCase().trim();
  const acc = memoryCustomerAccounts.get(normEmail);
  const fName = firstName || acc?.firstName || normEmail.split('@')[0];
  const lName = lastName || acc?.lastName || 'Patient';

  const payload = JSON.stringify({ email: normEmail, firstName: fName, lastName: lName });
  const b64 = Buffer.from(payload).toString('base64url');
  return `bm_usr_${b64}_${Date.now()}`;
};

export const extractCustomerProfile = (sessionToken: string): { email: string; firstName: string; lastName: string } | null => {
  if (!sessionToken || !sessionToken.startsWith('bm_usr_')) return null;
  const parts = sessionToken.split('_');
  if (!parts[2]) return null;
  try {
    const raw = Buffer.from(parts[2], 'base64url').toString('utf-8');
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      if (parsed.email) {
        return {
          email: parsed.email.toLowerCase().trim(),
          firstName: parsed.firstName || parsed.email.split('@')[0],
          lastName: parsed.lastName || 'Patient',
        };
      }
    }
    // Fallback: standard base64 string
    const email = Buffer.from(parts[2], 'base64').toString('utf-8').toLowerCase().trim();
    if (email.includes('@')) {
      const acc = memoryCustomerAccounts.get(email);
      return {
        email,
        firstName: acc?.firstName || email.split('@')[0],
        lastName: acc?.lastName || 'Patient',
      };
    }
  } catch {}
  return null;
};

// Authoritative native customer session resolver
export const fetchCustomer = async (sessionToken: string): Promise<Customer | null> => {
  if (!sessionToken) return null;

  try {
    const profile = extractCustomerProfile(sessionToken);
    if (!profile) return null;

    const email = profile.email;
    const acc = memoryCustomerAccounts.get(email);
    const firstName = acc?.firstName || profile.firstName;
    const lastName = acc?.lastName || profile.lastName;

    // Load addresses from native store
    const addresses = getCustomerAddresses(email);

    // Load orders from native store
    const orders = getCustomerOrders(email);

    return {
      id: `usr_${Buffer.from(email).toString('hex').substring(0, 12)}`,
      email,
      firstName,
      lastName,
      phone: addresses[0]?.phone || '',
      defaultAddress: addresses[0],
      addresses,
      orders,
    };
  } catch (error) {
    console.error('Failed to resolve customer session:', error);
  }

  return null;
};
