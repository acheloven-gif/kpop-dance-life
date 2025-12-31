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
let section = null; // 'F' | 'M' | 'Mixed' | null
const candidates = new Map();

const normalizeName = (s) => s.replace(/["'“”‘’]/g, "").trim();

for (let i = 0; i < lines.length; i++) {
  const raw = lines[i].trim();
  const low = raw.toLowerCase();
  if (!raw) continue;
  // detect section headings
  if (low.includes('жен') && low.includes('проект')) { section = 'F'; continue; }
  if (low.includes('муж') && low.includes('проект')) { section = 'M'; continue; }
  if (low.includes('смеш') && low.includes('проект')) { section = 'Mixed'; continue; }
  if (low.includes('женские проекты')) { section = 'F'; continue; }
  if (low.includes('мужские проекты')) { section = 'M'; continue; }
  if (low.includes('смешанные проекты')) { section = 'Mixed'; continue; }

  // candidate line heuristics: contains em-dash or ' - ' or words like 'Cover' 'Collab' 'Medley' or 'Cover —'
  const hasDash = /\s[—-]\s/.test(raw);
  const hasCover = /cover|collab|medley|comp|cover comp/i.test(raw);
  if (hasDash || hasCover) {
    // avoid lines that are more like headings or sentences
    if (raw.length < 4 || raw.length > 120) continue;
    // ignore lines that look like sentences (have verbs in russian)
    const rusVerb = /\b(есть|будет|может|должен|должна|шанс|происходит)\b/i;
    if (rusVerb.test(raw)) continue;
    const name = normalizeName(raw);
    // skip if it's obviously not a project (contains ':' or starts with bullet dashes or symbols)
    if (/[:]/.test(name)) continue;
    if (!candidates.has(name)) {
      const isMixed = name.includes('&') || /collab|cover|medley|comp|compilation/i.test(name) || section === 'Mixed';
      const style = section || (isMixed ? 'Mixed' : 'Mixed');
      candidates.set(name, { name, style, mixed: isMixed, propF: isMixed ? 50 : undefined, propM: isMixed ? 50 : undefined, duration: 'long' });
    }
  }
}

const arr = Array.from(candidates.values());
arr.sort((a,b) => a.name.localeCompare(b.name, 'ru'));

const header = `// Auto-generated from ../..//newtz.txt — run scripts/build_project_library_from_newtz.cjs to regenerate\n`;
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
