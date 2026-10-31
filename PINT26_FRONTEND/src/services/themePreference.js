export const THEMA_CODE = {
  SYSTEM: 1,
  LIGHT: 2,
  DARK: 3,
};

export const mapThemaCodeToTheme = (thema) => {
  const code = Number(thema);
  if (code === THEMA_CODE.SYSTEM) return 'system';
  if (code === THEMA_CODE.DARK) return 'dark';
  return 'light';
};

export const resolveThemeMode = (theme) => {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
