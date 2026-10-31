import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import './i18n';
import { useAppContext } from './context/AppContext';
import { resolveThemeMode } from './services/themePreference';
import LoginView from './views/LoginView';
import DashboardApp from './views/DashboardApp';
import ProtectedRoute from './components/ProtectedRoute';

function LoginRoute() {
  const { token } = useAppContext();
  const forcePasswordChange = localStorage.getItem('softbadge_force_password_change') === 'true';
  if (token && !forcePasswordChange) return <Navigate to="/app" replace />;
  return <LoginView />;
}

export default function App() {
  const { theme } = useAppContext();

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.setAttribute('data-theme', resolveThemeMode(theme));
    };

    applyTheme();
    if (theme !== 'system' || !window.matchMedia) return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/app" element={<ProtectedRoute><DashboardApp /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
