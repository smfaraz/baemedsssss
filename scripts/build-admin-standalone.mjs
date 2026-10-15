import fs from 'node:fs';

const adminServiceContent = fs.readFileSync('server/adminService.ts', 'utf-8');
const adminApiContent = fs.readFileSync('api/admin.ts', 'utf-8');

// Strip imports from adminServiceContent
let serviceBody = adminServiceContent
  .replace(/import\s+\{\s*adminSupabase\s*\}\s+from\s+['"][^'"]+['"];?/g, '')
  .replace(/import\s+type\s+\{\s*Product,\s*Order\s*\}\s+from\s+['"][^'"]+['"];?/g, '')
  .replace(/\/\*\*[\s\S]*?\*\//, '');

// Strip top imports from adminApiContent
let apiBody = adminApiContent
  .replace(/import\s+\{[\s\S]*?\}\s+from\s+['"]\.\.\/server\/adminService['"];?/g, '')
  .replace(/import\s+type\s+\{\s*AdminUser,\s*AdminRole\s*\}\s+from\s+['"]\.\.\/server\/adminService['"];?/g, '')
  .replace(/import\s+\{\s*adminSupabase\s*\}\s+from\s+['"]\.\.\/server\/adminSupabase['"];?/g, '')
  .replace(/\/\*\*[\s\S]*?\*\//, '');

const fullContent = `/**
 * BaeMeds Native Back-Office Serverless API Gateway
 * Handles /api/admin/* endpoints with server-side authentication,
 * RBAC authorization, and mutation auditing.
 * 
 * Standalone, self-contained serverless module with zero relative imports.
 */

// Polyfill WebSocket in Node environments (Node < 22) to prevent @supabase/supabase-js crashing on boot
if (typeof globalThis !== 'undefined' && !(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = class WebSocket {};
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// --------------------------------------------------------------------
// 0. ADMIN SUPABASE CLIENT (Direct Service Role)
// --------------------------------------------------------------------
const getEnvVar = (name: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  return undefined;
};

const SUPABASE_URL =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('SUPABASE_URL') ||
  'https://ifadlrhqsgdxeeebjblo.supabase.co';

const SERVICE_KEY =
  getEnvVar('SUPABASE_SERVICE_ROLE_KEY') ||
  getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWRscmhxc2dkeGVlZWJqYmxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc4Nzg4NiwiZXhwIjoyMTA2MzYzODg2fQ.iqFzLb2dntbQuW4u_LZuxLA9Ki8AcFsRLO7jzUTRBco';

let _client: SupabaseClient | null = null;
export const getAdminSupabase = (): SupabaseClient => {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _client;
};

export const adminSupabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAdminSupabase() as any;
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// --------------------------------------------------------------------
// 0.1 CANONICAL COMMERCE TYPES
// --------------------------------------------------------------------
export interface Product {
  id: string;
  handle: string;
  vendor: string;
  title: string;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  images: string[];
  tags: string[];
  specs: any;
  inStock: boolean;
  description?: string;
  warranty?: string;
  prescriptionRequired?: boolean;
  isRentalAvailable?: boolean;
  hcpcsCode?: string;
  fdaClassification?: string;
  isRegulatoryVerified?: boolean;
  wholesaleCost?: number;
  costPerItem?: number;
  dealerPrice?: number;
  margin?: number;
  sku?: string;
  barcode?: string;
  mckessonItemNumber?: string;
  inventoryQuantity?: number;
  trackInventory?: boolean;
  isHeroProduct?: boolean;
  features?: string[];
  seoTitle?: string;
  seoDescription?: string;
  [key: string]: any;
}

export interface Order {
  id: string;
  orderNumber: string;
  processedAt: string;
  totalPrice: { amount: string; currencyCode: string };
  totalShippingPrice: { amount: string; currencyCode: string };
  totalTax: { amount: string; currencyCode: string };
  financialStatus: string;
  fulfillmentStatus: string;
  successfulFulfillments: Array<{
    trackingCompany: string;
    trackingInfo: Array<{ number: string; url: string }>;
  }>;
  statusUrl: string;
  lineItems: Array<{
    title: string;
    quantity: number;
  }>;
  [key: string]: any;
}

${serviceBody}

${apiBody}
`;

fs.writeFileSync('api/admin.ts', fullContent, 'utf-8');
console.log('Successfully generated standalone api/admin.ts! Size:', fullContent.length);
