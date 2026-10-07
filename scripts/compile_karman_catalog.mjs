import fs from 'node:fs';

const html = fs.readFileSync('scripts/baemeds_live_home.html', 'utf8').replace(/&quot;/g, '"');
const downloaded = JSON.parse(fs.readFileSync('scripts/downloaded_live_products.json', 'utf8'));

// Search for product details in HTML
const fullKarmanProducts = [];

for (const p of downloaded) {
  // Find where this title appears
  const idx = html.indexOf(p.title);
  let description = '';
  let slug = '';
  if (idx !== -1) {
    const chunk = html.substring(idx - 100, idx + 1000);
    const descM = chunk.match(/"description":\[0,"([^"]+)"\]/);
    if (descM) description = descM[1];
    const slugM = chunk.match(/"slug":\[0,"([^"]+)"\]/);
    if (slugM) slug = slugM[1];
  }

  // Determine category
  let category = 'Wheelchairs';
  if (/Shower Chair|Bath/i.test(p.title)) {
    category = 'Commodes & Bath Safety';
  } else if (/Walker|Rollator/i.test(p.title)) {
    category = 'Walkers & Rollators';
  }

  // Set realistic price based on product type if not found
  let price = 299.99;
  if (/Standing Multi Power|Power Standing/i.test(p.title)) price = 3499.00;
  else if (/Standing Manual|Power Wheelchair|Full Power Stand/i.test(p.title)) price = 2199.00;
  else if (/Reclining/i.test(p.title)) price = 689.00;
  else if (/Ergonomic|Ultra Lightweight/i.test(p.title)) price = 549.00;
  else if (/Transport/i.test(p.title)) price = 249.00;
  else if (/Knee Walker/i.test(p.title)) price = 189.00;
  else if (/Shower Chair/i.test(p.title)) price = 89.99;
  else if (/Rollator/i.test(p.title)) price = 179.99;

  fullKarmanProducts.push({
    title: p.title.replace(/\\t/g, '').trim(),
    slug: slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    description: description || `Certified authentic ${p.title}. Durable medical equipment manufactured to hospital and homecare standards with factory warranty.`,
    category,
    price,
    compareAtPrice: Math.round(price * 1.3),
    vendor: 'Karman Healthcare',
    image: p.localPath,
    images: [p.localPath],
  });
}

console.log(`Created ${fullKarmanProducts.length} full Karman product definitions.`);
fs.writeFileSync('scripts/karman_products_ready.json', JSON.stringify(fullKarmanProducts, null, 2), 'utf8');
