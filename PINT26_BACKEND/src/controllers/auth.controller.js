const argon2 = require('argon2');                        // Algoritmo para encriptação e verificação de hashes
const jwt = require('jsonwebtoken');                     // Utilizado para assinar e validar JSON Web Tokens (Tokens de Acesso)
const Utilizador = require('../models/utilizador.model'); // Modelo da entidade Utilizador
const Perfil = require('../models/perfil.model');         // Modelo dos Perfis/Permissões do utilizador
const sequelize = require('../config/database');          // Instância do Sequelize para controlo ACID por transações SQL
const { AUTH } = require('../config/parameters');         // Parâmetros globais de tempo de expiração e tentativas limite
const { gerarCodigoEpassword } = require('../services/geradores'); // Utilitário que gera hashes e segredos aleatórios
const { obterSaudacao } = require('../services/saudacoes');       // Devolve saudações contextuais ao utilizador com base na hora
const { revokeToken } = require('../services/tokenBlacklist');     // Adiciona tokens em Blacklist para invalidação no Logout
const enviarEmail = require('../config/smtp');           // Função responsável pelo disparo de e-mails via SMTP
const { templateRecuperacaoPassword, templateReenvioCodigo, templateRenovacaoCredenciais } = require('../services/emailTemplates');
const { formatTempoRestante } = require('../services/formatador'); // Serviço de formatação de texto de tempo

const controllersAuth = {};

// =========================================================================
// INICIALIZAÇÃO DE CONSTANTES DE AUTENTICAÇÃO
// =========================================================================
const MAX_TENTATIVAS = AUTH.MAX_TENTATIVAS_LOGIN;               // Limite de falhas antes de bloquear a conta (ex: 3)
const JWT_EXPIRES_IN = AUTH.JWT_EXPIRES_IN || '1h';                     // Tempo de validade padrão do Token de sessão (ex: '1h')
const JWT_EXPIRES_IN_WEB = AUTH.JWT_EXPIRES_IN_WEB || '1h';             // Tempo de validade do Token para Web (1 hora)
const JWT_EXPIRES_IN_MOBILE = AUTH.JWT_EXPIRES_IN_MOBILE || '7d';       // Tempo de validade do Token para Mobile (7 dias)
const JWT_SECRET = AUTH.JWT_SECRET;                             // Chave criptográfica secreta usada pelo servidor
const RECOVERY_TOKEN_EXPIRES_IN = AUTH.RECOVERY_TOKEN_EXPIRES_IN; // Validade dos tokens de transição (ex: '10m')
const RECOVERY_TEMP_VALID_MS = AUTH.RECOVERY_TEMP_VALID_MINUTES * 60 * 1000; // Converte minutos da pass temporária para milissegundos
const EMAIL_VERIFICATION_CODE_VALID_MS = AUTH.EMAIL_VERIFICATION_CODE_VALID_MINUTES * 60 * 1000; // Validade do código de verificação
const DEFAULT_TEMP_TIMESTAMP = "1970-01-01T00:00:00Z";          // Timestamp padrão usado para limpar as credenciais temporárias

// =========================================================================
// FACTORIES E HELPERS DE SEGURANÇA (MÉTODOS PRIVADOS / UTILITÁRIOS)
// =========================================================================

/**
 * HELPER: Filtra os perfis ativos de um utilizador (ignora relacionamentos desativados logicamente).
 */
const buildPerfisAtivos = (utilizador) => (utilizador.perfis || [])
  .filter(p => p.perfil_utilizador?.relacionamentoAtivo !== false)
  .map(p => p.id_perfil);

/**
 * HELPER: Identifica a plataforma do cliente (Web vs Mobile) com base no cabeçalho X-Client-Platform
 * e fallback por User-Agent.
 */
const resolveClientPlatform = (req) => {
  const headerPlatform = (
    req?.headers?.['x-client-platform'] ||
    req?.headers?.['x-platform'] ||
    ''
  ).toString().trim().toLowerCase();

  if (['mobile', 'android', 'ios', 'flutter'].includes(headerPlatform)) {
    return 'mobile';
  }
  if (['web', 'browser'].includes(headerPlatform)) {
    return 'web';
  }

  // Fallback secundário por User-Agent (caso o cliente móvel ainda não envie o cabeçalho customizado)
  const userAgent = (req?.headers?.['user-agent'] || '').toString().toLowerCase();
  if (
    userAgent.includes('dart') ||
    userAgent.includes('flutter') ||
    userAgent.includes('okhttp') ||
    userAgent.includes('mobile')
  ) {
    return 'mobile';
  }

  // Padrão seguro é Web (1 hora)
  return 'web';
};

