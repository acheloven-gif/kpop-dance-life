export interface GameEvent {
  id: string;
  type: 'info' | 'good' | 'bad' | 'choice' | 'festival' | 'collab_offer';
  title: string;
  text: string;
  effect: EventEffect;
  choices?: { text: string; effect?: EventEffect }[];
  npcId?: string;
  npcName?: string;
  collabData?: {
    npcId: string;
    npcName: string;
    requiredSkillType: 'F_skill' | 'M_skill';
    requiredSkill: number;
  };
  festivalData?: {
    participants: number;
    size: 'small' | 'medium' | 'large';
    prizePool: number;
    playerTeamLevel?: 'Новичок' | 'Мидл' | 'Топ';
    hasCategories: boolean;
  };
}

import { projectGenerator } from './projectGenerator';
import { getNpcPhrase } from '../data/npcPhrases';

export interface EventEffect {
  money?: number;
  fSkill?: number;
  mSkill?: number;
  popularity?: number;
  reputation?: number;
  tired?: number;
  projectCancelled?: boolean;
  projectId?: string;
  trainingEfficiencyMult?: number;
  trainingEfficiencyDays?: number;
  trainingCostMultiplier?: number;
  trainingCostDays?: number;
  dailyTiredDelta?: number;
  dailyTiredDays?: number;
  teamJoin?: string;
  teamRefusal?: string; // Team ID that player refused to join
  teamProjectJoin?: any; // Team project to join
  teamProjectRefusal?: string; // Team ID of team whose project was refused
  collabAccept?: { npcId: string; requiredSkillType: 'F_skill' | 'M_skill'; requiredSkill: number; npcName?: string };
}

// Generate a variety of events based on game context. The generator accepts the
// current game state to decide context-sensitive events (project-related, NPC-related, etc.).
// Helper functions to calculate multipliers and bonus values based on active effects
const calculateReputationModifier = (effects: any[], absDay: number): { multiplier: number, addBonus: number } => {
  if (!Array.isArray(effects)) return { multiplier: 1, addBonus: 0 };
  // Look for reputation-affecting effects that are still active
  const activeEffects = effects.filter((ef: any) => {
    const expires = ef.expiresAbsDay ?? -1;
    return expires < 0 || expires >= absDay; // Active if no expiry or expiry hasn't passed
  });

  // Extract reputation-related modifiers from active effects
  // Look for specific effects like reputationMultipliers, reputationBonuses, etc.
  let repMultiplier = 1;
  let repBonus = 0;

  activeEffects.forEach((ef: any) => {
    if (ef.reputationMultiplier) repMultiplier *= (ef.reputationMultiplier || 1);
    if (ef.reputationAdd) repBonus += (ef.reputationAdd || 0);
  });

  // Cap the multiplier to prevent extreme values
  repMultiplier = Math.max(0.5, Math.min(3, repMultiplier));

  return { multiplier: repMultiplier, addBonus: Math.round(repBonus) };
};

const calculatePopularityModifier = (effects: any[], absDay: number): { multiplier: number, addBonus: number } => {
  if (!Array.isArray(effects)) return { multiplier: 1, addBonus: 0 };
  const activeEffects = effects.filter((ef: any) => {
    const expires = ef.expiresAbsDay ?? -1;
    return expires < 0 || expires >= absDay;
  });

  // Extract popularity-related modifiers from active effects
  let popMultiplier = 1;
  let popBonus = 0;

  activeEffects.forEach((ef: any) => {
    if (ef.popularityMultiplier) popMultiplier *= (ef.popularityMultiplier || 1);
    if (ef.popularityAdd) popBonus += (ef.popularityAdd || 0);
  });

  // Cap the multiplier to prevent extreme values
  popMultiplier = Math.max(0.5, Math.min(3, popMultiplier));

  return { multiplier: popMultiplier, addBonus: Math.round(popBonus) };
};

const calculateSkillModifier = (effects: any[], absDay: number): { multiplier: number, addBonus: number } => {
  if (!Array.isArray(effects)) return { multiplier: 1, addBonus: 0 };
  const activeEffects = effects.filter((ef: any) => {
    const expires = ef.expiresAbsDay ?? -1;
    return expires < 0 || expires >= absDay;
  });

  // Extract skill-related modifiers (for fSkill and mSkill)
  let skillMultiplier = 1;
  let skillBonus = 0;

  activeEffects.forEach((ef: any) => {
    if (ef.skillMultiplier) skillMultiplier *= (ef.skillMultiplier || 1);
    if (ef.skillAdd) skillBonus += (ef.skillAdd || 0);
  });

  // Cap the multiplier to prevent extreme values
  skillMultiplier = Math.max(0.5, Math.min(2, skillMultiplier));

  return { multiplier: skillMultiplier, addBonus: Math.round(skillBonus) };
};

export class EventGenerator {
  private masterClassScheduled: boolean = false;
  private masterClassDate: number = 0;
  private masterClassPrice: number = 0;
  private masterClassType: 'female' | 'male' = 'female'; // female = fSkill, male = mSkill

  private festivalScheduled: boolean = false;
  private festivalDate: number = 0;
  private festivalData: any = null;

  // Dev controls
  public devFestivalMinDays: number = 90;
  public devFestivalMaxDays: number = 180;
  public devFestivalChance: number = 0.05;

