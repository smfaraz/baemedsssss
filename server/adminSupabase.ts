/**
 * BaeMeds Server-Side Administrative Supabase Client
 * Authorized with service_role secret for authoritative back-office operations:
 * - Orders & fulfillment processing
 * - Inventory updates
 * - HIPAA audit logs
 * - Prescription review pipeline
 */

import { createClient } from '@supabase/supabase-js';

// Polyfill minimal WebSocket constructor if running in older Node.js environments
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {} as any;
}

const getEnvVar = (name: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name];
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

export const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
