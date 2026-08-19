import Client from 'shopify-buy';
import { Product } from '../types';
import { attachCustomerSessionToCart } from './accountApi';

// ==========================================
// CONFIGURATION
// ==========================================
const SHOPIFY_DOMAIN = 'ptya1n-k0.myshopify.com'; 
const SHOPIFY_ACCESS_TOKEN = 'c1fb47a74eaec2fbafa70becac08f52b';
const API_VERSION = '2024-07';

// ==========================================
// CLIENT INITIALIZATION
// ==========================================
export const client = Client.buildClient({
  domain: SHOPIFY_DOMAIN,
  storefrontAccessToken: SHOPIFY_ACCESS_TOKEN,
  apiVersion: API_VERSION
});

// Helper for raw GraphQL queries
const shopifyFetch = async <T>(query: string, variables: any = {}): Promise<T> => {
  try {
    const endpoint = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    
    if (json.errors) {
      const errorMessage = json.errors.map((e: any) => e.message).join(', ');
      throw new Error(errorMessage);
    }
    
    return json.data;
  } catch (error) {
    throw error;
  }
};

// ==========================================
// CART WRAPPERS (Replaces Checkout API)
// ==========================================

const CART_FRAGMENT = `
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
            price {
              amount
              currencyCode
            }
            image {
              url
            }
            product {
              id
              handle
              title
              vendor
            }
          }
        }
      }
    }
  }
  cost {
    totalAmount {
      amount
      currencyCode
    }
    subtotalAmount {
      amount
      currencyCode
    }
  }
`;

export const createShopifyCart = async () => {
  const query = `
    mutation cartCreate {
      cartCreate(input: {}) {
        cart {
          id
          checkoutUrl
        }
      }
    }
  `;

  const data: any = await shopifyFetch(query);
  return data.cartCreate.cart;
};


export const fetchShopifyCart = async (cartId: string) => {
  const query = `
    query getCart($cartId: ID!) {
      cart(id: $cartId) {
        ${CART_FRAGMENT}
      }
    }
  `;
  const data: any = await shopifyFetch(query, { cartId });
  return data.cart;
};

export const attachCustomerToCart = async (cartId: string) => {
  return attachCustomerSessionToCart(cartId);
};

