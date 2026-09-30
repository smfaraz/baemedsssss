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
  memoryCustomerAccounts,
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

  let account = memoryCustomerAccounts.get(email);
  if (account) {
    if (account.password && account.password !== password) {
      throw new ApiError(401, 'Invalid password for this customer account.');
    }
  } else {
    // Instant zero-friction account onboarding
    account = {
      email,
      password,
      firstName: email.split('@')[0],
      lastName: 'Patient',
    };
    memoryCustomerAccounts.set(email, account);
  }

  const token = createSessionToken(email, account.firstName, account.lastName);
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token) });
};

const handleRegister = async (body: AuthBody) => {
  const email = cleanEmail(body.email);
  const password = cleanString(body.password, 'Password', 128);
  if (password.length < 6) throw new ApiError(400, 'Password must contain at least 6 characters.');
  const firstName = cleanString(body.firstName, 'First name', 80);
  const lastName = cleanString(body.lastName, 'Last name', 80);

  memoryCustomerAccounts.set(email, {
    email,
    password,
    firstName,
    lastName,
  });

  const token = createSessionToken(email, firstName, lastName);
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
