/**
 * BaeMeds USA — Enterprise PostgreSQL Transaction Engine
 * 
 * Provides an authoritative PostgreSQL execution environment with true row-level locking
 * (SELECT ... FOR UPDATE) and ACID transaction guarantees.
 * Runs against PostgreSQL (native or WASM PGlite) ensuring complete parity with Supabase.
 */

import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReservationResult, ReleaseResult, InventoryMovement, WarehouseInventory } from './inventoryTypes.js';
import type { CreateOrderInput, OrderTransactionResult, OrderStatusHistoryEntry } from './orderTypes.js';

let sharedDb: PGlite | null = null;
let isInitialized = false;

export class PostgresEngine {
  private static async getDb(): Promise<PGlite> {
    if (!sharedDb) {
      sharedDb = new PGlite();
    }
    return sharedDb;
  }

  /**
   * Initializes the database with the master schema and the transactional inventory ledger migration.
   */
  static async initialize(customDb?: PGlite): Promise<PGlite> {
    const db = customDb || (await this.getDb());
    if (isInitialized && !customDb) return db;

    // 1. Apply master schema prerequisites (products, orders, order_items)
    await db.exec(`
      -- Ensure native uuid support
      DO $$ BEGIN
        BEGIN
          CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END $$;

      CREATE TABLE IF NOT EXISTS public.products (
        id text primary key,
        title text not null,
        handle text unique not null,
        description text,
        category text not null,
        price numeric(10,2) not null check (price >= 0),
        compare_at_price numeric(10,2),
        wholesale_cost numeric(10,2),
        sku text,
        barcode text,
        mckesson_item_number text,
        inventory_quantity integer default 25,
        track_inventory boolean default true,
        is_hero_product boolean default false,
        featured_image text,
        images text[] default '{}',
        features text[] default '{}',
        specs jsonb default '{}'::jsonb,
        warranty text,
        is_rental_available boolean default false,
        prescription_required boolean default false,
        hcpcs_code text,
        fda_classification text,
        is_regulatory_verified boolean default false,
        seo_title text,
        seo_description text,
        is_active boolean default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      CREATE TABLE IF NOT EXISTS public.product_variants (
        id text primary key,
        product_id text not null references public.products(id) on delete cascade,
        title text not null default 'Standard',
        sku text,
        price numeric(10,2) not null check (price >= 0),
        available_quantity integer not null default 100 check (available_quantity >= 0),
        reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
        is_active boolean default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      CREATE TABLE IF NOT EXISTS public.orders (
        id text primary key,
        order_number text unique not null,
        user_id uuid,
        customer_email text not null,
        status text not null default 'PAID',
        currency text not null default 'USD',
        subtotal_amount numeric(10,2) not null check (subtotal_amount >= 0),
        tax_amount numeric(10,2) not null default 0.00 check (tax_amount >= 0),
        shipping_amount numeric(10,2) not null default 0.00 check (shipping_amount >= 0),
        discount_amount numeric(10,2) not null default 0.00 check (discount_amount >= 0),
        total_amount numeric(10,2) not null check (total_amount >= 0),
        requires_prescription boolean not null default false,
        shipping_address jsonb not null default '{}'::jsonb,
        billing_address jsonb not null default '{}'::jsonb,
        shipping_method text not null default 'Standard Ground',
        tracking_number text,
        carrier text,
        tracking_url text,
        mckesson_po_number text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      CREATE TABLE IF NOT EXISTS public.order_items (
        id text primary key default ('oit_' || replace(gen_random_uuid()::text, '-', '')),
        order_id text not null references public.orders(id) on delete cascade,
        product_id text,
        product_title text not null,
        variant_id text,
        variant_title text default 'Standard',
        sku text,
        mckesson_item_number text,
        unit_price numeric(10,2) not null check (unit_price >= 0),
        quantity integer not null check (quantity > 0),
        total_price numeric(10,2) not null check (total_price >= 0),
        metadata jsonb default '{}'::jsonb,
        created_at timestamptz not null default now()
      );
    `);

    // 2. Read and apply the transactional inventory ledger migration
    let migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261001080000_inventory_ledger_and_atomic_transactions.sql');
    if (!fs.existsSync(migrationPath)) {
      const dirname = path.dirname(fileURLToPath(import.meta.url));
      migrationPath = path.resolve(dirname, '../../supabase/migrations/20261001080000_inventory_ledger_and_atomic_transactions.sql');
    }

    if (fs.existsSync(migrationPath)) {
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      await db.exec(migrationSql);
    } else {
      throw new Error(`Migration SQL not found at ${migrationPath}`);
    }

    if (!customDb) {
      isInitialized = true;
    }
    return db;
  }

  /**
   * Resets the database instance (useful for clean test isolation).
   */
  static async reset(): Promise<PGlite> {
    sharedDb = new PGlite();
    isInitialized = false;
    return await this.initialize();
  }

