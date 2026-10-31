import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../services/api';
import Swal from 'sweetalert2';

export default function NotificationsManagement() {
  const { t, i18n } = useTranslation();
  const { socket, triggerCountsUpdate, language } = useAppContext();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, unread, read
  const [readingNotif, setReadingNotif] = useState(null);

  const getNotifText = useCallback((field) => {
    if (!field) return '';
    if (typeof field === 'object') {
      const activeLang = (i18n.language || 'pt').slice(0, 2);
      return field[activeLang] || field.pt || field.en || field.es || '';
    }
    return String(field);
  }, [i18n.language]);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get('/notificacao');
      if (res.data?.data) {
        setNotifications(res.data.data);
      } else if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // CICLO DE VIDA: Re-fetch ao arrancar e sempre que o idioma do sistema mudar
  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications, language]);

  // Real-time WebSocket listener for new notifications (atualização silenciosa)
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = () => {
      fetchNotifications(true);
      if (triggerCountsUpdate) triggerCountsUpdate();
    };

    socket.on('notification', handleNewNotification);
    socket.on('nova_notificacao', handleNewNotification);
    socket.on('notificacao_criada', handleNewNotification);
    socket.on('candidatura_pre_aprovada', handleNewNotification);
    socket.on('candidatura_badge_emitido', handleNewNotification);
    socket.on('candidatura_especial_submetida', handleNewNotification);
    socket.on('candidatura_especial_aprovada', handleNewNotification);
    socket.on('candidatura_especial_recusada', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('nova_notificacao', handleNewNotification);
      socket.off('notificacao_criada', handleNewNotification);
      socket.off('candidatura_pre_aprovada', handleNewNotification);
      socket.off('candidatura_badge_emitido', handleNewNotification);
      socket.off('candidatura_especial_submetida', handleNewNotification);
      socket.off('candidatura_especial_aprovada', handleNewNotification);
      socket.off('candidatura_especial_recusada', handleNewNotification);
    };
  }, [socket, fetchNotifications, triggerCountsUpdate]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notificacao/${id}/lida`);
      setNotifications(prev => prev.map(n => ( (n.id_notificacao === id || n.id === id) ? { ...n, lida: true, data_leitura: new Date().toISOString() } : n )));
      if (triggerCountsUpdate) triggerCountsUpdate();
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  const handleOpenReadingModal = (notif) => {
    setReadingNotif(notif);
    const id = notif.id_notificacao || notif.id;
    if (!notif.lida && id) {
      handleMarkAsRead(id);
    }
  };

  const handleConfirmMarkAllAsRead = async () => {
    const result = await Swal.fire({
      title: t('confirmMarkAllReadTitle', 'Marcar todas como lidas?'),
      text: t('confirmMarkAllReadText', 'Deseja marcar todas as notificações como lidas?'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('confirmBtn', 'Sim, confirmar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (!result.isConfirmed) return;

    try {
      await api.put('/notificacao/lidas-todas');
      setNotifications(prev => prev.map(n => ({ ...n, lida: true, data_leitura: new Date().toISOString() })));
      if (triggerCountsUpdate) triggerCountsUpdate();
      Swal.fire({
        icon: 'success',
        title: t('successTitle', 'Sucesso'),
        text: t('allNotificationsMarkedRead', 'Todas as notificações foram marcadas como lidas.'),
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Erro ao marcar todas notificações como lidas:', err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterStatus === 'unread') return !n.lida;
    if (filterStatus === 'read') return n.lida;
    return true;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1">{t('notificationsTitle')}</h3>
        <p className="text-muted small mb-0">{t('notificationsSubtitle')}</p>
      </div>

      {/* Toolbar Filter & Actions */}
      <div className="users-toolbar shadow-sm rounded-4 p-3 mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
        <div className="d-flex align-items-center gap-2">
          <label className="fw-semibold small text-muted mb-0">{t('filterByStatus')}</label>
          <select
            className="form-select form-select-sm rounded-3 fw-medium cursor-pointer"
            style={{ minWidth: '180px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">{t('allNotifications')}</option>
            <option value="unread">{t('unreadNotifications')}</option>
            <option value="read">{t('readNotifications')}</option>
          </select>
        </div>

        {notifications.some(n => !n.lida) && (
          <button
            type="button"
            className="btn btn-primary btn-sm rounded-3 fw-semibold px-3 d-flex align-items-center gap-2 text-white shadow-sm"
            style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
            onClick={handleConfirmMarkAllAsRead}
          >
            <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {t('markAllReadBtn')}
          </button>
        )}
      </div>

      {/* Notifications Table Grid */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="users-spinner" />
            <span>{t('loadingNotifications')}</span>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table align-middle">
              <thead>
                <tr>
                  <th>{t('colNotification')}</th>
                  <th>{t('colType')}</th>
                  <th>{t('colSender')}</th>
                  <th>{t('colDate')}</th>
                  <th className="text-end">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="users-empty-row py-4 text-center text-muted">
                      {t('noNotificationsFound')}
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((notif) => {
                    const id = notif.id_notificacao || notif.id;
                    const notificador = notif.notificador
                      ? `${notif.notificador.nome} ${notif.notificador.apelido}`
                      : (notif.emissor || 'Sistema');

                    return (
                      <tr key={id} style={{ opacity: notif.lida ? 0.75 : 1, backgroundColor: notif.lida ? 'transparent' : 'rgba(13, 148, 136, 0.04)' }}>
                        <td style={{ maxWidth: '380px' }}>
                          <div className="d-flex align-items-center gap-2">
                            {!notif.lida && (
                              <span className="badge bg-danger rounded-pill flex-shrink-0" style={{ width: 8, height: 8, padding: 0 }} title="Não lida" />
                            )}
                            <strong className={`d-block ${!notif.lida ? 'fw-bold text-dark' : 'fw-normal text-muted'}`} style={{ color: 'var(--text)' }}>
                              {getNotifText(notif.titulo)}
                            </strong>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {notif.descricao_tipo || notif.tipo || 'Geral'}
                          </span>
                        </td>
                        <td>
                          <span className="small fw-semibold" style={{ color: 'var(--text)' }}>{notificador}</span>
                        </td>
                        <td className="small text-muted">{formatDate(notif.data_criacao || notif.createdAt)}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-3 px-3 py-1 small fw-semibold"
                            onClick={() => handleOpenReadingModal(notif)}
                          >
                            📖 {t('readBtn')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Leitura de Aviso / Notificação */}
      {readingNotif && (
        <>
          <div className="users-modal-overlay" onClick={() => setReadingNotif(null)} />
          <div className="users-modal" style={{ maxWidth: '560px', width: '92%' }}>
            <div className="users-modal-header border-bottom pb-3">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
                  {getNotifText(readingNotif.titulo) || t('notification')}
                </h5>
                <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                  {readingNotif.descricao_tipo || readingNotif.tipo || 'Geral'}
                </span>
              </div>
              <button className="users-modal-close" onClick={() => setReadingNotif(null)}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--sidebar-border)' }}>
                <span className="small" style={{ color: 'var(--text-muted)' }}>
                  {t('by')}: <strong style={{ color: 'var(--text)' }}>
                    {readingNotif.notificador ? `${readingNotif.notificador.nome} ${readingNotif.notificador.apelido}` : (readingNotif.emissor || 'Sistema')}
                  </strong>
                </span>
                <span className="small text-muted" style={{ fontSize: '0.8rem' }}>
                  {formatDate(readingNotif.data_criacao || readingNotif.createdAt)}
                </span>
              </div>

              <div className="p-3 rounded-3 mb-2" style={{ backgroundColor: 'var(--panel-2, rgba(0,0,0,0.03))', border: '1px solid var(--sidebar-border)' }}>
                <p className="mb-0" style={{ color: 'var(--text)', fontSize: '0.925rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {getNotifText(readingNotif.mensagem) || 'Sem conteúdo adicional.'}
                </p>
              </div>
            </div>

            <div className="d-flex justify-content-end p-3 border-top" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
              <button type="button" className="btn btn-secondary rounded-3 px-4" onClick={() => setReadingNotif(null)}>
                {t('closeBtn')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
