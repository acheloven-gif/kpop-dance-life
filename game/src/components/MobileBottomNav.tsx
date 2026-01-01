import React from 'react';
import { Users, Building2, Home, Trophy, Gift } from 'lucide-react';
import './MobileBottomNav.css';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'friends', label: 'Друзья', icon: Users },
    { id: 'city', label: 'Город', icon: Building2 },
    { id: 'home', label: 'Главная', icon: Home },
    { id: 'top5', label: 'Лиги', icon: Trophy },
    { id: 'gifts', label: 'Задания', icon: Gift },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
          >
            <Icon size={24} />
            <span className="nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
