/**
 * BaeMeds First-Party Native Commerce Library
 * Replaces Shopify Storefront API with native database/catalog services.
 * Preserves 100% of existing functional contracts and signatures for zero-UI-breakage.
 */

import { Product, CartItem } from '../types';
import rawCatalog from '../data/catalog_seed.json';
import { supabase } from './supabase';

// Local memory cache for instant sub-millisecond retrieval with fallback
let catalogCache: Product[] = (rawCatalog as unknown as Product[]) || [];
let isHydratedFromSupabase = false;
let hydrationPromise: Promise<Product[]> | null = null;

export const mapDbProductToProduct = (d: any): Product => {
  const vendorFromFeatures = Array.isArray(d.features)
    ? d.features.find((f: any) => typeof f === 'string' && f.startsWith('Manufacturer: '))?.replace('Manufacturer: ', '')
    : undefined;
  const seedItem = (rawCatalog as any[]).find((p) => p.id === d.id);
  const resolvedVariants = (Array.isArray(d.variants) && d.variants.length > 0)
    ? d.variants
    : (seedItem && Array.isArray(seedItem.variants) && seedItem.variants.length > 0)
    ? seedItem.variants
    : undefined;

  const eaVariant = resolvedVariants?.find((v: any) =>
    /ea|single|unit|each/i.test(v.title || '') ||
    /ea|single|unit|each/i.test(v.size || '') ||
    (v.packageQuantity && /1\s*(unit|ea|each)/i.test(v.packageQuantity))
  );
  const primaryPrice = eaVariant ? Number(eaVariant.price) : Number(d.price);
  const primaryCompareAt = eaVariant?.compareAtPrice ? Number(eaVariant.compareAtPrice) : (d.compare_at_price ? Number(d.compare_at_price) : undefined);

  return {
    id: d.id,
    title: d.title,
    handle: d.handle,
    description: d.description || '',
    category: d.category,
    price: primaryPrice,
    compareAtPrice: primaryCompareAt,
    image: d.featured_image || 'https://placehold.co/600x600?text=DME',
    images: Array.isArray(d.images) && d.images.length > 0 ? d.images : [d.featured_image || 'https://placehold.co/600x600?text=DME'],
    specs: d.specs || '',
    warranty: d.warranty || '1 Year Standard Manufacturer Warranty',
    isRentalAvailable: Boolean(d.is_rental_available),
    prescriptionRequired: Boolean(d.prescription_required),
    hcpcsCode: d.hcpcs_code || undefined,
    fdaClassification: d.fda_classification || undefined,
    isRegulatoryVerified: Boolean(d.is_regulatory_verified),
    wholesaleCost: d.wholesale_cost ? Number(d.wholesale_cost) : undefined,
    costPerItem: d.wholesale_cost ? Number(d.wholesale_cost) : undefined,
    sku: d.sku || undefined,
    barcode: d.barcode || undefined,
    mckessonItemNumber: d.mckesson_item_number || undefined,
    inventoryQuantity: d.inventory_quantity !== undefined ? Number(d.inventory_quantity) : 25,
    trackInventory: Boolean(d.track_inventory ?? true),
    isHeroProduct: Boolean(d.is_hero_product),
    heroRank: d.hero_rank ? Number(d.hero_rank) : (d.heroRank ? Number(d.heroRank) : undefined),
    features: Array.isArray(d.features) ? d.features : [],
    seoTitle: d.seo_title || undefined,
    seoDescription: d.seo_description || undefined,
    vendor: d.vendor || vendorFromFeatures || 'BaeMeds USA',
    tags: Array.isArray(d.tags) ? d.tags : ['DME', 'Healthcare'],
    inStock: (d.inventory_quantity ?? 25) > 0,
    variantId: d.variant_id || d.variantId || `var-${d.id}`,
    requiresPrescription: Boolean(d.prescription_required),
    variants: resolvedVariants,
  };
};

export const hydrateCatalogFromSupabase = async (): Promise<Product[]> => {
  if (catalogCache.length >= 3000) return catalogCache;
  if (isHydratedFromSupabase) return catalogCache;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    try {
      let allRows: any[] = [];
      let from = 0;
      const step = 1000;

      while (true) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('is_hero_product', { ascending: false })
          .order('updated_at', { ascending: false })
          .range(from, from + step - 1);

        if (error || !data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < step) break;
        from += step;
      }

      if (allRows.length > 0) {
        catalogCache = allRows.map(mapDbProductToProduct);
        isHydratedFromSupabase = true;
      }
    } catch (e) {
      console.warn('Catalog hydration fallback to local catalog_seed:', e);
    }
    return catalogCache;
  })();

  return hydrationPromise;
};

