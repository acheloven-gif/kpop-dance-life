import React from 'react';
import { getReputationColor, getPopularityColor, getRelationshipLabel } from '../utils/statusHelpers';
import InfoTooltip from './InfoTooltip';
import './StatusBadges.css';

interface StatusBadgesProps {
  reputation: number;
  popularity: number;
  relationship?: 'stranger' | 'acquaintance' | 'friend';
  variant?: 'compact' | 'full'; // compact = только значки, full = с текстом
  showRelationship?: boolean;
}

const StatusBadges: React.FC<StatusBadgesProps> = ({
  reputation,
  popularity,
  relationship = 'stranger',
  variant = 'full',
  showRelationship = true,
}) => {
  const repColor = getReputationColor(reputation);
  const popColor = getPopularityColor(popularity);

  // Tooltip texts for reputation
  const getReputationTooltip = (): string => {
    if (reputation < -5) {
      return 'Токсик: очень низкая репутация. Люди избегают работать с вами. Причины: частое отсутствие на тренировках и конфликты. Растет через успешные проекты и позитивное поведение.';
    } else if (reputation < 26) {
      return 'Нормик: нейтральная репутация. Трудно сказать, какой вы человек. Но точно не плохой. Растет через успешные проекты и позитивное поведение.';
    } else {
      return 'Отличная: высокая репутация. С Вами приятно работать. Растет через успешные проекты и позитивное поведение.';
    }
  };

  // Tooltip texts for popularity
  const getPopularityTooltip = (): string => {
    if (popularity <= 30) {
      return 'Ноунейм: низкая популярность. Вас почти никто не знает. Растет через выступления, победы на фестивалях и совместные проекты.';
    } else if (popularity <= 70) {
      return 'Известный: средняя популярность. Некоторые знают о Вас. Растет через выступления, победы на фестивалях и совместные проекты.';
    } else {
      return 'Топовый: высокая популярность. Вас все знают, Вы звезда! Растет через выступления, победы на фестивалях и совместные проекты.';
    }
  };

  return (
    <div className={`status-badges status-badges-${variant}`}>
      {/* Репутация */}
      <InfoTooltip text={getReputationTooltip()} placement="bottom">
        <div className={`status-badge reputation ${repColor.class}`}>
          <div className="badge-inner" style={{ borderColor: repColor.color }}>
            <span className="badge-dot" style={{ backgroundColor: repColor.color }} />
            <span className="badge-label">{repColor.label}</span>
            {variant === 'full' && (
              <span className="badge-value">({reputation > 0 ? '+' : ''}{Math.round(reputation)})</span>
            )}
          </div>
        </div>
      </InfoTooltip>

      {/* Популярность */}
      <InfoTooltip text={getPopularityTooltip()} placement="bottom">
        <div className={`status-badge popularity ${popColor.class}`}>
          <div className="badge-inner" style={{ borderColor: popColor.color }}>
            <span className="badge-dot" style={{ backgroundColor: popColor.color }} />
            <span className="badge-label">{popColor.label}</span>
            {variant === 'full' && (
              <span className="badge-value">({Math.round(popularity)})</span>
            )}
          </div>
        </div>
      </InfoTooltip>

      {/* Отношение */}
      {showRelationship && variant === 'full' && (
        <div className={`status-badge relationship rel-${relationship}`}>
          <div className="badge-inner">
            <span className="badge-label">{getRelationshipLabel(relationship)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusBadges;
