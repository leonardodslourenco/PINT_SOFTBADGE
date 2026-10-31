import Swal from 'sweetalert2';

export default function ReportsAdmin() {
  const handleExport = (format) => {
    Swal.fire({
      icon: 'success',
      title: `Exportação Iniciada`,
      text: `O relatório estatístico completo foi gerado e exportado com sucesso no formato ${format}!`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  const chartDataMonth = [
    { label: 'Jan', value: 12, height: '40%' },
    { label: 'Fev', value: 18, height: '55%' },
    { label: 'Mar', value: 25, height: '75%' },
    { label: 'Abr', value: 15, height: '48%' },
    { label: 'Mai', value: 30, height: '90%' },
    { label: 'Jun', value: 22, height: '68%' },
    { label: 'Jul', value: 35, height: '100%' }
  ];

  const levelsDistribution = [
    { level: 'Bronze', count: 45, pct: 45, color: '#cd7f32' },
    { level: 'Silver', count: 32, pct: 32, color: '#c0c0c0' },
    { level: 'Gold', count: 18, pct: 18, color: '#ffd700' },
    { level: 'Platinum', count: 5, pct: 5, color: '#e5e4e2' }
  ];

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Relatórios e Estatísticas Gerais</h3>
          <p className="text-muted small mb-0">Consulte métricas consolidadas, taxas de conversão de badges e distribuição de competências (Etapa 5)</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary fw-semibold btn-sm px-3" onClick={() => handleExport('PDF')} style={{ borderRadius: '8px' }}>
            Exportar PDF
          </button>
          <button className="btn btn-outline-secondary fw-semibold btn-sm px-3" onClick={() => handleExport('Excel')} style={{ borderRadius: '8px' }}>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid mb-4">
        {/* KPI 1 */}
        <div className="kpi-card">
          <div className="kpi-details">
            <span className="kpi-title">Taxa de Conclusão</span>
            <span className="kpi-value">84.2%</span>
            <span className="kpi-trend positive small text-muted">Candidaturas bem-sucedidas</span>
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
            <span className="kpi-title">Tempo de Resposta (SLA)</span>
            <span className="kpi-value">2.4 dias</span>
            <span className="kpi-trend positive small text-muted">Média de auditoria</span>
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
            <span className="kpi-title">Badges Ativos</span>
            <span className="kpi-value">28 badges</span>
            <span className="kpi-trend small text-muted">Registados no catálogo</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: '#fdf2f8', color: '#be185d' }}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Monthly Chart Bar */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
            <h5 className="fw-bold mb-3">Badges Emitidos (Evolução Mensal)</h5>
            <p className="text-muted small mb-4">Total de badges aprovados e entregues por mês em todas as linhas de serviço.</p>
            
            {/* Chart Area */}
            <div className="d-flex align-items-end justify-content-between pt-4 border-bottom" style={{ height: '240px', paddingBottom: '12px' }}>
              {chartDataMonth.map((bar, idx) => (
                <div key={idx} className="d-flex flex-column align-items-center flex-grow-1" style={{ maxWidth: '60px' }}>
                  <span className="small text-dark fw-bold mb-2">{bar.value}</span>
                  <div 
                    className="w-100 rounded-top" 
                    style={{ 
                      height: bar.height, 
                      backgroundImage: 'linear-gradient(to top, #0ea5e9, #0284c7)',
                      minHeight: '10px',
                      transition: 'height 0.5s ease'
                    }}
                  />
                  <span className="small text-muted mt-2">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Competences Level distribution */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white h-100">
            <h5 className="fw-bold mb-3">Distribuição por Nível</h5>
            <p className="text-muted small mb-3">Número de Badges ativos de acordo com a complexidade/grau de qualificação.</p>

            <div className="d-flex flex-column gap-3 mt-2">
              {levelsDistribution.map((level, idx) => (
                <div key={idx}>
                  <div className="d-flex justify-content-between text-dark small fw-semibold mb-1">
                    <span>
                      <span className="me-2" style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: level.color }} />
                      Nível {level.level}
                    </span>
                    <span>{level.pct}% ({level.count})</span>
                  </div>
                  <div className="progress" style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${level.pct}%`, 
                        backgroundColor: level.color,
                        borderRadius: '4px'
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
