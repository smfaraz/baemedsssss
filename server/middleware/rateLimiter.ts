/**
 * BaeMeds Enterprise Sliding Window Rate Limiter
 * Implements Section 33 rate limiting requirements across critical security endpoints.
 */

export interface RateLimitPolicy {
  windowMs: number;
  maxRequests: number;
  policyName: string;
}

export const RATE_LIMIT_POLICIES: Record<string, RateLimitPolicy> = {
  login: { windowMs: 60 * 1000, maxRequests: 5, policyName: 'AUTH_LOGIN' },
  password_reset: { windowMs: 15 * 60 * 1000, maxRequests: 3, policyName: 'PASSWORD_RESET' },
  checkout: { windowMs: 60 * 1000, maxRequests: 15, policyName: 'CHECKOUT_ORDER' },
  prescription_upload: { windowMs: 60 * 60 * 1000, maxRequests: 10, policyName: 'CLINICAL_UPLOAD' },
  admin_mutation: { windowMs: 60 * 1000, maxRequests: 60, policyName: 'ADMIN_MUTATION' },
  default: { windowMs: 60 * 1000, maxRequests: 120, policyName: 'GENERAL_API' },
};

interface RequestRecord {
  timestamps: number[];
}

const memoryRateLimitStore = new Map<string, RequestRecord>();

export class RateLimiter {
  /**
   * Evaluates if a request exceeds rate limits.
   * Returns rate limit state: { allowed: boolean, remaining: number, resetSeconds: number }
   */
  static check(
    key: string,
    policy: RateLimitPolicy = RATE_LIMIT_POLICIES.default
  ): { allowed: boolean; remaining: number; resetSeconds: number } {
    const now = Date.now();
    const windowStart = now - policy.windowMs;

    let record = memoryRateLimitStore.get(key);
    if (!record) {
      record = { timestamps: [] };
      memoryRateLimitStore.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= policy.maxRequests) {
      const oldestTs = record.timestamps[0];
      const resetSeconds = Math.ceil((oldestTs + policy.windowMs - now) / 1000);
      return { allowed: false, remaining: 0, resetSeconds: Math.max(1, resetSeconds) };
    }

    // Record this request
    record.timestamps.push(now);
    const remaining = policy.maxRequests - record.timestamps.length;
    return { allowed: true, remaining, resetSeconds: Math.ceil(policy.windowMs / 1000) };
  }

  /**
   * Clear records for testing
   */
  static reset(): void {
    memoryRateLimitStore.clear();
  }
}
