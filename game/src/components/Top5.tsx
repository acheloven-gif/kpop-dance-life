import React from 'react';
import InfoTooltip from './InfoTooltip';
import { useGame } from '../context/GameContext';
import { NPCRatingCalculator } from '../utils/ratings';
import TeamModal from './TeamModal';
import NPCProfile from './NPCProfile';
import './Top5.css';

// relationship text will be shown directly



const Top5: React.FC = () => {
  const { npcs, teams, state, sendTeamApplication } = useGame();

  // Recompute weekly (depend on week/month/year) so Top-3 changes only once per week
  const top5NPCs = React.useMemo(() => NPCRatingCalculator.getTop5(npcs).slice(0, 3), [npcs, state.gameTime.year, state.gameTime.month, state.gameTime.week]);
  const top5Teams = React.useMemo(() => teams.slice().sort((a, b) => b.teamRating - a.teamRating).slice(0, 3), [teams, state.gameTime.year, state.gameTime.month, state.gameTime.week]);
  const [selectedTeam, setSelectedTeam] = React.useState<import('../types/game').Team | null>(null);
  const [selectedNpc, setSelectedNpc] = React.useState<string | null>(null);
  const closeTeamModal = () => setSelectedTeam(null);
  const closeNpcModal = () => setSelectedNpc(null);

  return (
    <>
      <div className="top-5-section">
        <div className="top-5-header">
          <h3>
            ТОП-3 каверденсеров месяца
            <InfoTooltip placement="bottom" text="Рейтинг — это результат вашего мастерства, популярности и признания. Чем больше опыта и славы, тем выше вы поднимаетесь в рейтинге!">
              <span className="info-icon">i</span>
            </InfoTooltip>
          </h3>
        </div>
        <div className="top-5-list">
          {top5NPCs.map((npc, idx) => {
            const topTag = npc.fSkill >= npc.mSkill ? 'Женский' : 'Мужской';
            const topValue = Math.max(npc.fSkill, npc.mSkill);
            const getSkillLevel = (skill: number) => {
              if (skill <= 30) return 'Новичок';
              if (skill <= 70) return 'Мидл';
              return 'Топ';
            };
            const topQuality = npc.fSkill >= npc.mSkill ? getSkillLevel(npc.fSkill) : getSkillLevel(npc.mSkill);
            const team = teams.find(t => t.id === npc.teamId) || null;
            const teamName = team?.name || '-';
            const medalClass = idx === 0 ? 'medal-gold' : idx === 1 ? 'medal-silver' : idx === 2 ? 'medal-bronze' : '';
            const isLeader = team ? team.leaderId === npc.id : false;
            return (
              <div key={npc.id} className="top-5-item" style={{cursor: 'pointer'}} onClick={() => setSelectedNpc(npc.id)}>
                <div className="item-rank">#{idx + 1}</div>
                <img
                  src={`/avatars/normalized/${npc.faceId}`}
                  onError={(e: any) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (!img.src.includes('default.svg')) {
                      img.src = `/avatars/normalized/default.svg`;
                    }
                  }}
                  alt={npc.name}
                  className={`item-avatar ${medalClass}`}
                  style={{cursor: 'pointer'}}
                />
                <div className="item-info">
                  <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                    <div className="item-name" style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <span>{npc.name}</span>
                      <span className={`relationship-inline rel-${npc.relationship || 'stranger'}`}>
                        {(npc.relationship === 'friend' && 'друзья') || (npc.relationship === 'acquaintance' && 'знакомы') || 'не знакомы'}
                      </span>
                    </div>
                    <div className="item-team">{isLeader ? 'Лидер ' + teamName : teamName}</div>
                  </div>
                  <div className="item-stats">
                    <span>Топ навык: ({topTag}) - {topQuality}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="top-5-section">
        <div className="top-5-header">
          <h3>
            ТОП-3 Команд месяца
            <InfoTooltip text="Командный рейтинг растёт, когда вы собираете сильных партнёров с хорошими навыками и известностью.">
              <span className="info-icon">i</span>
            </InfoTooltip>
          </h3>
        </div>
        <div className="top-5-list">
          {top5Teams.map((team, idx) => (
            <div key={team.id} className="top-5-item" style={{cursor: 'pointer'}} onClick={() => setSelectedTeam(team)}>
              <div className="item-rank">#{idx + 1}</div>
              <img src={`/teamicons/${team.iconFile}`} alt={team.name} className={`item-avatar ${idx === 0 ? 'medal-gold' : idx === 1 ? 'medal-silver' : idx === 2 ? 'medal-bronze' : ''}`} />
              <div className="item-info">
                <div className="item-name">{team.name}</div>
                <div className="item-stats">
                  <span>Уровень: {team.teamLevel}</span>
                  {(() => {
                    const styleLabel = team.dominantStyle === 'F_style' ? 'Женский' : team.dominantStyle === 'M_style' ? 'Мужской' : 'Универсалы';
                    const cls = team.dominantStyle === 'F_style' ? 'team-style-tag female' : team.dominantStyle === 'M_style' ? 'team-style-tag male' : 'team-style-tag both';
                    return <span className={cls}>{styleLabel}</span>;
                  })()}
                </div>
              </div>
            </div>
          ))}

          {selectedTeam && <TeamModal team={selectedTeam} onClose={() => setSelectedTeam(null)} showApplyButton={true} />}

          {/* Team modal moved to RatingsTab - Top5 shows compact list only */}
        </div>
      </div>
      
      {selectedNpc && <NPCProfile npcId={selectedNpc} onClose={closeNpcModal} />}
    </>
  );
};

export default Top5;