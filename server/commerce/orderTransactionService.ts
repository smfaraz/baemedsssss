/**
 * BaeMeds USA — Order Transaction Service
 * 
 * Establishes an atomic boundary across:
 * - Orders & Order Items
 * - Authoritative Pricing & Tax Snapshots
 * - Inventory Reservations
 * - Order Status History
 * - Idempotency Deduplication
 */

import { PostgresEngine } from './postgresEngine.js';
import type { CreateOrderInput, OrderTransactionResult, OrderStatusHistoryEntry } from './orderTypes.js';

export class OrderTransactionService {
  /**
   * Initializes the underlying database tables and procedures.
   */
  static async init() {
    return await PostgresEngine.initialize();
  }

  /**
   * Atomically creates an order in a single PostgreSQL transaction.
   * Recalculates all pricing and tax authoritatively on the server.
   */
  static async placeOrder(input: CreateOrderInput): Promise<OrderTransactionResult> {
    return await PostgresEngine.createOrderAtomic(input);
  }

  /**
   * Cancels an order, transitions status, and releases all inventory reservations.
   */
  static async cancelOrder(orderId: string, reason: string, actorId = 'system'): Promise<{
    success: boolean;
    orderId: string;
    releasedReservations: number;
    error?: string;
  }> {
    // 1. Fetch active reservations for order
    const reservations = await PostgresEngine.query(
      `SELECT id FROM public.inventory_reservations 
       WHERE order_id = $1 AND status = 'RESERVED';`,
      [orderId]
    );

    let releasedCount = 0;
    for (const res of reservations) {
      const releaseResult = await PostgresEngine.releaseInventoryAtomic({
        reservationId: res.id,
        reason: `Order cancelled: ${reason}`,
        actorId
      });
      if (releaseResult.success) {
        releasedCount++;
      }
    }

    // 2. Update order status to CANCELLED
    await PostgresEngine.query(
      `UPDATE public.orders 
       SET status = 'CANCELLED', updated_at = now() 
       WHERE id = $1;`,
      [orderId]
    );

    // 3. Insert status history
    await PostgresEngine.query(
      `INSERT INTO public.order_status_history (
        order_id, from_status, to_status, actor, actor_role, reason
       ) VALUES ($1, $2, $3, $4, $5, $6);`,
      [orderId, 'PAID', 'CANCELLED', actorId, 'system', reason]
    );

    return {
      success: true,
      orderId,
      releasedReservations: releasedCount
    };
  }

  /**
   * Retrieves the authoritative audit timeline of order status transitions.
   */
  static async getOrderTimeline(orderId: string): Promise<OrderStatusHistoryEntry[]> {
    return await PostgresEngine.getOrderHistory(orderId);
  }
}
