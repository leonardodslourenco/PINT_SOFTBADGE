import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../services/api';

/**
 * COMPONENTE VISTA: HomeAdmin
 * Renderiza o painel principal de métricas corporativas, alertas de SLA, gráficos analíticos e widgets.
 */
export default function HomeAdmin({ onNavigate }) {
  const { t, i18n } = useTranslation();
  const { socket } = useAppContext();
  const [totalUsers, setTotalUsers] = useState(0);
  const [comparativeData, setComparativeData] = useState({ percentagem: 0, isPositive: true });
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [totalBadges, setTotalBadges] = useState(0);
  const [comparativeBadges, setComparativeBadges] = useState({ percentagem: 0, isPositive: true });
  const [loadingBadges, setLoadingBadges] = useState(true);

  // Estados para Candidaturas Especiais (Estados 1, 2, 3)
  const [specialPendingCount, setSpecialPendingCount] = useState(0);
  const [specialApprovedCount, setSpecialApprovedCount] = useState(0);
  const [specialRejectedCount, setSpecialRejectedCount] = useState(0);
  const [loadingSpecial, setLoadingSpecial] = useState(true);

  // Estados para Monitorização de SLA (Alert Card Interativo com cálculo de urgência)
  const [slaMetrics, setSlaMetrics] = useState({
    status: 'compliant', // 'compliant' (verde), 'near_expiry' (laranja), 'expired' (vermelho)
    count: 0,
    totalExpired: 0,
    totalNearExpiry: 0,
    mostCriticalRole: 'TM',
    mostCriticalTimeText: '',
    mostCriticalHours: 0
  });
  const [loadingSla, setLoadingSla] = useState(true);

  // Estados para Pedidos Pendentes de Validação (Alert Card 2)
  const [pendingValidation, setPendingValidation] = useState({ total: 0, horas: 0 });
  const [loadingPendingValidation, setLoadingPendingValidation] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const [
        resTotal,
        resComp,
        resTotalBadges,
        resCompBadges,
        resEspPending,
        resEspApproved,
        resEspRejected,
        resSlaConfig,
        resCands,
        resPendingValidation
      ] = await Promise.all([
        api.get('/metricas/utilizadores_total'),
        api.get('/metricas/utilizadores_comparativo_mesanterior'),
        api.get('/metricas/badges_total'),
        api.get('/metricas/badges_comparativo_mesanterior'),
        api.get('/metricas/candidaturas-especiais/estado-contagem?estado=1'),
        api.get('/metricas/candidaturas-especiais/estado-contagem?estado=2'),
        api.get('/metricas/candidaturas-especiais/estado-contagem?estado=3'),
        api.get('/metricas/sla/config').catch(() => null),
        api.get('/candidatura_badge').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/metricas/admin/pedidos-pendentes').catch(() => null)
      ]);
      
      if (resTotal.data?.success) {
        setTotalUsers(resTotal.data.data?.total || 0);
      }
      if (resComp.data?.success) {
        const pct = resComp.data.data?.percentagem || 0;
        setComparativeData({
          percentagem: pct,
          isPositive: pct >= 0
        });
      }
      if (resTotalBadges.data?.success) {
        setTotalBadges(resTotalBadges.data.data?.total || 0);
      }
      if (resCompBadges.data?.success) {
        const pct = resCompBadges.data.data?.percentagem || 0;
        setComparativeBadges({
          percentagem: pct,
          isPositive: pct >= 0
        });
      }
      if (resEspPending.data?.success) {
        setSpecialPendingCount(resEspPending.data.data?.contagem || 0);
      }
      if (resEspApproved.data?.success) {
        setSpecialApprovedCount(resEspApproved.data.data?.contagem || 0);
      }
      if (resEspRejected.data?.success) {
        setSpecialRejectedCount(resEspRejected.data.data?.contagem || 0);
      }

      // Cálculo Dinâmico e Detalhado de SLA (Exatamente alinhado à listagem de SlaManagement.jsx)
      const configData = resSlaConfig?.data?.data || {};
      const tmHours = Number(configData.sla_tm_horas) || 48;
      const sllHours = Number(configData.sla_sll_horas) || 48;

      const activeSlaCands = (resCands?.data?.data || []).filter(c =>
        c.id_estado_candidatura === 2 || c.id_estado_candidatura === 3
      );

      if (activeSlaCands.length === 0) {
        setSlaMetrics({
          status: 'compliant',
          count: 0,
          totalExpired: 0,
          totalNearExpiry: 0,
          mostCriticalRole: 'TM',
          mostCriticalTimeText: '',
          mostCriticalHours: 0
        });
      } else {
        const evaluated = activeSlaCands.map(c => {
          const isTm = c.id_estado_candidatura === 2;
          const allowedHours = isTm ? tmHours : sllHours;

          const sortedActions = [...(c.acoes || [])].sort(
            (a, b) => new Date(a.data_acao_candidatura) - new Date(b.data_acao_candidatura)
          );

          let baseTime = new Date(c.data_candidatura);
          if (sortedActions.length > 0) {
            const lastAction = sortedActions[sortedActions.length - 1];
            baseTime = new Date(lastAction.data_acao_candidatura);
          }

          const elapsedMs = Date.now() - baseTime.getTime();
          const elapsedHours = elapsedMs / (1000 * 60 * 60);
          const hoursLeft = allowedHours - elapsedHours;

          let candStatus = 'compliant';
          if (hoursLeft <= 0) {
            candStatus = 'expired';
          } else if (hoursLeft < 24 || (hoursLeft / allowedHours) < 0.25) {
            candStatus = 'near_expiry';
          }

          return {
            candidacy: c,
            isTm,
            role: isTm ? 'TM' : 'SLL',
            allowedHours,
            elapsedHours,
            hoursLeft,
            status: candStatus
          };
        });

        const expiredList = evaluated.filter(e => e.status === 'expired');
        const nearExpiryList = evaluated.filter(e => e.status === 'near_expiry');
        const criticalList = evaluated.filter(e => e.status === 'expired' || e.status === 'near_expiry');

        if (expiredList.length > 0) {
          // Prioridade 1: Tem alguma expirada -> VERMELHO
          // A mais atrasada (menor hoursLeft / mais negativa)
          const mostCritical = expiredList.reduce((prev, curr) => curr.hoursLeft < prev.hoursLeft ? curr : prev, expiredList[0]);
          const absHours = Math.abs(mostCritical.hoursLeft);
          const timeText = absHours < 24 ? `${Math.round(absHours)}h` : `${Math.round(absHours / 24)}d`;

          setSlaMetrics({
            status: 'expired',
            count: criticalList.length,
            totalExpired: expiredList.length,
            totalNearExpiry: nearExpiryList.length,
            mostCriticalRole: mostCritical.role,
            mostCriticalTimeText: timeText,
            mostCriticalHours: Math.round(absHours)
          });
        } else if (nearExpiryList.length > 0) {
          // Prioridade 2: Nenhuma expirada, mas tem próximas do limite -> LARANJA
          // A que vence mais cedo (menor hoursLeft positivo)
          const tightest = nearExpiryList.reduce((prev, curr) => curr.hoursLeft < prev.hoursLeft ? curr : prev, nearExpiryList[0]);
          const hours = Math.max(1, Math.round(tightest.hoursLeft));
          const timeText = hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;

          setSlaMetrics({
            status: 'near_expiry',
            count: criticalList.length,
            totalExpired: 0,
            totalNearExpiry: nearExpiryList.length,
            mostCriticalRole: tightest.role,
            mostCriticalTimeText: timeText,
            mostCriticalHours: hours
          });
        } else {
          // Prioridade 3: Todas estão em conformidade -> VERDE
          setSlaMetrics({
            status: 'compliant',
            count: 0,
            totalExpired: 0,
            totalNearExpiry: 0,
            mostCriticalRole: 'TM',
            mostCriticalTimeText: '',
            mostCriticalHours: 0
          });
        }
      }

      // Métricas de Pedidos Pendentes de Validação (Estados 2 e 3)
      if (resPendingValidation?.data?.success && resPendingValidation.data.data) {
        const metricas = resPendingValidation.data.data;
        let horas = metricas.horas;
        
        // Se backend enviar data/hora da candidatura mais antiga, calcular as horas decorridas
        const dataAntiga = metricas.data_mais_antiga || metricas.data_candidatura_mais_antiga || metricas.data_candidatura;
        if (dataAntiga) {
          const diffMs = Date.now() - new Date(dataAntiga).getTime();
          if (!isNaN(diffMs) && diffMs >= 0) {
            horas = Math.floor(diffMs / (1000 * 60 * 60));
          }
        }
        
        setPendingValidation({
          total: Number(metricas.total) || 0,
          horas: Number(horas) || 0
        });
      } else if (resCands?.data?.success) {
        // Fallback defensivo com /candidatura_badge
        const activeCands = (resCands.data.data || []).filter(c =>
          c.id_estado_candidatura === 2 || c.id_estado_candidatura === 3
        );
        let oldestHours = 0;
        if (activeCands.length > 0) {
          const timestamps = activeCands
            .map(c => new Date(c.data_candidatura).getTime())
            .filter(t => !isNaN(t));
          if (timestamps.length > 0) {
            const oldest = Math.min(...timestamps);
            oldestHours = Math.max(0, Math.floor((Date.now() - oldest) / (1000 * 60 * 60)));
          }
        }
        setPendingValidation({
          total: activeCands.length,
          horas: oldestHours
        });
      }
    } catch (err) {
      console.error('Erro ao buscar métricas de utilizadores, badges e candidaturas especiais:', err);
    } finally {
      setLoadingUsers(false);
      setLoadingBadges(false);
      setLoadingSpecial(false);
      setLoadingSla(false);
      setLoadingPendingValidation(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, i18n.language]);

  // =========================================================================
  // MÉTRICAS MENSAIS DE CONSULTORES ATIVOS (GRÁFICO SVG)
  // =========================================================================
  const currentYearNow = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYearNow);
  const selectedYearRef = useRef(selectedYear);
  const [chartMetrics, setChartMetrics] = useState(null);
  const chartMetricsRef = useRef(chartMetrics);
  const [loadingChart, setLoadingChart] = useState(true);
  const [calcMode, setCalcMode] = useState('total_geral'); // 'total_geral' ou 'total_ano'

  useEffect(() => {
    selectedYearRef.current = selectedYear;
  }, [selectedYear]);

  useEffect(() => {
    chartMetricsRef.current = chartMetrics;
  }, [chartMetrics]);

  const loadChartData = useCallback(async (ano, force = false) => {
    const cached = chartMetricsRef.current;
    const yearKey = String(ano);

    // Se já temos a informação em cache (seja em cached.anos ou no registo raiz) e não for atualização forçada
    if (!force && cached) {
      if ((cached.anos && cached.anos[yearKey]) || cached.ano === ano) {
        setLoadingChart(false);
        return;
      }
    }

    try {
      setLoadingChart(true);
      const res = await api.get(`/metricas/admin/consultores-ativos-mensal?ano=${ano}`);
      if (res.data?.success && res.data.data) {
        setChartMetrics(prev => {
          if (!prev) return res.data.data;
          return {
            ...prev,
            ...res.data.data,
            anos: {
              ...(prev.anos || {}),
              ...(res.data.data.anos || {}),
              [yearKey]: res.data.data
            }
          };
        });
      }
    } catch (err) {
      console.error('Erro ao carregar métricas mensais de consultores ativos:', err);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  useEffect(() => {
    loadChartData(selectedYear);
  }, [loadChartData, selectedYear]);

  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      loadStats();
      loadChartData(selectedYearRef.current, true);
    };

    socket.on('badge_updated', handleRealtimeUpdate);
    socket.on('gestao_area', handleRealtimeUpdate);
    socket.on('user_updated', handleRealtimeUpdate);
    socket.on('candidatura_especial_submetida', handleRealtimeUpdate);
    socket.on('nova_candidatura_especial', handleRealtimeUpdate);
    socket.on('candidatura_especial_aprovada', handleRealtimeUpdate);
    socket.on('candidatura_especial_recusada', handleRealtimeUpdate);
    socket.on('conquista_especial_criada', handleRealtimeUpdate);
    socket.on('conquista_especial_atualizada', handleRealtimeUpdate);
    socket.on('conquista_especial_removida', handleRealtimeUpdate);
    socket.on('notification', handleRealtimeUpdate);
    socket.on('candidatura_submetida', handleRealtimeUpdate);
    socket.on('candidatura_pre_aprovada', handleRealtimeUpdate);
    socket.on('candidatura_avancou', handleRealtimeUpdate);
    socket.on('candidatura_badge_emitido', handleRealtimeUpdate);
    socket.on('candidatura_rejeitada', handleRealtimeUpdate);
    socket.on('sla_config_updated', handleRealtimeUpdate);

    return () => {
      socket.off('badge_updated', handleRealtimeUpdate);
      socket.off('gestao_area', handleRealtimeUpdate);
      socket.off('user_updated', handleRealtimeUpdate);
      socket.off('candidatura_especial_submetida', handleRealtimeUpdate);
      socket.off('nova_candidatura_especial', handleRealtimeUpdate);
      socket.off('candidatura_especial_aprovada', handleRealtimeUpdate);
      socket.off('candidatura_especial_recusada', handleRealtimeUpdate);
      socket.off('conquista_especial_criada', handleRealtimeUpdate);
      socket.off('conquista_especial_atualizada', handleRealtimeUpdate);
      socket.off('conquista_especial_removida', handleRealtimeUpdate);
      socket.off('notification', handleRealtimeUpdate);
      socket.off('candidatura_submetida', handleRealtimeUpdate);
      socket.off('candidatura_pre_aprovada', handleRealtimeUpdate);
      socket.off('candidatura_avancou', handleRealtimeUpdate);
      socket.off('candidatura_badge_emitido', handleRealtimeUpdate);
      socket.off('candidatura_rejeitada', handleRealtimeUpdate);
      socket.off('sla_config_updated', handleRealtimeUpdate);
    };
  }, [socket, loadStats, loadChartData]);

  // Anos mínimo e máximo: mínimo é ano atual - 10 anos, máximo é ano atual
  const minYear = chartMetrics?.ano_minimo ?? (currentYearNow - 10);
  const maxYear = chartMetrics?.ano_maximo ?? currentYearNow;
  const availableYears = useMemo(() => {
    if (chartMetrics?.anos_disponiveis && Array.isArray(chartMetrics.anos_disponiveis) && chartMetrics.anos_disponiveis.length > 0) {
      return chartMetrics.anos_disponiveis;
    }
    const years = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [chartMetrics, maxYear, minYear]);

  // Dados do ano ativo (obtidos diretamente de chartMetrics.anos se disponível)
  const currentYearData = useMemo(() => {
    if (!chartMetrics) return null;
    const yearKey = String(selectedYear);
    if (chartMetrics.anos && chartMetrics.anos[yearKey]) {
      const yearInfo = chartMetrics.anos[yearKey];
      return {
        ...chartMetrics,
        ...yearInfo,
        ano: selectedYear,
        total_ativos_ano: yearInfo.total_ativos_ano ?? 0,
        meses: yearInfo.meses || {},
        percentagens_ano: yearInfo.percentagens_ano || yearInfo.percentagens || {},
        percentagens_total_geral: yearInfo.percentagens_total_geral || (
          chartMetrics.ano === selectedYear ? chartMetrics.percentagens_total_geral : {}
        ),
        detalhes_mensais: yearInfo.detalhes_mensais || (
          chartMetrics.ano === selectedYear ? chartMetrics.detalhes_mensais : null
        )
      };
    }
    return chartMetrics;
  }, [chartMetrics, selectedYear]);

  // Total Geral de consultores e Total Ativos no Ano
  const totalGeral = Number(currentYearData?.TotalGeral ?? chartMetrics?.TotalGeral ?? chartMetrics?.totalGeral ?? chartMetrics?.total_geral) || 0;
  const totalAtivosAno = Number(currentYearData?.total_ativos_ano) || 0;

  // Legendas dos 12 meses internacionalizadas
  const monthLabels = useMemo(() => {
    const labelsByLang = {
      pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    };
    return labelsByLang[i18n.language] || labelsByLang.pt;
  }, [i18n.language]);

  const monthKeys = useMemo(() => [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ], []);

  // Calcula a percentagem de cada mês com base no modo selecionado (Total Geral ou Total Anual)
  const monthlyData = useMemo(() => {
    return monthKeys.map((key, idx) => {
      let count = 0;
      let pct = 0;

      // 1. Obter contagem de consultores ativos no mês
      if (currentYearData?.meses && currentYearData.meses[key] !== undefined) {
        count = Number(currentYearData.meses[key]) || 0;
      } else if (currentYearData && currentYearData[key] !== undefined) {
        count = Number(currentYearData[key]) || 0;
      } else if (currentYearData?.detalhes_mensais && Array.isArray(currentYearData.detalhes_mensais)) {
        const item = currentYearData.detalhes_mensais.find(d => d.chave === key || d.mes === idx + 1);
        if (item) count = Number(item.contagem) || 0;
      }

      // 2. Obter ou calcular percentagem consoante calcMode
      if (calcMode === 'total_ano') {
        if (currentYearData?.percentagens_ano && currentYearData.percentagens_ano[key] !== undefined) {
          pct = Number(currentYearData.percentagens_ano[key]);
        } else if (currentYearData?.detalhes_mensais && Array.isArray(currentYearData.detalhes_mensais)) {
          const item = currentYearData.detalhes_mensais.find(d => d.chave === key || d.mes === idx + 1);
          if (item?.percentagem_ano !== undefined) {
            pct = Number(item.percentagem_ano);
          } else if (totalAtivosAno > 0) {
            pct = (count / totalAtivosAno) * 100;
          }
        } else if (totalAtivosAno > 0) {
          pct = (count / totalAtivosAno) * 100;
        } else {
          pct = 0;
        }
      } else {
        // calcMode === 'total_geral'
        if (currentYearData?.percentagens_total_geral && currentYearData.percentagens_total_geral[key] !== undefined) {
          pct = Number(currentYearData.percentagens_total_geral[key]);
        } else if (currentYearData?.detalhes_mensais && Array.isArray(currentYearData.detalhes_mensais)) {
          const item = currentYearData.detalhes_mensais.find(d => d.chave === key || d.mes === idx + 1);
          if (item?.percentagem_total_geral !== undefined) {
            pct = Number(item.percentagem_total_geral);
          } else if (totalGeral > 0) {
            pct = (count / totalGeral) * 100;
          }
        } else if (totalGeral > 0) {
          pct = (count / totalGeral) * 100;
        } else {
          pct = 0;
        }
      }

      return {
        monthIndex: idx,
        key,
        label: monthLabels[idx],
        count,
        percentage: Number(pct.toFixed(1))
      };
    });
  }, [currentYearData, monthKeys, monthLabels, calcMode, totalAtivosAno, totalGeral]);

  // Constantes de dimensão da tela vetorial SVG
  const svgWidth = 600;
  const svgHeight = 175;
  const paddingX = 38;
  const paddingTop = 26;
  const paddingBottom = 26;

  // Mapeador Coordenado: Transforma os valores de percentagem em coordenadas cartesianas (X, Y)
  const points = useMemo(() => {
    const count = monthlyData.length; // 12 meses
    const stepX = (svgWidth - paddingX * 2) / (count - 1);
    const rangeY = svgHeight - paddingTop - paddingBottom;

    return monthlyData.map((d, idx) => {
      const x = paddingX + idx * stepX;
      // Escala estrita 0% a 100%: 0% na base (svgHeight - paddingBottom), 100% no topo (paddingTop)
      const ratio = Math.max(0, Math.min(100, d.percentage)) / 100;
      const y = svgHeight - paddingBottom - ratio * rangeY;
      return { 
        x, 
        y, 
        value: d.percentage,
        count: d.count,
        label: d.label
      };
    });
  }, [monthlyData]);

  // Construtor de Caminho Vetorial para a linha principal
  const linePath = useMemo(() => {
    if (!points.length) return '';
    return points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
    }, '');
  }, [points]);

  // Construtor de Área de Preenchimento para gradiente sob a linha
  const fillPath = useMemo(() => {
    if (!points.length) return '';
    const startX = points[0].x;
    const endX = points[points.length - 1].x;
    const baseY = svgHeight - paddingBottom;
    return `${linePath} L ${endX},${baseY} L ${startX},${baseY} Z`;
  }, [points, linePath]);
  return (
    <div className="dashboard-left-right-wrapper">
      {/* Title block */}
      <div
        className="mb-4 text-white p-3 p-md-4 rounded-4 shadow-sm position-relative overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(135deg, #374151, #111827)',
          border: '1px solid rgba(148, 163, 184, 0.35)'
        }}
      >
        <h4 className="fw-bold mb-1">{t('dashboard')}</h4>
        <p className="mb-0 text-white-50 small">{t('viewDashboard')}</p>
      </div>

      <div className="dashboard-container">
        {/* KPI Cards row */}
        <div className="kpi-grid">
            {/* Card 1: Utilizadores Registados */}
            <div 
              className="kpi-card"
              style={{ cursor: onNavigate ? 'pointer' : 'default' }}
              onClick={() => onNavigate && onNavigate('users')}
            >
              <div className="kpi-details">
                <span className="kpi-title">{t('registeredUsers')}</span>
                <span className="kpi-value">{loadingUsers ? '...' : totalUsers}</span>
                <span className={`kpi-trend ${comparativeData.isPositive ? 'positive' : 'negative'}`} style={{ color: comparativeData.isPositive ? '#16a34a' : '#ef4444' }}>
                  <svg 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    style={{ width: '12px', height: '12px', strokeWidth: '2.5', transform: comparativeData.isPositive ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s ease' }}
                  >
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>{comparativeData.isPositive ? '+' : ''}{comparativeData.percentagem}% {t('vsPreviousMonth')}</span>
                </span>
              </div>
              <div className="kpi-icon-wrapper">
                <svg viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>

            {/* Card 2: Total de Badges */}
            <div 
              className="kpi-card"
              style={{ cursor: onNavigate ? 'pointer' : 'default' }}
              onClick={() => onNavigate && onNavigate('badges')}
            >
              <div className="kpi-details">
                <span className="kpi-title">{t('totalBadges')}</span>
                <span className="kpi-value">{loadingBadges ? '...' : totalBadges}</span>
                <span className={`kpi-trend ${comparativeBadges.isPositive ? 'positive' : 'negative'}`} style={{ color: comparativeBadges.isPositive ? '#16a34a' : '#ef4444' }}>
                  <svg 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ width: '12px', height: '12px', strokeWidth: '2.5', transform: comparativeBadges.isPositive ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s ease' }}
                  >
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>{comparativeBadges.isPositive ? '+' : ''}{comparativeBadges.percentagem}% {t('vsPreviousMonth')}</span>
                </span>
              </div>
              <div className="kpi-icon-wrapper">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
            </div>

            {/* Card 3: Taxa de Conclusão */}
            <div className="kpi-card">
              <div className="kpi-details">
                <span className="kpi-title">{t('completionRate')}</span>
                <span className="kpi-value">68%</span>
                <span className="kpi-trend positive">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>+5% {t('vsPreviousMonth')}</span>
                </span>
              </div>
              <div className="kpi-icon-wrapper">
                <svg viewBox="0 0 24 24">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
            </div>
          </div>

          {/* KPI Row 2: Candidaturas Especiais por Estado (1: Pendente, 2: Aprovada, 3: Recusada) */}
          <div className="kpi-grid mb-4">
            {/* Card 1: Candidaturas Especiais Aguardando Moderação */}
            <div 
              className="kpi-card" 
              style={{ cursor: onNavigate ? 'pointer' : 'default' }}
              onClick={() => onNavigate && onNavigate('especiais')}
            >
              <div className="kpi-details" style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="kpi-title text-truncate" title={t('specialAppsPendingCardTitle', 'Candidaturas Especiais Aguardando Moderação')}>
                  {t('specialAppsPendingCardTitle', 'Candidaturas Especiais Aguardando Moderação')}
                </span>
                <span className="kpi-value" style={{ color: specialPendingCount > 0 ? '#ef4444' : 'var(--text)' }}>
                  {loadingSpecial ? '...' : specialPendingCount}
                </span>
                <span className="kpi-trend" style={{ color: specialPendingCount > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                  <span>{specialPendingCount > 0 ? `⚠️ ${t('clickToModerate', 'Clique para moderar')}` : `✓ ${t('allClear', 'Em dia')}`}</span>
                </span>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>

            {/* Card 2: Candidaturas Especiais Aprovadas */}
            <div 
              className="kpi-card"
              style={{ cursor: onNavigate ? 'pointer' : 'default' }}
              onClick={() => onNavigate && onNavigate('especiais')}
            >
              <div className="kpi-details" style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="kpi-title text-truncate" title={t('specialAppsApprovedCardTitle', 'Candidaturas Especiais Aprovadas')}>
                  {t('specialAppsApprovedCardTitle', 'Candidaturas Especiais Aprovadas')}
                </span>
                <span className="kpi-value" style={{ color: '#16a34a' }}>
                  {loadingSpecial ? '...' : specialApprovedCount}
                </span>
                <span className="kpi-trend positive">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>{t('totalAssigned', 'Total atribuído')}</span>
                </span>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7" />
                  <polygon points="12 4.5 13.3 7.2 16.2 7.6 14.1 9.7 14.6 12.6 12 11.2 9.4 12.6 9.9 9.7 7.8 7.6 10.7 7.2 12 4.5" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
            </div>

            {/* Card 3: Candidaturas Especiais Recusadas */}
            <div 
              className="kpi-card"
              style={{ cursor: onNavigate ? 'pointer' : 'default' }}
              onClick={() => onNavigate && onNavigate('especiais')}
            >
              <div className="kpi-details" style={{ overflow: 'hidden', minWidth: 0 }}>
                <span className="kpi-title text-truncate" title={t('specialAppsRejectedCardTitle', 'Candidaturas Especiais Recusadas')}>
                  {t('specialAppsRejectedCardTitle', 'Candidaturas Especiais Recusadas')}
                </span>
                <span className="kpi-value" style={{ color: '#64748b' }}>
                  {loadingSpecial ? '...' : specialRejectedCount}
                </span>
                <span className="kpi-trend" style={{ color: 'var(--text-muted)' }}>
                  <span>{t('viewAllSpecialApps', 'Ver todas')}</span>
                </span>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(100, 116, 139, 0.12)', color: '#64748b', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            </div>
          </div>

          {/* Alerts Row */}
          <div className="alert-card-row">
            {/* Alert 1: SLA Dinâmico (Verde / Laranja / Vermelho) */}
            <div 
              className={`custom-alert-card ${
                slaMetrics.status === 'expired' 
                  ? 'danger-alert' 
                  : slaMetrics.status === 'near_expiry' 
                  ? 'warning-alert' 
                  : 'success-alert'
              } cursor-pointer`}
              onClick={() => onNavigate && onNavigate('sla')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onNavigate && onNavigate('sla'); } }}
              title={t('clickToViewSla', 'Clique para aceder à Monitorização de SLA')}
            >
              <div className="alert-card-icon">
                {slaMetrics.status === 'expired' ? (
                  <svg viewBox="0 0 24 24">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ) : slaMetrics.status === 'near_expiry' ? (
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
              </div>
              <div className="alert-card-content">
                <h6>
                  {slaMetrics.status === 'expired'
                    ? t('slaRisk', 'SLA em Risco')
                    : slaMetrics.status === 'near_expiry'
                    ? t('slaNearExpiryTitle', 'SLA Próximo do Limite')
                    : t('slaCompliantTitle', 'SLA em Conformidade')}
                </h6>
                <p>
                  {loadingSla ? (
                    t('loading', 'A carregar...')
                  ) : slaMetrics.status === 'expired' ? (
                    slaMetrics.count === 1 ? (
                      t('slaCardExpiredSingular', '1 pedido de badge com prazo expirado há {{time}} (pendente {{role}})')
                        .replace('{{time}}', slaMetrics.mostCriticalTimeText)
                        .replace('{{role}}', slaMetrics.mostCriticalRole)
                    ) : (
                      t('slaCardExpiredPlural', '{{count}} pedidos de badge em risco (inclui prazos já expirados há {{time}} - pendente {{role}})')
                        .replace('{{count}}', slaMetrics.count)
                        .replace('{{time}}', slaMetrics.mostCriticalTimeText)
                        .replace('{{role}}', slaMetrics.mostCriticalRole)
                    )
                  ) : slaMetrics.status === 'near_expiry' ? (
                    slaMetrics.count === 1 ? (
                      t('slaCardNearExpirySingular', '1 pedido de badge está próximo de vencer (restam {{time}} - pendente {{role}})')
                        .replace('{{time}}', slaMetrics.mostCriticalTimeText)
                        .replace('{{role}}', slaMetrics.mostCriticalRole)
                    ) : (
                      t('slaCardNearExpiryPlural', '{{count}} pedidos de badge estão próximos de vencer (mais urgente: restam {{time}} - pendente {{role}})')
                        .replace('{{count}}', slaMetrics.count)
                        .replace('{{time}}', slaMetrics.mostCriticalTimeText)
                        .replace('{{role}}', slaMetrics.mostCriticalRole)
                    )
                  ) : (
                    t('slaCardCompliantText', 'Todos os pedidos estão em conformidade com os prazos de SLA')
                  )}
                </p>
              </div>
            </div>

            {/* Alert 2: Pedidos Pendentes */}
            <div 
              className={`custom-alert-card ${pendingValidation.total > 0 ? 'danger-alert' : 'success-alert'} cursor-pointer`}
              onClick={() => onNavigate && onNavigate('allapps')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onNavigate && onNavigate('allapps'); } }}
              title={t('clickToViewAllApps', 'Clique para aceder às Candidaturas')}
            >
              <div className="alert-card-icon">
                {pendingValidation.total > 0 ? (
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
              </div>
              <div className="alert-card-content">
                <h6>{pendingValidation.total > 0 ? t('pendingRequests') : t('pendingRequestsOkTitle', 'Pedidos em Dia')}</h6>
                <p>
                  {loadingPendingValidation ? (
                    t('loading', 'A carregar...')
                  ) : pendingValidation.total > 1 ? (
                    t('pendingRequestsCardTextPlural', '{{count}} pedidos de validação aguardam revisão há mais de {{hours}} horas')
                      .replace('{{count}}', pendingValidation.total)
                      .replace('{{hours}}', pendingValidation.horas)
                  ) : pendingValidation.total === 1 ? (
                    t('pendingRequestsCardTextSingular', '1 pedido de validação aguarda revisão há mais de {{hours}} horas')
                      .replace('{{hours}}', pendingValidation.horas)
                  ) : (
                    t('pendingRequestsCardTextNone', 'Nenhum pedido de validação aguarda revisão')
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* SVG Line Chart Card: Consultores Ativos */}
          <div className="chart-card">
            <div className="chart-card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h6 className="chart-card-title mb-0">{t('activeConsultants')}</h6>
                <span className="text-muted small">
                  {t('year', 'Ano')}: <strong>{selectedYear}</strong>
                </span>
              </div>

              {/* Controles e Badges: Dropdown i18n antes da tag Total Geral */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Dropdown de Base de Cálculo */}
                <div className="d-flex align-items-center">
                  <select
                    className="form-select form-select-sm"
                    value={calcMode}
                    onChange={(e) => setCalcMode(e.target.value)}
                    title={t('calcModeTooltip', 'Base de cálculo para a percentagem mensal')}
                    aria-label={t('calcModeTooltip', 'Base de cálculo para a percentagem mensal')}
                    style={{
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      borderColor: 'var(--sidebar-border)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      padding: '4px 28px 4px 10px',
                      borderRadius: '8px',
                      boxShadow: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="total_geral">{t('calcModeTotalGeneral', 'Total Geral')}</option>
                    <option value="total_ano">{t('calcModeTotalAnnual', 'Total Anual')}</option>
                  </select>
                </div>

                {/* Badge Total Geral */}
                <span 
                  className={`badge rounded-pill px-2.5 py-1 small ${
                    calcMode === 'total_geral'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-primary-subtle text-primary border border-primary-subtle'
                  }`}
                  title={t('totalGeneralHelp', 'Total global de utilizadores na base de dados')}
                  style={{ transition: 'all 0.2s ease' }}
                >
                  {t('totalGeneral', 'Total Geral')}: <strong>{totalGeral}</strong>
                </span>

                {/* Badge Ativos no Ano */}
                {totalAtivosAno > 0 && (
                  <span 
                    className={`badge rounded-pill px-2.5 py-1 small ${
                      calcMode === 'total_ano'
                        ? 'bg-success text-white shadow-sm'
                        : 'bg-success-subtle text-success border border-success-subtle'
                    }`}
                    title={t('activeInYearHelp', 'Total de utilizadores ativos no ano selecionado')}
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    {t('activeInYear', 'Ativos em {{year}}').replace('{{year}}', selectedYear)}: <strong>{totalAtivosAno}</strong>
                  </span>
                )}
              </div>
            </div>
            
            <div className="chart-wrapper position-relative" style={{ minHeight: '190px' }}>
              {loadingChart && (
                <div 
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: 'rgba(var(--panel-rgb, 255, 255, 255), 0.55)', zIndex: 2, backdropFilter: 'blur(1px)', borderRadius: '12px' }}
                >
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">{t('loading', 'A carregar...')}</span>
                  </div>
                </div>
              )}

              <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                <defs>
                  {/* Under-the-line gradient area */}
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Dotted Gridlines (0%, 25%, 50%, 75%, 100%) */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, index) => {
                  const yVal = (svgHeight - paddingBottom) - ratio * (svgHeight - paddingTop - paddingBottom);
                  return (
                    <g key={index}>
                      <line 
                        className="chart-grid-line"
                        x1={paddingX} 
                        y1={yVal} 
                        x2={svgWidth - paddingX + 15} 
                        y2={yVal} 
                        strokeDasharray="4,4" 
                      />
                      <text
                        x={paddingX - 6}
                        y={yVal + 3}
                        fontSize="8"
                        fill="var(--text-muted)"
                        textAnchor="end"
                      >
                        {Math.round(ratio * 100)}%
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area under the path */}
                <path d={fillPath} fill="url(#chartGrad)" />

                {/* Main Blue line path */}
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#0284c7" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {points.map((p, idx) => (
                  <g key={idx} className="chart-dot-group" style={{ cursor: 'pointer' }}>
                    <title>
                      {calcMode === 'total_ano'
                        ? `${p.label} / ${selectedYear}: ${p.count} de ${totalAtivosAno} utilizadores no ano (${p.value}%)`
                        : `${p.label} / ${selectedYear}: ${p.count} de ${totalGeral} utilizadores no total (${p.value}%)`}
                    </title>
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={p.count > 0 ? "5" : "3.5"} 
                      fill={p.count > 0 ? "#0284c7" : "var(--panel)"} 
                      stroke={p.count > 0 ? "#ffffff" : "var(--text-muted)"} 
                      strokeWidth={p.count > 0 ? "2" : "1.5"} 
                    />
                    <text 
                      x={p.x} 
                      y={p.y - 9} 
                      fontSize="8.5" 
                      fontWeight={p.count > 0 ? "bold" : "500"} 
                      fill={p.count > 0 ? "var(--text)" : "var(--text-muted)"} 
                      textAnchor="middle"
                    >
                      {p.value}%
                    </text>
                  </g>
                ))}

                {/* X Axis Labels (Months) */}
                {points.map((p, idx) => (
                  <text 
                    key={idx}
                    x={p.x} 
                    y={svgHeight - 6} 
                    fontSize="9.5" 
                    fontWeight="600"
                    fill="var(--text-muted)" 
                    textAnchor="middle"
                  >
                    {p.label}
                  </text>
                ))}
              </svg>
            </div>

            {/* Pagination Controls / Seletor de Ano */}
            <div className="chart-pagination d-flex align-items-center justify-content-center gap-2">
              <button 
                className="chart-pag-btn" 
                onClick={() => setSelectedYear(prev => Math.max(minYear, prev - 1))}
                disabled={selectedYear <= minYear || loadingChart}
                aria-label={t('previousYear', 'Ano anterior')}
                title={t('previousYear', 'Ano anterior')}
              >
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>

              <div className="d-flex align-items-center">
                <select
                  className="form-select form-select-sm fw-bold border-0 bg-transparent text-center cursor-pointer"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  disabled={loadingChart}
                  style={{
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    minWidth: '95px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                  aria-label={t('selectYear', 'Selecionar ano')}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year} style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                className="chart-pag-btn" 
                onClick={() => setSelectedYear(prev => Math.min(maxYear, prev + 1))}
                disabled={selectedYear >= maxYear || loadingChart}
                aria-label={t('nextYear', 'Ano seguinte')}
                title={t('nextYear', 'Ano seguinte')}
              >
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}
