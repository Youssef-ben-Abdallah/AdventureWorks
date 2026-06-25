import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, CartItem } from '../../context/CartContext';
import { OrdersService } from '../../services/orders';
import './Cart.css';

export const Cart = () => {
  const { items, count, total, setQty, remove, clear } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const customerID = 1;
  const billToAddressID = 1;
  const shipToAddressID = 1;
  const shipMethodID = 1;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError('');

    const payload = {
      items: items.map((i: CartItem) => ({ productId: i.product.id, qty: i.qty })),
      customerID,
      billToAddressID,
      shipToAddressID,
      shipMethodID
    };
    
    try {
      await OrdersService.createOrder(payload);
      clear();
      navigate('/orders');
    } catch (e: any) {
      setError(e?.response?.data || e?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="aw-page-header with-inner">
        <div className="aw-page-header-inner">
          <div>
            <div className="aw-badge" style={{ marginBottom: '0.5rem' }}>
              <span className="material-icons" style={{ fontSize: '12px' }}>shopping_cart</span>
              Your Cart
            </div>
            <h1 className="cart-title">Cart</h1>
            <p className="cart-subtitle">Review your items and checkout.</p>
          </div>
          <button className="btn-danger" onClick={clear} disabled={items.length === 0}>
            <span className="material-icons" style={{ fontSize: '16px', marginRight: '4px', verticalAlign: 'middle' }}>delete_sweep</span>
            <span style={{ verticalAlign: 'middle' }}>Clear</span>
          </button>
        </div>
      </div>
      <div className="neon-divider"></div>

      {error && <div className="error" style={{ margin: '1.5rem clamp(1rem, 4vw, 3rem)' }}>{error}</div>}

      {items.length === 0 ? (
        <div className="glass" style={{ padding: '2rem', margin: '0 clamp(1rem, 4vw, 3rem)', borderRadius: '16px', textAlign: 'center' }}>
          <span className="material-icons" style={{ fontSize: '48px', width: '48px', height: '48px', color: 'var(--text-muted)', marginBottom: '1rem' }}>shopping_cart</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Your cart is empty.</div>
          <div style={{ marginTop: '1.5rem' }}>
            <Link className="btn-primary-glow" to="/products">Browse products</Link>
          </div>
        </div>
      ) : (
        <div className="cart-grid aw-page-content">
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            {items.map((i: CartItem) => {
              return (
                <div key={i.product.id} className="item cart-item">
                  <div className="info">
                    <div className="name">{i.product.name}</div>
                    <div className="small text-muted">{i.product.categoryName} / {i.product.subCategoryName}</div>
                    <div className="price text-glow-cyan">${i.product.price.toFixed(2)}</div>
                  </div>
                  <div className="qty">
                    <button className="qty-btn" onClick={() => setQty(i.product.id, i.qty - 1)} disabled={i.qty <= 1}>
                      <span className="material-icons">remove</span>
                    </button>
                    <input 
                      className="aw-input qty-input" 
                      type="number" 
                      value={i.qty} 
                      onChange={(e) => setQty(i.product.id, Number(e.target.value))} 
                      min="1" 
                    />
                    <button className="qty-btn" onClick={() => setQty(i.product.id, i.qty + 1)}>
                      <span className="material-icons">add</span>
                    </button>
                  </div>
                  <div className="lineTotal">${(i.qty * i.product.price).toFixed(2)}</div>
                  <button className="btn-danger-icon" onClick={() => remove(i.product.id)}>
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="glass summary" style={{ padding: '1.5rem', borderRadius: '16px', alignSelf: 'start' }}>
            <div className="sum-title" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Order Summary</div>
            <div className="sumRow text-muted"><span>Items</span><b>{count}</b></div>
            <div className="sumRow" style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginTop: '1rem' }}>
              <span>Total</span><b className="text-glow-cyan">${total.toFixed(2)}</b>
            </div>
            <div style={{ margin: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}></div>
            <button 
              className="btn-primary-glow" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} 
              onClick={handleCheckout} 
              disabled={loading}
            >
              <span className="material-icons">shopping_bag</span>
              Checkout
            </button>
            <div className="small text-muted" style={{ marginTop: '1rem', textAlign: 'center' }}>Creates an order using your account.</div>
          </div>
        </div>
      )}
    </div>
  );
};
