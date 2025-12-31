import React, { useState, useEffect } from 'react';
import { ShoppingBasket } from 'lucide-react';
import './CartButton.css';
import { useGame } from '../context/GameContext';

interface CartItem {
  id: string;
  key: string;
  name: string;
  price: number;
  quantity: number;
  img?: string;
}

const CartButton: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const { setModalPause } = useGame();

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

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (key: string, name: string, price: number, img?: string) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.key === key);
      if (existing) {
        // Allow quantity increase for tonics and gifts (stackable items)
        if (key === 'tonic' || key.startsWith('gift_')) {
          return prev.map(item =>
            item.key === key ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          // For unique items, don't add duplicates
          return prev;
        }
      }
      return [...prev, { id: `cart_${Date.now()}`, key, name, price, quantity: 1, img }];
    });
  };

  // Listen for global add-to-cart events from other components (Shop)
  React.useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as any;
        if (detail && detail.key) {
          addToCart(detail.key, detail.name || detail.key, detail.price || 0, detail.img);
          // Do not auto-open cart modal on add; user opens it via the cart button
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('add-to-cart', handler as EventListener);
    return () => window.removeEventListener('add-to-cart', handler as EventListener);
  }, []);

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCartItems(prev =>
        prev.map(item => item.id === id ? { ...item, quantity } : item)
      );
    }
  };

  const handleCheckout = () => {
    // Here we would normally process the payment
    try {
      const audio = new Audio('/buy.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
    alert(`Спасибо за покупку!\nСумма: ${totalPrice} ₽`);
    setCartItems([]);
    setOpen(false);
  };

  return (
    <div className="cart-root" style={{display:'flex', alignItems:'center', gap:8}}>
      {/* Inline total left of cart button */}
      {totalPrice > 0 && (
        <div className="cart-inline-total" aria-hidden style={{fontWeight:700, color:'#ff69b4'}}>{totalPrice} ₽</div>
      )}

      <button 
        className="messenger-toggle compact cart-highlight" 
        onClick={() => setOpen(v => !v)} 
        aria-label="Shopping Cart"
        title="Корзина"
      >
        <ShoppingBasket size={18} />
      </button>

      {open && (
        <div className="cart-modal-overlay">
          <div className="cart-modal">
            <div className="cart-header">
              <div className="title">Корзина покупок</div>
              <button onClick={() => setOpen(false)} className="btn-close">✕</button>
            </div>
            <div className="cart-body">
              {cartItems.length === 0 && <div className="muted">Корзина пуста</div>}
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-icon-placeholder">
                    {item.img ? (
                      <img 
                        src={item.img} 
                        alt={item.name}
                        style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px'}}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      item.name.substring(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">{item.price} ₽</div>
                  </div>
                  <div className="item-controls">
                    {item.key === 'tonic' || item.key.startsWith('gift_') ? (
                      <>
                        <button 
                          className="btn-qty" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button 
                          className="btn-qty" 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <span className="qty-display">1</span>
                    )}
                  </div>
                  <div className="item-total">{item.price * item.quantity} ₽</div>
                  <button 
                    className="btn-remove" 
                    onClick={() => removeFromCart(item.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {cartItems.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <div className="total-label">Итого:</div>
                  <div className="total-price">{totalPrice} ₽</div>
                </div>
                <button className="btn-checkout" onClick={handleCheckout}>
                  Оплатить
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CartButton;