export const addItemToCart = async (cartId: string, lines: {merchandiseId: string, quantity: number}[]) => {
  const query = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ${CART_FRAGMENT}
        }
      }
    }
  `;
  const data: any = await shopifyFetch(query, { cartId, lines });
  return data.cartLinesAdd.cart;
};

export const updateLineItemInCart = async (cartId: string, lines: {id: string, quantity: number}[]) => {
  const query = `
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ${CART_FRAGMENT}
        }
      }
    }
  `;
  const data: any = await shopifyFetch(query, { cartId, lines });
  return data.cartLinesUpdate.cart;
};

export const removeLineItemFromCart = async (cartId: string, lineIds: string[]) => {
  const query = `
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ${CART_FRAGMENT}
        }
      }
    }
  `;
  const data: any = await shopifyFetch(query, { cartId, lineIds });
  return data.cartLinesRemove.cart;
};

// ==========================================
// DATA NORMALIZATION & AUTO-CATEGORIZATION
// ==========================================

// keys match the 'slug' or 'name' used in UI constants
const CATEGORY_KEYWORDS: Record<string, string[]> = {
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

const normalizeCategoryKey = (value: string): string =>
  (value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

const replaceMojibakeLegacy = (value: string): string => (value || '')
  .replace(/\u00e2\u201a\u00b9/g, '\u20b9')
  .replace(/\u00e2\u0153\u201c/g, '')
  .replace(/\u00e2\u20ac\u2122/g, 'â€™')
  .replace(/\u00e2\u20ac\u0153/g, 'â€œ')
  .replace(/\u00e2\u20ac\u009d/g, 'â€ ')
  .replace(/\u00e2\u20ac\u201c/g, 'â€“')
  .replace(/\u00e2\u20ac\u201d/g, 'â€”')
  .replace(/\u00c3\u201a/g, '')
  .replace(/\u00c2/g, '');

const replaceMojibake = (value: string): string => (value || '')
  .replace(/\u00e2\u201a\u00b9/g, '\u20b9')
  .replace(/\u00e2\u20ac\u2122/g, '\u2019')
  .replace(/\u00e2\u20ac\u0153/g, '\u201c')
  .replace(/\u00e2\u20ac\u009d/g, '\u201d')
  .replace(/\u00e2\u20ac\u201c/g, '\u2013')
  .replace(/\u00e2\u20ac\u201d/g, '\u2014')
  .replace(/\u00c3\u201a/g, '')
  .replace(/\u00c2/g, '');

const cleanCatalogueText = (value: unknown): string => replaceMojibake(String(value || ''))
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

const stripHtml = (value: unknown): string => cleanCatalogueText(
  String(value || '').replace(/<[^>]*>/g, ' ')
);

const CATEGORY_ALIASES: Record<string, string[]> = {
  "Oxygen Concentrator": ["oxygenconcentrator", "oxygenconcentrators", "oxygen", "concentrator", "generator", "oxy", "oc"],
  "BiPAP": ["bipap", "bipapmachine", "bipapmachines", "bilevel", "bi-level", "vpap"],
  "CPAP": ["cpap", "cpapmachine", "cpapmachines", "autocpap", "apnea", "sleep apnea", "resmart"],
  "Patient Monitor": ["patientmonitor", "patientmonitors", "monitor", "multiparamonitor", "multipara", "vital signs"],
  "ECG Machine": ["ecg", "ekg", "electrocardiogram", "ecgmachines"],
  "BP Monitor": ["bpmonitor", "bloodpressuremonitor", "bp", "bloodpressure"],
  "Glucometer": ["glucometer", "glucosemonitor", "bloodsugar"],
  "Nebulizer": ["nebulizer", "nebulizers", "nebuliser", "nebulizar"],
  "Suction Machine": ["suctionmachine", "suctionmachines", "aspirator", "vacuum"],
  "Syringe Pump": ["syringepump", "infusionpump"],
  "Defibrillator": ["defibrillator", "aed"],
  "Sterilizer": ["sterilizer", "autoclave"],
  "Thermometer": ["thermometer", "thermometers"],
  "Hospital Furniture": ["hospitalfurniture", "hospitalbed", "hospitalbeds", "bed", "fowler", "medical bed"],
  "Wheelchair": ["wheelchair", "wheelchairs", "wheel chair", "walker", "mobility"],
  "Orthopedic": ["orthopedic", "ortho", "support", "brace"],
  "Masks & Accessories": ["masksandaccessories", "mask", "masks", "cpapmask", "bipapmask", "tubing", "cannula"]
};

const SYNONYMS: Record<string, string[]> = {
  "oxygen": ["concentrator", "generator", "oxy", "oc"],
  "bipap": ["bi-level", "vpap", "bilevel"],
  "cpap": ["apnea", "sleep apnea", "resmart"],
  "monitor": ["multipara", "vital signs", "ecg"],
  "wheelchair": ["wheel chair", "walker", "mobility"],
  "bed": ["hospital bed", "fowler", "medical bed"],
  "concentrator": ["concentralor", "concentrater", "concenrator"],
  "nebulizer": ["nebuliser", "nebulizar"],
  "stethoscope": ["stethascope", "stethscope"],
};

const expandSearchTerms = (query: string): string[] => {
  const terms = cleanCatalogueText(query).toLowerCase().split(/\s+/).filter(Boolean);
  const expandedTerms = new Set<string>(terms);

  terms.forEach(term => {
    for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
      if (canonical === term || synonyms.some(synonym => normalizeCategoryKey(synonym) === normalizeCategoryKey(term))) {
        expandedTerms.add(canonical);
        synonyms.forEach(synonym => expandedTerms.add(synonym));
      }
    }

    for (const [cat, aliases] of Object.entries(CATEGORY_ALIASES)) {
      const normalizedTerm = normalizeCategoryKey(term);
      if (normalizeCategoryKey(cat) === normalizedTerm || aliases.some(alias => normalizeCategoryKey(alias) === normalizedTerm)) {
        aliases.forEach(a => expandedTerms.add(a));
      }
    }
  });

  return Array.from(expandedTerms).map(term => cleanCatalogueText(term).toLowerCase()).filter(Boolean);
};

const getCategoryFromAliases = (rawValues: string[]): string | undefined => {
  const normalizedValues = rawValues
    .filter(Boolean)
    .map(v => normalizeCategoryKey(v));

  for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
    const normalizedAliases = [category, ...aliases].map(normalizeCategoryKey);
    if (normalizedAliases.some(alias => normalizedValues.includes(alias))) {
      return category;
    }
  }

  return undefined;
};
const resolveCategoryName = (category: string): string | undefined => {
  const normalizedCategory = normalizeCategoryKey(category);
  if (!normalizedCategory) return undefined;

  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if ([canonical, ...aliases].map(normalizeCategoryKey).includes(normalizedCategory)) return canonical;
  }

  for (const [canonical, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if ([canonical, ...keywords].map(normalizeCategoryKey).includes(normalizedCategory)) return canonical;
  }

  return undefined;
};

const inferCategory = (title: string, tags: string[], productType: string, collections: { title?: string; handle?: string }[] = []): string => {
  const collectionValues = collections.flatMap(c => [c?.title || '', c?.handle || '']);
  const fromCollections = getCategoryFromAliases(collectionValues);
  if (fromCollections) return fromCollections;

  const fromProductTypeAlias = getCategoryFromAliases([productType]);
  if (fromProductTypeAlias) return fromProductTypeAlias;

  const canonicalProductType = resolveCategoryName(productType);
  if (canonicalProductType) return canonicalProductType;

  // 2. Search keywords
  const searchString = `${title} ${productType} ${tags.join(' ')}`.toLowerCase();
  const normalizedSearchString = normalizeCategoryKey(searchString);

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => normalizedSearchString.includes(normalizeCategoryKey(keyword)))) {
      return category;
    }
  }

  // 3. Fallback logic
  if (searchString.includes("oxygen")) return "Oxygen Concentrator";
  if (searchString.includes("bipap")) return "BiPAP";
  if (searchString.includes("cpap")) return "CPAP";
  if (searchString.includes("monitor")) return "Patient Monitor";

  return productType || "General";
};

const extractWarranty = (tags: string[], description: string): string | undefined => {
  // 1. Check tags for warranty:X or lifetime warranty tags
  const warrantyTag = tags.find(tag => {
    const t = tag.toLowerCase();
    return t.startsWith('warranty:') || t === 'lifetime warranty';
  });

  if (warrantyTag) {
    if (warrantyTag.toLowerCase() === 'lifetime warranty') return "Lifetime";
    const val = warrantyTag.split(':')[1].trim();
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

  // 2. Parse description for common warranty patterns
  const descriptionLower = (description || "").toLowerCase();
  
  // Check for lifetime warranty
  if (descriptionLower.includes('lifetime warranty')) {
    const extracted = "Lifetime";
    return extracted.charAt(0).toUpperCase() + extracted.slice(1);
  }

  // Pattern 1: "X Year Warranty" or "X Month Warranty"
  const pattern1 = descriptionLower.match(/(\d+)\s*(year|month)s?\s*warranty/i);
  if (pattern1) {
    return `${pattern1[1]} ${pattern1[2]}${parseInt(pattern1[1]) > 1 ? 's' : ''}`;
  }

  // Pattern 2: "Warranty: X Years"
  const pattern2 = descriptionLower.match(/warranty[:\s]+(\d+)\s*(year|month)s?/i);
  if (pattern2) {
    return `${pattern2[1]} ${pattern2[2]}${parseInt(pattern2[1]) > 1 ? 's' : ''}`;
  }

  return undefined; // No default warranty
};

export const isRentalAvailable = (product: Product): boolean => {
  const title = (product.title || "").toLowerCase();
  const category = (product.category || "").toLowerCase();
  
  const isOxygen = title.includes('oxygen concentrator') || category.includes('oxygen concentrator');
  const isBipap = title.includes('bipap') || category.includes('bipap');
  const isCpap = title.includes('cpap') || category.includes('cpap');
  const isPortable = title.includes('portable');
  
  // Portable Oxygen Concentrators are NOT available for rental
  if (isOxygen && isPortable) return false;
  
  return isOxygen || isBipap || isCpap;
};

export const extractYoutubeVideos = (html: string = ""): string[] => {
  const videoIds = new Set<string>();
  
  // Look for embed URLs in iframe src
  const iframeSrcRegex = /src=["'](?:https?:)?\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/g;
  let match;
  while ((match = iframeSrcRegex.exec(html)) !== null) {
    if (match[1]) videoIds.add(match[1]);
  }

  // Look for any youtube watch links or youtu.be links in html
  const watchRegex = /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/g;
  while ((match = watchRegex.exec(html)) !== null) {
    if (match[1]) videoIds.add(match[1]);
  }

  return Array.from(videoIds).map(id => `https://www.youtube.com/embed/${id}`);
};