/**
 * HELPER: Retorna a string de expiração para o jsonwebtoken de acordo com a plataforma.
 */
const getExpiresInForPlatform = (platform) => {
  return platform === 'mobile' ? JWT_EXPIRES_IN_MOBILE : JWT_EXPIRES_IN_WEB;
};

/**
 * HELPER: Converte string de expiração (ex: '1h', '7d', '10m') para segundos numéricos inteiros.
 */
const getExpiresInSeconds = (expiresInStr) => {
  const str = String(expiresInStr || '1h').trim().toLowerCase();
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 3600;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 's') return val;
  if (unit === 'm') return val * 60;
  if (unit === 'h') return val * 3600;
  if (unit === 'd') return val * 86400;
  return 3600;
};

/**
 * FACTORY JWT: Assina o token de autenticação principal (Bearer Token) injetando o payload no formato correto
 * com validade adaptada à plataforma (Web: 1h vs Mobile: 7d).
 */
const buildAuthToken = (utilizador, perfisAtivos, saudacao, platform = 'web') => {
  const expiresIn = getExpiresInForPlatform(platform);
  return jwt.sign({
    sub: utilizador.id_utilizador,
    email: utilizador.email,
    avatar: utilizador.avatar,
    idioma_preferencial: utilizador.idioma_preferencial,
    thema: utilizador.thema,
    perfis: perfisAtivos,
    password_default: utilizador.password_default,
    id_area: utilizador.id_area,
    recomendacoes_badge: utilizador.recomendacoes_badge || 6,
    aceitou_rgpd: Boolean(utilizador.aceitou_rgpd),
    client_platform: platform,
    saudacao
  }, JWT_SECRET, { expiresIn });
};

controllersAuth.buildAuthToken = buildAuthToken;
controllersAuth.buildPerfisAtivos = buildPerfisAtivos;
controllersAuth.resolveClientPlatform = resolveClientPlatform;
controllersAuth.getExpiresInForPlatform = getExpiresInForPlatform;
controllersAuth.getExpiresInSeconds = getExpiresInSeconds;

/**
 * FACTORY JWT: Cria um token específico para o desafio intermédio de recuperação de password.
 */
const buildRecoveryChallengeToken = (utilizador) => jwt.sign({
  sub: utilizador.id_utilizador,
  email: utilizador.email,
  token_type: 'recovery_challenge'
}, JWT_SECRET, { expiresIn: RECOVERY_TOKEN_EXPIRES_IN });

/**
 * FACTORY JWT: Cria um token específico para o fluxo intermédio de ativação/verificação de e-mail.
 */
const buildEmailVerificationToken = (utilizador) => jwt.sign({
  sub: utilizador.id_utilizador,
  email: utilizador.email,
  token_type: 'email_verification'
}, JWT_SECRET, { expiresIn: RECOVERY_TOKEN_EXPIRES_IN });

/**
 * HELPER: Converte um valor numa instância Date segura, validando se o formato é válido para evitar falhas críticas.
 */
const parseDateSafe = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};



/**
 * REGRA DE NEGÓCIO: Avalia se a password temporária gerada por e-mail já excedeu o tempo limite configurado.
 */
const isRecoveryTempExpired = (timestampPasswordTemp) => {
  const ts = parseDateSafe(timestampPasswordTemp);
  if (!ts) return true;
  return (Date.now() - ts.getTime()) > RECOVERY_TEMP_VALID_MS;
};

/**
 * SERVIÇO SMTP: Dispara as credenciais de password temporária geradas para a caixa de correio do utilizador.
 */
const sendRecoveryPasswordEmail = async (email, nome, tempPassword) => {
  const { text: texto, html } = templateRecuperacaoPassword({ nome, tempPassword });
  await enviarEmail(email, 'Recuperação de Password - SoftBadge', texto, html);
};

