// Примеры использования системы отношений и статусов

import StatusBadges from './StatusBadges';
import { getReputationColor, getPopularityColor } from '../utils/statusHelpers';

// ============================================
// ПРИМЕР 1: Профиль игрока с высокой репутацией
// ============================================
export const PlayerHighRepExample = () => {
  return (
    <StatusBadges 
      reputation={42}
      popularity={78}
      relationship="friend"
      variant="full"
      showRelationship={true}
    />
  );
};

// ============================================
// ПРИМЕР 2: Профиль невдачника с низкой репутацией
// ============================================
export const PlayerLowRepExample = () => {
  return (
    <StatusBadges 
      reputation={-12}
      popularity={15}
      relationship="stranger"
      variant="full"
      showRelationship={true}
    />
  );
};

// ============================================
// ПРИМЕР 3: NPC в списке рейтинга (компактный вид)
// ============================================
export const NPCRatingItemExample = () => {
  const npc = {
    id: 'npc_1',
    name: 'Кейт',
    reputation: 35,
    popularity: 72,
    relationship: 'acquaintance' as const,
  };

  return (
    <div className="npc-status-card">
      <img src={`/avatars/${npc.id}.png`} alt={npc.name} />
      <div className="npc-status-info">
        <div className="npc-status-name">{npc.name}</div>
        <StatusBadges 
          reputation={npc.reputation}
          popularity={npc.popularity}
          relationship={npc.relationship}
          variant="compact"
          showRelationship={true}
        />
      </div>
    </div>
  );
};

// ============================================
// ПРИМЕР 4: Получение цветов программно
// ============================================
export const ColorUtilsExample = () => {
  const reputation = 25;
  const popularity = 60;

  const repColor = getReputationColor(reputation);
  const popColor = getPopularityColor(popularity);

  return (
    <div>
      <span style={{ color: repColor.color }}>
        {repColor.label}: {reputation}
      </span>
      <span style={{ color: popColor.color }}>
        {popColor.label}: {popularity}
      </span>
    </div>
  );
};

// ============================================
// ПРИМЕР 5: Легенда статусов для помощи игроку
// ============================================
export const StatusLegend = () => {
  return (
    <div className="status-legend">
      <h3>Легенда статусов</h3>
      
      <div className="legend-section">
        <h4>Репутация</h4>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
          <span>Токсик - низкая репутация (менее -5)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#eab308' }}></span>
          <span>Нормик - нейтральная репутация (-5 до +25)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#22c55e' }}></span>
          <span>Отличная - высокая репутация (26+)</span>
        </div>
      </div>
      
      <div className="legend-section">
        <h4>Популярность</h4>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#a3a3a3' }}></span>
          <span>Ноунейм - малоизвестный (до 30)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#fb923c' }}></span>
          <span>Известный - хорошо известен (31-70)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#fef08a' }}></span>
          <span>Топовый - знаменитость (71+)</span>
        </div>
      </div>

      <div className="legend-section">
        <h4>Отношения</h4>
        <div className="legend-item">Незнакомец - не встречались</div>
        <div className="legend-item">Знакомый - есть взаимодействия</div>
        <div className="legend-item">Друг - тесные отношения</div>
      </div>
    </div>
  );
};
