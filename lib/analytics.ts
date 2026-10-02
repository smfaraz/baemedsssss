/**
 * BaeMeds Unified Omnichannel Analytics & Conversion Tracking
 * Bridges Google Analytics 4 (GA4 e-commerce standard) and Meta Pixel (CAPI & Browser Pixel)
 * for Google Ads (AW-18416931440), GA4 (G-X64Q6D0M61), and Meta Ads.
 */

import { Product, CartItem } from '../types';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

export const Analytics = {
  /**
   * Tracks when a user views a specific DME product page
   */
  trackViewItem(product: Product) {
    if (typeof window === 'undefined') return;

    // GA4 E-commerce Standard
    if (window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'USD',
        value: product.price,
        items: [
          {
            item_id: product.id,
            item_name: product.title,
            item_category: product.category,
            price: product.price,
            quantity: 1,
            item_brand: product.vendor || 'BaeMeds USA',
          },
        ],
      });
    }

    // Meta Pixel Standard
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: product.title,
        content_category: product.category,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'USD',
      });
    }
  },

  /**
   * Tracks when an item is added to the cart
   */
  trackAddToCart(product: Product, quantity = 1) {
    if (typeof window === 'undefined') return;

    // GA4 E-commerce Standard
    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: product.price * quantity,
        items: [
          {
            item_id: product.id,
            item_name: product.title,
            item_category: product.category,
            price: product.price,
            quantity,
            item_brand: product.vendor || 'BaeMeds USA',
          },
        ],
      });
    }

    // Meta Pixel Standard
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: product.title,
        content_category: product.category,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price * quantity,
        currency: 'USD',
      });
    }
  },

  /**
   * Tracks when a user enters the checkout funnel
   */
  trackBeginCheckout(items: CartItem[], total: number) {
    if (typeof window === 'undefined') return;

    // GA4 E-commerce Standard
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: total,
        items: items.map((i) => ({
          item_id: i.id,
          item_name: i.title,
          item_category: i.category,
          price: i.price,
          quantity: i.quantity,
        })),
      });
    }

    // Meta Pixel Standard
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: items.map((i) => i.id),
        content_type: 'product',
        num_items: items.reduce((acc, i) => acc + i.quantity, 0),
        value: total,
        currency: 'USD',
      });
    }
  },

  /**
   * Tracks verified order completion & fires Google Ads Conversion Tag
   */
  trackPurchase(order: {
    orderNumber: string;
    totalAmount: number;
    currency?: string;
    items?: Array<{ id: string; title: string; price: number; quantity: number }>;
  }) {
    if (typeof window === 'undefined') return;

    const currency = order.currency || 'USD';

    // 1. GA4 Purchase Event
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: order.orderNumber,
        value: order.totalAmount,
        currency,
        items: (order.items || []).map((i) => ({
          item_id: i.id,
          item_name: i.title,
          price: i.price,
          quantity: i.quantity,
        })),
      });

      // 2. Google Ads Conversion Event
      window.gtag('event', 'conversion', {
        send_to: 'AW-18416931440/XwPhCM6B--scEPCk8M1E',
        value: order.totalAmount,
        currency,
        transaction_id: order.orderNumber,
      });
    }

    // 3. Meta Pixel Purchase Event
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        content_ids: (order.items || []).map((i) => i.id),
        content_type: 'product',
        value: order.totalAmount,
        currency,
      });
    }
  },
};
