import React from 'react';
import './WelcomeModal.css';

interface WelcomeModalProps {
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  return (
    <div className="welcome-modal-overlay" onClick={onClose}>
      <div className="welcome-modal-content" onClick={e => e.stopPropagation()}>
        {/* Close button removed */}

        <div className="welcome-modal-header">
          <h2>🎤 Добро пожаловать в K-pop CoverDancer Life! 🎤</h2>
        </div>

        <div className="welcome-modal-body">
          <p className="welcome-modal-message">
            Вы записались на свое <span className="highlight">первое занятие</span> по К-pop танцам.
          </p>

          <p className="welcome-modal-question">
            Интересно, к чему приведет это увлечение через 5 лет?
          </p>

          <div className="welcome-modal-hints">
            <div className="hint-item">
              <span className="hint-icon">🎯</span>
              <span>Развивайте навыки танца</span>
            </div>
            <div className="hint-item">
              <span className="hint-icon">💰</span>
              <span>Зарабатывайте деньги и репутацию</span>
            </div>
            <div className="hint-item">
              <span className="hint-icon">👥</span>
              <span>Заводите дружбу с персонажами</span>
            </div>
            <div className="hint-item">
              <span className="hint-icon">🏆</span>
              <span>Достигайте вершины рейтинга</span>
            </div>
          </div>
        </div>

        <div className="welcome-modal-footer">
          <button className="welcome-modal-button" onClick={onClose}>
            Собраться на занятие
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
