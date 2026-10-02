/**
 * BaeMeds /api/v1/orders/* Router
 * Validates order mutations with Zod and enforces authorization pipeline.
 */

import { z } from 'zod';
import { AuthorizationEngine } from '../../auth/authorizationMiddleware.js';
import { AdminService } from '../../adminService.js';
import {
  createApiResponse,
  validateBody,
  enforceRateLimit,
} from '../../middleware/apiHandler.js';
import { RATE_LIMIT_POLICIES } from '../../middleware/rateLimiter.js';

const UpdateStatusSchema = z.object({
  status: z.string().min(1, 'Target status is required.'),
  reason: z.string().min(3, 'Audit reason is required for status transition.').max(500),
});

const UpdateTrackingSchema = z.object({
  carrier: z.string().min(1, 'Carrier name is required.').max(100),
  trackingNumber: z.string().min(3, 'Tracking number is required.').max(100),
});

const CreateOrderSchema = z.object({
  customer_email: z.string().email(),
  items: z.array(z.object({
    product_id: z.string().min(1),
    quantity: z.number().int().positive(),
    variant_id: z.string().optional()
  })).min(1, 'Order must contain at least one item.'),
  shipping_address: z.object({
    address1: z.string().min(1),
    address2: z.string().optional(),
    city: z.string().min(1),
    province: z.string().min(2),
    zip: z.string().min(5),
    country: z.string().default('United States')
  }),
  billing_address: z.record(z.string(), z.any()).optional(),
  shipping_method: z.string().optional(),
  payment_intent_id: z.string().optional()
});

export class OrdersV1Router {
  static async handle(request: Request, subpath: string, requestId: string): Promise<Response> {
    const method = request.method;
    const parts = subpath.split('/').filter(Boolean);
    const orderId = parts[0];
    const action = parts[1];

    // 0. POST /api/v1/orders - Atomic Order Placement with Idempotency Key
    if (!orderId && method === 'POST') {
      enforceRateLimit(request, RATE_LIMIT_POLICIES.auth);
      const idempotencyKey = request.headers.get('Idempotency-Key') || undefined;
      const input = await validateBody(request, CreateOrderSchema);
      
      const { OrderTransactionService } = await import('../../commerce/orderTransactionService.js');
      const result = await OrderTransactionService.placeOrder({
        ...input,
        idempotency_key: idempotencyKey,
        actor_id: 'customer'
      });

      if (!result.success) {
        return createApiResponse({
          error: {
            code: result.error || 'ORDER_CREATION_FAILED',
            message: result.message || 'Unable to place order atomically'
          }
        }, 409, requestId);
      }

      return createApiResponse({
        order: result.order,
        idempotent_replay: result.idempotent_replay || false
      }, 201, requestId);
    }

    // Authenticate and build security context for staff operations
    const context = await AuthorizationEngine.buildSecurityContext(request);

    // 1. GET /api/v1/orders - List orders (Requires orders:view)
    if (!orderId && method === 'GET') {
      AuthorizationEngine.authorize(context, { requiredPermission: 'orders:view' });
      const orders = await AdminService.getOrders(context.roles[0]);
      return createApiResponse({ orders }, 200, requestId);
    }

    // 2. GET /api/v1/orders/:id - Get order details (Requires orders:view + Tenant scope)
    if (orderId && !action && method === 'GET') {
      AuthorizationEngine.authorize(context, { requiredPermission: 'orders:view' });
      const order = await AdminService.getOrderById(context.roles[0], orderId);
      if (!order) {
        return createApiResponse({ error: { code: 'NOT_FOUND', message: `Order ${orderId} not found.` } }, 404, requestId);
      }
      return createApiResponse({ order }, 200, requestId);
    }

    // 2b. GET /api/v1/orders/:id/timeline - Get immutable audit timeline
    if (orderId && action === 'timeline' && method === 'GET') {
      AuthorizationEngine.authorize(context, { requiredPermission: 'orders:view' });
      const { OrderTransactionService } = await import('../../commerce/orderTransactionService.js');
      const timeline = await OrderTransactionService.getOrderTimeline(orderId);
      return createApiResponse({ timeline }, 200, requestId);
    }

    // 3. PATCH /api/v1/orders/:id/status - Update order state machine
    if (orderId && action === 'status' && method === 'PATCH') {
      enforceRateLimit(request, RATE_LIMIT_POLICIES.admin_mutation);
      AuthorizationEngine.authorize(context, { requiredPermission: 'orders:manage' });
      const input = await validateBody(request, UpdateStatusSchema);

      const actorUser = {
        id: context.identity.userId,
        email: context.identity.email,
        name: context.identity.email.split('@')[0],
        role: context.roles[0],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const updated = await AdminService.updateOrderStatus(actorUser, orderId, input.status, input.reason);
      return createApiResponse({ order: updated }, 200, requestId);
    }

    // 4. PATCH /api/v1/orders/:id/tracking - Update carrier tracking
    if (orderId && action === 'tracking' && method === 'PATCH') {
      enforceRateLimit(request, RATE_LIMIT_POLICIES.admin_mutation);
      AuthorizationEngine.authorize(context, { requiredPermission: 'orders:manage' });
      const input = await validateBody(request, UpdateTrackingSchema);

      const actorUser = {
        id: context.identity.userId,
        email: context.identity.email,
        name: context.identity.email.split('@')[0],
        role: context.roles[0],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const updated = await AdminService.updateOrderTracking(actorUser, orderId, input.carrier, input.trackingNumber);
      return createApiResponse({ order: updated }, 200, requestId);
    }

    return createApiResponse({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }, 404, requestId);
  }
}