  generateRandomEvent(
    state: any,
    activeProjects: any[],
    completedProjects: any[],
    npcs: any[],
    playerTeam: any = null,
    teams: any[] = []
  ): GameEvent | null {
    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const absDay = state.gameTime.year * 360 + state.gameTime.month * 30 + state.gameTime.day;
    // Задержка событий: первые 10 дней игры события не срабатывают
    if (absDay < 10) return null;

    // === Event Queuing System (Priority 7, newtz 13.1) + Event Cooldowns ===
    // Global rate limiting: max 1 event per 2 days to prevent spam
    const lastEventDay = state.player.lastEventAbsDay ?? -999;
    if (lastEventDay !== absDay && (absDay - lastEventDay) < 2) {
      return null; // Too soon since last event
    }
    if (lastEventDay !== absDay) {
      state.player.lastEventAbsDay = absDay;
      state.player.eventsTodayCount = 0;
      state.player.eventQueuedToday = []; // Reset queue for new day
    }
    const eventsToday = state.player.eventsTodayCount ?? 0;
    if (eventsToday >= 1) return null; // Max 1 event per 2 days

    // Initialize event cooldown tracking if not present
    if (!state.player.eventCooldowns) {
      state.player.eventCooldowns = {};
    }

    // Helper to check if event can fire (respects cooldown)
    const canFireEvent = (eventType: string, cooldownDays: number = 60): boolean => {
      const lastFired = state.player.eventCooldowns[eventType] ?? -999;
      return (absDay - lastFired) >= cooldownDays;
    };

    // Helper to record event as fired
    const recordEventFired = (eventType: string) => {
      state.player.eventCooldowns[eventType] = absDay;
    };

    const emit = (evt: GameEvent) => {
      // increment counter and record day
      if (state.player.lastEventAbsDay !== absDay) {
        state.player.lastEventAbsDay = absDay;
        state.player.eventsTodayCount = 0;
      }
      state.player.eventsTodayCount = (state.player.eventsTodayCount || 0) + 1;
      return evt;
    };

    // === STAGNATION EVENT (Застой) - Auto-trigger after 30 days without ANY training ===
    const lastTrainedAbsDay = state.player.lastTrainedAbsDay ?? -1;
    const daysSinceTraining = lastTrainedAbsDay >= 0 ? absDay - lastTrainedAbsDay : 0;
    if (daysSinceTraining >= 30 && !state.player.lastStagnationWarningAbsDay) {
      state.player.lastStagnationWarningAbsDay = absDay; // prevent spamming this event
      return emit({
        id: `event_${Date.now()}`,
        type: 'bad',
        title: 'Застой',
        text: 'Вы слишком долго отдыхали и выпали из тренировочного режима. Тело восстановилось, но навыки немного ослабли.',
        effect: {
          fSkill: -Math.round(state.player.fSkill * 0.1), // Reduce by 10%
          mSkill: -Math.round(state.player.mSkill * 0.1)
        }
      });
    }

    // === FESTIVAL EVENT: Этап 1 - Объявление о предстоящем фестивале ===
    // Trigger festival approximately every devFestivalMinDays..devFestivalMaxDays days only if player is in a team
    const lastFestivalDay = state.lastFestivalDay ?? -999;
    const daysSinceFestival = absDay - lastFestivalDay;
    // Only attempt scheduling if player is in a team and no festival is currently scheduled
    if (playerTeam && !this.festivalScheduled) {
      // If we've reached min days, roll chance daily; if we've reached max days, force schedule
      const minD = this.devFestivalMinDays || 90;
      const maxD = this.devFestivalMaxDays || 180;
      const chance = this.devFestivalChance || 0.05;
      if (daysSinceFestival >= minD && (Math.random() < chance || daysSinceFestival >= maxD)) {
        state.lastFestivalDay = absDay;
        this.festivalScheduled = true;
        this.festivalDate = absDay + 7; // Festival happens in 7 days
        // Pre-generate festival data so we can show it in announcement
        const festivalsData = this.generateFestivalData(state, npcs, playerTeam);
        this.festivalData = festivalsData;
        // Store the team ID to verify later that the player hasn't changed teams
        (this as any).festivalTeamId = playerTeam?.id || null;
        return emit({
          id: `event_${Date.now()}`,
          type: 'choice',
          title: '📣 Объявление о фестивале!',
          text: `Ваша команда решила принять участие в фестивале через неделю! ${festivalsData.hasCategories ? 'На фестивале будут категории для разделения по уровням умений.' : 'Это будет фестиваль без разделения по уровням умений.'}`,
          effect: {},
          choices: [
            { text: 'OK', effect: {} }
          ]
        });
      }
    }

    // === FESTIVAL EVENT: Этап 2 - Проверка и отмена фестиваля при смене/выходе из команды ===
    // If a festival was scheduled but player is no longer in a team, or if player changed teams, cancel it to avoid showing festival popups to non-team players
    if (this.festivalScheduled && (!playerTeam || (this as any).festivalTeamId !== playerTeam.id)) {
      this.festivalScheduled = false;
      this.festivalDate = 0;
      this.festivalData = null;
      (this as any).festivalTeamId = null;
    }

    // === FESTIVAL EVENT: Этап 2 - Запуск фестиваля ===
    if (this.festivalScheduled && absDay >= this.festivalDate && playerTeam && (this as any).festivalTeamId === playerTeam.id) {
      // Double check that the scheduled festival is still valid for this team
      // (In case the player changed teams after festival was scheduled but before it was held)
      this.festivalScheduled = false;
      (this as any).festivalTeamId = null;
      state.lastFestivalDay = absDay; // Reset cooldown after festival completes
      const festivalEvent = this.generateFestival(state, npcs, playerTeam, this.festivalData);
      this.festivalData = null;
      if (festivalEvent) return emit(festivalEvent);
    }

    // === TRAINER VACATION EVENT (split by style: male/female trainer away) ===
    // Cooldown: 60 days between trainer vacations
    const trainerAwayFemaleUntil = state.player.trainerAwayFemaleUntil ?? -1;
    const trainerAwayMaleUntil = state.player.trainerAwayMaleUntil ?? -1;
    if (trainerAwayFemaleUntil < 0 && trainerAwayMaleUntil < 0 && canFireEvent('trainer_vacation', 60) && Math.random() < 0.003) {
      // choose which trainer goes on vacation
      if (Math.random() < 0.5) {
        state.player.trainerAwayFemaleUntil = absDay + 14;
        recordEventFired('trainer_vacation');
        return emit({
          id: `event_${Date.now()}`,
          type: 'info',
          title: 'Тренер женского стиля в отпуске',
          text: 'Тренер женского стиля отправился в отпуск на две недели. Тренировки женского стиля временно недоступны.',
          effect: { }
        });
      } else {
        state.player.trainerAwayMaleUntil = absDay + 14;
        recordEventFired('trainer_vacation');
        return emit({
          id: `event_${Date.now()}`,
          type: 'info',
          title: 'Тренер мужского стиля в отпуске',
          text: 'Тренер мужского стиля отправился в отпуск на две недели. Тренировки мужского стиля временно недоступны.',
          effect: { }
        });
      }
    }

    // === МАСТЕР-КЛАСС: Этап 1 - Предупреждение ===
    // Cooldown: 60 days between master class announcements
    if (!this.masterClassScheduled && canFireEvent('master_class', 60) && Math.random() < 0.01) {
      this.masterClassScheduled = true;
      this.masterClassDate = absDay + 30;
      // Randomly choose female or male masterclass
      this.masterClassType = Math.random() < 0.5 ? 'female' : 'male';
      // price must end with 00: choose hundreds between 20..50 -> 2000..5000
      this.masterClassPrice = randInt(20, 50) * 100;
      recordEventFired('master_class');
      const typeText = this.masterClassType === 'female' ? 'женскому стилю' : 'мужскому стилю';
      return emit({
        id: `event_${Date.now()}`,
        type: 'info',
        title: 'Объявление о мастер-классе',
        text: `Через месяц пройдёт мастер-класс по ${typeText}! Цена: ${this.masterClassPrice} ₽.`,
        effect: {}
      });
    }

    // === МАСТЕР-КЛАСС: Этап 2 - Сам мастер-класс ===
    if (this.masterClassScheduled && absDay >= this.masterClassDate) {
      this.masterClassScheduled = false;
      // ensure price is multiple of 100; fallback to hundreds
      const cost = this.masterClassPrice || (randInt(20, 50) * 100);
      const typeText = this.masterClassType === 'female' ? 'женскому стилю' : 'мужскому стилю';
      const skillBoost = randInt(8, 15); // Повышенный бонус за мастер-класс
      return emit({
        id: `event_${Date.now()}`,
        type: 'choice',
        title: 'Мастер-класс пройдет сегодня!',
        text: `Мастер-класс по ${typeText} уже сегодня! Посещение стоит ${cost} ₽. Это значительно повысит ваш уровень ${this.masterClassType === 'female' ? 'женского' : 'мужского'} стиля. Вы хотите принять участие?`,
        effect: {},
        choices: [
          {
            text: 'Да',
            effect: this.masterClassType === 'female'
              ? { money: -cost, fSkill: skillBoost }
              : { money: -cost, mSkill: skillBoost }
          },
          { text: 'Нет', effect: {} }
        ]
      });
    }

    // === Project-related events ===
    // Cooldown: 30 days between project success events
    if (completedProjects && completedProjects.length > 0) {
      const last = completedProjects[completedProjects.length - 1];
      const daysSince = last.completedDate ? Math.floor((Date.now() - last.completedDate) / (1000 * 60 * 60 * 24)) : 999;
      if (daysSince === 1 && canFireEvent('project_success', 30) && Math.random() < 0.12) {
        recordEventFired('project_success');
        // Apply popularity modifier based on active effects
        const { multiplier, addBonus } = calculatePopularityModifier(state.player.effects || [], absDay);
        const basePopularity = randInt(3, 7);
        const popularity = Math.round((basePopularity * multiplier) + addBonus);
        return emit({
          id: `event_${Date.now()}`,
          type: 'good',
          title: 'Удачная партия в проекте',
          text: 'Коммьюнити позитивно приняло ваш новый кавер — популярность растёт.',
          effect: { popularity: Math.max(0, popularity) } // Ensure non-negative value
        });
      }
      if (daysSince >= 2 && daysSince <= 10 && canFireEvent('project_recommendation', 30) && Math.random() < 0.04) {
        recordEventFired('project_recommendation');
        // Apply popularity modifier based on active effects
        const { multiplier, addBonus } = calculatePopularityModifier(state.player.effects || [], absDay);
        const basePopularity = randInt(15, 35);
        const popularity = Math.round((basePopularity * multiplier) + addBonus);
        return emit({
          id: `event_${Date.now()}`,
          type: 'good',
          title: 'Попадание в рекомендации',
          text: 'Ваш кавер попал в рекомендации! Резкий всплеск популярности.',
          effect: { popularity: Math.max(0, popularity) } // Ensure non-negative value
        });
      }
    }

    // === Training-related events ===
    // Cooldown: 60 days between training praise events
    const trainedToday = (state.player.lastTrainedAbsDay ?? -1) === absDay;
    if (trainedToday && canFireEvent('training_praise', 60) && Math.random() < 0.015) {
      recordEventFired('training_praise');
      // Apply reputation modifier based on active effects
      const { multiplier, addBonus } = calculateReputationModifier(state.player.effects || [], absDay);
      const baseReputation = randInt(2, 4);
      const reputation = Math.round((baseReputation * multiplier) + addBonus);
      return emit({
        id: `event_${Date.now()}`,
        type: 'good',
        title: 'Похвала от хореографа',
        text: 'Хореограф отметил ваш прогресс — репутация немного растёт!',
        effect: { reputation: reputation }
      });
    }

    if (trainedToday && canFireEvent('perfect_flow', 30) && Math.random() < 0.02) {
      recordEventFired('perfect_flow');
      // Apply skill modifiers based on active effects
      const { multiplier, addBonus } = calculateSkillModifier(state.player.effects || [], absDay);
      const baseFSkill = Math.random() < 0.5 ? randInt(1, 3) : 0;
      const baseMSkill = Math.random() < 0.5 ? randInt(1, 3) : 0;
      const fSkill = baseFSkill > 0 ? Math.round((baseFSkill * multiplier) + addBonus) : 0;
      const mSkill = baseMSkill > 0 ? Math.round((baseMSkill * multiplier) + addBonus) : 0;
      return emit({
        id: `event_${Date.now()}`,
        type: 'good',
        title: 'Идеальный день на тренировке',
        text: 'Сегодня всё получается идеально! Навыки растут быстрее.',
        effect: { fSkill: fSkill, mSkill: mSkill }
      });
    }

    // Inspiration (Вдохновение) - long positive multiplier
    // Cooldown: 60 days between inspiration events
    if (canFireEvent('inspiration', 60) && Math.random() < 0.01) {
      recordEventFired('inspiration');
      return emit({
        id: `event_${Date.now()}`,
        type: 'good',
        title: 'Вдохновение',
        text: 'Вас охватило вдохновение! Эффективность тренировок временно выросла!.',
        effect: { trainingEfficiencyMult: 1.3, trainingEfficiencyDays: 30 }
      });
    }

    // Support from friends - rare buff + daily tired recovery
    // Only trigger if there's no active training efficiency buff already
    // Check for any active effect that already grants training efficiency or daily tired delta
    const hasActiveEfficiency = Array.isArray(state.player.effects) && state.player.effects.some((ef: any) => {
      const expires = ef.expiresAbsDay ?? -1;
      if (expires <= absDay) return false;
      if (ef.trainingEfficiencyMult && ef.trainingEfficiencyMult > 1) return true;
      if (ef.dailyTiredDelta && ef.dailyTiredDelta < 0) return true;
      return false;
    });
    if (!hasActiveEfficiency && Math.random() < 0.02) {
      return emit({
        id: `event_${Date.now()}`,
        type: 'good',
        title: 'Поддержка от друзей',
        text: 'Мотивация от друзей сил и мотивации стало намного больше!',
        effect: { trainingEfficiencyMult: 1.2, trainingEfficiencyDays: 7, dailyTiredDelta: -2, dailyTiredDays: 7 }
      });
    }

    // === NPC-related events ===
    const participants: string[] = state.todayParticipants || [];
    if (participants.length > 0) {
      const playerAvg = (state.player.fSkill + state.player.mSkill) / 2;
      const advicer = npcs.find(n => participants.includes(n.id) && ((n.fSkill + n.mSkill) / 2) > playerAvg);
      if (advicer && Math.random() < 0.03) {
        // Apply skill modifiers based on active effects
        const { multiplier, addBonus } = calculateSkillModifier(state.player.effects || [], absDay);
        const baseFSkill = Math.random() < 0.5 ? randInt(0, 2) : 0;
        const baseMSkill = Math.random() < 0.5 ? randInt(0, 2) : 0;
        const fSkill = baseFSkill > 0 ? Math.round((baseFSkill * multiplier) + addBonus) : 0;
        const mSkill = baseMSkill > 0 ? Math.round((baseMSkill * multiplier) + addBonus) : 0;
        return emit({
          id: `event_${Date.now()}`,
          type: 'good',
          title: 'Неожиданный совет от ${advicer.name}',
          text: `${advicer.name} поделился полезной подсказкой на тренировке — прогресс ускорился.`,
          effect: { fSkill: fSkill, mSkill: mSkill }
        });
      }

      if (Math.random() < 0.05) {
        const partner = npcs.find(n => participants.includes(n.id));
        if (partner) {
          // Apply popularity modifier based on active effects
          const { multiplier, addBonus } = calculatePopularityModifier(state.player.effects || [], absDay);
          const basePopularity = randInt(5, 15);
          const popularity = Math.round((basePopularity * multiplier) + addBonus);

          // Reputation depends on partner's reputation
          const baseReputation = partner.reputation < 0 ? -2 : 4;
          const { multiplier: repMultiplier, addBonus: repAddBonus } = calculateReputationModifier(state.player.effects || [], absDay);
          const reputation = Math.round((baseReputation * repMultiplier) + repAddBonus);

          return emit({
            id: `event_${Date.now()}`,
            type: 'good',
            title: 'Совместная фотка с (${partner.name})',
            text: `Вы сделали совместное фото с ${partner.name}. Популярность растёт!`,
            effect: { popularity: Math.max(0, popularity), reputation: reputation }
          });
        }
      }
      // === Collab offer from an NPC present at training ===
      if (participants.length > 0 && Math.random() < 0.035) {
        const collabNpc = npcs.find(n => participants.includes(n.id));
        if (collabNpc) {
          // Determine requirement based on npc gender/style
          const requiredSkillType = collabNpc.gender === 'F' ? 'F_skill' : 'M_skill';
          // Base required skill between 30..50, adjust by npc average skill
          const avg = Math.round(((collabNpc.fSkill || 0) + (collabNpc.mSkill || 0)) / 2);
          const baseReq = collabNpc.gender === 'F' ? 35 : 35;
          const requiredSkill = Math.min(95, Math.max(20, Math.round(baseReq + (avg - 50) * 0.25)));

          // Return collab offer as a messenger message instead of a popup event
          const phrase = getNpcPhrase(collabNpc.behaviorModel, 'collab_proposal') || `${collabNpc.name} предлагает совместный кавер!`;
          return emit({
            id: `event_${Date.now()}`,
            type: 'collab_offer',
            title: `Коллаборация (${collabNpc.name})`,
            text: `${collabNpc.name}: ${phrase}\nТребуемый навык: ${requiredSkill} (${requiredSkillType === 'F_skill' ? 'женский' : 'мужской'}).\nЕсли согласитесь — популярность может вырасти.`,
            npcId: collabNpc.id,
            npcName: collabNpc.name,
            collabData: {
              npcId: collabNpc.id,
              npcName: collabNpc.name,
              requiredSkillType,
              requiredSkill
            },
            effect: {}
          });
        }
      }
    }

    // === Experimental training ===
    if (trainedToday && Math.random() < 0.02) {
      return emit({
        id: `event_${Date.now()}`,
        type: 'info',
        title: 'Непривычный формат тренировки',
        text: 'Экспериментальная тренировка была тяжёлой, но полезной.',
        effect: { fSkill: Math.random() < 0.5 ? 1 : 0, mSkill: Math.random() < 0.5 ? 1 : 0, tired: randInt(5, 10) }
      });
    }

    // === Injury/illness ===
    if (state.player.tired > 65 && Math.random() < 0.015) {
      return emit({
        id: `event_${Date.now()}`,
        type: 'bad',
        title: 'Недомогание',
        text: 'Вы почувствовали слабость — требуется отдых.',
        effect: { tired: randInt(10, 20), trainingEfficiencyMult: 0.4, trainingEfficiencyDays: 5 }
      });
    }

    // === New subscribers ===
    // Trigger only if there was a recent positive popularity change within the last 3 days
    const lastPositive = state.player.lastPositivePopAbsDay ?? -999;
    if (lastPositive >= 0 && (absDay - lastPositive) <= 3 && Math.random() < 0.04) {
      return emit({
        id: `event_${Date.now()}`,
        type: 'good',
        title: 'Новые подписчики',
        text: 'Ваша аудитория растёт — появились новые подписчики в вашем тг канале!',
        effect: { popularity: randInt(3, 8) }
      });
    }

    // === Repost from NPC ===
    const popularNPC = npcs.find(n => n.popularity >= 40);
    // Only trigger repost if player has at least one SUCCESSFUL completed project
    const successfulProjects = completedProjects ? completedProjects.filter(p => p.success === true) : [];
    if (popularNPC && successfulProjects && successfulProjects.length > 0 && Math.random() < 0.03) {
      return emit({
        id: `event_${Date.now()}`,
        type: 'good',
        title: 'Репост от популярного каверденсера',
        text: 'Популярный каверденсер поделился вашим видео у себя в тг канале — прирост популярности!',
        effect: { popularity: randInt(10, 25) }
      });
    }

    // === Team disagreements (Разногласия в команде) ===
    // When player is in a team and there are accumulated project refusals or bad performance
    if (playerTeam && Math.random() < 0.02) { // 2% chance when in team
      // Check if the player is at risk of expulsion from a previous event
      const playerAtRiskOfExpulsion = state.player.atRiskOfExpulsion ?? false;

      if (playerAtRiskOfExpulsion) {
        // Игрок уже находится под угрозой исключения, исключаем из команды при любом негативном событии
        // Remove player from team - update authoritative `teamId` field
        state.player.teamId = null;
        // Remove player from the team's memberIds array to ensure consistency
        if (playerTeam && playerTeam.memberIds) {
          playerTeam.memberIds = playerTeam.memberIds.filter((id: string) => id !== state.player.id);
        }
        delete state.player.atRiskOfExpulsion; // Clear the expulsion flag

        return emit({
          id: `event_${Date.now()}`,
          type: 'bad',
          title: 'Вас исключили из команды',
          text: 'Из-за продолжительных конфликтов в команде вас официально исключили. Вам нужно будет искать новую команду или продолжить карьеру соло.',
          effect: { reputation: -randInt(8, 15), popularity: -randInt(5, 10) }
        });
      } else {
        // Check if the player has any project refusals or negative performance metrics
        const projectRefusalCount = playerTeam.projectRefusalCount ?? 0;
        const teamAvgRep = playerTeam.reputation ?? 0;

        if (projectRefusalCount >= 1 || teamAvgRep < 0) {
          return emit({
            id: `event_${Date.now()}`,
            type: 'bad',
            title: 'Разногласия в команде',
            text: 'В команде возникли разногласия. Атмосфера ухудшилась.',
            effect: { reputation: -randInt(1, 3), popularity: -randInt(1, 4) }
          });
        }
      }
    }

    // === Many people at training (Много людей на тренировке) ===
    // If training today, low efficiency due to overcrowding
    if (trainedToday && Math.random() < 0.04) {
      return emit({
        id: `event_${Date.now()}`,
        type: 'bad',
        title: 'Много людей на тренировке',
        text: 'Сегодня зал переполнен — тренировка была малоэффективной.',
        effect: { trainingEfficiencyMult: 0.3, trainingEfficiencyDays: 1 }
      });
    }

    // === Studio discount event (Акция студии) ===
    // Cooldown: событие должно происходить не чаще, чем раз в полгода (180 дней)
    // Duration: должно длиться месяц (30 дней)
    const lastDiscountEvent = state.player.lastStudioDiscountDay ?? -999;
    if ((absDay - lastDiscountEvent) >= 180 && Math.random() < 0.02) { // 2% шанс вместо 4% для баланса
      state.player.lastStudioDiscountDay = absDay;
      const pct = randInt(2, 4)*10;
      const mult = Math.max(0.1, 1 - pct / 100);
      return emit({
        id: `event_${Date.now()}`,
        type: 'good',
        title: 'Акция в студии',
        text: `Студия объявила скидку ${pct}% — занятия стали дешевле на 30 дней!`,
        effect: { trainingCostMultiplier: mult, trainingCostDays: 30 }
      });
    }

    // === Studio price increase event (Повышение цен) ===
    // Cooldown: событие должно происходить не чаще, чем раз в год (360 дней)
    const lastPriceIncreaseEvent = state.player.lastStudioPriceIncreaseDay ?? -999;
    if ((absDay - lastPriceIncreaseEvent) >= 360 && Math.random() < 0.01) { // 1% шанс как редкое событие
      state.player.lastStudioPriceIncreaseDay = absDay;
      const pct = randInt(1, 3)*10;
      const mult = 1 + pct / 100;
      return emit({
        id: `event_${Date.now()}`,
        type: 'bad',
        title: 'Повышение цен',
        text: `Цены на занятия повышены на ${pct}% — расходы выросли.`,
        effect: { trainingCostMultiplier: mult, trainingCostDays: 1 } // короткое действие, как разовое событие
      });
    }

    // === Conflict on training (Конфликт на тренировке) ===
    // Trigger if player trained with NPCs (team members) today
    try {
      if (state.todayParticipants && state.todayParticipants.length > 0 && Math.random() < 0.03) {
        return emit({
          id: `event_${Date.now()}`,
          type: 'bad',
          title: 'Конфликт на тренировке',
          text: 'На тренировке вы поругались с участниками — репутация пострадала.',
          effect: { reputation: -randInt(2, 5) }
        });
      }
    } catch (e) {
      // silent
    }

    // === Popular NPC acquaintance (Знакомство с популярным NPC) ===
    const popularPartner = npcs.find(n => n.popularity > 70 && (state.todayParticipants || []).includes(n.id));
    if (popularPartner && Math.random() < 0.04) {
      // Calculate NPC's position in popularity ranking
      const sortedByPopularity = npcs.slice().sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
      const npcRank = sortedByPopularity.findIndex((n: any) => n.id === popularPartner.id) + 1;
      const rankText = npcRank > 0 ? ` (#${npcRank} в рейтинге)` : '';

      return emit({
        id: `event_${Date.now()}`,
        type: 'good',
        title: 'Знакомство с популярным каверденсером',
        text: `Вы познакомились с ${popularPartner.name}${rankText} — это поднимает вашу популярность!`,
        effect: { popularity: randInt(15, 35) }
      });
    }

    // === Stronger team conflict (Командный конфликт) ===
    // First, check if team's dominant style changed
    if (playerTeam) {
      const oldStyle = (state as any).lastRecordedTeamStyle;
      const currentStyle = playerTeam.dominantStyle;

      // Notify if style changed
      if (oldStyle && oldStyle !== currentStyle) {
        const styleMapping: { [key: string]: string } = { 'F_style': 'Женский', 'M_style': 'Мужской', 'Both': 'Универсалы' };
        const styleOld = styleMapping[oldStyle] || 'Универсалы';
        const styleCurrent = styleMapping[currentStyle] || 'Универсалы';
        (state as any).lastRecordedTeamStyle = currentStyle;
        return emit({
          id: `event_${Date.now()}`,
          type: 'info',
          title: 'Команда изменила стиль',
          text: `Команда ${playerTeam.name} сменила направление. Теперь ваш стиль: ${styleCurrent} (был: ${styleOld})!`,
          effect: {}
        });
      } else if (!oldStyle) {
        // Initialize on first check
        (state as any).lastRecordedTeamStyle = currentStyle;
      }
    } else {
      // Player left the team - clear the style tracker
      delete (state as any).lastRecordedTeamStyle;
    }

    // === Stronger team conflict (Командный конфликт) - с правильными эффектами как в newtz ===
    if (playerTeam && Math.random() < 0.02) {
      // Проверяем, есть ли предыдущие проблемы у игрока (например, отказы от проектов)
      const projectRefusalCount = playerTeam.projectRefusalCount ?? 0;
      const teamAvgRep = playerTeam.reputation ?? 0;
      const playerAtRiskOfExpulsion = state.player.atRiskOfExpulsion ?? false;

      if (playerAtRiskOfExpulsion) {
        // Игрок уже находится под угрозой исключения, исключаем из команды
        // Remove player from team - update authoritative `teamId` field
        state.player.teamId = null;
        // Remove player from the team's memberIds array to ensure consistency
        if (playerTeam && playerTeam.memberIds) {
          playerTeam.memberIds = playerTeam.memberIds.filter((id: string) => id !== state.player.id);
        }
        delete state.player.atRiskOfExpulsion; // Clear the expulsion flag

        return emit({
          id: `event_${Date.now()}`,
          type: 'bad',
          title: 'Вас исключили из команды',
          text: 'Из-за продолжительных конфликтов в команде вас официально исключили. Вам нужно будет искать новую команду или продолжить карьеру соло.',
          effect: { reputation: -randInt(8, 15), popularity: -randInt(5, 10) }
        });
      } else if (projectRefusalCount >= 2 || teamAvgRep < -20) {
        // Помечаем игрока как находящегося под угрозой исключения
        state.player.atRiskOfExpulsion = true;
        // Серьезный конфликт - начинается процесс исключения
        return emit({
          id: `event_${Date.now()}`,
          type: 'bad',
          title: 'Командный конфликт',
          text: 'Серьёзный конфликт в команде. Вас могут исключить из команды при следующем негативном инциденте.',
          effect: { reputation: -randInt(5, 10), popularity: -randInt(3, 7) }
        });
      } else {
        // Менее серьезный конфликт
        // Сбрасываем флаг, если он был установлен ранее и условия больше не выполняются
        if (state.player.atRiskOfExpulsion) {
          delete state.player.atRiskOfExpulsion;
        }
        return emit({
          id: `event_${Date.now()}`,
          type: 'bad',
          title: 'Командный конфликт',
          text: 'В команде произошёл конфликт. Атмосфера ухудшилась.',
          effect: { reputation: -randInt(2, 5) }
        });
      }
    }

    // === Negative comments ===
    const lastPosted = state.player.lastPostedAbsDay ?? -1;
    const postedRecently = lastPosted >= 0 && lastPosted === absDay;
    if (state.player.postedCover && postedRecently && Math.random() < 0.06) {
      return emit({
        id: `event_${Date.now()}`,
        type: 'bad',
        title: 'Негатив в комментариях',
        text: 'Перепалка в комментариях подорвала репутацию, но вы стали заметнее.',
        effect: { reputation: -randInt(3, 7), popularity: randInt(2, 5) }
      });
    }

    // === Self-crit (Самокритика) ===
    if (state.player.reputation > 10 && Math.random() < 0.02) {
      return emit({
        id: `event_${Date.now()}`,
        type: 'bad',
        title: 'Самокритика',
        text: 'Вы слишком требовательны к себе. Прогресс тренировок временно замедлится.',
        effect: { trainingEfficiencyMult: 0.7, trainingEfficiencyDays: 7 }
      });
    }

    // === Motivation drop ===
    // Cooldown: 30 days between motivation drop events
    if (state.player.tired > 50 && canFireEvent('motivation_drop', 30) && Math.random() < 0.03) {
      recordEventFired('motivation_drop');
      return emit({
        id: `event_${Date.now()}`,
        type: 'bad',
        title: 'Падение мотивации',
        text: 'Мотивация упала, тренировки идут хуже.',
        effect: { trainingEfficiencyMult: 0.6, trainingEfficiencyDays: 7 }
      });
    }

    // === Bad day ===
    // Cooldown: 30 days between bad day events
    if (trainedToday && canFireEvent('bad_day', 30) && Math.random() < 0.03) {
      recordEventFired('bad_day');
      return emit({
        id: `event_${Date.now()}`,
        type: 'bad',
        title: 'Плохой день',
        text: 'Сегодня все валится из рук. Вы чувствуете моральное истощение после тренировки.',
        effect: { tired: randInt(3, 8) }
      });
    }

    // === Project cancellation ===
    // Cooldown: 30 days between project cancellations
    // Не срабатывает на первые 5 проектов игрока
    // === Project cancellation ===
    // Cooldown behaviour: cancellation is allowed no more often than once per 7 accepted projects.
    // Implementation: if there's no counter (undefined) allow cancellation (first-time can happen),
    // otherwise only allow when acceptedSinceFailureRef.current >= 7. After firing, reset the counter to 0.
    const acceptedSinceFailure = state.acceptedSinceFailureRef?.current;
    const canCancelByAcceptedCount = (acceptedSinceFailure === undefined) || (acceptedSinceFailure >= 7);

    if (
      activeProjects &&
      activeProjects.length > 0 &&
      canFireEvent('project_cancel', 30) &&
      Math.random() < 0.04 &&
      canCancelByAcceptedCount
    ) {
      recordEventFired('project_cancel');
      if (state.acceptedSinceFailureRef && typeof state.acceptedSinceFailureRef.current === 'number') state.acceptedSinceFailureRef.current = 0;
      const proj = activeProjects[Math.floor(Math.random() * activeProjects.length)];
      return emit({
        id: `event_${Date.now()}`,
        type: 'bad',
        title: 'Отмена проекта',
        text: `Проект "${proj.name}" отменён лидером. Деньги и время, вложенные в него, потеряны.`,
        effect: { projectCancelled: true, projectId: proj.id }
      });
    }

      // === Team invitations: Rules for when player is already in a team ===
    try {
      // New requirement: If player is in a team, invitation can come only:
      // - after 6 months of gameplay
      // Also, if one team sends invitation, others can't (until player leaves current team)

      const playerTeamJoinedAbsDay = state.player.lastTeamJoinAbsDay ?? -1;
      const daysSinceJoiningTeam = playerTeamJoinedAbsDay > 0 ? absDay - playerTeamJoinedAbsDay : 999999;

      // Check if player is in a team and if invitations from other teams should be blocked
      if (playerTeam) {
        // If player has received a team invitation recently (from any team), block others
        const lastTeamInviteDay = state.player.lastTeamInviteAbsDay ?? -1;
        const daysSinceLastInvite = absDay - lastTeamInviteDay;

        // Check if 6 months have passed (180 days) OR 1% chance every 1.5 months after 1 month in team
        const sixMonthsPassed = absDay >= 180; // 6 months = 6 * 30 days
    
        // Only allow invitation if one of the conditions is met
        if (!(sixMonthsPassed )) {
          return null; // Don't offer invitation from other teams
        }

        // Even if conditions are met, check if too recent invitation from another team
        if (daysSinceLastInvite < 45) { // Block for 1.5 months after an invitation
          return null;
        }
      } else {
        // Player not in team: allow normal monthly invitation (85% chance)
        const lastOfferMonth = Math.floor((state.player.lastTeamInviteAbsDay ?? -30) / 30);
        const currentMonth = Math.floor(absDay / 30);

        if (absDay < 30 || lastOfferMonth === currentMonth) {
          return null; // At least 1 month before first invite, and once per month max
        }
      }

      // Common team-invite logic for both normal and switch cases
      const playerF = (state.player?.fSkill || 0);
      const playerM = (state.player?.mSkill || 0);
      const hasMinSkill = (playerF >= 6 || playerM >= 6);
      const hasTeams = teams && teams.length > 0;
      const passRandom = Math.random() < 0.85;

      if (hasMinSkill && hasTeams && passRandom) {
        // choose a random team that isn't the player's current team
        const candidates = teams.filter((t: any) => t.id !== (playerTeam?.id));

        // For each team compute dominant style and average of that dominant skill
        const candidatesWithDominant = candidates.map((t: any) => {
          // fallback to stored teamSkill if members not available here
          // We'll compute dominant by using available t.teamMembers if present
          let domLabel: 'Женский' | 'Мужской' | 'Универсалы' = 'Универсалы';
          let avgDominant = t.teamSkill || 0;
          try {
            // prefer fields computed in team object if present: t.dominantStyle, t.avgDominant
            if (t.dominantStyle && typeof t.avgDominant === 'number') {
              domLabel = t.dominantStyle === 'F_style' ? 'Женский' : t.dominantStyle === 'M_style' ? 'Мужской' : 'Универсалы';
              avgDominant = t.avgDominant;
            }
          } catch (e) {
            // ignore
          }
          return { team: t, dominantLabel: domLabel, avgDominant };
        });

        // Filter according to newtz: if team's average dominant skill is greater than player's same skill by more than 18 -> don't invite
        // (rule: difference must be not more than 18 to allow invite)
        const filteredBySkill = candidatesWithDominant.filter((info: any) => {
          try {
              const label = info.dominantLabel;
              const teamAvg = info.avgDominant || 0;
            let playerSkillForComparison = Math.round(((playerF + playerM) / 2));
            if (label === 'Женский') playerSkillForComparison = playerF;
            else if (label === 'Мужской') playerSkillForComparison = playerM;
            // If team's avg dominant is greater than player's same skill by 18 or more -> cannot invite
            const diff = teamAvg - playerSkillForComparison;
            const passes = !(diff > 18);
            return passes;
          } catch (e) {
            return true;
          }
        }).map((info: any) => info.team);

        if (filteredBySkill.length > 0) {
          // additionally filter out teams that were offered recently (cooldown 70 days)
          const availableNow = filteredBySkill.filter((t: any) => {
            const lastOff = t.inviteLastOfferedAbsDay ?? -99999;
            return (absDay - lastOff) >= 70;
          });
          if (availableNow.length === 0) {
            return null;
          }
          const team = availableNow[Math.floor(Math.random() * availableNow.length)];
          const refusalCount = team.inviteRefusalCount ?? 0;

          // If player already refused 2 or more times, team stops offering (we allow only 2 invitations)
          if (refusalCount >= 2) {
            return null; // Don't offer invite after 2 refusals
          }

          // Prepare details (rank/style/avg) used in all messages
          const dominantInfo = candidatesWithDominant.find((it: any) => it.team.id === team.id) || { dominantLabel: 'Универсалы', avgDominant: Math.round(team.teamSkill || 0) };
          let rank = 0;
          try {
            const sorted = (teams || []).slice().sort((a: any, b: any) => (b.teamRating || 0) - (a.teamRating || 0));
            rank = Math.max(1, (sorted.findIndex((t: any) => t.id === team.id) + 1));
          } catch (e) {
            rank = 0;
          }
          const details = `Рейтинг команды: #${rank || '?'} — Стиль: ${dominantInfo.dominantLabel} — Средний: ${Math.round(dominantInfo.avgDominant || 0)}`;

          // Offer the invite as a choice. If refusalCount === 1, treat as the last offer with a warning.
          let warningText = `Команда ${team.name} предлагает вам присоединиться. Принять приглашение?`;
          if (refusalCount === 1) {
            warningText = `⚠️ Команда ${team.name} последний раз предлагает присоединиться. Это последнее предложение! Принять приглашение?`;
          }

          const fullWarning = `${warningText}\n${details}`;

          // Record that a team invitation was sent (blocks others for a period)
          state.player.lastTeamInviteAbsDay = absDay;

          // mark that this team was offered now
          team.inviteLastOfferedAbsDay = absDay;
          return emit({
            id: `event_${Date.now()}`,
            type: 'choice',
            title: 'Приглашение в команду',
            text: fullWarning,
            effect: {},
            choices: [
              { text: 'Принять', effect: { teamJoin: team.id } },
              { text: 'Отказать', effect: { teamRefusal: team.id } }
            ]
          });
        }
      }
    } catch (e) {
      console.error('[EventGenerator] Team-invite error:', e);
    }


    // === Team project offer (if player in a team) ===
    // Offer team projects with explicit scheduling (nextTeamProjectOfferAbsDay)
    if (playerTeam) {
      const nextProjectOffer = (playerTeam as any).nextTeamProjectOfferAbsDay ?? -99999;
      // Only offer if scheduled day has arrived
      if (absDay >= nextProjectOffer && nextProjectOffer > 0) {
        // Check if this is a warning before 3rd refusal (newtz: "При следующем (третьем) предложении проекта")
        // Get current refusal count for this team
        const currentRefusalCount = (playerTeam as any).projectRefusalCount ?? 0;

        // Generate a team project matching the team's dominant style and average skill
        const teamProject = projectGenerator.generateTeamProject(playerTeam, absDay, state.player);
        if (teamProject) {
          // Check if this is after 2 refusals (so it's time for warning before 3rd refusal)
          if (currentRefusalCount === 2) {
            // Show warning before 3rd refusal instead of normal offer
            (playerTeam as any).lastTeamProjectOfferedAbsDay = absDay;
            // clear any nextTeamProjectOffer scheduling now that we're offering
            delete (playerTeam as any).nextTeamProjectOfferAbsDay;
            recordEventFired('team_project_offer');
            return emit({
              id: `event_${Date.now()}`,
              type: 'choice',
              title: 'Командный проект',
              text: `⚠️ Это уже третье предложение за последние месяцы.\nМы помним, что вы дважды отказались.\nЕщё один отказ — и вас исключат.\n\nКоманда получила предложение для совместного проекта: "${teamProject.name}". Хотите принять?`,
              effect: {},
              choices: [
                { text: 'Принять', effect: { teamProjectJoin: teamProject } },
                { text: 'Отказать', effect: { teamProjectRefusal: playerTeam.id } }
              ]
            });
          } else {
            // Normal project offer
            (playerTeam as any).lastTeamProjectOfferedAbsDay = absDay;
            // clear scheduled next offer
            delete (playerTeam as any).nextTeamProjectOfferAbsDay;
            recordEventFired('team_project_offer');
            return emit({
              id: `event_${Date.now()}`,
              type: 'choice',
              title: 'Командный проект',
              text: `Ваша команда хочет поставить проект: "${teamProject.name}". Согласны участвовать?`,
              effect: {},
              choices: [
                { text: 'Принять', effect: { teamProjectJoin: teamProject } },
                { text: 'Отказать', effect: { teamProjectRefusal: playerTeam.id } }
              ]
            });
          }
        }
      }
    }

    return null;
  }