const normalizeProduct = (shopifyProduct: any): Product => {
  const node = shopifyProduct.node || shopifyProduct;
  const firstVariant = node.variants?.edges?.[0]?.node || node.variants?.[0] || {};
  
  // Extract all images
  const edges = node.images?.edges || node.images || [];
  const images = Array.from(new Set((Array.isArray(edges)
    ? edges.map((e: any) => e.node?.url || e.src || e.url)
    : [firstVariant?.image?.src || firstVariant?.image?.url])
    .filter((image): image is string => typeof image === 'string' && image.length > 0)));

  const rawDescription = node.description || "";
  const descriptionText = stripHtml(rawDescription);
  const cleanSpecs = descriptionText.length > 240
    ? `${descriptionText.slice(0, 237).trimEnd()}...`
    : descriptionText;

  const collections = (node.collections?.edges || []).map((edge: any) => ({
    title: edge?.node?.title,
    handle: edge?.node?.handle
  }));

  // Auto-Categorization (prioritize Shopify collections)
  const inferredCategory = inferCategory(
      node.title || "",
      node.tags || [],
      node.productType || "",
      collections
  );

  // Extract metafield-based rating and review count
  const ratingMeta = (node.metafields || []).find(
    (m: any) => m && (
      (m.namespace === 'reviews' && m.key === 'rating') ||
      (m.namespace === 'custom' && m.key === 'reviews_rating') ||
      (m.namespace === 'custom' && m.key === 'product_rating')
    )
  );
  const countMeta = (node.metafields || []).find(
    (m: any) => m && (
      (m.namespace === 'reviews' && m.key === 'rating_count') ||
      (m.namespace === 'custom' && m.key === 'reviews_count')
    )
  );

  let ratingVal: number | undefined;
  if (ratingMeta && ratingMeta.value) {
    try {
      const parsed = JSON.parse(ratingMeta.value);
      const val = parseFloat(parsed.value || parsed);
      if (!isNaN(val) && val >= 1 && val <= 5) ratingVal = val;
    } catch {
      const val = parseFloat(ratingMeta.value);
      if (!isNaN(val) && val >= 1 && val <= 5) ratingVal = val;
    }
  }

  let countVal: number | undefined;
  if (countMeta && countMeta.value) {
    const val = parseInt(countMeta.value, 10);
    if (!isNaN(val) && val > 0) countVal = val;
  }

  // Extract YouTube videos from Shopify media or descriptionHtml
  const mediaEdges = node.media?.edges || [];
  const nativeVideos: string[] = [];
  mediaEdges.forEach((edge: any) => {
    const m = edge.node;
    if (m && m.mediaContentType === 'EXTERNAL_VIDEO' && m.host?.toLowerCase() === 'youtube' && m.embedUrl) {
      nativeVideos.push(m.embedUrl);
    }
  });

  const extractedVideos = extractYoutubeVideos(node.descriptionHtml || node.description || "");
  const combinedVideos = Array.from(new Set([...nativeVideos, ...extractedVideos]));

  const rawVendor = cleanCatalogueText(node.vendor);
  const vendor = /mohsin\s*(?:surgicals?|medicals?)|mohsinsurgicals|bea\s*meds?/i.test(rawVendor)
    ? 'Baemeds'
    : rawVendor;
  const description = replaceMojibake(node.descriptionHtml || node.description || '');

  return {
    id: node.id,
    handle: cleanCatalogueText(node.handle),
    title: cleanCatalogueText(node.title),
    vendor,
    category: cleanCatalogueText(inferredCategory),
    price: parseFloat(firstVariant.price?.amount || firstVariant.price || "0"),
    compareAtPrice: firstVariant.compareAtPrice?.amount ? parseFloat(firstVariant.compareAtPrice.amount) : null,
    image: images[0] || '',
    images: images,
    tags: (node.tags || []).map((tag: unknown) => cleanCatalogueText(tag)).filter(Boolean),
    specs: cleanSpecs,
    inStock: Boolean(firstVariant.availableForSale ?? firstVariant.available ?? false),
    variantId: firstVariant.id,
    description,
    rating: countVal ? ratingVal : undefined,
    reviewCount: countVal,
    warranty: extractWarranty(node.tags || [], node.description || ""),
    seo: node.seo ? {
      title: node.seo.title ? cleanCatalogueText(node.seo.title) : null,
      description: node.seo.description ? cleanCatalogueText(node.seo.description) : null
    } : undefined,
    metafields: (node.metafields || [])
      .filter((m: any) => m !== null)
      .map((m: any) => ({
        namespace: m.namespace,
        key: m.key,
        value: replaceMojibake(m.value)
      })),
    youtubeVideos: combinedVideos
  };
};

