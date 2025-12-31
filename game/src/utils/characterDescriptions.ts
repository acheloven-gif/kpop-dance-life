// Character descriptions from "info and gifts.txt"
export const characterDescriptions: Record<string, string> = {
  'Burner': 'Страстный и целеустремлённый: всегда идёт вперёд и быстро загорается идеей.',
  'Dreamer': 'Мягкий, творческий и эмоциональный — живёт вдохновением, а не расписанием.',
  'Perfectionist': 'Сдержанный и точный, любит порядок и держит дистанцию от хаоса людей.',
  'Sunshine': 'Тёплый и открытый человек, который легко находит друзей и поднимает настроение.',
  'Machine': 'Спокойный, собранный и всегда в работе — предпочитает действие словам.',
  'Wildcard': 'Эмоциональный и непредсказуемый: живёт порывами и неожиданными решениями.',
  'Fox': 'Хитрый стратег, который часто побеждает не усилиями, а лестью.',
  'Silent Pro': 'Тихий и наблюдательный талант, который говорит своей работой, а не словами.',
};

export function getCharacterDescription(characterType?: string): string | null {
  if (!characterType) return null;
  return characterDescriptions[characterType] || null;
}
