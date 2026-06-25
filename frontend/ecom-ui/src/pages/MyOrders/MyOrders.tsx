import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OrdersService } from '../../services/orders';
import { Order } from '../../types/models';
import './MyOrders.css';

export const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await OrdersService.myOrders();
        setOrders(data || []);
      } catch (err: any) {
        setError(err?.response?.data || err?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const statusLabel = (id: number) => {
    return ['Pending','Paid','Processing','Shipped','Delivered','Cancelled'][id] ?? 'Unknown';
  };

  const statusIcon = (id: number) => {
    switch (id) {
      case 0: return 'schedule';
      case 1: return 'paid';
      case 2: return 'autorenew';
      case 3: return 'local_shipping';
      case 4: return 'check_circle';
      case 5: return 'cancel';
      default: return 'help';
    }
  };

  const statusClass = (id: number) => {
    switch (id) {
      case 0: return 'status-pending';
      case 1: return 'status-paid';
      case 2: return 'status-processing';
      case 3: return 'status-shipped';
      case 4: return 'status-delivered';
      case 5: return 'status-cancelled';
      default: return 'status-unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(d);
  };

  return (
    <div className="orders-page">
      {/* Page Header */}
      <div className="aw-page-header with-inner">
        <div className="aw-page-header-inner">
          <div>
          <div className="aw-badge" style={{ marginBottom: '0.5rem' }}>
            <span className="material-icons" style={{ fontSize: '12px', height: '12px', width: '12px', lineHeight: '12px', verticalAlign: 'middle' }}>receipt_long</span>
            Order History
          </div>
          <h1 className="orders-title">My Orders</h1>
          <p className="orders-subtitle">Track and review your purchase history.</p>
        </div>
        <Link className="btn-secondary-glass" to="/products">
          <span className="material-icons">pedal_bike</span>
          Shop More
        </Link>
        </div>
      </div>

      <div className="neon-divider"></div>

      {/* Loading skeleton */}
      {loading && (
        <div className="orders-content aw-page-content">
          {[1, 2, 3].map(i => (
            <div key={i} className="order-skeleton">
              <div className="skeleton" style={{ height: '20px', width: '30%', marginBottom: '10px', borderRadius: '4px' }}></div>
              <div className="skeleton" style={{ height: '12px', width: '20%', marginBottom: '16px', borderRadius: '4px' }}></div>
              <div className="skeleton" style={{ height: '60px', borderRadius: '8px' }}></div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="orders-empty aw-page-content">
          <span className="material-icons">error_outline</span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <div className="orders-empty aw-page-content">
          <span className="material-icons">shopping_bag</span>
          <h3>No orders yet</h3>
          <p>Your order history will appear here once you make a purchase.</p>
          <Link className="btn-primary-glow" to="/products">
            <span className="material-icons">pedal_bike</span>
            Start Shopping
          </Link>
        </div>
      )}

      {/* Orders list */}
      {!loading && !error && orders.length > 0 && (
        <div className="orders-content aw-page-content">
          {orders.map(o => (
            <div key={o.id} className="order-card gradient-border">
              {/* Order header */}
              <div className="order-head">
                <div className="order-id-block">
                  <div className="order-id">
                    <span className="material-icons order-id-icon">receipt</span>
                    Order #{o.id}
                  </div>
                  <div className="order-date">{formatDate(o.createdAtUtc)}</div>
                </div>

                <div className="order-head-right">
                  <div className={`order-status-badge ${statusClass(o.status)}`}>
                    <span className="material-icons">{statusIcon(o.status)}</span>
                    {statusLabel(o.status)}
                  </div>
                  <div className="order-total">
                    <span className="order-total-label">Total</span>
                    <span className="order-total-value">${o.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Order items table */}
              <div className="order-items">
                <div className="order-items-header">
                  <span>Product</span>
                  <span className="right">Qty</span>
                  <span className="right">Unit Price</span>
                  <span className="right">Line Total</span>
                </div>
                {o.items?.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    <span className="item-name">{item.productName}</span>
                    <span className="right item-qty">{item.qty}</span>
                    <span className="right item-price">${item.unitPrice.toFixed(2)}</span>
                    <span className="right item-total">${item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
