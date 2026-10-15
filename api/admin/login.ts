/**
 * BaeMeds Administrative Staff Authentication Serverless Endpoint
 * Handles POST /api/admin/login directly with zero rewrite dependencies.
 */

import { AdminService } from '../../server/adminService';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Admin-Role',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json; charset=utf-8',
};

// Web Standard handler (Vite SSR / Edge)
async function handleWeb(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const body: any = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required.' }), { status: 400, headers: corsHeaders });
    }

    const result = await AdminService.authenticateStaff(email, password);
    return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    const status = err.message?.includes('deactivated') ? 403 : 401;
    return new Response(JSON.stringify({ error: err.message || 'Invalid credentials.' }), { status, headers: corsHeaders });
  }
}

// Node.js Serverless runtime (Vercel)
export default async function handler(req: any, res?: any): Promise<any> {
  if (req instanceof Request || (!res && typeof req?.text === 'function')) {
    return handleWeb(req);
  }

  try {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Admin-Role');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    const method = (req.method || 'POST').toUpperCase();
    if (method === 'OPTIONS') {
      if (res) {
        res.statusCode = 204;
        res.end();
      }
      return;
    }

    if (method !== 'POST') {
      if (res) {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
      return;
    }

    let body: any = req.body;
    if (typeof body === 'string' && body.trim()) {
      try { body = JSON.parse(body); } catch {}
    }

    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password.trim() : '';

    if (!email || !password) {
      if (res) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Email and password are required.' }));
      }
      return;
    }

    try {
      const result = await AdminService.authenticateStaff(email, password);
      if (res) {
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      }
      return;
    } catch (authErr: any) {
      const status = authErr.message?.includes('deactivated') ? 403 : 401;
      if (res) {
        res.statusCode = status;
        res.end(JSON.stringify({ error: authErr.message || 'Invalid credentials.' }));
      }
      return;
    }
  } catch (err: any) {
    if (res && !res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'An administrative authentication error occurred.' }));
    }
  }
}

handler.fetch = handleWeb;
