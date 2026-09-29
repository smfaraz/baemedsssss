import React from 'react';
import { Product, Category } from './types';
import tm from './public/assets/images/tm.jpeg';
import suctionImage from './public/assets/images/suction-machine.jpg';
import {
  Stethoscope,
  Activity,
  Wind,
  Bed,
  BriefcaseMedical,
  Thermometer,
  Syringe,
  Heart,
  Droplets,
  HeartPulse,
  Zap,
  ShieldCheck,
  Bone,
  Accessibility,
  User,
  Baby,
  Sparkles
} from 'lucide-react';

export const APP_NAME = "BaeMeds";
export const SITE_DOMAIN = "baemeds.com";
export const SITE_URL = "https://www.baemeds.com";
export const CONTACT_PHONE = "+1 (800) 555-0199";
export const CONTACT_PHONE_RAW = "+18005550199";
export const CONTACT_EMAIL = "support@baemeds.com";

export const MARKET = "US";
export const DEFAULT_COUNTRY = "United States";
export const DEFAULT_COUNTRY_CODE = "US";
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_CURRENCY_SYMBOL = "$";
export const DEFAULT_LOCALE = "en-US";
export const DEFAULT_TIMEZONE = "America/New_York";
export const COMPANY_NAME = "BaeMeds Healthcare USA LLC";
export const COMPANY_ADDRESS = "1209 Orange Street, Wilmington, DE 19801";

export const SUPPORT_EMAIL = CONTACT_EMAIL;
export const LEGAL_ENTITY_NAME = COMPANY_NAME;
export const STORE_ADDRESS = COMPANY_ADDRESS;

// Product data is fetched from Shopify.
export const PRODUCTS: Product[] = [];

export const CATEGORIES: Category[] = [
  {
    name: "Oxygen Concentrators",
    icon: <BriefcaseMedical size={28} />,
    slug: "Oxygen Concentrators",
    image: "https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_01_t.png"
  },
  {
    name: "CPAP Machines",
    icon: <Activity size={28} />,
    slug: "CPAP Machines",
    image: "https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Detail/1195496_pkgfront.jpg"
  },
  {
    name: "Wheelchairs",
    icon: <Accessibility size={28} />,
    slug: "Wheelchairs",
    image: "https://dphpia7d6qb4m.cloudfront.net/images/dr-k3_01_t.png"
  },
  {
    name: "BiPAP Machines",
    icon: <Activity size={28} />,
    slug: "BiPAP Machines",
    image: "https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Detail/RESPIR_561425.jpg"
  },
  {
    name: "Patient Monitors",
    icon: <Activity size={28} />,
    slug: "Patient Monitors",
    image: "https://dphpia7d6qb4m.cloudfront.net/images/mq-mq3000_01_t.png"
  },
  {
    name: "Nebulizers",
    icon: <Wind size={28} />,
    slug: "Nebulizers",
    image: "https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Detail/1190300_front.jpg"
  },
  {
    name: "Blood Pressure Monitors",
    icon: <Heart size={28} />,
    slug: "Blood Pressure Monitors",
    image: "https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Detail/363818_pkgfront.jpg"
  },
  {
    name: "Glucometers",
    icon: <Droplets size={28} />,
    slug: "Glucometers",
    image: "https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Detail/854635_ppkgleft_.jpg"
  },
  {
    name: "Suction Machines",
    icon: <Syringe size={28} />,
    slug: "Suction Machines",
    image: "https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Detail/911719_front.jpg"
  },
  {
    name: "Breast Pumps",
    icon: <Baby size={28} />,
    slug: "Breast Pumps",
    image: "https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Detail/1292657_pkit.jpg"
  },
  {
    name: "Incontinence & Care",
    icon: <Sparkles size={28} />,
    slug: "Incontinence & Care",
    image: "https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Detail/165216_ppkgleft.jpg"
  },
  {
    name: "Hospital Furniture",
    icon: <Bed size={28} />,
    slug: "Hospital Furniture",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop"
  }
];
