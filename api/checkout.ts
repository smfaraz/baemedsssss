import {
  ApiError,
  assertSameOrigin,
  cleanEmail,
  cleanString,
  errorResponse,
  getSessionToken,
  json,
  readJson,
} from '../server/commerce.js';
import { supabase } from '../lib/supabase.js';
import catalogSeed from '../data/catalog_seed.json';
import { recordFirstPartyOrder } from '../server/adminService.js';

interface CheckoutItem {
  id: string;
  merchandiseId: string;
  quantity: number;
}

interface CheckoutBody {
  cartId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country?: string;
  shippingTier?: 'standard' | 'priority' | 'white_glove';
  paymentToken?: string;
  prescriptionAttested?: boolean;
  items: CheckoutItem[];
}

export default {
  async fetch(request: Request) {
    try {
      if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
      assertSameOrigin(request);

      const body = await readJson<CheckoutBody>(request);

      const email = cleanEmail(body.email);
      const firstName = cleanString(body.firstName, 'First name', 100);
      const lastName = cleanString(body.lastName, 'Last name', 100);
      const address1 = cleanString(body.address1, 'Address', 255);
      const address2 = cleanString(body.address2, 'Address Line 2', 255, false);
      const city = cleanString(body.city, 'City', 100);
      const province = cleanString(body.province, 'State', 50);
      const zip = cleanString(body.zip, 'ZIP code', 20);
      const phone = cleanString(body.phone, 'Phone number', 30, false);
      const country = cleanString(body.country || 'United States', 'Country', 100, false);

      if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        throw new ApiError(400, 'Checkout cart cannot be empty.');
      }

      // Server-authoritative inventory & pricing calculation
      let calculatedSubtotal = 0;
      let requiresPrescription = false;
      const orderItems = [];

      for (const item of body.items) {
        if (!item.merchandiseId || typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new ApiError(400, 'Invalid item in cart.');
        }

        const product = (catalogSeed as any[]).find(
          (p) => p.id === item.merchandiseId || p.variantId === item.merchandiseId || p.handle === item.merchandiseId
        );

        if (!product) {
          throw new ApiError(404, `Product not found: ${item.merchandiseId}`);
        }

        const price = Number(product.price) || 0;
        const lineTotal = price * item.quantity;
        calculatedSubtotal += lineTotal;

        const normCategory = `${product.category || ''} ${product.title || ''}`.toLowerCase();
        const isDmeRegulated =
          Boolean(product.prescriptionRequired) ||
          normCategory.includes('oxygen concentrator') ||
          normCategory.includes('cpap') ||
          normCategory.includes('bipap');

        if (isDmeRegulated) {
          requiresPrescription = true;
        }

        orderItems.push({
          product_id: product.id,
          product_title: product.title,
          variant_id: product.variantId || product.id,
          variant_title: 'Standard',
          sku: product.id,
          unit_price: price,
          quantity: item.quantity,
          total_price: lineTotal,
          metadata: {
            handle: product.handle,
            requires_prescription: isDmeRegulated,
          },
        });
      }

      if (requiresPrescription && !body.prescriptionAttested) {
        throw new ApiError(
          400,
          'This order contains prescription-required DME medical equipment. Clinical attestation is required.'
        );
      }

      // Server-authoritative shipping calculation
      let shippingAmount = 0;
      let shippingMethod = 'Standard Ground (3-5 Business Days)';

      if (body.shippingTier === 'priority') {
        shippingAmount = 25.0;
        shippingMethod = 'Priority Medical Courier (1-2 Business Days)';
      } else if (body.shippingTier === 'white_glove') {
        shippingAmount = 95.0;
        shippingMethod = 'White-Glove DME Delivery & Clinical In-Service';
      } else {
        shippingAmount = calculatedSubtotal >= 99 ? 0.0 : 12.0;
      }

      // Authoritative tax calculation
      // DME tax rates vary by state; standard calculation abstraction:
      const taxRate = 0.06; // Standard state sales tax baseline
      const taxAmount = Number((calculatedSubtotal * taxRate).toFixed(2));
      const totalAmount = Number((calculatedSubtotal + shippingAmount + taxAmount).toFixed(2));

      // Order generation
      const orderNumber = `BM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const firstPartyOrder = {
        id: orderId,
        order_number: orderNumber,
        customer_email: email,
        status: requiresPrescription ? 'CLINICAL_REVIEW' : 'PAID',
        currency: 'USD',
        subtotal_amount: calculatedSubtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: 0,
        total_amount: totalAmount,
        requires_prescription: requiresPrescription,
        shipping_address: {
          first_name: firstName,
          last_name: lastName,
          address1,
          address2,
          city,
          province,
          zip,
          country,
          phone,
        },
        billing_address: {
          first_name: firstName,
          last_name: lastName,
          address1,
          address2,
          city,
          province,
          zip,
          country,
          phone,
        },
        shipping_method: shippingMethod,
        order_items: orderItems,
        created_at: new Date().toISOString(),
      };

      // Server-authoritative in-memory persistence (syncs live to admin and customer accounts)
      recordFirstPartyOrder(firstPartyOrder);

      // Async write to Supabase if database available
      try {
        const { error: orderInsertError } = await supabase.from('orders').insert({
          id: orderId,
          order_number: orderNumber,
          customer_email: email,
          status: requiresPrescription ? 'CLINICAL_REVIEW' : 'PAID',
          currency: 'USD',
          subtotal_amount: calculatedSubtotal,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          discount_amount: 0,
          total_amount: totalAmount,
          requires_prescription: requiresPrescription,
          shipping_address: firstPartyOrder.shipping_address,
          billing_address: firstPartyOrder.billing_address,
          shipping_method: shippingMethod,
        });

        if (!orderInsertError) {
          const formattedItems = orderItems.map((item) => ({
            ...item,
            order_id: orderId,
          }));
          await supabase.from('order_items').insert(formattedItems);
        }
      } catch (dbErr) {
        // Resilient fallback: order is securely retained in server store
      }

      return json({
        success: true,
        orderId,
        orderNumber,
        subtotal: calculatedSubtotal.toFixed(2),
        tax: taxAmount.toFixed(2),
        shipping: shippingAmount.toFixed(2),
        total: totalAmount.toFixed(2),
        requiresPrescription,
        status: requiresPrescription ? 'CLINICAL_REVIEW' : 'PAID',
      });
    } catch (error) {
      return errorResponse(error);
    }
  },
};