/**
 * SERVIÇO SMTP: Envia o e-mail de registo inicial ou o novo código de ativação do utilizador.
 */
const sendEmailVerificationCodeMail = async (email, nome, codigo, validadeMinutos) => {
  const { text: texto, html } = templateReenvioCodigo({ nome, codigo, validadeMinutos });
  await enviarEmail(email, 'Novo Código de Verificação - SoftBadge', texto, html);
};

// =========================================================================
// MÉTODOS PÚBLICOS DO CONTROLADOR (ENDPOINTS DA API REST)
// =========================================================================

/**
 * POST /auth/login
 * Implementa uma máquina de estados complexa (Verifica ativação, e-mail verificado, recuperação e bloqueios por força bruta).
 */
controllersAuth.login = async (req, res) => {
  const transaction = await sequelize.transaction(); // Garante o isolamento e atomicidade da tentativa de login

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Email e password são obrigatórios." });
    }

    // Procura o utilizador e faz o JOIN eager loading das tabelas de permissões/perfis
    const utilizador = await Utilizador.findOne({
      where: { email },
      include: [
        {
          association: 'perfis',
          attributes: ['id_perfil'],
          through: { attributes: ['relacionamentoAtivo'], where: { relacionamentoAtivo: true } },
          include: [{ association: 'traducao_perfil', attributes: ['pt'] }]
        }
      ],
      transaction
    });

    if (!utilizador) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Credenciais inválidas." }); // Erro genérico por motivos de segurança (Enumeração de e-mails)
    }

    // Executa a verificação segura da password utilizando a função criptográfica de Argon2
    const passwordOk = await argon2.verify(utilizador.password_hash, password);
    let tempPasswordOk = false;

    // Se a conta estiver em recuperação, verifica também a password temporária
    if (utilizador.recovery_mode) {
      tempPasswordOk = await argon2.verify(utilizador.password_temp, password);
    }

    // Validações básicas de segurança administrativa
    if (!utilizador.conta_ativa) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Conta inativa. Contacte o seu Talent Manager ou Service Line Lider." });
    }

    if (utilizador.conta_bloqueada) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Conta bloqueada, contacte o seu Talent Manager ou Service Line Lider." });
    }

    // Se as credenciais estiverem incorretas (Mitigação de Ataques Brute Force)
    if (!passwordOk && !tempPasswordOk) {
      const contadorAtual = Number(utilizador.contador_bloqueio || 0);
      const novoContador = contadorAtual + 1;
      const bloquearConta = novoContador >= MAX_TENTATIVAS; // Avalia se atingiu o máximo (ex: 3)

      await utilizador.update({
        contador_bloqueio: novoContador,
        conta_bloqueada: bloquearConta
      }, { transaction });

      await transaction.commit();

      if (bloquearConta) {
        return res.status(403).json({ success: false, message: "Conta bloqueada, contacte o seu Talent Manager ou Service Line Lider." });
      }

      return res.status(401).json({
        success: false,
        message: `Credenciais inválidas. Tentativa ${novoContador} de ${MAX_TENTATIVAS}.`
      });
    }

    // Neste ponto sabemos que a password (oficial ou temporária) está absolutamente correta!

    // FLUXO INTERMÉDIO: O utilizador está em Modo de Recuperação de Conta ativa ou é uma conta nova (password_default)
    if (utilizador.recovery_mode || utilizador.password_default) {
      
      // Se introduziu a password ANTIGA/OFICIAL com sucesso mas o modo de recuperação está ativo
      if (passwordOk && utilizador.recovery_mode && !utilizador.password_default) {
        const recoveryChallengeToken = buildRecoveryChallengeToken(utilizador);
        await transaction.commit();
        return res.status(200).json({
          success: true,
          message: "Processo de recuperação de password ativo.",
          data: {
            action: 'RECOVERY_CANCEL_CONFIRMATION_REQUIRED',
            recovery_challenge_token: recoveryChallengeToken,
            recovery_started_at: utilizador.timestamp_password_temp
          }
        });
      }

      // Se entrou com a password temporária (ou a password inicial padrão)
      if (tempPasswordOk || (passwordOk && utilizador.password_default)) {
        if (isRecoveryTempExpired(utilizador.timestamp_password_temp)) {
          const recoveryChallengeToken = buildRecoveryChallengeToken(utilizador);
          await transaction.commit();
          return res.status(200).json({
            success: true,
            message: "Password temporária expirada.",
            data: {
              action: 'RECOVERY_TEMP_EXPIRED',
              recovery_challenge_token: recoveryChallengeToken,
              recovery_started_at: utilizador.timestamp_password_temp
            }
          });
        }
      }
    }

    // FLUXO DE NOVO UTILIZADOR: A password está correta e não expirou, mas o e-mail não foi validado ainda
    if (!utilizador.email_verificado) {
      const emailVerificationToken = buildEmailVerificationToken(utilizador);
      await transaction.commit();
      return res.status(200).json({
        success: true,
        message: "Email não verificado.",
        data: {
          action: 'EMAIL_VERIFICATION_REQUIRED',
          email_verification_token: emailVerificationToken // O Frontend usará este token para a página do código
        }
      });
    }

    // LOGIN COM SUCESSO COMPLETO
    const updates = {};
    const saudacao = await obterSaudacao({
      lastLogin: utilizador.last_login,
      lang: utilizador.idioma_preferencial
    });

    if (utilizador.contador_bloqueio > 0) updates.contador_bloqueio = 0; // Faz reset do contador de erros
    updates.last_login = new Date(); // Atualiza o último acesso

    // Verifica se é um timestamp inválido ou antigo/defeito
    const primeiroLoginInvalido = !utilizador.first_login || new Date(utilizador.first_login).getUTCFullYear() <= 1970;
    if (primeiroLoginInvalido) updates.first_login = new Date();

    await utilizador.update(updates, { transaction });

    const perfisAtivos = buildPerfisAtivos(utilizador);
    const clientPlatform = resolveClientPlatform(req);
    const token = buildAuthToken(utilizador, perfisAtivos, saudacao, clientPlatform); // Cria o token de sessão final
    const expiresInStr = getExpiresInForPlatform(clientPlatform);
    const expiresInSec = getExpiresInSeconds(expiresInStr);

    await transaction.commit();

    const forcePasswordChange = utilizador.password_default || tempPasswordOk || utilizador.recovery_mode;

    return res.status(200).json({
      success: true,
      message: forcePasswordChange
        ? "Login efetuado. Alteração de password obrigatória antes de aceder ao dashboard."
        : "Login efetuado com sucesso.",
      data: {
        token,
        token_type: 'Bearer',
        client_platform: clientPlatform,
        expires_in: expiresInSec,
        force_password_change: forcePasswordChange, // Obriga a trocar a password se for temporária, inicial ou em recuperação
        utilizador: {
          id_utilizador: utilizador.id_utilizador,
          nome: utilizador.nome,
          apelido: utilizador.apelido,
          email: utilizador.email,
          avatar: utilizador.avatar,
          idioma_preferencial: utilizador.idioma_preferencial,
          thema: utilizador.thema,
          perfis: perfisAtivos,
          id_area: utilizador.id_area,
          data_registo: utilizador.data_registo,
          pontos: utilizador.pontos,
          aceitou_rgpd: utilizador.aceitou_rgpd
        },
        saudacao
      }
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: "Erro ao efetuar login.", error: error.message });
  }
};

