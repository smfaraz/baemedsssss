import fs from 'node:fs';

const html = fs.readFileSync('scripts/baemeds_live_home.html', 'utf8');

// Unescape &quot;
const unescaped = html.replace(/&quot;/g, '"');

// Look for product objects in the store
// In Zyro ecommerce stores, products are structured with id, name/title, price, images/assets
const assetMatches = unescaped.match(/https:\/\/cdn\.zyrosite\.com\/cdn-ecommerce\/store_[^"'\s\\]+/gi) || [];
const uniqueAssets = Array.from(new Set(assetMatches));

console.log(`Found ${uniqueAssets.length} unique Zyrosite product images.`);

// Look for image objects: { alt: "...", url: "..." }
const imgRegex = /"alt":\[0,"([^"]*)"\],"url":\[0,"([^"]+)"\]/g;
let m;
const catalogImages = [];
while ((m = imgRegex.exec(unescaped)) !== null) {
  catalogImages.push({ alt: m[1], url: m[2] });
}

console.log(`Found ${catalogImages.length} image entries with alt tags:`);
catalogImages.forEach((img, i) => console.log(`${i + 1}: [${img.alt}] -> ${img.url}`));

// Also extract any other photography
const allZyroAssets = unescaped.match(/https:\/\/assets\.zyrosite\.com\/[^"'\s\\]+/gi) || [];
console.log('Lifestyle / Brand Assets on Zyrosite:', Array.from(new Set(allZyroAssets)));
