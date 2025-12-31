import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

// Репутация - Сердечко
export const ReputationIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M24 38L12 26C9.5 23.5 9.5 19.5 12 17C14.5 14.5 18.5 14.5 21 17L24 20L27 17C29.5 14.5 33.5 14.5 36 17C38.5 19.5 38.5 23.5 36 26L24 38Z" stroke="#FF69B4" strokeWidth="3" strokeLinejoin="round" fill="none" />
  </svg>
);

// Деньги - Купюра
export const MoneyIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="6" y="16" width="36" height="20" rx="2" stroke="#FF69B4" strokeWidth="3" />
    <circle cx="24" cy="26" r="6" stroke="#FF69B4" strokeWidth="3" />
    <circle cx="13" cy="26" r="2" stroke="#FF69B4" strokeWidth="2" />
    <circle cx="35" cy="26" r="2" stroke="#FF69B4" strokeWidth="2" />
  </svg>
);

// Популярность - Человечки
export const PopularityIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="16" r="5" stroke="#FF69B4" strokeWidth="3" />
    <path d="M14 38C14 31 18.5 26 24 26C29.5 26 34 31 34 38" stroke="#FF69B4" strokeWidth="3" strokeLinecap="round" />
    <circle cx="38" cy="20" r="3.5" stroke="#FF69B4" strokeWidth="2.5" />
    <path d="M32 38C32 34 34.5 30 38 30C41.5 30 44 34 44 38" stroke="#FF69B4" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="10" cy="20" r="3.5" stroke="#FF69B4" strokeWidth="2.5" />
    <path d="M16 38C16 34 13.5 30 10 30C6.5 30 4 34 4 38" stroke="#FF69B4" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Женский стиль - Символ Венеры ♀
export const FemaleStyleIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="18" r="10" stroke="#FF69B4" strokeWidth="3" />
    <path d="M24 28V40M18 34H30" stroke="#FF69B4" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// Усталость - Молния
export const FatigueIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M28 8L16 26H24L20 40L32 22H24L28 8Z" stroke="#9969B4" strokeWidth="3" strokeLinejoin="round" fill="none" />
  </svg>
);

// Мужской стиль - Символ Марса ♂
export const MaleStyleIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="22" cy="26" r="10" stroke="#4A90E2" strokeWidth="3" />
    <path d="M30 18L40 8M40 8H33M40 8V15" stroke="#4A90E2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Поиск - Лупа
export const SearchIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="21" cy="21" r="10" stroke="#FF69B4" strokeWidth="3" />
    <path d="M28 28L38 38" stroke="#FF69B4" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

// Видео - Камера
export const VideoIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="8" y="16" width="22" height="16" rx="2" stroke="#FF69B4" strokeWidth="3" />
    <path d="M30 21L42 14V34L30 27V21Z" stroke="#FF69B4" strokeWidth="3" strokeLinejoin="round" fill="none" />
  </svg>
);

// Тренироваться - Штанга с блинами
export const TrainIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="6" y="20" width="5" height="8" stroke="#FF69B4" strokeWidth="3" />
    <rect x="37" y="20" width="5" height="8" stroke="#FF69B4" strokeWidth="3" />
    <path d="M11 24H37" stroke="#FF69B4" strokeWidth="3" strokeLinecap="round" />
    <path d="M14 21V27M34 21V27" stroke="#FF69B4" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// Отдых - Пляжный зонтик
export const RestIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M24 12C16 12 10 18 10 24H38C38 18 32 12 24 12Z" stroke="#FF69B4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M24 12V40M30 36L24 40L18 36" stroke="#FF69B4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 16C17 16 19 20 24 20C29 20 31 16 31 16" stroke="#FF69B4" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Пауза - Две полоски
export const PauseIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="15" y="12" width="6" height="24" rx="1" stroke="#FF69B4" strokeWidth="3" fill="none" />
    <rect x="27" y="12" width="6" height="24" rx="1" stroke="#FF69B4" strokeWidth="3" fill="none" />
  </svg>
);

// Старт - Play треугольник
export const StartIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M16 10L38 24L16 38V10Z" stroke="#FF69B4" strokeWidth="3" strokeLinejoin="round" fill="none" />
  </svg>
);

// Заново - Круговая стрелка ↺
export const RestartIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M38 24C38 31.7 31.7 38 24 38C16.3 38 10 31.7 10 24C10 16.3 16.3 10 24 10C28.5 10 32.5 12 35 15" stroke="#FF69B4" strokeWidth="3" strokeLinecap="round" />
    <path d="M35 8V16H27" stroke="#FF69B4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Скорость - Символ ⏭
export const SpeedIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M10 12L26 24L10 36V12Z" stroke="#FF69B4" strokeWidth="3" strokeLinejoin="round" fill="none" />
    <path d="M26 12L42 24L26 36V12Z" stroke="#FF69B4" strokeWidth="3" strokeLinejoin="round" fill="none" />
  </svg>
);

// Навыки - Звездочка с блеском
export const SkillsIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M24 6L27.6 19.4L41 23L27.6 26.6L24 40L20.4 26.6L7 23L20.4 19.4L24 6Z" stroke="#FF69B4" strokeWidth="3" strokeLinejoin="round" fill="none" />
    <path d="M38 10L39.5 14.5L44 16L39.5 17.5L38 22L36.5 17.5L32 16L36.5 14.5L38 10Z" stroke="#FF69B4" strokeWidth="2" strokeLinejoin="round" fill="none" />
  </svg>
);

// Комментарии - Речевой пузырь
export const CommentsIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M42 22C42 30.8 34.8 38 26 38H12L6 44V12C6 9.8 7.8 8 10 8H36C39.3 8 42 10.7 42 14V22Z" stroke="#FF69B4" strokeWidth="3" strokeLinejoin="round" fill="none" />
    <circle cx="16" cy="22" r="2" fill="#FF69B4" />
    <circle cx="24" cy="22" r="2" fill="#FF69B4" />
    <circle cx="32" cy="22" r="2" fill="#FF69B4" />
  </svg>
);

// Информация - Буква i в кружке
export const InfoIcon: React.FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="20" stroke="#FF69B4" strokeWidth="2.5" />
    <line x1="24" y1="16" x2="24" y2="18" stroke="#FF69B4" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M24 22C26.2091 22 28 23.7909 28 26V32C28 34.2091 26.2091 36 24 36C21.7909 36 20 34.2091 20 32V26C20 23.7909 21.7909 22 24 22Z" stroke="#FF69B4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
