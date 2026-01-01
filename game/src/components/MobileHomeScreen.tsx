import React from 'react';
import { Users, Building2, Trophy, Gift, Zap, User } from 'lucide-react';
import './MobileHomeScreen.css';

interface MobileHomeScreenProps {
  onNavigate: (tab: string) => void;
  playerName: string;
}

const MobileHomeScreen: React.FC<MobileHomeScreenProps> = ({ onNavigate, playerName }) => {
  const menuItems = [
    { id: 'friends', label: 'Друзья', icon: Users, color: '#FF6B9D' },
    { id: 'city', label: 'Город', icon: Building2, color: '#4A90E2' },
    { id: 'top5', label: 'Лиги', icon: Trophy, color: '#FFA500' },
    { id: 'tasks', label: 'Задания', icon: Gift, color: '#7B68EE' },
    { id: 'shop', label: 'Магазин', icon: Zap, color: '#00CED1' },
    { id: 'profile', label: 'Профиль', icon: User, color: '#98D8C8' },
  ];

  return (
    <div className="mobile-home-screen">
      <div className="home-header">
        <h1 className="welcome-text">🎤 K-Cover Dance</h1>
        <p className="player-name">{playerName}</p>
      </div>

      <div className="menu-grid">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="menu-item"
              style={{ '--item-color': item.color } as React.CSSProperties}
              onClick={() => onNavigate(item.id)}
            >
              <div className="menu-item-icon">
                <Icon size={32} />
              </div>
              <span className="menu-item-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="home-footer">
        <div className="stats-preview">
          <div className="stat">
            <span className="stat-label">Репутация</span>
            <span className="stat-value">5250</span>
          </div>
          <div className="stat">
            <span className="stat-label">Популярность</span>
            <span className="stat-value">3800</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHomeScreen;