// ==========================================
// PRODUCT FUNCTIONS
// ==========================================

const PRODUCT_FRAGMENT = `
  id
  handle
  title
  description
  descriptionHtml
  productType
  vendor
  tags
  variants(first: 1) {
    edges {
      node {
        id
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        availableForSale
        image {
          url
        }
      }
    }
  }
  collections(first: 10) {
    edges {
      node {
        title
        handle
      }
    }
  }
  images(first: 10) {
    edges {
      node {
        url
      }
    }
  }
  media(first: 10) {
    edges {
      node {
        mediaContentType
        ... on ExternalVideo {
          id
          embedUrl
          host
        }
      }
    }
  }
  seo {
    title
    description
  }
  metafields(identifiers: [
    {namespace: "custom", key: "specs"},
    {namespace: "custom", key: "keywords"},
    {namespace: "custom", key: "short_specs"},
    {namespace: "reviews", key: "rating"},
    {namespace: "custom", key: "reviews_rating"},
    {namespace: "custom", key: "product_rating"},
    {namespace: "reviews", key: "rating_count"},
    {namespace: "custom", key: "reviews_count"}
  ]) {
    namespace
    key
    value
  }
`;

let allProductsCache: Product[] | null = null;
let allProductsRequest: Promise<Product[]> | null = null;

