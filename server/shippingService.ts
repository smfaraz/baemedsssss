/**
 * US Shipping Carrier & Rate Service Abstraction
 *
 * Implements shipping calculation, tier selection, delivery date estimation,
 * and tracking URL resolution for USPS, UPS, FedEx, and Medical Freight carriers.
 */

import { ShippingOption } from '../types';

export interface ShippingRateRequest {
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    weightLbs?: number;
    requiresFreight?: boolean;
  }>;
  destination: {
    zip: string;
    state: string;
    city?: string;
  };
}

export class ShippingService {
  /**
   * Determine available US shipping tiers and prices
   */
  static getAvailableOptions(request: ShippingRateRequest): ShippingOption[] {
    const totalOrderValue = request.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const totalWeightLbs = request.items.reduce((sum, i) => sum + (i.weightLbs || 2) * i.quantity, 0);
    const hasHeavyFreight = request.items.some((i) => i.requiresFreight || (i.weightLbs && i.weightLbs > 70));

    // Heavy DME (Hospital Beds, Bariatric Lifts) require Specialized Medical Freight
    if (hasHeavyFreight) {
      return [
        {
          id: 'freight-standard',
          name: 'Medical Freight Delivery (Liftgate Included)',
          carrier: 'Medical Freight',
          price: 149.00,
          estimatedDaysMin: 4,
          estimatedDaysMax: 8,
          guaranteed: true,
        },
        {
          id: 'freight-white-glove',
          name: 'White-Glove Inside Delivery & Assembly',
          carrier: 'Medical Freight',
          price: 249.00,
          estimatedDaysMin: 5,
          estimatedDaysMax: 10,
          guaranteed: true,
        },
      ];
    }

    // Standard orders: Free ground shipping over $99, otherwise $9.95
    const isFreeStandard = totalOrderValue >= 99.00;
    const standardRate = isFreeStandard ? 0.00 : 9.95;

    return [
      {
        id: 'standard-ground',
        name: isFreeStandard ? 'Free Standard Ground (Orders over $99)' : 'Standard Ground',
        carrier: totalWeightLbs > 5 ? 'UPS' : 'USPS',
        price: standardRate,
        estimatedDaysMin: 3,
        estimatedDaysMax: 5,
      },
      {
        id: 'expedited-2day',
        name: 'Expedited 2-Day Air',
        carrier: 'FedEx',
        price: 24.95,
        estimatedDaysMin: 2,
        estimatedDaysMax: 2,
        guaranteed: true,
      },
      {
        id: 'priority-overnight',
        name: 'Priority Overnight (Critical Medical Delivery)',
        carrier: 'FedEx',
        price: 49.95,
        estimatedDaysMin: 1,
        estimatedDaysMax: 1,
        guaranteed: true,
      },
    ];
  }

  /**
   * Resolve carrier-specific tracking URL
   */
  static getTrackingUrl(carrier: string, trackingNumber: string): string {
    const cleanCarrier = (carrier || '').toLowerCase();
    const cleanNumber = encodeURIComponent(trackingNumber.trim());

    if (cleanCarrier.includes('usps') || cleanCarrier.includes('postal')) {
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${cleanNumber}`;
    }
    if (cleanCarrier.includes('ups') || cleanCarrier.includes('united parcel')) {
      return `https://www.ups.com/track?tracknum=${cleanNumber}`;
    }
    if (cleanCarrier.includes('fedex') || cleanCarrier.includes('federal express')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${cleanNumber}`;
    }

    // Generic fallback or carrier status link
    return `https://www.google.com/search?q=${encodeURIComponent(`${carrier} tracking ${trackingNumber}`)}`;
  }
}
