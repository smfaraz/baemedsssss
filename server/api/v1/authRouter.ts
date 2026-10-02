/**
 * BaeMeds /api/v1/auth/* Router
 * Validates payloads with Zod, applies rate limits, and uses Supabase Auth.
 */

import { z } from 'zod';
import { adminSupabase } from '../../adminSupabase.js';
import { TokenService, AuthenticationError } from '../../auth/tokenService.js';
import {
  createApiResponse,
  validateBody,
  enforceRateLimit,
} from '../../middleware/apiHandler.js';
import { RATE_LIMIT_POLICIES } from '../../middleware/rateLimiter.js';
import { AuditLogger } from '../../auditLogger.js';

const LoginSchema = z.object({
  email: z.string().email('Valid email address is required.').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(128),
});

const RegisterSchema = z.object({
  email: z.string().email('Valid email address is required.').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  firstName: z.string().min(1, 'First name is required.').max(80),
  lastName: z.string().min(1, 'Last name is required.').max(80),
});

const RecoverSchema = z.object({
  email: z.string().email('Valid email address is required.').max(255),
});

export class AuthV1Router {
  static async handle(request: Request, subpath: string, requestId: string): Promise<Response> {
    const method = request.method;

    // 1. GET /api/v1/auth/session - Retrieve active session
    if (subpath === 'session' && method === 'GET') {
      const token = TokenService.extractToken(request);
      if (!token) {
        return createApiResponse({ session: null, user: null }, 200, requestId);
      }
      try {
        const identity = await TokenService.verifyToken(token);
        return createApiResponse({ session: { active: true }, user: identity }, 200, requestId);
      } catch {
        return createApiResponse({ session: null, user: null }, 200, requestId);
      }
    }

    // 2. POST /api/v1/auth/login - Authenticate with email/password
    if (subpath === 'login' && method === 'POST') {
      enforceRateLimit(request, RATE_LIMIT_POLICIES.login);
      const input = await validateBody(request, LoginSchema);

      const { data, error } = await adminSupabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error || !data.session) {
        AuditLogger.logEvent({
          actor: input.email,
          action: 'LOGIN_FAILED',
          resource: 'auth:login',
          result: 'FAILURE',
          metadata: { requestId, reason: error?.message || 'Invalid credentials' },
        });
        throw new AuthenticationError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
      }

      AuditLogger.logEvent({
        actor: input.email,
        action: 'LOGIN_SUCCESS',
        resource: 'auth:login',
        result: 'SUCCESS',
        metadata: { requestId, userId: data.user.id },
      });

      return createApiResponse(
        {
          session: {
            accessToken: data.session.access_token,
            expiresAt: data.session.expires_at,
          },
          user: {
            id: data.user.id,
            email: data.user.email,
          },
        },
        200,
        requestId
      );
    }

    // 3. POST /api/v1/auth/register - Register customer account
    if (subpath === 'register' && method === 'POST') {
      enforceRateLimit(request, RATE_LIMIT_POLICIES.login);
      const input = await validateBody(request, RegisterSchema);

      const { data, error } = await adminSupabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            first_name: input.firstName,
            last_name: input.lastName,
          },
        },
      });

      if (error || !data.user) {
        throw new AuthenticationError(error?.message || 'Registration failed.', 400, 'REGISTRATION_FAILED');
      }

      AuditLogger.logEvent({
        actor: input.email,
        action: 'ACCOUNT_REGISTERED',
        resource: `user:${data.user.id}`,
        result: 'SUCCESS',
        metadata: { requestId },
      });

      return createApiResponse(
        {
          message: 'Account successfully registered.',
          user: { id: data.user.id, email: data.user.email },
        },
        201,
        requestId
      );
    }

    // 4. POST /api/v1/auth/recover - Password reset email
    if (subpath === 'recover' && method === 'POST') {
      enforceRateLimit(request, RATE_LIMIT_POLICIES.password_reset);
      const input = await validateBody(request, RecoverSchema);

      await adminSupabase.auth.resetPasswordForEmail(input.email);

      AuditLogger.logEvent({
        actor: input.email,
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'auth:recover',
        result: 'SUCCESS',
        metadata: { requestId },
      });

      return createApiResponse(
        { message: 'If this email exists, password recovery instructions have been dispatched.' },
        200,
        requestId
      );
    }

    // 5. POST /api/v1/auth/logout - Revoke active session
    if (subpath === 'logout' && method === 'POST') {
      const token = TokenService.extractToken(request);
      if (token) {
        TokenService.revokeSession(token, 'user_self', 'User initiated logout');
      }
      return createApiResponse({ message: 'Session successfully terminated.' }, 200, requestId);
    }

    throw new AuthenticationError(`Unknown auth route /api/v1/auth/${subpath}`, 404, 'ROUTE_NOT_FOUND');
  }
}
