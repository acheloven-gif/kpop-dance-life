import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import GameHeader from './GameHeader';
import PlayerProfile from './PlayerProfile';
import TeamBlock from './TeamBlock';
import MainTabs from './MainTabs';
import Top5 from './Top5';
import SeasonalBackground from './SeasonalBackground';
import OnboardingOverlay from './OnboardingOverlay';
import MobileHeader from './MobileHeader';
import MobileHomeScreen from './MobileHomeScreen';
import MobileBottomNav from './MobileBottomNav';
import './GameScreen.css';

const GameScreen: React.FC = () => {
  const { state, completeOnboarding } = useGame();
  const [activeMobileTab, setActiveMobileTab] = useState('home');
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

  // Detect if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  if (isMobile) {
    return (
      <div className="mobile-game-screen">
        {showOnboarding && (
          <OnboardingOverlay
            onComplete={completeOnboarding}
            onSkip={completeOnboarding}
          />
        )}
        <MobileHeader dateStr={timerStr} userName={state.player.name} />
        
        {activeMobileTab === 'home' && (
          <MobileHomeScreen 
            playerName={state.player.name}
            onNavigate={setActiveMobileTab}
          />
        )}
        {activeMobileTab === 'friends' && <MainTabs initialTab="messages" />}
        {activeMobileTab === 'city' && <MainTabs initialTab="city" />}
        {activeMobileTab === 'top5' && <Top5 />}

        <MobileBottomNav activeTab={activeMobileTab} onTabChange={setActiveMobileTab} />
      </div>
    );
  }

  return (
    <div className="game-screen">
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
