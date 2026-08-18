import { Product } from '../types';

const STORAGE_KEY = 'baemeds_recently_viewed';
const MAX_PRODUCTS = 8;

export const getRecentlyViewedProducts = (): Product[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const products = JSON.parse(stored);
    if (!Array.isArray(products)) return [];
    return products.filter((product) => product?.id && product?.handle && product?.title).slice(0, MAX_PRODUCTS);
  } catch {
    return [];
  }
};

export const rememberRecentlyViewedProduct = (product: Product) => {
  try {
    const products = getRecentlyViewedProducts().filter((item) => item.id !== product.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([product, ...products].slice(0, MAX_PRODUCTS)));
  } catch {
    // Browsing still works when local storage is disabled or full.
  }
};
