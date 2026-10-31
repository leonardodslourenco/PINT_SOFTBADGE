import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next'; // Hook do ecossistema i18n para controlo de internacionalização
import { authStorage } from '../services/authStorage'; // Camada de serviço encarregue de manipular o LocalStorage
import { authController } from '../controllers/authController'; // Controlador frontend que comunica com o endpoint de auth do Express
import { mapThemaCodeToTheme } from '../services/themePreference'; // Utilitário que traduz os códigos numéricos do backend (1,2,3) in texto ('light','dark')
import { api, getLandingPageURL } from '../services/api'; // Instância do Axios pré-configurada com a BaseURL e Intercetores
import { socketService } from '../services/socket';
import { ROLE } from '../constants/roles';

/**
 * Descodifica o payload de um token JWT para obter o timestamp de expiração (exp).
 * Devolve o valor em milissegundos ou null se for inválido.
 */
function getJwtExpiry(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    return payload.exp ? payload.exp * 1000 : null;
  } catch (e) {
    return null;
  }
}

// Inicializa a árvore do Contexto Global do React
const AppContext = createContext(null);

/**
 * COMPONENTE ESTRUTURAL: AppProvider
 * Envolve a árvore de componentes principal (App.js) e fornece os métodos e estados do ecossistema.
 */
