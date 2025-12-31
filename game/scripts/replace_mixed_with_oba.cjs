const fs = require('fs');
const p = 'c:/Users/2ой пользователь/kpop/game/src/utils/generated_project_library.ts';
let s = fs.readFileSync(p, 'utf8');
s = s.split('style: "Mixed"').join('style: "Оба"');
fs.writeFileSync(p, s, 'utf8');
console.log('Replaced occurrences in', p);
