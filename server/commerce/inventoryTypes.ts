/**
 * BaeMeds USA — Enterprise Inventory Ledger Types & Service
 * 
 * Replaces legacy products.inventory_quantity with multi-tier inventory accounting:
 * - Warehouses
 * - Warehouse Inventory (on_hand, reserved, available, incoming, allocated, quarantined)
 * - Inventory Reservations (RESERVED -> FULFILLED | RELEASED | EXPIRED)
 * - Inventory Movements (Immutable audit ledger)
 */

export type MovementType =
  | 'RECEIPT'
  | 'SALE_RESERVATION'
  | 'RESERVATION_RELEASE'
  | 'FULFILLMENT'
  | 'RETURN_RESTOCK'
  | 'DAMAGE_QUARANTINE'
  | 'CYCLE_COUNT_CORRECTION'
  | 'TRANSFER';

export type ReservationStatus = 'RESERVED' | 'FULFILLED' | 'RELEASED' | 'EXPIRED';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address_line1?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_active: boolean;
  created_at: string;
}

export interface WarehouseInventory {
  id: string;
  warehouse_id: string;
  product_id: string;
  variant_id?: string | null;
  sku?: string | null;
  on_hand: number;
  reserved: number;
  available: number;
  incoming: number;
  allocated: number;
  quarantined: number;
  updated_at: string;
}

export interface InventoryReservation {
  id: string;
  order_id?: string | null;
  warehouse_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  status: ReservationStatus;
  expires_at: string;
  released_at?: string | null;
  release_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  warehouse_id: string;
  product_id: string;
  variant_id?: string | null;
  movement_type: MovementType;
  delta: number;
  resulting_on_hand: number;
  resulting_reserved: number;
  actor_id: string;
  order_id?: string | null;
  reference_number?: string | null;
  reason: string;
  created_at: string;
}

export interface ReservationResult {
  success: boolean;
  reservation_id?: string;
  product_id?: string;
  warehouse_id?: string;
  quantity_reserved?: number;
  on_hand?: number;
  reserved?: number;
  available?: number;
  expires_at?: string;
  error?: string;
  message?: string;
  code?: number;
}

export interface ReleaseResult {
  success: boolean;
  reservation_id?: string;
  product_id?: string;
  quantity_released?: number;
  on_hand?: number;
  reserved?: number;
  available?: number;
  error?: string;
  message?: string;
  code?: number;
}
