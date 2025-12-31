// Диагностический скрипт для проверки распределения NPC по командам
// Запустить: npx ts-node check_team_distribution.ts

import { NPCGenerator, TeamGenerator } from './game/src/utils/generators';
import TEAM_NAMES from './game/src/data/teamNames';

console.log('🔍 Проверка распределения NPC по командам...\n');

const npcGen = new NPCGenerator();
const teamGen = new TeamGenerator();

const npcs = npcGen.generateNPCs(100);
const teams = teamGen.generateTeams(npcs, 20);

// 1. Проверка: есть ли NPC без команды?
const npcsWithoutTeam = npcs.filter(npc => !npc.teamId);
console.log(`✓ NPC без команды: ${npcsWithoutTeam.length} из ${npcs.length}`);
if (npcsWithoutTeam.length > 0) {
  console.log(`  ⚠️ ПРОБЛЕМА: Есть ${npcsWithoutTeam.length} NPC без команды!`);
}

// 2. Проверка: есть ли команды без лидера?
const teamsWithoutLeader = teams.filter(team => !team.leaderId);
console.log(`✓ Команды без лидера: ${teamsWithoutLeader.length} из ${teams.length}`);
if (teamsWithoutLeader.length > 0) {
  console.log(`  ⚠️ ПРОБЛЕМА: Есть ${teamsWithoutLeader.length} команд без лидера!`);
  teamsWithoutLeader.forEach(team => {
    console.log(`    - ${team.name}: ${team.memberIds.length} членов`);
  });
}

// 3. Проверка: правильно ли рассчитан уровень команды?
console.log(`\n📊 Распределение по уровням:`);
console.log(`  Beginner: ${teams.filter(t => t.teamLevel === 'Beginner').length}`);
console.log(`  Middle: ${teams.filter(t => t.teamLevel === 'Middle').length}`);
console.log(`  Pro: ${teams.filter(t => t.teamLevel === 'Pro').length}`);

// 4. Проверка совместимости членов команды по стилям (для Middle и Pro)
console.log(`\n🎭 Проверка совместимости по стилям (Middle/Pro):`);
let styleMismatchCount = 0;

teams.forEach(team => {
  if (team.teamLevel === 'Middle' || team.teamLevel === 'Pro') {
    const members = team.memberIds.map(id => npcs.find(n => n.id === id)).filter(Boolean) as any[];
    const styles = members.map(m => m.favoriteStyle);
    
    const hasFStyle = styles.includes('F_style');
    const hasMStyle = styles.includes('M_style');
    
    if (hasFStyle && hasMStyle) {
      console.log(`  ⚠️ ${team.name}: Смешаны стили (F + M)`);
      styleMismatchCount++;
    }
  }
});

if (styleMismatchCount === 0) {
  console.log(`  ✓ Нет нарушений совместимости по стилям`);
}

// 5. Проверка: все ли члены команды присутствуют в npcs?
console.log(`\n✅ Проверка целостности данных:`);
let integrityIssues = 0;

teams.forEach(team => {
  team.memberIds.forEach(memberId => {
    const npc = npcs.find(n => n.id === memberId);
    if (!npc) {
      console.log(`  ⚠️ ${team.name}: NPC ${memberId} не найден в списке`);
      integrityIssues++;
    }
  });
});

if (integrityIssues === 0) {
  console.log(`  ✓ Все члены команд найдены в списке NPC`);
}

// 6. Проверка лидеров
console.log(`\n👑 Проверка лидеров:`);
let leaderIssues = 0;

teams.forEach(team => {
  if (!team.leaderId) return;
  const leader = npcs.find(n => n.id === team.leaderId);
  if (!leader) {
    console.log(`  ⚠️ ${team.name}: Лидер ${team.leaderId} не найден`);
    leaderIssues++;
  } else if (!team.memberIds.includes(team.leaderId)) {
    console.log(`  ⚠️ ${team.name}: Лидер ${leader.name} не входит в состав команды`);
    leaderIssues++;
  }
});

if (leaderIssues === 0) {
  console.log(`  ✓ Все лидеры корректны`);
}

// 7. Примеры команд
console.log(`\n📝 Примеры некоторых команд:`);
teams.slice(0, 3).forEach(team => {
  const members = team.memberIds.map(id => npcs.find(n => n.id === id)).filter(Boolean) as any[];
  const leader = members.find(m => m.id === team.leaderId);
  console.log(`\n  ${team.name} (${team.teamLevel}, рейтинг: ${team.teamRating})`);
  console.log(`    Лидер: ${leader?.name || 'N/A'}`);
  console.log(`    Участников: ${members.length}`);
  console.log(`    Стили: ${members.map(m => m.favoriteStyle).join(', ')}`);
});

console.log(`\n✨ Проверка завершена!`);
