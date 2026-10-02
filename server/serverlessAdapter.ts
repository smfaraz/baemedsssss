/**
 * Universal Vercel Serverless Function Adapter
 * Bridges Node.js Serverless runtime (req: IncomingMessage, res: ServerResponse)
 * and Web Standard fetch (request: Request) => Promise<Response>.
 * Works seamlessly in Vercel Node Serverless, Vercel Edge, and local Vite dev server.
 */

export type FetchHandler = (request: Request) => Promise<Response>;

export function createVercelHandler(fetchHandler: FetchHandler) {
  const handler = async (req: any, res?: any): Promise<any> => {
    // 1. Direct Web Standard Request (Edge runtime, Vite middleware, or unit test)
    if (req instanceof Request || (req && typeof req.text === 'function' && !res)) {
      return await fetchHandler(req);
    }

    // 2. Node.js Serverless runtime (Vercel Serverless: handler(req, res))
    try {
      const protocol = (req.headers && req.headers['x-forwarded-proto']) || 'https';
      const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || 'localhost';
      const url = new URL(req.url || '/', `${protocol}://${host}`);

      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers || {})) {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, String(value));
          }
        }
      }

      let body: any = undefined;
      const method = (req.method || 'GET').toUpperCase();
      if (!['GET', 'HEAD'].includes(method)) {
        if (req.body !== undefined && req.body !== null) {
          body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        } else {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          if (chunks.length > 0) {
            body = Buffer.concat(chunks);
          }
        }
      }

      const webRequest = new Request(url.href, {
        method,
        headers,
        body,
      });

      const response = await fetchHandler(webRequest);

      res.statusCode = response.status;
      response.headers.forEach((val, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          const existing = res.getHeader('Set-Cookie');
          if (existing) {
            const arr = Array.isArray(existing) ? existing : [existing];
            arr.push(val);
            res.setHeader('Set-Cookie', arr);
          } else {
            res.setHeader('Set-Cookie', val);
          }
        } else {
          res.setHeader(key, val);
        }
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      res.end(buffer);
    } catch (err: any) {
      console.error('[Serverless Adapter Error]:', err);
      if (res && !res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'The request could not be completed.' }));
      }
    }
  };

  handler.fetch = fetchHandler;
  return handler;
}
