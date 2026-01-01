import React from 'react';
import { useTelegram } from '../hooks/useTelegram';

interface TelegramUserInfoProps {
  className?: string;
}

export const TelegramUserInfo: React.FC<TelegramUserInfoProps> = () => {
  const { isReady, user, userName, isDarkMode } = useTelegram();

  // Не отображаем ничего (требование: не показывать фото, имя, премиум)
  return null;
};

export default TelegramUserInfo;
