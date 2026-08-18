/**
 * Generative product copy is intentionally disabled.
 *
 * Public storefront product discovery is deterministic and catalogue-backed.
 * This compatibility export remains so an older local import fails closed
 * instead of making a network request or presenting generated claims as fact.
 */
export interface ProductSEOSuggestion {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  twitterDescription: string;
  analysis: string;
  worthScore: number;
  regionalHubTags: string[];
}

export const generateProductSEO = async (
  _product: { title: string; vendor: string; description: string; category: string },
): Promise<ProductSEOSuggestion | null> => null;
