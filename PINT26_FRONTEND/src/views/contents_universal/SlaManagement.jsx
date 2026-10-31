import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Swal from 'sweetalert2';

export default function SlaManagement() {
  const { t, i18n } = useTranslation();
  const { socket } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [candidatures, setCandidatures] = useState([]);
  const [failedAvatars, setFailedAvatars] = useState({});
  const [previewAvatar, setPreviewAvatar] = useState(null);

  const handleAvatarError = (userId) => {
    setFailedAvatars(prev => ({ ...prev, [userId]: true }));
  };

  const handleAvatarMouseMove = (e, avatarUrl, userName) => {
    const boxWidth = 300;
    const boxHeight = 300;
    const padding = 20;

    let x = e.clientX + padding;
    let y = e.clientY - (boxHeight / 2);

    if (x + boxWidth > window.innerWidth - padding) {
      x = e.clientX - boxWidth - padding;
    }
    if (y + boxHeight > window.innerHeight - padding) {
      y = window.innerHeight - boxHeight - padding;
    }
    if (y < padding) {
      y = padding;
    }

    setPreviewAvatar({
      url: avatarUrl,
      name: userName,
      x,
      y
    });
  };

  const handleAvatarMouseLeave = () => {
    setPreviewAvatar(null);
  };

  // SLA config states
  const [slaConfig, setSlaConfig] = useState({
    sla_tm_horas: 48,
    sla_sll_horas: 48,
    enviar_email_pendentes: true,
    aviso_email_horas_restantes: 12,
    notificar_admin_sll_expirado: true,
    dias_badge_expirando: 30,
    intervalo_verificacao_badge_expirado: 24
  });

  // Modal control
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [submittingConfig, setSubmittingConfig] = useState(false);

  // Modal form states
  const [formConfig, setFormConfig] = useState({ ...slaConfig });

  // Fetch SLA configurations & candidacy items
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [resConfig, resCands] = await Promise.all([
        api.get('/metricas/sla/config').catch(() => null),
        api.get('/candidatura_badge').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (resConfig?.data?.success && resConfig.data.data) {
        setSlaConfig(resConfig.data.data);
        setFormConfig(resConfig.data.data);
      }

      // Filter candidatures in states 2 (Pendente TM) or 3 (Em Validação / SLL)
      if (resCands?.data?.success) {
        const activeCands = (resCands.data.data || []).filter(c =>
          c.id_estado_candidatura === 2 || c.id_estado_candidatura === 3
        );
        setCandidatures(activeCands);
      }
    } catch (err) {
      console.error('Error fetching SLA data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Real-time WebSocket updates (silent re-fetch)
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      setTimeout(() => fetchData(true), 400);
    };
    socket.on('candidatura_submetida', handleUpdate);
    socket.on('candidatura_pre_aprovada', handleUpdate);
    socket.on('candidatura_avancou', handleUpdate);
    socket.on('candidatura_badge_emitido', handleUpdate);
    return () => {
      socket.off('candidatura_submetida', handleUpdate);
      socket.off('candidatura_pre_aprovada', handleUpdate);
      socket.off('candidatura_avancou', handleUpdate);
      socket.off('candidatura_badge_emitido', handleUpdate);
    };
  }, [socket, fetchData]);

  // Open configuration modal
  const handleOpenConfigModal = () => {
    setFormConfig({ ...slaConfig });
    setShowConfigModal(true);
  };

  // Submit/Save SLA configs
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSubmittingConfig(true);
    try {
      const res = await api.put('/metricas/sla/config', formConfig);
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('slaConfigUpdatedMsg', 'Configurações de SLA atualizadas com sucesso.'),
          timer: 1500,
          showConfirmButton: false
        });
        setSlaConfig(res.data.data);
        setShowConfigModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error updating SLA config:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.response?.data?.message || 'Erro ao guardar configurações de SLA.'
      });
    } finally {
      setSubmittingConfig(false);
    }
  };

  // Executa uma verificação manual e instantânea de badges expirando/expirados
  const handleManualVerification = async () => {
    try {
      Swal.fire({
        title: t('checking', 'A verificar...'),
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await api.post('/metricas/expiracao/verificar');

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: res.data.message || t('manualVerificationSuccess', 'Verificação manual de expirações executada com sucesso.'),
          confirmButtonText: t('okBtn', 'OK')
        });
        fetchData();
      }
    } catch (err) {
      console.error('Error running manual verification:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('manualVerificationError', 'Erro ao executar a verificação manual de expiração.')
      });
    }
  };

  // Calculated SLA Remaining times helper
  const getSlaDetails = (candidacy) => {
    const isTm = candidacy.id_estado_candidatura === 2;
    const allowedHours = isTm ? slaConfig.sla_tm_horas : slaConfig.sla_sll_horas;

    // SLA starts from the last action date (when submitted or pre-approved)
    const sortedActions = [...(candidacy.acoes || [])].sort(
      (a, b) => new Date(a.data_acao_candidatura) - new Date(b.data_acao_candidatura)
    );

    // Fallback to candidacy creation date
    let baseTime = new Date(candidacy.data_candidatura);
    if (sortedActions.length > 0) {
      const lastAction = sortedActions[sortedActions.length - 1];
      baseTime = new Date(lastAction.data_acao_candidatura);
    }

    const elapsedMs = new Date() - baseTime;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const hoursLeft = allowedHours - elapsedHours;

    if (hoursLeft <= 0) {
      const absHours = Math.abs(hoursLeft);
      let timeText = '';
      if (absHours < 24) {
        timeText = `${Math.round(absHours)}h`;
      } else {
        timeText = `${Math.round(absHours / 24)}d`;
      }
      return {
        status: 'expired',
        badgeClass: 'bg-danger text-white',
        statusLabel: t('slaStatusExpired', 'Excedido / Expirado'),
        timeLeftText: t('expiredActiveText', 'Expirado há {{time}}').replace('{{time}}', timeText)
      };
    }

    let timeLeftText = '';
    if (hoursLeft < 24) {
      timeLeftText = `${Math.round(hoursLeft)}h`;
    } else {
      timeLeftText = `${Math.round(hoursLeft / 24)}d`;
    }

    // Near expiry if less than 24 hours or less than 25% of allowed SLA time
    const isNearExpiry = hoursLeft < 24 || (hoursLeft / allowedHours) < 0.25;

    return {
      status: isNearExpiry ? 'near_expiry' : 'compliant',
      badgeClass: isNearExpiry ? 'bg-warning text-dark' : 'bg-success text-white',
      statusLabel: isNearExpiry ? t('slaStatusNearExpiry', 'Próximo do Limite') : t('slaStatusCompliant', 'Em Conformidade'),
      timeLeftText: t('timeLeftActiveText', 'Restam {{time}}').replace('{{time}}', timeLeftText)
    };
  };

  return (
    <div className="users-admin-container">
      {/* Header section with Figma styling rules */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            {t('menuSla', 'Monitorização SLA')}
          </h3>
          <p className="text-muted small mb-0">
            {t('slaMgmtSubtitle', 'Monitorização e auditoria de acordos de nível de serviço das candidaturas.')}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={handleManualVerification}
            className="btn btn-outline-primary rounded-3 px-4 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm"
          >
            🔍 {t('manualVerificationBtn', 'Verificação Manual')}
          </button>
          <button
            onClick={handleOpenConfigModal}
            className="btn btn-primary rounded-3 px-4 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm text-white"
            style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
          >
            ⚙️ {t('configureSlaRulesBtn', 'Configurar Regras')}
          </button>
        </div>
      </div>

      {/* Main SLA candidate audit status table */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading py-5">
            <div className="users-spinner" />
            <span>A carregar candidaturas...</span>
          </div>
        ) : candidatures.length === 0 ? (
          <div className="text-center py-5 text-muted border rounded-4 bg-light-subtle">
            {t('noCandidaciesSla', 'Nenhuma candidatura ativa em processo de auditoria de SLA.')}
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('colSlaCandidate', 'Candidato')}</th>
                  <th>{t('colSlaBadge', 'Badge')}</th>
                  <th>{t('colSlaPhase', 'Etapa / Pendente')}</th>
                  <th>{t('colSlaTimeLeft', 'Tempo Restante')}</th>
                  <th>{t('colSlaStatus', 'Estado')}</th>
                </tr>
              </thead>
              <tbody>
                {candidatures.map((candidacy) => {
                  const sla = getSlaDetails(candidacy);
                  const isTm = candidacy.id_estado_candidatura === 2;

                  return (
                    <tr key={candidacy.id_candidatura}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          {candidacy.consultor?.avatar && !failedAvatars[candidacy.consultor?.id_utilizador] ? (
                            <img
                              src={`${API_BASE_URL}/uploads/avatars/${candidacy.consultor.avatar}`}
                              alt={candidacy.consultor?.nome || 'Avatar'}
                              className="rounded-circle cursor-pointer"
                              style={{ width: '40px', height: '40px', objectFit: 'cover', border: '1px solid var(--sidebar-border)' }}
                              onError={() => handleAvatarError(candidacy.consultor?.id_utilizador)}
                              onMouseEnter={(e) => handleAvatarMouseMove(e, `${API_BASE_URL}/uploads/avatars/${candidacy.consultor.avatar}`, `${candidacy.consultor?.nome || ''} ${candidacy.consultor?.apelido || ''}`.trim())}
                              onMouseMove={(e) => handleAvatarMouseMove(e, `${API_BASE_URL}/uploads/avatars/${candidacy.consultor.avatar}`, `${candidacy.consultor?.nome || ''} ${candidacy.consultor?.apelido || ''}`.trim())}
                              onMouseLeave={handleAvatarMouseLeave}
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold"
                              style={{
                                width: '40px',
                                height: '40px',
                                fontSize: '0.9rem',
                                minWidth: '40px'
                              }}
                            >
                              {`${candidacy.consultor?.nome?.[0] || 'U'}${candidacy.consultor?.apelido?.[0] || 'S'}`.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="fw-semibold d-block" style={{ color: 'var(--text)' }}>
                              {candidacy.consultor?.nome} {candidacy.consultor?.apelido}
                            </span>
                            <small className="text-muted">{candidacy.consultor?.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className="fw-medium d-block" style={{ color: 'var(--text)' }}>
                            {candidacy.badge?.traducao_titulo?.[i18n.language] || candidacy.badge?.traducao_titulo?.pt || candidacy.badge?.titulo || '—'}
                          </span>
                          <span className="badge bg-light text-dark border small mt-0.5" style={{ fontSize: '0.72rem' }}>
                            {candidacy.badge?.pontos || 0} pts
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge rounded-4 px-2.5 py-1.5 fw-semibold ${isTm ? 'bg-purple-subtle text-purple border border-purple-subtle' : 'bg-teal-subtle text-teal border border-teal-subtle'} d-inline-block text-center`}
                          style={{
                            fontSize: '0.74rem',
                            backgroundColor: isTm ? 'rgba(124, 58, 237, 0.12)' : 'rgba(13, 148, 136, 0.12)',
                            color: isTm ? '#6d28d9' : '#0f766e',
                            whiteSpace: 'normal',
                            lineHeight: 1.25,
                            maxWidth: '120px'
                          }}
                        >
                          {isTm ? t('adminRole', 'Talent Manager') : t('sllRole', 'Service Line Leader')}
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold d-inline-block" style={{ color: 'var(--text)', whiteSpace: 'normal', lineHeight: 1.25, maxWidth: '110px' }}>
                          {sla.timeLeftText}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge rounded-4 px-2.5 py-1.5 fw-bold ${sla.badgeClass} d-inline-block text-center`}
                          style={{
                            fontSize: '0.74rem',
                            whiteSpace: 'normal',
                            lineHeight: 1.25,
                            maxWidth: '105px'
                          }}
                        >
                          {sla.statusLabel}
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

      {/* SLA Configuration Modal (Figma Mockup Design aligned) */}
      {showConfigModal && (
        <>
          <div className="users-modal-overlay" onClick={() => setShowConfigModal(false)} />
          <div className="users-modal" style={{ maxWidth: '580px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="users-modal-header d-flex align-items-center justify-content-between p-3 border-bottom">
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)' }}>
                ⚙️ {t('slaConfigModalTitle', 'Regras de SLA de Resposta')}
              </h5>
              <button className="users-modal-close" onClick={() => setShowConfigModal(false)}>
                <svg viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
                <div className="d-flex flex-column gap-3">

                  {/* TM SLA Hours */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                      {t('slaTmHoursLabel', 'SLA do Talent Manager (Horas)')} *
                    </label>
                    <input
                      type="number"
                      className="form-control rounded-3"
                      min="1"
                      required
                      value={formConfig.sla_tm_horas}
                      onChange={(e) => setFormConfig({ ...formConfig, sla_tm_horas: Number(e.target.value) })}
                    />
                  </div>

                  {/* SLL SLA Hours */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                      {t('slaSllHoursLabel', 'SLA do Service Line Leader (Horas)')} *
                    </label>
                    <input
                      type="number"
                      className="form-control rounded-3"
                      min="1"
                      required
                      value={formConfig.sla_sll_horas}
                      onChange={(e) => setFormConfig({ ...formConfig, sla_sll_horas: Number(e.target.value) })}
                    />
                  </div>

                  {/* Send Email checkbox */}
                  <div className="form-check form-switch mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="sendEmailSwitch"
                      checked={formConfig.enviar_email_pendentes}
                      onChange={(e) => setFormConfig({ ...formConfig, enviar_email_pendentes: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label small ms-2" htmlFor="sendEmailSwitch" style={{ cursor: 'pointer', color: 'var(--text)' }}>
                      {t('sendSlaReminderEmails', 'Enviar lembretes de SLA por e-mail')}
                    </label>
                  </div>

                  {/* Warning Hours before expiry */}
                  {formConfig.enviar_email_pendentes && (
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                        {t('hoursBeforeExpiryLabel', 'Horas de aviso prévio para lembrete')} *
                      </label>
                      <input
                        type="number"
                        className="form-control rounded-3"
                        min="1"
                        required
                        value={formConfig.aviso_email_horas_restantes}
                        onChange={(e) => setFormConfig({ ...formConfig, aviso_email_horas_restantes: Number(e.target.value) })}
                      />
                    </div>
                  )}

                  {/* Notify admin expired */}
                  <div className="form-check form-switch mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="notifyAdminExpirySwitch"
                      checked={formConfig.notificar_admin_sll_expirado}
                      onChange={(e) => setFormConfig({ ...formConfig, notificar_admin_sll_expirado: e.target.checked })}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label small ms-2" htmlFor="notifyAdminExpirySwitch" style={{ cursor: 'pointer', color: 'var(--text)' }}>
                      {t('notifyAdminExpiry', 'Notificar Admin se SLA expirar sem resposta')}
                    </label>
                  </div>

                  {/* Intervalo de Verificação de Badges Expirados (Horas) */}
                  <div className="users-form-group mt-2">
                    <label className="text-muted small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                      {t('intervaloVerificacaoBadgeExpiradoLabel', 'Intervalo de verificação de badges expirados (Horas)')} *
                    </label>
                    <input
                      type="number"
                      className="form-control rounded-3"
                      min="2"
                      max="24"
                      required
                      value={formConfig.intervalo_verificacao_badge_expirado || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, intervalo_verificacao_badge_expirado: Number(e.target.value) })}
                    />
                  </div>

                  {/* Dias de antecedência para aviso de expiração de Badge */}
                  <div className="users-form-group mt-2">
                    <label className="text-muted small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                      {t('diasBadgeExpirandoLabel', 'Dias de antecedência para aviso de expiração de Badge')} *
                    </label>
                    <input
                      type="number"
                      className="form-control rounded-3"
                      min="1"
                      max="1825"
                      required
                      value={formConfig.dias_badge_expirando || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, dias_badge_expirando: Number(e.target.value) })}
                    />
                  </div>

                </div>
              </div>

              {/* Sticky footer actions */}
              <div className="d-flex justify-content-end gap-2 p-3 border-top bg-light" style={{ backgroundColor: 'var(--panel-2)' }}>
                <button type="button" className="btn btn-outline-secondary rounded-3 px-3" onClick={() => setShowConfigModal(false)}>
                  {t('cancelBtn')}
                </button>
                <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold" disabled={submittingConfig}>
                  {submittingConfig ? t('saving') : t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Floating Avatar Zoom Preview */}
      {previewAvatar && (
        <div
          style={{
            position: 'fixed',
            top: previewAvatar.y,
            left: previewAvatar.x,
            zIndex: 9999,
            pointerEvents: 'none',
            backgroundColor: 'var(--panel)',
            border: '2px solid var(--primary)',
            borderRadius: '16px',
            padding: '10px',
            boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.4), 0 10px 15px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <img
            src={previewAvatar.url}
            alt={previewAvatar.name}
            style={{
              width: '280px',
              height: '280px',
              objectFit: 'cover',
              borderRadius: '12px'
            }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
            {previewAvatar.name}
          </span>
        </div>
      )}
    </div>
  );
}
