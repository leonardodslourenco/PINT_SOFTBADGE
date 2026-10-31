import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ClearFiltersBtn (Botão Limpar Filtros)
 * =====================================
 * Componente reutilizável com suporte a i18n para reiniciar
 * todos os dropdowns/filtros de uma listagem para os valores padrão.
 *
 * @param {Function} onClear - Callback disparado ao clicar
 * @param {Function} onClick - Alias para onClear
 * @param {boolean} disabled - Desativa o botão se nenhum filtro estiver ativo
 * @param {string} label - Texto customizado (opcional, padrão: t('clearFilters'))
 * @param {string} className - Classes CSS adicionais
 * @param {object} style - Estilos inline adicionais
 */
export default function ClearFiltersBtn({
  onClear,
  onClick,
  disabled = false,
  label,
  className = '',
  style = {}
}) {
  const { t } = useTranslation();
  const handleClick = onClear || onClick;

  return (
    <button
      type="button"
      className={`btn btn-sm d-inline-flex align-items-center justify-content-center gap-2 fw-semibold rounded-3 ${className}`}
      onClick={handleClick}
      disabled={disabled}
      title={t('clearFilters', 'Limpar Filtros')}
      style={{
        backgroundColor: 'var(--panel-2, #f8fafc)',
        color: 'var(--text-muted, #64748b)',
        borderColor: 'var(--sidebar-border, #cbd5e1)',
        borderWidth: '1px',
        borderStyle: 'solid',
        padding: '6px 14px',
        fontSize: '0.84rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'var(--sidebar-border, #e2e8f0)';
          e.currentTarget.style.color = 'var(--text, #0f172a)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'var(--panel-2, #f8fafc)';
          e.currentTarget.style.color = 'var(--text-muted, #64748b)';
        }
      }}
    >
      <svg 
        viewBox="0 0 24 24" 
        width="14" 
        height="14" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2.5" />
      </svg>
      <span>{label || t('clearFilters', 'Limpar Filtros')}</span>
    </button>
  );
}
