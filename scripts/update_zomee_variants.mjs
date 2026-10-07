import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.resolve(__dirname, '../data/catalog_seed.json');

console.log('Reading catalog seed from:', catalogPath);
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const index = catalog.findIndex((p) => p.id === 'prd-1181796' || p.handle === 'double-electric-breast-pump-zomee-z2');
if (index === -1) {
  console.error('Product prd-1181796 not found in catalog_seed.json');
  process.exit(1);
}

const existing = catalog[index];
console.log('Found product:', existing.title, 'Current Price:', existing.price);

const updatedProduct = {
  ...existing,
  price: 84.99,
  compareAtPrice: 119.99,
  wholesaleCost: 65.18,
  costPerItem: 65.18,
  dealerPrice: 65.18,
  specs: "Double Electric Breast Pump Zomee Z2. Available in Single Unit (EA 1) or Clinic Case Pack (CS/12). Manufacturer: Medical Grade. MPN: 1181796. HCPCS: E0603.",
  description: `<p class="lead font-medium text-slate-800"><strong>Double Electric Breast Pump Zomee Z2</strong> supplied directly through authorized medical distributor networks by <strong>Medical Grade</strong>.</p>
      <p>Engineered for exceptional clinical efficacy, user safety, and strict regulatory adherence in home and institutional environments.</p>
      <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <h4 class="font-bold text-slate-900 mb-2">Clinical Product Details:</h4>
        <ul class="space-y-1 text-sm text-slate-700">
          <li><strong>Available Packaging:</strong> Single Unit (EA 1) &amp; Case Pack (CS/12)</li>
          <li><strong>HCPCS Reimbursement Code:</strong> E0603</li>
          <li><strong>McKesson Item Number:</strong> 1181796</li>
          <li><strong>Manufacturer MPN:</strong> 1181796</li>
          <li><strong>Prescription Requirement:</strong> Over The Counter (OTC)</li>
          <li><strong>FSA / HSA:</strong> Qualified Medical Expense Eligible</li>
          <li><strong>Warranty:</strong> Manufacturer Limited Warranty Included</li>
        </ul>
      </div>`,
  features: [
    "Available in Single Unit (EA 1) and Case of 12 (CS/12)",
    "HCPCS Code: E0603",
    "Manufacturer: Medical Grade",
    "Authorized US Distributor Stock with Full Warranty",
    "100% Eligible for FSA / HSA Reimbursement"
  ],
  weightLbs: 2.5,
  variantId: "var-1181796-ea1",
  selectedVariantId: "var-1181796-ea1",
  variants: [
    {
      id: "var-1181796-ea1",
      title: "Single Unit (1 Each / EA 1)",
      size: "Single Unit (EA 1)",
      packageQuantity: "1 Each",
      price: 84.99,
      compareAtPrice: 119.99,
      wholesaleCost: 65.18,
      dealerPrice: 65.18,
      sku: "MCK-1181796-EA1",
      inStock: true,
      inventoryQuantity: 25,
      image: "https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Zoom/1181796_front.jpg"
    },
    {
      id: "var-1181796-cs12",
      title: "Case Pack (Case of 12 / CS 12)",
      size: "Case of 12 (CS/12)",
      packageQuantity: "Case of 12",
      price: 844.99,
      compareAtPrice: 1134.99,
      wholesaleCost: 782.12,
      dealerPrice: 782.12,
      sku: "MCK-1181796-CS12",
      inStock: true,
      inventoryQuantity: 10,
      image: "https://imgcdn.mckesson.com/CumulusWeb/Images/Item_Zoom/1181796_front.jpg"
    }
  ]
};

catalog[index] = updatedProduct;

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Successfully updated prd-1181796 with 2 options (EA 1 @ $84.99 and CS 12 @ $844.99)!');
