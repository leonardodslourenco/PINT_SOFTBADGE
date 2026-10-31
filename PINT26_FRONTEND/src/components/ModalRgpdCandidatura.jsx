import { useTranslation } from 'react-i18next';
import RgpdCandidaturaText from './RgpdCandidaturaText';

export default function ModalRgpdCandidatura({ onClose }) {
  const { t } = useTranslation();

  return (
    <>
      <div 
        className="users-modal-overlay" 
        onClick={onClose} 
        style={{ 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(4px)', 
          zIndex: 1060 
        }} 
      />
      <div 
        className="users-modal rounded-4 shadow-lg border" 
        style={{ 
          maxWidth: '680px', 
          width: '92%', 
          zIndex: 1070, 
          overflow: 'hidden', 
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--sidebar-border)' 
        }}
      >
        <div 
          className="users-modal-header p-3.5 px-4 border-bottom d-flex justify-content-between align-items-center"
          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
        >
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.25rem' }}>📖</span>
            <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)', fontSize: '1.05rem' }}>
              {t('modalRgpdCandidaturaTitle', 'Política de RGPD — Partilha Pública de Candidatura')}
            </h5>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={onClose} 
            aria-label="Close" 
          />
        </div>

        <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '20px 24px', backgroundColor: 'var(--panel-2)' }}>
          <RgpdCandidaturaText showMeta={true} />
        </div>

        <div 
          className="d-flex justify-content-end p-3 px-4 border-top"
          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
        >
          <button 
            type="button" 
            className="btn btn-primary rounded-3 px-4 fw-semibold shadow-xs"
            onClick={onClose}
          >
            {t('understoodBtn', 'Compreendi')}
          </button>
        </div>
      </div>
    </>
  );
}
