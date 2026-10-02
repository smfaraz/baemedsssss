/**
 * BaeMeds USA — Enterprise Idempotency Service
 * 
 * Prevents duplicate orders, multiple reservations, and race conditions
 * using Idempotency-Key headers and database locking.
 */

import crypto from 'node:crypto';
import { PostgresEngine } from './postgresEngine.js';

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  inFlight: boolean;
  cachedResponse?: {
    status: number;
    body: any;
  };
}

export class IdempotencyService {
  /**
   * Generates a deterministic hash of the request payload and path.
   */
  static generateRequestHash(path: string, payload: any): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHash('sha256').update(`${path}:${serialized}`).digest('hex');
  }

  /**
   * Acquires or inspects an idempotency key.
   */
  static async checkKey(key: string, path: string, payload: any): Promise<IdempotencyCheckResult> {
    const requestHash = this.generateRequestHash(path, payload);

    const rows = await PostgresEngine.query(
      `SELECT * FROM public.idempotency_keys WHERE key = $1;`,
      [key]
    );

    if (rows.length === 0) {
      // Key does not exist, insert pending lock
      await PostgresEngine.query(
        `INSERT INTO public.idempotency_keys (key, request_path, request_hash, locked_at)
         VALUES ($1, $2, $3, now());`,
        [key, path, requestHash]
      );
      return { isDuplicate: false, inFlight: false };
    }

    const existing = rows[0];

    // If already completed, return cached response
    if (existing.response_body !== null) {
      return {
        isDuplicate: true,
        inFlight: false,
        cachedResponse: {
          status: existing.response_status || 200,
          body: existing.response_body
        }
      };
    }

    // Still in flight
    return {
      isDuplicate: true,
      inFlight: true
    };
  }

  /**
   * Records the final response for an idempotency key.
   */
  static async recordResponse(key: string, status: number, body: any) {
    await PostgresEngine.query(
      `UPDATE public.idempotency_keys 
       SET response_status = $1, response_body = $2::jsonb, completed_at = now() 
       WHERE key = $3;`,
      [status, JSON.stringify(body), key]
    );
  }
}
