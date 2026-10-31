import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { ROLE } from '../constants/roles';
import { useAppContext } from '../context/AppContext';
import { layoutByRole } from '../components/roleLayouts';
import { authStorage } from '../services/authStorage';
import { navigationConfig } from '../config/navigationConfig.jsx';
import { api } from '../services/api';
import BaseContentGlobal from './BaseContentGlobal';
import DashboardGeral from './DashboardGeral';
import FooterGlobal from './FooterGlobal';
import MarcoCelebrationModal from '../components/MarcoCelebrationModal';
import ObjetivoCelebrationModal from '../components/ObjetivoCelebrationModal';
import ModalRgpdPostLogin from '../components/ModalRgpdPostLogin';

function buildContent(role, menuKey, onNavigate) {
  const item = navigationConfig.find(m => m.key === menuKey);
  if (!item) return <DashboardGeral />;

  // Resolve o componente declarativamente: por perfil (componentByRole) ou componente único (component)
  let ComponentToRender = null;
  if (item.componentByRole) {
    ComponentToRender = item.componentByRole[role];
  } else if (item.component) {
    ComponentToRender = item.component;
  }

  if (!ComponentToRender) return <PlaceholderModule />;
  return <ComponentToRender onNavigate={onNavigate} />;
}

function PlaceholderModule() {
  return (
    <div className="users-card p-5 text-center my-4">
      <div className="text-muted mb-3">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h5 className="fw-bold mb-2">Módulo em Construção</h5>
      <p className="text-muted mb-0 small">Esta secção do painel de administração está a ser desenvolvida.</p>
    </div>
  );
}

