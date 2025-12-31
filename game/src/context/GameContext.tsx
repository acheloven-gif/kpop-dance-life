import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameState, PlayerCharacter } from '../types';
import { NPC, Team, Project } from '../types/game';
import { NPCGenerator, TeamGenerator } from '../utils/generators';
import TEAM_NAMES from '../data/teamNames';
import { projectGenerator } from '../utils/projectGenerator';
import { determineTeamLeader, recalculateTeamLeader } from '../utils/teamLeader';
import { EventGenerator } from '../utils/eventGenerator';
import { getCommentPhrase, themes } from '../utils/commentLibrary';
import { getNpcPhrase } from '../data/npcPhrases';
import { CLOTHES_CATALOG } from '../data/clothes';
import { GIFTS } from '../types/game';
import { RelationshipBonuses } from '../utils/relationshipManager';

// Helper function to get days in a specific month (1-indexed)
const getDaysInMonth = (month: number): number => {
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 ? daysPerMonth[month - 1] : 30;
};

// tired gained per single training. Reduced by 3x as requested (was 2).
const TRAINING_TIRED_GAIN = 2 / 3; // ~0.6667 tired per single training (matches PlayerActions)
const REST_DAY_INDEX = 6; // weekday index reserved for rest when overloaded (0..6)

const INITIAL_GAME_STATE: GameState = {
  player: {
    id: '1',
    name: 'Player',
    avatar: {
      hairLength: 'middle',
      hairColor: 'dark',
      eyeColor: 'brown',
    },
    money: 5000,
    reputation: 0,
    popularity: 0,
    tired: 0,
    fSkill: 0,
    mSkill: 0,
    lastTrainedAbsDay: -1,
    fTrainingsThisWeek: 0,
    mTrainingsThisWeek: 0,
    // Shop / inventory trackers
    inventory: [
      { id: 'inv_top_white_tshirt', key: 'inv_top_white_tshirt', name: 'Р‘РµР»Р°СЏ С„СѓС‚Р±РѕР»РєР°', count: 1 },
      { id: 'inv_bottom_black_baggy', key: 'inv_bottom_black_baggy', name: 'Р§РµСЂРЅС‹Рµ РјРµС€РєРѕРІР°С‚С‹Рµ С€С‚Р°РЅС‹', count: 1 },
      { id: 'inv_shoes_white_sneakers', key: 'inv_shoes_white_sneakers', name: 'Р‘РµР»С‹Рµ РєСЂРѕСЃСЃРѕРІРєРё', count: 1 },
    ], // array of { key: string, id: string, name: string, count: number }
    shopPurchasesThisWeek: 0,
    shopUsesThisWeek: 0,
    teamId: null,
    effects: [],
    // counters for single-style training tracking
    consecutiveOnlyFDays: 0,
    consecutiveOnlyMDays: 0,
    // Track which NPCs have received greetings
    newYearGreetingsSent: {},
    birthdayGreetingsSent: {},
  },
  gameTime: {
    day: 0,
    week: 0,
    month: 0,
    year: 0,
  },
  todayTrainedStyles: [],
  theme: 'dark',
  isPaused: false,
  isModalPaused: false, // For modals to pause the game independently of manual pause
  timeSpeed: 1,
  animationEnabled: true,
  gameStarted: false,
  onboardingCompleted: false,
};

