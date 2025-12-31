import React, { useEffect, useRef, useState } from 'react';
import './AudioManager.css';

interface AudioManagerProps {
  onMusicVolumeChange?: (volume: number) => void;
  onSFXVolumeChange?: (volume: number) => void;
  position?: 'fixed-bottom-right' | 'inline';
}

export const AudioManager: React.FC<AudioManagerProps> = ({ onMusicVolumeChange, onSFXVolumeChange, position = 'fixed-bottom-right' }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('musicVolume');
    return saved ? parseInt(saved) : 70;
  });
  const [sfxVolume, setSFXVolumeLocal] = useState(() => {
    const saved = localStorage.getItem('sfxVolume');
    return saved ? parseInt(saved) : 70;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = sessionStorage.getItem('isMuted');
    if (saved === null) {
      // default to unmuted
      sessionStorage.setItem('isMuted', 'false');
      return false;
    }
    return saved === 'true';
  });
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(2); // Начинаем с трека 2

  const tracks = ['/ost/2.mp3', '/ost/3.mp3', '/ost/4.mp3', '/ost/5.mp3', '/ost/6.mp3'];

  // Инициализация музыки при загрузке
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = tracks[currentTrackIndex - 2];
      audioRef.current.volume = isMuted ? 0 : musicVolume / 100;
      audioRef.current.play().catch(() => {
        console.log('Автоплей заблокирован');
      });
    }
  }, []);

  // Смена трека
  const handleTrackEnd = () => {
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex > 6) {
      nextIndex = 2;
    }
    setCurrentTrackIndex(nextIndex);
    if (audioRef.current) {
      audioRef.current.src = tracks[nextIndex - 2];
      audioRef.current.play();
    }
  };

  const clearHideTimer = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const startHideTimer = () => {
    clearHideTimer();
    // Скрыть через 3 секунды
    hideTimer.current = window.setTimeout(() => {
      setShowVolumeSlider(false);
      hideTimer.current = null;
    }, 300) as unknown as number;
  };

  const handleToggleMute = () => {
    if (isMuted) {
      // Unmute
      setIsMuted(false);
      sessionStorage.setItem('isMuted', 'false');
      if (audioRef.current) {
        audioRef.current.volume = musicVolume / 100;
        audioRef.current.play().catch(() => {});
      }
    } else {
      // Mute everything
      setIsMuted(true);
      sessionStorage.setItem('isMuted', 'true');
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {}
        audioRef.current.volume = 0;
      }
    }
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setMusicVolume(newVolume);
    setIsMuted(false);
    localStorage.setItem('musicVolume', newVolume.toString());
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      if (newVolume > 0 && audioRef.current.paused) {
        audioRef.current.play();
      }
    }
    onMusicVolumeChange?.(newVolume);
  };

  const handleSFXVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setSFXVolumeLocal(newVolume);
    localStorage.setItem('sfxVolume', newVolume.toString());
    // Сохраняем в sessionStorage для доступа в sfx.ts
    sessionStorage.setItem('currentSFXVolume', (newVolume / 100).toString());
    onSFXVolumeChange?.(newVolume);
  };

  return (
    <div className={`audio-manager ${position}`}>
      <audio
        ref={audioRef}
        onEnded={handleTrackEnd}
        loop={false}
      />

      <div
        className="volume-control"
        onMouseEnter={() => { clearHideTimer(); setShowVolumeSlider(true); }}
        onMouseLeave={() => { startHideTimer(); }}
      >
        <button
          className="btn-sound"
          onClick={handleToggleMute}
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        <div
          className={`volume-slider-container ${showVolumeSlider ? 'visible' : 'hidden'}`}
          onMouseEnter={() => { clearHideTimer(); setShowVolumeSlider(true); }}
          onMouseLeave={() => { startHideTimer(); }}
        >
            <div className="volume-control-row">
              <span className="volume-icon">🔊</span>
              <label className="volume-label-text">Музыка</label>
              <input
                type="range"
                min="0"
                max="100"
                value={musicVolume}
                onChange={handleMusicVolumeChange}
                className="volume-slider"
              />
              <div className="volume-percent">{musicVolume}%</div>
            </div>

            <div className="volume-control-row">
              <span className="volume-icon">🔊</span>
              <label className="volume-label-text">Звуки</label>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVolume}
                onChange={handleSFXVolumeChange}
                className="volume-slider"
              />
              <div className="volume-percent">{sfxVolume}%</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AudioManager;
