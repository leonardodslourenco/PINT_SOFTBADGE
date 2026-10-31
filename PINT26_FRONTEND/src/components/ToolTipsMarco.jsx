import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const TIPO_ICONS = {
  INICIO_CANDIDATURA: '🚀',
  CONQUISTA_BADGE: '🏆',
  AREAS_DISTINTAS: '🌐',
  SL_DISTINTAS: '🏢',
  MENSAL: '📅',
  BIMESTRAL: '🗓️',
  TRIMESTRAL: '🥉',
  QUADRIMESTRAL: '🥈',
  SEMESTRAL: '🥇',
  PRIMEIRA_CANDIDATURA: '🚀',
  CONQUISTA_PRIMEIRO_BADGE: '🎖️',
  CINCO_BADGES_CONQUISTADOS: '⭐',
  DEZ_BADGES_CONQUISTADOS: '🌟',
  PRIMEIRA_CANDIDATURA_APROVADA_SLL: '🏆',
  EXPIRACAO_BADGE_EVITADA: '🛡️',
  EXPLORADOR_AREAS: '🧭',
  MESTRE_SERVICE_LINE: '👑',
  PARTILHA_SOCIAL_BADGE: '📢'
};

/**
 * ToolTipsMarco
 * Componente reaproveitável para apresentar informações e descrições dos Tipos de Marco.
 * Suporta interação por clique e hover, com posicionamento flutuante e fecho ao clicar fora.
 */
export default function ToolTipsMarco({
  tipo,
  title,
  description,
  icon,
  placement = 'top',
  className = '',
  style = {}
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const displayTitle = title || tipo?.titulo || tipo?.tipo_nome || t('marcoTypeInfoTitle', 'Informação do Tipo de Marco');
  const displayDescription = description || tipo?.descricao || t('noDescriptionAvailable', 'Sem descrição detalhada disponível.');
  const displayIcon = icon || TIPO_ICONS[tipo?.codigo_tipo] || 'ℹ️';

  // Fechar ao clicar fora do componente
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Estilos de posicionamento dinâmicos do popover
  const getPlacementStyles = () => {
    switch (placement) {
      case 'bottom':
        return {
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      case 'right':
        return {
          top: '50%',
          left: 'calc(100% + 8px)',
          transform: 'translateY(-50%)'
        };
      case 'left':
        return {
          top: '50%',
          right: 'calc(100% + 8px)',
          transform: 'translateY(-50%)'
        };
      case 'top':
      default:
        return {
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)'
        };
    }
  };

  return (
    <div
      ref={containerRef}
      className={`tooltips-marco-container d-inline-flex align-items-center position-relative ${className}`}
      style={{ verticalAlign: 'middle', ...style }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Botão de Disparo / Ícone */}
      <button
        type="button"
        className="tooltips-marco-btn btn p-0 border-0 d-inline-flex align-items-center justify-content-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={displayTitle}
        title={displayTitle}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: isOpen ? 'var(--primary, #0d9488)' : 'rgba(13, 148, 136, 0.12)',
          color: isOpen ? '#ffffff' : 'var(--primary, #0d9488)',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          lineHeight: 1
        }}
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>

      {/* Popover / Tooltip Card */}
      {isOpen && (
        <div
          className="tooltips-marco-popover shadow-lg rounded-3 border p-3"
          style={{
            position: 'absolute',
            zIndex: 9999,
            width: '280px',
            maxWidth: '90vw',
            backgroundColor: 'var(--panel, #ffffff)',
            borderColor: 'var(--sidebar-border, #e2e8f0)',
            color: 'var(--text, #1e293b)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'auto',
            animation: 'tooltipsFadeIn 0.18s ease-out forwards',
            ...getPlacementStyles()
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom" style={{ borderColor: 'var(--sidebar-border, #f1f5f9)' }}>
            <div className="d-flex align-items-center gap-2 text-truncate">
              <span style={{ fontSize: '1.1rem' }}>{displayIcon}</span>
              <strong className="text-truncate fw-bold small" style={{ color: 'var(--text, #0f172a)' }}>
                {displayTitle}
              </strong>
            </div>
            <button
              type="button"
              className="btn btn-sm p-0 border-0 text-muted ms-2"
              onClick={() => setIsOpen(false)}
              style={{ lineHeight: 1, cursor: 'pointer' }}
            >
              &times;
            </button>
          </div>

          {/* Description Body */}
          <p className="mb-0 small text-muted" style={{ fontSize: '0.82rem', lineHeight: 1.45, whiteSpace: 'normal' }}>
            {displayDescription}
          </p>
        </div>
      )}
    </div>
  );
}
