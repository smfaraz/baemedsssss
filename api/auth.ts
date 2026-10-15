import {
  ApiError,
  assertSameOrigin,
  cleanEmail,
  cleanString,
  clearSessionCookie,
  createSessionToken,
  fetchCustomer,
  getSessionToken,
  memoryCustomerAccounts,
  sessionCookie,
} from '../server/commerce';

type AuthBody = {
  action?: unknown;
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
};

const handleLogin = (body: AuthBody) => {
  const email = cleanEmail(body.email);
  const password = cleanString(body.password, 'Password', 128);
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters.');

  let account = memoryCustomerAccounts.get(email);
  if (!account) {
    throw new ApiError(401, 'No account found with this email. Please register to create an account.');
  }

  if (account.password && account.password !== password) {
    throw new ApiError(401, 'Invalid password for this customer account.');
  }

  const token = createSessionToken(email, account.firstName, account.lastName);
  return {
    body: { ok: true },
    cookie: sessionCookie(token),
    status: 200,
  };
};

const handleRegister = (body: AuthBody) => {
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
  return {
    body: { ok: true },
    cookie: sessionCookie(token),
    status: 201,
  };
};

const getTokenFromHeaders = (cookieHeader?: string): string => {
  if (!cookieHeader) return '';
  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name === '__Host-baemeds_session' || name === 'baemeds_session') {
      return decodeURIComponent(valueParts.join('='));
    }
  }
  return '';
};

// Web Standard handler (Vite dev server)
async function handleWebStandard(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (request.method === 'GET') {
      const token = getSessionToken(request);
      if (!token) {
        return new Response(JSON.stringify({ customer: null }), { status: 200, headers: corsHeaders });
      }
      const customer = await fetchCustomer(token);
      if (!customer) {
        return new Response(JSON.stringify({ customer: null }), {
          status: 200,
          headers: { ...corsHeaders, 'Set-Cookie': clearSessionCookie },
        });
      }
      return new Response(JSON.stringify({ customer }), { status: 200, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    try {
      assertSameOrigin(request);
    } catch {}

    const body: AuthBody = await request.json().catch(() => ({}));
    const action = cleanString(body.action, 'Action', 20);

    if (action === 'login') {
      const res = handleLogin(body);
      return new Response(JSON.stringify(res.body), {
        status: res.status,
        headers: { ...corsHeaders, 'Set-Cookie': res.cookie },
      });
    }

    if (action === 'register') {
      const res = handleRegister(body);
      return new Response(JSON.stringify(res.body), {
        status: res.status,
        headers: { ...corsHeaders, 'Set-Cookie': res.cookie },
      });
    }

    if (action === 'logout') {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Set-Cookie': clearSessionCookie },
      });
    }

    if (action === 'recover') {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'The requested account action is invalid.' }), {
      status: 400,
      headers: corsHeaders,
    });
  } catch (err: any) {
    const status = err instanceof ApiError ? err.status : 500;
    return new Response(JSON.stringify({ error: err.message || 'The request could not be completed.' }), {
      status,
      headers: corsHeaders,
    });
  }
}

// Node.js Serverless runtime (Vercel)
export default async function handler(req: any, res?: any) {
  if (req instanceof Request || (!res && typeof req.text === 'function')) {
    return handleWebStandard(req);
  }

  try {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-CSRF-Token');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    const method = (req.method || 'GET').toUpperCase();

    if (method === 'OPTIONS') {
      if (res) {
        res.statusCode = 204;
        return res.end();
      }
      return;
    }

    if (method === 'GET') {
      const token = getTokenFromHeaders(req.headers?.cookie);
      if (!token) {
        if (res) {
          res.statusCode = 200;
          return res.end(JSON.stringify({ customer: null }));
        }
        return { customer: null };
      }

      const customer = await fetchCustomer(token);
      if (!customer) {
        if (res) {
          res.setHeader('Set-Cookie', clearSessionCookie);
          res.statusCode = 200;
          return res.end(JSON.stringify({ customer: null }));
        }
        return { customer: null };
      }

      if (res) {
        res.statusCode = 200;
        return res.end(JSON.stringify({ customer }));
      }
      return { customer };
    }

    if (method === 'POST') {
      let body: AuthBody = {};
      if (typeof req.body === 'object' && req.body !== null) {
        body = req.body;
      } else if (typeof req.body === 'string' && req.body.trim()) {
        try {
          body = JSON.parse(req.body);
        } catch {}
      }

      const action = cleanString(body.action, 'Action', 20);

      if (action === 'login') {
        const loginRes = handleLogin(body);
        if (res) {
          res.setHeader('Set-Cookie', loginRes.cookie);
          res.statusCode = loginRes.status;
          return res.end(JSON.stringify(loginRes.body));
        }
        return loginRes.body;
      }

      if (action === 'register') {
        const regRes = handleRegister(body);
        if (res) {
          res.setHeader('Set-Cookie', regRes.cookie);
          res.statusCode = regRes.status;
          return res.end(JSON.stringify(regRes.body));
        }
        return regRes.body;
      }

      if (action === 'logout') {
        if (res) {
          res.setHeader('Set-Cookie', clearSessionCookie);
          res.statusCode = 200;
          return res.end(JSON.stringify({ ok: true }));
        }
        return { ok: true };
      }

      if (action === 'recover') {
        if (res) {
          res.statusCode = 200;
          return res.end(JSON.stringify({ ok: true }));
        }
        return { ok: true };
      }

      if (res) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'The requested account action is invalid.' }));
      }
      return;
    }

    if (res) {
      res.statusCode = 405;
      return res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  } catch (error: any) {
    const status = error instanceof ApiError ? error.status : 500;
    if (res && !res.headersSent) {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ error: error.message || 'The request could not be completed.' }));
    }
  }
}

handler.fetch = handleWebStandard;
