import fs from 'node:fs';

const taxServiceContent = fs.readFileSync('server/taxService.ts', 'utf-8');
const emailServiceContent = fs.readFileSync('server/emailService.ts', 'utf-8');
const checkoutContent = fs.readFileSync('api/checkout.ts', 'utf-8');

// Strip top imports from taxService
let taxBody = taxServiceContent
  .replace(/import\s+.*?from\s+['"][^'"]+['"];?/g, '')
  .replace(/\/\*\*[\s\S]*?\*\//, '');

// Strip top imports from emailService
let emailBody = emailServiceContent
  .replace(/import\s+.*?from\s+['"][^'"]+['"];?/g, '')
  .replace(/\/\*\*[\s\S]*?\*\//, '');

// Strip relative server imports from checkoutContent
let checkoutBody = checkoutContent
  .replace(/import\s+\{\s*TaxService,\s*TaxCalculationItem\s*\}\s+from\s+['"]\.\.\/server\/taxService['"];?/g, '')
  .replace(/import\s+\{\s*EmailService\s*\}\s+from\s+['"]\.\.\/server\/emailService['"];?/g, '')
  .replace(/import\s+\{\s*adminSupabase,\s*AdminService,\s*recordFirstPartyOrder\s*\}\s+from\s+['"]\.\/admin['"];?/g, '');

const fullContent = `/**
 * BaeMeds Native Checkout Serverless API Gateway
 * Handles /api/checkout with server-side pricing, tax calculation,
 * inventory validation, order persistence, and transactional email.
 * 
 * Standalone self-contained serverless module with zero relative external imports.
 */

// Polyfill WebSocket in Node environments (Node < 22) to prevent @supabase/supabase-js crashing on boot
if (typeof globalThis !== 'undefined' && !(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = class WebSocket {};
}

import { adminSupabase, AdminService, recordFirstPartyOrder } from './admin';

export interface TaxCalculation {
  subtotal: number;
  taxableAmount: number;
  estimatedTax: number;
  taxRate: number;
  state: string;
  isExempt: boolean;
  exemptionReason?: string;
}

${taxBody}

${emailBody}

${checkoutBody}
`;

fs.writeFileSync('api/checkout.ts', fullContent, 'utf-8');
console.log('Successfully generated standalone api/checkout.ts! Size:', fullContent.length);
