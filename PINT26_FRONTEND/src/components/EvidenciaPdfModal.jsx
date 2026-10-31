import { useTranslation } from 'react-i18next';

export default function EvidenciaPdfModal({
  isOpen,
  onClose,
  pdfUrl,
  fileName,
  loading = false,
  error = null,
  onDownload
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName || 'evidencia.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div 
        className="users-modal-overlay" 
        style={{ zIndex: 1090 }} 
        onClick={onClose} 
      />
      <div
        className="users-modal"
        style={{
          maxWidth: '880px',
          width: '95%',
          zIndex: 1100,
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
      >
        {/* Header */}
        <div 
          className="users-modal-header border-bottom p-3 d-flex justify-content-between align-items-center" 
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: '85%' }}>
            <span style={{ fontSize: '1.25rem' }}>📄</span>
            <div className="text-truncate">
              <h6 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--text)' }}>
                {fileName || t('evidenceDocument', 'Documento de Evidência')}
              </h6>
              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                {t('pdfEvidenceViewer', 'Visualizador de Comprovativo PDF')}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="users-modal-close"
            onClick={onClose}
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
        <div className="p-3 p-md-4 flex-grow-1" style={{ minHeight: '480px', height: '62vh' }}>
          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100">
              <div className="users-spinner mb-3" />
              <span className="text-muted small fw-medium">
                {t('loadingEvidencePdf', 'A carregar o comprovativo PDF do servidor...')}
              </span>
            </div>
          ) : error ? (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                style={{ width: '56px', height: '56px', backgroundColor: '#fee2e2', color: '#dc2626' }}
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h6 className="fw-bold text-danger mb-1">{t('errorLoadingPdf', 'Erro ao carregar ficheiro')}</h6>
              <p className="text-muted small mb-0" style={{ maxWidth: '420px' }}>{error}</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={fileName || 'PDF Viewer'}
              width="100%"
              height="100%"
              className="border rounded-3"
              style={{ borderColor: 'var(--sidebar-border)', backgroundColor: '#fff' }}
            />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
              {t('noPdfAvailable', 'Nenhum ficheiro disponível para visualização.')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="users-modal-footer border-top p-3 d-flex justify-content-between align-items-center" 
          style={{ borderColor: 'var(--sidebar-border)', backgroundColor: 'var(--panel-2)' }}
        >
          <button 
            type="button" 
            className="btn btn-secondary rounded-3 px-3 py-1.5 fw-semibold small" 
            onClick={onClose}
          >
            {t('closeBtn', 'Fechar')}
          </button>
          
          {pdfUrl && !loading && !error && (
            <button
              type="button"
              className="btn btn-primary rounded-3 d-flex align-items-center gap-2 fw-semibold px-3 py-1.5 small"
              onClick={handleDownload}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t('downloadFile', 'Descarregar Ficheiro')}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
