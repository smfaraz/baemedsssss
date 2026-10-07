import fs from 'node:fs';

const html = fs.readFileSync('scripts/baemeds_live_home.html', 'utf8');
const unescaped = html.replace(/&quot;/g, '"');

// Extract all products defined in Zyro:
// Look for blocks with "name":[0,"..."],"type":[0,"ecommerce-dynamic-product"] or "ogImageAlt":[0,"..."],"ogImagePath":[0,"..."]
const regex = /"ogImageAlt":\[0,"([^"]+)"\].*?"ogImagePath":\[0,"([^"]+)"\]/g;
let match;
const products = [];
const seenImages = new Set();

while ((match = regex.exec(unescaped)) !== null) {
  const title = match[1];
  const imgUrl = match[2];
  if (!seenImages.has(imgUrl)) {
    seenImages.add(imgUrl);
    products.push({ title, imgUrl });
  }
}

console.log(`Extracted ${products.length} products from live baemeds.com:`);
products.forEach((p, i) => console.log(`${i + 1}. ${p.title} -> ${p.imgUrl}`));

fs.writeFileSync('scripts/live_extracted_products.json', JSON.stringify(products, null, 2), 'utf8');
