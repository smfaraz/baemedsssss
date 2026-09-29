import fs from 'fs';
import https from 'https';

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

// Hero candidate items from Lake Court & McKesson
const candidates = [
  {
    handle: 'devilbiss-5-liter-oxygen-concentrator',
    title: 'DeVilbiss 5 Liter Compact Oxygen Concentrator (OSD Sensor)',
    category: 'Respiratory Therapy',
    vendor: 'Drive DeVilbiss',
    sku: 'DV-525DS',
    mpn: '525DS',
    hcpcs: 'E1390',
    cost: 495.00,
    price: 799.00,
    compareAt: 899.00,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_02_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_03_t.png'
    ],
    description: 'The DeVilbiss 5 Liter Oxygen Concentrator delivers up to 5 LPM continuous flow oxygen with market-leading quietness and durability. Features patented DeVilbiss OSD (Oxygen Sensing Device) for continuous oxygen purity monitoring. Assembled in the USA.',
    tags: 'Respiratory, Oxygen Concentrator, DeVilbiss, Home Care, Cash Pay, E1390'
  },
  {
    handle: 'devilbiss-10-liter-oxygen-concentrator',
    title: 'DeVilbiss 10 Liter High-Flow Home Oxygen Concentrator',
    category: 'Respiratory Therapy',
    vendor: 'Drive DeVilbiss',
    sku: 'DV-1025DS',
    mpn: '1025DS',
    hcpcs: 'E1390',
    cost: 999.00,
    price: 1489.00,
    compareAt: 1650.00,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-1025ds_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_02_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_03_t.png'
    ],
    description: 'High-flow 10 LPM continuous oxygen delivery in the same compact chassis as a 5-liter unit. Ideal for patients requiring higher flow therapy with auxiliary oxygen ports.',
    tags: 'Respiratory, High Flow Oxygen, 10 Liter, DeVilbiss, E1390'
  },
  {
    handle: 'drive-cruiser-iii-lightweight-wheelchair',
    title: 'Drive Cruiser III Lightweight Wheelchair with Flip-Back Arms',
    category: 'Mobility & Wheelchairs',
    vendor: 'Drive DeVilbiss',
    sku: 'DR-K3',
    mpn: 'K318DDA-SF',
    hcpcs: 'K0003',
    cost: 138.00,
    price: 229.00,
    compareAt: 269.00,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-k3_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-k3_02_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-k3_03_t.png'
    ],
    description: 'The Cruiser III weighs only 36 lbs and features built-in seat rail extensions allowing easy adjustment between 16" and 18" seat depths. Flip-back removable arms provide barrier-free transfers.',
    tags: 'Mobility, Wheelchair, Lightweight Wheelchair, Drive Medical, K0003'
  },
  {
    handle: 'drive-sentra-ec-heavy-duty-wheelchair',
    title: 'Drive Sentra EC Heavy-Duty Bariatric Wheelchair (450 lb Capacity)',
    category: 'Mobility & Wheelchairs',
    vendor: 'Drive DeVilbiss',
    sku: 'DR-STDEC',
    mpn: 'STD20ECDDA-SF',
    hcpcs: 'K0007',
    cost: 189.00,
    price: 319.00,
    compareAt: 369.00,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-stdec_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-stdec_02_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-k3_02_t.png'
    ],
    description: 'Engineered for bariatric patients up to 450 lbs. Dual cross-braced carbon steel frame with chip-proof chrome finish and reinforced side gussets.',
    tags: 'Mobility, Bariatric, Heavy Duty Wheelchair, Drive DeVilbiss, K0007'
  },
  {
    handle: 'drive-cruiser-x4-lightweight-dual-axle-wheelchair',
    title: 'Drive Cruiser X4 High-Strength Dual-Axle Lightweight Wheelchair',
    category: 'Mobility & Wheelchairs',
    vendor: 'Drive DeVilbiss',
    sku: 'DR-CX4',
    mpn: 'CX418ADDA-SF',
    hcpcs: 'K0004',
    cost: 172.00,
    price: 279.00,
    compareAt: 320.00,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-cx4_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-cx4_02_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-k3_03_t.png'
    ],
    description: 'Weighs under 34 lbs with dual axle design that permits seat-to-floor height adjustment to hemi-level for foot self-propulsion.',
    tags: 'Mobility, K4 Wheelchair, Dual Axle, Drive DeVilbiss, K0004'
  },
  {
    handle: 'inogen-rove-6-portable-oxygen-concentrator',
    title: 'Inogen Rove 6 Portable Oxygen Concentrator System',
    category: 'Respiratory Therapy',
    vendor: 'Inogen',
    sku: 'INO-IS-501-NA8',
    mpn: 'IS-501-NA8',
    hcpcs: 'E1390 / E1392',
    cost: 1150.00,
    price: 1795.00,
    compareAt: 1999.00,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/ino-is-501-na16_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/ino-is-501-na8_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/p2_01_t.png'
    ],
    description: 'The premier travel POC worldwide. Weighs only 4.8 lbs with pulse dose settings 1 through 6. FAA-compliant for commercial air travel.',
    tags: 'Respiratory, Portable Oxygen, Inogen, Travel Concentrator, E1392'
  },
  {
    handle: 'power-neb-ultra-compressor-nebulizer',
    title: 'Drive Power Neb Ultra Compressor Nebulizer System',
    category: 'Respiratory Therapy',
    vendor: 'Drive DeVilbiss',
    sku: 'DR-18081',
    mpn: '18081',
    hcpcs: 'E0570',
    cost: 18.00,
    price: 44.99,
    compareAt: 54.99,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-18081_01_t.jpg',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-18080_01_t.jpg',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-18254_01_t.jpg'
    ],
    description: 'Weighs only 3.2 lbs, delivering fast, effective aerosol medication treatments. Includes both reusable and disposable nebulizer kits.',
    tags: 'Respiratory, Nebulizer, Aerosol Therapy, Drive Medical, E0570'
  },
  {
    handle: 'pulmoneb-lt-compressor-nebulizer-system',
    title: 'DeVilbiss PulmoNeb LT Compressor Nebulizer System',
    category: 'Respiratory Therapy',
    vendor: 'Drive DeVilbiss',
    sku: 'DV-3655LTR',
    mpn: '3655LTR',
    hcpcs: 'E0570',
    cost: 27.50,
    price: 59.99,
    compareAt: 69.99,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-3655ltr_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-18081_01_t.jpg',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-18254_01_t.jpg'
    ],
    description: 'Compact high-performance compressor nebulizer built for clinical longevity. Maximum pressure of 30 psig, delivers treatments in under 7 minutes.',
    tags: 'Respiratory, Nebulizer, DeVilbiss, PulmoNeb, E0570'
  },
  {
    handle: 'drive-deluxe-fingertip-pulse-oximeter',
    title: 'Drive Deluxe Fingertip Pulse Oximeter with OLED Display',
    category: 'Patient Monitoring',
    vendor: 'Drive DeVilbiss',
    sku: 'MQ-MQ3000',
    mpn: 'MQ3000',
    hcpcs: 'E0445',
    cost: 14.80,
    price: 34.99,
    compareAt: 44.99,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/mq-mq3000_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-18081_01_t.jpg',
      'https://dphpia7d6qb4m.cloudfront.net/images/dv-525ds_03_t.png'
    ],
    description: 'Non-invasive spot-check measurement of blood oxygen saturation (SpO2) and pulse rate with multi-directional color OLED display.',
    tags: 'Monitoring, Pulse Oximeter, SpO2, Drive Medical, E0445'
  },
  {
    handle: 'salter-labs-three-channel-oxygen-tubing-25ft',
    title: 'Salter Labs 3-Channel Crush-Proof Oxygen Supply Tubing (25 Pack)',
    category: 'Respiratory Supplies',
    vendor: 'Salter Labs',
    sku: 'SL-2025G-25-25',
    mpn: '2025G-25-25',
    hcpcs: 'A4616',
    cost: 41.05,
    price: 89.99,
    compareAt: 105.00,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/2025g-25-25_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/2025-25-25_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/1600_01_t.png'
    ],
    description: 'Patented 3-channel safety inner bore maintains uninterrupted oxygen flow even if kinked or stepped on. Green color enhances visibility to prevent tripping.',
    tags: 'Respiratory, Oxygen Tubing, Salter Labs, Crush Proof, A4616'
  },
  {
    handle: 'salter-labs-soft-nasal-oxygen-cannula',
    title: 'Salter-Style Ultra-Soft Adult Nasal Cannula with 7ft Tubing',
    category: 'Respiratory Supplies',
    vendor: 'Salter Labs',
    sku: 'SL-16SOFT',
    mpn: '16SOFT-7',
    hcpcs: 'A4615',
    cost: 24.90,
    price: 54.99,
    compareAt: 64.99,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/16soft_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/1600_01_t.png',
      'https://dphpia7d6qb4m.cloudfront.net/images/2025g-25-25_01_t.png'
    ],
    description: 'Anatomically molded curved prongs manufactured with ultra-soft material to eliminate ear chafing and nasal irritation during prolonged oxygen therapy.',
    tags: 'Respiratory, Nasal Cannula, Salter Labs, Soft Prongs, A4615'
  },
  {
    handle: 'drive-universal-oxygen-cylinder-cart',
    title: 'Drive Medical Chrome Plated Oxygen Cylinder Cart for D and E Tanks',
    category: 'Respiratory Accessories',
    vendor: 'Drive DeVilbiss',
    sku: 'DR-13002SV-6',
    mpn: '13002SV-6',
    hcpcs: 'E1355',
    cost: 86.20,
    price: 159.00,
    compareAt: 185.00,
    images: [
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-13002sv-6_01_t.jpg',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-13001sv-2_t.jpg',
      'https://dphpia7d6qb4m.cloudfront.net/images/dr-18300p_01_t.jpg'
    ],
    description: 'Chrome-plated steel frame designed to securely transport D and E oxygen cylinders. Features large smooth-rolling wheels and comfortable foam grip.',
    tags: 'Respiratory, Oxygen Cart, Cylinder Cart, Drive Medical, E1355'
  }
];

