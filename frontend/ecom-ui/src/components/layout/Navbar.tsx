import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

export const Navbar = () => {
  const { isLoggedIn, isAdmin, username, logout } = useAuth();
  const { count } = useCart();
  const { isLightMode, toggleTheme } = useTheme();
  
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setAccountMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className={`aw-navbar ${scrolled ? 'scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}>
        <div className="navbar-inner">
          {/* LOGO */}
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <div className="brand-icon-wrap">
              <span className="material-icons brand-icon">directions_bike</span>
              <div className="brand-pulse"></div>
            </div>
            <div className="brand-text">
              <span className="brand-name">AdventureWorks</span>
              <span className="brand-sub">Bike Store</span>
            </div>
          </Link>

          {/* DESKTOP NAV LINKS */}
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
              <span className="material-icons nav-link-icon">home</span>
              <span>Home</span>
            </NavLink>
            <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
              <span className="material-icons nav-link-icon">pedal_bike</span>
              <span>Products</span>
            </NavLink>
            {isLoggedIn && (
              <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                <span className="material-icons nav-link-icon">receipt_long</span>
                <span>My Orders</span>
              </NavLink>
            )}
            {isAdmin && (
              <>
                <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  <span className="material-icons nav-link-icon">admin_panel_settings</span>
                  <span>Admin</span>
                </NavLink>
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  <span className="material-icons nav-link-icon">insights</span>
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/cube-insights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                  <span className="material-icons nav-link-icon">auto_awesome</span>
                  <span>Reseller Insights</span>
                </NavLink>
              </>
            )}
          </div>

          {/* RIGHT ACTIONS */}
          <div className="nav-actions">
            {/* Theme Toggle */}
            <button className="nav-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {isLightMode ? <span className="material-icons">dark_mode</span> : <span className="material-icons">light_mode</span>}
            </button>

            {/* Cart */}
            {isLoggedIn && (
              <Link to="/cart" className="cart-btn">
                <span className="material-icons">shopping_cart</span>
                <span className="cart-label">Cart</span>
                {count > 0 && <span className="cart-badge">{count}</span>}
              </Link>
            )}

            {/* Account (logged in) */}
            {isLoggedIn ? (
              <div className="relative" ref={accountMenuRef}>
                <button className="account-btn" onClick={() => setAccountMenuOpen(!accountMenuOpen)}>
                  <div className="avatar">{(username || 'U').charAt(0).toUpperCase()}</div>
                  <span className="account-name">{username || 'Account'}</span>
                  <span className="material-icons chevron">expand_more</span>
                </button>
                
                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 z-50 overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glow)' }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <p className="text-sm font-medium text-white truncate" style={{ color: 'var(--text-primary)' }}>{username}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{isAdmin ? 'Administrator' : 'Member'}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/orders" className="flex items-center px-4 py-2 text-sm hover:bg-slate-800 transition-colors" style={{ color: 'var(--text-primary)' }} onClick={() => setAccountMenuOpen(false)}>
                        <span className="material-icons mr-2 text-sm">receipt_long</span>
                        My Orders
                      </Link>
                      <button onClick={() => { logout(); setAccountMenuOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors text-left">
                        <span className="material-icons mr-2 text-sm">logout</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-login">
                <span className="material-icons">login</span>
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {menuOpen && <div className="mobile-overlay" onClick={closeMenu}></div>}

        {/* Mobile Menu */}
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" className="mobile-nav-link" onClick={closeMenu}>
            <span className="material-icons">home</span> Home
          </NavLink>
          <NavLink to="/products" className="mobile-nav-link" onClick={closeMenu}>
            <span className="material-icons">pedal_bike</span> Products
          </NavLink>
          {isLoggedIn && (
            <>
              <NavLink to="/orders" className="mobile-nav-link" onClick={closeMenu}>
                <span className="material-icons">receipt_long</span> My Orders
              </NavLink>
              <NavLink to="/cart" className="mobile-nav-link" onClick={closeMenu}>
                <span className="material-icons">shopping_cart</span> Cart
                {count > 0 && <span className="mobile-badge">{count}</span>}
              </NavLink>
            </>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin" className="mobile-nav-link" onClick={closeMenu}>
                <span className="material-icons">admin_panel_settings</span> Admin
              </NavLink>
              <NavLink to="/dashboard" className="mobile-nav-link" onClick={closeMenu}>
                <span className="material-icons">insights</span> Dashboard
              </NavLink>
              <NavLink to="/cube-insights" className="mobile-nav-link" onClick={closeMenu}>
                <span className="material-icons">auto_awesome</span> Reseller Insights
              </NavLink>
            </>
          )}
          <div className="mobile-divider"></div>
          {isLoggedIn ? (
            <button className="mobile-nav-link mobile-logout" onClick={() => { logout(); closeMenu(); }}>
              <span className="material-icons">logout</span> Sign Out
            </button>
          ) : (
            <Link to="/login" className="mobile-nav-link mobile-login" onClick={closeMenu}>
              <span className="material-icons">login</span> Sign In
            </Link>
          )}
        </div>
      </nav>
    </>
  );
};
