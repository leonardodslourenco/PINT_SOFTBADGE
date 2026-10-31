import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import SearchBar from '../../components/SearchBar';
import CreateObjetivoModal from '../../components/CreateObjetivoModal';
import ObjetivoCelebrationModal from '../../components/ObjetivoCelebrationModal';
import Swal from 'sweetalert2';

const TIPO_ICONS = {
  BADGES_NORMAL_TEMPO: '🎯',
  BADGES_NORMAL_DIVERSIDADE: '🌐',
  PONTOS_NORMAL_TEMPO: '⚡',
  BADGES_ESPECIAL_TEMPO: '🏆',
  PONTOS_ESPECIAL_TEMPO: '🌟'
};

export default function ObjetivosConsult() {
  const { t, i18n } = useTranslation();
  const { socket, triggerCountsUpdate } = useAppContext();
  const currentLang = (i18n.language || 'pt').slice(0, 2);

  // States
  const [objetivos, setObjetivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'ativos' | 'cumpridos' | 'expirados' | 'cancelados'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [celebratingObjetivo, setCelebratingObjetivo] = useState(null);

  // Fetch all consultant objectives (supports silent update without screen flicker)
  const fetchObjetivos = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      // Sempre buscamos todos para termos os contadores de KPI precisos
      const res = await api.get('/objetivo-consultor/meus?status=todos');
      if (res.data?.success) {
        setObjetivos(res.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar objetivos:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchObjetivos(false);
  }, [fetchObjetivos]);

  // WebSocket real-time updates (silent refresh in background)
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = (data) => {
      console.log('Evento de objetivo/candidatura recebido via WebSocket:', data);
      setTimeout(() => {
        fetchObjetivos(true);
        if (triggerCountsUpdate) triggerCountsUpdate();
      }, 350);
    };

    const handleObjetivoCumprido = (data) => {
      console.log('Novo objetivo cumprido recebido via WebSocket:', data);
      setCelebratingObjetivo(data);
      setTimeout(() => {
        fetchObjetivos(true);
        if (triggerCountsUpdate) triggerCountsUpdate();
      }, 350);
    };

    socket.on('novo_objetivo_cumprido', handleObjetivoCumprido);
    socket.on('candidatura_badge_emitido', handleRealtimeUpdate);
    socket.on('candidatura_avancou', handleRealtimeUpdate);
    socket.on('conquista_atribuida', handleRealtimeUpdate);

    return () => {
      socket.off('novo_objetivo_cumprido', handleObjetivoCumprido);
      socket.off('candidatura_badge_emitido', handleRealtimeUpdate);
      socket.off('candidatura_avancou', handleRealtimeUpdate);
      socket.off('conquista_atribuida', handleRealtimeUpdate);
    };
  }, [socket, fetchObjetivos, triggerCountsUpdate]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    const ativos = objetivos.filter(o => o.objetivoAtivo && !o.objetivo_cumprido && !o.objetivo_expirado);
    const cumpridos = objetivos.filter(o => o.objetivo_cumprido);
    const expirados = objetivos.filter(o => o.objetivo_expirado && !o.objetivo_cumprido && o.objetivoAtivo);
    const cancelados = objetivos.filter(o => !o.objetivoAtivo);

    const totalFinalizados = cumpridos.length + expirados.length;
    const taxaSucesso = totalFinalizados > 0 ? Math.round((cumpridos.length / totalFinalizados) * 100) : 0;

    return {
      ativosCount: ativos.length,
      cumpridosCount: cumpridos.length,
      expiradosCount: expirados.length,
      canceladosCount: cancelados.length,
      taxaSucesso: `${taxaSucesso}%`,
      ativosList: ativos
    };
  }, [objetivos]);

  // Filtragem por Estado e por Termo de Pesquisa
  const filteredObjetivos = useMemo(() => {
    return objetivos.filter(item => {
      // 1. Filtro por status
      if (statusFilter === 'ativos') {
        if (!item.objetivoAtivo || item.objetivo_cumprido || item.objetivo_expirado) return false;
      } else if (statusFilter === 'cumpridos') {
        if (!item.objetivo_cumprido) return false;
      } else if (statusFilter === 'expirados') {
        if (!item.objetivo_expirado || item.objetivo_cumprido || !item.objetivoAtivo) return false;
      } else if (statusFilter === 'cancelados') {
        if (item.objetivoAtivo) return false;
      }

      // 2. Filtro por termo de pesquisa
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const tObj = item.tipo_objetivo?.traducao_titulo;
        const titulo = typeof tObj === 'object' ? (tObj[currentLang] || tObj.pt || '') : (item.tipo_objetivo?.codigo_tipo || '');
        const descricaoMeta = item.progresso?.descricao_meta || '';
        
        return titulo.toLowerCase().includes(query) || descricaoMeta.toLowerCase().includes(query);
      }

      return true;
    });
  }, [objetivos, statusFilter, searchTerm, currentLang]);

  // Ação de Cancelar Objetivo (soft-delete)
  const handleCancelObjetivo = async (item) => {
    const result = await Swal.fire({
      title: t('confirmCancelGoalTitle', 'Cancelar Objetivo?'),
      text: t('confirmCancelGoalText', 'Tem a certeza de que deseja cancelar este objetivo pessoal? Esta ação não pode ser desfeita.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('yesCancelGoalBtn', 'Sim, Cancelar'),
      cancelButtonText: t('cancelBtn', 'Voltar')
    });

    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/objetivo-consultor/${item.id_objetivo}`);
        if (res.data?.success) {
          Swal.fire({
            icon: 'success',
            title: t('successTitle', 'Sucesso!'),
            text: t('goalCancelledSuccess', 'Objetivo cancelado com sucesso.'),
            timer: 2000,
            showConfirmButton: false
          });
          // Atualização silenciosa em background para não piscar a tela
          fetchObjetivos(true);
        }
      } catch (err) {
        console.error('Erro ao cancelar objetivo:', err);
        Swal.fire({
          icon: 'error',
          title: t('error', 'Erro'),
          text: err.response?.data?.message || t('errorCancellingGoal', 'Erro ao cancelar o objetivo pessoal.')
        });
      }
    }
  };

  return (
    <div className="users-admin-container">
      {/* ─── Header ─── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            🎯 {t('menuGoals', 'Objetivos')}
          </h3>
          <p className="text-muted small mb-0">
            {t('goalsSubtitle', 'Defina e acompanhe as suas metas pessoais para conquista de badges e pontos.')}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary rounded-3 px-4 py-2 fw-bold d-flex align-items-center gap-2 shadow-sm"
          onClick={() => setShowCreateModal(true)}
          disabled={metrics.ativosCount >= 5}
          title={metrics.ativosCount >= 5 ? t('maxActiveGoalsReached', 'Atingiu o limite de 5 objetivos ativos.') : ''}
        >
          <span>➕</span>
          <span>{t('newGoalBtn', 'Novo Objetivo')}</span>
        </button>
      </div>

      {/* ─── Cards de Métricas Rápidas (KPIs) ─── */}
      <div className="row g-3 mb-4">
        {/* Card 1: Ativos */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card h-100 shadow-sm border rounded-4 p-3 d-flex flex-row align-items-center gap-3"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
          >
            <div 
              className="rounded-circle p-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', width: '56px', height: '56px' }}
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div>
              <span className="text-muted small fw-semibold d-block">{t('activeGoalsCount', 'Objetivos Ativos')}</span>
              <h3 className="fw-bold mb-0 mt-0.5" style={{ color: 'var(--text)' }}>
                {metrics.ativosCount} <span className="text-muted fs-6 fw-normal">/ 5</span>
              </h3>
            </div>
          </div>
        </div>

        {/* Card 2: Cumpridos */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card h-100 shadow-sm border rounded-4 p-3 d-flex flex-row align-items-center gap-3"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
          >
            <div 
              className="rounded-circle p-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', width: '56px', height: '56px' }}
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <span className="text-muted small fw-semibold d-block">{t('achievedGoalsCount', 'Objetivos Cumpridos')}</span>
              <h3 className="fw-bold mb-0 mt-0.5 text-success">
                {metrics.cumpridosCount}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 3: Expirados */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card h-100 shadow-sm border rounded-4 p-3 d-flex flex-row align-items-center gap-3"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
          >
            <div 
              className="rounded-circle p-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', width: '56px', height: '56px' }}
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <span className="text-muted small fw-semibold d-block">{t('expiredGoalsCount', 'Objetivos Expirados')}</span>
              <h3 className="fw-bold mb-0 mt-0.5 text-danger">
                {metrics.expiradosCount}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 4: Taxa de Sucesso */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card h-100 shadow-sm border rounded-4 p-3 d-flex flex-row align-items-center gap-3"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
          >
            <div 
              className="rounded-circle p-3 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', width: '56px', height: '56px' }}
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div>
              <span className="text-muted small fw-semibold d-block">{t('successRate', 'Taxa de Cumprimento')}</span>
              <h3 className="fw-bold mb-0 mt-0.5" style={{ color: '#8b5cf6' }}>
                {metrics.taxaSucesso}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Barra de Filtros e Pesquisa ─── */}
      <div 
        className="card shadow-sm border rounded-4 p-3 mb-4"
        style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
      >
        <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3">
          {/* Tabs por Status */}
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            {[
              { key: 'todos', label: t('allGoals', 'Todos') },
              { key: 'ativos', label: `${t('activeGoals', 'Ativos')} (${metrics.ativosCount})` },
              { key: 'cumpridos', label: `${t('achievedGoals', 'Cumpridos')} (${metrics.cumpridosCount})` },
              { key: 'expirados', label: `${t('expiredGoals', 'Expirados')} (${metrics.expiradosCount})` },
              { key: 'cancelados', label: `${t('cancelledGoals', 'Cancelados')} (${metrics.canceladosCount})` },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`btn btn-sm rounded-3 px-3 py-1.5 fw-semibold transition-all ${
                  statusFilter === tab.key
                    ? 'btn-primary shadow-sm'
                    : 'btn-outline-secondary'
                }`}
                style={{
                  borderColor: statusFilter === tab.key ? 'transparent' : 'var(--sidebar-border)',
                  color: statusFilter === tab.key ? '#ffffff' : 'var(--text)'
                }}
                onClick={() => setStatusFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SearchBar Component */}
          <div style={{ minWidth: '260px' }}>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={t('searchGoalsPlaceholder', 'Pesquisar objetivos...')}
            />
          </div>
        </div>
      </div>

      {/* ─── Grelha de Cards de Objetivos ─── */}
      {loading ? (
        <div className="card shadow-sm border rounded-4 p-5 text-center" style={{ backgroundColor: 'var(--panel)' }}>
          <div className="users-spinner small mx-auto mb-2" />
          <p className="text-muted small mb-0">{t('loadingGoals', 'A carregar os seus objetivos...')}</p>
        </div>
      ) : filteredObjetivos.length === 0 ? (
        <div className="card shadow-sm border rounded-4 p-5 text-center" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
          <div className="mb-3" style={{ fontSize: '3rem' }}>🎯</div>
          <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            {t('noGoalsFound', 'Nenhum objetivo encontrado')}
          </h5>
          <p className="text-muted small mb-3" style={{ maxWidth: '440px', margin: '0 auto' }}>
            {searchTerm || statusFilter !== 'todos'
              ? t('noGoalsFiltered', 'Não existem objetivos correspondentes aos filtros selecionados.')
              : t('noGoalsDescription', 'Ainda não definiu objetivos pessoais. Crie uma meta para manter o foco na conquista de badges!')}
          </p>
          {(!searchTerm && statusFilter === 'todos') && (
            <div>
              <button
                type="button"
                className="btn btn-primary rounded-3 px-4 py-2 fw-bold"
                onClick={() => setShowCreateModal(true)}
              >
                ➕ {t('newGoalBtn', 'Novo Objetivo')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="row g-3.5">
          {filteredObjetivos.map((item) => {
            const codigo = item.tipo_objetivo?.codigo_tipo || '';
            const icon = TIPO_ICONS[codigo] || '🎯';
            const tObj = item.tipo_objetivo?.traducao_titulo;
            const titulo = typeof tObj === 'object' ? (tObj[currentLang] || tObj.pt || '') : codigo;

            // Status tag
            let statusBadgeClass = 'bg-primary bg-opacity-10 text-primary border-primary';
            let statusLabel = t('goalStatusActive', 'Em Progresso');
            if (item.objetivo_cumprido) {
              statusBadgeClass = 'bg-success bg-opacity-10 text-success border-success';
              statusLabel = `✓ ${t('goalStatusAchieved', 'Cumprido')}`;
            } else if (!item.objetivoAtivo) {
              statusBadgeClass = 'bg-secondary bg-opacity-10 text-secondary border-secondary';
              statusLabel = t('goalStatusCancelled', 'Cancelado');
            } else if (item.objetivo_expirado) {
              statusBadgeClass = 'bg-danger bg-opacity-10 text-danger border-danger';
              statusLabel = `⚠️ ${t('goalStatusExpired', 'Expirado')}`;
            }

            // Progresso
            const progressoAtual = item.progresso?.progresso_atual ?? 0;
            const metaTotal = item.progresso?.meta_total ?? 1;
            const percentagem = Math.min(Math.round((progressoAtual / metaTotal) * 100), 100);

            // Prazos e Datas
            const dataInicio = new Date(item.data_inicio_objetivo).toLocaleDateString(currentLang === 'pt' ? 'pt-PT' : currentLang === 'es' ? 'es-ES' : 'en-US');
            const dataLimite = item.data_limite_objetivo 
              ? new Date(item.data_limite_objetivo).toLocaleDateString(currentLang === 'pt' ? 'pt-PT' : currentLang === 'es' ? 'es-ES' : 'en-US')
              : null;

            // Dias restantes se estiver ativo com prazo
            let diasRestantesText = null;
            if (item.data_limite_objetivo && !item.objetivo_cumprido && item.objetivoAtivo && !item.objetivo_expirado) {
              const diffTime = new Date(item.data_limite_objetivo).getTime() - Date.now();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays > 0) {
                diasRestantesText = t('daysRemaining', '{{dias}} dias restantes', { dias: diffDays });
              } else {
                diasRestantesText = t('expiredNotice', 'Prazo expirado');
              }
            }

            const canCancel = item.objetivoAtivo && !item.objetivo_cumprido && !item.objetivo_expirado;

            return (
              <div key={item.id_objetivo} className="col-12 col-md-6 col-xl-4">
                <div 
                  className="card h-100 shadow-sm border rounded-4 p-4 d-flex flex-column justify-content-between transition-all hover-shadow-sm"
                  style={{ 
                    backgroundColor: 'var(--panel)', 
                    borderColor: item.objetivo_cumprido ? 'rgba(16, 185, 129, 0.4)' : 'var(--sidebar-border)' 
                  }}
                >
                  {/* Top: Ícone, Título e Status */}
                  <div>
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                      <div className="d-flex align-items-center gap-2.5">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ 
                            width: '42px', 
                            height: '42px', 
                            fontSize: '1.35rem',
                            backgroundColor: item.objetivo_cumprido ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                          }}
                        >
                          {icon}
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0 text-truncate" style={{ color: 'var(--text)', maxWidth: '175px' }} title={titulo}>
                            {titulo}
                          </h6>
                          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            {item.tipo_objetivo?.tem_prazo ? `${item.prazo_valor} ${item.unidade_prazo}` : t('noDeadline', 'Sem prazo')}
                          </span>
                        </div>
                      </div>

                      <span className={`badge border px-2.5 py-1 rounded-pill small fw-semibold flex-shrink-0 ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Descrição da Meta */}
                    <p className="fw-semibold mb-3" style={{ color: 'var(--text)', fontSize: '0.92rem', minHeight: '44px', lineHeight: '1.4' }}>
                      "{item.progresso?.descricao_meta || 'Meta configurada'}"
                    </p>

                    {/* Barra de Progresso Visual */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1 small">
                        <span className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>
                          {t('progressLabel', 'Progresso')}
                        </span>
                        <span className="fw-bold" style={{ color: item.objetivo_cumprido ? '#10b981' : '#3b82f6', fontSize: '0.82rem' }}>
                          {progressoAtual} / {metaTotal} ({percentagem}%)
                        </span>
                      </div>
                      <div className="progress" style={{ height: '8px', backgroundColor: 'var(--panel-2, #e2e8f0)', borderRadius: '6px' }}>
                        <div
                          className={`progress-bar rounded-pill ${item.objetivo_cumprido ? 'bg-success' : 'bg-primary'}`}
                          role="progressbar"
                          style={{ width: `${percentagem}%` }}
                          aria-valuenow={percentagem}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                    </div>

                    {/* Timeline de Datas */}
                    <div 
                      className="p-2.5 rounded-3 mb-3 small d-flex flex-column gap-1"
                      style={{ backgroundColor: 'var(--panel-2, #f8fafc)', fontSize: '0.78rem', color: 'var(--text)' }}
                    >
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">{t('startDateLabel', 'Iniciado em')}:</span>
                        <span className="fw-semibold">{dataInicio}</span>
                      </div>
                      {dataLimite ? (
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">{t('deadlineDateLabel', 'Prazo Limite')}:</span>
                          <span className={`fw-semibold ${item.objetivo_expirado ? 'text-danger' : ''}`}>{dataLimite}</span>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">{t('deadlineDateLabel', 'Prazo Limite')}:</span>
                          <span className="text-muted fst-italic">{t('noDeadline', 'Sem prazo')}</span>
                        </div>
                      )}
                      {diasRestantesText && (
                        <div className="d-flex justify-content-between border-top pt-1 mt-0.5">
                          <span className="text-muted">Tempo restante:</span>
                          <span className="fw-bold text-primary">{diasRestantesText}</span>
                        </div>
                      )}
                      {item.data_cumprimento && (
                        <div className="d-flex justify-content-between border-top pt-1 mt-0.5 text-success">
                          <span>{t('completedDateLabel', 'Concluído em')}:</span>
                          <span className="fw-bold">{new Date(item.data_cumprimento).toLocaleDateString(currentLang === 'pt' ? 'pt-PT' : currentLang === 'es' ? 'es-ES' : 'en-US')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="d-flex align-items-center justify-content-between gap-2 pt-2 border-top" style={{ borderColor: 'var(--sidebar-border)' }}>
                    {item.objetivo_cumprido ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success rounded-3 px-3 py-1.5 fw-bold w-100 d-flex align-items-center justify-content-center gap-1.5"
                        onClick={() => setCelebratingObjetivo(item)}
                      >
                        <span>🎉</span>
                        <span>{t('celebrateGoalBtn', 'Comemorar')}</span>
                      </button>
                    ) : canCancel ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-3 px-3 py-1.5 fw-semibold w-100 d-flex align-items-center justify-content-center gap-1.5"
                        onClick={() => handleCancelObjetivo(item)}
                      >
                        <span>❌</span>
                        <span>{t('cancelGoalBtn', 'Cancelar')}</span>
                      </button>
                    ) : (
                      <span className="text-muted small fst-italic w-100 text-center py-1">
                        —
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal de Criação de Objetivo ─── */}
      {showCreateModal && (
        <CreateObjetivoModal
          activeObjetivos={metrics.ativosList}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            // Atualização silenciosa em background sem piscar a tela
            fetchObjetivos(true);
            if (triggerCountsUpdate) triggerCountsUpdate();
          }}
        />
      )}

      {/* ─── Modal de Celebração de Objetivo Cumprido ─── */}
      {celebratingObjetivo && (
        <ObjetivoCelebrationModal
          objetivo={celebratingObjetivo}
          onClose={() => setCelebratingObjetivo(null)}
        />
      )}
    </div>
  );
}
