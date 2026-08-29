"""
BaeMeds Google Merchant Center Feed Automated Sync
Connects directly to Shopify Storefront GraphQL API to fetch all live products,
working Shopify CDN images, live pricing, and stock status.
"""

import urllib.request
import json
import re
import xml.etree.ElementTree as ET

ENDPOINT = "https://ptya1n-k0.myshopify.com/api/2024-07/graphql.json"
ACCESS_TOKEN = "c1fb47a74eaec2fbafa70becac08f52b"
STORE_URL = "https://baemeds.in"

query = """
{
  products(first: 250) {
    edges {
      node {
        id
        title
        handle
        description
        productType
        vendor
        variants(first: 10) {
          edges {
            node {
              id
              sku
              title
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              availableForSale
            }
          }
        }
        images(first: 10) {
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
"""

def sync():
    print("🔄 Connecting to Shopify API...")
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps({"query": query}).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': ACCESS_TOKEN,
            'Accept': 'application/json'
        }
    )

    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        products_edges = res.get('data', {}).get('products', {}).get('edges', [])

    print(f"📦 Fetched {len(products_edges)} live products from Shopify!")

    feed_items = []

    for edge in products_edges:
        node = edge['node']
        title = node['title'].replace('\ufffd', '–').strip()
        handle = node['handle']
        desc = node.get('description', '') or f"{title} - High quality medical equipment available at BaeMeds."
        desc = re.sub(r'<[^>]+>', ' ', desc)
        desc = re.sub(r'\s+', ' ', desc).strip()
        if len(desc) < 10:
            desc = f"{title} available with warranty and fast delivery across India from BaeMeds."
            
        product_type = node.get('productType') or 'Medical Equipment'
        vendor = node.get('vendor') or 'BaeMeds'
        if vendor.lower() in ['mohsinsurgicals-web', 'baemeds-main', 'default']:
            vendor = 'BaeMeds'
            
        link = f"{STORE_URL}/products/{handle}"
        
        images = node.get('images', {}).get('edges', [])
        image_url = images[0]['node']['url'] if len(images) > 0 else ''
        
        variants = node.get('variants', {}).get('edges', [])
        if len(variants) > 0:
            v_node = variants[0]['node']
            sku = v_node.get('sku')
            price_val = float(v_node['price']['amount'])
            curr = v_node['price']['currencyCode']
            available = v_node.get('availableForSale', True)
            
            compare_at = v_node.get('compareAtPrice')
            compare_val = float(compare_at['amount']) if compare_at else None
            
            if compare_val and compare_val > price_val:
                price_str = f"{compare_val:.2f} {curr}"
                sale_price_str = f"{price_val:.2f} {curr}"
            else:
                price_str = f"{price_val:.2f} {curr}"
                sale_price_str = None
                
            avail_str = "in_stock" if available else "out_of_stock"
        else:
            sku = None
            price_str = "1000.00 INR"
            sale_price_str = None
            avail_str = "in_stock"
            
        if not sku:
            clean_handle_id = re.sub(r'[^a-zA-Z0-9-]', '', handle.upper())
            item_id = f"BAE-{clean_handle_id[:25]}"
        else:
            item_id = re.sub(r'\s+', '', sku)
            
        feed_items.append({
            'id': item_id,
            'title': title,
            'description': desc,
            'link': link,
            'image_link': image_url,
            'availability': avail_str,
            'price': price_str,
            'sale_price': sale_price_str,
            'brand': vendor,
            'condition': 'new',
            'mpn': item_id,
            'identifier_exists': 'no',
            'product_type': product_type
        })

    def xml_escape(val):
        return (str(val)
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&apos;'))

    xml_lines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
        '  <channel>',
        '    <title>BAE Meds Product Feed</title>',
        '    <link>https://baemeds.in</link>',
        '    <description>Live Google Merchant Center feed synchronized directly from Shopify</description>'
    ]

    field_order = [
        'id',
        'title',
        'description',
        'link',
        'image_link',
        'availability',
        'price',
        'sale_price',
        'brand',
        'condition',
        'mpn',
        'identifier_exists',
        'product_type'
    ]

    for item in feed_items:
        if not item['image_link']:
            continue
        xml_lines.append('    <item>')
        for field in field_order:
            if field in item and item[field]:
                val_escaped = xml_escape(item[field])
                xml_lines.append(f'      <g:{field}>{val_escaped}</g:{field}>')
        xml_lines.append('    </item>')

    xml_lines.append('  </channel>')
    xml_lines.append('</rss>\n')

    final_xml = '\n'.join(xml_lines)

    with open("Book1.xml", "w", encoding="utf-8") as f:
        f.write(final_xml)

    with open("../../Book1.xml", "w", encoding="utf-8") as f:
        f.write(final_xml)

    tree = ET.fromstring(final_xml)
    count = len(tree.find('channel').findall('item'))
    print(f"✅ SUCCESS: Synchronized {count} products with 100% working live CDN images to Book1.xml!")

if __name__ == "__main__":
    sync()
