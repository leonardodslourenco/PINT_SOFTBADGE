/**
 * Função utilitária para procurar e validar variáveis de ambiente.
 * Recebe uma lista de chaves (...keys) e percorre-as por ordem.
 * Retorna a primeira variável que exista, não seja nula e não esteja vazia.
 * * @param {...string} keys - Lista de chaves a procurar no process.env
 * @returns {string|undefined} O valor da variável limpo (trim) ou undefined
 */

function envValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim(); // Retorna o valor removendo espaços
    }
  }
  return undefined;
}

// Exporta um objeto centralizado com todas as configurações do sistema
module.exports = {
  // CONFIGURAÇÕES DE AUTENTICAÇÃO E SEGURANÇA
  AUTH: {
    // Número máximo de falhas permitidas antes de bloquear o login (padrão: 3)
    MAX_TENTATIVAS_LOGIN: Number(envValue('MAX_TENTATIVAS_LOGIN') || 3),
    // Chave secreta para assinar os tokens JWT
    JWT_SECRET: envValue('JWT_SECRET') || 'dev_change_me_in_production',
    // Tempo de vida do token de acesso JWT (padrão: 1h para web, 7d para mobile, fallback geral 1h)
    JWT_EXPIRES_IN_WEB: envValue('JWT_EXPIRES_IN_WEB') || '1h',
    JWT_EXPIRES_IN_MOBILE: envValue('JWT_EXPIRES_IN_MOBILE') || '7d',
    JWT_EXPIRES_IN: envValue('JWT_EXPIRES_IN') || '1h',
    // Tempo de validade do token enviado para o email para recuperar a password (padrão: 10 min)
    RECOVERY_TOKEN_EXPIRES_IN: envValue('RECOVERY_TOKEN_EXPIRES_IN') || '10m',
    // Tempo que uma password temporária/recuperada permanece válida (padrão: 60 min)
    RECOVERY_TEMP_VALID_MINUTES: Number(envValue('RECOVERY_TEMP_VALID_MINUTES') || 60),
    // Tempo limite para o utilizador introduzir o código de verificação do email (padrão: 60 min)
    EMAIL_VERIFICATION_CODE_VALID_MINUTES: Number(envValue('EMAIL_VERIFICATION_CODE_VALID_MINUTES') || 60)
  },
  // CONFIGURAÇÕES DO SERVIDOR DE EMAIL (SMTP)
  SMTP: {
    // Endereço do servidor que vai disparar os emails da aplicação
    HOST: envValue('SMTP_HOST') || 'smtp.example.com',
    // Porto do servidor SMTP (geralmente 465 para SSL/Seguro)
    PORT: Number(envValue('SMTP_PORT') || 465),
    // Converte o texto para Booleano (true/false) para saber se a ligação deve usar SSL seguro
    SECURE: String(envValue('SMTP_SECURE') || 'true').toLowerCase() === 'true',
    // Credenciais (Utilizador e Palavra-passe) da conta de email do sistema
    USER: envValue('SMTP_USER') || 'email@example.com',
    PASS: envValue('SMTP_PASS') || 'Pass123',
    // Nome/Email que vai aparecer como remetente nas mensagens enviadas aos utilizadores
    FROM: envValue('SMTP_FROM') || 'noreply@example.com',
    // Define se o sistema deve rejeitar certificados SSL que não sejam autorizados/válidos
    TLS_REJECT_UNAUTHORIZED: String(envValue('SMTP_TLS_REJECT_UNAUTHORIZED') || 'true').toLowerCase() === 'true'
  },
  // CONFIGURAÇÕES DO TRADUTOR/IAEDU
  TRADUTOR: {
    // Procura por TRANSLATOR_API_ENDPOINT ou IAEDU_API_ENDPOINT.
    API_ENDPOINT: envValue('TRANSLATOR_API_ENDPOINT', 'IAEDU_API_ENDPOINT') || null,
    // URL base do serviço de Inteligência Artificial / Agente de Chat da IAEDU
    API_BASE_URL: envValue('TRANSLATOR_API_BASE_URL', 'IAEDU_API_BASE_URL') || 'https://api.iaedu.pt/agent-chat/api/v1/agent',
    // Chaves de identificação e autenticação necessárias para consumir o serviço externo
    AGENT_ID: envValue('TRANSLATOR_AGENT_ID', 'IAEDU_AGENT_ID') || '',
    // IDs de canal e conversação (thread) para manter o contexto do chat/tradução
    API_KEY: envValue('TRANSLATOR_API_KEY', 'IAEDU_API_KEY') || '',
    CHANNEL_ID: envValue('TRANSLATOR_CHANNEL_ID', 'IAEDU_CHANNEL_ID') || '',
    // IDs de canal e conversação (thread) para manter o contexto do chat/tradução
    THREAD_ID: envValue('TRANSLATOR_THREAD_ID', 'IAEDU_THREAD_ID') || '',
    // Tempo máximo de espera (Timeout) para a resposta da API de IA
    TIMEOUT_MS: Number(envValue('TRANSLATOR_TIMEOUT_MS', 'IAEDU_TIMEOUT_MS') || 120000)
  },
  // CONFIGURAÇÕES DE UTILIZADOR
  UTILIZADOR: {
    // Identificador (ID) do perfil correspondente ao Consultor Padrão na base de dados (ID: 4)
    PERFIL_CONSULTOR_PADRAO: Number(envValue('PERFIL_CONSULTOR_PADRAO') || 4),
    // Imagem de avatar atribuída automaticamente a novos utilizadores que não carreguem uma foto
    DEFAULT_AVATAR: envValue('DEFAULT_AVATAR') || 'default_avatar.png'
  },
  // CONFIGURAÇÕES DO FIREBASE ADMIN (NOTIFICAÇÕES PUSH ANDROID / FLUTTER)
  FIREBASE: {
    // Caminho para o ficheiro JSON da Service Account ou credenciais em JSON string
    SERVICE_ACCOUNT_PATH: envValue('FIREBASE_SERVICE_ACCOUNT_PATH', 'GOOGLE_APPLICATION_CREDENTIALS') || 'firebase-service-account.json',
    SERVICE_ACCOUNT_JSON: envValue('FIREBASE_SERVICE_ACCOUNT_JSON') || null,
    PROJECT_ID: envValue('FIREBASE_PROJECT_ID') || null
  }
};