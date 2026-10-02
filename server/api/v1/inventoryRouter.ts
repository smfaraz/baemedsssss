/**
 * BaeMeds /api/v1/inventory/* Router
 * Validates inventory adjustments with Zod and enforces inventory:manage authorization.
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

const InventoryAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required.'),
  variantId: z.string().optional(),
  delta: z.number().int('Delta must be an integer.'),
  reason: z.enum(['Purchase', 'Return', 'Damage', 'Correction', 'Receiving', 'Manual Adjustment'] as const, {
    message: 'A valid DME audit reason is mandatory for stock adjustment.',
  }),
  notes: z.string().max(500).optional(),
});

export class InventoryV1Router {
  static async handle(request: Request, subpath: string, requestId: string): Promise<Response> {
    const method = request.method;
    const context = await AuthorizationEngine.buildSecurityContext(request);

    // 1. GET /api/v1/inventory - View inventory levels (Requires inventory:view)
    if (subpath === '' && method === 'GET') {
      AuthorizationEngine.authorize(context, { requiredPermission: 'inventory:view' });
      const inventory = await AdminService.getInventory(context.roles[0]);
      return createApiResponse({ inventory }, 200, requestId);
    }

    // 2. POST /api/v1/inventory/adjust - Adjust stock with audit reason (Requires inventory:manage)
    if (subpath === 'adjust' && method === 'POST') {
      enforceRateLimit(request, RATE_LIMIT_POLICIES.admin_mutation);
      AuthorizationEngine.authorize(context, { requiredPermission: 'inventory:manage' });
      const input = await validateBody(request, InventoryAdjustmentSchema);

      const actorUser = {
        id: context.identity.userId,
        email: context.identity.email,
        name: context.identity.email.split('@')[0],
        role: context.roles[0],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const result = await AdminService.adjustInventory(
        actorUser,
        input.productId,
        input.delta,
        input.reason,
        input.notes
      );

      return createApiResponse({ result }, 200, requestId);
    }

    // 3. GET /api/v1/inventory/audit - View inventory movement audit logs
    if (subpath === 'audit' && method === 'GET') {
      AuthorizationEngine.authorize(context, { requiredPermission: 'inventory:view' });
      const adjustments = await AdminService.getInventoryAdjustments(context.roles[0]);
      return createApiResponse({ adjustments }, 200, requestId);
    }

    return createApiResponse({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }, 404, requestId);
  }
}
