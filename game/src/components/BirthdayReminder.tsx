import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import './BirthdayReminder.css';
import { Gift } from 'lucide-react';

const BirthdayReminder: React.FC = () => {
  const { npcs, state } = useGame() as any;
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Calculate upcoming birthdays - only for acquainted NPCs (status >= "знакомы")
    const upcoming = npcs
      .map((npc: any) => {
        if (!npc.birthDate) return null;
        
        // Only show reminders for NPCs with status "знакомы" (acquaintance) or higher
        const relationshipStatus = npc.relationship || 'stranger';
        if (relationshipStatus === 'stranger') return null;
        
        const [birthMonth, birthDay] = npc.birthDate.split('.').map(Number); // calendar month (1-12), day (1-31)
        // Convert game month (0-11, starting from June) to calendar month (1-12, starting from January)
        // Game month 0=June(6), 1=July(7), ..., 6=December(12), 7=January(1), ..., 11=May(5)
        const gameMonthIndex = state?.gameTime?.month || 0;
        const gameDay = (state?.gameTime?.day || 0) + 1; // Convert 0-29 to 1-30
        const calendarMonth = ((gameMonthIndex + 6) % 12) + 1;
        let daysUntil = 0;
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (birthMonth > calendarMonth || (birthMonth === calendarMonth && birthDay > gameDay)) {
          // Birthday is this year
          daysUntil = daysInMonth[calendarMonth - 1] - gameDay;
          for (let i = calendarMonth; i < birthMonth - 1; i++) {
            daysUntil += daysInMonth[i];
          }
          daysUntil += birthDay;
        } else if (birthMonth === calendarMonth && birthDay === gameDay) {
          // Birthday is today
          daysUntil = 0;
        } else {
          // Birthday is next year
          daysUntil = daysInMonth[calendarMonth - 1] - gameDay;
          for (let i = calendarMonth; i < 12; i++) {
            daysUntil += daysInMonth[i];
          }
          for (let i = 0; i < birthMonth - 1; i++) {
            daysUntil += daysInMonth[i];
          }
          daysUntil += birthDay;
        }
        
        // Only show if birthday is within 7 days or is today
        if (daysUntil > 7) return null;
        
        return {
          npc,
          daysUntil,
          isToday: daysUntil === 0,
          isSoon: daysUntil > 0 && daysUntil <= 7,
        };
      })
      .filter((item: any) => item && (item.isToday || item.isSoon))
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil)
      .slice(0, 5); // Show only top 5 upcoming birthdays
    
    setUpcomingBirthdays(upcoming);
  }, [npcs, state?.gameTime?.month, state?.gameTime?.day]);

  if (upcomingBirthdays.length === 0) {
    return null;
  }

  return (
    <div className="birthday-reminder-container">
      <div className="birthday-reminder-header">
        <Gift size={16} />
        <span>Дни рождения NPC</span>
      </div>
      <div className="birthday-reminder-list">
        {upcomingBirthdays.map((item, idx) => (
          <div
            key={item.npc.id}
            className={`birthday-reminder-item ${item.isToday ? 'today' : 'soon'}`}
            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
          >
            <div className="birthday-reminder-main">
              <div className="birthday-reminder-name">
                {item.npc.name}
                {item.isToday && <span className="badge-today">🎉 СЕГОДНЯ!</span>}
              </div>
              <div className="birthday-reminder-date">
                {item.npc.birthDate}
                {item.daysUntil > 0 && !item.isToday && (
                  <span className="birthday-countdown"> — через {item.daysUntil} дн.</span>
                )}
              </div>
            </div>
            {expandedIndex === idx && (
              <div className="birthday-reminder-action">
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                  💡 Совет: Подари подарок понравившегося стиля, чтобы особая награда!
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BirthdayReminder;
