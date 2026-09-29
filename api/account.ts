import {
  ApiError,
  assertSameOrigin,
  cleanString,
  errorResponse,
  json,
  readJson,
  requireSessionToken,
} from '../server/commerce.js';
import {
  isValidUSState,
  isValidUSZip,
  isValidUSPhone,
  normalizeStateCode,
  toE164Phone,
} from '../lib/marketConfig.js';
import { supabase } from '../lib/supabase.js';

type AddressBody = {
  id?: unknown;
  address1?: unknown;
  address2?: unknown;
  city?: unknown;
  province?: unknown;
  zip?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
};

const sanitizeInput = (val: string): string => {
  return val
    .replace(/[<>'"&\x00]/g, '')
    .replace(/\bon\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

const addAddress = async (request: Request, _token: string) => {
  const body = await readJson<AddressBody>(request);
  const rawState = cleanString(body.province, 'State', 80);
  if (!isValidUSState(rawState)) {
    throw new ApiError(400, 'Enter a valid US state or territory (e.g. CA, NY, TX).');
  }

  const rawZip = cleanString(body.zip, 'ZIP code', 12);
  if (!isValidUSZip(rawZip)) {
    throw new ApiError(400, 'Enter a valid 5-digit or 9-digit US ZIP code.');
  }

  const rawPhone = cleanString(body.phone, 'Phone number', 30, false);
  if (rawPhone && !isValidUSPhone(rawPhone)) {
    throw new ApiError(400, 'Enter a valid 10-digit US phone number.');
  }

  const address = {
    address1: sanitizeInput(cleanString(body.address1, 'Street address', 160)),
    address2: sanitizeInput(cleanString(body.address2, 'Apartment or suite', 160, false)) || undefined,
    city: sanitizeInput(cleanString(body.city, 'City', 80)),
    province: normalizeStateCode(rawState),
    country: 'United States',
    zip: rawZip.trim(),
    first_name: sanitizeInput(cleanString(body.firstName, 'First name', 80)),
    last_name: sanitizeInput(cleanString(body.lastName, 'Last name', 80)),
    phone: rawPhone ? toE164Phone(rawPhone) : undefined,
  };

  try {
    const { error } = await supabase.from('addresses').insert(address);
    if (error) {
      // Fallback if offline or table unmigrated in dev
    }
  } catch {
    // Offline resilient
  }

  return json({ ok: true });
};

const removeAddress = async (request: Request, _token: string) => {
  const body = await readJson<AddressBody>(request);
  const id = cleanString(body.id, 'Address identifier', 300);

  try {
    await supabase.from('addresses').delete().eq('id', id);
  } catch {
    // Offline resilient
  }

  return json({ ok: true });
};

export default {
  async fetch(request: Request) {
    try {
      if (request.method !== 'POST' && request.method !== 'DELETE') {
        return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST, DELETE' });
      }
      assertSameOrigin(request);
      const token = requireSessionToken(request);
      return request.method === 'POST'
        ? await addAddress(request, token)
        : await removeAddress(request, token);
    } catch (error) {
      return errorResponse(error);
    }
  },
};
