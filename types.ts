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
  province?: string;
  country: string;
  zip: string;
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
  orderNumber: number;
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
