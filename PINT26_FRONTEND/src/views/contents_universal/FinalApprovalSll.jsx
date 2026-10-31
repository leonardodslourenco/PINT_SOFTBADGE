import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Swal from 'sweetalert2';
import ManualTranslationSwitch from '../../components/ManualTranslationSwitch';
import ContagemEstadoCandidaturas from '../../components/ContagemEstadoCandidaturas';
import EvidenciaPdfModal from '../../components/EvidenciaPdfModal';

export default function FinalApprovalSll() {
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

  // Fetch pending SLL applications (estado = 3: Em Validação)
  const fetchPending = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [resApps, resBadges] = await Promise.all([
        api.get('/candidatura_badge?estado=3'),
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
    } catch (err) {
      console.error('Error fetching SLL pending approvals:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [i18n.language]);

  useEffect(() => {
    fetchPending(false);
  }, [fetchPending]);

  // Escutar atualizações via WebSocket em tempo real para o SLL (atualização silenciosa)
  useEffect(() => {
    if (socket) {
      const handleRealtimeUpdate = (data) => {
        console.log('Atualização de candidatura recebida via WebSocket no SLL:', data);
        setTimeout(() => {
          fetchPending(true);
        }, 400);
      };

      socket.on('candidatura_submetida', handleRealtimeUpdate);
      socket.on('candidatura_pre_aprovada', handleRealtimeUpdate);
      socket.on('candidatura_avancou', handleRealtimeUpdate);
      socket.on('candidatura_badge_emitido', handleRealtimeUpdate);
      
      return () => {
        socket.off('candidatura_submetida', handleRealtimeUpdate);
        socket.off('candidatura_pre_aprovada', handleRealtimeUpdate);
        socket.off('candidatura_avancou', handleRealtimeUpdate);
        socket.off('candidatura_badge_emitido', handleRealtimeUpdate);
      };
    }
  }, [socket, fetchPending]);

  // Open SLL review modal
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
      console.error('Error loading candidatura details for SLL:', err);
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

  // Validate individual evidence by SLL (PUT /evidencia_candidatura/:id/validacao)
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
              return { ...ev, validado_sll: isApproved };
            }
            return ev;
          });
          return { ...prev, evidencias: updatedEvidences };
        });

        Swal.fire({
          icon: 'success',
          title: t('sllEvidenceTitle'),
          text: isApproved ? t('sllEvidenceValidated') : t('sllEvidenceRejected'),
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Error validating evidence as SLL:', err);
      Swal.fire({
        icon: 'error',
        title: t('sllErrorTitle'),
        text: t('sllValidationError')
      });
    }
  };

  // Process overall SLL decision
  // decisionType: 6 = Approve (APROVADA_SLL), 7 = Reject (REJEITADA_SLL), 5 = Send Back (DEVOLVIDA_SLL)
  // targetState: 4 = Closed OK, 5 = Closed NOK, 1 = Open
  const handleDecision = async (decisionType, targetState) => {
    if (manualTranslation) {
      if (!commentPt.trim() && !commentEn.trim() && !commentEs.trim()) {
        Swal.fire({
          icon: 'warning',
          title: t('sllCommentRequired'),
          text: t('sllCommentRequiredMulti')
        });
        return;
      }
    } else {
      if (!reviewComment.trim()) {
        Swal.fire({
          icon: 'warning',
          title: t('sllCommentRequired'),
          text: t('sllCommentRequiredSingle')
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. If SLL Approved (6), emit/attribute the Badge first
      if (decisionType === 6) {
        await api.post('/badge_atribuido', {
          id_candidato: appDetails.id_utilizador,
          id_badge: appDetails.id_badge,
          id_candidatura: appDetails.id_candidatura,
          pontos_adquiridos: appDetails.badge?.pontos || 100
        });
      }

      // 2. Submit the overall decision action
      const commentPayload = manualTranslation ? {
        pt: commentPt.trim(),
        en: commentEn.trim(),
        es: commentEs.trim()
      } : reviewComment.trim();

      const res = await api.post('/acao_candidatura', {
        id_candidatura: appDetails.id_candidatura,
        tipo_acao_candidatura: decisionType,
        novo_estado: targetState,
        comentario: commentPayload
      });

      if (res.data?.success) {
        let msgTitle = t('sllDecisionApproved');
        let msgDesc = t('sllDecisionApprovedDesc');
        if (decisionType === 7) {
          msgTitle = t('sllDecisionRejected');
          msgDesc = t('sllDecisionRejectedDesc');
        } else if (decisionType === 5) {
          msgTitle = t('sllDecisionReturned');
          msgDesc = t('sllDecisionReturnedDesc');
        }

        Swal.fire({
          icon: 'success',
          title: msgTitle,
          text: msgDesc,
          timer: 2500,
          showConfirmButton: false
        });
        handleCloseDetails();
        fetchPending();
      }
    } catch (err) {
      console.error('Error submitting SLL action decision:', err);
      Swal.fire({
        icon: 'error',
        title: t('sllErrorTitle'),
        text: err.response?.data?.message || t('sllDecisionError')
      });
    } finally {
      setSubmitting(false);
    }
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
          // ignore json parse error
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

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1">{t('finalApprovalTitle')}</h3>
        <p className="text-muted small mb-0">{t('finalApprovalSubtitle')}</p>
      </div>

      {/* Status Count Mini Cards Component */}
      <ContagemEstadoCandidaturas />

      {/* Pending approvals table */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="users-spinner" />
            <span>{t('loadingUsers')}</span>
          </div>
        ) : (
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
                {pendingApps.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="users-empty-row">
                      {t('noPendingFinalApproval')}
                    </td>
                  </tr>
                ) : (
                  pendingApps.map((app) => (
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
                        <span className="users-status-badge validation">
                          {t('statusAwaitingSll')}
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
                            <span>{t('validateBtn')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal SLL Evaluation */}
      {selectedAppId && (
        <>
          <div className="users-modal-overlay" onClick={handleCloseDetails} />
          <div className="users-modal" style={{ maxWidth: '720px', width: '90%' }}>
            <div className="users-modal-header">
              <h5>{t('sllEvalTitle')}</h5>
              <button className="users-modal-close" onClick={handleCloseDetails}>
                <svg viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '24px' }}>
              {loadingDetails || !appDetails ? (
                <div className="text-center py-5">
                  <div className="users-spinner small mx-auto mb-2" />
                  <span>{t('sllLoadingDetails')}</span>
                </div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  
                  {/* Candidate metadata */}
                  <div className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-muted small d-block uppercase-label" style={{ fontSize: '0.7rem', fontWeight: 700 }}>{t('sllCollaboratorLabel')}</span>
                      <h6 className="fw-bold mb-0">{appDetails.consultor?.nome} {appDetails.consultor?.apelido}</h6>
                      <span className="text-muted small">{appDetails.consultor?.email}</span>
                    </div>
                    <div className="text-end">
                      <span className="text-muted small d-block uppercase-label" style={{ fontSize: '0.7rem', fontWeight: 700 }}>{t('sllSubmissionDateLabel')}</span>
                      <span className="text-dark fw-semibold small">{formatDate(appDetails.data_candidatura)}</span>
                    </div>
                  </div>

                  {/* Badge details */}
                  <div className="d-flex gap-3 align-items-center bg-light p-3 rounded-3">
                    <div className="kpi-icon-wrapper" style={{ width: 56, height: 56, minWidth: 56 }}>
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="7" />
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">{appDetails.badge?.titulo}</h6>
                      <span className="text-muted small d-block">{appDetails.badge?.area} — {t('pointsLabel').replace('{pts}', appDetails.badge?.pontos)}</span>
                    </div>
                  </div>

                  {/* Evidences list to evaluate */}
                  <div>
                    <h6 className="fw-bold mb-3">{t('sllEvidencesTitle')}</h6>
                    <div className="d-flex flex-column gap-3">
                      {appDetails.evidencias?.length === 0 ? (
                        <div className="text-muted small py-2">{t('sllNoEvidences')}</div>
                      ) : (
                        appDetails.evidencias.map((ev, idx) => (
                          <div key={idx} className="p-3 border rounded-3 bg-white d-flex flex-column gap-2">
                            
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="text-truncate" style={{ maxWidth: '65%' }}>
                                <strong className="text-dark d-block text-truncate">{ev.nome_ficheiro}</strong>
                                <span className="text-muted small d-block">
                                  {ev.requisito?.titulo ? ev.requisito.titulo : `Requisito #${ev.id_requisito || ev.id_requisito_nivel}`}
                                </span>
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
                              
                              <div className="d-flex flex-column align-items-end gap-1">
                                {/* TM validation tag */}
                                <span className={`badge ${ev.validado_tm ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`} style={{ fontSize: '0.75rem' }}>
                                  TM: {ev.validado_tm ? t('sllTmApproved') : t('sllTmRejected')}
                                </span>
                                
                                {/* SLL current validation tag */}
                                <span className={`badge ${ev.validado_sll === true ? 'bg-success' : ev.validado_sll === false ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '0.75rem' }}>
                                  SLL: {ev.validado_sll === true ? t('sllTmApproved') : ev.validado_sll === false ? t('sllTmRejected') : t('sllPending')}
                                </span>
                              </div>
                            </div>

                            {/* Validation buttons */}
                            <div className="d-flex gap-2 border-top pt-2 mt-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-success fw-semibold"
                                onClick={() => handleValidateEvidence(ev.id_evidencia_candidatura, true)}
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              >
                                {t('sllValidateEvBtn')}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger fw-semibold"
                                onClick={() => handleValidateEvidence(ev.id_evidencia_candidatura, false)}
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              >
                                {t('sllRejectEvBtn')}
                              </button>
                            </div>

                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Feedback textarea */}
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-bold mb-0 small">{t('feedbackLabel')}</label>
                      <ManualTranslationSwitch
                        checked={manualTranslation}
                        onChange={(val) => setManualTranslation(val)}
                      />
                    </div>

                    {!manualTranslation ? (
                      <textarea
                        className="form-control rounded-3"
                        rows="3"
                        placeholder={t('sllFeedbackPlaceholder')}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        <div>
                          <label className="form-label small text-muted mb-1 fw-semibold">Português (PT)</label>
                          <textarea
                            className="form-control rounded-3"
                            rows="2"
                            placeholder="Parecer técnico em Português..."
                            value={commentPt}
                            onChange={(e) => setCommentPt(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="form-label small text-muted mb-1 fw-semibold">English (EN)</label>
                          <textarea
                            className="form-control rounded-3"
                            rows="2"
                            placeholder="Technical feedback in English..."
                            value={commentEn}
                            onChange={(e) => setCommentEn(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="form-label small text-muted mb-1 fw-semibold">Español (ES)</label>
                          <textarea
                            className="form-control rounded-3"
                            rows="2"
                            placeholder="Opinión técnica en Español..."
                            value={commentEs}
                            onChange={(e) => setCommentEs(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseDetails}
                      style={{ padding: '10px 18px', borderRadius: '8px', fontSize: '0.85rem' }}
                    >
                      {t('closeBtn')}
                    </button>
                    
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-warning text-dark fw-bold"
                        disabled={submitting}
                        onClick={() => handleDecision(5, 1)} // 5 = Devolvida SLL (Send Back), 1 = Open
                        style={{ padding: '10px 18px', borderRadius: '8px', fontSize: '0.85rem' }}
                      >
                        {t('devolverBtn')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger fw-bold"
                        disabled={submitting}
                        onClick={() => handleDecision(7, 5)} // 7 = Rejeitada SLL, 5 = Closed NOK (Indeferida)
                        style={{ padding: '10px 18px', borderRadius: '8px', fontSize: '0.85rem' }}
                      >
                        {t('sllRejectAppBtn')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-success fw-bold"
                        disabled={submitting}
                        onClick={() => handleDecision(6, 4)} // 6 = Aprovada SLL, 4 = Closed (Homologada/Atribuída)
                        style={{ padding: '10px 18px', borderRadius: '8px', fontSize: '0.85rem' }}
                      >
                        {t('sllApproveBtn')}
                      </button>
                    </div>
                  </div>

                </div>
              )}
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
    </div>
  );
}
