import React, { useEffect, useState } from 'react';
import './MessageToaster.css';

export interface ToasterMessage {
  id: string;
  senderName: string;
  messageText: string;
  senderId: string;
  onClickToaster?: (senderId: string) => void;
  onDismiss?: (id: string) => void;
}

const MessageToaster: React.FC<ToasterMessage> = ({
  id,
  senderName,
  messageText,
  senderId,
  onClickToaster,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Таймер на 4 секунды для скрытия
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    return () => clearTimeout(hideTimer);
  }, []); // Пусто - запуск только один раз при монтировании

  // Отдельный эффект для удаления после анимации
  useEffect(() => {
    if (!isVisible && onDismiss) {
      const removeTimer = setTimeout(() => {
        onDismiss(id);
      }, 500);

      return () => clearTimeout(removeTimer);
    }
  }, [isVisible, id, onDismiss]);

  // Truncate message if too long (max ~60 chars)
  const truncatedMessage =
    messageText.length > 60
      ? messageText.substring(0, 60) + '...'
      : messageText;

  const handleClick = () => {
    if (onClickToaster) {
      onClickToaster(senderId);
    }
    setIsVisible(false);
  };

  return (
    <div
      className={`message-toaster ${isVisible ? 'is-visible' : 'is-hidden'}`}
      onClick={handleClick}
    >
      <div className="toaster-content">
        <div className="toaster-sender">{senderName}</div>
        <div className="toaster-message">{truncatedMessage}</div>
      </div>
    </div>
  );
};

export default MessageToaster;
