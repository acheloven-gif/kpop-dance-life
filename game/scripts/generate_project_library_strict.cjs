const fs = require('fs');
const path = require('path');

const NEWTZ = path.resolve(__dirname, '../../newtz.txt');
const OUT = path.resolve(__dirname, '../src/utils/generated_project_library.ts');

const content = fs.readFileSync(NEWTZ, 'utf8');
const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

function looksLikeProject(line) {
  // Need a dash and an explicit 'skill:' or ' | skill' marker to reduce false positives
  if (!/[\u2013\u2014-]/.test(line)) return false;
  if (!/(?:\|\s*skill|skill\s*:)/i.test(line)) return false;
  // left side before dash should contain some Latin letters/numbers (artist names)
  const parts = line.split(/[\u2013\u2014-]/);
  const left = parts[0] || '';
  if (!/[A-Za-z0-9]/.test(left)) return false;
  return true;
}

function normalizeName(raw) {
  // remove leading numbers and dots, trim
  return raw.replace(/^\d+(?:\.\d+)*\.?\s*/, '').trim();
}

function parseLine(line) {
  // Attempt to extract name, style and proportions
  const name = normalizeName(line);

  const res = { name, style: 'Оба', duration: 'long', mixed: false };

  const skillMatch = line.match(/skill\s*[:|]?\s*([A-Za-zА-Яа-я0-9()% ,_\-]+)/i);
  if (skillMatch) {
    const s = skillMatch[1];
    if (/\bF\b/i.test(s) && !/Mixed/i.test(s)) {
      res.style = 'F';
      res.mixed = false;
    } else if (/\bM\b/i.test(s) && !/Mixed/i.test(s)) {
      res.style = 'M';
      res.mixed = false;
    } else if (/Mixed/i.test(s) || /F\d+\/?M\d+/i.test(s) || /F\s*\(/i.test(s)) {
      res.style = 'Оба';
      res.mixed = true;
      // try to parse proportions like F60/M40 or (F60/M40)
      const propMatch = s.match(/F\s*\D*?(\d{1,3})\D*M\s*\D*?(\d{1,3})/i) || s.match(/F\s*\(?\s*(\d{1,3})\s*\)?\s*\D*M\s*\(?\s*(\d{1,3})/i);
      if (propMatch) {
        const f = parseInt(propMatch[1], 10);
        const m = parseInt(propMatch[2], 10);
        if (!Number.isNaN(f) && !Number.isNaN(m)) {
          res.propF = f;
          res.propM = m;
        }
      }
    }
  }

  // detect FAST/fast keywords to set duration
  if (/\bfast\b/i.test(line)) res.duration = 'fast';

  return res;
}

const projects = [];
const seen = new Set();

for (const line of lines) {
  if (!looksLikeProject(line)) continue;
  const p = parseLine(line);
  const key = p.name.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  projects.push(p);
}

// Sort by name for determinism
projects.sort((a,b) => a.name.localeCompare(b.name, 'ru'));

const out = `// Auto-generated from ../../newtz.txt — run scripts/generate_project_library_strict.cjs to regenerate\nexport const PROJECT_LIBRARY: any[] = ${JSON.stringify(projects, null, 2)};\n`;

fs.writeFileSync(OUT, out, 'utf8');
console.log('Wrote', OUT, 'with', projects.length, 'projects');
