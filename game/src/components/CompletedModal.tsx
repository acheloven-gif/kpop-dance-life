import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import playSFX from '../utils/sfx';
import './EventModal.css';
import { ReputationIcon, PopularityIcon } from '../figma/other';
import { AudioManager } from './AudioManager';

const CompletedModal: React.FC = () => {
  const { state, recentCompleted, clearRecentCompleted, setModalPause } = useGame();
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (recentCompleted) {
      if (!soundPlayedRef.current) {
        playSFX('notification.wav');
        soundPlayedRef.current = true;
      }
      if (setModalPause) {
        setModalPause(true);
      }
    } else {
      soundPlayedRef.current = false;
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [recentCompleted, setModalPause]);


  if (!recentCompleted) return null;
  // Сохраняем в window.recentCompleted для MainTabs
  (window as any).recentCompleted = recentCompleted;
  const proj: any = recentCompleted;
  const title = proj.success ? `Проект завершён: ${proj.name}` : `Отмена проекта: ${proj.name}`;

  return (
    <div className="event-overlay">
      <div className={`event-modal event-${proj.success ? 'good' : 'bad'}`}> 
        <div className="event-header">
          <h3>{title}</h3>
          <AudioManager position="inline" />
        </div>
        <div className="event-body">
          {!proj.success ? (
            <>
              {proj.failedDueToDeadline ? (
                <p>Дедлайн проекта истёк.</p>
              ) : (
                <p>Вы не успели посетить достаточно тренировок за установленный срок. Проект сорван.</p>
              )}
            </>
          ) : (
            <>
              <div className="event-effects">
                <div className="effect-positive">
                  👍 {proj.likes || 0}
                </div>
                <div className="effect-negative">
                  👎 {proj.dislikes || 0}
                </div>
                {typeof proj.reputationChange === 'number' && (
                  <div className={proj.reputationChange >= 0 ? 'effect-positive' : 'effect-negative'}>
                    <ReputationIcon size={18} className="icon-inline" /> Репутация: {proj.reputationChange >= 0 ? '+' : ''}{proj.reputationChange}
                  </div>
                )}
              </div>
              <div className="comments">
                <div className="comments-heading">Комментарии:</div>
                {proj.success && Array.isArray(proj.comments) && proj.comments.length > 0 ? (
                  (() => {
                    const comments = proj.comments as any[];
                    const likes = proj.likes || 0;
                    const dislikes = proj.dislikes || 0;
                    const totalReactions = likes + dislikes;
                    
                    // Adjust comment distribution based on likes vs dislikes
                    let sortedComments = [...comments];
                    if (totalReactions > 0) {
                      const positiveRatio = likes / totalReactions;
                      const positiveCount = Math.round(comments.length * positiveRatio);
                      const positiveComments = comments.filter(c => c.positive);
                      const negativeComments = comments.filter(c => !c.positive);
                      
                      // Reorder to show more positive/negative based on likes/dislikes
                      sortedComments = [
                        ...positiveComments.slice(0, Math.max(1, positiveCount)),
                        ...negativeComments.slice(0, Math.max(1, comments.length - positiveCount))
                      ];
                    }
                    
                    return sortedComments.map((c, i) => (
                      <div key={i} className={`comment ${c.positive ? 'positive' : 'negative'}`}> 
                        {c.text}
                      </div>
                    ));
                  })()
                ) : (
                  <div className="small" style={{color:'#777'}}>Комментариев нет</div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="event-footer">
          <button className="btn-event-close" onClick={() => { clearRecentCompleted && clearRecentCompleted(); playSFX('close.wav'); }}>
            ОК
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletedModal;
