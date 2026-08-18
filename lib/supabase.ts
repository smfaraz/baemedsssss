import { createClient } from '@supabase/supabase-js';

// These are public browser credentials. Database protection is enforced by RLS;
// never place a Supabase secret/service-role key in this file.
export const supabase = createClient(
  'https://zyuvvqvbsojathbzcfzi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXZ2cXZic29qYXRoYnpjZnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTA3MjgsImV4cCI6MjEwMDQ2NjcyOH0.dud6yghnqeozK0Yap5uNEBhQiUrYXm6cQmjjeR7EnS0',
);