/**
 * PUT /auth/change-password
 * Permite ao utilizador redefinir a password de fábrica/padrão ou a password temporária gerada por recuperação.
 */
controllersAuth.changeDefaultPassword = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email, current_password, new_password, confirm_new_password } = req.body;

    if (!email || !current_password || !new_password || !confirm_new_password) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Email, current_password, new_password e confirm_new_password são obrigatórios." });
    }

    if (new_password !== confirm_new_password) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "A confirmação da nova password não corresponde." });
    }

    // Regra rígida de segurança de infraestrutura (Mínimo de 15 caracteres)
    if (new_password.length < 15) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "A nova password deve ter pelo menos 15 caracteres." });
    }

    const utilizador = await Utilizador.findOne({
      where: { email },
      include: [
        {
          model: Perfil,
          as: 'perfis',
          attributes: ['id_perfil'],
          through: { attributes: ['relacionamentoAtivo'] }
        }
      ],
      transaction
    });

    if (!utilizador) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
    }

    if (!utilizador.conta_ativa) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Conta inativa." });
    }

    if (utilizador.conta_bloqueada) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Conta bloqueada, contacte o seu Talent Manager ou Service Line Lider." });
    }

    // Tenta verificar se a password atual é válida com a hash principal do banco de dados
    let credencialAtualValida = await argon2.verify(utilizador.password_hash, current_password);

    // Se falhar mas a conta estiver em modo de recuperação, aceita também a password temporária (se não estiver expirada)
    if (!credencialAtualValida && utilizador.recovery_mode) {
      const tempValida = await argon2.verify(utilizador.password_temp, current_password);
      if (tempValida && !isRecoveryTempExpired(utilizador.timestamp_password_temp)) {
        credencialAtualValida = true;
      }
    }

    if (!credencialAtualValida) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Password atual inválida ou expirada." });
    }

    // Gera a hash de segurança robusta da nova password introduzida
    const novaHash = await argon2.hash(new_password);

    // Faz o update limpando os sinalizadores temporários e estados de bloqueio
    await utilizador.update({
      password_hash: novaHash,
      password_default: false,
      recovery_mode: false,
      contador_bloqueio: 0,
      conta_bloqueada: false,
      timestamp_password_temp: DEFAULT_TEMP_TIMESTAMP
    }, { transaction });

    const perfisAtivos = buildPerfisAtivos(utilizador);
    utilizador.password_default = false;
    const clientPlatform = resolveClientPlatform(req);
    const token = buildAuthToken(utilizador, perfisAtivos, null, clientPlatform); // Emite um novo token válido
    const expiresInStr = getExpiresInForPlatform(clientPlatform);
    const expiresInSec = getExpiresInSeconds(expiresInStr);

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Password alterada com sucesso.",
      data: {
        token,
        token_type: 'Bearer',
        client_platform: clientPlatform,
        expires_in: expiresInSec,
        force_password_change: false
      }
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: "Erro ao alterar password.", error: error.message });
  }
};