interface GameContextType {
  state: GameState;
  npcs: NPC[];
  teams: Team[];
  availableProjects: Project[];
  activeProjects: Project[];
  completedProjects?: Project[];
  recentCompleted?: Project | null;
  recentEvent?: any | null;
  gameEnded?: boolean;
  npcMetData?: { npc: NPC; relationship: 'acquaintance' | 'friend'; teamInfo?: any } | null;
  setNpcMetData?: (data: { npc: NPC; relationship: 'acquaintance' | 'friend'; teamInfo?: any } | null) => void;
  updatePlayer: (updates: Partial<PlayerCharacter>) => void;
  addPlayerMoney: (amount: number) => void;
  updateGameTime: () => void;
  togglePause: (val?: boolean) => void;
  setModalPause: (val: boolean) => void;
  toggleModalPause: () => void;
  setTimeSpeed: (speed: 1 | 2 | 5 | 10) => void;
  toggleTheme: () => void;
  toggleAnimation: () => void;
  completeOnboarding: () => void;
  restartGame: () => void;
  initializeGame: (name: string) => void;
  loadGame: () => void;
  saveGame: () => void;
  resumeGame?: () => void;
  acceptProject: (projectId: string, options?: { baseTraining?: number; costumeSavedMoney?: number }) => void;
  addTeamProject?: (project: any) => void;
  abandonProject: (projectId: string) => void;
  updateActiveProject: (projectId: string, updates: Partial<Project>) => void;
  recordTrainingParticipant?: (npcId: string) => void;
  recordPlayerStyleTraining?: (style: 'F' | 'M' | 'Both') => void;
  payForCostume?: (projectId: string) => void;
  fundProjectTraining?: (projectId: string) => void;
  setCostumeSavedMoney?: (projectId: string, amount: number) => void;
  clearRecentCompleted?: () => void;
  clearRecentEvent?: () => void;
  joinTeam?: (teamId: string) => void;
  leaveTeam?: () => void;
  applyEffect?: (effect: any, sourceLabel?: string) => void;
  removeEffect?: (effectId: string) => void;
  showEventIfIdle?: (ev: any) => boolean;
  advanceDays?: (n: number) => void;
  // expense logging
  recordExpense?: (label: string, amount: number, category?: string) => void;
  // messenger / application API
  sendTeamApplication?: (teamId: string) => void;
  inbox?: any[];
  markMessageRead?: (messageId: string) => void;
  queuedApplications?: Array<{ id: string; teamId: string; appliedAbsDay: number; reviewAbsDay: number }>;
  hasPendingApplication?: () => boolean;
  reserveCostumeForProject?: (projectId: string, amount: number) => boolean;
  releaseReservedCostume?: (projectId: string, amount?: number) => number;
  getReservedForProject?: (projectId: string) => number;
  // Clothes/shop API
  clothesCatalog?: any[];
  playerInventory?: string[];
  buyClothesItem?: (itemId: string) => boolean;
  pendingCostumeSelection?: string | null;
  submitCostumeSelection?: (projectId: string, outfit: any) => boolean;
  clearPendingCostumeSelection?: () => void;
  // collab handling
  processCollabAccept?: (params: { npcId: string; requiredSkillType: 'F_skill' | 'M_skill'; requiredSkill: number; npcName?: string }) => void;
  processCollabReject?: (collabMessageId: string, npcId: string, npcName: string) => void;
  // team invitation handling
  processTeamInvitationAccept?: (messageId: string, teamId: string) => void;
  processTeamInvitationReject?: (messageId: string, teamId: string) => void;
  processTeamProjectAccept?: (messageId: string, teamId: string, teamProjectData: any) => void;
  processTeamProjectReject?: (messageId: string, teamId: string) => void;
  addCompletedProject?: (project: any) => void;
  addRelationshipPoints?: (npcId: string, points: number) => void;
  // outgoing collab proposals queued for NPC reply
  queuedCollabProposals?: Array<{ id: string; npcId: string; createdAbsDay: number; respondAbsDay: number; payload: any; attempted: boolean }>;
  proposeCollab?: (npcId: string) => void;
  createCollabProject?: (npcId: string, projectName: string, projectDesc: string) => void;
  // Shop / inventory API
  buyItem?: (itemKey: string, qty?: number) => boolean;
  buyGift?: (giftId: string, qty?: number) => boolean;
  useItem?: (itemKey: string) => boolean;
  inventory?: any[];
  // Dev controls
  setFestivalFrequency?: (minDays: number, maxDays: number, chance: number) => void;
  getFestivalFrequency?: () => { minDays: number; maxDays: number; chance: number };
  // Birthday greeting
  sendBirthdayGreeting?: (npcId: string, giftItemId?: string) => boolean;
  // New Year greeting
  sendNewYearGreeting?: (npcId: string, giftItemId?: string) => boolean;
  // Community news
  sendCommunityNews?: (newsText: string, newsType?: 'team_formed' | 'team_disbanded' | 'npc_left') => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // РќР° Р·Р°РіСЂСѓР·РєРµ СЃС‚СЂР°РЅРёС†С‹ вЂ” РџРћР›РќР«Р™ РЎР‘Р РћРЎ РїСЂРѕРіСЂРµСЃСЃР° (РєР°Рє С‚СЂРµР±СѓРµС‚ РўР—), РєСЂРѕРјРµ С‚РµРјС‹
  const [state, setState] = useState<GameState>(() => {
    // Очистить completedProjects и activeProjects при новой игре
    try {
      localStorage.removeItem('completedProjects');
      localStorage.removeItem('activeProjects');
    } catch (e) {}
    const saved = localStorage.getItem('gameState');
    if (!saved) return INITIAL_GAME_STATE;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_GAME_STATE,
        theme: parsed.theme ?? INITIAL_GAME_STATE.theme,
        timeSpeed: 1,
      };
    } catch (e) {
      return INITIAL_GAME_STATE;
    }
  });

  // Ensure player's team is cleared at game start to avoid stale saves putting player into a team
  React.useEffect(() => {
    setState(prev => ({ ...prev, player: { ...prev.player, teamId: null } }));
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Р“РµРЅРµСЂРёСЂСѓРµРј Р·Р°РЅРѕРІРѕ NPCs Рё teams РїСЂРё РєР°Р¶РґРѕР№ Р·Р°РіСЂСѓР·РєРµ (СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅРЅРѕ)
  const [npcs, setNpcs] = useState<NPC[]>(() => {
    const generator = new NPCGenerator();
    return generator.generateNPCs(40); // СЃС‚Р°СЂС‚РѕРІРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ NPC вЂ” 40 РїРѕ РўР—
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    // Always generate fresh teams on start — do not load from localStorage
    // ВАЖНО: игрок не должен попасть в команду случайно при генерации
    const teamGen = new TeamGenerator();
    const teams = teamGen.generateTeams((npcs as NPC[]), 8);
    // Удаляем игрока из всех команд на всякий случай
    const playerId = INITIAL_GAME_STATE.player.id;
    const cleanedTeams = teams.map(t => {
      const tt: any = { ...t };
      // Remove player from team if present
      if (tt.memberIds.includes(playerId)) {
        tt.memberIds = tt.memberIds.filter((id: string) => id !== playerId);
      }
      // Ensure all teams have nextTeamProjectOfferAbsDay initialized (for backwards compatibility with old saves)
      if ((tt as any).nextTeamProjectOfferAbsDay === undefined) {
        tt.nextTeamProjectOfferAbsDay = -99999;
      }
      // Initialize createdAbsDay for all initial teams (day 0 of the game)
      if ((tt as any).createdAbsDay === undefined) {
        tt.createdAbsDay = 0;
      }
      // Remove stale pendingApplication if present
      if ((tt as any).pendingApplication) delete (tt as any).pendingApplication;
      // Set team leader if not already set
      if (!tt.leaderId) {
        tt.leaderId = determineTeamLeader(tt.memberIds, npcs as NPC[]);
      }
      return tt as Team;
    });
    return cleanedTeams;
  });

  // РџРѕСЃР»Рµ РёРЅРёС†РёР°Р»РёР·Р°С†РёРё teams СѓР±РµРґРёРјСЃСЏ, С‡С‚Рѕ NPC state СЃРѕРґРµСЂР¶РёС‚ РєРѕСЂСЂРµРєС‚РЅС‹Рµ teamId
  React.useEffect(() => {
    // If teams were generated from a separate NPCGenerator instance, align npcs array accordingly
    if (teams && teams.length > 0) {
      const updated = [...npcs];
      teams.forEach(t => {
        (t.memberIds || []).forEach(id => {
          const npc = updated.find(n => n.id === id);
          if (npc) npc.teamId = t.id;
        });
      });
      // Compute and attach dominantStyle and avgDominant for teams on initial load
      const updatedTeams = teams.map(t => {
        const members = (t.memberIds || []).map((id: string) => updated.find(n => n.id === id)).filter(Boolean) as any[];
        const memberDominants = members.length > 0 ? members.map(m => ({ val: Math.max(m.fSkill || 0, m.mSkill || 0), style: (m.fSkill || 0) > (m.mSkill || 0) ? 'F_style' : (m.mSkill || 0) > (m.fSkill || 0) ? 'M_style' : 'Both' })) : [];
        const avgDominant = memberDominants.length > 0 ? Math.round(memberDominants.reduce((s, md) => s + md.val, 0) / memberDominants.length) : 0;
        const styleCounts = memberDominants.reduce((acc: any, md: any) => { acc[md.style] = (acc[md.style] || 0) + 1; return acc; }, { F_style: 0, M_style: 0, Both: 0 });
        let dominantStyle: 'F_style' | 'M_style' | 'Both' = 'Both';
        if (styleCounts.F_style > styleCounts.M_style && styleCounts.F_style >= styleCounts.Both) dominantStyle = 'F_style';
        else if (styleCounts.M_style > styleCounts.F_style && styleCounts.M_style >= styleCounts.Both) dominantStyle = 'M_style';
        
        // Recalculate leader if not set
        const leaderId = t.leaderId || recalculateTeamLeader(t, updated);
        
        return { ...t, dominantStyle, avgDominant, leaderId } as any;
      });
      setTeams(updatedTeams);
      setNpcs(updated);
      // Ensure player is not accidentally included in any team and clear inconsistent player.teamId
      let playerRemovedFromTeams = false;
      const cleanedTeams = updatedTeams.map(t => {
        if (t.memberIds && t.memberIds.includes(state.player.id)) {
          playerRemovedFromTeams = true;
          return { ...t, memberIds: t.memberIds.filter((id: string) => id !== state.player.id) } as any;
        }
        return t;
      });
      if (playerRemovedFromTeams) {
        setTeams(cleanedTeams);
      }
      // If player's teamId references a team that doesn't include the player, clear it
      const playerTeamId = state.player?.teamId;
      if (playerTeamId && !cleanedTeams.some(t => t.id === playerTeamId && t.memberIds.includes(state.player.id))) {
        setState(prev => ({ ...prev, player: { ...prev.player, teamId: null } }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Р“РµРЅРµСЂРёСЂСѓРµРј Р·Р°РЅРѕРІРѕ РїСЂРѕРµРєС‚С‹ РїСЂРё РєР°Р¶РґРѕР№ Р·Р°РіСЂСѓР·РєРµ
  const [availableProjects, setAvailableProjects] = useState<Project[]>(() => {
    // generate initial projects using initial player state
    // initial pool: 7 projects at game start (varied by style/skill/duration)
    return projectGenerator.generateAvailableProjects(7, INITIAL_GAME_STATE.player as any);
  });

  const [activeProjects, setActiveProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('activeProjects');
      if (saved) {
        const projects = JSON.parse(saved);
        return Array.isArray(projects) ? projects : [];
      }
    } catch (e) {
      console.error('Error loading activeProjects:', e);
    }
    return [];
  });
  // Р—Р°РІРµСЂС€С‘РЅРЅС‹Рµ РїСЂРѕРµРєС‚С‹ РІСЃРµРіРґР° РЅР°С‡РёРЅР°СЋС‚ РїСѓСЃС‚Рѕ (РЅРѕРІР°СЏ РёРіСЂР°)
  // Completed projects always start empty (new game) and are NOT loaded from localStorage
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  // РЅРµРґР°РІРЅРѕ Р·Р°РІРµСЂС€С‘РЅРЅС‹Р№ РїСЂРѕРµРєС‚ РґР»СЏ РїРѕРєР°Р·Р° РїРѕРїР°РїР°
  const [recentCompleted, setRecentCompleted] = useState<Project | null>(null);
  // РЅРµРґР°РІРЅРµРµ СЃРѕР±С‹С‚РёРµ РґР»СЏ РїРѕРєР°Р·Р° РїРѕРїР°РїР°
  const [recentEvent, setRecentEvent] = useState<any | null>(null);
  // Р¤Р»Р°Рі РґР»СЏ РѕС‚СЃР»РµР¶РёРІР°РЅРёСЏ Р·Р°РІРµСЂС€РµРЅРёСЏ РёРіСЂС‹
  const [gameEnded, setGameEnded] = useState(false);
  // NPC met modal (shows when player meets or befriends an NPC)
  const [npcMetData, setNpcMetData] = useState<{ npc: NPC; relationship: 'acquaintance' | 'friend'; teamInfo?: any } | null>(null);
  // queued team applications awaiting review (delayed responses)
  const [queuedApplications, setQueuedApplications] = useState<Array<{ id: string; teamId: string; appliedAbsDay: number; reviewAbsDay: number; attempted?: boolean }>>(() => []);
  // queued outgoing collab proposals awaiting NPC reply
  const [queuedCollabProposals, setQueuedCollabProposals] = useState<Array<{ id: string; npcId: string; createdAbsDay: number; respondAbsDay: number; payload: any; attempted: boolean }>>(() => []);
  // simple inbox for messenger (messages from NPCs and team responses)
  const [inbox, setInbox] = useState<any[]>(() => []);
  // Track previous teams state to detect new teams and disbanded teams
  const previousTeamsRef = React.useRef<Team[]>([]);
  // Track previous NPC states to detect who left
  const previousNpcsRef = React.useRef<NPC[]>([]);
  // Track current queued proposals and applications for timer access
  const queuedCollabProposalsRef = React.useRef<Array<{ id: string; npcId: string; createdAbsDay: number; respondAbsDay: number; payload: any; attempted: boolean }>>([]);
  const queuedApplicationsRef = React.useRef<Array<{ id: string; teamId: string; appliedAbsDay: number; reviewAbsDay: number; attempted?: boolean }>>([]);
  const npcsRef = React.useRef<NPC[]>([]);
  const teamsRef = React.useRef<Team[]>([]);
  const newAbsDayRef = React.useRef<number>(0); // Track current game day for processing proposals/applications

  const markMessageRead = (messageId: string) => {
    setInbox(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
  };

  // Send community news to the "Community News" contact
  const sendCommunityNews = (newsText: string, newsType: 'team_formed' | 'team_disbanded' | 'npc_left' = 'team_formed') => {
    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;
    const absDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;
    
    const newsMessage = {
      id: `news_${newsType}_${Date.now()}_${Math.random()}`,
      type: 'community_news',
      npcId: 'COMMUNITY_NEWS', // Special ID for community news contact
      senderId: 'COMMUNITY_NEWS',
      text: newsText,
      newsType,
      absDay,
      read: false
    };
    
    setInbox(prev => [newsMessage, ...prev]);
  };

  // Track team changes (new teams formed, teams disbanded)
  React.useEffect(() => {
    if (!teams || teams.length === 0) {
      previousTeamsRef.current = teams;
      return;
    }

    const prevTeams = previousTeamsRef.current || [];
    const prevTeamIds = new Set(prevTeams.map(t => t.id));
    const currentTeamIds = new Set(teams.map(t => t.id));

    // Гарантируем, что для каждой новой и распавшейся команды новость отправляется ровно один раз
    const newTeams = teams.filter(t => !prevTeamIds.has(t.id));
    const disbandedTeams = prevTeams.filter(t => !currentTeamIds.has(t.id));

    if (stateRef.current.gameStarted) {
      newTeams.forEach(t => {
        const members = (t.memberIds || []).map((id: string) => npcs.find(n => n.id === id)).filter(Boolean) as any[];
        const leaderName = members.find((m: any) => m.id === t.leaderId)?.name || 'Неизвестно';
        let teamStyle = '';
        if (t.dominantStyle === 'F_style') teamStyle = '👩 Женский';
        else if (t.dominantStyle === 'M_style') teamStyle = '👨 Мужской';
        else teamStyle = '🎭 Оба стиля';
        const newsText = `🎉 Новая команда "${t.name}"!\n👥 Лидер: ${leaderName}\n💃 Стиль: ${teamStyle}`;
        sendCommunityNews(newsText, 'team_formed');
      });
      disbandedTeams.forEach(t => {
        const newsText = `💔 Команда "${t.name}" распалась :(`;
        sendCommunityNews(newsText, 'team_disbanded');
      });
    }

    previousTeamsRef.current = teams;
  }, [teams, npcs]);

  // Track NPC changes (NPCs leaving to pursue solo career)
  React.useEffect(() => {
    if (!npcs || npcs.length === 0) {
      previousNpcsRef.current = npcs;
      return;
    }

    const prevNpcs = previousNpcsRef.current || [];
    
    // Check if any NPC that had an activeStatus lost it (left coVerdance)
    npcs.forEach(npc => {
      const prevNpc = prevNpcs.find(p => p.id === npc.id);
      if (prevNpc && prevNpc.activeStatus && !npc.activeStatus) {
        const newsText = `👋 ${npc.name} ушел(а) из коверденса`;
        sendCommunityNews(newsText, 'npc_left');
      }
    });

    previousNpcsRef.current = npcs;
  }, [npcs]);

  // Propose collab with an NPC: creates a queued proposal that will be processed on future days
  const proposeCollab = (npcId: string) => {
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) return;
    
    // Check if there's already a pending proposal to this NPC
    const hasPending = queuedCollabProposals.some(p => p.npcId === npcId && !p.attempted);
    if (hasPending) {
      try {
        showEventIfIdle({
          id: `collab_duplicate_${Date.now()}`,
          type: 'info',
          title: 'Предложение уже отправлено',
          text: `Вы уже отправили предложение ${npc.name}. Дождитесь ответа.`
        });
      } catch (e) {}
      return;
    }
    
    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;
    const currentAbsDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;
    // respondAbsDay: delay 1-7 days from now
    const respondAbsDay = currentAbsDay + 1 + Math.floor(Math.random() * 7);
    const proposal = {
      id: `collab_proposal_${Date.now()}_${Math.random()}`,
      npcId,
      createdAbsDay: currentAbsDay,
      respondAbsDay,
      payload: { npcName: npc.name },
      attempted: false
    };
    setQueuedCollabProposals(prev => [...prev, proposal]);
    // Sync update to ref to ensure updateGameTime can access it immediately
    queuedCollabProposalsRef.current = [...(queuedCollabProposalsRef.current || []), proposal];
    // Mark NPC as 'acquaintance' so they appear in messenger contacts
    setNpcs(prev => prev.map(n => n.id === npcId ? { ...n, relationship: n.relationship === 'friend' ? 'friend' : 'acquaintance' } : n));
    // Mark pending collab on player state so UI can reflect disabled button
    setState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        pendingCollabs: {
          ...(prev.player.pendingCollabs || {}),
          [npcId]: true
        }
      }
    }));
    // Create an immediate chat entry from the player so dialog appears in messenger
    try {
      const playerMsg = {
        id: `msg_out_${Date.now()}_${Math.random()}`,
        type: 'message',
        npcId,
        senderId: stateRef.current.player.id,
        text: 'Привет! Нашла твой канал в подслушке. Мне нравится, как ты танцуешь. Хочешь вместе снять коллаб?',
        absDay: currentAbsDay,
        read: true
      };
      setInbox(prev => [playerMsg, ...prev]);
      // Dispatch a UI event so messenger component can open and focus this NPC
      if (typeof window !== 'undefined') {
        try { window.dispatchEvent(new CustomEvent('open-messenger', { detail: { npcId } })); } catch(e) {}
      }
    } catch (e) { }
  };

  // РРЅСЃС‚Р°РЅСЃ РіРµРЅРµСЂР°С‚РѕСЂР° СЃРѕР±С‹С‚РёР№ (РЅРµ РјРµРЅСЏРµС‚СЃСЏ РјРµР¶РґСѓ РїРµСЂРµСЂРµРЅРґРµСЂР°РјРё)
  const eventGenerator = React.useMemo(() => new EventGenerator(), []);

  // refs for popup timing and current recentEvent to avoid stale closures in intervals
  const recentEventRef = React.useRef<any | null>(recentEvent);
  const recentCompletedRef = React.useRef<any | null>(recentCompleted);
  const lastPopupRef = React.useRef<number>(0);
  const modalPauseRef = React.useRef<boolean>(false);
  const modalCountRef = React.useRef<number>(0); // Track number of open modals - if > 0, pause game
  // Track how many projects the player accepted since last visible failure event
  // Used to ensure visible "project failure" occurs no more often than 1 per 7 accepted projects
  const acceptedSinceFailureRef = React.useRef<number>(7);
  // Reservations: support reserving costume money before project acceptance (used by acceptance modal)
  const reservedCostumeRef = React.useRef<Record<string, number>>({});
  // Clothes / shop catalog and inventory
  const [clothesCatalog] = useState(CLOTHES_CATALOG);
  // Player inventory stored as array of item ids; sync with localStorage
  // Always start with default inventory (don't load from localStorage on init)
  // Only restore from gameState when explicitly loading a saved game
  const [playerInventory, setPlayerInventory] = useState<string[]>(['inv_shoes_white_sneakers', 'inv_top_white_tshirt', 'inv_bottom_black_baggy']);

  const [pendingCostumeSelection, setPendingCostumeSelection] = useState<string | null>(null);

  const buyClothesItem = (itemId: string) => {
    const item = clothesCatalog.find((c: any) => c.id === itemId);
    if (!item) return false;
    const price = item.price || 0;
    if ((stateRef.current.player.money || 0) < price) return false;
    // Deduct money and add to inventory
    setState(prev => ({ ...prev, player: { ...prev.player, money: Math.max(0, (prev.player.money || 0) - price) } }));
    setPlayerInventory(prev => {
      const updated = Array.from(new Set([...prev, itemId]));
      try { localStorage.setItem('playerInventory', JSON.stringify(updated)); } catch (e) { /* ignore */ }
      return updated;
    });
    try { recordExpense && recordExpense(item.name, price, 'costume'); } catch (e) { /* ignore */ }
    return true;
  };

  // New Year greeting: works similarly to birthday greeting, can include a giftItemId
  const sendNewYearGreeting = (npcId: string, giftItemId?: string) => {
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) return false;

    // Check if NPC has private chat and player cannot access it
    if (npc.hasPrivateChat) {
      const relPoints = npc.relationshipPoints || 0;
      const isStranger = relPoints <= 10;
      const isEnemy = npc.enemyBadge;
      
      if (isStranger || isEnemy) {
        console.warn('Cannot send New Year greeting to closed chat');
        return false;
      }
    }

    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;
    const absDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;

    // Remove any existing prompt for this npc
    setInbox(prev => prev.filter(m => !(m.type === 'new_year_greeting_prompt' && m.npcId === npcId)));

    // Compose greeting
    let greetingText = `С Новым Годом, ${npc.name}! Пусть новый год принесёт вдохновение.`;
    let matched = false;
    let bonusToAdd = 0;
    if (giftItemId) {
      const giftMeta = GIFTS.find(g => g.id === giftItemId) || GIFTS.find(g => g.name === giftItemId as any);
      if (giftMeta) {
        setPlayerInventory(prev => {
          const updated = prev.filter(itemId => itemId !== giftItemId);
          try { localStorage.setItem('playerInventory', JSON.stringify(updated)); } catch (e) { }
          return updated;
        });
        matched = giftMeta.suitableCharacters.includes(npc.behaviorModel as any);
        bonusToAdd = matched ? giftMeta.matchedRelationshipBonus : giftMeta.baseRelationshipBonus;
        greetingText += ` Я прислала подарок: ${giftMeta.name}.`;
      }
    } else {
      bonusToAdd = RelationshipBonuses.BIRTHDAY_GREETING; // small text-only greeting bonus
    }

    // Post player's message
    setInbox(prev => [...prev, { id: `newyear_greeting_${npcId}_${absDay}`, type: 'message', npcId, senderId: stateRef.current.player.id, text: greetingText, absDay, read: true }]);
    setNpcs(prevN => prevN.map(n => n.id === npcId ? { ...n, newYearGreetingReceivedAbsDay: absDay } : n));
    
    // Mark greeting as sent in player state
    setState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        newYearGreetingsSent: {
          ...(prev.player.newYearGreetingsSent || {}),
          [npcId]: true
        }
      }
    }));

    const respondAbsDay = absDay + 1;
    const npcResponse = matched
      ? getNpcPhrase(npc.behaviorModel, 'gift_excited')
      : getNpcPhrase(npc.behaviorModel, 'new_year');
    setInbox(prev => [...prev, { id: `newyear_thanks_${npcId}_${respondAbsDay}`, type: 'message', npcId, senderId: npcId, text: npcResponse, absDay: respondAbsDay, read: false }]);

    if (bonusToAdd && addRelationshipPoints) addRelationshipPoints(npcId, bonusToAdd);
    return true;
  };

  const submitCostumeSelection = (projectId: string, outfit: { top?: string; bottom?: string; shoes?: string; accessories?: string[] }) => {
    // Check if costume is already locked (approved)
    const project = activeProjects.find(p => p.id === projectId);
    if (project && (project as any).costumeLocked) {
      console.warn('Cannot change costume - already approved');
      return false;
    }
    
    if (!project) {
      console.warn('Project not found for costume selection');
      return false;
    }
    
    // Check if this is a re-submission (51-80% range and trying to change)
    const isPreviouslyChosen = (project as any)?.costumeMatchPercent && (project as any).costumeMatchPercent >= 51 && (project as any).costumeMatchPercent <= 80;
    const previousItems = isPreviouslyChosen ? (project as any).costumeSelectedItems : null;
    const previousPercent = isPreviouslyChosen ? (project as any).costumeMatchPercent : null;
    
    // Evaluate outfit suitability and points ONLY for the specified project
    const items = [outfit.top, outfit.bottom, outfit.shoes, ...(outfit.accessories || [])].filter(Boolean) as string[];
    const selected = (clothesCatalog || []).filter((c: any) => items.includes(c.id));
    // Compute matched points: only items that are suitable for the project style count
    // Max effective points = 17 (3 clothes *5 + 2 accessories *1). Accessories beyond that still count up to cap of 5 accessories but points capped by item definitions and total cap.
    setActiveProjects(prev => prev.map(p => {
      // CRITICAL: Only apply costume logic to the specified projectId, not to all projects
      if (p.id !== projectId) {
        // Return all other projects unchanged
        return p;
      }
      const projectStyle = p.requiredSkill === 'F_skill' ? 'женское' : p.requiredSkill === 'M_skill' ? 'мужское' : 'оба';
      let matchedPoints = 0;
      // count main parts (top, bottom, shoes) and accessories separately
      const counted: string[] = [];
      // Helper to decide if an item suits the project
      const suitsProject = (suit: string) => {
        if (!suit) return false;
        if (suit === 'все' || suit === 'оба') return true;
        if (suit === 'жен+оба' && (projectStyle === 'женское' || projectStyle === 'оба')) return true;
        if (suit === 'муж+оба' && (projectStyle === 'мужское' || projectStyle === 'оба')) return true;
        if (suit === 'женское' && projectStyle === 'женское') return true;
        if (suit === 'мужское' && projectStyle === 'мужское') return true;
        return false;
      };

      // Prefer counting the mandatory pieces first (top, bottom, shoes)
      ['top','bottom','shoes'].forEach((cat) => {
        const it = selected.find((s: any) => s.category === cat);
        if (it && suitsProject(it.suitability)) {
          matchedPoints += (it.points || 0);
          counted.push(it.id);
        }
      });

      // Accessories: up to 5 items; count only those that suit the project
      const accessories = selected.filter((s: any) => s.category === 'accessory');
      let accCounted = 0;
      for (const a of accessories) {
        if (accCounted >= 5) break;
        if (counted.includes(a.id)) continue;
        if (suitsProject(a.suitability)) {
          // accessories typically 1 point each (catalog defines points); ensure we don't exceed
          matchedPoints += Math.max(0, Math.min((a.points || 1), 1));
          counted.push(a.id);
          accCounted++;
        }
      }

      // Cap effective matched points to 17 as per spec
      const effectiveMatched = Math.min(17, matchedPoints);
      const matchPercent = Math.round((effectiveMatched / 17) * 100);
      
      // Generate NPC opinion based on match percent
      const npcId = (p as any).npcId || (p as any).leaderId;
      const npc = npcs.find((n: any) => n.id === npcId);
      const npcName = npc?.name || 'Лидер проекта';
      const npcFaceId = npc?.faceId || 'default';
      
      let opinion = '';
      if (matchPercent < 50) {
        const badOpinions = [
          'Это... не совсем то, что я имел в виду. Костюм совершенно не соответствует стилю проекта.',
          'Честно говоря, костюм выглядит странно. Нужно начать с нуля.',
          'Этот выбор совсем не подходит. Необходимо полностью переодеться.',
        ];
        opinion = badOpinions[Math.floor(Math.random() * badOpinions.length)];
      } else if (matchPercent >= 81) {
        const goodOpinions = [
          'Отлично! Это в точности то, что нам нужно для проекта!',
          'Превосходный выбор! Костюм идеально подходит.',
          'Просто идеально! Вы точно поняли мой замысел.',
        ];
        opinion = goodOpinions[Math.floor(Math.random() * goodOpinions.length)];
      } else {
        // 51-80%: check if this is a re-submission with worse match
        if (isPreviouslyChosen && previousPercent !== null && matchPercent < previousPercent) {
          opinion = `Хм, предыдущий выбор был лучше (${previousPercent}%). Р”Р°РІР°Р№С‚Рµ РІРµСЂРЅС‘РјСЃСЏ Рє РЅРµРјСѓ.`;
        } else {
          const midOpinions = [
            'Неплохо, но можно улучшить. Если хотите, можете пересмотреть выбор.',
            'Костюм подходит, но может быть лучше. Решайте, менять или оставить.',
            'Приемлемый вариант, но я вижу, что костюм может быть лучше.',
          ];
          opinion = midOpinions[Math.floor(Math.random() * midOpinions.length)];
        }
      }
      
      const updated: any = { 
        ...p, 
        costumePaid: true, 
        costumeMatchPercent: matchPercent, 
        costumeSelectedItems: items,
        costumeOpinion: opinion,
        npcOpinion: npcName,
        costumeNpcId: npcId,
        costumeNpcFaceId: npcFaceId,
        costumeSavedAbsDay: stateRef.current.gameTime.year * (12 * 30) + stateRef.current.gameTime.month * 30 + stateRef.current.gameTime.day // Save current abs day for re-check after 7 days
      };
      
      // Apply consequences and handle payment (only if match >= 51%)
      if (matchPercent < 50) {
        // FAIL: extend deadline by 7 days (add 1 week)
        updated.durationWeeks = (updated.durationWeeks || 1) + 1;
        updated.forceBuyRequired = true;
        // clear saved money so player must buy new costume
        updated.costumeSavedMoney = 0;
        updated.costumeLocked = false; // Can try again
        updated.costumeRetryAllowedAbsDay = stateRef.current.gameTime.year * (12 * 30) + stateRef.current.gameTime.month * 30 + stateRef.current.gameTime.day + 7; // Allow retry after 7 days
        // Also clear any reserved pre-accept funds and refund money
        try {
          if (reservedCostumeRef.current[projectId]) {
            setState(prev => ({ ...prev, player: { ...prev.player, money: (prev.player.money || 0) + (reservedCostumeRef.current[projectId] || 0) } }));
            delete reservedCostumeRef.current[projectId];
          }
        } catch (e) { }
      } else {
        // ACCEPT (51%+): Deduct money for unowned items and add to inventory
        const ownedIds = Array.isArray(playerInventory) ? playerInventory : (state?.player?.inventory?.map((i:any)=>i.id) || []);
        let totalCost = 0;
        for (const itemId of items) {
          if (!ownedIds.includes(itemId)) {
            const item = (clothesCatalog || []).find((c: any) => c.id === itemId);
            if (item) {
              totalCost += (item.price || 0);
            }
          }
        }
        
        // Check if player has enough money
        const currentBalance = stateRef.current.player.money || 0;
        if (totalCost > currentBalance) {
          console.warn(`Not enough money for costume: need ${totalCost}, have ${currentBalance}`);
          return false; // Cannot proceed without enough money
        }
        
        // Deduct money
        if (totalCost > 0) {
          setState(prev => ({ ...prev, player: { ...prev.player, money: Math.max(0, (prev.player.money || 0) - totalCost) } }));
        }
        // Add all selected items to inventory
        setPlayerInventory(prev => {
          const updated = Array.from(new Set([...prev, ...items]));
          try { localStorage.setItem('playerInventory', JSON.stringify(updated)); } catch (e) { /* ignore */ }
          return updated;
        });
        // Record expense
        try { recordExpense && recordExpense('РљРѕСЃС‚СЋРј РґР»СЏ РїСЂРѕРµРєС‚Р°', totalCost, 'costume'); } catch (e) { /* ignore */ }
        
        // Apply tier-specific consequences
        if (matchPercent >= 81) {
          updated.costumeLocked = true; // cannot change
        } else {
          // 51-80% allow changes immediately, but revert if new choice is worse
          if (isPreviouslyChosen && previousPercent !== null && matchPercent < previousPercent) {
            // Revert to previous selection
            updated.costumeMatchPercent = previousPercent;
            updated.costumeSelectedItems = previousItems;
            updated.costumeOpinion = (project as any).previousCostumeOpinion;
            updated.costumeOpinion = `${opinion} ${(project as any).previousCostumeOpinion || ''}`.trim();
          }
          updated.costumeLocked = false;
          updated.previousCostumeMatchPercent = matchPercent; // Store for next comparison
          updated.previousCostumeSelectedItems = items;
          updated.previousCostumeOpinion = opinion;
        }
      }
      return updated;
    }));
    // DO NOT clear pending flag here - it needs to stay set so the modal can show loading/result screens
    // It will be cleared when user clicks "Готово" button (via clearPendingCostumeSelection)
    return true;
  };
  const clearPendingCostumeSelection = () => setPendingCostumeSelection(null);
  // Used to schedule end-of-game modal from interval/update ticks
  const endGamePendingRef = React.useRef<boolean>(false);
  const stateRef = React.useRef<GameState>(state);
  useEffect(() => { recentEventRef.current = recentEvent; }, [recentEvent]);
  useEffect(() => { recentCompletedRef.current = recentCompleted; }, [recentCompleted]);
  useEffect(() => { if (recentEvent) lastPopupRef.current = Date.now(); }, [recentEvent]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { queuedCollabProposalsRef.current = queuedCollabProposals; }, [queuedCollabProposals]);
  useEffect(() => { queuedApplicationsRef.current = queuedApplications; }, [queuedApplications]);
  useEffect(() => { npcsRef.current = npcs; }, [npcs]);
  useEffect(() => { teamsRef.current = teams; }, [teams]);

  const reserveCostumeForProject = (projectId: string, amount: number) => {
    const toReserve = Math.max(0, Math.floor(amount));
    if (toReserve <= 0) return false;
    const available = Math.max(0, stateRef.current.player.money || 0);
    const affordable = Math.min(toReserve, available);
    if (affordable <= 0) return false;
    // Deduct immediately and remember reservation
    setState(prev => ({ ...prev, player: { ...prev.player, money: Math.max(0, (prev.player.money || 0) - affordable) } }));
    reservedCostumeRef.current[projectId] = (reservedCostumeRef.current[projectId] || 0) + affordable;
    return true;
  };

  const releaseReservedCostume = (projectId: string, amount?: number) => {
    const reserved = reservedCostumeRef.current[projectId] || 0;
    if (!reserved) return 0;
    const toRelease = amount === undefined ? reserved : Math.max(0, Math.min(reserved, Math.floor(amount)));
    if (toRelease <= 0) return 0;
    // refund to player
    setState(prev => ({ ...prev, player: { ...prev.player, money: (prev.player.money || 0) + toRelease } }));
    reservedCostumeRef.current[projectId] = Math.max(0, reserved - toRelease);
    if (reservedCostumeRef.current[projectId] === 0) delete reservedCostumeRef.current[projectId];
    return toRelease;
  };

  const getReservedForProject = (projectId: string) => {
    return reservedCostumeRef.current[projectId] || 0;
  };

  // Helper to show event only if no other modal (recentEvent or recentCompleted) is open
  const showEventIfIdle = (ev: any) => {
    if (recentEventRef.current || recentCompletedRef.current) return false;
    
    // If this is a team invitation, route it to inbox instead of showing as popup
    // Team invitations are 'choice' events with title "РџСЂРёРіР»Р°С€РµРЅРёРµ РІ РєРѕРјР°РЅРґСѓ"
    if (ev && ev.type === 'choice' && ev.title === 'РџСЂРёРіР»Р°С€РµРЅРёРµ РІ РєРѕРјР°РЅРґСѓ' && ev.choices && ev.choices.length === 2) {
      try {
        const DAYS_PER_MONTH = 30;
        const MONTHS_PER_YEAR = 12;
        const absDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;
        
        // Extract team ID from effect (should be in choices[0].effect.teamJoin)
        const teamId = ev.choices[0].effect?.teamJoin;
        const team = teams.find((t: any) => t.id === teamId);
        if (!team) return false;
        
        const teamInviteMessage = {
          id: `team_invite_${teamId}_${Date.now()}`,
          type: 'team_invitation',
          teamId: teamId,
          teamName: team.name,
          npcId: team.leaderId,
          senderId: teamId,
          text: ev.text, // Contains full invitation details
          read: false,
          createdAbsDay: absDay,
          acceptEffect: ev.choices[0].effect || {},
          rejectEffect: ev.choices[1].effect || {}
        };
        
        setInbox(prev => [teamInviteMessage, ...prev]);
        return true;
      } catch (e) {
        // ignore - fall through to regular event handling
      }
    }
    
    // If this is a team project offer, route it to inbox instead of showing as popup
    // Team project offers are 'choice' events with title "РљРѕРјР°РЅРґРЅС‹Р№ РїСЂРѕРµРєС‚"
    if (ev && ev.type === 'choice' && ev.title === 'РљРѕРјР°РЅРґРЅС‹Р№ РїСЂРѕРµРєС‚' && ev.choices && ev.choices.length === 2) {
      try {
        const DAYS_PER_MONTH = 30;
        const MONTHS_PER_YEAR = 12;
        const absDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;
        
        const playerTeam = teams.find((t: any) => t.id === stateRef.current.player.teamId);
        if (!playerTeam) return false;
        
        // Extract team project from the effect
        const teamProject = ev.choices[0].effect?.teamProjectJoin;
        
        const teamProjectMessage = {
          id: `team_project_${playerTeam.id}_${Date.now()}`,
          type: 'team_project_offer',
          teamId: playerTeam.id,
          teamName: playerTeam.name,
          npcId: playerTeam.leaderId,
          senderId: playerTeam.leaderId,
          text: ev.text,
          read: false,
          createdAbsDay: absDay,
          teamProjectData: teamProject,
          acceptEffect: ev.choices[0].effect || {},
          rejectEffect: ev.choices[1].effect || {}
        };
        
        setInbox(prev => [teamProjectMessage, ...prev]);
        return true;
      } catch (e) {
        // ignore - fall through to regular event handling
      }
    }
    
    // If this is a collab offer, route it to inbox instead of showing as popup
    if (ev && ev.type === 'collab_offer') {
      try {
        const DAYS_PER_MONTH = 30;
        const MONTHS_PER_YEAR = 12;
        const absDay = state.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + state.gameTime.month * DAYS_PER_MONTH + state.gameTime.day;
        const expiresAbsDay = absDay + 20;
        
        const collabMessage = {
          id: `collab_${ev.npcId}_${Date.now()}`,
          type: 'collab_offer',
          npcId: ev.npcId,
          senderId: ev.npcId,
          npcName: ev.npcName,
          text: ev.text,
          read: false,
          createdAbsDay: absDay,
          expiresAbsDay: expiresAbsDay,
          collabData: ev.collabData
        };
        
        setInbox(prev => [collabMessage, ...prev]);
        
        // Mark NPC as 'acquaintance' when collab offer is received and show popup
        setNpcs(prev => prev.map(n => n.id === ev.npcId ? { ...n, relationship: n.relationship === 'friend' ? 'friend' : 'acquaintance' } : n));
        
        // Show NPC met popup
        const npc = npcs.find((n: any) => n.id === ev.npcId);
        if (npc && npc.relationship === 'stranger') {
          // Only show if becoming acquaintance (new relationship)
          const team = teams.find((t: any) => t.id === npc.teamId);
          setNpcMetData({
            npc,
            relationship: 'acquaintance' as const,
            teamInfo: team ? { name: team.name, dominantStyle: team.dominantStyle } : undefined
          });
        }
        
        return true;
      } catch (e) {
        // ignore
      }
    }
    
    // If this event is a collab offer from an NPC, mark that NPC as 'acquaintance' immediately
    try {
      if (ev && ev.npcId && ev.choices && Array.isArray(ev.choices) && ev.choices.some((c: any) => c.effect && c.effect.collabAccept)) {
        setNpcs(prev => prev.map(n => n.id === ev.npcId ? { ...n, relationship: n.relationship === 'friend' ? 'friend' : 'acquaintance' } : n));
        
        // Show NPC met popup
        const npc = npcs.find((n: any) => n.id === ev.npcId);
        if (npc && npc.relationship === 'stranger') {
          // Only show if becoming acquaintance (new relationship)
          const team = teams.find((t: any) => t.id === npc.teamId);
          setNpcMetData({
            npc,
            relationship: 'acquaintance' as const,
            teamInfo: team ? { name: team.name, dominantStyle: team.dominantStyle } : undefined
          });
        }
      }
    } catch (e) {
      // ignore
    }
    setRecentEvent && setRecentEvent(ev);
    recentEventRef.current = ev;
    lastPopupRef.current = Date.now();
    return true;
  };

  // Compute combined training efficiency multiplier: tired-based multiplier * product of trainingEfficiencyMult effects
  const computeTrainingEfficiency = (playerObj: any) => {
    const tired = (playerObj?.tired || 0);
    const tiredMult = tired < 70 ? 1.0 : (tired <= 89 ? 0.8 : 0.5);
    const effects = playerObj?.effects || [];
    const effMult = effects.reduce((acc: number, ef: any) => acc * (ef.trainingEfficiencyMult ?? 1), 1);
    const cappedEffMult = Math.min(effMult, 1.9); // prevent stacking reaching x2 or more
    return Math.max(0, tiredMult * cappedEffMult);
  };

  // Apply a structured effect object to the player. Handles immediate changes and registers multi-day effects.
  const applyEffect = (effect: any, sourceLabel?: string) => {
    setState(prev => {
      const DAYS_PER_MONTH = 30;
      const MONTHS_PER_YEAR = 12;
      const absDay = prev.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + prev.gameTime.month * DAYS_PER_MONTH + prev.gameTime.day;

      // immediate numeric changes
      const newPlayer: any = { ...prev.player };
      if (effect.money) newPlayer.money = Math.max(0, (newPlayer.money || 0) + effect.money);
      if (effect.fSkill) newPlayer.fSkill = Math.max(0, Math.min(1000, (newPlayer.fSkill || 0) + effect.fSkill));
      if (effect.mSkill) newPlayer.mSkill = Math.max(0, Math.min(1000, (newPlayer.mSkill || 0) + effect.mSkill));
      if (effect.popularity) newPlayer.popularity = Math.max(0, Math.min(1000, (newPlayer.popularity || 0) + effect.popularity));
      if (effect.reputation) newPlayer.reputation = Math.max(-1000, Math.min(1000, (newPlayer.reputation || 0) + effect.reputation));
      if (effect.tired) newPlayer.tired = Math.max(0, Math.min(100, (newPlayer.tired || 0) + effect.tired));

      // register multi-day effects
      const newEffects = Array.isArray(newPlayer.effects) ? [...newPlayer.effects] : [];
      if (effect.trainingEfficiencyMult && effect.trainingEfficiencyDays) {
        // prevent multiplicative stacking: extend existing similar effect instead of stacking
        const existingIdx = newEffects.findIndex((e: any) => typeof e.trainingEfficiencyMult === 'number');
        if (existingIdx >= 0) {
          const ex = { ...newEffects[existingIdx] };
          ex.expiresAbsDay = Math.max(ex.expiresAbsDay || 0, absDay + effect.trainingEfficiencyDays);
          // keep the stronger multiplier
          ex.trainingEfficiencyMult = Math.max(ex.trainingEfficiencyMult || 1, effect.trainingEfficiencyMult);
          newEffects[existingIdx] = ex;
        } else {
          newEffects.push({ id: `ef_${Date.now()}`, label: sourceLabel || 'Р­С„С„РµРєС‚', type: (effect.trainingEfficiencyMult > 1 ? 'positive' : 'negative'), trainingEfficiencyMult: effect.trainingEfficiencyMult, expiresAbsDay: absDay + effect.trainingEfficiencyDays });
        }
      }
      if (effect.dailyTiredDelta) {
        // e.g. support friend: tired reduces by 2 per day for N days
        const days = effect.dailyTiredDays || effect.trainingEfficiencyDays || 7;
        const existingIdx = newEffects.findIndex((e: any) => typeof e.dailyTiredDelta === 'number');
        if (existingIdx >= 0) {
          const ex = { ...newEffects[existingIdx] };
          ex.expiresAbsDay = Math.max(ex.expiresAbsDay || 0, absDay + days);
          ex.dailyTiredDelta = Math.max(ex.dailyTiredDelta || 0, effect.dailyTiredDelta);
          newEffects[existingIdx] = ex;
        } else {
          newEffects.push({ id: `ef_${Date.now()}_daily`, label: sourceLabel || 'Р•Р¶РµРґРЅРµРІРЅС‹Р№ СЌС„С„РµРєС‚', type: (effect.dailyTiredDelta < 0 ? 'positive' : 'negative'), dailyTiredDelta: effect.dailyTiredDelta, expiresAbsDay: absDay + days });
        }
      }

      if (effect.trainingCostMultiplier && effect.trainingCostDays) {
        const existingIdx = newEffects.findIndex((e: any) => typeof e.trainingCostMultiplier === 'number');
        if (existingIdx >= 0) {
          const ex = { ...newEffects[existingIdx] };
          ex.expiresAbsDay = Math.max(ex.expiresAbsDay || 0, absDay + effect.trainingCostDays);
          ex.trainingCostMultiplier = effect.trainingCostMultiplier;
          newEffects[existingIdx] = ex;
        } else {
          newEffects.push({ id: `ef_${Date.now()}_cost`, label: sourceLabel || 'Р¦РµРЅР° С‚СЂРµРЅРёСЂРѕРІРєРё', type: 'neutral', trainingCostMultiplier: effect.trainingCostMultiplier, expiresAbsDay: absDay + effect.trainingCostDays });
        }
      }

      // Support project/invite rejection chance effects
      if (typeof effect.projectRejectChanceAdd === 'number' && effect.projectRejectDays) {
        const existingIdx = newEffects.findIndex((e: any) => typeof e.projectRejectChanceAdd === 'number');
        if (existingIdx >= 0) {
          const ex = { ...newEffects[existingIdx] };
          ex.expiresAbsDay = Math.max(ex.expiresAbsDay || 0, absDay + effect.projectRejectDays);
          ex.projectRejectChanceAdd = Math.max(ex.projectRejectChanceAdd || 0, effect.projectRejectChanceAdd);
          newEffects[existingIdx] = ex;
        } else {
          newEffects.push({ id: `ef_${Date.now()}_rej`, label: sourceLabel || 'Р‘РµР·РѕС‚РІРµС‚СЃС‚РІРµРЅРЅС‹Р№', type: 'negative', projectRejectChanceAdd: effect.projectRejectChanceAdd, expiresAbsDay: absDay + effect.projectRejectDays });
        }
      }

      // Create visual effect tags for positive/negative events (show for 7 days)
      // Determine if this is a positive or negative event based on effect values
      const hasPositiveEffect = (effect.money && effect.money > 0) || 
                                (effect.popularity && effect.popularity > 0) || 
                                (effect.reputation && effect.reputation > 0) || 
                                (effect.fSkill && effect.fSkill > 0) || 
                                (effect.mSkill && effect.mSkill > 0) ||
                                (effect.tired && effect.tired < 0);
      const hasNegativeEffect = (effect.money && effect.money < 0) || 
                                (effect.popularity && effect.popularity < 0) || 
                                (effect.reputation && effect.reputation < 0) || 
                                (effect.fSkill && effect.fSkill < 0) || 
                                (effect.mSkill && effect.mSkill < 0) ||
                                (effect.tired && effect.tired > 0);
      
      // Check for special events (inspiration, friend support) even if they don't have direct stat changes
      const isInspiration = sourceLabel && sourceLabel.toLowerCase().includes('вдохнов');
      const isFriendSupport = sourceLabel && (sourceLabel.toLowerCase().includes('друг') || sourceLabel.toLowerCase().includes('support'));
      const isSpecialEvent = isInspiration || isFriendSupport;
      
      if (((hasPositiveEffect || hasNegativeEffect) || isSpecialEvent) && sourceLabel && !sourceLabel.includes('Статистика')) {
        const effectType = hasPositiveEffect && !hasNegativeEffect ? 'positive' : hasNegativeEffect && !hasPositiveEffect ? 'negative' : 'neutral';
        if (effectType === 'neutral' && !isInspiration && !isFriendSupport) {
          // do not create a tag for other neutral events
        } else {
          let eventTagLabel = sourceLabel.length > 20 ? sourceLabel.substring(0, 20) + '...' : sourceLabel;
          // For inspiration and friend support, use a clear label
          if (isInspiration) eventTagLabel = 'Вдохновение';
          if (isFriendSupport) eventTagLabel = 'Поддержка друга';
          const existingIdx = newEffects.findIndex((e: any) => e.label === eventTagLabel && e.isEventTag);
          if (existingIdx >= 0) {
            const ex = { ...newEffects[existingIdx] };
            ex.expiresAbsDay = Math.max(ex.expiresAbsDay || 0, absDay + 7);
            newEffects[existingIdx] = ex;
          } else {
            newEffects.push({ 
              id: `ef_${Date.now()}_tag`, 
              label: eventTagLabel, 
              type: isInspiration || isFriendSupport ? 'positive' : effectType, 
              isEventTag: true,
              expiresAbsDay: absDay + 7 
            });
          }
        }
      }

      // teamJoin handled directly via joinTeam in UI/event handling; do not create a persistent effect entry.

      if (newEffects.length > 0) newPlayer.effects = newEffects;

      return { ...prev, player: newPlayer };
    });

    if (effect && typeof effect.money === 'number' && effect.money < 0) {
      const s = (sourceLabel || '').toLowerCase();
      let cat = 'event';
      if (s.includes('РјР°СЃС‚РµСЂ')) cat = 'masterclass';
      else if (s.includes('С‚СЂРµРЅ') || s.includes('С‚СЂРµРЅРёСЂРѕРІРєР°')) cat = 'training';
      else if (s.includes('РєРѕСЃС‚СЋРј') || s.includes('РєРѕСЃС‚СЋ')) cat = 'costume';
      recordExpense && recordExpense(sourceLabel || 'РЎРѕР±С‹С‚РёРµ', Math.abs(effect.money), cat);
    }

    // Handle immediate non-player effects (project cancellation etc.) outside state update
    if (effect && effect.projectCancelled && effect.projectId) {
      const projectId = effect.projectId as string;
      const proj = activeProjects.find(p => p.id === projectId);
      // Если проект уже завершён и неактивен, отмену не выполняем
      if (!proj) return;
      // Если проект уже завершён успешно, отмену не выполняем
      if (proj.success) return;
      const failed = { ...proj, completedDate: Date.now(), success: false, likes: 0, dislikes: 0, comments: [], cancelledByEvent: true } as Project;

      // Update activeProjects to remove cancelled project
      setActiveProjects(prev => prev.filter(p => p.id !== projectId));

      // Update completedProjects with cancelled project (separate setState)
      setCompletedProjects(prevC => {
        const toAdd = [failed].filter(f => !prevC.some(p => p.id === f.id));
        const updated = [...prevC, ...toAdd];
        localStorage.setItem('completedProjects', JSON.stringify(updated));
        return updated;
      });

      // Show a single project-cancellation event popup
      try {
        showEventIfIdle && showEventIfIdle({ id: `project_cancelled_${Date.now()}`, type: 'bad', title: 'Отмена проекта', text: `Проект "${proj.name}" отменён: вы не посещали занятия и прогресс потерян.`, effect: {} });
      } catch (e) {
        // ignore if showEventIfIdle not available
      }
    }
  };

  
  // Add a completed project programmatically (used for collabs)
  const addCompletedProject = (project: Project) => {
    // Если проект успешный и нет комментариев — сгенерировать их
    let completed = { ...project };
    if (completed.success && (!Array.isArray(completed.comments) || completed.comments.length === 0)) {
      const playerPop = stateRef.current.player.popularity || 0;
      const playerRep = stateRef.current.player.reputation || 0;
      const commentsCount = Math.max(3, Math.floor(playerPop / 10));
      const positivePhrases = [
        'Очень красиво получилось', 'Мне прям понравилось', 'Классный кавер!', 'Вы большие молодцы', 'Приятное исполнение'
      ];
      const negativePhrases = [
        'Что-то вообще мимо ритма.', 'Ужасно не технично.', 'Никакой энергии', 'Очень слабая работа', 'Неаккуратно и неровно'
      ];
      const basePositiveChance = Math.max(0.05, Math.min(0.95, 0.5 + (playerRep / 200)));
      const costumeMatch = (completed as any).costumeMatchPercent || 0;
      let costumeMultiplier = 1.0;
      if (costumeMatch >= 81) costumeMultiplier = 1.1;
      else if (costumeMatch >= 51 && costumeMatch < 81) costumeMultiplier = 0.9;
      let comments: any[] = [];
      
      // Добавить мнение лидера о костюме если оно есть
      const costumeOpinion = (completed as any).costumeOpinion;
      if (costumeOpinion) {
        const isPositiveOpinion = costumeMatch >= 51;
        comments.push({ text: costumeOpinion, likes: isPositiveOpinion ? 5 : 2, positive: isPositiveOpinion, fromLeader: true });
      }
      
      // Сгенерировать остальные комментарии (но не больше чем нужно)
      const remainingComments = Math.max(0, commentsCount - comments.length);
      for (let i = 0; i < remainingComments; i++) {
        const commentPositiveChance = basePositiveChance * costumeMultiplier;
        const isPositive = Math.random() < commentPositiveChance;
        const text = (isPositive ? positivePhrases : negativePhrases)[Math.floor(Math.random() * (isPositive ? positivePhrases.length : negativePhrases.length))];
        let baseLikes = isPositive ? Math.round(1 + Math.random() * 10) : Math.round(Math.random() * 3);
        let finalLikes = baseLikes;
        if (costumeMatch >= 81 && isPositive) finalLikes = Math.round(baseLikes * 1.1);
        else if (costumeMatch >= 51 && costumeMatch < 81 && !isPositive) finalLikes = Math.round(baseLikes * 1.1);
        comments.push({ text, likes: finalLikes, positive: isPositive });
      }
      comments = comments.filter((c, i, arr) => arr.findIndex(x => x.text === c.text) === i);
      completed = { ...completed, comments };
    }
    setCompletedProjects(prev => {
      if (prev.some(p => p.id === completed.id)) return prev;
      const updated = [...prev, completed];
      localStorage.setItem('completedProjects', JSON.stringify(updated));
      return updated;
    });
    setRecentCompleted(completed);
  };

  // Add relationship points to NPC
  const addRelationshipPoints = (npcId: string, points: number) => {
    setNpcs(prev =>
      prev.map(npc => {
        if (npc.id !== npcId) return npc;
        const current = npc.relationshipPoints || 0;
        let newPoints = Math.max(0, Math.min(100, current + points));
        let minLocked = !!npc.minAcquaintanceLocked;
        let enemyBadge = !!npc.enemyBadge;

        // If we increase and cross acquaintance threshold, lock minimum
        if (!minLocked && newPoints >= 11) {
          minLocked = true;
        }

        // If we are decreasing and a min-lock exists, do not allow numeric descent below acquaintance
        if (points < 0 && minLocked && newPoints < 11) {
          // Keep numeric value at acquaintance floor but mark enemy badge
          newPoints = 11;
          enemyBadge = true;
        }

        return { ...npc, relationshipPoints: newPoints, minAcquaintanceLocked: minLocked, enemyBadge } as any;
      })
    );
  };

  // Simple shop implementation: tonic item
  const buyItem = (itemKey: string, qty: number = 1) => {
    // Only support 'tonic' for now
    if (itemKey !== 'tonic') return false;
    const PRICE = 300;
    // Check weekly purchase limit (5)
    const purchases = state.player.shopPurchasesThisWeek || 0;
    if (purchases + qty > 5) return false;
    const totalCost = PRICE * qty;
    if ((state.player.money || 0) < totalCost) return false;
    // Deduct money and add to inventory
    setState(prev => {
      const inv = Array.isArray(prev.player.inventory) ? [...prev.player.inventory] : [];
      const existing = inv.find((it: any) => it.key === 'tonic');
      if (existing) existing.count = (existing.count || 0) + qty;
      else inv.push({ id: `tonic_${Date.now()}`, key: 'tonic', name: 'РўРѕРЅРёРє', count: qty });
      return { ...prev, player: { ...prev.player, money: (prev.player.money || 0) - totalCost, inventory: inv, shopPurchasesThisWeek: (prev.player.shopPurchasesThisWeek || 0) + qty } };
    });
    // Record expense
    try { recordExpense && recordExpense(`РўРѕРІР°СЂС‹: РўРѕРЅРёРє`, totalCost, 'item'); } catch (e) {
      // ignore
    }
    return true;
  };

  const useItem = (itemKey: string) => {
    if (itemKey !== 'tonic') return false;
    // usage limit: 1 per week
    if ((state.player.shopUsesThisWeek || 0) >= 1) return false;
    // check inventory
    const inv = Array.isArray(state.player.inventory) ? [...state.player.inventory] : [];
    const existing = inv.find((it: any) => it.key === 'tonic');
    if (!existing || (existing.count || 0) <= 0) return false;
    // consume one
    setState(prev => {
      const newInv = (prev.player.inventory || []).map((it: any) => it.key === 'tonic' ? { ...it, count: (it.count || 0) - 1 } : it).filter((it: any) => it.count > 0);
      const newTired = Math.max(0, (prev.player.tired || 0) - 10);
      return { ...prev, player: { ...prev.player, inventory: newInv, shopUsesThisWeek: (prev.player.shopUsesThisWeek || 0) + 1, tired: newTired } };
    });
    return true;
  };

  const buyGift = (giftId: string, qty: number = 1) => {
    // Gift items are renewable (not one-time like clothes)
    const giftMeta = GIFTS.find(g => g.id === giftId);
    if (!giftMeta) return false;
    
    // Get gift price from catalog
    const giftItem = CLOTHES_CATALOG.find((c: any) => c.id === giftId);
    const price = giftItem?.price || 0;
    if (price <= 0) return false;
    
    const totalCost = price * qty;
    if ((state.player.money || 0) < totalCost) return false;
    
    // Deduct money and add to inventory (gifts are stackable like tonics)
    setState(prev => {
      const inv = Array.isArray(prev.player.inventory) ? [...prev.player.inventory] : [];
      const existing = inv.find((it: any) => it.key === giftId);
      if (existing) {
        existing.count = (existing.count || 0) + qty;
      } else {
        inv.push({ id: `gift_${giftId}_${Date.now()}`, key: giftId, name: giftMeta.name, count: qty });
      }
      return { 
        ...prev, 
        player: { 
          ...prev.player, 
          money: (prev.player.money || 0) - totalCost, 
          inventory: inv, 
          shopPurchasesThisWeek: (prev.player.shopPurchasesThisWeek || 0) + qty 
        } 
      };
    });
    
    // Record expense
    try { recordExpense && recordExpense(`Товары: ${giftMeta.name}`, totalCost, 'item'); } catch (e) {
      // ignore
    }
    return true;
  };

  const addTeamProject = (project: any) => {
    if (!project) return;
    // Ensure unique id and add to active projects
    setActiveProjects(prev => {
      if (prev.some(p => p.id === project.id)) return prev;
      const updated = [...prev, { ...project }];
      localStorage.setItem('activeProjects', JSON.stringify(updated));
      return updated;
    });
  };

  const removeEffect = (effectId: string) => {
    setState(prev => {
      const newPlayer = { ...prev.player } as any;
      if (Array.isArray(newPlayer.effects)) newPlayer.effects = newPlayer.effects.filter((ef: any) => ef.id !== effectId);
      return { ...prev, player: newPlayer };
    });
  };

  const joinTeam = (teamId: string) => {
    // Prevent joining if team already at max size
    const targetTeamNow = teams.find(t => t.id === teamId);
    if (targetTeamNow && targetTeamNow.memberIds && targetTeamNow.memberIds.length >= 20) {
      try { showEventIfIdle && showEventIfIdle({ id: `team_full_${teamId}_${Date.now()}`, type: 'info', title: 'РљРѕРјР°РЅРґР° Р·Р°РїРѕР»РЅРµРЅР°', text: 'Р­С‚Р° РєРѕРјР°РЅРґР° СѓР¶Рµ РґРѕСЃС‚РёРіР»Р° РјР°РєСЃРёРјР°Р»СЊРЅРѕРіРѕ СЂР°Р·РјРµСЂР°.' }); } catch (e) {}
      return;
    }

    // Store team info before state update
    const teamToJoin = targetTeamNow;

    setTeams((prev: Team[]) => {
      // remove from previous team if exists
      const updated = prev.map((t: Team) => {
        if (t.memberIds.includes(state.player.id)) {
          return { ...t, memberIds: t.memberIds.filter((id: string) => id !== state.player.id) };
        }
        return t;
      });
      // add to new team
      const updated2 = updated.map((t: Team) => t.id === teamId ? { ...t, memberIds: Array.from(new Set([...t.memberIds, state.player.id])) } : t);
      // schedule first team project offer 2-10 days after joining per spec
        try {
        const DAYS_PER_MONTH = 30;
        const MONTHS_PER_YEAR = 12;
        const absDay = state.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + state.gameTime.month * DAYS_PER_MONTH + state.gameTime.day;
        const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        const result = updated2.map(t => {
          if (t.id === teamId) {
            return { ...t, nextTeamProjectOfferAbsDay: absDay + randInt(2, 10) } as any;
          }
          return t;
        });
        // Do not persist teams to localStorage вЂ” teams reset on page load per spec
        return result;
      } catch (e) {
        // Do not persist teams to localStorage вЂ” return updated state
        return updated2;
      }
    });
    const absDay = state.gameTime.year * 12 * 30 + state.gameTime.month * 30 + state.gameTime.day;
    setState(prev => {
      const currentHistory = (prev.player as any).teamJoinHistory || [];
      // Only add to history if not already there (don't duplicate if switching teams)
      const newHistory = currentHistory.includes(teamId) ? currentHistory : [...currentHistory, teamId];
      return { ...prev, player: { ...prev.player, teamId, lastTeamJoinAbsDay: absDay, teamJoinHistory: newHistory } };
    });
    // Add +7 relationship points with each team member when player joins
    if (teamToJoin && teamToJoin.memberIds) {
      teamToJoin.memberIds.forEach(memberId => {
        if (memberId !== state.player.id) {
          try { addRelationshipPoints && addRelationshipPoints(memberId, 7); } catch (e) { }
        }
      });
    }
  };

  const leaveTeam = () => {
    setTeams((prev: Team[]) => {
      const updated = prev.map((t: Team) => {
        if (t.memberIds.includes(state.player.id)) {
          const newMemberIds = t.memberIds.filter((id: string) => id !== state.player.id);
          // If the leaving player was the leader, reassign leader using new rules
          let newLeaderId = t.leaderId;
          if (t.leaderId === state.player.id) {
            newLeaderId = determineTeamLeader(newMemberIds, npcs || []);
          }

          return { ...t, memberIds: newMemberIds, leaderId: newLeaderId } as Team;
        }
        return t;
      });

      // Disband teams with fewer than 3 members; clear teamId for those members
      const toDisband = updated.filter(t => (t.memberIds || []).length > 0 && (t.memberIds || []).length < 3);
      if (toDisband.length > 0) {
        const disbandedIds = new Set<string>(toDisband.flatMap(t => t.memberIds || []));
        setNpcs(prevNpcs => prevNpcs.map(n => disbandedIds.has(n.id) ? { ...n, teamId: null } : n));
      }

      const filtered = updated.filter(t => (t.memberIds || []).length >= 3);
      return filtered;
    });
    setState(prev => ({ ...prev, player: { ...prev.player, teamId: null, lastTeamJoinAbsDay: -1 } }));
  };

  // Send application to a team (player -> team). The team will respond within 1-7 game days.
  const sendTeamApplication = (teamId: string) => {
    try {
      const DAYS_PER_MONTH = 30;
      const MONTHS_PER_YEAR = 12;
      const absDay = state.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + state.gameTime.month * DAYS_PER_MONTH + state.gameTime.day;
      const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      const reviewAbsDay = absDay + randInt(1, 7);
      const team = teams.find(t => t.id === teamId);
      console.log(`[Team Application Sent] teamId=${teamId}, absDay=${absDay}, reviewAbsDay=${reviewAbsDay}`);
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, pendingApplication: { playerId: state.player.id, appliedAbsDay: absDay, reviewAbsDay } as any } : t));
      // Add to queuedApplications so the response will be processed and routed to inbox (messenger)
      const newApp = { id: `app_${Date.now()}_${teamId}`, teamId, appliedAbsDay: absDay, reviewAbsDay, teamName: team?.name || 'Team', leaderId: team?.leaderId || '', attempted: false } as any;
      setQueuedApplications(prev => [newApp, ...prev]);
      // Ensure team leader appears in contacts by marking as acquaintance
      if (team?.leaderId) {
        setNpcs(prev => prev.map(n => n.id === team.leaderId ? { ...n, relationship: n.relationship === 'friend' ? 'friend' : 'acquaintance' } : n));
      }
      // Add a message to inbox showing the player sent the application
      const applicationMsg = {
        id: `app_sent_${Date.now()}`,
        type: 'message',
        npcId: team?.leaderId,
        senderId: state.player.id,
        text: `Отправил заявку в команду ${team?.name || 'Team'}`,
        absDay: absDay,
        read: true,
        teamId: teamId
      };
      setInbox(prev => [applicationMsg, ...prev]);
      // Sync update to ref to ensure updateGameTime can access it immediately
      queuedApplicationsRef.current = [newApp, ...(queuedApplicationsRef.current || [])];
      // Immediate lightweight feedback (non-blocking)
      try {
        showEventIfIdle && showEventIfIdle({ id: `application_sent_${Date.now()}`, type: 'info', title: 'Заявка отправлена', text: 'Заявка принята системой. Ответ придёт в мессенджер в течение 7 игровых дней.' });
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.error('[Team Application Error]', e);
      // ignore
    }
  };

  // Р”РІРёР¶РµРЅРёРµ РІСЂРµРјРµРЅРё РєР°Р¶РґСѓСЋ СЃРµРєСѓРЅРґСѓ (РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ СЃРєРѕСЂРѕСЃС‚Рё)
  // Движение времени каждую секунду (в зависимости от скорости)
  useEffect(() => {
    // The game is paused if either manual pause OR modal pause is active
    // Check BOTH state and ref to account for async setState delays
    const isModalPausedNow = modalPauseRef.current || state.isModalPaused;
    const isShouldPause = state.isPaused || isModalPausedNow || !state.gameStarted;
    if (isShouldPause) {
      if (isModalPausedNow) {
        console.log('[GameTimer] ⏸️ MODAL PAUSE ACTIVE - modalPauseRef.current:', modalPauseRef.current, 'state.isModalPaused:', state.isModalPaused);
      }
      if (state.isPaused) {
        console.log('[GameTimer] ⏸️ MANUAL PAUSE ACTIVE');
      }
      if (!state.gameStarted) {
        console.log('[GameTimer] ⏸️ GAME NOT STARTED YET');
      }
      return;
    }

    // РРЅС‚РµСЂРІР°Р»С‹: 1x = 1 СЃРµРє Р·Р° РґРµРЅСЊ, 2x = 0.5 СЃРµРє, 5x = 0.2 СЃРµРє, 10x = 0.1 СЃРµРє
    const intervals = { 1: 1000, 2: 500, 5: 200, 10: 100 };
    const interval = intervals[state.timeSpeed] || 100;

    const DAYS_PER_MONTH = 30; // Fixed 30 days per month for absolute day calculations
    const MONTHS_PER_YEAR = 12;

    const timer = setInterval(() => {
      // Check if paused EVERY INTERVAL TICK (synchronously with ref)
      if (stateRef.current.isPaused || modalPauseRef.current || stateRef.current.isModalPaused || !stateRef.current.gameStarted) {
        console.log('[GameTimer] Interval tick - paused, skipping time advance');
        return;
      }

      // advance game time
      let newDay = state.gameTime.day + 1;
      let newMonth = state.gameTime.month;
      let newYear = state.gameTime.year;

      // when day reaches the max days in current month, wrap to 0 and increment month
      const daysInCurrentMonth = getDaysInMonth(newMonth + 1); // +1 because getDaysInMonth uses 1-indexed months
      if (newDay >= daysInCurrentMonth) {
        newDay = 0;
        newMonth = state.gameTime.month + 1;
        if (newMonth >= MONTHS_PER_YEAR) {
          newMonth = 0;
          newYear = state.gameTime.year + 1;
        }
      }
      
      // Calculate newAbsDay for this iteration (before setState is processed)
      const newAbsDay = newYear * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + newMonth * DAYS_PER_MONTH + newDay;
      newAbsDayRef.current = newAbsDay;

      setState(prev => {
        let newDay = prev.gameTime.day + 1;
        let newMonth = prev.gameTime.month;
        let newYear = prev.gameTime.year;

        // when day reaches the max days in current month, wrap to 0 and increment month
        const daysInCurrentMonth = getDaysInMonth(newMonth + 1); // +1 because getDaysInMonth uses 1-indexed months
        if (newDay >= daysInCurrentMonth) {
          newDay = 0;
          newMonth = prev.gameTime.month + 1;
          if (newMonth >= MONTHS_PER_YEAR) {
            newMonth = 0;
            newYear = prev.gameTime.year + 1;
          }
        }

        const newWeek = Math.floor(newDay / 7);

        // compute absolute day (year * 360 + month * 30 + day)
        const newAbsDay = newYear * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + newMonth * DAYS_PER_MONTH + newDay;
        const prevAbsDay = prev.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + prev.gameTime.month * DAYS_PER_MONTH + prev.gameTime.day;

        // Check if game has ended (Year 5, Month 0, Day 0)
        if (newYear >= 5 && newMonth === 0 && newDay === 0 && !gameEnded) {
          setGameEnded(true);
        }

        // skill decay: if player hasn't trained recently, reduce skills but not below quality tier lower bound
        const tierLower = (skill: number) => {
          if (skill >= 85) return 85; // Pro lower bound
          if (skill >= 31) return 31; // Middle lower bound
          return 0; // Beginner lower bound
        };

        const updatedPlayer: any = { ...prev.player };
        // spawn +5 new projects every 3 weeks (21 days)
        if (newAbsDay % 21 === 0 && newAbsDay !== prevAbsDay % 21) {
          setAvailableProjects(prevProj => {
            const newProjects = projectGenerator.generateAvailableProjects(5, updatedPlayer as any);
            // Add weeksAddedAbsDay to each new project
            const withTimestamp = newProjects.map(p => ({ ...p, weeksAddedAbsDay: newAbsDay } as any));

            // РџСЂРѕРІРµСЂРєР° РёСЃС‡РµР·РЅРѕРІРµРЅРёСЏ РїСЂРѕРµРєС‚РѕРІ: РµСЃР»Рё РёРіСЂРѕРє РёС… РЅРµ РїСЂРёРЅСЏР»
            const filtered = prevProj.filter((p: any) => {
              if (!p.weeksAddedAbsDay) return true; // СЃС‚Р°СЂС‹Рµ РїСЂРѕРµРєС‚С‹ Р±РµР· timestamp - РЅРµ С‚СЂРѕРіР°РµРј
              const weeksSinceAdded = Math.floor((newAbsDay - p.weeksAddedAbsDay) / 7);

              if (weeksSinceAdded < 3) return true; // РїРµСЂРІС‹Рµ 3 РЅРµРґРµР»Рё - РЅРµ СѓРґР°Р»СЏРµРј
              if (weeksSinceAdded === 3 && Math.random() < 0.8) return false; // 80% РёСЃС‡РµР·Р°СЋС‚ РЅР° РЅРµРґРµР»Рµ 3
              if (weeksSinceAdded === 4 && Math.random() < 0.9) return false; // 90% РёСЃС‡РµР·Р°СЋС‚ РЅР° РЅРµРґРµР»Рµ 4
              if (weeksSinceAdded >= 5) return false; // 100% РёСЃС‡РµР·Р°СЋС‚ РЅР° РЅРµРґРµР»Рµ 5+

              return true;
            });

            // Filter out duplicates to avoid project duplication
            const toAdd = withTimestamp.filter(np => !filtered.some(p => p.id === np.id));
            const updatedProj = [...filtered, ...toAdd];
            localStorage.setItem('availableProjects', JSON.stringify(updatedProj));
            return updatedProj;
          });
        }

        // reset weekly training counters when week changes
        if (newWeek !== prev.gameTime.week) {
                updatedPlayer.fTrainingsThisWeek = 0;
                updatedPlayer.mTrainingsThisWeek = 0;
                // reset weekly shop counters
                updatedPlayer.shopPurchasesThisWeek = 0;
                updatedPlayer.shopUsesThisWeek = 0;
        }

        // Monthly salary: add 15000 every month on day 0
        if (newDay === 0 && prev.gameTime.day !== 0) {
          updatedPlayer.money = (updatedPlayer.money || 0) + 15000;
        }
        const lastTrained = (prev.player.lastTrainedAbsDay ?? -1);
        const daysSinceTraining = lastTrained >= 0 ? newAbsDay - lastTrained : newAbsDay;

        // Reduce tired by 1 each day if not training today
        if (daysSinceTraining > 0) {
          updatedPlayer.tired = Math.max(0, updatedPlayer.tired - 1);
        }

        // small daily decay before a year, ensure not below tier lower bound; after a year allow to decay to 0
        const decayPerDay = 0.05; // small decay per day

        if (daysSinceTraining > 0) {
          // F skill
          if (daysSinceTraining < (MONTHS_PER_YEAR * DAYS_PER_MONTH)) {
            const lower = tierLower(updatedPlayer.fSkill);
            updatedPlayer.fSkill = Math.max(lower, Math.max(0, Math.round((updatedPlayer.fSkill - decayPerDay) * 100) / 100));
            const lowerM = tierLower(updatedPlayer.mSkill);
            updatedPlayer.mSkill = Math.max(lowerM, Math.max(0, Math.round((updatedPlayer.mSkill - decayPerDay) * 100) / 100));
          } else {
            // after 1 year of no training, allow decay toward 0
            updatedPlayer.fSkill = Math.max(0, Math.round((updatedPlayer.fSkill - decayPerDay) * 100) / 100);
            updatedPlayer.mSkill = Math.max(0, Math.round((updatedPlayer.mSkill - decayPerDay) * 100) / 100);
          }
        }

        // remove expired effects (by absolute day) and apply daily deltas
        if (updatedPlayer.effects && Array.isArray(updatedPlayer.effects)) {
          updatedPlayer.effects = updatedPlayer.effects.filter((ef: any) => {
            if (!ef.expiresAbsDay) return true;
            return ef.expiresAbsDay >= newAbsDay;
          });
          // apply daily tired deltas from active effects
          updatedPlayer.effects.forEach((ef: any) => {
            if (ef.dailyTiredDelta) {
              updatedPlayer.tired = Math.max(0, Math.min(100, (updatedPlayer.tired || 0) + ef.dailyTiredDelta));
            }
          });
        }

        // determine today's trained styles and update consecutive counters + monthly decay
        const todayStyles = prev.todayTrainedStyles || [];
        const trainedF = todayStyles.includes('F');
        const trainedM = todayStyles.includes('M');

        // update consecutive-only counters
        if (trainedF && !trainedM) {
          updatedPlayer.consecutiveOnlyFDays = (prev.player.consecutiveOnlyFDays || 0) + 1;
          updatedPlayer.consecutiveOnlyMDays = 0;
        } else if (trainedM && !trainedF) {
          updatedPlayer.consecutiveOnlyMDays = (prev.player.consecutiveOnlyMDays || 0) + 1;
          updatedPlayer.consecutiveOnlyFDays = 0;
        } else {
          // either both styles trained today or none -> reset both consecutive-only counters
          updatedPlayer.consecutiveOnlyFDays = 0;
          updatedPlayer.consecutiveOnlyMDays = 0;
        }

        // Apply monthly decay if month just advanced (once per month)
        if (newDay === 0 && prev.gameTime.day !== 0) {
          if ((prev.player.consecutiveOnlyFDays || 0) >= 30) {
            updatedPlayer.mSkill = Math.max(0, Math.round(updatedPlayer.mSkill * 0.9 * 100) / 100);
          }
          if ((prev.player.consecutiveOnlyMDays || 0) >= 30) {
            updatedPlayer.fSkill = Math.max(0, Math.round(updatedPlayer.fSkill * 0.9 * 100) / 100);
          }
        }

        // Schedule end-of-game if we reached Year 5 Month 0 Day 0
        endGamePendingRef.current = (newYear === 5 && newMonth === 0 && newDay === 0);

        return {
          ...prev,
          player: updatedPlayer,
          gameTime: { day: newDay, week: newWeek, month: newMonth, year: newYear },
          todayParticipants: [], // reset daily participants each day
          todayTrainedStyles: [] // reset today's trained styles
        };
      });

      // If end game was scheduled inside state update, trigger end sequence (show results and stop the game)
      if (endGamePendingRef.current) {
        endGamePendingRef.current = false;
        // compute simple summary
        try {
          const successCount = (completedProjects || []).filter(p => p.success).length;
          const failCount = (completedProjects || []).filter(p => !p.success).length;
          // stop the game
          setState(prev => ({ ...prev, gameStarted: false }));
          showEventIfIdle && showEventIfIdle({ id: `game_end_${Date.now()}`, type: 'info', title: 'РС‚РѕРіРё РёРіСЂС‹', text: `РС‚РѕРіРё РёРіСЂС‹: СѓСЃРїРµС€РЅС‹С… РїСЂРѕРµРєС‚РѕРІ: ${successCount}, СЃСЂС‹РІРѕРІ: ${failCount}. РџРѕРїСѓР»СЏСЂРЅРѕСЃС‚СЊ: ${Math.round(stateRef.current.player.popularity || 0)}, СЂРµРїСѓС‚Р°С†РёСЏ: ${Math.round(stateRef.current.player.reputation || 0)}.` });
        } catch (e) {
          // ignore summary errors
        }
      }

      // update project progress once per day and accumulate tired from project trainings
      setActiveProjects(prevProjects => {
        const remaining: Project[] = [];
        const newlyCompleted: Project[] = [];
        const newlyFailed: Project[] = [];
        let totalEffectiveTrainingsToday = 0;
        let moneyToDeduct = 0;
        const nextAbsDayGuess = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day + 1;
        const weekday = (stateRef.current.gameTime.day + 1) % 7;
        const overloaded = prevProjects.filter(p => (((p.baseTraining || 0) + (p.extraTraining || 0)) >= 3)).length >= 2;
        const isRestDay = overloaded && weekday === REST_DAY_INDEX;
        prevProjects.forEach(p => {
          const base = (p.baseTraining || 0) + (p.extraTraining || 0);
          const newDaysActive = (p.daysActive || 0) + 1;

          const maxWeeks = Math.max(1, (p.durationWeeks || 1));
          const maxDays = maxWeeks * 7;
          if (newDaysActive > maxDays) {
            const failed = { ...p, daysActive: newDaysActive, progress: (p.progress || 0), success: false, failedDueToDeadline: true } as Project;
            newlyFailed.push(failed);
            if (acceptedSinceFailureRef.current >= 7) {
              applyEffect({ reputation: -5, projectRejectChanceAdd: 0.3, projectRejectDays: 15 }, 'Безответственный');
              acceptedSinceFailureRef.current = 0;
            }
            return;
          }

          if (base <= 0 || !p.trainingNeeded || (p.progress || 0) >= 100) {
            remaining.push({ ...p, daysActive: newDaysActive });
            return;
          }

          // If project is already marked as needing manual funding, skip auto-processing
          // Only fundProjectTraining() can resume training for this project
          if ((p as any).needsFunding) {
            remaining.push({ ...p, daysActive: newDaysActive });
            return;
          }

          const dailyTrainings = base / 7;
          const efficiency = computeTrainingEfficiency(stateRef.current.player);
          const dailyTrainingCost = (p.trainingCost || 0) * dailyTrainings;
          const playerMoney = stateRef.current.player.money || 0;
          if (playerMoney < dailyTrainingCost && base > 0 && !isRestDay) {
            // Only show error once - not every day
            if (!(p as any).fundingErrorShown) {
              try { showEventIfIdle && showEventIfIdle({ id: `training_pay_fail_${Date.now()}`, type: 'bad', title: 'Ошибка', text: 'Недостаточно денег для оплаты тренировок по проекту.' }); } catch (e) { /* ignore */ }
            }
            remaining.push({ ...p, daysActive: newDaysActive, needsFunding: true, fundingErrorShown: true } as any);
            return;
          }
          const effectiveDailyTrainings = isRestDay ? 0 : dailyTrainings * efficiency;
          totalEffectiveTrainingsToday += effectiveDailyTrainings;
          const newTrainingsCompleted = (p.trainingsCompleted || 0) + effectiveDailyTrainings;
          const trainingNeeded = Math.max(1, p.trainingNeeded || 1);
          const newProgress = Math.min(100, (newTrainingsCompleted / trainingNeeded) * 100);
          let projectUpdated: Project | null = null;

          if (newProgress >= 50 && !(p as any).costumePaid) {
            // Show costume selection modal EACH TIME progress reaches 50% (allow re-selection if not locked)
            if (!(p as any).costumeLocked) {
              projectUpdated = { ...p, daysActive: newDaysActive, trainingsCompleted: newTrainingsCompleted, progress: newProgress } as Project;
              try { 
                setPendingCostumeSelection(p.id);
                setModalPause(true);
              } catch (e) { /* ignore */ }
            } else {
              projectUpdated = { ...p, daysActive: newDaysActive, trainingsCompleted: newTrainingsCompleted, progress: newProgress } as Project;
            }
          } else if (projectUpdated === null) {
            projectUpdated = { ...p, daysActive: newDaysActive, trainingsCompleted: newTrainingsCompleted, progress: newProgress, needsFunding: false };
          }

          const requiresCostume = (p as any).costumeCost && (p as any).costumeCost > 0;
          const wasPaid = (projectUpdated ? (projectUpdated as any).costumePaid : (p as any).costumePaid) || false;

          if (newProgress >= 100) {
            if (requiresCostume && !wasPaid) {
              const failed = { ...p, daysActive: newDaysActive, progress: 100, success: false } as Project;
              newlyFailed.push(failed);
              if (acceptedSinceFailureRef.current >= 7) {
                applyEffect({ reputation: -5, projectRejectChanceAdd: 0.3, projectRejectDays: 15 }, 'Безответственный');
                acceptedSinceFailureRef.current = 0;
              }
            } else {
              const playerAvgSkill = Math.round(((state.player.fSkill || 50) + (state.player.mSkill || 50)) / 2);
              const requiredSkill = p.minSkillRequired || 50;
              const skillGap = requiredSkill - playerAvgSkill;
              let successChance = 0.95;
              if (skillGap > 20) {
                successChance *= 0.7;
              } else if (skillGap > 10) {
                successChance *= 0.85;
              } else if (skillGap > 0) {
                successChance *= 0.95;
              }
              const projectSuccess = Math.random() < successChance;
              if (!projectSuccess) {
                const failed = { ...p, daysActive: newDaysActive, progress: 100, success: false, failedDueToSkillGap: true, skillGap } as Project;
                newlyFailed.push(failed);
                if (skillGap > 20 && acceptedSinceFailureRef.current >= 7) {
                  applyEffect({ reputation: -8, fSkill: Math.round(skillGap * 0.1), mSkill: Math.round(skillGap * 0.1) }, 'Недостаточные навыки');
                  acceptedSinceFailureRef.current = 0;
                }
              } else {
                // Generate comments for this successful project
                const playerPop = stateRef.current.player.popularity || 0;
                const playerRep = stateRef.current.player.reputation || 0;
                const commentsCount = Math.max(3, Math.floor(Math.max(playerPop, 30) / 10));

                const positivePhrases = [
                  'Очень красиво получилось', 'Мне прям понравилось', 'Классный кавер!', 'Вы большие молодцы', 'Приятное исполнение'
                ];
                const negativePhrases = [
                  'Что-то вообще мимо ритма.', 'Ужасно не технично.', 'Никакой энергии', 'Очень слабая работа', 'Неаккуратно и неровно'
                ];

                const basePositiveChance = Math.max(0.05, Math.min(0.95, 0.5 + (playerRep / 200)));
                let comments: any[] = [];
                for (let i = 0; i < commentsCount; i++) {
                  const isPositive = Math.random() < basePositiveChance;
                  const text = (isPositive ? positivePhrases : negativePhrases)[Math.floor(Math.random() * (isPositive ? positivePhrases.length : negativePhrases.length))];
                  const baseLikes = isPositive ? Math.round(1 + Math.random() * 10) : Math.round(Math.random() * 3);
                  comments.push({ text, likes: baseLikes, positive: isPositive });
                }
                // Ensure comments are unique by text
                comments = comments.filter((c, i, arr) => arr.findIndex(x => x.text === c.text) === i);
                
                // Guarantee at least 3 comments even if all were duplicates
                while (comments.length < 3) {
                  const phrases = comments.length === 0 || Math.random() < 0.5 ? positivePhrases : negativePhrases;
                  const text = phrases[Math.floor(Math.random() * phrases.length)];
                  if (!comments.some(c => c.text === text)) {
                    comments.push({ 
                      text, 
                      likes: comments.length === 0 ? 5 : Math.round(Math.random() * 8),
                      positive: comments.length === 0 || Math.random() < 0.6
                    });
                  }
                }
                
                const completed = {
                  ...p,
                  daysActive: newDaysActive,
                  progress: 100,
                  completedDate: Date.now(),
                  success: true,
                  likes: Math.round(10 + Math.random() * 90),
                  dislikes: Math.round(Math.random() * 20),
                  comments,
                  // Сохранить мнение лидера о костюме
                  costumeOpinion: (p as any).costumeOpinion,
                  costumeMatchPercent: (p as any).costumeMatchPercent,
                } as Project;
                newlyCompleted.push(completed);
              }
            }
          } else {
            remaining.push(projectUpdated || { ...p, daysActive: newDaysActive, trainingsCompleted: newTrainingsCompleted, progress: newProgress });
          }
        });

        if (moneyToDeduct > 0) {
          setState(prev => ({ ...prev, player: { ...prev.player, money: Math.max(0, (prev.player.money || 0) - moneyToDeduct) } }));
        }

        if (isRestDay) {
          setState(prev => ({ ...prev, player: { ...prev.player, tired: Math.max(0, (prev.player.tired || 0) - 5) } }));
        } else if (totalEffectiveTrainingsToday > 0) {
          setState(prev => ({ ...prev, player: { ...prev.player, tired: Math.min(100, (prev.player.tired || 0) + Math.round(totalEffectiveTrainingsToday * TRAINING_TIRED_GAIN * 100) / 100 + prevProjects.length) } }));
        }

        if (newlyCompleted.length > 0) {
          setCompletedProjects(prev => {
            const toAdd = newlyCompleted.filter(nc => !prev.some(p => p.id === nc.id));
            const updated = [...prev, ...toAdd];
            localStorage.setItem('completedProjects', JSON.stringify(updated));
            return updated;
          });
          setRecentCompleted(newlyCompleted[0]);
          const absDayNow = state.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + state.gameTime.month * DAYS_PER_MONTH + state.gameTime.day;
          setState(prev => ({ ...prev, player: { ...prev.player, postedCover: true, lastPostedAbsDay: absDayNow } }));
          const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
          const popGain = randInt(20, 80);
          const repGain = randInt(10, 40);
          setState(prev => ({ ...prev, player: { ...prev.player, popularity: Math.min(1000, (prev.player.popularity || 0) + popGain), reputation: Math.max(-1000, Math.min(1000, (prev.player.reputation || 0) + repGain)) } }));
          setAvailableProjects(prev => {
            const newProjects = projectGenerator.generateAvailableProjects(Math.max(3, 20 - prev.length), stateRef.current.player as any);
            const toAdd = newProjects.filter(np => !prev.some(p => p.id === np.id));
            const updated = [...prev, ...toAdd];
            localStorage.setItem('availableProjects', JSON.stringify(updated));
            return updated;
          });
        }

        if (newlyFailed.length > 0) {
          const failedCompleted = newlyFailed.map(f => {
            return { ...f, completedDate: Date.now(), success: false, likes: 0, dislikes: 0, comments: [] } as Project;
          });

          try {
            const totalRefund = failedCompleted.reduce((sum, fc) => {
              const saved = (fc as any).costumeSavedMoney || 0;
              const paid = (fc as any).costumePaid;
              return sum + ((saved && !paid) ? saved : 0);
            }, 0);
            if (totalRefund > 0) {
              setState(prev => ({ ...prev, player: { ...prev.player, money: (prev.player.money || 0) + totalRefund } }));
            }
          } catch (e) { /* ignore */ }

          setCompletedProjects(prev => {
            const toAdd = failedCompleted.filter(fc => !prev.some(p => p.id === fc.id));
            const updated = [...prev, ...toAdd];
            localStorage.setItem('completedProjects', JSON.stringify(updated));
            return updated;
          });

          if (newlyCompleted.length === 0 && failedCompleted.length > 0) {
            try {
              const f = failedCompleted[0];
              setRecentCompleted && setRecentCompleted(f);
            } catch (e) {
              // ignore
            }
          }
        }

        return remaining;
      });

      // Generate random events
      // Use player's authoritative team id (avoid false positives when member arrays are inconsistent)
      const playerTeam = teams.find(t => t.id === stateRef.current.player.teamId) || null;
      const randomEvent = eventGenerator.generateRandomEvent(stateRef.current, activeProjects, completedProjects, npcs, playerTeam, teams);
      if (randomEvent) {
        // show event only when no other popup is open
        showEventIfIdle(randomEvent);
      }

      // Process queued team applications and collab proposals that are ready for response
      // After advancing time, process queued team applications whose review day has arrived
      try {
        const DAYS_PER_MONTH = 30;
        const MONTHS_PER_YEAR = 12;
        const processAbsDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;
        
        // Find applications ready for review (use ref for latest values)
        const readyApps = queuedApplicationsRef.current.filter(q => q.reviewAbsDay <= processAbsDay);
        if (readyApps.length > 0) {
          readyApps.forEach(app => {
            const team = teams.find(t => t.id === app.teamId);
            if (!team) return;
            // determine required comparison skill for team's dominant style
            const teamAvg = (team as any).avgDominant ?? (team as any).teamSkill ?? 50;
            const domStyle = (team as any).dominantStyle || 'Both';
            const playerSkillForComparison = domStyle === 'F_style' ? stateRef.current.player.fSkill : domStyle === 'M_style' ? stateRef.current.player.mSkill : Math.round(((stateRef.current.player.fSkill || 0) + (stateRef.current.player.mSkill || 0)) / 2);
            const diff = teamAvg - playerSkillForComparison;
            const accepted = !(diff > 18);
            if (accepted) {
              // join the team
              try { joinTeam && joinTeam(team.id); } catch (e) { /* ignore */ }
              // Route the response as coming from the team's leader so it appears under that NPC in messenger
              setInbox(prev => [{ id: `app_res_${Date.now()}`, type: 'team_application', teamId: team.id, accepted: true, text: `Р'Р°С€Р° Р·Р°СЏРІРєР° РІ РєРѕРјР°РЅРґСѓ ${team.name} РїСЂРёРЅСЏС‚Р°!`, npcId: team.leaderId, senderId: team.leaderId, absDay: processAbsDay, read: false }, ...prev]);
            } else {
              setInbox(prev => [{ id: `app_res_${Date.now()}`, type: 'team_application', teamId: team.id, accepted: false, text: `Р'Р°С€Р° Р·Р°СЏРІРєР° РІ РєРѕРјР°РЅРґСѓ ${team.name} РѕС‚РєР»РѕРЅРµРЅР°.`, npcId: team.leaderId, senderId: team.leaderId, absDay: processAbsDay, read: false }, ...prev]);
            }
          });
          // remove processed
          setQueuedApplications(prev => prev.filter(q => q.reviewAbsDay > processAbsDay));
          // Clear pendingApplication flags on teams that were processed
          const cleared = teams.map(t => readyApps.some((r: any) => r.teamId === t.id) ? { ...t, pendingApplication: undefined } : t);
          setTeams(cleared);
        }
      } catch (e) {
        // ignore processing errors
      }

      // Process queued collab proposals whose respond day has arrived
      try {
        const DAYS_PER_MONTH = 30;
        const MONTHS_PER_YEAR = 12;
        const processAbsDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;
        console.log(`[Collab Proposal Processing] processAbsDay=${processAbsDay}, queuedCount=${queuedCollabProposalsRef.current.length}`);
        // find proposals ready for response
        const ready = queuedCollabProposalsRef.current.filter(q => q.respondAbsDay <= processAbsDay && !q.attempted);
        console.log(`[Collab Proposal Processing] ready=${ready.length}, ready:`, ready.map(r => ({ id: r.id, respondAbsDay: r.respondAbsDay, attempted: r.attempted })));
        if (ready.length > 0) {
          const inboxMessages: any[] = [];
          ready.forEach(proposal => {
            const npc = npcsRef.current.find(n => n.id === proposal.npcId);
            // Use NPC data if found, otherwise use fallback name from payload
            const npcName = npc?.name || proposal.payload?.npcName || 'NPC';
            const behaviorModel = npc?.behaviorModel || 'Machine';
            
            // Calculate days elapsed since proposal sent
            const daysElapsed = processAbsDay - proposal.createdAbsDay;
            // Probability model: 70% in days 1-5, 50% in days 6-10, 30% in days 11-15, 10% in days 16-20
            let acceptanceChance = 0;
            if (daysElapsed <= 5) acceptanceChance = 0.7;
            else if (daysElapsed <= 10) acceptanceChance = 0.5;
            else if (daysElapsed <= 15) acceptanceChance = 0.3;
            else acceptanceChance = 0.1;
            
            const accepted = Math.random() < acceptanceChance;
            const message = accepted
              ? (npc ? getNpcPhrase(npc.behaviorModel, 'collab_accept') : null) || `${npcName} согласился на совместный проект!`
              : (npc ? getNpcPhrase(npc.behaviorModel, 'collab_decline') : null) || `${npcName} отказался от совместного проекта.`;
            
            // Collect response message for batch addition
            inboxMessages.push({
              id: `collab_res_${proposal.id}`,
              type: 'collab_response',
              npcId: proposal.npcId,
              senderId: proposal.npcId,
              text: message,
              accepted,
              absDay: processAbsDay,
              read: false
            });
          });
          // Apply all messages at once
          if (inboxMessages.length > 0) {
            console.log(`[Collab Proposal Processing] Adding ${inboxMessages.length} messages to inbox`);
            setInbox(prev => [...inboxMessages, ...prev]);
          }
          // Mark proposals as attempted (so we don't re-process them)
          const updated = queuedCollabProposalsRef.current.map(q => ready.some(r => r.id === q.id) ? { ...q, attempted: true } : q);
          queuedCollabProposalsRef.current = updated;
          setQueuedCollabProposals(updated);
        }
      } catch (e) {
        // ignore processing errors
      }

    }, interval);

    return () => clearInterval(timer);
  }, [state.isPaused, state.isModalPaused, state.gameStarted, state.timeSpeed]);

  // РЎРѕС…СЂР°РЅРµРЅРёРµ РїСЂРё РёР·РјРµРЅРµРЅРёРё СЃРѕСЃС‚РѕСЏРЅРёСЏ
  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(state));
    // Do not persist NPCs and teams across page reloads вЂ” game should reset these on start
    localStorage.setItem('availableProjects', JSON.stringify(availableProjects));
    localStorage.setItem('activeProjects', JSON.stringify(activeProjects));
    // NOTE: completedProjects is NOT persisted to ensure fresh game state on reload
  }, [state, npcs, teams, availableProjects, activeProjects]);

  // Apply monthly NPC behavior updates (per РўР— models in newtz) and recalc teams
  const prevMonthRef = React.useRef<{ month: number; year: number } | null>(null);
  useEffect(() => {
    const curMonth = state.gameTime.month;
    const curYear = state.gameTime.year;
    const prev = prevMonthRef.current;
    if (!prev || prev.month !== curMonth || prev.year !== curYear) {
      // month advanced -> apply monthly updates
      // (only apply when prev exists to avoid applying on initial load)
      if (prev) {
        // Add 1 new NPC every month (12 NPCs per year growth)
        setNpcs(prevNpcs => {
          const generator = new NPCGenerator();
          // compute next index based on existing numeric suffixes
          const numericIndexes = prevNpcs.map(n => {
            const m = (n.id || '').match(/npc_(\d+)$/);
            return m ? parseInt(m[1], 10) : null;
          }).filter(x => x !== null) as number[];
          const nextIndex = numericIndexes.length > 0 ? Math.max(...numericIndexes) + 1 : prevNpcs.length;
          const npc = generator.generateNPC(nextIndex);
          // Ensure unique id
          npc.id = `npc_${nextIndex}_${Date.now().toString().slice(-4)}_${Math.floor(Math.random() * 1000)}`;
          return [...prevNpcs, npc];
        });

        // Add 1 new team with constraints:
        // - Not more than once every 3 months (90 days)
        // - Not less than once every 8 months (240 days)
        // - This means teams can form at random intervals between 90-240 days
        setTeams(prevTeams => {
          try {
            const DAYS_PER_MONTH = 30;
            const MONTHS_PER_YEAR = 12;
            const absDay = curYear * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + curMonth * DAYS_PER_MONTH;
            
            // Check when was the last team created
            const lastCreatedTeam = prevTeams
              .filter(t => typeof (t as any).createdAbsDay === 'number')
              .reduce((latest, t) => {
                const createdAbsDay = (t as any).createdAbsDay as number;
                const latestAbsDay = (latest as any).createdAbsDay as number;
                return createdAbsDay > latestAbsDay ? t : latest;
              }, null as Team | null);
            
            const lastTeamCreationAbsDay = lastCreatedTeam ? ((lastCreatedTeam as any).createdAbsDay as number) : -9999;
            const daysSinceLastTeamCreation = absDay - lastTeamCreationAbsDay;
            
            // Constraints for team formation (per newtz.txt specification):
            // - Not more frequent than every 3 months (90 days): daysSinceLastTeamCreation >= 90
            // - Not less frequent than every 8 months (240 days): ensure we have mechanism to create if 240 days passed
            
            const MIN_DAYS_BETWEEN_TEAMS = 90; // 3 months
            const MAX_DAYS_WITHOUT_TEAM = 240; // 8 months - if this much time passed, force create
            
            let shouldCreateTeam = false;
            
            if (daysSinceLastTeamCreation < MIN_DAYS_BETWEEN_TEAMS) {
              // Too soon - don't create
              shouldCreateTeam = false;
            } else if (daysSinceLastTeamCreation >= MAX_DAYS_WITHOUT_TEAM) {
              // Too long without a team - force create
              shouldCreateTeam = true;
            } else if (daysSinceLastTeamCreation >= MIN_DAYS_BETWEEN_TEAMS) {
              // In the safe zone (90-240 days) - create with randomness to avoid predictability
              // Use 25% chance per month in this zone to spread out team formations
              shouldCreateTeam = Math.random() < 0.25;
            }
            
            if (!shouldCreateTeam) {
              return prevTeams;
            }
            
            const allNpcs = (npcs || []).slice();
            
            // Only create ONE new team, not regenerate all teams
            // This preserves old teams' popularity and stability
            const teamCount = prevTeams.length + 1;
            let maxNames = TEAM_NAMES.length || 1000;
            if (teamCount > maxNames) {
              // Max teams reached
              return prevTeams;
            }
            
            // Get NPCs already in teams
            const usedNpcIds = new Set<string>(prevTeams.flatMap(t => t.memberIds));
            
            // Get NPCs not yet in teams
            const availableNpcs = allNpcs.filter(npc => !usedNpcIds.has(npc.id));
            
            // If not enough NPCs for a new team, skip
            if (availableNpcs.length < 3) {
              return prevTeams;
            }
            
            // Generate just ONE new team with the new NPC and some available ones
            const teamGen = new TeamGenerator();
            const newTeams = teamGen.generateTeams(availableNpcs, 1);
            
            if (newTeams.length === 0) {
              return prevTeams;
            }
            
            // Add the new team to existing teams
            // Adjust the new team's ID to not conflict with existing ones
            const newTeam = newTeams[0];
            const nextTeamId = prevTeams.length;
            newTeam.id = `team_${nextTeamId}`;
            (newTeam as any).createdAbsDay = absDay; // Track when this team was created
            
            // Update NPC teamIds for the new team
            newTeam.memberIds.forEach(npcId => {
              const npc = allNpcs.find(n => n.id === npcId);
              if (npc) npc.teamId = newTeam.id;
            });
            
            return [...prevTeams, newTeam];
          } catch (e) {
            return prevTeams;
          }
        });
      }

      setNpcs(prevNpcs => {
          const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
          const absDay = curYear * (12 * 30) + curMonth * 30;

          // NPC Team Switching: Every 60 days (2 months), 30% chance NPC switches teams
          let updated = prevNpcs.map(npc => {
            const copy = { ...npc } as any;
            const lastTeamChangeAbsDay = copy.lastTeamChangeAbsDay ?? -999;
            const daysSinceChange = absDay - lastTeamChangeAbsDay;

            // Check if 60+ days passed and random chance triggers (30%)
            if (daysSinceChange >= 60 && Math.random() < 0.3) {
              // Find all compatible teams
              const compatibleTeams = teams.filter(team => {
                const teamStyle = team.dominantStyle || 'Both';
                const npcStyle = copy.favoriteStyle || 'Both';

                // Check compatibility
                if (teamStyle === 'Both' || npcStyle === 'Both') return true;
                return teamStyle === npcStyle;
              });

              // Switch to random compatible team
              if (compatibleTeams.length > 0) {
                const newTeam = compatibleTeams[Math.floor(Math.random() * compatibleTeams.length)];
                copy.teamId = newTeam.id;
                copy.lastTeamChangeAbsDay = absDay;
              }
            }

            return copy;
          });

          // Apply monthly NPC behavior updates
          updated = updated.map(npc => {
            const copy = { ...npc } as any;
            switch (copy.behaviorModel) {
              case 'Burner':
                copy.fSkill = Math.min(1000, copy.fSkill + rng(40, 80));
                copy.mSkill = Math.min(1000, copy.mSkill + rng(40, 80));
                copy.popularity = Math.min(1000, copy.popularity + rng(0, 20));
                copy.reputation = Math.max(-1000, Math.min(1000, copy.reputation + rng(10, 30)));
                break;
              case 'Dreamer':
                copy.fSkill = Math.max(0, Math.min(1000, copy.fSkill + rng(-30, 100)));
                copy.mSkill = Math.max(0, Math.min(1000, copy.mSkill + rng(-30, 100)));
                copy.popularity = Math.max(0, Math.min(1000, copy.popularity + rng(-20, 60)));
                copy.reputation = Math.max(-1000, Math.min(1000, copy.reputation + rng(-30, 40)));
                break;
              case 'Perfectionist':
                copy.fSkill = Math.min(1000, copy.fSkill + rng(20, 40));
                copy.mSkill = Math.min(1000, copy.mSkill + rng(20, 40));
                copy.popularity = Math.max(0, Math.min(1000, copy.popularity + rng(-20, 10)));
                copy.reputation = Math.max(-1000, Math.min(1000, copy.reputation + rng(-50, 60)));
                break;
              case 'Sunshine':
                copy.fSkill = Math.min(1000, copy.fSkill + rng(10, 30));
                copy.mSkill = Math.min(1000, copy.mSkill + rng(10, 30));
                copy.popularity = Math.min(1000, copy.popularity + rng(40, 100));
                copy.reputation = Math.max(-1000, Math.min(1000, copy.reputation + rng(30, 80)));
                break;
              case 'Machine':
                copy.fSkill = Math.min(1000, copy.fSkill + rng(30, 60));
                copy.mSkill = Math.min(1000, copy.mSkill + rng(30, 60));
                copy.popularity = Math.max(0, Math.min(1000, copy.popularity + rng(-10, 10)));
                copy.reputation = Math.max(-1000, Math.min(1000, copy.reputation + rng(10, 30)));
                break;
              case 'Wildcard':
                copy.fSkill = Math.max(0, Math.min(1000, copy.fSkill + rng(-60, 120)));
                copy.mSkill = Math.max(0, Math.min(1000, copy.mSkill + rng(-60, 120)));
                copy.popularity = Math.max(0, Math.min(1000, copy.popularity + rng(-200, 200)));
                copy.reputation = Math.max(-1000, Math.min(1000, copy.reputation + rng(-150, 150)));
                break;
              case 'Fox':
                copy.fSkill = Math.max(0, Math.min(1000, copy.fSkill + rng(-10, 20)));
                copy.mSkill = Math.max(0, Math.min(1000, copy.mSkill + rng(-10, 20)));
                copy.popularity = Math.min(1000, copy.popularity + rng(50, 180));
                copy.reputation = Math.max(-1000, Math.min(1000, copy.reputation + rng(-80, 40)));
                break;
              case 'SilentPro':
                copy.fSkill = Math.min(1000, copy.fSkill + rng(30, 70));
                copy.mSkill = Math.min(1000, copy.mSkill + rng(30, 70));
                copy.popularity = Math.min(1000, copy.popularity + rng(0, 20));
                copy.reputation = Math.max(-1000, Math.min(1000, copy.reputation + rng(10, 40)));
                break;
            }
            return copy;
          });

          return updated;
        });

      // After NPC update, recalc teams based on new npc stats
      setTeams(prevTeams => {
          const absDay = curYear * (12 * 30) + curMonth * 30;
          const updatedTeams = prevTeams.map(t => {
          const members = t.memberIds.map((id: string) => npcs.find(n => n.id === id)).filter(Boolean) as any[];
          // compute dominant value per member (max of fSkill/mSkill)
          const memberDominants = members.length > 0 ? members.map(m => ({ val: Math.max(m.fSkill || 0, m.mSkill || 0), style: (m.fSkill || 0) > (m.mSkill || 0) ? 'F_style' : (m.mSkill || 0) > (m.fSkill || 0) ? 'M_style' : 'Both' })) : [];
          const avgDominant = memberDominants.length > 0 ? Math.round(memberDominants.reduce((s, md) => s + md.val, 0) / memberDominants.length) : 0;
          const styleCounts = memberDominants.reduce((acc: any, md: any) => { acc[md.style] = (acc[md.style] || 0) + 1; return acc; }, { F_style: 0, M_style: 0, Both: 0 });
          let dominantStyle: 'F_style' | 'M_style' | 'Both' = 'Both';
          if (styleCounts.F_style > styleCounts.M_style && styleCounts.F_style >= styleCounts.Both) dominantStyle = 'F_style';
          else if (styleCounts.M_style > styleCounts.F_style && styleCounts.M_style >= styleCounts.Both) dominantStyle = 'M_style';

          // Check if dominant style changed and enough time passed (180 days = 6 months)
          const oldDominantStyle = t.dominantStyle;
          const lastChangeAbsDay = t.lastDominantStyleChangeAbsDay ?? -99999;
          const monthsPassed = (absDay - lastChangeAbsDay) >= 180;

          let styleChanged = false;
          if (oldDominantStyle && oldDominantStyle !== dominantStyle && monthsPassed) {
            styleChanged = true;
          }

          const teamPopularity = members.length > 0 ? Math.round(members.reduce((s, m) => s + m.popularity, 0) / members.length) : 0;
          const teamSkill = avgDominant;
          const teamLevel: 'Новичок' | 'Мидл' | 'Топ' = teamSkill <= 30 ? 'Новичок' : teamSkill <= 70 ? 'Мидл' : 'Топ';
          const teamRating = Math.round(teamSkill * 0.7 + teamPopularity * 0.3);

          const result = { ...t, teamSkill, popularity: teamPopularity, teamLevel, teamRating, dominantStyle, avgDominant } as any;

          // Update lastDominantStyleChangeAbsDay if style changed
          if (styleChanged) {
            result.lastDominantStyleChangeAbsDay = absDay;
          } else if (!t.lastDominantStyleChangeAbsDay) {
            // Initialize on first calculation
            result.lastDominantStyleChangeAbsDay = absDay;
          }
          return result;
        });
        
        // Do not persist NPCs and teams to localStorage вЂ” game should reset on reload
        // If any team's dominant style changed and player is a member, show popup (only when change allowed by yearsPassed)
        try {
          const absDay = curYear * (12 * 30) + curMonth * 30;
          const changed = updatedTeams.filter((ut, idx) => {
            const old = prevTeams[idx];
            if (!old) return false;
            const lastChange = old.lastDominantStyleChangeAbsDay ?? -99999;
            const yearsPassedLocal = (absDay - lastChange) >= 360;
            return old.dominantStyle !== ut.dominantStyle && yearsPassedLocal;
          });
          changed.forEach((ct: any) => {
            if (ct.memberIds && ct.memberIds.includes(state.player.id)) {
              const styleMap: any = { 'F_style': 'Р–РµРЅСЃРєРёР№', 'M_style': 'РњСѓР¶СЃРєРѕР№', 'Both': 'РЈРЅРёРІРµСЂСЃР°Р»С‹' };
              // Show team style change event immediately (not waiting for idle) - only once per change per absDay
              const eventId = `team_style_change_${ct.id}_${absDay}`;
              setRecentEvent && setRecentEvent({ id: eventId, type: 'info', title: 'РљРѕРјР°РЅРґР° РёР·РјРµРЅРёР»Р° СЃС‚РёР»СЊ', text: `Р’Р°С€Р° РєРѕРјР°РЅРґР° ${ct.name} СЃРјРµРЅРёР»Р° РґРѕРјРёРЅРёСЂСѓСЋС‰РёР№ СЃС‚РёР»СЊ РЅР°: ${styleMap[ct.dominantStyle] || ct.dominantStyle}`, effect: {} });
            }
          });
        } catch (e) {
          // ignore
        }
        return updatedTeams;
      });
      prevMonthRef.current = { month: curMonth, year: curYear };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameTime.month, state.gameTime.year]);

  const updatePlayer = (updates: Partial<PlayerCharacter>) => {
    setState(prev => {
      const prevPlayer = prev.player;
      const newPlayer = { ...prevPlayer, ...updates } as any;
      // compute absDay for tracking recent positive popularity
      const DAYS_PER_MONTH = 30;
      const MONTHS_PER_YEAR = 12;
      const absDay = prev.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + prev.gameTime.month * DAYS_PER_MONTH + prev.gameTime.day;
      // If popularity increased, record the day
      if ((newPlayer.popularity || 0) > (prevPlayer.popularity || 0)) {
        newPlayer.lastPositivePopAbsDay = absDay;
      }
      return {
        ...prev,
        player: newPlayer
      };
    });
  };

  // Process a collab acceptance (called when player accepts collab in EventModal)
  const processCollabAccept = (params: { npcId: string; requiredSkillType: 'F_skill' | 'M_skill'; requiredSkill: number; npcName?: string }) => {
    const npc = npcs.find(n => n.id === params.npcId);
    const playerSkill = params.requiredSkillType === 'F_skill' ? (state.player.fSkill || 0) : (state.player.mSkill || 0);
    let success = false;
    if (playerSkill >= params.requiredSkill) {
      success = true;
    } else {
      const rep = state.player.reputation || 0;
      const chance = Math.max(5, Math.min(95, 50 + Math.round(rep)));
      success = Math.random() * 100 < chance;
    }

    if (success) {
      // Gains on success
      const popGain = Math.max(1, Math.round(5 + (npc?.popularity || 0) * 0.03));
      const repGain = Math.max(1, Math.round(2 + (npc?.reputation || 0) * 0.02));
      // apply immediate changes
      updatePlayer({ popularity: Math.min(100, (state.player.popularity || 0) + popGain), reputation: Math.max(-100, Math.min(100, (state.player.reputation || 0) + repGain)) });
      // create joint cover project and add to completedProjects (history)
      const proj: Project = {
        id: `collab_${Date.now()}_${params.npcId}`,
        name: `РљРѕР»Р»Р°Р±: ${params.npcName || npc?.name || 'NPC'}`,
        type: 'group',
        isTeamProject: false,
        requiredSkill: params.requiredSkillType,
        minSkillRequired: params.requiredSkill,
        trainingNeeded: 0,
        trainingsCompleted: 0,
        duration: 'fast',
        durationWeeks: 0,
        trainingCost: 0,
        costumeCost: 0,
        progress: 100,
        baseTraining: 0,
        extraTraining: 0,
        daysActive: 0,
        completedDate: Date.now(),
        success: true,
        reputationChange: repGain,
        likes: Math.round(10 + Math.random() * 60)
      };
      try { addCompletedProject(proj); } catch (e) { /* ignore */ }

      // update npc counters and relationship points
      if (npc) {
        setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, jointProjectsCount: (n.jointProjectsCount || 0) + 1, metEvents: Array.from(new Set([...(n.metEvents || []), 'collab'])) } : n));
        // Add relationship points for successful collab
        if (addRelationshipPoints) addRelationshipPoints(npc.id, 10);
      }

      // Show success popup
      try {
        showEventIfIdle && showEventIfIdle({ id: `collab_result_${Date.now()}`, type: 'good', title: `РЈСЃРїРµС€РЅР°СЏ РєРѕР»Р»Р°Р± СЃ ${params.npcName || npc?.name || 'NPC'}`, text: `РљРѕР»Р»Р°Р± РїСЂРѕС€С‘Р» СѓСЃРїРµС€РЅРѕ! +${popGain} РїРѕРїСѓР»СЏСЂРЅРѕСЃС‚Рё, +${repGain} СЂРµРїСѓС‚Р°С†РёРё.`, effect: { popularity: popGain, reputation: repGain }, npcId: params.npcId });
      } catch (e) { }
    } else {
      const repLoss = Math.max(1, Math.round(3 + Math.random() * 4));
      updatePlayer({ reputation: Math.max(-100, Math.min(100, (state.player.reputation || 0) - repLoss)) });
      // update npc metEvents
      if (npc) {
        setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, metEvents: Array.from(new Set([...(n.metEvents || []), 'collab'])) } : n));
      }
      try {
        showEventIfIdle && showEventIfIdle({ id: `collab_result_${Date.now()}`, type: 'bad', title: `РљРѕР»Р»Р°Р± СЃ ${params.npcName || npc?.name || 'NPC'} РїСЂРѕРІР°Р»РµРЅ`, text: `РљРѕР»Р»Р°Р± РЅРµ СѓРґР°Р»СЃСЏ. Р РµРїСѓС‚Р°С†РёСЏ СѓРјРµРЅСЊС€РёР»Р°СЃСЊ РЅР° ${repLoss}.`, effect: { reputation: -repLoss }, npcId: params.npcId });
      } catch (e) { }
    }
  };

  const processCollabReject = (collabMessageId: string, npcId: string, npcName: string) => {
    // When player rejects a collab offer, apply -3 reputation penalty
    // Get the message to check if it's expired
    const message = inbox.find(m => m.id === collabMessageId);
    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;
    const currentAbsDay = state.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + state.gameTime.month * DAYS_PER_MONTH + state.gameTime.day;
    const isExpired = message && message.expiresAbsDay && currentAbsDay >= message.expiresAbsDay;
    
    if (isExpired) {
      // If expired, just mark as read without penalty
      setInbox(prev => prev.map(m => m.id === collabMessageId ? { ...m, read: true } : m));
      return;
    }
    
    const repLoss = 3;
    updatePlayer({ reputation: Math.max(-100, Math.min(100, (state.player.reputation || 0) - repLoss)) });
    
    // Mark message as read
    setInbox(prev => prev.map(m => m.id === collabMessageId ? { ...m, read: true } : m));
    
    try {
      showEventIfIdle && showEventIfIdle({ 
        id: `collab_reject_${Date.now()}`, 
        type: 'bad', 
        title: `РћС‚РєР°Р· РѕС‚ РєРѕР»Р»Р°Р±Р° СЃ ${npcName}`, 
        text: `Р’С‹ РѕС‚РєР°Р·Р°Р»Рё ${npcName}. Р РµРїСѓС‚Р°С†РёСЏ СѓРјРµРЅСЊС€РёР»Р°СЃСЊ РЅР° ${repLoss}.`, 
        effect: { reputation: -repLoss }, 
        npcId: npcId 
      });
    } catch (e) { }

    // Send a brief NPC follow-up reaction message (use localized phrase map)
    try {
      const npcObj = npcs.find(n => n.id === npcId);
      const npcReply = npcObj ? getNpcPhrase(npcObj.behaviorModel, 'post_decline_reaction') : '';
      if (npcReply) {
        setInbox(prev => [{ id: `post_decline_${Date.now()}`, type: 'message', npcId, senderId: npcId, text: npcReply, absDay: currentAbsDay, read: false }, ...prev]);
      }
    } catch (e) { /* ignore */ }
  };

  // Handle team invitation accept from messenger
  const processTeamInvitationAccept = (messageId: string, teamId: string) => {
    // Accept the team invitation
    joinTeam(teamId);
    
    // Mark message as read
    setInbox(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
    
    // Show confirmation event
    const team = teams.find((t: any) => t.id === teamId);
    if (team) {
      try {
        showEventIfIdle && showEventIfIdle({
          id: `team_join_${Date.now()}`,
          type: 'good',
          title: `РџСЂРёСЃРѕРµРґРёРЅРёР»РёСЃСЊ Рє РєРѕРјР°РЅРґРµ ${team.name}`,
          text: `Р’С‹ СѓСЃРїРµС€РЅРѕ РїСЂРёСЃРѕРµРґРёРЅРёР»РёСЃСЊ Рє РєРѕРјР°РЅРґРµ ${team.name}!`,
          effect: {}
        });
      } catch (e) { }
    }
  };

  // Handle team invitation reject from messenger
  const processTeamInvitationReject = (messageId: string, teamId: string) => {
    const team = teams.find((t: any) => t.id === teamId);
    
    // Mark message as read
    setInbox(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
    
    // Increment refusal count for this team
    setTeams(prev => prev.map(t => 
      t.id === teamId 
        ? { ...t, inviteRefusalCount: (t.inviteRefusalCount || 0) + 1 }
        : t
    ));
    
    // Show notification
    if (team) {
      try {
        showEventIfIdle && showEventIfIdle({
          id: `team_reject_${Date.now()}`,
          type: 'info',
          title: `РћС‚РєР°Р·Р°РЅРѕ РєРѕРјР°РЅРґРµ ${team.name}`,
          text: `Р’С‹ РѕС‚РєР°Р·Р°Р»Рё РєРѕРјР°РЅРґРµ ${team.name}.`,
          effect: {}
        });
      } catch (e) { }
    }
  };

  // Handle team project offer accept from messenger
  const processTeamProjectAccept = (messageId: string, teamId: string, teamProjectData: any) => {
    // Mark message as read
    setInbox(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
    
    // Add project to active projects
    const team = teams.find((t: any) => t.id === teamId);
    if (team && teamProjectData) {
      try {
        addTeamProject && addTeamProject(teamProjectData);
        showEventIfIdle && showEventIfIdle({
          id: `team_project_accept_${Date.now()}`,
          type: 'good',
          title: `РџСЂРёРЅСЏС‚ РєРѕРјР°РЅРґРЅС‹Р№ РїСЂРѕРµРєС‚`,
          text: `Р’С‹ РїСЂРёРЅСЏР»(Р°) РєРѕРјР°РЅРґРЅС‹Р№ РїСЂРѕРµРєС‚ "${teamProjectData.name}".`,
          effect: {}
        });
      } catch (e) { }
    }
  };

  // Handle team project offer reject from messenger
  const processTeamProjectReject = (messageId: string, teamId: string) => {
    const team = teams.find((t: any) => t.id === teamId);
    
    // Mark message as read
    setInbox(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
    
    // Increment project refusal count
    setTeams(prev => prev.map(t =>
      t.id === teamId
        ? { ...t, projectRefusalCount: (t.projectRefusalCount || 0) + 1 }
        : t
    ));
    
    // Show notification
    if (team) {
      try {
        showEventIfIdle && showEventIfIdle({
          id: `team_project_reject_${Date.now()}`,
          type: 'info',
          title: `РћС‚РєР°Р·Р°РЅРѕ РєРѕРјР°РЅРґРЅРѕРјСѓ РїСЂРѕРµРєС‚Сѓ`,
          text: `Р’С‹ РѕС‚РєР°Р·Р°Р»Рё РєРѕРјР°РЅРґРЅРѕРјСѓ РїСЂРѕРµРєС‚Сѓ РєРѕРјР°РЅРґС‹ ${team.name}.`,
          effect: {}
        });
      } catch (e) { }
    }
  };

  const addPlayerMoney = (amount: number) => {
    if (amount <= 0) return;
    setState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        money: (prev.player.money || 0) + amount
      }
    }));
  };

  const updateGameTime = () => {
    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;

    setState(prev => {
      let newDay = prev.gameTime.day + 1;
      let newMonth = prev.gameTime.month;
      let newYear = prev.gameTime.year;

      if (newDay >= DAYS_PER_MONTH) {
        newDay = 0;
        newMonth = prev.gameTime.month + 1;
        if (newMonth >= MONTHS_PER_YEAR) {
          newMonth = 0;
          newYear = prev.gameTime.year + 1;
        }
      }

      const newWeek = Math.floor(newDay / 7);

      const newAbsDay = newYear * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + newMonth * DAYS_PER_MONTH + newDay;

      // player decay similar to interval tick
      const tierLower = (skill: number) => {
        if (skill >= 85) return 85;
        if (skill >= 31) return 31;
        return 0;
      };

      const updatedPlayer = { ...prev.player };
      const lastTrained = (prev.player.lastTrainedAbsDay ?? -1);
      const daysSinceTraining = lastTrained >= 0 ? newAbsDay - lastTrained : newAbsDay;
      const decayPerDay = 0.05;

        if (daysSinceTraining > 0) {
          if (daysSinceTraining < (MONTHS_PER_YEAR * DAYS_PER_MONTH)) {
            updatedPlayer.fSkill = Math.max(tierLower(updatedPlayer.fSkill), Math.max(0, Math.round((updatedPlayer.fSkill - decayPerDay) * 100) / 100));
            updatedPlayer.mSkill = Math.max(tierLower(updatedPlayer.mSkill), Math.max(0, Math.round((updatedPlayer.mSkill - decayPerDay) * 100) / 100));
          } else {
            updatedPlayer.fSkill = Math.max(0, Math.round((updatedPlayer.fSkill - decayPerDay) * 100) / 100);
            updatedPlayer.mSkill = Math.max(0, Math.round((updatedPlayer.mSkill - decayPerDay) * 100) / 100);
          }
        }

      // remove expired effects (by absolute day) and apply daily deltas
      if (updatedPlayer.effects && Array.isArray(updatedPlayer.effects)) {
        updatedPlayer.effects = updatedPlayer.effects.filter((ef: any) => {
          if (!ef.expiresAbsDay) return true;
          return ef.expiresAbsDay >= newAbsDay;
        });
        // apply daily tired deltas from active effects
        updatedPlayer.effects.forEach((ef: any) => {
          if (ef.dailyTiredDelta) {
            updatedPlayer.tired = Math.max(0, Math.min(100, (updatedPlayer.tired || 0) + ef.dailyTiredDelta));
          }
        });
      }

      return {
        ...prev,
        player: updatedPlayer,
        gameTime: { day: newDay, week: newWeek, month: newMonth, year: newYear }
      };
    });

    // After advancing state, compute tomorrow's date (abs day) and schedule month-ahead New Year notification
    try {
      const DAYS_PER_MONTH = 30;
      const MONTHS_PER_YEAR = 12;
      const currentAbsDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;
      const newAbsDay = currentAbsDay + 1;
      const newYear = Math.floor(newAbsDay / (MONTHS_PER_YEAR * DAYS_PER_MONTH));
      const daysIntoYear = newAbsDay - newYear * (MONTHS_PER_YEAR * DAYS_PER_MONTH);
      const newMonth = Math.floor(daysIntoYear / DAYS_PER_MONTH);
      const newDay = daysIntoYear % DAYS_PER_MONTH;

      // If we've reached the date one month before New Year (month index 5 = November in game time starting from June), warn player
      if (newMonth === 5 && newDay === 29) {
        try {
          showEventIfIdle && showEventIfIdle({ id: `new_year_warn_${newYear}`, type: 'info', title: 'РЎРєРѕСЂРѕ РќРѕРІС‹Р№ Р“РѕРґ', text: 'Р§РµСЂРµР· РјРµСЃСЏС† РќРѕРІС‹Р№ Р“РѕРґ вЂ” РјРѕР¶РЅРѕ РїРѕРґРіРѕС‚РѕРІРёС‚СЊ РїРѕР·РґСЂР°РІР»РµРЅРёСЏ Рё РїРѕРґР°СЂРєРё РґР»СЏ NPC.' });
        } catch (e) { }
      }
    } catch (e) { }

    // After advancing time, process queued team applications whose review day has arrived
    try {
      const DAYS_PER_MONTH = 30;
      const MONTHS_PER_YEAR = 12;
      const newAbsDay = newAbsDayRef.current;
      console.log(`[Team App Processing] newAbsDay=${newAbsDay}, queuedCount=${queuedApplicationsRef.current.length}`);
      // find applications ready for review (use ref for latest values)
      const ready = queuedApplicationsRef.current.filter(q => q.reviewAbsDay <= newAbsDay && !q.attempted);
      console.log(`[Team App Processing] ready=${ready.length}, ready:`, ready.map(r => ({ id: r.id, reviewAbsDay: r.reviewAbsDay, attempted: r.attempted })));
      if (ready.length > 0) {
        ready.forEach(app => {
          const team = teamsRef.current.find(t => t.id === app.teamId);
          if (!team) return;
          // determine required comparison skill for team's dominant style
          const teamAvg = (team as any).avgDominant ?? (team as any).teamSkill ?? 50;
          const domStyle = (team as any).dominantStyle || 'Both';
          const playerSkillForComparison = domStyle === 'F_style' ? stateRef.current.player.fSkill : domStyle === 'M_style' ? stateRef.current.player.mSkill : Math.round(((stateRef.current.player.fSkill || 0) + (stateRef.current.player.mSkill || 0)) / 2);
          const diff = teamAvg - playerSkillForComparison;
          const accepted = !(diff > 18);
          if (accepted) {
            // join the team
            try { joinTeam && joinTeam(team.id); } catch (e) { /* ignore */ }
            // Route the response as coming from the team's leader so it appears under that NPC in messenger
            setInbox(prev => [{ id: `app_res_${Date.now()}`, type: 'team_application', teamId: team.id, accepted: true, text: `Р’Р°С€Р° Р·Р°СЏРІРєР° РІ РєРѕРјР°РЅРґСѓ ${team.name} РїСЂРёРЅСЏС‚Р°!`, npcId: team.leaderId, senderId: team.leaderId, absDay: newAbsDay, read: false }, ...prev]);
          } else {
            setInbox(prev => [{ id: `app_res_${Date.now()}`, type: 'team_application', teamId: team.id, accepted: false, text: `Р’Р°С€Р° Р·Р°СЏРІРєР° РІ РєРѕРјР°РЅРґСѓ ${team.name} РѕС‚РєР»РѕРЅРµРЅР°.`, npcId: team.leaderId, senderId: team.leaderId, absDay: newAbsDay, read: false }, ...prev]);
          }
        });
        // Mark applications as attempted (so we don't re-process them)
        const updated = queuedApplicationsRef.current.map(q => ready.some(r => r.id === q.id) ? { ...q, attempted: true } : q);
        queuedApplicationsRef.current = updated;
        setQueuedApplications(updated);
        // Clear pendingApplication flags on teams that were processed
        const cleared = teamsRef.current.map(t => ready.some((r: any) => r.teamId === t.id) ? { ...t, pendingApplication: undefined } : t);
        setTeams(cleared);
      }
    } catch (e) {
      // ignore processing errors
    }

    // Process queued collab proposals whose respond day has arrived
    try {
      const DAYS_PER_MONTH = 30;
      const MONTHS_PER_YEAR = 12;
      const newAbsDay = newAbsDayRef.current;
      console.log(`[Collab Proposal Processing] newAbsDay=${newAbsDay}, queuedCount=${queuedCollabProposalsRef.current.length}`);
      // find proposals ready for response
      const ready = queuedCollabProposalsRef.current.filter(q => q.respondAbsDay <= newAbsDay && !q.attempted);
      console.log(`[Collab Proposal Processing] ready=${ready.length}, ready:`, ready.map(r => ({ id: r.id, respondAbsDay: r.respondAbsDay, attempted: r.attempted })));
      if (ready.length > 0) {
        const inboxMessages: any[] = [];
        ready.forEach(proposal => {
          const npc = npcsRef.current.find(n => n.id === proposal.npcId);
          // Use NPC data if found, otherwise use fallback name from payload
          const npcName = npc?.name || proposal.payload?.npcName || 'NPC';
          const behaviorModel = npc?.behaviorModel || 'Machine';
          
          // Calculate days elapsed since proposal sent
          const daysElapsed = newAbsDay - proposal.createdAbsDay;
          // Probability model: 70% in days 1-5, 50% in days 6-10, 30% in days 11-15, 10% in days 16-20
          let acceptanceChance = 0;
          if (daysElapsed <= 5) acceptanceChance = 0.7;
          else if (daysElapsed <= 10) acceptanceChance = 0.5;
          else if (daysElapsed <= 15) acceptanceChance = 0.3;
          else acceptanceChance = 0.1;
          
          const accepted = Math.random() < acceptanceChance;
          const message = accepted
            ? (npc ? getNpcPhrase(behaviorModel, 'collab_accept') : null) || `${npcName} согласился на совместный проект!`
            : (npc ? getNpcPhrase(behaviorModel, 'collab_decline') : null) || `${npcName} отказался от совместного проекта.`;
          
          // Collect response message for batch addition
          inboxMessages.push({
            id: `collab_res_${proposal.id}`,
            type: 'collab_response',
            npcId: proposal.npcId,
            senderId: proposal.npcId,
            text: message,
            accepted,
            absDay: newAbsDay,
            read: false
          });
        });
        // Apply all messages at once
        if (inboxMessages.length > 0) {
          console.log(`[Collab Proposal Processing] Adding ${inboxMessages.length} messages to inbox`);
          setInbox(prev => [...inboxMessages, ...prev]);
        }
        // Mark proposals as attempted (so we don't re-process them)
        const updated = queuedCollabProposalsRef.current.map(q => ready.some(r => r.id === q.id) ? { ...q, attempted: true } : q);
        queuedCollabProposalsRef.current = updated;
        setQueuedCollabProposals(updated);
      }
    } catch (e) {
      // ignore processing errors
    }

    // Send birthday reminders 30 and 7 days before birthday
    try {
      const DAYS_PER_MONTH = 30;
      const MONTHS_PER_YEAR = 12;
      const newAbsDay = newAbsDayRef.current;
      
      npcs.forEach(npc => {
        if (!npc.birthDate) return;
        
        const [npcMonth, npcDay] = npc.birthDate.split('.').map(Number);
        
        // Convert calendar month (1-12) to game month (0-11) where game month 0 = June
        // Calendar months: Jan=1, Feb=2, ... Jun=6, ... Dec=12
        // Game months: Jun=0, Jul=1, ... Dec=6, Jan=7, ... May=11
        const gameMonth = (npcMonth - 6 + 12) % 12;
        
        // Calculate birthday's absolute day for this year
        const birthdayAbsDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + gameMonth * DAYS_PER_MONTH + (npcDay - 1);
        const daysUntilBirthday = birthdayAbsDay - newAbsDay;
        
        // Send 30-day reminder
        if (daysUntilBirthday === 30) {
          if (!npc.birthdayReminder30SentAbsDay || npc.birthdayReminder30SentAbsDay < birthdayAbsDay - 365) {
            setInbox(prev => [{
              id: `birthday_reminder_30_${npc.id}_${newAbsDay}`,
              type: 'birthday_reminder',
              npcId: npc.id,
              senderId: npc.id,
              text: `Р”РµРЅСЊ СЂРѕР¶РґРµРЅРёСЏ ${npc.name} Р±СѓРґРµС‚ С‡РµСЂРµР· 30 РґРЅРµР№! рџЋ‚`,
              daysUntilBirthday: 30,
              absDay: newAbsDay,
              read: false
            }, ...prev]);
            // Update NPC to mark reminder as sent
            setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, birthdayReminder30SentAbsDay: newAbsDay } : n));
          }
        }
        
        // Send 7-day reminder
        if (daysUntilBirthday === 7) {
          if (!npc.birthdayReminder7SentAbsDay || npc.birthdayReminder7SentAbsDay < birthdayAbsDay - 365) {
            setInbox(prev => [{
              id: `birthday_reminder_7_${npc.id}_${newAbsDay}`,
              type: 'birthday_reminder',
              npcId: npc.id,
              senderId: npc.id,
              text: `Р”РµРЅСЊ СЂРѕР¶РґРµРЅРёСЏ ${npc.name} Р±СѓРґРµС‚ С‡РµСЂРµР· РЅРµРґРµР»СЋ! рџЋ‚`,
              daysUntilBirthday: 7,
              absDay: newAbsDay,
              read: false
            }, ...prev]);
            // Update NPC to mark reminder as sent
            setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, birthdayReminder7SentAbsDay: newAbsDay } : n));
          }
        }
      });
    } catch (e) {
      // ignore processing errors
    }

    // update active projects as if a day passed (manual tick) and accumulate tired
    setActiveProjects(prevProjects => {
      const remaining: Project[] = [];
      const newlyCompleted: Project[] = [];
      const newlyFailed: Project[] = [];

      let totalEffectiveTrainingsToday = 0;
      let moneyToDeduct = 0;
      // Determine forced rest day for overloaded schedule (manual tick uses next day)
      const nextAbsDayGuess = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day + 1;
      const weekday = (stateRef.current.gameTime.day + 1) % 7;
      const overloaded = prevProjects.filter(p => (((p.baseTraining || 0) + (p.extraTraining || 0)) >= 3)).length >= 2;
      const isRestDay = overloaded && weekday === REST_DAY_INDEX;
      prevProjects.forEach(p => {
        const base = (p.baseTraining || 0) + (p.extraTraining || 0);
        const newDaysActive = (p.daysActive || 0) + 1;
        const currentAbsDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;

        // Check if 7 days have passed since costume rejection (< 50% match)
        // If yes, trigger costume selection modal again
        if ((p as any).costumeRetryAllowedAbsDay && currentAbsDay >= (p as any).costumeRetryAllowedAbsDay && !(p as any).costumeLocked) {
          try {
            setPendingCostumeSelection(p.id);
            setModalPause(true);
            // Clear the retry flag so it doesn't trigger repeatedly
            (p as any).costumeRetryAllowedAbsDay = undefined;
          } catch (e) { /* ignore */ }
        }

        // Check project deadline FIRST: if deadline reached, fail regardless of trainings
        const maxWeeks = Math.max(1, (p.durationWeeks || 1));
        const maxDays = maxWeeks * 7;
        if (newDaysActive > maxDays) {
          // Project deadline has been reached - mark as failed
          const failed = { ...p, daysActive: newDaysActive, progress: (p.progress || 0), success: false, failedDueToDeadline: true } as Project;
          newlyFailed.push(failed);
          // Only apply visible failure effects/events if allowed by rate limiter
          if (acceptedSinceFailureRef.current >= 7) {
            applyEffect({ reputation: -5, projectRejectChanceAdd: 0.3, projectRejectDays: 15 }, 'Р‘РµР·РѕС‚РІРµС‚СЃС‚РІРµРЅРЅС‹Р№');
            acceptedSinceFailureRef.current = 0;
          }
          return;
        }

        if (base <= 0 || !p.trainingNeeded || (p.progress || 0) >= 100) {
          remaining.push({ ...p, daysActive: newDaysActive });
          return;
        }

        // If project is already marked as needing manual funding, skip auto-processing
        // Only fundProjectTraining() can resume training for this project
        if ((p as any).needsFunding) {
          remaining.push({ ...p, daysActive: newDaysActive });
          return;
        }

        const dailyTrainings = base / 7;
        const efficiency = computeTrainingEfficiency(stateRef.current.player);
        const dailyTrainingCost = (p.trainingCost || 0) * dailyTrainings;
        const playerMoneyNow = stateRef.current.player.money || 0;
        if (playerMoneyNow < dailyTrainingCost && base > 0 && !isRestDay) {
          // Not enough funds to pay for today's trainings for this project
          // Mark project as needing funding and don't progress today
          remaining.push({ ...p, daysActive: newDaysActive, needsFunding: true });
          return;
        }
        const effectiveDailyTrainings = isRestDay ? 0 : dailyTrainings * efficiency;
        totalEffectiveTrainingsToday += effectiveDailyTrainings;
        // Schedule daily training cost deduction (aggregate)
        if (!isRestDay && dailyTrainingCost > 0) {
          moneyToDeduct += dailyTrainingCost;
        }

        const newTrainingsCompleted = (p.trainingsCompleted || 0) + effectiveDailyTrainings;
        const trainingNeeded = Math.max(1, p.trainingNeeded || 1);
        const newProgress = Math.min(100, (newTrainingsCompleted / trainingNeeded) * 100);

        let projectUpdated: Project | null = null;

        if (newProgress >= 50 && !(p as any).costumePaid) {
          // Request costume selection instead of auto-payment
          if (!(p as any).costumeSelectionRequested) {
            projectUpdated = { ...p, daysActive: newDaysActive, trainingsCompleted: newTrainingsCompleted, progress: newProgress, costumeSelectionRequested: true, needsFunding: false } as Project;
            try { 
              setPendingCostumeSelection(p.id);
              setModalPause(true);  // Pause game while costume modal is shown
            } catch (e) { /* ignore */ }
          } else {
            projectUpdated = { ...p, daysActive: newDaysActive, trainingsCompleted: newTrainingsCompleted, progress: newProgress, needsFunding: false } as Project;
          }
        } else if (projectUpdated === null) {
          projectUpdated = { ...p, daysActive: newDaysActive, trainingsCompleted: newTrainingsCompleted, progress: newProgress, needsFunding: false } as Project;
        }

        // Costume payment and success check (deadline already checked earlier)

        if (newProgress >= 100) {
          const requiresCostume = (p as any).costumeCost && (p as any).costumeCost > 0;
          const wasPaid = (projectUpdated ? (projectUpdated as any).costumePaid : (p as any).costumePaid) || false;
          if (requiresCostume && !wasPaid) {
            const failed = { ...p, daysActive: newDaysActive, progress: 100, success: false } as Project;
            newlyFailed.push(failed);
          } else {
            // Generate comments based on player's current popularity and reputation per TZ
            const playerPop = stateRef.current.player.popularity || 0;
            const playerRep = stateRef.current.player.reputation || 0;
            const commentsCount = Math.max(3, Math.floor(Math.max(playerPop, 30) / 10));

            const positivePhrases = [
              'Очень красиво получилось', 'Мне прям понравилось', 'Классный кавер!', 'Вы большие молодцы', 'Приятное исполнение'
            ];
            const negativePhrases = [
              'Что-то вообще мимо ритма.', 'Ужасно не технично.', 'Никакой энергии', 'Очень слабая работа', 'Неаккуратно и неровно'
            ];

            const basePositiveChance = Math.max(0.05, Math.min(0.95, 0.5 + (playerRep / 200)));
            
            // Add costume match effects
            const costumeMatch = (p as any).costumeMatchPercent || 0;
            let costumeMultiplier = 1.0;
            
            if (costumeMatch >= 81) {
              // +10% to positive comments chance for excellent match
              costumeMultiplier = 1.1;
            } else if (costumeMatch >= 51 && costumeMatch < 81) {
              // +10% to negative comments chance for moderate match
              costumeMultiplier = 0.9; // reduces positive chance, effectively boosts negative
            }

            let comments: any[] = [];
            for (let i = 0; i < commentsCount; i++) {
              const commentPositiveChance = basePositiveChance * costumeMultiplier;
              const isPositive = Math.random() < commentPositiveChance;
              const text = (isPositive ? positivePhrases : negativePhrases)[Math.floor(Math.random() * (isPositive ? positivePhrases.length : negativePhrases.length))];
              
              // Apply costume match bonus/penalty to individual comment likes
              let baseLikes = isPositive ? Math.round(1 + Math.random() * 10) : Math.round(Math.random() * 3);
              let finalLikes = baseLikes;
              
              if (costumeMatch >= 81) {
                // +10% likes for excellent costume match (applies to positive comments)
                if (isPositive) {
                  finalLikes = Math.round(baseLikes * 1.1);
                }
              } else if (costumeMatch >= 51 && costumeMatch < 81) {
                // +10% dislikes for moderate costume match (applies to negative comments)
                if (!isPositive) {
                  finalLikes = Math.round(baseLikes * 1.1);
                }
              }
              
              comments.push({ text, likes: finalLikes, positive: isPositive });
            }
            // ensure comments are unique by text
            comments = comments.filter((c, i, arr) => arr.findIndex(x => x.text === c.text) === i);
            
            // Guarantee at least 3 comments even if all were duplicates
            while (comments.length < 3) {
              const phrases = comments.length === 0 || Math.random() < 0.5 ? positivePhrases : negativePhrases;
              const text = phrases[Math.floor(Math.random() * phrases.length)];
              if (!comments.some(c => c.text === text)) {
                comments.push({ 
                  text, 
                  likes: comments.length === 0 ? 5 : Math.round(Math.random() * 8),
                  positive: comments.length === 0 || Math.random() < 0.6
                });
              }
            }

            // Calculate total likes and dislikes with costume match multiplier
            let baseLikes = Math.round(10 + Math.random() * 90);
            let baseDislikes = Math.round(Math.random() * 20);
            
            if (costumeMatch >= 81) {
              // +10% to likes for excellent costume
              baseLikes = Math.round(baseLikes * 1.1);
            } else if (costumeMatch >= 51 && costumeMatch < 81) {
              // +10% to dislikes for moderate costume
              baseDislikes = Math.round(baseDislikes * 1.1);
            }

            const completed = {
              ...p,
              daysActive: newDaysActive,
              progress: 100,
              completedDate: Date.now(),
              success: true,
              likes: baseLikes,
              dislikes: baseDislikes,
              comments,
            } as Project;
            newlyCompleted.push(completed);
          }
        } else {
          remaining.push(projectUpdated ? projectUpdated : { ...p, daysActive: newDaysActive, trainingsCompleted: newTrainingsCompleted, progress: newProgress });
        }
      });

      if (newlyCompleted.length > 0) {
        setCompletedProjects(prev => {
          const toAdd = newlyCompleted.filter(nc => !prev.some(p => p.id === nc.id));
          const updated = [...prev, ...toAdd];
          localStorage.setItem('completedProjects', JSON.stringify(updated));
          return updated;
        });
        setRecentCompleted(newlyCompleted[0]);
        const absDayNow = state.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + state.gameTime.month * DAYS_PER_MONTH + state.gameTime.day;
        setState(prev => ({ ...prev, player: { ...prev.player, postedCover: true, lastPostedAbsDay: absDayNow } }));

        setAvailableProjects(prev => {
          const newProjects = projectGenerator.generateAvailableProjects(Math.max(3, 20 - prev.length), stateRef.current.player as any);
          // Filter out duplicates to avoid project duplication
          const toAdd = newProjects.filter(np => !prev.some(p => p.id === np.id));
          const updated = [...prev, ...toAdd];
          localStorage.setItem('availableProjects', JSON.stringify(updated));
          return updated;
        });
      }

      if (newlyFailed.length > 0) {
        const failedCompleted = newlyFailed.map(f => {
          // For failed covers we intentionally do NOT generate public likes/comments
          return { ...f, completedDate: Date.now(), success: false, likes: 0, dislikes: 0, comments: [] } as Project;
        });
        // Refund saved money for failed projects where costume wasn't paid
        try {
          const totalRefund = failedCompleted.reduce((sum, fc) => {
            const saved = (fc as any).costumeSavedMoney || 0;
            const paid = (fc as any).costumePaid;
            return sum + ((saved && !paid) ? saved : 0);
          }, 0);
          if (totalRefund > 0) {
            setState(prev => ({ ...prev, player: { ...prev.player, money: (prev.player.money || 0) + totalRefund } }));
          }
        } catch (e) { /* ignore */ }

        setCompletedProjects(prev => {
          const toAdd = failedCompleted.filter(fc => !prev.some(p => p.id === fc.id));
          const updated = [...prev, ...toAdd];
          localStorage.setItem('completedProjects', JSON.stringify(updated));
          return updated;
        });
        // show popup for first failed project via CompletedModal only
        // Prefer showing successful completion popup if both success and failure occurred this tick
        if (newlyCompleted.length === 0) {
          setRecentCompleted(failedCompleted[0]);
        }
      }

      // Deduct aggregated costume payments (if any)
      if (moneyToDeduct > 0) {
        setState(prev => ({ ...prev, player: { ...prev.player, money: Math.max(0, (prev.player.money || 0) - moneyToDeduct) } }));
      }

      // If today is forced rest day, apply rest benefit. Otherwise apply tiredness from project trainings.
      if (isRestDay) {
        setState(prev => ({ ...prev, player: { ...prev.player, tired: Math.max(0, (prev.player.tired || 0) - 5) } }));
      } else if (totalEffectiveTrainingsToday > 0) {
        setState(prev => ({ ...prev, player: { ...prev.player, tired: Math.min(100, (prev.player.tired || 0) + Math.round(totalEffectiveTrainingsToday * TRAINING_TIRED_GAIN * 100) / 100 + prevProjects.length) } }));
      }

      return remaining;
    });
  };

  // Advance game time by N days. Uses existing updateGameTime logic.
  const advanceDays = (n: number) => {
    if (!n || n <= 0) return;
    // Обрабатываем каждый день по отдельности, чтобы гарантировать обработку всех очередей
    for (let i = 0; i < n; i++) {
      try {
        // Перед каждым тиком синхронизируем ref-очереди с актуальными значениями
        queuedCollabProposalsRef.current = [...(queuedCollabProposals || [])];
        queuedApplicationsRef.current = [...(queuedApplications || [])];
        updateGameTime();
        // После updateGameTime синхронизируем обратно, чтобы не было рассинхрона
        setQueuedCollabProposals([...queuedCollabProposalsRef.current]);
        setQueuedApplications([...queuedApplicationsRef.current]);
      } catch (e) {
        // continue if a single day advance fails
      }
    }
  };

  const togglePause = (val?: boolean) => {
    setState(prev => {
      // Если явно передан boolean, используем его, иначе инвертируем
      const newPaused = typeof val === 'boolean' ? val : !prev.isPaused;
      return { ...prev, isPaused: newPaused };
    });
  };

  // New functions for modal-based pausing
  const setModalPause = React.useCallback((val: boolean) => {
    if (val) {
      // Opening a modal - increment counter
      modalCountRef.current++;
      console.log('%c🎮 MODAL OPENED - Count now: ' + modalCountRef.current, 'font-size:16px;color:red;font-weight:bold;');
      modalPauseRef.current = true;
    } else {
      // Closing a modal - decrement counter
      modalCountRef.current = Math.max(0, modalCountRef.current - 1);
      console.log('%c🎮 MODAL CLOSED - Count now: ' + modalCountRef.current, 'font-size:16px;color:blue;font-weight:bold;');
      modalPauseRef.current = modalCountRef.current > 0;
    }
    console.log('[GameContext] modalPauseRef.current:', modalPauseRef.current, 'modalCountRef.current:', modalCountRef.current);
    setState(prev => {
      const newPaused = modalCountRef.current > 0;
      console.log('[GameContext] setState isModalPaused:', prev.isModalPaused, '→', newPaused);
      return { ...prev, isModalPaused: newPaused };
    });
  }, []);

  const toggleModalPause = () => {
    setState(prev => ({ ...prev, isModalPaused: !prev.isModalPaused }));
  };

  const setTimeSpeed = (speed: 1 | 2 | 5 | 10) => {
    setState(prev => ({ ...prev, timeSpeed: speed }));
  };

  const toggleTheme = () => {
    setState(prev => {
      const newTheme = prev.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return { ...prev, theme: newTheme };
    });
  };

  const toggleAnimation = () => {
    setState(prev => ({ ...prev, animationEnabled: !prev.animationEnabled }));
  };

  const completeOnboarding = () => {
    setState(prev => ({ ...prev, onboardingCompleted: true }));
  };

  const initializeGame = (name: string) => {
    // Reset inventory to default when starting a new game
    setPlayerInventory(['inv_shoes_white_sneakers', 'inv_top_white_tshirt', 'inv_bottom_black_baggy']);
    // Also clear localStorage for inventory
    try { localStorage.removeItem('playerInventory'); } catch (e) { /* ignore */ }
    setState(prev => ({
      ...prev,
      player: { ...prev.player, name },
      gameStarted: true,
    }));
    
    // Send welcome message from Community News contact
    setTimeout(() => {
      const DAYS_PER_MONTH = 30;
      const MONTHS_PER_YEAR = 12;
      const absDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;
      
      const welcomeMessage = {
        id: `news_welcome_${Date.now()}`,
        type: 'community_news',
        npcId: 'COMMUNITY_NEWS',
        senderId: 'COMMUNITY_NEWS',
        text: 'Добро пожаловать в коммьюнити K-pop! 🎤\nЗдесь ты будешь получать новости о событиях в мире K-pop, о формировании новых групп и важных изменениях в сообществе. Удачи в твоём пути! 🎉',
        newsType: 'welcome',
        absDay,
        read: false
      };
      
      setInbox(prev => [welcomeMessage, ...prev]);
    }, 100);
  };

  const restartGame = () => {
    setState(INITIAL_GAME_STATE);
    // Полный сброс всех игровых данных из localStorage и состояния
    localStorage.removeItem('gameState');
    localStorage.removeItem('activeProjects');
    localStorage.removeItem('availableProjects');
    localStorage.removeItem('completedProjects');
    localStorage.removeItem('gameNPCs');
    localStorage.removeItem('gameTeams');
    // Явно очищаем состояния проектов в React
    setActiveProjects([]);
    setAvailableProjects(projectGenerator.generateAvailableProjects(7, INITIAL_GAME_STATE.player as any));
    setCompletedProjects([]);
    // Если есть другие ключи, связанные с прогрессом, добавить их сюда
  };

  const loadGame = () => {
    const saved = localStorage.getItem('gameState');
    if (saved) {
      const loadedState = JSON.parse(saved);
      setState(loadedState);
      // Also restore playerInventory from loaded state if available
      if (loadedState.player && Array.isArray(loadedState.player.playerInventory)) {
        setPlayerInventory(loadedState.player.playerInventory);
      }
    }
  };

  const resumeGame = () => {
    // Resume game: set gameEnded to false and ensure gameStarted is true
    // This allows the timer to continue running without resetting to character creation
    setGameEnded(false);
    setState(prev => ({
      ...prev,
      gameStarted: true
    }));
  };

  const saveGame = () => {
    // Include current playerInventory in the saved state
    const stateWithInventory = {
      ...state,
      player: {
        ...state.player,
        playerInventory: playerInventory,
      }
    };
    localStorage.setItem('gameState', JSON.stringify(stateWithInventory));
  };

  const acceptProject = (projectId: string, options?: { baseTraining?: number; costumeSavedMoney?: number }) => {
    const project = availableProjects.find(p => p.id === projectId);
    if (project) {
      // Check reputation-based refusal: if project's minReputation is greater than player's rep
      const playerRep = state.player.reputation || 0;
      const minRep = (project as any).minReputation ?? -999;
      if (minRep > playerRep) {
        // base refusal chance when player below minReputation
        let refusalChance = 0.3; // 30% baseline
        // add any active effects that increase rejection chance
        const effs = Array.isArray(state.player.effects) ? state.player.effects : [];
        const extra = effs.reduce((s: number, e: any) => s + (e.projectRejectChanceAdd || 0), 0);
        refusalChance = Math.min(1, refusalChance + extra);
        if (Math.random() < refusalChance) {
          // project refuses the player due to reputation вЂ” show popup and remove from available projects
          showEventIfIdle({ id: `project_refusal_${Date.now()}`, title: 'РћС‚РєР°Р· РїСЂРѕРµРєС‚Р°', text: 'РџСЂРѕРµРєС‚ РѕС‚РєР°Р·Р°Р» РІР°Рј РёР·-Р·Р° РЅРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕР№ СЂРµРїСѓС‚Р°С†РёРё.' });
          setAvailableProjects(prev => prev.filter(p => p.id !== projectId));
          return;
        }
      }

      // If player provided a costumeSavedMoney at acceptance time, we'll try to use any prior reservation
      // (created via reserveCostumeForProject). If no reservation exists, deduct now (reserve at acceptance).
      let initialSaved = options?.costumeSavedMoney ?? 0;
      const reserved = reservedCostumeRef.current[projectId] || 0;
      if (reserved > 0) {
        // Use reserved amount instead of double-deducting
        initialSaved = Math.max(initialSaved, reserved);
        // clear reservation record (we'll mark costumeSavedMoney on project)
        delete reservedCostumeRef.current[projectId];
      } else if (initialSaved > 0) {
        const playerMoneyNow = stateRef.current.player.money || 0;
        if (initialSaved > playerMoneyNow) {
          // Not enough funds to reserve the requested amount вЂ” warn and ignore reservation
          try { showEventIfIdle && showEventIfIdle({ id: `costume_reserve_fail_${Date.now()}`, type: 'bad', title: 'РћС€РёР±РєР°', text: 'РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ РґРµРЅРµРі РґР»СЏ СЂРµР·РµСЂРІРёСЂРѕРІР°РЅРёСЏ РєРѕСЃС‚СЋРјР°.' }); } catch (e) { /* ignore */ }
          initialSaved = 0;
        } else {
          setState(prev => ({ ...prev, player: { ...prev.player, money: Math.max(0, (prev.player.money || 0) - initialSaved) } }));
        }
      }

      setActiveProjects(prev => {
        if (prev.some(p => p.id === project.id)) return prev;
        // РСЃРїРѕР»СЊР·СѓРµРј РјРёРЅРёРјР°Р»СЊРЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ С‚СЂРµРЅРёСЂРѕРІРѕРє, РєРѕС‚РѕСЂРѕРµ С‚СЂРµР±СѓРµС‚СЃСЏ РґР»СЏ РїСЂРѕРµРєС‚Р°
        const baseToUse = Math.min(3, Math.max(options?.baseTraining ?? 0, 1));
        
        // Assign a random NPC as the project leader
        const availableNpcs = npcs.filter((n: any) => n.activeStatus !== false);
        const randomNpc = availableNpcs[Math.floor(Math.random() * availableNpcs.length)];
        const assignedNpcId = randomNpc?.id || 'npc_default';
        
        const projectToAdd = { 
          ...project,
          baseTraining: baseToUse,
          costumeSavedMoney: initialSaved,
          npcId: assignedNpcId,
          leaderId: assignedNpcId
        };
        const updated = [...prev, projectToAdd];
        localStorage.setItem('activeProjects', JSON.stringify(updated));
        return updated;
      });
      setAvailableProjects(prev => prev.filter(p => p.id !== projectId));
      // Count this acceptance towards the failure-rate limiter
      try { acceptedSinceFailureRef.current = Math.min(999999, (acceptedSinceFailureRef.current || 0) + 1); } catch (e) { /* ignore */ }
    }
  };

  const abandonProject = (projectId: string) => {
    // Refund any reserved or saved costume money when abandoning, but only if progress < 50%
    setActiveProjects(prev => {
      const target = prev.find(p => p.id === projectId);
      if (target) {
        const saved = (target as any).costumeSavedMoney || 0;
        const paid = (target as any).costumePaid;
        const progress = (target as any).progress || 0;

        // Only refund if player abandons before 50% progress
        if (progress < 50) {
          if (saved > 0 && !paid) {
            setState(prev => ({ ...prev, player: { ...prev.player, money: (prev.player.money || 0) + saved } }));
          }

          // Also release any pre-accept reserved funds
          try {
            const reserved = reservedCostumeRef.current[projectId] || 0;
            if (reserved > 0) {
              setState(prev => ({ ...prev, player: { ...prev.player, money: (prev.player.money || 0) + reserved } }));
              delete reservedCostumeRef.current[projectId];
            }
          } catch (e) { /* ignore */ }
        }
      }
      return prev.filter(p => p.id !== projectId);
    });
  };

  const updateActiveProject = (projectId: string, updates: Partial<Project>) => {
    setActiveProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;

      let updated = { ...p, ...updates };

      // ExtraTraining limits enforcement per newtz spec
      // Count how many active projects player has
      const projectCount = prev.length;
      const extraTrainingLimits: { [key: number]: number } = {
        1: 7,  // 1 project в†’ max 7 extra trainings
        2: 5,  // 2 projects в†’ max 5
        3: 3,  // 3 projects в†’ max 3
        4: 1,  // 4 projects в†’ max 1
        // 5+ в†’ 0
      };

      const maxExtra = projectCount <= 4 ? (extraTrainingLimits[projectCount] ?? 0) : 0;

      if (updated.extraTraining !== undefined && updated.extraTraining > maxExtra) {
        updated.extraTraining = maxExtra;
      }

      // Handle costumeSavedMoney changes immediately: reserve (deduct) or refund to player
      try {
        const oldSaved = (p as any).costumeSavedMoney || 0;
        const newSaved = (updated as any).costumeSavedMoney || 0;
        const cost = (updated as any).costumeCost || 0;
        const delta = newSaved - oldSaved;
        
        if (delta > 0) {
          // Need to deduct from player's money immediately (only what's affordable)
          const currentBalance = stateRef.current.player.money || 0;
          const affordable = Math.min(delta, currentBalance);
          
          if (affordable < delta) {
            // clamp the saved amount to what player can afford
            (updated as any).costumeSavedMoney = oldSaved + affordable;
          }
          
          if (affordable > 0) {
            setState(prevState => ({ ...prevState, player: { ...prevState.player, money: Math.max(0, (prevState.player.money || 0) - affordable) } }));
          }
        } else if (delta < 0) {
          // refund difference back to player's money
          const refund = Math.abs(delta);
          if (refund > 0) {
            setState(prevState => ({ ...prevState, player: { ...prevState.player, money: (prevState.player.money || 0) + refund } }));
          }
        }

        // If player saved enough money for costume, mark it as paid/reserved
        const saved = (updated as any).costumeSavedMoney || 0;
        (updated as any).costumePaid = cost > 0 && saved >= cost;
      } catch (e) {
        // ignore
      }

      return updated;
    }));
  };

  const payForCostume = (projectId: string) => {
    setActiveProjects(prev => {
      return prev.map(p => {
        if (p.id !== projectId) return p;
        if ((p as any).costumePaid) return p; // already paid
        const cost = (p as any).costumeCost || 0;
        // Use current stateRef to check funds atomically and deduct
        const currentMoney = stateRef.current.player.money || 0;
        if (currentMoney >= cost) {
          // Deduct immediately and mark costume paid
          setState(prev => ({ ...prev, player: { ...prev.player, money: Math.max(0, (prev.player.money || 0) - cost) } }));
          try { recordExpense && recordExpense('РљРѕСЃС‚СЋРјС‹', cost, 'costume'); } catch (e) { /* ignore */ }
          return { ...p, costumePaid: true };
        }
        // Not enough funds - show warning and do not mark as paid
        try { showEventIfIdle && showEventIfIdle({ id: `costume_pay_fail_${Date.now()}`, type: 'bad', title: 'РћС€РёР±РєР°', text: 'РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ РґРµРЅРµРі РґР»СЏ РїРѕРєСѓРїРєРё РєРѕСЃС‚СЋРјР°.' }); } catch (e) { /* ignore */ }
        return p;
      });
    });
  };

  const fundProjectTraining = (projectId: string) => {
    setActiveProjects(prev => {
      return prev.map(p => {
        if (p.id !== projectId) return p;
        
        const base = ((p as any).baseTraining || 0) + ((p as any).extraTraining || 0);
        const dailyTrainings = base / 7;
        const dailyTrainingCost = ((p as any).trainingCost || 0) * dailyTrainings;
        const currentMoney = stateRef.current.player.money || 0;
        
        if (currentMoney >= dailyTrainingCost) {
          // Deduct one day's training cost and allow project to continue
          setState(prev => ({ ...prev, player: { ...prev.player, money: Math.max(0, (prev.player.money || 0) - dailyTrainingCost) } }));
          try { recordExpense && recordExpense('Тренировки', dailyTrainingCost, 'training'); } catch (e) { /* ignore */ }
          return { ...p, needsFunding: false, fundingErrorShown: false };
        }
        // Not enough funds - show warning and keep project as needing funding
        try { showEventIfIdle && showEventIfIdle({ id: `training_fund_fail_${Date.now()}`, type: 'bad', title: 'Ошибка', text: `Недостаточно денег. Нужно ${Math.ceil(dailyTrainingCost)} ₽, а у вас только ${currentMoney} ₽.` }); } catch (e) { /* ignore */ }
        return p;
      });
    });
  };

  // Update costumeSavedMoney without triggering automatic deduction logic
  const setCostumeSavedMoney = (projectId: string, amount: number) => {
    setActiveProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, costumeSavedMoney: Math.max(0, amount) };
    }));
  };

  const recordTrainingParticipant = (npcId: string) => {
    setState(prev => ({ ...prev, todayParticipants: [...(prev.todayParticipants || []), npcId] }));
  };

  const recordPlayerStyleTraining = (style: 'F' | 'M' | 'Both') => {
    setState(prev => {
      const arr = Array.isArray(prev.todayTrainedStyles) ? [...prev.todayTrainedStyles] : [];
      if (style === 'Both') {
        if (!arr.includes('F')) arr.push('F');
        if (!arr.includes('M')) arr.push('M');
      } else {
        if (!arr.includes(style)) arr.push(style);
      }
      return { ...prev, todayTrainedStyles: arr };
    });
  };

  const recordExpense = (label: string, amount: number, category?: string) => {
    try {
      const DAYS_PER_MONTH = 30;
      const MONTHS_PER_YEAR = 12;
      const absDay = state.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + state.gameTime.month * DAYS_PER_MONTH + state.gameTime.day;
      const entry = { id: `exp_${Date.now()}`, label, category: category || 'other', amount: Math.round(amount), absDay };
      setState(prev => {
        const ex = Array.isArray((prev as any).expenses) ? [...(prev as any).expenses] : [];
        ex.push(entry);
        const newState = { ...prev, expenses: ex } as any;
        try { localStorage.setItem('gameState', JSON.stringify(newState)); } catch (e) { /* ignore */ }
        return newState;
      });
    } catch (e) {
      // ignore logging errors
    }
  };

  // Dev controls for festival frequency
  const setFestivalFrequency = (minDays: number, maxDays: number, chance: number) => {
    eventGenerator.devFestivalMinDays = minDays;
    eventGenerator.devFestivalMaxDays = maxDays;
    eventGenerator.devFestivalChance = chance;
  };

  const getFestivalFrequency = () => ({
    minDays: eventGenerator.devFestivalMinDays,
    maxDays: eventGenerator.devFestivalMaxDays,
    chance: eventGenerator.devFestivalChance,
  });

  // Birthday greeting: send greeting and optional gift to NPC
  const sendBirthdayGreeting = (npcId: string, giftItemId?: string) => {
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) return false;

    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;
    const absDay = stateRef.current.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + stateRef.current.gameTime.month * DAYS_PER_MONTH + stateRef.current.gameTime.day;

    // Remove the prompt message
    setInbox(prev => prev.filter(m => !(m.type === 'birthday_greeting_prompt' && m.npcId === npcId)));

    // Add player's greeting message (text)
    let greetingText = `С Новым Годом, ${npc.name}! Пусть новый год принесёт вдохновение.`;

    // Determine gift matching (if provided) - GIFTS array has gift metadata
    let matched = false;
    let bonusToAdd = 0;
    if (giftItemId) {
      const giftMeta = GIFTS.find(g => g.id === giftItemId) || GIFTS.find(g => g.name === giftItemId as any);
      if (giftMeta) {
        // Remove gift from player inventory if present
        setPlayerInventory(prev => {
          const updated = prev.filter(itemId => itemId !== giftItemId);
          try { localStorage.setItem('playerInventory', JSON.stringify(updated)); } catch (e) { /* ignore */ }
          return updated;
        });

        matched = giftMeta.suitableCharacters.includes(npc.behaviorModel as any);
        bonusToAdd = matched ? giftMeta.matchedRelationshipBonus : giftMeta.baseRelationshipBonus;
        greetingText += ` Я прислала небольшой подарок: ${giftMeta.name}.`;
      } else {
        // If giftItemId isn't in GIFTS, try clothes catalog as fallback
        const item = CLOTHES_CATALOG.find((c: any) => c.id === giftItemId);
        if (item) {
          greetingText += ` Я прислала: ${item.name}.`;
          // treat as unmatched small bonus
          bonusToAdd = RelationshipBonuses.BIRTHDAY_GREETING;
        }
      }
    } else {
      // text-only greeting
      bonusToAdd = RelationshipBonuses.BIRTHDAY_GREETING;
    }

    // Post player's greeting message into inbox
    setInbox(prev => [...prev, {
      id: `birthday_greeting_${npcId}_${absDay}`,
      type: 'message',
      npcId: npcId,
      senderId: stateRef.current.player.id,
      text: greetingText,
      absDay: absDay,
      read: true
    }]);

    // Mark that player greeted this NPC
    setNpcs(prevN => prevN.map(n => n.id === npcId ? { ...n, birthdayGreetingReceivedAbsDay: absDay } : n));
    
    // Mark greeting as sent in player state
    setState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        birthdayGreetingsSent: {
          ...(prev.player.birthdayGreetingsSent || {}),
          [npcId]: true
        }
      }
    }));

    // Schedule NPC's response for next day
    const respondAbsDay = absDay + 1;
    const npcResponse = matched
      ? getNpcPhrase(npc.behaviorModel, 'gift_excited')
      : getNpcPhrase(npc.behaviorModel, 'gift_birthday');

    setInbox(prev => [...prev, {
      id: `birthday_thanks_${npcId}_${respondAbsDay}`,
      type: 'message',
      npcId: npcId,
      senderId: npcId,
      text: npcResponse,
      absDay: respondAbsDay,
      read: false
    }]);

    // Apply relationship changes via addRelationshipPoints (ensures min-lock and enemy badge logic)
    if (bonusToAdd && addRelationshipPoints) {
      addRelationshipPoints(npcId, bonusToAdd);
    }

    return true;
  };

  // Check if player has any pending team application
  const hasPendingApplication = () => {
    return teams.some(t => (t as any).pendingApplication && typeof (t as any).pendingApplication.reviewAbsDay === 'number');
  };

  // Create a collab project with an NPC
  const createCollabProject = (npcId: string, projectName: string, projectDesc: string) => {
    const npc = npcs.find(n => n.id === npcId);
    if (!npc) return;
    
    // Create a new project with the NPC as leader
    const newProject: Project = {
      id: `collab_${npcId}_${Date.now()}`,
      name: projectName || `РЎРѕРІРјРµСЃС‚РЅС‹Р№ РїСЂРѕРµРєС‚ СЃ ${npc.name}`,
      description: projectDesc || '',
      npcId: npcId,
      leaderId: npcId,
      durationWeeks: 2,
      duration: 'fast',
      type: 'group',
      isTeamProject: false,
      trainingNeeded: Math.max(1, (2 - 1) * 2),
      requiredSkill: npc.fSkill > npc.mSkill ? 'F_skill' : 'M_skill',
      minSkillRequired: Math.min(npc.fSkill, npc.mSkill),
      trainingCost: Math.floor((npc.popularity || 50) * 10),
      costumeCost: Math.floor((npc.popularity || 50) * 15),
      baseTraining: 0,
      extraTraining: 0,
      daysActive: 0,
      trainingsCompleted: 0,
      progress: 0,
      status: 'in_progress',
      suitability: 'B+',
    };
    
    // Add to active projects
    setActiveProjects(prev => [...prev, newProject]);
    
    // Mark message as read
    setInbox(prev => 
      prev.map(m => 
        m.type === 'collab_response' && m.npcId === npcId && m.accepted 
          ? { ...m, read: true }
          : m
      )
    );
    
    // Show success event
    try {
      showEventIfIdle({
        id: `collab_project_created_${Date.now()}`,
        type: 'good',
        title: 'РџСЂРѕРµРєС‚ СЃРѕР·РґР°РЅ',
        text: `Р’С‹ СЃРѕР·РґР°Р»Рё СЃРѕРІРјРµСЃС‚РЅС‹Р№ РїСЂРѕРµРєС‚ "${newProject.name}" СЃ ${npc.name}!`,
      });
    } catch (e) { /* ignore */ }
  };

  return (
    <GameContext.Provider value={{
      state,
      npcs,
      teams,
      availableProjects,
      activeProjects,
      completedProjects,
      recentCompleted,
      recentEvent,
      gameEnded,
      npcMetData,
      setNpcMetData,
      updatePlayer,
      addPlayerMoney,
      updateGameTime,
      togglePause,
      setModalPause,
      toggleModalPause,
      setTimeSpeed,
      toggleTheme,
      toggleAnimation,
      completeOnboarding,
      restartGame,
      initializeGame,
      loadGame,
      saveGame,
      resumeGame,
      acceptProject,
      abandonProject,
        updateActiveProject,
        recordTrainingParticipant,
        recordPlayerStyleTraining,
        payForCostume,
        fundProjectTraining,
        setCostumeSavedMoney,
        joinTeam,
        leaveTeam,
        recordExpense,
      applyEffect,
      removeEffect,
      addTeamProject,
      // allow consumer to clear recent completed popup
      clearRecentCompleted: () => setRecentCompleted(null),
      // allow clearing recent event
      clearRecentEvent: () => setRecentEvent(null),
      // show event helper for consumers (shows only if idle)
      showEventIfIdle,
      advanceDays,
      // messenger / application API
      sendTeamApplication,
      inbox,
      markMessageRead,
      queuedApplications,
      hasPendingApplication,
      reserveCostumeForProject,
      releaseReservedCostume,
      getReservedForProject,
      // collab handling
      processCollabAccept,
      processCollabReject,
      // team invitation handling
      processTeamInvitationAccept,
      processTeamInvitationReject,
      processTeamProjectAccept,
      processTeamProjectReject,
      // allow adding completed project programmatically
      addCompletedProject,
      // relationship management
      addRelationshipPoints,
      // outgoing collab proposals
      queuedCollabProposals,
      proposeCollab,
      createCollabProject,
      buyItem,
      buyGift,
      useItem,
      inventory: state.player.inventory || [],
      // clothes/shop API
      clothesCatalog: clothesCatalog,
      playerInventory,
      buyClothesItem,
      pendingCostumeSelection,
      submitCostumeSelection,
      clearPendingCostumeSelection,
      // Dev controls
      setFestivalFrequency,
      getFestivalFrequency,
      // Birthday greeting
      sendBirthdayGreeting,
      // New Year greeting
      sendNewYearGreeting,
      // Community news
      sendCommunityNews,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};