  private generateFestivalData(_state: any, npcs: any[], playerTeam: any): any {
    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // === Festival NPC Participation Odds (newtz section 13.2.4) ===
    const getNpcParticipationChance = (npcTeamSkill: number): number => {
      const baseChance = npcTeamSkill * 0.6 / 100;
      const finalChance = baseChance * 0.93;
      return Math.min(finalChance, 1);
    };

    const npcParticipants = npcs.filter((npc: any) => {
      const npcSkill = ((npc.fSkill || 50) + (npc.mSkill || 50)) / 2;
      const participationChance = getNpcParticipationChance(npcSkill);
      return Math.random() < participationChance;
    });

    // Ensure minimum 3 teams participate in festival
    let competitorPool = npcParticipants;
    if (competitorPool.length < 3) {
      // Not enough participants by chance, use all available NPCs and ensure at least 3
      competitorPool = npcs.slice(0, Math.max(3, npcs.length));
    }

    // Determine festival size
    const participants = randInt(20, 500);
    let size: 'small' | 'medium' | 'large';
    let prizePool: number;

    if (participants <= 20) {
      size = 'small';
      prizePool = randInt(10, 20)*100;
    } else if (participants <= 100) {
      size = 'medium';
      prizePool = randInt(25, 50)*100;
    } else {
      size = 'large';
      prizePool = randInt(50, 200)*100;
    }

    // Determine if festival has categories (90% chance)
    const hasCategories = Math.random() < 0.9;

    // Determine player win chance
    let playerWins = false;
    if (playerTeam) {
      const playerTeamSkill = playerTeam.teamSkill ?? 50;
      const npcMaxSkill = Math.max(...competitorPool.map((n: any) => ((n.fSkill || 50) + (n.mSkill || 50)) / 2), 50);

      if (playerTeamSkill >= npcMaxSkill) {
        playerWins = Math.random() < 0.95;
      } else {
        const chanceWin = 0.06 + playerTeamSkill / npcMaxSkill;
        playerWins = Math.random() < chanceWin;
      }
    }

    return {
      participants,
      size,
      prizePool,
      hasCategories,
      playerTeamLevel: playerTeam?.teamLevel,
      playerWins
    };
  }

