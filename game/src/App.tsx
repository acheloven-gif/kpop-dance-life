// React import not required with the current JSX transform
import { useGame } from './context/GameContext';
import { useTelegram } from './hooks/useTelegram';
import CharacterCreation from './components/CharacterCreation';
import GameScreen from './components/GameScreen';
import GameEndScreen from './components/GameEndScreen';
import AudioManager from './components/AudioManager';
import EventModal from './components/EventModal';
import CompletedModal from './components/CompletedModal';
import NPCMetModal from './components/NPCMetModal';
import BirthdayReminder from './components/BirthdayReminder';
import './App.css';

import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import { useState } from 'react';

function App() {
  const { state, gameEnded, npcMetData, setNpcMetData } = useGame();
  const [activeTab, setActiveTab] = useState('main');
  // Время для TopBar (можно заменить на игровое время)
  const timerStr = `Год ${state.gameTime.year} Месяц ${state.gameTime.month} День ${state.gameTime.day}`;

  return (
    <div className={`app ${state.theme}-theme`}>
      <TopBar time={timerStr} />
      <AudioManager />
      <EventModal />
      <CompletedModal />
      {npcMetData && (
        <NPCMetModal
          npc={npcMetData.npc}
          relationship={npcMetData.relationship}
          teamInfo={npcMetData.teamInfo}
          onClose={() => setNpcMetData?.(null)}
        />
      )}

      {!state.gameStarted ? (
        <CharacterCreation />
      ) : gameEnded ? (
        <GameEndScreen />
      ) : (
        <>
          <div className="game-container">
            <GameScreen activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          <BirthdayReminder />
        </>
      )}
      <BottomNav active={activeTab} onTab={setActiveTab} />
    </div>
  );
}

export default App;
