const fs = require('fs');
const path = require('path');

const projPath = path.join(__dirname, '..', 'src', 'utils', 'projectGenerator.ts');
const newtzPath = path.join(__dirname, '..', '..', 'newtz.txt');

const projSrc = fs.readFileSync(projPath, 'utf8');
const newtz = fs.existsSync(newtzPath) ? fs.readFileSync(newtzPath, 'utf8') : '';

const nameRegex = /name:\s*'([^']+)'/g;
let match;
const names = [];
while ((match = nameRegex.exec(projSrc)) !== null) {
  names.push(match[1].trim());
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9а-яё\s\-—&]/gi, '').replace(/\s+/g, ' ').trim();
const txtNorm = norm(newtz);

const found = [];
const missing = [];
for (const n of names) {
  if (txtNorm.indexOf(norm(n)) >= 0) found.push(n);
  else missing.push(n);
}

console.log('Found count:', found.length);
console.table(found.map(n => ({ name: n })));
console.log('Missing count:', missing.length);
// small list preview
if (missing.length <= 200) console.table(missing.map(n => ({ name: n })));

if (found.length === 0) process.exitCode = 1; else process.exitCode = 0;
