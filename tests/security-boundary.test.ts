/**
 * BaeMeds Enterprise Security Boundary Automated Test Suite
 * Mandated by Section 8: Server/Client Boundary Enforcement.
 *
 * Verifies that:
 * 1. Zero client files in `pages/`, `components/`, `lib/`, `context/` import from `server/`.
 * 2. Zero client files reference `SUPABASE_SERVICE_ROLE_KEY` or server credentials.
 * 3. Client bundle boundary is strictly sealed.
 */

import * as fs from 'fs';
import * as path from 'path';

const CLIENT_DIRS = ['pages', 'components', 'lib', 'context'];
const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"][^'"]*\/server\/[^'"]*['"]/,
  /import\s*\(\s*['"][^'"]*\/server\/[^'"]*['"]\s*\)/,
  /require\s*\(\s*['"][^'"]*\/server\/[^'"]*['"]\s*\)/,
];

const FORBIDDEN_SECRET_PATTERNS = [
  /SUPABASE_SERVICE_ROLE_KEY/,
  /MCKESSON_PASSWORD/,
  /MCKESSON_SECRET/,
  /STRIPE_SECRET_KEY/,
  /WEBHOOK_SIGNING_SECRET/,
];

let totalFilesChecked = 0;
const violations: Array<{ file: string; rule: string; snippet: string }> = [];

const scanDirectory = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      totalFilesChecked++;
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check forbidden server imports
        for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              file: `${fullPath}:${index + 1}`,
              rule: 'CLIENT_IMPORTS_SERVER_FORBIDDEN',
              snippet: line.trim(),
            });
          }
        }

        // Check forbidden secret references
        for (const pattern of FORBIDDEN_SECRET_PATTERNS) {
          if (pattern.test(line)) {
            violations.push({
              file: `${fullPath}:${index + 1}`,
              rule: 'CLIENT_LEAKS_SERVER_SECRET',
              snippet: line.trim(),
            });
          }
        }
      });
    }
  }
};

console.log('======================================================');
console.log('BAEMEDS ENTERPRISE SERVER/CLIENT BOUNDARY TEST SUITE');
console.log('======================================================\n');

for (const dir of CLIENT_DIRS) {
  const targetDir = path.resolve(process.cwd(), dir);
  console.log(`Scanning client directory: ${dir}/...`);
  scanDirectory(targetDir);
}

console.log(`\nChecked ${totalFilesChecked} client files across all client directories.`);

if (violations.length > 0) {
  console.error(`\n❌ SECURITY BOUNDARY VIOLATION DETECTED (${violations.length} violations):`);
  violations.forEach((v) => {
    console.error(`  [${v.rule}] ${v.file}`);
    console.error(`    --> ${v.snippet}`);
  });
  console.error('\nFAIL: Client files must NEVER import server/ or reference backend secrets.\n');
  process.exit(1);
} else {
  console.log('✔ ZERO server imports detected in client directories.');
  console.log('✔ ZERO server secrets or service role keys detected in client code.');
  console.log('\n✔ SERVER/CLIENT ARCHITECTURAL BOUNDARY VERIFIED SUCCESSFULLY.\n');
  process.exit(0);
}
