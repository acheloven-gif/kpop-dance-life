import React from 'react';
import './MobileHeader.css';

interface MobileHeaderProps {
  dateStr: string;
  userName?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ dateStr, userName = 'Player' }) => {
  return (
    <header className="mobile-header">
      <div className="header-content">
        <div className="user-name">{userName}</div>
        <div className="game-time">{dateStr}</div>
      </div>
    </header>
  );
};

export default MobileHeader;
