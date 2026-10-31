const KEYS = {
  token: 'softbadge_token',
  user: 'softbadge_user',
  activeRole: 'softbadge_active_role',
  theme: 'softbadge_theme',
  language: 'softbadge_language',
};

export const authStorage = {
  getToken: () => localStorage.getItem(KEYS.token),
  setToken: (token) => localStorage.setItem(KEYS.token, token),
  getUser: () => {
    const raw = localStorage.getItem(KEYS.user);
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user) => localStorage.setItem(KEYS.user, JSON.stringify(user)),
  getActiveRole: () => Number(localStorage.getItem(KEYS.activeRole)) || null,
  setActiveRole: (roleId) => localStorage.setItem(KEYS.activeRole, String(roleId)),
  getTheme: () => localStorage.getItem(KEYS.theme) || 'light',
  setTheme: (theme) => localStorage.setItem(KEYS.theme, theme),
  getLanguage: () => localStorage.getItem(KEYS.language) || 'pt',
  setLanguage: (lang) => localStorage.setItem(KEYS.language, lang),
  clearSession: () => {
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.activeRole);
    localStorage.removeItem(KEYS.theme);
    localStorage.removeItem(KEYS.language);
  },
};
