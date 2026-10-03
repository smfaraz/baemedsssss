import fs from 'fs';
import path from 'path';

const catalogPath = path.resolve('./data/catalog_seed.json');
const researchPath = path.resolve('./data/product_research.json');
const top20Path = path.resolve('./data/top_20_flagship_products.json');

function upgradeUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return url
    .replace(/\/CumulusWeb\/Images\/Item_Detail\//g, '/CumulusWeb/Images/Item_Zoom/')
    .replace(/\/Item_Detail\//g, '/Item_Zoom/')
    .replace(/_01_t\.png/g, '_01_l.png')
    .replace(/_02_t\.png/g, '_02_l.png')
    .replace(/_03_t\.png/g, '_03_l.png');
}

console.log('--- UPGRADING CATALOG IMAGES TO HIGH DEFINITION (HD) ---');

// 1. Catalog Seed
if (fs.existsSync(catalogPath)) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  let updatedImages = 0;

  catalog.forEach(p => {
    const orig = p.image;
    p.image = upgradeUrl(p.image);
    if (orig !== p.image) updatedImages++;

    if (Array.isArray(p.images)) {
      p.images = p.images.map(img => {
        const up = upgradeUrl(img);
        if (img !== up) updatedImages++;
        return up;
      });
    }

    if (Array.isArray(p.variants)) {
      p.variants.forEach(v => {
        if (v.image) {
          const up = upgradeUrl(v.image);
          if (v.image !== up) updatedImages++;
          v.image = up;
        }
      });
    }
  });

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`✓ catalog_seed.json: Upgraded ${updatedImages} image URLs to Item_Zoom / HD assets!`);
}

// 2. Product Research
if (fs.existsSync(researchPath)) {
  const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
  let updatedResearch = 0;

  research.forEach(p => {
    const orig = p.image;
    p.image = upgradeUrl(p.image);
    if (orig !== p.image) updatedResearch++;
  });

  fs.writeFileSync(researchPath, JSON.stringify(research, null, 2), 'utf8');
  console.log(`✓ product_research.json: Upgraded ${updatedResearch} image URLs to Item_Zoom / HD assets!`);
}

// 3. Top 20 Flagship
if (fs.existsSync(top20Path)) {
  const top20 = JSON.parse(fs.readFileSync(top20Path, 'utf8'));
  let updatedTop20 = 0;

  top20.forEach(p => {
    const orig = p.image;
    p.image = upgradeUrl(p.image);
    if (orig !== p.image) updatedTop20++;

    if (Array.isArray(p.images)) {
      p.images = p.images.map(img => {
        const up = upgradeUrl(img);
        if (img !== up) updatedTop20++;
        return up;
      });
    }
  });

  fs.writeFileSync(top20Path, JSON.stringify(top20, null, 2), 'utf8');
  console.log(`✓ top_20_flagship_products.json: Upgraded ${updatedTop20} image URLs to HD!`);
}

console.log('--- ALL MASTER DATA FILES UPGRADED TO CRYSTAL CLEAR HD ---');
