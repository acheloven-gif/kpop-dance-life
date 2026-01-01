import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import playSFX from '../utils/sfx';
import './GameEndScreen.css';

interface EndScreenStats {
  totalProjects: number;
  successfulProjects: number;
  firstProject: any;
  lastProject: any;
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
  teamsJoined: number;
  firstTeam: any;
  longestTeam: any;
  festivalWins: number;
  npcsMet: number;
  npcsFriends: number;
  totalNPCs: number;
  closestNPCs: Array<{ id: string; name: string; relationship: string; avatar?: string }>;
}

const GameEndScreen: React.FC = () => {
  const { state, completedProjects, npcs, teams, resumeGame } = useGame();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [stats, setStats] = useState<EndScreenStats | null>(null);

  React.useEffect(() => {
    if (stats === null) {
      // Calculate stats on mount
      calculateStats();
    }
  }, []);

  const calculateStats = () => {
    const completedList = completedProjects || [];
    const successCount = completedList.filter((p: any) => p.success).length;
    const firstProj = completedList.length > 0 ? completedList[0] : null;
    const lastProj = completedList.length > 0 ? completedList[completedList.length - 1] : null;

    // Calculate expenses
    let totalExp = 0;
    const expByCategory: Record<string, number> = {};
    if ((state.player as any).expenses) {
      (state.player as any).expenses.forEach((exp: any) => {
        totalExp += exp.amount || 0;
        expByCategory[exp.category] = (expByCategory[exp.category] || 0) + (exp.amount || 0);
      });
    }

    // Get most expensive category
    const mostExpensiveCategory = Object.entries(expByCategory).sort((a, b) => b[1] - a[1])[0];

    // Calculate team stats
    const teamJoinHistory = (state.player as any).teamJoinHistory || [];
    const uniqueTeams = new Set(teamJoinHistory);
    const firstTeamId = teamJoinHistory.length > 0 ? teamJoinHistory[0] : null;
    const firstTeamObj = firstTeamId ? teams.find(t => t.id === firstTeamId) : null;

    // Find longest team - team with most appearances in join history
    let longestTeamObj = null;
    if (teamJoinHistory.length > 0) {
      // Count occurrences of each team in history
      const teamCounts: Record<string, number> = {};
      teamJoinHistory.forEach((teamId: string) => {
        teamCounts[teamId] = (teamCounts[teamId] || 0) + 1;
      });
      
      // Find team with most occurrences
      const longestTeamId = Object.entries(teamCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      longestTeamObj = longestTeamId ? teams.find(t => t.id === longestTeamId) : null;
    }

    // Festival wins
    const festivalWinCount = (state.player as any).festivalWins || 0;

    // NPC stats - get closest NPCs sorted by relationship
    const relationshipOrder = { 'friend': 0, 'acquaintance': 1, 'stranger': 2 };
    const closestNPCsList = npcs
      .filter(n => n.relationship !== 'stranger')
      .sort((a, b) => (relationshipOrder[a.relationship as keyof typeof relationshipOrder] || 999) - (relationshipOrder[b.relationship as keyof typeof relationshipOrder] || 999))
      .slice(0, 5);
    
    const metNPCs = npcs.filter(n => n.relationship !== 'stranger').length;
    const friendNPCs = npcs.filter(n => n.relationship === 'friend').length;

    setStats({
      totalProjects: completedList.length,
      successfulProjects: successCount,
      firstProject: firstProj,
      lastProject: lastProj,
      totalExpenses: totalExp,
      expensesByCategory: expByCategory,
      teamsJoined: uniqueTeams.size,
      firstTeam: firstTeamObj,
      longestTeam: longestTeamObj,
      festivalWins: festivalWinCount,
      npcsMet: metNPCs,
      npcsFriends: friendNPCs,
      totalNPCs: npcs.length,
      closestNPCs: closestNPCsList.map(n => ({
        id: n.id,
        name: n.name,
        relationship: n.relationship || 'stranger',
      })),
    });

    playSFX('notification.wav');
  };

  const handleNext = () => {
    playSFX('click.wav');
    if (currentScreen < 6) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handlePrev = () => {
    playSFX('click.wav');
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const handleRestart = () => {
    playSFX('click.wav');
    // Trigger new game
    localStorage.removeItem('gameState');
    localStorage.removeItem('completedProjects');
    localStorage.removeItem('activeProjects');
    window.location.reload();
  };

  const handleContinue = () => {
    playSFX('click.wav');
    // Resume game without losing progress
    if (resumeGame) {
      resumeGame();
    }
  };

  if (!stats) {
    return <div className="game-end-loading">Подготовка статистики...</div>;
  }

  const screens = [
    // Screen 0: Intro
    <div key="screen-0" className="end-screen-content intro-screen">
      <div className="end-screen-title">Ваш карьерный путь завершен!</div>
      <div className="end-screen-subtitle">5 лет в K-pop индустрии</div>
      <p className="end-screen-text">
        Вы прошли невероятное путешествие. От начинающего исполнителя до признанной звезды.
        За пять лет вы многого достигли и создали незабываемые воспоминания.
      </p>
      <p className="end-screen-text">
        Давайте взглянем на то, чего вы добились...
      </p>
      <div className="end-screen-stats-preview">
        <div className="stat-item">
          <div className="stat-label">Завершённых проектов</div>
          <div className="stat-value">{stats.totalProjects}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Успешных</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>{stats.successfulProjects}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Популярность</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{state.player.popularity || 0}</div>
        </div>
      </div>
    </div>,

    // Screen 1: Project Statistics
    <div key="screen-1" className="end-screen-content projects-screen">
      <div className="end-screen-title">Ваши проекты</div>
      <p className="end-screen-text">
        <strong>{stats.totalProjects}</strong> проектов завершено, из них <strong>{stats.successfulProjects}</strong> успешно
      </p>
      
      {stats.firstProject && (
        <div className="project-card">
          <div className="project-card-label">Первый проект</div>
          <div className="project-card-title">{stats.firstProject.name}</div>
          <div className="project-card-meta">
            {stats.firstProject.success ? '✅ Успешно' : '❌ Не успешно'}
          </div>
        </div>
      )}

      {stats.lastProject && (
        <div className="project-card">
          <div className="project-card-label">Последний проект</div>
          <div className="project-card-title">{stats.lastProject.name}</div>
          <div className="project-card-meta">
            {stats.lastProject.success ? '✅ Успешно' : '❌ Не успешно'}
          </div>
        </div>
      )}
    </div>,

    // Screen 2: Expenses
    <div key="screen-2" className="end-screen-content expenses-screen">
      <div className="end-screen-title">Ваши расходы</div>
      <p className="end-screen-text">
        Всего потрачено: <strong>{stats.totalExpenses.toLocaleString()} ₩</strong>
      </p>

      <div className="expenses-breakdown">
        {Object.entries(stats.expensesByCategory)
          .sort((a, b) => b[1] - a[1])
          .map((entry, i) => (
            <div key={i} className="expense-item">
              <div className="expense-category">{entry[0]}</div>
              <div className="expense-bar">
                <div 
                  className="expense-bar-fill" 
                  style={{ width: `${(entry[1] / stats.totalExpenses) * 100}%` }}
                />
              </div>
              <div className="expense-amount">{entry[1].toLocaleString()} ₩</div>
            </div>
          ))}
      </div>

      {Object.entries(stats.expensesByCategory).length > 0 && (
        <div className="expense-highlight">
          <strong>Самая затратная статья:</strong> {Object.entries(stats.expensesByCategory).sort((a, b) => b[1] - a[1])[0][0]}
        </div>
      )}
    </div>,

    // Screen 3: Teams
    <div key="screen-3" className="end-screen-content teams-screen">
      <div className="end-screen-title">Ваша команда</div>
      <p className="end-screen-text">
        Вы были в <strong>{stats.teamsJoined}</strong> командах
      </p>

      {stats.firstTeam && (
        <div className="team-card">
          <div className="team-card-label">Первая команда</div>
          <div className="team-card-title">{stats.firstTeam.name}</div>
          <div className="team-card-meta">
            Уровень: {stats.firstTeam.teamLevel}
          </div>
        </div>
      )}

      {stats.longestTeam && (
        <div className="team-card">
          <div className="team-card-label">Самая долгая команда</div>
          <div className="team-card-title">{stats.longestTeam.name}</div>
          <div className="team-card-meta">
            Членов: {stats.longestTeam.memberIds.length}
          </div>
        </div>
      )}
    </div>,

    // Screen 4: Festival Wins
    <div key="screen-4" className="end-screen-content festival-screen">
      <div className="end-screen-title">Победы на фестивалях</div>
      <div className="festival-count">
        <div className="festival-number">{stats.festivalWins}</div>
        <div className="festival-label">
          {stats.festivalWins === 1 ? 'победа' : stats.festivalWins < 5 ? 'победы' : 'побед'}
        </div>
      </div>
      <p className="end-screen-text">
        {stats.festivalWins === 0 
          ? 'Вы не побеждали на фестивалях в этот раз, но ваше мастерство растёт!'
          : stats.festivalWins === 1
          ? 'Одна яркая победа на фестивале!'
          : `${stats.festivalWins} впечатляющих побед на сцене!`}
      </p>
    </div>,

    // Screen 5: NPCs
    <div key="screen-5" className="end-screen-content npcs-screen">
      <div className="end-screen-title">Ваши знакомства</div>
      <p className="end-screen-text">
        Вы познакомились с <strong>{stats.npcsMet}</strong> людьми из <strong>{stats.totalNPCs}</strong> возможных
      </p>
      <p className="end-screen-text">
        Из них <strong>{stats.npcsFriends}</strong> стали вашими друзьями
      </p>

      <div className="closest-npcs">
        <div className="closest-npcs-title">Самые близкие:</div>
        {stats.closestNPCs.length > 0 ? (
          <div className="npc-list">
            {stats.closestNPCs.map((npc, i) => (
              <div key={i} className="npc-item">
                {npc.avatar && (
                  <img src={npc.avatar} alt={npc.name} className="npc-avatar" />
                )}
                <div className="npc-info">
                  <div className="npc-name">{npc.name}</div>
                  <div className={`npc-relationship rel-${npc.relationship}`}>
                    {npc.relationship === 'friend' ? '👫 Друг' : '👤 Знакомый'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="npc-empty">Вы не завели глубоких отношений, но опыт бесценен!</p>
        )}
      </div>
    </div>,

    // Screen 6: Final
    <div key="screen-6" className="end-screen-content final-screen">
      <div className="end-screen-title">Спасибо за путешествие!</div>
      <p className="end-screen-text">
        Это было замечательное приключение. Надеемся, вы насладились каждым моментом,
        каждой победой и даже каждой неудачей, которые привели вас к успеху.
      </p>
      <p className="end-screen-text">
        Ваша история в K-pop индустрии — это история о настойчивости, таланте и страсти.
        Спасибо, что вы были здесь.
      </p>
      <div className="final-message">
        ✨ До встречи в следующий раз! ✨
      </div>
    </div>,
  ];

  return (
    <div className="game-end-screen">
      <div className="end-screen-container">
        {screens[currentScreen]}

        <div className="end-screen-nav">
          <button 
            className="end-screen-btn prev-btn"
            onClick={handlePrev}
            disabled={currentScreen === 0}
          >
            ← Назад
          </button>

          <div className="end-screen-progress">
            {Array(7).fill(0).map((_, i) => (
              <div 
                key={i} 
                className={`progress-dot ${i === currentScreen ? 'active' : ''} ${i < currentScreen ? 'completed' : ''}`}
              />
            ))}
          </div>

          {currentScreen !== 6 && (
            <button 
              className="end-screen-btn next-btn"
              onClick={handleNext}
            >
              Продолжить →
            </button>
          )}
        </div>

        {currentScreen === 6 && (
          <div className="end-screen-actions">
            <button className="end-screen-action-btn continue" onClick={handleContinue}>
              Продолжить игру
            </button>
            <button className="end-screen-action-btn restart" onClick={handleRestart}>
              Начать новую игру
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameEndScreen;
