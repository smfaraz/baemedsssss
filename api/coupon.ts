interface CouponRequestBody {
  code?: string;
  subtotal?: number;
}

const DEFAULT_DISCOUNTS = [
  {
    id: 'disc_welcome10',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minOrderAmount: 50,
    isActive: true,
  },
  {
    id: 'disc_dme25',
    code: 'CLINICAL25',
    type: 'fixed',
    value: 25,
    minOrderAmount: 200,
    isActive: true,
  },
];

async function processCoupon(code: string, subtotal: number) {
  const rawCode = (code || '').trim().toUpperCase();
  if (!rawCode) {
    return { status: 400, data: { valid: false, error: 'Please enter a promo code.' } };
  }

  let discounts: any[] = DEFAULT_DISCOUNTS;
  try {
    const { AdminService } = await import('../server/adminService');
    discounts = await AdminService.getDiscounts('super_admin');
  } catch {
    discounts = DEFAULT_DISCOUNTS;
  }

  const matched = discounts.find((d: any) => d.code === rawCode);

  if (!matched) {
    return { status: 400, data: { valid: false, error: `Promo code "${rawCode}" is not recognized or has expired.` } };
  }

  if (matched.isActive === false) {
    return { status: 400, data: { valid: false, error: `Promo code "${rawCode}" is no longer active.` } };
  }

  if (matched.expiresAt && new Date(matched.expiresAt).getTime() < Date.now()) {
    return { status: 400, data: { valid: false, error: `Promo code "${rawCode}" has expired.` } };
  }

  if (matched.minOrderAmount && subtotal < matched.minOrderAmount) {
    return {
      status: 400,
      data: {
        valid: false,
        error: `Promo code "${rawCode}" requires a minimum order of $${matched.minOrderAmount.toFixed(2)}. Current subtotal is $${subtotal.toFixed(2)}.`,
      },
    };
  }

  let discountAmount = 0;
  if (matched.type === 'percentage') {
    discountAmount = Number(((subtotal * matched.value) / 100).toFixed(2));
  } else {
    discountAmount = Number(Math.min(subtotal, matched.value).toFixed(2));
  }

  return {
    status: 200,
    data: {
      valid: true,
      code: matched.code,
      type: matched.type,
      value: matched.value,
      discountAmount,
      message: `Coupon "${matched.code}" applied! Saved $${discountAmount.toFixed(2)}.`,
    },
  };
}

async function handleWebStandard(request: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const body: CouponRequestBody = await request.json().catch(() => ({}));
    const subtotal = typeof body.subtotal === 'number' && body.subtotal >= 0 ? body.subtotal : 0;
    const result = await processCoupon(body.code || '', subtotal);
    return new Response(JSON.stringify(result.data), { status: result.status, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ valid: false, error: err.message || 'Unable to validate coupon.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export default async function handler(req: any, res?: any) {
  if (req instanceof Request || (!res && typeof req.text === 'function')) {
    return handleWebStandard(req);
  }

  try {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin');
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

    if (method !== 'POST') {
      if (res) {
        res.statusCode = 405;
        return res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
      return;
    }

    let body: CouponRequestBody = {};
    if (typeof req.body === 'object' && req.body !== null) {
      body = req.body;
    } else if (typeof req.body === 'string' && req.body.trim()) {
      try {
        body = JSON.parse(req.body);
      } catch {}
    }

    const subtotal = typeof body.subtotal === 'number' && body.subtotal >= 0 ? body.subtotal : 0;
    const result = await processCoupon(body.code || '', subtotal);

    if (res) {
      res.statusCode = result.status;
      return res.end(JSON.stringify(result.data));
    }
    return result.data;
  } catch (err: any) {
    if (res && !res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ valid: false, error: err.message || 'Unable to validate coupon.' }));
    }
  }
}

handler.fetch = handleWebStandard;