const dedupeProducts = (products: Product[]): Product[] => {
  const unique = new Map<string, Product>();
  products.forEach((product) => {
    const key = product.id || product.handle;
    if (key && !unique.has(key)) unique.set(key, product);
  });
  return [...unique.values()];
};

const rememberProduct = (product: Product): Product => {
  if (!allProductsCache) return product;
  const existingIndex = allProductsCache.findIndex(item => item.id === product.id || item.handle === product.handle);
  if (existingIndex >= 0) allProductsCache[existingIndex] = product;
  else allProductsCache.push(product);
  return product;
};

export const fetchAllProducts = async (): Promise<Product[]> => {
  if (allProductsCache) return [...allProductsCache];
  if (allProductsRequest) return [...await allProductsRequest];

  const query = `
    query getAllProducts {
      products(first: 250) {
        edges {
          node {
            ${PRODUCT_FRAGMENT}
          }
        }
      }
    }
  `;
  
  allProductsRequest = (async () => {
    try {
      const data: any = await shopifyFetch(query);
      if (!Array.isArray(data?.products?.edges)) throw new Error('Shopify returned an invalid catalogue response');
      return dedupeProducts(data.products.edges.map(normalizeProduct));
    } catch (primaryError) {
      console.warn('Primary catalogue request failed; trying Shopify client fallback', primaryError);
      try {
        const products = await client.product.fetchAll();
        return dedupeProducts(products.map(normalizeProduct));
      } catch (fallbackError) {
        console.error('Shopify catalogue requests failed', fallbackError);
        throw fallbackError;
      }
    }
  })();

  try {
    allProductsCache = await allProductsRequest;
    return [...allProductsCache];
  } finally {
    allProductsRequest = null;
  }
};

export const fetchProductById = async (id: string): Promise<Product | undefined> => {
  const cached = allProductsCache?.find(product => product.id === id);
  if (cached) return cached;
  try {
    const product = await client.product.fetch(id);
    if (!product) return undefined;
    return rememberProduct(normalizeProduct(product));
  } catch (error) {
     console.error('Error fetching product by id:', error);
     return undefined;
  }
};

