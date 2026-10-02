/**
 * BaeMeds Enterprise Master /api/v1/* API Gateway Dispatcher
 * Implements Section 9: API Contract.
 */

import { AuthV1Router } from './authRouter.js';
import { OrdersV1Router } from './ordersRouter.js';
import { InventoryV1Router } from './inventoryRouter.js';
import { PrescriptionsV1Router } from './prescriptionsRouter.js';
import { AuditV1Router } from './auditRouter.js';
import { formatErrorResponse } from '../../middleware/apiHandler.js';

export class V1Gateway {
  static async dispatch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathWithoutPrefix = url.pathname.replace(/^\/api\/v1\/?/, '');
    const segments = pathWithoutPrefix.split('/');
    const domain = segments[0];
    const subpath = segments.slice(1).join('/');

    const requestId =
      request.headers.get('x-request-id') ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    try {
      switch (domain) {
        case 'auth':
          return await AuthV1Router.handle(request, subpath, requestId);
        case 'orders':
          return await OrdersV1Router.handle(request, subpath, requestId);
        case 'inventory':
          return await InventoryV1Router.handle(request, subpath, requestId);
        case 'prescriptions':
          return await PrescriptionsV1Router.handle(request, subpath, requestId);
        case 'audit':
          return await AuditV1Router.handle(request, subpath, requestId);
        default:
          return new Response(
            JSON.stringify({
              error: {
                code: 'NOT_FOUND',
                message: `Domain endpoint '/api/v1/${domain}' not recognized.`,
                requestId,
                timestamp: new Date().toISOString(),
              },
            }),
            {
              status: 404,
              headers: {
                'Content-Type': 'application/json',
                'X-Request-Id': requestId,
              },
            }
          );
      }
    } catch (error) {
      return formatErrorResponse(error, requestId, clientIp);
    }
  }
}
