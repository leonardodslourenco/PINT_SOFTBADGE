import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { api, API_BASE_URL } from '../services/api';

export default function CandidateBadgeModal({ badge, candidatura: initialCandidatura, onClose, onRefreshData }) {
  const { t, i18n } = useTranslation();
  const [requirements, setRequirements] = useState([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [evidences, setEvidences] = useState({}); // { id_requisito_nivel: { nome_ficheiro: '', ficheiroReal: File } }
  const [submitting, setSubmitting] = useState(false);
  const [activeApp, setActiveApp] = useState(initialCandidatura || null);
  const [failedLogos, setFailedLogos] = useState(false);

  // Fetch application details and requirements for this badge
  const fetchBadgeDetails = useCallback(async () => {
    if (!badge) return;
    try {
      setLoadingRequirements(true);

      // Fetch user candidatures to see if there is an active draft or analysis one
      const resApps = await api.get('/candidatura_badge');
      let existingApp = null;
      if (resApps.data?.success) {
        const apps = resApps.data.data || [];
        // 1. Procurar candidatura ativa em progresso (Rascunho=1, Submetida=2, Validação=3) ou Aprovada (4)
        existingApp = apps.find(a => a.id_badge === badge.id_badge && a.id_estado_candidatura !== 5);
        // 2. Se não existir, procurar a última rejeitada (CLOSED_NOK=5)
        if (!existingApp) {
          existingApp = apps.find(a => a.id_badge === badge.id_badge && a.id_estado_candidatura === 5);
        }
      }
      setActiveApp(existingApp || initialCandidatura || null);

      // Initialize evidences object
      const initialEvidences = {};
      if (existingApp && existingApp.evidencias && existingApp.id_estado_candidatura !== 5) {
        existingApp.evidencias.forEach(ev => {
          const reqId = ev.id_requisito || ev.id_requisito_nivel;
          initialEvidences[reqId] = {
            nome_ficheiro: ev.nome_ficheiro || ''
          };
        });
      }

      // Fetch requirements
      const resReq = await api.get(`/requisito_badge/badge/${badge.id_badge}`);
      if (resReq.data?.success) {
        const reqs = resReq.data.data || [];
        setRequirements(reqs);

        // Pre-fill inputs for requirements that don't have evidences yet
        reqs.forEach(req => {
          const reqId = req.id_requisito || req.id_requisito_nivel;
          if (!initialEvidences[reqId]) {
            initialEvidences[reqId] = { nome_ficheiro: '' };
          }
        });
      }
      setEvidences(initialEvidences);
    } catch (err) {
      console.error('Error fetching badge details inside modal:', err);
    } finally {
      setLoadingRequirements(false);
    }
  }, [badge]);

  useEffect(() => {
    fetchBadgeDetails();
  }, [fetchBadgeDetails]);

  const handleEvidenceChange = (reqId, field, value) => {
    setEvidences(prev => ({
      ...prev,
      [reqId]: {
        ...prev[reqId],
        [field]: value
      }
    }));
  };

  const handleFileSelect = (reqId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleEvidenceChange(reqId, 'nome_ficheiro', file.name);
    handleEvidenceChange(reqId, 'ficheiroReal', file);
  };

  const checkRequiredFilled = () => {
    for (const req of requirements) {
      const reqId = req.id_requisito || req.id_requisito_nivel;
      const isObrigatorio = req.obrigatoriedade_req !== undefined ? req.obrigatoriedade_req : req.obrigatoriedade_req_nivel;
      if (isObrigatorio) {
        const ev = evidences[reqId];
        if (!ev || !ev.nome_ficheiro || !ev.nome_ficheiro.trim()) {
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async (submitAfterSave = false) => {
    if (submitAfterSave && !checkRequiredFilled()) {
      Swal.fire({
        icon: 'error',
        title: 'Campos Obrigatórios',
        text: t('mustFillEvidences', 'Deve anexar ficheiros de evidência em todos os requisitos obrigatórios.'),
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    setSubmitting(true);

    const evidenciasPayload = Object.keys(evidences)
      .map(reqId => ({
        id_requisito: Number(reqId),
        nome_ficheiro: evidences[reqId].nome_ficheiro,
        ficheiroReal: evidences[reqId].ficheiroReal
      }))
      .filter(ev => ev.nome_ficheiro && ev.nome_ficheiro.trim());

    try {
      let targetCandidaturaId = (activeApp && activeApp.id_estado_candidatura !== 5) ? activeApp.id_candidatura : null;

      if (!targetCandidaturaId) {
        const resCreate = await api.post('/candidatura_badge', {
          id_badge: badge.id_badge,
          submeter: false
        });
        if (resCreate.data?.success) {
          targetCandidaturaId = resCreate.data.data.id_candidatura;
        } else {
          throw new Error('Falha ao criar candidatura no backend.');
        }
      }

      const novasEvidencias = evidenciasPayload.filter(ev => ev.ficheiroReal);
      if (novasEvidencias.length > 0) {
        for (const ev of novasEvidencias) {
          const formData = new FormData();
          formData.append('id_candidatura', targetCandidaturaId);
          formData.append('id_requisito', ev.id_requisito);
          formData.append('evidencia', ev.ficheiroReal);

          await api.post('/evidencia_candidatura', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      if (submitAfterSave) {
        await api.post(`/candidatura_badge/${targetCandidaturaId}/submeter`);
      }

      Swal.fire({
        icon: 'success',
        title: t('successTitle', 'Sucesso'),
        text: submitAfterSave ? t('appSubmitted', 'Candidatura submetida com sucesso!') : t('evidenceSaved', 'Rascunho gravado com sucesso!'),
        timer: 2000,
        showConfirmButton: false
      });
      onClose();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error saving/submitting application:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.response?.data?.message || t('errorSaving', 'Erro ao salvar candidatura.'),
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!activeApp) return;

    const result = await Swal.fire({
      title: t('withdrawConfirmTitle', 'Tem a certeza?'),
      text: t('withdrawConfirmText', 'Esta ação irá cancelar permanentemente a sua candidatura a este badge e é irreversível.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('yesBtn', 'Sim'),
      cancelButtonText: t('noBtn', 'Não')
    });

    if (result.isConfirmed) {
      setSubmitting(true);
      try {
        const res = await api.post('/acao_candidatura', {
          id_candidatura: activeApp.id_candidatura,
          tipo_acao_candidatura: 8, // CANCELADA_CONSULTOR
          novo_estado: 5, // CLOSED_NOK
          comentario: t('withdrawComment', 'Cancelada pelo próprio Consultor.')
        });

        if (res.data?.success) {
          Swal.fire({
            icon: 'success',
            title: t('successTitle', 'Sucesso'),
            text: t('withdrawSuccess', 'Candidatura cancelada com sucesso.'),
            timer: 2000,
            showConfirmButton: false
          });
          onClose();
          if (onRefreshData) onRefreshData();
        }
      } catch (err) {
        console.error('Error withdrawing application:', err);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: err.response?.data?.message || 'Não foi possível cancelar a sua candidatura.',
          confirmButtonColor: '#ef4444'
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (!badge) return null;

  return (
    <>
      <div className="users-modal-overlay" onClick={onClose} style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1040 }} />
      <div className="users-modal rounded-4 shadow-lg border bg-panel" style={{ maxWidth: '680px', width: '90%', zIndex: 1050, overflow: 'hidden', borderColor: 'var(--sidebar-border)' }}>
        <div
          className="users-modal-header p-4 border-bottom d-flex justify-content-between align-items-center"
          style={{ backgroundColor: 'var(--panel)', borderBottomColor: 'var(--sidebar-border)' }}
        >
          <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)' }}>
            {[2, 3, 4].includes(activeApp?.id_estado_candidatura)
              ? t('candidacyDetails', 'Detalhes da Candidatura')
              : t('badgeApplicationTitle', 'Candidatura ao Badge')}
          </h5>
          <button
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
            style={{ filter: i18n.language && document.documentElement.getAttribute('data-theme') === 'dark' ? 'invert(1) grayscale(100%)' : 'none' }}
          />
        </div>

        <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '24px', backgroundColor: 'var(--panel-2)' }}>
          {/* Badge General Details */}
          <div
            className="d-flex gap-3 align-items-center p-3 rounded-4 mb-4 border"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
          >
            <div className="kpi-icon-wrapper rounded-3 d-flex align-items-center justify-content-center bg-primary text-white" style={{ width: 56, height: 56, minWidth: 56, overflow: 'hidden' }}>
              {badge.logo && !failedLogos ? (
                <img
                  src={`${API_BASE_URL}/uploads/logo_badges/${badge.logo}`}
                  alt={badge.titulo}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={() => setFailedLogos(true)}
                />
              ) : (
                <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              )}
            </div>
            <div>
              <h6 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>{badge.titulo}</h6>
              <p className="small mb-1" style={{ color: 'var(--text-muted)' }}>{badge.descricao}</p>
              <div className="d-flex gap-2 flex-wrap mt-1">
                <span className="badge bg-primary text-white" style={{ fontSize: '0.7rem' }}>{badge.area}</span>
                <span
                  className="badge border"
                  style={{ fontSize: '0.7rem', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                >
                  {t('pointsLabel', '{{pts}} pts').replace('{{pts}}', badge.pontos).replace('{pts}', badge.pontos)}
                </span>
              </div>
            </div>
          </div>

          {/* Requirements Title */}
          <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text)' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {t('requirementsTitle', 'Requisitos de Submissão')}
          </h6>

          {/* Requirements & Evidence Inputs */}
          {loadingRequirements ? (
            <div className="text-center py-5">
              <div className="users-spinner small mx-auto mb-3" />
              <span className="text-muted small">{t('loading', 'A carregar...')}</span>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3 mb-4">
              {requirements.length === 0 ? (
                <div
                  className="text-muted small py-4 text-center border rounded-3 border-dashed"
                  style={{ borderColor: 'var(--sidebar-border)' }}
                >
                  Nenhum requisito configurado para este badge.
                </div>
              ) : (
                requirements.map((req) => {
                  const reqId = req.id_requisito || req.id_requisito_nivel;
                  const isObrigatorio = req.obrigatoriedade_req !== undefined ? req.obrigatoriedade_req : req.obrigatoriedade_req_nivel;
                  const isReadOnly = activeApp && activeApp.id_estado_candidatura !== 1 && activeApp.id_estado_candidatura !== 5;
                  return (
                    <div
                      key={reqId}
                      className="card p-3 border-0 rounded-4 shadow-sm border-start border-4"
                      style={{ borderColor: isObrigatorio ? 'var(--primary)' : 'var(--text-muted)', backgroundColor: 'var(--panel)' }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="fw-bold mb-0 small" style={{ color: 'var(--text)' }}>{req.titulo}</h6>
                        {isObrigatorio ? (
                          <span className="badge bg-danger bg-opacity-10 text-danger border-0 px-2 py-1 rounded-pill" style={{ fontSize: '0.65rem', fontWeight: 700 }}>{t('colRequired', 'Obrigatório')}</span>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border-0 px-2 py-1 rounded-pill" style={{ fontSize: '0.65rem', fontWeight: 700 }}>Opcional</span>
                        )}
                      </div>
                      <span className="text-muted small d-block font-monospace mb-2" style={{ fontSize: '0.75rem' }}>{req.subtitulo}</span>
                      <p className="small mb-3" style={{ color: 'var(--text-muted)' }}>{req.descricao}</p>

                      <div
                        className="d-flex align-items-center gap-3 p-3 rounded-3"
                        style={{ border: '1px dashed var(--sidebar-border)', backgroundColor: 'var(--panel-2)' }}
                      >
                        <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
                          {evidences[reqId]?.nome_ficheiro ? (
                            <>
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="2.5" className="flex-shrink-0">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              <span className="small fw-semibold text-truncate" style={{ color: 'var(--text)' }} title={evidences[reqId].nome_ficheiro}>
                                {evidences[reqId].nome_ficheiro}
                              </span>
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--text-muted)" strokeWidth="2" className="flex-shrink-0">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              <span className="small fst-italic" style={{ color: 'var(--text-muted)' }}>
                                Sem ficheiro de evidência anexado
                              </span>
                            </>
                          )}
                        </div>

                        {!isReadOnly && (
                          <div className="position-relative flex-shrink-0">
                            <button
                              className={`btn btn-sm ${evidences[reqId]?.nome_ficheiro ? 'btn-outline-secondary' : 'btn-primary'}`}
                              style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: '8px', fontWeight: 600 }}
                              type="button"
                            >
                              {evidences[reqId]?.nome_ficheiro ? 'Alterar' : 'Anexar'}
                            </button>
                            <input
                              type="file"
                              className="position-absolute opacity-0 top-0 start-0 end-0 bottom-0 cursor-pointer"
                              style={{ width: '100%', height: '100%' }}
                              onChange={(e) => handleFileSelect(reqId, e)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div
            className="d-flex justify-content-between align-items-center mt-4 border-top pt-3"
            style={{ borderTopColor: 'var(--sidebar-border)' }}
          >
            <span className="text-muted small">
              {activeApp && (activeApp.id_estado_candidatura === 2 || activeApp.id_estado_candidatura === 3) ? (
                <strong className="text-warning">
                  {t('underReviewLocked', 'Em análise — Edição bloqueada.')}
                </strong>
              ) : activeApp && activeApp.id_estado_candidatura === 4 ? (
                <strong className="text-success">
                  {t('completedLocked', 'Concluída — Edição bloqueada.')}
                </strong>
              ) : (
                <span>{t('mandatoryRequirementsNote', '* Requisitos obrigatórios')}</span>
              )}
            </span>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm px-3 py-2 fw-bold rounded-3 btn-close-consult"
                onClick={onClose}
              >
                {t('closeBtn')}
              </button>

              {activeApp && (activeApp.id_estado_candidatura === 1 || activeApp.id_estado_candidatura === 2 || activeApp.id_estado_candidatura === 3) && (
                <button
                  type="button"
                  className="btn btn-sm px-3 py-2 fw-bold rounded-3 btn-withdraw-consult"
                  disabled={submitting}
                  onClick={handleWithdraw}
                >
                  {t('withdrawAppBtn')}
                </button>
              )}

              {(!activeApp || activeApp.id_estado_candidatura === 1 || activeApp.id_estado_candidatura === 5) && (
                <>
                  <button
                    type="button"
                    className="btn btn-sm px-3 py-2 fw-bold rounded-3 btn-save-consult"
                    disabled={submitting}
                    onClick={() => handleSave(false)}
                  >
                    {t('saveDraftBtn')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm px-3 py-2 fw-bold rounded-3 btn-submit-consult"
                    disabled={submitting}
                    onClick={() => handleSave(true)}
                  >
                    {submitting ? (
                      <div className="users-spinner small" />
                    ) : (
                      t('submitAppBtn')
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
