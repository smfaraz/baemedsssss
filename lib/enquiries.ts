import { supabase } from './supabase';

export type EnquiryInput = {
  type: 'rental' | 'contact' | 'bulk' | 'availability';
  product?: string;
  name: string;
  phone: string;
  email: string;
  duration?: string;
  message: string;
};

export const submitEnquiry = async (input: EnquiryInput) => {
  const { error } = await supabase.from('enquiries').insert({
    type: input.type,
    product: input.product || null,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim().toLowerCase(),
    rental_duration: input.duration || null,
    message: input.message.trim(),
  });
  if (error) throw error;
};
