import React, { useMemo } from 'react';
import './SeasonalBackground.css';

interface SeasonalBackgroundProps {
  month: number; // 0-11
  isDarkTheme?: boolean;
}

const SeasonalBackground: React.FC<SeasonalBackgroundProps> = ({ month, isDarkTheme = false }) => {
  // Determine season based on month (0=Jan, 11=Dec)
  // June (5) = Summer, Sept (8) = Autumn, Dec (11) = Winter, Mar (2) = Spring
  const getSeason = (m: number): 'spring' | 'summer' | 'autumn' | 'winter' => {
    if (m >= 2 && m <= 4) return 'spring';      // Mar-May
    if (m >= 5 && m <= 7) return 'summer';      // Jun-Aug
    if (m >= 8 && m <= 10) return 'autumn';     // Sep-Nov
    return 'winter';                             // Dec-Feb
  };

  const season = getSeason(month);

  // Generate random particles for animation
  const particles = useMemo(() => {
    const count = season === 'winter' ? 50 : season === 'autumn' ? 40 : season === 'spring' ? 50 : 35;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 4,
      opacity: 0.4 + Math.random() * 0.6,
    }));
  }, [season]);

  return (
    <div className={`seasonal-background ${season} ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      {season === 'autumn' && (
        <div className="particles">
          {particles.map(p => (
            <div
              key={p.id}
              className="leaf"
              style={{
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                opacity: p.opacity,
              }}
            />
          ))}
        </div>
      )}

      {season === 'winter' && (
        <div className="particles">
          {particles.map(p => (
            <div
              key={p.id}
              className="snowflake"
              style={{
                left: `${p.left}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                opacity: p.opacity,
              }}
            />
          ))}
        </div>
      )}

      {season === 'spring' && (
        <div className="particles">
          {/* Spring animations disabled */}
        </div>
      )}

      {season === 'summer' && (
        <div className="particles">
          {/* Summer animations disabled */}
        </div>
      )}
    </div>
  );
};

export default SeasonalBackground;
