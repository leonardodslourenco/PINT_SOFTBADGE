import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { ROLE } from '../constants/roles';
import ViewEspecialModal from './ViewEspecialModal';
import CandidateEspecialModal from './CandidateEspecialModal';
import SearchBar from './SearchBar';

export default function CatalogoEspecialConsult({ onApplicationSubmitted, readOnly }) {
  const { t, i18n } = useTranslation();
  const { socket, activeRole } = useAppContext();
  const isConsultant = readOnly !== undefined ? !readOnly : Number(activeRole) === ROLE.CON;

  const [conquistas, setConquistas] = useState([]);
  const [minhasCandidaturas, setMinhasCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedViewId, setSelectedViewId] = useState(null);
  const [selectedCandidateBadge, setSelectedCandidateBadge] = useState(null);

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const calls = [api.get('/conquista-especial')];
      if (isConsultant) {
        calls.push(api.get('/candidatura_especial/minhas'));
      }
      const [resConquistas, resMinhas] = await Promise.all(calls);

      if (resConquistas?.data?.success) {
        setConquistas(resConquistas.data.data || []);
      }
      if (resMinhas?.data?.success) {
        setMinhasCandidaturas(resMinhas.data.data || []);
      } else {
        setMinhasCandidaturas([]);
      }
    } catch (err) {
      console.error('Erro ao carregar catálogo de badges especiais:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [isConsultant]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData, i18n.language]);

  // Real-time updates (atualização silenciosa)
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      fetchData(true);
    };

    socket.on('candidatura_especial_submetida', handleRealtimeUpdate);
    socket.on('candidatura_especial_aprovada', handleRealtimeUpdate);
    socket.on('candidatura_especial_recusada', handleRealtimeUpdate);
    socket.on('conquista_especial_criada', handleRealtimeUpdate);
    socket.on('conquista_especial_atualizada', handleRealtimeUpdate);
    socket.on('conquista_especial_removida', handleRealtimeUpdate);
    socket.on('notification', handleRealtimeUpdate);

    return () => {
      socket.off('candidatura_especial_submetida', handleRealtimeUpdate);
      socket.off('candidatura_especial_aprovada', handleRealtimeUpdate);
      socket.off('candidatura_especial_recusada', handleRealtimeUpdate);
      socket.off('conquista_especial_criada', handleRealtimeUpdate);
      socket.off('conquista_especial_atualizada', handleRealtimeUpdate);
      socket.off('conquista_especial_removida', handleRealtimeUpdate);
      socket.off('notification', handleRealtimeUpdate);
    };
  }, [socket, fetchData]);

  const handleSuccessApplication = () => {
    fetchData();
    if (onApplicationSubmitted) onApplicationSubmitted();
  };

  // Mapear estado do consultor por badge especial
  const statusMap = useMemo(() => {
    const map = {};
    minhasCandidaturas.forEach((app) => {
      if (app.conquistado || app.id_estado === 2) {
        map[app.id_conquista_especial] = 'CONQUISTADO';
      } else if (app.id_estado === 1) {
        map[app.id_conquista_especial] = 'PENDENTE';
      }
    });
    return map;
  }, [minhasCandidaturas]);

  // Filtragem
  const filteredConquistas = useMemo(() => {
    if (!searchQuery.trim()) return conquistas;
    const q = searchQuery.toLowerCase();
    return conquistas.filter(
      (c) =>
        c.titulo?.toLowerCase().includes(q) ||
        c.descricao?.toLowerCase().includes(q) ||
        c.tipo_badge_especial?.nome?.toLowerCase().includes(q)
    );
  }, [conquistas, searchQuery]);

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            ✨ {t('tabEspeciaisCatalog', 'Catálogo de Badges Especiais')}
          </h4>
          <p className="text-muted small mb-0">
            {t('consultSpecialBadgesSubtitle', 'Explore certificações externas e cursos que concedem pontos bónus')}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card border-0 shadow-sm p-3 mb-4 rounded-3" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('searchEspeciaisPlaceholder', 'Pesquisar Badges Especiais...')}
        />
      </div>

      {/* Grid of Special Badges Cards */}
      {loading ? (
        <div className="text-center py-5">
          <div className="users-spinner mb-2" />
          <span className="text-muted small">{t('loading', 'A carregar catálogo...')}</span>
        </div>
      ) : filteredConquistas.length === 0 ? (
        <div className="card p-5 text-center text-muted rounded-4 shadow-sm border-0" style={{ backgroundColor: 'var(--panel)' }}>
          <p className="mb-0">{t('noSpecialBadgesFound', 'Nenhum Badge Especial disponível de momento.')}</p>
        </div>
      ) : (
        <div className="row g-4">
          {filteredConquistas.map((badge) => {
            const userStatus = statusMap[badge.id_conquista_especial];
            const isConquered = userStatus === 'CONQUISTADO';
            const isPending = userStatus === 'PENDENTE';

            return (
              <div key={badge.id_conquista_especial} className="col-12 col-md-6 col-lg-4">
                <div
                  className="card h-100 p-4 rounded-4 shadow-sm d-flex flex-column justify-content-between position-relative overflow-hidden"
                  style={{
                    backgroundColor: 'var(--panel)',
                    border: '1px solid var(--sidebar-border)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                >
                  {/* Top Ribbon Status (Apenas visível para Consultor) */}
                  {isConsultant && isConquered && (
                    <div className="position-absolute top-0 end-0 m-3">
                      <span className="badge bg-success px-2.5 py-1 rounded-pill fw-bold" style={{ fontSize: '0.75rem' }}>
                        ✓ {t('alreadyConqueredBadge', 'Conquistado')}
                      </span>
                    </div>
                  )}
                  {isConsultant && isPending && (
                    <div className="position-absolute top-0 end-0 m-3">
                      <span className="badge bg-warning text-dark px-2.5 py-1 rounded-pill fw-bold" style={{ fontSize: '0.75rem' }}>
                        ⏳ {t('applicationUnderReview', 'Em Análise')}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Badge Header & Logo */}
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div
                        className="rounded-4 d-flex align-items-center justify-content-center p-2 border flex-shrink-0"
                        style={{
                          width: '64px',
                          height: '64px',
                          backgroundColor: 'var(--panel-2)',
                          borderColor: 'var(--sidebar-border)'
                        }}
                      >
                        {badge.logo_conquista ? (
                          <img
                            src={`${API_BASE_URL}/uploads/logo_especial/${badge.logo_conquista}`}
                            alt={badge.titulo}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <span style={{ fontSize: '2rem' }}>🌟</span>
                        )}
                      </div>
                      <div className="d-flex flex-column">
                        <h5 className="fw-bold mb-1 text-truncate" style={{ color: 'var(--text)', fontSize: '1.05rem', maxWidth: '180px' }}>
                          {badge.titulo}
                        </h5>
                        <div>
                          <span className="badge bg-warning text-dark fw-bold px-2 py-0.5 rounded-pill" style={{ fontSize: '0.75rem' }}>
                            ⚡ +{badge.pontos_bonus} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-muted small mb-3" style={{ minHeight: '40px', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {badge.descricao}
                    </p>

                    {/* Requirement Type Badge */}
                    <div className="mb-3">
                      {badge.tipo_badge_especial ? (
                        <span className="badge bg-light-subtle text-dark border px-2.5 py-1.5 rounded-3 d-inline-flex align-items-center gap-1.5 small" style={{ borderColor: 'var(--sidebar-border)', fontSize: '0.78rem' }}>
                          <span>{badge.tipo_badge_especial.requer_link ? '🌐' : '📜'}</span>
                          <span className="text-truncate" style={{ maxWidth: '210px' }}>{badge.tipo_badge_especial.nome}</span>
                        </span>
                      ) : (
                        <span className="badge bg-light-subtle text-muted border px-2.5 py-1 rounded-pill small" style={{ borderColor: 'var(--sidebar-border)' }}>
                          Certificação
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="d-flex gap-2 pt-2 border-top" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-3 flex-fill fw-semibold py-2"
                      onClick={() => setSelectedViewId(badge.id_conquista_especial)}
                    >
                      {t('viewEspecialDetails', 'Ver Detalhes')}
                    </button>
                    {isConsultant && (
                      <button
                        type="button"
                        className={`btn btn-sm ${isConquered ? 'btn-success' : isPending ? 'btn-warning text-dark' : 'btn-primary'} rounded-3 flex-fill fw-semibold py-2 d-flex align-items-center justify-content-center gap-1`}
                        onClick={() => setSelectedCandidateBadge(badge)}
                        disabled={isConquered || isPending}
                      >
                        {isConquered ? (
                          <span>✓ {t('alreadyConqueredBadge', 'Conquistado')}</span>
                        ) : isPending ? (
                          <span>⏳ {t('applicationUnderReview', 'Em Análise')}</span>
                        ) : (
                          <span>🚀 {t('applyEspecialBtn', 'Candidatar-se')}</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      {selectedViewId && (
        <ViewEspecialModal
          conquistaId={selectedViewId}
          onClose={() => setSelectedViewId(null)}
        />
      )}

      {/* Candidate Modal (apenas para Consultor) */}
      {isConsultant && selectedCandidateBadge && (
        <CandidateEspecialModal
          badge={selectedCandidateBadge}
          onClose={() => setSelectedCandidateBadge(null)}
          onSuccess={handleSuccessApplication}
        />
      )}
    </div>
  );
}
