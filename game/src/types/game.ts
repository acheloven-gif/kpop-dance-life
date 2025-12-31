// NPC и команды
export interface NPC {
  id: string;
  name: string;
  gender: 'M' | 'F';
  faceId: string; // имя файла аватара
  fSkill: number;
  mSkill: number;
  popularity: number;
  reputation: number;
  favoriteStyle: 'F_style' | 'M_style' | 'Both';
  behaviorModel: BehaviorModel;
  teamId: string | null;
  createdAt: number;
  lastTrainedDay: number;
  daysWithoutTraining: number;
  activeStatus?: boolean; // true if still active in coVerdance, false if left to pursue solo
  birthDate?: string; // формат "MM.DD" (без года, год начина с 01.01)
  birthdayReminder30SentAbsDay?: number; // track when 30-day birthday reminder was sent
  birthdayReminder7SentAbsDay?: number; // track when 7-day birthday reminder was sent
  birthdayGreetingNotificationSentAbsDay?: number; // track when birthday notification was sent this year
  birthdayGreetingReceivedAbsDay?: number; // track when player greeted NPC
  relationship?: 'stranger' | 'acquaintance' | 'friend'; // старый формат - заменён на relationshipPoints
  relationshipPoints?: number; // 0-100 шкала отношений: 0-10 незнакомы, 11-40 знакомы, 41-70 приятели, 71-100 друзья
  // Новые флаги для устойчивых связей и негативного бейджа
  minAcquaintanceLocked?: boolean; // если когда-то достигали уровня 'acquaintance', не падают ниже него численно
  enemyBadge?: boolean; // если true — показывать красный бейдж "Неприятель/Неприятельница"
  hasPrivateChat?: boolean; // если true — этот NPC имеет закрытый чат (нельзя предложить коллаб если не знакомы/враги)
  // Counters used by messenger / relationship logic
  trainingTogetherCount?: number; // how many times trained together with player
  jointProjectsCount?: number; // how many projects were together
  metEvents?: string[]; // list of event types where player met this NPC (e.g. 'collab','photo','advice')
  inboxMessages?: any[]; // messages from this npc (stored in game inbox but attached here for convenience)
}

export type BehaviorModel = 'Burner' | 'Dreamer' | 'Perfectionist' | 'Sunshine' | 'Machine' | 'Wildcard' | 'Fox' | 'SilentPro';

// Подарки
export interface Gift {
  id: string;
  name: string;
  description: string;
  suitableCharacters: BehaviorModel[]; // Персонажи, которым подходит
  baseRelationshipBonus: number; // Бонус базовый (некорректный подарок)
  matchedRelationshipBonus: number; // Бонус при совпадении характера
  img?: string; // Путь к изображению подарка
}

export const GIFTS: Gift[] = [
  {
    id: 'gift_1',
    name: 'Мини-фотообои с мотивирующей фразой',
    description: 'Маленькая глянцевая карточка с pastel-надписью типа "You\'re doing amazing!"',
    suitableCharacters: ['Burner', 'Dreamer', 'Sunshine'],
    baseRelationshipBonus: 5,
    matchedRelationshipBonus: 20,
    img: '/gifts/wallpaper_normalized.png',
  },
  {
    id: 'gift_2',
    name: 'Неоновый браслет',
    description: 'Заряжающий браслет, символ силы, дисциплины, концентрации',
    suitableCharacters: ['Burner', 'Machine', 'SilentPro'],
    baseRelationshipBonus: 5,
    matchedRelationshipBonus: 20,
    img: '/gifts/badge_normalized.png',
  },
  {
    id: 'gift_3',
    name: 'Скетчбук для идей',
    description: 'Небольшой блокнот с мягкими страницами для вдохновения и креатива',
    suitableCharacters: ['Dreamer', 'Fox'],
    baseRelationshipBonus: 5,
    matchedRelationshipBonus: 20,
    img: '/gifts/sketchbook_normalized.png',
  },
  {
    id: 'gift_4',
    name: 'Мини-плюш игрушка',
    description: 'Милая маленькая фигурка, которая вызывает улыбку',
    suitableCharacters: ['Sunshine', 'Dreamer', 'Wildcard'],
    baseRelationshipBonus: 5,
    matchedRelationshipBonus: 20,
    img: '/gifts/plush_normalized.png',
  },
  {
    id: 'gift_5',
    name: 'Подарочная карта кофейни ColdBrew',
    description: 'Горьковатый, чистый вкус — для тех, кто ценит ясность ума',
    suitableCharacters: ['Perfectionist', 'Machine', 'SilentPro'],
    baseRelationshipBonus: 5,
    matchedRelationshipBonus: 20,
    img: '/gifts/coffee_normalized.png',
  },
  {
    id: 'gift_6',
    name: 'Глянцевые наклейки со стрит-граффити',
    description: 'Яркие, взрывные, дерзкие наклейки хаоса, юмора и дерзости',
    suitableCharacters: ['Wildcard', 'Fox'],
    baseRelationshipBonus: 5,
    matchedRelationshipBonus: 20,
    img: '/gifts/sticker_normalized.png',
  },
  {
    id: 'gift_7',
    name: 'Мини-стикеры эмоций (K-pop mood stickers)',
    description: 'Набор маленьких pastel-стикеров с эмоциями: сердечки, звёздочки, смешные мини-иконки',
    suitableCharacters: ['Sunshine', 'Dreamer', 'Fox'],
    baseRelationshipBonus: 5,
    matchedRelationshipBonus: 20,
    img: '/gifts/badge_normalized.png',
  },
  {
    id: 'gift_8',
    name: 'Качественный крем для рук',
    description: 'Минималистичный, дорогой, приятно пахнет — для тех, кто ценит качество',
    suitableCharacters: ['Perfectionist', 'Fox'],
    baseRelationshipBonus: 5,
    matchedRelationshipBonus: 20,
    img: '/gifts/cream_normalized.png',
  },
  {
    id: 'gift_9',
    name: 'Милая спортивная бутылка воды',
    description: 'Мягкий, милый чехол — практично для репетиций и выступлений',
    suitableCharacters: ['Sunshine', 'SilentPro', 'Burner'],
    baseRelationshipBonus: 5,
    matchedRelationshipBonus: 20,
    img: '/gifts/bottle_normalized.png',
  },
];

