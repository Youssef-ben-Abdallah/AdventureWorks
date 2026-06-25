import React from 'react';
import { Link } from 'react-router-dom';
import './AccessDenied.css';

export const AccessDenied = () => {
  return (
    <div className="access-denied-page aw-page-content">
      <span className="material-icons access-denied-icon">gpp_bad</span>
      <h1>Access Denied</h1>
      <p>You do not have permission to view this page. If you believe this is an error, please ensure you are logged in with the correct account or contact support.</p>
      <Link to="/" className="btn-primary-glow">
        <span className="material-icons">home</span>
        Return Home
      </Link>
    </div>
  );
};
