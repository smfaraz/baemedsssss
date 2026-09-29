/**
 * BaeMeds First-Party Native Commerce Library
 * Replaces Shopify Storefront API with native database/catalog services.
 * Preserves 100% of existing functional contracts and signatures for zero-UI-breakage.
 */

import { Product, CartItem } from '../types';
import rawCatalog from '../data/catalog_seed.json';

// Local memory cache for instant sub-millisecond retrieval
let catalogCache: Product[] = (rawCatalog as unknown as Product[]) || [];

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Oxygen Concentrator": ["oxygen concentrator", "concentrator", "oxygen generator", "evox oxygen", "oxy med"],
  "BiPAP": ["bipap", "bi-level", "bilevel", "vpap", "lumis"],
  "CPAP": ["cpap", "auto cpap", "sleep apnea", "airsense", "resmart"],
  "Patient Monitor": ["patient monitor", "multipara monitor", "vital signs monitor", "pulse oximeter"],
  "ECG Machine": ["ecg", "ekg", "electrocardiogram", "cardiograph"],
  "BP Monitor": ["bp", "blood pressure", "sphygmomanometer", "hypertension"],
  "Glucometer": ["glucometer", "glucose", "blood sugar", "diabetes", "accu-chek"],
  "Nebulizer": ["nebulizer", "compressor", "mesh", "inhaler", "omron"],
  "Suction Machine": ["suction", "aspirator", "vacuum", "phlegm"],
  "Syringe Pump": ["syringe pump", "infusion pump", "perfusor"],
  "Defibrillator": ["defibrillator", "aed", "shock"],
  "Sterilizer": ["sterilizer", "autoclave", "disinfection"],
  "Thermometer": ["thermometer", "infrared thermometer", "temperature gun"],
  "Hospital Furniture": ["hospital bed", "medical bed", "fowler bed", "hospital mattress", "overbed table", "examination table", "hospital trolley", "stretcher"],
  "Wheelchair": ["wheelchair", "karma", "walker", "commode"],
  "Orthopedic": ["orthopedic", "orthopaedic", "knee support", "back support", "cervical collar", "brace", "splint"],
  "Masks & Accessories": ["cpap mask", "bipap mask", "oxygen mask", "nasal mask", "full face mask", "oxygen cannula", "cpap tubing"]
};

export const normalizeCategoryKey = (value: string): string =>
  (value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

export const resolveCategoryName = (categoryOrSlug: string): string => {
  const cleanInput = normalizeCategoryKey(categoryOrSlug);
  for (const [canonicalName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (normalizeCategoryKey(canonicalName) === cleanInput) return canonicalName;
    if (keywords.some((kw) => normalizeCategoryKey(kw) === cleanInput)) return canonicalName;
  }
  return categoryOrSlug;
};

export const replaceMojibake = (value: string): string => (value || '')
  .replace(/\u00e2\u201a\u00b9/g, '$')
  .replace(/\u20b9/g, '$')
  .replace(/\u00e2\u0153\u201c/g, '')
  .replace(/\u00e2\u20ac\u2122/g, '’')
  .replace(/\u00e2\u20ac\u0153/g, '“')
  .replace(/\u00e2\u20ac\u009d/g, '”')
  .replace(/\u00e2\u20ac\u201c/g, '–')
  .replace(/\u00e2\u20ac\u201d/g, '—')
  .replace(/\u00c3\u201a/g, '')
  .replace(/\u00c2/g, '');

export const cleanCatalogueText = (value: unknown): string => replaceMojibake(String(value || ''))
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

export const stripHtml = (value: unknown): string => cleanCatalogueText(
  String(value || '').replace(/<[^>]*>/g, ' ')
);

// ==========================================
// CATALOG QUERY FUNCTIONS
// ==========================================

export const fetchAllProducts = async (): Promise<Product[]> => {
  return [...catalogCache];
};

export const fetchProductById = async (id: string): Promise<Product | undefined> => {
  return catalogCache.find((p) => p.id === id || p.variantId === id);
};

export const fetchProductByHandle = async (handle: string): Promise<Product | undefined> => {
  const cleanHandle = cleanCatalogueText(handle).toLowerCase().trim();
  return catalogCache.find(
    (p) =>
      p.handle.toLowerCase() === cleanHandle ||
      p.id === handle ||
      p.id.endsWith(`/${handle}`) ||
      p.handle.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanHandle.replace(/[^a-z0-9]/g, '')
  );
};

export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  if (!category || category.toLowerCase() === 'all') return fetchAllProducts();
  const canonicalCategory = resolveCategoryName(category);
  const normalizedRequest = normalizeCategoryKey(canonicalCategory || category);

  return catalogCache.filter((product) => {
    const productCanonical = resolveCategoryName(product.category);
    const normalizedProductCategory = normalizeCategoryKey(productCanonical || product.category);
    return normalizedProductCategory === normalizedRequest;
  });
};

const normalizeSearchValue = (value: unknown): string => stripHtml(value)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const searchProducts = async (query: string): Promise<Product[]> => {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return [];

  const terms = normalizedQuery.split(' ').filter(Boolean);

  return catalogCache
    .map((product) => {
      const searchBlob = [
        product.title,
        product.handle,
        product.vendor,
        product.category,
        (product.tags || []).join(' '),
        product.description,
        product.specs,
      ].map(normalizeSearchValue).join(' ');

      let score = 0;
      if (normalizeSearchValue(product.title) === normalizedQuery) score += 1000;
      else if (normalizeSearchValue(product.title).includes(normalizedQuery)) score += 500;
      if (normalizeSearchValue(product.category).includes(normalizedQuery)) score += 300;

      const matchingTerms = terms.filter((t) => searchBlob.includes(t));
      score += matchingTerms.length * 50;

      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product);
};

// ==========================================
// NATIVE CART ENGINE & LOCAL STORAGE
// ==========================================

export interface NativeCart {
  id: string;
  checkoutUrl: string;
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        merchandise: {
          id: string;
          title: string;
          price: { amount: string; currencyCode: string };
          image: { url: string };
          product: { id: string; handle: string; title: string; vendor: string };
        };
      };
    }>;
  };
  cost: {
    totalAmount: { amount: string; currencyCode: string };
    subtotalAmount: { amount: string; currencyCode: string };
  };
}