export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  if (!category || category.toLowerCase() === 'all') return fetchAllProducts();

  const allProducts = await fetchAllProducts();
  const canonicalCategory = resolveCategoryName(category);
  const normalizedRequest = normalizeCategoryKey(canonicalCategory || category);

  return allProducts.filter((product) => {
    const productCanonical = resolveCategoryName(product.category);
    const normalizedProductCategory = normalizeCategoryKey(productCanonical || product.category);
    return normalizedProductCategory === normalizedRequest;
  });
};

export const fetchProductByHandle = async (handle: string): Promise<Product | undefined> => {
  const cleanHandle = cleanCatalogueText(handle).toLowerCase().trim();
  if (allProductsCache) {
    const cached = allProductsCache.find(p => p.handle.toLowerCase() === cleanHandle || p.id === handle || p.id.endsWith(`/${handle}`));
    if (cached) return cached;
  }

  const query = `
    query getProductByHandle($handle: String!) {
      product(handle: $handle) {
        ${PRODUCT_FRAGMENT}
      }
    }
  `;
  try {
    const data: any = await shopifyFetch(query, { handle: cleanHandle });
    if (data?.product) {
      return rememberProduct(normalizeProduct(data.product));
    }
  } catch (error) {
    console.warn("Direct GraphQL fetchProductByHandle failed; falling back to full catalogue", error);
  }

  // Fallback 1: Search in full catalogue
  try {
    const all = await fetchAllProducts();
    const found = all.find(p => 
      p.handle.toLowerCase() === cleanHandle ||
      p.handle.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanHandle.replace(/[^a-z0-9]/g, '') ||
      p.id === handle ||
      p.id.endsWith(`/${handle}`)
    );
    if (found) return rememberProduct(found);
  } catch (err) {
    console.warn("Catalogue fallback failed", err);
  }

  // Fallback 2: Shopify Buy SDK fetchByHandle
  try {
    const product = await client.product.fetchByHandle(cleanHandle);
    if (product) return rememberProduct(normalizeProduct(product));
  } catch (err) {
    console.error("All fetchProductByHandle attempts failed for:", cleanHandle, err);
  }

  return undefined;
};

const normalizeSearchValue = (value: unknown): string => stripHtml(value)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const fieldContainsTerm = (field: string, term: string): boolean => {
  if (!field || !term) return false;
  if (term.length <= 2) return field.split(' ').includes(term);
  return field.includes(term);
};

const getSearchFields = (product: Product) => {
  const metafields = (product.metafields || []).map(field => field.value).join(' ');
  return {
    title: normalizeSearchValue(product.title),
    handle: normalizeSearchValue(product.handle),
    vendor: normalizeSearchValue(product.vendor),
    category: normalizeSearchValue(product.category),
    tags: normalizeSearchValue((product.tags || []).join(' ')),
    description: normalizeSearchValue(product.description),
    specs: normalizeSearchValue(product.specs),
    metafields: normalizeSearchValue(metafields),
  };
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return [];

  const originalTerms = normalizedQuery.split(' ').filter(Boolean);
  const expandedTerms = [...new Set(expandSearchTerms(query).map(normalizeSearchValue).filter(Boolean))];
  const products = await fetchAllProducts();

  return products
    .map((product) => {
      const fields = getSearchFields(product);
      const allFields = Object.values(fields).join(' ');
      const originalMatches = originalTerms.filter(term => fieldContainsTerm(allFields, term));
      const synonymMatches = expandedTerms.filter(term => fieldContainsTerm(allFields, term));

      let score = 0;
      if (fields.title === normalizedQuery) score += 1200;
      else if (fields.title.includes(normalizedQuery)) score += 800;
      if (fields.handle === normalizedQuery) score += 1000;
      else if (fields.handle.includes(normalizedQuery)) score += 650;
      if (fields.category === normalizedQuery) score += 700;
      else if (fields.category.includes(normalizedQuery)) score += 400;
      if (fields.vendor === normalizedQuery) score += 650;
      else if (fields.vendor.includes(normalizedQuery)) score += 300;
      if (fields.tags.includes(normalizedQuery)) score += 350;
      if (fields.description.includes(normalizedQuery) || fields.specs.includes(normalizedQuery)) score += 180;
      if (fields.metafields.includes(normalizedQuery)) score += 180;
      score += originalMatches.length * 120;
      score += synonymMatches.length * 25;
      if (originalTerms.length > 1 && originalMatches.length === originalTerms.length) score += 300;

      return { product, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.product.title.length - b.product.title.length)
    .map(result => result.product);
};
