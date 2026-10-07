import fs from 'node:fs';

const storeId = 'store_01K2J3J1EQG0ASSRHVMC3QTHA3';
const url = `https://ecommerce.zyro.com/api/${storeId}/products`;

async function fetchLiveProducts() {
  const res = await fetch(url);
  const data = await res.json();
  fs.writeFileSync('scripts/baemeds_live_ecommerce_products.json', JSON.stringify(data, null, 2), 'utf8');
  console.log(`Fetched ${Array.isArray(data) ? data.length : Object.keys(data).length} items from live store API!`);
  
  const list = Array.isArray(data) ? data : (data.items || data.products || Object.values(data));
  console.log(`First product:`, JSON.stringify(list[0], null, 2));
}

fetchLiveProducts().catch(console.error);
