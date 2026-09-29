/**
 * Market Configuration & Localization for BaeMeds (US Market)
 */

export interface USState {
  code: string;
  name: string;
}

export const US_STATES: USState[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export const US_STATE_CODES = new Set(US_STATES.map((s) => s.code));
export const US_STATE_NAMES = new Set(US_STATES.map((s) => s.name.toLowerCase()));

export const MARKET_CONFIG = {
  market: 'US',
  country: 'United States',
  countryCode: 'US',
  currency: 'USD',
  currencySymbol: '$',
  locale: 'en-US',
  timezone: 'America/New_York',
  defaultState: 'DE',
  defaultZip: '19801',
  supportPhone: '+1 (800) 555-0199',
  supportPhoneRaw: '+18005550199',
  supportEmail: 'support@baemeds.com',
  domain: 'baemeds.com',
  siteUrl: 'https://www.baemeds.com',
  appName: 'BaeMeds',
  companyName: 'BaeMeds Healthcare USA LLC',
  companyAddress: '1209 Orange Street, Wilmington, DE 19801',
};

/**
 * Standard US currency formatter ($xx.xx)
 */
export const formatPrice = (value: number | string | null | undefined): string => {
  const numeric = typeof value === 'number' ? value : parseFloat(String(value || 0));
  if (isNaN(numeric)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

/**
 * Format currency with explicit currency code
 */
export const formatCurrency = (amount: number | string, currency = 'USD'): string => {
  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(numeric)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

/**
 * Validate US ZIP / ZIP+4 format (e.g., "90210" or "90210-1234")
 */
export const isValidUSZip = (zip: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test(zip.trim());
};

/**
 * Validate standard US phone number (supports 10 digits or E.164 +1)
 */
export const isValidUSPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
};

/**
 * Format raw phone into US display format: (XXX) XXX-XXXX
 */
export const formatUSPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  const clean = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (clean.length === 10) {
    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return phone;
};

/**
 * Convert phone to E.164 format (+1XXXXXXXXXX)
 */
export const toE164Phone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
};

/**
 * Validate state name or 2-letter abbreviation
 */
export const isValidUSState = (state: string): boolean => {
  const trimmed = state.trim();
  if (US_STATE_CODES.has(trimmed.toUpperCase())) return true;
  return US_STATE_NAMES.has(trimmed.toLowerCase());
};

/**
 * Normalize state input to 2-letter code
 */
export const normalizeStateCode = (state: string): string => {
  const trimmed = state.trim();
  if (US_STATE_CODES.has(trimmed.toUpperCase())) return trimmed.toUpperCase();
  const match = US_STATES.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
  return match ? match.code : trimmed.toUpperCase();
};

export const getStateName = (codeOrName: string): string => {
  const code = normalizeStateCode(codeOrName);
  const state = US_STATES.find((s) => s.code === code);
  return state ? state.name : codeOrName;
};

export const DEFAULT_COUNTRY = MARKET_CONFIG.country;
export const DEFAULT_COUNTRY_CODE = MARKET_CONFIG.countryCode;
export const DEFAULT_CURRENCY = MARKET_CONFIG.currency;
export const DEFAULT_LOCALE = MARKET_CONFIG.locale;
export const US_MARKET_CONFIG = MARKET_CONFIG;

