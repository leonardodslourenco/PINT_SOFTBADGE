import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAppContext } from '../context/AppContext';
import Swal from 'sweetalert2';
import ManualTranslationSwitch from './ManualTranslationSwitch';
import EvidenciaPdfModal from './EvidenciaPdfModal';

export default function ListagemPreApproval({ limit, onDataLoaded }) {
  const { t, i18n } = useTranslation();
  const { socket } = useAppContext();
  const [pendingApps, setPendingApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal evaluation states
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [appDetails, setAppDetails] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Manual Translation States
  const [manualTranslation, setManualTranslation] = useState(false);
  const [commentPt, setCommentPt] = useState('');
  const [commentEn, setCommentEn] = useState('');
  const [commentEs, setCommentEs] = useState('');

  // Evidence PDF Viewer states
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedEvidenciaName, setSelectedEvidenciaName] = useState('');

  // Fetch pending applications (estado = 2: Submitted)
  const fetchPending = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [resApps, resBadges] = await Promise.all([
        api.get('/candidatura_badge?estado=2'),
        api.get('/badge?ativo=true')
      ]);

      let rawApps = [];
      let badgesMap = {};

      if (resBadges.data?.success) {
        resBadges.data.data.forEach(b => {
          badgesMap[b.id_badge] = b;
        });
      }

      if (resApps.data?.success) {
        rawApps = resApps.data.data || [];
      }

      const enriched = rawApps.map(app => {
        const badgeInfo = badgesMap[app.id_badge];
        const currentLang = i18n.language || 'pt';
        return {
          ...app,
          badge: {
            ...app.badge,
            titulo: badgeInfo?.titulo || app.badge?.traducao_titulo?.[currentLang] || '—',
            area: badgeInfo?.area || '—',
            descricao: badgeInfo?.descricao || app.badge?.traducao_descricao?.[currentLang] || '—'
          }
        };
      });

      setPendingApps(enriched);
      if (onDataLoaded) {
        onDataLoaded(enriched.length);
      }
    } catch (err) {
      console.error('Error fetching pending applications for TM:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [i18n.language, onDataLoaded]);

  useEffect(() => {
    fetchPending(false);
  }, [fetchPending]);

  // Escutar atualizações via WebSocket em tempo real (atualização silenciosa)
  useEffect(() => {
    if (socket) {
      const handleRealtimeUpdate = (data) => {
        console.log('Atualização de candidatura recebida via WebSocket no TM:', data);
        setTimeout(() => {
          fetchPending(true);
        }, 400);
      };

      const handleBadgeEmitido = (data) => {
        console.log('Notificação de badge emitido recebida via WebSocket no TM:', data);
        setTimeout(() => {
          fetchPending(true);
        }, 400);
        Swal.fire({
          icon: 'info',
          title: t('tmBadgeIssuedTitle'),
          text: t('tmBadgeIssuedText'),
          confirmButtonText: 'OK',
          confirmButtonColor: '#2563eb'
        });
      };

      socket.on('candidatura_submetida', handleRealtimeUpdate);
      socket.on('candidatura_pre_aprovada', handleRealtimeUpdate);
      socket.on('candidatura_avancou', handleRealtimeUpdate);
      socket.on('candidatura_badge_emitido', handleBadgeEmitido);

      return () => {
        socket.off('candidatura_submetida', handleRealtimeUpdate);
        socket.off('candidatura_pre_aprovada', handleRealtimeUpdate);
        socket.off('candidatura_avancou', handleRealtimeUpdate);
        socket.off('candidatura_badge_emitido', handleBadgeEmitido);
      };
    }
  }, [socket, fetchPending, t]);

  const handleOpenDetails = async (appId) => {
    setSelectedAppId(appId);
    setLoadingDetails(true);
    setReviewComment('');
    setCommentPt('');
    setCommentEn('');
    setCommentEs('');
    setManualTranslation(false);
    try {
      const res = await api.get(`/candidatura_badge/${appId}`);
      if (res.data?.success) {
        const app = res.data.data;
        const currentLang = i18n.language || 'pt';
        const matched = pendingApps.find(a => a.id_candidatura === appId);

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
    setSelectedAppId(null);
    setAppDetails(null);
    setReviewComment('');
    setCommentPt('');
    setCommentEn('');
    setCommentEs('');
    setManualTranslation(false);
  };

  const handleViewEvidenciaPdf = async (ev) => {
    if (!ev) return;
    const evidenceId = ev.id_evidencia_candidatura || ev.id_evidencia;
    if (!evidenceId) {
      if (ev.url_ficheiro || ev.descricao_url) {
        window.open(ev.url_ficheiro || ev.descricao_url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    try {
      setLoadingPdf(true);
      setPdfError(null);
      setSelectedEvidenciaName(ev.nome_ficheiro || 'evidencia.pdf');
      setPdfModalOpen(true);

      const res = await api.get(`/evidencia_candidatura/${evidenceId}/view`, {
        responseType: 'blob'
      });

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setPdfUrl(objectUrl);
    } catch (err) {
      console.error('Erro ao carregar evidência:', err);
      let errorMsg = t('errorLoadingPdfMsg', 'Erro ao carregar o comprovativo PDF do servidor.');
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed?.message) {
            errorMsg = parsed.message;
          }
        } catch (parseErr) {
          // ignore
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setPdfError(errorMsg);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleClosePdfModal = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setPdfModalOpen(false);
    setPdfError(null);
  };

  const handleValidateEvidence = async (evidenceId, isApproved) => {
    try {
      const res = await api.put(`/evidencia_candidatura/${evidenceId}/validacao`, {
        aprovado: isApproved
      });

      if (res.data?.success) {
        setAppDetails(prev => {
          if (!prev) return null;
          const updatedEvidences = prev.evidencias.map(ev => {
            if (ev.id_evidencia_candidatura === evidenceId) {
              return { ...ev, validado_tm: isApproved };
            }
            return ev;
          });
          return { ...prev, evidencias: updatedEvidences };
        });

        Swal.fire({
          icon: 'success',
          title: 'Evidência Atualizada',
          text: isApproved ? 'Documento pré-aprovado.' : 'Documento recusado.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Error validating evidence:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível validar esta evidência.'
      });
    }
  };

  const handleDecision = async (tipoAcao, novoEstado) => {
    if (manualTranslation) {
      if (!commentPt.trim() && !commentEn.trim() && !commentEs.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Comentário Requerido',
          text: 'Por favor, insira um comentário em pelo menos um dos idiomas.'
        });
        return;
      }
    } else {
      if (!reviewComment.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Comentário Requerido',
          text: 'Por favor, insira um comentário de feedback para justificar a sua decisão.'
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const commentPayload = manualTranslation ? {
        pt: commentPt.trim(),
        en: commentEn.trim(),
        es: commentEs.trim()
      } : reviewComment.trim();

      const res = await api.post('/acao_candidatura', {
        id_candidatura: appDetails.id_candidatura,
        tipo_acao_candidatura: tipoAcao,
        novo_estado: novoEstado,
        comentario: commentPayload
      });

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: tipoAcao === 4 ? 'Candidatura Pré-Aprovada' : 'Candidatura Recusada',
          text: tipoAcao === 4 ? 'Enviada com sucesso para validação final do SLL.' : 'Devolvida ao consultor para correção.',
          timer: 2500,
          showConfirmButton: false
        });
        handleCloseDetails();
        fetchPending();
      }
    } catch (err) {
      console.error('Error submitting application action:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.response?.data?.message || 'Não foi possível gravar a sua decisão.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const displayApps = limit ? pendingApps.slice(0, limit) : pendingApps;

  return (
    <>
      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>{t('consultantCol')}</th>
              <th>{t('menuBadges')}</th>
              <th>{t('areaLabel')}</th>
              <th>{t('colDate')}</th>
              <th>{t('colStatus')}</th>
              <th className="text-end">{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {displayApps.length === 0 ? (
              <tr>
                <td colSpan="6" className="users-empty-row">
                  {t('noPendingPreApproval')}
                </td>
              </tr>
            ) : (
              displayApps.map((app) => (
                <tr key={app.id_candidatura}>
                  <td className="users-name-cell">
                    <div className="d-flex flex-column">
                      <strong className="text-dark">{app.consultor?.nome} {app.consultor?.apelido}</strong>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{app.consultor?.email}</span>
                    </div>
                  </td>
                  <td>{app.badge?.titulo}</td>
                  <td>{app.badge?.area}</td>
                  <td>{formatDate(app.data_candidatura)}</td>
                  <td>
                    <span className="users-status-badge active" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                      {t('statusPendingTm')}
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
                        <span>{t('analyzeBtn', 'Analisar')}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Evaluation details */}
      {selectedAppId && appDetails && (
        <>
          <div className="users-modal-overlay" onClick={handleCloseDetails} />
          <div className="users-modal" style={{ maxWidth: '780px', width: '92%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="users-modal-header" style={{ flexShrink: 0 }}>
              <h5>{t('evalTitleTm')}</h5>
              <button className="users-modal-close" onClick={handleCloseDetails}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
              {loadingDetails ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                </div>
              ) : (
                <>
                  {/* Candidate and Badge general info */}
                  <div className="row g-3 mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-bold mb-1">{t('consultantCol')}</label>
                      <div className="fw-semibold" style={{ color: 'var(--text)' }}>
                        {appDetails.consultor?.nome} {appDetails.consultor?.apelido}
                      </div>
                      <span className="text-muted small">{appDetails.consultor?.email}</span>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="text-muted small fw-bold mb-1">Badge</label>
                      <div className="fw-semibold" style={{ color: 'var(--text)' }}>{appDetails.badge?.titulo}</div>
                      <span className="badge bg-secondary-subtle text-secondary border px-2 py-0.5 mt-1" style={{ fontSize: '0.72rem' }}>
                        {appDetails.badge?.area}
                      </span>
                    </div>
                  </div>

                  {/* Submission date & status info */}
                  <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: 'var(--panel-2)', border: '1px solid var(--sidebar-border)' }}>
                    <div className="row g-2 text-center">
                      <div className="col-6 border-end" style={{ borderColor: 'var(--sidebar-border)' }}>
                        <span className="text-muted small d-block">{t('colDate')}</span>
                        <strong className="small" style={{ color: 'var(--text)' }}>{formatDate(appDetails.data_candidatura)}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted small d-block">{t('colStatus')}</span>
                        <span className="badge bg-primary-subtle text-primary border px-2.5 py-0.5" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {t('statusPendingTm')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Evidences list validation panel */}
                  <h6 className="fw-bold mb-3" style={{ color: 'var(--text)' }}>Documentos & Evidências Submetidas</h6>
                  <div className="d-flex flex-column gap-3 mb-4">
                    {appDetails.evidencias?.map((ev, index) => (
                      <div key={ev.id_evidencia_candidatura} className="p-3 border rounded-3 d-flex flex-column gap-2" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="text-truncate" style={{ maxWidth: '65%' }}>
                            <strong className="small text-truncate d-block" style={{ color: 'var(--text)' }}>{index + 1}. {ev.requisito?.titulo || `Requisito #${ev.id_requisito || ev.id_requisito_nivel}`}</strong>
                            {ev.nome_ficheiro && (
                              <span className="text-muted small d-block text-truncate" style={{ fontSize: '0.75rem' }}>
                                📄 {ev.nome_ficheiro}
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 fw-semibold rounded-3 px-2.5 py-1 mt-1"
                              onClick={() => handleViewEvidenciaPdf(ev)}
                            >
                              <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                              </svg>
                              {t('viewEvidenceBtn', 'Ver Evidência')}
                            </button>
                          </div>
                          <div className="d-flex align-items-center gap-1.5">
                            <button
                              type="button"
                              className={`btn btn-sm px-2.5 py-1 fw-bold rounded-3 ${ev.validado_tm === true ? 'btn-success text-white' : 'btn-outline-success'}`}
                              onClick={() => handleValidateEvidence(ev.id_evidencia_candidatura, true)}
                              style={{ fontSize: '0.75rem' }}
                            >
                              ✓ Pré-Aprovar
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm px-2.5 py-1 fw-bold rounded-3 ${ev.validado_tm === false ? 'btn-danger text-white' : 'btn-outline-danger'}`}
                              onClick={() => handleValidateEvidence(ev.id_evidencia_candidatura, false)}
                              style={{ fontSize: '0.75rem' }}
                            >
                              ✗ Recusar
                            </button>
                          </div>
                        </div>
                        {ev.descricao_url && (
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <span className="text-muted small">Link Externo:</span>
                            <a href={ev.descricao_url} target="_blank" rel="noopener noreferrer" className="small text-decoration-underline" style={{ color: '#0d6efd', fontWeight: 600 }}>
                              Abrir Link ↗
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Review feedback text area */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="form-label fw-bold small mb-0" style={{ color: 'var(--text)' }}>{t('feedbackLabel')}</label>
                      <ManualTranslationSwitch
                        checked={manualTranslation}
                        onChange={(val) => setManualTranslation(val)}
                      />
                    </div>
                    
                    {!manualTranslation ? (
                      <textarea
                        className="form-control rounded-3"
                        rows="3"
                        placeholder={t('feedbackPlaceholder')}
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                      />
                    ) : (
                      <div className="d-flex flex-column gap-2 mt-2">
                        <div>
                          <label className="small text-muted mb-1">{t('commentPtLabel')}</label>
                          <textarea
                            className="form-control rounded-3"
                            rows="2"
                            placeholder={t('commentPtLabel').replace(' *', '')}
                            value={commentPt}
                            onChange={e => setCommentPt(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="small text-muted mb-1">{t('commentEnLabel')}</label>
                          <textarea
                            className="form-control rounded-3"
                            rows="2"
                            placeholder={t('commentEnLabel').replace(' *', '')}
                            value={commentEn}
                            onChange={e => setCommentEn(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="small text-muted mb-1">{t('commentEsLabel')}</label>
                          <textarea
                            className="form-control rounded-3"
                            rows="2"
                            placeholder={t('commentEsLabel').replace(' *', '')}
                            value={commentEs}
                            onChange={e => setCommentEs(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="users-modal-actions" style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid var(--sidebar-border)', backgroundColor: 'var(--panel)', display: 'flex', justifyItems: 'center', justifyContent: 'end', gap: '12px', marginTop: 0 }}>
              <button type="button" className="users-modal-cancel" onClick={handleCloseDetails}>
                {t('cancelBtn')}
              </button>
              <button
                type="button"
                className="btn btn-danger text-white fw-bold rounded-3 px-3"
                disabled={submitting || loadingDetails}
                onClick={() => handleDecision(3, 1)} // Rejeitar TM -> Devolve a Rascunho (1)
              >
                ✗ {t('devolverBtn')}
              </button>
              <button
                type="button"
                className="btn btn-success text-white fw-bold rounded-3 px-3"
                disabled={submitting || loadingDetails}
                onClick={() => handleDecision(4, 3)} // Pré-Aprovar TM -> Envia para SLL (3)
              >
                ✓ {t('preAprovarBtn', 'Pré-Aprovar Candidatura')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de Pré-Visualização de Evidência PDF */}
      <EvidenciaPdfModal
        isOpen={pdfModalOpen}
        onClose={handleClosePdfModal}
        pdfUrl={pdfUrl}
        fileName={selectedEvidenciaName}
        loading={loadingPdf}
        error={pdfError}
      />
    </>
  );
}
