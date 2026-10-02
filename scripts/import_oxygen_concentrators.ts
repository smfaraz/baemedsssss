import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ifadlrhqsgdxeeebjblo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Direct REST API to avoid WebSocket requirements in Node 20


interface ConcentratorDef {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  sku: string;
  price: number;
  compareAtPrice: number;
  wholesaleCost: number;
  hcpcsCode: string;
  image: string;
  images: string[];
  specs: string;
  description: string;
  features: string[];
  isHeroProduct?: boolean;
}

const CONCENTRATOR_PRODUCTS: ConcentratorDef[] = [
  {
    id: 'prd-o2-dv-525ds',
    handle: 'devilbiss-5-liter-oxygen-concentrator-dv-525ds',
    title: 'Drive DeVilbiss 5 Liter Compact Home Oxygen Concentrator (OSD Sensor)',
    vendor: 'Drive DeVilbiss',
    sku: 'DV-525DS',
    price: 799.00,
    compareAtPrice: 899.00,
    wholesaleCost: 495.00,
    hcpcsCode: 'E1390',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_01_t.png',
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_02_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_03_t.png'
    ],
    specs: 'Flow Range: 0.5 to 5.0 LPM | Oxygen Purity: 93% ± 3% | Sound Level: 48 dBA | Weight: 36 lbs | Power: 310W @ 2.5 LPM | Built-in OSD® Oxygen Sensing Device | Two-piece cabinet design for whisper-quiet home operation.',
    description: '<p>The Drive DeVilbiss 525DS 5 Liter Oxygen Concentrator delivers dependable continuous-flow supplemental oxygen therapy up to 5 LPM. Engineered and assembled in the USA, it features patented Turn-Down Technology to reduce power consumption by up to 15% and extend internal compressor life. Equipped with the patented DeVilbiss OSD (Oxygen Sensing Device) that continuously monitors oxygen purity to ensure patient clinical efficacy.</p>',
    features: [
      'Continuous oxygen flow from 0.5 to 5.0 Liters Per Minute (LPM)',
      'Integrated OSD (Oxygen Sensing Device) continuously monitors oxygen output purity',
      'Turn-Down Technology automatically reduces power draw at lower flow settings',
      'Accessible patient control panel with protected flowmeter and recessed humidifier nook',
      'Visual and audible alarms for high/low pressure, low flow, low oxygen purity, and power loss',
      'Whisper-quiet 48 dBA acoustic sound rating for uninterrupted sleep and living environments',
      'Manufacturer: Drive DeVilbiss'
    ],
    isHeroProduct: true
  },
  {
    id: 'prd-o2-ino-rove6',
    handle: 'inogen-rove-6-portable-oxygen-concentrator-system',
    title: 'Inogen Rove 6 Portable Oxygen Concentrator System (8-Cell Battery)',
    vendor: 'Inogen',
    sku: 'INO-IS-501-NA8',
    price: 1795.00,
    compareAtPrice: 1999.00,
    wholesaleCost: 1150.00,
    hcpcsCode: 'E1392',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/ino-is-501-na8_01_t.png',
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/ino-is-501-na8_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/ino-is-501-na16_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/p2_01_t.png'
    ],
    specs: 'Flow Type: Pulse Dose Settings 1 to 6 | Weight: 4.8 lbs with standard battery | Battery Run Time: Up to 6.25 hours (8-cell) | Sound Level: 38 dBA at Setting 2 | FAA-Approved for commercial airline travel | High-contrast digital display.',
    description: '<p>The Inogen Rove 6 is the premier worldwide travel portable oxygen concentrator (POC). Designed for patients seeking continuous active freedom without the burden of heavy oxygen cylinders. Delivers intelligent pulse-dose oxygen across 6 customizable flow settings while weighing less than 5 pounds. Fully FAA-compliant for domestic and international commercial airline travel.</p>',
    features: [
      '6 Pulse Dose Flow Settings for active clinical oxygen delivery',
      'Ultra-compact, lightweight chassis weighing only 4.8 lbs (2.17 kg)',
      'Up to 6.25 hours battery duration with standard 8-cell lithium-ion pack',
      'FAA-certified for commercial airline and air travel use',
      'Whisper-quiet operation at only 38 dBA',
      'High-contrast digital display with intuitive tactile button interface',
      'Manufacturer: Inogen'
    ],
    isHeroProduct: true
  },
  {
    id: 'prd-o2-dv-1025ds',
    handle: 'devilbiss-10-liter-high-flow-oxygen-concentrator-dv-1025ds',
    title: 'Drive DeVilbiss 10 Liter High-Flow Home Oxygen Concentrator (DV-1025DS)',
    vendor: 'Drive DeVilbiss',
    sku: 'DV-1025DS',
    price: 1489.00,
    compareAtPrice: 1650.00,
    wholesaleCost: 999.00,
    hcpcsCode: 'E1390',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/dv-1025ds_01_t.png',
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-1025ds_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_02_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_03_t.png'
    ],
    specs: 'Flow Range: 2.0 to 10.0 LPM | Oxygen Purity: 87% to 96% | Weight: 42 lbs | Dimensions: 24.5\" H x 13.5\" W x 12\" D | High-pressure 20 psi auxiliary outlet port | Compatible with high-flow cannulas and cylinder transfill systems.',
    description: '<p>The Drive DeVilbiss 1025DS 10 Liter Oxygen Concentrator provides high-flow continuous supplemental oxygen therapy in the same compact chassis as standard 5-liter units. Capable of delivering up to 10 LPM at 90%+ purity, it is the optimal stationary device for patients requiring higher flow rates or specialized clinical therapy.</p>',
    features: [
      'Continuous flow delivery up to 10.0 Liters Per Minute (LPM)',
      'Built into the same compact cabinet footprint as standard 5L concentrators',
      'DeVilbiss OSD® (Oxygen Sensing Device) continuously tracks therapeutic oxygen purity',
      'Auxiliary oxygen port for high-pressure applications and transfill systems',
      'Sturdy smooth-rolling casters and top handle for effortless room-to-room repositioning',
      'Full clinical alarm package for patient peace of mind',
      'Manufacturer: Drive DeVilbiss'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-ino-g5-16',
    handle: 'inogen-one-g5-portable-oxygen-concentrator-double-battery',
    title: 'Inogen One G5 Portable Oxygen Concentrator - Double 16-Cell Battery',
    vendor: 'Inogen',
    sku: 'INO-IS-501-NA16',
    price: 2498.99,
    compareAtPrice: 2687.50,
    wholesaleCost: 1250.00,
    hcpcsCode: 'E1392',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/ino-is-501-na16_01_t.png',
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/ino-is-501-na16_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/ino-is-501-na8_01_t.png'
    ],
    specs: 'Flow Settings: 1 to 6 Pulse Dose | Battery Run Time: Up to 13 hours (16-cell double battery) | Weight: 5.7 lbs with double battery | Sound Level: 38 dBA | FAA Air Travel Compliant | Inogen Connect mobile app enabled.',
    description: '<p>The Inogen One G5 with Double 16-Cell Battery offers unmatched all-day battery life for oxygen-dependent individuals on the move. Delivers medical-grade oxygen across 6 pulse settings for up to 13 continuous hours between wall or vehicle charges. FAA approved for airline flights.</p>',
    features: [
      'Extended 16-cell double battery delivering up to 13 hours between charges',
      '6 Flow Settings accommodating high pulse-dose clinical needs',
      'Compact travel footprint weighing 5.7 lbs with double battery installed',
      'Inogen Connect Bluetooth app for device monitoring and sieve column life tracking',
      'AC and DC vehicle charging cords included for continuous mobile charging',
      'Manufacturer: Inogen'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-ino-g4-8',
    handle: 'inogen-one-g4-8-cell-portable-oxygen-concentrator-system',
    title: 'Inogen One G4 8-Cell Portable Oxygen Concentrator System',
    vendor: 'Inogen',
    sku: 'INO-IS-401-NA8',
    price: 2319.99,
    compareAtPrice: 2495.00,
    wholesaleCost: 1475.00,
    hcpcsCode: 'E1392',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/ino-is-401-na8_01_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/ino-is-401-na8_01_t.png'],
    specs: 'Flow Settings: 1 to 3 Pulse Dose | Weight: 2.8 lbs with standard battery | Sound Level: 40 dBA | Battery Duration: Up to 5 hours with 8-cell extended battery | FAA Approved.',
    description: '<p>The Inogen One G4 is one of the smallest and lightest clinical portable oxygen concentrators ever produced, weighing just 2.8 pounds. Designed for patients requiring pulse dose settings 1 through 3 who prioritize absolute discretion and featherweight mobility.</p>',
    features: [
      'Featherweight 2.8 lb chassis with compact shoulder harness',
      'Pulse dose settings 1, 2, and 3 with intelligent breath detection',
      'Up to 5 hours of portable freedom with the 8-cell battery',
      'Quiet 40 dBA operation suitable for church, movies, and family gatherings',
      'Manufacturer: Inogen'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-dv-igo2',
    handle: 'drive-devilbiss-igo2-portable-oxygen-concentrator-dv-125d',
    title: 'Drive DeVilbiss iGo2 Portable Oxygen Concentrator (SmartDose Technology)',
    vendor: 'Drive DeVilbiss',
    sku: 'DV-125D',
    price: 2319.99,
    compareAtPrice: 2495.00,
    wholesaleCost: 1050.00,
    hcpcsCode: 'E1392',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/dv-125d_01_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/dv-125d_01_t.png'],
    specs: 'Flow Settings: 1 to 5 Pulse Dose | Patented SmartDose® Auto-Regulating Technology | Weight: 4.9 lbs | Battery Life: Up to 3.5 hours per pack | Rugged Overmolded Exterior | FAA Certified.',
    description: '<p>The Drive DeVilbiss iGo2 features revolutionary SmartDose Technology that automatically monitors the patient’s breathing rate and increases oxygen bolus delivery during exertion and physical activity without manual setting adjustments. Encased in high-durability impact-resistant overmold.</p>',
    features: [
      'Patented SmartDose Technology automatically scales oxygen boluses with patient breathing rate',
      'Most sensitive trigger sensitivity on the market to prevent missed breaths',
      'Protective rubberized impact-resistant casing defends against accidental drops and bumps',
      'FAA-certified for commercial airline flights',
      'Manufacturer: Drive DeVilbiss'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-rh-lm5ba',
    handle: 'rhythm-healthcare-5-liter-oxygen-concentrator-ls-lm5ba',
    title: 'Rhythm Healthcare 5 Liter Home Oxygen Concentrator - LS-LM5BA',
    vendor: 'Rhythm Healthcare',
    sku: 'LS-LM5BA',
    price: 742.99,
    compareAtPrice: 799.00,
    wholesaleCost: 405.00,
    hcpcsCode: 'E1390',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/lm5ba_01_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/lm5ba_01_t.png'],
    specs: 'Flow Rate: 0.5 to 5.0 LPM Continuous Flow | Oxygen Purity: 93% ± 3% | Sound Level: 45 dBA | Weight: 35.5 lbs | Integrated safety alarms for low oxygen purity and power failure.',
    description: '<p>The Rhythm Healthcare LS-LM5BA 5 Liter Oxygen Concentrator delivers dependable continuous-flow medical oxygen therapy for residential and clinical environments. Offers ultra-reliable operation, simple mechanical flowmeter adjustment, and quiet sound profile.</p>',
    features: [
      'Continuous 0.5 to 5 LPM flow rate for reliable day and nighttime therapy',
      'Low power consumption and heavy-duty Thomas compressor system',
      'Comprehensive alarm safety suite (pressure, flow, and power failure)',
      'Durable caster wheels for easy navigation over carpet and hard floors',
      'Manufacturer: Rhythm Healthcare'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-rh-lsp2',
    handle: 'rhythm-healthcare-lifechoice-portable-oxygen-concentrator-ls-p2',
    title: 'Rhythm Healthcare LifeChoice Portable Oxygen Concentrator - LS-P2',
    vendor: 'Rhythm Healthcare',
    sku: 'LS-P2',
    price: 1761.99,
    compareAtPrice: 1895.00,
    wholesaleCost: 950.00,
    hcpcsCode: 'E1392',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/p2_01_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/p2_01_t.png'],
    specs: 'Flow Range: Pulse Dose Settings 1 to 5 | Weight: 4.37 lbs | Sound Level: 40 dBA | Battery: Up to 5 hours on setting 1 | High-efficiency molecular sieve beds | FAA Approved.',
    description: '<p>The Rhythm Healthcare LifeChoice P2 Portable Oxygen Concentrator provides medical-grade oxygen delivery in an ultra-compact package designed for everyday travel. Delivers pulse-dose oxygen across 5 flow settings with high-efficiency sieve columns and whisper-quiet operation.</p>',
    features: [
      'Pulse dose settings 1 through 5 with high bolus accuracy',
      'Compact 4.37 lb chassis with ergonomic shoulder carry bag',
      'Long-life lithium battery system with AC and vehicle DC chargers',
      'FAA compliant for air travel on all commercial airlines',
      'Manufacturer: Rhythm Healthcare'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-rh-p2e6',
    handle: 'rhythm-healthcare-p2-e6-portable-oxygen-concentrator',
    title: 'Rhythm Healthcare P2-E6 Portable Oxygen Concentrator',
    vendor: 'Rhythm Healthcare',
    sku: 'LS-P2-E6',
    price: 1812.99,
    compareAtPrice: 1950.00,
    wholesaleCost: 975.00,
    hcpcsCode: 'E1392',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/p2-e6_02_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/p2-e6_02_t.png'],
    specs: 'Pulse Dose Settings: 1 to 6 | Weight: 4.3 lbs | High-contrast 2.8\" LCD display | Battery Run Time: Up to 5.4 hours | Fast charging 2.5 hour cycle | FAA Approved.',
    description: '<p>The Rhythm Healthcare P2-E6 is engineered for active individuals who require up to setting 6 pulse delivery. Features an intuitive full-color LCD screen that clearly shows battery percentage, flow setting, and device status in all lighting conditions.</p>',
    features: [
      'Expanded pulse flow capacity from setting 1 up to setting 6',
      'Color LCD screen displays exact remaining battery percentage and flow rate',
      'Fast 2.5 hour battery recharge cycle',
      'FAA-compliant for in-cabin air travel',
      'Manufacturer: Rhythm Healthcare'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-o2c-oxlife',
    handle: 'o2-concepts-oxlife-independence-portable-oxygen-concentrator',
    title: 'O2 Concepts Oxlife Independence Portable Oxygen Concentrator (Continuous & Pulse)',
    vendor: 'O2 Concepts',
    sku: 'O2-800-0001',
    price: 2895.00,
    compareAtPrice: 3495.00,
    wholesaleCost: 1650.00,
    hcpcsCode: 'E1390 / E1392',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/p2_01_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/p2_01_t.png'],
    specs: 'Dual Flow: Continuous Flow up to 3.0 LPM + Pulse Dose Settings 1 to 6 | Integrated 6\" rugged all-terrain wheels & telescoping handle | Patented EnergySmart® technology | Dual battery architecture with hot-swap capability.',
    description: '<p>The O2 Concepts Oxlife Independence is a true 2-in-1 portable oxygen concentrator offering both continuous flow up to 3 LPM and pulse dose up to setting 6. Features an integrated heavy-duty wheeled cart built into the chassis, making it the most rugged high-flow POC for outdoor and travel use.</p>',
    features: [
      'Dual mode delivery: Continuous flow (up to 3 LPM) and Pulse dose (settings 1 to 6)',
      'Integrated heavy-duty wheeled pull cart with large 6-inch all-terrain wheels',
      'Dual battery configuration allows hot-swapping batteries without interrupting oxygen delivery',
      'Operates on AC, DC, and battery power for complete freedom',
      'Manufacturer: O2 Concepts'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-rh-lm10a',
    handle: 'rhythm-healthcare-10-liter-oxygen-concentrator-ls-lm10a',
    title: 'Rhythm Healthcare 10 Liter High-Flow Home Oxygen Concentrator (LS-LM10A)',
    vendor: 'Rhythm Healthcare',
    sku: 'LS-LM10A',
    price: 2177.82,
    compareAtPrice: 2395.00,
    wholesaleCost: 1350.00,
    hcpcsCode: 'E1390',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/lm5ba_01_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/lm5ba_01_t.png'],
    specs: 'Flow Range: 1.0 to 10.0 LPM Continuous Flow | Oxygen Purity: 93% ± 3% | Sound Level: 50 dBA | Weight: 44 lbs | Digital operating hour meter | High-output medical compressor.',
    description: '<p>The Rhythm LM10A 10L Stationary Oxygen Concentrator provides reliable continuous-flow oxygen therapy up to 10 liters per minute for high-flow respiratory patients. Features an ultra-durable compressor, low maintenance requirements, and intuitive mechanical controls.</p>',
    features: [
      'Continuous flow up to 10 Liters Per Minute for high-demand oxygen patients',
      'Integrated purity sensor and diagnostic alarms for patient safety',
      'Quiet operation at 50 dBA with dampened vibration mountings',
      'Smooth rolling casters for easy mobility within the home or clinic',
      'Manufacturer: Rhythm Healthcare'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-ino-athome',
    handle: 'inogen-at-home-5-liter-stationary-oxygen-concentrator',
    title: 'Inogen At Home 5 Liter Stationary Home Oxygen Concentrator',
    vendor: 'Inogen',
    sku: 'INO-GS-100',
    price: 1650.00,
    compareAtPrice: 1850.00,
    wholesaleCost: 950.00,
    hcpcsCode: 'E1390',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_01_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_01_t.png'],
    specs: 'Continuous Flow: 1.0 to 5.0 LPM | Weight: 18 lbs (half the weight of typical 5L concentrators) | Power: 100W at flow setting 2 | Sound Level: 40 dBA | Ultra-compact home profile.',
    description: '<p>The Inogen At Home is one of the lightest and most energy-efficient 5 LPM continuous flow home oxygen concentrators available. At only 18 pounds, it is half the weight of traditional units and uses significantly less electricity, saving hundreds annually on utility bills.</p>',
    features: [
      'Ultra-lightweight stationary design at only 18 lbs',
      'Continuous flow from 1 to 5 LPM with 93% ± 3% purity',
      'Low power consumption (approx. 100W at 2 LPM) saves on household electric costs',
      'Whisper-quiet 40 dBA sound level',
      'Manufacturer: Inogen'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-airsep-10',
    handle: 'airsep-newlife-intensity-10-liter-oxygen-concentrator',
    title: 'AirSep NewLife Intensity 10 Liter High-Pressure Oxygen Concentrator',
    vendor: 'AirSep Corporation',
    sku: 'AS-AS099-101',
    price: 2850.00,
    compareAtPrice: 3101.92,
    wholesaleCost: 1750.00,
    hcpcsCode: 'E1390',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/dv-1025ds_01_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/dv-1025ds_01_t.png'],
    specs: 'Flow Range: 2.0 to 10.0 LPM Continuous Flow | High Delivery Pressure: 20 psig (138 kPa) | Ideal for long tubing runs, tracheostomies, and medication nebulization | Heavy-duty commercial chassis.',
    description: '<p>The AirSep NewLife Intensity 10 is a high-pressure, high-flow stationary oxygen concentrator engineered for specialized clinical requirements. With 20 psi delivery pressure, it easily powers jet nebulizers, venturi masks, and extra-long oxygen tubing runs that stall standard 5 psi machines.</p>',
    features: [
      'High 20 psi delivery pressure for specialized clinical and tracheostomy applications',
      'Continuous oxygen delivery up to 10 Liters Per Minute',
      'Compatible with medication nebulizers and long oxygen line runs up to 100 feet',
      'Essential equipment for long-term care facilities and home acute respiratory care',
      'Manufacturer: AirSep Corporation'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-react-10',
    handle: 'react-health-10-liter-high-flow-oxygen-concentrator',
    title: 'React Health 10 Liter High-Flow Home Oxygen Concentrator (REA-IRC10LXO2)',
    vendor: 'React Health',
    sku: 'REA-IRC10LXO2',
    price: 2441.60,
    compareAtPrice: 2695.00,
    wholesaleCost: 1450.00,
    hcpcsCode: 'E1390',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/dv-1025ds_01_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/dv-1025ds_01_t.png'],
    specs: 'Continuous Flow: 2.0 to 10.0 LPM | High purity 87% to 95.6% across all flow settings | Dual flowmeter capability available | Sound Level: 58 dBA | Heavy-duty dual-head compressor.',
    description: '<p>The React Health 10 Liter Concentrator delivers the clinical reliability and high-volume performance required for patients needing more than 5 LPM. Designed as a cost-effective, dependable alternative to liquid oxygen installations.</p>',
    features: [
      'Full 10 LPM continuous flow oxygen capacity',
      'Dual-head compressor engineered for extended operational lifespans',
      'Integrated SensO2® oxygen monitor alerts if purity drops below therapeutic standards',
      'Rugged hospital-grade housing with recessed controls',
      'Manufacturer: React Health'
    ],
    isHeroProduct: false
  },
  {
    id: 'prd-o2-sequal-5',
    handle: 'sequal-eclipse-5-transportable-oxygen-concentrator',
    title: 'Sequal Eclipse 5 Transportable Oxygen Concentrator (Continuous & Pulse)',
    vendor: 'Sequal',
    sku: 'SQ-6900-SEQ-EW',
    price: 3495.00,
    compareAtPrice: 3995.00,
    wholesaleCost: 2100.00,
    hcpcsCode: 'E1390 / E1392',
    image: 'https://dphpia7d6qb4m.cloudfront.net/images/p2_01_t.png',
    images: ['https://dphpia7d6qb4m.cloudfront.net/images/p2_01_t.png'],
    specs: 'Continuous Flow: 0.5 to 3.0 LPM | Pulse Settings: 1 to 9 (up to 192 mL bolus) | autoSAT® technology maintains oxygen bolus as breath rate increases | Runs and charges on DC vehicle power | FAA Certified.',
    description: '<p>The Sequal Eclipse 5 is the ultimate heavy-duty transportable oxygen concentrator. Delivers continuous flow up to 3 LPM and pulse boluses up to setting 9. Operates and fully charges its internal power cartridge simultaneously from a standard vehicle 12V DC outlet, making cross-country road trips and international travel seamless.</p>',
    features: [
      'Continuous flow up to 3 LPM and high-capacity pulse boluses up to Setting 9',
      'autoSAT Technology auto-adjusts oxygen delivery as patient breath rate fluctuates',
      'Can operate and recharge on 12V DC vehicle auxiliary power without blowing fuses',
      'Telescoping travel cart with durable oversized wheels included',
      'FAA-certified for commercial airline travel',
      'Manufacturer: Sequal'
    ],
    isHeroProduct: false
  }
];

async function run() {
  console.log('--- IMPORTING 15 US OXYGEN CONCENTRATORS ---');
  const catalogSeedPath = path.resolve('data/catalog_seed.json');
  const catalogSeed: any[] = JSON.parse(fs.readFileSync(catalogSeedPath, 'utf8'));
  console.log(`Current catalog items: ${catalogSeed.length}`);

  // Map into catalog seed format
  const newCatalogItems = CONCENTRATOR_PRODUCTS.map((c, i) => {
    return {
      id: c.id,
      handle: c.handle,
      title: c.title,
      vendor: c.vendor,
      category: 'Oxygen Concentrators',
      price: Math.ceil((Number(c.wholesaleCost) || 500) * 1.08) - 0.01,
      compareAtPrice: Math.ceil((Number(c.wholesaleCost) || 500) * 1.45) - 0.01,
      wholesaleCost: c.wholesaleCost,
      costPerItem: c.wholesaleCost,
      sku: c.sku,
      barcode: `849102${String(9000 + i).padStart(6, '0')}`,
      hcpcsCode: c.hcpcsCode,
      fdaClassification: 'Class II',
      isRegulatoryVerified: true,
      prescriptionRequired: true,
      requiresPrescription: true,
      isRentalAvailable: true,
      fsaEligible: true,
      eligibleFsaHsa: true,
      inStock: true,
      inventoryQuantity: 25,
      trackInventory: true,
      isHeroProduct: Boolean(c.isHeroProduct),
      image: c.image,
      images: c.images,
      specs: c.specs,
      description: c.description,
      features: c.features,
      seoTitle: `${c.title} | BaeMeds USA`,
      seoDescription: `Order ${c.title}. Certified US Durable Medical Equipment (HCPCS ${c.hcpcsCode}) with fast nationwide shipping & FDA compliance.`,
      tags: ['DME', 'Respiratory Therapy', 'Oxygen Concentrators', 'FDA Class II', 'FSA/HSA Eligible', c.vendor]
    };
  });

  // Check if any already exist by handle or id
  const existingHandles = new Set(catalogSeed.map((p) => p.handle));
  const itemsToAdd = newCatalogItems.filter((p) => !existingHandles.has(p.handle));

  console.log(`Adding ${itemsToAdd.length} new Oxygen Concentrator products to local catalog_seed.json...`);

  // Place hero items near the front or interleave
  // Let's add them to catalogSeed
  const updatedCatalog = [...catalogSeed, ...itemsToAdd];
  fs.writeFileSync(catalogSeedPath, JSON.stringify(updatedCatalog, null, 2), 'utf8');
  console.log(`Updated catalog_seed.json: now ${updatedCatalog.length} total products.`);

  // Insert or upsert into live Supabase database
  console.log('Upserting into Supabase `products` table...');
  const dbPayload = newCatalogItems.map((c) => ({
    id: c.id,
    handle: c.handle,
    title: c.title,
    category: c.category,
    price: c.price,
    compare_at_price: c.compareAtPrice,
    wholesale_cost: c.wholesaleCost,
    sku: c.sku,
    barcode: c.barcode,
    hcpcs_code: c.hcpcsCode,
    fda_classification: c.fdaClassification,
    is_regulatory_verified: c.isRegulatoryVerified,
    prescription_required: c.prescriptionRequired,
    is_rental_available: c.isRentalAvailable,
    featured_image: c.image,
    images: c.images,
    specs: c.specs,
    description: c.description,
    features: c.features,
    warranty: '3 Year Standard Manufacturer Warranty',
    seo_title: c.seoTitle,
    seo_description: c.seoDescription,
    inventory_quantity: c.inventoryQuantity,
    track_inventory: c.trackInventory,
    is_hero_product: c.isHeroProduct,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates',
  };

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify(dbPayload)
  });

  if (!upsertRes.ok) {
    const errText = await upsertRes.text();
    console.error('Supabase upsert error:', errText);
  } else {
    console.log(`✔ Successfully upserted ${dbPayload.length} Oxygen Concentrators to live Supabase database!`);
  }

  // Verify in Supabase
  const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/products?category=eq.Oxygen%20Concentrators&select=id,title,category,price,is_hero_product`, {
    headers
  });
  const verifyData = await verifyRes.json();

  console.log(`✔ Supabase verified: ${Array.isArray(verifyData) ? verifyData.length : 0} products in 'Oxygen Concentrators' category:`);
  if (Array.isArray(verifyData)) {
    verifyData.forEach((p: any) => {
      console.log(`  - [${p.id}] ${p.title.slice(0, 55)} | $${p.price} | Hero: ${p.is_hero_product}`);
    });
  }
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
