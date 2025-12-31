// Helpers для отображения статусов репутации и популярности с цветами

// Типы статусов
export type ReputationStatus = 'toxic' | 'normal' | 'favorite';
export type PopularityStatus = 'unknown' | 'known' | 'top';
export type RelationshipStatus = 'stranger' | 'acquaintance' | 'friend';

// Функция определения статуса репутации
// Шкала: -1000...+1000
export function getReputationStatus(reputation: number): ReputationStatus {
  if (reputation < -50) return 'toxic';
  if (reputation < 260) return 'normal';
  return 'favorite';
}

// Функция определения статуса популярности
// Шкала: 0...1000
export function getPopularityStatus(popularity: number): PopularityStatus {
  if (popularity <= 300) return 'unknown';
  if (popularity <= 700) return 'known';
  return 'top';
}

// Получение CSS класса и цвета для репутации
export function getReputationColor(reputation: number): { class: string; color: string; label: string } {
  const status = getReputationStatus(reputation);
  switch (status) {
    case 'toxic':
      return { class: 'rep-toxic', color: '#ef4444', label: 'Токсик' };
    case 'normal':
      return { class: 'rep-normal', color: '#eab308', label: 'Нормик' };
    case 'favorite':
      return { class: 'rep-favorite', color: '#22c55e', label: 'Отличная' };
  }
}

// Получение CSS класса и цвета для популярности
export function getPopularityColor(popularity: number): { class: string; color: string; label: string } {
  const status = getPopularityStatus(popularity);
  switch (status) {
    case 'unknown':
      return { class: 'pop-unknown', color: '#a3a3a3', label: 'Ноунейм' };
    case 'known':
      return { class: 'pop-known', color: '#fb923c', label: 'Известный' };
    case 'top':
      return { class: 'pop-top', color: '#f5f3f0', label: 'Топовый' };
  }
}

// Получение метки отношения (старая система - используется в StatusBadges)
export function getRelationshipLabel(relationship?: RelationshipStatus): string {
  switch (relationship) {
    case 'friend':
      return 'Друг';
    case 'acquaintance':
      return 'Знакомы';
    case 'stranger':
    default:
      return 'Не знакомы';
  }
}

// Получение CSS класса для отношения
export function getRelationshipClass(relationship?: RelationshipStatus): string {
  switch (relationship) {
    case 'friend':
      return 'rel-friend';
    case 'acquaintance':
      return 'rel-acquaintance';
    case 'stranger':
    default:
      return 'rel-stranger';
  }
}
