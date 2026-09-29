export interface ProductReview {
  id: string;
  productId: string;
  productHandle?: string;
  author: string;
  email: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
  userType?: 'Healthcare Professional' | 'Home Patient' | 'Caregiver' | 'Clinic / Hospital';
  photos: string[];
  recommend: boolean;
  helpfulCount: number;
}

export const INITIAL_SEED_REVIEWS: ProductReview[] = [
  // 1. RGB Infrared Thermometer (10000006840565)
  {
    id: 'rev_rgb_1',
    productId: 'gid://shopify/Product/10000006840565',
    productHandle: 'rgb-infrared-thermometer-ith-in-01li',
    author: 'Dr. Ramesh K.',
    email: 'ramesh.clinic@gmail.com',
    rating: 5,
    title: 'Extremely accurate and fast for outpatient triage',
    content: 'We use this RGB thermometer daily at our clinic reception in Austin, TX. Instant readings within 1 second without skin contact. The 3-color backlit LCD (green for normal, red for fever) makes fever screening foolproof.',
    date: '2026-02-14',
    verified: true,
    userType: 'Clinic / Hospital',
    photos: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 28,
  },
  {
    id: 'rev_rgb_2',
    productId: 'gid://shopify/Product/10000006840565',
    productHandle: 'rgb-infrared-thermometer-ith-in-01li',
    author: 'Priya Sundaram',
    email: 'priya.s@yahoo.com',
    rating: 5,
    title: 'Essential for checking kids fever at home',
    content: 'Very easy to use for children when they are asleep without waking them up. Delivered promptly by BaeMeds team with official FSA/HSA receipt and warranty card.',
    date: '2026-03-01',
    verified: true,
    userType: 'Home Patient',
    photos: [],
    recommend: true,
    helpfulCount: 14,
  },

  // 2. Swan Otoscope SW2700 (10000006906101)
  {
    id: 'rev_swan_oto_1',
    productId: 'gid://shopify/Product/10000006906101',
    productHandle: 'swan-otoscope-sw2700',
    author: 'Dr. Anita Varma',
    email: 'anita.ent@healthcarepartners.org',
    rating: 5,
    title: 'Superior optical clarity for ENT examinations',
    content: 'The fiber-optic illumination on this Swan SW2700 provides exceptional ear canal visibility without shadows or glare. Sturdy brass construction with 3x swivel magnification lens. Comes with multiple specula sizes.',
    date: '2026-01-20',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [
      'https://images.unsplash.com/photo-1583912267550-d44d9c9a099a?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 22,
  },

  // 3. Perfecxa Infra-Red Thermometer VHS-0100 (10000007004405)
  {
    id: 'rev_perfecxa_1',
    productId: 'gid://shopify/Product/10000007004405',
    productHandle: 'perfecxa-infrared-thermometer-vhs0100',
    author: 'Sister Mary D.',
    email: 'sister.mary@stjudehealth.org',
    rating: 5,
    title: 'High repeatability across post-op rounds',
    content: 'The dual body and surface temperature mode is very convenient. Temperature calibration matches our hospital mercury baseline within 0.1°C variance. Battery life lasts months even with 50+ checks daily.',
    date: '2026-02-18',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 17,
  },

  // 4. Suvarna Arrow Analog Scale (10000007037173)
  {
    id: 'rev_suvarna_arrow_1',
    productId: 'gid://shopify/Product/10000007037173',
    productHandle: 'suvarna-arrow-body-weight-scale-br9011',
    author: 'Mohammed Farooq',
    email: 'm.farooq@outlook.com',
    rating: 4,
    title: 'Solid mechanical build, very durable dial',
    content: 'Accurate scale with large pointer dial that is easy to read from standing height. Heavy metal base so it does not slip on bathroom tiles. Zero-adjustment knob makes resetting effortless.',
    date: '2026-02-28',
    verified: true,
    userType: 'Caregiver',
    photos: [],
    recommend: true,
    helpfulCount: 9,
  },

  // 5. EZ-Life Digital Scale EZ 023 (10000007069941)
  {
    id: 'rev_ezlife_023_1',
    productId: 'gid://shopify/Product/10000007069941',
    productHandle: 'ez-life-personal-digital-weighing-scale-ez023',
    author: 'Sandeep Reddy',
    email: 'sandeep.physio@gmail.com',
    rating: 5,
    title: 'High precision sensors and thick tempered glass',
    content: 'Purchased for our physiotherapy and fitness center in Gachibowli. Instant step-on measurement without having to tap first. Clear white backlit numerals visible under any light.',
    date: '2026-03-05',
    verified: true,
    userType: 'Clinic / Hospital',
    photos: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 12,
  },

  // 6. Swan's Doctor Aneroid Sphygmomanometer (10000007168245)
  {
    id: 'rev_swan_aneroid_1',
    productId: 'gid://shopify/Product/10000007168245',
    productHandle: 'swans-doctor-aneroid-sphygmomanometer',
    author: 'Dr. K. Venkat Rao',
    email: 'venkat.rao.doc@gmail.com',
    rating: 5,
    title: 'Reliable aneroid gauge for house calls and OPD',
    content: 'Non-stop pin mechanism ensures the dial remains calibrated even after bumpy transit during rural health camps. High-grade nylon cuff with strong Velcro fastener.',
    date: '2026-02-10',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 21,
  },

  // 7. RainbowMMed ECG Electrode Bulb Set of 6 (10000007201013)
  {
    id: 'rev_ecg_bulb_1',
    productId: 'gid://shopify/Product/10000007201013',
    productHandle: 'rainbowmmed-ecg-electrode-bulb-set-6',
    author: 'Rajesh Kumar',
    email: 'rajesh.diagnostics@yahoo.com',
    rating: 5,
    title: 'Strong suction grip, minimal artifact noise',
    content: 'Replaced our worn suction bulbs on our 12-lead BPL ECG machine. The rubber bulbs maintain firm vacuum seal on patient chest wall without falling off during recording. Silver-plated cups deliver clean baseline traces.',
    date: '2026-01-29',
    verified: true,
    userType: 'Clinic / Hospital',
    photos: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 16,
  },

  // 8. Longlife Mercurial Sphygmomanometer MBP-25 (10000007233781)
  {
    id: 'rev_longlife_mbp25_1',
    productId: 'gid://shopify/Product/10000007233781',
    productHandle: 'longlife-mercurial-sphygmomanometer-mbp25',
    author: 'Dr. Sudhir Prasad',
    email: 'sudhir.cardio@carehospitals.com',
    rating: 5,
    title: 'Gold standard clinical accuracy with ISI certification',
    content: 'The mercury column is crystal clear and rises with zero resistance. Die-cast aluminium case with locking valve prevents any mercury spill when stored. Unmatched accuracy for hypertension management.',
    date: '2026-02-22',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 31,
  },

  // 9. Long Life Palm Aneroid Sphygmomanometer (10000007299317)
  {
    id: 'rev_longlife_palm_1',
    productId: 'gid://shopify/Product/10000007299317',
    productHandle: 'longlife-palm-aneroid-sphygmomanometer',
    author: 'Sister Hemalatha',
    email: 'hema.icu@yashodahospitals.org',
    rating: 5,
    title: 'Ergonomic one-handed operation speeds up ward rounds',
    content: 'The integrated bulb and thumb air-release valve allow quick single-handed inflation and steady deflation at 2 mmHg per second. Perfect for fast-paced emergency and ICU environments.',
    date: '2026-03-03',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [],
    recommend: true,
    helpfulCount: 18,
  },

  // 10. Diamond Mercurial BP Monitor Regular (10000007364853)
  {
    id: 'rev_diamond_regular_1',
    productId: 'gid://shopify/Product/10000007364853',
    productHandle: 'diamond-mercurial-bp-monitor-regular',
    author: 'Dr. M. G. Naidu',
    email: 'mgnaidu.clinic@gmail.com',
    rating: 5,
    title: 'The trusted workhorse of Indian clinical practice',
    content: 'Diamond has been our go-to BP apparatus for over two decades. Pristine redistilled mercury, heavy cast-iron base, and crisp Korotkoff sound clarity with any standard stethoscope.',
    date: '2026-01-15',
    verified: true,
    userType: 'Clinic / Hospital',
    photos: [
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 45,
  },

  // 11. Diamond BPMR120 Deluxe Mercurial BP Monitor (10000007430389)
  {
    id: 'rev_diamond_deluxe_1',
    productId: 'gid://shopify/Product/10000007430389',
    productHandle: 'diamond-bpmr120-deluxe-mercurial-bp-monitor',
    author: 'Dr. Shailaja B.',
    email: 'shailaja.med@memorialhealth.org',
    rating: 5,
    title: 'Extra wide footprint prevents tipping on mobile crash carts',
    content: 'The BPMR120 Deluxe model is noticeably more stable than standard units. The 0 to 300 mmHg scale is clearly engraved with internal glass tube cleaning brush included.',
    date: '2026-02-19',
    verified: true,
    userType: 'Clinic / Hospital',
    photos: [],
    recommend: true,
    helpfulCount: 19,
  },

  // 12. AccuSure Digital Scale SF B-18 (10000007463157)
  {
    id: 'rev_accusure_scale_1',
    productId: 'gid://shopify/Product/10000007463157',
    productHandle: 'accusure-digital-weighing-scale-sf-b18',
    author: 'Ananya Joshi',
    email: 'ananya.joshi@gmail.com',
    rating: 4,
    title: 'Sleek bathroom scale with hidden LED display',
    content: 'Very modern aesthetic. When turned off it looks like a clean sheet of tempered glass; upon stepping on, bright red LED digits appear instantly. Consistent readings.',
    date: '2026-02-26',
    verified: true,
    userType: 'Home Patient',
    photos: [],
    recommend: true,
    helpfulCount: 8,
  },

  // 13. SUVARNA Galaxy Mechanical Scale (10000007528693)
  {
    id: 'rev_suvarna_galaxy_1',
    productId: 'gid://shopify/Product/10000007528693',
    productHandle: 'suvarna-galaxy-mechanical-weighing-scale',
    author: 'Dr. Vijay Chary',
    email: 'vijay.chary.pt@gmail.com',
    rating: 5,
    title: 'Zero maintenance, handles 100+ daily patient weigh-ins',
    content: 'We placed this in our physiotherapy triage. Never need to worry about dead batteries or sensor recalibration. The wide textured rubber platform accommodates senior citizens comfortably.',
    date: '2026-02-05',
    verified: true,
    userType: 'Clinic / Hospital',
    photos: [
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 14,
  },

  // 14. AccuSure Simple Blood Glucose Test Strip 50 (10000007561461)
  {
    id: 'rev_accusure_strips_1',
    productId: 'gid://shopify/Product/10000007561461',
    productHandle: 'accusure-simple-blood-glucose-test-strip-50',
    author: 'Venkata Ramana',
    email: 'v.ramana@rediffmail.com',
    rating: 5,
    title: 'Fast capillary absorption with tiny blood drop',
    content: 'Takes only a tiny pinprick sample (0.5 microliters). Doesn\'t waste strips due to insufficient blood error. Great genuine batch delivered by BaeMeds with long expiry date.',
    date: '2026-03-08',
    verified: true,
    userType: 'Caregiver',
    photos: [],
    recommend: true,
    helpfulCount: 11,
  },

  // 15. Dr. Morepen GlucoOne BG-03 with 50 Strips (10000007594229)
  {
    id: 'rev_morepen_gluco_1',
    productId: 'gid://shopify/Product/10000007594229',
    productHandle: 'dr-morepen-glucoone-bg-03',
    author: 'Suresh Babu',
    email: 'suresh.babu62@gmail.com',
    rating: 5,
    title: 'Accurate 5-second test result, no coding chip needed',
    content: 'I have checked this simultaneously against venous laboratory fasting blood sugar tests, and the difference is barely 4 mg/dL. Stores 300 readings with date and time stamps. Best value diabetes monitor in India.',
    date: '2026-02-12',
    verified: true,
    userType: 'Home Patient',
    photos: [
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 39,
  },
  {
    id: 'rev_morepen_gluco_2',
    productId: 'gid://shopify/Product/10000007594229',
    productHandle: 'dr-morepen-glucoone-bg-03',
    author: 'Dr. P. Archana',
    email: 'archana.endo@gmail.com',
    rating: 5,
    title: 'Standard prescription choice for home glucose logging',
    content: 'We routinely recommend the Morepen BG-03 for gestational and type-2 diabetes home management. Lancing device is gentle on fingertips and strips are universally available.',
    date: '2026-03-02',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [],
    recommend: true,
    helpfulCount: 23,
  },

  // 16. Swan Ophthalmoscope SW-4700 (10000007626997)
  {
    id: 'rev_swan_ophthalmo_1',
    productId: 'gid://shopify/Product/10000007626997',
    productHandle: 'swan-ophthalmoscope-sw-4700',
    author: 'Dr. Gautam Reddy',
    email: 'gautam.ophthal@gmail.com',
    rating: 5,
    title: 'Exceptional fundus visualization with Xenon Halogen lamp',
    content: 'The 5 aperture selection (including fixation star and red-free filter) allows thorough diabetic retinopathy and optic disc examination. Precision corrective lenses from -20D to +20D dial in crisply.',
    date: '2026-01-25',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [
      'https://images.unsplash.com/photo-1583912267550-d44d9c9a099a?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 26,
  },

  // 17. Accu-Chek Instant Glucometer Strip 50 (10000007692533)
  {
    id: 'rev_accuchek_instant_1',
    productId: 'gid://shopify/Product/10000007692533',
    productHandle: 'accu-chek-instant-glucometer-strip-50',
    author: 'Harish V.',
    email: 'harish.kondapur@gmail.com',
    rating: 5,
    title: 'Wide dosing area makes blood application effortless',
    content: 'Compared to narrow strip edges, the Accu-Chek Instant allows blood dosing across the entire yellow border. Super convenient for elderly patients. Genuine sealed pack with 18-month shelf life.',
    date: '2026-02-27',
    verified: true,
    userType: 'Home Patient',
    photos: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 15,
  },

  // 18. Ez-Life Digital Bathroom Scale EZ046 (10000007725301)
  {
    id: 'rev_ezlife_046_1',
    productId: 'gid://shopify/Product/10000007725301',
    productHandle: 'ez-life-digital-bathroom-scale-ez046',
    author: 'Deepika M.',
    email: 'deepika.dietitian@gmail.com',
    rating: 4,
    title: 'High repeatability and skid-proof silicone feet',
    content: 'Very reliable scale for daily client body composition tracking. Weighing yourself three times consecutively returns the exact same number down to 0.1 kg.',
    date: '2026-03-04',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [],
    recommend: true,
    helpfulCount: 7,
  },

  // 19. Dr Trust USA Wedge Orthopaedic Pillow 3201 (10000007758069)
  {
    id: 'rev_drtrust_pillow_1',
    productId: 'gid://shopify/Product/10000007758069',
    productHandle: 'dr-trust-wedge-orthopaedic-pillow-3201',
    author: 'Satyanarayana Murthy',
    email: 's.murthy@outlook.com',
    rating: 5,
    title: 'Complete relief from nocturnal acid reflux (GERD)',
    content: 'Recommended by my gastroenterologist for severe acid reflux and breathing difficulty when lying flat. The incline angle is medically ideal without straining the neck. High density memory foam that doesn\'t collapse over time.',
    date: '2026-02-15',
    verified: true,
    userType: 'Home Patient',
    photos: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 34,
  },

  // 20. CANTA Oxygen Concentrator 5L V5WNS (10000007790837)
  {
    id: 'rev_canta_oxy_1',
    productId: 'gid://shopify/Product/10000007790837',
    productHandle: 'canta-oxyzen-concentrator-5-liter-v5wns-fda-certified',
    author: 'Dr. Vivek N.',
    email: 'vivek.pulmo@carehospitals.com',
    rating: 5,
    title: 'True continuous 93% oxygen purity, US FDA certified workhorse',
    content: 'We evaluated several 5-liter concentrators for post-discharge chronic COPD patients. The CANTA V5WNS uses high-grade French CECA molecular sieves. Maintains >93% oxygen saturation even at max 5 L/min continuous delivery. The built-in nebulizer outlet is a huge clinical advantage.',
    date: '2026-02-08',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 52,
  },
  {
    id: 'rev_canta_oxy_2',
    productId: 'gid://shopify/Product/10000007790837',
    productHandle: 'canta-oxyzen-concentrator-5-liter-v5wns-fda-certified',
    author: 'Lakshmi Narayana',
    email: 'lnarayana.ameerpet@gmail.com',
    rating: 5,
    title: 'Quiet operation allowed my mother to sleep peacefully',
    content: 'Ordered urgently for home oxygen therapy in Ameerpet. BaeMeds biomedical technician arrived within 2 hours, set up the humidifier bottle, calibrated the flow meter, and verified 94% reading on our pulse oximeter. Very quiet compressor sound.',
    date: '2026-03-06',
    verified: true,
    userType: 'Caregiver',
    photos: [
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 38,
  },

  // 21. TYNOR R.O.M. Knee Brace 18" (10000007823605)
  {
    id: 'rev_tynor_rom_1',
    productId: 'gid://shopify/Product/10000007823605',
    productHandle: 'tynor-r-o-m-knee-brace-18-46cm-adjustable-range-of-motion-knee-support-black-universal-size',
    author: 'Dr. Ashwin Kumar',
    email: 'ashwin.ortho@sunshine.org',
    rating: 5,
    title: 'Essential postoperative brace for ACL/PCL ligament reconstruction',
    content: 'The bilateral hinge with dial-pin flexion and extension stops (0° to 120°) provides controlled progressive range of motion during rehabilitation. Rigid aluminium uprights prevent any varus/valgus stress on the graft.',
    date: '2026-01-18',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 41,
  },
  {
    id: 'rev_tynor_rom_2',
    productId: 'gid://shopify/Product/10000007823605',
    productHandle: 'tynor-r-o-m-knee-brace-18-46cm-adjustable-range-of-motion-knee-support-black-universal-size',
    author: 'Rohan Gupta',
    email: 'rohan.football@gmail.com',
    rating: 5,
    title: 'Protected my reconstructed knee completely',
    content: 'Wore this 18-inch universal size brace for 6 weeks after knee arthroscopy. The padded neoprene liners don\'t chafe the skin even in warm summer weather. Highly secure straps.',
    date: '2026-02-24',
    verified: true,
    userType: 'Home Patient',
    photos: [],
    recommend: true,
    helpfulCount: 19,
  },

  // 22. Tynor Knee Cap Air (Pair) (10000007856373)
  {
    id: 'rev_tynor_cap_1',
    productId: 'gid://shopify/Product/10000007856373',
    productHandle: 'tynor-knee-cap-air-for-men-women-support-pain-relief-during-sports-gym-running-beige-1-pair',
    author: 'Meenakshi S.',
    email: 'meenakshi.s@gmail.com',
    rating: 5,
    title: 'Comfortable compression for knee osteoarthritis pain',
    content: 'The 4-way stretch knit delivers snug, firm support without cutting off circulation. Unlike cheap sleeves, this does not roll down at the thigh or bunch up behind the knee when bending.',
    date: '2026-02-17',
    verified: true,
    userType: 'Home Patient',
    photos: [],
    recommend: true,
    helpfulCount: 13,
  },

  // 23. TYNOR Knee Immobiliser 14" (10000007889141)
  {
    id: 'rev_tynor_immob_1',
    productId: 'gid://shopify/Product/10000007889141',
    productHandle: 'tynor-knee-immobiliser-14-36cm-support-protection-for-knee-injury-pain-relief-green-medium',
    author: 'Dr. Farhan Ali',
    email: 'farhan.sportsmed@gmail.com',
    rating: 5,
    title: 'Superior zero-degree immobilization over heavy plaster casts',
    content: 'Anatomically contoured posterior and bilateral aluminium splints keep the knee joint firmly immobilized at 0 degrees. Far more hygienic and comfortable for patients than a traditional cylinder plaster.',
    date: '2026-02-03',
    verified: true,
    userType: 'Healthcare Professional',
    photos: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 27,
  },

  // 24. TYNOR Elastic Shoulder Immobiliser (10000007921909)
  {
    id: 'rev_tynor_shoulder_1',
    productId: 'gid://shopify/Product/10000007921909',
    productHandle: 'tynor-elastic-shoulder-immobiliser-injury-recovery-support-adjustable-sling-for-pain-relief-grey-large',
    author: 'Vikramaditya T.',
    email: 'vikram.t@yahoo.com',
    rating: 5,
    title: 'Stopped severe rotator cuff dislocation pain',
    content: 'The chest wrap and humeral cuff lock the arm closely to the body, eliminating agonizing shoulder joint rotation. Very breathable high-grade elastic that doesn\'t loosen with wear.',
    date: '2026-01-30',
    verified: true,
    userType: 'Home Patient',
    photos: [],
    recommend: true,
    helpfulCount: 15,
  },

  // 25. TYNOR Pouch Arm Sling Baggy (10000007954677)
  {
    id: 'rev_tynor_sling_1',
    productId: 'gid://shopify/Product/10000007954677',
    productHandle: 'tynor-pouch-arm-sling-baggy-lightweight-breathable-arm-support-for-injury-recovery-shoulder-dislocation-grey-medium',
    author: 'Sunita Rao',
    email: 'sunita.rao@gmail.com',
    rating: 5,
    title: 'Breathable 3D mesh cradle, generous room for arm cast',
    content: 'Purchased for my 12-year-old son with a forearm fracture. The baggy pouch accommodates thick bulky plaster without pinching. The padded shoulder strap distributes weight so his neck never gets strained.',
    date: '2026-02-21',
    verified: true,
    userType: 'Caregiver',
    photos: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&auto=format&fit=crop&q=80',
    ],
    recommend: true,
    helpfulCount: 22,
  },
];
