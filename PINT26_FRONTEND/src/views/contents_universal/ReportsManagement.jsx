import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { api } from '../../services/api';
import { useAppContext } from '../../context/AppContext';

// Chart.js registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// High-contrast palettes tailored for Light and Dark modes
const PALETTE_LIGHT = [
  '#0284c7', '#059669', '#d97706', '#7c3aed', '#db2777',
  '#0891b2', '#ea580c', '#4f46e5', '#c026d3', '#16a34a',
  '#2563eb', '#dc2626', '#0d9488', '#b45309', '#4338ca'
];

const PALETTE_DARK = [
  '#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#f472b6',
  '#22d3ee', '#fb923c', '#818cf8', '#e879f9', '#4ade80',
  '#60a5fa', '#f87171', '#2dd4bf', '#f59e0b', '#c084fc'
];

/**
 * Ensures any item color has optimal contrast on the active theme.
 * Replaces colors that are too dark in dark mode or too light in light mode.
 */
function resolveHighContrastColor(hexColor, isDark, fallbackIndex = 0) {
  const palette = isDark ? PALETTE_DARK : PALETTE_LIGHT;
  if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) {
    return palette[fallbackIndex % palette.length];
  }

  let c = hexColor.substring(1);
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return palette[fallbackIndex % palette.length];

  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // In dark mode, if luminance is too low (e.g. black #000000), substitute with vibrant contrast color
  if (isDark && luminance < 0.28) {
    return palette[fallbackIndex % palette.length];
  }

  // In light mode, if luminance is too high (e.g. white #ffffff), substitute with rich contrast color
  if (!isDark && luminance > 0.85) {
    return palette[fallbackIndex % palette.length];
  }

  return hexColor;
}

