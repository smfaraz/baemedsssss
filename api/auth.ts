interface CustomerAccount {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
}

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  defaultAddress?: any;
  addresses?: any[];
  orders?: any[];
}

type AuthBody = {
  action?: unknown;
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
};

const SESSION_COOKIE = '__Host-baemeds_session';
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

const memoryCustomerAccounts = new Map<string, CustomerAccount>();

const cleanString = (value: unknown, field: string, maxLength: number, required = true) => {
  const cleaned = typeof value === 'string' ? value.trim() : '';
  if (required && !cleaned) throw new Error(`${field} is required.`);
  if (cleaned.length > maxLength) throw new Error(`${field} is too long.`);
  return cleaned;
};

const cleanEmail = (value: unknown) => {
  const email = cleanString(value, 'Email address', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  return email;
};

const sessionCookie = (token: string) => {
  const maxAge = THIRTY_DAYS_SECONDS;
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; Expires=${expires}; HttpOnly; Secure; SameSite=Lax`;
};

const clearSessionCookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`;

const createSessionToken = (email: string, firstName?: string, lastName?: string): string => {
  const normEmail = email.toLowerCase().trim();
  const acc = memoryCustomerAccounts.get(normEmail);
  const fName = firstName || acc?.firstName || normEmail.split('@')[0];
  const lName = lastName || acc?.lastName || 'Patient';
  const payload = JSON.stringify({ email: normEmail, firstName: fName, lastName: lName });
  const b64 = Buffer.from(payload).toString('base64url');
  return `bm_usr_${b64}_${Date.now()}`;
};

const extractCustomerProfile = (sessionToken: string): { email: string; firstName: string; lastName: string } | null => {
  if (!sessionToken || !sessionToken.startsWith('bm_usr_')) return null;
  const parts = sessionToken.split('_');
  if (!parts[2]) return null;
  try {
    const raw = Buffer.from(parts[2], 'base64url').toString('utf-8');
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      if (parsed.email) {
        return {
          email: parsed.email.toLowerCase().trim(),
          firstName: parsed.firstName || parsed.email.split('@')[0],
          lastName: parsed.lastName || 'Patient',
        };
      }
    }
    const email = Buffer.from(parts[2], 'base64').toString('utf-8').toLowerCase().trim();
    if (email.includes('@')) {
      const acc = memoryCustomerAccounts.get(email);
      return {
        email,
        firstName: acc?.firstName || email.split('@')[0],
        lastName: acc?.lastName || 'Patient',
      };
    }
  } catch {}
  return null;
};

const fetchCustomer = async (sessionToken: string): Promise<Customer | null> => {
  if (!sessionToken) return null;
  try {
    const profile = extractCustomerProfile(sessionToken);
    if (!profile) return null;

    const email = profile.email;
    const acc = memoryCustomerAccounts.get(email);
    const firstName = acc?.firstName || profile.firstName;
    const lastName = acc?.lastName || profile.lastName;

    return {
      id: `usr_${Buffer.from(email).toString('hex').substring(0, 12)}`,
      email,
      firstName,
      lastName,
      phone: '',
      addresses: [],
      orders: [],
    };
  } catch {
    return null;
  }
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
      const token = getTokenFromHeaders(request.headers.get('cookie') || '');
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

    const body: AuthBody = await request.json().catch(() => ({}));
    const action = cleanString(body.action, 'Action', 20);

    if (action === 'login') {
      const email = cleanEmail(body.email);
      const password = cleanString(body.password, 'Password', 128);
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters.' }), { status: 400, headers: corsHeaders });
      }
      const existing = memoryCustomerAccounts.get(email);
      if (!existing || existing.password !== password) {
        return new Response(JSON.stringify({ error: 'Invalid email or password.' }), { status: 401, headers: corsHeaders });
      }
      const token = createSessionToken(email, existing.firstName, existing.lastName);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Set-Cookie': sessionCookie(token) },
      });
    }

    if (action === 'register') {
      const email = cleanEmail(body.email);
      const password = cleanString(body.password, 'Password', 128);
      const firstName = cleanString(body.firstName, 'First name', 80);
      const lastName = cleanString(body.lastName, 'Last name', 80);
      memoryCustomerAccounts.set(email, { email, password, firstName, lastName });
      const token = createSessionToken(email, firstName, lastName);
      return new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: { ...corsHeaders, 'Set-Cookie': sessionCookie(token) },
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
    return new Response(JSON.stringify({ error: err.message || 'The request could not be completed.' }), {
      status: 400,
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
        const email = cleanEmail(body.email);
        const password = cleanString(body.password, 'Password', 128);
        if (password.length < 6) {
          if (res) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Password must be at least 6 characters.' }));
          }
        }
        const existing = memoryCustomerAccounts.get(email);
        if (!existing || existing.password !== password) {
          if (res) {
            res.statusCode = 401;
            return res.end(JSON.stringify({ error: 'Invalid email or password.' }));
          }
          return { error: 'Invalid email or password.' };
        }
        const token = createSessionToken(email, existing.firstName, existing.lastName);
        if (res) {
          res.setHeader('Set-Cookie', sessionCookie(token));
          res.statusCode = 200;
          return res.end(JSON.stringify({ ok: true }));
        }
        return { ok: true };
      }

      if (action === 'register') {
        const email = cleanEmail(body.email);
        const password = cleanString(body.password, 'Password', 128);
        const firstName = cleanString(body.firstName, 'First name', 80);
        const lastName = cleanString(body.lastName, 'Last name', 80);
        memoryCustomerAccounts.set(email, { email, password, firstName, lastName });
        const token = createSessionToken(email, firstName, lastName);
        if (res) {
          res.setHeader('Set-Cookie', sessionCookie(token));
          res.statusCode = 201;
          return res.end(JSON.stringify({ ok: true }));
        }
        return { ok: true };
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
    if (res && !res.headersSent) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ error: error.message || 'The request could not be completed.' }));
    }
  }
}

handler.fetch = handleWebStandard;
