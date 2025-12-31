import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { SpeedIcon, RestartIcon } from '../figma/other';
import { Sun, Moon, NotebookPen, Sparkles, Snowflake } from 'lucide-react';
import playSFX from '../utils/sfx';
import DevPanel from './DevPanel';
import SaveGameModal from './SaveGameModal';
import './GameHeader.css';

interface GameHeaderProps {
  dateStr?: string;
}

// Helper function to get days in a specific month (1-indexed)
const getDaysInMonth = (month: number): number => {
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 ? daysPerMonth[month - 1] : 30;
};

const GameHeader: React.FC<GameHeaderProps> = () => {
  const { state, togglePause, setTimeSpeed, toggleTheme, toggleAnimation, restartGame, setModalPause } = useGame();

  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Pause/unpause game when restart confirmation modal opens/closes
  useEffect(() => {
    if (showRestartConfirm && setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (showRestartConfirm && setModalPause) {
        setModalPause(false);
      }
    };
  }, [showRestartConfirm, setModalPause]);

  const handleRestart = () => {
    playSFX('click.wav');
    setShowRestartConfirm(true);
  };

  const confirmRestart = () => {
    playSFX('click.wav');
    restartGame();
    window.location.reload();
  };

  const cancelRestart = () => {
    playSFX('click.wav');
    setShowRestartConfirm(false);
  };

  // Use calendar-based month like `GameScreen` so header animation matches calendar background
  const CALENDAR_START_MONTH = 5; // Июнь (0-indexed)
  const totalDaysFromTimer = state.gameTime.year * 360 + state.gameTime.month * 30 + state.gameTime.day;
  const totalDaysFromJune = totalDaysFromTimer + CALENDAR_START_MONTH * 30;
  const calendarMonth = Math.floor(totalDaysFromJune / 30) % 12;

  // Get season for header animation based on calendarMonth
  const getSeason = (m: number): 'spring' | 'summer' | 'autumn' | 'winter' => {
    if (m >= 2 && m <= 4) return 'spring';      // Mar-May
    if (m >= 5 && m <= 7) return 'summer';      // Jun-Aug
    if (m >= 8 && m <= 10) return 'autumn';     // Sep-Nov
    return 'winter';                             // Dec-Feb
  };

  const season = getSeason(calendarMonth);

  // Calendar month names that start counting from June (Июнь 1 -> index 0)
  const shiftedMonthNames = [
    'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь',
    'Декабрь', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май'
  ];
  const calendarMonthName = shiftedMonthNames[state.gameTime.month] || 'Месяц';

  // Generate random particles for header animation
  const particles = useMemo(() => {
    const count = season === 'winter' ? 18 : season === 'autumn' ? 20 : season === 'spring' ? 25 : season === 'summer' ? 20 : 8;
    return Array.from({ length: count }, (_, i) => {
      let type = '';
      if (season === 'spring') {
        type = Math.random() > 0.3 ? 'raindrop' : 'sakura-petal';
      } else if (season === 'summer') {
        type = Math.random() > 0.5 ? 'summer-watermelon' : Math.random() > 0.5 ? 'summer-apple' : 'summer-cherry';
      } else if (season === 'winter') {
        type = Math.random() > 0.6 ? 'snowflake' : 'white-circle';
      } else if (season === 'autumn') {
        type = Math.random() > 0.6 ? 'leaf-orange' : Math.random() > 0.5 ? Math.random() > 0.5 ? 'leaf-red' : 'leaf-yellow' : 'raindrop';
      }
      const size = 0.6 + Math.random() * 0.7; // Size variation from 0.6 to 1.3
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 4 + Math.random() * 2,
        type,
        size,
      };
    });
  }, [season]);

  return (
    <>
      <header className={`game-header gradient-header ${state.animationEnabled ? 'animation-on' : ''}`}>
        {/* Seasonal animation */}
        {state.animationEnabled && (
          <div className={`header-particles ${season}`}>
            {season === 'autumn' && particles.map(p => (
              <div
                key={p.id}
                className={p.type}
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  transform: `scale(${p.size})`
                }}
              />
            ))}
            {season === 'winter' && particles.map(p => (
              <div
                key={p.id}
                className={p.type}
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${p.size})`
                }}
              >
                {p.type === 'snowflake' ? (
                  <Snowflake size={14} color="#E6F2FF" fill="#E6F2FF" />
                ) : (
                  <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%' }} />
                )}
              </div>
            ))}
            {season === 'spring' && particles.map(p => (
              <div
                key={p.id}
                className={p.type}
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,                  transform: `scale(${p.size})`                }}
              />
            ))}
            {season === 'summer' && particles.map(p => (
              <div
                key={p.id}
                className={p.type}
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${18 * p.size}px`,
                }}
              >
                {p.type === 'summer-watermelon' ? '🍉' : p.type === 'summer-apple' ? '🍏' : '🍒'}
              </div>
            ))}
          </div>
        )}
        <div className="date-block">
          <div className="date-labels">
            <span>Год</span>
            <span>Месяц</span>
            <span>День</span>
          </div>
          <div className="date-values">
            <span className="date-num">{state.gameTime.year}</span>
            <span className="date-slash">/</span>
            <span className="date-num">{state.gameTime.month}</span>
            <span className="date-slash">/</span>
            <span className="date-num">{Math.min(state.gameTime.day + 1, getDaysInMonth(state.gameTime.month + 1))}</span>
          </div>
          <div className="calendar-countdown">{calendarMonthName} {Math.min(state.gameTime.day + 1, getDaysInMonth(state.gameTime.month + 1))}</div>
        </div>
        <div className="header-controls">
          <button
            className={`btn-icon restart-btn ${state.isPaused ? 'paused' : ''}`}
            onClick={() => { playSFX('click.wav'); togglePause(); }}
            title={state.isPaused ? 'Продолжить' : 'Пауза'}
          >
            {state.isPaused ? '▶' : '⏸'}
          </button>
          <div className="speed-buttons">
            <label htmlFor="timeSpeedSelect" style={{display: 'none'}}>Скорость</label>
            <button
              className="btn-icon speed-btn"
              onClick={() => {
                const currentIndex = [1, 2, 5, 10].indexOf(state.timeSpeed);
                const nextIndex = (currentIndex + 1) % 4;
                const nextSpeed = [1, 2, 5, 10][nextIndex] as 1 | 2 | 5 | 10;
                playSFX('click.wav');
                setTimeSpeed(nextSpeed);
              }}
              title={`Скорость: ${state.timeSpeed}x (нажмите для смены)`}
            >
              <SpeedIcon size={18} />
              <span className="speed-text">{state.timeSpeed}x</span>
            </button>
          </div>
          <button
            className="btn-icon restart-btn"
            onClick={handleRestart}
            title="Рестарт игры"
          >
            <RestartIcon size={24} className="icon-inline" />
          </button>
          <button
            className="btn-icon theme-toggle"
            onClick={() => { playSFX('click.wav'); toggleTheme(); }}
            title={state.theme === 'light' ? 'Ночная тема' : 'Дневная тема'}
          >
            {state.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            className="btn-icon animation-toggle"
            onClick={() => { playSFX('click.wav'); toggleAnimation(); }}
            title={state.animationEnabled ? 'Отключить анимацию' : 'Включить анимацию'}
            style={{opacity: state.animationEnabled ? 1 : 0.6}}
          >
            <Sparkles size={20} />
          </button>
          <button
            className="btn-icon save-btn-header"
            onClick={() => { playSFX('click.wav'); setShowSaveModal(true); }}
            title="Загрузить сохранение"
          >
            <NotebookPen size={20} />
          </button>
          {/* DevPanel removed */}
        </div>
      </header>

      {showRestartConfirm && (
        <div className="modal-overlay">
          <div className="modal card restart-modal">
            <div className="modal-header">
              <h3>Подтвердите перезапуск</h3>
            </div>
            <div className="modal-body">
              <p>Вы уверены, что хотите начать игру заново?</p>
              <p>Весь прогресс будет потерян.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancelRestart}>Отмена</button>
              <button className="btn-confirm" onClick={confirmRestart}>Начать заново</button>
            </div>
          </div>
        </div>
      )}

      <SaveGameModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} />
    </>
  );
};

export default GameHeader;
