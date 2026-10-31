// =========================================================================
// IMPORTAÇÃO DE MODELOS REMOTOS, CONSTANTES E COMPONENTES DE ARMAZENAMENTO
// =========================================================================
import { authModel } from '../models/authModel';     // Camada Model encarregue de efetuar as chamadas HTTP via Axios ao Backend
import { ROLE_PRIORITY } from '../constants/roles'; // Array ordenado por relevância hierárquica (ex: [ADMIN, SLL, TM, CON])
import { authStorage } from '../services/authStorage'; // Camada de infraestrutura que manipula o LocalStorage do browser

/**
 * MOTOR DE PRIORIZAÇÃO: getStrongestRole
 * Varre a lista de perfis do utilizador e encontra o cargo com maior peso hierárquico 
 * baseado no array ordenado ROLE_PRIORITY. Caso falte, assume por segurança o último nível (Consultor).
 */
const getStrongestRole = (roles = []) => 
  ROLE_PRIORITY.find((role) => roles.includes(role)) || ROLE_PRIORITY.at(-1);

// Objeto que agrupa e exporta os métodos públicos deste controlador frontend
export const authController = {
  getStrongestRole,

  /**
   * INTERCEÇÃO CORE: login
   * Gere o processamento de credenciais, resolve estados bloqueantes e inicializa sessões locais.
   */
  login: async ({ email, password }) => {
    // Comunicação com o servidor através do modelo de dados
    const result = await authModel.login({ email, password });

    // 1. TRATAMENTO DE FALHA DE REDE OU AUTENTICAÇÃO:
    // Se o backend responder explicitamente com erro (credenciais inválidas, conta inativa, etc.)
    if (!result?.success) {
      throw new Error(result?.message || 'Falha no login.'); // Dispara erro para trancar o fluxo e alertar a UI
    }

    // 2. RESOLUÇÃO DE MÁQUINA DE ESTADOS INTERMÉDIA (Ações Bloqueantes):
    // Captura os estados sinalizados pelo Backend (ex: EMAIL_VERIFICATION_REQUIRED ou RECOVERY_TEMP_EXPIRED).
    // O controlador desvia o fluxo normal e retorna o sinal para o ecrã redirecionar para a página correta.
    if (result?.data?.action) {
      return { blockedAction: result.data.action, raw: result };
    }

    // 3. FLUXO DE LOGIN INTEGRAL (Sucesso absoluto):
    // Extrai o Bearer Token e os metadados cadastrais do utilizador
    const token = result?.data?.token;
    const user = result?.data?.utilizador;

    // Validação de Integridade defensiva do payload recebido do servidor
    if (!token || !user) {
      throw new Error('Resposta de login incompleta.');
    }

    // Determina dinamicamente a vista de entrada principal baseada na maior permissão do utilizador
    const strongestRole = getStrongestRole(user.perfis || []);
    // Captura a saudação contextual cronológica gerada no backend (ex: "Bom Dia!")
    const saudacao = result?.data?.saudacao || null;
    const sessionUser = { ...user, saudacao }; // Enriquece o objeto de utilizador em sessão

    // PERSISTÊNCIA FÍSICA NO LOCALSTORAGE (Sessão Segura):
    // Grava as chaves no disco local do cliente para reidratação de estado em caso de F5/Refresh
    authStorage.setToken(token);
    authStorage.setUser(sessionUser);
    authStorage.setActiveRole(strongestRole);
    if (user.idioma_preferencial) authStorage.setLanguage(user.idioma_preferencial);

    // Retorna a coleção consolidada para o formulário e o AppContext consumirem
    return { token, user: sessionUser, strongestRole, raw: result };
  },

  /**
   * DESTRUTOR: logout
   * Evapora os dados de sessão no cliente acionando o método de limpeza do LocalStorage
   * e invalidando o token no backend.
   */
  logout: async (token) => {
    try {
      await authModel.logout(token);
    } catch (e) {
      console.error('Erro ao revogar token no backend:', e);
    } finally {
      authStorage.clearSession();
    }
  },
};