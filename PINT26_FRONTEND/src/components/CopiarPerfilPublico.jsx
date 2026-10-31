import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CopiarPerfilPublico({ idConsultor, className = '' }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const getMicrositeUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3002';
    }
    return 'https://www.softbadge.pt';
  };

  const handleCopy = async () => {
    if (!idConsultor) return;
    const url = `${getMicrositeUrl()}/user/${idConsultor}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy public profile link:', err);
    }
  };

  return (
    <button
      type="button"
      className={className || "btn btn-sm btn-outline-info d-flex align-items-center gap-2 fw-semibold"}
      onClick={handleCopy}
      disabled={!idConsultor}
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
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          {t('copyPublicProfile', 'Copiar Perfil Público')}
        </>
      )}
    </button>
  );
}
