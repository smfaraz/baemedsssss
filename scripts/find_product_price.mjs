import fs from 'node:fs';

const html = fs.readFileSync('scripts/baemeds_live_home.html', 'utf8').replace(/&quot;/g, '"');
const id = 'prod_01K9Z4CC2G1PGS3RJH74DFS2X9';
let idx = 0;
while ((idx = html.indexOf(id, idx)) !== -1) {
  console.log(`Found ${id} at offset ${idx}:`);
  console.log(html.substring(Math.max(0, idx - 100), Math.min(html.length, idx + 400)));
  console.log('----------------------------------------');
  idx += id.length;
}
