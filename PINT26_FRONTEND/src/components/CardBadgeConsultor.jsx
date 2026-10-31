import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { ROLE } from '../constants/roles';

export default function CardBadgeConsultor({ badge, candidatura, onViewClick, onApplyClick }) {
  const { t } = useTranslation();
  const { activeRole } = useAppContext();
  const [logoFailed, setLogoFailed] = useState(false);

  const isConsultor = Number(activeRole) === ROLE.CON;
  const statusId = isConsultor ? candidatura?.id_estado_candidatura : null;
  const hasPresented = [2, 3, 4].includes(statusId);
  let badgeStatusMarkup = null;

  if (isConsultor && statusId === 4) {
    badgeStatusMarkup = (
      <span style={{ top: 16, right: 16, fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '4px 10px', borderRadius: '50px', position: 'absolute' }}>
        {t('statusConcluido', 'Concluído')}
      </span>
    );
  } else if (isConsultor && (statusId === 2 || statusId === 3)) {
    badgeStatusMarkup = (
      <span style={{ top: 16, right: 16, fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '4px 10px', borderRadius: '50px', position: 'absolute' }}>
        {t('statusEmAnalise', 'Em Análise')}
      </span>
    );
  } else if (isConsultor && statusId === 1) {
    badgeStatusMarkup = (
      <span style={{ top: 16, right: 16, fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '50px', position: 'absolute' }}>
        {t('statusDraft', 'Rascunho')}
      </span>
    );
  }

  return (
    <div
      className="card h-100 p-4 border shadow-sm rounded-4 position-relative hover-card-premium"
      style={{ transition: 'all 0.25s ease', backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
    >
      {/* Top Absolute Badges */}
      <span 
        className="badge border rounded-3 py-1 px-2"
        style={{ 
          position: 'absolute', 
          top: 16, 
          left: 16, 
          fontSize: '0.68rem', 
          backgroundColor: 'var(--panel-2)', 
          color: 'var(--text-muted)', 
          borderColor: 'var(--sidebar-border)',
          maxWidth: '120px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
        title={badge.nivel_area || 'Nível'}
      >
        {badge.nivel_area || 'Nível'}
      </span>
      {badgeStatusMarkup}

      {/* Header block with top margin to avoid badge overlap, and pe-5 to avoid right status overlap */}
      <div className="d-flex align-items-center gap-3 mb-3 mt-3">
        <div className="kpi-icon-wrapper rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary" style={{ width: 48, height: 48, minWidth: 48, overflow: 'hidden' }}>
          {badge.logo && !logoFailed ? (
            <img
              src={`${API_BASE_URL}/uploads/logo_badges/${badge.logo}`}
              alt={badge.titulo}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          )}
        </div>
        <div style={{ maxWidth: 'calc(100% - 60px)', paddingRight: '50px' }}>
          <h6 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--text)' }} title={badge.titulo}>
            {badge.titulo}
          </h6>
          <span className="text-muted small d-block font-monospace" style={{ fontSize: '0.75rem' }}>{badge.area}</span>
        </div>
      </div>

      <p className="small mb-3 flex-grow-1" style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 48, lineHeight: '1.4' }}>
        {badge.descricao}
      </p>

      <div className="d-flex justify-content-end align-items-center mt-auto border-top pt-3" style={{ borderTopColor: 'var(--sidebar-border)' }}>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm fw-bold px-3 py-1.5 rounded-3"
            style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', border: 'none', fontSize: '0.8rem' }}
            onClick={onViewClick}
          >
            {t('viewBtn', 'Ver')}
          </button>
          {isConsultor && onApplyClick && (
            <button
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-3 btn-submit-consult"
              style={{ fontSize: '0.8rem' }}
              onClick={onApplyClick}
            >
              {hasPresented ? t('viewCandidacyBtn', 'Ver Candidatura') : t('candidatarBtn', 'Candidatar-se')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
