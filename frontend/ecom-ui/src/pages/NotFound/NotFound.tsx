import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

export const NotFound = () => {
  return (
    <div className="not-found-page aw-page-content">
      <span className="material-icons not-found-icon">explore_off</span>
      <h1>Page Not Found</h1>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary-glow">
        <span className="material-icons">home</span>
        Return Home
      </Link>
    </div>
  );
};
