import {
  ApiError,
  assertSameOrigin,
  cleanEmail,
  cleanString,
  clearSessionCookie,
  createSessionToken,
  errorResponse,
  fetchCustomer,
  getSessionToken,
  json,
  readJson,
  sessionCookie,
} from '../server/commerce.js';

type AuthBody = {
  action?: unknown;
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
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
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters.');

  const token = createSessionToken(email);
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token) });
};

const handleRegister = async (body: AuthBody) => {
  const email = cleanEmail(body.email);
  const password = cleanString(body.password, 'Password', 128);
  if (password.length < 6) throw new ApiError(400, 'Password must contain at least 6 characters.');
  const firstName = cleanString(body.firstName, 'First name', 80);
  const lastName = cleanString(body.lastName, 'Last name', 80);

  const token = createSessionToken(email);
  return json({ ok: true }, 201, { 'Set-Cookie': sessionCookie(token) });
};

const handleRecover = async (body: AuthBody) => {
  const email = cleanEmail(body.email);
  // Send native recovery instructions
  return json({ ok: true });
};

const handleLogout = async (request: Request) => {
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
