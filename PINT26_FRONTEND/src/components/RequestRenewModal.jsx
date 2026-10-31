import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { api, API_BASE_URL } from '../services/api';

export default function RequestRenewModal({ item, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'pt';

  const [requirements, setRequirements] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [evidences, setEvidences] = useState({}); // { [id_requisito]: { file: File, fileName: '' } }
  const [submitting, setSubmitting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const badgeId = item?.id_badge;
  const candidaturaId = item?.id_candidatura;

  // Carregar os requisitos do badge para permitir upload de evidências
  const fetchRequirements = useCallback(async () => {
    if (!badgeId) return;
    try {
      setLoadingReqs(true);
      const res = await api.get(`/requisito_badge/badge/${badgeId}`);
      if (res.data?.success) {
        setRequirements(res.data.data || []);
      }
    } catch (err) {
      console.warn('Erro ao carregar requisitos do badge:', err);
    } finally {
      setLoadingReqs(false);
    }
  }, [badgeId]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const handleFileSelect = (reqId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar formato
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'zip', 'png', 'jpg', 'jpeg'].includes(ext)) {
      Swal.fire({
        icon: 'warning',
        title: t('invalidFileFormat', 'Formato Inválido'),
        text: t('allowedFormatsHint', 'Apenas são permitidos ficheiros PDF, ZIP ou imagens (PNG/JPG).'),
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    setEvidences(prev => ({
      ...prev,
      [reqId]: {
        file,
        fileName: file.name
      }
    }));
  };

  const handleRemoveFile = (reqId) => {
    setEvidences(prev => {
      const copy = { ...prev };
      delete copy[reqId];
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!candidaturaId) {
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: t('invalidCandidature', 'Candidatura associada inválida.'),
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: t('confirmRenewalTitle', 'Solicitar Renovação?'),
      text: t('confirmRenewalText', 'Tem a certeza de que deseja submeter este pedido de renovação para moderação?'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('btnSubmitRenewal', 'Sim, submeter pedido'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (!confirm.isConfirmed) return;

    try {
      setSubmitting(true);

      // 1. Criar pedido de renovação
      const resSolicitar = await api.post('/renovacao_badge/solicitar', {
        id_candidatura: candidaturaId
      });

      if (!resSolicitar.data?.success) {
        throw new Error(resSolicitar.data?.message || t('errorSubmittingRenewal', 'Erro ao solicitar renovação.'));
      }

      const idRenovacao = resSolicitar.data.data?.id_renovacao_badge;

      // 2. Fazer upload das evidências selecionadas (se houver)
      const reqIdsComEvidencia = Object.keys(evidences);
      if (reqIdsComEvidencia.length > 0 && idRenovacao) {
        for (const reqId of reqIdsComEvidencia) {
          const itemEv = evidences[reqId];
          if (itemEv?.file) {
            const formData = new FormData();
            // 1. Adicionar os campos de texto primeiro (necessário para o streaming do Multer)
            formData.append('id_candidatura', candidaturaId);
            formData.append('id_requisito', reqId);
            // 2. Adicionar o ficheiro estritamente sob a chave 'evidencia'
            formData.append('evidencia', itemEv.file);

            try {
              await api.post(`/renovacao_badge/${idRenovacao}/evidencia`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
            } catch (errUpload) {
              console.warn(`Erro no upload de evidência para requisito ${reqId}:`, errUpload);
            }
          }
        }
      }

      await Swal.fire({
        icon: 'success',
        title: t('renewalSubmittedTitle', 'Pedido Submetido!'),
        text: t('renewalSubmittedMsg', 'O seu pedido de renovação foi registado com sucesso e aguarda moderação.'),
        confirmButtonColor: '#0284c7'
      });

      if (onSuccess) onSuccess();
      onClose();

    } catch (err) {
      console.error('Erro ao submeter renovação:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || err.message || t('serverError', 'Erro no servidor.'),
        confirmButtonColor: '#0284c7'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const badgeLogoSrc = item?.badge_logo
    ? `${API_BASE_URL}/uploads/logo_badges/${item.badge_logo}`
    : null;

  return (
    <>
      <div className="users-modal-overlay" style={{ zIndex: 1080 }} onClick={onClose} />
      <div 
        className="users-modal" 
        style={{ 
          maxWidth: '680px', 
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
        {/* Header */}
        <div className="p-3 p-md-4 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
          <div className="d-flex align-items-center gap-3">
            <div 
              className="d-flex align-items-center justify-content-center rounded-3 p-2 flex-shrink-0"
              style={{ width: '52px', height: '52px', backgroundColor: 'var(--bg-icon, rgba(2,132,199,0.12))' }}
            >
              {badgeLogoSrc && !logoError ? (
                <img 
                  src={badgeLogoSrc} 
                  alt={item?.badge_nome} 
                  onError={() => setLogoError(true)}
                  style={{ width: '38px', height: '38px', objectFit: 'contain' }}
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
                {t('requestRenewalTitle', 'Solicitar Renovação de Badge')}
              </h5>
              <span className="small text-muted">
                {item?.badge_nome}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            aria-label="Close" 
            onClick={onClose}
            disabled={submitting}
            style={{ filter: 'var(--close-filter, none)' }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-3 p-md-4 overflow-y-auto" style={{ flex: 1 }}>
          
          {/* Card de Resumo do Badge */}
          <div 
            className="p-3 rounded-3 mb-4 d-flex flex-column gap-2"
            style={{ 
              backgroundColor: 'var(--panel-2)', 
              border: '1px solid var(--sidebar-border)' 
            }}
          >
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <span className="fw-semibold text-muted small">{t('learningPath', 'Learning Path')}:</span>
              <span className="badge bg-primary-subtle text-primary fw-bold">{item?.lp_nome || '—'}</span>
            </div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <span className="fw-semibold text-muted small">{t('areaNivel', 'Área / Nível')}:</span>
              <span className="fw-semibold" style={{ color: 'var(--text)' }}>
                {item?.area_nome} • {item?.nivel_nome}
              </span>
            </div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <span className="fw-semibold text-muted small">{t('renewalPointsReward', 'Pontos de Renovação')}:</span>
              <span className="badge bg-success-subtle text-success fw-bold">
                +{item?.pontos_renovacao || 0} pts
              </span>
            </div>
            {item?.dias_restantes !== undefined && (
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="fw-semibold text-muted small">{t('statusExpiracao', 'Expiração')}:</span>
                <span className={`renew-status-badge ${item.dias_restantes <= 0 ? 'expired' : 'expiring'}`}>
                  <span className="badge-icon">{item.dias_restantes <= 0 ? '⚠️' : '⏳'}</span>
                  <span>
                    {item.dias_restantes <= 0 
                      ? t('badgeAlreadyExpired', 'Expirado') 
                      : t('badgeExpiresInDays', 'Expira em {{dias}} dias', { dias: item.dias_restantes })}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Secção de Evidências / Requisitos */}
          <div className="mb-3">
            <h6 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
              📎 {t('renewalEvidencesTitle', 'Comprovativos / Evidências de Renovação')}
            </h6>
            <p className="small text-muted mb-3">
              {t('renewalEvidencesSubtitle', 'Anexe documentos ou provas atualizadas (PDF, ZIP, PNG) para comprovar a manutenção das competências deste badge.')}
            </p>

            {loadingReqs ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status" />
                <span className="ms-2 small text-muted">{t('loadingRequirements', 'A carregar requisitos...')}</span>
              </div>
            ) : requirements.length === 0 ? (
              <div className="alert alert-info py-2 small mb-0">
                {t('noSpecificRequirements', 'Este badge não possui requisitos específicos registados. Pode submeter o pedido diretamente.')}
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {requirements.map((req, idx) => {
                  const reqId = req.id_requisito || req.id_requisito_nivel;
                  const reqTitle = req.traducao_titulo?.[currentLang] || req.traducao_titulo?.pt || req.descricao || `${t('requirement', 'Requisito')} #${idx + 1}`;
                  const currentEvidence = evidences[reqId];

                  return (
                    <div 
                      key={reqId} 
                      className="p-3 rounded-3"
                      style={{ 
                        backgroundColor: 'var(--panel-2)', 
                        border: '1px solid var(--sidebar-border)' 
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="fw-semibold small" style={{ color: 'var(--text)' }}>
                          {idx + 1}. {reqTitle}
                        </span>
                      </div>

                      {/* File select / Preview */}
                      {currentEvidence?.fileName ? (
                        <div className="d-flex align-items-center justify-content-between p-2 rounded-2 border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                          <span className="small text-truncate fw-medium" style={{ maxWidth: '320px', color: 'var(--text)' }}>
                            📄 {currentEvidence.fileName}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            onClick={() => handleRemoveFile(reqId)}
                            title={t('removeFile', 'Remover ficheiro')}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label 
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-2 mb-0"
                            style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            <span>📎 {t('attachFile', 'Anexar Ficheiro')}</span>
                            <input 
                              type="file" 
                              className="d-none"
                              accept=".pdf,.zip,.png,.jpg,.jpeg"
                              onChange={(e) => handleFileSelect(reqId, e)}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 p-md-4 border-top d-flex justify-content-end gap-2" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
          <button 
            type="button" 
            className="btn btn-secondary px-4 fw-semibold"
            onClick={onClose}
            disabled={submitting}
          >
            {t('cancelBtn', 'Cancelar')}
          </button>
          <button 
            type="button" 
            className="btn btn-primary px-4 fw-semibold d-flex align-items-center gap-2"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <span className="spinner-border spinner-border-sm" role="status" />}
            <span>{t('btnSubmitRenewal', 'Submeter Pedido')}</span>
          </button>
        </div>

      </div>
    </>
  );
}
