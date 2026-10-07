import fs from 'node:fs';

async function inspectLiveSite() {
  const res = await fetch('https://www.baemeds.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const html = await res.text();
  fs.writeFileSync('scripts/baemeds_live_home.html', html, 'utf8');
  console.log(`Saved baemeds_live_home.html (${html.length} bytes)`);

  // Extract all assets.zyrosite.com and cdn.zyrosite.com URLs
  const zyroMatches = html.match(/https?:\/\/[^\s"'<>\\]+/gi) || [];
  const imageAssets = Array.from(new Set(zyroMatches.filter((u) => 
    /\.(jpg|jpeg|png|webp|avif)/i.test(u) && !/logo/i.test(u)
  )));
  
  console.log(`Found ${imageAssets.length} image assets on live site (excluding logos)`);
  fs.writeFileSync('scripts/baemeds_photos.json', JSON.stringify(imageAssets, null, 2), 'utf8');
  imageAssets.forEach((img, idx) => console.log(`${idx + 1}: ${img}`));
}

inspectLiveSite().catch(console.error);
