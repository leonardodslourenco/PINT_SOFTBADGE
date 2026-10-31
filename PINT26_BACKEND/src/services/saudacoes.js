// =========================================================================
// IMPORTAÇÃO DE MODELOS ORM DA BASE DE DADOS
// =========================================================================
const TraducaoConteudo = require('../models/traducao_conteudo.model'); // Tabela centralizada para ler traduções guardadas no PostgreSQL

// ENUMERAÇÃO (DICTIONARY): Mapeamento das chaves identificadoras
// utilizadas nas tabelas lógicas para mapear cada tipo de saudação.
const CHAVES_SAUDACAO = {
  WELCOME: 'saudacao_welcome',
  WELCOME_AGAIN: 'saudacao_welcome_again',
  GOOD_MORNING: 'saudacao_good_morning',
  GOOD_AFTERNOON: 'saudacao_good_afternoon',
  GOOD_NIGHT: 'saudacao_good_night'
};

// ESTRATÉGIA DE GRACEFUL DEGRADATION (FALLBACK ESTÁTICO):
// Matriz de dados local que funciona como uma rede de segurança de infraestrutura.
// Se a base de dados estiver inacessível, em manutenção ou sem estas chaves populadas,
// o sistema consome este dicionário em memória para assegurar que a interface não quebra.
const FALLBACK = {
  saudacao_welcome: {
    pt: 'Bem-Vindo!',
    en: 'Welcome!',
    es: 'Bienvenido!'
  },
  saudacao_welcome_again: {
    pt: 'Bem-vindo novamente!',
    en: 'Welcome back!',
    es: 'Bienvenido de nuevo!'
  },
  saudacao_good_morning: {
    pt: 'Bom Dia!',
    en: 'Good Morning!',
    es: 'Buenos Días!'
  },
  saudacao_good_afternoon: {
    pt: 'Boa Tarde!',
    en: 'Good Afternoon!',
    es: 'Buenas Tardes!'
  },
  saudacao_good_night: {
    pt: 'Boa Noite!',
    en: 'Good Evening!',
    es: 'Buenas Noches!'
  }
};

// Constantes temporais de controlo de regras de negócio
const LAST_LOGIN_DEFAULT_YEAR = 1970;                     // Ano padrão da Época Unix que sinaliza que o utilizador nunca fez login
const QUINZE_DIAS_MS = 15 * 24 * 60 * 60 * 1000;          // Equivalente matemático de 15 dias convertidos em milissegundos

// =========================================================================
// FUNÇÕES AUXILIARES / INTERNAS (MÉTODOS PRIVADOS DE SUPORTE)
// =========================================================================

/**
 * PARSER DE DATAS DEFENSIVO: Tenta instanciar o carimbo de data recebido.
 * Caso o formato seja inválido ou corrompido, retorna nulo em vez de crashar a execução com um NaN.
 */
function parseDateSafe(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * MOTOR DE REGRAS DE NEGÓCIO: Avalia o histórico de acessos e determina 
 * qual a chave linguística ideal a aplicar com base no comportamento do utilizador.
 */
function obterChavePorRegra(lastLogin) {
  const lastLoginDate = parseDateSafe(lastLogin);
  
  // REGRA 1 (Primeiro Acesso / Onboarding): Se a data for inválida ou o ano for igual/menor a 1970,
  // significa que a conta foi recém-criada administrativa e nunca acedeu ao sistema. Devolve "Bem-Vindo!".
  if (!lastLoginDate || lastLoginDate.getUTCFullYear() <= LAST_LOGIN_DEFAULT_YEAR) {
    return CHAVES_SAUDACAO.WELCOME;
  }

  // REGRA 2 (Utilizador Retornado / Ausente): Calcula a diferença entre o carimbo atual e o último acesso.
  // Se a ausência for igual ou superior a 15 dias, saúda com "Bem-vindo novamente!".
  const diffMs = Date.now() - lastLoginDate.getTime();
  if (diffMs >= QUINZE_DIAS_MS) {
    return CHAVES_SAUDACAO.WELCOME_AGAIN;
  }

  // REGRA 3 (Utilizador Recorrente / Frequente): Se acedeu recentemente, baseia-se na hora atual do servidor.
  const horaAtual = new Date().getHours();
  if (horaAtual >= 6 && horaAtual < 12) return CHAVES_SAUDACAO.GOOD_MORNING;   // Janela das 06:00 às 11:59 -> Bom Dia
  if (horaAtual >= 12 && horaAtual < 19) return CHAVES_SAUDACAO.GOOD_AFTERNOON; // Janela das 12:00 às 18:59 -> Boa Tarde
  return CHAVES_SAUDACAO.GOOD_NIGHT;                                           // Restantes horários -> Boa Noite
}

// =========================================================================
// MÉTODOS EXPOSTOS / CORE DOMAIN LOGIC (API DO SERVIÇO)
// =========================================================================

/**
 * CORE METHOD: obterSaudacao
 * Consolida as regras analíticas do login e devolve a string textual final já traduzida.
 */
async function obterSaudacao({ lastLogin, lang = 'pt' }) {
  // Firewall de Idiomas: Valida se a língua submetida faz parte da matriz aceite pela plataforma.
  // Caso enviem um idioma não mapeado, força dinamicamente o fallback para português ('pt').
  const idioma = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';
  
  // Invoca o motor analítico temporal para descobrir a chave correspondente ao contexto do utilizador
  const coluna = obterChavePorRegra(lastLogin);

  // Consulta assincronamente a base de dados PostgreSQL para ler a tradução personalizada gravada
  const traducao = await TraducaoConteudo.findOne({
    where: {
      tabela: 'sistema',
      coluna
    }
  });

  // Resolução de Fallback em Cascata de Texto:
  // Se a BD falhar, lê o dicionário local na língua selecionada. Se esta também falhar,
  // usa a variante em português local. Se tudo falhar, assume uma string genérica segura 'Bem-Vindo!'.
  const fallbackTexto = FALLBACK[coluna]?.[idioma] || FALLBACK[coluna]?.pt || 'Bem-Vindo!';
  
  // Retorna o texto extraído da BD ou aciona o fallback resolvido
  return traducao?.[idioma] || fallbackTexto;
}

// Exportação do serviço para ser acoplado nos fluxos de Autenticação/Login da API
module.exports = {
  obterSaudacao
};