import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function HomeAdmin() {
  const { t } = useTranslation();

  // Stateful interactions to make the dashboard feel "alive"
  const [selectedDay, setSelectedDay] = useState(25);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0); // 0 = Nov 2025, -1 = Oct 2025, 1 = Dec 2025
  const [chartPage, setChartPage] = useState(20); // paginator: 20 / 55
  const [activityTab, setActivityTab] = useState('week'); // day, week, month

  // Chart data simulation depending on chartPage state
  const chartData = useMemo(() => {
    const base = [50, 56, 60, 63, 68, 71, 74, 78, 81, 84, 86];
    const offset = (chartPage - 20) * 0.5;
    return base.map(val => Math.min(100, Math.max(0, Math.round(val + offset))));
  }, [chartPage]);

  // SVG Line Chart calculations
  const svgWidth = 560;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  const points = useMemo(() => {
    const count = chartData.length;
    const stepX = (svgWidth - paddingX * 2) / (count - 1);
    const rangeY = svgHeight - paddingY * 2;
    
    return chartData.map((val, idx) => {
      const x = paddingX + idx * stepX;
      // y=0 in SVG is top, so we subtract from height
      const percentOfRange = (val - 25) / 75; // assume min value is 25%, max is 100%
      const y = svgHeight - paddingY - percentOfRange * rangeY;
      return { x, y, value: val };
    });
  }, [chartData]);

  const linePath = useMemo(() => {
    if (!points.length) return '';
    return points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
    }, '');
  }, [points]);

  const fillPath = useMemo(() => {
    if (!points.length) return '';
    const startX = points[0].x;
    const endX = points[points.length - 1].x;
    return `${linePath} L ${endX},${svgHeight - paddingY} L ${startX},${svgHeight - paddingY} Z`;
  }, [points, linePath]);

  // Activity SVG Bar chart data simulation based on selected tab
  const barHeights = useMemo(() => {
    if (activityTab === 'day') return [85, 45, 90, 110, 65, 30];
    if (activityTab === 'month') return [60, 75, 80, 95, 110, 115];
    return [50, 80, 110, 65, 95, 45]; // default 'week'
  }, [activityTab]);

  // Calendar generation for November 2025 (offset = 0)
  const calendarData = useMemo(() => {
    // Offset 0 = November 2025
    // Offset -1 = October 2025
    // Offset 1 = December 2025
    const months = [
      { name: 'October 2025', days: 31, startOffset: 3 }, // starts on Wed
      { name: 'November 2025', days: 30, startOffset: 6 }, // starts on Sat
      { name: 'December 2025', days: 31, startOffset: 1 }  // starts on Mon
    ];
    
    const idx = currentMonthOffset + 1; // map -1,0,1 to 0,1,2
    const target = months[idx] || months[1];
    
    const dayCells = [];
    // Add empty spacer cells for calendar start offset
    for (let i = 0; i < target.startOffset; i++) {
      dayCells.push({ value: '', isEmpty: true });
    }
    // Add actual days
    for (let d = 1; d <= target.days; d++) {
      dayCells.push({ value: d, isEmpty: false });
    }
    
    return { name: target.name, cells: dayCells };
  }, [currentMonthOffset]);

  // Standard labels for months matching points
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

  return (
    <div className="dashboard-left-right-wrapper">
      {/* Title block */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1">{t('dashboard')}</h3>
        <p className="text-muted small mb-0">{t('viewDashboard')}</p>
      </div>

      <div className="dashboard-grid">
        {/* Main 2/3 Dashboard Area */}
        <div className="dashboard-left">
          
          {/* KPI Cards row */}
          <div className="kpi-grid">
            {/* Card 1: Utilizadores Registados */}
            <div className="kpi-card">
              <div className="kpi-details">
                <span className="kpi-title">{t('registeredUsers')}</span>
                <span className="kpi-value">1,247</span>
                <span className="kpi-trend positive">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>+12% {t('vsPreviousMonth')}</span>
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
            <div className="kpi-card">
              <div className="kpi-details">
                <span className="kpi-title">{t('totalBadges')}</span>
                <span className="kpi-value">3,892</span>
                <span className="kpi-trend positive">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>+8% {t('vsPreviousMonth')}</span>
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

          {/* Alerts Row */}
          <div className="alert-card-row">
            {/* Alert 1: SLA em Risco */}
            <div className="custom-alert-card danger-alert">
              <div className="alert-card-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="alert-card-content">
                <h6>{t('slaRisk')}</h6>
                <p>3 pedidos de badge estão próximos de exceder o prazo de 7 dias</p>
              </div>
            </div>

            {/* Alert 2: Pedidos Pendentes */}
            <div className="custom-alert-card neutral-alert">
              <div className="alert-card-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="alert-card-content">
                <h6>{t('pendingRequests')}</h6>
                <p>7 pedidos de validação aguardam revisão há mais de 5 dias</p>
              </div>
            </div>
          </div>

          {/* SVG Line Chart Card */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h6 className="chart-card-title">{t('activeConsultants')}</h6>
            </div>
            
            <div className="chart-wrapper">
              <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                <defs>
                  {/* Under-the-line gradient area */}
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Dotted Gridlines */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio, index) => {
                  const yVal = paddingY + ratio * (svgHeight - paddingY * 2);
                  return (
                    <line 
                      key={index}
                      x1={paddingX} 
                      y1={yVal} 
                      x2={svgWidth - paddingX} 
                      y2={yVal} 
                      stroke="var(--sidebar-border)" 
                      strokeDasharray="4,4" 
                    />
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
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="5" 
                      fill="#0284c7" 
                      stroke="#ffffff" 
                      strokeWidth="2" 
                    />
                    <text 
                      x={p.x} 
                      y={p.y - 10} 
                      fontSize="9" 
                      fontWeight="bold" 
                      fill="var(--text)" 
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
                    y={svgHeight - 4} 
                    fontSize="9.5" 
                    fontWeight="600"
                    fill="var(--text-muted)" 
                    textAnchor="middle"
                  >
                    {monthLabels[idx]}
                  </text>
                ))}
              </svg>
            </div>

            {/* Pagination Controls */}
            <div className="chart-pagination">
              <button 
                className="chart-pag-btn" 
                onClick={() => setChartPage(prev => Math.max(1, prev - 1))}
                aria-label="Previous page"
              >
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <span className="chart-pag-info">{chartPage} / 55</span>
              <button 
                className="chart-pag-btn" 
                onClick={() => setChartPage(prev => Math.min(55, prev + 1))}
                aria-label="Next page"
              >
                <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1/3 Side Panels */}
        <div className="dashboard-right">
          
          {/* Calendar Widget Card */}
          <div className="calendar-card">
            <div className="calendar-header">
              <h6 className="calendar-title">{t('calendarTitle')}</h6>
              <div className="calendar-month-nav">
                <button 
                  className="chart-pag-btn" 
                  style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                  onClick={() => setCurrentMonthOffset(prev => Math.max(-1, prev - 1))}
                  disabled={currentMonthOffset === -1}
                >
                  <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <span className="calendar-month-title mx-1">{calendarData.name}</span>
                <button 
                  className="chart-pag-btn" 
                  style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                  onClick={() => setCurrentMonthOffset(prev => Math.min(1, prev + 1))}
                  disabled={currentMonthOffset === 1}
                >
                  <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>

            <div className="calendar-grid">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                <div key={i} className="calendar-weekday">{d}</div>
              ))}
              
              {calendarData.cells.map((cell, idx) => {
                const isActive = !cell.isEmpty && cell.value === selectedDay;
                return (
                  <div
                    key={idx}
                    className={`calendar-day ${cell.isEmpty ? 'empty' : ''} ${isActive ? 'active' : ''}`}
                    onClick={() => !cell.isEmpty && setSelectedDay(cell.value)}
                  >
                    {cell.value}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Widget Card */}
          <div className="activity-card">
            <div className="activity-header">
              <h6 className="activity-title">{t('activityTitle')}</h6>
              <div className="activity-tabs">
                <button 
                  className={`activity-tab ${activityTab === 'day' ? 'active' : ''}`}
                  onClick={() => setActivityTab('day')}
                >
                  {t('dayLabel')}
                </button>
                <button 
                  className={`activity-tab ${activityTab === 'week' ? 'active' : ''}`}
                  onClick={() => setActivityTab('week')}
                >
                  {t('weekLabel')}
                </button>
                <button 
                  className={`activity-tab ${activityTab === 'month' ? 'active' : ''}`}
                  onClick={() => setActivityTab('month')}
                >
                  {t('monthLabel')}
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-center py-2">
              <svg width="240" height="120" viewBox="0 0 240 120">
                {/* Dotted Grid lines */}
                <line x1="10" y1="30" x2="230" y2="30" stroke="var(--sidebar-border)" strokeDasharray="3,3" />
                <line x1="10" y1="70" x2="230" y2="70" stroke="var(--sidebar-border)" strokeDasharray="3,3" />
                <line x1="10" y1="110" x2="230" y2="110" stroke="var(--sidebar-border)" strokeDasharray="3,3" />

                {/* Render vertical bars with state values */}
                {barHeights.map((h, idx) => {
                  const barWidth = 16;
                  const gap = 22;
                  const startX = 20 + idx * (barWidth + gap);
                  const y = 110 - h * 0.8; // scale height
                  const height = h * 0.8;
                  const isActive = idx === 2; // middle bar is highlighted
                  
                  return (
                    <rect
                      key={idx}
                      x={startX}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx="3"
                      fill={isActive ? '#0284c7' : 'var(--text-muted)'}
                      opacity={isActive ? 1 : 0.25}
                      style={{ transition: 'all 0.3s ease' }}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}