/**
 * POST /auth/verify-email
 * Valida o código numérico assíncrono que foi disparado para o e-mail de um novo utilizador.
 */
controllersAuth.verifyEmailCode = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email_verification_token, email_code } = req.body;

    if (!email_verification_token || !email_code) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "email_verification_token e email_code são obrigatórios." });
    }

    // Desencripta e valida a assinatura criptográfica e integridade do token JWT de e-mail
    let decoded;
    try {
      decoded = jwt.verify(email_verification_token, JWT_SECRET);
    } catch (e) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Token de verificação inválido ou expirado." });
    }

    if (decoded.token_type !== 'email_verification') {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Token de verificação inválido." });
    }

    const utilizador = await Utilizador.findByPk(decoded.sub, { transaction });
    if (!utilizador) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
    }

    if (utilizador.email_verificado) {
      await transaction.commit();
      return res.status(200).json({ success: true, message: "Email já verificado com sucesso." });
    }

    // Avalia o tempo limite de inserção do código no ecrã
    const tsCodVerifica = parseDateSafe(utilizador.timestamp_cod_verifica);
    const codigoExpirado = !tsCodVerifica || ((Date.now() - tsCodVerifica.getTime()) > EMAIL_VERIFICATION_CODE_VALID_MS);
    if (codigoExpirado) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: "Código de verificação expirado. Solicite um novo código."
      });
    }

    // Verifica criptograficamente a hash do código guardado com o texto simples enviado pelo utilizador
    const codigoValido = await argon2.verify(utilizador.cod_verifica_email, email_code);
    if (!codigoValido) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Código de verificação inválido." });
    }

    await utilizador.update({ email_verificado: true }, { transaction }); // Altera para true e ativa a conta
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Email verificado com sucesso."
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: "Erro ao verificar email.", error: error.message });
  }
};

/**
 * POST /auth/resend-verification
 * Permite ao utilizador gerar e reenviar um novo código para o e-mail caso o anterior tenha expirado.
 */
