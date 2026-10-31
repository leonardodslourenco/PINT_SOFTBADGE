import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../services/api';

/**
 * ViewBadgeCatalogModal
 * =====================
 * Modal para visualização detalhada de um Badge a partir do Catálogo Global (BadgesList.jsx).
 * Utiliza os endpoints otimizados de catálogo (/badge/catalogo/:id e /requisito_badge/catalogo/badge/:id)
 * que não aplicam a restrição de escopo de Service Line para o SLL e já devolvem os dados
 * de hierarquia (learning_path, service_line, area, nivel_area) diretamente preenchidos.
 */
export default function ViewBadgeCatalogModal({ badgeId, onClose }) {
  const { t, i18n } = useTranslation();
  const [badge, setBadge] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoError, setLogoError] = useState(false);

  // Helper para resolução segura de strings que possam vir como objeto multilíngue ou texto
  const getDisplayText = (val) => {
    if (!val) return '—';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      const currentLang = i18n.language || 'pt';
      return val[currentLang] || val.pt || val.en || val.es || Object.values(val)[0] || '—';
    }
    return String(val);
  };

  useEffect(() => {
    if (!badgeId) return;

    let isMounted = true;

    const fetchBadgeCatalogDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obter detalhes do badge no catálogo (com hierarquia já incluída)
        // 2. Obter requisitos do badge no catálogo
        const [resBadge, resReqs] = await Promise.all([
          api.get(`/badge/catalogo/${badgeId}`),
          api.get(`/requisito_badge/catalogo/badge/${badgeId}`).catch(() => ({ data: { success: false, data: [] } }))
        ]);

        if (!isMounted) return;

        if (resBadge.data?.success && resBadge.data.data) {
          const badgeData = { ...resBadge.data.data };

          // Resolução defensiva para Learning Path caso venha null ou objeto
          let lpDisplay = getDisplayText(badgeData.learning_path);
          if (lpDisplay === '—') {
            try {
              // Tentar via id_learning_path direto
              if (badgeData.id_learning_path) {
                const lpRes = await api.get(`/learning_path/${badgeData.id_learning_path}`).catch(() => null);
                if (lpRes?.data?.success && lpRes.data.data?.learning_path) {
                  lpDisplay = getDisplayText(lpRes.data.data.learning_path);
                }
              }
              // Se ainda não resolveu, tentar via service_line
              if (lpDisplay === '—' && badgeData.id_service_line) {
                const slRes = await api.get(`/service_line/${badgeData.id_service_line}`).catch(() => null);
                if (slRes?.data?.success && slRes.data.data?.learning_path) {
                  lpDisplay = getDisplayText(slRes.data.data.learning_path);
                }
              }
              // Fallback geral na listagem de learning paths ativos
              if (lpDisplay === '—' && badgeData.id_learning_path) {
                const allLpRes = await api.get('/learning_path?ativo=true').catch(() => null);
                const lpList = allLpRes?.data?.data || [];
                const matched = lpList.find(l => String(l.id_learning_path) === String(badgeData.id_learning_path));
                if (matched?.learning_path) {
                  lpDisplay = getDisplayText(matched.learning_path);
                }
              }
            } catch (fallbackErr) {
              console.warn('Erro ao resolver nome do Learning Path:', fallbackErr);
            }
          }

          if (lpDisplay !== '—') {
            badgeData.learning_path = lpDisplay;
          }

          setBadge(badgeData);
        } else {
          setError(resBadge.data?.message || t('errorLoadingDetails', 'Erro ao carregar detalhes do badge.'));
        }

        if (resReqs.data?.success && Array.isArray(resReqs.data.data)) {
          setRequirements(resReqs.data.data);
        } else {
          setRequirements([]);
        }
      } catch (err) {
        console.error('Erro ao obter detalhes do badge do catálogo:', err);
        if (isMounted) {
          setError(err.response?.data?.message || err.message || t('errorLoadingDetails', 'Erro ao carregar detalhes do badge.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBadgeCatalogDetails();

    return () => {
      isMounted = false;
    };
  }, [badgeId, t, i18n.language]);

  if (!badgeId) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="users-modal-overlay" style={{ zIndex: 1060 }} onClick={onClose} />

      {/* Modal Container */}
      <div 
        className="users-modal" 
        style={{ 
          maxWidth: '680px', 
          width: '92%', 
          zIndex: 1070, 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          backgroundColor: 'var(--panel)', 
          borderRadius: '16px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)', 
          overflow: 'hidden' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="users-modal-header border-bottom p-3 d-flex justify-content-between align-items-center bg-panel" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="text-truncate" style={{ maxWidth: '85%' }}>
            <h5 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--text)', fontSize: '1.2rem' }}>
              {loading ? t('loadingDetails', 'A carregar detalhes...') : (getDisplayText(badge?.titulo) !== '—' ? getDisplayText(badge?.titulo) : '—')}
            </h5>
            {!loading && badge && (
              <span className="badge bg-primary bg-opacity-10 text-primary mt-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {getDisplayText(badge.nivel_area) !== '—' ? getDisplayText(badge.nivel_area) : `Nível #${badge.id_nivel_area || '—'}`}
              </span>
            )}
          </div>
          <button 
            className="users-modal-close" 
            onClick={onClose} 
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="text-muted small">{t('loadingBadgesCatalog', 'A carregar catálogo de badges...')}</span>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <div className="alert alert-danger d-inline-block text-start p-3" style={{ maxWidth: '500px', borderRadius: '12px' }}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                    <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                  </svg>
                  <strong>{t('error') || 'Erro'}</strong>
                </div>
                <p className="mb-0 small">{error}</p>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              
              {/* Badge Visuals Column */}
              <div className="col-12 col-md-4 text-center d-flex flex-column align-items-center justify-content-start border-end border-md" style={{ borderColor: 'var(--sidebar-border)' }}>
                <div 
                  className="rounded-circle shadow-sm mb-4 d-flex align-items-center justify-content-center" 
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    backgroundColor: 'var(--panel-2, rgba(0,0,0,0.03))', 
                    border: '3px solid var(--primary-light)',
                    overflow: 'hidden'
                  }}
                >
                  {badge?.logo && !logoError ? (
                    <img 
                      src={`${API_BASE_URL}/uploads/logo_badges/${badge.logo}`} 
                      alt={badge?.titulo} 
                      style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" width="60" height="60" style={{ stroke: 'var(--primary)', strokeWidth: 1.8, fill: 'none' }}>
                      <circle cx="12" cy="8" r="7" />
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                    </svg>
                  )}
                </div>

                {/* Card: Pontos */}
                <div className="w-100 p-3 rounded-3 mb-2.5 border text-start" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                  <span className="d-block text-muted fw-bold small text-uppercase mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    🪙 {t('badgePointsTitle', 'Pontos:')}
                  </span>
                  <strong className="text-dark px-1" style={{ fontSize: '1.1rem' }}>
                    {badge?.pontos ?? 0} <span className="text-muted small fw-normal" style={{ fontSize: '0.8rem' }}>pts</span>
                  </strong>
                </div>

                {/* Card: Entidade Emissora */}
                <div className="w-100 p-3 rounded-3 mb-2.5 border text-start" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                  <span className="d-block text-muted fw-bold small text-uppercase mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    🏢 {t('badgeIssuerTitle', 'Entidade Emissora:')}
                  </span>
                  <strong className="text-dark px-1" style={{ fontSize: '0.95rem' }}>
                    {badge?.emissor || 'Softinsa'}
                  </strong>
                </div>

                {/* Card: Prazo de Submissão */}
                <div className="w-100 p-3 rounded-3 mb-2.5 border text-start" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                  <span className="d-block text-muted fw-bold small text-uppercase mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    ⏱️ {t('badgeSubmitDaysTitle', 'Prazo de Submissão:')}
                  </span>
                  <strong className="text-dark px-1" style={{ fontSize: '1.05rem' }}>
                    {badge?.dias_submeter ?? 7} <span className="text-muted small fw-normal" style={{ fontSize: '0.8rem' }}>{t('daysLabel', 'dias')}</span>
                  </strong>
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                    {t('badgeSubmitDaysModalHelp', 'Tempo para passar de Rascunho a Submetido')}
                  </small>
                </div>

                {/* Card: Expira */}
                <div className="w-100 p-3 rounded-3 border text-start" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                  <span className="d-block text-muted fw-bold small text-uppercase mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    ⏳ {t('badgeExpiresTitle', 'Expira:')}
                  </span>
                  <div className="d-flex align-items-center justify-content-between mt-1 px-1">
                    <span className={`users-status-badge ${badge?.badge_expiravel ? 'inactive' : 'active'}`}>
                      {badge?.badge_expiravel ? t('statusActiveYes', 'Sim') : t('statusActiveNo', 'Não')}
                    </span>
                    {badge?.badge_expiravel && (
                      <span className="users-status-badge" style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text-muted)', border: '1px solid var(--sidebar-border)' }}>
                        {badge?.tempo_expiracao} {t('daysLabel', 'dias')}
                      </span>
                    )}
                  </div>
                  {badge?.badge_expiravel && (
                    <div className="mt-2.5 pt-2 border-top d-flex flex-column gap-1" style={{ borderColor: 'var(--sidebar-border)' }}>
                      <div className="d-flex justify-content-between align-items-center small">
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>🔔 {t('badgeWarningDaysTitle', 'Aviso prévio')}:</span>
                        <strong className="text-dark" style={{ fontSize: '0.8rem' }}>{badge?.tempo_aviso || 30} {t('daysLabel', 'dias')}</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center small">
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>🎁 {t('badgeRenewalPointsTitle', 'Pontos renovação')}:</span>
                        <strong className="text-success" style={{ fontSize: '0.8rem' }}>+{badge?.pontos_renovacao ?? 0} pts</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Badge Details Column */}
              <div className="col-12 col-md-8">
                
                {/* Section: Path / Hierarchy */}
                <div className="mb-4">
                  <h6 className="text-uppercase text-muted fw-bold small mb-2" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                    📍 {t('colHierarchy', 'Cadeia de Estrutura')}
                  </h6>
                  <div className="d-flex flex-column gap-2">
                    {/* Card 1: Learning Path */}
                    <div className="p-3 px-4 rounded-3 border text-start d-flex align-items-center justify-content-between" style={{ backgroundColor: 'var(--panel-2, rgba(0,0,0,0.01))', borderColor: 'var(--sidebar-border)' }}>
                      <span className="text-muted small fw-semibold">{t('menuLearningPath', 'Learning Path')}:</span>
                      <strong className="text-primary small">{getDisplayText(badge?.learning_path)}</strong>
                    </div>
                    {/* Card 2: Service Line */}
                    <div className="p-3 px-4 rounded-3 border text-start d-flex align-items-center justify-content-between" style={{ backgroundColor: 'var(--panel-2, rgba(0,0,0,0.01))', borderColor: 'var(--sidebar-border)' }}>
                      <span className="text-muted small fw-semibold">{t('serviceLine', 'Service Line')}:</span>
                      <strong className="text-secondary small">{getDisplayText(badge?.service_line)}</strong>
                    </div>
                    {/* Card 3: Area */}
                    <div className="p-3 px-4 rounded-3 border text-start d-flex align-items-center justify-content-between" style={{ backgroundColor: 'var(--panel-2, rgba(0,0,0,0.01))', borderColor: 'var(--sidebar-border)' }}>
                      <span className="text-muted small fw-semibold">{t('areaLabel', 'Área')}:</span>
                      <strong className="text-dark small">{getDisplayText(badge?.area)}</strong>
                    </div>
                  </div>
                </div>

                {/* Section: Description */}
                <div className="mb-4">
                  <h6 className="text-uppercase text-muted fw-bold small mb-2" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                    📖 {t('colDescription', 'Descrição')}
                  </h6>
                  <p className="mb-0 text-start" style={{ color: 'var(--text)', fontSize: '0.925rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {getDisplayText(badge?.descricao) !== '—' ? getDisplayText(badge?.descricao) : t('noDescription', 'Sem descrição disponível.')}
                  </p>
                </div>

                {/* Section: Competencies */}
                <div className="mb-4">
                  <h6 className="text-uppercase text-muted fw-bold small mb-2" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                    🎓 {t('skillBadgeTitle', 'Competências')} ({badge?.competencias?.length || 0})
                  </h6>
                  {(!badge?.competencias || badge.competencias.length === 0) ? (
                    <p className="text-muted fst-italic small mb-0">{t('noSkillsAssociated', 'Sem competências associadas.')}</p>
                  ) : (
                    <div className="d-flex flex-wrap gap-2 p-3 rounded-3 border text-start" style={{ backgroundColor: 'var(--panel-2, rgba(0,0,0,0.01))', borderColor: 'var(--sidebar-border)' }}>
                      {badge.competencias.map((comp) => (
                        <span
                          key={comp.id_competencia}
                          className="badge rounded-pill px-3 py-2 fw-semibold"
                          style={{
                            backgroundColor: 'rgba(13, 110, 253, 0.1)',
                            color: '#0d6efd',
                            border: '1px solid rgba(13, 110, 253, 0.25)',
                            fontSize: '0.8rem'
                          }}
                        >
                          {comp.titulo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section: Requirements */}
                <div>
                  <h6 className="text-uppercase text-muted fw-bold small mb-2" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>
                    📋 {t('colRequirements', 'Requisitos de Submissão')} ({requirements.length})
                  </h6>
                  
                  {requirements.length === 0 ? (
                    <p className="text-muted fst-italic small mb-0">{t('noRequirementsFound', 'Sem requisitos associados.')}</p>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {requirements.map((req, idx) => (
                        <div 
                          key={req.id_requisito || idx} 
                          className="p-3 rounded-3 d-flex flex-column align-items-start text-start" 
                          style={{ 
                            backgroundColor: 'var(--panel)', 
                            border: '1px solid var(--sidebar-border)'
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between w-100 mb-1">
                            <strong className="text-dark small">
                              {idx + 1}. {req.titulo}
                            </strong>
                            <span 
                              className={`badge ${req.obrigatoriedade_req ? 'bg-danger bg-opacity-10 text-danger' : 'bg-secondary bg-opacity-10 text-secondary'}`}
                              style={{ fontSize: '0.65rem', fontWeight: 600 }}
                            >
                              {req.obrigatoriedade_req ? t('requiredField', 'Obrigatório') : t('optionalField', 'Opcional')}
                            </span>
                          </div>
                          {req.subtitulo && (
                            <span className="text-muted mb-2" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                              {req.subtitulo}
                            </span>
                          )}
                          {req.descricao && (
                            <p className="mb-0 text-muted small" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                              {req.descricao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="d-flex justify-content-end p-3 border-top" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
          <button type="button" className="btn btn-secondary rounded-3 px-4 fw-semibold" onClick={onClose}>
            {t('closeBtn', 'Fechar')}
          </button>
        </div>
      </div>
    </>
  );
}
