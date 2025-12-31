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
import TelegramUserInfo from './components/TelegramUserInfo';
import './App.css';

function App() {
  const { state, gameEnded, npcMetData, setNpcMetData } = useGame();
  const { isReady } = useTelegram();

  return (
    <div className={`app ${state.theme}-theme`}>
      {/* AudioManager and EventModal mounted always so music/SFX persist across screens */}
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
            {/* Telegram user info in header */}
            {isReady && <TelegramUserInfo className="game-header-user-info" />}
            <GameScreen />
          </div>
          <BirthdayReminder />
        </>
      )}
    </div>
  );
}

export default App;
