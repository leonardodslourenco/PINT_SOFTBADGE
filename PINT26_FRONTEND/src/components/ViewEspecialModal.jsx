import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../services/api';

export default function ViewEspecialModal({ conquistaId, onClose }) {
  const { t } = useTranslation();
  const [conquista, setConquista] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!conquistaId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/conquista-especial/${conquistaId}`);
        if (res.data?.success && res.data.data) {
          setConquista(res.data.data);
        }
      } catch (err) {
        console.error('Erro ao obter detalhes do Badge Especial:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [conquistaId]);

  if (!conquistaId) return null;

  const tipo = conquista?.tipo_badge_especial;

  return (
    <>
      {/* Backdrop */}
      <div className="users-modal-overlay" style={{ zIndex: 1060 }} onClick={onClose} />

      {/* Modal Container */}
      <div
        className="users-modal"
        style={{
          maxWidth: '620px',
          width: '92%',
          zIndex: 1070,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--panel)',
          color: 'var(--text)',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          border: '1px solid var(--sidebar-border)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          className="users-modal-header border-bottom p-3 d-flex justify-content-between align-items-center"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.3rem' }}>⭐</span>
            <h5 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--text)', fontSize: '1.15rem' }}>
              {loading ? t('loadingDetails', 'A carregar detalhes...') : conquista?.titulo}
            </h5>
          </div>
          <button
            type="button"
            className="users-modal-close"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <div className="users-spinner mb-2" />
              <span className="text-muted small">{t('loadingDetails', 'A carregar...')}</span>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {/* Badge Visual & Hero Section */}
              <div className="d-flex align-items-center gap-3 p-3 rounded-4 bg-light-subtle border" style={{ borderColor: 'var(--sidebar-border)' }}>
                <div
                  className="rounded-4 d-flex align-items-center justify-content-center p-2 border flex-shrink-0"
                  style={{
                    width: '74px',
                    height: '74px',
                    backgroundColor: 'var(--panel)',
                    borderColor: 'var(--sidebar-border)'
                  }}
                >
                  {conquista?.logo_conquista && !logoError ? (
                    <img
                      src={`${API_BASE_URL}/uploads/logo_especial/${conquista.logo_conquista}`}
                      alt={conquista.titulo}
                      onError={() => setLogoError(true)}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ fontSize: '2.4rem' }}>🌟</div>
                  )}
                </div>
                <div className="d-flex flex-column justify-content-center">
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <h5 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>
                      {conquista?.titulo}
                    </h5>
                    <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.8rem' }}>
                      ⚡ +{conquista?.pontos_bonus} pts
                    </span>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.45 }}>
                    {conquista?.descricao}
                  </p>
                </div>
              </div>

              {/* Requirement / Type Details */}
              <div className="border rounded-3 p-3 bg-light-subtle" style={{ borderColor: 'var(--sidebar-border)' }}>
                <h6 className="fw-bold mb-2 small text-uppercase text-muted" style={{ letterSpacing: '0.5px' }}>
                  {t('colRequirementType', 'Tipo de Comprovação')}
                </h6>
                {tipo ? (
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '1.2rem' }}>{tipo.requer_link ? '🌐' : '📜'}</span>
                        <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>{tipo.nome}</strong>
                      </div>
                      {tipo.requer_link ? (
                        <span className="badge bg-info bg-opacity-10 text-info px-2.5 py-1 rounded-pill fw-semibold">
                          🔗 {t('publicUrlLabel', 'Link Público Exigido')}
                        </span>
                      ) : (
                        <span className="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1 rounded-pill fw-semibold">
                          📄 {t('pdfFileLabel', 'PDF até 5MB')}
                        </span>
                      )}
                    </div>
                    {tipo.descricao && (
                      <p className="text-muted small mb-0" style={{ lineHeight: 1.4 }}>
                        {tipo.descricao}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-muted small">{t('noDescriptionAvailable', 'Sem tipo específico associado.')}</span>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="users-modal-footer border-top p-3 d-flex justify-content-end bg-panel"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <button
            type="button"
            className="btn btn-secondary rounded-3 px-4 fw-semibold"
            onClick={onClose}
          >
            {t('closeBtn', 'Fechar')}
          </button>
        </div>
      </div>
    </>
  );
}