  /**
   * Raw query execution.
   */
  static async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = await this.getDb();
    const res = await db.query(sql, params);
    return res.rows as T[];
  }

  /**
   * Multi-statement raw SQL execution.
   */
  static async exec(sql: string): Promise<void> {
    const db = await this.getDb();
    await db.exec(sql);
  }

  /**
   * Atomically reserves inventory using PostgreSQL row-level locking (SELECT ... FOR UPDATE).
   */
  static async reserveInventoryAtomic(params: {
    warehouseId?: string;
    productId: string;
    quantity: number;
    orderId?: string;
    actorId?: string;
    ttlMinutes?: number;
  }): Promise<ReservationResult> {
    const db = await this.getDb();
    const warehouseId = params.warehouseId || 'wh_primary_us_east';
    const actorId = params.actorId || 'system';
    const ttlMinutes = params.ttlMinutes || 30;

    const res = await db.query(
      `SELECT public.reserve_inventory_atomic($1, $2, $3, $4, $5, $6) as result;`,
      [warehouseId, params.productId, params.quantity, params.orderId || null, actorId, ttlMinutes]
    );

    const result = (res.rows[0] as any)?.result;
    return result as ReservationResult;
  }

  /**
   * Atomically releases reserved inventory back to available stock.
   */
  static async releaseInventoryAtomic(params: {
    reservationId: string;
    reason?: string;
    actorId?: string;
  }): Promise<ReleaseResult> {
    const db = await this.getDb();
    const res = await db.query(
      `SELECT public.release_inventory_atomic($1, $2, $3) as result;`,
      [params.reservationId, params.reason || 'Order cancelled or expired', params.actorId || 'system']
    );

    const result = (res.rows[0] as any)?.result;
    return result as ReleaseResult;
  }

  /**
   * Atomically fulfills reservation (dispatches stock).
   */
  static async fulfillReservationAtomic(params: {
    reservationId: string;
    actorId?: string;
  }): Promise<any> {
    const db = await this.getDb();
    const res = await db.query(
      `SELECT public.fulfill_reservation_atomic($1, $2) as result;`,
      [params.reservationId, params.actorId || 'fulfillment_service']
    );

    return (res.rows[0] as any)?.result;
  }

  /**
   * Atomically places an order across all boundaries in a single PostgreSQL transaction.
   */
  static async createOrderAtomic(input: CreateOrderInput): Promise<OrderTransactionResult> {
    const db = await this.getDb();
    const warehouseId = 'wh_primary_us_east';
    const actorId = input.actor_id || 'customer';

    const orderData = {
      customer_email: input.customer_email,
      user_id: input.user_id || null,
      shipping_address: input.shipping_address,
      billing_address: input.billing_address || input.shipping_address,
      shipping_method: input.shipping_method || 'Standard Ground',
      status: 'PAID'
    };

    const itemsData = input.items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      variant_id: i.variant_id || null
    }));

    try {
      const res = await db.query(
        `SELECT public.create_order_atomic($1::jsonb, $2::jsonb, $3, $4, $5) as result;`,
        [
          JSON.stringify(orderData),
          JSON.stringify(itemsData),
          warehouseId,
          actorId,
          input.idempotency_key || null
        ]
      );

      const result = (res.rows[0] as any)?.result;
      return result as OrderTransactionResult;
    } catch (err: any) {
      return {
        success: false,
        error: 'TRANSACTION_FAILED',
        message: err.message
      };
    }
  }

  /**
   * Retrieves current inventory levels for a product.
   */
  static async getInventoryLevels(productId: string, warehouseId = 'wh_primary_us_east'): Promise<WarehouseInventory | null> {
    const db = await this.getDb();
    const res = await db.query(
      `SELECT * FROM public.warehouse_inventory WHERE warehouse_id = $1 AND product_id = $2;`,
      [warehouseId, productId]
    );
    if (!res.rows || res.rows.length === 0) return null;
    return res.rows[0] as WarehouseInventory;
  }

  /**
   * Reconstructs inventory from immutable movements ledger to verify ledger integrity.
   */
  static async reconstructInventoryFromLedger(productId: string, warehouseId = 'wh_primary_us_east'): Promise<{
    calculated_on_hand: number;
    calculated_reserved: number;
    calculated_available: number;
    movements: InventoryMovement[];
  }> {
    const db = await this.getDb();
    const res = await db.query(
      `SELECT * FROM public.inventory_movements 
       WHERE warehouse_id = $1 AND product_id = $2 
       ORDER BY created_at ASC;`,
      [warehouseId, productId]
    );

    const movements = res.rows as InventoryMovement[];
    let onHand = 0;
    let reserved = 0;

    for (const mov of movements) {
      switch (mov.movement_type) {
        case 'RECEIPT':
        case 'RETURN_RESTOCK':
        case 'CYCLE_COUNT_CORRECTION':
          onHand += mov.delta;
          break;
        case 'SALE_RESERVATION':
          reserved += mov.delta;
          break;
        case 'RESERVATION_RELEASE':
          reserved += mov.delta; // mov.delta is negative
          break;
        case 'FULFILLMENT':
          onHand += mov.delta;   // mov.delta is negative
          reserved += mov.delta; // mov.delta is negative
          break;
        case 'DAMAGE_QUARANTINE':
          onHand += mov.delta;
          break;
        default:
          break;
      }
    }

    return {
      calculated_on_hand: onHand,
      calculated_reserved: reserved,
      calculated_available: onHand - reserved,
      movements
    };
  }

  /**
   * Retrieves immutable order status history timeline.
   */
  static async getOrderHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
    const db = await this.getDb();
    const res = await db.query(
      `SELECT * FROM public.order_status_history 
       WHERE order_id = $1 
       ORDER BY created_at ASC;`,
      [orderId]
    );
    return res.rows as OrderStatusHistoryEntry[];
  }
}
