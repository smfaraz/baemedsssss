/**
 * BaeMeds Enterprise Centralized Authorization Engine
 *
 * Implements Section 7 Mandated Authorization Pipeline:
 * authenticate()
 *  -> resolveIdentity()
 *  -> resolveOrganization()
 *  -> resolveRoles()
 *  -> resolvePermissions()
 *  -> resolveABACScope()
 *  -> authorize()
 *  -> executeDomainAction()
 *
 * Strictly rejects client-controlled authority headers (X-Admin-Role, etc.).
 */

import { AdminRole } from '../../types.js';
import { ROLE_PERMISSIONS } from '../../lib/rbacConfig.js';
import { adminSupabase } from '../adminSupabase.js';
import { AuditLogger } from '../auditLogger.js';
import {
  AuthIdentity,
  OrganizationContext,
  ABACScope,
  SecurityContext,
  AuthorizeOptions,
} from './authTypes.js';
import { TokenService, AuthenticationError } from './tokenService.js';

export class AuthorizationError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, status = 403, code = 'FORBIDDEN', details?: Record<string, unknown>) {
    super(message);
    this.name = 'AuthorizationError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class AuthorizationEngine {
  /**
   * STEP 1: authenticate()
   * Extracts token and verifies cryptographic validity.
   */
  static async authenticate(request: Request): Promise<AuthIdentity> {
    const token = TokenService.extractToken(request);
    if (!token) {
      throw new AuthenticationError('Authentication credentials required.', 401, 'AUTHENTICATION_REQUIRED');
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    return await TokenService.verifyToken(token, clientIp);
  }

  /**
   * STEP 2: resolveIdentity()
   * Validates user account state in database (active vs suspended).
   */
  static async resolveIdentity(identity: AuthIdentity): Promise<AuthIdentity> {
    // If dev impersonation, pass through identity
    if (identity.isImpersonated) return identity;

    // Check account status in database
    const { data: profile, error } = await adminSupabase
      .from('staff_users')
      .select('id, is_active, organization_id')
      .eq('email', identity.email)
      .maybeSingle();

    if (!error && profile && profile.is_active === false) {
      throw new AuthorizationError('Account has been suspended or deactivated.', 403, 'ACCOUNT_DEACTIVATED');
    }

    return identity;
  }

  /**
   * STEP 3: resolveOrganization()
   * Server-authoritative resolution of user's tenant organization.
   * NEVER trust client-provided organization header.
   */
  static async resolveOrganization(
    identity: AuthIdentity,
    _requestedOrgId?: string
  ): Promise<OrganizationContext> {
    // Look up primary tenant organization assigned to user
    const { data: member, error } = await adminSupabase
      .from('organization_members')
      .select('organization_id, organizations(id, name, status, is_root)')
      .eq('user_id', identity.userId)
      .maybeSingle();

    if (!error && member && member.organizations) {
      const org = member.organizations as any;
      if (org.status !== 'ACTIVE') {
        throw new AuthorizationError('Organization account is suspended.', 403, 'ORGANIZATION_SUSPENDED');
      }
      return {
        id: org.id,
        name: org.name,
        status: org.status,
        isRootTenant: Boolean(org.is_root),
      };
    }

    // Default primary root tenant for BaeMeds USA operations
    return {
      id: 'org_baemeds_usa_root',
      name: 'BaeMeds USA Enterprise DME',
      status: 'ACTIVE',
      isRootTenant: true,
    };
  }

  /**
   * STEP 4: resolveRoles()
   * Query database for authoritative assigned roles.
   * Client-supplied roles (e.g. X-Admin-Role) are completely ignored.
   */
  static async resolveRoles(identity: AuthIdentity): Promise<AdminRole[]> {
    // If dev impersonation in test harness, look up roster or return assigned role
    if (identity.isImpersonated) {
      if (identity.email.includes('admin')) return ['super_admin'];
      if (identity.email.includes('clinical')) return ['clinical_specialist'];
      if (identity.email.includes('compliance')) return ['compliance_officer'];
      if (identity.email.includes('fulfillment')) return ['fulfillment_specialist'];
      if (identity.email.includes('support')) return ['support_agent'];
      return ['customer'];
    }

    // Query database for authoritative roles
    const { data: roleRows, error } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', identity.userId);

    if (!error && roleRows && roleRows.length > 0) {
      return roleRows.map((r: any) => r.role as AdminRole);
    }

    // Fallback: check staff_users table
    const { data: staffRow } = await adminSupabase
      .from('staff_users')
      .select('role')
      .eq('email', identity.email)
      .maybeSingle();

    if (staffRow && staffRow.role) {
      return [staffRow.role as AdminRole];
    }

    return ['customer'];
  }

  /**
   * STEP 5: resolvePermissions()
   * Expands roles into flattened permission set from authoritative matrix.
   */
  static resolvePermissions(roles: AdminRole[]): Set<string> {
    const permissions = new Set<string>();
    for (const role of roles) {
      const perms = ROLE_PERMISSIONS[role] || [];
      for (const p of perms) {
        permissions.add(p);
      }
    }
    return permissions;
  }

  /**
   * STEP 6: resolveABACScope()
   * Computes attribute-based access control boundaries (PHI isolation, warehouse routing, tenant boundaries).
   */
  static resolveABACScope(
    _identity: AuthIdentity,
    roles: AdminRole[],
    organization: OrganizationContext
  ): ABACScope {
    const isSuperAdmin = roles.includes('super_admin');
    const isClinical = roles.includes('clinical_specialist');
    const isCompliance = roles.includes('compliance_officer');
    const isFulfillment = roles.includes('fulfillment_specialist');

    return {
      tenantOrgId: organization.id,
      canAccessAllOrgs: isSuperAdmin && organization.isRootTenant,
      // PHI Minimum-Necessary Access Rule: Only clinical & compliance can access raw clinical documentation
      canAccessRestrictedPHI: isClinical || isCompliance || isSuperAdmin,
      canApprovePrescriptions: isClinical || isSuperAdmin,
      canAdjustInventory: isFulfillment || isSuperAdmin,
      canExecuteRefunds: isSuperAdmin,
      allowedWarehouseIds: isSuperAdmin ? ['*'] : ['wh_primary_us_east', 'wh_primary_us_west'],
    };
  }

  /**
   * STEP 7: buildSecurityContext()
   * Executes the entire pipeline and returns a sealed SecurityContext.
   */
  static async buildSecurityContext(request: Request): Promise<SecurityContext> {
    const requestId =
      request.headers.get('x-request-id') ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 1. Authenticate
    const rawIdentity = await this.authenticate(request);

    // 2. Resolve Identity
    const identity = await this.resolveIdentity(rawIdentity);

    // 3. Resolve Organization
    const organization = await this.resolveOrganization(identity);

    // 4. Resolve Roles
    const roles = await this.resolveRoles(identity);

    // 5. Resolve Permissions
    const permissions = this.resolvePermissions(roles);

    // 6. Resolve ABAC Scope
    const abacScope = this.resolveABACScope(identity, roles, organization);

    return {
      identity,
      organization,
      roles,
      permissions,
      abacScope,
      requestId,
      clientIp,
    };
  }

  /**
   * STEP 8: authorize()
   * Enforces permissions and tenant/ABAC constraints against the context.
   */
  static authorize(context: SecurityContext, options: AuthorizeOptions = {}): void {
    const { requiredPermission, requireOrganizationScope, requirePHIPermission } = options;

    // 1. Enforce PHI Minimum Necessary Access (HIPAA Safeguard)
    if (requirePHIPermission && !context.abacScope.canAccessRestrictedPHI) {
      AuditLogger.logEvent({
        actor: context.identity.email,
        action: 'UNAUTHORIZED_PHI_ACCESS_BLOCKED',
        resource: 'clinical_prescriptions',
        result: 'DENIED',
        metadata: {
          requestId: context.requestId,
          roles: context.roles,
        },
      });

      throw new AuthorizationError(
        'Access denied: Minimum-necessary PHI access restrictions prohibit your role from accessing clinical documents.',
        403,
        'PHI_ACCESS_RESTRICTED'
      );
    }

    // 2. Enforce Organization Tenant Boundary (IDOR Defense)
    if (requireOrganizationScope && !context.abacScope.canAccessAllOrgs) {
      if (context.organization.id !== requireOrganizationScope) {
        AuditLogger.logEvent({
          actor: context.identity.email,
          action: 'TENANT_IDOR_BLOCKED',
          resource: `org:${requireOrganizationScope}`,
          result: 'DENIED',
          metadata: {
            requestId: context.requestId,
            userOrg: context.organization.id,
            targetOrg: requireOrganizationScope,
          },
        });

        throw new AuthorizationError(
          'Access denied: You cannot access resources belonging to another organization.',
          403,
          'TENANT_ISOLATION_VIOLATION'
        );
      }
    }

    // 3. Enforce RBAC Permission
    if (requiredPermission && !context.permissions.has(requiredPermission)) {
      AuditLogger.logEvent({
        actor: context.identity.email,
        action: 'AUTHORIZATION_DENIED',
        resource: requiredPermission,
        result: 'DENIED',
        metadata: {
          requestId: context.requestId,
          roles: context.roles,
          requiredPermission,
        },
      });

      throw new AuthorizationError(
        `Access denied. Role does not possess required permission: '${requiredPermission}'`,
        403,
        'INSUFFICIENT_PERMISSIONS',
        { requiredPermission, userRoles: context.roles }
      );
    }
  }
}