// Trigger background hydration immediately on module load
if (typeof window !== 'undefined') {
  hydrateCatalogFromSupabase().catch(() => {});
}

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Oxygen Concentrators": ["oxygen concentrator", "oxygen concentrators", "concentrator", "concentrators", "oxygen generator", "portable oxygen concentrator", "portable concentrator", "5 liter concentrators", "10 liter concentrators", "respiratory therapy", "oxygen therapy"],
  "BiPAP Machines": ["bipap", "bipap machines", "bi-level", "bilevel", "vpap", "lumis"],
  "CPAP Machines": ["cpap", "cpap machines", "auto cpap", "sleep apnea", "airsense", "resmart"],
  "CPAP Masks & Accessories": ["cpap mask", "cpap masks", "mask components", "cpap headgear", "nasal mask", "full face mask", "nasal pillow", "cpap tubing", "cpap filter", "cpap filters", "masks and accessories", "masks & accessories"],
  "Patient Monitors": ["patient monitor", "patient monitors", "patient monitoring", "multipara monitor", "vital signs monitor", "pulse oximeter", "pulse oximeters", "chair scale", "wheelchair scale"],
  "ECG Machines": ["ecg", "ekg", "electrocardiogram", "cardiograph"],
  "Blood Pressure Monitors": ["bp", "bp monitor", "blood pressure", "blood pressure monitors", "sphygmomanometer", "hypertension"],
  "Glucometers": ["glucometer", "glucometers", "glucose", "blood sugar", "diabetes", "accu-chek", "cgm"],
  "Nebulizers": ["nebulizer", "nebulizers", "compressor nebulizer", "mesh", "inhaler", "omron"],
  "Suction Machines": ["suction", "suction machine", "suction machines", "aspirator", "vacuum", "phlegm"],
  "Syringe Pumps": ["syringe pump", "syringe pumps", "infusion pump", "perfusor"],
  "Defibrillators": ["defibrillator", "defibrillators", "aed", "shock"],
  "Sterilizers": ["sterilizer", "sterilizers", "autoclave", "disinfection"],
  "Thermometers": ["thermometer", "thermometers", "infrared thermometer", "temperature gun"],
  "Hospital Furniture": ["hospital bed", "hospital beds", "hospital beds and furnishings", "hospital beds & furnishings", "medical bed", "fowler bed", "overbed table", "overbed tables", "examination table", "hospital trolley", "stretcher", "trapeze", "patient lift"],
  "Wheelchairs": ["wheelchair", "wheelchairs", "transport chair", "transport chairs", "manual wheelchair", "bariatric wheelchair"],
  "Walkers & Rollators": ["walker", "walkers", "rollator", "rollators", "crutch", "crutches", "cane", "canes", "quad cane"],
  "Wheelchair Parts & Accessories": ["wheelchair cushion", "wheelchair parts", "wheelchair accessories", "caster", "legrest", "footrest", "anti-tipper", "armrest pad", "wheelchair tire"],
  "Commodes & Bath Safety": ["commode", "commodes", "commode chair", "shower chair", "bath bench", "transfer bench", "bath safety"],
  "Orthopedic Supports": ["orthopedic", "orthopaedic", "knee support", "back support", "cervical collar", "brace", "splint"],
  "Breast Pumps": ["breast pump", "breast pumps", "breastpump", "lactation", "maternity", "medela", "ameda", "spectra"],
  "Incontinence & Care": ["incontinence", "incontinence & care", "briefs", "underwear", "adult brief", "diaper", "underpad", "chux"]
};

export const normalizeCategoryKey = (value: string): string =>
  (value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

export const resolveCategoryName = (categoryOrSlug: string): string => {
  if (!categoryOrSlug) return '';
  const cleanInput = normalizeCategoryKey(categoryOrSlug);

  // 1. Direct exact canonical match across all defined categories
  for (const canonicalName of Object.keys(CATEGORY_KEYWORDS)) {
    if (normalizeCategoryKey(canonicalName) === cleanInput) {
      return canonicalName;
    }
  }

  // 2. Exact keyword match
  for (const [canonicalName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => normalizeCategoryKey(kw) === cleanInput)) {
      return canonicalName;
    }
  }

  // 3. Substring keyword match (prioritize longer/more specific subcategories first)
  const sortedEntries = Object.entries(CATEGORY_KEYWORDS).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [canonicalName, keywords] of sortedEntries) {
    if (keywords.some((kw) => {
      const normKw = normalizeCategoryKey(kw);
      return cleanInput.includes(normKw) || normKw.includes(cleanInput);
    })) {
      return canonicalName;
    }
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
  await hydrateCatalogFromSupabase();
  return [...catalogCache];
};

