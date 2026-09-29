import fs from 'fs';
const d = JSON.parse(fs.readFileSync('data/catalog_seed.json', 'utf8'));
const invalid = d.filter(p => /["*:<>?\\|]/.test(p.handle));
console.log('Handles with invalid Windows characters:', invalid.length);
if (invalid.length) console.log(invalid.map(p => p.handle).slice(0, 10));
