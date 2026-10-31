import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { authStorage } from '../services/authStorage';

const LIMIT_OPTIONS = [3, 6, 9, 12];

export default function ViewRecomendacaoBadge({ onViewClick, onApplyClick }) {
  const { t, i18n } = useTranslation();
  const { user, setUser, socket, activeRole, refreshSession } = useAppContext();
  
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(user?.recomendacoes_badge || 3);
  const [savingLimit, setSavingLimit] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [failedLogos, setFailedLogos] = useState({});

  // Monitor screen resize for responsive card limits
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch recommended badges
  const fetchRecommendations = useCallback(async (customLimit = null) => {
    try {
      setLoading(true);
      // If customLimit is explicitly passed, use it; otherwise let backend read user's saved DB preference
      const queryParam = customLimit 
        ? `?limit=${customLimit}&lang=${i18n.language}` 
        : `?lang=${i18n.language}`;

      const res = await api.get(`/metricas/con-dashboard/recomendacoes-badges${queryParam}`);
      if (res.data?.success && res.data.data) {
        setBadges(res.data.data.badges || []);
        if (res.data.data.limite_configurado) {
          const loadedLimit = Number(res.data.data.limite_configurado);
          setLimit(loadedLimit);
          if (user && user.recomendacoes_badge !== loadedLimit) {
            const updatedUser = { ...user, recomendacoes_badge: loadedLimit };
            authStorage.setUser(updatedUser);
            if (setUser) setUser(updatedUser);
          }
        }
      } else {
        setBadges([]);
      }
    } catch (err) {
      console.error('Error fetching recommended badges:', err);
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }, [i18n.language, user, setUser]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      fetchRecommendations();
    };

    socket.on('badge_updated', handleRealtimeUpdate);
    socket.on('candidatura_submetida', handleRealtimeUpdate);
    socket.on('candidatura_pre_aprovada', handleRealtimeUpdate);
    socket.on('candidatura_avancou', handleRealtimeUpdate);
    socket.on('candidatura_badge_emitido', handleRealtimeUpdate);
    socket.on('candidatura_rejeitada', handleRealtimeUpdate);
    socket.on('notification', handleRealtimeUpdate);
    socket.on('nova_notificacao', handleRealtimeUpdate);

    return () => {
      socket.off('badge_updated', handleRealtimeUpdate);
      socket.off('candidatura_submetida', handleRealtimeUpdate);
      socket.off('candidatura_pre_aprovada', handleRealtimeUpdate);
      socket.off('candidatura_avancou', handleRealtimeUpdate);
      socket.off('candidatura_badge_emitido', handleRealtimeUpdate);
      socket.off('candidatura_rejeitada', handleRealtimeUpdate);
      socket.off('notification', handleRealtimeUpdate);
      socket.off('nova_notificacao', handleRealtimeUpdate);
    };
  }, [socket, fetchRecommendations]);

  // Handle limit dropdown change, persist to backend, and update user state
  const handleLimitChange = async (e) => {
    const newLimit = Number(e.target.value);
    setLimit(newLimit);
    setCurrentIndex(0);

    const userId = user?.id_utilizador || user?.sub || user?.id;
    if (userId) {
      try {
        setSavingLimit(true);
        // 1. Guardar na BD
        await api.put(`/utilizador/${userId}`, { recomendacoes_badge: newLimit });

        // 2. Atualizar estado do utilizador em sessão
        const storedUser = authStorage.getUser() || user;
        if (storedUser) {
          const updatedUser = { ...storedUser, recomendacoes_badge: newLimit };
          authStorage.setUser(updatedUser);
          if (setUser) setUser(updatedUser);
        }
      } catch (err) {
        console.error('Error saving user recommendation limit:', err);
      } finally {
        setSavingLimit(false);
      }
    }

    fetchRecommendations(newLimit);
  };

  // Determine dynamic cards per slide:
  // limit === 3 -> 2 cards
  // limit === 6 or 9 -> 3 cards
  // limit === 12 -> 4 cards
  const desiredVisibleCount = useMemo(() => {
    if (limit === 3) return 2;
    if (limit === 6 || limit === 9) return 3;
    if (limit === 12) return 4;
    return 3;
  }, [limit]);

  // Responsive capping based on screen width
  const effectiveVisibleCount = useMemo(() => {
    let maxOnScreen = 4;
    if (windowWidth < 576) maxOnScreen = 1;
    else if (windowWidth < 992) maxOnScreen = Math.min(desiredVisibleCount, 2);
    else if (windowWidth < 1300) maxOnScreen = Math.min(desiredVisibleCount, 3);
    else maxOnScreen = desiredVisibleCount;
    return Math.max(1, maxOnScreen);
  }, [desiredVisibleCount, windowWidth]);

  // Circular slice of visible badges
  const visibleBadges = useMemo(() => {
    if (!badges || badges.length === 0) return [];
    const count = Math.min(badges.length, effectiveVisibleCount);
    const list = [];
    for (let i = 0; i < count; i++) {
      const idx = (currentIndex + i) % badges.length;
      list.push(badges[idx]);
    }
    return list;
  }, [badges, currentIndex, effectiveVisibleCount]);

  const prevSlide = () => {
    if (badges.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + badges.length) % badges.length);
  };

  const nextSlide = () => {
    if (badges.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % badges.length);
  };

  const renderReasonBadge = (reason) => {
    switch (reason) {
      case 'AREA_PREFERENCIAL':
        return (
          <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25" style={{ fontSize: '0.68rem', padding: '0.25em 0.6em' }}>
            🎯 {t('reasonAreaPreferencial', 'Área de Preferência')}
          </span>
        );
      case 'AREA_EXPLORADA':
        return (
          <span className="badge rounded-pill bg-info bg-opacity-10 text-info border border-info border-opacity-25" style={{ fontSize: '0.68rem', padding: '0.25em 0.6em' }}>
            🌐 {t('reasonAreaExplorada', 'Área Explorada')}
          </span>
        );
      case 'TENDENCIA_GLOBAL':
      default:
        return (
          <span className="badge rounded-pill bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25" style={{ fontSize: '0.68rem', padding: '0.25em 0.6em', color: '#b45309' }}>
            🔥 {t('reasonTendenciaGlobal', 'Tendência Global')}
          </span>
        );
    }
  };

  // Bootstrap column class based on effectiveVisibleCount
  const colClass = useMemo(() => {
    if (effectiveVisibleCount === 1) return 'col-12';
    if (effectiveVisibleCount === 2) return 'col-12 col-md-6';
    if (effectiveVisibleCount === 3) return 'col-12 col-md-6 col-lg-4';
    if (effectiveVisibleCount === 4) return 'col-12 col-md-6 col-lg-3';
    return 'col-12 col-md-6 col-lg-4';
  }, [effectiveVisibleCount]);

  return (
    <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-4 position-relative overflow-hidden" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
      {/* Header Row: Title & Subtitle + Limit Dropdown & Carousel Controls */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
        <div>
          <h5 className="fw-bold mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--text)' }}>
            <span>✨ {t('recommendedBadgesTitle', 'Badges Recomendados')}</span>
            {badges.length > 0 && (
              <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary fw-bold" style={{ fontSize: '0.72rem' }}>
                {badges.length}
              </span>
            )}
          </h5>
          <p className="text-muted small mb-0">
            {t('recommendedBadgesSubtitle', 'Sugestões inteligentes com base no seu perfil, histórico e popularidade')}
          </p>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Limit Selection Dropdown */}
          <div className="d-flex align-items-center gap-2">
            <label className="text-muted small fw-semibold mb-0" style={{ whiteSpace: 'nowrap' }}>
              {t('recommendationsLimitLabel', 'Exibir:')}
            </label>
            <select
              className="form-select form-select-sm"
              value={limit}
              onChange={handleLimitChange}
              disabled={loading || savingLimit}
              style={{
                width: '125px',
                backgroundColor: 'var(--panel-2)',
                color: 'var(--text)',
                borderColor: 'var(--sidebar-border)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600
              }}
            >
              {LIMIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {t('badgesOption', '{{count}} Badges', { count: opt })}
                </option>
              ))}
            </select>
          </div>

          {/* Carousel Arrows (Infinite Rotation) */}
          {badges.length > effectiveVisibleCount && (
            <div className="d-flex gap-1.5 align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center shadow-xs"
                onClick={prevSlide}
                style={{ width: '32px', height: '32px', padding: 0 }}
                title="Anterior"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center shadow-xs"
                onClick={nextSlide}
                style={{ width: '32px', height: '32px', padding: 0 }}
                title="Próximo"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body / Carousel Cards */}
      {loading ? (
        <div className="users-loading d-flex flex-column align-items-center justify-content-center py-4">
          <div className="users-spinner mb-2" style={{ width: '32px', height: '32px' }} />
          <span className="text-muted small">{t('loadingRecommendations', 'A carregar badges recomendados...')}</span>
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-4 text-muted small rounded-3 bg-light-subtle border p-3" style={{ borderColor: 'var(--sidebar-border)' }}>
          {t('noRecommendedBadges', 'Não existem recomendações de badges disponíveis de momento.')}
        </div>
      ) : (
        <div className="position-relative overflow-hidden">
          <div className="row g-3">
            {visibleBadges.map((badge, idx) => (
              <div key={`${badge.id_badge}-${idx}`} className={colClass}>
                <div
                  className="card h-100 p-3 rounded-4 shadow-sm border position-relative d-flex flex-column justify-content-between"
                  style={{
                    backgroundColor: 'var(--panel-2)',
                    borderColor: 'var(--sidebar-border)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Top Badge Reason Chip & Level */}
                  <div>
                    <div className="d-flex align-items-start justify-content-between gap-1 mb-2">
                      <div className="text-truncate" style={{ maxWidth: '65%' }}>
                        {renderReasonBadge(badge.motivo_recomendacao)}
                      </div>
                      <span
                        className="badge bg-white border text-dark fw-bold px-2 py-1 rounded-pill"
                        style={{ fontSize: '0.68rem', borderColor: 'var(--sidebar-border)', whiteSpace: 'nowrap' }}
                      >
                        {badge.nivel ? `Nível ${badge.nivel}` : 'Geral'}
                      </span>
                    </div>

                    {/* Logo and Title */}
                    <div className="d-flex align-items-center gap-2.5 my-2">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center p-1 border flex-shrink-0 bg-white shadow-xs"
                        style={{ width: '44px', height: '44px', borderColor: 'var(--sidebar-border)' }}
                      >
                        {badge.logo && !failedLogos[badge.id_badge] ? (
                          <img
                            src={`${API_BASE_URL}/uploads/logo_badges/${badge.logo}`}
                            alt={badge.titulo}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={() => setFailedLogos((prev) => ({ ...prev, [badge.id_badge]: true }))}
                          />
                        ) : (
                          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary">
                            <circle cx="12" cy="8" r="7" />
                            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                          </svg>
                        )}
                      </div>

                      <div style={{ overflow: 'hidden', minWidth: 0 }}>
                        <h6
                          className="fw-bold mb-0 text-truncate"
                          style={{ color: 'var(--text)', fontSize: '0.92rem' }}
                          title={badge.titulo}
                        >
                          {badge.titulo}
                        </h6>
                        <span className="text-muted small d-block text-truncate" style={{ fontSize: '0.72rem' }}>
                          {badge.area_nome || 'Área'}
                        </span>
                      </div>
                    </div>

                    {/* Points & Description preview */}
                    <div className="d-flex align-items-center justify-content-between my-2 pt-1">
                      <span className="badge bg-warning bg-opacity-10 text-dark fw-bold px-2 py-0.5 rounded" style={{ fontSize: '0.72rem' }}>
                        ⭐ {badge.pontos} pts
                      </span>
                      {badge.total_conquistas_comunidade > 0 && (
                        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                          👥 {badge.total_conquistas_comunidade} {badge.total_conquistas_comunidade === 1 ? 'conquista' : 'conquistas'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="border-top pt-2.5 mt-2 d-flex justify-content-end gap-2" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <button
                      type="button"
                      className="btn btn-sm fw-bold px-2.5 py-1 rounded-2"
                      style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', border: 'none', fontSize: '0.75rem' }}
                      onClick={() => onViewClick && onViewClick(badge.id_badge)}
                    >
                      {t('viewBtn', 'Ver')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary fw-bold px-2.5 py-1 rounded-2 shadow-xs"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => onApplyClick && onApplyClick(badge)}
                    >
                      {t('candidatarBtn', 'Candidatar-se')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
