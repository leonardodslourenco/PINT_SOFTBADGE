import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { api, API_BASE_URL } from '../services/api';
import ManualTranslationSwitch from './ManualTranslationSwitch';

export default function RenewDetailsModal({ renewalId, onClose, onUpdated, isModerator = false }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'pt';

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);

  // Rejection panel & manual translation state
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [manualTranslation, setManualTranslation] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [commentPt, setCommentPt] = useState('');
  const [commentEn, setCommentEn] = useState('');
  const [commentEs, setCommentEs] = useState('');

  // PDF Inline Preview modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewFileName, setPreviewFileName] = useState('');

  // Upload evidence (Consultant only when pending)
  const [selectedReqForUpload, setSelectedReqForUpload] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!renewalId) return;
    try {
      setLoading(true);
      const res = await api.get(`/renovacao_badge/${renewalId}`);
      if (res.data?.success) {
        setDetails(res.data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes da renovação:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: t('errorLoadingDetails', 'Não foi possível carregar os detalhes do pedido de renovação.'),
        confirmButtonColor: '#0284c7'
      });
    } finally {
      setLoading(false);
    }
  }, [renewalId, t]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Formatar data
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Abrir visualização de PDF
  const handleViewPdf = async (ev) => {
    try {
      const res = await api.get(`/renovacao_badge/evidencia/${ev.id_evidencia_renovacao}/view`, {
        responseType: 'blob'
      });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPreviewPdfUrl(blobUrl);
      setPreviewFileName(ev.nome_ficheiro || 'Evidência.pdf');
    } catch (err) {
      console.error('Erro ao visualizar PDF:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: t('errorOpeningPdf', 'Não foi possível abrir o ficheiro PDF da evidência.'),
        confirmButtonColor: '#0284c7'
      });
    }
  };

  // Download do ficheiro
  const handleDownloadFile = async (ev) => {
    try {
      const res = await api.get(`/renovacao_badge/evidencia/${ev.id_evidencia_renovacao}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', ev.nome_ficheiro || 'evidencia_renovacao.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erro ao descarregar ficheiro:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: t('errorDownloadingFile', 'Não foi possível descarregar o ficheiro da evidência.'),
        confirmButtonColor: '#0284c7'
      });
    }
  };

  // Validar evidência individualmente (Moderador)
  const handleValidateEvidence = async (idEvidencia, valid) => {
    try {
      const res = await api.put(`/renovacao_badge/evidencia/${idEvidencia}/validacao`, {
        validado_moderador: valid
      });
      if (res.data?.success) {
        // Atualizar lista local
        setDetails(prev => ({
          ...prev,
          evidencias: (prev.evidencias || []).map(e => 
            e.id_evidencia_renovacao === idEvidencia ? { ...e, validado_moderador: valid } : e
          )
        }));
      }
    } catch (err) {
      console.error('Erro ao validar evidência:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: t('errorValidatingEvidence', 'Erro ao validar a evidência.'),
        confirmButtonColor: '#0284c7'
      });
    }
  };

  // Upload de nova evidência avulsa
  const handleUploadSingleEvidence = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedReqForUpload) return;

    try {
      setUploadingEvidence(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('id_requisito', selectedReqForUpload);

      const res = await api.post(`/renovacao_badge/${renewalId}/evidencia`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('evidenceUploadedSuccess', 'Evidência Enviada!'),
          text: t('evidenceUploadedMsg', 'A evidência foi anexada com sucesso ao pedido de renovação.'),
          timer: 2000,
          showConfirmButton: false
        });
        setSelectedReqForUpload('');
        fetchDetails();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error('Erro ao enviar evidência:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('errorUploadingEvidence', 'Erro ao enviar ficheiro.'),
        confirmButtonColor: '#0284c7'
      });
    } finally {
      setUploadingEvidence(false);
    }
  };

  // Aprovar Renovação
  const handleApprove = async () => {
    const confirm = await Swal.fire({
      title: t('confirmApproveRenewalTitle', 'Aprovar Renovação?'),
      text: t('confirmApproveRenewalText', 'O badge será renovado com sucesso e os respetivos pontos serão atribuídos ao consultor.'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('btnApproveRenewal', 'Sim, Aprovar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (!confirm.isConfirmed) return;

    try {
      setProcessingAction(true);
      const res = await api.put(`/renovacao_badge/${renewalId}/aprovar`);
      if (res.data?.success) {
        await Swal.fire({
          icon: 'success',
          title: t('renewalApprovedTitle', 'Renovação Aprovada!'),
          text: t('renewalApprovedMsg', 'O pedido foi aprovado com sucesso.'),
          confirmButtonColor: '#10b981'
        });
        if (onUpdated) onUpdated();
        onClose();
      }
    } catch (err) {
      console.error('Erro ao aprovar renovação:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('errorApprovingRenewal', 'Erro ao aprovar renovação.'),
        confirmButtonColor: '#0284c7'
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Recusar Renovação
  const handleReject = async () => {
    let finalComment = '';
    if (manualTranslation) {
      finalComment = commentPt.trim() || commentEn.trim() || commentEs.trim();
      if (!commentPt.trim() && !commentEn.trim() && !commentEs.trim()) {
        Swal.fire({
          icon: 'warning',
          title: t('requiredField', 'Campo Obrigatório'),
          text: t('mustProvideRejectReason', 'Deve introduzir a justificação da recusa.'),
          confirmButtonColor: '#0284c7'
        });
        return;
      }
    } else {
      finalComment = rejectComment.trim();
      if (!finalComment) {
        Swal.fire({
          icon: 'warning',
          title: t('requiredField', 'Campo Obrigatório'),
          text: t('mustProvideRejectReason', 'Deve introduzir a justificação da recusa.'),
          confirmButtonColor: '#0284c7'
        });
        return;
      }
    }

    const confirm = await Swal.fire({
      title: t('confirmRejectRenewalTitle', 'Recusar Renovação?'),
      text: t('confirmRejectRenewalText', 'O consultor será notificado da recusa do pedido com a justificação introduzida.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('btnRejectRenewal', 'Sim, Recusar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (!confirm.isConfirmed) return;

    try {
      setProcessingAction(true);
      const res = await api.put(`/renovacao_badge/${renewalId}/rejeitar`, {
        comentario: finalComment
      });

      if (res.data?.success) {
        await Swal.fire({
          icon: 'success',
          title: t('renewalRejectedTitle', 'Pedido Recusado'),
          text: t('renewalRejectedMsg', 'O pedido de renovação foi recusado.'),
          confirmButtonColor: '#ef4444'
        });
        if (onUpdated) onUpdated();
        onClose();
      }
    } catch (err) {
      console.error('Erro ao recusar renovação:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('errorRejectingRenewal', 'Erro ao recusar renovação.'),
        confirmButtonColor: '#0284c7'
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const [logoFailed, setLogoFailed] = useState(false);
  const [failedAvatars, setFailedAvatars] = useState({});

  const badge = details?.badge;
  const consultor = details?.consultor;
  const moderador = details?.moderador;
  const isPending = details?.renovacao_aprovada === null;
  const isApproved = details?.renovacao_aprovada === true;
  const isRejected = details?.renovacao_aprovada === false;

  const badgeLogoSrc = badge?.logo
    ? `${API_BASE_URL}/uploads/logo_badges/${badge.logo}`
    : null;

  return (
    <>
      <div className="users-modal-overlay" style={{ zIndex: 1080 }} onClick={onClose} />
      <div 
        className="users-modal" 
        style={{ 
          maxWidth: '750px', 
          width: '92%', 
          zIndex: 1090, 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          backgroundColor: 'var(--panel, #ffffff)', 
          borderRadius: '16px', 
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Modal Header */}
        <div className="p-3 p-md-4 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
          <div className="d-flex align-items-center gap-3">
            <div 
              className="d-flex align-items-center justify-content-center rounded-3 p-2 flex-shrink-0"
              style={{ width: '52px', height: '52px', backgroundColor: 'var(--bg-icon, rgba(2,132,199,0.12))' }}
            >
              {badgeLogoSrc && !logoFailed ? (
                <img 
                  src={badgeLogoSrc} 
                  alt={badge?.nome} 
                  style={{ width: '38px', height: '38px', objectFit: 'contain' }}
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none" className="text-primary">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              )}
            </div>
            <div>
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)' }}>
                {badge?.nome || t('renewalDetailsTitle', 'Detalhes da Renovação')}
              </h5>
              <span className="small text-muted">
                {badge?.lp_nome} • {badge?.area_nome}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            aria-label="Close" 
            onClick={onClose}
            disabled={processingAction}
            style={{ filter: 'var(--close-filter, none)' }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-3 p-md-4 overflow-y-auto" style={{ flex: 1 }}>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="mt-2 text-muted small">{t('loadingDetails', 'A carregar detalhes...')}</p>
            </div>
          ) : !details ? (
            <div className="alert alert-warning">
              {t('detailsNotFound', 'Não foi possível encontrar as informações deste pedido.')}
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">

              {/* Status Banner */}
              <div className="d-flex flex-wrap align-items-center justify-content-between p-3 rounded-3 border" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                <div>
                  <span className="small text-muted d-block">{t('requestDate', 'Data do Pedido')}:</span>
                  <span className="fw-semibold small" style={{ color: 'var(--text)' }}>{formatDate(details.data_pedido)}</span>
                </div>

                <div className="text-end">
                  <span className="small text-muted d-block mb-1">{t('currentStatus', 'Estado Atual')}:</span>
                  {isPending && (
                    <span className="renew-status-badge pending">
                      <span className="badge-icon">⏳</span>
                      <span>{t('statusPendente', 'Pendente (Em Análise)')}</span>
                    </span>
                  )}
                  {isApproved && (
                    <span className="renew-status-badge approved">
                      <span className="badge-icon">✓</span>
                      <span>{t('statusApproved', 'Aprovado')} (+{details.pontos_renovacao || badge?.pontos_renovacao || 0} pts)</span>
                    </span>
                  )}
                  {isRejected && (
                    <span className="renew-status-badge rejected">
                      <span className="badge-icon">✕</span>
                      <span>{t('statusRejected', 'Recusado')}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Consultor / Moderador Info */}
              <div className="row g-3">
                {consultor && (
                  <div className={moderador ? 'col-md-6' : 'col-12'}>
                    <div className="p-3 rounded-3 border h-100" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                      <span className="small text-muted fw-bold d-block mb-2">👤 {t('consultant', 'Consultor')}</span>
                      <div className="d-flex align-items-center gap-2">
                        {consultor.avatar && !failedAvatars.consultor ? (
                          <img 
                            src={consultor.avatar.startsWith('http') ? consultor.avatar : `${API_BASE_URL}/uploads/avatars/${consultor.avatar}`} 
                            alt={consultor.nome} 
                            className="rounded-circle" 
                            style={{ width: '36px', height: '36px', objectFit: 'cover' }} 
                            onError={() => setFailedAvatars(prev => ({ ...prev, consultor: true }))} 
                          />
                        ) : (
                          <div className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                            {consultor.nome?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div>
                          <span className="fw-semibold d-block small" style={{ color: 'var(--text)' }}>{consultor.nome}</span>
                          <span className="text-muted small d-block" style={{ fontSize: '0.75rem' }}>{consultor.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {moderador && (
                  <div className="col-md-6">
                    <div className="p-3 rounded-3 border h-100" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                      <span className="small text-muted fw-bold d-block mb-2">🛡️ {t('moderator', 'Moderador')}</span>
                      <div className="d-flex align-items-center gap-2">
                        {moderador.avatar && !failedAvatars.moderador ? (
                          <img 
                            src={moderador.avatar.startsWith('http') ? moderador.avatar : `${API_BASE_URL}/uploads/avatars/${moderador.avatar}`} 
                            alt={moderador.nome} 
                            className="rounded-circle" 
                            style={{ width: '36px', height: '36px', objectFit: 'cover' }} 
                            onError={() => setFailedAvatars(prev => ({ ...prev, moderador: true }))} 
                          />
                        ) : (
                          <div className="rounded-circle bg-secondary-subtle text-secondary d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                            {moderador.nome?.charAt(0) || 'M'}
                          </div>
                        )}
                        <div>
                          <span className="fw-semibold d-block small" style={{ color: 'var(--text)' }}>{moderador.nome}</span>
                          <span className="text-muted small d-block" style={{ fontSize: '0.75rem' }}>{formatDate(details.data_renovacao)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de Evidências */}
              <div className="p-3 rounded-3 border" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between" style={{ color: 'var(--text)' }}>
                  <span>📎 {t('evidencesSubmitted', 'Evidências Submetidas')} ({(details.evidencias || []).length})</span>
                </h6>

                {(!details.evidencias || details.evidencias.length === 0) ? (
                  <div className="alert alert-secondary py-2 small mb-0">
                    {t('noEvidencesAttached', 'Nenhum ficheiro de evidência foi anexado a este pedido.')}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr className="text-muted small border-bottom">
                          <th>{t('requirement', 'Requisito')}</th>
                          <th>{t('file', 'Ficheiro')}</th>
                          <th>{t('uploadDate', 'Data Upload')}</th>
                          {isModerator && <th>{t('validation', 'Validação')}</th>}
                          <th className="text-end">{t('actions', 'Ações')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.evidencias.map((ev) => (
                          <tr key={ev.id_evidencia_renovacao}>
                            <td className="small fw-semibold">{ev.requisito_nome || '—'}</td>
                            <td className="small text-truncate" style={{ maxWidth: '160px' }}>
                              📄 {ev.nome_ficheiro}
                            </td>
                            <td className="small text-muted">{formatDate(ev.data_upload_evidencia)}</td>
                            
                            {isModerator && (
                              <td>
                                {ev.validado_moderador === true && (
                                  <span className="badge bg-success-subtle text-success small fw-semibold">✓ {t('valid', 'Válida')}</span>
                                )}
                                {ev.validado_moderador === false && (
                                  <span className="badge bg-danger-subtle text-danger small fw-semibold">✕ {t('invalid', 'Inválida')}</span>
                                )}
                                {ev.validado_moderador === null && (
                                  isPending ? (
                                    <div className="btn-group btn-group-sm">
                                      <button 
                                        type="button" 
                                        className="btn btn-outline-success py-1 px-2 d-inline-flex align-items-center justify-content-center"
                                        onClick={() => handleValidateEvidence(ev.id_evidencia_renovacao, true)}
                                        title={t('markValid', 'Marcar como válida')}
                                      >
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </button>
                                      <button 
                                        type="button" 
                                        className="btn btn-outline-danger py-1 px-2 d-inline-flex align-items-center justify-content-center"
                                        onClick={() => handleValidateEvidence(ev.id_evidencia_renovacao, false)}
                                        title={t('markInvalid', 'Marcar como inválida')}
                                      >
                                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                                          <line x1="18" y1="6" x2="6" y2="18" />
                                          <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="badge bg-secondary-subtle text-secondary small fw-semibold">{t('statusPendente', 'Pendente')}</span>
                                  )
                                )}
                              </td>
                            )}

                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button 
                                  type="button" 
                                  className="btn btn-outline-primary py-1 px-2 d-inline-flex align-items-center justify-content-center"
                                  onClick={() => handleViewPdf(ev)}
                                  title={t('viewPdf', 'Visualizar PDF')}
                                >
                                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                </button>
                                <button 
                                  type="button" 
                                  className="btn btn-outline-secondary py-1 px-2 d-inline-flex align-items-center justify-content-center"
                                  onClick={() => handleDownloadFile(ev)}
                                  title={t('download', 'Descarregar')}
                                >
                                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Seção de Moderação para Admin / SLL */}
              {isModerator && isPending && (
                <div className="p-3 rounded-3 border border-primary-subtle bg-primary-subtle bg-opacity-10">
                  <h6 className="fw-bold mb-2 text-primary">🛡️ {t('moderationActions', 'Ações de Moderação')}</h6>

                  {!showRejectPanel ? (
                    <div className="d-flex flex-wrap gap-2 justify-content-end mt-3">
                      <button
                        type="button"
                        className="btn btn-outline-danger fw-semibold"
                        onClick={() => setShowRejectPanel(true)}
                        disabled={processingAction}
                      >
                        ✕ {t('btnRejectRenewal', 'Recusar Renovação')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-success fw-semibold d-flex align-items-center gap-2"
                        onClick={handleApprove}
                        disabled={processingAction}
                      >
                        {processingAction && <span className="spinner-border spinner-border-sm" />}
                        <span>✓ {t('btnApproveRenewal', 'Aprovar Renovação')} (+{badge?.pontos_renovacao || 0} pts)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 rounded-3 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-bold mb-0 small text-danger">
                          {t('rejectionReasonLabel', 'Justificação da Recusa (Obrigatória)')}
                        </label>
                        <ManualTranslationSwitch
                          checked={manualTranslation}
                          onChange={(val) => setManualTranslation(val)}
                        />
                      </div>

                      {!manualTranslation ? (
                        <textarea
                          className="form-control rounded-3 mb-3"
                          rows="3"
                          placeholder={t('rejectReasonPlaceholder', 'Indique o motivo da recusa para o consultor...')}
                          value={rejectComment}
                          onChange={(e) => setRejectComment(e.target.value)}
                        />
                      ) : (
                        <div className="d-flex flex-column gap-2 mb-3">
                          <div>
                            <label className="form-label small text-muted mb-1 fw-semibold">Português (PT)</label>
                            <textarea
                              className="form-control rounded-3"
                              rows="2"
                              placeholder="Justificação em Português..."
                              value={commentPt}
                              onChange={(e) => setCommentPt(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="form-label small text-muted mb-1 fw-semibold">English (EN)</label>
                            <textarea
                              className="form-control rounded-3"
                              rows="2"
                              placeholder="Rejection reason in English..."
                              value={commentEn}
                              onChange={(e) => setCommentEn(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="form-label small text-muted mb-1 fw-semibold">Español (ES)</label>
                            <textarea
                              className="form-control rounded-3"
                              rows="2"
                              placeholder="Justificación en Español..."
                              value={commentEs}
                              onChange={(e) => setCommentEs(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setShowRejectPanel(false)}
                          disabled={processingAction}
                        >
                          {t('cancelBtn', 'Cancelar')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger fw-semibold"
                          onClick={handleReject}
                          disabled={processingAction}
                        >
                          {processingAction && <span className="spinner-border spinner-border-sm me-1" />}
                          {t('confirmRejectBtn', 'Confirmar Recusa')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-top d-flex justify-content-end" style={{ backgroundColor: 'var(--bg-footer, rgba(0,0,0,0.02))' }}>
          <button 
            type="button" 
            className="btn btn-secondary px-4 fw-semibold"
            onClick={onClose}
            disabled={processingAction}
          >
            {t('closeBtn', 'Fechar')}
          </button>
        </div>

      </div>

      {/* PDF Inline Viewer Sub-Modal */}
      {previewPdfUrl && (
        <>
          <div className="users-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setPreviewPdfUrl(null)} />
          <div 
            className="users-modal" 
            style={{ 
              maxWidth: '900px', 
              width: '95%', 
              height: '85vh',
              zIndex: 1110, 
              position: 'fixed', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              backgroundColor: '#ffffff', 
              borderRadius: '16px', 
              boxShadow: '0 16px 40px rgba(0,0,0,0.3)', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
              <span className="fw-bold small text-truncate">📄 {previewFileName}</span>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setPreviewPdfUrl(null)} 
              />
            </div>
            <div className="p-0" style={{ flex: 1 }}>
              <iframe 
                src={previewPdfUrl} 
                title={previewFileName}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
