import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://ifadlrhqsgdxeeebjblo.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWRscmhxc2dkeGVlZWJqYmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3ODc4ODYsImV4cCI6MjEwNjM2Mzg4Nn0.gY7GxgijgVOAlOthJy8BtMBg6dxS3gXGm8xCUkHBOIs';

// Polyfill minimal WebSocket constructor if running in older Node.js environments
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class {} as any;
}

// These are public browser credentials. Database protection is enforced by RLS;
// never place a Supabase secret/service-role key in client-side code.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== 'undefined',
  },
});

