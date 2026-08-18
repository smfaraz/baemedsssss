import {
  ApiError,
  assertSameOrigin,
  cleanEmail,
  cleanString,
  clearSessionCookie,
  customerUserError,
  errorResponse,
  fetchCustomer,
  getSessionToken,
  json,
  readJson,
  sessionCookie,
  shopifyFetch,
} from '../server/shopify.js';

type AuthBody = {
  action?: unknown;
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
};

const createAccessToken = async (email: string, password: string) => {
  const query = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code field message }
      }
    }
  `;
  const data = await shopifyFetch<any>(query, { input: { email, password } });
  const payload = data.customerAccessTokenCreate;
  const token = payload?.customerAccessToken;
  if (customerUserError(payload) || !token?.accessToken || !token?.expiresAt) {
    throw new ApiError(401, 'Sign-in failed. Check your email and password.');
  }
  return token as { accessToken: string; expiresAt: string };
};

const handleSession = async (request: Request) => {
  const token = getSessionToken(request);
  if (!token) return json({ customer: null });
  const customer = await fetchCustomer(token);
  if (!customer) {
    return json({ customer: null }, 200, { 'Set-Cookie': clearSessionCookie });
  }
  return json({ customer });
};

const handleLogin = async (body: AuthBody) => {
  const email = cleanEmail(body.email);
  const password = cleanString(body.password, 'Password', 128);
  const token = await createAccessToken(email, password);
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token.accessToken, token.expiresAt) });
};

const handleRegister = async (body: AuthBody) => {
  const email = cleanEmail(body.email);
  const password = cleanString(body.password, 'Password', 128);
  if (password.length < 6) throw new ApiError(400, 'Password must contain at least 6 characters.');
  const firstName = cleanString(body.firstName, 'First name', 80);
  const lastName = cleanString(body.lastName, 'Last name', 80);
  const query = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id }
        customerUserErrors { code field message }
      }
    }
  `;
  const data = await shopifyFetch<any>(query, { input: { email, password, firstName, lastName } });
  const message = customerUserError(data.customerCreate);
  if (message) throw new ApiError(400, message);
  const token = await createAccessToken(email, password);
  return json({ ok: true }, 201, { 'Set-Cookie': sessionCookie(token.accessToken, token.expiresAt) });
};

const handleRecover = async (body: AuthBody) => {
  const email = cleanEmail(body.email);
  const query = `
    mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { code field message }
      }
    }
  `;
  await shopifyFetch(query, { email });
  return json({ ok: true });
};

const handleLogout = async (request: Request) => {
  const token = getSessionToken(request);
  if (token) {
    const query = `
      mutation customerAccessTokenDelete($customerAccessToken: String!) {
        customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
          deletedCustomerAccessTokenId
          userErrors { field message }
        }
      }
    `;
    try {
      await shopifyFetch(query, { customerAccessToken: token });
    } catch {
      // The local cookie must still be cleared if Shopify already expired the token.
    }
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie });
};

export default {
  async fetch(request: Request) {
    try {
      if (request.method === 'GET') return await handleSession(request);
      if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'GET, POST' });

      assertSameOrigin(request);
      const body = await readJson<AuthBody>(request);
      const action = cleanString(body.action, 'Action', 20);

      if (action === 'login') return await handleLogin(body);
      if (action === 'register') return await handleRegister(body);
      if (action === 'recover') return await handleRecover(body);
      if (action === 'logout') return await handleLogout(request);
      throw new ApiError(400, 'The requested account action is invalid.');
    } catch (error) {
      return errorResponse(error);
    }
  },
};
