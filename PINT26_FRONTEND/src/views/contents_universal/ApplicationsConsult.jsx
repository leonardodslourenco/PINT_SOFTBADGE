import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';
import ViewBadgeModal from '../../components/ViewBadgeModal';
import CandidateBadgeModal from '../../components/CandidateBadgeModal';
import CopiarPerfilPublico from '../../components/CopiarPerfilPublico';
import CopiarBadgePublico from '../../components/CopiarBadgePublico';
import ViewApplicationDetailsModal from '../../components/ViewApplicationDetailsModal';

const ESTADOS = {
  1: { class: 'open', textKey: 'statusOpen' },
  2: { class: 'submitted', textKey: 'statusSubmitted' },
  3: { class: 'validation', textKey: 'statusValidacao' },
  4: { class: 'closed-ok', textKey: 'statusClosedOk' },
  5: { class: 'closed-nok', textKey: 'statusClosedNok' }
};

export default function ApplicationsConsult() {
  const { t, i18n } = useTranslation();
  const { socket } = useAppContext();

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

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Details Modal (Audit details & options)
  const [selectedApp, setSelectedApp] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [appDetails, setAppDetails] = useState(null);

  // Reusable modal triggers
  const [selectedCandidateBadge, setSelectedCandidateBadge] = useState(null);
  const [selectedViewBadgeId, setSelectedViewBadgeId] = useState(null);

  // RGPD Consent state (persisted in localStorage)
  const [rgpdConsent, setRgpdConsent] = useState({});

  // Certificate Viewer States
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  const [certificatePdfUrl, setCertificatePdfUrl] = useState(null);
  const [activeCertificateId, setActiveCertificateId] = useState(null);
  const [certificateError, setCertificateError] = useState(null);

  // Status Filter state
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState('all');

  const uniqueStatusTexts = useMemo(() => {
    const statuses = new Set();
    applications.forEach(app => {
      const txt = getStatusText(app);
      if (txt) statuses.add(txt);
    });
    return Array.from(statuses);
  }, [applications, i18n.language]);

  const filteredApplications = useMemo(() => {
    if (selectedEstadoFilter === 'all') return applications;
    return applications.filter(app => getStatusText(app) === selectedEstadoFilter);
  }, [applications, selectedEstadoFilter]);

  // Fetch applications and cross-reference with badges catalog to extract areas and titles
  const fetchApplications = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [resApps, resBadges] = await Promise.all([
        api.get('/candidatura_badge'),
        api.get('/badge?ativo=true')
      ]);

      let rawApps = [];
      let badgesMap = {};

      if (resBadges.data?.success) {
        // Create lookup map of badges
        resBadges.data.data.forEach(b => {
          badgesMap[b.id_badge] = b;
        });
      }

      if (resApps.data?.success) {
        rawApps = resApps.data.data || [];
      }

      // Enrich applications with correct translated title and area
      const enrichedApps = rawApps.map(app => {
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

      setApplications(enrichedApps);

      // Load RGPD consents from DB value partilhar_conclusao
      const initialConsents = {};
      enrichedApps.forEach(app => {
        initialConsents[app.id_candidatura] = !!app.partilhar_conclusao;
      });
      setRgpdConsent(initialConsents);

    } catch (err) {
      console.error('Error fetching applications:', err);
      const mockApps = getMockApplications();
      setApplications(mockApps);
      const initialConsents = {};
      mockApps.forEach(app => {
        initialConsents[app.id_candidatura] = false;
      });
      setRgpdConsent(initialConsents);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [i18n.language]);

  useEffect(() => {
    fetchApplications(false);
  }, [fetchApplications]);

  // Escutar atualizações via WebSocket em tempo real para o Consultor (atualização silenciosa)
  useEffect(() => {
    if (socket) {
      const handleCandidaturaAvancou = (data) => {
        console.log('Notificação de avanço de candidatura recebida via WebSocket:', data);
        setTimeout(() => {
          fetchApplications(true); // Recarrega silenciosamente a lista de candidaturas do consultor

          // Se a candidatura atualizada for a que o utilizador está a analisar no modal, atualiza os detalhes
          if (selectedApp && String(selectedApp) === String(data?.id_candidatura)) {
            api.get(`/candidatura_badge/${selectedApp}`).then(res => {
              if (res.data?.success) {
                const app = res.data.data;
                const currentLang = i18n.language || 'pt';
                const matched = applications.find(a => a.id_candidatura === selectedApp);

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
            }).catch(err => console.error('Erro ao atualizar detalhes em tempo real:', err));
          }
        }, 400);
      };

      socket.on('candidatura_avancou', handleCandidaturaAvancou);

      return () => {
        socket.off('candidatura_avancou', handleCandidaturaAvancou);
      };
    }
  }, [socket, fetchApplications, selectedApp, applications, i18n.language]);

  // Escutar emissão final de badges via WebSocket em tempo real para o Consultor (atualização silenciosa)
  useEffect(() => {
    if (socket) {
      const handleBadgeEmitido = (data) => {
        console.log('Notificação de badge emitido recebida via WebSocket:', data);
        setTimeout(() => {
          fetchApplications(true); // Recarrega silenciosamente a lista

          // Se a candidatura atualizada for a que o utilizador está a analisar no modal, atualiza os detalhes
          if (selectedApp && String(selectedApp) === String(data?.id_candidatura)) {
            api.get(`/candidatura_badge/${selectedApp}`).then(res => {
              if (res.data?.success) {
                const app = res.data.data;
                const currentLang = i18n.language || 'pt';
                const matched = applications.find(a => a.id_candidatura === selectedApp);

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
            }).catch(err => console.error('Erro ao atualizar detalhes do badge:', err));
          }

          // DISPARAR CONFETES COMEMORATIVOS
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });

          // Alerta SweetAlert comemorativo
          Swal.fire({
            icon: 'success',
            title: t('badgeIssuedTitle'),
            text: t('badgeIssuedText'),
            confirmButtonText: 'OK',
            confirmButtonColor: '#16a34a'
          });
        }, 400);
      };

      socket.on('candidatura_badge_emitido', handleBadgeEmitido);

      return () => {
        socket.off('candidatura_badge_emitido', handleBadgeEmitido);
      };
    }
  }, [socket, fetchApplications, selectedApp, applications, i18n.language, t]);

  function getMockApplications() {
    return [
      {
        id_candidatura: 'c1',
        data_candidatura: '2026-02-16T10:30:00.000Z',
        id_estado_candidatura: 4,
        badge: { titulo: 'Badge Júnior de Baixa Codificação', area: 'Outsystems', pontos: 100 },
        evidencias: [
          { id_requisito_nivel: 101, nome_ficheiro: 'cert_outsystems.pdf', url_ficheiro: 'http://drive.com/cert.pdf', validado_tm: true, validado_sll: true }
        ]
      }
    ];
  }

  // Fetch detailed info on app click (for audit history)
  const handleOpenDetails = async (appId) => {
    setSelectedApp(appId);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/candidatura_badge/${appId}`);
      if (res.data?.success) {
        const app = res.data.data;
        const currentLang = i18n.language || 'pt';
        const matched = applications.find(a => a.id_candidatura === appId);

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
      console.error('Error fetching application details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedApp(null);
    setAppDetails(null);
  };

  // Toggle RGPD Consent with Backend integration
  const handleRgpdToggle = async (appId) => {
    const newValue = !rgpdConsent[appId];
    try {
      const res = await api.patch(`/candidatura_badge/${appId}/share`, {
        partilhar_conclusao: newValue
      });
      if (res.data?.success) {
        setRgpdConsent(prev => ({ ...prev, [appId]: newValue }));
        
        // Update local state arrays to keep view data in sync
        setApplications(prev => prev.map(app => 
          app.id_candidatura === appId ? { ...app, partilhar_conclusao: newValue } : app
        ));
        setAppDetails(prev => prev && prev.id_candidatura === appId ? { ...prev, partilhar_conclusao: newValue } : prev);

        Swal.fire({
          icon: 'success',
          title: 'RGPD Atualizado',
          text: newValue ? 'Termos aceites: Autorização de partilha ativa.' : 'Termos revogados: Partilha oculta.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error("Erro ao atualizar partilha de badge:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.response?.data?.message || 'Erro ao atualizar consentimento de partilha.'
      });
    }
  };

  // Share on LinkedIn (Requisito 11)
  const handleLinkedInShare = (app) => {
    const shareUrl = encodeURIComponent(`https://softinsa.pt/badges/verify/${app.id_candidatura}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank');
  };

  // Fetch metadata and PDF stream for inline viewer modal
  const handleOpenCertificate = async (idCandidatura) => {
    setLoadingCertificate(true);
    setCertificateError(null);
    setCertificatePdfUrl(null);
    setActiveCertificateId(null);
    setCertificateModalOpen(true);
    try {
      // 1. Obter metadados do certificado pela ID da candidatura
      const metaRes = await api.get(`/certificado/candidatura/${idCandidatura}`);
      if (metaRes.data?.success && metaRes.data?.data) {
        const certId = metaRes.data.data.id_certificado;
        setActiveCertificateId(certId);
        
        // 2. Buscar o PDF blob com autorização JWT
        const pdfRes = await api.get(`/certificado/${certId}/view`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
        
        // Converter o Blob para Base64 Data URL para compatibilidade máxima no iframe
        const reader = new FileReader();
        reader.onloadend = () => {
          setCertificatePdfUrl(reader.result);
        };
        reader.readAsDataURL(blob);
      } else {
        setCertificateError(metaRes.data?.message || 'Não foi possível encontrar o certificado.');
      }
    } catch (err) {
      console.error("Erro ao carregar certificado:", err);
      setCertificateError(err.response?.data?.message || 'Erro ao carregar o certificado do servidor.');
    } finally {
      setLoadingCertificate(false);
    }
  };

  const handleCloseCertificateModal = () => {
    setCertificatePdfUrl(null);
    setActiveCertificateId(null);
    setCertificateModalOpen(false);
  };

  const handleDownloadRealCertificate = async () => {
    if (!activeCertificateId) return;
    try {
      const res = await api.get(`/certificado/${activeCertificateId}/download`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `certificado_${activeCertificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Erro ao fazer download do certificado:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao descarregar o ficheiro do servidor.'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="users-admin-container">
      {/* Header & Filter Row */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1">{t('menuApplications')}</h3>
          <p className="text-muted small mb-0">{t('applicationsConsultSub')}</p>
        </div>

        {/* State Filter dropdown, visible only if applications array has elements */}
        {!loading && applications.length > 0 && (
          <div className="d-flex align-items-center gap-2" style={{ minWidth: '220px' }}>
            <label className="small text-muted fw-semibold text-nowrap mb-0" htmlFor="estadoFilter">
              {t('filterByStatus')}
            </label>
            <select
              id="estadoFilter"
              className="form-select form-select-sm rounded-3 shadow-sm"
              value={selectedEstadoFilter}
              onChange={(e) => setSelectedEstadoFilter(e.target.value)}
              style={{ backgroundColor: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
            >
              <option value="all">{t('all', 'Todos')}</option>
              {uniqueStatusTexts.map((statusText) => (
                <option key={statusText} value={statusText}>
                  {statusText}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Applications Table Card */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="users-spinner" />
            <span>{t('loadingApps')}</span>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('colBadge')}</th>
                  <th>Área</th>
                  <th>{t('colDate')}</th>
                  <th>{t('colStatus')}</th>
                  <th className="text-end">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="users-empty-row">
                      {t('noAppsFound')}
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((app) => (
                    <tr key={app.id_candidatura}>
                      <td className="users-name-cell">
                        {app.badge?.titulo || '—'}
                      </td>
                      <td className="users-email-cell">
                        {app.badge?.area || '—'}
                      </td>
                      <td>
                        {formatDate(app.data_candidatura)}
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(app)}>
                          <span className="status-dot"></span>
                          {getStatusText(app)}
                        </span>
                      </td>
                      <td>
                        <div className="users-actions-cell" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            className="users-action-btn edit"
                            onClick={() => handleOpenDetails(app.id_candidatura)}
                            style={{ margin: 0 }}
                          >
                            <svg viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <span>{t('viewDetails')}</span>
                          </button>
                          <button
                            className="users-action-btn edit"
                            onClick={() => setSelectedCandidateBadge(app.badge)}
                            style={{ margin: 0, backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                            <span>{t('viewCandidacyBtn', 'Ver Candidatura')}</span>
                          </button>
                          <button
                            className="users-action-btn edit"
                            onClick={() => setSelectedViewBadgeId(app.badge?.id_badge)}
                            style={{ margin: 0, backgroundColor: 'rgba(21, 128, 61, 0.1)', color: '#15803d' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="8" r="7" />
                              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                            </svg>
                            <span>{t('viewBtn', 'Ver Badge')}</span>
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

      <ViewApplicationDetailsModal
        appId={selectedApp}
        onClose={handleCloseDetails}
        isConsultantView={true}
        rgpdConsent={rgpdConsent}
        onRgpdToggle={handleRgpdToggle}
        onLinkedInShare={handleLinkedInShare}
        onOpenCertificate={handleOpenCertificate}
      />

      {selectedCandidateBadge && (
        <CandidateBadgeModal
          badge={selectedCandidateBadge}
          onClose={() => setSelectedCandidateBadge(null)}
          onRefreshData={fetchApplications}
        />
      )}

      {selectedViewBadgeId && (
        <ViewBadgeModal
          badgeId={selectedViewBadgeId}
          onClose={() => setSelectedViewBadgeId(null)}
        />
      )}

      {/* Modal de Visualização de Certificado */}
      {certificateModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: '800px' }}>
            <div className="modal-content border-0 shadow-lg rounded-4" style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">{t('certificateTitle', 'Visualização de Certificado')}</h5>
                <button type="button" className="btn-close" onClick={handleCloseCertificateModal} aria-label="Close" style={{ filter: 'var(--close-filter)' }}></button>
              </div>
              <div className="modal-body p-4" style={{ height: '550px' }}>
                {loadingCertificate ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100">
                    <div className="users-spinner mb-3" />
                    <span className="text-muted">{t('loadingCertificate', 'A carregar o certificado do servidor...')}</span>
                  </div>
                ) : certificateError ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-danger text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-3">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h5>{certificateError}</h5>
                  </div>
                ) : (
                  <iframe
                    src={certificatePdfUrl}
                    title="Visualizador de Certificado"
                    width="100%"
                    height="100%"
                    className="border rounded-3"
                  />
                )}
              </div>
              <div className="modal-footer border-top-0 pt-0 d-flex justify-content-between">
                <button type="button" className="btn btn-secondary rounded-3" onClick={handleCloseCertificateModal}>
                  {t('closeBtn', 'Fechar')}
                </button>
                {certificatePdfUrl && (
                  <button type="button" className="btn btn-success rounded-3 d-flex align-items-center gap-2 fw-semibold" onClick={handleDownloadRealCertificate}>
                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
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
        </div>
      )}
    </div>
  );
}
