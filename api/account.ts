import {
  ApiError,
  assertSameOrigin,
  cleanString,
  customerUserError,
  errorResponse,
  json,
  readJson,
  requireSessionToken,
  shopifyFetch,
} from '../server/shopify.js';

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

const addAddress = async (request: Request, token: string) => {
  const body = await readJson<AddressBody>(request);
  const address = {
    address1: cleanString(body.address1, 'Street address', 160),
    address2: cleanString(body.address2, 'Apartment or suite', 160, false) || undefined,
    city: cleanString(body.city, 'City', 80),
    province: cleanString(body.province, 'State', 80),
    country: 'India',
    zip: cleanString(body.zip, 'PIN code', 12),
    firstName: cleanString(body.firstName, 'First name', 80),
    lastName: cleanString(body.lastName, 'Last name', 80),
    phone: cleanString(body.phone, 'Phone number', 30, false) || undefined,
  };
  if (!/^\d{6}$/.test(address.zip)) throw new ApiError(400, 'Enter a valid 6-digit PIN code.');

  const query = `
    mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
      customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
        customerAddress { id }
        customerUserErrors { code field message }
      }
    }
  `;
  const data = await shopifyFetch<any>(query, { customerAccessToken: token, address });
  const payload = data.customerAddressCreate;
  const message = customerUserError(payload);
  if (message) throw new ApiError(400, message);
  if (!payload?.customerAddress?.id) throw new ApiError(502, 'Shopify did not confirm that the address was saved.');
  return json({ ok: true });
};

const removeAddress = async (request: Request, token: string) => {
  const body = await readJson<AddressBody>(request);
  const id = cleanString(body.id, 'Address identifier', 300);
  const query = `
    mutation customerAddressDelete($id: ID!, $customerAccessToken: String!) {
      customerAddressDelete(id: $id, customerAccessToken: $customerAccessToken) {
        deletedCustomerAddressId
        customerUserErrors { code field message }
      }
    }
  `;
  const data = await shopifyFetch<any>(query, { id, customerAccessToken: token });
  const payload = data.customerAddressDelete;
  const message = customerUserError(payload);
  if (message) throw new ApiError(400, message);
  if (payload?.deletedCustomerAddressId !== id) {
    throw new ApiError(502, 'Shopify did not confirm that the address was removed.');
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
