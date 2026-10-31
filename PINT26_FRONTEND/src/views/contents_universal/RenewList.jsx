import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { ROLE } from '../../constants/roles';
import SearchBar from '../../components/SearchBar';
import RenewDetailsModal from '../../components/RenewDetailsModal';
import ClearFiltersBtn from '../../components/ClearFiltersBtn';

export default function RenewList() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'pt';
  const { activeRole, socket } = useAppContext();

  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pendente' | 'aprovado' | 'recusado'
  const [slFilter, setSlFilter] = useState('all');
  const [serviceLines, setServiceLines] = useState([]);

  // Modal de Detalhes (apenas visualização para TM)
  const [selectedRenewalId, setSelectedRenewalId] = useState(null);
  const [failedLogos, setFailedLogos] = useState({});
  const [failedAvatars, setFailedAvatars] = useState({});

  // 1. Carregar Linhas de Serviço para filtro
  const fetchServiceLines = useCallback(async () => {
    try {
      const res = await api.get('/service_line');
      if (res.data?.success) {
        setServiceLines(res.data.data || []);
      }
    } catch (err) {
      console.warn('Erro ao buscar linhas de serviço:', err);
    }
  }, []);

  // 2. Carregar Pedidos de Renovação para TM (Listagem global)
  const fetchRenewals = useCallback(async (isSilent = false) => {
    const roleNum = Number(activeRole);
    if (roleNum !== ROLE.TM) return;

    try {
      if (!isSilent) setLoading(true);
      const res = await api.get('/renovacao_badge/gestao/pedidos');
      let list = [];
      if (res.data?.success) {
        list = res.data.data || [];
      }
      setRenewals(list);
    } catch (err) {
      console.error('Erro ao buscar pedidos de renovação para TM:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    fetchServiceLines();
    fetchRenewals(false);
  }, [fetchServiceLines, fetchRenewals]);

  // Sincronização em tempo real via WebSockets
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchRenewals(true);
    };

    socket.on('renovacao_criada', handleUpdate);
    socket.on('renovacao_updated', handleUpdate);
    socket.on('renovacao_aprovada', handleUpdate);
    socket.on('renovacao_rejeitada', handleUpdate);
    socket.on('evidencia_renovacao_enviada', handleUpdate);

    return () => {
      socket.off('renovacao_criada', handleUpdate);
      socket.off('renovacao_updated', handleUpdate);
      socket.off('renovacao_aprovada', handleUpdate);
      socket.off('renovacao_rejeitada', handleUpdate);
      socket.off('evidencia_renovacao_enviada', handleUpdate);
    };
  }, [socket, fetchRenewals]);

  // Filtragem dos dados
  const filteredRenewals = useMemo(() => {
    return renewals.filter(item => {
      // 1. Filtro de Estado
      if (statusFilter === 'pendente' && item.renovacao_aprovada !== null) return false;
      if (statusFilter === 'aprovado' && item.renovacao_aprovada !== true) return false;
      if (statusFilter === 'recusado' && item.renovacao_aprovada !== false) return false;

      // 2. Filtro de Linha de Serviço
      if (slFilter !== 'all') {
        const itemSl = item.badge?.sl_nome || '';
        if (!itemSl.toLowerCase().includes(slFilter.toLowerCase())) {
          return false;
        }
      }

      // 3. Filtro de Pesquisa (Consultor, email, badge ou LP)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const consultorName = item.consultor?.nome?.toLowerCase() || '';
        const consultorEmail = item.consultor?.email?.toLowerCase() || '';
        const badgeName = item.badge?.nome?.toLowerCase() || '';
        const lpName = item.badge?.lp_nome?.toLowerCase() || '';

        if (!consultorName.includes(q) && !consultorEmail.includes(q) && !badgeName.includes(q) && !lpName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [renewals, statusFilter, slFilter, searchTerm]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isAnyFilterActive = useMemo(() => {
    const isStatusActive = statusFilter && statusFilter !== 'all';
    const isSlActive = slFilter && slFilter !== 'all';
    const isSearchActive = Boolean(searchTerm && searchTerm.trim() !== '');
    return isStatusActive || isSlActive || isSearchActive;
  }, [statusFilter, slFilter, searchTerm]);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setSlFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="users-admin-container">
      {/* Cabeçalho da Página */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            {t('menuRenewals', 'Renovações')}
          </h3>
          <p className="text-muted small mb-0">
            {t('renewalsListSubtitle', 'Consulta e acompanhamento dos pedidos de renovação de badges.')}
          </p>
        </div>

        {/* Badge contador de pedidos pendentes */}
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-warning text-dark px-3 py-2 fw-bold rounded-pill shadow-sm" style={{ fontSize: '0.85rem' }}>
            ⏳ {renewals.filter(r => r.renovacao_aprovada === null).length} {t('pendingRenewalsCount', 'Pendentes')}
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="card border rounded-4 p-3 mb-4 shadow-sm" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
        <div className="row g-3 align-items-center">
          {/* Pesquisa */}
          <div className="col-12 col-md-6 col-lg-5">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t('searchAdminRenewalsPlaceholder', 'Pesquisar consultor, email ou badge...')}
            />
          </div>

          {/* Filtro de Estado Dropdown */}
          <div className="col-12 col-sm-6 col-md-3 col-lg-3">
            <select
              className="form-select form-select-sm rounded-3 shadow-sm"
              style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('filterAll', 'Todos os Estados')}</option>
              <option value="pendente">{t('filterPendente', 'Pendentes')}</option>
              <option value="aprovado">{t('filterAprovado', 'Aprovados')}</option>
              <option value="recusado">{t('filterRecusado', 'Recusados')}</option>
            </select>
          </div>

          {/* Filtro Linha de Serviço */}
          {serviceLines.length > 0 && (
            <div className="col-12 col-sm-6 col-md-3 col-lg-3">
              <select
                className="form-select form-select-sm rounded-3 shadow-sm"
                style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                value={slFilter}
                onChange={(e) => setSlFilter(e.target.value)}
              >
                <option value="all">{t('allServiceLines', 'Todas as Service Lines')}</option>
                {serviceLines.map((sl) => {
                  const slName = sl.service_line || sl.traducao_service_line?.[currentLang] || sl.traducao_service_line?.pt || sl.nome || `SL #${sl.id_service_line}`;
                  return (
                    <option key={sl.id_service_line} value={slName}>
                      {slName}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Botão Limpar Filtros */}
          <div className="col-12 col-sm-auto d-flex align-items-center">
            <ClearFiltersBtn
              onClear={handleClearFilters}
              disabled={!isAnyFilterActive}
            />
          </div>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      {loading ? (
        <div className="users-table-card">
          <div className="users-loading">
            <div className="users-spinner" />
            <span>{t('loadingRenewalsList', 'A carregar lista de renovações...')}</span>
          </div>
        </div>
      ) : filteredRenewals.length === 0 ? (
        <div className="users-table-card p-5 text-center" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
          <span style={{ fontSize: '3rem' }}>🛡️</span>
          <h5 className="fw-bold mt-3 mb-1" style={{ color: 'var(--text)' }}>
            {t('noRenewalsFound', 'Nenhum Pedido Encontrado')}
          </h5>
          <p className="text-muted small mb-0">
            {searchTerm.trim() || statusFilter !== 'all' || slFilter !== 'all'
              ? t('noRenewalsMatchFilters', 'Nenhum pedido de renovação corresponde aos filtros ativos.')
              : t('noPendingRenewalsNotice', 'Não existem pedidos de renovação neste momento.')}
          </p>
        </div>
      ) : (
        <div className="users-table-card">
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('consultant', 'Consultor')}</th>
                  <th>{t('badge', 'Badge')}</th>
                  <th>{t('requestDate', 'Data Pedido')}</th>
                  <th>{t('status', 'Estado')}</th>
                  <th>{t('pointsReward', 'Pontos')}</th>
                  <th>{t('evidences', 'Evidências')}</th>
                  <th className="text-end">{t('actions', 'Ações')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRenewals.map((item) => {
                  const consultor = item.consultor;
                  const badge = item.badge;
                  const isPending = item.renovacao_aprovada === null;
                  const isApproved = item.renovacao_aprovada === true;
                  const isRejected = item.renovacao_aprovada === false;

                  const hasLogo = badge?.logo && !failedLogos[item.id_renovacao_badge];
                  const badgeLogo = hasLogo
                    ? `${API_BASE_URL}/uploads/logo_badges/${badge.logo}`
                    : null;

                  return (
                    <tr key={item.id_renovacao_badge}>
                      {/* Consultor */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {consultor?.avatar && !failedAvatars[consultor.id_utilizador || item.id_renovacao_badge] ? (
                            <img
                              src={consultor.avatar.startsWith('http') ? consultor.avatar : `${API_BASE_URL}/uploads/avatars/${consultor.avatar}`}
                              alt={consultor.nome}
                              className="rounded-circle"
                              style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                              onError={() => setFailedAvatars(prev => ({ ...prev, [consultor.id_utilizador || item.id_renovacao_badge]: true }))}
                            />
                          ) : (
                            <div 
                              className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold"
                              style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}
                            >
                              {consultor?.nome?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div>
                            <span className="fw-semibold small d-block" style={{ color: 'var(--text)' }}>
                              {consultor?.nome || '—'}
                            </span>
                            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                              {consultor?.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Badge */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-3 p-1 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '36px', height: '36px', backgroundColor: 'var(--bg-icon, rgba(2,132,199,0.08))' }}
                          >
                            {badgeLogo ? (
                              <img 
                                src={badgeLogo} 
                                alt={badge?.nome} 
                                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                onError={() => setFailedLogos(prev => ({ ...prev, [item.id_renovacao_badge]: true }))}
                              />
                            ) : (
                              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary">
                                <circle cx="12" cy="8" r="7" />
                                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <span className="fw-semibold small d-block" style={{ color: 'var(--text)' }}>
                              {badge?.nome}
                            </span>
                            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                              {badge?.lp_nome} • {badge?.area_nome}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Data */}
                      <td className="small text-muted">
                        {formatDate(item.data_pedido)}
                      </td>

                      {/* Estado */}
                      <td>
                        {isPending && (
                          <span className="renew-status-badge pending">
                            <span className="badge-icon">⏳</span>
                            <span>{t('statusPendente', 'Pendente')}</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="renew-status-badge approved">
                            <span className="badge-icon">✓</span>
                            <span>{t('statusApproved', 'Aprovado')}</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="renew-status-badge rejected">
                            <span className="badge-icon">✕</span>
                            <span>{t('statusRejected', 'Recusado')}</span>
                          </span>
                        )}
                      </td>

                      {/* Pontos */}
                      <td className="small">
                        <span className="badge bg-success-subtle text-success fw-bold">
                          +{item.pontos_renovacao || badge?.pontos_renovacao || 0} pts
                        </span>
                      </td>

                      {/* Evidências */}
                      <td className="small">
                        <span className="badge bg-secondary-subtle text-secondary fw-semibold">
                          📎 {(item.evidencias || []).length}
                        </span>
                      </td>

                      {/* Ações: TM tem apenas Visualizar */}
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary fw-semibold d-inline-flex align-items-center gap-1.5"
                          onClick={() => setSelectedRenewalId(item.id_renovacao_badge)}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span>{t('btnView', 'Visualizar')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhes (Modo de Visualização para TM) */}
      {selectedRenewalId && (
        <RenewDetailsModal
          renewalId={selectedRenewalId}
          onClose={() => setSelectedRenewalId(null)}
          onUpdated={() => fetchRenewals()}
          isModerator={false}
        />
      )}
    </div>
  );
}