export const fetchHeroProducts = async (): Promise<Product[]> => {
  await hydrateCatalogFromSupabase();
  return catalogCache.filter((p) => p.isHeroProduct);
};

export const fetchProductById = async (id: string): Promise<Product | undefined> => {
  await hydrateCatalogFromSupabase();
  return catalogCache.find(
    (p) =>
      p.id === id ||
      p.variantId === id ||
      p.variants?.some((v: any) => v.id === id || v.originalProductId === id)
  );
};

export const fetchProductByHandle = async (handle: string): Promise<Product | undefined> => {
  await hydrateCatalogFromSupabase();
  const cleanHandle = cleanCatalogueText(handle).toLowerCase().trim();
  
  // 1. Direct match on handle or ID
  let product = catalogCache.find(
    (p) =>
      p.handle.toLowerCase() === cleanHandle ||
      p.id === handle ||
      p.id.endsWith(`/${handle}`) ||
      p.handle.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanHandle.replace(/[^a-z0-9]/g, '')
  );

  // 2. Fallback: Check if handle corresponds to a specific child variant
  if (!product) {
    product = catalogCache.find((p) =>
      p.variants?.some(
        (v: any) =>
          v.id === handle ||
          v.originalProductId === handle ||
          v.handle?.toLowerCase() === cleanHandle
      )
    );
    if (product) {
      const targetVariant = product.variants?.find(
        (v: any) =>
          v.id === handle ||
          v.originalProductId === handle ||
          v.handle?.toLowerCase() === cleanHandle
      );
      if (targetVariant) {
        return {
          ...product,
          selectedVariantId: targetVariant.id,
        };
      }
    }
  }

  // 3. Database fallback
  if (!product) {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`handle.eq.${cleanHandle},id.eq.${handle}`)
        .limit(1);
      if (data && data[0]) product = mapDbProductToProduct(data[0]);
    } catch {}
  }

  return product;
};

export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  await hydrateCatalogFromSupabase();
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
  await hydrateCatalogFromSupabase();
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
// STOREFRONT 50-BY-50 PAGINATED CATALOG API
// ==========================================

export interface FetchStorefrontProductsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  brands?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  showOutOfStock?: boolean;
  sortBy?: 'availability' | 'price-asc' | 'price-desc' | 'name-asc';
}

export interface StorefrontProductsResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const fetchTotalProductCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    if (!error && typeof count === 'number') {
      return count;
    }
  } catch (err) {
    console.warn('Unable to get exact product count from Supabase:', err);
  }
  return (rawCatalog as unknown as Product[]).length;
};

export const getCatalogCategoryCounts = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const p of rawCatalog as unknown as Product[]) {
    if (p.category) {
      const canonical = resolveCategoryName(p.category);
      counts[canonical] = (counts[canonical] || 0) + 1;
      if (canonical !== p.category) {
        counts[p.category] = (counts[canonical] || 0);
      }
    }
  }
  return counts;
};

