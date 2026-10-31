import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { navigationConfig } from '../config/navigationConfig.jsx';
import { api } from '../services/api';
import { ROLE } from '../constants/roles';

export default function SidebarUniversal({ activeKey = 'home', onSelect }) {
  const { t, i18n } = useTranslation();
  const { activeRole, socket, countsVersion } = useAppContext();

  const [counts, setCounts] = useState({
    miniforum: 0,
    notices: 0,
    pre: 0,
    final: 0,
    users: 0,
    badges: 0
  });

  const fetchCounts = useCallback(async () => {
    let unreadForum = 0;
    let unreadNotif = 0;
    let pendingPre = 0;
    let pendingFinal = 0;
    let totalUsers = 0;

    // 1. Unread MiniForum count
    try {
      const resForum = await api.get(`/postagem_miniforum?lang=${i18n.language}`);
      const posts = resForum.data?.data || (Array.isArray(resForum.data) ? resForum.data : []);
      unreadForum = posts.filter(p => !p.lida).length;
    } catch (err) {
      console.warn('Erro ao buscar contagem do MiniFórum:', err);
    }

    // 2. Unread Notifications count
    try {
      const resNotif = await api.get(`/notificacao?lang=${i18n.language}`);
      const notifications = resNotif.data?.data || (Array.isArray(resNotif.data) ? resNotif.data : []);
      unreadNotif = notifications.filter(n => !n.lida).length;
    } catch (err) {
      console.warn('Erro ao buscar contagem de Notificações:', err);
    }

    // 3. Pending Pre-Approvals (TM)
    if (Number(activeRole) === ROLE.TM) {
      try {
        const resPre = await api.get('/candidatura_badge?estado=2');
        const listPre = resPre.data?.data || (Array.isArray(resPre.data) ? resPre.data : []);
        pendingPre = listPre.length;
      } catch (err) {
        console.warn('Erro ao buscar pendentes TM:', err);
      }
    }

    // 4. Pending Final Approvals (SLL)
    if (Number(activeRole) === ROLE.SLL) {
      try {
        const resFinal = await api.get('/candidatura_badge?estado=3');
        const listFinal = resFinal.data?.data || (Array.isArray(resFinal.data) ? resFinal.data : []);
        pendingFinal = listFinal.length;
      } catch (err) {
        console.warn('Erro ao buscar pendentes SLL:', err);
      }
    }

    // 5. Total registered users (Admin only)
    if (Number(activeRole) === ROLE.ADMIN) {
      try {
        const resUsers = await api.get('/metricas/utilizadores_total');
        if (resUsers.data?.success) {
          totalUsers = resUsers.data.data?.total || 0;
        }
      } catch (err) {
        console.warn('Erro ao buscar contagem de Utilizadores:', err);
      }
    }

    // 6. Total badges count (all authorized profiles: ADMIN, SLL, CON)
    let totalBadges = 0;
    try {
      const resBadges = await api.get('/metricas/badges_total');
      if (resBadges.data?.success) {
        totalBadges = resBadges.data.data?.total || 0;
      }
    } catch (err) {
      console.warn('Erro ao buscar contagem de Badges:', err);
    }

    // 7. Marcos count
    let totalMarcosAdmin = 0;
    let totalMarcosConsult = 0;
    if (Number(activeRole) === ROLE.ADMIN) {
      try {
        const resM = await api.get('/utilizador-marco/configuracoes');
        if (resM.data?.success && Array.isArray(resM.data.data)) {
          totalMarcosAdmin = resM.data.data.length;
        }
      } catch (err) {
        console.warn('Erro ao buscar contagem de Marcos Admin:', err);
      }
    }
    if (Number(activeRole) === ROLE.CON) {
      try {
        const resMC = await api.get('/utilizador-marco/meus-marcos');
        if (resMC.data?.success && Array.isArray(resMC.data.data)) {
          totalMarcosConsult = resMC.data.data.length;
        }
      } catch (err) {
        console.warn('Erro ao buscar contagem de Marcos Consultor:', err);
      }
    }

    // 8. Badges Especiais count (Admin/SLL/TM: estado=1 pendentes, Consultor: estado=2 aprovados)
    let totalEspeciais = 0;
    if ([ROLE.ADMIN, ROLE.SLL, ROLE.TM].map(Number).includes(Number(activeRole))) {
      try {
        const resEsp = await api.get('/metricas/candidaturas-especiais/estado-contagem?estado=1');
        if (resEsp.data?.success) {
          totalEspeciais = resEsp.data.data?.contagem || 0;
        }
      } catch (err) {
        console.warn('Erro ao buscar contagem de Candidaturas Especiais:', err);
      }
    } else if (Number(activeRole) === ROLE.CON) {
      try {
        const resEsp = await api.get('/metricas/candidaturas-especiais/estado-contagem?estado=2');
        if (resEsp.data?.success) {
          totalEspeciais = resEsp.data.data?.contagem || 0;
        }
      } catch (err) {
        console.warn('Erro ao buscar contagem de Candidaturas Especiais Consultor:', err);
      }
    }

    // 9. Renovações count (Admin/SLL/TM: pendentes de moderação, Consultor: badges elegíveis/expirando)
    let totalRenovacoes = 0;
    if ([ROLE.ADMIN, ROLE.SLL, ROLE.TM].map(Number).includes(Number(activeRole))) {
      try {
        const resRen = await api.get('/renovacao_badge/pendentes');
        if (resRen.data?.success && Array.isArray(resRen.data.data)) {
          totalRenovacoes = resRen.data.data.length;
        }
      } catch (err) {
        console.warn('Erro ao buscar contagem de Renovações Admin/SLL/TM:', err);
      }
    } else if (Number(activeRole) === ROLE.CON) {
      try {
        const resRen = await api.get('/renovacao_badge/elegiveis');
        if (resRen.data?.success && Array.isArray(resRen.data.data)) {
          totalRenovacoes = resRen.data.data.length;
        }
      } catch (err) {
        console.warn('Erro ao buscar contagem de Renovações Consultor:', err);
      }
    }

    setCounts({
      miniforum: unreadForum,
      notices: unreadNotif,
      pre: pendingPre,
      final: pendingFinal,
      users: totalUsers,
      badges: totalBadges,
      marcos: totalMarcosAdmin,
      marcos_consult: totalMarcosConsult,
      especiais: totalEspeciais,
      renewals: totalRenovacoes
    });
  }, [i18n.language, activeRole]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, countsVersion]);

  // Real-time WebSocket updates for badges, milestones, renewals and special applications
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      setTimeout(() => {
        fetchCounts();
      }, 400);
    };

    socket.on('nova_postagem_miniforum', handleUpdate);
    socket.on('postagem_miniforum_criada', handleUpdate);
    socket.on('postagem_criada', handleUpdate);
    socket.on('miniforum_updated', handleUpdate);
    socket.on('notification', handleUpdate);
    socket.on('nova_notificacao', handleUpdate);
    socket.on('candidatura_submetida', handleUpdate);
    socket.on('candidatura_pre_aprovada', handleUpdate);
    socket.on('candidatura_avancou', handleUpdate);
    socket.on('candidatura_badge_emitido', handleUpdate);
    socket.on('candidatura_especial_submetida', handleUpdate);
    socket.on('nova_candidatura_especial', handleUpdate);
    socket.on('candidatura_especial_aprovada', handleUpdate);
    socket.on('candidatura_especial_recusada', handleUpdate);
    socket.on('candidatura_aprovada', handleUpdate);
    socket.on('candidatura_rejeitada', handleUpdate);
    socket.on('conquista_especial_criada', handleUpdate);
    socket.on('conquista_especial_atualizada', handleUpdate);
    socket.on('conquista_especial_removida', handleUpdate);
    socket.on('politica_rgpd_alterada', handleUpdate);
    socket.on('badge_updated', handleUpdate);
    socket.on('gestao_area', handleUpdate);
    socket.on('user_updated', handleUpdate);
    socket.on('novo_marco', handleUpdate);
    socket.on('marco_updated', handleUpdate);
    socket.on('renovacao_criada', handleUpdate);
    socket.on('renovacao_updated', handleUpdate);
    socket.on('renovacao_aprovada', handleUpdate);
    socket.on('renovacao_rejeitada', handleUpdate);
    socket.on('badge_renovado', handleUpdate);
    socket.on('evidencia_renovacao_enviada', handleUpdate);

    return () => {
      socket.off('nova_postagem_miniforum', handleUpdate);
      socket.off('postagem_miniforum_criada', handleUpdate);
      socket.off('postagem_criada', handleUpdate);
      socket.off('miniforum_updated', handleUpdate);
      socket.off('notification', handleUpdate);
      socket.off('nova_notificacao', handleUpdate);
      socket.off('candidatura_submetida', handleUpdate);
      socket.off('candidatura_pre_aprovada', handleUpdate);
      socket.off('candidatura_avancou', handleUpdate);
      socket.off('candidatura_badge_emitido', handleUpdate);
      socket.off('candidatura_especial_submetida', handleUpdate);
      socket.off('nova_candidatura_especial', handleUpdate);
      socket.off('candidatura_especial_aprovada', handleUpdate);
      socket.off('candidatura_especial_recusada', handleUpdate);
      socket.off('candidatura_aprovada', handleUpdate);
      socket.off('candidatura_rejeitada', handleUpdate);
      socket.off('conquista_especial_criada', handleUpdate);
      socket.off('conquista_especial_atualizada', handleUpdate);
      socket.off('conquista_especial_removida', handleUpdate);
      socket.off('politica_rgpd_alterada', handleUpdate);
      socket.off('badge_updated', handleUpdate);
      socket.off('gestao_area', handleUpdate);
      socket.off('user_updated', handleUpdate);
      socket.off('novo_marco', handleUpdate);
      socket.off('marco_updated', handleUpdate);
      socket.off('renovacao_criada', handleUpdate);
      socket.off('renovacao_updated', handleUpdate);
      socket.off('renovacao_aprovada', handleUpdate);
      socket.off('renovacao_rejeitada', handleUpdate);
      socket.off('badge_renovado', handleUpdate);
      socket.off('evidencia_renovacao_enviada', handleUpdate);
    };
  }, [socket, fetchCounts]);

  // Filtra os menus visíveis para o perfil ativo do utilizador (conversão numérica segura) e ordena de acordo com o perfil
  const visibleItems = navigationConfig
    .filter(item => item.rolesAllowed.map(Number).includes(Number(activeRole)))
    .sort((a, b) => {
      const roleNum = Number(activeRole);
      const orderA = a.order?.[roleNum] ?? 99;
      const orderB = b.order?.[roleNum] ?? 99;
      return orderA - orderB;
    });

  const getBadgeCount = (key) => {
    if (!counts) return 0;
    if (key === 'miniforum') return counts.miniforum || 0;
    if (key === 'notices') return counts.notices || 0;
    if (key === 'pre') return counts.pre || 0;
    if (key === 'final') return counts.final || 0;
    if (key === 'users') return counts.users || 0;
    if (key === 'badges') return counts.badges || 0;
    if (key === 'marcos') return counts.marcos || 0;
    if (key === 'marcos_consult') return counts.marcos_consult || 0;
    if (key === 'especiais') return counts.especiais || 0;
    if (key === 'renewals') return counts.renewals || 0;
    return 0;
  };

  return (
    <div className="sidebar p-3">
      <div className="sidebar-logo">
        <img src="/img/system/LogoMenu.webp" alt="Softinsa Logo" />
      </div>
      <div className="sidebar-menu">
        {visibleItems.map((item) => {
          const badgeCount = getBadgeCount(item.key);

          return (
            <button
              key={item.key}
              className={`sidebar-link ${activeKey === item.key ? 'active' : ''} position-relative d-flex align-items-center justify-content-between`}
              onClick={() => onSelect(item.key)}
              title={t(item.labelKey)}
            >
              <div className="sidebar-link-inner-wrapper d-flex align-items-center gap-3">
                {item.icon}
                <span className="sidebar-link-text">{t(item.labelKey)}</span>
              </div>

              {/* Badge para quando a barra está recolhida (ecrãs < 992px) */}
              {badgeCount > 0 && (
                <span 
                  className="d-lg-none position-absolute badge rounded-pill bg-danger" 
                  style={{ 
                    fontSize: '0.6rem', 
                    padding: '0.2em 0.4em', 
                    minWidth: '16px', 
                    zIndex: 10,
                    top: '4px',
                    right: '4px',
                    border: '1.5px solid var(--sidebar, #1e293b)'
                  }}
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}

              {/* Badge numérico para quando a barra está expandida (ecrãs >= 992px) */}
              {badgeCount > 0 && (
                <span 
                  className="badge rounded-pill bg-danger fw-bold ms-auto d-none d-lg-inline-block"
                  style={{ fontSize: '0.725rem', padding: '0.3em 0.6em' }}
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
