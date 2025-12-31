import React from 'react';

type IconProps = {
  size?: number;
  className?: string;
};

export const TrainIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="6" r="2" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const MoneyIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="20" height="12" rx="2" stroke="#2b8a3e" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" stroke="#2b8a3e" strokeWidth="1.5" />
  </svg>
);

export const ReputationIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l3 6 6 .5-4.5 3.5L18 20l-6-3-6 3 .5-7L2 8.5 8 8 12 2z" stroke="#8a2be2" strokeWidth="1" />
  </svg>
);

export const PopularityIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z" stroke="#ff6b6b" strokeWidth="1.5" />
    <path d="M9 12l2 2 4-4" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const FatigueIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12h16" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 7h10v10H7z" stroke="#999" strokeWidth="1" />
  </svg>
);

export const SkillsIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2v20M2 12h20" stroke="#2772ff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const InfoIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SpeedIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export default {};
