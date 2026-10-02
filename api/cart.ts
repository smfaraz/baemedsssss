import {
  ApiError,
  assertSameOrigin,
  cleanString,
  errorResponse,
  json,
  readJson,
  requireSessionToken,
} from '../server/commerce.js';

type CartBody = { cartId?: unknown };

import { createVercelHandler } from '../server/serverlessAdapter.js';

export default createVercelHandler(async (request: Request) => {
  try {
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
    assertSameOrigin(request);
    const sessionToken = requireSessionToken(request);
    const body = await readJson<CartBody>(request);
    const cartId = cleanString(body.cartId, 'Cart identifier', 500);
    if (!cartId) throw new ApiError(400, 'The cart identifier is invalid.');

    return json({
      cart: {
        id: cartId,
        checkoutUrl: '/checkout',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
});