  private generateFestival(_state: any, npcs: any[], playerTeam: any, festivalData?: any): GameEvent | null {
    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Use pre-generated festival data if available, otherwise generate new
    const fData = festivalData || this.generateFestivalData(_state, npcs, playerTeam);
    const { participants, size, prizePool, hasCategories, playerTeamLevel, playerWins } = fData;

    if (playerWins) {
      return {
        id: `event_${Date.now()}`,
        type: 'festival',
        title: '🎉 Победа на фестивале!',
        text: `Ваша команда победила на фестивале${hasCategories ? ' с категориями' : ''}! Вы получили ${prizePool} ₽ и повышение в рейтинге.`,
        effect: {
          money: prizePool,
          reputation: randInt(2, 7),
          popularity: randInt(5, 15)
        },
        festivalData: {
          participants,
          size,
          prizePool,
          playerTeamLevel,
          hasCategories
        }
      };
    } else {
      return {
        id: `event_${Date.now()}`,
        type: 'festival',
        title: 'Фестиваль прошёл',
        text: `Фестиваль${hasCategories ? ' с категориями' : ''} завершился. На этот раз победила другая команда. Не расстраивайтесь!`,
        effect: {
          reputation: randInt(-3, 2),
          popularity: randInt(2, 5)
        },
        festivalData: {
          participants,
          size,
          prizePool,
          playerTeamLevel,
          hasCategories
        }
      };
    }
  }
}
