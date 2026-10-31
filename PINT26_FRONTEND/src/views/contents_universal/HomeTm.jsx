import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../services/api';
import ListagemPreApproval from '../../components/ListagemPreApproval';

export default function HomeTm({ onNavigate }) {
    const { t } = useTranslation();
    const { socket } = useAppContext();
    const [loading, setLoading] = useState(true);

    // Adjusted TM Dashboard KPIs
    const [metrics, setMetrics] = useState({
        pendingPreApprovals: 0,
        validatedToday: 0,
        avgResponseTime: '—',
        slaCompliance: '100%'
    });

    const fetchDashboardMetrics = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const res = await api.get('/metricas/dashboard/tm');
            if (res.data?.success && res.data.data) {
                setMetrics({
                    pendingPreApprovals: res.data.data.pendingPreApprovals ?? 0,
                    validatedToday: res.data.data.validatedToday ?? 0,
                    avgResponseTime: res.data.data.avgResponseTime || '—',
                    slaCompliance: res.data.data.slaCompliance || '100%'
                });
            }
        } catch (err) {
            console.error('Error loading TM Dashboard metrics:', err);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    const handlePreApprovalDataLoaded = useCallback((count) => {
        setMetrics(prev => (prev.pendingPreApprovals === count ? prev : { ...prev, pendingPreApprovals: count }));
    }, []);

    useEffect(() => {
        fetchDashboardMetrics(false);
    }, [fetchDashboardMetrics]);

    // Real-time WebSocket updates (silent re-fetch)
    useEffect(() => {
        if (!socket) return;
        const handleUpdate = () => {
            setTimeout(() => fetchDashboardMetrics(true), 400);
        };
        socket.on('candidatura_submetida', handleUpdate);
        socket.on('candidatura_pre_aprovada', handleUpdate);
        socket.on('candidatura_avancou', handleUpdate);
        return () => {
            socket.off('candidatura_submetida', handleUpdate);
            socket.off('candidatura_pre_aprovada', handleUpdate);
            socket.off('candidatura_avancou', handleUpdate);
        };
    }, [socket, fetchDashboardMetrics]);

    return (
        <div className="users-admin-container">
            {/* Grid of 4 Figma Dashboard Minicards */}
            <div className="row g-3 mb-4">
                {/* Card 1: Pending Validations */}
                <div className="col-12 col-sm-6 col-xl-3" onClick={() => onNavigate && onNavigate('pre')} style={{ cursor: onNavigate ? 'pointer' : 'default' }}>
                    <div className="card h-100 shadow-sm border rounded-4 p-3 d-flex flex-row align-items-center gap-3 hover-shadow-transition" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                        <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', width: '56px', height: '56px' }}>
                            <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-muted small fw-semibold d-block">{t('pendingPreApprovalsMetric', 'Validações Pendentes')}</span>
                            <h3 className="fw-bold mb-0 mt-0.5" style={{ color: 'var(--text)' }}>
                                {loading ? '...' : metrics.pendingPreApprovals}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Card 2: Validated Today */}
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card h-100 shadow-sm border rounded-4 p-3 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                        <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '56px', height: '56px' }}>
                            <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-muted small fw-semibold d-block">{t('validatedTodayMetric', 'Validados Hoje')}</span>
                            <h3 className="fw-bold mb-0 mt-0.5" style={{ color: 'var(--text)' }}>
                                {loading ? '...' : metrics.validatedToday}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Card 3: Average Response Time */}
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card h-100 shadow-sm border rounded-4 p-3 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                        <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '56px', height: '56px' }}>
                            <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-muted small fw-semibold d-block">{t('avgResponseTimeMetric', 'Tempo Médio Resposta')}</span>
                            <h3 className="fw-bold mb-0 mt-0.5" style={{ color: 'var(--text)' }}>
                                {loading ? '...' : metrics.avgResponseTime}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Card 4: SLA Compliance */}
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card h-100 shadow-sm border rounded-4 p-3 d-flex flex-row align-items-center gap-3" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                        <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', width: '56px', height: '56px' }}>
                            <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-muted small fw-semibold d-block">{t('slaComplianceMetric', 'SLA Cumprimento')}</span>
                            <h3 className="fw-bold mb-0 mt-0.5" style={{ color: 'var(--text)' }}>
                                {loading ? '...' : metrics.slaCompliance}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content grid area: Replaced Quick Actions card with the ListagemPreApproval component */}
            <div className="card shadow-sm border rounded-4 p-4" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                <h5 className="fw-bold mb-3 mt-0" style={{ color: 'var(--text)' }}>
                    {t('preApprovalTitle', 'Pré-Aprovação de Candidaturas')}
                </h5>
                <div className="users-table-card">
                    <ListagemPreApproval onDataLoaded={handlePreApprovalDataLoaded} />
                </div>
            </div>
        </div>
    );
}
