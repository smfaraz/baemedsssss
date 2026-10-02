/**
 * BaeMeds Automated Marketing Feeds Engine
 * Generates standards-compliant Google Merchant Center XML (RSS 2.0 + g: namespace)
 * and Meta Product Catalog CSV feeds for BaeMeds USA Top 100 Hero and DME Products.
 */

import { supabase } from '../lib/supabase';
import rawCatalog from '../data/catalog_seed.json';

const BASE_URL = 'https://www.baemeds.com';
const BRAND = 'BaeMeds USA';

// Clean text for XML CDATA or entity escapes
const escapeXml = (unsafe: string): string => {
  return (unsafe || '')
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
};

const escapeCsv = (val: any): string => {
  const str = String(val ?? '').replace(/"/g, '""');
  return `"${str}"`;
};

// Map DME category to Google Product Category ID / Taxonomy
const getGoogleCategory = (cat: string): string => {
  const norm = (cat || '').toLowerCase();
  if (norm.includes('oxygen') || norm.includes('respiratory') || norm.includes('cpap') || norm.includes('bipap') || norm.includes('nebulizer')) {
    return 'Health & Beauty > Health Care > Respiratory Care';
  }
  if (norm.includes('mobility') || norm.includes('wheelchair')) {
    return 'Health & Beauty > Health Care > Mobility & Accessibility';
  }
  if (norm.includes('monitor') || norm.includes('blood pressure') || norm.includes('glucometer')) {
    return 'Health & Beauty > Health Care > Health Care Equipment > Medical Diagnostic Equipment';
  }
  if (norm.includes('bed') || norm.includes('furniture')) {
    return 'Health & Beauty > Health Care > Health Care Equipment > Hospital Beds & Accessories';
  }
  return 'Health & Beauty > Health Care > Health Care Equipment';
};

async function getFeedProducts(heroesOnly = false) {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (heroesOnly) {
      query = query.eq('is_hero_product', true);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (e) {
    console.warn('Fallback to local catalog for feeds:', e);
  }

  // Fallback to local seed if database is unreachable
  return (rawCatalog as any[]).filter((p) => (heroesOnly ? p.isHeroProduct : true));
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const heroesOnly = url.searchParams.get('heroes') === '1' || url.searchParams.get('heroes_only') === 'true';

    const products = await getFeedProducts(heroesOnly);

    // 1. Google Merchant Center XML (RSS 2.0)
    if (pathname.includes('google') || pathname.endsWith('.xml')) {
      const itemsXml = products.map((p: any) => {
        const id = p.id;
        const title = escapeXml(p.title);
        const description = escapeXml(p.description || `${p.title} - Certified Durable Medical Equipment by BaeMeds USA.`);
        const link = `${BASE_URL}/products/${p.handle || p.id}`;
        const imageLink = p.featured_image || (Array.isArray(p.images) && p.images[0]) || `${BASE_URL}/placeholder-dme.jpg`;
        const availability = (p.inventory_quantity ?? 25) > 0 ? 'in_stock' : 'out_of_stock';
        const price = `${Number(p.price || 0).toFixed(2)} USD`;
        const gpc = escapeXml(getGoogleCategory(p.category));
        const brand = escapeXml(p.vendor || BRAND);
        const mpn = escapeXml(p.sku || p.id);
        const gtin = p.barcode ? `<g:gtin>${escapeXml(p.barcode)}</g:gtin>` : '';
        const mckNum = p.mckesson_item_number ? `<g:custom_label_0>MCK_${escapeXml(p.mckesson_item_number)}</g:custom_label_0>` : '';
        const heroTag = p.is_hero_product ? '<g:custom_label_1>TOP_100_HERO</g:custom_label_1>' : '<g:custom_label_1>STANDARD_CATALOG</g:custom_label_1>';
        const hcpcsTag = p.hcpcs_code ? `<g:custom_label_2>HCPCS_${escapeXml(p.hcpcs_code)}</g:custom_label_2>` : '';

        return `
    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${brand}</g:brand>
      <g:mpn>${mpn}</g:mpn>
      ${gtin}
      <g:google_product_category>${gpc}</g:google_product_category>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard Ground Delivery</g:service>
        <g:price>0.00 USD</g:price>
      </g:shipping>
      ${mckNum}
      ${heroTag}
      ${hcpcsTag}
    </item>`;
      }).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>BaeMeds USA - High-Quality Durable Medical Equipment</title>
    <link>${BASE_URL}</link>
    <description>Authoritative Google Shopping and Merchant Center product feed for BaeMeds USA certified medical devices.</description>
    ${itemsXml}
  </channel>
</rss>`;

      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      });
    }

    // 2. Meta (Facebook / Instagram) Catalog CSV Feed
    if (pathname.includes('meta') || pathname.endsWith('.csv')) {
      const headers = [
        'id',
        'title',
        'description',
        'availability',
        'condition',
        'price',
        'link',
        'image_link',
        'brand',
        'google_product_category',
        'custom_label_0',
        'custom_label_1',
      ];

      const rows = products.map((p: any) => {
        const id = p.id;
        const title = p.title;
        const description = (p.description || `${p.title} - Professional Durable Medical Equipment`).slice(0, 5000);
        const availability = (p.inventory_quantity ?? 25) > 0 ? 'in stock' : 'out of stock';
        const condition = 'new';
        const price = `${Number(p.price || 0).toFixed(2)} USD`;
        const link = `${BASE_URL}/products/${p.handle || p.id}`;
        const imageLink = p.featured_image || (Array.isArray(p.images) && p.images[0]) || `${BASE_URL}/placeholder-dme.jpg`;
        const brand = p.vendor || BRAND;
        const gpc = getGoogleCategory(p.category);
        const heroTag = p.is_hero_product ? 'TOP_100_HERO' : 'STANDARD_CATALOG';
        const mckTag = p.mckesson_item_number ? `MCK_${p.mckesson_item_number}` : '';

        return [
          escapeCsv(id),
          escapeCsv(title),
          escapeCsv(description),
          escapeCsv(availability),
          escapeCsv(condition),
          escapeCsv(price),
          escapeCsv(link),
          escapeCsv(imageLink),
          escapeCsv(brand),
          escapeCsv(gpc),
          escapeCsv(heroTag),
          escapeCsv(mckTag),
        ].join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      });
    }

    // Default: JSON format
    return new Response(JSON.stringify({ count: products.length, products }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
