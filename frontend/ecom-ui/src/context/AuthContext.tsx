import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  username: string | null;
  login: (token: string, isAdmin: boolean, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const user = localStorage.getItem('username');
    if (token) {
      setIsLoggedIn(true);
      if (role === 'Admin') setIsAdmin(true);
      if (user) setUsername(user);
    }
  }, []);

  const login = (token: string, adminStatus: boolean, user: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', adminStatus ? 'Admin' : 'User');
    localStorage.setItem('username', user);
    setIsLoggedIn(true);
    setIsAdmin(adminStatus);
    setUsername(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
