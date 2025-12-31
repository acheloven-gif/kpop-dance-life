const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const clothesFile = path.join(repoRoot, 'src', 'data', 'clothes.ts');
const publicRoot = path.join(repoRoot, 'public');

const txt = fs.readFileSync(clothesFile, 'utf8');
const regex = /['\"]\/(clothes|gifts)\/([^'\"]+)['\"]/g;
let m;
const paths = new Set();
while ((m = regex.exec(txt)) !== null) {
  paths.add(`/${m[1]}/${m[2]}`);
}

if (paths.size === 0) {
  console.log('No referenced images found in clothes.ts');
  process.exit(0);
}

let missing = [];
for (const p of Array.from(paths).sort()) {
  const rel = p.replace(/^\//, '').split('/');
  const full = path.join(publicRoot, ...rel);
  const exists = fs.existsSync(full);
  console.log(p, exists ? 'OK' : `MISSING -> ${full}`);
  if (!exists) missing.push({ p, full });
}

if (missing.length > 0) {
  console.log('\nMissing files summary:');
  missing.forEach(x => console.log('-', x.full));
  process.exit(2);
} else {
  console.log('\nAll referenced images exist.');
  process.exit(0);
}