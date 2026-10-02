/**
 * BaeMeds /api/v1/audit/* Router
 * Provides query access to immutable HIPAA security audit records.
 * Strictly limited to compliance_officer and super_admin roles.
 */

import { AuthorizationEngine } from '../../auth/authorizationMiddleware.js';
import { AdminService } from '../../adminService.js';
import { createApiResponse } from '../../middleware/apiHandler.js';

export class AuditV1Router {
  static async handle(request: Request, _subpath: string, requestId: string): Promise<Response> {
    const method = request.method;
    const context = await AuthorizationEngine.buildSecurityContext(request);

    // GET /api/v1/audit - Query HIPAA audit trail
    if (method === 'GET') {
      AuthorizationEngine.authorize(context, { requiredPermission: 'audit_logs:view' });
      const logs = await AdminService.getAuditLogs(context.roles[0]);
      return createApiResponse({ logs, total: logs.length }, 200, requestId);
    }

    return createApiResponse({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }, 404, requestId);
  }
}
