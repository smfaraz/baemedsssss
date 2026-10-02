/**
 * BaeMeds Enterprise Identity & Access Management Types
 * Implements strict RBAC and ABAC definitions for HIPAA-compliant DME operations.
 */

import { AdminRole } from '../../types';

export interface AuthIdentity {
  userId: string;
  email: string;
  isServiceRole: boolean;
  isImpersonated?: boolean;
  impersonatedBy?: string;
  sessionId: string;
  expiresAt: number; // Unix timestamp in seconds
}

export interface OrganizationContext {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED';
  isRootTenant: boolean;
}

export interface ABACScope {
  tenantOrgId: string;
  canAccessAllOrgs: boolean;
  canAccessRestrictedPHI: boolean;
  canApprovePrescriptions: boolean;
  canAdjustInventory: boolean;
  canExecuteRefunds: boolean;
  allowedWarehouseIds: string[];
}

export interface SecurityContext {
  identity: AuthIdentity;
  organization: OrganizationContext;
  roles: AdminRole[];
  permissions: Set<string>;
  abacScope: ABACScope;
  requestId: string;
  clientIp: string;
}

export interface AuthorizeOptions {
  requiredPermission?: string;
  requireActiveSession?: boolean;
  requireOrganizationScope?: string;
  requirePHIPermission?: boolean;
  allowServiceRole?: boolean;
}
