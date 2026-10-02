import React from 'react';

// types.ts
export interface Product {
  id: string;
  handle: string; // Add this field
  vendor: string;
  title: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  image: string; // Primary image
  images: string[]; // Gallery images
  tags: string[];
  specs: string;
  inStock: boolean;
  variantId?: string; // Specific variant ID for cart
  description?: string;
  rating?: number;
  reviewCount?: number;
  warranty?: string;
  seo?: {
    title: string | null;
    description: string | null;
  };
  metafields?: {
    namespace: string;
    key: string;
    value: string;
  }[];
  youtubeVideos?: string[];
  requiresPrescription?: boolean;
  prescriptionRequired?: boolean;
  isRentalAvailable?: boolean;
  fsaEligible?: boolean;
  hcpcsCode?: string;
  fdaClassification?: 'Class I' | 'Class II' | 'Class III';
  ndcNumber?: string;
  udi?: string;
  eligibleFsaHsa?: boolean;
  isRegulatoryVerified?: boolean;
  weightLbs?: number;
  // Shopify-grade commerce & McKesson dropshipping fields
  wholesaleCost?: number;
  costPerItem?: number;
  sku?: string;
  barcode?: string;
  mckessonItemNumber?: string;
  inventoryQuantity?: number;
  trackInventory?: boolean;
  isHeroProduct?: boolean;
  heroRank?: number;
  features?: string[];
  specifications?: Record<string, string>;
  seoTitle?: string;
  seoDescription?: string;
  variants?: ProductVariant[];
  selectedVariantId?: string;
}

export interface ProductVariant {
  id: string; // e.g. 'var-1184218'
  title: string; // e.g. 'Large' or 'Medium - Pack of 14'
  size?: string; // e.g. 'Large', 'Medium', 'X-Large', '2X-Large'
  packageQuantity?: string; // e.g. 'Standard Bag', 'Case of 72'
  price: number;
  compareAtPrice?: number | null;
  sku?: string;
  inStock?: boolean;
  inventoryQuantity?: number;
  image?: string;
}

export interface Category {
  id?: string;
  name: string;
  icon: React.ReactNode;
  slug?: string;
  image?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
}

export interface CartItem extends Product {
  quantity: number;
  lineItemId?: string; // Shopify specific line item ID
}

export interface Address {
  id: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string; // US 2-letter state code (e.g. CA, NY, TX)
  country: string; // "United States"
  zip: string; // 5-digit ZIP or ZIP+4
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  orders?: Order[];
  addresses: Address[];
  defaultAddress?: Address;
}

export interface Order {
  id: string;
  orderNumber: number | string;
  processedAt: string;
  totalPrice: { amount: string; currencyCode: string };
  totalShippingPrice: { amount: string; currencyCode: string };
  totalTax?: { amount: string; currencyCode: string };
  financialStatus: string;
  fulfillmentStatus: string;
  lineItems: { title: string; quantity: number }[];
  successfulFulfillments: {
    trackingCompany?: string;
    trackingInfo: { number?: string; url?: string }[];
  }[];
  statusUrl: string;
}

export interface TaxCalculation {
  subtotal: number;
  taxableAmount: number;
  estimatedTax: number;
  taxRate: number;
  state: string;
  isExempt: boolean;
  exemptionReason?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  carrier: 'USPS' | 'UPS' | 'FedEx' | 'Medical Freight';
  price: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  guaranteed?: boolean;
}

export type AdminRole =
  | 'super_admin'
  | 'compliance_officer'
  | 'clinical_specialist'
  | 'support_agent'
  | 'fulfillment_specialist'
  | 'customer';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export type StaffRole =
  | 'SUPER_ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'CUSTOMER_SUPPORT'
  | 'FULFILLMENT'
  | 'COMPLIANCE'
  | 'READ_ONLY';

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, unknown>;
}