controllersAuth.resendEmailVerificationCode = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email_verification_token } = req.body;
    if (!email_verification_token) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "email_verification_token é obrigatório." });
    }

    let decoded;
    try {
      decoded = jwt.verify(email_verification_token, JWT_SECRET);
    } catch (e) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Token de verificação inválido ou expirado." });
    }

    if (decoded.token_type !== 'email_verification') {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Token de verificação inválido." });
    }

    const utilizador = await Utilizador.findByPk(decoded.sub, { transaction });
    if (!utilizador) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
    }

    if (utilizador.email_verificado) {
      await transaction.commit();
      return res.status(200).json({ success: true, message: "Email já verificado. Não é necessário reenviar código." });
    }

    // Cria um novo par de chaves/código limpo
    const novoCodigo = await gerarCodigoEpassword(10);
    await utilizador.update({
      cod_verifica_email: novoCodigo.hash,
      timestamp_cod_verifica: new Date()
    }, { transaction });

    await transaction.commit();

    try {
      const validadeMinutos = AUTH.EMAIL_VERIFICATION_CODE_VALID_MINUTES;
      await sendEmailVerificationCodeMail(utilizador.email, utilizador.nome, novoCodigo.codigo, validadeMinutos);
    } catch (emailError) {
      // Arquitetura Tolerante a Falhas: Se a BD guardou o código com sucesso, não quebra a API caso o SMTP externo falhe temporariamente
      return res.status(200).json({
        success: true,
        message: "Código atualizado, mas ocorreu erro no envio do email. Verifique o SMTP."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Novo código de verificação enviado com sucesso."
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: "Erro ao reenviar código de verificação.", error: error.message });
  }
};

/**
 * POST /auth/request-recovery
 * Solicitação inicial de esquecimento de password. Gera credenciais temporárias descartáveis.
 */
controllersAuth.requestPasswordRecovery = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email } = req.body;

    if (!email) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Email é obrigatório." });
    }

    // Resposta Ambigua de Segurança: Evita ataques de enumeração de utilizadores em sistemas públicos. 
    // O atacante nunca sabe se o e-mail realmente existe registado ou não na plataforma.
    const genericResponse = {
      success: true,
      message: "Caso o email indicado estiver correto, irá receber no email as indicações do processo para recuperar a sua password."
    };

    const utilizador = await Utilizador.findOne({
      where: { email },
      transaction
    });

    // Se o e-mail não existir, retorna um sucesso falso enganador de forma intencional por motivos de cibersegurança
    if (!utilizador) {
      await transaction.rollback();
      return res.status(200).json(genericResponse);
    }

    if (!utilizador.conta_ativa) {
      await transaction.commit();
      return res.status(200).json(genericResponse);
    }

    const temp = await gerarCodigoEpassword(14); // Cria uma password temporária altamente complexa de 14 dígitos

    await utilizador.update({
      password_temp: temp.hash,
      timestamp_password_temp: new Date(),
      recovery_mode: true // Altera o utilizador para o estado lógico de recuperação ativo
    }, { transaction });

    await transaction.commit();

    await sendRecoveryPasswordEmail(utilizador.email, utilizador.nome, temp.codigo); // Dispara para a caixa de correio

    return res.status(200).json(genericResponse);

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: "Erro ao iniciar recuperação de password.", error: error.message });
  }
};

/**
 * POST /auth/cancel-recovery
 * Caso o utilizador se recorde da password antiga durante o desafio intermédio, desativa o estado lógico de recuperação.
 */
