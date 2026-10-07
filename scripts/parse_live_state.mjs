import fs from 'node:fs';

const html = fs.readFileSync('scripts/baemeds_live_home.html', 'utf8');

// The live site uses JSON embedded in script tags (Nuxt / Svelte / Next / Zyro state)
// Let's search for JSON data in script tags
const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
console.log(`Found ${scriptMatches.length} script tags`);

for (let i = 0; i < scriptMatches.length; i++) {
  const content = scriptMatches[i].replace(/<\/?script[^>]*>/gi, '');
  if (content.includes('zyrosite') || content.includes('products') || content.includes('store_')) {
    console.log(`Script ${i} length: ${content.length}`);
    fs.writeFileSync(`scripts/live_script_${i}.js`, content, 'utf8');
  }
}
