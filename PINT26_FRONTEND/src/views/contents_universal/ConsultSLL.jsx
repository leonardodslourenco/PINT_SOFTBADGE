import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../../services/api';
import { useAppContext } from '../../context/AppContext';

export default function ConsultSLL() {
  const { t, i18n } = useTranslation();
  const { socket } = useAppContext();
  const currentLang = (i18n.language || 'pt').slice(0, 2).toLowerCase();

  const [loading, setLoading] = useState(true);
  const [badgesMonth, setBadgesMonth] = useState({ percentagem: 0, concluidas: 0, total: 0 });
  const [pendingCounts, setPendingCounts] = useState({ total_in_progress: 0, total_in_validation: 0 });
  const [topConsultant, setTopConsultant] = useState(null);
  const [slaStatus, setSlaStatus] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [areaDistribution, setAreaDistribution] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [failedAvatars, setFailedAvatars] = useState({});

  const getAreaName = useCallback((areaObj) => {
    if (!areaObj) return '—';
    if (typeof areaObj === 'string') return areaObj;
    const tArea = areaObj.traducao_area;
    if (tArea) {
      if (typeof tArea === 'string') return tArea;
      return tArea[currentLang] || tArea.pt || tArea.en || tArea.es || areaObj.area || areaObj.nome_area || areaObj.nome || (areaObj.id_area ? `Área #${areaObj.id_area}` : '—');
    }
    return areaObj.area || areaObj.nome_area || areaObj.nome || (areaObj.id_area ? `Área #${areaObj.id_area}` : '—');
  }, [currentLang]);

  const getBadgeName = useCallback((badgeObj) => {
    if (!badgeObj) return '—';
    if (typeof badgeObj === 'string') return badgeObj;
    const tName = badgeObj.nome_badge || badgeObj.traducao_titulo;
    if (tName) {
      if (typeof tName === 'string') return tName;
      return tName[currentLang] || tName.pt || tName.en || tName.es || badgeObj.titulo || badgeObj.nome || '—';
    }
    return badgeObj.titulo || badgeObj.nome || '—';
  }, [currentLang]);

  const fetchAll = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [resBadges, resPending, resTop, resSla, resConsultants, resActivity, resAreas] = await Promise.all([
        api.get('/metricas/sll-dashboard/badges-mes').catch(() => ({ data: { success: false, data: null } })),
        api.get('/metricas/sll-dashboard/candidaturas-pendentes').catch(() => ({ data: { success: false, data: null } })),
        api.get('/metricas/sll-dashboard/top-consultor').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/metricas/sll-dashboard/sla-status').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/metricas/sll-dashboard/listagem-consultores').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/metricas/sll-dashboard/atividades-recentes').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/metricas/sll-dashboard/contagem-areas').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (resBadges.data?.success && resBadges.data.data) {
        setBadgesMonth(resBadges.data.data);
      }
      if (resPending.data?.success && resPending.data.data) {
        setPendingCounts(resPending.data.data);
      }
      if (resTop.data?.success && Array.isArray(resTop.data.data) && resTop.data.data.length > 0) {
        setTopConsultant(resTop.data.data[0]);
      }
      if (resSla.data?.success && Array.isArray(resSla.data.data)) {
        setSlaStatus(resSla.data.data);
      }

      // Merge and consolidate consultants list
      // 1. Check direct consultants list from resConsultants
      const listFromConsultants = (resConsultants.data?.success && Array.isArray(resConsultants.data.data))
        ? resConsultants.data.data
        : [];

      // 2. Check consultants from resTop (which contains all active consultants in the SL)
      const listFromTop = (resTop.data?.success && Array.isArray(resTop.data.data))
        ? resTop.data.data
        : [];

      const mapConsultants = new Map();

      // Seed with resConsultants (has badges details)
      listFromConsultants.forEach(item => {
        const uid = item.consultor?.id_utilizador;
        if (uid) {
          mapConsultants.set(uid, {
            consultor: item.consultor,
            total_pontos_sl: item.total_pontos_sl ?? item.pontos ?? 0,
            badges: item.badges || []
          });
        }
      });

      // Augment with resTop (ensures all consultants associated with SL's areas are present)
      listFromTop.forEach(item => {
        const uid = item.consultor?.id_utilizador;
        if (uid) {
          if (mapConsultants.has(uid)) {
            const existing = mapConsultants.get(uid);
            if (!existing.total_pontos_sl && item.pontos) {
              existing.total_pontos_sl = item.pontos;
            }
          } else {
            mapConsultants.set(uid, {
              consultor: item.consultor,
              total_pontos_sl: item.pontos || 0,
              badges: []
            });
          }
        }
      });

      const consolidatedConsultants = Array.from(mapConsultants.values()).sort((a, b) => {
        const nameA = `${a.consultor?.nome || ''} ${a.consultor?.apelido || ''}`.trim();
        const nameB = `${b.consultor?.nome || ''} ${b.consultor?.apelido || ''}`.trim();
        return nameA.localeCompare(nameB);
      });

      setConsultants(consolidatedConsultants);

      if (resActivity.data?.success && Array.isArray(resActivity.data.data)) {
        setRecentActivity(resActivity.data.data);
      }

      // Reconcile and calculate Area Distribution
      const mapAreas = new Map();

      const rawAreasList = (resAreas.data?.success && Array.isArray(resAreas.data.data))
        ? resAreas.data.data
        : [];

      if (rawAreasList.length > 0) {
        // Direct consumption of backend accurate metrics
        rawAreasList.forEach(item => {
          const areaObj = item.area || item;
          const aId = areaObj?.id_area || item.id_area;
          if (aId) {
            mapAreas.set(String(aId), {
              id_area: aId,
              area: areaObj,
              completadas: Number(item.completadas) || 0,
              em_progresso: Number(item.em_progresso) || 0,
              nao_iniciadas: Number(item.nao_iniciadas) || 0
            });
          }
        });
      }

      const consolidatedAreas = Array.from(mapAreas.values()).sort((a, b) => {
        const nameA = getAreaName(a.area);
        const nameB = getAreaName(b.area);
        return nameA.localeCompare(nameB);
      });

      setAreaDistribution(consolidatedAreas);
    } catch (err) {
      console.error('Error fetching SLL consultants data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [getAreaName]);

  useEffect(() => {
    fetchAll(false);
  }, [fetchAll, i18n.language]);

  // Real-time WebSocket updates (silent re-fetch without showing loading spinner)
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      setTimeout(() => fetchAll(true), 400);
    };
    socket.on('candidatura_submetida', handleUpdate);
    socket.on('candidatura_pre_aprovada', handleUpdate);
    socket.on('candidatura_avancou', handleUpdate);
    socket.on('candidatura_badge_emitido', handleUpdate);
    socket.on('badge_updated', handleUpdate);
    socket.on('user_updated', handleUpdate);
    return () => {
      socket.off('candidatura_submetida', handleUpdate);
      socket.off('candidatura_pre_aprovada', handleUpdate);
      socket.off('candidatura_avancou', handleUpdate);
      socket.off('candidatura_badge_emitido', handleUpdate);
      socket.off('badge_updated', handleUpdate);
      socket.off('user_updated', handleUpdate);
    };
  }, [socket, fetchAll]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar || avatar === 'default_avatar.webp') return null;
    return `${API_BASE_URL}/uploads/avatars/${avatar}`;
  };

  const getInitials = (nome, apelido) => {
    return `${(nome || '')[0] || ''}${(apelido || '')[0] || ''}`.toUpperCase();
  };

  const estadoLabels = {
    1: t('statusCardOpen', 'Rascunho'),
    2: t('statusCardSubmitted', 'Submetida'),
    3: t('statusCardEmValidacao', 'Em Validação'),
    4: t('statusCardClosedOk', 'Aprovada'),
    5: t('statusCardClosedNok', 'Rejeitada')
  };

  const estadoColors = {
    1: '#6b7280',
    2: '#2563eb',
    3: '#d97706',
    4: '#16a34a',
    5: '#dc2626'
  };

  // Filter consultants by search
  const filteredConsultants = useMemo(() => {
    return consultants.filter(c => {
      if (!searchTerm.trim()) return true;
      const fullName = `${c.consultor?.nome || ''} ${c.consultor?.apelido || ''}`.toLowerCase();
      const email = (c.consultor?.email || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }, [consultants, searchTerm]);

  // SLA summary
  const slaOkCount = slaStatus.filter(s => !s.expirado).length;
  const slaExpiredCount = slaStatus.filter(s => s.expirado).length;

  if (loading) {
    return (
      <div className="users-admin-container">
        <div className="users-loading">
          <div className="users-spinner" />
          <span>{t('loadingUsers', 'A carregar...')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
          {t('consultSllTitle', 'Consultores da Linha de Serviço')}
        </h3>
        <p className="text-muted small mb-0">
          {t('consultSllSubtitle', 'Acompanhe o progresso dos consultores com candidaturas na sua Linha de Serviço.')}
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid mb-4">
        {/* Card 1: Badges Conquistados no Mês */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6', backgroundColor: 'var(--panel)' }}>
          <div className="kpi-details" style={{ gap: '4px' }}>
            <span className="kpi-title" style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('consultSllBadgesMonth', 'Badges Conquistados')}
            </span>
            <span className="kpi-value" style={{ fontSize: '1.6rem', lineHeight: 1.1, color: 'var(--text)' }}>
              {badgesMonth.percentagem}%
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              {badgesMonth.concluidas} {t('consultSllCompleted', 'concluídas')} / {badgesMonth.total} {t('consultSllTotal', 'iniciadas')}
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', width: '42px', height: '42px', minWidth: '42px' }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          </div>
        </div>

        {/* Card 2: Candidaturas Pendentes */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #2563eb', backgroundColor: 'var(--panel)' }}>
          <div className="kpi-details" style={{ gap: '4px' }}>
            <span className="kpi-title" style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('consultSllPending', 'Candidaturas Pendentes')}
            </span>
            <span className="kpi-value" style={{ fontSize: '1.6rem', lineHeight: 1.1, color: 'var(--text)' }}>
              {pendingCounts.total_in_progress || 0}
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              {pendingCounts.total_in_validation || 0} {t('consultSllInValidation', 'em validação')}
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', width: '42px', height: '42px', minWidth: '42px' }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
        </div>

        {/* Card 3: Top Consultor */}
        <div className="kpi-card" style={{ borderLeft: '4px solid #16a34a', backgroundColor: 'var(--panel)' }}>
          <div className="kpi-details" style={{ gap: '4px' }}>
            <span className="kpi-title" style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('consultSllTopConsultant', 'Top Consultor')}
            </span>
            <span className="kpi-value text-truncate" style={{ fontSize: '1.05rem', lineHeight: 1.2, color: 'var(--text)', maxWidth: '170px' }}>
              {topConsultant ? `${topConsultant.consultor?.nome || ''} ${topConsultant.consultor?.apelido || ''}`.trim() : '—'}
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              {topConsultant ? `${topConsultant.pontos || 0} ${t('consultSllPoints', 'pontos')}` : ''}
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', width: '42px', height: '42px', minWidth: '42px' }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
        </div>

        {/* Card 4: SLA Status */}
        <div className="kpi-card" style={{ borderLeft: `4px solid ${slaExpiredCount > 0 ? '#dc2626' : '#16a34a'}`, backgroundColor: 'var(--panel)' }}>
          <div className="kpi-details" style={{ gap: '4px' }}>
            <span className="kpi-title" style={{ fontSize: '0.72rem', color: slaExpiredCount > 0 ? '#dc2626' : '#16a34a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('consultSllSlaStatus', 'Estado SLA')}
            </span>
            <span className="kpi-value" style={{ fontSize: '1.6rem', lineHeight: 1.1, color: 'var(--text)' }}>
              {slaOkCount} / {slaStatus.length}
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              {slaOkCount} {t('consultSllSlaOk', 'Dentro do Prazo')} · {slaExpiredCount} {t('consultSllSlaExpired', 'Expirados')}
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: slaExpiredCount > 0 ? 'rgba(220, 38, 38, 0.12)' : 'rgba(22, 163, 74, 0.12)', color: slaExpiredCount > 0 ? '#dc2626' : '#16a34a', width: '42px', height: '42px', minWidth: '42px' }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="row g-4">
        {/* Left Column: Consultants List */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>
                  {t('consultSllConsultantsList', 'Listagem de Consultores')}
                </h5>
                <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold rounded-pill px-2 py-1" style={{ fontSize: '0.75rem' }}>
                  {filteredConsultants.length}
                </span>
              </div>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder={t('consultSllSearchPlaceholder', 'Pesquisar consultor...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  maxWidth: '260px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--panel-2)',
                  color: 'var(--text)',
                  borderColor: 'var(--sidebar-border)'
                }}
              />
            </div>

            {filteredConsultants.length === 0 ? (
              <div className="text-muted text-center py-5 small">
                {t('consultSllNoConsultants', 'Nenhum consultor encontrado na sua Linha de Serviço.')}
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filteredConsultants.map((item, idx) => {
                  const c = item.consultor;
                  const avatarUrl = getAvatarUrl(c?.avatar);
                  const hasFailed = failedAvatars[c?.id_utilizador];
                  const fullName = `${c?.nome || ''} ${c?.apelido || ''}`.trim() || 'Consultor';

                  return (
                    <div
                      key={c?.id_utilizador || idx}
                      className="p-3 rounded-3"
                      style={{
                        backgroundColor: 'var(--panel-2)',
                        border: '1px solid var(--sidebar-border)'
                      }}
                    >
                      <div className="d-flex align-items-center gap-3 mb-2">
                        {/* Avatar */}
                        {avatarUrl && !hasFailed ? (
                          <img
                            src={avatarUrl}
                            alt={fullName}
                            onError={() => setFailedAvatars(prev => ({ ...prev, [c?.id_utilizador]: true }))}
                            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: 42, height: 42, borderRadius: '50%',
                            backgroundColor: 'rgba(2, 132, 199, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)'
                          }}>
                            {getInitials(c?.nome, c?.apelido)}
                          </div>
                        )}

                        <div className="flex-grow-1">
                          <strong className="d-block" style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
                            {fullName}
                          </strong>
                          <div className="d-flex align-items-center gap-2">
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {item.total_pontos_sl ?? item.pontos ?? 0} {t('consultSllPoints', 'pontos')}
                            </span>
                            {c?.email && (
                              <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                · {c.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badges list */}
                      {(!item.badges || item.badges.length === 0) ? (
                        <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {t('consultSllNoBadges', 'Sem badges associados.')}
                        </span>
                      ) : (
                        <div className="d-flex flex-wrap gap-1 mt-2">
                          {item.badges.map((badge, bIdx) => {
                            const badgeName = getBadgeName(badge);
                            const color = estadoColors[badge.estado] || '#6b7280';
                            return (
                              <span
                                key={bIdx}
                                className="badge"
                                style={{
                                  backgroundColor: `${color}18`,
                                  color: color,
                                  border: `1px solid ${color}35`,
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  padding: '4px 8px',
                                  borderRadius: '6px'
                                }}
                              >
                                {badgeName} — {estadoLabels[badge.estado] || '?'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity + Area Distribution */}
        <div className="col-12 col-lg-4 d-flex flex-column gap-4">
          {/* Recent Activity */}
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
            <h6 className="fw-bold mb-3" style={{ color: 'var(--text)' }}>
              {t('consultSllRecentActivity', 'Atividade Recente')}
            </h6>
            {recentActivity.length === 0 ? (
              <span className="text-muted small">{t('consultSllNoActivity', 'Sem atividade recente.')}</span>
            ) : (
              <div className="d-flex flex-column gap-2">
                {recentActivity.slice(0, 8).map((act, idx) => {
                  const actionLabel = act.tipo_acao?.traducao_acao?.[currentLang] || act.tipo_acao?.traducao_acao?.pt || act.tipo_acao?.descricao || '—';
                  const badgeLabel = getBadgeName(act.badge);
                  const authorName = `${act.autor?.nome || ''} ${act.autor?.apelido || ''}`.trim() || 'Utilizador';

                  return (
                    <div
                      key={act.id_acao_candidatura || idx}
                      className="d-flex align-items-start gap-2 pb-2 border-bottom"
                      style={{ fontSize: '0.78rem', borderColor: 'var(--sidebar-border)' }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)',
                        marginTop: '5px', minWidth: 8
                      }} />
                      <div>
                        <span className="fw-semibold" style={{ color: 'var(--text)' }}>{authorName}</span>
                        <span className="text-muted"> — {actionLabel}</span>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {badgeLabel} · {formatDate(act.data_acao)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Area Distribution */}
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
            <h6 className="fw-bold mb-3" style={{ color: 'var(--text)' }}>
              {t('consultSllAreaDistribution', 'Distribuição por Área')}
            </h6>
            {areaDistribution.length === 0 ? (
              <span className="text-muted small">{t('consultSllNoAreas', 'Sem áreas associadas.')}</span>
            ) : (
              <div className="d-flex flex-column gap-3">
                {areaDistribution.map((item, idx) => {
                  const areaName = getAreaName(item.area);
                  const total = (item.completadas || 0) + (item.em_progresso || 0) + (item.nao_iniciadas || 0);
                  const pctComplete = total > 0 ? (item.completadas / total) * 100 : 0;
                  const pctProgress = total > 0 ? (item.em_progresso / total) * 100 : 0;
                  const pctNotStarted = total > 0 ? (item.nao_iniciadas / total) * 100 : 0;

                  return (
                    <div key={idx}>
                      <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.90rem', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text)' }}>{areaName}</span>
                        <span className="text-muted small">{total}</span>
                      </div>
                      {/* Stacked progress bar */}
                      <div className="d-flex" style={{ height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'var(--sidebar-border)' }}>
                        {total > 0 ? (
                          <>
                            <div style={{ width: `${pctComplete}%`, backgroundColor: '#16a34a', transition: 'width 0.3s ease' }} />
                            <div style={{ width: `${pctProgress}%`, backgroundColor: '#2563eb', transition: 'width 0.3s ease' }} />
                            <div style={{ width: `${pctNotStarted}%`, backgroundColor: '#8b5cf6', transition: 'width 0.3s ease' }} />
                          </>
                        ) : (
                          <div style={{ width: '100%', backgroundColor: 'var(--sidebar-border)' }} />
                        )}
                      </div>
                      <div className="d-flex flex-wrap gap-2 gap-sm-3 mt-1.5" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
                          <strong>{item.completadas}</strong> {t('consultSllCompletedLabel', 'Concluídas')}
                        </span>
                        <span style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563eb', display: 'inline-block' }} />
                          <strong>{item.em_progresso}</strong> {t('consultSllInProgressLabel', 'Em Progresso')}
                        </span>
                        <span style={{ color: '#8b5cf6', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#8b5cf6', display: 'inline-block' }} />
                          <strong>{item.nao_iniciadas}</strong> {t('consultSllNotStartedLabel', 'Não Iniciadas')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
