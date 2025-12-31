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

// Check duplicates
const counts = names.reduce((acc, n) => {
  acc[n] = (acc[n] || 0) + 1;
  return acc;
}, {});
const duplicates = Object.keys(counts).filter(n => counts[n] > 1).map(n => ({ name: n, count: counts[n] }));

// Check presence in newtz.txt
const missingInNewtz = [];
const foundInNewtz = [];
names.forEach(n => {
  if (!newtz) {
    missingInNewtz.push(n);
  } else {
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9а-яё\s\-—&]/gi, '').replace(/\s+/g, ' ').trim();
    const nNorm = norm(n);
    const txtNorm = norm(newtz);
    if (txtNorm.indexOf(nNorm) >= 0) foundInNewtz.push(n);
    else missingInNewtz.push(n);
  }
});

// Report
console.log('PROJECT_LIBRARY total:', names.length);
console.log('Duplicates found:', duplicates.length);
if (duplicates.length > 0) console.table(duplicates);
console.log('Projects found in newtz.txt:', foundInNewtz.length);
console.log('Projects missing in newtz.txt (or newtz.txt empty):', missingInNewtz.length);
if (missingInNewtz.length <= 200) console.table(missingInNewtz.map(n => ({ name: n })));

if (duplicates.length > 0 || missingInNewtz.length > 0) process.exitCode = 2;
else process.exitCode = 0;
