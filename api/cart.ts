import {
  ApiError,
  assertSameOrigin,
  cleanString,
  errorResponse,
  json,
  readJson,
  requireSessionToken,
  shopifyFetch,
} from '../server/shopify.js';

type CartBody = { cartId?: unknown };

export default {
  async fetch(request: Request) {
    try {
      if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, { Allow: 'POST' });
      assertSameOrigin(request);
      const customerAccessToken = requireSessionToken(request);
      const body = await readJson<CartBody>(request);
      const cartId = cleanString(body.cartId, 'Cart identifier', 500);
      if (!cartId.startsWith('gid://shopify/Cart/')) throw new ApiError(400, 'The cart identifier is invalid.');

      const query = `
        mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
          cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
            cart {
              id
              checkoutUrl
              lines(first: 100) {
                edges {
                  node {
                    id
                    quantity
                    merchandise {
                      ... on ProductVariant {
                        id
                        title
                        price { amount currencyCode }
                        image { url }
                        product { id title vendor handle }
                      }
                    }
                  }
                }
              }
            }
            userErrors { code field message }
          }
        }
      `;
      const data = await shopifyFetch<any>(query, {
        cartId,
        buyerIdentity: { customerAccessToken },
      });
      const payload = data.cartBuyerIdentityUpdate;
      const message = payload?.userErrors?.find((error: any) => error.message)?.message;
      if (message) throw new ApiError(400, message);
      if (!payload?.cart?.checkoutUrl) throw new ApiError(502, 'Shopify did not return a secure checkout link.');
      return json({ cart: payload.cart });
    } catch (error) {
      return errorResponse(error);
    }
  },
};
