import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {};
}

import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function syncCaseProducts() {
  const catalog = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/catalog_seed.json'), 'utf8'));
  const caseProducts = catalog.filter(p => p.variants && p.variants.length > 1);
  console.log(`Updating ${caseProducts.length} multi-variant products in Supabase...`);

  let updated = 0;
  let errors = 0;

  // Run in chunks of 10 concurrently
  const chunkSize = 15;
  for (let i = 0; i < caseProducts.length; i += chunkSize) {
    const chunk = caseProducts.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (p) => {
        const { error } = await supabase
          .from('products')
          .update({
            price: p.price,
            compare_at_price: p.compareAtPrice,
            wholesale_cost: p.wholesaleCost,
            specs: p.specs
          })
          .eq('id', p.id);

        if (error) {
          console.error(`Failed ${p.id}:`, error.message);
          errors++;
        } else {
          updated++;
        }
      })
    );
    if ((i + chunkSize) % 60 === 0 || i + chunkSize >= caseProducts.length) {
      console.log(`Progress: ${updated} updated...`);
    }
  }

  console.log(`Finished: ${updated} successfully updated in Supabase, ${errors} errors.`);
}

syncCaseProducts().catch(err => console.error('Sync error:', err));
