/**
 * BaeMeds USA — Order Transaction & History Types
 */

export interface OrderItemInput {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

export interface CreateOrderInput {
  customer_email: string;
  user_id?: string;
  items: OrderItemInput[];
  shipping_address: {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  billing_address?: Record<string, any>;
  shipping_method?: string;
  payment_intent_id?: string;
  idempotency_key?: string;
  actor_id?: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  user_id?: string | null;
  customer_email: string;
  status: string;
  currency: string;
  subtotal_amount: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  requires_prescription: boolean;
  shipping_address: Record<string, any>;
  billing_address: Record<string, any>;
  shipping_method: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  actor: string;
  actor_role: string;
  reason: string;
  request_id?: string | null;
  created_at: string;
}

export interface OrderTransactionResult {
  success: boolean;
  order?: OrderRecord;
  idempotent_replay?: boolean;
  error?: string;
  message?: string;
  code?: number;
}