export interface Team {
  id: string;
  name: string;
  memberIds: string[];
  leaderId?: string; // ID лидера команды
  teamSkill: number;
  teamLevel: 'Новичок' | 'Мидл' | 'Топ';
  popularity: number;
  reputation: number;
  teamRating: number;
  createdAt: number;
  iconFile: string;
  inviteRefusalCount?: number; // Tracks how many times player refused invite from this team
  projectRefusalCount?: number; // Tracks how many times player refused team project invites
  dominantStyle?: 'F_style' | 'M_style' | 'Both';
  avgDominant?: number;
  lastDominantStyleChangeAbsDay?: number; // Tracks last day when dominant style changed
  nextTeamProjectOfferAbsDay?: number; // scheduled absolute day for next team project offer
  createdAbsDay?: number; // Absolute day when team was created (for tracking team formation frequency)
}

export interface GameStats {
  totalNPCs: number;
  totalTeams: number;
  ratingUpdateDay: number;
}

// Проекты
export interface Project {
  id: string;
  name: string;
  description?: string;
  type: 'solo' | 'group';
  isTeamProject: boolean;
  isCollabProject?: boolean; // Collab project (with NPC)
  // Optional UI metadata for special projects (team projects should set these)
  specialTag?: string;
  shinyBorderColor?: string;
  requiredSkill: 'F_skill' | 'M_skill' | 'Both';
  minSkillRequired: number;
  minSkillRequired_F?: number;
  minSkillRequired_M?: number;
  trainingNeeded: number; // всего тренировок требуется
  trainingsCompleted?: number; // количество выполненных тренировок (может быть дробным)
  durationWeeks?: number;
  duration: 'fast' | 'long'; // 1 месяц или 2-3 месяца
  // Backwards-compatible optional fields used across components
  reward?: number;
  memberCount?: number;
  npcId?: string;
  leaderId?: string;
  status?: 'in_progress' | 'completed' | 'failed' | 'cancelled' | string;
  suitability?: string;
  trainingDaysRequired?: number;
  costumeMatchPercent?: number;
  costumeOpinion?: string; // NPC opinion about costume suitability
  costumeNpcId?: string; // NPC who evaluated costume
  costumeNpcFaceId?: string; // NPC face ID for costume evaluation
  npcOpinion?: string; // NPC name (leader) who evaluated costume
  trainingCost: number;
  costumeCost: number;
  costumePaid?: boolean;
  costumeSavedMoney?: number; // Деньги отложенные игроком на костюм
  paymentAttempts?: number;
  needsFunding?: boolean; // true if project has no money to pay for current day's training
  progress: number; // 0-100
  baseTraining: number; // основные тренировки в неделю (0-3)
  extraTraining: number; // доп. тренировки в неделю (0-3)
  daysActive: number;
  completedDate?: number;
  success?: boolean;
  reputationChange?: number;
  minReputation?: number;
  failedDueToDeadline?: boolean; // Priority 4: Project failed due to deadline
  failedDueToSkillGap?: boolean; // Priority 6: Project failed due to skill gap
  skillGap?: number; // Priority 6: Skill gap difference (required - player skill)
  likes?: number; // Public likes on completed project
  dislikes?: number; // Public dislikes on completed project
  comments?: any[]; // Comments array from public
}
