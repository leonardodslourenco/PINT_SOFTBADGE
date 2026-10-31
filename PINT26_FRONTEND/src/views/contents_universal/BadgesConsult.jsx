import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../../services/api';
import Swal from 'sweetalert2';
import CardBadgeConsultor from '../../components/CardBadgeConsultor';
import { useAppContext } from '../../context/AppContext';
import SearchBadges from '../../components/SearchBadges';
import ViewBadgeModal from '../../components/ViewBadgeModal';
import CandidateBadgeModal from '../../components/CandidateBadgeModal';
import ViewRecomendacaoBadge from '../../components/ViewRecomendacaoBadge';

const ITEMS_PER_PAGE = 4;

export default function BadgesConsult() {
  const { t, i18n } = useTranslation();
  const { socket, activeRole } = useAppContext();
  const [badges, setBadges] = useState([]);
  const [failedLogos, setFailedLogos] = useState({});
  const [serviceLines, setServiceLines] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSl, setSelectedSl] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Level filtering states
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [levels, setLevels] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(false);

  // Modal states
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [selectedViewBadgeId, setSelectedViewBadgeId] = useState(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resBadges, resApps, resSl, resAreas] = await Promise.all([
        api.get('/badge?ativo=true'),
        api.get('/candidatura_badge'),
        api.get('/service_line?ativo=true'),
        api.get('/area?ativo=true')
      ]);

      if (resBadges.data?.success) {
        setBadges(resBadges.data.data || []);
      }

      if (resApps.data?.success) {
        setMyApplications(resApps.data.data || []);
      }

      if (resSl.data?.success) {
        setServiceLines(resSl.data.data || []);
      }

      if (resAreas.data?.success) {
        setAllAreas(resAreas.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, i18n.language, activeRole]);

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

  // Filter areas based on the selected Service Line
  const filteredAreasOptions = useMemo(() => {
    if (selectedSl === 'all') {
      return allAreas;
    }
    return allAreas.filter(a => String(a.id_service_line) === String(selectedSl));
  }, [allAreas, selectedSl]);

  const handleSlChange = (val) => {
    setSelectedSl(val);
    setSelectedArea('all'); // Reset da área
  };

  // Fetch levels when the selected area changes
  useEffect(() => {
    if (selectedArea === 'all') {
      setLevels([]);
      setSelectedLevel('all');
      return;
    }

    const fetchLevels = async () => {
      try {
        setLoadingLevels(true);
        const res = await api.get(`/nivel_area/area/${selectedArea}`);
        if (res.data?.success) {
          setLevels(res.data.data || []);
        } else {
          setLevels([]);
        }
      } catch (err) {
        console.error('Error fetching area levels:', err);
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
  }, [searchQuery, selectedSl, selectedArea, selectedLevel]);

  // Filter logic
  const filteredBadges = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return badges.filter(b => {
      if (!b) return false;
      const bTitle = typeof b.titulo === 'string' ? b.titulo : (b.titulo?.pt || b.titulo?.en || '');
      const bDesc = typeof b.descricao === 'string' ? b.descricao : (b.descricao?.pt || b.descricao?.en || '');

      const matchesSearch = !q || bTitle.toLowerCase().includes(q) || bDesc.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      // Localiza o objeto área do badge por ID ou nome
      const badgeAreaStr = typeof b.area === 'string' ? b.area.toLowerCase() : '';
      const badgeArea = allAreas.find(a =>
        (b.id_area && String(a.id_area) === String(b.id_area)) ||
        (typeof a.area === 'string' && badgeAreaStr && a.area.toLowerCase() === badgeAreaStr)
      );

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
  }, [badges, searchQuery, selectedSl, selectedArea, selectedLevel, allAreas]);

  // Total pages computation
  const totalPages = Math.max(1, Math.ceil(filteredBadges.length / ITEMS_PER_PAGE));

  // Paginated items
  const paginatedBadges = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBadges.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBadges, currentPage]);

  // Get application status for a badge
  const getBadgeCandidatura = useCallback((badgeId) => {
    // 1. Procurar candidatura ativa em progresso (Rascunho, Submetida, Validação) ou Aprovada
    const active = myApplications.find(a => a.id_badge === badgeId && a.id_estado_candidatura !== 5);
    if (active) return active;
    // 2. Se não existir nenhuma ativa/aprovada, devolve a última candidatura rejeitada (CLOSED_NOK)
    return myApplications.find(a => a.id_badge === badgeId && a.id_estado_candidatura === 5);
  }, [myApplications]);

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1 text-gradient-teal-blue">{t('menuBadges')}</h3>
        <p className="text-muted small mb-0">{t('badgesCatalogSubtitle')}</p>
      </div>

      {/* Toolbar: Search + Area Filter */}
      <SearchBadges
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSl={selectedSl}
        setSelectedSl={handleSlChange}
        selectedArea={selectedArea}
        setSelectedArea={setSelectedArea}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        levels={levels}
        serviceLines={serviceLines}
        allAreas={allAreas}
        placeholder={t('searchBadgePlaceholder')}
      />

      {/* Recommended Badges Carousel */}
      <ViewRecomendacaoBadge
        onViewClick={(badgeId) => setSelectedViewBadgeId(badgeId)}
        onApplyClick={(badge) => setSelectedBadge(badge)}
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
                    candidatura={getBadgeCandidatura(badge.id_badge)}
                    onViewClick={() => setSelectedViewBadgeId(badge.id_badge)}
                    onApplyClick={() => setSelectedBadge(badge)}
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

      {selectedBadge && (
        <CandidateBadgeModal
          badge={selectedBadge}
          candidatura={getBadgeCandidatura(selectedBadge.id_badge)}
          onClose={() => setSelectedBadge(null)}
          onRefreshData={fetchData}
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
