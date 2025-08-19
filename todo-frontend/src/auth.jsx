
// Authentication context and provider for managing user login state
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiPost, endpoints } from './api.js';

// Create AuthContext to share authentication state
const AuthContext = createContext(null);

// AuthProvider wraps the app and supplies authentication logic
export function AuthProvider({ children }) {
  // Store JWT token and email in localStorage for persistence
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [email, setEmail] = useState(() => localStorage.getItem('email'));
  const [loading, setLoading] = useState(false);
  const isAuthenticated = Boolean(token);

  // On mount, log out if token is missing or invalid
  useEffect(() => {
    if (!token) {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      setEmail(null);
      setToken(null);
    }
  }, []);

  // Keep token in localStorage in sync
  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  // Keep email in localStorage in sync
  useEffect(() => {
    if (email) localStorage.setItem('email', email);
    else localStorage.removeItem('email');
  }, [email]);

  // Login: authenticate user and store token/email
  async function login(credentials) {
    setLoading(true);
    try {
      const res = await apiPost(endpoints.login, credentials);
      setToken(res.token);
  // Persist token immediately so other parts (UserContext) can read it
  try { localStorage.setItem('token', res.token) } catch {}
  // Also keep an in-memory token reference to avoid race conditions
  try { window.__auth_token = res.token } catch {}
      if (credentials.email) setEmail(credentials.email);
  // Notify listeners that auth changed (so profile can refresh)
  try { window.dispatchEvent(new Event('authChanged')) } catch {}
      return res;
    } finally {
      setLoading(false);
    }
  }

  // Register: create new user account
  async function register(data) {
    setLoading(true);
    try {
      return await apiPost(endpoints.register, data);
    } finally {
      setLoading(false);
    }
  }

  // Logout: clear token and email
  async function logout() {
    try {
      await apiPost(endpoints.logout, {});
    } catch {}
  // Clear token immediately and notify listeners
  try { localStorage.removeItem('token') } catch {}
  try { window.__auth_token = null } catch {}
  setToken(null);
  try { window.dispatchEvent(new Event('authChanged')) } catch {}
  }

  // Memoize context value for performance
  const value = useMemo(() => ({
    token,
    email,
    setEmail,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  }), [token, email, loading]);

  // Provide authentication context to children
  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// useAuth hook: access authentication context in components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


