const fs = require('fs');
const path = require('path');

const newtzPath = path.join(__dirname, '..', '..', 'newtz.txt');
const outPath = path.join(__dirname, '..', 'src', 'utils', 'generated_project_library.ts');

const txt = fs.existsSync(newtzPath) ? fs.readFileSync(newtzPath, 'utf8') : '';
if (!txt) {
  console.error('newtz.txt not found');
  process.exit(1);
}

const lines = txt.split(/\r?\n/);
const projects = new Map();
const latinRe = /[A-Za-z0-9]/;
const rusWords = /(этап|событие|проекты|проекта|проекта|если|каждый|проект|команда|настройки|время|день)/i;

for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!line) continue;
  // focus on lines with em-dash or ascii dash with spaces
  const dashMatch = line.match(/\s[—-]\s/);
  if (!dashMatch) continue;
  const parts = line.split(/\s[—-]\s/);
  if (parts.length < 2) continue;
  const left = parts[0].trim();
  const right = parts.slice(1).join(' - ').trim();
  // left must contain latin letters or digits (artist names are mostly latin/K-pop groups)
  if (!latinRe.test(left)) continue;
  // exclude left that contain russian words
  if (rusWords.test(left) || rusWords.test(right)) continue;
  // avoid lines that look like headings (short words like '1.' etc)
  if (/^\d+\.?$/.test(left)) continue;
  // right should not be too long and should contain letters
  if (right.length < 2 || right.length > 80) continue;
  // avoid sentences (if right contains verbs in russian)
  if (rusWords.test(right)) continue;
  const name = `${left} — ${right}`;
  if (!projects.has(name)) {
    // small heuristic: consider mixed if left contains '&' or ' & ' or 'Collab' or 'Cover'
    const isMixed = /&|collab|cover|medley|comp/i.test(name);
    const style = isMixed ? 'Mixed' : (/[A-Z]{2,}/.test(left) ? 'Mixed' : 'Mixed');
    projects.set(name, { name, style, mixed: isMixed, propF: isMixed ? 50 : undefined, propM: isMixed ? 50 : undefined, duration: 'long' });
  }
}

const arr = Array.from(projects.values());
arr.sort((a,b) => a.name.localeCompare(b.name, 'en'));

const header = `// Auto-generated from ../..//newtz.txt — run scripts/extract_projects_only.cjs to regenerate\n`;
let out = header + "export const PROJECT_LIBRARY: any[] = [\n";
for (const p of arr) {
  const parts = [];
  parts.push(`name: ${JSON.stringify(p.name)}`);
  parts.push(`style: ${JSON.stringify(p.style)}`);
  parts.push(`duration: ${JSON.stringify(p.duration)}`);
  parts.push(`mixed: ${p.mixed ? 'true' : 'false'}`);
  if (p.mixed) {
    parts.push(`propF: ${p.propF}`);
    parts.push(`propM: ${p.propM}`);
  }
  out += `  { ${parts.join(', ')} },\n`;
}
out += `];\n`;
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath, 'with', arr.length, 'projects');
process.exit(0);
