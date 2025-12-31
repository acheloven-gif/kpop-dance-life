import React from 'react';
import { Gift, GIFTS } from '../types/game';
import { RelationshipBonuses, getRelationshipColor, getRelationshipLabel, getRelationshipTier } from '../utils/relationshipManager';
import './NPCGiftPanel.css';

interface NPCGiftPanelProps {
  npcId?: string;
  npcName?: string;
  npcBehavior: string;
  npcGender?: 'M' | 'F';
  npcEnemyBadge?: boolean;
  relationshipPoints: number;
  onGiftGiven?: (giftId: string, bonus: number) => void;
}

const NPCGiftPanel: React.FC<NPCGiftPanelProps> = ({
  npcBehavior,
  npcGender,
  npcEnemyBadge,
  relationshipPoints,
  onGiftGiven,
}) => {
  const [selectedGift, setSelectedGift] = React.useState<Gift | null>(null);

  const relationshipColor = getRelationshipColor(relationshipPoints, (npcEnemyBadge || false));
  const relationshipLabel = getRelationshipLabel(relationshipPoints, npcGender, (npcEnemyBadge || false));
  const relationshipTier = getRelationshipTier(relationshipPoints);

  const handleGiftClick = (gift: Gift) => {
    setSelectedGift(gift);
  };

  const handleConfirmGift = () => {
    if (!selectedGift) return;

    // Определяем подходит ли подарок
    const isMatched = selectedGift.suitableCharacters.includes(npcBehavior as any);
    const bonus = isMatched ? selectedGift.matchedRelationshipBonus : selectedGift.baseRelationshipBonus;

    // Проверяем хватает ли денег
    // TODO: Получить деньги игрока из GameContext
    // const playerMoney = useGame().state.player.money;
    // const giftPrice = 500; // Фиксированная цена подарка
    // if (playerMoney < giftPrice) return;

    if (onGiftGiven) {
      onGiftGiven(selectedGift.id, bonus);
    }

    setSelectedGift(null);
  };

  const getTierPercentage = () => {
    const tierRanges = [
      { min: 0, max: 10 },
      { min: 11, max: 40 },
      { min: 41, max: 70 },
      { min: 71, max: 100 },
    ];

    const tierIndex = ['stranger', 'acquaintance', 'friend', 'best_friend'].indexOf(relationshipTier);
    const currentRange = tierRanges[tierIndex];
    const pointsInTier = relationshipPoints - currentRange.min;
    const totalTierPoints = currentRange.max - currentRange.min + 1;

    return Math.floor((pointsInTier / totalTierPoints) * 100);
  };

  return (
    <div className="npc-gift-panel">
      {/* Шкала отношений */}
      <div className="relationship-section">
        <div className="relationship-header">
          <h4 style={{ margin: '0 0 8px 0' }}>Отношения</h4>
          <div
            className="relationship-label"
            style={{
              color: relationshipColor,
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            {relationshipLabel} ({relationshipPoints}/100)
          </div>
        </div>

        <div className="relationship-bar-container">
          <div
            className="relationship-bar-fill"
            style={{
              width: `${relationshipPoints}%`,
              backgroundColor: relationshipColor,
            }}
          />
          <div className="relationship-bar-text">
            {relationshipPoints > 5 && `${relationshipPoints}`}
          </div>
        </div>

        <div className="relationship-tiers">
          <div className="tier" style={{ opacity: relationshipPoints > 10 ? 1 : 0.3 }}>
            <div className="tier-dot" style={{ backgroundColor: '#999999' }} />
            <span className="tier-label">Незнакомец (0-10)</span>
          </div>
          <div className="tier" style={{ opacity: relationshipPoints > 40 ? 1 : 0.3 }}>
            <div className="tier-dot" style={{ backgroundColor: '#87CEEB' }} />
            <span className="tier-label">Знакомый (11-40)</span>
          </div>
          <div className="tier" style={{ opacity: relationshipPoints > 70 ? 1 : 0.3 }}>
            <div className="tier-dot" style={{ backgroundColor: '#FF8C00' }} />
            <span className="tier-label">Приятель (41-70)</span>
          </div>
          <div className="tier" style={{ opacity: relationshipPoints > 99 ? 1 : 0.3 }}>
            <div className="tier-dot" style={{ backgroundColor: '#32CD32' }} />
            <span className="tier-label">Друг (71-100)</span>
          </div>
        </div>
      </div>

      {/* Подарки */}
      <div className="gifts-section">
        <h4 style={{ margin: '0 0 12px 0' }}>Подарить подарок</h4>

        {!selectedGift ? (
          <div className="gifts-list">
            {GIFTS.map(gift => {
              const isMatched = gift.suitableCharacters.includes(npcBehavior as any);
              return (
                <button
                  key={gift.id}
                  className={`gift-card ${isMatched ? 'matched' : 'unmatched'}`}
                  onClick={() => handleGiftClick(gift)}
                  title={`${gift.name}\n${gift.description}${
                    isMatched ? '\n✓ Подходит характеру' : '\n✗ Не подходит характеру'
                  }`}
                >
                  <div className="gift-name">{gift.name}</div>
                  <div className="gift-bonus">
                    {isMatched ? (
                      <span className="bonus-matched">+{gift.matchedRelationshipBonus}</span>
                    ) : (
                      <span className="bonus-unmatched">+{gift.baseRelationshipBonus}</span>
                    )}
                  </div>
                  {isMatched && <div className="gift-badge">✓ Подходит</div>}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="gift-confirmation">
            <div className="gift-selected">
              <h5>{selectedGift.name}</h5>
              <p className="gift-description">{selectedGift.description}</p>

              <div className="gift-bonus-display">
                {selectedGift.suitableCharacters.includes(npcBehavior as any) ? (
                  <div className="bonus-info matched">
                    <span className="bonus-label">Подходит характеру!</span>
                    <span className="bonus-value">+{selectedGift.matchedRelationshipBonus}</span>
                  </div>
                ) : (
                  <div className="bonus-info unmatched">
                    <span className="bonus-label">Не совсем подходит</span>
                    <span className="bonus-value">+{selectedGift.baseRelationshipBonus}</span>
                  </div>
                )}
              </div>

              <div className="confirmation-actions">
                <button className="btn-confirm" onClick={handleConfirmGift}>
                  Подарить
                </button>
                <button className="btn-cancel-gift" onClick={() => setSelectedGift(null)}>
                  Отменить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Информация о механике */}
      <div className="mechanics-info">
        <h4 style={{ margin: '0 0 8px 0' }}>📚 Как работают отношения</h4>
        <ul className="info-list">
          <li>Совместный проект: <span className="bonus">+5</span></li>
          <li>Коллаб: <span className="bonus">+10</span></li>
          <li>Конфликт в команде: <span className="penalty">-5</span></li>
          <li>Фестиваль (команда): <span className="bonus">+7</span></li>
          <li>Поздравление: <span className="bonus">+3</span></li>
          <li>Совместная тренировка: <span className="bonus">+2</span></li>
        </ul>
      </div>
    </div>
  );
};

export default NPCGiftPanel;
