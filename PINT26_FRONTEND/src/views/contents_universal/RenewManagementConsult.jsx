import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { ROLE } from '../../constants/roles';
import SearchBar from '../../components/SearchBar';
import RequestRenewModal from '../../components/RequestRenewModal';
import RenewDetailsModal from '../../components/RenewDetailsModal';
import ClearFiltersBtn from '../../components/ClearFiltersBtn';

const getBadgeLogoUrl = (rawLogo) => {
  if (!rawLogo) return null;
  if (rawLogo.startsWith('http://') || rawLogo.startsWith('https://')) return rawLogo;
  if (rawLogo.startsWith('/uploads/')) return `${API_BASE_URL}${rawLogo}`;
  return `${API_BASE_URL}/uploads/logo_badges/${rawLogo}`;
};

export default function RenewManagementConsult() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'pt';
  const { activeRole, socket } = useAppContext();

  // Abas: 'elegiveis' (Aba 1) | 'minhas' (Aba 2)
  const [activeTab, setActiveTab] = useState('elegiveis');

  // Dados da Aba 1 (Elegíveis)
  const [eligibleBadges, setEligibleBadges] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [searchEligible, setSearchEligible] = useState('');

  // Dados da Aba 2 (Minhas Candidaturas de Renovação)
  const [myRenewals, setMyRenewals] = useState([]);
  const [loadingMyRenewals, setLoadingMyRenewals] = useState(true);
  const [searchMyRenewals, setSearchMyRenewals] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pendente' | 'aprovado' | 'recusado'

  // Modais
  const [selectedBadgeForRenew, setSelectedBadgeForRenew] = useState(null);
  const [selectedRenewalIdForDetails, setSelectedRenewalIdForDetails] = useState(null);
  const [failedLogos, setFailedLogos] = useState({});

  // 1. Carregar Badges Elegíveis (Aba 1)
  const fetchEligible = useCallback(async (isSilent = false) => {
    if (Number(activeRole) !== ROLE.CON) return;
    try {
      if (!isSilent) setLoadingEligible(true);
      const res = await api.get('/renovacao_badge/elegiveis');
      if (res.data?.success) {
        setEligibleBadges(res.data.data || []);
      }
    } catch (err) {
      console.warn('Erro ao buscar badges elegíveis para renovação:', err);
    } finally {
      if (!isSilent) setLoadingEligible(false);
    }
  }, [activeRole]);

  // 2. Carregar Histórico de Renovações (Aba 2)
  const fetchMyRenewals = useCallback(async (isSilent = false) => {
    if (Number(activeRole) !== ROLE.CON) return;
    try {
      if (!isSilent) setLoadingMyRenewals(true);
      const res = await api.get('/renovacao_badge/minhas');
      if (res.data?.success) {
        setMyRenewals(res.data.data || []);
      }
    } catch (err) {
      console.warn('Erro ao buscar histórico de renovações:', err);
    } finally {
      if (!isSilent) setLoadingMyRenewals(false);
    }
  }, [activeRole]);

  useEffect(() => {
    fetchEligible(false);
    fetchMyRenewals(false);
  }, [fetchEligible, fetchMyRenewals]);

  // Sincronização via WebSockets (atualização silenciosa)
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchEligible(true);
      fetchMyRenewals(true);
    };

    socket.on('renovacao_criada', handleUpdate);
    socket.on('renovacao_updated', handleUpdate);
    socket.on('renovacao_aprovada', handleUpdate);
    socket.on('renovacao_rejeitada', handleUpdate);
    socket.on('badge_renovado', handleUpdate);
    socket.on('evidencia_renovacao_enviada', handleUpdate);

    return () => {
      socket.off('renovacao_criada', handleUpdate);
      socket.off('renovacao_updated', handleUpdate);
      socket.off('renovacao_aprovada', handleUpdate);
      socket.off('renovacao_rejeitada', handleUpdate);
      socket.off('badge_renovado', handleUpdate);
      socket.off('evidencia_renovacao_enviada', handleUpdate);
    };
  }, [socket, fetchEligible, fetchMyRenewals]);

  // Filtragem Aba 1 (Elegíveis)
  const filteredEligible = useMemo(() => {
    if (!searchEligible.trim()) return eligibleBadges;
    const q = searchEligible.toLowerCase();
    return eligibleBadges.filter(b => 
      b.badge_nome?.toLowerCase().includes(q) ||
      b.lp_nome?.toLowerCase().includes(q) ||
      b.area_nome?.toLowerCase().includes(q)
    );
  }, [eligibleBadges, searchEligible]);

  // Filtragem Aba 2 (Minhas Renovações)
  const filteredMyRenewals = useMemo(() => {
    return myRenewals.filter(item => {
      // Filtro por Estado
      if (statusFilter === 'pendente' && item.renovacao_aprovada !== null) return false;
      if (statusFilter === 'aprovado' && item.renovacao_aprovada !== true) return false;
      if (statusFilter === 'recusado' && item.renovacao_aprovada !== false) return false;

      // Filtro por Pesquisa
      if (searchMyRenewals.trim()) {
        const q = searchMyRenewals.toLowerCase();
        const badgeName = item.badge?.nome?.toLowerCase() || '';
        const lpName = item.badge?.lp_nome?.toLowerCase() || '';
        if (!badgeName.includes(q) && !lpName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [myRenewals, statusFilter, searchMyRenewals]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
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
            {t('renewalsConsultSubtitle', 'Acompanhe os seus badges expiráveis, solicite renovações e consulte o histórico de pedidos.')}
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="nav nav-pills p-1 rounded-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
          <button
            type="button"
            className={`nav-link rounded-2 fw-semibold px-3 py-2 ${activeTab === 'elegiveis' ? 'active shadow-sm text-white' : ''}`}
            style={{ color: activeTab === 'elegiveis' ? '#ffffff' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('elegiveis')}
          >
            📋 {t('tabEligibleBadges', 'Badges Elegíveis')}
            {eligibleBadges.length > 0 && (
              <span className="badge bg-warning text-dark ms-2 rounded-pill fw-bold">
                {eligibleBadges.length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`nav-link rounded-2 fw-semibold px-3 py-2 ${activeTab === 'minhas' ? 'active shadow-sm text-white' : ''}`}
            style={{ color: activeTab === 'minhas' ? '#ffffff' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('minhas')}
          >
            📑 {t('tabMyRenewals', 'Minhas Candidaturas')}
            {myRenewals.length > 0 && (
              <span className="badge bg-secondary ms-2 rounded-pill fw-bold">
                {myRenewals.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          ABA 1: BADGES ELEGÍVEIS PARA RENOVAÇÃO
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'elegiveis' && (
        <div>
          {/* Barra de Pesquisa */}
          <div className="mb-4">
            <SearchBar
              value={searchEligible}
              onChange={setSearchEligible}
              placeholder={t('searchEligiblePlaceholder', 'Pesquisar por nome do badge, área ou learning path...')}
            />
          </div>

          {loadingEligible ? (
            <div className="users-table-card">
              <div className="users-loading">
                <div className="users-spinner" />
                <span>{t('loadingEligibleBadges', 'A verificar badges expiráveis...')}</span>
              </div>
            </div>
          ) : filteredEligible.length === 0 ? (
            <div className="users-table-card p-5 text-center" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
              <span style={{ fontSize: '3rem' }}>🎉</span>
              <h5 className="fw-bold mt-3 mb-1" style={{ color: 'var(--text)' }}>
                {t('noEligibleBadgesTitle', 'Nenhum Badge a Expirar!')}
              </h5>
              <p className="text-muted small mb-0" style={{ maxWidth: '480px', margin: '0 auto' }}>
                {searchEligible.trim()
                  ? t('noBadgesMatchSearch', 'Nenhum badge corresponde aos termos da pesquisa.')
                  : t('noEligibleBadgesText', 'Todos os seus badges conquistados estão dentro do período de validade regular.')}
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {filteredEligible.map((item) => {
                const isPending = item.status_renovacao === 'pendente';
                const isExpired = item.dias_restantes <= 0;
                const badgeKey = `elegivel-${item.id_candidatura}`;
                const badgeLogoSrc = !failedLogos[badgeKey] ? getBadgeLogoUrl(item.badge_logo) : null;

                return (
                  <div key={item.id_candidatura} className="col-12 col-md-6 col-xl-4">
                    <div 
                      className="card h-100 border rounded-4 p-3 shadow-sm position-relative d-flex flex-column justify-content-between"
                      style={{ 
                        backgroundColor: 'var(--panel)', 
                        borderColor: isExpired ? 'rgba(239,68,68,0.4)' : 'var(--sidebar-border)' 
                      }}
                    >
                      {/* Topo do Card: Logo + Título */}
                      <div>
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <div 
                            className="rounded-3 p-2 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '56px', height: '56px', backgroundColor: 'var(--bg-icon, rgba(2,132,199,0.08))' }}
                          >
                            {badgeLogoSrc ? (
                              <img 
                                src={badgeLogoSrc} 
                                alt={item.badge_nome} 
                                style={{ width: '42px', height: '42px', objectFit: 'contain' }}
                                onError={() => setFailedLogos(prev => ({ ...prev, [badgeKey]: true }))}
                              />
                            ) : (
                              <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary">
                                <circle cx="12" cy="8" r="7" />
                                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h6 className="fw-bold mb-1 text-truncate" style={{ color: 'var(--text)' }} title={item.badge_nome}>
                              {item.badge_nome}
                            </h6>
                            <span className="badge bg-primary-subtle text-primary small fw-semibold text-truncate d-inline-block" style={{ maxWidth: '180px' }}>
                              {item.lp_nome}
                            </span>
                          </div>
                        </div>

                        {/* Informações detalhadas */}
                        <div className="small text-muted mb-3 d-flex flex-column gap-1">
                          <div className="d-flex justify-content-between">
                            <span>{t('areaNivel', 'Área / Nível')}:</span>
                            <span className="fw-semibold" style={{ color: 'var(--text)' }}>{item.area_nome} • {item.nivel_nome}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>{t('renewalPointsReward', 'Pontos de Renovação')}:</span>
                            <span className="badge bg-success-subtle text-success fw-bold">+{item.pontos_renovacao || 0} pts</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <span>{t('statusExpiracao', 'Estado')}:</span>
                            <span className={`renew-status-badge ${isExpired ? 'expired' : 'expiring'}`}>
                              <span className="badge-icon">{isExpired ? '⚠️' : '⏳'}</span>
                              <span>
                                {isExpired 
                                  ? t('badgeAlreadyExpired', 'Expirado') 
                                  : t('badgeExpiresInDays', 'Expira em {{dias}} dias', { dias: item.dias_restantes })}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ação: Botão Renovar ou Status */}
                      <div className="pt-2 border-top" style={{ borderColor: 'var(--sidebar-border)' }}>
                        {isPending ? (
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <span className="renew-status-badge pending flex-grow-1 justify-content-center">
                              <span className="badge-icon">⏳</span>
                              <span>{t('statusPendente', 'Pendente de Moderação')}</span>
                            </span>
                            {item.id_renovacao_ativa && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
                                onClick={() => setSelectedRenewalIdForDetails(item.id_renovacao_ativa)}
                                title={t('viewDetails', 'Ver Detalhes')}
                                style={{ width: '34px', height: '34px', padding: 0, flexShrink: 0 }}
                              >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                            onClick={() => setSelectedBadgeForRenew(item)}
                          >
                            <span>{t('btnRenovar', 'Renovar')}</span>
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          ABA 2: MINHAS CANDIDATURAS DE RENOVAÇÃO
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'minhas' && (
        <div>
          {/* Filtros da Aba 2 */}
          <div className="card border rounded-4 p-3 mb-4 shadow-sm" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-6 col-lg-7">
                <SearchBar
                  value={searchMyRenewals}
                  onChange={setSearchMyRenewals}
                  placeholder={t('searchMyRenewalsPlaceholder', 'Pesquisar candidaturas de renovação...')}
                />
              </div>

              {/* Filtro de Estado Dropdown */}
              <div className="col-12 col-sm-6 col-md-4 col-lg-3">
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

              {/* Botão Limpar Filtros */}
              <div className="col-12 col-sm-auto d-flex align-items-center">
                <ClearFiltersBtn
                  onClear={() => {
                    setStatusFilter('all');
                    setSearchMyRenewals('');
                  }}
                  disabled={statusFilter === 'all' && (!searchMyRenewals || searchMyRenewals.trim() === '')}
                />
              </div>
            </div>
          </div>

          {loadingMyRenewals ? (
            <div className="users-table-card">
              <div className="users-loading">
                <div className="users-spinner" />
                <span>{t('loadingRenewalsHistory', 'A carregar histórico de renovações...')}</span>
              </div>
            </div>
          ) : filteredMyRenewals.length === 0 ? (
            <div className="users-table-card p-5 text-center" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
              <span style={{ fontSize: '3rem' }}>📑</span>
              <h5 className="fw-bold mt-3 mb-1" style={{ color: 'var(--text)' }}>
                {t('noRenewalsFoundTitle', 'Nenhum Pedido Encontrado')}
              </h5>
              <p className="text-muted small mb-0">
                {t('noRenewalsFoundText', 'Ainda não submeteu nenhum pedido de renovação ou nenhum corresponde aos filtros ativos.')}
              </p>
            </div>
          ) : (
            <div className="users-table-card">
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>{t('badge', 'Badge')}</th>
                      <th>{t('requestDate', 'Data Pedido')}</th>
                      <th>{t('status', 'Estado')}</th>
                      <th>{t('moderator', 'Moderador')}</th>
                      <th>{t('points', 'Pontos')}</th>
                      <th>{t('evidences', 'Evidências')}</th>
                      <th className="text-end">{t('actions', 'Ações')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMyRenewals.map((item) => {
                      const badgeKey = `minha-${item.id_renovacao_badge || item.id_candidatura}`;
                      const rawLogo = item.badge?.logo || item.badge_logo;
                      const badgeLogoSrc = !failedLogos[badgeKey] ? getBadgeLogoUrl(rawLogo) : null;

                      const isPending = item.renovacao_aprovada === null;
                      const isApproved = item.renovacao_aprovada === true;
                      const isRejected = item.renovacao_aprovada === false;

                      return (
                        <tr key={item.id_renovacao_badge}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div 
                                className="rounded-3 p-1 d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '38px', height: '38px', backgroundColor: 'var(--bg-icon, rgba(2,132,199,0.08))' }}
                              >
                                {badgeLogoSrc ? (
                                  <img 
                                    src={badgeLogoSrc} 
                                    alt={item.badge?.nome || 'Badge'} 
                                    style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                                    onError={() => setFailedLogos(prev => ({ ...prev, [badgeKey]: true }))}
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
                                  {item.badge?.nome}
                                </span>
                                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                  {item.badge?.lp_nome} • {item.badge?.area_nome}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="small text-muted">
                            {formatDate(item.data_pedido)}
                          </td>

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

                          <td className="small">
                            {item.moderador ? (
                              <span className="fw-medium" style={{ color: 'var(--text)' }}>{item.moderador.nome}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>

                          <td className="small">
                            {isApproved ? (
                              <span className="badge bg-success-subtle text-success fw-bold">
                                +{item.pontos_renovacao || 0} pts
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>

                          <td className="small">
                            <span className="badge bg-secondary-subtle text-secondary fw-semibold">
                              📎 {(item.evidencias || []).length}
                            </span>
                          </td>

                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary fw-semibold d-inline-flex align-items-center gap-1.5"
                              onClick={() => setSelectedRenewalIdForDetails(item.id_renovacao_badge)}
                            >
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>{t('viewDetailsBtn', 'Ver Detalhes')}</span>
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
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAIS
      ───────────────────────────────────────────────────────────────────────────── */}
      {/* 1. Modal de Solicitar Renovação (Aba 1) */}
      {selectedBadgeForRenew && (
        <RequestRenewModal
          item={selectedBadgeForRenew}
          onClose={() => setSelectedBadgeForRenew(null)}
          onSuccess={() => {
            fetchEligible();
            fetchMyRenewals();
          }}
        />
      )}

      {/* 2. Modal de Detalhes da Renovação (Aba 2) */}
      {selectedRenewalIdForDetails && (
        <RenewDetailsModal
          renewalId={selectedRenewalIdForDetails}
          onClose={() => setSelectedRenewalIdForDetails(null)}
          onUpdated={() => {
            fetchEligible();
            fetchMyRenewals();
          }}
          isModerator={false}
        />
      )}
    </div>
  );
}
