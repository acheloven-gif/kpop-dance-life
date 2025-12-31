import React from 'react';
import InfoTooltip from './InfoTooltip';
import { useGame } from '../context/GameContext';
import './PlayerProfile.css';
import './MessengerButton.css';
import { MoneyIcon, ReputationIcon, PopularityIcon, FatigueIcon, SkillsIcon } from '../figma/other';
import MessengerButton from './MessengerButton';
import InventoryButton from './InventoryButton';
import ExpenseStatistics from './ExpenseStatistics';
import { BarChart3 } from 'lucide-react';
import playSFX from '../utils/sfx';
import StatusBadges from './StatusBadges';
import { getReputationColor, getPopularityColor } from '../utils/statusHelpers';



const PlayerProfile: React.FC = () => {
  const { state, npcs } = useGame() as any;
  const { player } = state;
  const [showExpenseStats, setShowExpenseStats] = React.useState(false);

  // Расчет позиции игрока в рейтинге
  const playerAvgSkill = (player.fSkill + player.mSkill) / 2;
  const playerRating = (0.6 * playerAvgSkill) + (0.3 * player.popularity) + (0.1 * (Math.max(0, player.reputation + 100) / 200) * 100);
  
  const betterRatingCount = npcs.filter((npc: any) => {
    const npcAvgSkill = (npc.fSkill + npc.mSkill) / 2;
    const npcRating = (0.6 * npcAvgSkill) + (0.3 * npc.popularity) + (0.1 * (Math.max(0, npc.reputation + 100) / 200) * 100);
    return npcRating > playerRating;
  }).length;

  const playerPosition = betterRatingCount + 1;
  const totalNPCs = npcs.length;

  const getSkillLevel = (skill: number) => {
    if (skill <= 300) return 'Новичок';
    if (skill <= 840) return 'Мидл';
    return 'Про';
  };


  const getAvatarPath = () => {
    const hairLen = player.avatar.hairLength[0];
    const hairCol = player.avatar.hairColor[0];
    const eyeCol = player.avatar.eyeColor[0];
    const key = `${hairLen}${hairCol}${eyeCol}`;
    return `/faces/${key}.png`;
  };

  const getTiredColor = (tired: number) => {
    if (tired <= 50) {
      return '#22c55e'; // green
    } else if (tired <= 70) {
      return '#f59e0b'; // yellow
    } else {
      return '#ef4444'; // red
    }
  };

  // reputation/popularity mapping handled via getReputationColor/getPopularityColor

  return (
    <div className="player-profile">
      {/* Messenger moved to rating row (see below) */}
      <div className="profile-card">
        <img src={getAvatarPath()} alt="Player" className="profile-avatar" />

        <div className="profile-title-row">
          <h2 className="player-name">{player.name}</h2>
          <div className="player-rating-wrap">
            <span className="player-rating">{playerPosition}/{totalNPCs + 1}</span>
            <InfoTooltip text="Ваш рейтинг зависит от мастерства, известности и имиджа. Растите во всех направлениях, и вы подниметесь выше в рейтинге!" placement="top">
              <span className="info-icon">i</span>
            </InfoTooltip>
          </div>
        </div>

        {player.effects && player.effects.length > 0 && (() => {
          // Aggregate effects by label+type to avoid duplicates in UI
          // Filter out effects that don't directly affect player's core stats
          const playerAffectingEffects = player.effects.filter((ef: any) => {
            // Include event tags (visual effects from events), but skip neutral (pink) ones
            if (ef.isEventTag && ef.type !== 'neutral') return true;
            // Only show effects that directly change player stats (skills, reputation, popularity, tiredness, money)
            const relevantKeys = [
              'fSkill','fSkillBoost',
              'mSkill','mSkillBoost',
              'popularity','popularityAdd',
              'reputation','reputationAdd',
              'tired','tiredAdd',
              'money','moneyAdd'
            ];
            // If effect contains any of the keys above (and has a truthy numeric value), show it
            return Object.keys(ef || {}).some(k => relevantKeys.includes(k) && ef[k] !== undefined && ef[k] !== null);
          });

          if (playerAffectingEffects.length === 0) return null;

          const absDayNow = state.gameTime.year * 360 + state.gameTime.month * 30 + state.gameTime.day;
          const map = new Map<string, any>();
          playerAffectingEffects.forEach((ef: any) => {
            const key = `${ef.label || 'ef'}::${ef.type || 'neutral'}`;
            const existing = map.get(key);
            const expires = ef.expiresAbsDay || null;
            if (!existing) {
              map.set(key, { label: ef.label, type: ef.type || 'neutral', count: 1, expiresAbsDay: expires });
            } else {
              existing.count += 1;
              // keep the furthest expiry (longer-lasting) for display
              if (expires && (!existing.expiresAbsDay || expires > existing.expiresAbsDay)) existing.expiresAbsDay = expires;
            }
          });
          const unique = Array.from(map.values());
          // Remove neutral (pink) event tags from display
          const filteredUnique = unique.filter((ef: any) => ef.type !== 'neutral');
          return (
            <div className="effects-row">
              {filteredUnique.map((ef: any, i: number) => (
                <span key={i} className={`effect-badge ${ef.type || 'neutral'}`} title={ef.label}>
                  {ef.label}{ef.count > 1 ? ` ×${ef.count}` : ''}{ef.expiresAbsDay ? ` • ${Math.max(0, ef.expiresAbsDay - absDayNow)}д` : ''}
                </span>
              ))}
            </div>
          );
        })()}
        <div className="profile-controls-row">
          <div className="controls-left">
            <InventoryButton />
          </div>

          <div className="profile-badges-row">
            <StatusBadges reputation={player.reputation || 0} popularity={player.popularity || 0} variant="compact" showRelationship={false} />
          </div>

          <div className="controls-right">
            <MessengerButton />
          </div>
        </div>
      </div>

        <div className="profile-stats">
        <div className="stat-row stat-row-money">
          <span><MoneyIcon size={16} className="icon-inline" /> Деньги:</span>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span className="stat-value">{Math.round(player.money)} ₽</span>
            <button 
              className="messenger-toggle compact"
              onClick={() => { playSFX('click.wav'); setShowExpenseStats(true); }}
              title="Статистика расходов"
              aria-label="Статистика расходов"
              style={{flexShrink: 0}}
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>
        <div className="stat-row">
          <span><FatigueIcon size={16} className="icon-inline" /> Усталость:</span>
          <div className="stat-bar">
              <div
                className="stat-fill"
                style={{ 
                  width: `${Math.max(0, Math.min(100, Math.round(player.tired || 0)))}%`,
                  background: getTiredColor(player.tired || 0)
                }}
              ></div>
            </div>
        </div>
        <div className="stat-row">
          <span><SkillsIcon size={16} className="icon-inline" /> Женский стиль:</span>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1}}>
            <div className="stat-bar" style={{flex: 1}}>
              <div
                className="stat-fill"
                style={{ width: `${Math.max(0, Math.min(100, player.fSkill))}%`, background: 'linear-gradient(90deg, #ff8aa7, #ff2d7f)' }}
              ></div>
            </div>
            <span className="stat-value">{getSkillLevel(player.fSkill)}</span>
          </div>
        </div>
        <div className="stat-row">
          <span><SkillsIcon size={16} className="icon-inline" /> Мужской стиль:</span>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: 1}}>
            <div className="stat-bar" style={{flex: 1}}>
              <div
                className="stat-fill"
                style={{ width: `${Math.max(0, Math.min(100, player.mSkill))}%`, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }}
              ></div>
            </div>
            <span className="stat-value">{getSkillLevel(player.mSkill)}</span>
          </div>
        </div>
      </div>
      
      <ExpenseStatistics isOpen={showExpenseStats} onClose={() => setShowExpenseStats(false)} />
    </div>
  );
};

export default PlayerProfile;