const getStoredCartItems = (cartId: string): Array<{ id: string; merchandiseId: string; quantity: number }> => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`baemeds_cart_${cartId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setStoredCartItems = (cartId: string, items: Array<{ id: string; merchandiseId: string; quantity: number }>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`baemeds_cart_${cartId}`, JSON.stringify(items));
  } catch {}
};

export const formatCartResponse = (cartId: string): NativeCart => {
  const storedItems = getStoredCartItems(cartId);

  let subtotal = 0;
  const edges = storedItems.map((item) => {
    const product = catalogCache.find((p) => p.id === item.merchandiseId || p.variantId === item.merchandiseId);
    const price = product ? product.price : 0;
    subtotal += price * item.quantity;

    return {
      node: {
        id: item.id,
        quantity: item.quantity,
        merchandise: {
          id: item.merchandiseId,
          title: 'Standard',
          price: { amount: price.toFixed(2), currencyCode: 'USD' },
          image: { url: product?.image || '' },
          product: {
            id: product?.id || item.merchandiseId,
            handle: product?.handle || '',
            title: product?.title || 'Medical Supply',
            vendor: product?.vendor || 'BaeMeds',
          },
        },
      },
    };
  });

  return {
    id: cartId,
    checkoutUrl: '/checkout',
    lines: { edges },
    cost: {
      subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: 'USD' },
      totalAmount: { amount: subtotal.toFixed(2), currencyCode: 'USD' },
    },
  };
};

export const createShopifyCart = async (): Promise<{ id: string; checkoutUrl: string }> => {
  const cartId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem('shopify_cart_id', cartId);
    localStorage.setItem('cartId', cartId);
  }
  return { id: cartId, checkoutUrl: '/checkout' };
};

export const fetchShopifyCart = async (cartId: string): Promise<NativeCart> => {
  return formatCartResponse(cartId);
};

export const addItemToCart = async (
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>
): Promise<NativeCart> => {
  const items = getStoredCartItems(cartId);

  for (const line of lines) {
    const existing = items.find((i) => i.merchandiseId === line.merchandiseId);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      items.push({
        id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        merchandiseId: line.merchandiseId,
        quantity: line.quantity,
      });
    }
  }

  setStoredCartItems(cartId, items);
  return formatCartResponse(cartId);
};

export const updateLineItemInCart = async (
  cartId: string,
  lines: Array<{ id: string; quantity: number }>
): Promise<NativeCart> => {
  let items = getStoredCartItems(cartId);

  for (const line of lines) {
    if (line.quantity <= 0) {
      items = items.filter((i) => i.id !== line.id);
    } else {
      const existing = items.find((i) => i.id === line.id);
      if (existing) existing.quantity = line.quantity;
    }
  }

  setStoredCartItems(cartId, items);
  return formatCartResponse(cartId);
};

export const removeLineItemFromCart = async (
  cartId: string,
  lineIds: string[]
): Promise<NativeCart> => {
  const idSet = new Set(lineIds);
  const items = getStoredCartItems(cartId).filter((i) => !idSet.has(i.id));
  setStoredCartItems(cartId, items);
  return formatCartResponse(cartId);
};

export const attachCustomerToCart = async (cartId: string): Promise<NativeCart> => {
  return formatCartResponse(cartId);
};

export const isRentalAvailable = (_product?: Product): boolean => {
  // Rental is not offered in the US market (direct purchase / DME billing only)
  return false;
};


export const extractYoutubeVideos = (html = ''): string[] => {
  const videoIds = new Set<string>();
  const iframeSrcRegex = /src=["'](?:https?:)?\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/g;
  let match;
  while ((match = iframeSrcRegex.exec(html)) !== null) {
    if (match[1]) videoIds.add(match[1]);
  }
  const watchRegex = /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/g;
  while ((match = watchRegex.exec(html)) !== null) {
    if (match[1]) videoIds.add(match[1]);
  }
  return Array.from(videoIds);
};

export const fetchRecommendedProducts = async (currentProduct: Product, limit: number = 4): Promise<Product[]> => {
  const currentId = currentProduct.id;
  const currentCategory = (currentProduct.category || '').toLowerCase();
  const currentVendor = (currentProduct.vendor || '').toLowerCase();

  try {
    const all = await fetchAllProducts();
    const pool = all.filter((p) => p.id !== currentId);

    const scored = pool.map((item) => {
      let score = 0;
      const itemCat = (item.category || '').toLowerCase();
      const itemVendor = (item.vendor || '').toLowerCase();

      // Direct category match
      if (itemCat && itemCat === currentCategory) score += 10;

      // Clinical cross-relevance
      if (currentCategory.includes('oxygen') || currentCategory.includes('respiratory')) {
        if (itemCat.includes('oxygen') || itemCat.includes('nebulizer') || itemCat.includes('bipap') || item.title.toLowerCase().includes('oximeter') || item.title.toLowerCase().includes('concentrator')) score += 8;
      }
      if (currentCategory.includes('glucose') || currentCategory.includes('diabetes') || currentProduct.title.toLowerCase().includes('gluco')) {
        if (itemCat.includes('glucose') || item.title.toLowerCase().includes('strip') || item.title.toLowerCase().includes('gluco')) score += 8;
      }
      if (currentCategory.includes('sphygmomanometer') || currentCategory.includes('blood pressure') || currentCategory.includes('ecg')) {
        if (itemCat.includes('sphygmomanometer') || itemCat.includes('blood pressure') || itemCat.includes('ecg') || itemCat.includes('scale')) score += 8;
      }
      if (currentCategory.includes('knee') || currentCategory.includes('shoulder') || currentCategory.includes('brace') || currentCategory.includes('sling') || currentCategory.includes('ortho')) {
        if (itemCat.includes('knee') || itemCat.includes('shoulder') || itemCat.includes('brace') || itemCat.includes('sling') || itemCat.includes('ortho') || itemVendor.includes('tynor')) score += 8;
      }
      if (currentCategory.includes('thermometer') || currentCategory.includes('otoscope') || currentCategory.includes('ophthalmoscope')) {
        if (itemCat.includes('thermometer') || itemCat.includes('otoscope') || itemCat.includes('ophthalmoscope') || itemCat.includes('sphygmo')) score += 7;
      }

      // Vendor / Brand affinity
      if (currentVendor && itemVendor === currentVendor) score += 5;

      // In-stock preference
      if (item.inStock) score += 2;

      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.item).slice(0, limit);
  } catch (e) {
    console.error('Error computing recommended products:', e);
    return [];
  }
};

// Backwards compatibility aliases
export const client = {
  product: {
    fetchAll: fetchAllProducts,
    fetch: fetchProductById,
    fetchByHandle: fetchProductByHandle,
  },
};


