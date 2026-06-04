const AUTH_STORAGE_KEY = 'hvar-hub-demo-auth';
const AUTH_PERSIST_DAYS = 30;
const AUTH_PERSIST_MS = AUTH_PERSIST_DAYS * 24 * 60 * 60 * 1000;

const hasWindow = () => typeof window !== 'undefined';

const isValidSessionPayload = (payload) => {
  return Boolean(payload?.isAuthenticated && payload?.userInfo);
};

const parseStoredValue = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const isExpired = (record) => {
  const expiresAt = Number(record?.expiresAt || 0);
  return Number.isFinite(expiresAt) && expiresAt > 0 && Date.now() > expiresAt;
};

const cleanupExpired = () => {
  if (!hasWindow()) return;
  try {
    const localRecord = parseStoredValue(localStorage.getItem(AUTH_STORAGE_KEY));
    if (localRecord && isExpired(localRecord)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {}
};

export const loadAuthSession = () => {
  if (!hasWindow()) return null;
  cleanupExpired();

  const fromSession = parseStoredValue(sessionStorage.getItem(AUTH_STORAGE_KEY));
  if (isValidSessionPayload(fromSession?.data)) {
    return fromSession.data;
  }

  const fromLocal = parseStoredValue(localStorage.getItem(AUTH_STORAGE_KEY));
  if (fromLocal && !isExpired(fromLocal) && isValidSessionPayload(fromLocal?.data)) {
    return fromLocal.data;
  }

  return null;
};

export const persistAuthSession = (payload, { remember = true } = {}) => {
  if (!hasWindow()) return;

  if (!payload) {
    clearAuthSession();
    return;
  }

  const now = Date.now();
  const sessionRecord = {
    data: payload,
    savedAt: now,
    expiresAt: 0,
    remember: false,
  };
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionRecord));

  if (remember) {
    const localRecord = {
      data: payload,
      savedAt: now,
      expiresAt: now + AUTH_PERSIST_MS,
      remember: true,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(localRecord));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const clearAuthSession = () => {
  if (!hasWindow()) return;
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getToken = () => {
  const session = loadAuthSession();
  return session?.token || null;
};

export const getAuthStorageMeta = () => ({
  key: AUTH_STORAGE_KEY,
  ttlDays: AUTH_PERSIST_DAYS,
});
