export interface InvoiceSettings {
  // Brand & Legal Entity
  companyName: string;
  legalEntity: string;
  tagline: string;
  logoUrl?: string;
  einTaxId: string;
  dmeLicenseNumber: string;
  npiNumber: string;
  medicarePtan: string;

  // Contact & Remittance
  remitAddressLine1: string;
  remitAddressLine2: string;
  remitCityStateZip: string;
  phone: string;
  email: string;
  website: string;

  // Display Toggles
  showHcpcsCodes: boolean;
  showSku: boolean;
  showSerialNumbers: boolean;
  showBarcodes: boolean;
  showPhysicianBlock: boolean;
  showSignatureLine: boolean;
  showPaymentTerms: boolean;
  showReturnPolicy: boolean;

  // Payment Terms & Banking Instructions
  paymentTerms: string;
  bankRoutingInfo: string;
  checkPayableTo: string;

  // Footers & Clinical Disclaimers
  footerNote: string;
  warrantyDisclaimer: string;
  hygienePolicyNotice: string;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  companyName: 'BaeMeds Healthcare USA',
  legalEntity: 'BaeMeds Medical Systems LLC',
  tagline: 'Durable Medical Equipment & Clinical Home Healthcare Solutions',
  logoUrl: '',
  einTaxId: '88-4910291',
  dmeLicenseNumber: 'DE-DPH-DME-2026-8819',
  npiNumber: '1982740192 (Type 2 DMEPOS)',
  medicarePtan: 'BM-MED-882910',

  remitAddressLine1: '1201 N Orange St, Ste 700',
  remitAddressLine2: 'Attn: Accounts Receivable & Billing',
  remitCityStateZip: 'Wilmington, DE 19801',
  phone: '(800) 555-BAEMEDS',
  email: 'billing@baemeds.com',
  website: 'www.baemeds.com',

  showHcpcsCodes: true,
  showSku: true,
  showSerialNumbers: true,
  showBarcodes: true,
  showPhysicianBlock: true,
  showSignatureLine: true,
  showPaymentTerms: true,
  showReturnPolicy: true,

  paymentTerms: 'Payment due upon receipt. Net 30 terms active for authorized hospital & clinic accounts.',
  bankRoutingInfo: 'ACH / Wire Remittance: JPMorgan Chase Bank | Routing (ABA): 021000021 | Beneficiary: BaeMeds Medical Systems LLC',
  checkPayableTo: 'BaeMeds Medical Systems LLC (Include Order # in memo line)',

  footerNote: 'FDA Registered Medical Device Establishment | State Licensed DMEPOS Distributor | HIPAA Secure Fulfillment',
  warrantyDisclaimer: 'Equipment warranted against manufacturer defects. Retain this invoice and device serial number for warranty claims.',
  hygienePolicyNotice: 'Notice: Opened sanitary and personal patient-contact DME cannot be restocked without certified biomedical decontamination.',
};

const STORAGE_KEY = 'baemeds_invoice_settings_v1';

export const getInvoiceSettings = (): InvoiceSettings => {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_INVOICE_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INVOICE_SETTINGS;
    return { ...DEFAULT_INVOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_INVOICE_SETTINGS;
  }
};

export const saveInvoiceSettings = (settings: InvoiceSettings): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
