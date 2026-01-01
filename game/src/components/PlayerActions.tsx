import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './PlayerActions.css';
import { DumbbellIcon, RestIcon } from '../figma/other';
import playSFX from '../utils/sfx';

const MAX_WEEKLY_CHOREO = 3; // weekly cap per style (changed to 3)

const PlayerActions: React.FC = () => {
  const { state, updatePlayer, advanceDays, teams, recordTrainingParticipant, recordPlayerStyleTraining, recordExpense, setModalPause } = useGame();
  const [fFeedback, setFFeedback] = useState<string | null>(null);
  const [mFeedback, setMFeedback] = useState<string | null>(null);
  const [showRestConfirm, setShowRestConfirm] = useState(false);

  // Pause game when rest confirmation modal is open
  useEffect(() => {
    if (showRestConfirm && setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [showRestConfirm, setModalPause]);

  const cost = 300;
  const gain = 2;
  const tiredGain = 2 / 3; // reduced by 3x to match global change

  // compute dynamic training cost from active effects
  const effects = state.player.effects || [];
  const costMultiplier = effects.reduce((acc: number, ef: any) => acc * (ef.trainingCostMultiplier ?? 1), 1);
  const cappedCostMultiplier = Math.max(0.2, Math.min(costMultiplier, 3));
  const displayCost = Math.max(0, Math.round(cost * cappedCostMultiplier));

  const absDay = state.gameTime.year * 360 + state.gameTime.month * 30 + state.gameTime.day;

  const exhaustedF = (state.player.fTrainingsThisWeek || 0) >= MAX_WEEKLY_CHOREO;
  const exhaustedM = (state.player.mTrainingsThisWeek || 0) >= MAX_WEEKLY_CHOREO;
  const canAfford = (state.player.money || 0) >= displayCost;
  const trainerAwayFemaleUntil = (state.player.trainerAwayFemaleUntil ?? -1);
  const trainerAwayMaleUntil = (state.player.trainerAwayMaleUntil ?? -1);
  const trainerAwayF = trainerAwayFemaleUntil >= 0 && absDay < trainerAwayFemaleUntil;
  const trainerAwayM = trainerAwayMaleUntil >= 0 && absDay < trainerAwayMaleUntil;
  const canTrainF = !exhaustedF && canAfford && !trainerAwayF;
  const canTrainM = !exhaustedM && canAfford && !trainerAwayM;

  const trainFSkill = () => {
    if (!canTrainF) {
      if (trainerAwayF) {
        const daysLeft = Math.max(0, trainerAwayFemaleUntil - absDay);
        setFFeedback(`Тренер в отпуске — осталось ${daysLeft} дн.`);
      } else if (state.player.money < displayCost) {
        setFFeedback('Недостаточно денег!');
      } else {
        setFFeedback('На этой неделе тренировки кончились');
      }
      setTimeout(() => setFFeedback(null), 3000);
      return;
    }

    const isBlockedByBadDay = state.player.skillBlockedToday ?? false;
    const skillGain = isBlockedByBadDay ? 0 : gain;

    try { recordExpense && recordExpense('Тренировка: женский стиль', displayCost, 'training'); } catch (e) { }
    updatePlayer({
      money: state.player.money - displayCost,
      fSkill: state.player.fSkill + skillGain,
      tired: Math.min(100, state.player.tired + tiredGain),
      lastTrainedAbsDay: absDay,
      lastTrainedFAbsDay: absDay,
      fTrainingsThisWeek: (state.player.fTrainingsThisWeek || 0) + 1,
    });

    recordPlayerStyleTraining && recordPlayerStyleTraining('F');

    // NOTE: per design, style trainings (choreographer) do NOT count toward project progress.
    // They only affect player's skill, tiredness and weekly counters. Active projects progress
    // is driven only by trainings scheduled in the project (baseTraining + extraTraining).

    // Record NPC participation (player's team members participate)
    try {
      const teamId = state.player.teamId;
      if (teamId && teams) {
        const team = teams.find(t => t.id === teamId);
        if (team && team.memberIds) {
          team.memberIds.forEach(mid => recordTrainingParticipant && recordTrainingParticipant(mid));
        }
      }
    } catch (e) {
      // ignore
    }

    const feedback = isBlockedByBadDay 
      ? `Тренировка женского стиля: 0 (плохой день!)`
      : `Тренировка женского стиля: +${gain}`;
    setFFeedback(feedback);
    playSFX('click.wav');
    setTimeout(() => setFFeedback(null), 3000);
  };

  const trainMSkill = () => {
    if (!canTrainM) {
      if (trainerAwayM) {
        const daysLeft = Math.max(0, trainerAwayMaleUntil - absDay);
        setMFeedback(`Тренер в отпуске — осталось ${daysLeft} дн.`);
      } else if (state.player.money < displayCost) {
        setMFeedback('Недостаточно денег!');
      } else {
        setMFeedback('На этой неделе тренировки кончились');
      }
      setTimeout(() => setMFeedback(null), 3000);
      return;
    }

    const isBlockedByBadDay = state.player.skillBlockedToday ?? false;
    const skillGain = isBlockedByBadDay ? 0 : gain;

    try { recordExpense && recordExpense('Тренировка: мужской стиль', displayCost, 'training'); } catch (e) { }
    updatePlayer({
      money: state.player.money - displayCost,
      mSkill: state.player.mSkill + skillGain,
      tired: Math.min(100, state.player.tired + tiredGain),
      lastTrainedAbsDay: absDay,
      lastTrainedMAbsDay: absDay,
      mTrainingsThisWeek: (state.player.mTrainingsThisWeek || 0) + 1,
    });

    recordPlayerStyleTraining && recordPlayerStyleTraining('M');

    // NOTE: per design, style trainings (choreographer) do NOT count toward project progress.
    // They only affect player's skill, tiredness and weekly counters.

    // Record NPC participation (player's team members participate)
    try {
      const teamId = state.player.teamId;
      if (teamId && teams) {
        const team = teams.find(t => t.id === teamId);
        if (team && team.memberIds) {
          team.memberIds.forEach(mid => recordTrainingParticipant && recordTrainingParticipant(mid));
        }
      }
    } catch (e) {
      // ignore
    }

    const feedback = isBlockedByBadDay 
      ? `Тренировка мужского стиля: 0 (плохой день!)`
      : `Тренировка мужского стиля: +${gain}`;
    setMFeedback(feedback);
    playSFX('click.wav');
    setTimeout(() => setMFeedback(null), 3000);
  };

  const confirmRest = () => {
    // according to newtz stagnation effect values: tired -10, skills *=0.9
    updatePlayer({
      tired: Math.max(0, state.player.tired - 10),
      fSkill: Math.round(state.player.fSkill * 0.9 * 100) / 100,
      mSkill: Math.round(state.player.mSkill * 0.9 * 100) / 100,
    });

    // advance game time by one month (30 days)
    try {
      if (advanceDays) advanceDays(30);
    } catch (e) {
      // fail silently
    }

    setShowRestConfirm(false);
    setFFeedback(null);
    setMFeedback(null);
    playSFX('click.wav');
  };

  return (
    <div className="player-actions">
      <div className="action-col">
        <button
          data-onboarding-target="train-female-button"
          className={`btn-action-main btn-female ${!canTrainF ? 'disabled' : ''}`}
          onClick={trainFSkill}
          disabled={!canTrainF}
          title={`Стоимость: ${displayCost} ₽\nУсталость: +${tiredGain.toFixed(2)}\nНавык женский: +${gain}`}
        >
          {!canTrainF ? (
            trainerAwayF ? (
              <span>Тренер в отпуске ({Math.max(0, trainerAwayFemaleUntil - absDay)} дн)</span>
            ) : exhaustedF ? (
              <span>На этой неделе тренировки кончились</span>
            ) : !canAfford ? (
              <span>Недостаточно денег</span>
            ) : (
              <span>Недоступно</span>
            )
          ) : (
            <>
              <DumbbellIcon size={18} className="icon-inline" />
              <span className="btn-left">Тренировать женский стиль</span>
              <span className="btn-sep">│</span>
              <span className="btn-price">{displayCost} ₽</span>
            </>
          )}
        </button>
        <div className="train-count">{(state.player.fTrainingsThisWeek || 0)}/{MAX_WEEKLY_CHOREO} трен./нед</div>
        {fFeedback && <div className="action-feedback style-feedback">{fFeedback}</div>}
      </div>

      <div className="action-col">
        <button
          className={`btn-action-main btn-male ${!canTrainM ? 'disabled' : ''}`}
          onClick={trainMSkill}
          disabled={!canTrainM}
          title={`Стоимость: ${displayCost} ₽\nУсталость: +${tiredGain.toFixed(2)}\nНавык мужской: +${gain}`}
        >
          {!canTrainM ? (
            trainerAwayM ? (
              <span>Тренер в отпуске ({Math.max(0, trainerAwayMaleUntil - absDay)} дн)</span>
            ) : exhaustedM ? (
              <span>На этой неделе тренировки кончились</span>
            ) : !canAfford ? (
              <span>Недостаточно денег</span>
            ) : (
              <span>Недоступно</span>
            )
          ) : (
            <>
              <DumbbellIcon size={18} className="icon-inline" />
              <span className="btn-left">Тренировать мужской стиль</span>
              <span className="btn-sep">│</span>
              <span className="btn-price">{displayCost} ₽</span>
            </>
          )}
        </button>
        <div className="train-count">{(state.player.mTrainingsThisWeek || 0)}/{MAX_WEEKLY_CHOREO} трен./нед</div>
        {mFeedback && <div className="action-feedback style-feedback">{mFeedback}</div>}
      </div>

      <div className="action-col">
        <button
          className="btn-action-main btn-rest"
          onClick={() => setShowRestConfirm(true)}
        >
          <RestIcon size={18} className="icon-inline" />
          <span>Отдых</span>
        </button>
        <div className="train-count">&nbsp;</div>
        <div style={{height: '32px'}} />
      </div>

      {showRestConfirm && (
        <div className="modal-overlay">
          <div className="modal card rest-modal">
              <div className="modal-header">
                <h3>Отдохнуть месяц</h3>
              </div>
              <div className="modal-body">
                <p>Отдых снизит усталость , но также уменьшит уровень скилла на 10%</p>
              </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRestConfirm(false)}>Отмена</button>
              <button className="btn-confirm" onClick={confirmRest}>Подтвердить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerActions;
