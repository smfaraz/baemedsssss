/**
 * BaeMeds Customer Account & Address API Gateway
 * Handles /api/account endpoints for customer address book CRUD.
 * 100% Standalone, self-contained serverless module with zero relative imports.
 */

if (typeof globalThis !== 'undefined' && !(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = class WebSocket {};
}

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ifadlrhqsgdxeeebjblo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWRscmhxc2dkeGVlZWJqYmxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc4Nzg4NiwiZXhwIjoyMTA2MzYzODg2fQ.iqFzLb2dntbQuW4u_LZuxLA9Ki8AcFsRLO7jzUTRBco';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const SESSION_COOKIE = '__Host-baemeds_session';

const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA',
  'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]);

const US_STATES_MAP: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY'
};

const sanitizeInput = (val: string): string => {
  return (val || '')
    .replace(/[<>'"&\x00]/g, '')
    .replace(/\bon\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

const isValidUSZip = (zip: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test((zip || '').trim());
};

const isValidUSPhone = (phone: string): boolean => {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
};

const normalizeStateCode = (state: string): string => {
  const trimmed = (state || '').trim();
  if (US_STATE_CODES.has(trimmed.toUpperCase())) return trimmed.toUpperCase();
  const found = US_STATES_MAP[trimmed.toLowerCase()];
  return found || trimmed.toUpperCase();
};

const extractCustomerProfile = (req: any): { email: string; firstName?: string; lastName?: string } | null => {
  let cookieHeader = '';
  let authHeader = '';

  if (req instanceof Request) {
    cookieHeader = req.headers.get('cookie') || '';
    authHeader = req.headers.get('authorization') || '';
  } else if (req?.headers) {
    cookieHeader = req.headers.cookie || '';
    authHeader = req.headers.authorization || '';
  }

  let token = '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c: string) => c.trim());
    const sessionCookie = cookies.find((c: string) => c.startsWith(`${SESSION_COOKIE}=`));
    if (sessionCookie) {
      token = decodeURIComponent(sessionCookie.substring(`${SESSION_COOKIE}=`.length));
    }
  }

  if (!token) return null;

  if (token.startsWith('bm_usr_')) {
    try {
      const parts = token.split('_');
      if (parts.length >= 3) {
        const decoded = Buffer.from(parts[2], 'base64url').toString('utf8');
        return JSON.parse(decoded);
      }
    } catch {}
  }

  return null;
};

// Memory fallback store for addresses
const memoryAddresses = new Map<string, any[]>();

export default async function handler(req: any, res?: any) {
  const origin = (req instanceof Request ? req.headers.get('origin') : req?.headers?.origin) || '*';
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json; charset=utf-8',
  };

  const method = (req instanceof Request ? req.method : (req?.method || 'GET')).toUpperCase();

  if (method === 'OPTIONS') {
    if (req instanceof Request || (!res && typeof req?.text === 'function')) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (res && typeof res.setHeader === 'function') {
      for (const [k, v] of Object.entries(corsHeaders)) {
        res.setHeader(k, v);
      }
      res.statusCode = 204;
      return res.end();
    }
    return;
  }

  // Parse Body
  let body: any = {};
  if (req instanceof Request || (!res && typeof req?.text === 'function')) {
    if (['POST', 'DELETE', 'PUT', 'PATCH'].includes(method)) {
      body = await req.json().catch(() => ({}));
    }
  } else {
    body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    body = body || {};
  }

  const profile = extractCustomerProfile(req);
  const email = profile?.email || 'patient@example.com';

  const sendResponse = (status: number, data: any) => {
    if (req instanceof Request || (!res && typeof req?.text === 'function')) {
      return new Response(JSON.stringify(data), { status, headers: corsHeaders });
    }
    if (res && typeof res.setHeader === 'function') {
      for (const [k, v] of Object.entries(corsHeaders)) {
        res.setHeader(k, v);
      }
      res.statusCode = status;
      return res.end(JSON.stringify(data));
    }
    return data;
  };

  try {
    // 1. GET Addresses
    if (method === 'GET') {
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('customer_email', email);

        if (!error && data) {
          return sendResponse(200, { ok: true, addresses: data });
        }
      } catch {}

      const local = memoryAddresses.get(email) || [];
      return sendResponse(200, { ok: true, addresses: local });
    }

    // 2. POST Add Address
    if (method === 'POST') {
      const rawState = sanitizeInput(body.province || body.state || '');
      const stateCode = normalizeStateCode(rawState);
      if (!US_STATE_CODES.has(stateCode)) {
        return sendResponse(400, { error: 'Enter a valid US state or territory (e.g. CA, NY, TX).' });
      }

      const rawZip = sanitizeInput(body.zip || body.postalCode || '');
      if (!isValidUSZip(rawZip)) {
        return sendResponse(400, { error: 'Enter a valid 5-digit or 9-digit US ZIP code.' });
      }

      const rawPhone = sanitizeInput(body.phone || '');
      if (rawPhone && !isValidUSPhone(rawPhone)) {
        return sendResponse(400, { error: 'Enter a valid 10-digit US phone number.' });
      }

      const addressId = sanitizeInput(body.id) || `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newAddress = {
        id: addressId,
        customer_email: email,
        address1: sanitizeInput(body.address1 || body.street || ''),
        address2: sanitizeInput(body.address2 || '') || null,
        city: sanitizeInput(body.city || ''),
        province: stateCode,
        country: 'United States',
        zip: rawZip,
        firstName: sanitizeInput(body.firstName || profile?.firstName || ''),
        lastName: sanitizeInput(body.lastName || profile?.lastName || ''),
        phone: rawPhone || null,
      };

      try {
        await supabase.from('addresses').insert(newAddress);
      } catch {
        // Fallback to memory
      }

      const existing = memoryAddresses.get(email) || [];
      memoryAddresses.set(email, [newAddress, ...existing]);

      return sendResponse(200, { ok: true, address: newAddress });
    }

    // 3. DELETE Remove Address
    if (method === 'DELETE') {
      const id = sanitizeInput(body.id || '');
      if (!id) {
        return sendResponse(400, { error: 'Address identifier is required.' });
      }

      try {
        await supabase.from('addresses').delete().eq('id', id);
      } catch {}

      const existing = memoryAddresses.get(email) || [];
      memoryAddresses.set(email, existing.filter((a) => a.id !== id));

      return sendResponse(200, { ok: true });
    }

    return sendResponse(405, { error: 'Method not allowed.' });
  } catch (err: any) {
    return sendResponse(500, { error: err.message || 'Internal account processing error.' });
  }
}

handler.fetch = handler;
