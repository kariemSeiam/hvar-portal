/**
 * AuthContext — Backend login (phone + password). JWT session.
 * New accounts: admin-only via POST /api/auth/users (after login).
 */
import { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from '../api/axios';
import { loadAuthSession, persistAuthSession, clearAuthSession } from '../utils/core/authSession';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => loadAuthSession());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userInfo = session?.userInfo ?? null;
  const isAuthenticated = Boolean(session?.isAuthenticated && session?.userInfo);

  const persistSession = useCallback((payload, options = {}) => {
    if (payload) {
      persistAuthSession(payload, options);
      setSession(payload);
    } else {
      clearAuthSession();
      setSession(null);
    }
    setError(null);
  }, []);

  const login = useCallback(async (phone, password, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const trimmedPhone = String(phone ?? '').trim();
      const trimmedPassword = String(password ?? '').trim();
      if (!trimmedPhone || !trimmedPassword) {
        setError('أدخل رقم الهاتف وكلمة المرور');
        return;
      }
      const { data } = await axiosInstance.post('/api/auth/login', {
        phone: trimmedPhone,
        password: trimmedPassword,
      });
      if (data.user && data.token) {
        persistSession({ isAuthenticated: true, userInfo: data.user, token: data.token }, { remember: options.remember !== false });
        return;
      }
      setError('حدث خطأ غير متوقع');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'حدث خطأ أثناء تسجيل الدخول';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    persistSession(null);
  }, [persistSession]);

  const updateProfile = useCallback(async (data) => {
    if (!session?.userInfo) return null;
    const next = { ...session.userInfo, ...data };
    persistSession({ ...session, userInfo: next }, { remember: true });
    return next;
  }, [session, persistSession]);

  const value = {
    userInfo,
    loading,
    error,
    login,
    logout,
    updateProfile,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      userInfo: null,
      loading: false,
      error: null,
      login: async () => {},
      logout: () => {},
      updateProfile: async () => null,
      isAuthenticated: false,
    };
  }
  return context;
};
