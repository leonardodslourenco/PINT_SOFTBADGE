import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { api, API_BASE_URL } from '../services/api';
import Swal from 'sweetalert2';

export default function HeaderGlobal({ controls, onNavigate }) {
  const { t, i18n } = useTranslation();
  const { user, activeRole, socket, countsVersion, triggerCountsUpdate, language } = useAppContext();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const avatarUrl = user?.avatar 
    ? `${API_BASE_URL}/uploads/avatars/${user.avatar}`
    : null;

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  const initials = `${user?.nome?.[0] || 'U'}${user?.apelido?.[0] || 'S'}`.toUpperCase();

  const getNotifText = useCallback((field) => {
    if (!field) return '';
    if (typeof field === 'object') {
      const activeLang = (i18n.language || 'pt').slice(0, 2);
      return field[activeLang] || field.pt || field.en || field.es || '';
    }
    return String(field);
  }, [i18n.language]);

  const roleTranslationKey = {
    1: 'admin',
    2: 'sll',
    3: 'tm',
    4: 'con'
  }[Number(activeRole)] || 'con';

  // Fetch unread notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notificacao');
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.lida).length);
    } catch (err) {
      console.error('Erro ao buscar notificações no Header:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, countsVersion, language]);

  // Real-time WebSocket listener
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(count => count + 1);
      if (triggerCountsUpdate) triggerCountsUpdate();

      // Show toast alert
      const toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
      });

      toast.fire({
        icon: 'info',
        title: getNotifText(data.titulo) || t('newNotificationTitle', 'Nova Notificação'),
        text: getNotifText(data.mensagem)
      });
    };

    socket.on('notification', handleNewNotification);
    socket.on('nova_notificacao', handleNewNotification);
    socket.on('candidatura_especial_submetida', fetchNotifications);
    socket.on('candidatura_especial_aprovada', fetchNotifications);
    socket.on('candidatura_especial_recusada', fetchNotifications);

    return () => {
      socket.off('notification', handleNewNotification);
      socket.off('nova_notificacao', handleNewNotification);
      socket.off('candidatura_especial_submetida', fetchNotifications);
      socket.off('candidatura_especial_aprovada', fetchNotifications);
      socket.off('candidatura_especial_recusada', fetchNotifications);
    };
  }, [socket, t, triggerCountsUpdate, getNotifText, fetchNotifications]);

  const [readingNotif, setReadingNotif] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notificacao/${id}/lida`);
      setNotifications(prev => prev.map(n => (n.id_notificacao === id ? { ...n, lida: true } : n)));
      setUnreadCount(c => Math.max(0, c - 1));
      if (triggerCountsUpdate) triggerCountsUpdate();
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notificacao/lidas-todas');
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      setUnreadCount(0);
      if (triggerCountsUpdate) triggerCountsUpdate();
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  };

  const handleOpenReadingModal = (notif) => {
    setReadingNotif(notif);
    const id = notif.id_notificacao || notif.id;
    if (!notif.lida && id) {
      handleMarkAsRead(id);
    }
    setNotifDropdownOpen(false);
  };

  return (
    <div className="top-header">
      <div className="header-left">
      </div>
      
      <div className="d-flex align-items-center gap-3">
        {/* Notification Bell 🔔 */}
        <div className="position-relative">
          <div 
            className="position-relative cursor-pointer text-muted p-2 rounded-circle hover-bg-light"
            onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); setDropdownOpen(false); }}
            title={t('notificationsTitle', 'Avisos e Notificações')}
            style={{ cursor: 'pointer' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-bell">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span 
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light"
                style={{ fontSize: '0.65rem', padding: '0.25em 0.4em' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          {/* Notification Dropdown Menu */}
          {notifDropdownOpen && (
            <>
              <div 
                className="position-fixed top-0 bottom-0 start-0 end-0" 
                style={{ zIndex: 1040, background: 'transparent' }} 
                onClick={() => setNotifDropdownOpen(false)} 
              />
              <div 
                className="profile-menu-dropdown shadow-lg p-0"
                style={{ width: '340px', right: 0, top: '45px', zIndex: 1050, borderRadius: '16px', overflow: 'hidden' }}
              >
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-panel">
                  <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.9rem' }}>{t('notificationsTitle', 'Notificações')}</h6>
                  {unreadCount > 0 && (
                    <button className="btn btn-link btn-sm p-0 text-primary text-decoration-none small" onClick={handleMarkAllAsRead}>
                      {t('markAllReadBtn', 'Marcar lidas')}
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted small">
                      {t('noNotificationsFound', 'Sem notificações de momento.')}
                    </div>
                  ) : (
                    notifications.slice(0, 5).map(n => {
                      const id = n.id_notificacao || n.id;
                      return (
                        <div 
                          key={id} 
                          className="p-3 border-bottom text-start position-relative cursor-pointer"
                          style={{ backgroundColor: n.lida ? 'var(--panel)' : 'rgba(13, 148, 136, 0.06)' }}
                          onClick={() => handleOpenReadingModal(n)}
                        >
                          <div className="d-flex align-items-start gap-2">
                            {!n.lida && (
                              <span className="badge bg-danger rounded-pill mt-1" style={{ width: 6, height: 6, padding: 0 }} />
                            )}
                            <div className="flex-grow-1">
                              <strong className="text-dark d-block small mb-1">{getNotifText(n.titulo)}</strong>
                              <span className="text-secondary d-block mt-1" style={{ fontSize: '0.7rem' }}>
                                {n.data_criacao ? new Date(n.data_criacao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal: Leitura de Aviso / Notificação */}
        {readingNotif && (
          <>
            <div className="users-modal-overlay" style={{ zIndex: 1060 }} onClick={() => setReadingNotif(null)} />
            <div className="users-modal" style={{ maxWidth: '560px', width: '92%', zIndex: 1070, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'var(--panel)', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div className="users-modal-header border-bottom p-3 d-flex justify-content-between align-items-center bg-panel">
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: 'var(--text)', fontSize: '1.1rem' }}>
                    {getNotifText(readingNotif.titulo) || t('notification')}
                  </h5>
                  <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                    {readingNotif.descricao_tipo || readingNotif.tipo || 'Geral'}
                  </span>
                </div>
                <button className="users-modal-close" onClick={() => setReadingNotif(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              <div className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--sidebar-border)' }}>
                  <span className="small text-muted">
                    {t('by', 'Por')}: <strong style={{ color: 'var(--text)' }}>
                      {readingNotif.notificador ? `${readingNotif.notificador.nome} ${readingNotif.notificador.apelido}` : (readingNotif.emissor || 'Sistema')}
                    </strong>
                  </span>
                  <span className="small text-muted">
                    {formatDate(readingNotif.data_criacao || readingNotif.createdAt)}
                  </span>
                </div>

                <div className="p-3 rounded-3 mb-2" style={{ backgroundColor: 'var(--panel-2, rgba(0,0,0,0.03))', border: '1px solid var(--sidebar-border)' }}>
                  <p className="mb-0 text-start" style={{ color: 'var(--text)', fontSize: '0.925rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {getNotifText(readingNotif.mensagem) || 'Sem conteúdo adicional.'}
                  </p>
                </div>
              </div>

              <div className="d-flex justify-content-end p-3 border-top" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                <button type="button" className="btn btn-secondary rounded-3 px-4" onClick={() => setReadingNotif(null)}>
                  {t('closeBtn', 'Fechar')}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Profile Dropdown */}
        <div className="profile-dropdown-container">
          <div className="profile-trigger" onClick={() => { setDropdownOpen(!dropdownOpen); setNotifDropdownOpen(false); }}>
            <div className="profile-info d-none d-sm-flex text-end">
              <span className="profile-name">{user?.nome} {user?.apelido}</span>
              <span className="profile-role">{t(roleTranslationKey)}</span>
            </div>

            {avatarUrl && !avatarError ? (
              <img 
                src={avatarUrl} 
                alt={user?.nome} 
                className="profile-avatar" 
                onError={() => setAvatarError(true)} 
              />
            ) : (
              <div 
                className="profile-avatar bg-primary text-white d-flex align-items-center justify-content-center fw-bold" 
                style={{ fontSize: '1.3rem' }}
              >
                {initials}
              </div>
            )}
            
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`profile-chevron ${dropdownOpen ? 'open' : ''}`}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {dropdownOpen && (
            <>
              <div 
                className="position-fixed top-0 bottom-0 start-0 end-0" 
                style={{ zIndex: 1040, background: 'transparent' }} 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="profile-menu-dropdown">
                <div className="px-2 py-1 border-bottom pb-2 mb-2 d-sm-none">
                  <div className="fw-bold">{user?.nome} {user?.apelido}</div>
                  <div className="text-muted small">{t(roleTranslationKey)}</div>
                </div>
                <div className="p-1">
                  <label className="form-label small text-muted mb-2">{t('changeView')}</label>
                  {controls}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
