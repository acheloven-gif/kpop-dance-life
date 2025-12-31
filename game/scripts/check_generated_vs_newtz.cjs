const fs = require('fs');
const path = require('path');

const NEWTZ = path.resolve(__dirname, '../../newtz.txt');
const GENERATED = path.resolve(__dirname, '../src/utils/generated_project_library.ts');

const txt = fs.readFileSync(NEWTZ, 'utf8');
const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

function isProjectLine(line) {
  if (!/[\u2013\u2014-]/.test(line)) return false;
  if (!/(?:\|\s*skill|skill\s*:)/i.test(line)) return false;
  const left = line.split(/[\u2013\u2014-]/)[0] || '';
  if (!/[A-Za-z0-9]/.test(left)) return false;
  return true;
}

const projectLines = lines.filter(isProjectLine).map(l => l.replace(/^\d+(?:\.\d+)*\.?\s*/, '').trim());
const uniqueFromNewtz = Array.from(new Set(projectLines));

const gen = require(GENERATED);
const genNames = gen.PROJECT_LIBRARY.map(p => p.name.trim());

const missing = uniqueFromNewtz.filter(n => !genNames.includes(n));
const extra = genNames.filter(n => !uniqueFromNewtz.includes(n));

console.log('newtz projects (unique):', uniqueFromNewtz.length);
console.log('generated projects:', genNames.length);
console.log('missing in generated:', missing.length);
if (missing.length) console.log(missing.slice(0,50));
console.log('extra in generated (not in newtz strict):', extra.length);
if (extra.length) console.log(extra.slice(0,50));

if (missing.length > 0) process.exit(1);
console.log('All good: generated contains all strict-detected newtz projects.');
