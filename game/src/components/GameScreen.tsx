import React from 'react';
import { useGame } from '../context/GameContext';
import GameHeader from './GameHeader';
import PlayerProfile from './PlayerProfile';
import TeamBlock from './TeamBlock';
import MainTabs from './MainTabs';
import Top5 from './Top5';
import SeasonalBackground from './SeasonalBackground';
import OnboardingOverlay from './OnboardingOverlay';
import './GameScreen.css';

interface GameScreenProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ activeTab, setActiveTab }) => {
  const { state, completeOnboarding } = useGame();
  const showOnboarding = state.gameStarted && !state.onboardingCompleted;

  // Таймер игры: Год X Месяц Y День Z
  const timerStr = `Год ${state.gameTime.year} Месяц ${state.gameTime.month} День ${state.gameTime.day}`;

  // Календарная дата: начинается с 01.06 (1 июня) в Год 0 Месяц 0
  // День 0 месяца 0 = 1 июня, далее отсчёт идёт от июня
  const CALENDAR_START_MONTH = 5; // Июнь (0-indexed)
  
  // Суммарные дни от начала таймера
  const totalDaysFromTimer = state.gameTime.year * 360 + state.gameTime.month * 30 + state.gameTime.day;
  
  // Добавляем дни июня (чтобы начинать с 1 июня, а не с 1 января)
  const totalDaysFromJune = totalDaysFromTimer + CALENDAR_START_MONTH * 30;
  
  // Вычисляем календарный месяц и день
  const calendarMonth = Math.floor(totalDaysFromJune / 30) % 12;
  const calendarDay = (totalDaysFromJune % 30) + 1; // +1 потому что дни начинаются с 1, а не 0
  const calendarYear = Math.floor(totalDaysFromJune / 360);
  
  // Форматируем календарную дату
  const day = String(calendarDay).padStart(2, '0');
  const month = String(calendarMonth + 1).padStart(2, '0');
  const dateStr = `${day}.${month}.${calendarYear}`;

  return (
    <div className="game-screen" style={{ paddingTop: 48, paddingBottom: 64 }}>
      {showOnboarding && (
        <OnboardingOverlay
          onComplete={completeOnboarding}
          onSkip={completeOnboarding}
        />
      )}
      <SeasonalBackground month={calendarMonth} isDarkTheme={state.theme === 'dark'} />
      <GameHeader dateStr={timerStr} />
      <div className="game-content">
        <div className="left-panel">
          <PlayerProfile />
          <TeamBlock />
        </div>
        <div className="center-panel">
          <MainTabs />
        </div>
        <div className="right-panel">
          <div className="top-5">
            <Top5 />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
