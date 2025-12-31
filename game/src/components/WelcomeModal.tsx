import React from 'react';
import { X } from 'lucide-react';
import './WelcomeModal.css';

interface WelcomeModalProps {
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  return (
    <div className="welcome-modal-overlay" onClick={onClose}>
      <div className="welcome-modal-content" onClick={e => e.stopPropagation()}>
        <button className="welcome-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="welcome-modal-header">
          <h2>🎤 Добро пожаловать в K-Cover Dance Life! 🎤</h2>
        </div>

        <div className="welcome-modal-body">
          <p className="welcome-modal-message">
            Вы собираетесь на свое <span className="highlight">первое занятие</span> по К-pop танцам.
          </p>

          <p className="welcome-modal-question">
            Интересно, к чему приведет это увлечение через 5 лет?
          </p>

          <div className="welcome-modal-hints">
            <div className="hint-item">
              <span className="hint-icon">🎯</span>
              <span>Развивайте навыки танца и пения</span>
            </div>
            <div className="hint-item">
              <span className="hint-icon">💰</span>
              <span>Зарабатывайте деньги и репутацию</span>
            </div>
            <div className="hint-item">
              <span className="hint-icon">👥</span>
              <span>Строьте отношения с персонажами</span>
            </div>
            <div className="hint-item">
              <span className="hint-icon">🏆</span>
              <span>Достигайте вершины славы</span>
            </div>
          </div>
        </div>

        <div className="welcome-modal-footer">
          <button className="welcome-modal-button" onClick={onClose}>
            Начать путь К-pop звезды! ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