export default function DashboardApp() {
  const { t, i18n } = useTranslation();
  const { user, setUser, token, setToken, socket, activeRole, allowedRoles, changeRoleView, theme, setTheme, language, setLanguage, logout, triggerCountsUpdate, applySession } = useAppContext();
  const [menuKey, setMenuKey] = useState('home');
  const [refreshKey, setRefreshKey] = useState(0);

  // Marco Celebration Modal state
  const [activeCelebrationMarco, setActiveCelebrationMarco] = useState(null);
  // Objetivo Celebration Modal state
  const [activeCelebrationObjetivo, setActiveCelebrationObjetivo] = useState(null);

  // Preference Area Modal states
  const [showPreferenceAreaModal, setShowPreferenceAreaModal] = useState(false);
  const [learningPaths, setLearningPaths] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedLp, setSelectedLp] = useState('');
  const [selectedSl, setSelectedSl] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [submittingPreference, setSubmittingPreference] = useState(false);

  // Helper function to decode JWT payload
  const getJwtPayload = (jwtToken) => {
    try {
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (!token) {
      setShowPreferenceAreaModal(false);
      return;
    }
    const payload = getJwtPayload(token);
    const hasConsultantRole = payload && payload.perfis && payload.perfis.map(Number).includes(4);
    const isAreaNull = payload && (payload.id_area === null || payload.id_area === undefined);

    if (hasConsultantRole && isAreaNull) {
      const checkAndLoad = async () => {
        try {
          // Se for o admin de seed principal, verifica a contagem de utilizadores antes de exigir área
          if (payload.sub === "019d6cd2-baad-721b-8e8d-9761f013ceb6") {
            const resTotal = await api.get('/metricas/utilizadores_total').catch(() => null);
            if (resTotal && resTotal.data?.success && Number(resTotal.data.data?.total) <= 1) {
              setShowPreferenceAreaModal(false);
              return;
            }
          }

          setShowPreferenceAreaModal(true);
          const [resLP, resSL, resArea] = await Promise.all([
            api.get('/learning_path').catch(() => ({ data: { success: false, data: [] } })),
            api.get('/service_line').catch(() => ({ data: { success: false, data: [] } })),
            api.get('/area').catch(() => ({ data: { success: false, data: [] } }))
          ]);
          if (resLP.data?.success) setLearningPaths(resLP.data.data || []);
          if (resSL.data?.success) setServiceLines(resSL.data.data || []);
          if (resArea.data?.success) setAreas(resArea.data.data || []);
        } catch (err) {
          console.error("Erro ao verificar/carregar dados para o modal de preferências:", err);
        }
      };
      checkAndLoad();
    } else {
      setShowPreferenceAreaModal(false);
    }
  }, [user, token]);

  const activeLPs = useMemo(() => learningPaths.filter(lp => lp.lpAtivo), [learningPaths]);
  const activeSLs = useMemo(() => {
    return serviceLines.filter(sl => sl.slAtivo && String(sl.id_learning_path) === String(selectedLp));
  }, [serviceLines, selectedLp]);
  const activeAreas = useMemo(() => {
    return areas.filter(a => a.areaAtiva && String(a.id_service_line) === String(selectedSl));
  }, [areas, selectedSl]);

  const handleSavePreferenceArea = async (e) => {
    e.preventDefault();
    if (!selectedArea) return;
    setSubmittingPreference(true);
    try {
      const res = await api.put(`/utilizador/${user.id_utilizador}`, {
        id_area: selectedArea
      });
      if (res.data?.success) {
        const refreshRes = await api.post('/auth/refresh-token');
        if (refreshRes.data?.success) {
          const { token: newToken, utilizador: newUser } = refreshRes.data.data;
          authStorage.setToken(newToken);
          authStorage.setUser(newUser);
          
          await applySession({
            token: newToken,
            user: newUser,
            strongestRole: activeRole
          });
        }
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso'),
          text: t('preferenceAreaSavedSuccess', 'Área de preferência guardada com sucesso!'),
          timer: 2000,
          showConfirmButton: false
        });
        setShowPreferenceAreaModal(false);
      }
    } catch (err) {
      console.error("Erro ao guardar área de preferência:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.response?.data?.message || 'Erro ao guardar área de preferência.'
      });
    } finally {
      setSubmittingPreference(false);
    }
  };

  useEffect(() => { i18n.changeLanguage(language); }, [language, i18n]);

  const roleSelectStyles = useMemo(() => {
    const roleId = Number(activeRole);
    const isAdmin = roleId === ROLE.ADMIN;
    const base = {
      borderColor: 'transparent',
      transition: 'all 0.2s ease-in-out',
      boxShadow: 'none'
    };

    if (isAdmin) {
      return {
        ...base,
        backgroundColor: theme === 'dark' ? '#111827' : '#4b5563',
        color: '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#374151',
      };
    }

    return {
      ...base,
      backgroundColor: roleId === 2 ? '#0d9488' : roleId === 3 ? '#7c3aed' : roleId === 4 ? '#0284c7' : 'var(--panel)',
      color: '#ffffff',
      borderColor: roleId === 2 ? '#0f766e' : roleId === 3 ? '#6d28d9' : roleId === 4 ? '#0369a1' : 'var(--sidebar-border)',
    };
  }, [activeRole, theme]);

  useEffect(() => {
    const saudacao = user?.saudacao;
    const userId = user?.id_utilizador || user?.sub || user?.id;
    if (!token || !saudacao || !userId) return;

    const shownKey = `softbadge_greeting_seen_${userId}`;
    if (sessionStorage.getItem(shownKey)) return;

    // Marca imediatamente como visto na sessão do browser para evitar re-renderizações ou re-disparos acidentais
    sessionStorage.setItem(shownKey, '1');

    const normalized = saudacao
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    let imageName = 'daytime.webp';
    if (normalized.includes('welcome again') || normalized.includes('bem-vindo novamente') || normalized.includes('bienvenido de nuevo')) {
      imageName = 'welcome-again.webp';
    } else if (normalized.includes('bem-vindo') || normalized.includes('welcome') || normalized.includes('bienvenido')) {
      imageName = 'welcome.webp';
    } else if (normalized.includes('boa noite') || normalized.includes('good night') || normalized.includes('good evening') || normalized.includes('buenas noches')) {
      imageName = 'night.webp';
    } else if (normalized.includes('boa tarde') || normalized.includes('good afternoon') || normalized.includes('buenas tardes')) {
      imageName = 'afternoon.webp';
    } else if (normalized.includes('bom dia') || normalized.includes('good morning') || normalized.includes('buenos dias')) {
      imageName = 'morning.webp';
    }

    Swal.fire({
      title: user?.nome || t('appName'),
      text: saudacao,
      imageUrl: `${import.meta.env.BASE_URL}img/system/saudacao/${imageName}`,
      imageWidth: 420,
      imageHeight: 220,
      imageAlt: saudacao,
      confirmButtonText: 'OK',
    });
  }, [user?.id_utilizador, user?.saudacao, t]);

  // Check for uncelebrated milestones on mount / login
  useEffect(() => {
    if (!token || !user) return;

    const checkMarcosPorCelebrar = async () => {
      try {
        const res = await api.get(`/utilizador-marco/por-celebrar?lang=${language}`);
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setActiveCelebrationMarco(res.data.data[0]);
        }
      } catch (err) {
        console.warn('Erro ao verificar marcos por celebrar:', err);
      }
    };

    // Pequeno atraso para dar prioridade à saudação visual se for o primeiro login
    const timer = setTimeout(() => {
      checkMarcosPorCelebrar();
    }, 1200);

    return () => clearTimeout(timer);
  }, [token, user, language]);

  // Real-time listener for newly achieved milestones via WebSocket
  useEffect(() => {
    if (!socket || !token || !user) return;

    const handleNovoMarcoSocket = (payload) => {
      if (!payload) return;
      setActiveCelebrationMarco(payload);
      if (triggerCountsUpdate) triggerCountsUpdate();
    };

    socket.on('novo_marco', handleNovoMarcoSocket);
    return () => {
      socket.off('novo_marco', handleNovoMarcoSocket);
    };
  }, [socket, token, user, triggerCountsUpdate]);

  // Real-time listener for newly achieved objectives via WebSocket
  useEffect(() => {
    if (!socket || !token || !user) return;

    const handleNovoObjetivoSocket = (payload) => {
      if (!payload) return;
      console.log('Evento novo_objetivo_cumprido recebido no DashboardApp:', payload);
      setActiveCelebrationObjetivo(payload);
      if (triggerCountsUpdate) triggerCountsUpdate();
    };

    socket.on('novo_objetivo_cumprido', handleNovoObjetivoSocket);
    return () => {
      socket.off('novo_objetivo_cumprido', handleNovoObjetivoSocket);
    };
  }, [socket, token, user, triggerCountsUpdate]);

  // Listener em tempo real caso o Administrador altere os termos gerais de RGPD e revogue o consentimento global
  useEffect(() => {
    if (!socket) return;
    const handleRgpdRevoked = () => {
      if (setUser) {
        setUser(prev => prev ? ({ ...prev, aceitou_rgpd: false }) : prev);
      }
      const stored = authStorage.getUser();
      if (stored) {
        authStorage.setUser({ ...stored, aceitou_rgpd: false });
      }
    };

    socket.on('rgpd_revogado_global', handleRgpdRevoked);
    return () => {
      socket.off('rgpd_revogado_global', handleRgpdRevoked);
    };
  }, [socket, setUser]);

  const { Header, Sidebar } = useMemo(() => layoutByRole[activeRole] || layoutByRole[ROLE.CON], [activeRole]);

  const handleMenuSelect = async (key) => {
    if (key === 'seed') {
      const result = await Swal.fire({
        title: t('menuSeed'),
        text: t('seedConfirmText'),
        imageUrl: `${import.meta.env.BASE_URL}img/system/dataseed.webp`,
        imageWidth: 400,
        imageAlt: t('menuSeed'),
        showCancelButton: true,
        confirmButtonText: t('yesBtn'),
        cancelButtonText: t('noBtn'),
        confirmButtonColor: '#00C853',
        cancelButtonColor: '#d33'
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: t('saving'),
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        try {
          const res = await api.post('/seeds/all');
          if (res.data?.success) {
            // Renovar o token para obter o id_area atualizado do admin principal (agora preenchido pelo seed)
            try {
              const refreshRes = await api.post('/auth/refresh-token');
              if (refreshRes.data?.success) {
                const { token: newToken, utilizador: newUser } = refreshRes.data.data;
                authStorage.setToken(newToken);
                authStorage.setUser(newUser);
                await applySession({
                  token: newToken,
                  user: newUser,
                  strongestRole: activeRole
                });
              }
            } catch (tokenErr) {
              console.error("Erro ao renovar token pós-seed:", tokenErr);
            }

            Swal.fire({
              icon: 'success',
              title: t('successTitle', 'Sucesso'),
              text: t('seedSuccess'),
              timer: 2000,
              showConfirmButton: false
            });
            setRefreshKey(prev => prev + 1);
            if (triggerCountsUpdate) triggerCountsUpdate();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Erro',
              text: res.data?.message || t('seedError')
            });
          }
        } catch (err) {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: err.response?.data?.message || t('seedError')
          });
        }
      }
    } else {
      setMenuKey(key);
    }
  };

  const handleLogoutClick = async () => {
    const result = await Swal.fire({
      icon: 'question',
      title: t('logoutConfirmTitle'),
      text: t('logoutConfirmText'),
      showCancelButton: true,
      confirmButtonText: t('logoutConfirmBtn'),
      cancelButtonText: t('logoutCancelBtn'),
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      focusCancel: true
    });

    if (result.isConfirmed) {
      logout();
    }
  };

  const controls = (
    <div className="d-flex gap-2 align-items-center ms-auto control-wrap">
      <select className="form-select form-select-sm" value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option>
      </select>
      <button className="btn btn-sm btn-outline-secondary" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? t('light') : t('dark')}
      </button>
      <select 
        className="form-select form-select-sm fw-bold" 
        value={activeRole || ''} 
        onChange={(e) => { setMenuKey('home'); changeRoleView(Number(e.target.value)); }}
        style={roleSelectStyles}
      >
        {allowedRoles.map((role) => {
          const roleId = typeof role === 'object' ? Number(role.id_perfil) : Number(role);
          const translationKey = { 1: 'admin', 2: 'sll', 3: 'tm', 4: 'con' }[roleId] || 'con';
          return (
            <option key={roleId} value={roleId} style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}>
              {t(translationKey)}
            </option>
          );
        })}
      </select>
      <button className="btn btn-sm btn-danger" onClick={handleLogoutClick}>{t('logout')}</button>
    </div>
  );

  return (
    <div className="app-bg min-vh-100 p-3">
      <div className="app-shell shadow-lg">
        <Header controls={controls} />
        <div className="d-flex main-area">
          <Sidebar activeKey={menuKey} onSelect={handleMenuSelect} />
          <main className="content p-4" key={`${menuKey}-${language}-${refreshKey}`}>
            {!showPreferenceAreaModal && !(Number(activeRole) === ROLE.ADMIN && menuKey === 'home') && <BaseContentGlobal user={user} activeRole={activeRole} />}
            {!showPreferenceAreaModal && buildContent(activeRole, menuKey, handleMenuSelect)}
          </main>
        </div>
        <FooterGlobal />
      </div>

      {showPreferenceAreaModal && (
        <>
          <div className="users-modal-overlay" style={{ zIndex: 1080 }} />
          <div className="users-modal" style={{ maxWidth: '520px', width: '90%', zIndex: 1090, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'var(--panel)', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div className="users-modal-header p-4 border-bottom">
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)' }}>
                🎯 {t('preferenceAreaModalTitle')}
              </h5>
            </div>
            
            <form onSubmit={handleSavePreferenceArea}>
              <div className="p-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p className="text-muted small mb-1" style={{ color: 'var(--text-muted)' }}>
                  {t('preferenceAreaModalText')}
                </p>
                
                {/* LP Selector */}
                <div className="users-form-group">
                  <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                    {t('menuLearningPath')} *
                  </label>
                  <select
                    className="form-select rounded-3"
                    required
                    value={selectedLp}
                    onChange={(e) => { setSelectedLp(e.target.value); setSelectedSl(''); setSelectedArea(''); }}
                  >
                    <option value="">{t('selectLP')}</option>
                    {activeLPs.map(lp => (
                      <option key={lp.id_learning_path} value={lp.id_learning_path}>
                        {lp.learning_path}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SL Selector */}
                <div className="users-form-group">
                  <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                    {t('serviceLine')} *
                  </label>
                  <select
                    className="form-select rounded-3"
                    required
                    disabled={!selectedLp}
                    value={selectedSl}
                    onChange={(e) => { setSelectedSl(e.target.value); setSelectedArea(''); }}
                  >
                    <option value="">{t('selectSL')}</option>
                    {activeSLs.map(sl => (
                      <option key={sl.id_service_line} value={sl.id_service_line}>
                        {sl.service_line}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area Selector */}
                <div className="users-form-group">
                  <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                    {t('areaLabel')} *
                  </label>
                  <select
                    className="form-select rounded-3"
                    required
                    disabled={!selectedSl}
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                  >
                    <option value="">{t('selectArea')}</option>
                    {activeAreas.map(a => (
                      <option key={a.id_area} value={a.id_area}>
                        {a.area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="d-flex justify-content-end p-4 border-top gap-2 bg-light" style={{ backgroundColor: 'var(--panel-2, #f8fafc)' }}>
                <button
                  type="submit"
                  className="btn btn-primary rounded-3 px-4 fw-semibold w-100"
                  disabled={submittingPreference || !selectedArea}
                >
                  {submittingPreference ? t('saving') : t('savePreferenceBtn')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal Bloqueante de RGPD Pós-Login */}
      {token && user && user.aceitou_rgpd === false && (
        <ModalRgpdPostLogin />
      )}

      {/* Global Marco Celebration Modal */}
      {activeCelebrationMarco && (
        <MarcoCelebrationModal
          marco={activeCelebrationMarco}
          onClose={() => setActiveCelebrationMarco(null)}
          onCelebrated={() => {
            setActiveCelebrationMarco(null);
            if (triggerCountsUpdate) triggerCountsUpdate();
          }}
        />
      )}

      {/* Global Objetivo Celebration Modal */}
      {activeCelebrationObjetivo && (
        <ObjetivoCelebrationModal
          objetivo={activeCelebrationObjetivo}
          onClose={() => setActiveCelebrationObjetivo(null)}
        />
      )}
    </div>
  );
}
