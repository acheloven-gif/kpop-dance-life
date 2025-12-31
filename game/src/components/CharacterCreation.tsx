import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { AvatarKey } from '../types';
import { Sun, Moon, NotebookPen } from 'lucide-react';
import WelcomeModal from './WelcomeModal';
import './CharacterCreation.css';
import playSFX from '../utils/sfx';

const hairLengths = [
  { key: 's', label: 'Короткие', name: 'Short' },
  { key: 'm', label: 'Средние', name: 'Middle' },
  { key: 'l', label: 'Длинные', name: 'Long' },
];

const hairColors = [
  { key: 'd', label: 'Тёмные', name: 'Dark' },
  { key: 'b', label: 'Блонд', name: 'Blonde' },
  { key: 'r', label: 'Рыжие', name: 'Red' },
];

const eyeColors = [
  { key: 'b', label: 'Карие', name: 'Brown' },
  { key: 'e', label: 'Зеленые', name: 'Emerald' },
  { key: 'g', label: 'Серо-голубые', name: 'Grey' },
];

const CharacterCreation: React.FC = () => {
  const { updatePlayer, initializeGame, toggleTheme, state, loadGame, saveGame } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [avatar, setAvatar] = useState<AvatarKey>({
    hairLength: 'm',
    hairColor: 'd',
    eyeColor: 'b',
  });

  // Воспроизвести звук при открытии экрана создания персонажа
  useEffect(() => {
    playSFX('notification.wav');
  }, []);

  const getAvatarPath = () => {
    const key = `${avatar.hairLength}${avatar.hairColor}${avatar.eyeColor}`;
    // В публичной папке аватары находятся в `/faces/` (копирование в build поместило файлы туда)
    return `/faces/${key}.png`;
  };

  const handleAvatarChange = (type: keyof AvatarKey, value: string) => {
    setAvatar(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleLoadGame = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const gameState = JSON.parse(content);
        if (gameState.player && gameState.gameTime) {
          localStorage.setItem('gameState', JSON.stringify(gameState));
          playSFX('notification.wav');
          loadGame();
          initializeGame(gameState.player.name);
        } else {
          alert('Некорректный файл сохранения');
        }
      } catch (error) {
        console.error('Load error:', error);
        alert('Ошибка при загрузке файла');
        playSFX('error.wav');
      }
    };
    reader.readAsText(file);
  };

  const handleStart = () => {
    if (!playerName.trim()) {
      alert('Пожалуйста, введите имя персонажа');
      return;
    }

    updatePlayer({
      name: playerName,
      // Сохраняем краткие ключи (s/m/l, d/b/r, b/e/g) — PlayerProfile и просмотр используют первые буквы
      avatar: {
        hairLength: avatar.hairLength as any,
        hairColor: avatar.hairColor as any,
        eyeColor: avatar.eyeColor as any,
      },
    });

    playSFX('click.wav');
    initializeGame(playerName);
  };

  return (
    <div className="character-creation">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      
      <div className="creation-controls">
        <button
          className="btn-control btn-load"
          onClick={handleLoadGame}
          title="Загрузить сохранение"
          aria-label="Загрузить сохранение"
        >
          <NotebookPen size={20} />
          <span className="sr-only">Загрузить сохранение</span>
        </button>
        <button
          className="btn-control btn-theme"
          onClick={() => { playSFX('click.wav'); toggleTheme(); }}
          title={state.theme === 'light' ? 'Ночная тема' : 'Дневная тема'}
          aria-label="Переключить тему"
        >
          {state.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span className="sr-only">Переключить тему</span>
        </button>
      </div>
      <div className="creation-container">
        <h1>Создание персонажа</h1>

        <div className="creation-content">
          <div className="avatar-section">
            <div className="avatar-preview">
              <img
                src={getAvatarPath()}
                alt="Character preview"
                className="preview-image"
              />
            </div>
          </div>

          <div className="options-section">
            <div className="form-group">
              <label>Длина волос:</label>
              <div className="button-group">
                {hairLengths.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`btn-option ${avatar.hairLength === key ? 'active' : ''}`}
                    onClick={() => { playSFX('click.wav'); handleAvatarChange('hairLength', key); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Цвет волос:</label>
              <div className="button-group">
                {hairColors.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`btn-option ${avatar.hairColor === key ? 'active' : ''}`}
                    onClick={() => { playSFX('click.wav'); handleAvatarChange('hairColor', key); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Цвет глаз:</label>
              <div className="button-group">
                {eyeColors.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`btn-option ${avatar.eyeColor === key ? 'active' : ''}`}
                    onClick={() => { playSFX('click.wav'); handleAvatarChange('eyeColor', key); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="creation-form">
          <div className="form-name-group">
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value.slice(0, 20))}
              placeholder="Введите имя персонажа"
              maxLength={20}
            />
            <button
              className="btn-start"
              onClick={() => { playSFX('click.wav'); handleStart(); }}
              disabled={!playerName.trim()}
            >
              Начать игру
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{display: 'none'}}
          />
        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;
