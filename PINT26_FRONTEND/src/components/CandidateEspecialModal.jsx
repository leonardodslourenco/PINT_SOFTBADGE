import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { api, API_BASE_URL } from '../services/api';
import { useAppContext } from '../context/AppContext';

export default function CandidateEspecialModal({ badge, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { triggerCountsUpdate } = useAppContext();
  const [urlComprovativo, setUrlComprovativo] = useState('');
  const [fileComprovativo, setFileComprovativo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!badge) return null;

  const tipo = badge.tipo_badge_especial;
  const isLinkRequired = tipo ? tipo.requer_link : false;
  const isFileRequired = tipo ? tipo.requer_ficheiro : true;

  const handleFileChange = (e) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação estrita de extensão e tipo MIME PDF
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMessage(t('pdfOnlyError', 'Apenas são permitidos ficheiros em formato PDF.'));
      e.target.value = '';
      setFileComprovativo(null);
      return;
    }

    // Limite de segurança de 5MB (5 * 1024 * 1024 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage(t('fileSize5mbError', 'O ficheiro não pode exceder 5MB.'));
      e.target.value = '';
      setFileComprovativo(null);
      return;
    }

    setFileComprovativo(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isLinkRequired) {
      if (!urlComprovativo.trim()) {
        setErrorMessage(t('invalidUrlError', 'Por favor insira o URL do link público.'));
        return;
      }
      try {
        new URL(urlComprovativo.trim());
      } catch {
        setErrorMessage(t('invalidUrlError', 'Por favor insira um URL válido com http:// ou https://.'));
        return;
      }
    }

    if (isFileRequired && !fileComprovativo) {
      setErrorMessage(t('pdfFileLabel', 'É obrigatório selecionar um ficheiro comprovativo em PDF.'));
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('id_conquista_especial', badge.id_conquista_especial);

      if (urlComprovativo.trim()) {
        formData.append('url_comprovativo', urlComprovativo.trim());
      }

      if (fileComprovativo) {
        formData.append('ficheiro_comprovativo', fileComprovativo);
      }

      const res = await api.post('/candidatura_especial', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('submitSpecialAppSuccess', 'Candidatura ao Badge Especial submetida com sucesso!'),
          timer: 1800,
          showConfirmButton: false
        });
        if (triggerCountsUpdate) triggerCountsUpdate();
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Erro ao submeter candidatura especial:', err);
      const msg = err.response?.data?.message || t('errorGeneric', 'Erro ao submeter candidatura.');
      setErrorMessage(msg);
      Swal.fire({
        icon: 'error',
        title: t('errorTitle', 'Erro'),
        text: msg
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="users-modal-overlay" style={{ zIndex: 1060 }} onClick={onClose} />

      {/* Modal Container */}
      <div
        className="users-modal"
        style={{
          maxWidth: '580px',
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
        {/* Header */}
        <div
          className="users-modal-header border-bottom p-3 d-flex justify-content-between align-items-center"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.25rem' }}>🚀</span>
            <h5 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--text)', fontSize: '1.15rem' }}>
              {t('applySpecialBadgeTitle', 'Candidatura a Badge Especial')}
            </h5>
          </div>
          <button
            type="button"
            className="users-modal-close"
            onClick={onClose}
            disabled={submitting}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {/* Badge Info Summary Card */}
            <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light-subtle border mb-3" style={{ borderColor: 'var(--sidebar-border)' }}>
              <div
                className="rounded-3 d-flex align-items-center justify-content-center p-1 border flex-shrink-0"
                style={{ width: '48px', height: '48px', backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
              >
                {badge.logo_conquista ? (
                  <img
                    src={`${API_BASE_URL}/uploads/logo_especial/${badge.logo_conquista}`}
                    alt={badge.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '1.5rem' }}>🌟</span>
                )}
              </div>
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center gap-2">
                  <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>{badge.titulo}</strong>
                  <span className="badge bg-warning text-dark fw-bold px-2 py-0.5 rounded-pill" style={{ fontSize: '0.75rem' }}>
                    +{badge.pontos_bonus} pts
                  </span>
                </div>
                <span className="text-muted small text-truncate" style={{ maxWidth: '380px' }}>
                  {badge.descricao}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3 d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Link Público TextBox (Quando requer_link) */}
            {isLinkRequired && (
              <div className="mb-3">
                <label className="form-label small fw-bold" style={{ color: 'var(--text)' }}>
                  🔗 {t('publicUrlLabel', 'URL do Link Público *')}
                </label>
                <input
                  type="url"
                  className="form-control"
                  placeholder={t('publicUrlPlaceholder', 'https://www.credly.com/badges/...')}
                  value={urlComprovativo}
                  onChange={(e) => setUrlComprovativo(e.target.value)}
                  disabled={submitting}
                  required
                  style={{
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    borderColor: 'var(--sidebar-border)',
                    borderRadius: '8px'
                  }}
                />
                <div className="form-text text-muted small mt-1">
                  {t('publicUrlHelp', 'Insira o link público que permita a verificação da sua credencial digital.')}
                </div>
              </div>
            )}

            {/* Upload PDF (Quando requer_ficheiro) */}
            {isFileRequired && (
              <div className="mb-3">
                <label className="form-label small fw-bold" style={{ color: 'var(--text)' }}>
                  📄 {t('pdfFileLabel', 'Ficheiro Comprovativo (PDF, máx. 5MB) *')}
                </label>
                <div
                  className="p-3 border border-2 border-dashed rounded-3 text-center bg-light-subtle"
                  style={{ borderColor: 'var(--sidebar-border)', cursor: 'pointer' }}
                  onClick={() => document.getElementById('especialFileInput')?.click()}
                >
                  <input
                    type="file"
                    id="especialFileInput"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    disabled={submitting}
                    style={{ display: 'none' }}
                  />
                  <div className="d-flex flex-column align-items-center justify-content-center gap-1">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--primary)" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    {fileComprovativo ? (
                      <div className="mt-1">
                        <strong className="text-success small d-block">{fileComprovativo.name}</strong>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {(fileComprovativo.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="small fw-semibold mt-1" style={{ color: 'var(--text)' }}>
                          {t('selectPdfPrompt', 'Clique para selecionar o ficheiro PDF')}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {t('pdfLimitHelp', 'Formato .PDF até 5MB')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="users-modal-footer border-top p-3 d-flex justify-content-end gap-2 bg-panel"
            style={{ borderColor: 'var(--sidebar-border)' }}
          >
            <button
              type="button"
              className="btn btn-secondary rounded-3 px-3 fw-semibold"
              onClick={onClose}
              disabled={submitting}
            >
              {t('cancelBtn', 'Cancelar')}
            </button>
            <button
              type="submit"
              className="btn btn-primary rounded-3 px-4 fw-semibold d-flex align-items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="users-spinner" style={{ width: '16px', height: '16px' }} />
                  <span>{t('submitting', 'A submeter...')}</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>{t('applyEspecialBtn', 'Submeter Candidatura')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
