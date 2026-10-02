import { supabase } from './supabase';
import { isValidUSPhone, toE164Phone } from './marketConfig';

export type EnquiryInput = {
  type: 'rental' | 'contact' | 'bulk' | 'availability';
  product?: string;
  name: string;
  phone: string;
  email: string;
  duration?: string;
  message: string;
};

const sanitize = (text: string): string => {
  return text
    .replace(/[<>'"&\x00]/g, '')
    .replace(/\bon\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

export const submitEnquiry = async (input: EnquiryInput) => {
  const cleanEmail = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  const rawPhone = input.phone.trim();
  if (!isValidUSPhone(rawPhone)) {
    throw new Error('Please enter a valid 10-digit US phone number.');
  }
  const e164Phone = toE164Phone(rawPhone);

  const cleanName = sanitize(input.name);
  if (cleanName.length < 2) {
    throw new Error('Please enter a valid full name.');
  }

  const cleanMessage = sanitize(input.message);
  if (!cleanMessage) {
    throw new Error('Please enter a message or equipment requirement.');
  }

  const { error } = await supabase.from('enquiries').insert({
    type: input.type,
    product: input.product ? sanitize(input.product) : null,
    name: cleanName,
    phone: e164Phone,
    email: cleanEmail,
    rental_duration: input.duration ? sanitize(input.duration) : null,
    message: cleanMessage,
  });

  if (error) {
    throw error;
  }
};
