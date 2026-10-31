import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { api, API_BASE_URL } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import SearchBar from '../../components/SearchBar';
import '../../styles/rankingGeral.css';

/**
 * Funções auxiliares para resolução de imagens e avatares
 */
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  if (avatarPath.startsWith('/uploads/avatars/')) {
    return `${API_BASE_URL}${avatarPath}`;
  }
  if (avatarPath.startsWith('uploads/avatars/')) {
    return `${API_BASE_URL}/${avatarPath}`;
  }
  const cleanPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
  return `${API_BASE_URL}/uploads/avatars/${cleanPath}`;
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Componente dos Corpos Atléticos SVG para o Pódio
 */
function AthleteBodySvg({ rank }) {
  if (rank === 1) {
    // 🥇 1º Lugar: Campeão com Troféu Erguido e Medalha de Ouro
    return (
      <svg className="athlete-body-svg" viewBox="0 0 90 95" width="84" height="90" fill="none">
        {/* Fita da Medalha */}
        <path d="M38 10 L45 28 L52 10" stroke="#dc2626" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M41 10 L45 28 L49 10" stroke="#2563eb" strokeWidth="1.5" fill="none" />
        {/* Medalha de Ouro */}
        <circle cx="45" cy="30" r="6" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
        <text x="45" y="33" fontSize="6.5" fontWeight="bold" textAnchor="middle" fill="#78350f">1</text>

        {/* Tronco / Camisola de Atletismo Ouro */}
        <path d="M30 14 C30 14, 38 12, 45 12 C52 12, 60 14, 60 14 L62 48 C62 48, 54 50, 45 50 C36 50, 28 48, 28 48 Z" fill="url(#goldSinglet)" stroke="#d97706" strokeWidth="1.5" />
        
        {/* Faixa / Número no Peito */}
        <rect x="36" y="24" width="18" height="14" rx="2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <text x="45" y="34" fontSize="10" fontWeight="900" textAnchor="middle" fill="#d97706">#1</text>

        {/* Braço Esquerdo Erguido segurando Troféu */}
        <path d="M30 16 L16 2 L22 0 L34 14" fill="#fcd34d" />
        {/* Braço Direito Erguido segurando Troféu */}
        <path d="M60 16 L74 2 L68 0 L56 14" fill="#fcd34d" />

        {/* Troféu Dourado nas Mãos */}
        <g transform="translate(33, -12)">
          <path d="M4 2 L20 2 C20 12, 16 16, 12 18 C8 16, 4 12, 4 2 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          <path d="M4 4 C0 4, 0 10, 4 11" stroke="#d97706" strokeWidth="1.5" fill="none" />
          <path d="M20 4 C24 4, 24 10, 20 11" stroke="#d97706" strokeWidth="1.5" fill="none" />
          <rect x="10" y="18" width="4" height="4" fill="#d97706" />
          <rect x="7" y="22" width="10" height="3" rx="1" fill="#78350f" />
          <circle cx="12" cy="8" r="2" fill="#ffffff" opacity="0.8" />
        </g>

        {/* Calções de Corrida Navy */}
        <path d="M28 48 L62 48 L64 68 L48 68 L45 56 L42 68 L26 68 Z" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5" />
        <line x1="30" y1="50" x2="28" y2="68" stroke="#38bdf8" strokeWidth="1.5" />
        <line x1="60" y1="50" x2="62" y2="68" stroke="#38bdf8" strokeWidth="1.5" />

        {/* Pernas de Atleta */}
        <rect x="30" y="68" width="8" height="24" rx="3" fill="#fcd34d" />
        <rect x="52" y="68" width="8" height="24" rx="3" fill="#fcd34d" />

        {/* Sapatilhas de Corrida */}
        <path d="M28 90 L38 90 L40 94 L26 94 Z" fill="#dc2626" />
        <path d="M50 90 L60 90 L62 94 L48 94 Z" fill="#dc2626" />

        <defs>
          <linearGradient id="goldSinglet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (rank === 2) {
    // 🥈 2º Lugar: Corredor com Medalha de Prata e Braço em Vitória
    return (
      <svg className="athlete-body-svg" viewBox="0 0 80 90" width="76" height="85" fill="none">
        {/* Fita da Medalha */}
        <path d="M34 10 L40 26 L46 10" stroke="#2563eb" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Medalha de Prata */}
        <circle cx="40" cy="28" r="5.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="40" y="31" fontSize="6" fontWeight="bold" textAnchor="middle" fill="#334155">2</text>

        {/* Tronco / Camisola de Atletismo Prata */}
        <path d="M26 12 C26 12, 33 10, 40 10 C47 10, 54 12, 54 12 L56 44 C56 44, 48 46, 40 46 C32 46, 24 44, 24 44 Z" fill="url(#silverSinglet)" stroke="#64748b" strokeWidth="1.5" />
        
        {/* Faixa com Número #2 */}
        <rect x="32" y="21" width="16" height="13" rx="2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
        <text x="40" y="30" fontSize="9" fontWeight="900" textAnchor="middle" fill="#475569">#2</text>

        {/* Braço Esquerdo Erguido com Punho de Vitória */}
        <path d="M26 14 L12 2 L18 0 L30 12" fill="#fed7aa" />
        <circle cx="13" cy="2" r="4" fill="#fdba74" />

        {/* Braço Direito em Posição de Corrida */}
        <path d="M54 14 L66 22 L62 26 L52 18" fill="#fed7aa" />
        <circle cx="66" cy="24" r="3.5" fill="#fdba74" />

        {/* Calções de Corrida */}
        <path d="M24 44 L56 44 L58 62 L43 62 L40 52 L37 62 L22 62 Z" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />

        {/* Pernas de Atleta */}
        <rect x="26" y="62" width="7.5" height="22" rx="3" fill="#fed7aa" />
        <rect x="46" y="62" width="7.5" height="22" rx="3" fill="#fed7aa" />

        {/* Sapatilhas de Corrida */}
        <path d="M24 82 L34 82 L36 86 L22 86 Z" fill="#2563eb" />
        <path d="M44 82 L54 82 L56 86 L42 86 Z" fill="#2563eb" />

        <defs>
          <linearGradient id="silverSinglet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 🥉 3º Lugar: Corredor com Medalha de Bronze
  return (
    <svg className="athlete-body-svg" viewBox="0 0 80 85" width="74" height="80" fill="none">
      {/* Fita da Medalha */}
      <path d="M34 8 L40 24 L46 8" stroke="#16a34a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Medalha de Bronze */}
      <circle cx="40" cy="26" r="5.5" fill="#fdba74" stroke="#c2410c" strokeWidth="1.5" />
      <text x="40" y="29" fontSize="6" fontWeight="bold" textAnchor="middle" fill="#7c2d12">3</text>

      {/* Tronco / Camisola de Atletismo Bronze */}
      <path d="M26 10 C26 10, 33 8, 40 8 C47 8, 54 10, 54 10 L56 42 C56 42, 48 44, 40 44 C32 44, 24 42, 24 42 Z" fill="url(#bronzeSinglet)" stroke="#9a3412" strokeWidth="1.5" />
      
      {/* Faixa com Número #3 */}
      <rect x="32" y="19" width="16" height="13" rx="2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
      <text x="40" y="28" fontSize="9" fontWeight="900" textAnchor="middle" fill="#c2410c">#3</text>

      {/* Braços Abertos em Comemoração */}
      <path d="M26 12 L14 18 L16 23 L28 16" fill="#fed7aa" />
      <circle cx="14" cy="19" r="3.5" fill="#fdba74" />
      
      <path d="M54 12 L66 18 L64 23 L52 16" fill="#fed7aa" />
      <circle cx="66" cy="19" r="3.5" fill="#fdba74" />

      {/* Calções de Corrida */}
      <path d="M24 42 L56 42 L58 58 L43 58 L40 48 L37 58 L22 58 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />

      {/* Pernas de Atleta */}
      <rect x="26" y="58" width="7" height="20" rx="3" fill="#fed7aa" />
      <rect x="46" y="58" width="7" height="20" rx="3" fill="#fed7aa" />

      {/* Sapatilhas de Corrida */}
      <path d="M24 76 L34 76 L36 80 L22 80 Z" fill="#16a34a" />
      <path d="M44 76 L54 76 L56 80 L42 80 Z" fill="#16a34a" />

      <defs>
        <linearGradient id="bronzeSinglet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Componente Principal: Ranking Geral
 */
export default function RankingGeral() {
  const { t } = useTranslation();
  const { socket } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [rankingData, setRankingData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [failedAvatars, setFailedAvatars] = useState({});

  // Efeito festivo de confetes
  const triggerConfettiCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#FBBF24', '#38BDF8', '#34D399', '#EC4899']
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#F59E0B', '#94A3B8', '#D97706']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#F59E0B', '#94A3B8', '#D97706']
        });
      }, 250);
    } catch (e) {
      console.warn('Erro ao disparar confetes:', e);
    }
  }, []);

  // Fetch dados de ranking geral do backend
  const fetchRanking = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get('/metricas/ranking-geral').catch(() => null);

      let list = [];
      if (res?.data?.success && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else {
        // Fallback gracioso: tentar buscar de /metricas/sll-dashboard/top-consultor se ranking-geral estiver vazio
        const fallbackRes = await api.get('/metricas/sll-dashboard/top-consultor').catch(() => null);
        if (fallbackRes?.data?.success && Array.isArray(fallbackRes.data.data)) {
          list = fallbackRes.data.data;
        }
      }

      // Normalizar formato dos itens
      const normalized = list.map((item, idx) => {
        const consultor = item.consultor || item.utilizador || item;
        const nome = `${consultor.nome || item.nome || ''} ${consultor.apelido || item.apelido || ''}`.trim() || t('consultant', 'Consultor');
        const email = consultor.email || item.email || '';
        const rawAvatar = consultor.avatar || item.avatar || null;
        const avatar = rawAvatar ? getAvatarUrl(rawAvatar) : null;
        const pontos = Number(item.pontos ?? item.total_pontos ?? item.pontuacao ?? consultor.pontos ?? 0);
        const serviceLine = consultor.nome_sl || consultor.service_line?.service_line || (typeof consultor.service_line === 'string' ? consultor.service_line : '') || consultor.sl_nome || item.nome_sl || item.service_line?.service_line || (typeof item.service_line === 'string' ? item.service_line : '') || item.sl_nome || '—';
        const id = consultor.id_utilizador || item.id_utilizador || `user-${idx}`;
        const rank = item.posicao ?? (idx + 1);

        return {
          id,
          nome,
          email,
          avatar,
          pontos,
          serviceLine,
          rank
        };
      });

      // Ordenar: se posicao existe, respeitar posicao, senão ordenar decrescente por pontos
      normalized.sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return b.pontos - a.pontos;
      });
      // Reatribuir rank após ordenação
      normalized.forEach((u, i) => { u.rank = i + 1; });

      setRankingData(normalized);

      if (normalized.length > 0 && !isSilent) {
        triggerConfettiCelebration();
      }
    } catch (err) {
      console.error('Erro ao carregar ranking geral:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [t, triggerConfettiCelebration]);

  useEffect(() => {
    fetchRanking(false);
  }, [fetchRanking]);

  // Sincronização via WebSocket em tempo real (atualização silenciosa)
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchRanking(true);
    };

    socket.on('candidatura_badge_emitido', handleUpdate);
    socket.on('badge_updated', handleUpdate);
    socket.on('user_updated', handleUpdate);

    return () => {
      socket.off('candidatura_badge_emitido', handleUpdate);
      socket.off('badge_updated', handleUpdate);
      socket.off('user_updated', handleUpdate);
    };
  }, [socket, fetchRanking]);

  // Top 3 para o Pódio
  const top1 = rankingData[0] || null;
  const top2 = rankingData[1] || null;
  const top3 = rankingData[2] || null;
  const maxPoints = top1 ? Math.max(top1.pontos, 1) : 1;

  // Filtragem da tabela a partir do 4º lugar
  const restOfRanking = useMemo(() => {
    return rankingData.slice(3);
  }, [rankingData]);

  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return restOfRanking;
    const term = searchTerm.toLowerCase();
    return restOfRanking.filter(u => 
      u.nome.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term) ||
      u.serviceLine.toLowerCase().includes(term)
    );
  }, [restOfRanking, searchTerm]);

  return (
    <div className="ranking-page-wrapper">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          CABEÇALHO
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="ranking-header-card d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="ranking-trophy-icon-wrap">
            🏆
          </div>
          <div>
            <h4 className="ranking-title">
              {t('rankingTitle', 'Ranking Geral de Pontuação')}
            </h4>
            <p className="ranking-subtitle">
              {t('rankingSubtitle', 'Classificação global dos consultores na plataforma SoftBadge')}
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            className="ranking-btn-celebrate"
            onClick={triggerConfettiCelebration}
          >
            <span>🎉 {t('rankingCelebrateBtn', 'Celebrar')}</span>
          </button>

          <button 
            type="button" 
            className="ranking-btn-refresh"
            onClick={() => fetchRanking(true)}
            disabled={loading}
            title={t('refresh', 'Atualizar')}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{t('refresh', 'Atualizar')}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 fw-semibold text-muted">
            {t('rankingLoading', 'A carregar classificação geral...')}
          </p>
        </div>
      ) : rankingData.length === 0 ? (
        <div className="ranking-table-card p-5 text-center">
          <span style={{ fontSize: '3.5rem' }}>🏁</span>
          <h5 className="fw-bold mt-3 text-dark">
            {t('rankingNoData', 'Sem dados de classificação disponíveis de momento.')}
          </h5>
          <p className="text-muted small">
            {t('noDataDesc', 'Os pontos atribuídos aos badges concluídos atualizarão o pódio em tempo real.')}
          </p>
        </div>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────────────────────
              ARENA DO PÓDIO DE CAMPEÕES (TOP 3)
          ───────────────────────────────────────────────────────────────────────────── */}
          <div className="ranking-podium-arena">
            <div className="text-center mb-3">
              <span className="badge bg-warning-subtle text-warning-emphasis fw-bold px-3 py-1.5 rounded-pill" style={{ fontSize: '0.85rem', border: '1px solid #fde68a' }}>
                ⭐ {t('rankingPodiumTitle', 'Pódio de Campeões')} ⭐
              </span>
            </div>

            <div className="podium-stage-flex">
              
              {/* 🥈 2º LUGAR (ESQUERDA) */}
              <div className="podium-col rank-2">
                {top2 ? (
                  <>
                    <div className="athlete-figure-wrap">
                      {top2.avatar && !failedAvatars[top2.id] ? (
                        <img 
                          src={top2.avatar} 
                          alt={top2.nome} 
                          className="athlete-head-avatar silver"
                          onError={() => setFailedAvatars(prev => ({ ...prev, [top2.id]: true }))}
                        />
                      ) : (
                        <div className="athlete-avatar-initials silver">
                          {getInitials(top2.nome)}
                        </div>
                      )}
                      <AthleteBodySvg rank={2} />
                    </div>

                    <div className="athlete-info-tag">
                      <div className="athlete-name" title={top2.nome}>
                        {top2.nome}
                      </div>
                      <span className="athlete-points-badge silver">
                        🥈 {top2.pontos} {t('rankingPoints', 'pts')}
                      </span>
                    </div>

                    <div className="podium-pedestal silver">
                      <span className="pedestal-rank-number">2</span>
                      <span className="pedestal-label">PRATA</span>
                    </div>
                  </>
                ) : (
                  <div className="podium-pedestal silver opacity-50">
                    <span className="pedestal-rank-number">2</span>
                  </div>
                )}
              </div>

              {/* 🥇 1º LUGAR (CENTRO - MAIS ALTO) */}
              <div className="podium-col rank-1">
                {top1 ? (
                  <>
                    <div className="athlete-figure-wrap">
                      <span className="crown-badge">👑</span>
                      {top1.avatar && !failedAvatars[top1.id] ? (
                        <img 
                          src={top1.avatar} 
                          alt={top1.nome} 
                          className="athlete-head-avatar gold"
                          onError={() => setFailedAvatars(prev => ({ ...prev, [top1.id]: true }))}
                        />
                      ) : (
                        <div className="athlete-avatar-initials gold">
                          {getInitials(top1.nome)}
                        </div>
                      )}
                      <AthleteBodySvg rank={1} />
                    </div>

                    <div className="athlete-info-tag">
                      <div className="athlete-name" title={top1.nome} style={{ fontSize: '1.05rem', color: '#b45309' }}>
                        {top1.nome}
                      </div>
                      <span className="athlete-points-badge gold">
                        🥇 {top1.pontos} {t('rankingPoints', 'pts')}
                      </span>
                    </div>

                    <div className="podium-pedestal gold">
                      <span className="pedestal-rank-number">1</span>
                      <span className="pedestal-label">OURO</span>
                    </div>
                  </>
                ) : (
                  <div className="podium-pedestal gold opacity-50">
                    <span className="pedestal-rank-number">1</span>
                  </div>
                )}
              </div>

              {/* 🥉 3º LUGAR (DIREITA) */}
              <div className="podium-col rank-3">
                {top3 ? (
                  <>
                    <div className="athlete-figure-wrap">
                      {top3.avatar && !failedAvatars[top3.id] ? (
                        <img 
                          src={top3.avatar} 
                          alt={top3.nome} 
                          className="athlete-head-avatar bronze"
                          onError={() => setFailedAvatars(prev => ({ ...prev, [top3.id]: true }))}
                        />
                      ) : (
                        <div className="athlete-avatar-initials bronze">
                          {getInitials(top3.nome)}
                        </div>
                      )}
                      <AthleteBodySvg rank={3} />
                    </div>

                    <div className="athlete-info-tag">
                      <div className="athlete-name" title={top3.nome}>
                        {top3.nome}
                      </div>
                      <span className="athlete-points-badge bronze">
                        🥉 {top3.pontos} {t('rankingPoints', 'pts')}
                      </span>
                    </div>

                    <div className="podium-pedestal bronze">
                      <span className="pedestal-rank-number">3</span>
                      <span className="pedestal-label">BRONZE</span>
                    </div>
                  </>
                ) : (
                  <div className="podium-pedestal bronze opacity-50">
                    <span className="pedestal-rank-number">3</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────────
              TABELA DE CLASSIFICAÇÃO (4º LUGAR EM DIANTE)
          ───────────────────────────────────────────────────────────────────────────── */}
          <div className="ranking-table-card">
            
            {/* Barra de Filtros e Busca */}
            <div className="ranking-filter-bar">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t('rankingSearchPlaceholder', 'Pesquisar consultor por nome ou email...')}
                style={{ flex: 1, minWidth: '260px' }}
              />

              <div className="d-flex align-items-center gap-2">
                <span className="ranking-count-pill">
                  👥 {t('rankingTotalParticipants', 'Total de Consultores')}: <strong>{rankingData.length}</strong>
                </span>
              </div>
            </div>

            {/* Listagem */}
            {filteredList.length === 0 ? (
              <div className="p-5 text-center text-muted">
                <span style={{ fontSize: '2.5rem' }}>🔍</span>
                <p className="mt-2 mb-0 fw-semibold">
                  {searchTerm 
                    ? t('rankingNoSearchResults', 'Nenhum consultor encontrado para a pesquisa.') 
                    : t('noMoreRankings', 'Não existem mais consultores registados para além do Top 3.')}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px', textAlign: 'center' }}>{t('rankingTableRank', '#')}</th>
                      <th>{t('rankingTableConsultant', 'Consultor')}</th>
                      <th>{t('rankingTableSL', 'Linha de Serviço')}</th>
                      <th style={{ width: '180px' }}>{t('rankingTableProgress', 'Progresso')}</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>{t('rankingTablePoints', 'Pontuação')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((user) => {
                      const isTop10 = user.rank <= 10;
                      const progressPct = Math.round((user.pontos / maxPoints) * 100);

                      return (
                        <tr key={user.id} className={isTop10 ? 'rank-row-top10' : ''}>
                          {/* Posição */}
                          <td style={{ textAlign: 'center' }}>
                            <span className="rank-pos-badge">
                              {user.rank}º
                            </span>
                          </td>

                          {/* Consultor: Avatar + Nome + Email */}
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              {user.avatar && !failedAvatars[user.id] ? (
                                <img 
                                  src={user.avatar} 
                                  alt={user.nome} 
                                  className="rank-user-avatar"
                                  onError={() => setFailedAvatars(prev => ({ ...prev, [user.id]: true }))}
                                />
                              ) : (
                                <div className="rank-user-initials">
                                  {getInitials(user.nome)}
                                </div>
                              )}
                              <div>
                                <strong className="d-block text-dark fw-bold" style={{ fontSize: '0.92rem' }}>
                                  {user.nome}
                                </strong>
                                <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Linha de Serviço */}
                          <td>
                            <span className="badge bg-light text-dark border px-2.5 py-1 fw-semibold small">
                              {user.serviceLine}
                            </span>
                          </td>

                          {/* Barra de Progresso em relação ao 1º lugar */}
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="rank-points-bar-wrap">
                                <div 
                                  className="rank-points-bar-fill" 
                                  style={{ width: `${Math.max(progressPct, 4)}%` }} 
                                />
                              </div>
                              <span className="text-muted small fw-semibold" style={{ fontSize: '0.75rem', minWidth: '35px' }}>
                                {progressPct}%
                              </span>
                            </div>
                          </td>

                          {/* Pontos */}
                          <td style={{ textAlign: 'right' }}>
                            <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-1.5" style={{ fontSize: '0.85rem' }}>
                              {user.pontos} {t('rankingPoints', 'pts')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}
