import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { api, API_BASE_URL } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { ROLE } from '../constants/roles';
import SearchBar from './SearchBar';

const ITEMS_PER_PAGE = 5;

export default function GestorCandidaturaEspecial({ onDecision, canManage }) {
  const { t, i18n } = useTranslation();
  const { socket, triggerCountsUpdate, activeRole } = useAppContext();
  const isAdmin = canManage !== undefined ? canManage : Number(activeRole) === ROLE.ADMIN;
  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // PDF Viewer Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [activeAppForPdf, setActiveAppForPdf] = useState(null);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAppForReject, setSelectedAppForReject] = useState(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const url = statusFilter === 'all' ? '/candidatura_especial' : `/candidatura_especial?estado=${statusFilter}`;
      const res = await api.get(url);
      if (res.data?.success) {
        setCandidaturas(res.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao listar candidaturas especiais:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [statusFilter]);

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
    socket.on('nova_candidatura_especial', handleRealtimeUpdate);
    socket.on('candidatura_especial_aprovada', handleRealtimeUpdate);
    socket.on('candidatura_especial_recusada', handleRealtimeUpdate);
    socket.on('notification', handleRealtimeUpdate);

    return () => {
      socket.off('candidatura_especial_submetida', handleRealtimeUpdate);
      socket.off('nova_candidatura_especial', handleRealtimeUpdate);
      socket.off('candidatura_especial_aprovada', handleRealtimeUpdate);
      socket.off('candidatura_especial_recusada', handleRealtimeUpdate);
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
        text: t('linkCopied', 'Link copiado para a área de transferência com sucesso!'),
        timer: 1500,
        showConfirmButton: false
      });
    } catch {
      // Fallback
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

  // Aprovar candidatura
  const handleApprove = async (app) => {
    const result = await Swal.fire({
      icon: 'question',
      title: t('approveSpecialConfirmTitle', 'Aprovar Candidatura Especial?'),
      text: `${t('approveSpecialConfirmText', 'O consultor receberá a conquista e os pontos bónus.')} (${app.conquista_especial?.titulo})`,
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('approveBtn', 'Sim, Aprovar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (result.isConfirmed) {
      try {
        setSubmittingDecision(true);
        await api.patch(`/candidatura_especial/${app.id_candidatura_especial}/decisao`, {
          aprovada: true
        });
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('specialApprovedSuccess', 'Candidatura especial aprovada com sucesso!'),
          timer: 1600,
          showConfirmButton: false
        });
        fetchData();
        if (triggerCountsUpdate) triggerCountsUpdate();
        if (onDecision) onDecision();
      } catch (err) {
        console.error('Erro ao aprovar candidatura:', err);
        Swal.fire({
          icon: 'error',
          title: t('errorTitle', 'Erro'),
          text: err.response?.data?.message || t('errorGeneric', 'Erro ao aprovar candidatura.')
        });
      } finally {
        setSubmittingDecision(false);
      }
    }
  };

  // Abrir modal de recusa
  const handleOpenReject = (app) => {
    setSelectedAppForReject(app);
    setMotivoRecusa('');
    setRejectModalOpen(true);
  };

  // Submeter recusa
  const handleSubmitReject = async (e) => {
    e.preventDefault();
    if (!motivoRecusa.trim()) return;

    try {
      setSubmittingDecision(true);
      await api.patch(`/candidatura_especial/${selectedAppForReject.id_candidatura_especial}/decisao`, {
        aprovada: false,
        motivo_recusa: motivoRecusa.trim()
      });
      Swal.fire({
        icon: 'success',
        title: t('successTitle', 'Sucesso!'),
        text: t('specialRejectedSuccess', 'Candidatura especial recusada.'),
        timer: 1600,
        showConfirmButton: false
      });
      setRejectModalOpen(false);
      fetchData();
      if (triggerCountsUpdate) triggerCountsUpdate();
      if (onDecision) onDecision();
    } catch (err) {
      console.error('Erro ao recusar candidatura:', err);
      Swal.fire({
        icon: 'error',
        title: t('errorTitle', 'Erro'),
        text: err.response?.data?.message || t('errorGeneric', 'Erro ao recusar candidatura.')
      });
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Filtering & Pagination
  const filteredCandidaturas = useMemo(() => {
    if (!searchQuery.trim()) return candidaturas;
    const q = searchQuery.toLowerCase();
    return candidaturas.filter(
      (c) =>
        c.consultor?.nome?.toLowerCase().includes(q) ||
        c.consultor?.email?.toLowerCase().includes(q) ||
        c.conquista_especial?.titulo?.toLowerCase().includes(q)
    );
  }, [candidaturas, searchQuery]);

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
            📋 {t('tabEspeciaisApplications', 'Gestão de Candidaturas Especiais')}
          </h4>
          <p className="text-muted small mb-0">
            {t('manageAppsSubtitle', 'Validar comprovativos e aprovar atribuições de badges especiais')}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
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
              <option value="1">{t('statusSpecialSubmitted', 'Enviadas (Pendentes)')}</option>
              <option value="2">{t('statusSpecialApproved', 'Aprovadas')}</option>
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
                    <th>{t('colApplicant', 'Consultor')}</th>
                    <th>{t('colBadgeName', 'Badge Especial')}</th>
                    <th>{t('colApplicationDate', 'Data Submissão')}</th>
                    <th>{t('colProof', 'Comprovativo')}</th>
                    <th>{t('colMarcoStatus', 'Estado')}</th>
                    {isAdmin && <th className="text-end">{t('colActions', 'Ações')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedCandidaturas.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="text-center py-4 text-muted">
                        {t('noSpecialAppsFound', 'Nenhuma candidatura especial encontrada.')}
                      </td>
                    </tr>
                  ) : (
                    paginatedCandidaturas.map((app) => (
                      <tr key={app.id_candidatura_especial}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center border"
                              style={{ width: '34px', height: '34px', backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}
                            >
                              <span className="fw-bold small text-primary">
                                {app.consultor?.nome?.charAt(0) || 'C'}
                              </span>
                            </div>
                            <div className="d-flex flex-column">
                              <strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                                {app.consultor?.nome}
                              </strong>
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {app.consultor?.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '1.1rem' }}>🌟</span>
                            <strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                              {app.conquista_especial?.titulo}
                            </strong>
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
                            <span
                              className="users-status-badge closed-nok"
                              title={app.motivo_recusa || ''}
                            >
                              ❌ {t('statusSpecialRejected', 'Recusada')}
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="text-end">
                            {app.id_estado === 1 ? (
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn btn-sm btn-success py-1 px-2.5 rounded-2 d-flex align-items-center gap-1 fw-semibold"
                                  onClick={() => handleApprove(app)}
                                  disabled={submittingDecision}
                                >
                                  ✓ {t('approveBtn', 'Aprovar')}
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger py-1 px-2.5 rounded-2 d-flex align-items-center gap-1 fw-semibold"
                                  onClick={() => handleOpenReject(app)}
                                  disabled={submittingDecision}
                                >
                                  ✕ {t('rejectBtn', 'Recusar')}
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted small">
                                {app.id_estado === 2 ? t('conquered', 'Atribuído') : t('decided', 'Decidido')}
                              </span>
                            )}
                          </td>
                        )}
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

      {/* Modal de Recusa com Motivo Obrigatório */}
      {rejectModalOpen && (
        <>
          <div className="users-modal-overlay" style={{ zIndex: 1080 }} onClick={() => setRejectModalOpen(false)} />
          <div
            className="users-modal"
            style={{
              maxWidth: '520px',
              width: '92%',
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
              <h5 className="fw-bold mb-0 text-danger">
                ✕ {t('rejectSpecialModalTitle', 'Recusar Candidatura Especial')}
              </h5>
              <button
                type="button"
                className="users-modal-close"
                onClick={() => setRejectModalOpen(false)}
                disabled={submittingDecision}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitReject}>
              <div className="p-4">
                <p className="text-muted small mb-3">
                  {t('rejectSpecialPrompt', 'Indique o motivo pelo qual a candidatura está a ser recusada. O consultor receberá este feedback.')}
                </p>
                <div className="mb-3">
                  <label className="form-label small fw-bold" style={{ color: 'var(--text)' }}>
                    {t('rejectionReasonLabel', 'Motivo da Recusa *')}
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder={t('rejectionReasonPlaceholder', 'Indique o motivo pelo qual o comprovativo não foi validado...')}
                    value={motivoRecusa}
                    onChange={(e) => setMotivoRecusa(e.target.value)}
                    disabled={submittingDecision}
                    required
                    style={{
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      borderColor: 'var(--sidebar-border)',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              </div>
              <div className="users-modal-footer border-top p-3 d-flex justify-content-end gap-2 bg-panel" style={{ borderColor: 'var(--sidebar-border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary rounded-3 px-3 fw-semibold"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={submittingDecision}
                >
                  {t('cancelBtn', 'Cancelar')}
                </button>
                <button
                  type="submit"
                  className="btn btn-danger rounded-3 px-4 fw-semibold"
                  disabled={submittingDecision || !motivoRecusa.trim()}
                >
                  {submittingDecision ? t('submitting', 'A processar...') : t('rejectBtn', 'Confirmar Recusa')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
