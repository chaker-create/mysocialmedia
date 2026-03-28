import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jawna_token'));
  const [loading, setLoading] = useState(true);

  const login = useCallback((tokenVal, userData) => {
    localStorage.setItem('jawna_token', tokenVal);
    setToken(tokenVal);
    setUser(userData);
    connectSocket(tokenVal);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jawna_token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
        connectSocket(token);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
