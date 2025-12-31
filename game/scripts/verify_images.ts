import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..');
const clothesFile = path.join(repoRoot, 'src', 'data', 'clothes.ts');
const publicRoot = path.join(repoRoot, 'public');

const txt = fs.readFileSync(clothesFile, 'utf8');
const regex = /['"`]\/(clothes|gifts)\/([^'"`]+)['"`]/g;
let m;
const paths = new Map<string, number>();
while ((m = regex.exec(txt)) !== null) {
  const fullPath = `/${m[1]}/${m[2]}`;
  paths.set(fullPath, (paths.get(fullPath) || 0) + 1);
}

console.log(`Found ${paths.size} unique image references:\n`);

const missing: string[] = [];
const found: string[] = [];

for (const p of Array.from(paths.keys()).sort()) {
  const rel = p.replace(/^\//, '').split('/');
  const full = path.join(publicRoot, ...rel);
  const exists = fs.existsSync(full);
  const count = paths.get(p);
  if (exists) {
    found.push(p);
    console.log(`✓ ${p} (referenced ${count} time${count !== 1 ? 's' : ''})`);
  } else {
    missing.push(p);
    console.log(`✗ MISSING: ${p} (referenced ${count} time${count !== 1 ? 's' : ''})`);
    console.log(`  Expected at: ${full}`);
  }
}

console.log(`\n========== SUMMARY ==========`);
console.log(`Total unique paths: ${paths.size}`);
console.log(`Found: ${found.length}`);
console.log(`Missing: ${missing.length}`);

if (missing.length > 0) {
  console.log(`\nMissing files:`);
  missing.forEach(p => console.log(`  - ${p}`));
  process.exit(1);
} else {
  console.log(`\n✓ All referenced images exist!`);
  process.exit(0);
}
