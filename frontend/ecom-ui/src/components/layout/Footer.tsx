import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="aw-footer">
      <div className="footer-glow-line"></div>
      <div className="footer-inner">
        <div className="footer-grid">

          {/* Brand column */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <span className="material-icons">directions_bike</span>
              </div>
              <div className="footer-logo-text">
                <div className="footer-brand-name">AdventureWorks</div>
                <div className="footer-brand-sub">Bike Store</div>
              </div>
            </div>
            <p className="footer-desc">
              A demo commerce + analytics UI built on the AdventureWorks2019 SQL Server dataset. 
              Featuring real product catalog, customer, and sales data.
            </p>
            <div className="footer-tech-badges">
              <span className="tech-badge">React 19</span>
              <span className="tech-badge">ASP.NET Core</span>
              <span className="tech-badge">SQL Server</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Shop</h4>
            <ul className="footer-links">
              <li><Link to="/products" className="footer-link">All Products</Link></li>
              <li><Link to="/products" className="footer-link">Bikes</Link></li>
              <li><Link to="/products" className="footer-link">Components</Link></li>
              <li><Link to="/products" className="footer-link">Accessories</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="footer-col">
            <h4 className="footer-col-title">Account</h4>
            <ul className="footer-links">
              <li><Link to="/login" className="footer-link">Sign In</Link></li>
              <li><Link to="/orders" className="footer-link">My Orders</Link></li>
              <li><Link to="/cart" className="footer-link">Cart</Link></li>
            </ul>
          </div>

          {/* Data info */}
          <div className="footer-col">
            <h4 className="footer-col-title">Data</h4>
            <ul className="footer-links">
              <li><Link to="/dashboard" className="footer-link">Analytics</Link></li>
              <li><Link to="/admin" className="footer-link">Admin Panel</Link></li>
              <li><a href="https://github.com/microsoft/sql-server-samples" className="footer-link" target="_blank" rel="noopener noreferrer">AdventureWorks DB ↗</a></li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <div className="footer-copy">
            <span>© {year} AdventureWorks Bike Store</span>
            <span className="footer-dot">·</span>
            <span>Demo project</span>
          </div>
          <div className="footer-stats">
            <span className="footer-stat-item">
              <span className="material-icons" style={{ fontSize: '14px' }}>verified</span>
              AW2019 Dataset
            </span>
            <span className="footer-stat-item">
              <span className="material-icons" style={{ fontSize: '14px' }}>security</span>
              JWT Auth
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
