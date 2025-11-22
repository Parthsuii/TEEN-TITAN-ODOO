import React, { useState, useEffect } from 'react';
import axios from '../axios';
import AuthContext from './context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { emailOrSku: email, password });
    setUser(res.data.user);
  };

  const register = async (name, email, password) => {
    const res = await axios.post('/auth/register', { name, email, password });
    setUser(res.data.user);
  };

  const logout = async () => {
    await axios.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
