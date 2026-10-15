/**
 * BaeMeds Server-Side Administrative Supabase Client
 * Authorized with service_role secret for authoritative back-office operations:
 * - Orders & fulfillment processing
 * - Inventory updates
 * - HIPAA audit logs
 * - Prescription review pipeline
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
