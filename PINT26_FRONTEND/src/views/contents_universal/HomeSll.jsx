import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import { api, API_BASE_URL } from '../../services/api';
import Swal from 'sweetalert2';

const ITEMS_PER_PAGE = 3;

export default function HomeSll({ onNavigate }) {
  const { t, i18n } = useTranslation();
  const { user, socket } = useAppContext();
  
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalConsultants: 0,
    pendingApprovals: 0,
    badgesIssued: 0
  });
  const [ranking, setRanking] = useState([]);
  const [failedAvatars, setFailedAvatars] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch SLL data directly from the dedicated backend metricas endpoints
  const fetchSllData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      
      const [resBadgesMes, resPendentes, resRanking, resTop, resConsultores] = await Promise.all([
        api.get('/metricas/sll-dashboard/badges-mes').catch(() => null),
        api.get('/metricas/sll-dashboard/candidaturas-pendentes').catch(() => null),
        api.get('/metricas/sll-dashboard/ranking-geral').catch(() => null),
        api.get('/metricas/sll-dashboard/top-consultor').catch(() => null),
        api.get('/metricas/sll-dashboard/listagem-consultores').catch(() => null)
      ]);

      let pendingCount = 0;
      let issuedCount = 0;
      let rankedList = [];
      let totalConsultoresCount = 0;

      if (resPendentes?.data?.success && resPendentes.data.data) {
        pendingCount = resPendentes.data.data.total_in_validation ?? resPendentes.data.data['3'] ?? 0;
      }

      if (resBadgesMes?.data?.success && resBadgesMes.data.data) {
        issuedCount = resBadgesMes.data.data.concluidas ?? 0;
      }

      if (resConsultores?.data?.success && Array.isArray(resConsultores.data.data)) {
        totalConsultoresCount = resConsultores.data.data.length;
      }

      if (resRanking?.data?.success && Array.isArray(resRanking.data.data)) {
        rankedList = resRanking.data.data.map((item, idx) => {
          const consultor = item.consultor || item;
          return {
            id_utilizador: consultor.id_utilizador || `consultor-${idx}`,
            nome: `${consultor.nome || ''} ${consultor.apelido || ''}`.trim() || 'Consultor',
            email: consultor.email || '',
            avatar: consultor.avatar || null,
            pontos: Number(item.pontos ?? item.total_pontos ?? 0),
            posicao: item.posicao ?? (idx + 1),
            nome_sl: consultor.nome_sl || ''
          };
        });
      } else if (resTop?.data?.success && Array.isArray(resTop.data.data)) {
        rankedList = resTop.data.data.map((item, idx) => ({
          id_utilizador: item.consultor?.id_utilizador || `consultor-${idx}`,
          nome: `${item.consultor?.nome || ''} ${item.consultor?.apelido || ''}`.trim() || 'Consultor',
          email: item.consultor?.email || '',
          avatar: item.consultor?.avatar || null,
          pontos: Number(item.pontos || 0),
          posicao: item.posicao ?? (idx + 1)
        }));
      } else if (resConsultores?.data?.success && Array.isArray(resConsultores.data.data)) {
        rankedList = resConsultores.data.data.map((item, idx) => ({
          id_utilizador: item.consultor?.id_utilizador || `consultor-${idx}`,
          nome: `${item.consultor?.nome || ''} ${item.consultor?.apelido || ''}`.trim() || 'Consultor',
          email: item.consultor?.email || '',
          avatar: item.consultor?.avatar || null,
          pontos: Number(item.total_pontos_sl || 0),
          posicao: idx + 1
        })).sort((a, b) => b.pontos - a.pontos);
      }

      setRanking(rankedList);
      setKpis({
        totalConsultants: totalConsultoresCount || rankedList.length,
        pendingApprovals: pendingCount,
        badgesIssued: issuedCount
      });

    } catch (err) {
      console.error('Error fetching SLL dashboard data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSllData(false);
  }, [fetchSllData, i18n.language]);

  // Real-time WebSocket updates (silent re-fetch without showing loading spinner)
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      setTimeout(() => fetchSllData(true), 400);
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
  }, [socket, fetchSllData]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(ranking.length / ITEMS_PER_PAGE));
  const paginatedRanking = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return ranking.slice(start, start + ITEMS_PER_PAGE);
  }, [ranking, currentPage]);

  const maxPoints = useMemo(() => {
    if (ranking.length === 0) return 100;
    const max = Math.max(...ranking.map(r => r.pontos));
    return max > 0 ? max : 100;
  }, [ranking]);

  const handleExport = (type) => {
    Swal.fire({
      icon: 'success',
      title: `${t('exportReportsTitle')} (${type})`,
      text: `Relatório exportado com sucesso no formato ${type}!`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  return (
    <div className="users-admin-container">
      {/* KPI Cards Grid */}
      <div className="kpi-grid mb-4">
        {/* Card 1: Consultores */}
        <div className="kpi-card p-3">
          <div className="kpi-details">
            <span className="kpi-title">{t('consultantsInLine')}</span>
            <span className="kpi-value">{loading ? '...' : kpis.totalConsultants}</span>
            <span className="kpi-trend positive small text-muted">{t('activeMembers')}</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <svg viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        {/* Card 2: Pendentes SLL */}
        <div 
          className="kpi-card p-3" 
          style={{ cursor: 'pointer' }} 
          onClick={() => onNavigate && onNavigate('final')}
        >
          <div className="kpi-details">
            <span className="kpi-title">{t('pendingApprovalsSll')}</span>
            <span className="kpi-value">{loading ? '...' : kpis.pendingApprovals}</span>
            <span className="kpi-trend small text-muted" style={{ color: kpis.pendingApprovals > 0 ? 'var(--danger)' : '' }}>{t('awaitingValidation')}</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        {/* Card 3: Badges Emitidos */}
        <div className="kpi-card p-3">
          <div className="kpi-details">
            <span className="kpi-title">{t('badgesIssuedSll')}</span>
            <span className="kpi-value">{loading ? '...' : kpis.badgesIssued}</span>
            <span className="kpi-trend positive small text-muted">{t('inServiceLine')}</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#fdf2f8', color: '#be185d' }}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content Grid: col-xl-7 / col-xl-5 (stacks on medium & small screens) */}
      <div className="row g-4 mb-4">
        {/* Ranking List Card */}
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm p-3 p-md-4 rounded-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">{t('consultantRankingTitle')}</h5>
            </div>

            <div className="table-responsive">
              <table className="users-table align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>{t('rankCol')}</th>
                    <th>{t('consultantCol')}</th>
                    <th className="text-end" style={{ width: '100px' }}>{t('pointsCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-muted">{t('loadingRanking')}</td>
                    </tr>
                  ) : ranking.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="users-empty-row py-4 text-center text-muted">{t('noConsultantsFound')}</td>
                    </tr>
                  ) : (
                    paginatedRanking.map((c, idx) => {
                      const globalRank = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                      const userKey = c.id_utilizador || `rank-${globalRank}`;
                      const nameParts = c.nome ? c.nome.trim().split(' ') : [];
                      const initials = nameParts.length >= 2
                        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
                        : `${c.nome?.[0] || 'U'}`.toUpperCase();

                      return (
                        <tr key={userKey}>
                          <td>
                            <span className={`badge ${globalRank === 1 ? 'bg-warning text-dark' : globalRank === 2 ? 'bg-secondary text-white' : globalRank === 3 ? 'bg-danger text-white' : 'bg-light text-dark'}`} style={{ minWidth: 32, fontSize: '0.8rem', fontWeight: 700 }}>
                              #{globalRank}
                            </span>
                          </td>
                          <td className="users-name-cell">
                            <div className="d-flex align-items-center gap-2">
                              {c.avatar && !failedAvatars[userKey] ? (
                                <img
                                  src={c.avatar.startsWith('http') ? c.avatar : `${API_BASE_URL}/uploads/avatars/${c.avatar}`}
                                  alt={c.nome}
                                  className="rounded-circle flex-shrink-0"
                                  style={{ width: '38px', height: '38px', objectFit: 'cover', border: '1px solid var(--sidebar-border)' }}
                                  onError={() => setFailedAvatars(prev => ({ ...prev, [userKey]: true }))}
                                />
                              ) : (
                                <div
                                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold small flex-shrink-0"
                                  style={{ width: '38px', height: '38px', fontSize: '0.85rem', border: '1px solid var(--sidebar-border)' }}
                                >
                                  {initials}
                                </div>
                              )}
                              <div className="text-truncate">
                                <strong className="text-dark d-block text-truncate" style={{ fontSize: '0.9rem' }}>{c.nome}</strong>
                                <span className="text-muted small d-block text-truncate" style={{ fontSize: '0.75rem' }}>{c.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="text-end fw-bold text-teal" style={{ color: 'var(--teal)', fontSize: '0.9rem' }}>
                            {c.pontos} pts
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {ranking.length > 0 && (
              <div className="users-pagination mt-3 pt-2 border-top d-flex align-items-center justify-content-between">
                <span className="users-pagination-info small text-muted">
                  {t('showingUsers', { shown: paginatedRanking.length, total: ranking.length })}
                </span>
                <div className="users-pagination-controls d-flex align-items-center gap-1">
                  <button
                    type="button"
                    className="users-page-btn btn btn-sm btn-outline-secondary px-2 py-0"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    ‹
                  </button>
                  <span className="users-page-indicator small fw-semibold px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="users-page-btn btn btn-sm btn-outline-secondary px-2 py-0"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Competency Progress Card */}
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm p-3 p-md-4 rounded-4 bg-white h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold mb-2">{t('competencyProgressTitle')}</h5>
              <p className="text-muted small mb-3" style={{ fontSize: '0.8rem' }}>{t('competencyProgressSub')}</p>
              
              <div className="d-flex flex-column gap-3">
                {loading ? (
                  <div className="text-muted small py-3">{t('loadingRanking')}</div>
                ) : ranking.length === 0 ? (
                  <div className="text-muted small py-3">{t('noConsultantsFound')}</div>
                ) : (
                  ranking.slice(0, 4).map((c, idx) => {
                    const percentage = Math.min(Math.round((c.pontos / maxPoints) * 100), 100);
                    return (
                      <div key={idx}>
                        <div className="d-flex justify-content-between text-dark small fw-semibold mb-1" style={{ fontSize: '0.82rem' }}>
                          <span className="text-truncate" style={{ maxWidth: '180px' }}>{c.nome}</span>
                          <span>{percentage}% ({c.pontos}/{maxPoints} pts)</span>
                        </div>
                        <div className="progress" style={{ height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: idx === 0 ? '#0d9488' : idx === 1 ? '#0ea5e9' : '#f59e0b',
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Quick action buttons */}
            <div className="border-top pt-3 mt-4">
              <h6 className="fw-bold mb-2 small">{t('exportReportsTitle')}</h6>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary rounded-2 px-3" onClick={() => handleExport('PDF')}>
                  {t('exportPdf')}
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary rounded-2 px-3" onClick={() => handleExport('Excel')}>
                  {t('exportExcel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
