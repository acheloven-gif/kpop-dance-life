import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { GameEvent } from '../utils/eventGenerator';
import FestivalVideoModal from './FestivalVideoModal';
import './EventModal.css';
import { MoneyIcon, FemaleStyleIcon, MaleStyleIcon, PopularityIcon, ReputationIcon, FatigueIcon } from '../figma/other';
import playSFX from '../utils/sfx';

const EventModal: React.FC = () => {
  const { state, recentEvent, clearRecentEvent, updatePlayer, joinTeam, leaveTeam, teams, applyEffect, showEventIfIdle, setModalPause, addTeamProject, processCollabAccept, npcs, abandonProject } = useGame();
  const soundPlayedRef = useRef(false);
  const [showVideoFirst, setShowVideoFirst] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);

  useEffect(() => {
    if (recentEvent && setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [recentEvent, setModalPause]);

  useEffect(() => {
    if (recentEvent) {
      if (!soundPlayedRef.current) {
        playSFX('notification.wav');
        soundPlayedRef.current = true;
      }
      
      // Check if this is a festival event - show video first
      const isFestival = (recentEvent as GameEvent).type === 'festival';
      if (isFestival) {
        setShowVideoFirst(true);
        setVideoCompleted(false);
      }
    } else {
      // Event was closed/cleared - resume game
      soundPlayedRef.current = false;
      setShowVideoFirst(false);
      setVideoCompleted(false);
    }
  }, [recentEvent]);

  const applyEffectAndClose = (effect: any) => {
    // Handle collab acceptance specially
    if (effect && effect.collabAccept && processCollabAccept) {
      try {
        processCollabAccept(effect.collabAccept);
      } catch (e) { }
      clearRecentEvent && clearRecentEvent();
      playSFX('close.wav');
      return;
    }
    // If the effect requires money (negative) ensure the player has enough funds
    if ((effect.money || 0) < 0) {
      const cost = Math.abs(effect.money || 0);
      const playerMoney = state.player.money || 0;
      if (playerMoney < cost) {
        // Inform player about insufficient funds
        clearRecentEvent && clearRecentEvent();
        showEventIfIdle && showEventIfIdle({ id: `insuf_${Date.now()}`, title: 'Недостаточно средств', text: 'У вас недостаточно денег для этого действия.' });
        playSFX('error.wav');
        return;
      }
    }

    updatePlayer({
      money: Math.max(0, (state.player.money || 0) + (effect.money || 0)),
      fSkill: Math.max(0, (state.player.fSkill || 0) + (effect.fSkill || 0)),
      mSkill: Math.max(0, (state.player.mSkill || 0) + (effect.mSkill || 0)),
      popularity: Math.max(0, (state.player.popularity || 0) + (effect.popularity || 0)),
      reputation: Math.max(-100, Math.min(100, (state.player.reputation || 0) + (effect.reputation || 0))),
      tired: Math.max(0, Math.min(100, (state.player.tired || 0) + (effect.tired || 0))),
      festivalWins: ((state.player as any).festivalWins || 0) + ((recentEvent as any).type === 'festival' && (recentEvent as any).title.includes('Победа') ? 1 : 0)
    });

    // Use centralized applyEffect helper to handle immediate and multi-day effects
    try {
      applyEffect && applyEffect(effect, recentEvent?.title || 'Событие');
    } catch (e) {
      // ignore
    }

    // If effect asks to join a team, call joinTeam but check for reputation-based refusal
    if (effect && effect.teamJoin && joinTeam) {
      const team = teams.find((t: any) => t.id === String(effect.teamJoin));
      const playerRep = state.player.reputation || 0;
      const teamRep = (team && (team.reputation || 0)) as number;
      if (team && teamRep > playerRep) {
        // base refusal chance when player's rep is lower
        let refusalChance = 0.3;
        const effs = Array.isArray(state.player.effects) ? state.player.effects : [];
        const extra = effs.reduce((s: number, e: any) => s + (e.projectRejectChanceAdd || 0), 0);
        refusalChance = Math.min(1, refusalChance + extra);
        if (Math.random() < refusalChance) {
          // refused by team due to reputation
          // increment refusal count on team
          if (team) team.inviteRefusalCount = (team.inviteRefusalCount || 0) + 1;
          // close current event modal then show refusal popup
          clearRecentEvent && clearRecentEvent();
          showEventIfIdle && showEventIfIdle({ id: `team_refusal_${Date.now()}`, title: 'Отказ команды', text: `Команда ${team.name} отказала вам из-за недостаточной репутации.` });
        } else {
          joinTeam && joinTeam(String(effect.teamJoin));
          // reset refusal counter on successful join (teams stored in context)
          if (team) team.inviteRefusalCount = 0;
        }
      } else {
        joinTeam && joinTeam(String(effect.teamJoin));
        // reset refusal counter on successful join
        const t = teams.find((tt: any) => tt.id === String(effect.teamJoin));
        if (t) t.inviteRefusalCount = 0;
      }
    }

    // If player refuses a team invitation, track the refusal count
    if (effect && effect.teamRefusal && teams) {
      const refusedTeam = teams.find(t => t.id === effect.teamRefusal);
      if (refusedTeam) {
        const currentRefusalCount = (refusedTeam.inviteRefusalCount ?? 0) + 1;
        // Increment refusal count
        refusedTeam.inviteRefusalCount = currentRefusalCount;

        // After 2 refusals, team stops inviting the player
        // No auto-kick happens for refusing invitation to another team
      }
    }

    // If player accepts a team project via event, add it directly to active projects
    if (effect && effect.teamProjectJoin && addTeamProject) {
      try {
        addTeamProject(effect.teamProjectJoin);
      } catch (e) {
        // ignore
      }
    }

    // If player refuses a team project invite, increment team's projectRefusalCount and handle consequences
    if (effect && effect.teamProjectRefusal && teams) {
      const t = teams.find(tt => tt.id === effect.teamProjectRefusal);
      if (t) {
        const currentProjectRefusalCount = (t.projectRefusalCount || 0) + 1;
        t.projectRefusalCount = currentProjectRefusalCount;
        
        // Schedule next team project offer in 5-15 days
        const absDay = state.gameTime.year * 360 + state.gameTime.month * 30 + state.gameTime.day;
        const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        (t as any).nextTeamProjectOfferAbsDay = absDay + randInt(5, 15);

        // According to newtz.txt: after 2 refusals show warning, after 3rd refusal player gets kicked
        if (currentProjectRefusalCount === 2) {
          // Show warning about team being concerned about player's inactivity
          clearRecentEvent && clearRecentEvent();
          showEventIfIdle && showEventIfIdle({
            id: `team_project_warning_${Date.now()}`,
            title: 'Предупреждение команды',
            text: `Команда обеспокоена вашим отсутствием активности. Если вы откажетесь ещё раз, вы будете исключены.`
          });
          playSFX('notification.wav');
        } else if (currentProjectRefusalCount >= 3) {
          // Player gets kicked from team after 3 project refusals
          if (leaveTeam) {
            leaveTeam();
          } else {
            updatePlayer({ teamId: null });
          }
          clearRecentEvent && clearRecentEvent();
          showEventIfIdle && showEventIfIdle({
            id: `team_kick_${Date.now()}`,
            title: 'Исключение из команды',
            text: `Вас исключили из команды из-за постоянного отказа от участия в проектах.`
          });
          playSFX('error.wav');
        }
      }
    }

    // If effect asks to abandon a project, call abandonProject
    if (effect && effect.leave && abandonProject) {
      try {
        abandonProject(effect.leave);
      } catch (e) {
        // ignore
      }
    }

    clearRecentEvent && clearRecentEvent();
    playSFX('close.wav');
  };

  // handleChoice will be used inline in JSX when rendering choice buttons

  if (!recentEvent) return null;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'good': return '✨';
      case 'bad': return '⚠️';
      case 'info': return 'ℹ️';
      case 'choice': return '🤔';
      default: return '📢';
    }
  };

  // Determine if this is a festival event and which image to use
  const isFestivalEvent = (recentEvent as GameEvent).type === 'festival';
  let festivalImage = '';
  if (isFestivalEvent) {
    if ((recentEvent as GameEvent).title.includes('Победа')) {
      festivalImage = '/figma/victory.png';
    } else if ((recentEvent as GameEvent).title.includes('Фестиваль прошёл')) {
      festivalImage = '/figma/defeat.png';
    } else {
      festivalImage = '/figma/festival.png';
    }
  }

  // If festival event and video not completed yet, show video first
  if (showVideoFirst && !videoCompleted && isFestivalEvent) {
    const isWin = (recentEvent as GameEvent).title.includes('Победа');
    return (
      <FestivalVideoModal 
        onVideoEnd={() => setVideoCompleted(true)}
        isWin={isWin}
      />
    );
  }

  const hasEffects = !!(recentEvent.effect && (
    (recentEvent.effect.money !== undefined && recentEvent.effect.money !== 0) ||
    (recentEvent.effect.fSkill !== undefined && recentEvent.effect.fSkill !== 0) ||
    (recentEvent.effect.mSkill !== undefined && recentEvent.effect.mSkill !== 0) ||
    (recentEvent.effect.popularity !== undefined && recentEvent.effect.popularity !== 0) ||
    (recentEvent.effect.reputation !== undefined && recentEvent.effect.reputation !== 0) ||
    (recentEvent.effect.tired !== undefined && recentEvent.effect.tired !== 0)
  ));

  return (
    <div className="event-overlay">
      <div className={`event-modal event-${(recentEvent as GameEvent).type}`}>
        <div className={`event-header ${hasEffects ? 'has-effects' : ''}`}>
          {!isFestivalEvent && (
            <span className="event-icon">{getIconForType((recentEvent as GameEvent).type)}</span>
          )}
          <h3>{(recentEvent as GameEvent).title}</h3>
        </div>

        <div className="event-body">
          {/* If event references an NPC, show avatar and relationship */}
          {recentEvent && (recentEvent as any).npcId && (() => {
            const npc = (npcs || []).find((x: any) => x.id === (recentEvent as any).npcId);
            if (npc) {
              return (
                <div className="event-npc-row">
                  <img src={`/avatars/normalized/${npc.faceId || 'default.png'}`} alt={npc.name} className="event-npc-avatar" onError={(e) => { (e.currentTarget as any).style.display = 'none'; }} />
                  <div className="event-npc-meta">
                    <div className="event-npc-name">{npc.name}</div>
                    <div className={`event-npc-relationship rel-${npc.relationship || 'stranger'}`}>{npc.relationship || 'незнакомец'}</div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
          {isFestivalEvent && (
            <div className="festival-image-container">
              <img src={festivalImage} alt="Фестиваль" className="festival-image" onError={(e) => {
                e.currentTarget.style.display = 'none'; // Hide if image fails to load
              }} />
            </div>
          )}
          <p>{(recentEvent as GameEvent).text}</p>

          {isFestivalEvent && (recentEvent as GameEvent).festivalData && (() => {
            const f = (recentEvent as GameEvent).festivalData!;
            const hasCategories = !!f.hasCategories;
            const playerLevel = f.playerTeamLevel as string | undefined;
            // choose relevant teams: by level if categories exist and player's level is known
            let relevant = (teams || []).slice();
            if (hasCategories && playerLevel) {
              relevant = relevant.filter((t: any) => t.teamLevel === playerLevel);
            }
            // sort by teamRating desc, fallback to teamSkill
            relevant.sort((a: any, b: any) => (b.teamRating || b.teamSkill || 0) - (a.teamRating || a.teamSkill || 0));
            const top = relevant.slice(0, 3);
            const levelMap: any = { 'Новичок': 'Новичок', 'Мидл': 'Мидл', 'Топ': 'Топ' };
            const headerLabel = hasCategories && playerLevel ? `${levelMap[playerLevel] || playerLevel}` : null;

            return (
              <div className="festival-top-block">
                <h4 className="festival-top-title">Топ-3 команд{headerLabel ? ` — ${headerLabel}` : ''}</h4>
                {top.length === 0 ? (
                  <div className="festival-no-teams">Нет доступных команд для показа.</div>
                ) : (
                  <ol className="festival-top-list">
                    {top.map((t: any, idx: number) => (
                      <li key={t.id} className="festival-top-item">
                        <span className="festival-rank">#{idx + 1}</span>
                        <span className="festival-teamname">{t.name}</span>
                        <span className="festival-teamstat"> — Рейтинг: {Math.round(t.teamRating || t.teamSkill || 0)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })()}

          {hasEffects && (
            <div className="event-effects">
              {(recentEvent.effect.money !== undefined && recentEvent.effect.money !== 0) && (
                <div className={(recentEvent.effect.money || 0) > 0 ? 'effect-positive' : 'effect-negative'}>
                  <MoneyIcon size={18} className="icon-inline" />{(recentEvent.effect.money || 0) > 0 ? '+' : ''}{recentEvent.effect.money || 0}₽
                </div>
              )}
              {(recentEvent.effect.fSkill !== undefined && recentEvent.effect.fSkill !== 0) && (
                <div className={(recentEvent.effect.fSkill || 0) > 0 ? 'effect-positive' : 'effect-negative'}>
                  <FemaleStyleIcon size={18} className="icon-inline" />{(recentEvent.effect.fSkill || 0) > 0 ? '+' : ''}{recentEvent.effect.fSkill || 0}
                </div>
              )}
              {(recentEvent.effect.mSkill !== undefined && recentEvent.effect.mSkill !== 0) && (
                <div className={(recentEvent.effect.mSkill || 0) > 0 ? 'effect-positive' : 'effect-negative'}>
                  <MaleStyleIcon size={18} className="icon-inline" />{(recentEvent.effect.mSkill || 0) > 0 ? '+' : ''}{recentEvent.effect.mSkill || 0}
                </div>
              )}
              {(recentEvent.effect.popularity !== undefined && recentEvent.effect.popularity !== 0) && (
                <div className={(recentEvent.effect.popularity || 0) > 0 ? 'effect-positive' : 'effect-negative'}>
                  <PopularityIcon size={18} className="icon-inline" />{(recentEvent.effect.popularity || 0) > 0 ? '+' : ''}{recentEvent.effect.popularity || 0}
                </div>
              )}
              {(recentEvent.effect.reputation !== undefined && recentEvent.effect.reputation !== 0) && (
                <div className={(recentEvent.effect.reputation || 0) > 0 ? 'effect-positive' : 'effect-negative'}>
                  <ReputationIcon size={18} className="icon-inline" />{(recentEvent.effect.reputation || 0) > 0 ? '+' : ''}{recentEvent.effect.reputation || 0}
                </div>
              )}
              {(recentEvent.effect.tired !== undefined && recentEvent.effect.tired !== 0) && (
                <div className={(recentEvent.effect.tired || 0) < 0 ? 'effect-positive' : 'effect-negative'}>
                  <FatigueIcon size={18} className="icon-inline" />{(recentEvent.effect.tired || 0) > 0 ? '+' : ''}{recentEvent.effect.tired || 0}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="event-footer">
          {(recentEvent as GameEvent).type === 'choice' && (recentEvent as GameEvent).choices ? (
            (() => {
              const choices = (recentEvent as GameEvent).choices || [];
                if (choices.length === 2) {
                return (
                  <>
                    <button className="btn-event-close" onClick={() => { applyEffectAndClose(choices[1].effect || {}); }}>
                      {choices[1].text}
                    </button>
                    <button className="btn-event-close" onClick={() => { applyEffectAndClose(choices[0].effect || {}); }}>
                      {choices[0].text}
                    </button>
                  </>
                );
              }
              return choices.map((c, i) => (
                <button key={i} className="btn-event-close" onClick={() => { applyEffectAndClose(c.effect || {}); }}>
                  {c.text}
                </button>
              ));
            })()
          ) : (
            <button className="btn-event-close" onClick={() => { applyEffectAndClose((recentEvent as GameEvent).effect || {}); }}>
              ОК
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventModal;
