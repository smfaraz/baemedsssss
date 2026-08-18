import { supabase } from './supabase';

export async function subscribeToNewsletter(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase.from('newsletter_subscribers').upsert(
    { email: normalizedEmail }, { onConflict: 'email', ignoreDuplicates: true },
  );
  if (error) { console.error('Newsletter signup failed', error); throw new Error('We could not complete your signup. Please try again.'); }
}
