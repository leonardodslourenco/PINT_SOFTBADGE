import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import SearchBar from './SearchBar';
import ClearFiltersBtn from './ClearFiltersBtn';

export default function SearchBadges({
  searchQuery = '',
  setSearchQuery,
  selectedLp = 'all',
  setSelectedLp,
  learningPaths = [],
  selectedSl = 'all',
  setSelectedSl,
  selectedArea = 'all',
  setSelectedArea,
  selectedLevel,
  setSelectedLevel,
  levels = [],
  serviceLines = [],
  allAreas = [],
  placeholder
}) {
  const { t } = useTranslation();

  // Filter Service Lines based on selected Learning Path (if LP dropdown is enabled)
  const filteredServiceLinesOptions = useMemo(() => {
    if (!selectedLp || selectedLp === 'all') {
      return serviceLines || [];
    }
    return (serviceLines || []).filter(sl => String(sl.id_learning_path) === String(selectedLp));
  }, [serviceLines, selectedLp]);

  // Filter areas based on selected Service Line or Learning Path
  const filteredAreasOptions = useMemo(() => {
    let areas = allAreas || [];
    if (selectedSl !== 'all') {
      return areas.filter(a => String(a.id_service_line) === String(selectedSl));
    }
    if (selectedLp && selectedLp !== 'all') {
      const allowedSlIds = new Set(filteredServiceLinesOptions.map(sl => String(sl.id_service_line)));
      return areas.filter(a => allowedSlIds.has(String(a.id_service_line)));
    }
    return areas;
  }, [allAreas, selectedSl, selectedLp, filteredServiceLinesOptions]);

  const handleLpChange = (e) => {
    const val = e.target.value;
    if (setSelectedLp) setSelectedLp(val);
    if (setSelectedSl) setSelectedSl('all');
    if (setSelectedArea) setSelectedArea('all');
    if (setSelectedLevel) setSelectedLevel('all');
  };

  const handleSlChange = (e) => {
    const val = e.target.value;
    if (setSelectedSl) setSelectedSl(val);
    if (setSelectedArea) setSelectedArea('all'); // Reset Area
    if (setSelectedLevel) setSelectedLevel('all'); // Reset Level
  };

  const handleAreaChange = (e) => {
    const val = e.target.value;
    if (setSelectedArea) setSelectedArea(val);
    if (setSelectedLevel) setSelectedLevel('all'); // Reset Level
  };

  const isAnyFilterActive = useMemo(() => {
    const isLpActive = selectedLp && selectedLp !== 'all';
    const isSlActive = selectedSl && selectedSl !== 'all';
    const isAreaActive = selectedArea && selectedArea !== 'all';
    const isLevelActive = selectedLevel && selectedLevel !== 'all';
    const isSearchActive = Boolean(searchQuery && searchQuery.trim() !== '');
    return isLpActive || isSlActive || isAreaActive || isLevelActive || isSearchActive;
  }, [selectedLp, selectedSl, selectedArea, selectedLevel, searchQuery]);

  const handleClearFilters = () => {
    if (setSelectedLp) setSelectedLp('all');
    if (setSelectedSl) setSelectedSl('all');
    if (setSelectedArea) setSelectedArea('all');
    if (setSelectedLevel) setSelectedLevel('all');
    if (setSearchQuery) setSearchQuery('');
  };

  return (
    <div 
      className="users-toolbar shadow-sm rounded-4 p-3 mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between border"
      style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
    >
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={placeholder || t('searchBadgePlaceholder', 'Pesquisar por título ou descrição...')}
        style={{ maxWidth: '300px', flex: 1 }}
      />

      <div className="d-flex gap-2 flex-wrap align-items-center">
        {/* Dropdown 0: Learning Path (optional) */}
        {learningPaths && learningPaths.length > 0 && (
          <div className="users-filter-wrapper position-relative" style={{ minWidth: '180px' }}>
            <select
              className="form-select rounded-3 py-2 px-3 fw-medium cursor-pointer"
              value={selectedLp}
              onChange={handleLpChange}
              style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
            >
              <option value="all">{t('allLearningPaths', 'Todos os Learning Paths')}</option>
              {learningPaths.map((lp) => (
                <option key={lp.id_learning_path} value={lp.id_learning_path}>
                  {typeof lp.learning_path === 'string' ? lp.learning_path : (lp.learning_path?.pt || lp.learning_path?.en || `LP #${lp.id_learning_path}`)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dropdown 1: Service Line */}
        <div className="users-filter-wrapper position-relative" style={{ minWidth: '180px' }}>
          <select
            className="form-select rounded-3 py-2 px-3 fw-medium cursor-pointer"
            value={selectedSl}
            onChange={handleSlChange}
            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
          >
            <option value="all">{t('allServiceLines', 'Todas as Linhas de Serviço')}</option>
            {(filteredServiceLinesOptions || []).map((sl) => (
              <option key={sl.id_service_line} value={sl.id_service_line}>
                {typeof sl.service_line === 'string' ? sl.service_line : (sl.service_line?.pt || sl.service_line?.en || 'Service Line')}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: Área */}
        <div className="users-filter-wrapper position-relative" style={{ minWidth: '180px' }}>
          <select
            className="form-select rounded-3 py-2 px-3 fw-medium cursor-pointer"
            value={selectedArea}
            onChange={handleAreaChange}
            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
          >
            <option value="all">{t('allAreas', 'Todas as Áreas')}</option>
            {(filteredAreasOptions || []).map((area) => (
              <option key={area.id_area} value={area.id_area || area.area}>
                {typeof area.area === 'string' ? area.area : (area.area?.pt || area.area?.en || 'Área')}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 3: Nível */}
        {selectedLevel !== undefined && (
          <div className="users-filter-wrapper position-relative" style={{ minWidth: '180px' }}>
            <select
              className="form-select rounded-3 py-2 px-3 fw-medium cursor-pointer"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel && setSelectedLevel(e.target.value)}
              disabled={selectedArea === 'all'}
              style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
            >
              {selectedArea === 'all' ? (
                <option value="all">{t('selectAreaFirst', 'Selecione a área primeiro')}</option>
              ) : (
                <>
                  <option value="all">{t('allLevels', 'Todos os Níveis')}</option>
                  {(levels || []).map((lvl) => (
                    <option key={lvl.id_nivel_area} value={lvl.id_nivel_area}>
                      {typeof lvl.nivel_area === 'string' ? lvl.nivel_area : (lvl.nivel_area?.pt || lvl.nivel || `Nível #${lvl.id_nivel_area}`)}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        )}

        {/* Botão Limpar Filtros */}
        <ClearFiltersBtn 
          onClear={handleClearFilters}
          disabled={!isAnyFilterActive}
        />
      </div>
    </div>
  );
}