controllersAuth.cancelRecovery = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { recovery_challenge_token } = req.body;
    if (!recovery_challenge_token) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "recovery_challenge_token é obrigatório." });
    }

    let decoded;
    try {
      decoded = jwt.verify(recovery_challenge_token, JWT_SECRET);
    } catch (e) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Token de recovery inválido ou expirado." });
    }

    if (decoded.token_type !== 'recovery_challenge') {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Token de recovery inválido." });
    }

    const utilizador = await Utilizador.findByPk(decoded.sub, {
      include: [
        {
          model: Perfil,
          as: 'perfis',
          attributes: ['id_perfil'],
          through: { attributes: ['relacionamentoAtivo'] }
        }
      ],
      transaction
    });

    if (!utilizador) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
    }

    // Desativa o sinalizador lógico de recuperação e repõe o timestamp para a época padrão
    await utilizador.update({
      recovery_mode: false,
      timestamp_password_temp: DEFAULT_TEMP_TIMESTAMP
    }, { transaction });

    if (!utilizador.conta_ativa) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Conta inativa. Contacte o seu Talent Manager ou Service Line Lider." });
    }

    if (utilizador.conta_bloqueada) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Conta bloqueada, contacte o seu Talent Manager ou Service Line Lider." });
    }

    const perfisAtivos = buildPerfisAtivos(utilizador);
    const saudacao = await obterSaudacao({
      lastLogin: utilizador.last_login,
      lang: utilizador.idioma_preferencial
    });
    const token = buildAuthToken(utilizador, perfisAtivos, saudacao); // Emite o token de autenticação padrão para deixá-lo logado diretamente

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: "Processo de recuperação cancelado com sucesso.",
      data: {
        token,
        token_type: 'Bearer',
        force_password_change: utilizador.password_default,
        utilizador: {
          id_utilizador: utilizador.id_utilizador,
          nome: utilizador.nome,
          apelido: utilizador.apelido,
          email: utilizador.email,
          avatar: utilizador.avatar,
          idioma_preferencial: utilizador.idioma_preferencial,
          thema: utilizador.thema,
          perfis: perfisAtivos
        },
        saudacao
      }
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: "Erro ao cancelar recuperação.", error: error.message });
  }
};

/**
 * POST /auth/resend-recovery
 * Gera uma nova password temporária e substitui a anterior se o tempo limite de introdução tiver expirado.
 */
controllersAuth.resendRecoveryPassword = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { recovery_challenge_token } = req.body;
    if (!recovery_challenge_token) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "recovery_challenge_token é obrigatório." });
    }

    let decoded;
    try {
      decoded = jwt.verify(recovery_challenge_token, JWT_SECRET);
    } catch (e) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Token de recovery inválido ou expirado." });
    }

    if (decoded.token_type !== 'recovery_challenge') {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Token de recovery inválido." });
    }

    const utilizador = await Utilizador.findByPk(decoded.sub, { transaction });
    if (!utilizador) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
    }

    const temp = await gerarCodigoEpassword(14); // Gera nova sequência criptográfica de 14 caracteres

    await utilizador.update({
      password_temp: temp.hash,
      timestamp_password_temp: new Date(),
      recovery_mode: true
    }, { transaction });

    await transaction.commit();

    await sendRecoveryPasswordEmail(utilizador.email, utilizador.nome, temp.codigo);

    return res.status(200).json({
      success: true,
      message: "Nova password temporária enviada com sucesso."
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: "Erro ao reenviar password temporária.", error: error.message });
  }
};

/**
 * POST /auth/resend-new-user-credentials
 * Endpoint dedicado a Novos Utilizadores cujas credenciais de boas-vindas expiraram.
 * Gera nova password temporária e novo código de email em simultâneo.
 */
controllersAuth.resendNewUserCredentials = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { email } = req.body;
    if (!email) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "email é obrigatório." });
    }

    const utilizador = await Utilizador.findOne({ where: { email }, transaction });

    // Segurança Genérica
    const genericResponse = {
      success: true,
      message: "Se o email estiver correto e a conta elegível, irá receber novos acessos no seu email."
    };

    if (!utilizador || utilizador.email_verificado || !utilizador.password_default) {
      await transaction.rollback();
      return res.status(200).json(genericResponse);
    }

    // Cria as novas strings aleatórias e as respetivas hashes de segurança
    const codigoEmail = await gerarCodigoEpassword(10);
    const passwordInicial = await gerarCodigoEpassword(12);

    await utilizador.update({
      cod_verifica_email: codigoEmail.hash,
      timestamp_cod_verifica: new Date(),
      password_hash: passwordInicial.hash,
      password_temp: passwordInicial.hash,
      timestamp_password_temp: new Date()
    }, { transaction });

    await transaction.commit();

    const tempoRestanteTexto = formatTempoRestante(AUTH.EMAIL_VERIFICATION_CODE_VALID_MINUTES);
    const { text: textoEmail, html: htmlEmail } = templateRenovacaoCredenciais({
      nome: utilizador.nome,
      tempPassword: passwordInicial.codigo,
      verificationCode: codigoEmail.codigo,
      tempoRestanteTexto
    });

    try {
      await enviarEmail(utilizador.email, `Renovação de Credenciais - Boas Vindas ${utilizador.nome}`, textoEmail, htmlEmail);
    } catch (emailError) {
      // Ignora erro de SMTP externamente
    }

    return res.status(200).json(genericResponse);

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: "Erro ao reenviar novas credenciais.", error: error.message });
  }
};

