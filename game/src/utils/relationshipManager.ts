/**
 * Система отношений с NPC
 * Шкала 0-1000:
 * 0-100: Незнакомцы (серый)
 * 101-400: Знакомые (голубой)
 * 401-700: Приятели (оранжевый)
 * 701-1000: Друзья (зелёный)
 */

export type RelationshipTier = 'stranger' | 'acquaintance' | 'friend' | 'best_friend';

export function getRelationshipTier(points: number): RelationshipTier {
  if (points <= 100) return 'stranger';
  if (points <= 400) return 'acquaintance';
  if (points <= 700) return 'friend';
  return 'best_friend';
}

export function getRelationshipLabel(points: number, gender?: 'M' | 'F', enemyBadge?: boolean): string {
  if (enemyBadge) return gender === 'F' ? 'Неприятельница' : 'Неприятель';
  const tier = getRelationshipTier(points);
  switch (tier) {
    case 'stranger': return 'Не знакомы';
    case 'acquaintance': return 'Знакомы';
    case 'friend': 
      return gender === 'F' ? 'Приятельница' : 'Приятель';
    case 'best_friend':
      return gender === 'F' ? 'Подруга' : 'Друг';
    default: return 'Не знакомы';
  }
}

export function getRelationshipColor(points: number, enemyBadge?: boolean): string {
  if (enemyBadge) return '#c62828'; // red for enemy
  const tier = getRelationshipTier(points);
  switch (tier) {
    case 'stranger': return '#999999'; // Серый
    case 'acquaintance': return '#87CEEB'; // Голубой
    case 'friend': return '#FF8C00'; // Оранжевый
    case 'best_friend': return '#32CD32'; // Зелёный
    default: return '#999999';
  }
}

/**
 * Начисление очков отношений за различные действия
 */
export const RelationshipBonuses = {
  // Проекты
  JOINT_PROJECT: 5, // Совместный проект (кроме коллаба)
  COLLAB_PROJECT: 10, // Коллаб с NPC
  TEAM_CONFLICT: -5, // Конфликт в команде (для всех членов)
  TEAM_FESTIVAL: 7, // Участие в фестивале (для всех членов)
  
  // Персональное взаимодействие
  BIRTHDAY_GREETING: 3, // Поздравление с днём рождения
  SHARED_TRAINING: 2, // Совместная тренировка стиля
  
  // Подарки обработчики в EventModal/NPCProfile
  GIFT_MATCHED: 20, // Подарок, подходящий характеру
  GIFT_UNMATCHED: 5, // Подарок, не подходящий характеру
};

/**
 * Добавить очки отношений NPC
 */
export function addRelationshipPoints(
  currentPoints: number,
  bonusPoints: number
): number {
  return Math.max(0, Math.min(1000, currentPoints + bonusPoints));
}

/**
 * Получить информацию о прогрессе
 */
export function getRelationshipProgress(points: number): {
  currentTier: RelationshipTier;
  nextTier: RelationshipTier | null;
  pointsInTier: number;
  pointsToNextTier: number;
  totalTierPoints: number;
} {
  const currentTier = getRelationshipTier(points);
  const tiers = ['stranger', 'acquaintance', 'friend', 'best_friend'] as const;
  const tierIndex = tiers.indexOf(currentTier);
  
  const tierRanges = [
    { min: 0, max: 100 },
    { min: 101, max: 400 },
    { min: 401, max: 700 },
    { min: 701, max: 1000 },
  ];

  const currentRange = tierRanges[tierIndex];
  const pointsInTier = points - currentRange.min;
  const totalTierPoints = currentRange.max - currentRange.min + 1;
  
  const nextTier = tierIndex < tiers.length - 1 ? tiers[tierIndex + 1] : null;
  const nextTierStart = nextTier ? tierRanges[tierIndex + 1].min : 1001;
  const pointsToNextTier = nextTierStart - points;

  return {
    currentTier,
    nextTier,
    pointsInTier,
    pointsToNextTier,
    totalTierPoints,
  };
}
