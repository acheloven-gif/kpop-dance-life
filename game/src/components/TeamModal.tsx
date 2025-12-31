import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Crown } from 'lucide-react';
import './TeamModal.css';
import NPCProfile from './NPCProfile';

interface TeamModalProps {
  team: import('../types/game').Team;
  onClose: () => void;
  showApplyButton?: boolean;
}

const TeamModal: React.FC<TeamModalProps> = ({ team, onClose, showApplyButton = false }) => {
  const { npcs, sendTeamApplication, queuedApplications, state, hasPendingApplication, setModalPause } = useGame();
  const [sendingTeamId, setSendingTeamId] = React.useState<string | null>(null);
  const [selectedNpcId, setSelectedNpcId] = React.useState<string | null>(null);

  // Pause game when team modal is shown (always paused when component is mounted)
  useEffect(() => {
    if (setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [setModalPause]);

  const getNpcAvatarPath = (npc: any) => {
    return `/avatars/normalized/${npc.faceId || 'default.svg'}`;
  };

  const members = team.memberIds.map(id => npcs.find(n => n.id === id)).filter(Boolean) as any[];
  const avgDominant = members.length > 0 ? Math.round(members.reduce((s, m) => s + Math.max(m.fSkill || 0, m.mSkill || 0), 0) / members.length) : 0;
  
  let dominantStyleLabel = 'Универсалы';
  let dominantStyleClass = 'both';
  const memberDominants = members.map(m => (m.fSkill || 0) > (m.mSkill || 0) ? 'F' : (m.mSkill || 0) > (m.fSkill || 0) ? 'M' : 'B');
  const fCount = memberDominants.filter(x => x === 'F').length;
  const mCount = memberDominants.filter(x => x === 'M').length;
  if (fCount > mCount) {
    dominantStyleLabel = 'Женский';
    dominantStyleClass = 'female';
  } else if (mCount > fCount) {
    dominantStyleLabel = 'Мужской';
    dominantStyleClass = 'male';
  }

  const handleApply = () => {
    setSendingTeamId(team.id);
    try {
      sendTeamApplication && sendTeamApplication(team.id);
    } catch (e) {
      // ignore
    }
    setTimeout(() => {
      setSendingTeamId(null);
      onClose();
    }, 600);
  };

  // Check if player is member or has applied
  const playerId = state?.player?.id;
  const isMember = team.memberIds.includes(playerId);
  const isApplied = queuedApplications ? queuedApplications.some(q => q.teamId === team.id) : false;
  const hasPending = hasPendingApplication && hasPendingApplication();
  const playerTeamId = state?.player?.teamId;
  const isInOtherTeam = playerTeamId && playerTeamId !== team.id;
  
  // Calculate skill risk
  const playerAvgSkill = Math.round(((state?.player?.fSkill || 0) + (state?.player?.mSkill || 0)) / 2);
  const teamSkill = (team as any).avgDominant ?? (team as any).teamSkill ?? 50;
  const skillDiff = teamSkill - playerAvgSkill;
  const hasSkillRisk = skillDiff > 18;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{margin: 0}}>Состав команды: {team.name}</h3>
            <span className={`team-style-tag ${dominantStyleClass}`}>
              {dominantStyleLabel}
            </span>
          </div>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="team-average">
            <div style={{ marginBottom: 8, fontSize: '0.95em', color: '#fff' }}>
              Средний уровень скилла: <span style={{fontWeight: 700, color: '#ff69b4'}}>
                {avgDominant <= 30 ? 'Новичок' : avgDominant <= 70 ? 'Мидл' : 'Топ'}
              </span>
            </div>
          </div>
          <div className="team-roster">
            {team.memberIds.map(id => {
              const member = npcs.find(n => n.id === id);
              const isLeader = team.leaderId === id;
              if (!member) return <div key={id} className="member-missing">{id}</div>;
              return (
                <div key={id} className={`team-member-card ${isLeader ? 'is-leader' : ''}`} style={{cursor: 'pointer'}} onClick={() => setSelectedNpcId(id)}>
                  <div className="avatar-wrap">
                    <img src={`/avatars/normalized/${member.faceId}`} alt={member.name} onError={(e: any) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src.includes('/avatars/normalized/')) img.src = `/avatars/${member.faceId}`;
                      else img.src = `/avatars/normalized/default.svg`;
                    }} />
                    {isLeader && <Crown className="leader-crown" size={14} strokeWidth={2} color={"#FFD700"} />}
                  </div>
                  <div className="member-info">
                    <div className="member-name-with-badge">
                      <span>{member.name}</span>
                      {isLeader && <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '9px' }}>Лидер</span>}
                    </div>
                    <div className="member-skills">
                      {`Ж: ${member.fSkill !== undefined ? (member.fSkill <= 30 ? 'Новичок' : member.fSkill <= 70 ? 'Мидл' : 'Топ') : '—'} `}
                      {`М: ${member.mSkill !== undefined ? (member.mSkill <= 30 ? 'Новичок' : member.mSkill <= 70 ? 'Мидл' : 'Топ') : '—'}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-actions">
              {/* OK button removed — actions moved to contextual controls below */}
          {showApplyButton && (
            <>
              {isMember && (
                <div style={{ paddingLeft: 12, color: '#666' }}>Вы уже в этой команде</div>
              )}
              {isInOtherTeam && (
                <div style={{ paddingLeft: 12, color: '#666' }}>Вы уже в команде — выйдите из текущей команды, чтобы отправить заявку в другую</div>
              )}
              {!isMember && isApplied && (
                <button className="btn-apply disabled" disabled>Заявка в обработке</button>
              )}
              {!isMember && !isApplied && hasPending && !isInOtherTeam && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: '#666', fontSize: 13 }}>Дождитесь результатов предыдущей заявки</div>
                  <button className="btn-apply disabled" disabled style={{ background: '#ccc', color: '#666', borderColor: '#bbb' }}>Отправить заявку</button>
                </div>
              )}
              {!isMember && !isApplied && !hasPending && !isInOtherTeam && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                  {hasSkillRisk && (
                    <div style={{ 
                      backgroundColor: 'rgba(255, 107, 107, 0.15)',
                      border: '1px solid rgba(255, 107, 107, 0.4)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{color: '#ff6b6b', fontSize: '16px'}}>⚠️</span>
                      <div>
                        <div style={{ color: '#ff6b6b', fontWeight: 600, fontSize: 12 }}>
                          Команда может отказать
                        </div>
                        <div style={{ color: '#bbb', fontSize: 11, marginTop: '2px' }}>
                          Ваш уровень значительно ниже среднего по команде
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    className={`btn-apply ${sendingTeamId === team.id ? 'sending' : ''}`}
                    onClick={handleApply}
                  >
                    Отправить заявку
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {selectedNpcId && <NPCProfile npcId={selectedNpcId} onClose={() => setSelectedNpcId(null)} />}
    </div>
  );
};

export default TeamModal;