export function AppProvider({ children }) {
  const { t, i18n } = useTranslation();

  // REIDRATAÇÃO DE ESTADO (Mecânica Antifresh):
  // Ao carregar a app pela primeira vez na aba do browser, lê o LocalStorage para verificar se existia uma sessão prévia.
  const initialToken = authStorage.getToken();
  
  // Inicialização síncrona dos estados globais com base na persistência local
  const [user, setUser] = useState(initialToken ? authStorage.getUser() : null);
  const [token, setToken] = useState(initialToken);
  const [activeRole, setActiveRole] = useState(initialToken ? authStorage.getActiveRole() : null);
  const [theme, setThemeState] = useState(initialToken ? authStorage.getTheme() : 'light');
  const [language, setLanguageState] = useState(initialToken ? authStorage.getLanguage() : 'pt');
  const [socket, setSocket] = useState(null);
  const [countsVersion, setCountsVersion] = useState(0);

  const triggerCountsUpdate = useCallback(() => {
    setCountsVersion(v => v + 1);
  }, []);

  // Propriedade Computada: Extrai dinamicamente a lista de IDs de perfis numéricos do utilizador logado para fins de RBAC visual
  const allowedRoles = useMemo(() => {
    if (!user?.perfis?.length) return [];
    return user.perfis.map(p => typeof p === 'object' ? Number(p.id_perfil) : Number(p));
  }, [user?.perfis]);

  /**
   * MUTADOR: setTheme
   * Atualiza o tema visual da interface, persiste em disco local e sincroniza assincronamente com a BD do utilizador.
   */
  const setTheme = async (newTheme) => {
    setThemeState(newTheme); // Atualização instantânea da UI (Optimistic Update)
    authStorage.setTheme(newTheme); // Persiste no LocalStorage
    
    if (user?.id_utilizador) {
      try {
        // Mapeia o nome do tema para o código estrito inteiro esperado pela BD do Backend
        const themaCode = newTheme === 'system' ? 1 : (newTheme === 'dark' ? 3 : 2);
        // Comunicação de persistência remota via Axios
        await api.put(`/utilizador/${user.id_utilizador}`, { thema: themaCode });
      } catch (err) {
        console.error('Failed to save theme to DB', err); // Tratamento silencioso para não quebrar a UX do cliente
      }
    }
  };

  /**
   * MUTADOR: setLanguage
   * Sincroniza dinamicamente as traduções do frontend via i18next e atualiza a preferência na base de dados remota.
   */
  const setLanguage = async (lang) => {
    setLanguageState(lang);
    authStorage.setLanguage(lang);
    await i18n.changeLanguage(lang); // Força a biblioteca de tradução a re-renderizar os textos no cliente
    triggerCountsUpdate(); // Dispara re-fetch em tempo real das listagens e contadores no novo idioma
    
    if (user?.id_utilizador) {
      try {
        await api.put(`/utilizador/${user.id_utilizador}`, { idioma_preferencial: lang });
      } catch (err) {
        console.error('Failed to save language to DB', err);
      }
    }
  };

  /**
   * LÓGICA DE ONBOARDING DE SESSÃO: applySession
   * Método disparado imediatamente após o sucesso de um Login ou alteração de credenciais.
   * Alimenta os estados globais e configura as preferências de acessibilidade recuperadas do utilizador.
   */
  const applySession = async ({ token: newToken, user: newUser, strongestRole }) => {
    setToken(newToken);
    setUser(newUser);
    setActiveRole(strongestRole); // Define a vista inicial padrão baseada no perfil com maior nível de acesso
    authStorage.setActiveRole(strongestRole); // Persiste o perfil ativo inicial no localStorage

    // Se a conta já possuir preferências gravadas no backend, aplica-as imediatamente na interface
    if (newUser?.thema !== undefined && newUser?.thema !== null) {
      setTheme(mapThemaCodeToTheme(newUser.thema));
    }
    if (newUser?.idioma_preferencial) {
      await setLanguage(newUser.idioma_preferencial);
    }
  };

  /**
   * MECÂNICA MULTI-PERFIL (VISTAS POLIMÓRFICAS): changeRoleView
   * Permite que utilizadores com múltiplos perfis (ex: um SLL que também é consultor) 
   * alternem a sua barra de menus e dashboard na interface sem precisar de deslogar da conta.
   */
  const changeRoleView = (roleId) => {
    if (!allowedRoles.includes(roleId)) return; // Firewall visual: impede injeções de perfis não atribuídos
    setActiveRole(roleId);
    authStorage.setActiveRole(roleId); // Sincroniza o LocalStorage para que o refresh preserve a vista selecionada
  };

  /**
   * DESTRUTOR: logout
   * Método que limpa por completo a sessão, apaga os rastros no disco local, revoga o token no backend 
   * e repõe todas as configurações visuais para o estado de fábrica neutro.
   */
  const logout = () => {
    const currentToken = token; // Captura o token do estado para evitar condição de corrida
    authStorage.clearSession(); // Limpa o LocalStorage de imediato
    sessionStorage.clear(); // Limpa a sessionStorage para repor o estado de cumprimento no próximo login
    authController.logout(currentToken); // Envia o sinal à API de forma assíncrona com o token capturado
    setToken(null);
    setUser(null);
    setActiveRole(null);
    setThemeState('light');
    setLanguageState('pt');
    i18n.changeLanguage('pt');

    // Redireciona o utilizador para a Landing Page (https://www.softbadge.pt em produção ou http://localhost:3002 em dev)
    window.location.href = getLandingPageURL();
  };

  /**
   * MUTADOR: renewSession
   * Faz uma chamada ao endpoint de refresh token no backend para prolongar a sessão por mais 1 hora.
   */
  const renewSession = async () => {
    try {
      const res = await api.post('/auth/refresh-token');
      if (res.data?.success) {
        const { token: newToken, utilizador: newUser } = res.data.data;
        authStorage.setToken(newToken);
        authStorage.setUser(newUser);
        setToken(newToken);
        setUser(newUser);

        import('sweetalert2').then((Swal) => {
          Swal.default.fire({
            icon: 'success',
            title: t('sessionRenewedTitle'),
            text: t('sessionRenewedText'),
            timer: 2000,
            showConfirmButton: false
          });
        });
      }
    } catch (err) {
      console.error('Falha ao renovar sessão:', err);
      logout();
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          icon: 'error',
          title: t('sessionExpiredTitle'),
          text: t('sessionRenewErrorText'),
          confirmButtonText: 'OK',
          allowOutsideClick: false
        }).then(() => {
          window.location.href = '/login';
        });
      });
    }
  };

  /**
   * MUTADOR: refreshSession
   * Renovação silenciosa de token e sessão (sem popup) após atualizações cadastrais ou de preferências.
   */
  const refreshSession = async () => {
    try {
      const res = await api.post('/auth/refresh-token');
      if (res.data?.success && res.data.data) {
        const { token: newToken, utilizador: newUser } = res.data.data;
        if (newToken) {
          authStorage.setToken(newToken);
          setToken(newToken);
        }
        if (newUser) {
          authStorage.setUser(newUser);
          setUser(newUser);
        }
        return { token: newToken, user: newUser };
      }
    } catch (err) {
      console.warn('Silent session refresh warning:', err);
    }
    return null;
  };

  // Gestão de Conexão WebSocket e Notificação de Perfil Ativo
  useEffect(() => {
    if (token) {
      const s = socketService.connect(token);
      setSocket(s);
      if (activeRole) {
        socketService.emitActiveProfile(activeRole);
      }
    } else {
      socketService.disconnect();
      setSocket(null);
    }
  }, [token, activeRole]);

  // Escuta ativa em tempo real para o evento profile_updated (Revogação/Atribuição Instantânea de Perfis)
  useEffect(() => {
    if (!socket || !user) return;

    const handleProfileUpdated = (data) => {
      console.log('Evento profile_updated recebido via WebSocket:', data);

      // 1. Atualizar os perfis do utilizador no estado e no LocalStorage (reidratação)
      const updatedUser = { ...user, perfis: data.perfis || [] };
      setUser(updatedUser);
      authStorage.setUser(updatedUser);

      // 2. Se o perfil ativo no Header foi revogado, mudar automaticamente para Consultor (ROLE.CON = 4)
      const activeRolesIds = (data.perfis || []).map(p => Number(p.id_perfil));
      if (activeRole && !activeRolesIds.includes(Number(activeRole))) {
        const fallbackRole = activeRolesIds.includes(ROLE.CON) ? ROLE.CON : (activeRolesIds[0] || ROLE.CON);
        setActiveRole(fallbackRole);
        authStorage.setActiveRole(fallbackRole);
      }

      // 3. Notificar o utilizador no ecrã via SweetAlert2
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          icon: 'info',
          title: t('userRolesTitle', 'Perfis Atualizados'),
          text: data.message || 'As suas permissões foram atualizadas pelo administrador.',
          timer: 4000,
          showConfirmButton: true,
          confirmButtonColor: '#0284c7'
        });
      });
    };

    const handleRgpdPolicyChanged = (data) => {
      console.log('Evento de política RGPD alterada recebido:', data);
      import('sweetalert2').then((Swal) => {
        const toast = Swal.default.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true
        });

        toast.fire({
          icon: 'info',
          title: t('rgpdUpdatedTitle', 'Termos RGPD Atualizados'),
          text: t('rgpdUpdatedMessage', 'A Política de Termos e Consentimento RGPD foi atualizada e deve ser consultada.')
        });
      });
    };

    socket.on('profile_updated', handleProfileUpdated);
    socket.on('politica_rgpd_alterada', handleRgpdPolicyChanged);

    // Escutar canal privado do utilizador (user_${id_utilizador})
    const userChannel = `user_${user?.id_utilizador}`;
    const handlePrivateProfileUpdate = (data) => {
      console.log('Evento privado do utilizador recebido via WebSocket:', data);
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({
          icon: 'info',
          title: t('accessUpdatedTitle', 'Acesso Atualizado'),
          text: data?.message || t('accessUpdatedText', 'As suas permissões de liderança foram atualizadas. A atualizar a página...'),
          timer: 2500,
          showConfirmButton: false
        }).then(() => {
          window.location.reload();
        });
      });
    };

    if (user?.id_utilizador) {
      socket.on(userChannel, handlePrivateProfileUpdate);
    }

    return () => {
      socket.off('profile_updated', handleProfileUpdated);
      socket.off('politica_rgpd_alterada', handleRgpdPolicyChanged);
      if (user?.id_utilizador) {
        socket.off(userChannel, handlePrivateProfileUpdate);
      }
    };
  }, [socket, user, activeRole, t]);

  // Centralized real-time update trigger for sidebar and counters
  useEffect(() => {
    if (!socket) return;

    const handleAnyRealtimeChange = () => {
      triggerCountsUpdate();
    };

    socket.on('candidatura_especial_submetida', handleAnyRealtimeChange);
    socket.on('nova_candidatura_especial', handleAnyRealtimeChange);
    socket.on('candidatura_especial_aprovada', handleAnyRealtimeChange);
    socket.on('candidatura_especial_recusada', handleAnyRealtimeChange);
    socket.on('candidatura_submetida', handleAnyRealtimeChange);
    socket.on('candidatura_pre_aprovada', handleAnyRealtimeChange);
    socket.on('candidatura_aprovada', handleAnyRealtimeChange);
    socket.on('candidatura_rejeitada', handleAnyRealtimeChange);
    socket.on('candidatura_badge_emitido', handleAnyRealtimeChange);
    socket.on('conquista_especial_criada', handleAnyRealtimeChange);
    socket.on('conquista_especial_atualizada', handleAnyRealtimeChange);
    socket.on('conquista_especial_removida', handleAnyRealtimeChange);
    socket.on('novo_marco', handleAnyRealtimeChange);
    socket.on('marco_updated', handleAnyRealtimeChange);
    socket.on('marco_criado', handleAnyRealtimeChange);
    socket.on('marco_removido', handleAnyRealtimeChange);
    socket.on('badge_updated', handleAnyRealtimeChange);
    socket.on('gestao_area', handleAnyRealtimeChange);
    socket.on('user_updated', handleAnyRealtimeChange);
    socket.on('nova_notificacao', handleAnyRealtimeChange);
    socket.on('notification', handleAnyRealtimeChange);

    return () => {
      socket.off('candidatura_especial_submetida', handleAnyRealtimeChange);
      socket.off('nova_candidatura_especial', handleAnyRealtimeChange);
      socket.off('candidatura_especial_aprovada', handleAnyRealtimeChange);
      socket.off('candidatura_especial_recusada', handleAnyRealtimeChange);
      socket.off('candidatura_submetida', handleAnyRealtimeChange);
      socket.off('candidatura_pre_aprovada', handleAnyRealtimeChange);
      socket.off('candidatura_aprovada', handleAnyRealtimeChange);
      socket.off('candidatura_rejeitada', handleAnyRealtimeChange);
      socket.off('candidatura_badge_emitido', handleAnyRealtimeChange);
      socket.off('conquista_especial_criada', handleAnyRealtimeChange);
      socket.off('conquista_especial_atualizada', handleAnyRealtimeChange);
      socket.off('conquista_especial_removida', handleAnyRealtimeChange);
      socket.off('novo_marco', handleAnyRealtimeChange);
      socket.off('marco_updated', handleAnyRealtimeChange);
      socket.off('marco_criado', handleAnyRealtimeChange);
      socket.off('marco_removido', handleAnyRealtimeChange);
      socket.off('badge_updated', handleAnyRealtimeChange);
      socket.off('gestao_area', handleAnyRealtimeChange);
      socket.off('user_updated', handleAnyRealtimeChange);
      socket.off('nova_notificacao', handleAnyRealtimeChange);
      socket.off('notification', handleAnyRealtimeChange);
    };
  }, [socket, triggerCountsUpdate]);

  // Temporizadores de controlo do tempo de expiração do JWT (Session Lifespan Engine)
  useEffect(() => {
    if (!token) return;

    const expTime = getJwtExpiry(token);
    if (!expTime) return;

    const checkTimers = () => {
      const now = Date.now();
      const timeLeft = expTime - now;
      const warningThreshold = 3 * 60 * 1000; // 3 minutos em milissegundos

      if (timeLeft <= 0) {
        logout();
        import('sweetalert2').then((Swal) => {
          Swal.default.fire({
            icon: 'warning',
            title: t('sessionExpiredTitle'),
            text: t('sessionExpiredText'),
            confirmButtonText: 'OK',
            allowOutsideClick: false
          }).then(() => {
            window.location.href = '/login';
          });
        });
        return null;
      }

      const timeToWarning = timeLeft - warningThreshold;

      let warningTimer;
      if (timeToWarning > 0) {
        warningTimer = setTimeout(() => {
          import('sweetalert2').then((Swal) => {
            Swal.default.fire({
              icon: 'question',
              title: t('sessionWarningTitle'),
              text: t('sessionWarningText'),
              showCancelButton: true,
              confirmButtonText: t('sessionRenewConfirmBtn'),
              cancelButtonText: t('sessionRenewCancelBtn'),
              allowOutsideClick: false
            }).then((result) => {
              if (result.isConfirmed) {
                renewSession();
              }
            });
          });
        }, timeToWarning);
      } else {
        // Caso restem menos de 3 minutos logo ao iniciar
        import('sweetalert2').then((Swal) => {
          Swal.default.fire({
            icon: 'question',
            title: t('sessionWarningTitle'),
            text: t('sessionWarningTextSoon'),
            showCancelButton: true,
            confirmButtonText: t('sessionRenewConfirmBtn'),
            cancelButtonText: t('sessionRenewCancelBtn'),
            allowOutsideClick: false
          }).then((result) => {
            if (result.isConfirmed) {
              renewSession();
            }
          });
        });
      }

      const logoutTimer = setTimeout(() => {
        logout();
        import('sweetalert2').then((Swal) => {
          Swal.default.close(); // Fecha o SweetAlert de aviso caso ainda esteja aberto
          Swal.default.fire({
            icon: 'warning',
            title: t('sessionExpiredTitle'),
            text: t('sessionExpiredTimeText'),
            confirmButtonText: 'OK',
            allowOutsideClick: false
          }).then(() => {
            window.location.href = '/login';
          });
        });
      }, timeLeft);

      return { warningTimer, logoutTimer };
    };

    const timers = checkTimers();

    return () => {
      if (timers) {
        if (timers.warningTimer) clearTimeout(timers.warningTimer);
        if (timers.logoutTimer) clearTimeout(timers.logoutTimer);
      }
    };
  }, [token, language]);

  // OTIMIZAÇÃO CRÍTICA DE PERFORMANCE: useMemo
  // Enclausura o objeto de propriedades garantindo que ele só seja reconstruído na memória RAM
  // se algum dos estados dentro do array de dependências sofrer alteração real. 
  // Evita re-renderizações cíclicas e pesadas desnecessárias nos componentes consumidores.
  const value = useMemo(() => ({
    user, setUser, token, setToken, activeRole, allowedRoles, theme, language, socket, countsVersion,
    setTheme, setLanguage, applySession, changeRoleView, logout, renewSession, refreshSession, triggerCountsUpdate,
  }), [user, token, activeRole, allowedRoles, theme, language, socket, countsVersion, triggerCountsUpdate]);

  // Renderiza o Provedor injetando a coleção otimizada de propriedades na árvore de componentes filhos
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Exportação do Hook Customizado: Permite o consumo simplificado em qualquer ponto do projeto via "const { user } = useAppContext()"
export const useAppContext = () => useContext(AppContext);