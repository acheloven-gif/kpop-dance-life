import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import playSFX from '../utils/sfx';
import RatingsTab from './RatingsTab';
import PlayerActions from './PlayerActions';
import Shop from './Shop';
import { Store, Star, Search, Video, Home, ShoppingCart } from 'lucide-react';
import './MainTabs.css';

type TabType = 'main' | 'search' | 'active' | 'ratings' | 'shop' | 'messages' | 'city';

interface MainTabsProps {
  initialTab?: TabType;
}

const MainTabs: React.FC<MainTabsProps> = ({ initialTab = 'main' }) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const { state, availableProjects, activeProjects, acceptProject, abandonProject, updateActiveProject, completedProjects, setModalPause, reserveCostumeForProject, releaseReservedCostume, getReservedForProject, showEventIfIdle, clothesCatalog, playerInventory, buyClothesItem, pendingCostumeSelection, submitCostumeSelection, clearPendingCostumeSelection, npcs, fundProjectTraining, addPlayerMoney } = useGame();
  const [completionFilter, setCompletionFilter] = useState<'all'|'success'|'failed'|'cancelled'|'team'>('all');
  
  // Store activeProjects in ref for use in setTimeout callbacks
  const activeProjectsRef = useRef(activeProjects);

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Pause game when project acceptance modal is open
  useEffect(() => {
    if (showModal && setModalPause) {
      setModalPause(true);
    }
    return () => {
      if (setModalPause) {
        setModalPause(false);
      }
    };
  }, [showModal, setModalPause]);
  const [skillFilter, setSkillFilter] = useState<string>('any');
  const [styleFilter, setStyleFilter] = useState<string>('any');
  const [durationFilter, setDurationFilter] = useState<string>('any');
  const [sortOption, setSortOption] = useState<string>('none');

  const filteredProjects = useMemo(() => {
    let list = (availableProjects || []).slice();
    if (skillFilter !== 'any') {
      list = list.filter((p: any) => {
        const min = p.minSkillRequired || 0;
        if (skillFilter === 'Новичок') return min <= 30;
        if (skillFilter === 'Мидл') return min > 30 && min <= 70;
        if (skillFilter === 'Топ') return min > 70;
        return true;
      });
    }
    if (styleFilter !== 'any') {
      if (styleFilter === 'Both') {
        list = list.filter((p: any) => (p.requiredSkill === 'Both' || p.requiredSkill === 'F_skill' || p.requiredSkill === 'M_skill'));
      } else if (styleFilter === 'F_style' || styleFilter === 'Женский') {
        list = list.filter((p: any) => p.requiredSkill === 'F_skill');
      } else if (styleFilter === 'M_style' || styleFilter === 'Мужской') {
        list = list.filter((p: any) => p.requiredSkill === 'M_skill');
      }
    }
    if (durationFilter !== 'any') {
      list = list.filter((p: any) => p.duration === durationFilter);
    }

    if (sortOption === 'skillAsc') list.sort((a: any, b: any) => (a.minSkillRequired || 0) - (b.minSkillRequired || 0));
    if (sortOption === 'skillDesc') list.sort((a: any, b: any) => (b.minSkillRequired || 0) - (a.minSkillRequired || 0));
    if (sortOption === 'costAsc') list.sort((a: any, b: any) => (a.trainingCost || 0) - (b.trainingCost || 0));
    if (sortOption === 'costDesc') list.sort((a: any, b: any) => (b.trainingCost || 0) - (a.trainingCost || 0));

    return list;
  }, [availableProjects, skillFilter, styleFilter, durationFilter, sortOption]);

  const qualityLabel = (val: number) => {
    if (val <= 30) return 'Новичок';
    if (val <= 70) return 'Мидл';
    return 'Топ';
  };

  // For project acceptance modal options
  const [acceptanceBaseTraining, setAcceptanceBaseTraining] = useState(0);
  const [acceptanceCostumeSave, setAcceptanceCostumeSave] = useState(0);
  const [costumeDrafts, setCostumeDrafts] = useState<Record<string, number>>({});
  // outfitDraft теперь объект: ключ — projectId, значение — выбранный костюм
  const [outfitDrafts, setOutfitDrafts] = useState<Record<string, { top?: string; bottom?: string; shoes?: string; accessories: string[] }>>({});
  const [costumeModalStep, setCostumeModalStep] = useState<'select'|'loading'|'result'>('select');
  const [costumeEvalResult, setCostumeEvalResult] = useState<{ matchPercent: number; npcId?: string; message?: string; npcName?: string; npcAvatarId?: string } | null>(null);
  const [tempCostumeEvalData, setTempCostumeEvalData] = useState<any>(null);
  const [returnOpen, setReturnOpen] = useState<Record<string, boolean>>({});
  const [shopCategoryTab, setShopCategoryTab] = useState<'all'|'tops'|'bottoms'|'shoes'|'accessories'|'items'>('all');
  const [shoppingCart, setShoppingCart] = useState<Record<string, number>>({}); // itemId -> quantity
  const [toast, setToast] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({ tops: 0, bottoms: 0, shoes: 0, accessories: 0, all: 0 });
  const [costumeError, setCostumeError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const toggleProjectExpand = (projId: string) => {
    setExpandedProjects(prev => ({ ...prev, [projId]: !prev[projId] }));
  };

  // Keep activeProjects in sync with ref for use in setTimeout callbacks
  useEffect(() => {
    activeProjectsRef.current = activeProjects;
  }, [activeProjects]);


  // Инициализация outfitDraft только при первом открытии окна выбора костюма
  const didInitOutfitDraft = useRef(false);

  // Always enforce pause while costume modal is open (selection or evaluation)
  useEffect(() => {
    const modalActive = Boolean(pendingCostumeSelection) && costumeModalStep !== 'select' ? true : Boolean(pendingCostumeSelection);
    if (setModalPause) {
      setModalPause(!!modalActive);
    }
  }, [pendingCostumeSelection, costumeModalStep, setModalPause]);

  useEffect(() => {
    // Открытие модального окна
    if (pendingCostumeSelection && !didInitOutfitDraft.current) {
      if (releaseReservedCostume) {
        releaseReservedCostume(pendingCostumeSelection);
      }
      setCostumeModalStep('select');
      setCostumeEvalResult(null);
      setCostumeError(null);
      // initialize outfitDraft from player's inventory when opening
      const defaults: any = { accessories: [] };
      try {
        if (playerInventory && playerInventory.length > 0) {
          const invSet = new Set(playerInventory);
          const findInInv = (cat: string) => (clothesCatalog || []).find((c: any) => c.category === cat && invSet.has(c.id))?.id;
          const t = findInInv('top');
          const b = findInInv('bottom');
          const s = findInInv('shoes');
          if (t) defaults.top = t;
          if (b) defaults.bottom = b;
          if (s) defaults.shoes = s;
        }
      } catch (e) {
        // ignore
      }
      setOutfitDrafts(prev => ({ ...prev, [pendingCostumeSelection]: defaults }));
      didInitOutfitDraft.current = true;
    }
    // Закрытие модального окна
    if (!pendingCostumeSelection && didInitOutfitDraft.current) {
      // Сбросить состояние только при полном закрытии окна
      setCostumeModalStep('select');
      setCostumeEvalResult(null);
      setCostumeError(null);
      didInitOutfitDraft.current = false;
    }
  }, [pendingCostumeSelection, releaseReservedCostume, playerInventory, clothesCatalog]);

  // Costume reservation helpers
  const setDraft = (projId: string, val: number) => setCostumeDrafts(prev => ({ ...prev, [projId]: val }));
  const clearDraft = (projId: string) => setCostumeDrafts(prev => { const copy = {...prev}; delete copy[projId]; return copy; });
  const setReturn = (projId: string, open: boolean) => setReturnOpen(prev => ({ ...prev, [projId]: open }));

  const handleAddToCart = (key: string, name: string, price: number) => {
    const ev = new CustomEvent('add-to-cart', { detail: { key, name, price } });
    window.dispatchEvent(ev);
    setToast(`${name} добавлено в корзину`);
    setTimeout(() => setToast(null), 2000);
  };

  const handleBuyClothesItem = (itemId: string, itemName: string) => {
    const ok = buyClothesItem && buyClothesItem(itemId);
    if (!ok) {
      playSFX('error.wav');
      setToast('❌ Недостаточно денег');
    } else {
      playSFX('coin.wav');
      setToast(`✨ ${itemName} куплен!`);
    }
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="main-tabs">
      {/* Tab Navigation */}
      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => { setActiveTab('main'); playSFX('click.wav'); }}
        >
          <Home size={18} style={{marginRight: 6}} /> Главная
        </button>
        <button
          data-onboarding-target="main-tabs-search"
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => { setActiveTab('search'); playSFX('click.wav'); }}
        >
          <Search size={18} style={{marginRight: 6}} /> Поиск проектов
        </button>
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => { setActiveTab('active'); playSFX('click.wav'); }}
        >
          <Video size={18} style={{marginRight: 6}} /> Ваши каверы
        </button>
        <button
          className={`tab-btn ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => { setActiveTab('ratings'); playSFX('click.wav'); }}
        >
          <Star size={18} style={{marginRight: 6}} /> Рейтинги
        </button>
        <button
          className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
          onClick={() => { setActiveTab('shop'); playSFX('click.wav'); }}
        >
          <Store size={18} style={{marginRight: 6}} /> Магазин
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Costume selection modal triggered at 50% progress */}
        {pendingCostumeSelection && (() => {
          const project = activeProjects.find(p => p.id === pendingCostumeSelection);
          if (!project) return null;
          const catalog = (clothesCatalog || []);
          // Выбор костюма для конкретного проекта
          const selectItem = (id: string) => {
            const it = catalog.find(c => c.id === id) as any;
            if (!it) return;
            setOutfitDrafts(prev => {
              const draft = { ...(prev[project.id] || { accessories: [] }) };
              if (it.category === 'accessory') {
                draft.accessories = Array.from(new Set([...(draft.accessories || []), id])).slice(0, 5);
              } else {
                (draft as any)[it.category] = id;
              }
              return { ...prev, [project.id]: draft };
            });
            setCostumeError(null);
          };
          const unselectAccessory = (id: string) => {
            setOutfitDrafts(prev => {
              const draft = { ...(prev[project.id] || { accessories: [] }) };
              draft.accessories = (draft.accessories || []).filter(a => a !== id);
              return { ...prev, [project.id]: draft };
            });
            setCostumeError(null);
          };

          // helpers for carousel
          const filteredForTab = (tab: string) => {
            return catalog.filter((it: any) => {
              if (tab === 'all') return true;
              if (tab === 'items') return it.category === 'tonic' || it.category === 'other';
              if (tab === 'tops') return it.category === 'top';
              if (tab === 'bottoms') return it.category === 'bottom';
              if (tab === 'shoes') return it.category === 'shoes';
              if (tab === 'accessories') return it.category === 'accessory';
              return true;
            });
          };

          const visibleItems = (tabKey: string) => {
            const list = filteredForTab(tabKey);
            const idx = carouselIndex[tabKey === 'all' ? 'all' : (tabKey === 'tops' ? 'tops' : (tabKey === 'bottoms' ? 'bottoms' : (tabKey === 'shoes' ? 'shoes' : 'accessories')))] || 0;
            return list.slice(idx, idx + 4);
          };

          const moveCarousel = (tabKey: string, dir: number) => {
            const list = filteredForTab(tabKey);
            const key = tabKey === 'all' ? 'all' : (tabKey === 'tops' ? 'tops' : (tabKey === 'bottoms' ? 'bottoms' : (tabKey === 'shoes' ? 'shoes' : 'accessories')));
            const cur = carouselIndex[key] || 0;
            const maxIndex = Math.max(0, list.length - 4);
            // Cyclic carousel: wrap around at boundaries
            let next = cur + dir;
            if (next > maxIndex) {
              next = 0; // Wrap to start when going right past end
            } else if (next < 0) {
              next = maxIndex; // Wrap to end when going left past start
            }
            setCarouselIndex(prev => ({ ...prev, [key]: next }));
          };

          const currentDraft = outfitDrafts[project.id] || { accessories: [] };
          const mandatoryMissing = {
            top: !currentDraft.top,
            bottom: !currentDraft.bottom,
            shoes: !currentDraft.shoes,
          };
          
          // Get owned items list
          const ownedIds = Array.isArray(playerInventory) ? playerInventory : (state?.player?.inventory?.map((i:any)=>i.id) || []);
          const isOwned = (itemId: string) => ownedIds.includes(itemId);

          return (
            <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px'}}>
              <div className="modal card" style={{maxWidth: 1100, width: '92%', height: 'calc(100vh - 80px)', margin: '0 auto', padding: '12px 14px', display: 'flex', flexDirection: 'column'}}>
                <div className="modal-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom: '16px'}}>
                  <h3 style={{margin: '0'}}>Выбор костюма для проекта: {project.name} ({project.requiredSkill === 'F_skill' ? '👩 Женский' : project.requiredSkill === 'M_skill' ? '👨 Мужской' : '🎭 Оба'})</h3>
                  <div style={{display:'flex',gap:12,alignItems:'center'}}>
                    {Object.keys(shoppingCart).length > 0 && (
                      <div style={{display:'flex',gap:6,alignItems:'center',fontSize:'14px'}}>
                        <ShoppingCart size={16} />
                        <span style={{fontWeight:700}}>{Object.keys(shoppingCart).length}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-body" style={{flex: 1, overflowY: 'hidden', paddingRight: '0px', marginTop: '0px'}}>
                  {costumeModalStep === 'select' && (
                    <>
                      <p style={{fontSize: '13px', margin: '0 0 12px 0'}}>Сформируйте образ: верх, низ, обувь — обязательно. До 5 аксессуаров — по желанию.</p>
                      {costumeError && <div style={{color:'#c62828',fontWeight:700,marginBottom:6,fontSize:'12px'}}>{costumeError}</div>}
                      <div style={{display:'flex',gap:60,alignItems:'flex-start',height:'100%'}}>
                        {/* Left: preview with images */}
                        <div style={{width:160,flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-start',marginTop:0,alignSelf:'flex-start',marginLeft:30}}>
                          <div style={{display:'flex',flexDirection:'column',gap:12,width:'100%',alignItems:'center',height:'auto',justifyContent:'flex-start',marginTop:0}}>
                            {/* Clothing slots with images */}
                            {(['top','bottom','shoes'] as const).map((slot)=>{
                              const selectedId = (slot==='top'?currentDraft.top:(slot==='bottom'?currentDraft.bottom:currentDraft.shoes));
                              const it: any = (clothesCatalog||[]).find((c:any)=>c.id===selectedId);
                              const borderColor = costumeError && mandatoryMissing[slot] ? '#d32f2f' : (selectedId ? '#ff69b4' : '#999');
                              const slotLabel = slot==='top'?'ВЕРХ':slot==='bottom'?'НИЗ':'ОБУВЬ';
                                return (
                                <div key={slot} style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:'0 0 auto',justifyContent:'center',minHeight:150}}>
                                  <div style={{fontSize:9,fontWeight:700,color:borderColor,textTransform:'uppercase',letterSpacing:'0.5px',width:'100%',textAlign:'center'}}>{slotLabel}</div>
                                  <div style={{width:'100%',height:105,background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#f5f5f5',border:`2px solid ${borderColor}`,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
                                    {it ? (
                                      <>
                                        <img src={it.img || '/avatars/normalized/default.svg'} alt={it.name} style={{width:'100%',height:'100%',objectFit:'contain'}} onError={(e:any)=>{e.currentTarget.src='/avatars/normalized/default.svg'}} />
                                      </>
                                    ) : (
                                      <div style={{color:localStorage.getItem('theme') === 'dark' ? '#666' : '#999',fontSize:10,textAlign:'center'}}>Не выбрано</div>
                                    )}
                                  </div>
                                  {it && <div style={{fontSize:9,fontWeight:600,color:'#999',textAlign:'center',lineHeight:1.2,minHeight:15}}>{it.name}</div>}
                                </div>
                              );
                            })}

                            {/* accessories row (up to 5) - show as selection grid in left preview */}
                            <div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:'0 0 auto'}}>
                              <div style={{fontSize:9,fontWeight:700,color:'#ff69b4',textTransform:'uppercase',letterSpacing:'0.5px',textAlign:'center'}}>АКСЕССУАРЫ</div>
                              <div style={{display:'flex',flexDirection:'column',width:'100%',gap:4}}>
                                <div style={{display:'flex',flexDirection:'row',gap:4,justifyContent:'center',width:'100%'}}>
                                  {Array.from({length:3}).map((_, idx) => {
                                    const accIdx = idx;
                                    const accId = (currentDraft.accessories || [])[accIdx];
                                    const accIt = accId ? (clothesCatalog||[]).find((c:any)=>c.id===accId) : null;
                                    return (
                                      <div key={accIdx} style={{width:60,height:60,background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#f5f5f5',border:`2px solid ${accIt ? '#ff69b4' : '#999'}`,borderRadius:4,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flex:'0 0 auto'}}>
                                        {accIt ? (
                                          <>
                                            <img src={accIt.img || '/avatars/normalized/default.svg'} alt={accIt.name} style={{width:'100%',height:'100%',objectFit:'contain'}} onError={(e:any)=>{e.currentTarget.src='/avatars/normalized/default.svg'}} />
                                            <button onClick={() => unselectAccessory(accIt.id)} title="Удалить" style={{position:'absolute',right:6,top:6,border:'none',background:'linear-gradient(135deg, #ff69b4, #ff1493)',color:'#fff',borderRadius:'50%',width:18,height:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>✕</button>
                                          </>
                                        ) : (
                                          <div style={{color:localStorage.getItem('theme') === 'dark' ? '#666' : '#bbb',fontSize:9}}>—</div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div style={{display:'flex',flexDirection:'row',gap:4,justifyContent:'center',width:'100%'}}>
                                  {Array.from({length:2}).map((_, idx) => {
                                    const accIdx = idx + 3;
                                    const accId = (currentDraft.accessories || [])[accIdx];
                                    const accIt = accId ? (clothesCatalog||[]).find((c:any)=>c.id===accId) : null;
                                    return (
                                      <div key={accIdx} style={{width:60,height:60,background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#f5f5f5',border:`2px solid ${accIt ? '#ff69b4' : '#999'}`,borderRadius:4,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flex:'0 0 auto'}}>
                                        {accIt ? (
                                          <>
                                            <img src={accIt.img || '/avatars/normalized/default.svg'} alt={accIt.name} style={{width:'100%',height:'100%',objectFit:'contain'}} onError={(e:any)=>{e.currentTarget.src='/avatars/normalized/default.svg'}} />
                                            <button onClick={() => unselectAccessory(accIt.id)} title="Удалить" style={{position:'absolute',right:6,top:6,border:'none',background:'linear-gradient(135deg, #ff69b4, #ff1493)',color:'#fff',borderRadius:'50%',width:18,height:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>✕</button>
                                          </>
                                        ) : (
                                          <div style={{color:localStorage.getItem('theme') === 'dark' ? '#666' : '#bbb',fontSize:9}}>—</div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: 4 separate carousels for each clothing type */}
                        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'flex-start',gap:12,marginLeft:0}}>
                          
                          {/* TOPS */}
                          <div style={{flex:'0 0 auto'}}>
                            <div style={{display:'flex',alignItems:'center',gap:12}}>
                              <button onClick={() => moveCarousel('tops', -1)} style={{width:32,height:32,borderRadius:6,border:'1px solid #999',background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#fff',color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#000',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}}>&lt;</button>
                              <div style={{display:'flex',gap:6,flex:1,alignItems:'stretch',minHeight:'118px'}}>
                                {visibleItems('tops').map((it:any)=> (
                                  <div key={it.id} style={{flex:'1 1 0',minHeight:150,border:'1px solid rgba(255,105,180,0.2)',borderRadius:6,background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#f9f9f9',display:'flex',flexDirection:'column',justifyContent:'space-between',overflow:'hidden',cursor:'pointer',transition:'all 0.2s',transform:currentDraft.top===it.id ? 'scale(1.03)' : 'scale(1)',borderColor:currentDraft.top===it.id ? '#ff69b4' : 'rgba(255,105,180,0.2)',position:'relative',zIndex:2}}>
                                    <div style={{width:'100%',height:70,background:localStorage.getItem('theme') === 'dark' ? '#1a1a2a' : '#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
                                      <img src={it.img || '/avatars/normalized/default.svg'} alt={it.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:'4px'}} onError={(e:any)=>{e.currentTarget.src='/avatars/normalized/default.svg'}} />
                                    </div>
                                    <div style={{padding:'6px 6px 0 6px',fontSize:11,fontWeight:600,color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#222',lineHeight:1.3,minHeight:30,display:'flex',alignItems:'center',textAlign:'center'}}>{it.name}</div>
                                      <div style={{padding:'0 6px 6px 6px',display:'flex',gap:6,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
                                      <div style={{fontSize:10,color:localStorage.getItem('theme') === 'dark' ? '#aaa' : '#666',whiteSpace:'nowrap',flex:'0 0 auto'}}>{isOwned(it.id) ? 'Бесплатно' : (it.price ? it.price + ' ₽' : 'Бесплатно')}</div>
                                      <button type="button" onClick={() => selectItem(it.id)} style={{padding:'4px 6px',fontSize:10,borderRadius:3,border:'none',background:currentDraft.top===it.id ? '#4CAF50' : 'linear-gradient(135deg, #ff69b4, #ff1493)',color:'#fff',cursor:'pointer',fontWeight:700,whiteSpace:'nowrap',flex:'0 0 auto',zIndex:5,position:'relative',transition:'all 0.2s',boxShadow:currentDraft.top===it.id ? 'none' : '0 4px 12px rgba(255,105,180,0.2)'}}>
                                        {currentDraft.top===it.id ? '✓' : 'Выбрать'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <button onClick={() => moveCarousel('tops', +1)} style={{width:32,height:32,borderRadius:6,border:'1px solid #999',background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#fff',color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#000',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}}>&gt;</button>
                            </div>
                          </div>

                          {/* BOTTOMS */}
                          <div style={{flex:'0 0 auto'}}>
                            <div style={{display:'flex',alignItems:'center',gap:12}}>
                              <button onClick={() => moveCarousel('bottoms', -1)} style={{width:32,height:32,borderRadius:6,border:'1px solid #999',background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#fff',color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#000',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}}>&lt;</button>
                              <div style={{display:'flex',gap:6,flex:1,alignItems:'stretch',minHeight:'118px'}}>
                                {visibleItems('bottoms').map((it:any)=> (
                                  <div key={it.id} style={{flex:'1 1 0',minHeight:150,border:'1px solid rgba(255,105,180,0.2)',borderRadius:6,background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#f9f9f9',display:'flex',flexDirection:'column',justifyContent:'space-between',overflow:'hidden',cursor:'pointer',transition:'all 0.2s',transform:currentDraft.bottom===it.id ? 'scale(1.03)' : 'scale(1)',borderColor:currentDraft.bottom===it.id ? '#ff69b4' : 'rgba(255,105,180,0.2)',position:'relative',zIndex:2}}>
                                    <div style={{width:'100%',height:70,background:localStorage.getItem('theme') === 'dark' ? '#1a1a2a' : '#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
                                      <img src={it.img || '/avatars/normalized/default.svg'} alt={it.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:'4px'}} onError={(e:any)=>{e.currentTarget.src='/avatars/normalized/default.svg'}} />
                                    </div>
                                    <div style={{padding:'6px 6px 0 6px',fontSize:11,fontWeight:600,color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#222',lineHeight:1.3,minHeight:30,display:'flex',alignItems:'center',textAlign:'center'}}>{it.name}</div>
                                    <div style={{padding:'0 6px 6px 6px',display:'flex',gap:6,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
                                      <div style={{fontSize:10,color:localStorage.getItem('theme') === 'dark' ? '#aaa' : '#666',whiteSpace:'nowrap',flex:'0 0 auto'}}>{isOwned(it.id) ? 'Бесплатно' : (it.price ? it.price + ' ₽' : 'Бесплатно')}</div>
                                      <button type="button" onClick={() => selectItem(it.id)} style={{padding:'4px 6px',fontSize:10,borderRadius:3,border:'none',background:currentDraft.bottom===it.id ? '#4CAF50' : 'linear-gradient(135deg, #ff69b4, #ff1493)',color:'#fff',cursor:'pointer',fontWeight:700,whiteSpace:'nowrap',flex:'0 0 auto',zIndex:5,position:'relative',transition:'all 0.2s',boxShadow:currentDraft.bottom===it.id ? 'none' : '0 4px 12px rgba(255,105,180,0.2)'}}>
                                        {currentDraft.bottom===it.id ? '✓' : 'Выбрать'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <button onClick={() => moveCarousel('bottoms', +1)} style={{width:32,height:32,borderRadius:6,border:'1px solid #999',background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#fff',color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#000',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}}>&gt;</button>
                            </div>
                          </div>

                          {/* SHOES */}
                          <div style={{flex:'0 0 auto'}}>
                            <div style={{display:'flex',alignItems:'center',gap:12}}>
                              <button onClick={() => moveCarousel('shoes', -1)} style={{width:32,height:32,borderRadius:6,border:'1px solid #999',background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#fff',color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#000',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}}>&lt;</button>
                              <div style={{display:'flex',gap:6,flex:1,alignItems:'stretch',minHeight:'118px'}}>
                                {visibleItems('shoes').map((it:any)=> (
                                  <div key={it.id} style={{flex:'1 1 0',minHeight:150,border:'1px solid rgba(255,105,180,0.2)',borderRadius:6,background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#f9f9f9',display:'flex',flexDirection:'column',justifyContent:'space-between',overflow:'hidden',cursor:'pointer',transition:'all 0.2s',transform:currentDraft.shoes===it.id ? 'scale(1.03)' : 'scale(1)',borderColor:currentDraft.shoes===it.id ? '#ff69b4' : 'rgba(255,105,180,0.2)',position:'relative',zIndex:2}}>
                                    <div style={{width:'100%',height:70,background:localStorage.getItem('theme') === 'dark' ? '#1a1a2a' : '#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
                                      <img src={it.img || '/avatars/normalized/default.svg'} alt={it.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:'4px'}} onError={(e:any)=>{e.currentTarget.src='/avatars/normalized/default.svg'}} />
                                    </div>
                                    <div style={{padding:'6px 6px 0 6px',fontSize:11,fontWeight:600,color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#222',lineHeight:1.3,minHeight:30,display:'flex',alignItems:'center',textAlign:'center'}}>{it.name}</div>
                                    <div style={{padding:'0 6px 6px 6px',display:'flex',gap:6,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
                                      <div style={{fontSize:10,color:localStorage.getItem('theme') === 'dark' ? '#aaa' : '#666',whiteSpace:'nowrap',flex:'0 0 auto'}}>{isOwned(it.id) ? 'Бесплатно' : (it.price ? it.price + ' ₽' : 'Бесплатно')}</div>
                                      <button type="button" onClick={() => selectItem(it.id)} style={{padding:'4px 6px',fontSize:10,borderRadius:3,border:'none',background:currentDraft.shoes===it.id ? '#4CAF50' : 'linear-gradient(135deg, #ff69b4, #ff1493)',color:'#fff',cursor:'pointer',fontWeight:700,whiteSpace:'nowrap',flex:'0 0 auto',zIndex:5,position:'relative',transition:'all 0.2s',boxShadow:currentDraft.shoes===it.id ? 'none' : '0 4px 12px rgba(255,105,180,0.2)'}}>
                                        {currentDraft.shoes===it.id ? '✓' : 'Выбрать'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <button onClick={() => moveCarousel('shoes', +1)} style={{width:32,height:32,borderRadius:6,border:'1px solid #999',background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#fff',color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#000',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}}>&gt;</button>
                            </div>
                          </div>

                          {/* ACCESSORIES */}
                          <div style={{flex:'0 0 auto'}}>
                            <div style={{display:'flex',alignItems:'center',gap:12}}>
                              <button onClick={() => moveCarousel('accessories', -1)} style={{width:32,height:32,borderRadius:6,border:'1px solid #999',background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#fff',color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#000',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}}>&lt;</button>
                              <div style={{display:'flex',gap:6,flex:1,alignItems:'stretch',minHeight:'118px',paddingLeft:0}}>
                                {visibleItems('accessories').map((it:any)=> (
                                  <div key={it.id} style={{flex:'1 1 0',minHeight:150,border:'1px solid rgba(255,105,180,0.2)',borderRadius:6,background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#f9f9f9',display:'flex',flexDirection:'column',justifyContent:'space-between',overflow:'hidden',cursor:'pointer',transition:'all 0.2s',transform:(currentDraft.accessories || []).includes(it.id) ? 'scale(1.03)' : 'scale(1)',borderColor:(currentDraft.accessories || []).includes(it.id) ? '#ff69b4' : 'rgba(255,105,180,0.2)',opacity:(it.category==='accessory' && (currentDraft.accessories || []).length >= 5 && !(currentDraft.accessories || []).includes(it.id)) ? 0.5 : 1,pointerEvents:(it.category==='accessory' && (currentDraft.accessories || []).length >= 5 && !(currentDraft.accessories || []).includes(it.id)) ? 'none' : 'auto',position:'relative',zIndex:2}}>
                                    <div style={{width:'100%',height:70,background:localStorage.getItem('theme') === 'dark' ? '#1a1a2a' : '#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
                                      <img src={it.img || '/avatars/normalized/default.svg'} alt={it.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:'4px'}} onError={(e:any)=>{e.currentTarget.src='/avatars/normalized/default.svg'}} />
                                    </div>
                                    <div style={{padding:'6px 6px 0 6px',fontSize:11,fontWeight:600,color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#222',lineHeight:1.3,minHeight:30,display:'flex',alignItems:'center',textAlign:'center'}}>{it.name}</div>
                                    <div style={{padding:'0 6px 6px 6px',display:'flex',gap:6,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
                                      <div style={{fontSize:10,color:localStorage.getItem('theme') === 'dark' ? '#aaa' : '#666',whiteSpace:'nowrap',flex:'0 0 auto'}}>{isOwned(it.id) ? 'Бесплатно' : (it.price ? it.price + ' ₽' : 'Бесплатно')}</div>
                                      <button type="button" onClick={() => selectItem(it.id)} disabled={it.category==='accessory' && (currentDraft.accessories || []).length >= 5 && !(currentDraft.accessories || []).includes(it.id)} style={{padding:'4px 6px',fontSize:10,borderRadius:3,border:'none',background:(currentDraft.accessories || []).includes(it.id) ? '#4CAF50' : 'linear-gradient(135deg, #ff69b4, #ff1493)',color:'#fff',cursor:'pointer',fontWeight:700,whiteSpace:'nowrap',flex:'0 0 auto',zIndex:5,position:'relative',transition:'all 0.2s',boxShadow:(currentDraft.accessories || []).includes(it.id) ? 'none' : '0 4px 12px rgba(255,105,180,0.2)'}}>
                                        {(currentDraft.accessories || []).includes(it.id) ? '✓' : 'Выбрать'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <button onClick={() => moveCarousel('accessories', +1)} style={{width:32,height:32,borderRadius:6,border:'1px solid #999',background:localStorage.getItem('theme') === 'dark' ? '#2a2a3a' : '#fff',color:localStorage.getItem('theme') === 'dark' ? '#fff' : '#000',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}}>&gt;</button>
                            </div>
                          </div>

                          {toast && <div style={{position:'fixed',right:20,bottom:20,background:'#333',color:'#fff',padding:'10px 14px',borderRadius:8,boxShadow:'0 6px 18px rgba(0,0,0,0.3)'}}>{toast}</div>}
                        </div>
                      </div>
                    </>
                  )}
                  {costumeModalStep === 'loading' && (
                    <>
                      <p style={{fontSize:14,fontWeight:700,textAlign:'center',marginBottom:24}}>Лидер проекта оценивает костюм...</p>
                      <div style={{textAlign:'center',padding:40,display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
                        <div className="loader" />
                      </div>
                    </>
                  )}
                  {costumeModalStep === 'result' && costumeEvalResult && (
                    <>
                      <p style={{fontSize:14,fontWeight:700,textAlign:'center',marginBottom:24}}>Мнение лидера проекта</p>
                      <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
                      {costumeEvalResult && costumeEvalResult.npcAvatarId && (
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,minWidth:120,flexShrink:0}}>
                              <img 
                                src={`/avatars/normalized/${costumeEvalResult.npcAvatarId}`}
                                alt={costumeEvalResult.npcName}
                                onError={(e: any) => { const img = e.currentTarget as HTMLImageElement; img.src = `/avatars/normalized/default.svg`; }}
                                style={{width:100,height:100,borderRadius:'50%',border:'3px solid #ff69b4',objectFit:'cover'}}
                              />
                              <div style={{fontSize:13,fontWeight:700,textAlign:'center',color:'#ff69b4'}}>{costumeEvalResult.npcName}</div>
                            </div>
                          )}
                        <div style={{display:'flex',flexDirection:'column',gap:12,flex:1}}>
                          <div style={{background:'linear-gradient(135deg,rgba(255,105,180,0.08),rgba(255,105,180,0.03))',border:'2px solid rgba(255,105,180,0.2)',borderRadius:12,padding:'20px 24px',boxShadow:'0 4px 16px rgba(255,105,180,0.1)'}}>
                            <div style={{fontSize:16,fontWeight:700,textAlign:'left',color:costumeEvalResult.matchPercent>=81?'#22c55e':costumeEvalResult.matchPercent>=51?'#f59e0b':'#ef4444',marginBottom:8}}>{costumeEvalResult.matchPercent}% соответствия</div>
                            <div style={{fontSize:13,fontWeight:600,textAlign:'left',color:'#ff69b4',marginBottom:12}}>
                              {costumeEvalResult.matchPercent < 50 ? '❌ Костюм не подходит' : costumeEvalResult.matchPercent >= 81 ? '✨ Костюм одобрен!' : '⚠️ Костюм приемлем'}
                            </div>
                            <p style={{fontSize:13,lineHeight:1.6,color:'#666',margin:0}}>{decodeURIComponent(encodeURIComponent(costumeEvalResult.message || 'Спасибо за выбор.'))}</p>
                          </div>
                          {costumeEvalResult.matchPercent < 50 && (
                            <div style={{fontSize:12,color:'#ef4444',fontWeight:600,padding:'8px 12px',background:'rgba(239,68,68,0.1)',borderRadius:8,border:'1px solid rgba(239,68,68,0.2)'}}>
                              ⏰ У вас есть 7 дней, чтобы найти подходящий костюм. После истечения срока - дедлайн проекта будет продлен на неделю.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected costume items */}
                      <div style={{display:'flex',gap:16,justifyContent:'center',alignItems:'flex-end',padding:'16px 0 0 0',borderTop:'1px solid rgba(255,105,180,0.2)',marginTop:16,flexWrap:'wrap'}}>
                        {currentDraft.top && (() => {
                          const item = (clothesCatalog || []).find((c: any) => c.id === currentDraft.top);
                          return item ? (
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                              <div style={{width:90,height:90,background:'rgba(255,105,180,0.1)',borderRadius:8,border:'2px solid #ff69b4',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                                <img src={item.img || '/avatars/normalized/default.svg'} alt={item.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:6}} />
                              </div>
                              <div style={{fontSize:12,fontWeight:600,color:'#ff69b4',textAlign:'center',maxWidth:90}}>{item.name}</div>
                            </div>
                          ) : null;
                        })()}
                        {currentDraft.bottom && (() => {
                          const item = (clothesCatalog || []).find((c: any) => c.id === currentDraft.bottom);
                          return item ? (
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                              <div style={{width:90,height:90,background:'rgba(255,105,180,0.1)',borderRadius:8,border:'2px solid #ff69b4',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                                <img src={item.img || '/avatars/normalized/default.svg'} alt={item.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:6}} />
                              </div>
                              <div style={{fontSize:12,fontWeight:600,color:'#ff69b4',textAlign:'center',maxWidth:90}}>{item.name}</div>
                            </div>
                          ) : null;
                        })()}
                        {currentDraft.shoes && (() => {
                          const item = (clothesCatalog || []).find((c: any) => c.id === currentDraft.shoes);
                          return item ? (
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                              <div style={{width:90,height:90,background:'rgba(255,105,180,0.1)',borderRadius:8,border:'2px solid #ff69b4',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                                <img src={item.img || '/avatars/normalized/default.svg'} alt={item.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:6}} />
                              </div>
                              <div style={{fontSize:12,fontWeight:600,color:'#ff69b4',textAlign:'center',maxWidth:90}}>{item.name}</div>
                            </div>
                          ) : null;
                        })()}
                        {currentDraft.accessories && currentDraft.accessories.length > 0 && currentDraft.accessories.map((accId: string) => {
                          const item = (clothesCatalog || []).find((c: any) => c.id === accId);
                          return item ? (
                            <div key={accId} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                              <div style={{width:90,height:90,background:'rgba(255,105,180,0.1)',borderRadius:8,border:'2px solid #ff69b4',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                                <img src={item.img || '/avatars/normalized/default.svg'} alt={item.name} style={{width:'100%',height:'100%',objectFit:'contain',padding:6}} />
                              </div>
                              <div style={{fontSize:12,fontWeight:600,color:'#ff69b4',textAlign:'center',maxWidth:90}}>{item.name}</div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-actions" style={{display:'flex',gap:16,justifyContent:'space-between',alignItems:'center',paddingTop:'16px',borderTop:'1px solid rgba(255,105,180,0.2)'}}>
                  {costumeModalStep === 'select' && (
                    <>
                      {/* Price info on the left */}
                      {(() => {
                        const ownedIds = Array.isArray(playerInventory) ? playerInventory : (state?.player?.inventory?.map((i:any)=>i.id) || []);
                        const selectedItems = [currentDraft.top, currentDraft.bottom, currentDraft.shoes, ...(currentDraft.accessories||[])].filter(Boolean);
                        const unownedCost = selectedItems.reduce((sum, id)=>{
                          if (!ownedIds.includes(id)) {
                            const item = (clothesCatalog || []).find((c:any)=>c.id===id);
                            return sum + (item?.price || 0);
                          }
                          return sum;
                        }, 0);
                        const currentBalance = state?.player?.money || 0;
                        const remainingBalance = currentBalance - unownedCost;
                        const hasEnoughMoney = remainingBalance >= 0;
                        return (
                          <div style={{display:'flex',flexDirection:'column',gap:6,flex:1}}>
                            {unownedCost > 0 && (
                              <div style={{fontSize:13,fontWeight:700,color:'#ff69b4'}}>
                                Стоимость сета: <strong>{unownedCost} ₽</strong>
                              </div>
                            )}
                            <div style={{fontSize:12,fontWeight:600,color:hasEnoughMoney ? '#22c55e' : '#ef4444'}}>
                              Останется: <strong>{remainingBalance} ₽</strong>
                            </div>
                            {!hasEnoughMoney && unownedCost > 0 && (
                              <div style={{fontSize:11,color:'#ef4444',fontWeight:600}}>
                                ⚠️ Недостаточно денег (не хватает {Math.abs(remainingBalance)} ₽)
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      
                      {/* Button on the right */}
                      <button className="btn-confirm" onClick={() => {
                        // Check if costume is already locked
                        if ((project as any).costumeLocked) {
                          playSFX('error.wav');
                          setCostumeError('⛔ Костюм уже одобрен и не может быть изменен');
                          return;
                        }
                        // require mandatory items
                        if (!currentDraft.top || !currentDraft.bottom || !currentDraft.shoes) {
                          playSFX('error.wav');
                          setCostumeError('Выбраны не все части костюма');
                          return;
                        }
                        
                        // Check money
                        const ownedIds = Array.isArray(playerInventory) ? playerInventory : (state?.player?.inventory?.map((i:any)=>i.id) || []);
                        const selectedItems = [currentDraft.top, currentDraft.bottom, currentDraft.shoes, ...(currentDraft.accessories||[])].filter(Boolean);
                        const unownedCost = selectedItems.reduce((sum, id)=>{
                          if (!ownedIds.includes(id)) {
                            const item = (clothesCatalog || []).find((c:any)=>c.id===id);
                            return sum + (item?.price || 0);
                          }
                          return sum;
                        }, 0);
                        const currentBalance = state?.player?.money || 0;
                        if (currentBalance < unownedCost) {
                          playSFX('error.wav');
                          setCostumeError(`❌ Недостаточно денег! Нужно ${unownedCost} ₽, а у вас только ${currentBalance} ₽`);
                          return;
                        }
                        
                        setCostumeError(null);
                        setCostumeModalStep('loading');
                        // play buy sound
                        playSFX('buy.mp3');
                        
                        // Сохранить временные данные для оценки перед обновлением
                        const leaderId = project.npcId || project.leaderId;
                        const leaderNPC = (npcs || []).find((n: any) => n.id === leaderId);
                        setTempCostumeEvalData({ leaderId, leaderNPC: leaderNPC || { name: 'Лидер проекта', faceId: 'default' } });
                        
                        // Submit selection immediately
                        if (submitCostumeSelection) submitCostumeSelection(project.id, currentDraft as any);
                        
                        // Show loading screen for 2 seconds, then display result
                        setTimeout(() => {
                          // Читать обновленные данные проекта с результатом оценки
                          const updated = activeProjectsRef.current.find(p=>p.id===project.id) || project;
                          const match = (updated as any).costumeMatchPercent || 0;
                          let opinion = (updated as any).costumeOpinion || 'Спасибо за выбор.';
                          // Ensure opinion text is properly encoded (UTF-8 compatible)
                          try { opinion = decodeURIComponent(encodeURIComponent(opinion)); } catch (e) { /* keep original */ }
                          const costumeNpcId = (updated as any).costumeNpcId || tempCostumeEvalData?.leaderId || (updated as any).npcId || (updated as any).leaderId;
                          const costumeNpcFaceId = (updated as any).costumeNpcFaceId || tempCostumeEvalData?.leaderNPC?.faceId || 'default';
                          
                          // Использовать сохраненный NPC если он есть
                          let leadNPC: any = tempCostumeEvalData?.leaderNPC;
                          if (!leadNPC && costumeNpcId) {
                            leadNPC = (npcs || []).find((n: any) => n.id === costumeNpcId);
                          }
                          if (!leadNPC) leadNPC = { name: 'Лидер проекта', faceId: 'default' };
                          
                          setCostumeEvalResult({ matchPercent: match, message: opinion, npcId: leadNPC.id, npcName: leadNPC.name, npcAvatarId: costumeNpcFaceId || leadNPC.faceId || 'default' });
                          setCostumeModalStep('result');
                          setTempCostumeEvalData(null);
                        }, 2000);
                      }} style={{flex:'0 0 auto',minWidth:'140px'}}>Подтвердить</button>
                    </>
                  )}
                  {costumeModalStep === 'result' && (
                    <>
                      <button className="btn-cancel" onClick={() => { 
                        if (costumeEvalResult && costumeEvalResult.matchPercent < 81) {
                          setCostumeModalStep('select'); 
                          setOutfitDrafts(prev => { const updated = { ...prev }; delete updated[project.id]; return updated; });
                          setCostumeEvalResult(null); 
                          setCostumeError(null); 
                          playSFX('click.wav');
                        }
                      }} style={{visibility: costumeEvalResult && costumeEvalResult.matchPercent < 81 ? 'visible' : 'hidden'}}>Изменить</button>
                      <button className="btn-confirm" onClick={() => {
                        clearPendingCostumeSelection && clearPendingCostumeSelection();
                        setCostumeModalStep('select');
                        setOutfitDrafts(prev => { const updated = { ...prev }; delete updated[project.id]; return updated; });
                        setCostumeEvalResult(null);
                        setCostumeError(null);
                        playSFX('click.wav');
                        
                        // If costume match is 81%+ (excellent), trigger project constructor
                        if (costumeEvalResult && costumeEvalResult.matchPercent >= 81 && selectedProject) {
                          // Dispatch event to open project constructor in messenger
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('open-project-constructor', {
                              detail: {
                                npcId: selectedProject.npcId || selectedProject.leaderId,
                                npcName: costumeEvalResult.npcName || 'Лидер проекта',
                                projectId: selectedProject.id
                              }
                            }));
                          }, 300);
                        }
                      }}>Готово</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'main' && (
          <div className="tab-pane">
            <PlayerActions />
            <h2>Активные проекты ({activeProjects.length})</h2>
            {activeProjects.length === 0 ? (
              <div className="placeholder">
                У вас нет активных проектов. Найдите новые в разделе{' '}
                <button
                  className="link-button"
                  onClick={() => { playSFX('click.wav'); setActiveTab('search'); }}
                  style={{ cursor: 'pointer', padding: 0, margin: 0, border: 'none', background: 'none', color: 'inherit', textDecoration: 'underline' }}
                >
                  "Поиск проектов"
                </button>!
              </div>
            ) : (
              <div className="active-projects-list">
                {activeProjects.map(project => (
                  <div key={project.id} className={`active-project-item card ${project.isTeamProject ? 'team-project' : ''}`} style={{
                    position: 'relative',
                    ...(project.isTeamProject && project.shinyBorderColor ? { boxShadow: `0 6px 18px ${project.shinyBorderColor}33`, borderColor: project.shinyBorderColor } : {})
                  }}>
                    {project.isTeamProject && <div className="sparkle-layer" />}
                    
                    {/* Deadline indicator - always visible, never filtered */}
                    <div className="project-header" style={{ position: 'relative', zIndex: 10 }}>
                      {(() => {
                        const maxDays = (((project.durationWeeks || 0) * 7) + 7);
                        const remaining = Math.max(0, maxDays - (project.daysActive || 0));
                        const isDanger = remaining === 0 && (project.progress || 0) < 100;
                        return (
                          <h4>{project.name} <span className={`deadline ${isDanger ? 'danger' : remaining <= 0 ? 'overdue' : ''}`}>{remaining} дн.</span></h4>
                        );
                      })()}
                      <div className="tags">
                        <span className={`tag ${project.duration === 'long' ? 'tag-long' : 'tag-fast'}`}>{project.duration === 'long' ? 'Долгий' : 'Быстрый'}</span>
                        {project.isTeamProject && <span className="tag-team">Командный</span>}
                        {project.requiredSkill === 'Both' ? (
                          <span className={`team-style-tag both`}>Оба</span>
                        ) : (
                          <span className={`tag ${project.requiredSkill === 'F_skill' ? 'tag-female' : 'tag-male'}`}>{project.requiredSkill === 'F_skill' ? 'Женский' : 'Мужской'}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Content wrapper with grayscale filter */}
                    <div style={{
                      ...((project as any).needsFunding ? { filter: 'grayscale(100%)', opacity: 0.3 } : {})
                    }}>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                    </div>
                      <div className="trainings-count">{Math.round(project.trainingsCompleted || 0)} / {project.trainingNeeded} трен.</div>
                    
                    <div className="project-details-compact">
                      <div className="project-details-header" onClick={() => toggleProjectExpand(project.id)} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0}}>
                        <p className="small" style={{margin: 0}}><strong>Итого в неделю: {(project.baseTraining + project.extraTraining) * project.trainingCost} ₽</strong></p>
                        <span style={{fontSize: 12, fontWeight: 'bold', color: '#ff69b4', flexShrink: 0}}>{expandedProjects[project.id] ? '▼' : '▶'}</span>
                      </div>
                      {expandedProjects[project.id] && (
                        <div className="project-details">
                          <p className="small">Минимальный навык: <strong>{qualityLabel(project.minSkillRequired || 0)}</strong> (у вас: {Math.round(project.requiredSkill === 'F_skill' ? state.player.fSkill : state.player.mSkill)})</p>
                          {(project as any).minReputation > -5 && (
                            <p className="small">Минимальная репутация: <strong>{state.player.reputation >= 50 ? 'Хорошая' : state.player.reputation >= -50 ? 'Нейтральная' : 'Плохая'}</strong></p>
                          )}
                          <p className="small">Стоимость тренировки: <strong>{project.trainingCost} ₽</strong></p>
                          {(() => {
                            const reservedNow = getReservedForProject ? (getReservedForProject(project.id) || 0) : 0;
                            if (reservedNow > 0) {
                              return (
                                <p className="small" style={{color: '#ff69b4', marginTop: 4}}>В резерве: <strong>{reservedNow} ₽</strong></p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Отложено на костюм блок - вне expandedProjects */}
                    {(project.costumeSavedMoney || 0) > 0 && (
                      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: '4px', paddingLeft: '0px'}}>
                        <p className="small" style={{margin: 0, fontSize: '12px', fontWeight: 700}}>Отложено на костюм: <strong>{project.costumeSavedMoney} ₽</strong></p>
                        <button onClick={() => {
                          const reserved = getReservedForProject ? (getReservedForProject(project.id) || 0) : 0;
                          const prefill = reserved > 0 ? reserved : (project.costumeSavedMoney || 0);
                          if (returnOpen[project.id]) {
                            setReturn(project.id, false);
                          } else {
                            setDraft(project.id, prefill);
                            setReturn(project.id, true);
                          }
                        }} style={{padding: '6px 10px', fontSize: 12, borderRadius: 4, background: 'linear-gradient(135deg,#ff69b4,#ff1493)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600}}>{returnOpen[project.id] ? 'Отмена' : 'Вернуть'}</button>
                      </div>
                    )}

                    {returnOpen[project.id] && (
                      <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8}}>
                              <input
                                type="number"
                                min={0}
                                max={(project.costumeSavedMoney || 0) + (getReservedForProject ? (getReservedForProject(project.id) || 0) : 0)}
                                value={costumeDrafts[project.id] ?? 0}
                                onChange={(e) => setDraft(project.id, Math.max(0, Math.min(parseInt(e.target.value || '0') || 0, (project.costumeSavedMoney || 0) + (getReservedForProject ? (getReservedForProject(project.id) || 0) : 0))))}
                                style={{width: '70px', padding: '4px', borderRadius: 3, border: '1px solid #ccc', textAlign: 'center'}}
                              />
                        <button 
                          onClick={() => {
                            const reserved = getReservedForProject ? (getReservedForProject(project.id) || 0) : 0;
                            const maxReturn = reserved > 0 ? reserved : (project.costumeSavedMoney || 0);
                            setDraft(project.id, maxReturn);
                          }} 
                          disabled={(costumeDrafts[project.id] ?? 0) >= ((project.costumeSavedMoney || 0) + (getReservedForProject ? (getReservedForProject(project.id) || 0) : 0))}
                          style={{padding: '6px 10px', fontSize: 12, borderRadius: 4, backgroundColor: (costumeDrafts[project.id] ?? 0) >= ((project.costumeSavedMoney || 0) + (getReservedForProject ? (getReservedForProject(project.id) || 0) : 0)) ? '#999' : 'linear-gradient(135deg,#ff69b4,#ff1493)', color: '#fff', border: 'none', cursor: (costumeDrafts[project.id] ?? 0) >= ((project.costumeSavedMoney || 0) + (getReservedForProject ? (getReservedForProject(project.id) || 0) : 0)) ? 'not-allowed' : 'pointer', fontWeight: 600}}>Максимум</button>
                          <button onClick={() => {
                            const toReturn = Math.max(0, Math.floor(costumeDrafts[project.id] || 0));
                            if (toReturn <= 0) return;
                            const reserved = getReservedForProject ? (getReservedForProject(project.id) || 0) : 0;
                            const saved = (project.costumeSavedMoney || 0);
                            const total = reserved + saved;
                            
                            if (toReturn > total) return; // Can't return more than total
                            
                            let actualReturned = 0;
                            
                            // If we have reserved funds, prioritize returning those first
                            if (reserved > 0) {
                              const fromReserved = Math.min(toReturn, reserved);
                              try {
                                const refunded = releaseReservedCostume ? releaseReservedCostume(project.id, fromReserved) : 0;
                                if (refunded > 0) {
                                  actualReturned += refunded;
                                }
                              } catch (e) { /* ignore */ }
                            }
                            
                            // Return remaining from costumeSavedMoney by reducing it
                            // The delta logic in GameContext will automatically refund the money
                            const fromSaved = Math.min(toReturn - actualReturned, saved);
                            if (fromSaved > 0) {
                              const newSavedMoney = Math.max(0, saved - fromSaved);
                              // Update costumeSavedMoney - delta logic will handle refund
                              updateActiveProject(project.id, { costumeSavedMoney: newSavedMoney });
                              actualReturned += fromSaved;
                            }
                            
                            if (actualReturned > 0) {
                              clearDraft(project.id);
                              setReturn(project.id, false);
                              playSFX('coin.wav');
                            }
                          }} style={{padding: '6px 10px', fontSize: 12, borderRadius: 4, background: 'linear-gradient(135deg,#ff69b4,#ff1493)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer'}}>Вернуть</button>
                        </div>
                    )}

                    {project.costumeCost > 0 && ((project.costumeSavedMoney || 0) < project.costumeCost) && (
                      <div className="costume-save-section" style={{marginTop: '8px', marginBottom: '8px', borderRadius: '4px'}}>
                        <label style={{fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px'}}>Отложить на костюм:</label>
                        <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                            <button className="btn-inc-training" onClick={() => {
                              const cur = costumeDrafts[project.id] ?? 0;
                              const next = Math.max(0, cur - 50);
                              const remaining = project.costumeCost - (project.costumeSavedMoney || 0);
                              setDraft(project.id, Math.min(next, remaining));
                            }} style={{padding: '4px 6px', fontSize: '11px'}}>−</button>
                            <input 
                              type="number"
                              min="0"
                              max={project.costumeCost - (project.costumeSavedMoney || 0)}
                              placeholder="0"
                              onChange={(e) => {
                                const remaining = project.costumeCost - (project.costumeSavedMoney || 0);
                                const val = Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0));
                                setDraft(project.id, val);
                              }}
                              value={costumeDrafts[project.id] ?? 0}
                              style={{width: '50px', padding: '4px 4px', borderRadius: '3px', border: '1px solid #ccc', fontSize: '11px', textAlign: 'center'}}
                            />
                            <span style={{fontSize: '11px', color: '#666'}}>/ {project.costumeCost - (project.costumeSavedMoney || 0)}</span>
                            <button className="btn-inc-training" onClick={() => {
                              const cur = costumeDrafts[project.id] ?? 0;
                              const remaining = project.costumeCost - (project.costumeSavedMoney || 0);
                              const next = Math.min(remaining, cur + 50);
                              setDraft(project.id, next);
                            }} style={{padding: '4px 6px', fontSize: '11px'}}>+</button>
                            <button
                              onClick={() => {
                                const remaining = project.costumeCost - (project.costumeSavedMoney || 0);
                                const maxInput = Math.min(remaining, state.player.money || 0);
                                setDraft(project.id, maxInput);
                              }}
                              disabled={(costumeDrafts[project.id] ?? 0) >= Math.min(project.costumeCost - (project.costumeSavedMoney || 0), state.player.money || 0)}
                              style={{
                                padding: '4px 6px',
                                fontSize: '10px',
                                borderRadius: 3,
                                background: (costumeDrafts[project.id] ?? 0) >= Math.min(project.costumeCost - (project.costumeSavedMoney || 0), state.player.money || 0) ? '#999' : 'linear-gradient(135deg,#ff69b4,#ff1493)',
                                color: '#fff',
                                border: 'none',
                                cursor: (costumeDrafts[project.id] ?? 0) >= Math.min(project.costumeCost - (project.costumeSavedMoney || 0), state.player.money || 0) ? 'not-allowed' : 'pointer',
                                marginLeft: '2px',
                                opacity: (costumeDrafts[project.id] ?? 0) >= Math.min(project.costumeCost - (project.costumeSavedMoney || 0), state.player.money || 0) ? 0.6 : 1,
                                fontWeight: 600
                              }}
                            >
                              Максимум
                            </button>
                            <button onClick={() => {
                              const draft = costumeDrafts[project.id] ?? 0;
                              if (draft <= 0) return;
                              // Use reserveCostumeForProject to deduct money and reserve
                              // This will immediately deduct from player.money
                              if (reserveCostumeForProject && reserveCostumeForProject(project.id, draft)) {
                                // Then set costumeSavedMoney without triggering delta logic
                                // We already deducted the money via reserveCostumeForProject
                                updateActiveProject(project.id, { costumeSavedMoney: Math.min(project.costumeCost, draft) });
                                clearDraft(project.id);
                                playSFX('click.wav');
                              } else {
                                try { showEventIfIdle && showEventIfIdle({ id: `costume_save_fail_${Date.now()}`, type: 'bad', title: 'Ошибка', text: 'Не удалось отложить деньги на костюм.' }); } catch (e) { /* ignore */ }
                              }
                            }} style={{padding: '4px 6px', fontSize: '10px', borderRadius: 3, marginLeft: '6px', background: 'linear-gradient(135deg,#ff69b4,#ff1493)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600}}>Отложить</button>
                          </div>
                      </div>
                    )}

                    <div className="controls-section" style={{marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px'}}>
                        <label style={{fontSize: '12px', fontWeight: 'bold', margin: 0}}>Тренировки в неделю</label>
                        <div className="controls" style={{gap: '4px'}}>
                          <button className="btn-dec-training" onClick={() => updateActiveProject(project.id, { baseTraining: Math.max(0, project.baseTraining - 1) })}>−</button>
                          <span>{project.baseTraining}/3</span>
                          <button className="btn-inc-training" onClick={() => updateActiveProject(project.id, { baseTraining: Math.min(3, project.baseTraining + 1) })}>+</button>
                        </div>
                      </div>

                      {project.baseTraining >= 3 && (
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
                          <label style={{fontSize: '12px', fontWeight: 'bold', color: '#fff', margin: 0, whiteSpace: 'nowrap'}}>Дополнительные тренировки</label>
                          <div className="controls" style={{gap: '4px'}}>
                            <button className="btn-dec-training" onClick={() => updateActiveProject(project.id, { extraTraining: Math.max(0, project.extraTraining - 1) })}>−</button>
                            <span>{project.extraTraining}</span>
                            <button className="btn-inc-training" onClick={() => {
                              const activeCount = activeProjects.length;
                              const cap = activeCount === 1 ? 7 : activeCount === 2 ? 5 : activeCount === 3 ? 3 : activeCount === 4 ? 1 : 0;
                              const totalExtra = activeProjects.reduce((s, pr) => s + (pr.extraTraining || 0), 0);
                              if (totalExtra < cap) {
                                updateActiveProject(project.id, { extraTraining: Math.min(7, (project.extraTraining || 0) + 1) });
                              }
                            }}>+</button>
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                    {/* End of content wrapper with grayscale filter */}

                    {/* Funding Button and action buttons - above grayscale filter, always colored */}
                    {(project as any).needsFunding && (
                      <div style={{
                        position: 'absolute',
                        top: '60%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        alignItems: 'stretch',
                        width: '90%'
                      }}>
                        {/* Finance training button - pink if enough money, gray if not */}
                        <button
                          className="fund-training-btn"
                          onClick={() => { fundProjectTraining && fundProjectTraining(project.id); playSFX('click.wav'); }}
                          disabled={(state.player.money || 0) < (project.trainingCost || 1)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: 4,
                            background: (state.player.money || 0) >= (project.trainingCost || 1)
                              ? 'linear-gradient(135deg, #ff69b4, #ff1493)'
                              : 'rgb(80,80,80)',
                            color: '#fff',
                            opacity: 1,
                            cursor: (state.player.money || 0) >= (project.trainingCost || 1) ? 'pointer' : 'not-allowed',
                            fontWeight: 700,
                            border: 'none',
                            fontSize: 13
                          }}
                        >
                          💰 Оплатить тренировку
                        </button>
                        
                        {/* Return costume savings button - shown when project is blocked and there are savings */}
                        {(project.costumeSavedMoney || 0) > 0 && (
                          <button
                            onClick={() => {
                              const savedAmount = project.costumeSavedMoney || 0;
                              if (savedAmount > 0) {
                                // Directly refund the saved costume money to player
                                addPlayerMoney && addPlayerMoney(savedAmount);
                                // Reset costumeSavedMoney to 0
                                updateActiveProject(project.id, { costumeSavedMoney: 0 });
                                playSFX('coin.wav');
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 8px',
                              borderRadius: 4,
                              background: 'linear-gradient(135deg, #ff69b4, #ff1493)',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: 13
                            }}
                          >
                            Вернуть отложенные деньги ({project.costumeSavedMoney} ₽)
                          </button>
                        )}

                        {/* Leave project button - always pink, always visible in overlay */}
                        <button 
                          onClick={() => { 
                            playSFX('click.wav');
                            showEventIfIdle && showEventIfIdle({
                              id: `leave_project_confirm_${Date.now()}`,
                              type: 'choice',
                              title: 'Вы уверены?',
                              text: `Вы хотите покинуть проект "${project.name}"?`,
                              choices: [
                                { text: 'Отмена', effect: {} },
                                { text: 'Да, покинуть', effect: { leave: project.id } }
                              ]
                            });
                          }}
                          style={{width: '100%', padding: '8px', borderRadius: 4, background: 'linear-gradient(135deg, #ef4444, #991b1b)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13}}
                        >
                          Покинуть проект
                        </button>
                      </div>
                    )}

                    {/* Leave project button when project doesn't need funding */}
                    {!(project as any).needsFunding && (
                      <button 
                        onClick={() => { 
                          playSFX('click.wav');
                          showEventIfIdle && showEventIfIdle({
                            id: `leave_project_confirm_${Date.now()}`,
                            type: 'choice',
                            title: 'Вы уверены?',
                            text: `Вы хотите покинуть проект "${project.name}"?`,
                            choices: [
                              { text: 'Отмена', effect: {} },
                              { text: 'Да, покинуть', effect: { leave: project.id } }
                            ]
                          });
                        }}
                        style={{width: '100%', padding: '8px', borderRadius: 4, background: 'linear-gradient(135deg, #ef4444, #991b1b)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: '12px'}}
                      >
                        Покинуть проект
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="tab-pane">
            <div className="project-filters project-filters-search">
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Уровень</label>
                  <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value as any)}>
                    <option value="any">Все</option>
                    <option value="Новичок">Новичок</option>
                    <option value="Мидл">Мидл</option>
                    <option value="Топ">Топ</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Стиль</label>
                  <select value={styleFilter} onChange={(e) => setStyleFilter(e.target.value as any)}>
                    <option value="any">Все</option>
                    <option value="F_style">Женский</option>
                    <option value="M_style">Мужской</option>
                    <option value="Both">Оба</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Длительность</label>
                  <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value as any)}>
                    <option value="any">Все</option>
                    <option value="fast">Быстрый</option>
                    <option value="long">Долгий</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Сортировка</label>
                  <select value={sortOption} onChange={(e) => setSortOption(e.target.value as any)}>
                    <option value="none">По умолчанию</option>
                    <option value="skillAsc">Мин. навык ↑</option>
                    <option value="skillDesc">Мин. навык ↓</option>
                    <option value="costAsc">Цена/трен ↑</option>
                    <option value="costDesc">Цена/трен ↓</option>
                  </select>
                </div>
              </div>
              {(skillFilter !== 'any' || styleFilter !== 'any' || durationFilter !== 'any' || sortOption !== 'none') && (
                <button className="reset-filters-btn" onClick={() => {
                  setSkillFilter('any'); setStyleFilter('any'); setDurationFilter('any'); setSortOption('none'); playSFX('click.wav');
                }}>✕ Сбросить</button>
              )}
            </div>

            <div className="projects-grid">
              {filteredProjects.map(project => (
                <div key={project.id} className={`project-card card ${project.isTeamProject ? 'team-project' : ''}`} style={project.isTeamProject && project.shinyBorderColor ? { boxShadow: `0 8px 20px ${project.shinyBorderColor}33`, borderColor: project.shinyBorderColor } : undefined}>
                  {project.isTeamProject && <div className="sparkle-layer" />}
                  <div className="project-head">
                    <h4>{project.name}</h4>
                    <div className="tags">
                      <span className={`tag ${project.duration === 'long' ? 'tag-long' : 'tag-fast'}`}>{project.duration === 'long' ? 'Долгий' : 'Быстрый'}</span>
                      {project.isTeamProject && <span className="tag-team">Командный</span>}
                      {project.requiredSkill === 'Both' ? (
                        <span className={`team-style-tag both`}>Оба</span>
                      ) : (
                        <span className={`tag ${project.requiredSkill === 'F_skill' ? 'tag-female' : 'tag-male'}`}>{project.requiredSkill === 'F_skill' ? 'Женский' : 'Мужской'}</span>
                      )}
                    </div>
                  </div>
                    <div className="project-info">
                    <p><strong>Минимум навыка:</strong> {qualityLabel(project.minSkillRequired || 0)}</p>
                    <p><strong>Тренировок:</strong> {project.trainingNeeded}</p>
                    <p><strong>Длительность:</strong> {project.durationWeeks} нед.</p>
                    <p><strong>Стоимость/тренировка:</strong> {project.trainingCost} ₽</p>
                  </div>
                  <button
                    className="btn-accept"
                    onClick={() => { setSelectedProject(project); setShowModal(true); playSFX('click.wav'); }}
                  >
                    Принять проект
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'active' && (
          <div className="tab-pane">
            <div style={{display:'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12}}>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                <h2 style={{margin: 0}}>Ваши завершённые каверы</h2>
                <div style={{display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap'}}>
                  <div style={{fontSize: 13, color: '#ff69b4'}}>Всего: <strong>{(completedProjects || []).length}</strong></div>
                  <div style={{fontSize: 13, color: '#22c55e'}}>Успешно: <strong>{(completedProjects || []).filter(p => (p as any).success).length}</strong></div>
                  <div style={{fontSize: 13, color: '#dc2626'}}>Сорвано: <strong>{(completedProjects || []).filter(p => !(p as any).success && (p as any).failedDueToDeadline).length}</strong></div>
                  <div style={{fontSize: 13, color: '#999'}}>Отменено: <strong>{(completedProjects || []).filter(p => (p as any).cancelledByEvent).length}</strong></div>
                  <div style={{fontSize: 13, color: '#d4af37'}}>Командные: <strong>{(completedProjects || []).filter(p => (p as any).isTeamProject).length}</strong></div>
                  <div style={{fontSize: 13, color: '#d8b4fe'}}>Коллаб: <strong>{(completedProjects || []).filter(p => (p as any).isCollabProject).length}</strong></div>
                </div>
              </div>
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: (() => {
                  const total = (completedProjects || []).length;
                  if (total === 0) return state?.theme === 'dark' ? '#444444' : '#e5e5e5';
                  const succ = (completedProjects || []).filter(p => (p as any).success).length;
                  const failed = (completedProjects || []).filter(p => !(p as any).success && (p as any).failedDueToDeadline).length;
                  const cancelled = (completedProjects || []).filter(p => (p as any).cancelledByEvent).length;
                  const team = (completedProjects || []).filter(p => (p as any).isTeamProject).length;
                  const collab = (completedProjects || []).filter(p => (p as any).isCollabProject).length;
                  const other = Math.max(0, total - succ - failed - cancelled - team - collab);

                  const succPct = (succ / total) * 100;
                  const failedPct = (failed / total) * 100;
                  const cancelledPct = (cancelled / total) * 100;
                  const teamPct = (team / total) * 100;
                  const collabPct = (collab / total) * 100;
                  const otherPct = (other / total) * 100;

                  let pos = 0;
                  const stops: string[] = [];
                  if (succPct > 0) { stops.push(`#22c55e ${pos}% ${pos + succPct}%`); pos += succPct; }
                  if (failedPct > 0) { stops.push(`#dc2626 ${pos}% ${pos + failedPct}%`); pos += failedPct; }
                  if (cancelledPct > 0) { stops.push(`#999 ${pos}% ${pos + cancelledPct}%`); pos += cancelledPct; }
                  if (teamPct > 0) { stops.push(`#d4af37 ${pos}% ${pos + teamPct}%`); pos += teamPct; }
                  if (collabPct > 0) { stops.push(`#d8b4fe ${pos}% ${pos + collabPct}%`); pos += collabPct; }
                  if (otherPct > 0) { stops.push(`#cccccc ${pos}% 100%`); }

                  return `conic-gradient(${stops.join(', ')})`;
                })(),
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                flexShrink: 0
              }}></div>
            </div>
            <div className="project-filters project-filters-ratings">
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Статус</label>
                  <select className="small-sort-select smaller" value={completionFilter} onChange={(e) => setCompletionFilter(e.target.value as any)}>
                    <option value="all">Все</option>
                    <option value="success">Успешные</option>
                    <option value="failed">Сорванные</option>
                    <option value="cancelled">Отменённые</option>
                    <option value="team">Только командные</option>
                  </select>
                </div>
              </div>
            </div>
            {(!completedProjects || completedProjects.length === 0) ? (
              <div className="placeholder">
                У вас ещё нет завершённых каверов.
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px', height: '100%'}}>
                {/* Horizontal Scrolling Completed Projects */}
                <div className="completed-list" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', overflowY: 'auto', maxHeight: 'calc(100vh - 300px)', paddingRight: '8px'}}>
                  {(completedProjects || [])
                    .filter((proj: any) => {
                      if (completionFilter === 'all') return true;
                      if (completionFilter === 'success') return !!(proj as any).success;
                      if (completionFilter === 'failed') return !(proj as any).success && !!(proj as any).failedDueToDeadline;
                      if (completionFilter === 'cancelled') return !!(proj as any).cancelledByEvent;
                      if (completionFilter === 'team') return !!(proj as any).isTeamProject;
                      return true;
                    })
                    .map((project: any) => {
                      const isFailed = !(project as any).success;
                      const failedDueToDeadline = (project as any).failedDueToDeadline;
                      const isCancelled = (project as any).cancelledByEvent;
                      const isTeamProject = (project as any).isTeamProject;
                      const isCollabProject = (project as any).isCollabProject;
                      
                      // Determine status badge
                      let statusLabel = '';
                      let statusColor = '#22c55e';
                      if (isFailed && failedDueToDeadline) {
                        statusLabel = 'Сорван';
                        statusColor = '#dc2626';
                      } else if (isFailed && isCancelled) {
                        statusLabel = 'Отменён';
                        statusColor = '#999';
                      } else if (isFailed) {
                        statusLabel = 'Провалено';
                        statusColor = '#ef4444';
                      } else {
                        statusLabel = 'Выпущен';
                        statusColor = '#22c55e';
                      }
                      
                      // Get collaborator/team info
                      const collabNpc = isCollabProject && project.npcId ? npcs.find((n: any) => n.id === project.npcId) : null;
                      const teamName = isTeamProject ? project.name.split(' — ')[0] : null;

                      return (
                        <div key={project.id} className="card" style={{
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '220px',
                          borderRadius: '8px',
                          padding: '12px',
                          background: isFailed ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(50, 30, 40, 0.6))' : 'linear-gradient(135deg, rgba(20, 30, 60, 0.8), rgba(30, 40, 70, 0.6))',
                          borderLeft: `3px solid ${statusColor}`,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                        }}>
                          {/* Project Name */}
                          <h4 style={{margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                            {project.name}
                          </h4>
                          
                          {/* Status Badge */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: statusColor,
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 700,
                            width: 'fit-content',
                            marginBottom: '8px'
                          }}>
                            {statusLabel}
                          </div>

                          {/* Tags */}
                          <div style={{display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap'}}>
                            {isTeamProject && (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                background: 'rgba(212, 175, 55, 0.2)',
                                color: '#d4af37',
                                fontWeight: 600
                              }}>
                                🎭 Командный
                              </span>
                            )}
                            {isCollabProject && collabNpc && (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                background: 'rgba(216, 180, 254, 0.2)',
                                color: '#d8b4fe',
                                fontWeight: 600
                              }}>
                                👥 Коллаб: {collabNpc.name}
                              </span>
                            )}
                          </div>

                          {/* Project Stats */}
                          <div style={{fontSize: '11px', color: '#aaa', marginBottom: '8px', flex: 1}}>
                            <div style={{marginBottom: '4px'}}>
                              <strong style={{color: '#ff69b4'}}>Тренировок:</strong> {Math.round(project.trainingsCompleted || 0)} / {project.trainingNeeded}
                            </div>
                            {!isFailed && (
                              <div style={{marginBottom: '8px'}}>
                                <strong style={{color: '#22c55e'}}>👍</strong> {(project as any).likes || 0}&nbsp;&nbsp;
                                <strong style={{color: '#ef4444'}}>👎</strong> {(project as any).dislikes || 0}
                              </div>
                            )}

                            {/* Comments section */}
                            {!isFailed && Array.isArray((project as any).comments) && (project as any).comments.length > 0 && (
                              <div style={{marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)'}}>
                                <div style={{fontSize: '10px', fontWeight: 600, marginBottom: '6px', color: '#e0e0e0'}}>Комментарии:</div>
                                {(() => {
                                  const comments = (project as any).comments as any[];
                                  const likes = (project as any).likes || 0;
                                  const dislikes = (project as any).dislikes || 0;
                                  const totalReactions = likes + dislikes;
                                  
                                  let sortedComments = [...comments];
                                  if (totalReactions > 0) {
                                    const positiveRatio = likes / totalReactions;
                                    const positiveCount = Math.round(comments.length * positiveRatio);
                                    const positiveComments = comments.filter(c => c.positive);
                                    const negativeComments = comments.filter(c => !c.positive);
                                    
                                    sortedComments = [
                                      ...positiveComments.slice(0, Math.max(1, positiveCount)),
                                      ...negativeComments.slice(0, Math.max(1, comments.length - positiveCount))
                                    ];
                                  }
                                  
                                  return (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                      {sortedComments.slice(0, 3).map((c, i) => (
                                        <div
                                          key={i}
                                          style={{
                                            fontSize: '9px',
                                            padding: '4px 6px',
                                            borderRadius: '4px',
                                            background: c.positive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: c.positive ? '#86efac' : '#fca5a5',
                                            border: `1px solid ${c.positive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                            lineHeight: '1.2'
                                          }}
                                        >
                                          {c.text}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Type Badge */}
                          <div style={{fontSize: '10px', color: '#888', marginTop: 'auto'}}>
                            {project.duration === 'long' ? 'Долгий проект' : 'Быстрый проект'}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ratings' && (
          <div className="tab-pane">
            <RatingsTab />
          </div>
        )}
        {activeTab === 'shop' && (
          <div className="tab-pane">
            <Shop />
          </div>
        )}
      </div>

      {/* Project acceptance modal */}
      {showModal && selectedProject && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setSelectedProject(null); setAcceptanceBaseTraining(0); setAcceptanceCostumeSave(0); }}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedProject.name}</h3>
              <button className="close" onClick={() => { playSFX('close.wav'); setShowModal(false); setSelectedProject(null); setAcceptanceBaseTraining(0); setAcceptanceCostumeSave(0); }}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Длительность:</strong> {selectedProject.durationWeeks} нед.</p>
              <p><strong>Минимальный навык:</strong> {qualityLabel(selectedProject.minSkillRequired || 0)}</p>
              {((selectedProject as any).minReputation > -5) && state.player.reputation < (selectedProject as any).minReputation && (
                <p className="warning"><strong style={{color: '#dc2626'}}>⚠️ Высокий риск отказа из-за низкой репутации!</strong></p>
              )}
              <p><strong>Стоимость тренировки:</strong> {selectedProject.trainingCost} ₽</p>
              <p className="highlight">Нужно тренировок: {selectedProject.trainingNeeded}</p>

              <hr style={{margin: '12px 0', opacity: 0.3}} />

              <div className="acceptance-controls">
                <div className="control-section">
                  <label><strong>Тренировки в неделю:</strong></label>
                  <div className="training-input" style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px'}}>
                    <button className="btn-inc-training" onClick={() => setAcceptanceBaseTraining(Math.max(0, acceptanceBaseTraining - 1))}>−</button>
                    <span style={{minWidth: '30px', textAlign: 'center', fontWeight: 'bold'}}>{acceptanceBaseTraining}</span>
                    <button className="btn-inc-training" onClick={() => setAcceptanceBaseTraining(Math.min(3, acceptanceBaseTraining + 1))}>+</button>
                  </div>
                  <p style={{fontSize: '12px', color: '#999', marginTop: '4px'}}>Стоимость в неделю: {acceptanceBaseTraining * selectedProject.trainingCost} ₽</p>
                </div>

                <div className="control-section" style={{marginTop: '12px'}}>
                  <label><strong>Отложить деньги на костюм:</strong></label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap'}}>
                    <button className="btn-inc-training" onClick={() => setAcceptanceCostumeSave(Math.max(0, acceptanceCostumeSave - 100))}>−</button>
                    <input
                      type="number"
                      min="0"
                      max={Math.min(selectedProject.costumeCost, state.player.money || 0)}
                      value={acceptanceCostumeSave}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        const maxAllowed = Math.min(selectedProject.costumeCost, state.player.money || 0);
                        setAcceptanceCostumeSave(Math.min(maxAllowed, val));
                      }}
                      style={{width: '50px', padding: '6px', borderRadius: 4, border: '1px solid #ccc', textAlign: 'center', fontSize: '12px', flexShrink: 0}}
                    />
                    <span style={{fontSize: '12px', color: '#666', whiteSpace: 'nowrap'}}>/ {selectedProject.costumeCost} ₽</span>
                    <button className="btn-inc-training" onClick={() => setAcceptanceCostumeSave(Math.min(selectedProject.costumeCost, acceptanceCostumeSave + 100))}>+</button>
                    <button
                      onClick={() => setAcceptanceCostumeSave(Math.min(selectedProject.costumeCost, state.player.money || 0))} disabled={acceptanceCostumeSave >= Math.min(selectedProject.costumeCost, state.player.money || 0)} style={{padding: '6px 8px', fontSize: 12, borderRadius: 4, background: 'linear-gradient(135deg,#ff69b4,#ff1493)', color: '#fff', border: 'none', cursor: acceptanceCostumeSave >= Math.min(selectedProject.costumeCost, state.player.money || 0) ? 'not-allowed' : 'pointer', opacity: acceptanceCostumeSave >= Math.min(selectedProject.costumeCost, state.player.money || 0) ? 0.5 : 1, whiteSpace: 'nowrap'}}>Максимум</button>
                    <button onClick={() => {
                      if (!reserveCostumeForProject) return;
                      const ok = reserveCostumeForProject(selectedProject.id, acceptanceCostumeSave);
                      if (!ok) {
                        playSFX('error.wav');
                        try { showEventIfIdle && showEventIfIdle({ id: `reserve_fail_${Date.now()}`, type: 'bad', title: 'Ошибка', text: 'Не удалось отложить указанную сумму.' }); } catch (e) { /* ignore */ }
                      } else {
                        playSFX('click.wav');
                      }
                    }} disabled={acceptanceCostumeSave <= 0} style={{padding: '6px 8px', fontSize: 12, borderRadius: 4, background: 'linear-gradient(135deg,#ff69b4,#ff1493)', color: '#fff', border: 'none', cursor: acceptanceCostumeSave <= 0 ? 'not-allowed' : 'pointer', opacity: acceptanceCostumeSave <= 0 ? 0.5 : 1, whiteSpace: 'nowrap'}}>Отложить</button>
                  </div>
                  {(getReservedForProject && (getReservedForProject(selectedProject.id) || 0) > 0) && (
                    <div style={{marginTop: 8}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <div style={{fontSize: 13}}>Отложено: <strong>{getReservedForProject(selectedProject.id)} ₽</strong></div>
                        <button onClick={() => {
                          const reserved = getReservedForProject ? (getReservedForProject(selectedProject.id) || 0) : 0;
                          setDraft(selectedProject.id, reserved);
                          setReturn(selectedProject.id, true);
                        }} style={{padding: '6px 8px', fontSize: 12, borderRadius: 4, background: 'linear-gradient(135deg,#ff69b4,#ff1493)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600}}>{returnOpen[selectedProject.id] ? 'Отмена' : 'Вернуть'}</button>
                      </div>
                      {returnOpen[selectedProject.id] && (
                        <div style={{display: 'flex', gap: 8, alignItems: 'center', marginTop: 8}}>
                          <input type="number" value={costumeDrafts[selectedProject.id] ?? 0} onChange={(e) => setDraft(selectedProject.id, Math.max(0, Math.min(parseInt(e.target.value || '0') || 0, getReservedForProject ? (getReservedForProject(selectedProject.id) || 0) : 0)))} style={{width: '80px', padding: '6px', borderRadius: 4, border: '1px solid #ccc', textAlign: 'center'}} />
                          <button 
                            onClick={() => { const reserved = getReservedForProject ? (getReservedForProject(selectedProject.id) || 0) : 0; setDraft(selectedProject.id, reserved); }} 
                            disabled={(costumeDrafts[selectedProject.id] ?? 0) >= (getReservedForProject ? (getReservedForProject(selectedProject.id) || 0) : 0)}
                            style={{padding: '6px 8px', fontSize: 12, borderRadius: 4, backgroundColor: (costumeDrafts[selectedProject.id] ?? 0) >= (getReservedForProject ? (getReservedForProject(selectedProject.id) || 0) : 0) ? '#999' : 'linear-gradient(135deg,#ff69b4,#ff1493)', color: '#fff', border: 'none', cursor: (costumeDrafts[selectedProject.id] ?? 0) >= (getReservedForProject ? (getReservedForProject(selectedProject.id) || 0) : 0) ? 'not-allowed' : 'pointer', fontWeight: 600}}>Максимум</button>
                          <button onClick={() => {
                            const toReturn = Math.max(0, Math.floor(costumeDrafts[selectedProject.id] || 0));
                            if (toReturn <= 0) return;
                            try { const refunded = releaseReservedCostume ? releaseReservedCostume(selectedProject.id, toReturn) : 0; if (refunded > 0) playSFX('coin.wav'); } catch (e) { /* ignore */ }
                            clearDraft(selectedProject.id);
                            setReturn(selectedProject.id, false);
                          }} disabled={!costumeDrafts[selectedProject.id] || costumeDrafts[selectedProject.id] <= 0} style={{padding: '6px 8px', fontSize: 12, borderRadius: 4, background: 'linear-gradient(135deg,#ff69b4,#ff1493)', color: '#fff', border: 'none', cursor: !costumeDrafts[selectedProject.id] || costumeDrafts[selectedProject.id] <= 0 ? 'not-allowed' : 'pointer', opacity: !costumeDrafts[selectedProject.id] || costumeDrafts[selectedProject.id] <= 0 ? 0.5 : 1, fontWeight: 600}}>Вернуть</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => { playSFX('click.wav'); setShowModal(false); setSelectedProject(null); setAcceptanceBaseTraining(0); setAcceptanceCostumeSave(0); }} style={{padding: '6px 12px', fontSize: 12, borderRadius: 4, backgroundColor: 'rgba(255,105,180,0.08)', color: '#fff', border: '1px solid rgba(255,105,180,0.3)', cursor: 'pointer', fontWeight: 600}}>Отмена</button>
              <button className="btn-confirm" onClick={() => {
                const playerMoney = state.player.money || 0;
                const reservedNow = getReservedForProject ? (getReservedForProject(selectedProject.id) || 0) : 0;
                if (acceptanceCostumeSave > playerMoney && reservedNow === 0) {
                  const newVal = Math.min(selectedProject.costumeCost, playerMoney);
                  setAcceptanceCostumeSave(newVal);
                  playSFX('error.wav');
                  return;
                }
                acceptProject(selectedProject.id, {
                  baseTraining: acceptanceBaseTraining,
                  costumeSavedMoney: acceptanceCostumeSave
                });
                playSFX('click.wav');
                setShowModal(false);
                setSelectedProject(null);
                setAcceptanceBaseTraining(0);
                setAcceptanceCostumeSave(0);
              }} style={{padding: '6px 12px', fontSize: 12, borderRadius: 4, backgroundColor: 'linear-gradient(135deg,#ff69b4,#ff1493)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600}}>Принять проект</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainTabs;
