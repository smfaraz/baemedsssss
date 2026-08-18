const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'ptya1n-k0.myshopify.com';
const SHOPIFY_STOREFRONT_ACCESS_TOKEN =
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'c1fb47a74eaec2fbafa70becac08f52b';
const SHOPIFY_API_VERSION = '2024-07';
const SESSION_COOKIE = '__Host-baemeds_session';
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

type GraphQLError = { message?: string };

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const shopifyFetch = async <T>(query: string, variables: Record<string, unknown> = {}): Promise<T> => {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) throw new ApiError(502, 'The commerce service is temporarily unavailable.');
  const payload = await response.json() as { data?: T; errors?: GraphQLError[] };
  if (payload.errors?.length || !payload.data) {
    throw new ApiError(502, 'The commerce service could not complete this request.');
  }
  return payload.data;
};

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
    return await request.json() as T;
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

export const sessionCookie = (accessToken: string, expiresAt: string) => {
  const remainingSeconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const maxAge = Math.min(remainingSeconds, THIRTY_DAYS_SECONDS);
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  return `${SESSION_COOKIE}=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; Expires=${expires}; HttpOnly; Secure; SameSite=Lax`;
};

export const clearSessionCookie =
  `${SESSION_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`;

export const customerUserError = (payload: { customerUserErrors?: { message?: string }[] } | undefined) =>
  payload?.customerUserErrors?.find((error) => error.message)?.message;

const CUSTOMER_QUERY = `
  query getCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      firstName
      lastName
      email
      phone
      defaultAddress {
        id address1 address2 city province country zip firstName lastName phone
      }
      addresses(first: 20) {
        edges {
          node { id address1 address2 city province country zip firstName lastName phone }
        }
      }
      orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            orderNumber
            processedAt
            totalPrice { amount currencyCode }
            totalShippingPrice { amount currencyCode }
            totalTax { amount currencyCode }
            financialStatus
            fulfillmentStatus
            successfulFulfillments(first: 10) {
              trackingCompany
              trackingInfo(first: 10) { number url }
            }
            statusUrl
            lineItems(first: 50) {
              edges { node { title quantity } }
            }
          }
        }
      }
    }
  }
`;

const normalizeAddress = (address: any) => address ? {
  id: address.id,
  address1: address.address1 || '',
  address2: address.address2 || '',
  city: address.city || '',
  province: address.province || '',
  country: address.country || '',
  zip: address.zip || '',
  firstName: address.firstName || '',
  lastName: address.lastName || '',
  phone: address.phone || '',
} : undefined;

const normalizeCustomer = (customer: any) => ({
  id: customer.id,
  firstName: customer.firstName || '',
  lastName: customer.lastName || '',
  email: customer.email || '',
  phone: customer.phone || '',
  defaultAddress: normalizeAddress(customer.defaultAddress),
  addresses: (customer.addresses?.edges || []).map((edge: any) => normalizeAddress(edge.node)),
  orders: (customer.orders?.edges || []).map((edge: any) => ({
    id: edge.node.id,
    orderNumber: edge.node.orderNumber,
    processedAt: edge.node.processedAt,
    totalPrice: edge.node.totalPrice,
    totalShippingPrice: edge.node.totalShippingPrice,
    totalTax: edge.node.totalTax,
    financialStatus: edge.node.financialStatus || 'UNKNOWN',
    fulfillmentStatus: edge.node.fulfillmentStatus || 'UNFULFILLED',
    successfulFulfillments: edge.node.successfulFulfillments || [],
    statusUrl: edge.node.statusUrl,
    lineItems: (edge.node.lineItems?.edges || []).map((item: any) => ({
      title: item.node.title,
      quantity: item.node.quantity,
    })),
  })),
});

export const fetchCustomer = async (customerAccessToken: string) => {
  const data = await shopifyFetch<{ customer: any }>(CUSTOMER_QUERY, { customerAccessToken });
  return data.customer ? normalizeCustomer(data.customer) : null;
};
