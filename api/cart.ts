export default async function handler(req: any, res?: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': req?.headers?.origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Origin',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (req instanceof Request || (!res && typeof req?.text === 'function')) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    const body: any = await req.json().catch(() => ({}));
    const cartId = (body?.cartId || '').trim();
    return new Response(JSON.stringify({ cart: { id: cartId || 'cart_default', checkoutUrl: '/checkout' } }), {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (res && typeof res.setHeader === 'function') {
      for (const [k, v] of Object.entries(corsHeaders)) {
        res.setHeader(k, v);
      }
    }

    if ((req.method || '').toUpperCase() === 'OPTIONS') {
      if (res) {
        res.statusCode = 204;
        return res.end();
      }
      return;
    }

    let body: any = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const cartId = (body?.cartId || '').trim();
    const result = { cart: { id: cartId || 'cart_default', checkoutUrl: '/checkout' } };

    if (res) {
      res.statusCode = 200;
      return res.end(JSON.stringify(result));
    }
    return result;
  } catch (err: any) {
    if (res && !res.headersSent) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err.message || 'Cart processing error' }));
    }
  }
}

handler.fetch = handler;
