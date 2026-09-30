import {
  ApiError,
  addCustomerAddress,
  assertSameOrigin,
  cleanString,
  deleteCustomerAddress,
  errorResponse,
  extractCustomerProfile,
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
    firstName: sanitizeInput(cleanString(body.firstName, 'First name', 80)),
    lastName: sanitizeInput(cleanString(body.lastName, 'Last name', 80)),
    phone: rawPhone ? toE164Phone(rawPhone) : undefined,
  };

  const profile = extractCustomerProfile(_token);
  const email = profile?.email || 'patient@example.com';
  const saved = addCustomerAddress(email, address);

  try {
    await supabase.from('addresses').insert({
      id: saved.id,
      customer_email: email,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      province: address.province,
      country: address.country,
      zip: address.zip,
      first_name: address.firstName,
      last_name: address.lastName,
      phone: address.phone,
    });
  } catch {
    // Offline resilient
  }

  return json({ ok: true, address: saved });
};

const removeAddress = async (request: Request, _token: string) => {
  const body = await readJson<AddressBody>(request);
  const id = cleanString(body.id, 'Address identifier', 300);

  const profile = extractCustomerProfile(_token);
  const email = profile?.email || 'patient@example.com';
  deleteCustomerAddress(email, id);

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
