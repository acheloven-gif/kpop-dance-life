import React, { useState, useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';
import './OnboardingOverlay.css';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action?: string; // What action the user needs to complete
  targetElement?: string; // Element to highlight
  position?: 'left' | 'right' | 'center' | 'top' | 'bottom';
  autoComplete?: boolean; // If true, completes when element is clicked
}

interface OnboardingOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '🎤 Добро пожаловать в К-pop жизнь!',
    description: 'Тебе предстоит стать звездой. Давайте начнем с тренировки.',
    position: 'center',
  },
  {
    id: 'train_female',
    title: '🎯 Первый шаг: тренировка',
    description: 'Давайте развивать твой женский стиль танца! Нажми кнопку "Тренировать женский стиль".',
    targetElement: 'train-female-button',
    position: 'top',
    autoComplete: true,
  },
  {
    id: 'train_complete',
    title: '✨ Отлично сделано!',
    description: 'Ты успешно потренировался! Теперь найдем проект для работы. Перейди во вкладку "Поиск проектов".',
    position: 'center',
  },
  {
    id: 'search_projects',
    title: '🎬 Поиск проектов',
    description: 'Найди интересный проект и нажми "Принять" чтобы начать работу.',
    targetElement: 'main-tabs-search',
    position: 'top',
    autoComplete: true,
  },
  {
    id: 'project_accepted',
    title: '🚀 Проект начат!',
    description: 'Отлично! Теперь посещай тренировки регулярно, чтобы успешно завершить проект. Отслеживай прогресс в активных проектах.',
    position: 'center',
  },
  {
    id: 'economy',
    title: '💰 Управление ресурсами',
    description: 'Зарабатывай деньги через проекты. Используй их для покупки одежды и подарков персонажам. Это повысит твой статус!',
    position: 'center',
  },
  {
    id: 'relationships',
    title: '❤️ Построение отношений',
    description: 'Общайся с персонажами, дарай им подарки и предлагай сотрудничество. Крепкие отношения - твой главный актив!',
    position: 'center',
  },
  {
    id: 'ratings',
    title: '🏆 Мониторинг рейтинга',
    description: 'Следи за таблицей лучших. Твоя популярность и репутация - это ключ к успеху. Стремись к вершине рейтинга!',
    position: 'center',
  },
  {
    id: 'goals',
    title: '🎯 Цель: Достичь вершины',
    description: 'Максимизируй свою популярность за 5 лет игры. Каждый день приносит новые возможности - не упусти их! Давай, звезда! ✨',
    position: 'center',
  },
];

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [highlightPos, setHighlightPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  // Position highlight and track when actions are completed
  useEffect(() => {
    if (step.autoComplete && step.targetElement) {
      const handleElementClick = () => {
        completeStep();
      };

      const element = document.querySelector(`[data-onboarding-target="${step.targetElement}"]`) ||
                      document.querySelector(`#${step.targetElement}`) ||
                      document.querySelector(`.${step.targetElement}`);
      
      if (element) {
        // Position the highlight box over the target element
        const rect = element.getBoundingClientRect();
        setHighlightPos({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        element.addEventListener('click', handleElementClick);
        return () => element.removeEventListener('click', handleElementClick);
      } else {
        setHighlightPos(null);
      }
    } else {
      setHighlightPos(null);
    }
  }, [currentStep, step]);

  const completeStep = () => {
    const newCompleted = new Set(completedActions);
    newCompleted.add(step.id);
    setCompletedActions(newCompleted);

    // Move to next step after a short delay
    setTimeout(() => {
      handleNext();
    }, 400);
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkipAll = () => {
    onSkip();
  };

  const canProceed = !step.autoComplete || completedActions.has(step.id);

  return (
    <div className="onboarding-overlay">
      {/* Highlight элемент */}
      {step.targetElement && highlightPos && (
        <div 
          className="onboarding-highlight" 
          data-highlight={step.targetElement}
          style={{
            top: highlightPos.top,
            left: highlightPos.left,
            width: highlightPos.width,
            height: highlightPos.height,
          }}
        />
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

        {step.autoComplete && !canProceed && (
          <div className="onboarding-action-hint">
            👉 Нажми на выделенную область чтобы продолжить
          </div>
        )}

        {/* Прогресс */}
        <div className="onboarding-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{currentStep + 1} / {ONBOARDING_STEPS.length}</span>
        </div>

        {/* Кнопки управления */}
        <div className="onboarding-controls">
          {currentStep < ONBOARDING_STEPS.length - 1 ? (
            <button
              className="onboarding-button onboarding-button-primary"
              onClick={handleNext}
              disabled={!canProceed}
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
