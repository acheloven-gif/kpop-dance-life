// Game types and interfaces
export interface PlayerCharacter {
  id: string;
  name: string;
  avatar: {
    hairLength: 'short' | 'middle' | 'long'; // s, m, l
    hairColor: 'dark' | 'blonde' | 'red'; // d, b, r
    eyeColor: 'brown' | 'emerald' | 'grey'; // b, e, g
  };
  money: number;
  reputation: number;
  popularity: number;
  tired: number; // 0-100
  fSkill: number; // женский стиль
  mSkill: number; // мужской стиль
  teamId: string | null;
  lastTrainedAbsDay?: number;
  lastTrainedFAbsDay?: number;
  lastTrainedMAbsDay?: number;
  postedCover?: boolean;
  lastPostedAbsDay?: number;
  fTrainingsThisWeek?: number;
  mTrainingsThisWeek?: number;
  lastStagnationAbsDay?: number;
  trainerAwayUntil?: number; // Absolute day when trainer returns from vacation
  trainerAwayFemaleUntil?: number;
  trainerAwayMaleUntil?: number;
  effects?: Array<any>;
  consecutiveOnlyFDays?: number;
  consecutiveOnlyMDays?: number;
  eventCooldowns?: Record<string, number>; // key -> lastTriggeredAbsDay
  skillBlockedToday?: boolean; // Blocked skill gains if true (bad day event)
  supportFriendsBaseTired?: number; // Max tired at effect start for percent-based support
  inventory?: Array<{ key: string; id: string; name: string; count: number }>; // inventory items
  shopPurchasesThisWeek?: number; // Number of shop purchases this week
  shopUsesThisWeek?: number; // Number of times used shop items this week
  festivalWins?: number; // Number of festivals won
  teamJoinHistory?: string[]; // Array of team IDs in order of joining
  pendingCollabs?: Record<string, boolean>; // track outgoing collab proposals by npcId
  newYearGreetingsSent?: Record<string, boolean>; // Track which NPCs received New Year greetings
  birthdayGreetingsSent?: Record<string, boolean>; // Track which NPCs received birthday greetings
}

export interface GameState {
  player: PlayerCharacter;
  gameTime: {
    day: number; // 1-7 неделя, потом 8-31 месяц и т.д.
    week: number;
    month: number;
    year: number;
  };
  todayParticipants?: string[];
  todayTrainedStyles?: string[];
  theme: 'light' | 'dark';
  isPaused: boolean;
  timeSpeed: 1 | 2 | 5 | 10; // 1x, 2x, 5x, 10x
  gameStarted: boolean;
  completedProjects?: import('./types/game').Project[];
  isModalPaused?: boolean;
  expenses?: Array<{ id: string; label: string; category?: string; amount: number; absDay: number }>;
}

export interface GameState {
  player: PlayerCharacter;
  gameTime: {
    day: number; // 1-7 неделя, потом 8-31 месяц и т.д.
    week: number;
    month: number;
    year: number;
  };
  todayParticipants?: string[];
  theme: 'light' | 'dark';
  isPaused: boolean;
  timeSpeed: 1 | 2 | 5 | 10; // 1x, 2x, 5x, 10x
  gameStarted: boolean;
  onboardingCompleted?: boolean;
  animationEnabled?: boolean;
  completedProjects?: import('./types/game').Project[];
  isModalPaused?: boolean;
  expenses?: Array<{ id: string; label: string; category?: string; amount: number; absDay: number }>;
}

export interface AvatarKey {
  hairLength: 's' | 'm' | 'l';
  hairColor: 'd' | 'b' | 'r';
  eyeColor: 'b' | 'e' | 'g';
}
