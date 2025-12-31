// Month names in Russian
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export function formatGameDate(month: number, day: number): string {
  const monthName = MONTH_NAMES[month] || 'Январь';
  return `${monthName} ${day}`;
}
