import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Settings } from 'lucide-react';
import './DevPanel.css';

const DevPanel: React.FC = () => {
  const { setFestivalFrequency, getFestivalFrequency } = useGame();
  const [showDevPanel, setShowDevPanel] = useState(false);
  const festivalFreq = getFestivalFrequency?.();

  const [minDays, setMinDays] = useState(festivalFreq?.minDays ?? 90);
  const [maxDays, setMaxDays] = useState(festivalFreq?.maxDays ?? 180);
  const [chance, setChance] = useState(festivalFreq?.chance ?? 0.05);

  const handleApply = () => {
    setFestivalFrequency?.(Math.max(1, minDays), Math.max(minDays + 1, maxDays), Math.max(0, Math.min(1, chance)));
  };

  const handleReset = () => {
    setMinDays(90);
    setMaxDays(180);
    setChance(0.05);
    setFestivalFrequency?.(90, 180, 0.05);
  };

  if (!setFestivalFrequency) return null; // Only show if dev methods available

  return (
    <div className="dev-panel-container">
      <button
        className="dev-panel-toggle"
        onClick={() => setShowDevPanel(!showDevPanel)}
        title="Dev Panel"
      >
        <Settings size={18} />
      </button>

      {showDevPanel && (
        <div className="dev-panel">
          <div className="dev-panel-header">
            <h4>Dev Controls</h4>
            <button
              className="dev-panel-close"
              onClick={() => setShowDevPanel(false)}
            >
              ✕
            </button>
          </div>

          <div className="dev-panel-content">
            <div className="dev-section">
              <h5>Festival Frequency</h5>

              <div className="dev-control">
                <label>Min Days: {minDays}</label>
                <input
                  type="range"
                  min="1"
                  max="300"
                  value={minDays}
                  onChange={(e) => setMinDays(parseInt(e.target.value))}
                  className="dev-slider"
                />
                <input
                  type="number"
                  min="1"
                  value={minDays}
                  onChange={(e) => setMinDays(parseInt(e.target.value))}
                  className="dev-number-input"
                />
              </div>

              <div className="dev-control">
                <label>Max Days: {maxDays}</label>
                <input
                  type="range"
                  min="1"
                  max="300"
                  value={maxDays}
                  onChange={(e) => setMaxDays(parseInt(e.target.value))}
                  className="dev-slider"
                />
                <input
                  type="number"
                  min="1"
                  value={maxDays}
                  onChange={(e) => setMaxDays(parseInt(e.target.value))}
                  className="dev-number-input"
                />
              </div>

              <div className="dev-control">
                <label>Chance (0-1): {chance.toFixed(3)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={chance}
                  onChange={(e) => setChance(parseFloat(e.target.value))}
                  className="dev-slider"
                />
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={chance}
                  onChange={(e) => setChance(parseFloat(e.target.value))}
                  className="dev-number-input"
                />
              </div>

              <div className="dev-buttons">
                <button className="dev-btn-apply" onClick={handleApply}>
                  Apply
                </button>
                <button className="dev-btn-reset" onClick={handleReset}>
                  Reset
                </button>
              </div>

              <div className="dev-info">
                <small>
                  Festivals will occur every {minDays}-{maxDays} days
                  <br />
                  with {(chance * 100).toFixed(1)}% chance per check
                </small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevPanel;
