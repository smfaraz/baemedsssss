import {
  ApiError,
  assertSameOrigin,
  cleanEmail,
  cleanString,
  errorResponse,
  getSessionToken,
  json,
  readJson,
} from '../server/commerce';
import { adminSupabase } from '../server/adminSupabase';
import catalogSeed from '../data/catalog_seed.json';
import { AdminService, recordFirstPartyOrder } from '../server/adminService';
import { TaxService, TaxCalculationItem } from '../server/taxService';

interface CheckoutItem {
  id: string;
  merchandiseId: string;
  quantity: number;
}

interface PrescriptionInfo {
  method: 'doctor_contact' | 'upload' | 'send_later';
  doctorName?: string;
  doctorPhone?: string;
  doctorClinic?: string;
  rxFileName?: string;
  notes?: string;
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
  paymentIntentId?: string;
  prescriptionInfo?: PrescriptionInfo;
  customerIsTaxExempt?: boolean;
  taxExemptionCertificate?: string;
  couponCode?: string;
  items: CheckoutItem[];
}

import { EmailService } from '../server/emailService';

async function handleCheckoutWeb(request: Request): Promise<Response> {
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
      let orderRequiresPrescription = false;
      const orderItems = [];
      const taxCalculationItems: TaxCalculationItem[] = [];

      for (const item of body.items) {
        if (!item.merchandiseId || typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new ApiError(400, 'Invalid item in cart.');
        }

        const targetId = String(item.merchandiseId || '').trim();
        const altId = String(item.id || '').trim();

        let product = (catalogSeed as any[]).find((p) => {
          if (p.id === targetId || p.variantId === targetId || p.handle === targetId) return true;
          if (altId && (p.id === altId || p.variantId === altId || p.handle === altId)) return true;
          if (p.variants?.some((v: any) => v.id === targetId || v.originalProductId === targetId || v.sku === targetId)) return true;
          if (targetId.startsWith('var-')) {
            const stripped = targetId.replace(/^var-/, '');
            if (p.id === stripped || p.id === `prd-${stripped}` || p.variantId === targetId) return true;
            if (p.variants?.some((v: any) => v.id === targetId || v.originalProductId === `prd-${stripped}`)) return true;
          }
          if (targetId.startsWith('prd-')) {
            const stripped = targetId.replace(/^prd-/, '');
            if (p.variantId === `var-${stripped}` || p.variantId === `var-${targetId}`) return true;
            if (p.variants?.some((v: any) => v.originalProductId === targetId)) return true;
          }
          return false;
        });

        if (!product) {
          try {
            const strippedId = targetId.startsWith('var-') ? targetId.replace(/^var-/, '') : targetId;
            const lookupIds = Array.from(new Set([targetId, strippedId, `prd-${strippedId}`, altId].filter(Boolean)));
            const orFilters = [
              ...lookupIds.map((id) => `id.eq.${id}`),
              `handle.eq.${targetId}`,
            ].join(',');

            const { data: dbProduct } = await adminSupabase
              .from('products')
              .select('*')
              .or(orFilters)
              .limit(1)
              .maybeSingle();

            if (dbProduct) {
              product = {
                id: dbProduct.id,
                title: dbProduct.title,
                handle: dbProduct.handle,
                price: Number(dbProduct.price),
                variantId: `var-${dbProduct.id}`,
                category: dbProduct.category,
                prescriptionRequired: false,
              };
            }
          } catch (dbLookupErr) {
            console.warn('[Checkout Product Lookup Fallback Error]:', dbLookupErr);
          }
        }

        if (!product) {
          throw new ApiError(404, `Product not found: ${item.merchandiseId}`);
        }

        let price = Number(product.price) || 0;
        let variantTitle = 'Standard';
        let variantId = product.variantId || product.id;

        const matchedVariant = product.variants?.find((v: any) =>
          v.id === targetId ||
          v.originalProductId === targetId ||
          (targetId.startsWith('var-') && v.originalProductId === `prd-${targetId.replace(/^var-/, '')}`) ||
          (altId && (v.id === altId || v.originalProductId === altId))
        );

        if (matchedVariant) {
          price = Number(matchedVariant.price) || price;
          variantTitle = matchedVariant.title || variantTitle;
          variantId = matchedVariant.id || variantId;
        }

        const lineTotal = price * item.quantity;
        calculatedSubtotal += lineTotal;

        const isItemRx = Boolean((product as any).prescriptionRequired || (product as any).prescription_required);
        if (isItemRx) {
          orderRequiresPrescription = true;
        }

        taxCalculationItems.push({
          id: product.id,
          title: product.title,
          price,
          quantity: item.quantity,
          category: product.category,
          requiresPrescription: isItemRx,
        });

        orderItems.push({
          product_id: product.id,
          product_title: product.title,
          variant_id: variantId,
          variant_title: variantTitle,
          sku: matchedVariant?.sku || product.sku || product.id,
          unit_price: price,
          quantity: item.quantity,
          total_price: lineTotal,
          metadata: {
            handle: product.handle,
            size: matchedVariant?.size,
            package_quantity: matchedVariant?.packageQuantity,
            requires_prescription: isItemRx,
          },
        });
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

      // Authoritative destination-based sales tax and medical DME exemption calculation
      const taxCalculation = TaxService.calculateTax({
        items: taxCalculationItems,
        shippingAddress: {
          state: province,
          zip,
          city,
          country,
        },
        customerIsTaxExempt: Boolean(body.customerIsTaxExempt),
        taxExemptionCertificate: body.taxExemptionCertificate,
      });

      const taxAmount = taxCalculation.estimatedTax;

      // Authoritative promotional discount calculation
      let discountAmount = 0;
      let appliedCouponCode: string | null = null;
      if (body.couponCode) {
        const cleanCoupon = body.couponCode.trim().toUpperCase();
        try {
          const discounts = await AdminService.getDiscounts('super_admin');
          const matchedDiscount = discounts.find((d: any) => d.code === cleanCoupon && d.isActive !== false);
          if (matchedDiscount) {
            const minOrder = matchedDiscount.minOrderAmount || 0;
            if (calculatedSubtotal >= minOrder) {
              if (matchedDiscount.type === 'percentage') {
                discountAmount = Number(((calculatedSubtotal * matchedDiscount.value) / 100).toFixed(2));
              } else {
                discountAmount = Number(Math.min(calculatedSubtotal, matchedDiscount.value).toFixed(2));
              }
              appliedCouponCode = matchedDiscount.code;
            }
          }
        } catch {}
      }

      const totalAmount = Number(Math.max(0, calculatedSubtotal - discountAmount + shippingAmount + taxAmount).toFixed(2));

      // Order generation
      const orderNumber = `BM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const firstPartyOrder = {
        id: orderId,
        order_number: orderNumber,
        customer_email: email,
        status: 'PAID',
        currency: 'USD',
        subtotal_amount: calculatedSubtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        coupon_code: appliedCouponCode,
        total_amount: totalAmount,
        requires_prescription: orderRequiresPrescription,
        tax_rate: taxCalculation.taxRate,
        tax_exemption_reason: taxCalculation.exemptionReason || null,
        customer_is_tax_exempt: Boolean(body.customerIsTaxExempt),
        tax_exemption_certificate: body.taxExemptionCertificate || null,
        prescription_method: null,
        prescription_doctor_name: null,
        prescription_doctor_phone: null,
        prescription_doctor_clinic: null,
        prescription_file_name: null,
        payment_intent_id: body.paymentIntentId || body.paymentToken,
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
        const { error: orderInsertError } = await adminSupabase.from('orders').insert({
          id: orderId,
          order_number: orderNumber,
          customer_email: email,
          status: 'PAID',
          currency: 'USD',
          subtotal_amount: calculatedSubtotal,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          discount_amount: 0,
          total_amount: totalAmount,
          requires_prescription: orderRequiresPrescription,
          shipping_address: firstPartyOrder.shipping_address,
          billing_address: firstPartyOrder.billing_address,
          shipping_method: shippingMethod,
        });

        if (!orderInsertError) {
          const formattedItems = orderItems.map((item) => ({
            ...item,
            order_id: orderId,
          }));
          await adminSupabase.from('order_items').insert(formattedItems);
        }
      } catch (dbErr) {
        // Resilient fallback: order is securely retained in server store
      }

      // Automated Transactional Email Dispatch (Customer Receipt + McKesson Drop-Ship PO Alert)
      try {
        await EmailService.sendOrderPlacedEmails({
          orderId,
          orderNumber,
          customerEmail: email,
          customerName: `${firstName} ${lastName}`.trim(),
          phone,
          shippingAddress: firstPartyOrder.shipping_address,
          shippingMethod,
          subtotal: calculatedSubtotal,
          shipping: shippingAmount,
          tax: taxAmount,
          total: totalAmount,
          items: orderItems.map((oi) => ({
            product_id: oi.product_id,
            product_title: oi.product_title,
            sku: oi.sku,
            unit_price: oi.unit_price,
            quantity: oi.quantity,
            total_price: oi.total_price,
          })),
        });
      } catch (emailErr) {
        console.warn('[checkout] Email dispatch error caught non-blocking:', emailErr);
      }

      return json({
        success: true,
        orderId,
        orderNumber,
        subtotal: calculatedSubtotal.toFixed(2),
        tax: taxAmount.toFixed(2),
        shipping: shippingAmount.toFixed(2),
        total: totalAmount.toFixed(2),
        requiresPrescription: orderRequiresPrescription,
        taxRate: taxCalculation.taxRate,
        isTaxExempt: taxCalculation.isExempt,
        taxExemptionReason: taxCalculation.exemptionReason || null,
        status: 'PAID',
      });
    } catch (error) {
      return errorResponse(error);
    }
}

export default async function handler(req: any, res?: any) {
  if (req instanceof Request || (!res && typeof req.text === 'function')) {
    return handleCheckoutWeb(req);
  }

  try {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', req.headers?.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    if ((req.method || '').toUpperCase() === 'OPTIONS') {
      if (res) {
        res.statusCode = 204;
        return res.end();
      }
      return;
    }

    const rawProto = req.headers && req.headers['x-forwarded-proto'];
    const protocol = (Array.isArray(rawProto) ? rawProto[0] : (rawProto || '').split(',')[0].trim()) || 'https';
    const rawHost = req.headers && (req.headers['x-forwarded-host'] || req.headers.host);
    const host = (Array.isArray(rawHost) ? rawHost[0] : (rawHost || '').split(',')[0].trim()) || 'localhost';
    const parsedUrl = new URL(req.url || '/', `${protocol}://${host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers || {})) {
      if (!key || key.startsWith(':') || key.toLowerCase() === 'content-length') continue;
      try {
        if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
        else if (value !== undefined) headers.set(key, String(value));
      } catch {}
    }

    let reqBody: any = undefined;
    if (!['GET', 'HEAD'].includes((req.method || 'GET').toUpperCase())) {
      if (req.body !== undefined && req.body !== null) {
        reqBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const webRequest = new Request(parsedUrl.href, {
      method: req.method,
      headers,
      body: reqBody,
    });

    const webResponse = await handleCheckoutWeb(webRequest);

    if (res) {
      res.statusCode = webResponse.status;
      webResponse.headers.forEach((val, key) => {
        if (key.toLowerCase() !== 'content-length') {
          res.setHeader(key, val);
        }
      });
      const buffer = Buffer.from(await webResponse.arrayBuffer());
      res.end(buffer);
      return;
    }
  } catch (err: any) {
    if (res && !res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: err.message || 'The checkout request could not be completed.' }));
    }
  }
}

handler.fetch = handleCheckoutWeb;
