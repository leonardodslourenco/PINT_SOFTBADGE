import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import CardBadgeConsultor from '../../components/CardBadgeConsultor';
import { useAppContext } from '../../context/AppContext';
import SearchBadges from '../../components/SearchBadges';
import ViewBadgeCatalogModal from '../../components/ViewBadgeCatalogModal';

const ITEMS_PER_PAGE = 4;

export default function BadgesList() {
  const { t, i18n } = useTranslation();
  const { socket, activeRole } = useAppContext();
  const [badges, setBadges] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLp, setSelectedLp] = useState('all');
  const [selectedSl, setSelectedSl] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [levels, setLevels] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // View modal state
  const [selectedViewBadgeId, setSelectedViewBadgeId] = useState(null);

  // Fetch catalog and filter dropdown data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resBadges, resLp, resSl, resAreas] = await Promise.all([
        api.get('/badge/catalogo?ativo=true'),
        api.get('/learning_path?ativo=true'),
        api.get('/service_line?ativo=true'),
        api.get('/area?ativo=true')
      ]);

      if (resBadges.data?.success) {
        setBadges(resBadges.data.data || []);
      }

      if (resLp.data?.success) {
        setLearningPaths(resLp.data.data || []);
      }

      if (resSl.data?.success) {
        setServiceLines(resSl.data.data || []);
      }

      if (resAreas.data?.success) {
        setAllAreas(resAreas.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching badges catalog data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, i18n.language, activeRole]);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;
    const handleRealtimeUpdate = () => {
      fetchData();
    };

    socket.on('notification', handleRealtimeUpdate);
    socket.on('gestao_area', handleRealtimeUpdate);
    socket.on('badge_updated', handleRealtimeUpdate);
    socket.on('requisito_updated', handleRealtimeUpdate);

    return () => {
      socket.off('notification', handleRealtimeUpdate);
      socket.off('gestao_area', handleRealtimeUpdate);
      socket.off('badge_updated', handleRealtimeUpdate);
      socket.off('requisito_updated', handleRealtimeUpdate);
    };
  }, [socket, fetchData]);

  // Fetch levels when area changes using the catalog-specific endpoint
  useEffect(() => {
    if (selectedArea === 'all') {
      setLevels([]);
      setSelectedLevel('all');
      return;
    }

    const fetchLevels = async () => {
      try {
        setLoadingLevels(true);
        const res = await api.get(`/nivel_area/catalogo/area/${selectedArea}`);
        if (res.data?.success) {
          setLevels(res.data.data || []);
        } else {
          setLevels([]);
        }
      } catch (err) {
        console.error('Error fetching area levels for catalog:', err);
        setLevels([]);
      } finally {
        setLoadingLevels(false);
      }
    };

    fetchLevels();
    setSelectedLevel('all');
  }, [selectedArea]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLp, selectedSl, selectedArea, selectedLevel]);

  // Filter badges in memory
  const filteredBadges = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return badges.filter(b => {
      if (!b) return false;
      const bTitle = typeof b.titulo === 'string' ? b.titulo : (b.titulo?.pt || b.titulo?.en || '');
      const bDesc = typeof b.descricao === 'string' ? b.descricao : (b.descricao?.pt || b.descricao?.en || '');

      const matchesSearch = !q || bTitle.toLowerCase().includes(q) || bDesc.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      // Localiza área e SL se necessário para fallback
      const badgeArea = allAreas.find(a =>
        (b.id_area && String(a.id_area) === String(b.id_area)) ||
        (typeof a.area === 'string' && b.area && a.area.toLowerCase() === b.area.toLowerCase())
      );

      // Filtro de Learning Path
      if (selectedLp !== 'all') {
        const badgeLpId = b.id_learning_path || badgeArea?.id_learning_path || serviceLines.find(sl => String(sl.id_service_line) === String(b.id_service_line || badgeArea?.id_service_line))?.id_learning_path;
        if (String(badgeLpId) !== String(selectedLp)) {
          return false;
        }
      }

      // Filtro de Service Line
      if (selectedSl !== 'all') {
        const badgeSlId = b.id_service_line || badgeArea?.id_service_line;
        if (String(badgeSlId) !== String(selectedSl)) {
          return false;
        }
      }

      // Filtro de Área
      if (selectedArea !== 'all') {
        const badgeAreaId = b.id_area || badgeArea?.id_area;
        if (String(badgeAreaId) !== String(selectedArea)) {
          return false;
        }
      }

      // Filtro de Nível
      if (selectedArea !== 'all' && selectedLevel !== 'all') {
        if (String(b.id_nivel_area) !== String(selectedLevel)) {
          return false;
        }
      }

      return true;
    });
  }, [badges, searchQuery, selectedLp, selectedSl, selectedArea, selectedLevel, allAreas, serviceLines]);

  // Total pages computation
  const totalPages = Math.max(1, Math.ceil(filteredBadges.length / ITEMS_PER_PAGE));

  // Paginated badges
  const paginatedBadges = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBadges.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBadges, currentPage]);

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1 text-gradient-teal-blue">{t('menuBadges')}</h3>
        <p className="text-muted small mb-0">{t('badgesCatalogSubtitle')}</p>
      </div>

      {/* Toolbar: Search + LP + SL + Area + Level Filters */}
      <SearchBadges
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedLp={selectedLp}
        setSelectedLp={setSelectedLp}
        learningPaths={learningPaths}
        selectedSl={selectedSl}
        setSelectedSl={setSelectedSl}
        selectedArea={selectedArea}
        setSelectedArea={setSelectedArea}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        levels={levels}
        serviceLines={serviceLines}
        allAreas={allAreas}
        placeholder={t('searchBadgePlaceholder')}
      />

      {/* Badges Grid */}
      {loading ? (
        <div className="users-loading d-flex flex-column align-items-center justify-content-center py-5">
          <div className="users-spinner mb-3" />
          <span className="text-muted small fw-semibold">{t('loadingBadges')}</span>
        </div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            {paginatedBadges.length === 0 ? (
              <div className="col-12 text-center p-5 text-muted">
                {t('noBadgesFound')}
              </div>
            ) : (
              paginatedBadges.map((badge) => (
                <div key={badge.id_badge} className="col-12 col-md-6">
                  <CardBadgeConsultor
                    badge={badge}
                    onViewClick={() => setSelectedViewBadgeId(badge.id_badge)}
                  />
                </div>
              ))
            )}
          </div>

          {/* Footer: pagination controls */}
          {filteredBadges.length > 0 && (
            <div className="users-table-footer d-flex justify-content-between align-items-center p-3 border rounded-4 bg-panel" style={{ borderColor: 'var(--sidebar-border)' }}>
              <span className="users-count-text small text-muted">
                {t('showingBadges', { shown: paginatedBadges.length, total: filteredBadges.length })}
              </span>

              <div className="chart-pagination d-flex align-items-center gap-2">
                <button
                  className="chart-pag-btn btn btn-sm border"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <span className="chart-pag-info fw-bold small text-muted mx-2">{currentPage} / {totalPages}</span>
                <button
                  className="chart-pag-btn btn btn-sm border"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de visualização dos detalhes do badge */}
      {selectedViewBadgeId && (
        <ViewBadgeCatalogModal
          badgeId={selectedViewBadgeId}
          onClose={() => setSelectedViewBadgeId(null)}
        />
      )}
    </div>
  );
}
