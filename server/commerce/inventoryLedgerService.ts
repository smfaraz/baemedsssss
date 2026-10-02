/**
 * BaeMeds USA — Inventory Ledger Service
 * 
 * Authoritative multi-tier inventory accounting backed by PostgreSQL:
 * - Warehouses & Warehouse Inventory
 * - Atomic Reservation (SELECT ... FOR UPDATE)
 * - Reservation Lifecycle (RESERVED -> FULFILLED | RELEASED)
 * - Immutable Movement Ledger (Auditability)
 */

import { PostgresEngine } from './postgresEngine.js';
import type { ReservationResult, ReleaseResult, WarehouseInventory, InventoryMovement } from './inventoryTypes.js';

export class InventoryLedgerService {
  /**
   * Initializes the inventory ledger database schema and migrations.
   */
  static async init() {
    return await PostgresEngine.initialize();
  }

  /**
   * Reserves stock atomically with PostgreSQL row-level locking.
   * Eliminates all JavaScript race conditions.
   */
  static async reserveStock(params: {
    productId: string;
    quantity: number;
    warehouseId?: string;
    orderId?: string;
    actorId?: string;
    ttlMinutes?: number;
  }): Promise<ReservationResult> {
    return await PostgresEngine.reserveInventoryAtomic(params);
  }

  /**
   * Releases an active reservation back to available stock.
   */
  static async releaseReservation(params: {
    reservationId: string;
    reason?: string;
    actorId?: string;
  }): Promise<ReleaseResult> {
    return await PostgresEngine.releaseInventoryAtomic(params);
  }

  /**
   * Fulfills an active reservation upon order shipment/completion.
   */
  static async fulfillReservation(params: {
    reservationId: string;
    actorId?: string;
  }) {
    return await PostgresEngine.fulfillReservationAtomic(params);
  }

  /**
   * Gets authoritative inventory levels for a product.
   */
  static async getInventory(productId: string, warehouseId = 'wh_primary_us_east'): Promise<WarehouseInventory | null> {
    return await PostgresEngine.getInventoryLevels(productId, warehouseId);
  }

  /**
   * Reconstructs authoritative stock directly from the immutable movement ledger.
   * Answers the audit question: "Why does this product show X units available?"
   */
  static async reconstructFromLedger(productId: string, warehouseId = 'wh_primary_us_east') {
    return await PostgresEngine.reconstructInventoryFromLedger(productId, warehouseId);
  }

  /**
   * Records a manual inventory adjustment with audited reason.
   */
  static async recordAdjustment(params: {
    productId: string;
    warehouseId?: string;
    movementType: 'RECEIPT' | 'CYCLE_COUNT_CORRECTION' | 'DAMAGE_QUARANTINE' | 'RETURN_RESTOCK';
    delta: number;
    actorId: string;
    reason: string;
  }) {
    const warehouseId = params.warehouseId || 'wh_primary_us_east';
    const current = await this.getInventory(params.productId, warehouseId);
    if (!current) throw new Error(`Product ${params.productId} not found in warehouse`);

    const newOnHand = current.on_hand + params.delta;
    if (newOnHand < current.reserved) {
      throw new Error(`Cannot adjust on_hand below reserved quantity (${current.reserved})`);
    }

    await PostgresEngine.query(
      `UPDATE public.warehouse_inventory 
       SET on_hand = $1, updated_at = now() 
       WHERE warehouse_id = $2 AND product_id = $3;`,
      [newOnHand, warehouseId, params.productId]
    );

    const movRes = await PostgresEngine.query(
      `INSERT INTO public.inventory_movements (
        warehouse_id, product_id, movement_type, delta, resulting_on_hand,
        resulting_reserved, actor_id, reason
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        warehouseId,
        params.productId,
        params.movementType,
        params.delta,
        newOnHand,
        current.reserved,
        params.actorId,
        params.reason
      ]
    );

    return movRes[0] as InventoryMovement;
  }
}
