import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import MarcoCelebrationModal from '../../components/MarcoCelebrationModal';
import SearchBar from '../../components/SearchBar';

const TIPO_ICONS = {
  INICIO_CANDIDATURA: '🚀',
  CONQUISTA_BADGE: '🏆',
  AREAS_DISTINTAS: '🌐',
  SL_DISTINTAS: '🏢',
  MENSAL: '📅',
  BIMESTRAL: '🗓️',
  TRIMESTRAL: '🥉',
  QUADRIMESTRAL: '🥈',
  SEMESTRAL: '🥇'
};

const TIPO_LABELS = {
  INICIO_CANDIDATURA: 'marcoTipoInicioCandidatura',
  CONQUISTA_BADGE: 'marcoTipoConquistaBadge',
  AREAS_DISTINTAS: 'marcoTipoAreasDistintas',
  SL_DISTINTAS: 'marcoTipoSlDistintas',
  MENSAL: 'marcoTipoMensal',
  BIMESTRAL: 'marcoTipoBimestral',
  TRIMESTRAL: 'marcoTipoTrimestral',
  QUADRIMESTRAL: 'marcoTipoQuadrimestral',
  SEMESTRAL: 'marcoTipoSemestral'
};

export default function MarcoConsult() {
  const { t, i18n } = useTranslation();
  const { socket } = useAppContext();
  const [activeTab, setActiveTab] = useState('my_marcos'); // 'my_marcos' | 'available_marcos'
  
  // Data states
  const [meusMarcos, setMeusMarcos] = useState([]);
  const [availableMarcos, setAvailableMarcos] = useState([]);
  const [loadingMyMarcos, setLoadingMyMarcos] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  
  // Search queries
  const [searchMyMarcos, setSearchMyMarcos] = useState('');
  const [searchAvailable, setSearchAvailable] = useState('');
  
  // Modal celebration state
  const [celebratingMarco, setCelebratingMarco] = useState(null);

  // 1. Fetch consultant's achieved marcos
  const fetchMeusMarcos = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingMyMarcos(true);
      const res = await api.get(`/utilizador-marco/meus-marcos?lang=${i18n.language}`);
      if (res.data?.success) {
        setMeusMarcos(res.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar marcos do consultor:', err);
    } finally {
      if (!isSilent) setLoadingMyMarcos(false);
    }
  }, [i18n.language]);

  // 2. Fetch all available active marcos
  const fetchAvailableMarcos = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingAvailable(true);
      const res = await api.get(`/utilizador-marco/configuracoes?lang=${i18n.language}`);
      if (res.data?.success) {
        setAvailableMarcos(res.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar catálogo de marcos:', err);
    } finally {
      if (!isSilent) setLoadingAvailable(false);
    }
  }, [i18n.language]);

  useEffect(() => {
    fetchMeusMarcos(false);
    fetchAvailableMarcos(false);
  }, [fetchMeusMarcos, fetchAvailableMarcos]);

  // Real-time listener for newly earned or updated milestones (atualização silenciosa)
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      fetchMeusMarcos(true);
      fetchAvailableMarcos(true);
    };

    socket.on('novo_marco', handleRealtimeUpdate);
    socket.on('marco_updated', handleRealtimeUpdate);
    socket.on('marco_criado', handleRealtimeUpdate);
    socket.on('marco_removido', handleRealtimeUpdate);
    socket.on('notification', handleRealtimeUpdate);
    socket.on('nova_notificacao', handleRealtimeUpdate);

    return () => {
      socket.off('novo_marco', handleRealtimeUpdate);
      socket.off('marco_updated', handleRealtimeUpdate);
      socket.off('marco_criado', handleRealtimeUpdate);
      socket.off('marco_removido', handleRealtimeUpdate);
      socket.off('notification', handleRealtimeUpdate);
      socket.off('nova_notificacao', handleRealtimeUpdate);
    };
  }, [socket, fetchMeusMarcos, fetchAvailableMarcos]);

  // Filtered lists
  const filteredMyMarcos = useMemo(() => {
    return meusMarcos.filter((m) => {
      const q = searchMyMarcos.toLowerCase();
      return (
        (m.nome || '').toLowerCase().includes(q) ||
        (m.descricao || '').toLowerCase().includes(q) ||
        (m.tipo_nome || '').toLowerCase().includes(q)
      );
    });
  }, [meusMarcos, searchMyMarcos]);

  const filteredAvailableMarcos = useMemo(() => {
    return availableMarcos.filter((m) => {
      const q = searchAvailable.toLowerCase();
      return (
        (m.nome || '').toLowerCase().includes(q) ||
        (m.descricao || '').toLowerCase().includes(q) ||
        (m.tipo_nome || '').toLowerCase().includes(q) ||
        (m.tipo_descricao || '').toLowerCase().includes(q)
      );
    });
  }, [availableMarcos, searchAvailable]);

  const handleCelebrated = (idMarco) => {
    setMeusMarcos((prev) =>
      prev.map((m) => (m.id_marco === idMarco ? { ...m, celebrado: true } : m))
    );
  };

  const getTipoNome = useCallback((marco) => {
    if (!marco) return '';
    if (marco.tipo_nome && marco.tipo_nome !== marco.codigo_tipo) {
      return typeof marco.tipo_nome === 'object'
        ? (marco.tipo_nome[i18n.language] || marco.tipo_nome.pt || '')
        : marco.tipo_nome;
    }
    if (marco.codigo_tipo && TIPO_LABELS[marco.codigo_tipo]) {
      return t(TIPO_LABELS[marco.codigo_tipo]);
    }
    return '';
  }, [i18n.language, t]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(i18n.language === 'en' ? 'en-US' : i18n.language === 'es' ? 'es-ES' : 'pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="users-admin-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            🏆 {t('marcosConsultTitle', 'Marcos e Conquistas')}
          </h3>
          <p className="text-muted small mb-0">
            {activeTab === 'my_marcos'
              ? t('marcosConsultSubtitle', 'Celebre as suas metas e conquistas obtidas na plataforma')
              : t('availableMarcosSubtitle', 'Consulte todos os marcos ativos e objetivos para desbloquear celebrações')}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card border-0 shadow-sm p-2 mb-4 rounded-3" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
        <ul className="nav nav-pills gap-2">
          <li className="nav-item">
            <button
              className={`nav-link rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2 ${activeTab === 'my_marcos' ? 'active shadow-sm' : 'text-muted'}`}
              onClick={() => setActiveTab('my_marcos')}
              style={{
                backgroundColor: activeTab === 'my_marcos' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'my_marcos' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <span>🏆 {t('tabMyMarcos', 'Marcos Alcançados')}</span>
              {meusMarcos.length > 0 && (
                <span className="badge rounded-pill bg-primary-subtle text-primary fw-bold" style={{ fontSize: '0.72rem', padding: '0.25em 0.55em' }}>
                  {meusMarcos.length}
                </span>
              )}
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2 ${activeTab === 'available_marcos' ? 'active shadow-sm' : 'text-muted'}`}
              onClick={() => setActiveTab('available_marcos')}
              style={{
                backgroundColor: activeTab === 'available_marcos' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'available_marcos' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <span>✨ {t('tabAvailableMarcos', 'Marcos Disponíveis')}</span>
              {availableMarcos.length > 0 && (
                <span className="badge rounded-pill bg-light border text-dark fw-bold" style={{ fontSize: '0.72rem', padding: '0.25em 0.55em' }}>
                  {availableMarcos.length}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* TAB 1: MEUS MARCOS ALCANÇADOS */}
      {activeTab === 'my_marcos' && (
        <div>
          {/* Search bar */}
          <div className="d-flex justify-content-end mb-3">
            <div style={{ maxWidth: '320px', width: '100%' }}>
              <SearchBar
                value={searchMyMarcos}
                onChange={setSearchMyMarcos}
                placeholder={t('searchMarcosPlaceholder', 'Pesquisar marcos...')}
              />
            </div>
          </div>

          {/* Grid of achieved marcos */}
          {loadingMyMarcos ? (
            <div className="users-loading py-5">
              <div className="users-spinner" />
              <span>{t('loading', 'A carregar conquistas...')}</span>
            </div>
          ) : filteredMyMarcos.length === 0 ? (
            <div className="card card-body text-center p-5 border-0 shadow-sm rounded-4" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
              <div className="text-muted mb-3" style={{ fontSize: '3.5rem' }}>
                🎯
              </div>
              <h5 className="fw-bold mb-2" style={{ color: 'var(--text)' }}>
                {t('noMarcosAchieved', 'Ainda não alcançou nenhum marco.')}
              </h5>
              <p className="text-muted mb-0 small" style={{ maxWidth: '480px', margin: '0 auto' }}>
                Continue a submeter e a concluir candidaturas a Badges para desbloquear celebrações e marcos exclusivos na plataforma!
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {filteredMyMarcos.map((marco) => {
                const icon = TIPO_ICONS[marco.codigo_tipo] || '🎖️';
                return (
                  <div key={marco.id_marco} className="col-12 col-md-6 col-lg-4">
                    <div
                      className="card h-100 border-0 shadow-sm rounded-4 position-relative d-flex flex-column justify-content-between p-4 transition-all"
                      style={{
                        backgroundColor: 'var(--panel)',
                        border: '1px solid var(--sidebar-border)',
                        boxShadow: marco.celebrado ? '0 4px 12px rgba(0,0,0,0.04)' : '0 6px 18px rgba(255,193,7,0.18)',
                        transform: 'translateY(0)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                    >
                      {/* Top Header Card */}
                      <div>
                        <div className="d-flex align-items-start justify-content-between mb-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            style={{
                              width: '56px',
                              height: '56px',
                              backgroundColor: 'var(--panel-2)',
                              border: '2px solid rgba(255, 215, 0, 0.4)',
                              fontSize: '1.8rem'
                            }}
                          >
                            {icon}
                          </div>
                          <span
                            className={`badge rounded-pill px-3 py-1.5 fw-semibold ${
                              marco.celebrado
                                ? 'bg-success bg-opacity-10 text-success'
                                : 'bg-warning text-dark shadow-sm'
                            }`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {marco.celebrado ? `✓ ${t('celebratedBadge', 'Celebrado')}` : `✨ ${t('pendingCelebrationBadge', 'Novo Marco!')}`}
                          </span>
                        </div>

                        <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
                          {marco.nome}
                        </h5>

                        {getTipoNome(marco) && (
                          <span className="badge bg-primary bg-opacity-10 text-primary mb-2" style={{ fontSize: '0.72rem' }}>
                            {getTipoNome(marco)} • {t('objectiveLabel', 'Objetivo')}: {marco.quantidade_objetivo}
                          </span>
                        )}

                        <p className="text-muted small mb-3" style={{ lineHeight: '1.5', minHeight: '40px' }}>
                          {marco.descricao}
                        </p>
                      </div>

                      {/* Bottom Footer Card */}
                      <div className="border-top pt-3 mt-2 d-flex align-items-center justify-content-between" style={{ borderColor: 'var(--sidebar-border)' }}>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          <span>{t('achievedAtLabel', 'Conquistado em')}:</span>
                          <strong className="d-block" style={{ color: 'var(--text)' }}>{formatDate(marco.data_conquista_marco)}</strong>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-primary rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm"
                          style={{
                            backgroundColor: '#0d6efd',
                            borderColor: '#0d6efd',
                            fontSize: '0.82rem'
                          }}
                          onClick={() => setCelebratingMarco(marco)}
                        >
                          {t('celebrateBtn', 'Celebrar 🎉')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TODOS OS MARCOS DISPONÍVEIS (INFORMATIVO / APENAS LEITURA) */}
      {activeTab === 'available_marcos' && (
        <div>
          {/* Search bar */}
          <div className="d-flex justify-content-end mb-3">
            <div style={{ maxWidth: '320px', width: '100%' }}>
              <SearchBar
                value={searchAvailable}
                onChange={setSearchAvailable}
                placeholder={t('searchAvailableMarcosPlaceholder', 'Pesquisar marcos disponíveis...')}
              />
            </div>
          </div>

          {/* Grid of available marcos */}
          {loadingAvailable ? (
            <div className="users-loading py-5">
              <div className="users-spinner" />
              <span>{t('loading', 'A carregar catálogo de marcos...')}</span>
            </div>
          ) : filteredAvailableMarcos.length === 0 ? (
            <div className="card card-body text-center p-5 border-0 shadow-sm rounded-4" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
              <div className="text-muted mb-3" style={{ fontSize: '3.5rem' }}>
                ✨
              </div>
              <h5 className="fw-bold mb-2" style={{ color: 'var(--text)' }}>
                {t('noAvailableMarcosFound', 'Nenhum marco disponível encontrado.')}
              </h5>
            </div>
          ) : (
            <div className="row g-4">
              {filteredAvailableMarcos.map((marco) => {
                const icon = TIPO_ICONS[marco.codigo_tipo] || '🎖️';
                return (
                  <div key={marco.id_marco} className="col-12 col-md-6 col-lg-4">
                    <div
                      className="card h-100 border-0 shadow-sm rounded-4 position-relative d-flex flex-column justify-content-between p-4 transition-all"
                      style={{
                        backgroundColor: 'var(--panel)',
                        border: '1px solid var(--sidebar-border)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Top Header Card */}
                      <div>
                        <div className="d-flex align-items-start justify-content-between mb-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            style={{
                              width: '56px',
                              height: '56px',
                              backgroundColor: 'var(--panel-2)',
                              border: '2px solid rgba(2, 132, 199, 0.3)',
                              fontSize: '1.8rem'
                            }}
                          >
                            {icon}
                          </div>
                          
                          {marco.conquistado ? (
                            <span className="badge bg-success bg-opacity-10 text-success fw-semibold px-3 py-1.5 rounded-pill" style={{ fontSize: '0.75rem' }}>
                              ✓ {t('conqueredBadge', 'Conquistado')}
                            </span>
                          ) : (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary fw-semibold px-3 py-1.5 rounded-pill" style={{ fontSize: '0.75rem' }}>
                              🎯 {t('objectiveLabel', 'Objetivo')}: {marco.quantidade_objetivo}
                            </span>
                          )}
                        </div>

                        <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
                          {marco.nome}
                        </h5>

                        {getTipoNome(marco) && (
                          <div className="mb-2">
                            <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: '0.72rem' }}>
                              {getTipoNome(marco)}
                            </span>
                          </div>
                        )}

                        <p className="text-muted small mb-3" style={{ lineHeight: '1.5', minHeight: '40px' }}>
                          {marco.descricao}
                        </p>
                      </div>

                      {/* Bottom Footer Card (Read-only informative) */}
                      <div className="border-top pt-3 mt-2 d-flex align-items-center justify-content-between" style={{ borderColor: 'var(--sidebar-border)' }}>
                        <div className="text-muted small d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
                          <span className="fw-semibold" style={{ color: 'var(--text)' }}>
                            {t('objectiveLabel', 'Objetivo')}:
                          </span>
                          <span className="badge bg-light border text-dark fw-bold px-2 py-1 rounded">
                            {marco.quantidade_objetivo} {marco.quantidade_objetivo === 1 ? 'conquista' : 'conquistas'}
                          </span>
                        </div>

                        {marco.tipo_descricao && (
                          <span className="text-muted small fst-italic text-truncate" style={{ maxWidth: '140px', fontSize: '0.72rem' }} title={marco.tipo_descricao}>
                            {marco.tipo_descricao}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Celebração Disparado Manualmente */}
      {celebratingMarco && (
        <MarcoCelebrationModal
          marco={celebratingMarco}
          onClose={() => setCelebratingMarco(null)}
          onCelebrated={handleCelebrated}
        />
      )}
    </div>
  );
}
