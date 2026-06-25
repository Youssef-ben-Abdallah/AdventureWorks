import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from '../../pages/AccessDenied/AccessDenied';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requireAdmin = false }) => {
  const { isLoggedIn, isAdmin } = useAuth();

  if (!isLoggedIn) {
    return <AccessDenied />;
  }

  if (requireAdmin && !isAdmin) {
    return <AccessDenied />;
  }

  return <Outlet />;
};
