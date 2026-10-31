import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../services/api';
import CopiarPerfilPublico from './CopiarPerfilPublico';
import CopiarBadgePublico from './CopiarBadgePublico';
import EvidenciaPdfModal from './EvidenciaPdfModal';
import ModalRgpdCandidatura from './ModalRgpdCandidatura';

const ESTADOS = {
  1: { class: 'open', textKey: 'statusOpen' },
  2: { class: 'submitted', textKey: 'statusSubmitted' },
  3: { class: 'validation', textKey: 'statusValidacao' },
  4: { class: 'closed-ok', textKey: 'statusClosedOk' },
  5: { class: 'closed-nok', textKey: 'statusClosedNok' }
};

export default function ViewApplicationDetailsModal({
  appId,
  onClose,
  isConsultantView = false,
  rgpdConsent = {},
  onRgpdToggle,
  onLinkedInShare,
  onOpenCertificate
}) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'pt';
  const [appDetails, setAppDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showRgpdModal, setShowRgpdModal] = useState(false);

  // Evidence PDF Viewer states
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [selectedEvidenciaName, setSelectedEvidenciaName] = useState('');

  // Certificate Viewer Modal states
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [loadingCert, setLoadingCert] = useState(false);
  const [certError, setCertError] = useState(null);
  const [certPdfUrl, setCertPdfUrl] = useState(null);

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

  // Certificate viewing and download handlers
  const handleOpenCertificateModal = async () => {
    let certId = appDetails?.certificado?.id_certificado;
    if (!certId && appDetails?.id_candidatura) {
      try {
        const metaRes = await api.get(`/certificado/candidatura/${appDetails.id_candidatura}`);
        if (metaRes.data?.success && metaRes.data?.data?.id_certificado) {
          certId = metaRes.data.data.id_certificado;
          setAppDetails(prev => ({ ...prev, certificado: metaRes.data.data }));
        }
      } catch (metaErr) {
        console.warn('Falha ao obter metadados do certificado:', metaErr);
      }
    }

    if (!certId) {
      setCertError(t('certificateNotFound', 'Certificado não encontrado ou ainda não emitido.'));
      setCertModalOpen(true);
      return;
    }

    try {
      setLoadingCert(true);
      setCertError(null);
      setCertPdfUrl(null);
      setCertModalOpen(true);

      const res = await api.get(`/certificado/${certId}/view`, {
        responseType: 'blob'
      });

      if (certPdfUrl && typeof certPdfUrl === 'string' && certPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(certPdfUrl);
      }

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setCertPdfUrl(objectUrl);
    } catch (err) {
      console.error('Erro ao carregar certificado:', err);
      let errorMsg = t('errorLoadingCertificate', 'Erro ao carregar o certificado do servidor.');
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed?.message) errorMsg = parsed.message;
        } catch (e) {
          // ignore
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setCertError(errorMsg);
    } finally {
      setLoadingCert(false);
    }
  };

  const handleCloseCertModal = () => {
    if (certPdfUrl && typeof certPdfUrl === 'string' && certPdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(certPdfUrl);
    }
    setCertPdfUrl(null);
    setCertModalOpen(false);
    setCertError(null);
  };
  const handleCloseCertificateModal = handleCloseCertModal;

  const handleDownloadCertificate = async () => {
    let certId = appDetails?.certificado?.id_certificado;
    if (!certId && appDetails?.id_candidatura) {
      try {
        const metaRes = await api.get(`/certificado/candidatura/${appDetails.id_candidatura}`);
        if (metaRes.data?.success && metaRes.data?.data?.id_certificado) {
          certId = metaRes.data.data.id_certificado;
        }
      } catch (err) {
        // ignore
      }
    }
    if (!certId) return;

    try {
      const res = await api.get(`/certificado/${certId}/download`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Certificado_${appDetails?.badge?.titulo || 'SoftBadge'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Erro ao descarregar certificado:', err);
    }
  };

  const getStatusBadgeClass = (app) => {
    const statusId = app?.id_estado_candidatura;
    const map = ESTADOS[statusId] || { class: 'open' };
    return `users-status-badge ${map.class}`;
  };

  const getStatusText = (app) => {
    const statusId = app?.id_estado_candidatura;
    if (statusId === 5) {
      if (app?.acoes && app.acoes.length > 0) {
        const sortedAcoes = [...app.acoes].sort((a, b) => new Date(a.data_acao_candidatura) - new Date(b.data_acao_candidatura));
        const lastAcao = sortedAcoes[sortedAcoes.length - 1];
        if (lastAcao?.tipo_acao_candidatura === 8) {
          return t('statusCancelledByConsultant');
        }
      }
    }
    const map = ESTADOS[statusId] || { textKey: 'statusOpen' };
    return t(map.textKey);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (!appId) return;

    const fetchAppDetails = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const res = await api.get(`/candidatura_badge/${appId}`);
        if (res.data?.success && res.data.data) {
          const app = res.data.data;
          
          // Resolve translated details with fallback
          let badgeTitle = app.badge?.traducao_titulo?.[currentLang] || app.badge?.traducao_titulo?.pt || app.badge?.titulo || '—';
          let badgeArea = app.badge?.nivel_area?.area?.traducao_area?.[currentLang] 
            || app.badge?.nivel_area?.area?.traducao_area?.pt 
            || app.badge?.nivel_area?.area?.area
            || app.badge?.area 
            || '';
          let badgeDesc = app.badge?.traducao_descricao?.[currentLang] || app.badge?.traducao_descricao?.pt || app.badge?.descricao || '—';
          let badgePontos = app.badge?.pontos;

          // Se a área não veio no include da candidatura, procura no catálogo do badge para obter nome da área
          const bId = app.id_badge || app.badge?.id_badge;
          if (!badgeArea && bId) {
            try {
              const resBadge = await api.get(`/badge/catalogo?ativo=true`).catch(() => null);
              if (resBadge?.data?.success && Array.isArray(resBadge.data.data)) {
                const bData = resBadge.data.data.find(b => b.id_badge === bId);
                if (bData) {
                  badgeArea = bData.area || '';
                  if (!badgeTitle || badgeTitle === '—') badgeTitle = bData.titulo || '';
                  if (badgePontos === undefined || badgePontos === null) badgePontos = bData.pontos;
                }
              }
            } catch (bErr) {
              console.warn('Não foi possível obter dados adicionais do badge:', bErr);
            }
          }

          // Se a candidatura está aprovada (estado 4) mas app.certificado não veio anexado, busca o certificado
          let cert = app.certificado;
          if (!cert && app.id_estado_candidatura === 4 && app.id_candidatura) {
            try {
              const resCert = await api.get(`/certificado/candidatura/${app.id_candidatura}`);
              if (resCert.data?.success && resCert.data.data) {
                cert = resCert.data.data;
              }
            } catch (cErr) {
              // Certificado ainda pode não ter sido gerado
            }
          }

          setAppDetails({
            ...app,
            certificado: cert,
            badge: {
              ...app.badge,
              titulo: badgeTitle,
              area: badgeArea,
              descricao: badgeDesc,
              pontos: badgePontos !== undefined ? badgePontos : (app.badge?.pontos ?? 0)
            }
          });
        } else {
          setFetchError(res.data?.message || t('errorLoadingDetails', 'Erro ao carregar detalhes da candidatura.'));
        }
      } catch (err) {
        console.error('Error fetching application details inside modal:', err);
        setFetchError(err.response?.data?.message || err.message || t('errorLoadingDetails', 'Erro ao carregar detalhes da candidatura.'));
      } finally {
        setLoading(false);
      }
    };

    fetchAppDetails();
  }, [appId, currentLang]);

  if (!appId) return null;

  return (
    <>
      <div className="users-modal-overlay" onClick={onClose} />
      <div className="users-modal" style={{ maxWidth: '740px', width: '90%' }}>
        <div className="users-modal-header">
          <h5>{t('viewDetails') || 'Ver Detalhes'} — {t('applicationLabel') || 'Candidatura'}</h5>
          <button className="users-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div className="text-center py-5">
              <div className="users-spinner small mx-auto mb-3" />
              <span className="text-muted small">{t('loading') || 'A carregar...'}</span>
            </div>
          ) : fetchError ? (
            <div className="text-center py-5">
              <div className="alert alert-danger d-inline-block text-start p-3" style={{ maxWidth: '500px', borderRadius: '12px' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                    <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                  </svg>
                  <strong>{t('error') || 'Erro'}</strong>
                </div>
                <p className="mb-0 small">{fetchError}</p>
              </div>
            </div>
          ) : !appDetails ? (
            <div className="text-center py-5">
              <span className="text-muted small">{t('noDataFound') || 'Nenhum dado encontrado.'}</span>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4 text-start">
              {/* Status Banner */}
              <div className="p-3 rounded-3 d-flex align-items-center justify-content-between border" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                <div>
                  <span className="text-muted small fw-semibold d-block">{t('currentStatus') || 'Estado Atual'}</span>
                  <span className={getStatusBadgeClass(appDetails)}>
                    <span className="status-dot"></span>
                    {getStatusText(appDetails)}
                  </span>
                </div>
                <div>
                  <span className="text-muted small fw-semibold d-block text-end">{t('candidacyDate') || 'Data'}</span>
                  <strong className="text-dark small">{formatDate(appDetails.data_candidatura)}</strong>
                </div>
              </div>

              {/* Consultant info (Only visible for admin / TM / SLL) */}
              {!isConsultantView && (
                <div className="p-3 border rounded-3 bg-light d-flex align-items-center justify-content-between">
                  <div>
                    <span className="text-muted small d-block" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{t('allAppsColConsultor') || 'Consultor'}</span>
                    <h6 className="fw-bold mb-0">{appDetails.consultor?.nome || ''} {appDetails.consultor?.apelido || ''}</h6>
                    <span className="text-muted small">{appDetails.consultor?.email || ''}</span>
                  </div>
                </div>
              )}

              {/* Complete options (RGPD, Share) if closed-ok and consultant view */}
              {isConsultantView && appDetails.id_estado_candidatura === 4 && (
                <div className="p-4 rounded-4 border bg-light-subtle" style={{ borderColor: 'var(--sidebar-border)' }}>
                  <h6 className="fw-bold mb-3">{t('completionOptions') || 'Opções'}</h6>

                  {/* RGPD Consent */}
                  {onRgpdToggle && (
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                      <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
                        <input
                          className="form-check-input my-0"
                          type="checkbox"
                          role="switch"
                          id="rgpdConsentCheckbox"
                          checked={rgpdConsent[appDetails.id_candidatura] || false}
                          onChange={() => onRgpdToggle(appDetails.id_candidatura)}
                          style={{ cursor: 'pointer', width: '2.2em', height: '1.1em' }}
                        />
                        <label className="form-check-label small text-muted mb-0 cursor-pointer" htmlFor="rgpdConsentCheckbox" style={{ cursor: 'pointer' }}>
                          {t('rgpdConsentLabel') || 'Autorizar partilha pública'}
                        </label>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 rounded-3 px-2.5 py-1"
                        style={{ fontSize: '0.78rem', fontWeight: 600 }}
                        onClick={() => setShowRgpdModal(true)}
                      >
                        📖 {t('btnRgpdCandidatura', 'RGPD de Candidatura')}
                      </button>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="d-flex gap-2 flex-wrap">
                    {onLinkedInShare && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 fw-semibold"
                        onClick={() => onLinkedInShare(appDetails)}
                      >
                        <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'currentColor' }}>
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        {t('shareLinkedIn') || 'Partilhar no LinkedIn'}
                      </button>
                    )}

                    {rgpdConsent[appDetails.id_candidatura] && (
                      <>
                        <CopiarPerfilPublico idConsultor={appDetails.id_utilizador} />
                        <CopiarBadgePublico idConsultor={appDetails.id_utilizador} idCandidatura={appDetails.id_candidatura} />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Badge info */}
              <div className="d-flex gap-3 align-items-center bg-light p-3 rounded-3">
                <div className="kpi-icon-wrapper rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary" style={{ width: 56, height: 56, minWidth: 56, overflow: 'hidden' }}>
                  {appDetails.badge?.logo ? (
                    <img
                      src={`${API_BASE_URL}/uploads/logo_badges/${appDetails.badge.logo}`}
                      alt={appDetails.badge.titulo}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="8" r="7" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                  )}
                </div>
                <div>
                  <h6 className="fw-bold mb-1">{appDetails.badge?.titulo || '—'}</h6>
                  <span className="text-muted small d-block">
                    {appDetails.badge?.area && appDetails.badge.area !== '—' ? `${appDetails.badge.area} • ` : ''}
                    {appDetails.badge?.pontos ?? 0} pts
                  </span>
                </div>
              </div>

              {/* Certificate Card (Rendered whenever a certificate is issued, visible to Admin, SLL, TM, and Consultor) */}
              {appDetails.certificado && (
                <div 
                  className="p-3 rounded-3 border d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 shadow-sm"
                  style={{ 
                    backgroundColor: 'rgba(16, 185, 129, 0.05)', 
                    borderColor: 'rgba(16, 185, 129, 0.3)' 
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{ 
                        width: 46, 
                        height: 46, 
                        minWidth: 46, 
                        backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                        color: '#10b981' 
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="7" />
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                      </svg>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h6 className="fw-bold mb-0 text-success" style={{ fontSize: '0.95rem' }}>
                          {t('certificateAwarded', 'Certificado de Conquista')}
                        </h6>
                        <span className="badge bg-success" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                          {t('statusApproved', 'Aprovado')}
                        </span>
                      </div>
                      <span className="text-muted small d-block font-monospace mt-1" style={{ fontSize: '0.75rem' }}>
                        {t('validationCode', 'Código')}: <strong className="text-dark">{appDetails.certificado?.codigo_validacao || '—'}</strong>
                        {appDetails.certificado?.data_emissao && ` • ${formatDate(appDetails.certificado.data_emissao)}`}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex gap-2 align-items-center w-100 w-sm-auto justify-content-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-success d-inline-flex align-items-center gap-1.5 fw-semibold rounded-3 px-3 py-1.5 shadow-sm"
                      onClick={handleOpenCertificateModal}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {t('viewCertificate', 'Ver Certificado')}
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5 fw-semibold rounded-3 px-2.5 py-1.5"
                      onClick={handleDownloadCertificate}
                      title={t('downloadPdf', 'Descarregar PDF')}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span className="d-none d-md-inline">{t('downloadPdf', 'Descarregar')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Evidences list */}
              <div>
                <h6 className="fw-bold mb-2">{t('evidenceTitle') || 'Evidências'}</h6>
                <div className="d-flex flex-column gap-2">
                  {!appDetails.evidencias || appDetails.evidencias.length === 0 ? (
                    <div className="text-muted small">{t('noAssociatedEvidences') || 'Sem evidências.'}</div>
                  ) : (
                    appDetails.evidencias.map((ev, idx) => (
                      <div key={idx} className="p-2 border rounded-2 d-flex justify-content-between align-items-center bg-white" style={{ fontSize: '0.85rem' }}>
                        <div className="text-truncate" style={{ maxWidth: '60%' }}>
                          <strong className="text-dark d-block text-truncate">{ev.nome_ficheiro}</strong>
                          <span className="text-muted small d-block">
                            {ev.requisito?.titulo ? ev.requisito.titulo : `Requisito #${ev.id_requisito || ev.id_requisito_nivel}`}
                          </span>
                        </div>
                        <div className="d-flex gap-2 align-items-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 fw-semibold rounded-3 px-2.5 py-1"
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
                          {ev.validado_tm === true && (
                            <span className="badge bg-success-subtle text-success">✓ TM OK</span>
                          )}
                          {ev.validado_tm === false && (
                            <span className="badge bg-danger-subtle text-danger">✗ TM Recusado</span>
                          )}
                          {ev.validado_sll === true && (
                            <span className="badge bg-success-subtle text-success">✓ SLL OK</span>
                          )}
                          {ev.validado_sll === false && (
                            <span className="badge bg-danger-subtle text-danger">✗ SLL Recusado</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audit History (Auditoria) */}
              <div>
                <h6 className="fw-bold mb-2">{t('appHistory') || 'Histórico'}</h6>
                <div className="d-flex flex-column gap-2" style={{ borderLeft: '2px solid var(--sidebar-border)', paddingLeft: '16px', marginLeft: '8px' }}>
                  {!appDetails.acoes || appDetails.acoes.length === 0 ? (
                    <div className="text-muted small">{t('noActionsRegistered') || 'Sem ações.'}</div>
                  ) : (
                    [...appDetails.acoes]
                      .sort((a, b) => new Date(a.data_acao_candidatura || 0) - new Date(b.data_acao_candidatura || 0))
                      .map((action, idx) => {
                        const actionLabel = action.tipo_acao?.traducao_acao?.[currentLang] || action.tipo_acao?.descricao || `Ação ${action.tipo_acao_candidatura || ''}`;
                        const commentText = action.comentario?.[currentLang] || (typeof action.comentario === 'string' ? action.comentario : '') || '';

                        return (
                          <div key={idx} className="position-relative mb-2" style={{ fontSize: '0.85rem' }}>
                            {/* Dot indicator */}
                            <div className="position-absolute bg-primary" style={{ width: '8px', height: '8px', borderRadius: '50%', left: '-21px', top: '5px' }} />

                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <strong className="text-dark">{actionLabel}</strong>
                              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{formatDate(action.data_acao_candidatura)}</span>
                            </div>
                            {commentText && (
                              <p className="text-muted mb-1" style={{ fontSize: '0.8rem' }}>
                                "{commentText}"
                              </p>
                            )}
                            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                              {t('authorLabel') || 'Autor'}: {action.autor_acao?.nome || ''} {action.autor_acao?.apelido || ''} ({action.autor_acao?.email || ''})
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end mt-4 border-top pt-3">
            <button type="button" className="users-modal-cancel py-2" onClick={onClose}>
              {t('closeBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Pré-Visualização de Evidência PDF */}
      <EvidenciaPdfModal
        isOpen={pdfModalOpen}
        onClose={handleClosePdfModal}
        pdfUrl={pdfUrl}
        fileName={selectedEvidenciaName}
        loading={loadingPdf}
        error={pdfError}
      />

      {/* Modal de Pré-Visualização do Certificado PDF */}
      {certModalOpen && (
        <div 
          className="users-modal-overlay" 
          style={{ zIndex: 1150 }} 
          onClick={handleCloseCertModal}
        >
          <div
            className="users-modal"
            style={{
              maxWidth: '860px',
              width: '95%',
              zIndex: 1160,
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'var(--panel)',
              color: 'var(--text)',
              borderRadius: '16px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
              border: '1px solid var(--sidebar-border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="users-modal-header border-bottom p-3 d-flex justify-content-between align-items-center"
              style={{ borderColor: 'var(--sidebar-border)' }}
            >
              <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: '85%' }}>
                <span style={{ fontSize: '1.25rem' }}>🎓</span>
                <div className="text-truncate">
                  <h6 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--text)' }}>
                    {t('certificateTitle', 'Visualização de Certificado')} — {appDetails?.badge?.titulo || ''}
                  </h6>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    {t('validationCode', 'Código')}: {appDetails?.certificado?.codigo_validacao || '—'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="users-modal-close"
                onClick={handleCloseCertModal}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '6px',
                  borderRadius: '8px'
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-3 p-md-4 flex-grow-1" style={{ minHeight: '480px', height: '65vh' }}>
              {loadingCert ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                  <div className="users-spinner mb-3" />
                  <span className="text-muted small fw-medium">
                    {t('loadingCertificate', 'A carregar o certificado do servidor...')}
                  </span>
                </div>
              ) : certError ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-danger text-center p-4">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-3">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <h6 className="fw-bold">{certError}</h6>
                </div>
              ) : (
                <iframe
                  src={certPdfUrl}
                  title="Certificado PDF"
                  width="100%"
                  height="100%"
                  style={{ border: '1px solid var(--sidebar-border)', borderRadius: '10px', backgroundColor: '#fff' }}
                />
              )}
            </div>

            {/* Footer */}
            <div
              className="users-modal-footer border-top p-3 d-flex justify-content-between align-items-center"
              style={{ borderColor: 'var(--sidebar-border)' }}
            >
              <button
                type="button"
                className="btn btn-sm btn-secondary rounded-3 px-3 py-1.5"
                onClick={handleCloseCertModal}
              >
                {t('closeBtn', 'Fechar')}
              </button>
              {certPdfUrl && (
                <button
                  type="button"
                  className="btn btn-sm btn-success rounded-3 px-3 py-1.5 d-flex align-items-center gap-1.5 fw-semibold"
                  onClick={handleDownloadCertificate}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {t('downloadPdf', 'Descarregar PDF')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de RGPD de Candidatura */}
      {showRgpdModal && (
        <ModalRgpdCandidatura onClose={() => setShowRgpdModal(false)} />
      )}
    </>
  );
}
