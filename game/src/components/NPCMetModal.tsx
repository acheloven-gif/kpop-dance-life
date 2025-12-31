import React, { useEffect } from 'react';
import './NPCMetModal.css';
import { FemaleStyleIcon, MaleStyleIcon } from '../figma/other';
import { useGame } from '../context/GameContext';

interface NPCMetModalProps {
  npc: {
    id: string;
    name: string;
    faceId: string;
    fSkill: number;
    mSkill: number;
    teamId?: string | null;
    teamName?: string;
    behaviorModel: string;
  };
  relationship: 'acquaintance' | 'friend';
  teamInfo?: {
    name: string;
    dominantStyle?: 'F_style' | 'M_style' | 'Both';
  };
  onClose: () => void;
}

// Behavior descriptions
const behaviorDescriptions: Record<string, string> = {
  'Burner': 'Азартная, энергичная, всегда готова на авось. Импульсивна и не любит долгих планов.',
  'Dreamer': 'Мечтательная и романтичная. Идеалистка, верит в лучшее будущее.',
  'Perfectionist': 'Требовательна к себе и окружающим. Учится на своих ошибках, всегда стремится к совершенству.',
  'Sunshine': 'Добрая и отзывчивая. Любит помогать другим, создает позитивную атмосферу.',
  'Machine': 'Прагматична и расчетлива. Видит танец как инструмент достижения целей.',
  'Wildcard': 'Непредсказуема и авантюрна. Всегда держит интригу.',
  'Fox': 'Хитра и расчетлива. Знает, как добиться своего.',
  'SilentPro': 'Тихая и скромная, но исключительно талантлива. Избегает внимания.'
};

const NPCMetModal: React.FC<NPCMetModalProps> = ({ npc, relationship, teamInfo, onClose }) => {
  const { setModalPause } = useGame();

  // Pause game when NPC met modal is displayed
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

  let dominantSkill: React.ReactNode = null;
  if (npc.fSkill > npc.mSkill) {
    dominantSkill = <><FemaleStyleIcon size={18} className="icon-inline" /> Женский стиль</>;
  } else if (npc.mSkill > npc.fSkill) {
    dominantSkill = <><MaleStyleIcon size={18} className="icon-inline" /> Мужской стиль</>;
  } else {
    dominantSkill = <>Оба стиля (примерно равно)</>;
  }
  const dominantSkillLevel = Math.max(npc.fSkill, npc.mSkill);

  return (
    <div className="modal-overlay npc-met-overlay">
      <div className="modal npc-met-modal">
        <div className="npc-met-header">
          <button className="close" onClick={onClose}>✕</button>
          <div className="npc-met-title">
            {relationship === 'friend' ? '🌟 Новый друг!' : '👋 Новое знакомство'}
          </div>
        </div>

        <div className="npc-met-body">
          {/* NPC Avatar and Basic Info */}
          <div className="npc-met-avatar-section">
            <div className="npc-met-avatar-wrapper">
              <img
                src={`/avatars/normalized/${npc.faceId}`}
                alt={npc.name}
                className="npc-met-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                }}
              />
            </div>
          </div>

          {/* Name and Status */}
          <div className="npc-met-info">
            <h2 className="npc-met-name">{npc.name}</h2>
            <div className="npc-met-status">
              {relationship === 'friend' ? (
                <span className="status-badge status-friend">Друг/Подруга</span>
              ) : (
                <span className="status-badge status-acquaintance">Знакомый/Знакомая</span>
              )}
            </div>
          </div>

          {/* Team Info (if applicable) */}
          {teamInfo && (
            <div className="npc-met-team">
              <div className="team-label">Команда:</div>
              <div className="team-name">{teamInfo.name}</div>
              {teamInfo.dominantStyle && (
                <div className="team-style">
                  Стиль:
                  {teamInfo.dominantStyle === 'F_style' && <><FemaleStyleIcon size={16} className="icon-inline" /> Женский</>}
                  {teamInfo.dominantStyle === 'M_style' && <><MaleStyleIcon size={16} className="icon-inline" /> Мужской</>}
                  {teamInfo.dominantStyle === 'Both' && <>🔀 Оба</>}
                </div>
              )}
            </div>
          )}

          {/* Dominant Skill */}
          <div className="npc-met-skill">
            <div className="skill-label">Любимый стиль:</div>
            <div className="skill-value">{dominantSkill}</div>
            <div className="skill-level">Уровень: <strong>{dominantSkillLevel}</strong></div>
          </div>

          {/* Behavior/Character Description */}
          <div className="npc-met-behavior">
            <div className="behavior-label">Характер:</div>
            <div className="behavior-type">{npc.behaviorModel}</div>
            <div className="behavior-description">
              {behaviorDescriptions[npc.behaviorModel] || 'Интересная личность с неповторимым стилем.'}
            </div>
          </div>
        </div>

        <div className="npc-met-footer">
          <button className="btn-close-modal" onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

export default NPCMetModal;
