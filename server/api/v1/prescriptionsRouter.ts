/**
 * BaeMeds /api/v1/prescriptions/* Router
 * Enforces HIPAA minimum-necessary access controls on clinical document workflows.
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

const ReviewPrescriptionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'NEEDS_INFORMATION'] as const, {
    message: 'Valid clinical review status is required.',
  }),
  clinicalNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(500).optional(),
});

export class PrescriptionsV1Router {
  static async handle(request: Request, subpath: string, requestId: string): Promise<Response> {
    const method = request.method;
    const parts = subpath.split('/').filter(Boolean);
    const rxId = parts[0];
    const action = parts[1];

    const context = await AuthorizationEngine.buildSecurityContext(request);

    // 1. GET /api/v1/prescriptions - List pending clinical documents (Requires prescriptions:view + PHI scope)
    if (!rxId && method === 'GET') {
      AuthorizationEngine.authorize(context, {
        requiredPermission: 'prescriptions:view',
        requirePHIPermission: true,
      });
      const prescriptions = await AdminService.getPrescriptions(context.roles[0]);
      return createApiResponse({ prescriptions }, 200, requestId);
    }

    // 2. PATCH /api/v1/prescriptions/:id/review - Clinical decision (Requires prescriptions:review + clinical role)
    if (rxId && action === 'review' && method === 'PATCH') {
      enforceRateLimit(request, RATE_LIMIT_POLICIES.admin_mutation);
      AuthorizationEngine.authorize(context, {
        requiredPermission: 'prescriptions:review',
        requirePHIPermission: true,
      });

      if (!context.abacScope.canApprovePrescriptions) {
        return createApiResponse(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Only authorized clinical specialists can review and approve medical prescriptions.',
            },
          },
          403,
          requestId
        );
      }

      const input = await validateBody(request, ReviewPrescriptionSchema);

      const actorUser = {
        id: context.identity.userId,
        email: context.identity.email,
        name: context.identity.email.split('@')[0],
        role: context.roles[0],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const result = await AdminService.reviewPrescription(
        actorUser,
        rxId,
        input.status,
        input.clinicalNotes || input.rejectionReason
      );

      return createApiResponse({ prescription: result }, 200, requestId);
    }

    return createApiResponse({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }, 404, requestId);
  }
}
