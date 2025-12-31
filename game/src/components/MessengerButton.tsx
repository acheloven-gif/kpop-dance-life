import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { MessageCircle, Crown, User } from 'lucide-react';
import './MessengerButton.css';
import NPCProfile from './NPCProfile';
import ReactDOM from 'react-dom';
import playSFX from '../utils/sfx';
import MessageToaster from './MessageToaster';
import { GIFTS } from '../types/game';

interface ToasterMessage {
  id: string;
  senderName: string;
  messageText: string;
  senderId: string;
}

const MessengerButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { inbox = [], npcs = [], teams = [], markMessageRead, processCollabAccept, processCollabReject, processTeamInvitationAccept, processTeamInvitationReject, processTeamProjectAccept, processTeamProjectReject, state, proposeCollab, createCollabProject, sendNewYearGreeting, sendBirthdayGreeting, setModalPause } = useGame() as any;
  const [messageText, setMessageText] = useState('');
  const [toasters, setToasters] = useState<ToasterMessage[]>([]);
  const [lastInboxCount, setLastInboxCount] = useState(0);
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(new Set());
  const [birthdayGiftModal, setBirthdayGiftModal] = useState<{ npcId: string; npcName: string } | null>(null);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);

  // Get list of NPCs that player has messaged or who have messaged the player
  const messagesNpcIds = new Set((inbox || []).map((m: any) => m.npcId || m.senderId).filter(Boolean));
  

  // Helper function to check if today is NPC's birthday
  const isBirthdayToday = (npc: any) => {
    if (!npc.birthDate) return false;
    const [npcMonth, npcDay] = npc.birthDate.split('.').map(Number); // npcMonth is 1-12 (calendar)
    // Convert game month (0-11, starting from June) to calendar month (1-12, starting from January)
    // Game month 0=June(6), 1=July(7), ..., 6=December(12), 7=January(1), ..., 11=May(5)
    const calendarMonth = ((state?.gameTime?.month || 0) + 6) % 12 + 1;
    const currentDay = (state?.gameTime?.day || 0) + 1;
    return npcMonth === calendarMonth && npcDay === currentDay;
  };

  // Helper to check if player has already greeted this NPC today
  const hasBirthdayGreetingBeenSent = (npcId: string) => {
    return (state?.player?.birthdayGreetingsSent || {})[npcId] === true;
  };

  // Check if NPC is at least acquaintance level
  const isAcquaintanceOrBetter = (npc: any) => {
    const relPoints = npc.relationshipPoints || 0;
    return relPoints >= 11; // 11+ = acquaintance level
  };

  // Check if NPC has private chat and player can propose collab
  const canProposeCollab = (npcId: string) => {
    const npc = npcs.find((n: any) => n.id === npcId);
    if (!npc) return true; // default allow
    
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

  const getCollabProposalDisabledReason = (npcId: string) => {
    const npc = npcs.find((n: any) => n.id === npcId);
    
    if ((state?.player?.pendingCollabs || {})[npcId]) {
      return 'Предложение коллаба уже отправлено';
    }
    
    if (npc?.hasPrivateChat) {
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
  // Check if there are community news messages
  const hasCommuntiyNews = (inbox || []).some((m: any) => m.npcId === 'COMMUNITY_NEWS');

  const contacts = [
    // Add Community News contact if there are any news messages
    ...(hasCommuntiyNews ? [{ 
      id: 'COMMUNITY_NEWS', 
      name: '📰 Новости коммьюнити',
      faceId: 'news',
      isSystemContact: true
    }] : []),
    // Add regular NPC contacts
    ...(npcs || []).filter((n: any) => 
      // Include if NPC has sent/received messages (already in contact)
      messagesNpcIds.has(n.id) ||
      // Or include based on existing relationship criteria
      (n.relationship && n.relationship !== 'stranger') || 
      (n.trainingTogetherCount || 0) >= 3 || 
      (n.jointProjectsCount || 0) >= 2 || 
      (n.metEvents || []).length > 0
    )
  ];

  const unreadCount = (inbox || []).filter((m: any) => !m.read && m.text && m.npcId).length;
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [projectConstructor, setProjectConstructor] = useState<{ npcId: string; npcName: string; messageId: string } | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectStyle, setProjectStyle] = useState<string | undefined>(undefined);
  const [projectDuration, setProjectDuration] = useState<string | undefined>(undefined);
  const chatWindowRef = React.useRef<HTMLDivElement>(null);

  // Pause game when messenger or birthday gift modal is open
  useEffect(() => {
    const isModalOpen = open || birthdayGiftModal;
    if (isModalOpen && setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [open, birthdayGiftModal, setModalPause]);

  const openForContact = (contact: any) => {
    setSelectedContact(contact);
    // Mark all unread messages from this contact as read
    const unreadMessages = (inbox || []).filter((m: any) => !m.read && (m.npcId === contact.id || m.senderId === contact.id));
    unreadMessages.forEach((msg: any) => {
      if (markMessageRead) markMessageRead(msg.id);
    });
  };

  // Handler for opening messenger from external events
  React.useEffect(() => {
    const handler = (e: any) => {
      const { npcId } = e?.detail || {};
      if (!npcId) return;
      
      // Handle COMMUNITY_NEWS or other system contacts
      if (npcId === 'COMMUNITY_NEWS') {
        setSelectedContact({ id: 'COMMUNITY_NEWS', name: '📰 Новости коммьюнити', faceId: 'news', isSystemContact: true });
        setOpen(true);
        return;
      }
      
      // Handle regular NPC contacts
      const contact = (npcs || []).find((n: any) => n.id === npcId);
      if (contact) {
        setOpen(true);
        setSelectedContact(contact);
        // mark any unread messages from this npc as read
        const msg = (inbox || []).find((m: any) => !m.read && (m.npcId === contact.id || m.senderId === contact.id));
        if (msg && markMessageRead) markMessageRead(msg.id);
      }
    };
    window.addEventListener('open-messenger', handler as EventListener);
    return () => window.removeEventListener('open-messenger', handler as EventListener);
  }, [npcs, inbox, markMessageRead]);

  // Handler for opening project constructor after costume confirmation
  React.useEffect(() => {
    const handler = (e: any) => {
      const { npcId, npcName } = e?.detail || {};
      if (!npcId) return;
      
      // Open messenger with the NPC
      const contact = (npcs || []).find((n: any) => n.id === npcId);
      if (contact) {
        setOpen(true);
        setSelectedContact(contact);
        // Open project constructor UI
        setProjectConstructor({ npcId, npcName: npcName || contact.name, messageId: '' });
      }
    };
    window.addEventListener('open-project-constructor', handler as EventListener);
    return () => window.removeEventListener('open-project-constructor', handler as EventListener);
  }, [npcs]);

  // Effect for detecting new messages and creating toasters
  React.useEffect(() => {
    const unreadMessages = (inbox || []).filter((m: any) => !m.read && m.text && m.npcId);
    
    unreadMessages.forEach((msg: any) => {
      // Check if we've already seen this message
      if (!seenMessageIds.has(msg.id) && !toasters.some(t => t.id === msg.id)) {
        let sender: any = null;
        
        // Handle system contacts like COMMUNITY_NEWS
        if (msg.senderId === 'COMMUNITY_NEWS') {
          sender = { id: 'COMMUNITY_NEWS', name: '📰 Новости коммьюнити' };
        } else {
          // Find regular NPC sender
          sender = (npcs || []).find((n: any) => n.id === msg.senderId || n.id === msg.npcId);
        }
        
        if (sender) {
          const newToaster: ToasterMessage = {
            id: msg.id,
            senderName: sender.name,
            messageText: msg.text,
            senderId: sender.id
          };
          
          setToasters(prev => [...prev, newToaster]);
          playSFX('notification.wav');
          
          // Mark this message ID as seen
          setSeenMessageIds(prev => new Set([...prev, msg.id]));
        }
      }
    });
    
    setLastInboxCount(unreadMessages.length);
  }, [inbox, npcs]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatWindowRef.current && selectedContact) {
      setTimeout(() => {
        if (chatWindowRef.current) {
          chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [selectedContact, inbox]);

  const handleToasterClick = (senderId: string) => {
    // Handle system contacts
    if (senderId === 'COMMUNITY_NEWS') {
      setOpen(true);
      setSelectedContact({ id: 'COMMUNITY_NEWS', name: '📰 Новости коммьюнити', faceId: 'news', isSystemContact: true });
      // Mark messages as read
      const messages = (inbox || []).filter((m: any) => !m.read && m.npcId === 'COMMUNITY_NEWS');
      messages.forEach((msg: any) => {
        if (markMessageRead) markMessageRead(msg.id);
      });
      return;
    }
    
    // Handle regular NPC contacts
    const contact = (npcs || []).find((n: any) => n.id === senderId);
    if (contact) {
      setOpen(true);
      setSelectedContact(contact);
      // Mark messages as read
      const messages = (inbox || []).filter((m: any) => !m.read && (m.npcId === contact.id || m.senderId === contact.id));
      messages.forEach((msg: any) => {
        if (markMessageRead) markMessageRead(msg.id);
      });
      // Remove toaster from list
      setToasters(prev => prev.filter(t => t.senderId !== senderId));
    }
  };

  const removeToaster = (id: string) => {
    setToasters(prev => prev.filter(t => t.id !== id));
  };

  const [showNpcProfileId, setShowNpcProfileId] = React.useState<string | null>(null);
  const closeNpcProfile = () => setShowNpcProfileId(null);

  const openInboxItem = (m: any) => {
    if (markMessageRead) markMessageRead(m.id);
  };

  const getContactTeamInfo = (contact: any): string | null => {
    if (!contact.teamId) return null;
    const team = (teams || []).find((t: any) => t.id === contact.teamId);
    if (!team) return null;
    const isLeader = team.leaderId === contact.id;
    return isLeader ? `${team.name} (Лидер)` : team.name;
  };

  const handleCollabAccept = (msg: any) => {
    if (msg.collabData && processCollabAccept) {
      processCollabAccept(msg.collabData);
      markMessageRead && markMessageRead(msg.id);
    }
  };

  const handleCollabReject = (msg: any) => {
    // Reject = apply -3 reputation penalty
    if (processCollabReject && msg.npcId && msg.npcName) {
      processCollabReject(msg.id, msg.npcId, msg.npcName);
    }
  };

  const handleTeamInvitationAccept = (msg: any) => {
    if (processTeamInvitationAccept && msg.teamId) {
      processTeamInvitationAccept(msg.id, msg.teamId);
    }
  };

  const handleTeamInvitationReject = (msg: any) => {
    if (processTeamInvitationReject && msg.teamId) {
      processTeamInvitationReject(msg.id, msg.teamId);
    }
  };

  const handleTeamProjectAccept = (msg: any) => {
    if (processTeamProjectAccept && msg.teamId) {
      processTeamProjectAccept(msg.id, msg.teamId, msg.teamProjectData);
    }
  };

  const handleTeamProjectReject = (msg: any) => {
    if (processTeamProjectReject && msg.teamId) {
      processTeamProjectReject(msg.id, msg.teamId);
    }
  };

  const handleCollabResponseCreateProject = (msg: any) => {
    if (msg.type === 'collab_response' && msg.accepted && msg.npcId) {
      setProjectConstructor({ npcId: msg.npcId, npcName: msg.text || 'NPC', messageId: msg.id });
      setProjectName('');
      setProjectDesc('');
      playSFX('click.wav');
    }
  };

  const isCollabExpired = (msg: any): boolean => {
    if (msg.type !== 'collab_offer' || !msg.expiresAbsDay) return false;
    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;
    const currentAbsDay = state.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + state.gameTime.month * DAYS_PER_MONTH + state.gameTime.day;
    return currentAbsDay >= msg.expiresAbsDay;
  };

  const getDaysAgo = (messageAbsDay?: number): string => {
    if (messageAbsDay === undefined) return '';
    const DAYS_PER_MONTH = 30;
    const MONTHS_PER_YEAR = 12;
    const currentAbsDay = state.gameTime.year * (MONTHS_PER_YEAR * DAYS_PER_MONTH) + state.gameTime.month * DAYS_PER_MONTH + state.gameTime.day;
    const daysElapsed = currentAbsDay - messageAbsDay;
    if (daysElapsed === 0) return 'сегодня';
    if (daysElapsed === 1) return '1 день назад';
    if (daysElapsed <= 4) return `${daysElapsed} дня назад`;
    return `${daysElapsed} дней назад`;
  };

  return (
    <div className="messenger-root">
      <button className="messenger-toggle compact" onClick={() => setOpen(v => !v)} title="Мессенджер" aria-label="Мессенджер">
        <MessageCircle size={18} />
        {unreadCount > 0 && <span className="messenger-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="messenger-modal-overlay" style={showNpcProfileId ? { display: 'none' } : {}}>
          <div className="messenger-modal">
            <div className="messenger-left">
              <div className="messenger-left-header">Контакты</div>
              <div className="messenger-contacts-list">
                {contacts.length === 0 && <div className="muted">Нет знакомых NPC</div>}
                {contacts.map((c: any) => {
                  // Handle special system contacts
                  if (c.isSystemContact) {
                    return (
                      <div key={c.id} className={`messenger-contact-row ${selectedContact?.id === c.id ? 'selected' : ''}`} onClick={() => openForContact(c)}>
                        <div className="avatar-wrap">
                          <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff69b4, #ff1493)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff', fontWeight: 'bold'}}>📰</div>
                        </div>
                        <div className="contact-meta">
                          <div className="contact-name">
                            <span style={{marginLeft:8}}>{c.name}</span>
                          </div>
                          <div className="contact-sub">Сообщения сообщества</div>
                        </div>
                        <div className="contact-unread">{(inbox || []).filter((m: any) => !m.read && m.npcId === c.id).length || ''}</div>
                      </div>
                    );
                  }

                  const teamInfo = getContactTeamInfo(c);
                  const subText = teamInfo || ((c.relationship === 'friend' && 'друзья') || (c.relationship === 'acquaintance' && 'знакомы') || 'не знакомы');
                  return (
                    <div key={c.id} className={`messenger-contact-row ${selectedContact?.id === c.id ? 'selected' : ''}`} onClick={() => openForContact(c)}>
                      <div className="avatar-wrap">
                        <img src={`/avatars/normalized/${c.faceId}`} alt={c.name} onError={(e: any) => { const img = e.currentTarget as HTMLImageElement; if (!img.src.includes('default.svg')) img.src = `/avatars/normalized/default.svg`; }} />
                        {(() => {
                          const team = (teams || []).find((t: any) => t.id === c.teamId);
                          const isLeader = team && team.leaderId === c.id;
                          return isLeader ? <Crown className="leader-crown" size={12} strokeWidth={2} color={'#FFD700'} /> : null;
                        })()}
                      </div>
                      <div className="contact-meta">
                        <div className="contact-name">
                          <button className="profile-icon" onClick={(e) => { e.stopPropagation(); setShowNpcProfileId(c.id); }} title="Профиль NPC">
                            <User size={14} />
                          </button>
                          <span style={{marginLeft:8}}>{c.name}</span>
                        </div>
                        <div className="contact-sub">{subText}</div>
                      </div>
                      <div className="contact-unread">{(inbox || []).filter((m: any) => !m.read && (m.npcId === c.id || m.senderId === c.id)).length || ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="messenger-right">
              <div className="messenger-right-header">
                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <div className="title">{selectedContact ? selectedContact.name : 'Входящие'}</div>
                  {selectedContact && !selectedContact.isSystemContact && (
                    <button 
                      className="btn-action small" 
                      onClick={() => { setShowNpcProfileId(selectedContact.id); }}
                      style={{padding: '4px 10px', fontSize: '12px', background: 'transparent', border: '1px solid rgba(255, 105, 180, 0.3)', color: '#ff69b4'}}
                    >
                      Профиль
                    </button>
                  )}
                </div>
                <div className="actions">
                  <button onClick={() => setOpen(false)} className="btn-close">✕</button>
                </div>
              </div>
              <div className="messenger-right-body">
                {selectedContact ? (
                  <>
                    <div className="chat-window" ref={chatWindowRef}>
                      {selectedContact && !selectedContact.isSystemContact && (() => {
                        const npc = (npcs || []).find((n: any) => n.id === selectedContact.id);
                        const relPoints = npc?.relationshipPoints || 0;
                        const isPrivateChat = npc?.hasPrivateChat;
                        const isStranger = relPoints <= 10 && isPrivateChat;
                        const isEnemy = npc?.enemyBadge && isPrivateChat;
                        if (isPrivateChat && (isStranger || isEnemy)) {
                          return (
                            <div style={{
                              padding: '16px',
                              background: 'linear-gradient(135deg, rgba(255,105,180,0.15), rgba(255,105,180,0.08))',
                              borderRadius: '8px',
                              borderLeft: '4px solid #ff69b4',
                              textAlign: 'center',
                              marginBottom: '16px',
                              fontWeight: '600',
                              color: '#ff69b4'
                            }}>
                              🔒 Закрытый аккаунт<br/>
                              <span style={{fontSize: '13px', fontWeight: '400', color: '#999'}}>
                                {isEnemy ? 'Этот NPC не принимает сообщения от врагов' : 'Этот NPC не принимает сообщения от незнакомцев'}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {(inbox || []).filter((m: any) => {
                        // Для NPC: показываем все сообщения, где npcId или senderId совпадает с id NPC или с id его команды
                        if (!selectedContact) return false;
                        if (selectedContact.isSystemContact) return m.npcId === 'COMMUNITY_NEWS';
                        const npcId = selectedContact.id;
                        const npc = (npcs || []).find((n: any) => n.id === npcId);
                        const teamIds = [];
                        if (npc?.teamId) teamIds.push(npc.teamId);
                        // Показываем сообщения, если:
                        // - npcId или senderId совпадает с id NPC
                        // - npcId или senderId совпадает с id его команды
                        // - или это сообщение о ответе на заявку (npcId совпадает с лидером)
                        const shouldShow = (
                          m.npcId === npcId ||
                          m.senderId === npcId ||
                          (teamIds.length > 0 && (teamIds.includes(m.npcId) || teamIds.includes(m.senderId)))
                        );
                        if (m.type === 'message' && m.text && (m.text.includes('team') || m.text.includes('Team'))) {
                          console.log('[FilterMessage]', { msg: m.id, type: m.type, npcId: m.npcId, senderId: m.senderId, selectedContact: npcId, teamIds, shouldShow });
                        }
                        return shouldShow;
                      }).reverse().map((m: any) => {
                        const isFromPlayer = m.senderId === state?.player?.id;
                        const isCommunityNews = selectedContact.isSystemContact && m.npcId === 'COMMUNITY_NEWS';
                        return (
                        <div key={m.id} className={`chat-message ${m.read ? 'read' : 'unread'} ${isCommunityNews ? 'from-npc' : (isFromPlayer ? 'from-player' : 'from-npc')}`} style={isCommunityNews ? {background: 'linear-gradient(135deg, rgba(255,105,180,0.1), rgba(255,105,180,0.05))', borderLeft: '3px solid #ff69b4'} : {}}>
                          <div className="chat-bubble" style={isCommunityNews ? {background: 'linear-gradient(135deg, rgba(255,105,180,0.15), rgba(255,105,180,0.08))', color: '#ff69b4', fontWeight: '600', borderRadius: '8px'} : {}}>
                            <div className="chat-text">{m.text}</div>
                            <div className="chat-time">{getDaysAgo(m.absDay)}</div>
                          </div>
                          {m.type === 'collab_offer' && !selectedContact.isSystemContact && (
                            <div className="chat-actions">
                              <button 
                                className="btn-accept" 
                                onClick={() => handleCollabAccept(m)}
                                disabled={isCollabExpired(m)}
                              >
                                Принять
                              </button>
                              <button 
                                className="btn-reject" 
                                onClick={() => handleCollabReject(m)}
                                disabled={isCollabExpired(m)}
                              >
                                Отказать
                              </button>
                              {isCollabExpired(m) && <div className="msg-expired">Предложение истекло</div>}
                            </div>
                          )}
                          {m.type === 'team_invitation' && !selectedContact.isSystemContact && (
                            <div className="msg-actions">
                              <button 
                                className="btn-accept" 
                                onClick={() => handleTeamInvitationAccept(m)}
                                title="Принять приглашение"
                              >
                                ✓ Принять
                              </button>
                              <button 
                                className="btn-reject" 
                                onClick={() => handleTeamInvitationReject(m)}
                                title="Отказать"
                              >
                                ✕ Отказать
                              </button>
                            </div>
                          )}
                          {m.type === 'team_project_offer' && (
                            <div className="msg-actions">
                              <button 
                                className="btn-accept" 
                                onClick={() => handleTeamProjectAccept(m)}
                                title="Принять проект"
                              >
                                ✓ Принять
                              </button>
                              <button 
                                className="btn-reject" 
                                onClick={() => handleTeamProjectReject(m)}
                                title="Отказать"
                              >
                                ✕ Отказать
                              </button>
                            </div>
                          )}
                          {m.type === 'collab_response' && m.accepted && (
                            <div className="chat-actions">
                              <button
                                className="btn-create-project"
                                onClick={() => handleCollabResponseCreateProject(m)}
                              >
                                Создать проект
                              </button>
                            </div>
                          )}
                          {m.type === 'birthday_reminder' && !selectedContact.isSystemContact && (
                            <div className="chat-actions">
                              <button
                                className="btn-accept"
                                onClick={() => { setBirthdayGiftModal({ npcId: selectedContact.id, npcName: selectedContact.name }); setSelectedGiftId(null); }}
                                title="Выбрать подарок и поздравить"
                              >
                                🎁 Подарить
                              </button>
                            </div>
                          )}
                          {m.type === 'collab_response' && !m.accepted && (
                            <div style={{marginTop: '8px', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', color: '#ef4444', fontSize: '12px', fontWeight: '600'}}>
                              К сожалению, {selectedContact?.name} отказал предложение
                            </div>
                          )}
                          {m.type === 'team_application' && m.accepted && (
                            <div style={{marginTop: '8px', padding: '8px', background: 'rgba(34,197,94,0.1)', borderRadius: '6px', color: '#22c55e', fontSize: '12px', fontWeight: '600'}}>
                              ✓ Заявка принята!
                            </div>
                          )}
                          {m.type === 'team_application' && !m.accepted && (
                            <div style={{marginTop: '8px', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', color: '#ef4444', fontSize: '12px', fontWeight: '600'}}>
                              Заявка отклонена
                            </div>
                          )}
                          {m.teamId && <div className="chat-meta">Команда: {m.teamId} — {m.accepted ? 'Принято' : 'Отказ'}</div>}
                        </div>
                        );
                      })}
                    </div>
                    {selectedContact && (
                      <>
                        {projectConstructor && projectConstructor.npcId === selectedContact?.id ? (
                          // Inline Project Constructor in Dialog
                          <div className="chat-composer" style={{flexDirection: 'column', gap: 16, padding: '16px', background: 'linear-gradient(135deg,rgba(255,105,180,0.05),rgba(255,105,180,0.02))', borderRadius: 8}}>
                            <div style={{fontWeight: 700, color: '#ff69b4', fontSize: 16}}>Создать проект с {projectConstructor.npcName}</div>
                            <div style={{display:'flex', flexDirection:'column', gap: 12}}>
                              <div>
                                <label style={{display:'block', fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#333'}}>Название проекта</label>
                                <input 
                                  type="text" 
                                  value={projectName}
                                  onChange={(e) => setProjectName(e.target.value)}
                                  placeholder="Введите название проекта"
                                  style={{width:'100%', padding: '10px 12px', border: '1px solid rgba(255,105,180,0.2)', borderRadius: 6, fontSize: 14}}
                                />
                              </div>
                              <div>
                                <label style={{display:'block', fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#333'}}>Стиль проекта</label>
                                <div style={{display:'flex', gap:8}}>
                                  {['F_skill','M_skill','Both'].map((style) => (
                                    <span key={style}
                                      onClick={() => setProjectStyle(style)}
                                      style={{
                                        padding: '6px 14px',
                                        borderRadius: 6,
                                        background: projectStyle === style ? 'linear-gradient(135deg,#ff69b4,#ff1493)' : '#f3f3f3',
                                        color: projectStyle === style ? '#fff' : '#333',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        border: projectStyle === style ? '2px solid #ff69b4' : '1px solid #ddd',
                                        boxShadow: projectStyle === style ? '0 2px 8px rgba(255,105,180,0.15)' : 'none'
                                      }}>
                                      {style === 'F_skill' ? 'Женский' : style === 'M_skill' ? 'Мужской' : 'Оба'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label style={{display:'block', fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#333'}}>Длительность проекта</label>
                                <div style={{display:'flex', gap:8}}>
                                  {['fast','long'].map((dur) => (
                                    <span key={dur}
                                      onClick={() => setProjectDuration(dur)}
                                      style={{
                                        padding: '6px 14px',
                                        borderRadius: 6,
                                        background: projectDuration === dur ? 'linear-gradient(135deg,#ff69b4,#ff1493)' : '#f3f3f3',
                                        color: projectDuration === dur ? '#fff' : '#333',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        border: projectDuration === dur ? '2px solid #ff69b4' : '1px solid #ddd',
                                        boxShadow: projectDuration === dur ? '0 2px 8px rgba(255,105,180,0.15)' : 'none'
                                      }}>
                                      {dur === 'fast' ? 'Быстрый' : 'Долгий'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div style={{display:'flex', gap: 10, justifyContent:'flex-end'}}>
                              <button 
                                onClick={() => setProjectConstructor(null)}
                                style={{padding: '8px 16px', border: '1px solid rgba(255,105,180,0.3)', background: '#fff', color: '#ff69b4', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13}}
                              >
                                Отмена
                              </button>
                              <button 
                                onClick={() => {
                                  if (!projectName.trim() || !projectStyle || !projectDuration) {
                                    playSFX('error.wav');
                                    return;
                                  }
                                  // Формула тренировок как в projectGenerator
                                  const isFast = projectDuration === 'fast';
                                  const durationWeeks = isFast ? (2 + Math.floor(Math.random() * 7)) : (9 + Math.floor(Math.random() * 12));
                                  const use2Trainings = Math.random() < 0.6;
                                  const trainingPerWeek = use2Trainings ? 2 : 3;
                                  const effectiveWeeks = Math.max(1, durationWeeks - 1);
                                  const totalTrainingsRequired = effectiveWeeks * trainingPerWeek;
                                  createCollabProject && createCollabProject(projectConstructor.npcId, projectName, {
                                    style: projectStyle,
                                    duration: projectDuration,
                                    durationWeeks,
                                    trainingNeeded: totalTrainingsRequired
                                  });
                                  playSFX('coin.wav');
                                  setProjectConstructor(null);
                                  setProjectName('');
                                  setProjectDesc('');
                                  setProjectStyle(undefined);
                                  setProjectDuration(undefined);
                                }}
                                style={{padding: '8px 20px', background: 'linear-gradient(135deg, #ff69b4, #ff1493)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13}}
                              >
                                Создать проект
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Standard Chat Composer
                          <div className="chat-composer">
                            {!selectedContact.isSystemContact && (
                              <button 
                                className="btn-propose-collab"
                                onClick={() => { proposeCollab(selectedContact.id); }}
                                disabled={(state?.player?.pendingCollabs || {})[selectedContact.id] || !canProposeCollab(selectedContact.id)}
                                style={{opacity: ((state?.player?.pendingCollabs || {})[selectedContact.id] || !canProposeCollab(selectedContact.id)) ? 0.5 : 1, cursor: ((state?.player?.pendingCollabs || {})[selectedContact.id] || !canProposeCollab(selectedContact.id)) ? 'not-allowed' : 'pointer'}}
                                title={getCollabProposalDisabledReason(selectedContact.id) || 'Предложить коллаб'}
                              >
                                {(state?.player?.pendingCollabs || {})[selectedContact.id] ? 'Предложение отправлено' : 'Предложить коллаб'}
                              </button>
                            )}
                            {((state?.gameTime?.month === 6) || (state?.gameTime?.month === 7 && state?.gameTime?.day === 0)) && !selectedContact.isSystemContact && (() => {
                              const npc = npcs.find((n: any) => n.id === selectedContact.id);
                              if (!npc) return null;
                              
                              // Check if chat is closed for this NPC
                              const relPoints = npc.relationshipPoints || 0;
                              const isPrivateChat = npc.hasPrivateChat;
                              const isStranger = relPoints <= 10 && isPrivateChat;
                              const isEnemy = npc.enemyBadge && isPrivateChat;
                              
                              // If chat is closed, don't show greeting button
                              if (isPrivateChat && (isStranger || isEnemy)) {
                                return null;
                              }
                              
                              return (
                                <div style={{display: 'flex', gap: 8, alignItems: 'flex-end', width: '100%', marginTop: 12}}>
                                  <button
                                    onClick={() => { if (selectedContact && sendNewYearGreeting) { sendNewYearGreeting(selectedContact.id); playSFX('notification.wav'); } }}
                                    className="btn-action small"
                                    title="Поздравить с Новым Годом"
                                  >
                                    🎄 Поздравить
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </>
                    )}
                      </>
                    ) : (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: 14}}>
                    Выберите контакт слева, чтобы начать
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Birthday Gift Selection Modal */}
      {birthdayGiftModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 12000}}>
          <div style={{background: '#fff', borderRadius: 12, padding: 24, maxWidth: 600, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'}}>
            <h2 style={{marginTop: 0, marginBottom: 16, color: '#333', fontSize: 18, fontWeight: 700}}>Выберите подарок для {birthdayGiftModal.npcName}</h2>
            <p style={{marginBottom: 16, color: '#666', fontSize: 13}}>Выберите подарок, который хотите подарить:</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}>
              {GIFTS.map((gift) => (
                <div
                  key={gift.id}
                  onClick={() => setSelectedGiftId(gift.id)}
                  style={{
                    border: selectedGiftId === gift.id ? '2px solid #ff69b4' : '1px solid #ddd',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: selectedGiftId === gift.id ? 'rgba(255,105,180,0.08)' : '#f9f9f9',
                    transition: 'all 0.2s',
                    boxShadow: selectedGiftId === gift.id ? '0 2px 12px rgba(255,105,180,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: 180,
                  }}
                >
                  <div style={{width: 64, height: 64, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <img src={gift.img || '/shop/gift_default.png'} alt={gift.name} style={{width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8, background: '#fff'}} onError={e => { (e.currentTarget as HTMLImageElement).src = '/shop/gift_default.png'; }} />
                  </div>
                  <div style={{fontWeight: 700, color: '#333', marginBottom: 4, textAlign: 'center'}}>{gift.name}</div>
                  <div style={{fontSize: 12, color: '#666', marginBottom: 6, textAlign: 'center'}}>{gift.description}</div>
                  <div style={{fontSize: 13, fontWeight: 600, color: '#ff69b4', marginBottom: 2}}>Бонус: +{gift.matchedRelationshipBonus}</div>
                </div>
              ))}
            </div>
            <div style={{display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
              <button
                onClick={() => { setBirthdayGiftModal(null); setSelectedGiftId(null); }}
                style={{padding: '10px 16px', border: '1px solid #ddd', background: '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13}}
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (sendBirthdayGreeting) {
                    sendBirthdayGreeting(birthdayGiftModal.npcId, selectedGiftId || undefined);
                    playSFX('notification.wav');
                  }
                  setBirthdayGiftModal(null);
                  setSelectedGiftId(null);
                }}
                disabled={!selectedGiftId}
                style={{padding: '10px 20px', background: selectedGiftId ? 'linear-gradient(135deg, #ff69b4, #ff1493)' : '#ccc', color: '#fff', border: 'none', borderRadius: 6, cursor: selectedGiftId ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 13}}
              >
                Подарить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Toasters */}
      {toasters.map((toaster) => (
        <MessageToaster
          key={toaster.id}
          id={toaster.id}
          senderName={toaster.senderName}
          messageText={toaster.messageText}
          senderId={toaster.senderId}
          onClickToaster={handleToasterClick}
          onDismiss={removeToaster}
        />
      ))}

      {/* NPC Profile Portal - rendered outside messenger modal */}
      {showNpcProfileId && ReactDOM.createPortal(
        <NPCProfile npcId={showNpcProfileId} onClose={closeNpcProfile} />,
        document.body
      )}
    </div>
  );
};

export default MessengerButton;

