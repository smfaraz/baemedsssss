import path from 'node:path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function apiDevMiddleware() {
  return {
    name: 'api-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/')) return next();

        try {
          const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
          const pathname = url.pathname;

          let handler: any = null;
          if (pathname.startsWith('/api/admin')) {
            handler = (await server.ssrLoadModule('./api/admin.ts')).default;
          } else if (pathname.startsWith('/api/checkout')) {
            handler = (await server.ssrLoadModule('./api/checkout.ts')).default;
          } else if (pathname.startsWith('/api/auth')) {
            handler = (await server.ssrLoadModule('./api/auth.ts')).default;
          } else if (pathname.startsWith('/api/cart')) {
            handler = (await server.ssrLoadModule('./api/cart.ts')).default;
          } else if (pathname.startsWith('/api/account')) {
            handler = (await server.ssrLoadModule('./api/account.ts')).default;
          } else if (pathname.startsWith('/api/feeds')) {
            handler = (await server.ssrLoadModule('./api/feeds.ts')).default;
          }

          if (!handler || typeof handler.fetch !== 'function') {
            return next();
          }

          // Convert Node request to Web standard Request
          const chunks: any[] = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = chunks.length > 0 && !['GET', 'HEAD'].includes(req.method) ? Buffer.concat(chunks) : undefined;

          const webReq = new Request(url.toString(), {
            method: req.method,
            headers: req.headers as any,
            body,
          });

          const webRes = await handler.fetch(webReq);

          res.statusCode = webRes.status;
          webRes.headers.forEach((val: string, key: string) => {
            res.setHeader(key, val);
          });

          const resBody = await webRes.text();
          res.end(resBody);
        } catch (err: any) {
          console.error('[API Middleware Error]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal API Error' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
    const rootDir = fileURLToPath(new URL('.', import.meta.url));
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), apiDevMiddleware()],
      resolve: {
        alias: {
          '@': path.resolve(rootDir),
        }
      },
      build: {
        target: 'esnext',
        minify: 'esbuild',
        cssMinify: true,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
