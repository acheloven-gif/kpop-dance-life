import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import playSFX from '../utils/sfx';
import CartButton from './CartButton';
import { Store, ShoppingBasket, ShoppingCart } from 'lucide-react';
import { CLOTHES_CATALOG } from '../data/clothes';
import './MainTabs.css';

const Shop: React.FC = () => {
  const ctx = useGame() as any;
  const { buyItem, inventory, buyClothesItem, showEventIfIdle, state, playerInventory } = ctx;
  const [showThanksPopup, setShowThanksPopup] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [shoppingCart, setShoppingCart] = useState<Record<string, number>>({});
  const [shopMainTab, setShopMainTab] = useState<'all'|'items'|'clothes'>('all');
  const [shopClothesSubTab, setShopClothesSubTab] = useState<'tops'|'bottoms'|'shoes'|'accessories'>('tops');
  const [sortOption, setSortOption] = useState<'none'|'priceAsc'|'priceDesc'>('none');
  const [toast, setToast] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(state?.theme === 'dark');
  const tonicPrice = 300;

  const handleBuyTonic = () => {
    if (!buyItem) return;
    const ok = buyItem('tonic', 1);
    try { playSFX('buy.mp3'); } catch (e) {}
    if (ok) {
      setToast('Тоник куплен! ✨');
      setTimeout(() => setToast(null), 2000);
    } else {
      try { showEventIfIdle && showEventIfIdle({ id: `tonic_buy_fail_${Date.now()}`, type: 'bad', title: 'Ошибка', text: 'Не удалось купить тоник. Возможно, недостаточно денег или превышен недельный лимит.' }); } catch(e){}
    }
  };

  const handleAddToCart = (key: string, name: string, price: number, img?: string) => {
    const ev = new CustomEvent('add-to-cart', { detail: { key, name, price, img } });
    window.dispatchEvent(ev);
    try { playSFX('click.wav'); } catch (e) {}
    // local visual cart - track items in cart
    setShoppingCart(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handleBuyClothes = (itemId: string, itemName: string) => {
    const ok = buyClothesItem && buyClothesItem(itemId);
    if (!ok) {
      try { playSFX('error.wav'); showEventIfIdle && showEventIfIdle({ id: `buy_fail_${Date.now()}`, type: 'bad', title: 'Ошибка', text: 'Недостаточно денег.' }); } catch(e){}
    } else {
      try { playSFX('buy.mp3'); setToast(`${itemName} куплен! ✨`); setTimeout(() => setToast(null), 2000); } catch(e){}
      // If item was in cart, remove it from cart
      setShoppingCart(prev => {
        const copy = {...prev};
        delete copy[itemId];
        return copy;
      });
    }
  };

  const [tonicStock, setTonicStock] = React.useState<number>(5);

  return (
    <div className="shop-pane">
      <div className="shop-pane-header">
        {/* Tab buttons and cart on same row */}
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {(['all', 'items', 'clothes'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => {
                  setShopMainTab(tab);
                  setSortOption('none');
                }}
                style={{padding:'8px 16px',borderRadius:6,border:'2px solid #ff69b4',background:shopMainTab===tab?'#ff69b4':'transparent',color:shopMainTab===tab?'#fff':'#ff69b4',cursor:'pointer',fontWeight:shopMainTab===tab?700:600,fontSize:13,transition:'all 0.2s',height:'40px',display:'flex',alignItems:'center'}}
              >
                {tab === 'all' ? 'Все товары' : tab === 'items' ? 'Предметы' : 'Вещи'}
              </button>
            ))}
          </div>
          <CartButton />
        </div>

        {/* Clothes sub-tabs (shown when clothes tab is active) */}
        {shopMainTab === 'clothes' && (
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
            {(['tops', 'bottoms', 'shoes', 'accessories'] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setShopClothesSubTab(tab)}
                style={{padding:'6px 12px',borderRadius:4,border:'1px solid rgba(255,105,180,0.3)',background:shopClothesSubTab===tab?'rgba(255,105,180,0.15)':'transparent',color:shopClothesSubTab===tab?'#ff69b4':'#666',cursor:'pointer',fontWeight:shopClothesSubTab===tab?600:400,fontSize:12,transition:'all 0.2s'}}
              >
                {tab === 'tops' ? 'Верх' : tab === 'bottoms' ? 'Низ' : tab === 'shoes' ? 'Обувь' : 'Аксессуары'}
              </button>
            ))}
          </div>
        )}

        {/* Sort dropdown */}
        <div style={{display:'flex',gap:8,marginBottom:0}}>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value as any)} className="small-sort-select smaller">
            <option value="none">По умолчанию</option>
            <option value="priceAsc">Цена ↑</option>
            <option value="priceDesc">Цена ↓</option>
          </select>
        </div>
      </div>

      <div className="shop-pane-content">
        {/* Items grid based on selected tab */}
        {(shopMainTab === 'all' || shopMainTab === 'items' || shopMainTab === 'clothes') && (
          <div className="shop-items-grid" style={{marginTop: 16}}>
            {(function(){
              const ownedIds: string[] = Array.isArray(playerInventory) ? playerInventory : [];
              const ownedFromState: string[] = Array.isArray(state?.player?.inventory) ? state.player.inventory.map((i: any) => i.id).filter(Boolean) : [];
              let items = (CLOTHES_CATALOG || []).filter((it: any) => {
                if (ownedIds.includes(it.id) || ownedFromState.includes(it.id)) return false;

              if (shopMainTab === 'all') return true;
              if (shopMainTab === 'items') return it.category === 'tonic' || it.category === 'other';
              if (shopMainTab === 'clothes') {
                if (shopClothesSubTab === 'tops') return it.category === 'top';
                if (shopClothesSubTab === 'bottoms') return it.category === 'bottom';
                if (shopClothesSubTab === 'shoes') return it.category === 'shoes';
                if (shopClothesSubTab === 'accessories') return it.category === 'accessory';
              }
              return false;
            });
            if (sortOption === 'priceAsc') items = items.sort((a:any,b:any) => (a.price||0) - (b.price||0));
            if (sortOption === 'priceDesc') items = items.sort((a:any,b:any) => (b.price||0) - (a.price||0));
            return items;
          })().map((item: any) => (
            <div key={item.id} className="shop-item-card">
              <div className="shop-item-image" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <img
                    src={item.img || '/avatars/normalized/default.svg'}
                    alt={item.name}
                    loading="lazy"
                    style={{width: '100%', height: '100%', objectFit: 'contain'}}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/avatars/normalized/default.svg'; }}
                  />
                </div>
              <div className="shop-item-name">{item.name}</div>
              <div className="shop-item-description">{item.category !== 'other' ? `${item.category} • ${item.suitability}` : '✓ Доступно'}</div>
              <div className="shop-item-price"><span className="price-tag">{item.price}</span> ₽</div>
              <div className="shop-item-actions">
                <button 
                  className="btn-action cart" 
                  onClick={() => { handleAddToCart(item.id, item.name, item.price || 0, item.img); }} 
                  disabled={shoppingCart[item.id] > 0}
                  title={shoppingCart[item.id] > 0 ? "Уже добавлено в корзину" : "В корзину"}
                >
                  <ShoppingBasket size={16} />
                </button>
                {item.price > 0 && <button className="btn-action buy" onClick={() => { handleBuyClothes(item.id, item.name); }}>Купить</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tonic section */}
      <div style={{marginTop: '24px'}}>
        <div className="shop-items-grid">
          <div className="shop-item-card">
            <img src={'/shop/tonic.png'} alt="Тоник" className="shop-item-image" />
            <div className="shop-item-name">Тоник</div>
            <div className="shop-item-description">Снижает усталость на 10 единиц при использовании.</div>
            <div className="shop-item-inventory">В наличии: {tonicStock}</div>
            <div className="shop-item-price"><span className="price-tag">{tonicPrice}</span> ₽</div>
            <div className="shop-item-actions">
              <button className="btn-action cart" onClick={() => {if (tonicStock <= 0) { alert('Товар закончился'); return; }handleAddToCart('tonic','Тоник', tonicPrice, '/public/tonic.png');setTonicStock(s => Math.max(0, s - 1));}} title="В корзину"><ShoppingBasket size={14} /> В корзину</button>
              <button className="btn-action buy" onClick={() => {if (tonicStock <= 0) { alert('Товар закончился'); return; }setTonicStock(s => Math.max(0, s - 1));handleBuyTonic();}}>Купить</button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {showThanksPopup && <div className="thanks-popup"><div className="thanks-popup-content">Спасибо за покупку! ✨</div></div>}
      {toast && <div style={{position:'fixed',right:20,bottom:20,background:'#333',color:'#fff',padding:'10px 14px',borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.3)',zIndex:9999}}>{toast}</div>}
    </div>
  );
};

export default Shop;
