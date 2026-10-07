import fs from 'node:fs';

const html = fs.readFileSync('scripts/baemeds_live_home.html', 'utf8');
const unescaped = html.replace(/&quot;/g, '"');

// Search for product cards / items in the store
// In Zyro, each product has an image, title, price, etc.
// Let's search for "Karman" and surrounding text
const matches = unescaped.match(/"name":\[0,"([^"]+)"\].*?"price":\[0,([0-9.]+)\].*?"assets":\[0,\[(.*?)\]\]/gi) || [];
console.log(`Found ${matches.length} product pattern matches`);

// Let's search for any occurrences of "title" or "name" near cdn.zyrosite.com
const lines = unescaped.split('\n');
console.log(`Total HTML lines: ${lines.length}`);

// Let's find snippets around cdn-ecommerce
const cdnRegex = /https:\/\/cdn\.zyrosite\.com\/cdn-ecommerce\/store_[^"'\s\\]+/g;
let match;
const products = [];
while ((match = cdnRegex.exec(unescaped)) !== null) {
  const start = Math.max(0, match.index - 300);
  const end = Math.min(unescaped.length, match.index + 300);
  const snippet = unescaped.substring(start, end);
  // find title/name/alt
  const titleM = snippet.match(/"(?:title|name|alt)":\[0,"([^"]+)"\]/);
  products.push({
    imageUrl: match[0],
    title: titleM ? titleM[1] : 'Unknown Product',
  });
}

console.log('Discovered products with photos on live site:');
products.forEach((p, idx) => console.log(`${idx + 1}: ${p.title} -> ${p.imageUrl}`));

fs.writeFileSync('scripts/live_store_products.json', JSON.stringify(products, null, 2), 'utf8');
