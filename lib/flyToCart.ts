/**
 * Fires a "fly to cart" animation from a source element (usually a product
 * image or the add-to-cart button) toward the header cart icon. Implemented as
 * a decoupled custom event so any page can trigger it and the Header owns the
 * actual puck animation and badge bump. No-ops under reduced motion.
 */
export const FLY_TO_CART_EVENT = 'baemeds:fly-to-cart';

export interface FlyToCartDetail {
  x: number;
  y: number;
  width: number;
  height: number;
  image?: string;
}

export function flyToCart(source: HTMLElement | null, image?: string): void {
  if (typeof window === 'undefined' || !source) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const rect = source.getBoundingClientRect();
  const detail: FlyToCartDetail = {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
    image,
  };
  window.dispatchEvent(new CustomEvent<FlyToCartDetail>(FLY_TO_CART_EVENT, { detail }));
}
