import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import playSFX from '../utils/sfx';
import TeamModal from './TeamModal';
import './TeamBlock.css';

const TeamBlock: React.FC = () => {
  const { state, npcs, teams, setModalPause, leaveTeam } = useGame();
  const [selectedTeam, setSelectedTeam] = React.useState<import('../types/game').Team | null>(null);
  const { player } = state;

  // Pause/resume game when team modal opens/closes
  useEffect(() => {
    if (selectedTeam && setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [selectedTeam, setModalPause]);

  const openTeamModal = (t: import('../types/game').Team) => {
    playSFX('click.wav');
    setSelectedTeam(t);
  };

  const closeTeamModalInternal = () => {
    playSFX('click.wav');
    setSelectedTeam(null);
  };

  if (!player.teamId) {
    return (
      <div className="team-block">
        <h3>Ваша команда</h3>
        <div className="team-empty">Сейчас Вы не в команде</div>
      </div>
    );
  }

  const team = teams.find((t) => t.id === player.teamId);
  if (!team) {
    return (
      <div className="team-block">
        <h3>Ваша команда</h3>
        <div className="team-empty">Команда не найдена</div>
      </div>
    );
  }

  const teamMembers = team.memberIds
    .map((npcId: string) => npcs.find((npc) => npc.id === npcId))
    .filter((m) => m !== undefined);

  // Расчет среднего доминирующего навыка команды и рейтинга
  const memberDominants = teamMembers.map((m: any) => ({ val: Math.max(m.fSkill || 0, m.mSkill || 0), style: (m.fSkill || 0) > (m.mSkill || 0) ? 'F_style' : (m.mSkill || 0) > (m.fSkill || 0) ? 'M_style' : 'Both' }));
  const teamAvgDominant = teamMembers.length > 0 ? Math.round(memberDominants.reduce((s: number, md: any) => s + md.val, 0) / memberDominants.length) : 0;
  const teamPopularity = teamMembers.length > 0
    ? teamMembers.reduce((sum: number, npc: any) => sum + npc.popularity, 0) / teamMembers.length
    : 0;
  const teamSkill = teamAvgDominant;
  const teamRating = Math.round(teamSkill * 0.7 + teamPopularity * 0.3);

  const getTeamLevel = (skill: number) => {
    if (skill <= 300) return 'Новичок';
    if (skill <= 700) return 'Мидл';
    return 'Топ';
  };

  // Получить путь к аватару для NPC
  const getNpcAvatarPath = (npc: any) => {
    // Используем faceId из папки avatars/normalized
    return `/avatars/normalized/${npc.faceId || 'default.svg'}`;
  };

  return (
    <>
      <div className="team-block">
        <div className="team-header-row">
          <h3>Ваша команда</h3>
          <button className="btn-leave-team-header" onClick={(e) => { e.stopPropagation(); playSFX('click.wav'); leaveTeam?.(); }}>✕ Уйти</button>
        </div>
        <div className="team-card-compact">
          <img src={`/teamicons/${team.iconFile}`} alt={team.name} className="team-icon" />
          <div className="team-card-content">
            <p className="team-name">{team.name}</p>
            <p className="team-rating">Рейтинг: {Math.round(teamRating)} ({getTeamLevel(teamSkill)})</p>
            <p className="team-style">
              {(() => {
                const styleLabel = team.dominantStyle === 'F_style' ? 'Женский' : team.dominantStyle === 'M_style' ? 'Мужской' : 'Универсалы';
                const cls = team.dominantStyle === 'F_style' ? 'team-style-tag female' : team.dominantStyle === 'M_style' ? 'team-style-tag male' : 'team-style-tag both';
                return <span className={cls}>{styleLabel}</span>;
              })()}
            </p>
          </div>
          <button className="btn-roster" onClick={() => openTeamModal(team)}>Состав</button>
        </div>
      </div>

      {selectedTeam && (
        <TeamModal team={selectedTeam} onClose={closeTeamModalInternal} />
      )}
    </>
  );
};

export default TeamBlock;
