import React, { useState, useEffect } from 'react';
import { CLOTHES_CATALOG } from '../data/clothes';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import './CostumeSelector.css';

export type ClothesSlot = 'top' | 'bottom' | 'shoes' | 'accessory';

export interface SelectedCostume {
  top?: string;      // id
  bottom?: string;   // id
  shoes?: string;    // id
  accessories: string[]; // array of ids (max 5)
}

interface CostumeSelectorProps {
  requiredStyle: 'F_skill' | 'M_skill' | 'Both';
  onConfirm: (costume: SelectedCostume) => void;
  onCancel: () => void;
  onEvaluate: (costume: SelectedCostume) => Promise<{ matchPercent: number; opinion: string; npcName?: string; npcAvatarId?: string }>;
  playerInventory: string[]; // ids of items in inventory
  npcId?: string; // NPC ID for displaying in evaluation
  onAddToCart?: (itemId: string, itemName: string, price: number) => void; // Add to outfit's cart
  onBuyItem?: (itemId: string) => boolean; // Buy item directly
  playerMoney?: number;
  boughtItems?: string[]; // Items that have been purchased
}

const CostumeSelector: React.FC<CostumeSelectorProps> = ({
  requiredStyle,
  onConfirm,
  onCancel,
  onEvaluate,
  playerInventory: _playerInventory,
  onAddToCart: _onAddToCart,
  onBuyItem: _onBuyItem,
}) => {
  // start with empty selection; initialize from player inventory below
  const [selected, setSelected] = useState<SelectedCostume>({
    accessories: []
  });
  const [activeTab, setActiveTab] = useState<ClothesSlot>('top');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{ matchPercent: number; opinion: string; npcName?: string; npcAvatarId?: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrorMsg, setShowErrorMsg] = useState(false);

  // Helper to check if a clothing item suits the required style
  const isSuitable = (suitability: string): boolean => {
    if (requiredStyle === 'Both') {
      return ['оба', 'все'].includes(suitability) || 
             suitability.includes('оба');
    }
    if (requiredStyle === 'F_skill') {
      return ['женское', 'оба', 'все'].includes(suitability) || 
             suitability.includes('жен');
    }
    if (requiredStyle === 'M_skill') {
      return ['мужское', 'оба', 'все'].includes(suitability) || 
             suitability.includes('муж');
    }
    return false;
  };

  // Get items for each slot
  const getItemsForSlot = (slot: ClothesSlot) => {
    return CLOTHES_CATALOG.filter(item => 
      item.category === slot && isSuitable(item.suitability)
    );
  };

  const handleSelectItem = (itemId: string, slot: ClothesSlot) => {
    if (slot === 'accessory') {
      if (selected.accessories.includes(itemId)) {
        // Remove
        setSelected(prev => ({
          ...prev,
          accessories: prev.accessories.filter(id => id !== itemId)
        }));
      } else if (selected.accessories.length < 5) {
        // Add
        setSelected(prev => ({
          ...prev,
          accessories: [...prev.accessories, itemId]
        }));
      }
    } else {
      setSelected(prev => ({
        ...prev,
        [slot]: itemId
      }));
    }
    setShowErrorMsg(false);
  };

  const handleRemoveAccessory = (itemId: string) => {
    setSelected(prev => ({
      ...prev,
      accessories: prev.accessories.filter(id => id !== itemId)
    }));
  };

  const handleEvaluate = async () => {
    const newErrors: string[] = [];
    if (!selected.top) newErrors.push('top');
    if (!selected.bottom) newErrors.push('bottom');
    if (!selected.shoes) newErrors.push('shoes');
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      setShowErrorMsg(true);
      return;
    }

    setEvaluating(true);
    try {
      const result = await onEvaluate(selected);
      setEvalResult(result);
    } catch (e) {
      console.error('Evaluation error:', e);
    } finally {
      setEvaluating(false);
    }
  };

  // Initialize default selected items from player's inventory (if available)
  useEffect(() => {
    if (!_playerInventory || _playerInventory.length === 0) return;
    const invSet = new Set(_playerInventory);
    const findInInventory = (slot: 'top' | 'bottom' | 'shoes') => {
      const found = CLOTHES_CATALOG.find(c => c.category === slot && invSet.has(c.id));
      return found?.id;
    };
    setSelected(prev => ({
      top: prev.top || findInInventory('top'),
      bottom: prev.bottom || findInInventory('bottom'),
      shoes: prev.shoes || findInInventory('shoes'),
      accessories: prev.accessories || []
    }));
  }, [_playerInventory]);

  // If evaluating, show loading screen
  if (evaluating) {
    return (
      <div className="costume-selector-overlay">
        <div className="costume-selector-modal">
          <div className="eval-loading">
            <div className="spinner"></div>
            <p>Лидер проекта оценивает Ваш костюм...</p>
          </div>
        </div>
      </div>
    );
  }

  // If evaluated, show result with NPC feedback
  if (evalResult) {
    const matchPercent = evalResult.matchPercent;
    let scoreColor = '#ef4444';
    let actionText = 'Костюм не подходит';
    const canChangeAgain = matchPercent >= 51 && matchPercent <= 80;
    
    if (matchPercent >= 81) {
      scoreColor = '#22c55e';
      actionText = 'Костюм одобрен!';
    } else if (matchPercent >= 51) {
      scoreColor = '#f59e0b';
      actionText = 'Костюм приемлем';
    }

    return (
      <div className="costume-selector-overlay">
        <div className="costume-selector-modal">
          <div className="costume-selector-header">
            <h3>Оценка костюма</h3>
            <button className="close-btn" onClick={onCancel}>✕</button>
          </div>

          <div className="costume-selector-body">
            <div className="eval-result-new">
              {/* NPC Icon and Avatar on the Left */}
              <div className="npc-section">
                <div className="npc-avatar">
                  {evalResult.npcAvatarId ? (
                    <img
                      src={`/avatars/normalized/${evalResult.npcAvatarId}`}
                      alt={evalResult.npcName}
                      className="npc-avatar-img"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatars/normalized/default.svg'; }}
                    />
                  ) : (
                    evalResult.npcName?.[0]?.toUpperCase() || '👤'
                  )}
                </div>
                <div className="npc-name">{evalResult.npcName || 'Лидер проекта'}</div>
              </div>

              {/* Opinion Bubble on the Right */}
              <div className="opinion-section">
                <div className="opinion-bubble">
                  <div className="match-score-inline" style={{ color: scoreColor }}>
                    {matchPercent}% соответствия
                  </div>
                  <div className="action-text" style={{ color: scoreColor, marginTop: 8 }}>
                    {actionText}
                  </div>
                  <p className="result-opinion">{evalResult.opinion}</p>
                </div>
              </div>
            </div>

            {/* Selected costume items at the bottom */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-end', padding: '20px 0 0 0', borderTop: '1px solid rgba(255,105,180,0.2)', flexWrap: 'wrap' }}>
              {selected.top && (() => {
                const item = CLOTHES_CATALOG.find(c => c.id === selected.top);
                return item ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 180, height: 180, background: 'rgba(255,105,180,0.1)', borderRadius: 8, border: '2px solid #ff69b4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={item.img || '/avatars/normalized/default.svg'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#ff69b4', textAlign: 'center', maxWidth: 180 }}>{item.name}</div>
                  </div>
                ) : null;
              })()}
              {selected.bottom && (() => {
                const item = CLOTHES_CATALOG.find(c => c.id === selected.bottom);
                return item ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 180, height: 180, background: 'rgba(255,105,180,0.1)', borderRadius: 8, border: '2px solid #ff69b4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={item.img || '/avatars/normalized/default.svg'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#ff69b4', textAlign: 'center', maxWidth: 180 }}>{item.name}</div>
                  </div>
                ) : null;
              })()}
              {selected.shoes && (() => {
                const item = CLOTHES_CATALOG.find(c => c.id === selected.shoes);
                return item ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 180, height: 180, background: 'rgba(255,105,180,0.1)', borderRadius: 8, border: '2px solid #ff69b4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={item.img || '/avatars/normalized/default.svg'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#ff69b4', textAlign: 'center', maxWidth: 180 }}>{item.name}</div>
                  </div>
                ) : null;
              })()}
              {selected.accessories && selected.accessories.length > 0 && selected.accessories.map((accId: string) => {
                const item = CLOTHES_CATALOG.find(c => c.id === accId);
                return item ? (
                  <div key={accId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 180, height: 180, background: 'rgba(255,105,180,0.1)', borderRadius: 8, border: '2px solid #ff69b4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <img src={item.img || '/avatars/normalized/default.svg'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#ff69b4', textAlign: 'center', maxWidth: 180 }}>{item.name}</div>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <div className="costume-selector-footer">
            {canChangeAgain && (
              <button 
                className="btn-cancel"
                onClick={() => {
                  setEvalResult(null);
                  setErrors([]);
                  setShowErrorMsg(false);
                }}
              >
                Поменять костюм
              </button>
            )}
            <button 
              className="btn-confirm"
              onClick={() => onConfirm(selected)}
            >
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main selection screen
  const displayedItems = getItemsForSlot(activeTab);
  const isAccessoryFull = activeTab === 'accessory' && selected.accessories.length >= 5;

  return (
    <div className="costume-selector-overlay">
      <div className="costume-selector-modal">
        <div className="costume-selector-header">
          <h3>Выбор костюма для проекта: {activeTab === 'top' ? 'ВЕРХ' : activeTab === 'bottom' ? 'НИЗ' : activeTab === 'shoes' ? 'ОБУВЬ' : 'АКСЕССУАРЫ'} — {activeTab === 'top' ? '👱' : activeTab === 'bottom' ? '👖' : activeTab === 'shoes' ? '👠' : '📿'} Женский</h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="costume-selector-body-redesign">
          {/* LEFT SIDEBAR: Categories and Preview */}
          <div className="sidebar-redesign">
            {/* Category Buttons */}
            <div className="category-buttons">
              <button 
                className={`category-btn ${activeTab === 'top' ? 'active' : ''}`}
                onClick={() => setActiveTab('top')}
              >
                ВЕРХ
              </button>
              <button 
                className={`category-btn ${activeTab === 'bottom' ? 'active' : ''}`}
                onClick={() => setActiveTab('bottom')}
              >
                НИЗ
              </button>
              <button 
                className={`category-btn ${activeTab === 'shoes' ? 'active' : ''}`}
                onClick={() => setActiveTab('shoes')}
              >
                ОБУВЬ
              </button>
              <button 
                className={`category-btn ${activeTab === 'accessory' ? 'active' : ''}`}
                onClick={() => setActiveTab('accessory')}
              >
                АКСЕССУАРЫ
              </button>
            </div>

            {/* Selected Items Preview */}
            <div className="selected-preview-section">
              <div className="preview-header">Формируемый образ:</div>
              
              {/* Top */}
              <div className="preview-slot">
                <div className="preview-label">Верх</div>
                <div className="preview-item">
                  {selected.top ? (
                    <img 
                      src={CLOTHES_CATALOG.find(c => c.id === selected.top)?.img || '/avatars/normalized/default.svg'} 
                      alt="top"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatars/normalized/default.svg'; }}
                    />
                  ) : (
                    <div className="preview-empty">👔</div>
                  )}
                </div>
              </div>

              {/* Bottom */}
              <div className="preview-slot">
                <div className="preview-label">Низ</div>
                <div className="preview-item">
                  {selected.bottom ? (
                    <img 
                      src={CLOTHES_CATALOG.find(c => c.id === selected.bottom)?.img || '/avatars/normalized/default.svg'} 
                      alt="bottom"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatars/normalized/default.svg'; }}
                    />
                  ) : (
                    <div className="preview-empty">👖</div>
                  )}
                </div>
              </div>

              {/* Shoes */}
              <div className="preview-slot">
                <div className="preview-label">Обувь</div>
                <div className="preview-item">
                  {selected.shoes ? (
                    <img 
                      src={CLOTHES_CATALOG.find(c => c.id === selected.shoes)?.img || '/avatars/normalized/default.svg'} 
                      alt="shoes"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatars/normalized/default.svg'; }}
                    />
                  ) : (
                    <div className="preview-empty">👠</div>
                  )}
                </div>
              </div>

              {/* Accessories */}
              <div className="preview-slot full-width">
                <div className="preview-label">Аксессуары ({selected.accessories.length}/5)</div>
                <div className="preview-accessories">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const accessoryId = selected.accessories[idx];
                    const item = accessoryId ? CLOTHES_CATALOG.find(c => c.id === accessoryId) : null;
                    return (
                      <div key={idx} className="accessory-mini">
                        {item ? (
                          <>
                            <img 
                              src={item.img || '/avatars/normalized/default.svg'} 
                              alt="acc"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatars/normalized/default.svg'; }}
                            />
                            <button 
                              className="remove-mini"
                              onClick={() => handleRemoveAccessory(accessoryId)}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <div className="empty-mini">+</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cost Info */}
              <div className="cost-info">
                <div className="cost-line">
                  <span>Остаток:</span>
                  <span className="cost-value">17600 ₽</span>
                </div>
              </div>

              {/* Confirm Button */}
              <button 
                className="btn-confirm-preview"
                onClick={handleEvaluate}
                disabled={!selected.top || !selected.bottom || !selected.shoes}
              >
                Подтвердить
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: Items Grid */}
          <div className="items-grid-container">
            <div className="items-grid">
              {displayedItems.map(item => {
                const isSelected = activeTab === 'accessory' 
                  ? selected.accessories.includes(item.id)
                  : selected[activeTab] === item.id;
                const isButtonDisabled = isAccessoryFull && !isSelected;
                
                return (
                  <div key={item.id} className={`grid-item ${isSelected ? 'selected' : ''}`}>
                    <div className="item-image-container">
                      <img 
                        src={item.img || '/avatars/normalized/default.svg'} 
                        alt={item.name}
                        className="item-image-grid"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatars/normalized/default.svg'; }}
                      />
                    </div>
                    <div className="item-info-grid">
                      <div className="item-name-grid">{item.name}</div>
                      <div className="item-subcategory">Доступно</div>
                      <div className="item-price">{item.price}₽</div>
                    </div>
                    <button 
                      className="btn-select-grid"
                      onClick={() => handleSelectItem(item.id, activeTab)}
                      disabled={isButtonDisabled}
                    >
                      Выбрать
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {showErrorMsg && errors.length > 0 && (
          <div className="error-message-banner">
            Выбраны не все части костюма: {errors.map(e => 
              e === 'top' ? 'верх' : e === 'bottom' ? 'низ' : 'обувь'
            ).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default CostumeSelector;
