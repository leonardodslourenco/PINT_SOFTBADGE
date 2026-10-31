import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../services/api';
import CardBadgeConsultor from '../../components/CardBadgeConsultor';
import ViewBadgeModal from '../../components/ViewBadgeModal';
import CandidateBadgeModal from '../../components/CandidateBadgeModal';

export default function HomeConsult({ onNavigate }) {
  const { t, i18n } = useTranslation();
  const { user, token, socket } = useAppContext();
  const [stats, setStats] = useState({
    badgesCount: 0,
    activeAppsCount: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);

  // Estados para métricas de Candidaturas a Badges Especiais do Consultor
  const [specialPendingCount, setSpecialPendingCount] = useState(0);
  const [specialApprovedCount, setSpecialApprovedCount] = useState(0);
  const [specialRejectedCount, setSpecialRejectedCount] = useState(0);
  const [loadingSpecial, setLoadingSpecial] = useState(true);

  // Badges & Apps for the preferred area carousel
  const [badges, setBadges] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loadingBadges, setLoadingBadges] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Learning Path Progression state
  const [lpProgression, setLpProgression] = useState([]);
  const [loadingProgression, setLoadingProgression] = useState(true);
  const [openLPs, setOpenLPs] = useState({});

  const toggleLP = (lpId) => {
    setOpenLPs((prev) => ({
      ...prev,
      [lpId]: !prev[lpId]
    }));
  };

  // Modals state
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedViewBadgeId, setSelectedViewBadgeId] = useState(null);

  // Fetch applications to compute KPIs
  const fetchStats = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get('/metricas/con-dashboard/metricas-gerais');
      if (res.data?.success && res.data.data) {
        setStats({
          badgesCount: res.data.data.badgesCount ?? 0,
          activeAppsCount: res.data.data.activeAppsCount ?? 0,
          totalPoints: res.data.data.totalPoints ?? 0
        });
      }
    } catch (err) {
      console.error('Error fetching consultant stats:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Fetch consultant special badge apps counts (estados 1, 2, 3)
  const fetchSpecialStats = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingSpecial(true);
      const [resEspPending, resEspApproved, resEspRejected] = await Promise.all([
        api.get('/metricas/candidaturas-especiais/estado-contagem?estado=1'),
        api.get('/metricas/candidaturas-especiais/estado-contagem?estado=2'),
        api.get('/metricas/candidaturas-especiais/estado-contagem?estado=3')
      ]);
      if (resEspPending.data?.success) setSpecialPendingCount(resEspPending.data.data?.contagem || 0);
      if (resEspApproved.data?.success) setSpecialApprovedCount(resEspApproved.data.data?.contagem || 0);
      if (resEspRejected.data?.success) setSpecialRejectedCount(resEspRejected.data.data?.contagem || 0);
    } catch (err) {
      console.error('Error fetching consultant special apps stats:', err);
    } finally {
      if (!isSilent) setLoadingSpecial(false);
    }
  }, []);

  // Fetch consultant Learning Path progression
  const fetchProgression = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingProgression(true);
      const res = await api.get('/metricas/con-dashboard/progresso-lp');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLpProgression(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching LP progression:', err);
    } finally {
      if (!isSilent) setLoadingProgression(false);
    }
  }, []);

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

  const payload = token ? getJwtPayload(token) : null;
  const idArea = payload?.id_area;

  const fetchBadgesAndApps = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingBadges(true);
      const [resBadges, resApps] = await Promise.all([
        api.get('/badge?ativo=true'),
        api.get('/candidatura_badge')
      ]);
      if (resBadges.data?.success) setBadges(resBadges.data.data || []);
      if (resApps.data?.success) setMyApplications(resApps.data.data || []);
    } catch (err) {
      console.error('Error fetching badges and applications for home:', err);
    } finally {
      if (!isSilent) setLoadingBadges(false);
    }
  }, []);

  const handleRefreshData = useCallback((isSilent = false) => {
    fetchBadgesAndApps(isSilent);
    fetchStats(isSilent);
    fetchSpecialStats(isSilent);
    fetchProgression(isSilent);
  }, [fetchBadgesAndApps, fetchStats, fetchSpecialStats, fetchProgression]);

  useEffect(() => {
    fetchStats();
    fetchSpecialStats();
    fetchBadgesAndApps();
    fetchProgression();
  }, [fetchStats, fetchSpecialStats, fetchBadgesAndApps, fetchProgression, i18n.language]);

  const getBadgeCandidatura = useCallback((badgeId) => {
    const active = myApplications.find(a => a.id_badge === badgeId && a.id_estado_candidatura !== 5);
    if (active) return active;
    return myApplications.find(a => a.id_badge === badgeId && a.id_estado_candidatura === 5);
  }, [myApplications]);

  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      handleRefreshData(true);
    };

    socket.on('badge_updated', handleRealtimeUpdate);
    socket.on('gestao_area', handleRealtimeUpdate);
    socket.on('candidatura_submetida', handleRealtimeUpdate);
    socket.on('candidatura_pre_aprovada', handleRealtimeUpdate);
    socket.on('candidatura_avancou', handleRealtimeUpdate);
    socket.on('candidatura_badge_emitido', handleRealtimeUpdate);
    socket.on('candidatura_especial_submetida', handleRealtimeUpdate);
    socket.on('candidatura_especial_aprovada', handleRealtimeUpdate);
    socket.on('candidatura_especial_recusada', handleRealtimeUpdate);
    socket.on('conquista_especial_criada', handleRealtimeUpdate);
    socket.on('conquista_especial_atualizada', handleRealtimeUpdate);
    socket.on('conquista_especial_removida', handleRealtimeUpdate);
    socket.on('notification', handleRealtimeUpdate);
    socket.on('nova_notificacao', handleRealtimeUpdate);

    return () => {
      socket.off('badge_updated', handleRealtimeUpdate);
      socket.off('gestao_area', handleRealtimeUpdate);
      socket.off('candidatura_submetida', handleRealtimeUpdate);
      socket.off('candidatura_pre_aprovada', handleRealtimeUpdate);
      socket.off('candidatura_avancou', handleRealtimeUpdate);
      socket.off('candidatura_badge_emitido', handleRealtimeUpdate);
      socket.off('candidatura_especial_submetida', handleRealtimeUpdate);
      socket.off('candidatura_especial_aprovada', handleRealtimeUpdate);
      socket.off('candidatura_especial_recusada', handleRealtimeUpdate);
      socket.off('conquista_especial_criada', handleRealtimeUpdate);
      socket.off('conquista_especial_atualizada', handleRealtimeUpdate);
      socket.off('conquista_especial_removida', handleRealtimeUpdate);
      socket.off('notification', handleRealtimeUpdate);
      socket.off('nova_notificacao', handleRealtimeUpdate);
    };
  }, [socket, handleRefreshData]);

  // Group LP progression by Learning Path
  const lpProgressionGrouped = useMemo(() => {
    const map = new Map();
    lpProgression.forEach((item) => {
      const lpId = item.id_learning_path;
      if (!map.has(lpId)) {
        map.set(lpId, {
          id_learning_path: lpId,
          lp_nome: item.lp_nome || 'Learning Path',
          service_lines: []
        });
      }
      map.get(lpId).service_lines.push(item);
    });
    return Array.from(map.values());
  }, [lpProgression]);

  const preferredAreaBadges = useMemo(() => {
    if (!idArea) return [];
    return badges.filter(b => String(b.id_area) === String(idArea));
  }, [badges, idArea]);

  const visibleBadges = useMemo(() => {
    if (preferredAreaBadges.length === 0) return [];
    if (preferredAreaBadges.length <= 2) return preferredAreaBadges;
    const items = [];
    items.push(preferredAreaBadges[currentIndex]);
    const nextIdx = (currentIndex + 1) % preferredAreaBadges.length;
    items.push(preferredAreaBadges[nextIdx]);
    return items;
  }, [preferredAreaBadges, currentIndex]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1 >= preferredAreaBadges.length ? 0 : prev + 1));
  };
  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 < 0 ? preferredAreaBadges.length - 1 : prev - 1));
  };

  return (
    <div className="users-admin-container">
      {/* KPI Cards Grid (Requisitos 4, 13 e 15) */}
      <div className="kpi-grid mb-4">
        {/* Card 1: Badges Conquistados */}
        <div 
          className="kpi-card"
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => onNavigate && onNavigate('apps')}
        >
          <div className="kpi-details">
            <span className="kpi-title">{t('myBadges', 'Badges Conquistados')}</span>
            <span className="kpi-value">{loading ? '...' : stats.badgesCount}</span>
            <span className="kpi-trend positive small text-muted">{t('badgesObtainedTrend', 'Badges obtidos')}</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <svg viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>

        {/* Card 2: Candidaturas Ativas */}
        <div 
          className="kpi-card"
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => onNavigate && onNavigate('apps')}
        >
          <div className="kpi-details">
            <span className="kpi-title">{t('activeApps', 'Candidaturas Ativas')}</span>
            <span className="kpi-value">{loading ? '...' : stats.activeAppsCount}</span>
            <span className="kpi-trend positive small text-muted">{t('activeAppsTrend', 'Em análise ou rascunho')}</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        {/* Card 3: Pontos Totais (Requisito 13) */}
        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-title">{t('totalPoints', 'Pontos Totais')}</span>
            <span className="kpi-value">{loading ? '...' : stats.totalPoints}</span>
            <span className="kpi-trend positive small text-muted">{t('accumulatedPointsTrend', 'Pontos acumulados')}</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#fdf2f8', color: '#be185d' }}>
            <svg viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>
      </div>

      {/* KPI Row 2: Candidaturas a Badges Especiais (Substituindo Atalhos Rápidos) */}
      <div className="kpi-grid mb-4">
        {/* Card 1: Candidaturas Especiais Pendentes */}
        <div 
          className="kpi-card" 
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => onNavigate && onNavigate('especiais')}
        >
          <div className="kpi-details" style={{ overflow: 'hidden', minWidth: 0 }}>
            <span className="kpi-title text-truncate" title={t('mySpecialAppsPendingCardTitle', 'Candidaturas Especiais Pendentes')}>
              {t('mySpecialAppsPendingCardTitle', 'Candidaturas Especiais Pendentes')}
            </span>
            <span className="kpi-value" style={{ color: specialPendingCount > 0 ? '#f59e0b' : 'var(--text)' }}>
              {loadingSpecial ? '...' : specialPendingCount}
            </span>
            <span className="kpi-trend" style={{ color: specialPendingCount > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
              <span>{specialPendingCount > 0 ? `⏳ ${t('pendingReview', 'Aguardando revisão')}` : `✓ ${t('allClear', 'Em dia')}`}</span>
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        {/* Card 2: Candidaturas Especiais Aprovadas */}
        <div 
          className="kpi-card"
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => onNavigate && onNavigate('especiais')}
        >
          <div className="kpi-details" style={{ overflow: 'hidden', minWidth: 0 }}>
            <span className="kpi-title text-truncate" title={t('mySpecialAppsApprovedCardTitle', 'Candidaturas Especiais Aprovadas')}>
              {t('mySpecialAppsApprovedCardTitle', 'Candidaturas Especiais Aprovadas')}
            </span>
            <span className="kpi-value" style={{ color: '#16a34a' }}>
              {loadingSpecial ? '...' : specialApprovedCount}
            </span>
            <span className="kpi-trend positive">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              <span>{t('totalAssigned', 'Total atribuído')}</span>
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7" />
              <polygon points="12 4.5 13.3 7.2 16.2 7.6 14.1 9.7 14.6 12.6 12 11.2 9.4 12.6 9.9 9.7 7.8 7.6 10.7 7.2 12 4.5" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          </div>
        </div>

        {/* Card 3: Candidaturas Especiais Recusadas */}
        <div 
          className="kpi-card"
          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={() => onNavigate && onNavigate('especiais')}
        >
          <div className="kpi-details" style={{ overflow: 'hidden', minWidth: 0 }}>
            <span className="kpi-title text-truncate" title={t('mySpecialAppsRejectedCardTitle', 'Candidaturas Especiais Recusadas')}>
              {t('mySpecialAppsRejectedCardTitle', 'Candidaturas Especiais Recusadas')}
            </span>
            <span className="kpi-value" style={{ color: '#64748b' }}>
              {loadingSpecial ? '...' : specialRejectedCount}
            </span>
            <span className="kpi-trend" style={{ color: 'var(--text-muted)' }}>
              <span>{t('viewAllSpecialApps', 'Ver todas')}</span>
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(100, 116, 139, 0.12)', color: '#64748b', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        </div>
      </div>

      {/* Progresso nos Learning Paths (Abaixo dos Atalhos Rápidos) */}
      <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
              🛤️ {t('lpProgressionTitle', 'Progresso nos Learning Paths')}
            </h5>
            <p className="text-muted small mb-0">
              {t('lpProgressionSubtitle', 'Acompanhe os badges conquistados em cada Learning Path e Service Line')}
            </p>
          </div>
        </div>

        {loadingProgression ? (
          <div className="users-loading d-flex flex-column align-items-center justify-content-center py-4">
            <div className="users-spinner mb-2" style={{ width: '32px', height: '32px' }} />
            <span className="text-muted small">{t('loadingLpProgression', 'A carregar progresso nos Learning Paths...')}</span>
          </div>
        ) : lpProgressionGrouped.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            {t('noLpProgressionData', 'Ainda não existem Learning Paths ou Service Lines associados.')}
          </div>
        ) : (
          <div className="row g-4">
            {lpProgressionGrouped.map((lp) => {
              const isOpen = !!openLPs[lp.id_learning_path];
              const totalConquered = lp.service_lines.reduce((sum, sl) => sum + (sl.badges_conquistados || 0), 0);
              const totalBadges = lp.service_lines.reduce((sum, sl) => sum + (sl.badges_total || 0), 0);

              return (
                <div key={lp.id_learning_path} className="col-12">
                  <div className="border rounded-4 bg-light-subtle shadow-xs overflow-hidden" style={{ borderColor: 'var(--sidebar-border)' }}>
                    {/* Header Clicável (Acordeão) */}
                    <div
                      className="p-3 p-md-4 d-flex align-items-center justify-content-between gap-3 cursor-pointer select-none"
                      onClick={() => toggleLP(lp.id_learning_path)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                      title={isOpen ? t('clickToCollapse', 'Clique para recolher') : t('clickToExpand', 'Clique para expandir')}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded-3 bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="6" cy="6" r="3" />
                            <circle cx="18" cy="18" r="3" />
                            <path d="M9 6h4a2 2 0 0 1 2 2v8a2 2 0 0 0 2 2h1" />
                          </svg>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1 text-truncate" style={{ fontSize: '1.1rem', color: 'var(--text)' }}>
                            {lp.lp_nome}
                          </h6>
                          <span className="text-muted small">
                            {lp.service_lines.length} {lp.service_lines.length === 1 ? 'Service Line' : 'Service Lines'} • {totalConquered} / {totalBadges} Badges
                          </span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-white border text-dark fw-semibold d-none d-sm-inline-block px-3 py-2 rounded-pill" style={{ borderColor: 'var(--sidebar-border)' }}>
                          {isOpen ? t('collapseText', 'Recolher') : t('expandText', 'Expandir')}
                        </span>
                        <div
                          className="d-flex align-items-center justify-content-center text-muted"
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s ease',
                            width: '28px',
                            height: '28px'
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo Expandido do Acordeão */}
                    {isOpen && (
                      <div className="p-3 p-md-4 pt-0 border-top bg-white" style={{ borderColor: 'var(--sidebar-border)' }}>
                        <div className="row g-3 mt-1">
                          {lp.service_lines.map((sl) => (
                            <div key={sl.id_service_line} className="col-12 col-md-6">
                              <div className="p-3 bg-light-subtle rounded-3 border h-100 d-flex flex-column justify-content-between" style={{ borderColor: 'var(--sidebar-border)' }}>
                                <div>
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <strong className="text-dark small fw-bold text-truncate" style={{ maxWidth: '65%' }}>
                                      {sl.sl_nome}
                                    </strong>
                                    <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: '0.8rem' }}>
                                      {t('percentCompleted', { percent: sl.percentagem, defaultValue: `${sl.percentagem}% Completo` })}
                                    </span>
                                  </div>
                                  
                                  <div className="d-flex justify-content-between text-muted small mb-2" style={{ fontSize: '0.78rem' }}>
                                    <span>
                                      {t('badgesConqueredCount', {
                                        conquered: sl.badges_conquistados,
                                        total: sl.badges_total,
                                        defaultValue: `${sl.badges_conquistados} de ${sl.badges_total} Badges Conquistados`
                                      })}
                                    </span>
                                    {sl.pontos_total > 0 && (
                                      <span>{sl.pontos_conquistados} / {sl.pontos_total} pts</span>
                                    )}
                                  </div>
                                </div>

                                <div className="progress mt-1" style={{ height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                                  <div
                                    className="progress-bar"
                                    style={{
                                      width: `${sl.percentagem}%`,
                                      backgroundColor: sl.percentagem === 100 ? '#16a34a' : 'var(--primary, #0d9488)',
                                      borderRadius: '4px',
                                      transition: 'width 0.6s ease'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Badges da Área de Preferência (Carrossel) */}
      {idArea && (
        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mt-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
                🎯 {t('preferredAreaBadgesTitle', 'Badges da sua Área de Preferência')}
              </h5>
              <p className="text-muted small mb-0">
                {t('preferredAreaBadgesSubtitle', 'Sugestões com base na sua área de interesse selecionada')}
              </p>
            </div>
            
            {preferredAreaBadges.length > 2 && (
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary rounded-circle" onClick={prevSlide} style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button className="btn btn-sm btn-outline-secondary rounded-circle" onClick={nextSlide} style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}
          </div>

          {loadingBadges ? (
            <div className="users-loading d-flex flex-column align-items-center justify-content-center py-4">
              <div className="users-spinner mb-2" style={{ width: '32px', height: '32px' }} />
              <span className="text-muted small">{t('loadingBadges', 'A carregar badges...')}</span>
            </div>
          ) : preferredAreaBadges.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              {t('noBadgesInArea', 'Não existem badges disponíveis para a sua área de preferência.')}
            </div>
          ) : (
            <div className="position-relative overflow-hidden">
              <div className="row g-3">
                {visibleBadges.map((badge) => (
                  <div key={badge.id_badge} className="col-12 col-md-6">
                    <CardBadgeConsultor
                      badge={badge}
                      candidatura={getBadgeCandidatura(badge.id_badge)}
                      onViewClick={() => setSelectedViewBadgeId(badge.id_badge)}
                      onApplyClick={() => setSelectedBadge(badge)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedBadge && (
        <CandidateBadgeModal
          badge={selectedBadge}
          candidatura={getBadgeCandidatura(selectedBadge.id_badge)}
          onClose={() => setSelectedBadge(null)}
          onRefreshData={handleRefreshData}
        />
      )}

      {selectedViewBadgeId && (
        <ViewBadgeModal
          badgeId={selectedViewBadgeId}
          onClose={() => setSelectedViewBadgeId(null)}
        />
      )}
    </div>
  );
}
