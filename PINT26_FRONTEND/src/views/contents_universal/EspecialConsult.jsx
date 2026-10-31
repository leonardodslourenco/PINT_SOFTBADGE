import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import CatalogoEspecialConsult from '../../components/CatalogoEspecialConsult';
import MinhasCandidaturasEspecial from '../../components/MinhasCandidaturasEspecial';

export default function EspecialConsult() {
  const { t } = useTranslation();
  const { socket } = useAppContext();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'my_apps'
  const [approvedCount, setApprovedCount] = useState(0);

  const fetchApprovedCount = useCallback(async () => {
    try {
      const res = await api.get('/metricas/candidaturas-especiais/estado-contagem?estado=2');
      if (res.data?.success) {
        setApprovedCount(res.data.data?.contagem || 0);
      }
    } catch (err) {
      console.warn('Erro ao obter contagem de aprovados especiais:', err);
    }
  }, []);

  useEffect(() => {
    fetchApprovedCount();
  }, [fetchApprovedCount]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchApprovedCount();
    };

    socket.on('candidatura_especial_submetida', handleUpdate);
    socket.on('candidatura_especial_aprovada', handleUpdate);
    socket.on('candidatura_especial_recusada', handleUpdate);
    socket.on('candidatura_aprovada', handleUpdate);
    socket.on('candidatura_rejeitada', handleUpdate);
    socket.on('notification', handleUpdate);
    socket.on('nova_notificacao', handleUpdate);

    return () => {
      socket.off('candidatura_especial_submetida', handleUpdate);
      socket.off('candidatura_especial_aprovada', handleUpdate);
      socket.off('candidatura_especial_recusada', handleUpdate);
      socket.off('candidatura_aprovada', handleUpdate);
      socket.off('candidatura_rejeitada', handleUpdate);
      socket.off('notification', handleUpdate);
      socket.off('nova_notificacao', handleUpdate);
    };
  }, [socket, fetchApprovedCount]);

  return (
    <div className="users-admin-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            🎖️ {t('especialBadgesTitle', 'Badges de Conquistas Especiais')}
          </h3>
          <p className="text-muted small mb-0">
            {t('consultSpecialBadgesSubtitle', 'Explore certificações externas e cursos que concedem pontos bónus')}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card border-0 shadow-sm p-2 mb-4 rounded-3" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
        <ul className="nav nav-pills gap-2">
          <li className="nav-item">
            <button
              className={`nav-link rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2 ${activeTab === 'catalog' ? 'active shadow-sm' : 'text-muted'}`}
              onClick={() => setActiveTab('catalog')}
              style={{
                backgroundColor: activeTab === 'catalog' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'catalog' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <span>✨ {t('tabEspeciaisCatalog', 'Catálogo de Badges Especiais')}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2 ${activeTab === 'my_apps' ? 'active shadow-sm' : 'text-muted'}`}
              onClick={() => setActiveTab('my_apps')}
              style={{
                backgroundColor: activeTab === 'my_apps' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'my_apps' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <span>📋 {t('tabMyEspeciaisApplications', 'Minhas Candidaturas')}</span>
              {approvedCount > 0 && (
                <span className="badge rounded-pill bg-danger fw-bold" style={{ fontSize: '0.72rem', padding: '0.25em 0.55em' }}>
                  {approvedCount}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'catalog' && (
          <CatalogoEspecialConsult onApplicationSubmitted={() => {
            fetchApprovedCount();
            setActiveTab('my_apps');
          }} />
        )}
        {activeTab === 'my_apps' && <MinhasCandidaturasEspecial />}
      </div>
    </div>
  );
}
