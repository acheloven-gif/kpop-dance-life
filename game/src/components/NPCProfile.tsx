import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './NPCProfile.css';
import { Crown, MessageCircle } from 'lucide-react';
import StatusBadges from './StatusBadges';
import { getRelationshipLabel, getRelationshipColor, getRelationshipTier } from '../utils/relationshipManager';
import NPCGiftPanel from './NPCGiftPanel';
import playSFX from '../utils/sfx';
import TeamModal from './TeamModal';
import { getCharacterDescription } from '../utils/characterDescriptions';
import { formatGameDate } from '../utils/dateFormatter';
import { getNpcPhrase } from '../data/npcPhrases';

interface Props {
  npcId: string | null;
  onClose: () => void;
}

const NPCProfile: React.FC<Props> = ({ npcId, onClose }) => {
  const { npcs, teams, proposeCollab, state, addRelationshipPoints, sendNewYearGreeting, sendBirthdayGreeting, setModalPause } = useGame() as any;
  const [showTeamModal, setShowTeamModal] = React.useState(false);

  console.log(`[NPCProfile] rendering, npcId=${npcId}, proposeCollab=${typeof proposeCollab}`);

  // Pause game when NPC profile is open
  useEffect(() => {
    if (npcId && setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [npcId, setModalPause]);

  if (!npcId) return null;
  const npc = npcs.find((n: any) => n.id === npcId);
  if (!npc) return null;

  const team = teams.find((t: any) => t.id === npc.teamId);
  const isLeader = team && team.leaderId === npc.id;
  
  // Check if player has pending collab with this NPC
  const pendingCollabs = (state?.player?.pendingCollabs || {});
  const hasPendingCollab = pendingCollabs[npc.id] ? true : false;

  // Check if NPC has private chat and player can propose collab
  const canProposeCollab = () => {
    // If NPC has private chat, only allow if player is acquaintance or friend (not stranger/enemy)
    if (npc.hasPrivateChat) {
      const relPoints = npc.relationshipPoints || 0;
      // 0-10 = stranger, enemyBadge = enemy
      // 11+ = acquaintance or higher
      if (relPoints <= 10 || npc.enemyBadge) {
        return false;
      }
    }
    
    return true;
  };
  
  console.log(`[NPCProfile] NPC=${npc.name}, hasPendingCollab=${hasPendingCollab}, disabled=${hasPendingCollab || !canProposeCollab()}`);

  const getCollabProposalDisabledReason = () => {
    if (hasPendingCollab) {
      return 'Предложение коллаба уже отправлено';
    }
    
    if (npc.hasPrivateChat) {
      const relPoints = npc.relationshipPoints || 0;
      if (relPoints <= 10) {
        return 'Этот NPC не принимает коллабы от незнакомцев';
      }
      if (npc.enemyBadge) {
        return 'Этот NPC не принимает коллабы от врагов';
      }
    }
    
    return undefined;
  };

  // Check if current date is in New Year season (Dec 1 - Jan 1)
  // Game calendar starts from June: month 0 = June, month 6 = December, month 7 = January
  // days are 0-29 for each month in game time
  const currentMonth = state?.gameTime?.month || 0;
  const currentDay = state?.gameTime?.day || 0;
  // Dec 1 (month 6, day >= 0) through Jan 1 (month 7, day === 0)
  const isNewYearSeason = (currentMonth === 6) || (currentMonth === 7 && currentDay === 0);
  
  // Check if New Year greeting was already sent for this NPC
  const newYearGreetingsSent = state?.player?.newYearGreetingsSent || {};
  const hasNewYearGreetingBeenSent = newYearGreetingsSent[npc.id] ? true : false;

  // Check if birthday greeting was already sent for this NPC
  const birthdayGreetingsSent = state?.player?.birthdayGreetingsSent || {};
  const hasBirthdayGreetingBeenSent = birthdayGreetingsSent[npc.id] ? true : false;

  // Получаем очки отношений
  const relationshipPoints = npc.relationshipPoints || 0;
  const relationshipLabel = getRelationshipLabel(relationshipPoints, npc.gender, npc.enemyBadge);
  const relationshipColor = getRelationshipColor(relationshipPoints, npc.enemyBadge);
  const relationshipTier = getRelationshipTier(relationshipPoints);

  // Calculate days until birthday
  const getDaysUntilBirthday = () => {
    if (!npc.birthDate) return null;
    const [birthMonth, birthDay] = npc.birthDate.split('.').map(Number); // calendar month (1-12), day (1-31)
    
    // Convert game time to calendar time
    // Game month 0=June(6), 1=July(7), ..., 6=December(12), 7=January(1), ..., 11=May(5)
    const gameMonthIndex = state?.gameTime?.month || 0;
    const gameDay = (state?.gameTime?.day || 0) + 1; // Convert 0-29 to 1-30
    
    const calendarMonth = (gameMonthIndex + 6) % 12 + 1;
    
    // Days per month in calendar
    const daysPerMonthCalendar = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    let daysUntil = 0;
    
    if (birthMonth > calendarMonth || (birthMonth === calendarMonth && birthDay > gameDay)) {
      // Birthday is this year
      // Days remaining in current month
      daysUntil = daysPerMonthCalendar[calendarMonth - 1] - gameDay;
      // Days in months between current and birthday
      for (let i = calendarMonth; i < birthMonth - 1; i++) {
        daysUntil += daysPerMonthCalendar[i];
      }
      // Days into birthday month
      daysUntil += birthDay;
    } else {
      // Birthday is next year
      // Days remaining in current month
      daysUntil = daysPerMonthCalendar[calendarMonth - 1] - gameDay;
      // Days in remaining months of current year
      for (let i = calendarMonth; i < 12; i++) {
        daysUntil += daysPerMonthCalendar[i];
      }
      // Days into birthday month of next year
      daysUntil += birthDay;
    }
    
    return daysUntil;
  };

  const daysUntilBirthday = getDaysUntilBirthday();
  const isBirthdayToday = daysUntilBirthday === 0;

  const handleGiftGiven = (_giftId: string, bonus: number) => {
    if (addRelationshipPoints) {
      addRelationshipPoints(npc.id, bonus);
      const isMatched = bonus === 20;
      const message = isMatched
        ? getNpcPhrase(npc.behaviorModel, 'gift_excited')
        : getNpcPhrase(npc.behaviorModel, 'gift_birthday');
      playSFX('notification.wav');
    }
  };

  if (showTeamModal && team) {
    return <TeamModal team={team} onClose={() => setShowTeamModal(false)} showApplyButton={true} />;
  }

  return (
    <div className={`modal-overlay ${state?.theme === 'dark' ? 'dark-theme' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal card npc-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{display:'flex',alignItems:'center',gap:8,margin:0}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
              {npc.name}
              {isLeader && <span style={{marginLeft:2}}><Crown size={14} color="#ffd700" /></span>}
            </span>
            <span style={{marginLeft:4}}>
              <div 
                className="relationship-badge-new"
                style={{
                  backgroundColor: relationshipColor,
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {relationshipLabel}
              </div>
            </span>
          </h3>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body npc-profile-body">
          <div className="npc-left">
            <img
              src={`/avatars/normalized/${npc.faceId}`}
              onError={(e: any) => {
                try {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = '/avatars/normalized/default.svg'; // fallback to default face
                } catch (err) { /* ignore */ }
              }}
              alt={npc.name}
              className="npc-avatar"
            />
            <div className="npc-mini-meta">
              <div className="npc-meta-badges">
                <StatusBadges reputation={typeof npc.reputation !== 'undefined' ? npc.reputation : 0} popularity={typeof npc.popularity !== 'undefined' ? npc.popularity : 0} relationship={npc.relationship} variant="compact" showRelationship={false} />
              </div>
              <div className="npc-meta-line">
                <div>
                  <strong>День рождения:</strong> {npc.birthDate || '—'}
                  {isBirthdayToday && <span style={{marginLeft: 8, color: '#ff69b4', fontWeight: 'bold'}}>🎉 Сегодня!</span>}
                  {daysUntilBirthday && daysUntilBirthday > 0 && daysUntilBirthday <= 7 && <span style={{marginLeft: 8, color: '#ff9800', fontSize: '12px'}}>⏰ {daysUntilBirthday} дн.</span>}
                </div>
                <div style={{marginTop:6}}>
                  <strong>Команда:</strong>{' '}
                  {team ? (
                    <button 
                      onClick={() => { setShowTeamModal(true); playSFX('click.wav'); }}
                      style={{background:'none', border:'none', color:'#ff69b4', cursor:'pointer', textDecoration:'underline', fontSize:'inherit', padding:0, margin:0, fontFamily:'inherit'}}
                    >
                      {team.name}
                    </button>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="npc-right">
            <div className="npc-section">
              <h4>Информация</h4>
              <div><strong>Стиль (Ж/М):</strong> {(() => {
                const getSkillLevel = (skill: number) => {
                  if (skill <= 30) return 'Новичок';
                  if (skill <= 70) return 'Мидл';
                  return 'Топ';
                };
                return `${getSkillLevel(npc.fSkill)} / ${getSkillLevel(npc.mSkill)}`;
              })()}</div>
              <div style={{marginTop: 8}}>
                <strong>Характер:</strong>{' '}
                {relationshipTier !== 'stranger' ? (getCharacterDescription(npc.behaviorModel) || npc.behaviorModel) : '—'}
              </div>
              {relationshipTier !== 'stranger' && (
                <div style={{marginTop: 8, fontSize: '12px', color: '#666'}}>
                  {npc.favoriteStyle === 'F_style' && '♀ Предпочитает женский стиль'}
                  {npc.favoriteStyle === 'M_style' && '♂ Предпочитает мужской стиль'}
                  {npc.favoriteStyle === 'Both' && '♀/♂ Нравятся оба стиля'}
                </div>
              )}
            </div>

            <div className="npc-section">
              <h4>Действия</h4>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {isNewYearSeason && !hasNewYearGreetingBeenSent && (() => {
                  // Check if chat is closed for this NPC
                  const relPoints = npc.relationshipPoints || 0;
                  const isPrivateChat = npc.hasPrivateChat;
                  const isStranger = relPoints <= 10 && isPrivateChat;
                  const isEnemy = npc.enemyBadge && isPrivateChat;
                  
                  // If chat is closed, show message instead of button
                  if (isPrivateChat && (isStranger || isEnemy)) {
                    return (
                      <button
                        className="btn-action small"
                        disabled={true}
                        title="Чат закрыт - откройте доступ к приватному чату"
                        style={{background:'#f0f0f0', border:'1px solid #999', color:'#666', opacity:0.5, cursor:'not-allowed'}}
                      >
                        Чат закрыт
                      </button>
                    );
                  }
                  
                  return (
                    <button
                      className="btn-action small"
                      onClick={() => {
                        try {
                          sendNewYearGreeting && sendNewYearGreeting(npc.id);
                          playSFX('notification.wav');
                        } catch (e) {}
                      }}
                      title="Поздравить с Новым Годом (отправится 31 декабря)"
                      style={{background:'#ffdce6', border:'1px solid #ff69b4', color:'#6a0030'}}
                    >
                      Поздравить с НГ
                    </button>
                  );
                })()}
                {isNewYearSeason && hasNewYearGreetingBeenSent && (
                  <button
                    className="btn-action small"
                    disabled={true}
                    title="Вы уже отправили поздравление"
                    style={{background:'#ccc', border:'1px solid #999', color:'#666', opacity:0.5, cursor:'not-allowed'}}
                  >
                    Поздравление отправлено ✓
                  </button>
                )}
                {isBirthdayToday && !hasBirthdayGreetingBeenSent && (
                  <button
                    className="btn-action small"
                    onClick={() => {
                      try {
                        sendBirthdayGreeting && sendBirthdayGreeting(npc.id);
                        playSFX('notification.wav');
                      } catch (e) {}
                    }}
                    title="Поздравить с Днем рождения"
                    style={{background:'#ffe6cc', border:'1px solid #ffb366', color:'#663300'}}
                  >
                    Поздравить с ДР
                  </button>
                )}
                {isBirthdayToday && hasBirthdayGreetingBeenSent && (
                  <button
                    className="btn-action small"
                    disabled={true}
                    title="Вы уже отправили поздравление"
                    style={{background:'#ccc', border:'1px solid #999', color:'#666', opacity:0.5, cursor:'not-allowed'}}
                  >
                    Поздравление отправлено ✓
                  </button>
                )}
                <button
                  className="btn-action small"
                  onClick={() => {
                    playSFX('click.wav');
                    window.dispatchEvent(new CustomEvent('open-messenger', { detail: { npcId: npc.id } }));
                    // Закрыть профиль после открытия чата
                    onClose();
                  }}
                  title="Открыть чат с этим NPC"
                  style={{padding:'6px 10px', background:'linear-gradient(135deg, #ff69b4, #ff1493)', color:'#fff', border:'none'}}
                >
                  <MessageCircle size={16} />
                </button>
                <div style={{position:'relative'}}>
                  <button
                    className="btn-action small btn-propose-collab"
                    onClick={() => {
                      console.log(`[NPCProfile Button] proposeCollab=${typeof proposeCollab}, npc.id=${npc.id}`);
                      try { proposeCollab && proposeCollab(npc.id); playSFX('click.wav'); } catch(e) { console.error(`[NPCProfile Button Error]`, e); }
                    }}
                    disabled={hasPendingCollab || !canProposeCollab()}
                    style={{opacity: (hasPendingCollab || !canProposeCollab()) ? 0.5 : 1, cursor: (hasPendingCollab || !canProposeCollab()) ? 'not-allowed' : 'pointer', background: (hasPendingCollab || !canProposeCollab()) ? '#999' : 'linear-gradient(135deg,#ff69b4,#ff1493)', color: '#fff'}}
                    title={getCollabProposalDisabledReason() || 'Предложить коллаб'}
                  >
                    {hasPendingCollab ? 'Предложение отправлено' : 'Предложить коллаб'}
                  </button>
                </div>
              </div>
            </div>

            <div className="npc-section">
              <h4>Кратко</h4>
              <div className="muted" style={{whiteSpace:'pre-wrap', textAlign: 'center'}}>{npc.bio || 'Информация отсутствует.'}</div>
            </div>
          </div>
        </div>

        {/* Панель подарков и отношений скрыта (убрано из визуального отображения) */}

        <div className="modal-actions" style={{display: 'none'}}>
          <button className="btn-cancel" onClick={onClose}>Закрыть</button>
        </div>
      </div>
      {showTeamModal && team && <TeamModal team={team} onClose={() => setShowTeamModal(false)} />}
    </div>
  );
};

export default NPCProfile;
