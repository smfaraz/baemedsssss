import { createClient } from '@supabase/supabase-js';

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  readyState = 3;
  url = '';
  onopen = null;
  onclose = null;
  onerror = null;
  onmessage = null;
  constructor(url?: string) { this.url = url || ''; }
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

const SUPABASE_URL =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://ifadlrhqsgdxeeebjblo.supabase.co';

const SUPABASE_ANON_KEY =
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmYWRscmhxc2dkeGVlZWJqYmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3ODc4ODYsImV4cCI6MjEwNjM2Mzg4Nn0.gY7GxgijgVOAlOthJy8BtMBg6dxS3gXGm8xCUkHBOIs';

// These are public browser credentials. Database protection is enforced by RLS;
// never place a Supabase secret/service-role key in client-side code.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== 'undefined',
  },
  realtime: {
    transport: (typeof globalThis.WebSocket !== 'undefined' ? globalThis.WebSocket : MockWebSocket) as any,
  },
});

