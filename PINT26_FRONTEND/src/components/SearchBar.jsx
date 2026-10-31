import { useTranslation } from 'react-i18next';

export default function SearchBar({ value, onChange, placeholder, style }) {
  const { t } = useTranslation();

  return (
    <div className="users-search-wrapper" style={style}>
      <svg className="users-search-icon" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        className="users-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button 
          type="button" 
          className="users-search-clear"
          onClick={() => onChange('')}
          title={t('clearSearch', 'Limpar pesquisa')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      )}
    </div>
  );
}