/**
 * POST /auth/logout
 * Captura o Bearer Token do utilizador ativo e submete-o para uma blacklist em memória com TTL (Time To Live).
 */
controllersAuth.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' '); // Desestrutura o cabeçalho "Bearer <TOKEN>"

    if (scheme !== 'Bearer' || !token) {
      return res.status(400).json({ success: false, message: "Token ausente." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: "Token inválido ou expirado." });
    }

    // Adiciona o token na Blacklist para impedir qualquer reutilização posterior do mesmo token até ao tempo de expiração original (decoded.exp)
    await revokeToken(token, decoded.exp);

    return res.status(200).json({
      success: true,
      message: "Logout efetuado com sucesso. Token invalidado."
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro ao efetuar logout.", error: error.message });
  }
};

/**
 * POST /auth/refresh-token
 * Gera um novo token JWT e invalida o token atual. Utilizado para renovação silenciosa de sessão (SweetAlert).
 */
controllersAuth.refreshToken = async (req, res) => {
  try {
    const id_utilizador = req.auth.sub; // Extraído do payload de um token válido pelo authMiddleware
    const token = req.token; // Recupera o token bruto guardado pelo authMiddleware
    
    // Consulta o utilizador para obter os dados mais frescos da BD e verificar o estado atual
    const utilizador = await Utilizador.findByPk(id_utilizador, {
      include: [
        {
          association: 'perfis',
          attributes: ['id_perfil'],
          through: { attributes: ['relacionamentoAtivo'] }
        }
      ]
    });

    if (!utilizador || !utilizador.conta_ativa || utilizador.conta_bloqueada) {
      return res.status(401).json({ success: false, message: "Sessão inválida. Conta inexistente, bloqueada ou inativa." });
    }

    // Revoga explicitamente o token "velho" atual colocando-o na blacklist com a sua expiração natural
    await revokeToken(token, req.auth.exp);

    // Mantém a máquina de estados (atualiza o registo de último login como sinal de atividade)
    await utilizador.update({ last_login: new Date() });

    const perfisAtivos = buildPerfisAtivos(utilizador);
    const saudacao = await obterSaudacao({
      lastLogin: utilizador.last_login,
      lang: utilizador.idioma_preferencial
    });

    // Identifica a plataforma: header explícito > token original > fallback User-Agent/Web
    const headerPlatform = (
      req.headers['x-client-platform'] ||
      req.headers['x-platform'] ||
      ''
    ).toString().trim().toLowerCase();

    let clientPlatform = 'web';
    if (['mobile', 'android', 'ios', 'flutter'].includes(headerPlatform)) {
      clientPlatform = 'mobile';
    } else if (['web', 'browser'].includes(headerPlatform)) {
      clientPlatform = 'web';
    } else if (req.auth?.client_platform) {
      clientPlatform = req.auth.client_platform;
    } else {
      clientPlatform = resolveClientPlatform(req);
    }

    const novoToken = buildAuthToken(utilizador, perfisAtivos, saudacao, clientPlatform);
    const expiresInStr = getExpiresInForPlatform(clientPlatform);
    const expiresInSec = getExpiresInSeconds(expiresInStr);

    return res.status(200).json({
      success: true,
      message: "Token renovado com sucesso.",
      data: {
        token: novoToken,
        token_type: 'Bearer',
        client_platform: clientPlatform,
        expires_in: expiresInSec,
        utilizador: {
          id_utilizador: utilizador.id_utilizador,
          nome: utilizador.nome,
          apelido: utilizador.apelido,
          email: utilizador.email,
          avatar: utilizador.avatar,
          idioma_preferencial: utilizador.idioma_preferencial,
          thema: utilizador.thema,
          perfis: perfisAtivos
        },
        saudacao
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro ao renovar token.", error: error.message });
  }
};

module.exports = controllersAuth;