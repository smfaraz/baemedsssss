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
  
  // Compute clean absolute canonical URL strictly without query parameters
  const getCleanCanonical = () => {
    try {
      if (canonical) {
        // If an explicit canonical is passed (e.g. /products/handle or full URL)
        const parsed = new URL(canonical, SITE_URL);
        return `${SITE_URL}${parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/+$/, '')}`;
      }
      if (typeof window !== 'undefined' && window.location?.pathname) {
        const path = window.location.pathname;
        return `${SITE_URL}${path === '/' ? '/' : path.replace(/\/+$/, '')}`;
      }
    } catch {
      // Fallback
    }
    return SITE_URL;
  };

  const fullCanonical = getCleanCanonical();
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
    sku: productData.sku || productData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    mpn: productData.sku || productData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    brand: {
      '@type': 'Brand',
      name: productData.brand || APP_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: fullCanonical,
      priceCurrency: productData.currency || 'USD',
      price: productData.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: productData.availability === 'InStock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'MedicalBusiness',
        name: APP_NAME,
        url: SITE_URL,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'USD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'US',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'd',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 5,
            unitCode: 'd',
          },
        },
      },
    },
    ...(hasRating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: productData.ratingValue?.toString(),
        reviewCount: productData.reviewCount?.toString(),
      },
    } : {}),
  } : null;

  const businessJsonLd = !productData ? {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': `${SITE_URL}/#organization`,
    name: APP_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/baemeds-social-preview.jpg`,
    image: `${SITE_URL}/baemeds-social-preview.jpg`,
    description: 'BaeMeds Healthcare USA is your trusted provider of clinical respiratory equipment (5L/10L oxygen concentrators, BiPAP/CPAP systems), ICU monitors, hospital beds, and mobility aids with nationwide US shipping and FSA/HSA eligibility.',
    telephone: '+18005550199',
    email: 'support@baemeds.com',
    priceRange: '$$',
    paymentAccepted: 'Credit Card, Debit Card, Apple Pay, Google Pay, FSA/HSA Card, Purchase Order',
    currenciesAccepted: 'USD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1209 Orange Street',
      addressLocality: 'Wilmington',
      addressRegion: 'DE',
      postalCode: '19801',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.7459,
      longitude: -75.5466,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
        ],
        opens: '08:00',
        closes: '20:00',
      },
    ],
    areaServed: [
      {
        '@type': 'Country',
        name: 'United States',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Medical Equipment Sales & Clinical Supply Catalogue',
      itemListElement: [

        {
          '@type': 'OfferCatalog',
          name: 'Oxygen Concentrators (5L & 10L DME)',
        },
        {
          '@type': 'OfferCatalog',
          name: 'BiPAP & CPAP Sleep Apnea Machines',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Multiparameter Patient Monitors & Clinical Telemetry',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Mobility Equipment & Daily Living Aids',
        },
      ],
    },
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

      {businessJsonLd && (
        <script type="application/ld+json">{JSON.stringify(businessJsonLd)}</script>
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
