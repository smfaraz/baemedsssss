export const safeReturnPath = (value: string | null, fallback = '/account') => {
  if (!value || value.length > 240) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('\\') || /[\r\n]/.test(value)) return fallback;
  return value;
};
