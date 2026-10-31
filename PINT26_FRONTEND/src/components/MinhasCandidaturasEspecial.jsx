import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { api, API_BASE_URL } from '../services/api';
import { useAppContext } from '../context/AppContext';
import ViewEspecialModal from './ViewEspecialModal';
import SearchBar from './SearchBar';
import ModalRgpdCandidatura from './ModalRgpdCandidatura';

const ITEMS_PER_PAGE = 5;

export default function MinhasCandidaturasEspecial() {
  const { t, i18n } = useTranslation();
  const { socket } = useAppContext();
  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedViewId, setSelectedViewId] = useState(null);
  const [showRgpdModal, setShowRgpdModal] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [activeAppForPdf, setActiveAppForPdf] = useState(null);

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get('/candidatura_especial/minhas');
      if (res.data?.success) {
        setCandidaturas(res.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao listar minhas candidaturas especiais:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData, i18n.language]);

  // Real-time updates (atualização silenciosa)
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      fetchData(true);
    };

    socket.on('candidatura_especial_submetida', handleRealtimeUpdate);
    socket.on('candidatura_especial_aprovada', handleRealtimeUpdate);
    socket.on('candidatura_especial_recusada', handleRealtimeUpdate);
    socket.on('candidatura_aprovada', handleRealtimeUpdate);
    socket.on('candidatura_rejeitada', handleRealtimeUpdate);
    socket.on('notification', handleRealtimeUpdate);

    return () => {
      socket.off('candidatura_especial_submetida', handleRealtimeUpdate);
      socket.off('candidatura_especial_aprovada', handleRealtimeUpdate);
      socket.off('candidatura_especial_recusada', handleRealtimeUpdate);
      socket.off('candidatura_aprovada', handleRealtimeUpdate);
      socket.off('candidatura_rejeitada', handleRealtimeUpdate);
      socket.off('notification', handleRealtimeUpdate);
    };
  }, [socket, fetchData]);

  // Copiar link comprovativo de forma segura
  const handleCopyLink = async (url) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      Swal.fire({
        icon: 'success',
        title: t('copyLink', 'Copiar Link'),
        text: t('linkCopied', 'Link copiado para a área de transferência!'),
        timer: 1500,
        showConfirmButton: false
      });
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      Swal.fire({
        icon: 'success',
        title: t('copyLink', 'Copiar Link'),
        text: t('linkCopied', 'Link copiado para a área de transferência!'),
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  // Abrir modal de visualização segura do PDF
  const handleViewPdf = async (app) => {
    setActiveAppForPdf(app);
    setPdfModalOpen(true);
    setLoadingPdf(true);
    setPdfError(null);
    setPdfUrl(null);

    try {
      const res = await api.get(`/candidatura_especial/${app.id_candidatura_especial}/ficheiro`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
    } catch (err) {
      console.error('Erro ao carregar PDF:', err);
      setPdfError(t('errorGeneric', 'Não foi possível carregar o ficheiro PDF do servidor.'));
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleClosePdfModal = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setActiveAppForPdf(null);
    setPdfModalOpen(false);
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl || !activeAppForPdf) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `comprovativo_${activeAppForPdf.id_candidatura_especial}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Comutar partilha pública RGPD (Apenas para status 2 - Aprovada)
  const handleToggleShare = async (app, currentVal) => {
    const newVal = !currentVal;
    try {
      // Otimisticamente atualizar
      setCandidaturas((prev) =>
        prev.map((c) =>
          c.id_candidatura_especial === app.id_candidatura_especial
            ? { ...c, rgpd_partilha_conquista: newVal }
            : c
        )
      );

      await api.patch(`/candidatura_especial/${app.id_candidatura_especial}/share`, {
        rgpd_partilha_conquista: newVal
      });

      Swal.fire({
        icon: 'success',
        title: t('rgpdShareTitle', 'Partilha Pública'),
        text: newVal ? t('rgpdShareOn', 'Partilha pública ativada no perfil.') : t('rgpdShareOff', 'Partilha pública desativada.'),
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Erro ao comutar partilha RGPD:', err);
      // Reverter estado em caso de erro
      setCandidaturas((prev) =>
        prev.map((c) =>
          c.id_candidatura_especial === app.id_candidatura_especial
            ? { ...c, rgpd_partilha_conquista: currentVal }
            : c
        )
      );
      Swal.fire({
        icon: 'error',
        title: t('errorTitle', 'Erro'),
        text: err.response?.data?.message || t('errorGeneric', 'Erro ao alterar preferência de partilha.')
      });
    }
  };

  // Filtering & Pagination
  const filteredCandidaturas = useMemo(() => {
    let list = candidaturas;
    if (statusFilter !== 'all') {
      list = list.filter((c) => String(c.id_estado) === String(statusFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.badge_titulo?.toLowerCase().includes(q) || c.badge_descricao?.toLowerCase().includes(q));
    }
    return list;
  }, [candidaturas, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredCandidaturas.length / ITEMS_PER_PAGE) || 1;
  const paginatedCandidaturas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCandidaturas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCandidaturas, currentPage]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            📋 {t('tabMyEspeciaisApplications', 'Minhas Candidaturas a Badges Especiais')}
          </h4>
          <p className="text-muted small mb-0">
            {t('mySpecialAppsSubtitle', 'Consulte o histórico de submissões e gira a partilha pública dos badges conquistados')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm p-3 mb-4 rounded-3" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-8">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('searchAppsPlaceholder', 'Pesquisar candidaturas...')}
            />
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ backgroundColor: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
            >
              <option value="all">{t('allSpecialStatuses', 'Todos os Estados')}</option>
              <option value="1">{t('statusSpecialSubmitted', 'Enviadas (Em Análise)')}</option>
              <option value="2">{t('statusSpecialApproved', 'Aprovadas (Conquistadas)')}</option>
              <option value="3">{t('statusSpecialRejected', 'Recusadas')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading py-5">
            <div className="users-spinner" />
            <span>{t('loading', 'A carregar...')}</span>
          </div>
        ) : (
          <>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>{t('colBadgeName', 'Badge Especial')}</th>
                    <th>{t('colApplicationDate', 'Data Submissão')}</th>
                    <th>{t('colProof', 'Comprovativo')}</th>
                    <th>{t('colMarcoStatus', 'Estado')}</th>
                    <th>{t('rgpdShareTitle', 'Partilha Pública')}</th>
                    <th className="text-end">{t('colActions', 'Ações')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCandidaturas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        {t('noSpecialAppsFound', 'Ainda não submeteu nenhuma candidatura especial.')}
                      </td>
                    </tr>
                  ) : (
                    paginatedCandidaturas.map((app) => (
                      <tr key={app.id_candidatura_especial}>
                        <td>
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center p-1 border"
                            style={{ width: '40px', height: '40px', backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}
                          >
                            {app.logo_conquista ? (
                              <img
                                src={`${API_BASE_URL}/uploads/logo_especial/${app.logo_conquista}`}
                                alt={app.badge_titulo}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <span>🌟</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                              {app.badge_titulo}
                            </strong>
                            <span className="badge bg-warning text-dark fw-bold px-2 py-0.5 rounded-pill mt-1 align-self-start" style={{ fontSize: '0.72rem' }}>
                              +{app.pontos_bonus} pts
                            </span>
                          </div>
                        </td>
                        <td className="text-muted small">
                          {formatDate(app.data_candidatura)}
                        </td>
                        <td>
                          {app.url_comprovativo ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5"
                              onClick={() => handleCopyLink(app.url_comprovativo)}
                              title={app.url_comprovativo}
                            >
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              <span>{t('copyLink', 'Copiar Link')}</span>
                            </button>
                          ) : app.ficheiro_comprovativo ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5"
                              onClick={() => handleViewPdf(app)}
                            >
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span>{t('viewPdf', 'Ver PDF')}</span>
                            </button>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          {app.id_estado === 1 && (
                            <span className="users-status-badge submitted">
                              ⏳ {t('statusSpecialSubmitted', 'Enviada')}
                            </span>
                          )}
                          {app.id_estado === 2 && (
                            <span className="users-status-badge closed-ok">
                              ✅ {t('statusSpecialApproved', 'Aprovada')}
                            </span>
                          )}
                          {app.id_estado === 3 && (
                            <div className="d-flex flex-column">
                              <span className="users-status-badge closed-nok">
                                ❌ {t('statusSpecialRejected', 'Recusada')}
                              </span>
                              {app.motivo_recusa && (
                                <small className="text-danger mt-1 text-truncate" style={{ maxWidth: '160px' }} title={app.motivo_recusa}>
                                  {app.motivo_recusa}
                                </small>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {/* Switch RGPD visível EXCLUSIVAMENTE quando estado é 2 (Aprovada) */}
                          {app.id_estado === 2 ? (
                            <div className="d-flex align-items-center gap-2">
                              <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
                                <input
                                  className="form-check-input my-0 cursor-pointer"
                                  type="checkbox"
                                  role="switch"
                                  id={`shareSwitch_${app.id_candidatura_especial}`}
                                  checked={!!app.rgpd_partilha_conquista}
                                  onChange={() => handleToggleShare(app, app.rgpd_partilha_conquista)}
                                  style={{ width: '2.2em', height: '1.1em' }}
                                />
                                <label
                                  className="form-check-label small text-muted mb-0 cursor-pointer"
                                  htmlFor={`shareSwitch_${app.id_candidatura_especial}`}
                                  style={{ fontSize: '0.78rem' }}
                                >
                                  {app.rgpd_partilha_conquista ? t('rgpdShareOn', 'Ativo') : t('rgpdShareOff', 'Inativo')}
                                </label>
                              </div>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary p-1 px-1.5 rounded-2 d-inline-flex align-items-center"
                                title={t('btnRgpdCandidatura', 'RGPD de Candidatura')}
                                onClick={() => setShowRgpdModal(true)}
                                style={{ fontSize: '0.78rem' }}
                              >
                                📖
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-1 px-2.5 rounded-2 d-inline-flex align-items-center gap-1"
                            onClick={() => setSelectedViewId(app.id_conquista_especial)}
                          >
                            ℹ️ {t('viewEspecialDetails', 'Ver Detalhes')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredCandidaturas.length > 0 && (
              <div className="users-table-footer mt-3 d-flex justify-content-between align-items-center p-3">
                <span className="users-count-text text-muted small">
                  {t('showingItems', { shown: paginatedCandidaturas.length, total: filteredCandidaturas.length })}
                </span>
                <div className="users-pagination d-flex gap-1 align-items-center">
                  <button
                    className="users-pag-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    &laquo;
                  </button>
                  <span className="small px-2 text-muted">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="users-pag-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Detalhes do Badge */}
      {selectedViewId && (
        <ViewEspecialModal
          conquistaId={selectedViewId}
          onClose={() => setSelectedViewId(null)}
        />
      )}

      {/* Modal Visualização Segura do PDF */}
      {pdfModalOpen && (
        <>
          <div className="users-modal-overlay" style={{ zIndex: 1080 }} onClick={handleClosePdfModal} />
          <div
            className="users-modal"
            style={{
              maxWidth: '850px',
              width: '95%',
              zIndex: 1090,
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'var(--panel)',
              color: 'var(--text)',
              borderRadius: '16px',
              boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
              border: '1px solid var(--sidebar-border)',
              overflow: 'hidden'
            }}
          >
            <div className="users-modal-header border-bottom p-3 d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--sidebar-border)' }}>
              <h5 className="fw-bold mb-0">
                📄 {t('certificateTitle', 'Visualizador de Certificado PDF')}
              </h5>
              <button
                type="button"
                className="users-modal-close"
                onClick={handleClosePdfModal}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-4" style={{ height: '580px' }}>
              {loadingPdf ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                  <div className="users-spinner mb-3" />
                  <span className="text-muted">{t('loadingCertificate', 'A carregar o comprovativo PDF do servidor...')}</span>
                </div>
              ) : pdfError ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-danger text-center">
                  <h5>{pdfError}</h5>
                </div>
              ) : (
                <iframe
                  src={pdfUrl}
                  title="PDF Viewer"
                  width="100%"
                  height="100%"
                  className="border rounded-3"
                  style={{ borderColor: 'var(--sidebar-border)' }}
                />
              )}
            </div>
            <div className="users-modal-footer border-top p-3 d-flex justify-content-between bg-panel" style={{ borderColor: 'var(--sidebar-border)' }}>
              <button type="button" className="btn btn-secondary rounded-3" onClick={handleClosePdfModal}>
                {t('closeBtn', 'Fechar')}
              </button>
              {pdfUrl && (
                <button
                  type="button"
                  className="btn btn-success rounded-3 d-flex align-items-center gap-2 fw-semibold"
                  onClick={handleDownloadPdf}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>{t('downloadPdf', 'Descarregar PDF')}</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de RGPD de Candidatura */}
      {showRgpdModal && (
        <ModalRgpdCandidatura onClose={() => setShowRgpdModal(false)} />
      )}
    </div>
  );
}
