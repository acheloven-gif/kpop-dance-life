import { NPC, Team, BehaviorModel } from '../types/game';
import TEAM_NAMES from '../data/teamNames';

const UNIQUE_NICKNAMES = [
  'Ame', 'Nori', 'Mika', 'Lira', 'Koi', 'Lumi', 'Rhea', 'Nyra', 'Vyn', 'Sava',
  'Rei', 'Juno', 'Anzu', 'Mina', 'Kira', 'Rumi', 'Aris', 'Sena', 'Kirae', 'Nova',
  'Zara', 'Axel', 'Luna', 'Orion', 'Pixel', 'Nova', 'Echo', 'Sage', 'Raven', 'Storm'
];

const FEMALE_NAMES = [
  'Алина', 'Маша', 'Дарья', 'Юлия', 'София', 'Олеся', 'Вика', 'Лена', 'Настя',
  'Таня', 'Марина', 'Ира', 'Катя', 'Света', 'Полина', 'Оксана', 'Лиза', 'Ася', 'Карина'
];

const MALE_NAMES = [
  'Даня', 'Артём', 'Максим', 'Илья', 'Лёша', 'Влад', 'Костя', 'Дима', 'Андрей',
  'Коля', 'Саша', 'Игорь', 'Рома', 'Тима', 'Паша'
];

const BEHAVIOR_MODELS: { model: BehaviorModel; probability: number }[] = [
  { model: 'Burner', probability: 0.18 },
  { model: 'Dreamer', probability: 0.14 },
  { model: 'Perfectionist', probability: 0.12 },
  { model: 'Sunshine', probability: 0.20 },
  { model: 'Machine', probability: 0.10 },
  { model: 'Wildcard', probability: 0.08 },
  { model: 'Fox', probability: 0.10 },
  { model: 'SilentPro', probability: 0.08 },
];

const FACE_IDS = [
  // Numeric IDs from normalized avatars
  '1764196876.png', '1764196888.png', '1764196927.png', '1764197016.png', '1764197085.png',
  '1764197326.png', '1764197379.png', '1764197501.png', '1764197621.png', '1764197693.png',
  '1764197837.png', '1764197848.png', '1764197943.png', '1764197962.png', '1764198019.png',
  '1764198142.png', '1765056033.png', '1765056057.png', '1765056104.png', '1765056129.png',
  '1765056155.png', '1765056210.png', '1765056260.png', '1765056464.png', '1765056507.png',
  '1765056580.png', '1765056601.png', '1765056623.png', '1765056654.png', '1765056724.png',
  '1765056796.png', '1765207060.png', '1765207097.png', '1765207128.png', '1765207174.png',
  '1765207511.png', '1765207548.png', '1765207658.png', '1765207894.png', '1765208032.png',
  '1765208073.png', 'm1.png', 'm2.png', 'm3.png', 'm4.png', 'm5.png', 'm6.png', 'm7.png',
  'm8.png', 'm9.png', 'm10.png', 'm11.png', 'm12.png',
];

// TEAM_NAMES provided by data/teamNames.ts

const TEAM_ICONS = [
  // Named icons
  '44Floor.png', 'AkiNova.png', 'beatzilla.png', 'Blue Arcadia.png',
  'boomlette.png', 'Darkrise 11.png', 'drop&roll.png', 'ghosty hug.png',
  'glowbite.png', 'Kurotsume.png', 'Minari8.png', 'moonblink.png',
  'OneSecondLater.png', 'purple hush.png', 'RakuNine.png', 'sssquad.png',
  'Wolfshift.png', 'влюблённый бит.png', 'кик-кью.png', 'лимонад внутри.png',
  'рррр!.png', 'щёлк!.png',
  // Random icons
  'random1.png', 'random2.png', 'random3.png', 'random4.png', 'random5.png', 'random6.png'
];

export class NPCGenerator {
  private usedNicknames = new Set<string>();

