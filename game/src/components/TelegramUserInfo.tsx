import React from 'react';
import { useTelegram } from '../hooks/useTelegram';

interface TelegramUserInfoProps {
  className?: string;
}

export const TelegramUserInfo: React.FC<TelegramUserInfoProps> = ({ className = '' }) => {
  const { isReady, user, userName, isDarkMode } = useTelegram();

  if (!isReady || !user) {
    return null;
  }

  return (
    <div className={`telegram-user-info ${className}`}>
      {user.photo_url && (
        <img 
          src={user.photo_url} 
          alt={userName}
          className="telegram-user-avatar"
        />
      )}
      <div className="telegram-user-details">
        <span className="telegram-user-name">{userName}</span>
        {user.is_premium && <span className="telegram-premium-badge">⭐ Premium</span>}
      </div>
    </div>
  );
};

export default TelegramUserInfo;
