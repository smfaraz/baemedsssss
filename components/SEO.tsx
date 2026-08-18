import React from 'react';
import { Helmet } from 'react-helmet-async';
import { APP_NAME, SITE_URL } from '../constants';

const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/baemeds-social-preview.jpg`;

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'product';
  productData?: {
    name: string;
    image: string;
    description: string;
    sku?: string;
    brand: string;
    price: number;
    currency: string;
    availability: string;
    ratingValue?: string | number;
    reviewCount?: string | number;
  };
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  productData,
}) => {
  const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  const canonicalPath = canonical || `${window.location.pathname}${window.location.search}`;
  const fullCanonical = new URL(canonicalPath, SITE_URL).toString();
  const socialImage = ogImage ? new URL(ogImage, SITE_URL).toString() : DEFAULT_SOCIAL_IMAGE;
  const hasRating = Boolean(
    productData?.ratingValue
    && productData?.reviewCount
    && Number(productData.reviewCount) > 0,
  );

  const jsonLd = productData ? {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: productData.name,
    image: productData.image ? [productData.image] : undefined,
    description: productData.description,
    sku: productData.sku,
    brand: {
      '@type': 'Brand',
      name: productData.brand,
    },
    offers: {
      '@type': 'Offer',
      url: fullCanonical,
      priceCurrency: productData.currency,
      price: productData.price,
      availability: productData.availability === 'InStock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    ...(hasRating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: productData.ratingValue?.toString(),
        reviewCount: productData.reviewCount?.toString(),
      },
    } : {}),
  } : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullCanonical} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={socialImage} />
      <meta property="og:image:secure_url" content={socialImage} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${APP_NAME} medical equipment storefront`} />
      <meta property="og:url" content={fullCanonical} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={socialImage} />
      <meta name="twitter:image:alt" content={`${APP_NAME} medical equipment storefront`} />
    </Helmet>
  );
};

export default SEO;