export default function ReportsManagement() {
  const { t, i18n } = useTranslation();
  const { theme } = useAppContext();
  const isDark = theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark';

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Scope Data for Report 1 (Learning Paths, Service Lines, Areas)
  const [learningPaths, setLearningPaths] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingScopeData, setLoadingScopeData] = useState(false);

  // Fetch scope entities for report 1
  useEffect(() => {
    const fetchScopeData = async () => {
      try {
        setLoadingScopeData(true);
        const [lpRes, slRes, areaRes] = await Promise.all([
          api.get('/learning_path?ativo=true').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/service_line?ativo=true').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/area?ativo=true').catch(() => ({ data: { success: false, data: [] } }))
        ]);
        if (lpRes.data?.success) setLearningPaths(lpRes.data.data || []);
        if (slRes.data?.success) setServiceLines(slRes.data.data || []);
        if (areaRes.data?.success) setAreas(areaRes.data.data || []);
      } catch (err) {
        console.error('Error fetching scope data for reports:', err);
      } finally {
        setLoadingScopeData(false);
      }
    };
    fetchScopeData();
  }, [i18n.language]);

  // Current year & limits
  const currentYear = new Date().getFullYear();
  const yearsList = useMemo(() => {
    const list = [];
    for (let y = currentYear; y >= currentYear - 10; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const monthsList = useMemo(() => [
    { value: '01', label: `01 - ${t('monthJan', 'Jan')}` },
    { value: '02', label: `02 - ${t('monthFeb', 'Fev')}` },
    { value: '03', label: `03 - ${t('monthMar', 'Mar')}` },
    { value: '04', label: `04 - ${t('monthApr', 'Abr')}` },
    { value: '05', label: `05 - ${t('monthMay', 'Mai')}` },
    { value: '06', label: `06 - ${t('monthJun', 'Jun')}` },
    { value: '07', label: `07 - ${t('monthJul', 'Jul')}` },
    { value: '08', label: `08 - ${t('monthAug', 'Ago')}` },
    { value: '09', label: `09 - ${t('monthSep', 'Set')}` },
    { value: '10', label: `10 - ${t('monthOct', 'Out')}` },
    { value: '11', label: `11 - ${t('monthNov', 'Nov')}` },
    { value: '12', label: `12 - ${t('monthDec', 'Dez')}` }
  ], [t, i18n.language]);

  const monthNamesArray = useMemo(() => [
    t('monthJan', 'Jan'),
    t('monthFeb', 'Fev'),
    t('monthMar', 'Mar'),
    t('monthApr', 'Abr'),
    t('monthMay', 'Mai'),
    t('monthJun', 'Jun'),
    t('monthJul', 'Jul'),
    t('monthAug', 'Ago'),
    t('monthSep', 'Set'),
    t('monthOct', 'Out'),
    t('monthNov', 'Nov'),
    t('monthDec', 'Dez')
  ], [t, i18n.language]);

  const getDaysInMonth = (year, month) => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (isNaN(y) || isNaN(m)) return 31;
    return new Date(y, m, 0).getDate();
  };

  // =========================================================================
  // STATE FOR TAB 1: GRÁFICOS INTERATIVOS
  // =========================================================================
  // 1. Gráfico de Barras: Badges por Âmbito (LP | SL | Área)
  const [badgesByScopeFilter, setBadgesByScopeFilter] = useState('area'); // 'lp' | 'sl' | 'area'
  const [badgesByScopeData, setBadgesByScopeData] = useState({ total_geral: 0, itens: [] });
  const [loadingBadgesByScope, setLoadingBadgesByScope] = useState(false);

  useEffect(() => {
    const fetchBadgesByScope = async () => {
      try {
        setLoadingBadgesByScope(true);
        const res = await api.get(`/metricas/badges-atribuidos/distribuicao?agrupar_por=${badgesByScopeFilter}&lang=${i18n.language}`);
        if (res.data?.success && res.data?.data) {
          setBadgesByScopeData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching badges by scope metrics:', err);
      } finally {
        setLoadingBadgesByScope(false);
      }
    };
    fetchBadgesByScope();
  }, [badgesByScopeFilter, i18n.language]);

  // 2. Gráfico de Montanha: Evolução Mensal de Certificados (Conectado à API do Backend)
  const [selectedYearCert, setSelectedYearCert] = useState(String(currentYear));
  const [certificatesMonthlyValues, setCertificatesMonthlyValues] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [certificatesTotalYear, setCertificatesTotalYear] = useState(0);
  const [loadingCertificates, setLoadingCertificates] = useState(false);

  useEffect(() => {
    const fetchCertificatesEvolution = async () => {
      try {
        setLoadingCertificates(true);
        const res = await api.get(`/metricas/certificados/evolucao-mensal?ano=${selectedYearCert}`);
        if (res.data?.success && res.data?.data) {
          setCertificatesMonthlyValues(res.data.data.valores || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
          setCertificatesTotalYear(res.data.data.total_ano || 0);
        }
      } catch (err) {
        console.error('Error fetching certificates evolution:', err);
      } finally {
        setLoadingCertificates(false);
      }
    };
    fetchCertificatesEvolution();
  }, [selectedYearCert, i18n.language]);

  // Mountain Chart Dataset
  const certificatesMountainData = useMemo(() => {
    const primaryColor = isDark ? '#38bdf8' : '#0284c7';
    return {
      labels: monthNamesArray,
      datasets: [
        {
          label: `${t('certificatesEvolutionTitle', 'Evolução de Certificados')} (${selectedYearCert})`,
          data: certificatesMonthlyValues,
          borderColor: primaryColor,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.15)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            if (isDark) {
              gradient.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
              gradient.addColorStop(0.7, 'rgba(56, 189, 248, 0.12)');
              gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
            } else {
              gradient.addColorStop(0, 'rgba(2, 132, 199, 0.40)');
              gradient.addColorStop(0.7, 'rgba(2, 132, 199, 0.10)');
              gradient.addColorStop(1, 'rgba(2, 132, 199, 0.0)');
            }
            return gradient;
          },
          fill: true,
          tension: 0.42,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: primaryColor,
          pointBorderColor: isDark ? '#0f172a' : '#ffffff',
          pointBorderWidth: 2
        }
      ]
    };
  }, [selectedYearCert, monthNamesArray, certificatesMonthlyValues, isDark, t]);

  // 3. Gráfico de Distribuição / Donut Adaptado: LP | SL | Área
  const [distributionScopeFilter, setDistributionScopeFilter] = useState('sl'); // 'lp' | 'sl' | 'area'
  const [distributionScopeData, setDistributionScopeData] = useState({ total_geral: 0, itens: [] });
  const [loadingDistributionScope, setLoadingDistributionScope] = useState(false);

  useEffect(() => {
    const fetchDistributionScope = async () => {
      try {
        setLoadingDistributionScope(true);
        const res = await api.get(`/metricas/badges-atribuidos/distribuicao?agrupar_por=${distributionScopeFilter}&lang=${i18n.language}`);
        if (res.data?.success && res.data?.data) {
          setDistributionScopeData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching distribution scope metrics:', err);
      } finally {
        setLoadingDistributionScope(false);
      }
    };
    fetchDistributionScope();
  }, [distributionScopeFilter, i18n.language]);

  // Bar chart ChartJS Data for Card 1 (with high-contrast colors)
  const barChartData = useMemo(() => {
    const items = badgesByScopeData.itens || [];
    return {
      labels: items.map(i => i.nome),
      datasets: [
        {
          label: t('totalBadgesAwarded', 'Total de Badges Atribuídos'),
          data: items.map(i => i.total),
          backgroundColor: items.map((i, idx) => resolveHighContrastColor(i.cor, isDark, idx)),
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 45
        }
      ]
    };
  }, [badgesByScopeData, isDark, t]);

  // Doughnut ChartJS Data for Card 3 (with high-contrast colors)
  const doughnutChartData = useMemo(() => {
    const items = distributionScopeData.itens || [];
    return {
      labels: items.map(i => i.nome),
      datasets: [
        {
          data: items.map(i => i.total),
          backgroundColor: items.map((i, idx) => resolveHighContrastColor(i.cor, isDark, idx)),
          borderColor: isDark ? '#1e293b' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    };
  }, [distributionScopeData, isDark]);

  // Common Tooltip & Scale Theme Options
  const chartThemeOptions = useMemo(() => ({
    textColor: isDark ? '#cbd5e1' : '#475569',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    tooltipBg: isDark ? '#1e293b' : '#ffffff',
    tooltipTitle: isDark ? '#f8fafc' : '#0f172a',
    tooltipBody: isDark ? '#e2e8f0' : '#334155',
    tooltipBorder: isDark ? '#334155' : '#cbd5e1'
  }), [isDark]);

  // --- STATE FOR TAB 2: CENTRAL DE EXPORTAÇÃO ---
  const [filterType1, setFilterType1] = useState('area');
  const [selectedEntity1, setSelectedEntity1] = useState('');
  const [format1, setFormat1] = useState('pdf');
  const [avatar1, setAvatar1] = useState(true);
  const [logo1, setLogo1] = useState(true);
  const [startYear1, setStartYear1] = useState(String(currentYear));
  const [startMonth1, setStartMonth1] = useState('01');
  const [startDay1, setStartDay1] = useState('01');
  const [endYear1, setEndYear1] = useState(String(currentYear));
  const [endMonth1, setEndMonth1] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [endDay1, setEndDay1] = useState(String(new Date().getDate()).padStart(2, '0'));
  const [loading1, setLoading1] = useState(false);

  const scopeOptions1 = useMemo(() => {
    if (filterType1 === 'lp') {
      return learningPaths.map(lp => ({
        id: lp.id_learning_path,
        name: lp.learning_path || `Learning Path ${lp.id_learning_path}`
      }));
    }
    if (filterType1 === 'sl') {
      return serviceLines.map(sl => ({
        id: sl.id_service_line,
        name: sl.service_line || `Service Line ${sl.id_service_line}`
      }));
    }
    if (filterType1 === 'area') {
      return areas.map(a => ({
        id: a.id_area,
        name: a.area || `Área ${a.id_area}`
      }));
    }
    return [];
  }, [filterType1, learningPaths, serviceLines, areas]);

  const handleFilterTypeChange1 = (newType) => {
    setFilterType1(newType);
    setSelectedEntity1('');
  };

  // Report 2
  const [format2, setFormat2] = useState('pdf');
  const [avatar2, setAvatar2] = useState(true);
  const [logo2, setLogo2] = useState(true);
  const [status2, setStatus2] = useState('6');
  const [loading2, setLoading2] = useState(false);

  // Report 3
  const [format3, setFormat3] = useState('pdf');
  const [logo3, setLogo3] = useState(true);
  const [loading3, setLoading3] = useState(false);

  // Report 4
  const [format4, setFormat4] = useState('pdf');
  const [avatar4, setAvatar4] = useState(true);
  const [loading4, setLoading4] = useState(false);

  const startDaysCount = useMemo(() => getDaysInMonth(startYear1, startMonth1), [startYear1, startMonth1]);
  const endDaysCount = useMemo(() => getDaysInMonth(endYear1, endMonth1), [endYear1, endMonth1]);

  useEffect(() => {
    if (parseInt(startDay1, 10) > startDaysCount) {
      setStartDay1(String(startDaysCount).padStart(2, '0'));
    }
  }, [startDaysCount, startDay1]);

  useEffect(() => {
    if (parseInt(endDay1, 10) > endDaysCount) {
      setEndDay1(String(endDaysCount).padStart(2, '0'));
    }
  }, [endDaysCount, endDay1]);

  // Generic Download Handler
  const handleExportDownload = async ({ endpoint, payload, defaultName, format, setLoading }) => {
    try {
      setLoading(true);
      const response = await api.post(endpoint, payload, {
        responseType: 'blob'
      });

      const disposition = response.headers['content-disposition'];
      let filename = `${defaultName}.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const mimeType = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: t('exportSuccessTitle', 'Relatório Exportado'),
        text: t('exportSuccessText', 'O ficheiro foi gerado e descarregado com sucesso!'),
        timer: 2500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error exporting report:', err);
      let errorMsg = t('exportErrorText', 'Não foi possível gerar o relatório selecionado.');
      
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.message) errorMsg = parsed.message;
        } catch (e) {
          // ignore parsing error
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      Swal.fire({
        icon: 'error',
        title: t('exportErrorTitle', 'Erro na Exportação'),
        text: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport1 = (e) => {
    e.preventDefault();
    if (!filterType1 || !selectedEntity1) {
      Swal.fire({
        icon: 'warning',
        title: t('warningTitle', 'Atenção'),
        text: t('selectScopeRequiredAlert', 'Por favor, selecione o tipo de filtro e a entidade correspondente antes de exportar.')
      });
      return;
    }

    const startDateStr = `${startYear1}-${startMonth1}-${startDay1}`;
    const endDateStr = `${endYear1}-${endMonth1}-${endDay1}`;

    if (new Date(startDateStr).getTime() > new Date(endDateStr).getTime()) {
      Swal.fire({
        icon: 'warning',
        title: t('warningTitle', 'Atenção'),
        text: t('invalidDateRangeAlert', 'A data de início não pode ser posterior à data de fim.')
      });
      return;
    }

    const payload = {
      formato: format1,
      tipo_filtro: filterType1,
      id_filtro: Number(selectedEntity1),
      id_area: filterType1 === 'area' ? Number(selectedEntity1) : undefined,
      id_sl: filterType1 === 'sl' ? Number(selectedEntity1) : undefined,
      id_lp: filterType1 === 'lp' ? Number(selectedEntity1) : undefined,
      data_inicio: startDateStr,
      data_fim: endDateStr,
      logo: format1 === 'pdf' ? logo1 : false,
      avatar: format1 === 'pdf' ? avatar1 : false,
      lang: i18n.language
    };

    handleExportDownload({
      endpoint: '/relatorio/badges-atribuidos',
      payload,
      defaultName: `relatorio_badges_atribuidos_${filterType1}_${selectedEntity1}`,
      format: format1,
      setLoading: setLoading1
    });
  };

  const handleExportReport2 = (e) => {
    e.preventDefault();
    const payload = {
      formato: format2,
      estado: Number(status2),
      logo: format2 === 'pdf' ? logo2 : false,
      avatar: format2 === 'pdf' ? avatar2 : false,
      lang: i18n.language
    };

    handleExportDownload({
      endpoint: '/relatorio/candidaturas',
      payload,
      defaultName: `relatorio_candidaturas_estado_${status2}`,
      format: format2,
      setLoading: setLoading2
    });
  };

  const handleExportReport3 = (e) => {
    e.preventDefault();
    const payload = {
      formato: format3,
      logo: format3 === 'pdf' ? logo3 : false,
      lang: i18n.language
    };

    handleExportDownload({
      endpoint: '/relatorio/badges',
      payload,
      defaultName: 'relatorio_catalogo_badges',
      format: format3,
      setLoading: setLoading3
    });
  };

  const handleExportReport4 = (e) => {
    e.preventDefault();
    const payload = {
      formato: format4,
      avatar: format4 === 'pdf' ? avatar4 : false,
      lang: i18n.language
    };

    handleExportDownload({
      endpoint: '/relatorio/consultores',
      payload,
      defaultName: 'relatorio_consultores',
      format: format4,
      setLoading: setLoading4
    });
  };

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            📊 {t('reportsTitle', 'Relatórios e Estatísticas Gerais')}
          </h3>
          <p className="text-muted small mb-0">
            {t('reportsSubtitle', 'Consulte métricas consolidadas, taxas de conversão de badges e distribuição de competências')}
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="mb-4">
        <ul className="nav nav-pills gap-2 border-bottom pb-3" style={{ borderColor: 'var(--sidebar-border)' }}>
          <li className="nav-item">
            <button
              className={`nav-link rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2 ${activeTab === 'dashboard' ? 'active shadow-sm' : 'text-muted'}`}
              onClick={() => setActiveTab('dashboard')}
              style={{
                backgroundColor: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'dashboard' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <span>📊 {t('tabReportsDashboard', 'Métricas e Estatísticas')}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2 ${activeTab === 'export' ? 'active shadow-sm' : 'text-muted'}`}
              onClick={() => setActiveTab('export')}
              style={{
                backgroundColor: activeTab === 'export' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'export' ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <span>📥 {t('tabReportsExport', 'Exportação de Relatórios')}</span>
            </button>
          </li>
        </ul>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD DE MÉTRICAS & GRÁFICOS */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div>
          {/* 1. TOP MINI KPI CARDS */}
          <div className="kpi-grid mb-4">
            {/* KPI 1 */}
            <div className="kpi-card">
              <div className="kpi-details">
                <span className="kpi-title">{t('completionRate', 'Taxa de Conclusão')}</span>
                <span className="kpi-value">86.4%</span>
                <span className="kpi-trend positive small text-muted">
                  ✓ {t('successfulApplications', 'Candidaturas bem-sucedidas')}
                </span>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <svg viewBox="0 0 24 24">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="kpi-card">
              <div className="kpi-details">
                <span className="kpi-title">{t('responseTimeSla', 'Tempo de Resposta (SLA)')}</span>
                <span className="kpi-value">2.1 {t('days', 'dias')}</span>
                <span className="kpi-trend positive small text-muted">
                  ⚡ {t('auditAverage', 'Média de auditoria')}
                </span>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="kpi-card">
              <div className="kpi-details">
                <span className="kpi-title">{t('activeBadgesCount', 'Badges Ativos')}</span>
                <span className="kpi-value">32 Badges</span>
                <span className="kpi-trend small text-muted">
                  🏷️ {t('registeredInCatalog', 'Registados no catálogo')}
                </span>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: '#fdf2f8', color: '#be185d' }}>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="kpi-card">
              <div className="kpi-details">
                <span className="kpi-title">{t('certifiedConsultants', 'Consultores Certificados')}</span>
                <span className="kpi-value">48 Consultores</span>
                <span className="kpi-trend positive small text-muted">
                  ⭐ {t('activeConsultantsWithBadges', 'Com badges atribuídos')}
                </span>
              </div>
              <div className="kpi-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                <svg viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 1 (NOVO): GRÁFICO DE BARRAS — BADGES POR ÂMBITO (LP | SL | ÁREA) */}
          {/* ========================================================================= */}
          <div className="card border-0 shadow-sm p-4 rounded-4 mb-4" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
                  📊 {t('badgesByScopeTitle', 'Distribuição de Badges por Âmbito')}
                </h5>
                <p className="text-muted small mb-0">
                  {t('badgesByScopeSubtitle', 'Contagem total de qualificações atribuídas agrupadas por Learning Path, Service Line ou Área.')}
                </p>
              </div>

              {/* Dropdown com Texto i18n "Badges por" e opções */}
              <div className="d-flex align-items-center gap-2">
                <span className="small fw-semibold text-muted text-nowrap">
                  {t('badgesByScopeLabel', 'Badges por:')}
                </span>
                <select
                  className="form-select form-select-sm"
                  value={badgesByScopeFilter}
                  onChange={(e) => setBadgesByScopeFilter(e.target.value)}
                  disabled={loadingBadgesByScope}
                  style={{
                    backgroundColor: 'var(--panel-2)',
                    color: 'var(--text)',
                    borderColor: 'var(--sidebar-border)',
                    minWidth: '150px'
                  }}
                >
                  <option value="lp">{t('filterTypeLp', 'Learning Path')}</option>
                  <option value="sl">{t('filterTypeSl', 'Service Line')}</option>
                  <option value="area">{t('filterTypeArea', 'Área')}</option>
                </select>
              </div>
            </div>

            {/* Container do Gráfico com Scroll Horizontal Inteligente */}
            {loadingBadgesByScope ? (
              <div className="d-flex align-items-center justify-content-center py-5">
                <div className="spinner-border text-primary me-2" role="status" />
                <span className="text-muted small">{t('loadingChartData', 'A carregar dados do gráfico...')}</span>
              </div>
            ) : (badgesByScopeData.itens?.length || 0) === 0 ? (
              <div className="text-center py-5 text-muted small">
                {t('noDataForChart', 'Sem dados registados para este âmbito.')}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
                <div
                  style={{
                    minWidth: (badgesByScopeData.itens?.length || 0) > 4
                      ? `${Math.max(650, (badgesByScopeData.itens?.length || 0) * 85)}px`
                      : '100%',
                    height: '320px'
                  }}
                >
                  <Bar
                    data={barChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: chartThemeOptions.tooltipBg,
                          titleColor: chartThemeOptions.tooltipTitle,
                          bodyColor: chartThemeOptions.tooltipBody,
                          borderColor: chartThemeOptions.tooltipBorder,
                          borderWidth: 1,
                          padding: 10,
                          cornerRadius: 8,
                          callbacks: {
                            label: (ctx) => ` ${ctx.raw} ${ctx.raw === 1 ? 'badge' : 'badges'}`
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: {
                            color: chartThemeOptions.textColor,
                            font: { size: 11, weight: '500' },
                            maxRotation: 45,
                            minRotation: 0
                          }
                        },
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: chartThemeOptions.gridColor
                          },
                          ticks: {
                            stepSize: 5,
                            precision: 0,
                            color: chartThemeOptions.textColor,
                            font: { size: 11 }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="row g-4 mb-4">
            {/* ========================================================================= */}
            {/* CARD 2: GRÁFICO DE MONTANHA — EVOLUÇÃO DE CERTIFICADOS (ANO SELECIONADO) */}
            {/* ========================================================================= */}
            <div className="col-12 col-lg-7">
              <div className="card border-0 shadow-sm p-4 rounded-4 h-100" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
                      ⛰️ {t('certificatesEvolutionTitle', 'Evolução de Certificados')}
                    </h5>
                    <p className="text-muted small mb-0">
                      {t('certificatesEvolutionSubtitle', 'Volume mensal de certificados e badges emitidos ao longo do ano selecionado.')}
                      {certificatesTotalYear > 0 && (
                        <span className="badge bg-primary bg-opacity-10 text-primary ms-2 fw-semibold">
                          {t('totalCertificatesInYear', { count: certificatesTotalYear, defaultValue: `Total no ano: ${certificatesTotalYear}` })}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Dropdown de Ano com ano atual + 10 anos anteriores */}
                  <div className="d-flex align-items-center gap-2">
                    <span className="small fw-semibold text-muted text-nowrap">
                      {t('yearSelectLabel', 'Ano:')}
                    </span>
                    <select
                      className="form-select form-select-sm"
                      value={selectedYearCert}
                      onChange={(e) => setSelectedYearCert(e.target.value)}
                      disabled={loadingCertificates}
                      style={{
                        backgroundColor: 'var(--panel-2)',
                        color: 'var(--text)',
                        borderColor: 'var(--sidebar-border)',
                        minWidth: '95px'
                      }}
                    >
                      {yearsList.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mountain / Area Chart */}
                {loadingCertificates ? (
                  <div className="d-flex align-items-center justify-content-center" style={{ height: '280px' }}>
                    <div className="spinner-border text-primary me-2" role="status" />
                    <span className="text-muted small">{t('loadingChartData', 'A carregar dados do gráfico...')}</span>
                  </div>
                ) : (
                  <div style={{ height: '280px', width: '100%' }}>
                    <Line
                      data={certificatesMountainData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          mode: 'index',
                          intersect: false
                        },
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: chartThemeOptions.tooltipBg,
                            titleColor: chartThemeOptions.tooltipTitle,
                            bodyColor: chartThemeOptions.tooltipBody,
                            borderColor: chartThemeOptions.tooltipBorder,
                            borderWidth: 1,
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                              label: (ctx) => ` ${ctx.raw} ${ctx.raw === 1 ? 'certificado' : 'certificados'}`
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: { display: false },
                            ticks: {
                              color: chartThemeOptions.textColor,
                              font: { size: 11, weight: '500' }
                            }
                          },
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: chartThemeOptions.gridColor
                            },
                            ticks: {
                              precision: 0,
                              color: chartThemeOptions.textColor,
                              font: { size: 11 }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* CARD 3: DISTRIBUIÇÃO PERCENTUAL DE BADGES (ADAPTAÇÃO COM DROPDOWN LP|SL|ÁREA) */}
            {/* ========================================================================= */}
            <div className="col-12 col-lg-5">
              <div className="card border-0 shadow-sm p-4 rounded-4 h-100" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
                      🍩 {t('scopeDistributionTitle', 'Distribuição Percentual de Badges')}
                    </h5>
                    <p className="text-muted small mb-0">
                      {t('scopeDistributionSubtitle', 'Proporção e volume de conquistas atribuídas no âmbito selecionado.')}
                    </p>
                  </div>

                  {/* Dropdown de Âmbito (LP | SL | Área) */}
                  <select
                    className="form-select form-select-sm"
                    value={distributionScopeFilter}
                    onChange={(e) => setDistributionScopeFilter(e.target.value)}
                    disabled={loadingDistributionScope}
                    style={{
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text)',
                      borderColor: 'var(--sidebar-border)',
                      minWidth: '135px'
                    }}
                  >
                    <option value="lp">{t('filterTypeLp', 'Learning Path')}</option>
                    <option value="sl">{t('filterTypeSl', 'Service Line')}</option>
                    <option value="area">{t('filterTypeArea', 'Área')}</option>
                  </select>
                </div>

                {loadingDistributionScope ? (
                  <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="spinner-border text-primary me-2" role="status" />
                    <span className="text-muted small">{t('loadingChartData', 'A carregar dados do gráfico...')}</span>
                  </div>
                ) : (distributionScopeData.itens?.length || 0) === 0 ? (
                  <div className="text-center py-5 text-muted small">
                    {t('noDataForChart', 'Sem dados registados para este âmbito.')}
                  </div>
                ) : (
                  <div>
                    {/* Doughnut Chart Canvas */}
                    <div className="d-flex justify-content-center my-2" style={{ height: '170px' }}>
                      <Doughnut
                        data={doughnutChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: chartThemeOptions.tooltipBg,
                              titleColor: chartThemeOptions.tooltipTitle,
                              bodyColor: chartThemeOptions.tooltipBody,
                              borderColor: chartThemeOptions.tooltipBorder,
                              borderWidth: 1,
                              padding: 10,
                              cornerRadius: 8,
                              callbacks: {
                                label: (ctx) => ` ${ctx.label}: ${ctx.raw} (${distributionScopeData.itens[ctx.dataIndex]?.percentagem || 0}%)`
                              }
                            }
                          },
                          cutout: '72%'
                        }}
                      />
                    </div>

                    {/* Breakdown List with Progress Bars */}
                    <div className="d-flex flex-column gap-2 mt-3" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {distributionScopeData.itens.map((item, idx) => {
                        const color = resolveHighContrastColor(item.cor, isDark, idx);
                        return (
                          <div key={item.id || idx}>
                            <div className="d-flex justify-content-between small fw-semibold mb-1" style={{ color: 'var(--text)' }}>
                              <span className="text-truncate me-2" style={{ maxWidth: '70%' }}>
                                <span
                                  className="me-2"
                                  style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: color
                                  }}
                                />
                                {item.nome}
                              </span>
                              <span className="text-muted text-nowrap">{item.percentagem}% ({item.total})</span>
                            </div>
                            <div className="progress" style={{ height: '6px', backgroundColor: 'var(--panel-2)', borderRadius: '3px' }}>
                              <div
                                className="progress-bar"
                                style={{
                                  width: `${item.percentagem}%`,
                                  backgroundColor: color,
                                  borderRadius: '3px'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CENTRAL DE EXPORTAÇÃO DE RELATÓRIOS (PDF / EXCEL) */}
      {/* ========================================================================= */}
      {activeTab === 'export' && (
        <div>
          <div className="card border-0 shadow-sm p-4 rounded-4 mb-4" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
            <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
              📥 {t('reportsExportTitle', 'Central de Exportação de Relatórios')}
            </h5>
            <p className="text-muted small mb-0">
              {t('reportsExportSubtitle', 'Gere e descarregue relatórios oficiais em formato PDF ou Excel (XLSX) com filtros personalizados.')}
            </p>
          </div>

          <div className="row g-4">
            {/* ------------------------------------------------------------- */}
            {/* CARD 1: Badges Atribuídos por Âmbito (LP | SL | Área) e Período */}
            {/* ------------------------------------------------------------- */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm p-4 rounded-4 h-100 d-flex flex-column justify-content-between position-relative" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                <form onSubmit={handleExportReport1} className="d-flex flex-column h-100">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary" style={{ width: '38px', height: '38px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🏆</span>
                      </div>
                      <h5 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>
                        {t('report1Title', 'Badges Atribuídos por Âmbito e Período')}
                      </h5>
                    </div>
                    <p className="text-muted small mb-3">
                      {t('report1Desc', 'Listagem detalhada de badges conquistados pelos consultores num intervalo de datas específico por Learning Path, Service Line ou Área.')}
                    </p>

                    {/* Dropdown 1: Tipo de Filtro (LP | SL | Área) */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold" style={{ color: 'var(--text)' }}>
                        {t('filterTypeLabel', 'Tipo de Filtro:')} <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={filterType1}
                        onChange={(e) => handleFilterTypeChange1(e.target.value)}
                        required
                        disabled={loadingScopeData}
                        style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                      >
                        <option value="">{t('selectFilterTypePlaceholder', 'Selecione o tipo...')}</option>
                        <option value="lp">{t('filterTypeLp', 'Learning Path')}</option>
                        <option value="sl">{t('filterTypeSl', 'Service Line')}</option>
                        <option value="area">{t('filterTypeArea', 'Área')}</option>
                      </select>
                    </div>

                    {/* Dropdown 2: Entidade Selecionada */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold" style={{ color: 'var(--text)' }}>
                        {filterType1 === 'lp' ? t('filterTypeLp', 'Learning Path') : filterType1 === 'sl' ? t('filterTypeSl', 'Service Line') : t('selectAreaLabel', 'Área Tecnológica:')} <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={selectedEntity1}
                        onChange={(e) => setSelectedEntity1(e.target.value)}
                        required
                        disabled={loadingScopeData || !filterType1}
                        style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                      >
                        <option value="">
                          {!filterType1 
                            ? t('selectEntityFirstPlaceholder', 'Selecione primeiro o tipo...') 
                            : t('selectEntityPlaceholder', 'Selecione a opção...')}
                        </option>
                        {scopeOptions1.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Data Início (Ano, Mês, Dia) */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                        {t('dateStartLabel', 'Data de Início:')}
                      </label>
                      <div className="row g-1">
                        <div className="col-4">
                          <select
                            className="form-select form-select-sm"
                            value={startYear1}
                            onChange={(e) => setStartYear1(e.target.value)}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          >
                            {yearsList.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-4">
                          <select
                            className="form-select form-select-sm"
                            value={startMonth1}
                            onChange={(e) => setStartMonth1(e.target.value)}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          >
                            {monthsList.map((m) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-4">
                          <select
                            className="form-select form-select-sm"
                            value={startDay1}
                            onChange={(e) => setStartDay1(e.target.value)}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          >
                            {Array.from({ length: startDaysCount }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Data Fim (Ano, Mês, Dia) */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                        {t('dateEndLabel', 'Data de Fim:')}
                      </label>
                      <div className="row g-1">
                        <div className="col-4">
                          <select
                            className="form-select form-select-sm"
                            value={endYear1}
                            onChange={(e) => setEndYear1(e.target.value)}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          >
                            {yearsList.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-4">
                          <select
                            className="form-select form-select-sm"
                            value={endMonth1}
                            onChange={(e) => setEndMonth1(e.target.value)}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          >
                            {monthsList.map((m) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-4">
                          <select
                            className="form-select form-select-sm"
                            value={endDay1}
                            onChange={(e) => setEndDay1(e.target.value)}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          >
                            {Array.from({ length: endDaysCount }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Formato & Opções Visuais */}
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-bold" style={{ color: 'var(--text)' }}>
                          {t('exportFormatLabel', 'Formato do Ficheiro:')}
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={format1}
                          onChange={(e) => setFormat1(e.target.value)}
                          style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                        >
                          <option value="pdf">📄 {t('formatPdfOption', 'Documento PDF (.pdf)')}</option>
                          <option value="xlsx">📊 {t('formatXlsxOption', 'Folha Excel (.xlsx)')}</option>
                        </select>
                      </div>

                      {format1 === 'pdf' && (
                        <div className="col-12 col-sm-6 d-flex flex-column justify-content-center">
                          <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                            {t('pdfVisualOptionsLabel', 'Opções Visuais (PDF):')}
                          </label>
                          <div className="d-flex gap-3">
                            <div className="form-check form-check-inline mb-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="avatar1"
                                checked={avatar1}
                                onChange={(e) => setAvatar1(e.target.checked)}
                              />
                              <label className="form-check-label small" htmlFor="avatar1">
                                Avatar
                              </label>
                            </div>
                            <div className="form-check form-check-inline mb-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="logo1"
                                checked={logo1}
                                onChange={(e) => setLogo1(e.target.checked)}
                              />
                              <label className="form-check-label small" htmlFor="logo1">
                                Logo
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-top" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                      disabled={loading1}
                      style={{ borderRadius: '8px' }}
                    >
                      {loading1 ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status" />
                          <span>{t('exportingBtn', 'A gerar relatório...')}</span>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>{t('exportBtn', 'Exportar Relatório')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CARD 2: Relatório de Candidaturas */}
            {/* ------------------------------------------------------------- */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm p-4 rounded-4 h-100 d-flex flex-column justify-content-between position-relative" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                <form onSubmit={handleExportReport2} className="d-flex flex-column h-100">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center bg-info bg-opacity-10 text-info" style={{ width: '38px', height: '38px' }}>
                        <span style={{ fontSize: '1.2rem' }}>📝</span>
                      </div>
                      <h5 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>
                        {t('report2Title', 'Relatório de Candidaturas')}
                      </h5>
                    </div>
                    <p className="text-muted small mb-3">
                      {t('report2Desc', 'Auditoria e acompanhamento de todas as candidaturas submetidas, filtradas pelo estado do fluxo de aprovação.')}
                    </p>

                    <div className="mb-3">
                      <label className="form-label small fw-bold" style={{ color: 'var(--text)' }}>
                        {t('selectStatusLabel', 'Estado da Candidatura:')}
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={status2}
                        onChange={(e) => setStatus2(e.target.value)}
                        style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                      >
                        <option value="6">{t('allStatusesOption', 'Todos os Estados (Geral)')}</option>
                        <option value="1">1 - {t('statusDraftOption', 'Rascunho (Draft)')}</option>
                        <option value="2">2 - {t('statusSubmittedOption', 'Submetida (Em Análise TM)')}</option>
                        <option value="3">3 - {t('statusValidationOption', 'Em Validação (Auditoria SLL)')}</option>
                        <option value="4">4 - {t('statusApprovedOption', 'Aprovada (Atribuída com Sucesso)')}</option>
                        <option value="5">5 - {t('statusRejectedOption', 'Rejeitada')}</option>
                      </select>
                    </div>

                    {/* Formato & Opções Visuais */}
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-bold" style={{ color: 'var(--text)' }}>
                          {t('exportFormatLabel', 'Formato do Ficheiro:')}
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={format2}
                          onChange={(e) => setFormat2(e.target.value)}
                          style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                        >
                          <option value="pdf">📄 {t('formatPdfOption', 'Documento PDF (.pdf)')}</option>
                          <option value="xlsx">📊 {t('formatXlsxOption', 'Folha Excel (.xlsx)')}</option>
                        </select>
                      </div>

                      {format2 === 'pdf' && (
                        <div className="col-12 col-sm-6 d-flex flex-column justify-content-center">
                          <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                            {t('pdfVisualOptionsLabel', 'Opções Visuais (PDF):')}
                          </label>
                          <div className="d-flex gap-3">
                            <div className="form-check form-check-inline mb-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="avatar2"
                                checked={avatar2}
                                onChange={(e) => setAvatar2(e.target.checked)}
                              />
                              <label className="form-check-label small" htmlFor="avatar2">
                                Avatar
                              </label>
                            </div>
                            <div className="form-check form-check-inline mb-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="logo2"
                                checked={logo2}
                                onChange={(e) => setLogo2(e.target.checked)}
                              />
                              <label className="form-check-label small" htmlFor="logo2">
                                Logo
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-top" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                      disabled={loading2}
                      style={{ borderRadius: '8px' }}
                    >
                      {loading2 ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status" />
                          <span>{t('exportingBtn', 'A gerar relatório...')}</span>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>{t('exportBtn', 'Exportar Relatório')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CARD 3: Catálogo Geral de Badges */}
            {/* ------------------------------------------------------------- */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm p-4 rounded-4 h-100 d-flex flex-column justify-content-between position-relative" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                <form onSubmit={handleExportReport3} className="d-flex flex-column h-100">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center bg-warning bg-opacity-10 text-warning" style={{ width: '38px', height: '38px', color: '#b45309' }}>
                        <span style={{ fontSize: '1.2rem' }}>🏷️</span>
                      </div>
                      <h5 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>
                        {t('report3Title', 'Catálogo Geral de Badges')}
                      </h5>
                    </div>
                    <p className="text-muted small mb-3">
                      {t('report3Desc', 'Exportação completa do catálogo de qualificações, níveis, competências, pontos e critérios de expiração.')}
                    </p>

                    {/* Formato & Opções Visuais */}
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-bold" style={{ color: 'var(--text)' }}>
                          {t('exportFormatLabel', 'Formato do Ficheiro:')}
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={format3}
                          onChange={(e) => setFormat3(e.target.value)}
                          style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                        >
                          <option value="pdf">📄 {t('formatPdfOption', 'Documento PDF (.pdf)')}</option>
                          <option value="xlsx">📊 {t('formatXlsxOption', 'Folha Excel (.xlsx)')}</option>
                        </select>
                      </div>

                      {format3 === 'pdf' && (
                        <div className="col-12 col-sm-6 d-flex flex-column justify-content-center">
                          <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                            {t('pdfVisualOptionsLabel', 'Opções Visuais (PDF):')}
                          </label>
                          <div className="form-check mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="logo3"
                              checked={logo3}
                              onChange={(e) => setLogo3(e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor="logo3">
                              {t('includeLogoCheck', 'Incluir logotipo do badge')}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-top" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                      disabled={loading3}
                      style={{ borderRadius: '8px' }}
                    >
                      {loading3 ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status" />
                          <span>{t('exportingBtn', 'A gerar relatório...')}</span>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>{t('exportBtn', 'Exportar Relatório')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CARD 4: Relatório Geral de Consultores */}
            {/* ------------------------------------------------------------- */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-sm p-4 rounded-4 h-100 d-flex flex-column justify-content-between position-relative" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                <form onSubmit={handleExportReport4} className="d-flex flex-column h-100">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success" style={{ width: '38px', height: '38px' }}>
                        <span style={{ fontSize: '1.2rem' }}>👥</span>
                      </div>
                      <h5 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>
                        {t('report4Title', 'Relatório Geral de Consultores')}
                      </h5>
                    </div>
                    <p className="text-muted small mb-3">
                      {t('report4Desc', 'Ficha consolidada dos consultores ativos com histórico de badges conquistados e pontuação acumulada.')}
                    </p>

                    {/* Formato & Opções Visuais */}
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-bold" style={{ color: 'var(--text)' }}>
                          {t('exportFormatLabel', 'Formato do Ficheiro:')}
                        </label>
                        <select
                          className="form-select form-select-sm"
                          value={format4}
                          onChange={(e) => setFormat4(e.target.value)}
                          style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                        >
                          <option value="pdf">📄 {t('formatPdfOption', 'Documento PDF (.pdf)')}</option>
                          <option value="xlsx">📊 {t('formatXlsxOption', 'Folha Excel (.xlsx)')}</option>
                        </select>
                      </div>

                      {format4 === 'pdf' && (
                        <div className="col-12 col-sm-6 d-flex flex-column justify-content-center">
                          <label className="form-label small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                            {t('pdfVisualOptionsLabel', 'Opções Visuais (PDF):')}
                          </label>
                          <div className="form-check mb-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="avatar4"
                              checked={avatar4}
                              onChange={(e) => setAvatar4(e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor="avatar4">
                              {t('includeAvatarCheck', 'Incluir foto do consultor (Avatar)')}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-top" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <button
                      type="submit"
                      className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                      disabled={loading4}
                      style={{ borderRadius: '8px' }}
                    >
                      {loading4 ? (
                        <>
                          <div className="spinner-border spinner-border-sm" role="status" />
                          <span>{t('exportingBtn', 'A gerar relatório...')}</span>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>{t('exportBtn', 'Exportar Relatório')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