  private getRandomBirthDate(): string {
    const month = Math.floor(Math.random() * 12) + 1;
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const day = Math.floor(Math.random() * daysInMonth[month - 1]) + 1;
    return `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
  }

  private getRandomBehavior(): BehaviorModel {
    const rand = Math.random();
    let sum = 0;
    for (const { model, probability } of BEHAVIOR_MODELS) {
      sum += probability;
      if (rand <= sum) return model;
    }
    return 'Burner';
  }

  private getRandomName(gender: 'M' | 'F'): string {
    // 60% вероятность уникального никнейма
    if (Math.random() < 0.6) {
      const availableNicknames = UNIQUE_NICKNAMES.filter(n => !this.usedNicknames.has(n));
      if (availableNicknames.length > 0) {
        const nickname = availableNicknames[Math.floor(Math.random() * availableNicknames.length)];
        this.usedNicknames.add(nickname);
        return nickname;
      }
    }

    // Обычное имя
    const names = gender === 'F' ? FEMALE_NAMES : MALE_NAMES;
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomFaceId(gender: 'M' | 'F'): string {
    // Filter faces by gender: 'm' prefix = male, numeric-only = female
    const filteredFaces = FACE_IDS.filter(id => {
      const isMaleFace = id.includes('m');
      return gender === 'M' ? isMaleFace : !isMaleFace;
    });
    return filteredFaces[Math.floor(Math.random() * filteredFaces.length)];
  }

  generateNPC(index: number): NPC {
    const gender = Math.random() < 0.9 ? 'F' : 'M';
    const favoriteStyle = Math.random() < 0.33 ? 'F_style' : Math.random() < 0.66 ? 'M_style' : 'Both';
    const behaviorModel = this.getRandomBehavior();
    const level = Math.random();
    let fSkill, mSkill;

    // Desired distribution: Beginner 70% / Middle 20% / Pro 10%
    if (level < 0.7) {
      // Beginner 100-400
      fSkill = Math.floor(Math.random() * 301) + 100;
      mSkill = Math.floor(Math.random() * 301) + 100;
    } else if (level < 0.9) {
      // Middle 401-700
      fSkill = Math.floor(Math.random() * 300) + 401;
      mSkill = Math.floor(Math.random() * 300) + 401;
    } else {
      // Pro 701-1000
      fSkill = Math.floor(Math.random() * 300) + 701;
      mSkill = Math.floor(Math.random() * 300) + 701;
    }

    return {
      id: `npc_${index}`,
      name: this.getRandomName(gender),
      gender,
      faceId: this.getRandomFaceId(gender),
      fSkill,
      mSkill,
      popularity: Math.floor(Math.random() * 501),
      reputation: Math.floor(Math.random() * 1001) - 500,
      favoriteStyle,
      behaviorModel,
      teamId: null,
      createdAt: Date.now(),
      lastTrainedDay: Math.floor(Math.random() * 7),
      daysWithoutTraining: 0,
      birthDate: this.getRandomBirthDate(),
      relationshipPoints: 0, // Начальное значение - незнакомцы
    };
  }

  generateNPCs(count: number): NPC[] {
    const npcs: NPC[] = [];
    // 37% NPC будут иметь закрытый чат
    const privateChatsCount = Math.ceil(count * 0.37);
    const privateIndices = new Set<number>();
    
    // Случайно выбираем индексы для NPC с закрытым чатом
    while (privateIndices.size < privateChatsCount) {
      privateIndices.add(Math.floor(Math.random() * count));
    }
    
    for (let i = 0; i < count; i++) {
      const npc = this.generateNPC(i);
      if (privateIndices.has(i)) {
        npc.hasPrivateChat = true;
      }
      npcs.push(npc);
    }
    return npcs;
  }
}

export class TeamGenerator {
  private usedRandomIcons = new Set<string>();
  
  // Проверить совместимость двух NPC для команды
  private isCompatible(npc1: NPC, npc2: NPC, level: 'Новичок' | 'Мидл' | 'Топ'): boolean {
    const skill1 = (npc1.fSkill + npc1.mSkill) / 2;
    const skill2 = (npc2.fSkill + npc2.mSkill) / 2;
    const skillDiff = Math.abs(skill1 - skill2);

    if (level === 'Новичок') {
      // Новичок: разница до 40 единиц, без ограничений по стилям
      return skillDiff <= 40;
    } else if (level === 'Мидл') {
      // Middle: разница до 25 единиц
      // Нельзя женский + мужской стиль вместе
      if (skillDiff > 25) return false;
      
      const f_style1 = npc1.favoriteStyle === 'F_style';
      const f_style2 = npc2.favoriteStyle === 'F_style';
      const m_style1 = npc1.favoriteStyle === 'M_style';
      const m_style2 = npc2.favoriteStyle === 'M_style';
      
      // Нельзя чистый женский + чистый мужской
      if ((f_style1 && m_style2) || (m_style1 && f_style2)) {
        return false;
      }
      return true;
    } else {
      // Pro: разница до 15 единиц
      // Нельзя женский + мужской стиль вместе
      if (skillDiff > 15) return false;
      
      const f_style1 = npc1.favoriteStyle === 'F_style';
      const f_style2 = npc2.favoriteStyle === 'F_style';
      const m_style1 = npc1.favoriteStyle === 'M_style';
      const m_style2 = npc2.favoriteStyle === 'M_style';
      
      // Нельзя чистый женский + чистый мужской
      if ((f_style1 && m_style2) || (m_style1 && f_style2)) {
        return false;
      }
      return true;
    }
  }

  generateTeams(npcs: NPC[], teamCount: number): Team[] {
    const teams: Team[] = [];
    const usedNPCIds = new Set<string>();
    const usedTeamNames = new Set<string>();
    const availableTeamNames = [...TEAM_NAMES]; // копируем список для уникальности

    // Cap requested team count by number of available unique names
    if (teamCount > availableTeamNames.length) teamCount = availableTeamNames.length;

    // Сортируем NPC по среднему скиллу для лучшей организации
    const sortedNpcs = [...npcs].sort((a, b) => {
      const skillA = (a.fSkill + a.mSkill) / 2;
      const skillB = (b.fSkill + b.mSkill) / 2;
      return skillA - skillB;
    });

    // --- ГЛАВНОЕ: Ограничить максимум NPC в командах ---
    // Нужно, чтобы не менее 35% NPC остались без команды
    // Распределяем этих 35% СЛУЧАЙНО, чтобы они были из всех уровней скилла
    const totalNPCs = sortedNpcs.length;
    const npcToExclude = Math.ceil(totalNPCs * 0.35); // 35% без команды
    const maxInTeams = totalNPCs - npcToExclude; // максимум 65% NPC в командах
    
    // Случайно выбираем индексы NPC для исключения (распределяем по всем уровням)
    const excludeIndices = new Set<number>();
    while (excludeIndices.size < npcToExclude && totalNPCs > 0) {
      excludeIndices.add(Math.floor(Math.random() * totalNPCs));
    }
    
    let assignedToTeams = 0;

    const pickMembersForLevel = (level: 'Новичок' | 'Мидл' | 'Топ', size: number): string[] => {
      const chosen: string[] = [];
      const availableNpcs = sortedNpcs.filter((n, idx) => !usedNPCIds.has(n.id) && !excludeIndices.has(idx));

      if (availableNpcs.length === 0) return chosen;

      // Если уже набрали максимум NPC в команды — не добавляем больше
      if (assignedToTeams >= maxInTeams) return chosen;

      // Корректируем размер команды, чтобы не превысить лимит
      const maxSize = Math.min(size, maxInTeams - assignedToTeams);
      if (maxSize < 3) return chosen;

      // Выбираем первого NPC из подходящего сегмента в зависимости от уровня
      let currentMemberIndex = 0;
      if (level === 'Новичок') {
        currentMemberIndex = Math.floor(Math.random() * Math.min(3, availableNpcs.length));
      } else if (level === 'Мидл') {
        const midStart = Math.floor(availableNpcs.length / 3);
        const range = Math.max(1, Math.min(3, Math.floor(availableNpcs.length / 3)));
        currentMemberIndex = midStart + Math.floor(Math.random() * range);
      } else {
        const len = availableNpcs.length;
        currentMemberIndex = Math.max(0, len - 1 - Math.floor(Math.random() * Math.min(3, len)));
      }
      const firstNpc = availableNpcs[currentMemberIndex];
      chosen.push(firstNpc.id);
      usedNPCIds.add(firstNpc.id);

      // Добираем остальных членов с проверкой совместимости
      while (chosen.length < maxSize && availableNpcs.length > 0) {
        let foundCompatible = false;
        for (let i = 0; i < availableNpcs.length; i++) {
          const candidateNpc = availableNpcs[i];
          if (usedNPCIds.has(candidateNpc.id)) continue;
          const isCompatibleWithAll = chosen.every(memberId => {
            const member = npcs.find(n => n.id === memberId);
            return member && this.isCompatible(member, candidateNpc, level);
          });
          if (isCompatibleWithAll) {
            chosen.push(candidateNpc.id);
            usedNPCIds.add(candidateNpc.id);
            foundCompatible = true;
            break;
          }
        }
        if (!foundCompatible) break;
      }
      // Если команда не достаточного размера, отменяем и возвращаем пусто
      if (chosen.length < 3) {
        chosen.forEach(id => usedNPCIds.delete(id));
        return [];
      }
      // Учитываем новых участников
      assignedToTeams += chosen.length;
      return chosen;
    };

    // Генерируем команды с приоритетом: сначала Новичок, потом Мидл, потом Топ
    const levelPriorities: Array<'Новичок' | 'Мидл' | 'Топ'> = [];
    for (let i = 0; i < teamCount * 0.4; i++) levelPriorities.push('Новичок');
    for (let i = 0; i < teamCount * 0.4; i++) levelPriorities.push('Мидл');
    for (let i = 0; i < teamCount * 0.2; i++) levelPriorities.push('Топ');

    let teamCounter = 0;
    for (let i = 0; i < levelPriorities.length; i++) {
      const desiredLevel = levelPriorities[i];
      const teamSize = Math.floor(Math.random() * 18) + 3; // 3-20 участников

      const memberIds = pickMembersForLevel(desiredLevel, teamSize);
      if (memberIds.length < 3) continue; // Пропустить эту итерацию, перейти к следующей

      const memberSkills = memberIds
        .map(id => {
          const npc = npcs.find(n => n.id === id);
          return npc ? (npc.fSkill + npc.mSkill) / 2 : 0;
        });

      const avgSkill = memberSkills.reduce((a, b) => a + b, 0) / memberSkills.length;
      const teamLevel: 'Новичок' | 'Мидл' | 'Топ' = avgSkill <= 300 ? 'Новичок' : avgSkill <= 700 ? 'Мидл' : 'Топ';

      const teamPopularity = memberIds
        .map(id => {
          const npc = npcs.find(n => n.id === id);
          return npc ? npc.popularity : 0;
        })
        .reduce((a, b) => a + b, 0) / memberIds.length;

      const teamRating = avgSkill * 0.7 + teamPopularity * 0.3;

      // Выбираем лидера команды - самый скилловый участник с Burner/Perfectionist/Machine поведением или оба стиля
      let leaderId: string | undefined = undefined;
      let maxLeaderScore = -1;
      for (const memberId of memberIds) {
        const member = npcs.find(n => n.id === memberId);
        if (!member) continue;
        
        const dominantSkill = Math.max(member.fSkill || 0, member.mSkill || 0);
        const isBothStyles = member.favoriteStyle === 'Both';
        const isPowerBehavior = member.behaviorModel === 'Burner' || member.behaviorModel === 'Perfectionist' || member.behaviorModel === 'Machine';
        
        // Лидер должен быть либо с обоими стилями, либо с Burner/Perfectionist/Machine поведением, ИЛИ просто самый скилловый
        let leaderScore = dominantSkill;
        if (isBothStyles) leaderScore += 20;
        if (isPowerBehavior) leaderScore += 15;
        
        if (leaderScore > maxLeaderScore) {
          maxLeaderScore = leaderScore;
          leaderId = memberId;
        }
      }

      // Выбираем уникальное имя команды из доступных
      let teamName: string;
      if (availableTeamNames.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTeamNames.length);
        teamName = availableTeamNames[randomIndex];
        availableTeamNames.splice(randomIndex, 1); // Удаляем использованное имя
      } else {
        // Если все имена использованы, создаём резервное имя
        teamName = `Team ${teamCounter}`;
      }
      usedTeamNames.add(teamName);

      // choose icon: only use a named icon if it exactly matches the team name
      const expectedNamedIcon = `${teamName}.png`;
      const namedIcons = TEAM_ICONS.filter(icon => !icon.startsWith('random'));
      const randomIcons = TEAM_ICONS.filter(icon => icon.startsWith('random'));
      let chosenIcon = '';
      
      if (namedIcons.includes(expectedNamedIcon)) {
        chosenIcon = expectedNamedIcon;
      } else {
        // fallback: pick from random icons that haven't been used yet
        const availableRandomIcons = randomIcons.filter(icon => !this.usedRandomIcons.has(icon));
        if (availableRandomIcons.length > 0) {
          chosenIcon = availableRandomIcons[Math.floor(Math.random() * availableRandomIcons.length)];
          this.usedRandomIcons.add(chosenIcon);
        } else {
          // If all random icons are used, cycle back to the beginning
          this.usedRandomIcons.clear();
          chosenIcon = randomIcons[Math.floor(Math.random() * randomIcons.length)];
          this.usedRandomIcons.add(chosenIcon);
        }
      }

      // Новая команда должна стартовать с низкой популярностью (0-20)
      // Популярность команды будет расти со временем через события и выступления
      // Не наследуем популярность членов при создании новой команды
      const newTeamPopularity = Math.floor(Math.random() * 21); // 0-20 для новой команды

      teams.push({
        id: `team_${teamCounter}`,
        name: teamName,
        memberIds,
        leaderId,
        teamSkill: Math.round(avgSkill),
        teamLevel,
        popularity: Math.floor(Math.random() * 501),
        reputation: Math.floor(Math.random() * 1001) - 500,
        teamRating: Math.round(avgSkill * 0.7 + (newTeamPopularity / 100) * 1000 * 0.3),
        createdAt: Date.now(),
        iconFile: chosenIcon,
      });

      // Обновляем teamId для каждого NPC
      memberIds.forEach(id => {
        const npc = npcs.find(n => n.id === id);
        if (npc) npc.teamId = `team_${teamCounter}`;
      });
      
      teamCounter++;
    }

    // Гарантируем минимум 3 команды
    if (teams.length < 3) {
      console.warn(`⚠️ Сгенерировано только ${teams.length} команд, требуется минимум 3. Пытаемся создать дополнительные...`);
      
      // Пытаемся создать недостающие команды
      const missingTeams = 3 - teams.length;
      const usedNPCIds = new Set<string>();
      
      // Соберем все использованные NPC из существующих команд
      teams.forEach(t => {
        t.memberIds.forEach(id => usedNPCIds.add(id));
      });
      
      for (let attempt = 0; attempt < missingTeams; attempt++) {
        const availableNpcs = npcs.filter(n => !usedNPCIds.has(n.id) && n.activeStatus !== false);
        
        if (availableNpcs.length < 3) {
          console.warn(`⚠️ Недостаточно свободных NPC для создания дополнительной команды (доступно: ${availableNpcs.length})`);
          break;
        }
        
        // Случайно выбираем уровень команды
        const levels: Array<'Новичок' | 'Мидл' | 'Топ'> = ['Новичок', 'Мидл', 'Топ'];
        const level = levels[Math.floor(Math.random() * levels.length)];
        
        // Выбираем 3-8 случайных свободных NPC
        const teamSize = Math.min(3 + Math.floor(Math.random() * 6), availableNpcs.length);
        const memberIds = availableNpcs.slice(0, teamSize).map(n => n.id);
        memberIds.forEach(id => usedNPCIds.add(id));
        
        // Создаем команду
        const memberSkills = memberIds.map(id => {
          const npc = npcs.find(n => n.id === id);
          return npc ? (npc.fSkill + npc.mSkill) / 2 : 0;
        });
        
        const avgSkill = memberSkills.reduce((a, b) => a + b, 0) / memberSkills.length;
        const memberPopularity = memberIds.map(id => {
          const npc = npcs.find(n => n.id === id);
          return npc ? npc.popularity : 0;
        }).reduce((a, b) => a + b, 0) / memberIds.length;
        
        // Выбираем лидера
        let leaderId: string | undefined = undefined;
        let maxLeaderScore = -1;
        for (const memberId of memberIds) {
          const member = npcs.find(n => n.id === memberId);
          if (!member) continue;
          
          const dominantSkill = Math.max(member.fSkill || 0, member.mSkill || 0);
          let leaderScore = dominantSkill;
          if (member.favoriteStyle === 'Both') leaderScore += 20;
          if (['Burner', 'Perfectionist', 'Machine'].includes(member.behaviorModel)) leaderScore += 15;
          
          if (leaderScore > maxLeaderScore) {
            maxLeaderScore = leaderScore;
            leaderId = memberId;
          }
        }
        
        // Выбираем имя команды
        let teamName: string;
        if (availableTeamNames.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableTeamNames.length);
          teamName = availableTeamNames[randomIndex];
          availableTeamNames.splice(randomIndex, 1);
        } else {
          teamName = `Emergency Team ${teams.length + 1}`;
        }
        
        // Выбираем иконку
        const namedIcons = TEAM_ICONS.filter(icon => !icon.startsWith('random'));
        const randomIcons = TEAM_ICONS.filter(icon => icon.startsWith('random'));
        let chosenIcon = '';
        
        const expectedNamedIcon = `${teamName}.png`;
        if (namedIcons.includes(expectedNamedIcon)) {
          chosenIcon = expectedNamedIcon;
        } else {
          const availableRandomIcons = randomIcons.filter(icon => !this.usedRandomIcons.has(icon));
          if (availableRandomIcons.length > 0) {
            chosenIcon = availableRandomIcons[Math.floor(Math.random() * availableRandomIcons.length)];
            this.usedRandomIcons.add(chosenIcon);
          } else {
            this.usedRandomIcons.clear();
            chosenIcon = randomIcons[Math.floor(Math.random() * randomIcons.length)];
            this.usedRandomIcons.add(chosenIcon);
          }
        }
        
        teams.push({
          id: `team_${teamCounter}`,
          name: teamName,
          memberIds,
          leaderId,
          teamSkill: Math.round(avgSkill),
          teamLevel: avgSkill <= 300 ? 'Новичок' : avgSkill <= 700 ? 'Мидл' : 'Топ',
          popularity: Math.floor(Math.random() * 201),
          reputation: Math.floor(Math.random() * 1001) - 500,
          teamRating: Math.round(avgSkill * 0.7 + (memberPopularity / 100) * 1000 * 0.3),
          createdAt: Date.now(),
          iconFile: chosenIcon,
        });
        
        // Обновляем teamId для NPC
        memberIds.forEach(id => {
          const npc = npcs.find(n => n.id === id);
          if (npc) npc.teamId = `team_${teamCounter}`;
        });
        
        teamCounter++;
        console.log(`✅ Создана дополнительная команда: ${teamName}`);
      }
    }

    return teams;
  }
}
