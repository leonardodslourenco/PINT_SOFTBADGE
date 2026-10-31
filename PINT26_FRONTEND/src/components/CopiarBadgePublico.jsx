import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CopiarBadgePublico({ idConsultor, idCandidatura, className = '' }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const getMicrositeUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3002';
    }
    return 'https://www.softbadge.pt';
  };

  const handleCopy = async () => {
    if (!idConsultor || !idCandidatura) return;
    const url = `${getMicrositeUrl()}/shares/${idConsultor}/${idCandidatura}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy public badge link:', err);
    }
  };

  return (
    <button
      type="button"
      className={className || "btn btn-sm btn-outline-info d-flex align-items-center gap-2 fw-semibold"}
      onClick={handleCopy}
      disabled={!idConsultor || !idCandidatura}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t('copied', 'Copiado!')}
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          {t('copyPublicBadge', 'Copiar Badge Público')}
        </>
      )}
    </button>
  );
}
