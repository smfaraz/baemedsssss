import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITEMAP_PATH = path.resolve(__dirname, '../public/sitemap.xml');
const SITE_URL = 'https://www.baemeds.in';

async function fetchAllShopifyProducts() {
  const allProducts = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query getProducts($cursor: String) {
        products(first: 250, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              handle
              updatedAt
              featuredImage {
                url
                altText
              }
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://ptya1n-k0.myshopify.com/api/2024-07/graphql.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': 'c1fb47a74eaec2fbafa70becac08f52b',
      },
      body: JSON.stringify({ query, variables: { cursor } }),
    });

    const result = await response.json();
    const edges = result?.data?.products?.edges || [];
    
    for (const edge of edges) {
      allProducts.push(edge.node);
    }

    hasNextPage = result?.data?.products?.pageInfo?.hasNextPage || false;
    cursor = result?.data?.products?.pageInfo?.endCursor || null;
  }

  return allProducts;
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateCompleteSitemap() {
  console.log('=== GENERATING MASTER XML SITEMAP (ALL PRODUCTS & CATEGORIES) ===');
  const today = new Date().toISOString().split('T')[0];

  // 1. Core Primary Store Routes & Hyper-Local Landing Pages
  const staticRoutes = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/products', priority: '0.9', changefreq: 'daily' },
    { path: '/oxygen-concentrator-rental-hyderabad', priority: '0.95', changefreq: 'daily' },
    { path: '/bipap-machine-on-rent-hyderabad', priority: '0.95', changefreq: 'daily' },
    { path: '/patient-monitor-price-hyderabad', priority: '0.95', changefreq: 'daily' },
    { path: '/guides/oxygen-concentrator-rental-hyderabad', priority: '0.90', changefreq: 'weekly' },
    { path: '/bulk-orders', priority: '0.8', changefreq: 'weekly' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/contact', priority: '0.7', changefreq: 'monthly' },
    { path: '/policies/privacy', priority: '0.5', changefreq: 'yearly' },
    { path: '/policies/terms', priority: '0.5', changefreq: 'yearly' },
    { path: '/policies/shipping', priority: '0.5', changefreq: 'monthly' },
    { path: '/policies/returns', priority: '0.5', changefreq: 'monthly' },
  ];

  // 2. All 17 Medical Category Routes
  const categories = [
    "Oxygen Concentrator",
    "BiPAP",
    "CPAP",
    "Patient Monitor",
    "Masks & Accessories",
    "ECG Machine",
    "BP Monitor",
    "Glucometer",
    "Nebulizer",
    "Suction Machine",
    "Thermometer",
    "Hospital Furniture",
    "Wheelchair",
    "Syringe Pump",
    "Defibrillator",
    "Sterilizer",
    "Orthopedic"
  ];

  // 3. Fetch 100% of products with pagination from Shopify
  console.log('Fetching full catalogue with images from Shopify Storefront GraphQL API...');
  const products = await fetchAllShopifyProducts();
  console.log(`Fetched ${products.length} total products from Shopify.`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // Write Core Pages
  for (const route of staticRoutes) {
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}${route.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // Write Category Pages
  for (const cat of categories) {
    const encoded = encodeURIComponent(cat);
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/products?category=${encoded}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.85</priority>\n`;
    xml += `  </url>\n`;
  }

  // Write All Product Detail Pages (with Google Image Sitemap tags)
  const seenHandles = new Set();
  for (const product of products) {
    if (!product.handle || seenHandles.has(product.handle)) continue;
    seenHandles.add(product.handle);

    const lastMod = product.updatedAt ? product.updatedAt.split('T')[0] : today;
    const prodUrl = `${SITE_URL}/products/${product.handle}`;

    xml += `  <url>\n`;
    xml += `    <loc>${prodUrl}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.80</priority>\n`;

    // Add Image Sitemap metadata for Google Images
    const images = [];
    if (product.featuredImage?.url) {
      images.push({
        url: product.featuredImage.url,
        title: product.featuredImage.altText || product.title,
      });
    }

    if (Array.isArray(product.images?.edges)) {
      for (const imgEdge of product.images.edges) {
        if (imgEdge.node?.url && !images.some(i => i.url === imgEdge.node.url)) {
          images.push({
            url: imgEdge.node.url,
            title: imgEdge.node.altText || product.title,
          });
        }
      }
    }

    for (const img of images) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(img.url)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(img.title)}</image:title>\n`;
      xml += `    </image:image>\n`;
    }

    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
  console.log(`✓ Master XML Sitemap generated at public/sitemap.xml!`);
  console.log(`  - Core Store Pages: ${staticRoutes.length}`);
  console.log(`  - Category Filter Pages: ${categories.length}`);
  console.log(`  - Product Detail Pages (with Images): ${seenHandles.size}`);
  console.log(`  - Total URLs in Sitemap: ${staticRoutes.length + categories.length + seenHandles.size}`);
}

generateCompleteSitemap().catch(console.error);
