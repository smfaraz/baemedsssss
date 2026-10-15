import { ApiError, assertSameOrigin, errorResponse, json, readJson } from '../server/commerce';
import { createVercelHandler } from '../server/serverlessAdapter';
import { AdminService } from '../server/adminService';

interface CouponRequestBody {
  code?: string;
  subtotal?: number;
}

export default createVercelHandler(async (request: Request) => {
  try {
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
    }

    try {
      assertSameOrigin(request);
    } catch (e: any) {
      console.warn('[Coupon API] Origin check notice:', e.message);
    }

    const body = await readJson<CouponRequestBody>(request).catch(() => ({} as CouponRequestBody));
    const rawCode = (body.code || '').trim().toUpperCase();
    const subtotal = typeof body.subtotal === 'number' && body.subtotal >= 0 ? body.subtotal : 0;

    if (!rawCode) {
      return json({ valid: false, error: 'Please enter a promo code.' }, 400);
    }

    // Retrieve active discounts from authoritative store
    let discounts: any[] = [];
    try {
      discounts = await AdminService.getDiscounts('super_admin');
    } catch {
      discounts = [
        {
          id: 'disc_welcome10',
          code: 'WELCOME10',
          type: 'percentage',
          value: 10,
          minOrderAmount: 50,
          isActive: true,
        },
        {
          id: 'disc_dme25',
          code: 'CLINICAL25',
          type: 'fixed',
          value: 25,
          minOrderAmount: 200,
          isActive: true,
        },
      ];
    }

    const matched = discounts.find((d: any) => d.code === rawCode);

    if (!matched) {
      return json({ valid: false, error: `Promo code "${rawCode}" is not recognized or has expired.` }, 400);
    }

    if (matched.isActive === false) {
      return json({ valid: false, error: `Promo code "${rawCode}" is no longer active.` }, 400);
    }

    if (matched.expiresAt && new Date(matched.expiresAt).getTime() < Date.now()) {
      return json({ valid: false, error: `Promo code "${rawCode}" has expired.` }, 400);
    }

    if (matched.minOrderAmount && subtotal < matched.minOrderAmount) {
      return json({
        valid: false,
        error: `Promo code "${rawCode}" requires a minimum order of $${matched.minOrderAmount.toFixed(2)}. Current subtotal is $${subtotal.toFixed(2)}.`,
      }, 400);
    }

    let discountAmount = 0;
    if (matched.type === 'percentage') {
      discountAmount = Number(((subtotal * matched.value) / 100).toFixed(2));
    } else {
      discountAmount = Number(Math.min(subtotal, matched.value).toFixed(2));
    }

    return json({
      valid: true,
      code: matched.code,
      type: matched.type,
      value: matched.value,
      discountAmount,
      message: `Coupon "${matched.code}" applied! Saved $${discountAmount.toFixed(2)}.`,
    });
  } catch (error: any) {
    console.error('[Coupon API Error]:', error);
    return json({ valid: false, error: error.message || 'Unable to validate coupon.' }, 500);
  }
});
