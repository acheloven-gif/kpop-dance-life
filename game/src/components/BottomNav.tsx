import React from 'react';
import { Home, Search, Zap, Star, ShoppingCart } from 'lucide-react';
import './BottomNav.css';

const tabs = [
  { key: 'main', icon: <Home size={24} />, label: 'Главная' },
  { key: 'search', icon: <Search size={24} />, label: 'Поиск' },
  { key: 'active', icon: <Zap size={24} />, label: 'Активные' },
  { key: 'ratings', icon: <Star size={24} />, label: 'Топ-5' },
  { key: 'shop', icon: <ShoppingCart size={24} />, label: 'Магазин' },
];

export default function BottomNav({ active, onTab }: { active: string, onTab: (key: string) => void }) {
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={active === tab.key ? 'active' : ''}
          onClick={() => onTab(tab.key)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
