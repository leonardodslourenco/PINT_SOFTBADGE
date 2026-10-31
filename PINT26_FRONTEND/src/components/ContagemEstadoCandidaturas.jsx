import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAppContext } from '../context/AppContext';

export default function ContagemEstadoCandidaturas({ onCountsLoaded }) {
  const { t, i18n } = useTranslation();
  const { socket, activeRole } = useAppContext();
  const [statusCounts, setStatusCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);

  // Fetch status counts from backend metrics endpoint
  const fetchStatusCounts = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingCounts(true);
      const res = await api.get('/metricas/candidaturas/estado-contagem');
      if (res.data?.success) {
        const counts = res.data.data || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        setStatusCounts(counts);
        if (onCountsLoaded) {
          onCountsLoaded(counts);
        }
      }
    } catch (err) {
      console.error('Erro ao obter contagem de estados de candidatura:', err);
    } finally {
      if (!isSilent) setLoadingCounts(false);
    }
  }, [onCountsLoaded]);

  useEffect(() => {
    fetchStatusCounts(false);
  }, [fetchStatusCounts, i18n.language, activeRole]);

  // Real-time synchronization via WebSocket (silent update)
  useEffect(() => {
    if (!socket) return;
    const handleRealtimeUpdate = () => {
      fetchStatusCounts(true);
    };

    socket.on('candidatura_submetida', handleRealtimeUpdate);
    socket.on('candidatura_pre_aprovada', handleRealtimeUpdate);
    socket.on('candidatura_avancou', handleRealtimeUpdate);
    socket.on('candidatura_badge_emitido', handleRealtimeUpdate);
    socket.on('notification', handleRealtimeUpdate);

    return () => {
      socket.off('candidatura_submetida', handleRealtimeUpdate);
      socket.off('candidatura_pre_aprovada', handleRealtimeUpdate);
      socket.off('candidatura_avancou', handleRealtimeUpdate);
      socket.off('candidatura_badge_emitido', handleRealtimeUpdate);
      socket.off('notification', handleRealtimeUpdate);
    };
  }, [socket, fetchStatusCounts]);

  // Status cards configuration
  const statusCards = [
    {
      key: 1,
      label: t('statusCardOpen', 'Rascunho'),
      color: '#6b7280',
      bgColor: '#f3f4f6',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    },
    {
      key: 2,
      label: t('statusCardSubmitted', 'Enviadas ao TM'),
      color: '#2563eb',
      bgColor: '#eff6ff',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      )
    },
    {
      key: 3,
      label: t('statusCardEmValidacao', 'Em Validação SLL'),
      color: '#d97706',
      bgColor: '#fffbeb',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      key: 4,
      label: t('statusCardClosedOk', 'Aprovadas'),
      color: '#16a34a',
      bgColor: '#f0fdf4',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    },
    {
      key: 5,
      label: t('statusCardClosedNok', 'Rejeitadas'),
      color: '#dc2626',
      bgColor: '#fef2f2',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    }
  ];

  return (
    <div className="kpi-grid mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {statusCards.map((card) => (
        <div
          key={card.key}
          className="kpi-card"
          style={{
            borderLeft: `4px solid ${card.color}`,
            minHeight: 'auto',
            padding: '16px 18px',
            cursor: 'default',
            backgroundColor: 'var(--panel)',
            borderColor: 'var(--sidebar-border)'
          }}
        >
          <div className="kpi-details" style={{ gap: '4px' }}>
            <span
              className="kpi-title"
              style={{
                fontSize: '0.72rem',
                color: card.color,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {card.label}
            </span>
            <span className="kpi-value" style={{ fontSize: '1.6rem', lineHeight: 1.1, color: 'var(--text)' }}>
              {loadingCounts ? '...' : (statusCounts[card.key] || 0)}
            </span>
          </div>
          <div
            className="kpi-icon-wrapper"
            style={{
              backgroundColor: card.bgColor,
              color: card.color,
              width: '42px',
              height: '42px',
              minWidth: '42px'
            }}
          >
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