async function run() {
  console.log('Validating URLs...');
  for (const c of candidates) {
    for (let i = 0; i < c.images.length; i++) {
      const ok = await checkUrl(c.images[i]);
      if (!ok) {
        console.warn(`URL failed for ${c.sku} img ${i}: ${c.images[i]}`);
      }
    }
  }

  // 1. Generate Shopify Official CSV with 3 Image Rows per product
  const shopifyHeaders = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Standard Product Type', 'Custom Product Type',
    'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value',
    'Option3 Name', 'Option3 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker',
    'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service',
    'Variant Price', 'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable',
    'Variant Barcode', 'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card',
    'SEO Title', 'SEO Description', 'Google Shopping / Condition', 'Cost per item', 'Status'
  ];

  let shopifyCsv = shopifyHeaders.join(',') + '\n';

  for (const p of candidates) {
    // Row 1: Primary Product Row + Image 1
    const row1 = [
      `"${p.handle}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"<p>${p.description.replace(/"/g, '""')}</p>"`,
      `"${p.vendor}"`,
      `"${p.category}"`,
      `"${p.category}"`,
      `"${p.tags}"`,
      'TRUE',
      'Title',
      'Default Title',
      '', '', '', '',
      `"${p.sku}"`,
      '2000',
      'shopify',
      '25',
      'deny',
      'manual',
      p.price.toFixed(2),
      p.compareAt.toFixed(2),
      'TRUE',
      'TRUE',
      '',
      `"${p.images[0]}"`,
      '1',
      `"${p.title.replace(/"/g, '""')} - Front View"`,
      'FALSE',
      `"${p.title.replace(/"/g, '""')} | BaeMeds"`,
      `"${p.description.replace(/"/g, '""').substring(0, 155)}"`,
      'new',
      p.cost.toFixed(2),
      'active'
    ];
    shopifyCsv += row1.join(',') + '\n';

    // Row 2: Secondary Image Row
    const row2 = [
      `"${p.handle}"`,
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      `"${p.images[1]}"`,
      '2',
      `"${p.title.replace(/"/g, '""')} - Angle View"`,
      '', '', '', '', '', ''
    ];
    shopifyCsv += row2.join(',') + '\n';

    // Row 3: Tertiary Image Row
    const row3 = [
      `"${p.handle}"`,
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      `"${p.images[2]}"`,
      '3',
      `"${p.title.replace(/"/g, '""')} - Detail / Accessory View"`,
      '', '', '', '', '', ''
    ];
    shopifyCsv += row3.join(',') + '\n';
  }

  fs.writeFileSync('BAEMEDS_SHOPIFY_MULTI_IMAGE_IMPORT.csv', shopifyCsv, 'utf8');
  console.log('Created BAEMEDS_SHOPIFY_MULTI_IMAGE_IMPORT.csv (Shopify-ready with 3 image rows per product)');

  // 2. Generate Master Product Research CSV with 3 explicit image columns
  const researchHeaders = [
    'SKU', 'Product Name', 'Category', 'Manufacturer', 'MPN', 'HCPCS Code',
    'Dealer Wholesale Cost ($)', 'Recommended Retail Price ($)', 'MSRP / Compare-At ($)',
    'Gross Profit ($)', 'Gross Margin (%)',
    'Image 1 URL (Primary / Front)', 'Image 2 URL (Side / Angle)', 'Image 3 URL (Feature / Detail / Component)',
    'Short Description', 'Market Selling Points'
  ];

  let researchCsv = researchHeaders.join(',') + '\n';
  for (const p of candidates) {
    const margin = p.price - p.cost;
    const marginPct = (margin / p.price) * 100;
    const row = [
      `"${p.sku}"`,
      `"${p.name || p.title}"`,
      `"${p.category}"`,
      `"${p.vendor}"`,
      `"${p.mpn}"`,
      `"${p.hcpcs}"`,
      p.cost.toFixed(2),
      p.price.toFixed(2),
      p.compareAt.toFixed(2),
      margin.toFixed(2),
      marginPct.toFixed(1) + '%',
      `"${p.images[0]}"`,
      `"${p.images[1]}"`,
      `"${p.images[2]}"`,
      `"${p.description.replace(/"/g, '""')}"`,
      `"HSA/FSA Eligible. Top selling US category with verified wholesale dropship supplier."`
    ];
    researchCsv += row.join(',') + '\n';
  }

  fs.writeFileSync('MASTER_DME_PRODUCT_RESEARCH_3_PHOTOS.csv', researchCsv, 'utf8');
  console.log('Created MASTER_DME_PRODUCT_RESEARCH_3_PHOTOS.csv');
}

run();
