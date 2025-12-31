const fs = require('fs');
const path = require('path');

const GEN = path.resolve(__dirname, '../src/utils/generated_project_library.ts');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const content = fs.readFileSync(GEN, 'utf8');
// require the generated file to get the array
const gen = require(GEN);
const projects = gen.PROJECT_LIBRARY;

let updated = 0;

for (const p of projects) {
  // trainingCost: 150-400
  if (p.trainingCost == null) {
    p.trainingCost = randInt(150, 400);
    updated++;
  }
  // costumeCost: FAST 1000-5000, LONG 3000-10000
  if (p.costumeCost == null) {
    const dur = (p.duration || '').toString().toLowerCase();
    if (dur === 'fast') {
      p.costumeCost = randInt(1000, 5000);
    } else {
      p.costumeCost = randInt(3000, 10000);
    }
    updated++;
  }
}

// Preserve existing formatting: rewrite file as export const PROJECT_LIBRARY: any[] = ...
const out = `// Auto-generated from ../../newtz.txt — run scripts/generate_project_library_strict.cjs to regenerate\nexport const PROJECT_LIBRARY: any[] = ${JSON.stringify(projects, null, 2)};\n`;
fs.writeFileSync(GEN, out, 'utf8');
console.log('Updated', updated, 'fields in', GEN);
