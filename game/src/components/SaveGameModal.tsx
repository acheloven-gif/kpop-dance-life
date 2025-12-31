import React, { useState, useEffect } from 'react';
import { NotebookPen, Upload } from 'lucide-react';
import { useGame } from '../context/GameContext';
import playSFX from '../utils/sfx';
import './SaveGameModal.css';
import { getReputationColor, getPopularityColor } from '../utils/statusHelpers';
import { MoneyIcon, ReputationIcon, PopularityIcon, FemaleStyleIcon, MaleStyleIcon } from '../figma/other';

interface SaveGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SaveGameModal: React.FC<SaveGameModalProps> = ({ isOpen, onClose }) => {
  const { state, loadGame, setModalPause } = useGame();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [saveName, setSaveName] = useState(`Сохранение #${Date.now() % 1000}`);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [notes, setNotes] = useState('');

  // Pause game when modal is open/closed
  useEffect(() => {
    if (isOpen && setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [isOpen, setModalPause]);

  const gameDate = `Year ${state.gameTime.year}, Month ${state.gameTime.month + 1}, Day ${state.gameTime.day + 1}`;
  const formattedDate = `${String(state.gameTime.month + 1).padStart(2, '0')}.${String(state.gameTime.day + 1).padStart(2, '0')}.${state.gameTime.year}`;

  const handleSave = () => {
    if (!saveName.trim()) {
      setErrorMessage('Введите название сохранения');
      setSaveStatus('error');
      playSFX('error.wav');
      return;
    }

    setSaveStatus('saving');
    playSFX('click.wav');

    try {
      const gameState = {
        player: state.player,
        gameTime: state.gameTime,
        saveName: saveName.trim(),
        savedAt: new Date().toISOString(),
        formattedDate,
        notes: notes.trim(),
      };

      const dataStr = JSON.stringify(gameState, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kpop_save_${saveName.replace(/\s+/g, '_')}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSaveStatus('success');
      playSFX('notification.wav');
      setTimeout(() => { setSaveStatus('idle'); onClose(); }, 1200);
    } catch (err) {
      console.error('Save error:', err);
      setErrorMessage('Ошибка при сохранении');
      setSaveStatus('error');
      playSFX('error.wav');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="save-modal-overlay" onClick={onClose}>
      <div className="save-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Notebook Left Side - Decoration */}
        <div className="notebook-left">
          <div className="notebook-spine"></div>
          <div className="notebook-ring"></div>
          <div className="notebook-ring"></div>
          <div className="notebook-ring"></div>
        </div>

        {/* Notebook Right Side - Main Content */}
        <div className="notebook-right" style={{display:'flex',flexDirection:'column'}}>
          {/* Header */}
          <div className="notebook-header">
            <div className="notebook-date"></div>
            <button className="notebook-close-btn" onClick={onClose}>✕</button>
          </div>

          {/* Divider */}
          <div className="notebook-divider"></div>

          {/* Main Content - scrollable */}
          <div style={{flex:1,overflowY:'auto',padding:'12px 12px',minHeight:0}}>
            <div className="save-section">
              <label className="save-label">Название сохранения:</label>
              <input
                type="text"
                className="save-input"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Введите название..."
                disabled={saveStatus === 'saving'}
                maxLength={50}
              />
              <div className="char-count">{saveName.length}/50</div>
            </div>

            {/* Player Stats */}
            <div className="save-section stats-section">
              <div className="stats-header">Статистика игрока:</div>
              <div className="stats-grid">
                <div className="stat-box compact">
                  <div className="stat-icon"><MoneyIcon size={22} /></div>
                  <div className="stat-name">Деньги</div>
                  <div className="stat-value">{(state.player.money || 0).toLocaleString()} ₽</div>
                </div>
                <div className="stat-box compact">
                  <div className="stat-icon"><ReputationIcon size={22} /></div>
                  <div className="stat-name">Репутация</div>
                  {(() => {
                    const rep = getReputationColor(state.player.reputation || 0);
                    return <div className={`stat-value ${rep.class}`}>{rep.label}</div>;
                  })()}
                </div>
                <div className="stat-box compact">
                  <div className="stat-icon"><PopularityIcon size={22} /></div>
                  <div className="stat-name">Популярность</div>
                  {(() => {
                    const pop = getPopularityColor(state.player.popularity || 0);
                    return <div className={`stat-value ${pop.class}`}>{pop.label}</div>;
                  })()}
                </div>
                <div className="stat-box compact">
                  <div className="stat-icon"><FemaleStyleIcon size={22} /></div>
                  <div className="stat-name">Женский стиль</div>
                  <div className="stat-value">{(function getSkillLevel(skill: number){ if(skill === undefined || skill === null) return '—'; if (skill <= 300) return 'Новичок'; if (skill <= 840) return 'Мидл'; return 'Про'; })(state.player.fSkill)}</div>
                </div>
                <div className="stat-box compact">
                  <div className="stat-icon"><MaleStyleIcon size={22} /></div>
                  <div className="stat-name">Мужской стиль</div>
                  <div className="stat-value">{(function getSkillLevel(skill: number){ if(skill === undefined || skill === null) return '—'; if (skill <= 300) return 'Новичок'; if (skill <= 840) return 'Мидл'; return 'Про'; })(state.player.mSkill)}</div>
                </div>
              </div>

              <div className="save-section">
                <label className="save-label">Заметки (опционально):</label>
                <textarea
                  className="save-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Короткая заметка о сохранении (до 400 символов)"
                  maxLength={400}
                  rows={4}
                />
                <div className="char-count">{notes.length}/400</div>
              </div>

              {state.player.teamId && (
                <div className="team-info">
                  <div className="team-label">Текущая команда:</div>
                  <div className="team-status">В команде</div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {saveStatus === 'error' && (
              <div className="save-error">⚠️ {errorMessage}</div>
            )}

            {/* Status Messages */}
            {saveStatus === 'saving' && (
              <div className="save-status saving">⏳ Сохранение...</div>
            )}

            {saveStatus === 'success' && (
              <div className="save-status success">✅ Сохранено успешно!</div>
            )}
          </div>

          {/* Footer with buttons - fixed at bottom */}
          <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',gap:8,padding:'12px',flexShrink:0,borderTop:'1px solid rgba(255,105,180,0.1)',background:'linear-gradient(135deg, rgba(255,105,180,0.06) 0%, rgba(255,182,193,0.02) 100%)'}}>
            <input ref={fileInputRef} type="file" accept="application/json" style={{display:'none'}} onChange={(e) => {
              const f = e.target.files && e.target.files[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const txt = ev.target?.result as string;
                  const parsed = JSON.parse(txt);
                  if (!parsed || !parsed.player || !parsed.gameTime) {
                    setErrorMessage('Файл не похож на сохранение');
                    setSaveStatus('error');
                    playSFX('error.wav');
                    return;
                  }
                  localStorage.setItem('gameState', JSON.stringify(parsed));
                  if (loadGame) loadGame();
                  setSaveStatus('success');
                  playSFX('notification.wav');
                  setTimeout(() => { setSaveStatus('idle'); onClose(); }, 1200);
                } catch (err) {
                  setErrorMessage('Не удалось загрузить файл');
                  setSaveStatus('error');
                  playSFX('error.wav');
                }
              };
              reader.readAsText(f);
            }} />

            <button className="load-btn" onClick={() => { fileInputRef.current && fileInputRef.current.click(); }} title="Загрузить сохранение" style={{padding:'12px 24px',borderRadius:'12px',border:'2px solid #ff69b4',background:'linear-gradient(135deg, rgba(255,105,180,0.1) 0%, rgba(255,182,193,0.05) 100%)',color:'#ff69b4',cursor:'pointer',fontWeight:700,display:'inline-flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 12px rgba(255,105,180,0.15)',transition:'all 0.3s ease'}}>
              <Upload size={18} />
              Загрузить игру
            </button>

            <button
              className="save-btn"
              onClick={handleSave}
              disabled={saveStatus === 'saving' || saveStatus === 'success'}
              style={{padding:'12px 24px',borderRadius:'12px',border:'none',background:'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)',color:'#fff',cursor:'pointer',fontWeight:700,display:'inline-flex',alignItems:'center',gap:'8px',boxShadow:'0 4px 12px rgba(255,105,180,0.3)',transition:'all 0.3s ease',opacity: (saveStatus === 'saving' || saveStatus === 'success') ? 0.6 : 1}}
            >
              <NotebookPen size={18} />
              {saveStatus === 'saving' ? 'Сохранение...' : 'Сохранить игру'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveGameModal;
