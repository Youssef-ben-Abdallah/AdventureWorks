import React, { useEffect } from 'react';
import { Order, OrderItem } from '../../types/models';
import './OrderTicketModal.css';

interface OrderTicketModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  isAdmin?: boolean;
  onDelete?: (order: Order) => void;
}

const statusLabel = (id: number) => {
  return ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'][id] ?? 'Unknown';
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
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }).format(d);
};

export const OrderTicketModal: React.FC<OrderTicketModalProps> = ({ isOpen, order, onClose, isAdmin = false, onDelete }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const subTotal = (order.items || []).reduce((acc: number, i: OrderItem) => acc + (i.lineTotal ?? (i.qty * i.unitPrice)), 0);

  return (
    <div className="ticket-overlay" onClick={onClose}>
      <div className="ticket-modal" onClick={e => e.stopPropagation()}>
        <div className="ticket-header">
          <div className="ticket-brand">
            <span className="material-icons" style={{ fontSize: '32px', color: 'var(--primary)' }}>receipt_long</span>
            <div>
              <div className="ticket-title">Order Ticket</div>
              <div className="ticket-muted">{isAdmin ? 'Admin preview' : 'Customer receipt'}</div>
            </div>
          </div>
          <div className="ticket-meta">
            <div><b>#{order.id}</b></div>
            <div className="ticket-muted">{formatDate(order.createdAtUtc)}</div>
          </div>
        </div>

        <div className="ticket-divider"></div>

        <div className="ticket-section">
          {isAdmin && (
            <div className="ticket-row">
              <span className="ticket-muted">Customer</span>
              <span>{order.username || order.userId}</span>
            </div>
          )}
          <div className="ticket-row">
            <span className="ticket-muted">Status</span>
            <span className={`order-status-badge ${statusClass(order.status)}`}>
              <span className="material-icons">{statusIcon(order.status)}</span>
              {statusLabel(order.status)}
            </span>
          </div>
        </div>

        <div className="ticket-divider"></div>

        <div className="ticket-section">
          <div className="ticket-items-title">Items</div>
          {(order.items || []).map((i: OrderItem, idx: number) => (
            <div className="ticket-item" key={idx}>
              <div className="ticket-name">{i.productName}</div>
              <div className="ticket-muted">x{i.qty}</div>
              <div className="ticket-price">${(i.lineTotal ?? (i.qty * i.unitPrice)).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="ticket-divider"></div>

        <div className="ticket-section ticket-totals">
          <div className="ticket-row">
            <span className="ticket-muted">Subtotal</span>
            <span>${subTotal.toFixed(2)}</span>
          </div>
          <div className="ticket-row ticket-total-row">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="ticket-actions">
          {isAdmin && onDelete && (
            <button 
              className="btn-secondary-glass" 
              style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', marginRight: '8px' }} 
              onClick={() => onDelete(order)}
            >
              Delete
            </button>
          )}
          <button className="btn-secondary-glass" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
