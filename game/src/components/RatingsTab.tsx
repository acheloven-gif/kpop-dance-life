import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { NPCRatingCalculator } from '../utils/ratings';
import './RatingsTab.css';
import { getReputationColor } from '../utils/statusHelpers';
import TeamModal from './TeamModal';
import StatusBadges from './StatusBadges';
import NPCProfile from './NPCProfile';

const RatingsTab: React.FC = () => {
  const { npcs, teams, sendTeamApplication, queuedApplications, state } = useGame();
  const [ratingTab, setRatingTab] = useState<'npc' | 'teams'>('npc');
  const [npcSortBy, setNpcSortBy] = useState<'rating' | 'name' | 'team' | 'fSkill' | 'mSkill' | 'popularity' | 'reputation' | 'rank'>('rating');
  const [npcSortAsc, setNpcSortAsc] = useState(false);
  const [teamSortBy, setTeamSortBy] = useState<'rating' | 'name' | 'level' | 'style' | 'members' | 'skill' | 'rank' | 'leader'>('rating');
  const [teamSortAsc, setTeamSortAsc] = useState(false);
  const [selectedNpc, setSelectedNpc] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);

  const closeNpcModal = () => setSelectedNpc(null);
  const closeTeamModal = () => setSelectedTeam(null);

  const sortNPCs = (sortBy: typeof npcSortBy) => {
    if (npcSortBy === sortBy) {
      setNpcSortAsc(!npcSortAsc);
    } else {
      setNpcSortBy(sortBy);
      setNpcSortAsc(false);
    }
  };

  const sortTeams = (sortBy: typeof teamSortBy) => {
    if (teamSortBy === sortBy) {
      setTeamSortAsc(!teamSortAsc);
    } else {
      setTeamSortBy(sortBy);
      setTeamSortAsc(false);
    }
  };

  const sortedNPCs = [...npcs]
    // Filter out inactive NPCs (those who left coVerdance)
    .filter(npc => npc.activeStatus !== false)
    .sort((a, b) => {
    let aVal: any, bVal: any;
    let aIdx = npcs.indexOf(a);
    let bIdx = npcs.indexOf(b);
    
    switch (npcSortBy) {
      case 'rank':
        aVal = aIdx;
        bVal = bIdx;
        break;
      case 'name':
        aVal = a.name;
        bVal = b.name;
        break;
      case 'team':
        aVal = (teams.find(t => t.id === a.teamId)?.name || '');
        bVal = (teams.find(t => t.id === b.teamId)?.name || '');
        break;
      case 'fSkill':
        aVal = a.fSkill;
        bVal = b.fSkill;
        break;
      case 'mSkill':
        aVal = a.mSkill;
        bVal = b.mSkill;
        break;
      case 'popularity':
        aVal = a.popularity;
        bVal = b.popularity;
        break;
      case 'reputation':
        aVal = a.reputation;
        bVal = b.reputation;
        break;
      case 'rating':
      default:
        aVal = NPCRatingCalculator.calculateRating(a);
        bVal = NPCRatingCalculator.calculateRating(b);
    }
    const result = typeof aVal === 'string' ? aVal.localeCompare(bVal) : bVal - aVal;
    return npcSortAsc ? -result : result;
  });

  const sortedTeams = [...teams]
    // Filter out teams with no active members (all members left coVerdance)
    .filter(team => {
      if (team.memberIds.length === 0) return false;
      const hasAtLeastOneActiveMember = team.memberIds.some(memberId => {
        const member = npcs.find(n => n.id === memberId);
        return member && member.activeStatus !== false;
      });
      return hasAtLeastOneActiveMember;
    })
    .sort((a, b) => {
    let aVal: any, bVal: any;
    let aIdx = teams.indexOf(a);
    let bIdx = teams.indexOf(b);
    
    switch (teamSortBy) {
      case 'rank':
        aVal = aIdx;
        bVal = bIdx;
        break;
      case 'name':
        aVal = a.name;
        bVal = b.name;
        break;
      case 'level':
        aVal = a.teamLevel;
        bVal = b.teamLevel;
        break;
      case 'style':
        const getStyle = (team: any) => {
          if (team.dominantStyle === 'F_style') return 'F';
          if (team.dominantStyle === 'M_style') return 'M';
          return 'B';
        };
        aVal = getStyle(a);
        bVal = getStyle(b);
        break;
      case 'members':
        aVal = a.memberIds.length;
        bVal = b.memberIds.length;
        break;
      case 'skill':
        aVal = (a as any).teamSkill || 0;
        bVal = (b as any).teamSkill || 0;
        break;
      case 'leader':
        const getLeaderName = (team: any) => {
          const leader = npcs.find(n => n.id === team.leaderId);
          return leader ? leader.name : '';
        };
        aVal = getLeaderName(a);
        bVal = getLeaderName(b);
        break;
      case 'rating':
      default:
        aVal = a.teamRating || 0;
        bVal = b.teamRating || 0;
    }
    const result = typeof aVal === 'string' ? aVal.localeCompare(bVal) : bVal - aVal;
    return teamSortAsc ? -result : result;
  });

  return (
    <div className="ratings-container">
      <div className="rating-tabs">
        <button
          className={`rating-tab-btn ${ratingTab === 'npc' ? 'active' : ''}`}
          onClick={() => setRatingTab('npc')}
        >
          Рейтинг каверденсеров ({sortedNPCs.length})
        </button>
        <button
          className={`rating-tab-btn ${ratingTab === 'teams' ? 'active' : ''}`}
          onClick={() => setRatingTab('teams')}
        >
          Рейтинг команд ({sortedTeams.length})
        </button>
      </div>

      {ratingTab === 'npc' && (
        <div className="ratings-list">
          <div className="rating-header">
            <div className="col-rank sortable" onClick={() => sortNPCs('rank')}>Место <span className="sort-icon">{npcSortBy === 'rank' ? (npcSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-avatar">Аватар</div>
            <div className="col-name sortable" onClick={() => sortNPCs('name')}>Имя <span className="sort-icon">{npcSortBy === 'name' ? (npcSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-leader">Лидер</div>
            <div className="col-team sortable" onClick={() => sortNPCs('team')}>Команда <span className="sort-icon">{npcSortBy === 'team' ? (npcSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-rating sortable" onClick={() => sortNPCs('rating')}>Рейтинг <span className="sort-icon">{npcSortBy === 'rating' ? (npcSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-fskill sortable" onClick={() => sortNPCs('fSkill')}>Ж.стиль <span className="sort-icon">{npcSortBy === 'fSkill' ? (npcSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-mskill sortable" onClick={() => sortNPCs('mSkill')}>М.стиль <span className="sort-icon">{npcSortBy === 'mSkill' ? (npcSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-reputation sortable" onClick={() => sortNPCs('reputation')}>Репутация <span className="sort-icon">{npcSortBy === 'reputation' ? (npcSortAsc ? '▲' : '▼') : '▲'}</span></div>
          </div>
          {sortedNPCs.map((npc) => {
            const rating = Math.round(NPCRatingCalculator.calculateRating(npc));
            const team = teams.find(t => t.id === npc.teamId);
            const isLeader = team && team.leaderId === npc.id;
            
            // Calculate actual rank based on rating across active NPCs only
            const allNpcsByRating = [...npcs]
              .filter(n => n.activeStatus !== false)
              .sort((a, b) => 
                NPCRatingCalculator.calculateRating(b) - NPCRatingCalculator.calculateRating(a)
              );
            const actualRank = allNpcsByRating.findIndex(n => n.id === npc.id) + 1;
            
            const medalClass = actualRank === 1 ? 'medal-gold' : actualRank === 2 ? 'medal-silver' : actualRank === 3 ? 'medal-bronze' : '';
            const repColor = getReputationColor(npc.reputation || 0);
            return (
              <div key={npc.id} className="rating-row" style={{cursor: 'pointer'}} onClick={() => setSelectedNpc(npc.id)}>
                <div className="col-rank">#{actualRank}</div>
                <div className="col-avatar">
                  <div className="avatar-wrap">
                    <img src={`/avatars/normalized/${npc.faceId}`} alt={npc.name} className={medalClass} onError={(e: any) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.src.includes('/avatars/normalized/')) img.src = `/avatars/${npc.faceId}`;
                      else img.src = `/avatars/normalized/default.svg`;
                    }} />
                    {isLeader && (() => {
                      const crownColor = medalClass === 'medal-gold' ? '#ffd700' : medalClass === 'medal-silver' ? '#c0c0c0' : medalClass === 'medal-bronze' ? '#cd7f32' : '#ff69b4';
                      return <Crown className="leader-crown" size={14} strokeWidth={2} color={crownColor} />;
                    })()}
                  </div>
                </div>
                <div className="col-name">{npc.name}</div>
                <div className="col-leader">{isLeader ? 'Лидер' : '-'}</div>
                <div className="col-team">{team?.name || '-'}</div>
                <div className="col-rating">{rating}</div>
                <div className="col-fskill">{npc.fSkill}</div>
                <div className="col-mskill">{npc.mSkill}</div>
                <div className="col-reputation" style={{color: repColor.color}}>{repColor.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {ratingTab === 'teams' && (
        <div className="ratings-list">
          <div className="rating-header">
            <div className="col-rank sortable" onClick={() => sortTeams('rank')}>Место <span className="sort-icon">{teamSortBy === 'rank' ? (teamSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-avatar">Иконка</div>
            <div className="col-name sortable" onClick={() => sortTeams('name')}>Название <span className="sort-icon">{teamSortBy === 'name' ? (teamSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-leader sortable" onClick={() => sortTeams('leader')}>Лидер <span className="sort-icon">{teamSortBy === 'leader' ? (teamSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-team sortable" onClick={() => sortTeams('level')}>Уровень <span className="sort-icon">{teamSortBy === 'level' ? (teamSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-style sortable" onClick={() => sortTeams('style')}>Стиль <span className="sort-icon">{teamSortBy === 'style' ? (teamSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-rating sortable" onClick={() => sortTeams('rating')}>Рейтинг <span className="sort-icon">{teamSortBy === 'rating' ? (teamSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-members sortable" onClick={() => sortTeams('members')}>Участников <span className="sort-icon">{teamSortBy === 'members' ? (teamSortAsc ? '▲' : '▼') : '▲'}</span></div>
            <div className="col-skill sortable" onClick={() => sortTeams('skill')}>Ср. навык <span className="sort-icon">{teamSortBy === 'skill' ? (teamSortAsc ? '▲' : '▼') : '▲'}</span></div>
          </div>
          {sortedTeams.map((team) => {
            // Calculate actual rank based on rating across all teams
            const allTeamsByRating = [...teams].sort((a, b) => b.teamRating - a.teamRating);
            const actualRank = allTeamsByRating.findIndex(t => t.id === team.id) + 1;
            
            const leaderNpc = npcs.find(n => n.id === team.leaderId);
            const medalClass = actualRank === 1 ? 'medal-gold' : actualRank === 2 ? 'medal-silver' : actualRank === 3 ? 'medal-bronze' : '';
            
            return (
              <div key={team.id} className="rating-row" style={{cursor: 'pointer'}} onClick={() => setSelectedTeam(team)}>
                <div className="col-rank">#{actualRank}</div>
                <div className="col-avatar">
                  <img src={`/teamicons/${team.iconFile}`} alt={team.name} className={medalClass} />
                </div>
                <div className="col-name">
                  {team.name}
                </div>
                <div className="col-leader">{leaderNpc?.name || '-'}</div>
                <div className="col-team">{team.teamLevel}</div>
                <div className="col-style">{(() => {
                    const styleLabel = team.dominantStyle === 'F_style' ? 'Женский' : team.dominantStyle === 'M_style' ? 'Мужской' : 'Универсалы';
                    const cls = team.dominantStyle === 'F_style' ? 'team-style-tag female' : team.dominantStyle === 'M_style' ? 'team-style-tag male' : 'team-style-tag both';
                    return <span className={cls}>{styleLabel}</span>;
                })()}</div>
                <div className="col-rating">#{actualRank}</div>
                <div className="col-members">{team.memberIds.length}</div>
                <div className="col-skill">{team.teamSkill}</div>
              </div>
            );
          })}
        </div>
      )}

      {selectedNpc && <NPCProfile npcId={selectedNpc} onClose={closeNpcModal} />}
      {selectedTeam && <TeamModal team={selectedTeam} onClose={closeTeamModal} />}
    </div>
  );
};

export default RatingsTab;
