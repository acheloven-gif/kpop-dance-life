import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import './OnboardingOverlay.css';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  highlight?: string;
  position?: 'left' | 'right' | 'center' | 'top' | 'bottom';
}

interface OnboardingOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '🎤 Добро пожаловать в игру!',
    description: 'Ты начинаешь свой путь как К-pop артист. Давай разберемся, как устроена игра.',
    position: 'center',
  },
  {
    id: 'profile',
    title: '👤 Твой профиль',
    description: 'Здесь отображаются твои основные показатели: деньги, репутация, популярность и усталость. Следи за ними!',
    highlight: 'player-profile',
    position: 'right',
  },
  {
    id: 'team',
    title: '🤝 Команда',
    description: 'Присоединись к К-pop группе, чтобы участвовать в проектах и получать больше доходов. Отношения в группе очень важны!',
    highlight: 'team-block',
    position: 'right',
  },
  {
    id: 'tabs',
    title: '📊 Основные действия',
    description: 'Используй вкладки, чтобы тренироваться, общаться с персонажами, участвовать в проектах и совершать покупки в магазине.',
    highlight: 'main-tabs',
    position: 'top',
  },
  {
    id: 'top5',
    title: '🏆 Рейтинг лучших',
    description: 'Смотри, как твои показатели сравниваются с другими артистами. Стремись к вершине!',
    highlight: 'top-5-container',
    position: 'left',
  },
  {
    id: 'economy',
    title: '💰 Экономика',
    description: 'Зарабатывай деньги через проекты, обучай навыки танца и пения. Трать деньги на наряды и подарки!',
    position: 'center',
  },
  {
    id: 'relationships',
    title: '❤️ Отношения',
    description: 'Строй дружбу и романтические отношения с персонажами. Это даст тебе преимущества в игре и откроет новые истории!',
    position: 'center',
  },
  {
    id: 'daily',
    title: '⏰ День за днем',
    description: 'Каждый день приносит новые события. Управляй своей энергией - если она упадет, тебе нужно отдохнуть.',
    position: 'center',
  },
  {
    id: 'goal',
    title: '🎯 Цель игры',
    description: 'Достигни максимальной популярности за 5 лет! Пусть весь мир узнает о твоем таланте. Удачи, звезда! ✨',
    position: 'center',
  },
];

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipAll = () => {
    onSkip();
  };

  return (
    <div className="onboarding-overlay">
      {/* Highlight элемент */}
      {step.highlight && (
        <div className="onboarding-highlight" data-highlight={step.highlight} />
      )}

      {/* Главное окно обучения */}
      <div className={`onboarding-tooltip onboarding-tooltip-${step.position || 'center'}`}>
        <div className="onboarding-header">
          <h2 className="onboarding-title">{step.title}</h2>
          <button className="onboarding-close" onClick={handleSkipAll} aria-label="Пропустить обучение">
            <X size={20} />
          </button>
        </div>

        <p className="onboarding-description">{step.description}</p>

        {/* Прогресс */}
        <div className="onboarding-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{currentStep + 1} / {ONBOARDING_STEPS.length}</span>
        </div>

        {/* Кнопки управления */}
        <div className="onboarding-controls">
          <button
            className="onboarding-button onboarding-button-secondary"
            onClick={handlePrev}
            disabled={currentStep === 0}
            aria-label="Предыдущее"
          >
            <ChevronLeft size={18} />
          </button>

          {currentStep < ONBOARDING_STEPS.length - 1 ? (
            <button
              className="onboarding-button onboarding-button-primary"
              onClick={handleNext}
              aria-label="Далее"
            >
              Далее
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="onboarding-button onboarding-button-primary"
              onClick={handleNext}
              aria-label="Завершить"
            >
              Начать играть! ✨
            </button>
          )}

          <button
            className="onboarding-button onboarding-button-skip"
            onClick={handleSkipAll}
            aria-label="Пропустить"
          >
            Пропустить
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingOverlay;
