const fs = require('fs');
const path = require('path');

const projPath = path.join(__dirname, '..', 'src', 'utils', 'projectGenerator.ts');
const newtzPath = path.join(__dirname, '..', '..', 'newtz.txt');

const projSrc = fs.readFileSync(projPath, 'utf8');
const newtz = fs.existsSync(newtzPath) ? fs.readFileSync(newtzPath, 'utf8') : '';

// Extract name: '...' occurrences within PROJECT_LIBRARY
const nameRegex = /name:\s*'([^']+)'/g;
let match;
const names = [];
while ((match = nameRegex.exec(projSrc)) !== null) {
  names.push(match[1].trim());
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9а-яё\s\-—&]/gi, '').replace(/\s+/g, ' ').trim();
const projNorms = names.map(n => ({ raw: n, norm: norm(n) }));
const projNormSet = new Set(projNorms.map(p => p.norm));

const newtzLines = newtz.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

const missing = [];
newtzLines.forEach(line => {
  const n = norm(line);
  // exact match
  if (projNormSet.has(n)) return;
  // check if any project contains the newtz line as substring or vice versa
  const found = projNorms.some(p => p.norm.indexOf(n) >= 0 || n.indexOf(p.norm) >= 0);
  if (!found) missing.push({ raw: line, norm: n });
});

console.log('newtz total lines:', newtzLines.length);
console.log('PROJECT_LIBRARY total:', names.length);
console.log('Lines from newtz.txt missing in PROJECT_LIBRARY:', missing.length);
if (missing.length <= 300) console.table(missing.map(m => ({ line: m.raw })));

if (missing.length > 0) process.exitCode = 2; else process.exitCode = 0;
