import React from 'react';
import { useGame } from '../context/GameContext';
import './PlayerStats.css';

const PlayerStats: React.FC = () => {
  const { state } = useGame();
  const player = state.player;

  const reputationLabel = 
    player.reputation >= 50 ? 'Отличная' :
    player.reputation >= 0 ? 'Хорошая' :
    player.reputation >= -50 ? 'Нейтральная' :
    'Плохая';

  const popularityLabel =
    player.popularity >= 50 ? 'Известный' :
    player.popularity >= 0 ? 'Хороший' :
    player.popularity >= -50 ? 'Малоизвестный' :
    'Неизвестный';

  return (
    <div className="player-stats">
      <h3>Статистика игрока</h3>
      
      <div className="stats-item">
        <span className="label">👤 Имя:</span>
        <span className="value">{player.name}</span>
      </div>

      <div className="stats-row">
        <div className="stats-item">
          <span className="label">⭐ Репутация:</span>
          <span className="value">{Math.round(player.reputation)}</span>
          <span className="sublabel">({reputationLabel})</span>
        </div>
        <div className="stats-item">
          <span className="label">💫 Популярность:</span>
          <span className="value">{Math.round(player.popularity)}</span>
          <span className="sublabel">({popularityLabel})</span>
        </div>
      </div>

      <div className="stats-row">
        <div className="stats-item">
          <span className="label">💃 Ж. стиль:</span>
          <div className="progress-mini">
            <div className="fill" style={{ width: `${Math.min(100, player.fSkill)}%` }}></div>
          </div>
          <span className="value">{Math.round(player.fSkill)}%</span>
        </div>
        <div className="stats-item">
          <span className="label">🕺 М. стиль:</span>
          <div className="progress-mini">
            <div className="fill" style={{ width: `${Math.min(100, player.mSkill)}%` }}></div>
          </div>
          <span className="value">{Math.round(player.mSkill)}%</span>
        </div>
      </div>

      <div className="stats-item">
        <span className="label">💰 Деньги:</span>
        <span className="value">{player.money.toLocaleString()} ₽</span>
      </div>

      <div className="stats-item">
        <span className="label">😴 Усталость:</span>
        <div className="progress-mini">
          <div className="fill" style={{ width: `${player.tired}%`, backgroundColor: '#dc2626' }}></div>
        </div>
        <span className="value">{Math.round(player.tired)}%</span>
      </div>

      {player.teamId && (
        <div className="stats-item">
          <span className="label">👫 Команда:</span>
          <span className="value team-badge">Участник группы</span>
        </div>
      )}
    </div>
  );
};

export default PlayerStats;
