const fs = require('fs');
const path = require('path');

const GEN = path.resolve(__dirname, '../src/utils/generated_project_library.ts');
const mod = require(GEN);
const projects = mod.PROJECT_LIBRARY;

let changed = 0;

for (const p of projects) {
  if (typeof p.name === 'string') {
    const orig = p.name;
    // remove ' | skill: ...' or ' | skill:Mixed(...)' or trailing ' | skill: F' patterns
    const cleaned = orig.replace(/\s*\|\s*skill[:]?\s*[^\n]*$/i, '').trim();
    if (cleaned !== orig) {
      p.name = cleaned;
      changed++;
    }
  }
}

const out = `// Auto-generated from ../../newtz.txt — run scripts/generate_project_library_strict.cjs to regenerate\nexport const PROJECT_LIBRARY: any[] = ${JSON.stringify(projects, null, 2)};\n`;
fs.writeFileSync(GEN, out, 'utf8');
console.log('Sanitized names:', changed, 'entries in', GEN);
