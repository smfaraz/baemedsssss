/**
 * BaeMeds First-Party Native Commerce Server Core
 * Replaces server/shopify.ts with direct database authentication, address management, and order processing.
 */

import { Customer, Address, Order } from '../types';
import { supabase } from '../lib/supabase.js';

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
  if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
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
    if (name === SESSION_COOKIE) return decodeURIComponent(valueParts.join('='));
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

// Simple native in-memory/database session resolver
export const fetchCustomer = async (sessionToken: string): Promise<Customer | null> => {
  if (!sessionToken) return null;

  try {
    // Attempt decoding session token (format: bm_usr_<encodedEmail>_<timestamp>)
    if (sessionToken.startsWith('bm_usr_')) {
      const parts = sessionToken.split('_');
      const emailBase64 = parts[2];
      const email = Buffer.from(emailBase64, 'base64').toString('utf-8');

      // Fetch saved addresses from Supabase
      const { data: addressRows } = await supabase
        .from('addresses')
        .select('*')
        .order('created_at', { ascending: false });

      const addresses: Address[] = (addressRows || []).map((row: any) => ({
        id: row.id,
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        address1: row.address1 || '',
        address2: row.address2 || '',
        city: row.city || '',
        province: row.province || 'DE',
        zip: row.zip || '',
        country: row.country || 'United States',
        phone: row.phone || '',
      }));

      // Fetch orders for customer
      const { data: orderRows } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

      const orders: Order[] = (orderRows || []).map((row: any) => ({
        id: row.id,
        orderNumber: row.order_number,
        processedAt: row.created_at,
        totalPrice: { amount: String(row.total_amount), currencyCode: row.currency || 'USD' },
        totalShippingPrice: { amount: String(row.shipping_amount), currencyCode: row.currency || 'USD' },
        totalTax: { amount: String(row.tax_amount), currencyCode: row.currency || 'USD' },
        financialStatus: row.status === 'PAID' ? 'PAID' : 'PENDING',
        fulfillmentStatus: row.status === 'SHIPPED' ? 'FULFILLED' : 'UNFULFILLED',
        successfulFulfillments: row.tracking_number ? [
          {
            trackingCompany: row.carrier || 'Courier',
            trackingInfo: [{ number: row.tracking_number, url: row.tracking_url || '' }],
          }
        ] : [],
        statusUrl: '',
        lineItems: (row.order_items || []).map((item: any) => ({
          title: item.product_title,
          quantity: item.quantity,
        })),
      }));

      return {
        id: `usr_${Buffer.from(email).toString('hex').substring(0, 12)}`,
        email,
        firstName: email.split('@')[0],
        lastName: 'Patient',
        phone: '',
        defaultAddress: addresses[0],
        addresses,
        orders,
      };
    }
  } catch (error) {
    console.error('Failed to resolve customer session:', error);
  }

  return null;
};

export const createSessionToken = (email: string): string => {
  const emailBase64 = Buffer.from(email.toLowerCase()).toString('base64');
  return `bm_usr_${emailBase64}_${Date.now()}`;
};
