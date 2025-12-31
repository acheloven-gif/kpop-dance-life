import { Project } from '../types/game';
import { PROJECT_LIBRARY } from './generated_project_library';

export const projectGenerator = {
  // Generate a team project tailored to a team's dominant style and average level
  generateTeamProject(team: any, indexSeed: number, player?: any) {
    // Select a template matching dominant style
    let candidates = PROJECT_LIBRARY;
    try {
      // Accept both English 'Mixed' and Russian 'Оба' as mixed-style tags
      if (team.dominantStyle === 'F_style') candidates = PROJECT_LIBRARY.filter(t => t.style === 'F' || t.style === 'Mixed' || t.style === 'Оба');
      else if (team.dominantStyle === 'M_style') candidates = PROJECT_LIBRARY.filter(t => t.style === 'M' || t.style === 'Mixed' || t.style === 'Оба');
      else candidates = PROJECT_LIBRARY.filter(t => t.style === 'Mixed' || t.style === 'Оба' || t.style === 'F' || t.style === 'M');
      if (!candidates || candidates.length === 0) candidates = PROJECT_LIBRARY;
    } catch (e) {
      candidates = PROJECT_LIBRARY;
    }
    const template = candidates[Math.floor(Math.random() * candidates.length)];
    const proj = this.generateProjectFromTemplate(template, indexSeed, player);
    // tailor min skill required to team's avgDominant when available
    const avg = Math.round(team.avgDominant || team.teamSkill || 50);
    if (proj.requiredSkill === 'Both') {
      proj.minSkillRequired_F = Math.max(0, Math.round(avg * 0.6));
      proj.minSkillRequired_M = Math.max(0, Math.round(avg * 0.6));
    } else if (proj.requiredSkill === 'F_skill') {
      proj.minSkillRequired = Math.max(0, avg);
      proj.minSkillRequired_F = proj.minSkillRequired;
    } else {
      proj.minSkillRequired = Math.max(0, avg);
      proj.minSkillRequired_M = proj.minSkillRequired;
    }
    proj.isTeamProject = true;
    proj.specialTag = 'Командный';
    // shiny border color based on team level
    const lvl = team.teamLevel || 'Мидл';
    proj.shinyBorderColor = lvl === 'Топ' ? '#FFD700' : lvl === 'Мидл' ? '#C0C0C0' : '#CD7F32';
    return proj as any;
  },
  // Generates a single project based on a template and the player's current skills
  generateProjectFromTemplate(template: any, indexSeed: number, player?: any): Project {
    // Determine durationWeeks according to newtz: 50% fast (2-8 weeks), 50% long (9-20 weeks)
    const isFast = Math.random() < 0.5;
    const durationWeeks = isFast ? (2 + Math.floor(Math.random() * 7)) : (9 + Math.floor(Math.random() * 12));
    
    // Гарантируем, что проект можно выполнить за срок при 2-3 тренировках в неделю с запасом 7 дней
    // 60% случаев: 2 тренировки в неделю, 40% - 3 тренировки в неделю
    const use2Trainings = Math.random() < 0.6;
    const trainingPerWeek = use2Trainings ? 2 : 3;
    // Оставляем запас 7 дней (примерно 1 неделю) на случай непредвиденных ситуаций
    const effectiveWeeks = Math.max(1, durationWeeks - 1);
    const totalTrainingsRequired = effectiveWeeks * trainingPerWeek;

    // required skill type
    const requiredSkillType: 'F_skill' | 'M_skill' | 'Both' = template.mixed ? 'Both' : (template.style === 'F' ? 'F_skill' : 'M_skill');

    // For mixed templates ensure ratios exist
    const ratioF = template.mixed ? (template.propF ?? (30 + Math.floor(Math.random() * 41))) : undefined;
    const ratioM = template.mixed ? (template.propM ?? (100 - (ratioF ?? 50))) : undefined;

    // Base player skills; determine player's skill level (Новичок/Мидл/Топ)
    const playerF = player?.fSkill ?? 300;
    const playerM = player?.mSkill ?? 300;
    const playerAvg = Math.round((playerF + playerM) / 2);
    const getTierLabel = (skill: number) => skill <= 300 ? 'Новичок' : skill <= 700 ? 'Мидл' : 'Топ';
    const playerTier = getTierLabel(playerAvg);

    // Distribute projects by skill according to newtz: 50% at player level, 20% below, 30% above
    const distribution = Math.random();
    let requiredBase = playerAvg;
    if (distribution < 0.5) {
      // 50% at player's level: close (±0..7%)
      const pct = (Math.random() * 7) / 100;
      const sign = Math.random() < 0.5 ? -1 : 1;
      requiredBase = Math.max(0, Math.round(playerAvg + sign * Math.round(playerAvg * pct)));
    } else if (distribution < 0.7) {
      // 20% below player's level: clamp to same tier if Beginner, else go to lower tier
      if (playerTier === 'Новичок') {
        // Already at minimum tier, stay in Новичок range
        requiredBase = Math.max(0, Math.round(playerAvg - Math.random() * 50));
      } else if (playerTier === 'Топ') {
        // Go to Мидл tier (300-700)
        requiredBase = Math.round(300 + Math.random() * 400);
      } else {
        // Go to Новичок tier (0-300)
        requiredBase = Math.round(Math.random() * 300);
      }
    } else {
      // 30% above player's level: clamp to same tier if Топ, else go to higher tier
      if (playerTier === 'Топ') {
        // Already at maximum tier, stay in Топ range
        requiredBase = Math.min(1000, Math.round(playerAvg + Math.random() * 50));
      } else if (playerTier === 'Новичок') {
        // Go to Мидл tier (300-700)
        requiredBase = Math.round(300 + Math.random() * 400);
      } else {
        // Go to Топ tier (700-1000)
        requiredBase = Math.round(700 + Math.random() * 300);
      }
    }

    // Map requiredBase to minSkillRequired for F / M depending on requiredSkillType
    let minSkillRequired = 0;
    let minSkillRequired_F = 0;
    let minSkillRequired_M = 0;

    if (requiredSkillType === 'Both') {
      minSkillRequired_F = Math.round(requiredBase * ((ratioF ?? 50) / 100));
      minSkillRequired_M = Math.round(requiredBase * ((ratioM ?? 50) / 100));
      minSkillRequired = Math.max(minSkillRequired_F, minSkillRequired_M);
    } else if (requiredSkillType === 'F_skill') {
      // derive from player's F skill distribution rather than avg
      const base = Math.round(playerF * (requiredBase / Math.max(1, playerAvg)));
      minSkillRequired_F = base;
      minSkillRequired = base;
    } else {
      const base = Math.round(playerM * (requiredBase / Math.max(1, playerAvg)));
      minSkillRequired_M = base;
      minSkillRequired = base;
    }

    return {
      id: `project_${Date.now()}_${indexSeed}`,
      name: template.name,
      requiredSkill: requiredSkillType,
      minSkillRequired: template.mixed ? undefined : minSkillRequired,
      minSkillRequired_F,
      minSkillRequired_M,
      trainingNeeded: totalTrainingsRequired,
      duration: isFast ? 'fast' : 'long', // store actual randomized duration, not template
      // Генерация стоимости тренировки (150-400₽ как указано в newtz)
      trainingCost: 150 + Math.floor(Math.random() * 251), // 150-400
      // Генерация стоимости костюма в зависимости от длительности проекта (fast/long)
      costumeCost: this.getCostumeCostByDuration(durationWeeks),
      isMixed: !!template.mixed,
      styleProportion: template.mixed ? `${ratioF}/${ratioM}` : undefined,
      weeksVisible: 0,
      type: 'group',
      isTeamProject: false,
      costumePaid: false,
      costumeSavedMoney: 0,
      needsFunding: false,
      progress: 0,
      trainingsCompleted: 0,
      paymentAttempts: 0,
      baseTraining: 0,
      extraTraining: 0,
      daysActive: 0,
      durationWeeks,
      minReputation: 0,
    } as any;
  },

  // Helper to get costume cost based on duration
  getCostumeCostByDuration(durationWeeks: number): number {
    // fast projects: fixed cost 3000
    // long projects: fixed cost 5000
    const isFast = durationWeeks <= 8;
    return isFast ? 3000 : 5000;
  },

  // Generate available projects sampled from the library
  // Distribution: 40% female, 40% male, 20% both/mixed
  generateAvailableProjects(count: number = 20, player?: any): Project[] {
    const projects: Project[] = [];

    // Calculate target counts
    const femaleTarget = Math.floor(count * 0.4);
    const maleTarget = Math.floor(count * 0.4);
    const mixedTarget = count - femaleTarget - maleTarget; // Remainder to ensure total equals count

    // Separate templates by style
    const femaleTemplates = PROJECT_LIBRARY.filter(t => t.style === 'F');
    const maleTemplates = PROJECT_LIBRARY.filter(t => t.style === 'M');
    const mixedTemplates = PROJECT_LIBRARY.filter(t => t.style === 'Mixed' || t.style === 'Оба');

    // Fisher-Yates shuffle helper
    const shuffle = (arr: any[]) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
      return a;
    };

    // Sample without replacement to maximize variety
    const sampleTemplates = (templates: any[], n: number) => {
      if (!templates || templates.length === 0 || n <= 0) return [];
      const pool = shuffle(templates);
      const out: any[] = [];
      for (let i = 0; i < n; i++) {
        out.push(pool[i % pool.length]);
      }
      return out;
    };

    const fSamples = sampleTemplates(femaleTemplates, femaleTarget);
    const mSamples = sampleTemplates(maleTemplates, maleTarget);
    const mixSamples = sampleTemplates(mixedTemplates, mixedTarget);

    fSamples.forEach((template, i) => projects.push(this.generateProjectFromTemplate(template, i + Math.floor(Math.random() * 10000), player)));
    mSamples.forEach((template, i) => projects.push(this.generateProjectFromTemplate(template, femaleTarget + i + Math.floor(Math.random() * 10000), player)));
    mixSamples.forEach((template, i) => projects.push(this.generateProjectFromTemplate(template, femaleTarget + maleTarget + i + Math.floor(Math.random() * 10000), player)));

    return projects;
  }
};
