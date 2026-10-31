import axios from 'axios';
import i18next from 'i18next';

export const getFallbackBaseURL = () => {
  if (typeof window !== 'undefined' && window.location.hostname.includes('softbadge.pt')) {
    return 'https://back.softbadge.pt';
  }
  return 'http://localhost:3000';
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || getFallbackBaseURL();

export const getLandingPageURL = () => {
  if (import.meta.env.VITE_LANDING_PAGE_URL) {
    return import.meta.env.VITE_LANDING_PAGE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('softbadge.pt')) {
    return 'https://www.softbadge.pt';
  }
  return 'http://localhost:3002';
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'X-Client-Platform': 'web',
  },
});

api.interceptors.request.use((config) => {
  // Garante a identificação da plataforma Web para controle de validade do token (1 hora)
  config.headers['X-Client-Platform'] = 'web';

  const token = localStorage.getItem('softbadge_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Anexa o perfil ativo selecionado pelo utilizador
  const activeRole = localStorage.getItem('softbadge_active_role');
  if (activeRole) {
    config.headers['x-active-role'] = activeRole;
  }

  // Normaliza o idioma para 2 letras (ex: 'en-US' -> 'en')
  const rawLang = i18next.language || localStorage.getItem('softbadge_language') || 'pt';
  const cleanLang = String(rawLang).split('-')[0].toLowerCase();
  const validLang = ['pt', 'en', 'es'].includes(cleanLang) ? cleanLang : 'pt';

  // Ensure language is sent both as query param and Accept-Language header
  if (!config.params) {
    config.params = {};
  }
  if (!config.params.lang) {
    config.params.lang = validLang;
  }
  config.headers['Accept-Language'] = validLang;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Evita loops infinitos de redirecionamento se já estiver no login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('softbadge_token');
        localStorage.removeItem('softbadge_user');
        localStorage.removeItem('softbadge_active_role');
        sessionStorage.clear();

        import('sweetalert2').then((Swal) => {
          Swal.default.fire({
            icon: 'warning',
            title: i18next.t('sessionExpiredTitle'),
            text: i18next.t('sessionExpiredText'),
            confirmButtonText: 'OK',
            allowOutsideClick: false
          }).then(() => {
            window.location.href = '/login';
          });
        });
      }
    }
    return Promise.reject(error);
  }
);
