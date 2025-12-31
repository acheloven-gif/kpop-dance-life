import React, { useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import playSFX from '../utils/sfx';
import './ExpenseStatistics.css';

const ExpenseStatistics: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { state, setModalPause } = useGame();

  useEffect(() => {
    if (isOpen && setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [isOpen, setModalPause]);

  // Расчет расходов — агрегируем строго по записям ledger `state.expenses`
  const expenses = useMemo(() => {
    const ledger = Array.isArray((state as any).expenses) ? (state as any).expenses : [];
    let trainings = 0;
    let costumes = 0;
    let masterclasses = 0;
    let items = 0;

    ledger.forEach((e: any) => {
      const amount = Number(e.amount) || 0;
      const cat = (e.category || '').toLowerCase();
      if (cat === 'training') trainings += amount;
      else if (cat === 'costume') costumes += amount;
      else if (cat === 'masterclass' || cat.includes('мастер')) masterclasses += amount;
      else if (cat === 'item' || cat === 'tonic' || cat === 'товар') items += amount;
      else {
        const lab = (e.label || '').toLowerCase();
        if (lab.includes('тренир') || lab.includes('тренировка')) trainings += amount;
        else if (lab.includes('костюм')) costumes += amount;
        else items += amount;
      }
    });

    const total = trainings + costumes + masterclasses + items;
    return { trainings, costumes, masterclasses, items, total };
  }, [state]);

  if (!isOpen) return null;

  const data = [
    { label: 'Костюмы', value: expenses.costumes, color: '#ffc0cb' },
    { label: 'Обычные тренировки', value: expenses.trainings, color: '#ff1493' },
    { label: 'Мастеклассы', value: expenses.masterclasses, color: '#ff85c0' },
    { label: 'Товары', value: expenses.items, color: '#ffb6d9' },
  ].filter(item => item.value > 0);

  const total = expenses.total;
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card expense-statistics-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📊 Статистика расходов</h3>
          <button className="close" onClick={() => { playSFX('close.wav'); onClose(); }}>✕</button>
        </div>
        <div className="modal-body">
          <div className="expense-chart">
            {data.length === 0 ? (
              <div style={{textAlign: 'center', color: '#999', padding: '20px'}}>
                Пока нет расходов
              </div>
            ) : (
              <>
                <h4 style={{marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 'bold'}}>Распределение расходов</h4>

                {/* Pie Chart */}
                <div style={{display: 'flex', justifyContent: 'center', marginBottom: '18px'}}>
                  <div style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: `conic-gradient(${data.map((d, i) => {
                      const pct = total > 0 ? (d.value / total) * 100 : 0;
                      let startPct = data.slice(0, i).reduce((sum, x) => sum + (total > 0 ? (x.value / total) * 100 : 0), 0);
                      return `${d.color} ${startPct}% ${startPct + pct}%`;
                    }).join(', ')})`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                  }} />
                </div>

                {/* Bar Chart Detail */}
                <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)'}}>
                  <h4 style={{marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 'bold'}}>Детальное распределение:</h4>
                  {data.map((item) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    const barWidth = total > 0 ? (item.value / maxValue) * 100 : 0;
                    return (
                      <div key={item.label} className="expense-item">
                        <div className="expense-label">
                          <span className="expense-name">{item.label}</span>
                          <span className="expense-percentage">{Math.round(percentage)}%</span>
                        </div>
                        <div className="expense-bar-container">
                          <div 
                            className="expense-bar" 
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: item.color
                            }}
                          ></div>
                        </div>
                        <div className="expense-value">{Math.round(item.value)} ₽</div>
                      </div>
                    );
                  })}
                  <div className="expense-total">
                    <strong>Итого:</strong> <span>{Math.round(total)} ₽</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseStatistics;