export const getCatalogBrandCounts = (): Array<[string, number]> => {
  const counts = new Map<string, number>();
  for (const p of rawCatalog as unknown as Product[]) {
    if (p.vendor) {
      counts.set(p.vendor, (counts.get(p.vendor) || 0) + 1);
    }
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
};

const filterRawCatalogFallback = (params: FetchStorefrontProductsParams): StorefrontProductsResult => {
  let list = [...(rawCatalog as unknown as Product[])];

  if (params.category) {
    const canonical = resolveCategoryName(params.category);
    list = list.filter((p) => {
      const pCanon = resolveCategoryName(p.category);
      return pCanon === canonical || p.category.toLowerCase().includes(params.category!.toLowerCase());
    });
  }

  if (params.brands && params.brands.length > 0) {
    list = list.filter((p) => params.brands!.includes(p.vendor));
  }

  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    list = list.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  const minPrice = params.minPrice !== undefined && params.minPrice > 0 ? params.minPrice : 0;
  const maxPrice = params.maxPrice !== undefined && params.maxPrice < Infinity ? params.maxPrice : Infinity;
  list = list.filter((p) => p.price >= minPrice && p.price <= maxPrice);

  if (params.showOutOfStock === false) {
    list = list.filter((p) => p.inStock);
  }

  const sortBy = params.sortBy || 'availability';
  list.sort((a, b) => {
    if (sortBy === 'availability') {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      const aHero = a.isHeroProduct ? 1 : 0;
      const bHero = b.isHeroProduct ? 1 : 0;
      if (aHero !== bHero) return bHero - aHero;
      if (a.isHeroProduct && b.isHeroProduct) {
        const aRank = a.heroRank || 9999;
        const bRank = b.heroRank || 9999;
        if (aRank !== bRank) return aRank - bRank;
      }
      const aIsPart = /filter|tubing|connector|adapter|wrench|bracket|screw|clip|cuff|hose|bulb|valve|strap|strip|lancet/i.test(a.title) && a.price < 45;
      const bIsPart = /filter|tubing|connector|adapter|wrench|bracket|screw|clip|cuff|hose|bulb|valve|strap|strip|lancet/i.test(b.title) && b.price < 45;
      if (aIsPart !== bIsPart) return aIsPart ? 1 : -1;
    }
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name-asc') return a.title.localeCompare(b.title);
    return 0;
  });

  const total = list.length;
  const page = Math.max(1, params.page || 1);
  const pageSize = params.pageSize || 50;
  const start = (page - 1) * pageSize;
  const products = list.slice(start, start + pageSize);

  return {
    products,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const fetchStorefrontProducts = async (
  params: FetchStorefrontProductsParams = {}
): Promise<StorefrontProductsResult> => {
  const page = Math.max(1, params.page || 1);
  const pageSize = params.pageSize || 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (params.category) {
      const canonicalCategory = resolveCategoryName(params.category);
      query = query.eq('category', canonicalCategory);
    }

    if (params.brands && params.brands.length > 0) {
      if (params.brands.length === 1) {
        query = query.contains('features', [`Manufacturer: ${params.brands[0]}`]);
      } else {
        const brandClauses = params.brands.map((b) => `features.cs.{"Manufacturer: ${b}"}`).join(',');
        query = query.or(brandClauses);
      }
    }

    if (params.search && params.search.trim()) {
      const cleanSearch = params.search.trim().replace(/[%_]/g, '');
      if (cleanSearch) {
        query = query.or(`title.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%`);
      }
    }

    if (params.minPrice !== undefined && params.minPrice > 0) {
      query = query.gte('price', params.minPrice);
    }
    if (params.maxPrice !== undefined && params.maxPrice < Infinity) {
      query = query.lte('price', params.maxPrice);
    }

    if (params.showOutOfStock === false) {
      query = query.gt('inventory_quantity', 0);
    }

    const sortBy = params.sortBy || 'availability';
    if (sortBy === 'price-asc') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else if (sortBy === 'name-asc') {
      query = query.order('title', { ascending: true });
    } else {
      query = query
        .order('is_hero_product', { ascending: false })
        .order('updated_at', { ascending: false })
        .order('inventory_quantity', { ascending: false });
    }

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      const products = data.map(mapDbProductToProduct);
      const total = typeof count === 'number' ? count : products.length;
      return {
        products,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } else if (error) {
      console.warn('Supabase storefront range query failed, falling back to local catalog:', error);
    }
  } catch (err) {
    console.warn('Error during storefront products retrieval:', err);
  }

  return filterRawCatalogFallback(params);
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
    const product = catalogCache.find((p) => {
      if (p.id === item.merchandiseId || p.variantId === item.merchandiseId || p.handle === item.merchandiseId) return true;
      if (item.merchandiseId?.startsWith('var-')) {
        const stripped = item.merchandiseId.replace(/^var-/, '');
        if (p.id === stripped || p.id === `prd-${stripped}` || p.variantId === item.merchandiseId) return true;
      }
      return false;
    });
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

      // Direct category match using canonical resolver
      const currentCanonical = resolveCategoryName(currentProduct.category || '');
      const itemCanonical = resolveCategoryName(item.category || '');
      if (itemCanonical && itemCanonical === currentCanonical) score += 15;
      else if (itemCat && itemCat === currentCategory) score += 10;

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


