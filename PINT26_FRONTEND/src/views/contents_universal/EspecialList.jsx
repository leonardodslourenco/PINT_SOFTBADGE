import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import CatalogoEspecialConsult from '../../components/CatalogoEspecialConsult';
import GestorCandidaturaEspecial from '../../components/GestorCandidaturaEspecial';

export default function EspecialList() {
  const { t } = useTranslation();
  const { socket } = useAppContext();
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'applications'
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await api.get('/metricas/candidaturas-especiais/estado-contagem?estado=1');
      if (res.data?.success) {
        setPendingCount(res.data.data?.contagem || 0);
      }
    } catch (err) {
      console.warn('Erro ao obter contagem de pendentes especiais:', err);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchPendingCount();
    };

    socket.on('candidatura_especial_submetida', handleUpdate);
    socket.on('nova_candidatura_especial', handleUpdate);
    socket.on('candidatura_especial_aprovada', handleUpdate);
    socket.on('candidatura_especial_recusada', handleUpdate);

    return () => {
      socket.off('candidatura_especial_submetida', handleUpdate);
      socket.off('nova_candidatura_especial', handleUpdate);
      socket.off('candidatura_especial_aprovada', handleUpdate);
      socket.off('candidatura_especial_recusada', handleUpdate);
    };
  }, [socket, fetchPendingCount]);

  return (
    <div className="users-admin-container">
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            🎖️ {t('especialBadgesTitle', 'Badges de Conquistas Especiais')}
          </h3>
          <p className="text-muted small mb-0">
            {t('especialBadgesSubtitleList', 'Consulta de badges de conquistas especiais e candidaturas submetidas')}
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
              <span>✨ {t('tabEspeciaisCatalog', 'Badges Especiais')}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2 ${activeTab === 'applications' ? 'active shadow-sm' : 'text-muted'}`}
              onClick={() => setActiveTab('applications')}
              style={{
                backgroundColor: activeTab === 'applications' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'applications' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <span>📋 {t('tabEspeciaisApplications', 'Candidaturas Especiais')}</span>
              {pendingCount > 0 && (
                <span className="badge rounded-pill bg-danger fw-bold" style={{ fontSize: '0.72rem', padding: '0.25em 0.55em' }}>
                  {pendingCount}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'catalog' && <CatalogoEspecialConsult readOnly={true} />}
        {activeTab === 'applications' && <GestorCandidaturaEspecial canManage={false} />}
      </div>
    </div>
  );
}
