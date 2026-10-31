import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import ViewBadgeModal from '../../components/ViewBadgeModal';
import ViewApplicationDetailsModal from '../../components/ViewApplicationDetailsModal';
import ClearFiltersBtn from '../../components/ClearFiltersBtn';

const ESTADOS = {
  1: { class: 'open', textKey: 'statusOpen' },
  2: { class: 'submitted', textKey: 'statusSubmitted' },
  3: { class: 'validation', textKey: 'statusValidacao' },
  4: { class: 'closed-ok', textKey: 'statusClosedOk' },
  5: { class: 'closed-nok', textKey: 'statusClosedNok' }
};

export default function AllApplicationsManagement() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'pt';
  const { socket } = useAppContext();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterArea, setFilterArea] = useState('all');
  const [filterSL, setFilterSL] = useState('all');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterConsultor, setFilterConsultor] = useState('all');
  const [filterBadge, setFilterBadge] = useState('all');

  // Details modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [appDetails, setAppDetails] = useState(null);

  // View Badge modal
  const [selectedViewBadgeId, setSelectedViewBadgeId] = useState(null);

  // Service Lines list (for filter dropdown)
  const [serviceLines, setServiceLines] = useState([]);
  
  // All Areas list (for dynamic filter dropdown)
  const [allAreas, setAllAreas] = useState([]);

  const getStatusBadgeClass = (app) => {
    const statusId = app?.id_estado_candidatura;
    const map = ESTADOS[statusId] || { class: 'open' };
    return `users-status-badge ${map.class}`;
  };

  const getStatusText = (app) => {
    const statusId = app?.id_estado_candidatura;
    const map = ESTADOS[statusId] || { textKey: 'statusOpen' };
    return t(map.textKey);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fetch all applications + badges + service lines + areas
  const fetchApplications = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [resApps, resBadges, resSL, resAreas] = await Promise.all([
        api.get('/candidatura_badge').catch(err => {
          console.error('Erro ao obter candidaturas:', err);
          return { data: { success: false, data: [] } };
        }),
        api.get('/badge/catalogo?ativo=true').catch(() => api.get('/badge?ativo=true')).catch(() => ({ data: { success: false, data: [] } })),
        api.get('/service_line').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/area?ativo=true').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      let rawApps = [];
      let badgesMap = {};

      if (resBadges.data?.success && Array.isArray(resBadges.data.data)) {
        resBadges.data.data.forEach(b => {
          badgesMap[b.id_badge] = b;
        });
      }

      if (resApps.data?.success && Array.isArray(resApps.data.data)) {
        rawApps = resApps.data.data || [];
      }

      if (resSL.data?.success && Array.isArray(resSL.data.data)) {
        setServiceLines(resSL.data.data || []);
      }

      if (resAreas.data?.success && Array.isArray(resAreas.data.data)) {
        setAllAreas(resAreas.data.data || []);
      }

      const enriched = rawApps.map(app => {
        if (!app) return null;
        const badgeInfo = badgesMap[app.id_badge];
        const badgeObj = app.badge || {};
        
        return {
          ...app,
          badge: {
            ...badgeObj,
            titulo: badgeInfo?.titulo || badgeObj.traducao_titulo?.[currentLang] || '—',
            area: badgeInfo?.area || badgeObj.nivel_area?.area?.nome_area || '—',
            area_traducao: badgeInfo?.area_traducao || badgeObj.nivel_area?.area?.traducao_area || null,
            descricao: badgeInfo?.descricao || badgeObj.traducao_descricao?.[currentLang] || badgeObj.descricao || '—',
            id_service_line: badgeObj.nivel_area?.area?.id_service_line || null,
            id_area: badgeObj.nivel_area?.id_area_sl || null
          }
        };
      }).filter(Boolean);

      setApplications(enriched);
    } catch (err) {
      console.error('Error fetching all applications:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [currentLang]);

  useEffect(() => {
    fetchApplications(false);
  }, [fetchApplications]);

  // WebSocket real-time updates (silent re-fetch without showing loading spinner)
  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        setTimeout(() => fetchApplications(true), 400);
      };
      socket.on('candidatura_submetida', handleUpdate);
      socket.on('candidatura_pre_aprovada', handleUpdate);
      socket.on('candidatura_avancou', handleUpdate);
      socket.on('candidatura_badge_emitido', handleUpdate);
      return () => {
        socket.off('candidatura_submetida', handleUpdate);
        socket.off('candidatura_pre_aprovada', handleUpdate);
        socket.off('candidatura_avancou', handleUpdate);
        socket.off('candidatura_badge_emitido', handleUpdate);
      };
    }
  }, [socket, fetchApplications]);

  // Filter Service Lines
  const uniqueSLs = useMemo(() => {
    const sls = [];
    serviceLines.forEach(sl => {
      const name = sl.service_line || `SL ${sl.id_service_line}`;
      sls.push({ id: sl.id_service_line, name });
    });
    return sls;
  }, [serviceLines]);

  // Filter Areas dynamically based on selected SL
  const dropdownFilteredAreas = useMemo(() => {
    const filtered = filterSL === 'all'
      ? allAreas
      : allAreas.filter(a => String(a.id_service_line) === String(filterSL));
    
    return filtered.map(a => ({
      id: a.id_area,
      name: a.area || `Área ${a.id_area}`
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allAreas, filterSL]);

  const uniqueConsultores = useMemo(() => {
    const map = {};
    applications.forEach(app => {
      if (app.consultor?.id_utilizador) {
        map[app.consultor.id_utilizador] = `${app.consultor.nome || ''} ${app.consultor.apelido || ''}`.trim();
      }
    });
    return Object.entries(map).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [applications]);

  const uniqueBadges = useMemo(() => {
    const map = {};
    applications.forEach(app => {
      if (app.id_badge && app.badge?.titulo) {
        map[app.id_badge] = app.badge.titulo;
      }
    });
    return Object.entries(map).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [applications]);

  // Handle changes to Service Line
  const handleSLChange = (slValue) => {
    setFilterSL(slValue);
    setFilterArea('all'); // Reset area to 'all' as requested
  };

  // Apply filters
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // Filter by service line
      if (filterSL !== 'all') {
        if (String(app.badge?.id_service_line) !== String(filterSL)) return false;
      }
      // Filter by area
      if (filterArea !== 'all') {
        if (String(app.badge?.id_area) !== String(filterArea)) return false;
      }
      // Filter by estado
      if (filterEstado !== 'all') {
        if (String(app.id_estado_candidatura) !== String(filterEstado)) return false;
      }
      // Filter by consultor
      if (filterConsultor !== 'all') {
        if (app.consultor?.id_utilizador !== filterConsultor) return false;
      }
      // Filter by badge
      if (filterBadge !== 'all') {
        if (app.id_badge !== filterBadge) return false;
      }
      return true;
    });
  }, [applications, filterArea, filterSL, filterEstado, filterConsultor, filterBadge]);

  // Open details modal
  const handleOpenDetails = async (appId) => {
    setSelectedApp(appId);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/candidatura_badge/${appId}`);
      if (res.data?.success) {
        const app = res.data.data;
        const matched = applications.find(a => a.id_candidatura === appId);
        setAppDetails({
          ...app,
          badge: {
            ...app.badge,
            titulo: matched?.badge?.titulo || app.badge?.traducao_titulo?.[currentLang] || '—',
            area: matched?.badge?.area || '—',
            descricao: matched?.badge?.descricao || app.badge?.traducao_descricao?.[currentLang] || '—'
          }
        });
      }
    } catch (err) {
      console.error('Error loading application details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedApp(null);
    setAppDetails(null);
  };

  const selectStyle = {
    borderRadius: '8px',
    fontSize: '0.82rem',
    padding: '6px 10px',
    border: '1px solid var(--sidebar-border, #dee2e6)',
    backgroundColor: 'var(--panel-2, #fff)',
    color: 'var(--text, #495057)',
    minWidth: '160px'
  };

  const areFiltersActive = useMemo(() => {
    return filterSL !== 'all' || filterArea !== 'all' || filterEstado !== 'all' || filterConsultor !== 'all' || filterBadge !== 'all';
  }, [filterSL, filterArea, filterEstado, filterConsultor, filterBadge]);

  const handleClearFilters = () => {
    setFilterSL('all');
    setFilterArea('all');
    setFilterEstado('all');
    setFilterConsultor('all');
    setFilterBadge('all');
  };

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1">{t('allAppsTitle')}</h3>
        <p className="text-muted small mb-0">{t('allAppsSubtitle')}</p>
      </div>

      {/* Filters Row */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {/* Filter by Service Line */}
          <select
            className="form-select form-select-sm"
            style={selectStyle}
            value={filterSL}
            onChange={(e) => handleSLChange(e.target.value)}
          >
            <option value="all">{t('allAppsAllSL')}</option>
            {uniqueSLs.map((sl) => (
              <option key={sl.id} value={sl.id}>{sl.name}</option>
            ))}
          </select>

          {/* Filter by Area */}
          <select
            className="form-select form-select-sm"
            style={selectStyle}
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
          >
            <option value="all">{t('allAppsAllAreas')}</option>
            {dropdownFilteredAreas.map((area) => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>

          {/* Filter by Estado */}
          <select
            className="form-select form-select-sm"
            style={selectStyle}
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="all">{t('allAppsAllEstados')}</option>
            {Object.entries(ESTADOS).map(([key, val]) => (
              <option key={key} value={key}>{t(val.textKey)}</option>
            ))}
          </select>

          {/* Filter by Consultor */}
          <select
            className="form-select form-select-sm"
            style={selectStyle}
            value={filterConsultor}
            onChange={(e) => setFilterConsultor(e.target.value)}
          >
            <option value="all">{t('allAppsAllConsultores')}</option>
            {uniqueConsultores.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Filter by Badge */}
          <select
            className="form-select form-select-sm"
            style={selectStyle}
            value={filterBadge}
            onChange={(e) => setFilterBadge(e.target.value)}
          >
            <option value="all">{t('allAppsAllBadges')}</option>
            {uniqueBadges.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Botão Limpar Filtros */}
          <ClearFiltersBtn 
            onClear={handleClearFilters} 
            disabled={!areFiltersActive} 
          />
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-muted small mb-3">
          {t('allAppsShowing').replace('{{shown}}', filteredApps.length).replace('{{total}}', applications.length)}
        </p>
      )}

      {/* Table */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="users-spinner" />
            <span>{t('allAppsLoading')}</span>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('allAppsColBadge')}</th>
                  <th>{t('allAppsColSL')}</th>
                  <th>{t('allAppsColArea')}</th>
                  <th>{t('allAppsColConsultor')}</th>
                  <th>{t('allAppsColDate')}</th>
                  <th>{t('allAppsColEstado')}</th>
                  <th className="text-end">{t('allAppsColActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="users-empty-row">
                      {t('allAppsNoResults')}
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const areaName = app.badge?.area_traducao?.[currentLang] || app.badge?.area || '—';
                    const slId = app.badge?.id_service_line;
                    const slObj = serviceLines.find(s => s.id_service_line === slId);
                    const slName = slObj?.service_line || '—';

                    return (
                      <tr key={app.id_candidatura}>
                        <td>
                          <div className="d-flex flex-column">
                            <strong className="text-dark" style={{ fontSize: '0.85rem' }}>{app.badge?.titulo || '—'}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="text-muted small">{slName}</span>
                        </td>
                        <td>
                          <span className="text-muted small">{areaName}</span>
                        </td>
                        <td className="users-name-cell">
                          <div className="d-flex flex-column">
                            <strong className="text-dark">{app.consultor?.nome} {app.consultor?.apelido}</strong>
                            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>{app.consultor?.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-muted small">{formatDate(app.data_candidatura)}</span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(app)}>
                            {getStatusText(app)}
                          </span>
                        </td>
                        <td>
                          <div className="users-actions-cell">
                            <button
                              className="users-action-btn edit"
                              onClick={() => handleOpenDetails(app.id_candidatura)}
                            >
                              <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                              <span>{t('allAppsViewDetails')}</span>
                            </button>
                            <button
                              className="users-action-btn view"
                              onClick={() => setSelectedViewBadgeId(app.id_badge)}
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>{t('allAppsViewBtn')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ViewApplicationDetailsModal
        appId={selectedApp}
        onClose={handleCloseDetails}
        isConsultantView={false}
      />

      {/* View Badge Modal */}
      {selectedViewBadgeId && (
        <ViewBadgeModal
          badgeId={selectedViewBadgeId}
          onClose={() => setSelectedViewBadgeId(null)}
        />
      )}
    </div>
  );
}
