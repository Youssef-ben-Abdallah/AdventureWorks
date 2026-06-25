import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/auth';
import './Login.css';

export const Login = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ username: false, password: false });

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const isInvalid = !username || username.length < 3 || !password || password.length < 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    setLoading(true);
    setError('');

    try {
      let data;
      if (mode === 'login') {
        data = await AuthService.login({ username: username.trim(), password: password.trim() });
      } else {
        data = await AuthService.register({ username: username.trim(), email: email.trim(), password: password.trim() });
      }

      const adminStatus = data.roles?.includes('Admin') || false;
      login(data.token, adminStatus, data.username);

      const params = new URLSearchParams(location.search);
      const returnUrl = params.get('returnUrl') || '/';
      navigate(returnUrl);
    } catch (err: any) {
      setError(err?.response?.data || err?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return (
    <div className="login-page">
      {/* Background orbs */}
      <div className="login-orb orb-1"></div>
      <div className="login-orb orb-2"></div>

      {/* Grid pattern overlay */}
      <div className="login-grid-bg"></div>

      <div className="login-container">
        {/* Left branding panel */}
        <div className="login-brand-panel">
          <div className="brand-logo">
            <div className="brand-icon-box">
              <span className="material-icons">directions_bike</span>
            </div>
            <div>
              <div className="brand-name" style={{ color: 'white' }}>AdventureWorks</div>
            <div className="brand-tagline">Bike Store</div>
          </div>
        </div>
        <h2 className="brand-headline">Your next ride<br /><span className="text-gradient">starts here.</span></h2>
        <p className="brand-sub">
          Access your account to manage orders, track your bikes, and explore our premium catalog.
        </p>

        <div className="brand-features">
          <div className="brand-feature">
            <span className="material-icons">check_circle</span>
            <span>500+ premium products</span>
          </div>
          <div className="brand-feature">
            <span className="material-icons">check_circle</span>
            <span>Real-time order tracking</span>
          </div>
          <div className="brand-feature">
            <span className="material-icons">check_circle</span>
            <span>Secure JWT authentication</span>
          </div>
        </div>

        <div className="brand-footer-note">
          Powered by AdventureWorks2019 · ASP.NET Core · React 19
        </div>
      </div>

      {/* Auth form panel */}
      <div className="login-form-panel glass-strong">
        {/* Mode tabs */}
        <div className="mode-tabs">
          <button className={`mode-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
            <span className="material-icons">login</span>
            Sign In
          </button>
          <button className={`mode-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
            <span className="material-icons">person_add</span>
            Create Account
          </button>
        </div>

        <div className="form-header">
          <h1 className="form-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="form-subtitle">{mode === 'login' ? 'Sign in to continue to AdventureWorks' : 'Join thousands of cycling enthusiasts'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-field">
            <label className="field-label">
              <span className="material-icons">person</span>
              Username
            </label>
            <input
              className="aw-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onBlur={() => handleBlur('username')}
              placeholder="Enter your username"
              autoComplete="username"
            />
            {touched.username && (!username || username.length < 3) && (
              <div className="field-error">
                <span className="material-icons">error</span>
                Username must be at least 3 characters
              </div>
            )}
          </div>

          {mode === 'register' && (
            <div className="form-field">
              <label className="field-label">
                <span className="material-icons">email</span>
                Email
              </label>
              <input
                className="aw-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                type="email"
                autoComplete="email"
              />
            </div>
          )}

          <div className="form-field">
            <label className="field-label">
              <span className="material-icons">lock</span>
              Password
            </label>
            <div className="password-wrap">
              <input
                className="aw-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button type="button" className="toggle-pass" onClick={() => setShowPassword(!showPassword)}>
                <span className="material-icons">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {touched.password && (!password || password.length < 6) && (
              <div className="field-error">
                <span className="material-icons">error</span>
                Password must be at least 6 characters
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="form-error">
              <span className="material-icons">error_outline</span>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || isInvalid}
          >
            {!loading && <span className="material-icons">{mode === 'login' ? 'login' : 'person_add'}</span>}
            {loading && <span className="spinner"></span>}
            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>

        </form>

        {/* Dev credentials hint */}
        <div className="dev-hint">
          <span className="material-icons">info</span>
          Dev admin: <code>admin</code> / <code>Admin123!</code>
        </div>
      </div>

    </div>
    </div >
  );
};
