import fs from 'node:fs';

const html = fs.readFileSync('scripts/baemeds_live_home.html', 'utf8').replace(/&quot;/g, '"');
const idx = html.indexOf('"name":[0,"Karman -K-158-');
console.log(html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 1200)));
