import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { GIFTS } from '../types/game';
import { Backpack } from 'lucide-react';
import './InventoryButton.css';
import './MainTabs.css';

const InventoryButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [viewedItems, setViewedItems] = useState<Set<string>>(new Set());
  const { inventory, playerInventory, useItem, clothesCatalog, setModalPause } = useGame() as any;



  // Use playerInventory (ids) if available, otherwise fall back to inventory objects
  const rawItems = Array.isArray(playerInventory) && playerInventory.length > 0
    ? playerInventory
    : (Array.isArray(inventory) ? inventory : []);

  // Normalize items into objects: if entry is a string (item id), map to catalog or gifts
  const items = React.useMemo(() => {
    return (rawItems || []).map((it: any) => {
      if (typeof it === 'string') {
        const id = it;
        // try clothes catalog
        const fromCatalog = Array.isArray(clothesCatalog) ? clothesCatalog.find((c: any) => c.id === id) : null;
        if (fromCatalog) return { id: fromCatalog.id, key: fromCatalog.id, name: fromCatalog.name, count: 1, img: fromCatalog.img || fromCatalog.icon };
        // try gifts
        const fromGifts = GIFTS.find((g: any) => g.id === id || g.name === id);
        if (fromGifts) return { id: fromGifts.id, key: fromGifts.id, name: fromGifts.name, count: 1, img: fromGifts.img };
        // fallback: simple object
        return { id, key: id, name: id, count: 1 };
      }
      // already object-like; ensure it has id/key/name/count
      return { id: it.id || it.key || it.name, key: it.key || it.id, name: it.name || it.id, count: it.count || 1, img: it.img || it.icon };
    });
  }, [rawItems, clothesCatalog]);

  const [sortMode, setSortMode] = useState<'default' | 'newest' | 'alphabeticalAsc' | 'alphabeticalDesc'>('default');
  const [typeFilter, setTypeFilter] = useState<'all'|'item'|'top'|'bottom'|'shoes'|'accessory'>('all');

  const resetFilters = () => { setSortMode('default'); setTypeFilter('all'); };

  // derive filtered + sorted items
  const visibleItems = React.useMemo(() => {
    let list = (items || [])
      .filter((it: any) => (it.count || 0) > 0)  // Only show items with count > 0
      .slice();
    if (typeFilter && typeFilter !== 'all') {
      list = list.filter((it: any) => {
        const cat = (it.category || it.type || it.slot || '').toString().toLowerCase();
        if (typeFilter === 'item') return cat === 'tonic' || cat === 'other' || cat === '';
        return cat.includes(typeFilter);
      });
    }
    if (sortMode === 'newest') {
      list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sortMode === 'alphabeticalAsc') {
      list.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortMode === 'alphabeticalDesc') {
      list.sort((a: any, b: any) => (b.name || '').localeCompare(a.name || ''));
    }
    return list;
  }, [items, sortMode, typeFilter]);

  const handleUseItem = (itemKey: string) => {
    if (useItem) {
      const success = useItem(itemKey);
      if (success) {
        // Item was used successfully
      } else {
        // Could not use item (limit reached, not in inventory, etc)
      }
    }
  };

  // Pause/unpause game when modal opens/closes
  useEffect(() => {
    if (open && setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [open, setModalPause]);

  // Check if there are new items (not yet viewed)
  const hasNewItems = React.useMemo(() => {
    return visibleItems.some((item: any) => !viewedItems.has(item.id));
  }, [visibleItems, viewedItems]);

  // Mark items as viewed when modal opens
  const handleOpenModal = () => {
    setOpen(true);
    // Don't mark items as viewed on open - keep them as new so users see them highlighted
    // Only mark items as viewed when they hover over them
  };

  const handleCloseModal = () => {
    setOpen(false);
  };

  // Mark items as viewed on cursor hover
  const handleItemHover = (itemId: string) => {
    setViewedItems(prev => new Set([...prev, itemId]));
  };

  return (

    <div className="inventory-root">
      <button className="messenger-toggle compact" onClick={handleOpenModal} title="Посмотреть инвентарь" aria-label="Посмотреть инвентарь">
        <Backpack size={18} />
        {hasNewItems && <span className="inventory-badge-dot"></span>}
      </button>

      {open && (
        <div className="inventory-modal-overlay" onClick={handleCloseModal}>
          <div className="inventory-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inventory-header">
              <div className="title">Инвентарь</div>
              <button onClick={handleCloseModal} className="btn-close">✕</button>
            </div>
            <div className="inventory-body">
              <div className="project-filters" style={{justifyContent: 'flex-start'}}>
                <div className="filters-grid" style={{display:'flex',alignItems:'center',gap:6,flex: 'none'}}>
                  <div className="filter-group" style={{display:'flex',alignItems:'center',gap:4}}>
                    <label style={{marginRight:0, fontSize:'12px'}}>Тип</label>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} style={{fontSize:'11px', padding:'4px 6px', minWidth: '65px'}}>
                      <option value="all">Все</option>
                      <option value="item">Предмет</option>
                      <option value="top">Верх</option>
                      <option value="bottom">Низ</option>
                      <option value="shoes">Обувь</option>
                      <option value="accessory">Аксесс.</option>
                    </select>
                  </div>
                  <div className="filter-group" style={{display:'flex',alignItems:'center',gap:4}}>
                    <label style={{marginRight:0, fontSize:'12px'}}>Сортировка</label>
                    <select value={sortMode} onChange={(e) => setSortMode(e.target.value as any)} style={{fontSize:'11px', padding:'4px 6px', minWidth: '100px'}}>
                      <option value="default">По умолчанию</option>
                      <option value="alphabeticalAsc">A → Z</option>
                      <option value="alphabeticalDesc">Z → A</option>
                      <option value="newest">Новое</option>
                    </select>
                  </div>
                </div>
              </div>

              {visibleItems.length === 0 && <div className="muted">Инвентарь пуст</div>}
              <div className="inventory-items-grid">
                {visibleItems.map((item: any) => {
                  const isTonic = (item.category || item.type || '').toLowerCase() === 'tonic' || 
                                   (item.name && item.name.toLowerCase().includes('тоник'));
                  const isNew = !viewedItems.has(item.id);
                  return (
                    <div 
                      key={item.id} 
                      className={`inventory-item-card ${isNew ? 'is-new' : ''}`}
                      onMouseEnter={() => handleItemHover(item.id)}
                    >
                      <div className="inventory-item-image">
                        {item.img || item.icon ? (
                          <img
                            src={item.img || item.icon}
                            alt={item.name}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatars/normalized/default.svg'; }}
                          />
                        ) : (
                          <div className="placeholder">{(item.name||'').substring(0,2)}</div>
                        )}
                      </div>
                      <div className="inventory-item-name">{item.name}</div>
                      <div className="inventory-item-count">x{item.count || 0}</div>
                      <div className="inventory-item-actions">
                        {isTonic && (
                          <button className="btn-use small" onClick={() => handleUseItem(item.key)}>Использовать</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryButton;
