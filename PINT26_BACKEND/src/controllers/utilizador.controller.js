// =========================================================================
// IMPORTAÇÃO DE MÓDULOS, MODELOS ORM, RECURSOS DO SISTEMA E COMPONENTES
// =========================================================================
const Utilizador = require('../models/utilizador.model');                 // Modelo da tabela principal de Utilizadores
const PerfilUtilizador = require('../models/perfil_utilizador.model');     // Modelo da tabela pivot de permissões/perfis
const sequelize = require('../config/database');                        // Instância de ligação à BD para controlo de transações ACID
const { Op } = require('sequelize');
const { AUTH, UTILIZADOR } = require('../config/parameters');           // Variáveis globais de parametrização do ecossistema
const fs = require('fs');                                               // Módulo File System nativo do Node para manipulação de disco
const path = require('path');                                           // Módulo Path nativo do Node para formatação de caminhos
const enviarEmail = require('../config/smtp');                           // Utilitário para disparo de e-mails via servidor SMTP
const { templateBoasVindas, templateReenvioCodigo } = require('../services/emailTemplates');   // Templates HTML de e-mail
const { gerarCodigoEpassword } = require('../services/geradores');       // Serviço criptográfico de hashes e strings aleatórias
const { formatTempoRestante } = require('../services/formatador');       // Serviço de formatação de texto de tempo
const { PERFIS } = require('../middlewares/permissao.middleware');       // Perfis do sistema para validação de segurança
const { emitToRoom } = require('../services/websocket.service');           // Emissor de notificações em tempo real via WebSockets
const Candidatura = require('../models/candidatura_badge.model');
const CandidaturaEspecial = require('../models/candidatura_especial.model');
const Badge = require('../models/badge.model');
const LearningPath = require('../models/learning_path.model');
const validaUUID = require('../services/valida_UUID');

const controllersUtilizador = {};

/**
 * HELPER: getLearningPathsMap
 * Carrega em memória o dicionário de Learning Paths traduzidos, evitando o truncamento de 63 caracteres no PostgreSQL.
 */
const getLearningPathsMap = async (lang) => {
  try {
    const lps = await LearningPath.findAll({
      include: [
        {
          association: 'traducao_learning_path',
          attributes: [lang, 'pt', 'en', 'es']
        }
      ]
    });
    const map = {};
    for (const lp of lps) {
      map[lp.id_learning_path] = lp.traducao_learning_path?.[lang]
        || lp.traducao_learning_path?.pt
        || lp.traducao_learning_path?.en
        || lp.traducao_learning_path?.es
        || null;
    }
    return map;
  } catch (err) {
    console.error("Erro ao carregar mapa de Learning Paths em utilizador.controller:", err);
    return {};
  }
};

// Inicialização de constantes com base nos ficheiros de parâmetros centralizados
const PERFIL_CONSULTOR = UTILIZADOR.PERFIL_CONSULTOR_PADRAO;            // ID correspondente ao perfil Consultor (ex: 4)
const AVATARS_DIR = path.join(__dirname, '../uploads/avatars');         // Diretoria física onde os avatars serão guardados em disco
const DEFAULT_AVATAR = UTILIZADOR.DEFAULT_AVATAR;                       // Nome do ficheiro da imagem de avatar padrão
const EMAIL_VERIFICATION_CODE_VALID_MINUTES = AUTH.EMAIL_VERIFICATION_CODE_VALID_MINUTES; // Tempo limite do token de e-mail

// =========================================================================
// FUNÇÕES AUXILIARES / HELPERS INTERNOS (GESTÃO DE FICHEIROS E MAPPER)
// =========================================================================

/**
 * GESTÃO DE DISCO: Verifica se o ficheiro antigo existe fisicamente e remove-o.
 * Proteção Defensiva: Nunca apaga a imagem de avatar por defeito (default_avatar.webp).
 */
function removeAvatarIfNeeded(fileName) {
  if (!fileName || fileName === DEFAULT_AVATAR) return;
  const filePath = path.join(AVATARS_DIR, fileName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Elimina fisicamente do disco do servidor
}

/**
 * GESTÃO DE DISCO: Normaliza e move o ficheiro temporário gerado pelo Multer 
 * para o padrão final: avatar_IDUTILIZADOR_TIMESTAMP.extensão, mitigando colisões de nomes.
 */
function moveTempAvatarToFinal(tempFileName, idUtilizador) {
  const ext = path.extname(tempFileName).toLowerCase() || '.png';
  const timestamp = Date.now();
  const finalFileName = `avatar_${idUtilizador}_${timestamp}${ext}`; // Nome único padronizado
  const oldPath = path.join(AVATARS_DIR, tempFileName);
  const newPath = path.join(AVATARS_DIR, finalFileName);
  fs.renameSync(oldPath, newPath); // Altera o nome física e instantaneamente no disco
  return finalFileName;
}

/**
 * FILTRO LÓGICO: Normaliza os filtros opcionais passados na Query String (?ativo=true).
 */
const buildAtivoFilter = (ativo) => {
  if (ativo === undefined || ativo === null || ativo === '') return {};
  return { conta_ativa: ativo === 'true' || ativo === '1' };
};

/**
 * DATA MAPPER: Atua como um transformador de dados. Limpa o excesso de metadados do ORM,
 * extrai os perfis e os seus nomes com base no idioma ativo (lang) e retorna um JSON plano.
 */
const mapUtilizador = (u, lang) => ({
  id_utilizador: u.id_utilizador,
  nome: u.nome,
  apelido: u.apelido,
  email: u.email,
  avatar: u.avatar,
  idioma_preferencial: u.idioma_preferencial,
  thema: u.thema,
  id_area: u.id_area,
  id_sl: u.id_sl,
  service_line: u.service_line ? {
    id_service_line: u.service_line.id_service_line,
    nome_service_line: u.service_line.traducao_service_line?.[lang] || u.service_line.traducao_service_line?.pt || null
  } : null,
  area_preferencia: u.area_preferencia ? {
    id_area: u.area_preferencia.id_area,
    nome_area: u.area_preferencia.traducao_area?.[lang] || u.area_preferencia.traducao_area?.pt || null
  } : null,
  recomendacoes_badge: u.recomendacoes_badge || 6,
  conta_ativa: u.conta_ativa,
  conta_bloqueada: u.conta_bloqueada,
  aceitou_rgpd: Boolean(u.aceitou_rgpd),
  perfis: u.perfis
    ?.filter(p => p.perfil_utilizador?.relacionamentoAtivo !== false)
    .map(p => ({
      id_perfil: p.id_perfil,
      perfil: p.traducao_perfil ? p.traducao_perfil[lang] : null, // Extração condicional multilíngue
      relacionamentoAtivo: p.perfil_utilizador?.relacionamentoAtivo
    })) ?? []
});

/**
 * EAGER LOADING: Desenha os Joins para ler as permissões ligadas ao utilizador 
 * aplicando a filtragem cirúrgica baseada na língua preferencial da requisição.
 */
const buildInclude = (lang) => [
  {
    association: 'perfis',
    attributes: ['id_perfil'],
    through: {
      attributes: ['relacionamentoAtivo'],
      where: { relacionamentoAtivo: true } // Garante que apenas perfis com relacionamento ativo são retornados
    },
    include: [
      {
        association: 'traducao_perfil',
        attributes: [lang]
      }
    ]
  },
  {
    association: 'service_line',
    include: [
      {
        association: 'traducao_service_line',
        attributes: [lang, 'pt', 'en', 'es']
      }
    ]
  },
  {
    association: 'area_preferencia',
    include: [
      {
        association: 'traducao_area',
        attributes: [lang, 'pt', 'en', 'es']
      }
    ]
  }
];

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * POST /utilizador
 * Cria uma nova conta, processa avatars, vincula permissões base e dispara e-mail de Boas-Vindas.
 */
controllersUtilizador.createUtilizador = async (req, res) => {
  const transaction = await sequelize.transaction(); // Inicia transação SQL (Garantia ACID)

  try {
    const { nome, apelido, email, idioma_preferencial, id_area, id_sl, thema } = req.body;

    // Validação Defensiva Precoce (Early Returns) de preenchimento obrigatório
    if (!nome || !apelido || !email || !idioma_preferencial) {
      return res.status(400).json({ success: false, message: "Campos obrigatórios em falta: nome, apelido, email, idioma_preferencial." });
    }

    // Cria as strings aleatórias e as respetivas hashes de segurança da password e código verificador
    const codigoEmail = await gerarCodigoEpassword(10);
    const passwordInicial = await gerarCodigoEpassword(12);

    // Instancia a nova conta com sinalizadores temporários ativos (force_password_change e email_verificado=false)
    const novoUtilizador = await Utilizador.create({
      nome,
      apelido,
      email,
      idioma_preferencial,
      thema: thema || 2, // Assume tema padrão caso não seja enviado
      id_area: id_area ? Number(id_area) : null,
      id_sl: id_sl ? Number(id_sl) : null,
      cod_verifica_email: codigoEmail.hash,
      timestamp_cod_verifica: new Date(),
      password_hash: passwordInicial.hash,
      password_temp: passwordInicial.hash,
      timestamp_password_temp: new Date(),
      password_default: true, // Obriga a trocar a password no primeiro acesso
      email_verificado: false
    }, { transaction });

    // GESTÃO DE FICHEIROS: Se o middleware Multer intercetou o upload de uma foto de perfil
    if (req.file?.filename) {
      const avatarFinal = moveTempAvatarToFinal(req.file.filename, novoUtilizador.id_utilizador);
      await novoUtilizador.update({ avatar: avatarFinal }, { transaction }); // Atualiza a propriedade na BD
    }

    // REGRA DE NEGÓCIO: Associa os perfis enviados pelo Gestor (ou assume o perfil mínimo Consultor por defeito)
    const perfisIdsCriacao = Array.isArray(req.body.perfis) && req.body.perfis.length > 0
      ? req.body.perfis.map(Number).filter(Boolean)
      : [PERFIL_CONSULTOR];

    if (!perfisIdsCriacao.includes(PERFIL_CONSULTOR)) {
      perfisIdsCriacao.push(PERFIL_CONSULTOR);
    }

    for (const id_perfil of perfisIdsCriacao) {
      await PerfilUtilizador.findOrCreate({
        where: {
          id_utilizador: novoUtilizador.id_utilizador,
          id_perfil
        },
        defaults: {
          id_utilizador: novoUtilizador.id_utilizador,
          id_perfil,
          relacionamentoAtivo: true
        },
        transaction
      });
    }

    // Fecha e consolida em definitivo todas as escritas lógicas na base de dados
    await transaction.commit();

    // Constrói a string de perfis por ordem de poder: Consultor -> Talent Manager -> Service Line Lider
    const perfisNomes = [];
    if (perfisIdsCriacao.includes(PERFIS.CONSULTOR)) perfisNomes.push("Consultor");
    if (perfisIdsCriacao.includes(PERFIS.TM)) perfisNomes.push("Talent Manager");
    if (perfisIdsCriacao.includes(PERFIS.SLL)) perfisNomes.push("Service Line Lider");
    const perfisTexto = perfisNomes.join(" | ");

    // FLUXO DE DISPARO SMTP: Constrói a estrutura HTML e texto da mensagem
    const tempoRestanteTexto = formatTempoRestante(EMAIL_VERIFICATION_CODE_VALID_MINUTES);
    const { text: textoEmail, html: htmlEmail } = templateBoasVindas({
      nome: novoUtilizador.nome,
      email: novoUtilizador.email,
      tempPassword: passwordInicial.codigo,
      verificationCode: codigoEmail.codigo,
      tempoRestanteTexto,
      perfisTexto
    });

    let avisoEmail = null;
    try {
      // Tenta disparar a mensagem assincronamente para a caixa de correio do consultor
      await enviarEmail(novoUtilizador.email, `Boas Vindas à SoftBadge, ${novoUtilizador.nome}`, textoEmail, htmlEmail);
    } catch (emailError) {
      // Tolerância a Falhas: Se a BD guardou tudo com sucesso, não quebra a API caso o SMTP externo falhe temporariamente
      avisoEmail = "Conta criada, mas ocorreu erro no envio do email. Verifique configurações SMTP.";
    }

    res.status(200).json({
      success: true,
      message: avisoEmail || "Utilizador criado com sucesso.",
      data: {
        id_utilizador: novoUtilizador.id_utilizador,
        nome: novoUtilizador.nome,
        apelido: novoUtilizador.apelido,
        email: novoUtilizador.email,
        avatar: novoUtilizador.avatar
      }
    });

  } catch (error) {
    // MECANISMO DE ROLLBACK DE FICHEIROS FÍSICOS:
    // Se a transação SQL estoirar e falhar (ex: e-mail duplicado), o catch deteta,
    // limpa a imagem órfã que foi escrita em disco para não poluir o armazenamento e desfaz as tabelas.
    if (req.file?.filename) removeAvatarIfNeeded(req.file.filename);
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao criar utilizador.", error: error.message });
  }
};

/**
 * GET /utilizador
 * Retorna a listagem de utilizadores ocultando colunas sensíveis (como hashes de passwords).
 */
controllersUtilizador.listUtilizador = async (req, res) => {
  try {
    const lang = req.lang;
    const where = buildAtivoFilter(req.query.ativo); // Trata filtros opcionais

    // Regra de Negócio: Não-Admins apenas visualizam utilizadores que aceitaram os termos RGPD
    const isAdmin = req.activeRole === PERFIS.ADMIN;
    if (!isAdmin) {
      where.aceitou_rgpd = true;
    }

    const utilizadores = await Utilizador.findAll({
      where,
      attributes: ['id_utilizador', 'nome', 'apelido', 'email', 'avatar', 'idioma_preferencial', 'thema', 'conta_ativa', 'conta_bloqueada', 'id_area', 'id_sl', 'aceitou_rgpd'], // Projeção cirúrgica de colunas públicas
      include: buildInclude(lang),
      order: [['data_registo', 'ASC']] // Organiza pela antiguidade de registo
    });

    res.status(200).json({
      success: true,
      message: "Listagem de utilizadores recuperada com sucesso.",
      data: utilizadores.map(u => mapUtilizador(u, lang)) // Envia higienizado pelo transformador
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar utilizadores.", error: error.message });
  }
};

/**
 * GET /utilizador/perfil/:id_perfil
 * Retorna todos os utilizadores que possuem um determinado perfil ativo,
 * limitando a resposta estritamente aos campos necessários para uma Dropdown.
 */
controllersUtilizador.listByPerfil = async (req, res) => {
  try {
    const id_perfil = parseInt(req.params.id_perfil, 10);
    if (!id_perfil) return res.status(400).json({ success: false, message: "ID do perfil inválido." });

    const where = buildAtivoFilter(req.query.ativo); // Trata filtros opcionais

    const utilizadores = await Utilizador.findAll({
      where,
      attributes: ['id_utilizador', 'nome', 'apelido'], // Projeção estrita: apenas o essencial
      include: [
        {
          association: 'perfis',
          attributes: [],
          where: { id_perfil: id_perfil }, // Força a junção interior (apenas quem tem este perfil)
          through: { where: { relacionamentoAtivo: true }, attributes: [] }
        }
      ],
      order: [['nome', 'ASC'], ['apelido', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: "Listagem otimizada de utilizadores por perfil recuperada com sucesso.",
      data: utilizadores.map(u => ({
        id_utilizador: u.id_utilizador,
        nome: u.nome,
        apelido: u.apelido
      }))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar utilizadores por perfil.", error: error.message });
  }
};

/**
 * GET /utilizador/:id
 * Detalha as propriedades, permissões completas, carimbos de data e área de um único utilizador.
 */
controllersUtilizador.detailUtilizador = async (req, res) => {
  const id_utilizador = req.params.id;
  if (!id_utilizador) return res.status(400).json({ success: false, message: "ID inválido.", data: null });

  try {
    const lang = req.lang;

    const utilizador = await Utilizador.findOne({
      where: { id_utilizador },
      attributes: [
        'id_utilizador', 'nome', 'apelido', 'email', 'avatar',
        'idioma_preferencial', 'thema', 'conta_ativa', 'conta_bloqueada', 'data_registo', 'last_login', 'id_area', 'id_sl', 'recomendacoes_badge'
      ],
      include: buildInclude(lang)
    });

    if (!utilizador) return res.status(404).json({ success: false, message: "Utilizador não encontrado.", data: null });

    res.status(200).json({
      success: true,
      message: "Utilizador recuperado com sucesso.",
      data: {
        ...mapUtilizador(utilizador, lang),
        data_registo: utilizador.data_registo,
        last_login: utilizador.last_login,
        id_area: utilizador.id_area,
        id_sl: utilizador.id_sl,
        recomendacoes_badge: utilizador.recomendacoes_badge || 6
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao recuperar utilizador.", error: error.message });
  }
};

/**
 * PUT /utilizador/:id
 * Efetua modificações cadastrais dinâmicas e faz substituição física controlada com expurgo de avatars antigos.
 */
controllersUtilizador.updateUtilizador = async (req, res) => {
  const transaction = await sequelize.transaction(); // Inicia transação segura

  try {
    const id_utilizador = req.params.id;
    const { nome, apelido, email, idioma_preferencial, thema, id_area, id_sl, avatar, recomendacoes_badge } = req.body;

    const utilizador = await Utilizador.findByPk(id_utilizador);
    if (!utilizador) return res.status(404).json({ success: false, message: "Utilizador não encontrado." });
    if (!utilizador.conta_ativa) return res.status(400).json({ success: false, message: "Não é possível editar uma conta inativa." });

    // Filtro de Segurança Anti-fraude: Um consultor só pode editar o seu próprio perfil!
    const perfisGestao = [PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM];
    const perfisToken = req.auth?.perfis || [];
    const isGestor = perfisGestao.some(p => perfisToken.includes(p));
    const userIdLogado = req.auth?.sub || req.auth?.id_utilizador;

    if (!isGestor && userIdLogado !== id_utilizador) {
      return res.status(403).json({ success: false, message: "Acesso negado. Apenas pode atualizar o seu próprio perfil." });
    }

    // Constrói o payload de forma estrita para evitar sobreposições nulas desnecessárias
    const payload = {};
    if (nome) payload.nome = nome;
    if (apelido) payload.apelido = apelido;
    if (idioma_preferencial) payload.idioma_preferencial = idioma_preferencial;
    if (thema !== undefined) payload.thema = Number(thema);
    if (id_area !== undefined) payload.id_area = id_area ? Number(id_area) : null;
    if (id_sl !== undefined) payload.id_sl = id_sl ? Number(id_sl) : null;
    if (recomendacoes_badge !== undefined && recomendacoes_badge !== null) {
      const parsedRec = Number(recomendacoes_badge);
      if (![3, 6, 9, 12].includes(parsedRec)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "O número de recomendações de badge deve ser 3, 6, 9 ou 12."
        });
      }
      payload.recomendacoes_badge = parsedRec;
    }

    let novoEmailConfirmacao = null;

    if (email && email.toLowerCase().trim() !== utilizador.email.toLowerCase().trim()) {
      // Validar se o novo e-mail já está a ser utilizado por outro utilizador
      const emailExistente = await Utilizador.findOne({
        where: {
          email: email.toLowerCase().trim(),
          id_utilizador: { [Op.ne]: id_utilizador }
        },
        transaction
      });

      if (emailExistente) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "Este e-mail já está a ser utilizado por outra conta." });
      }

      payload.email = email.toLowerCase().trim();
      payload.email_verificado = false;

      // Gerar novo código de verificação
      const codigoEmail = await gerarCodigoEpassword(10);
      payload.cod_verifica_email = codigoEmail.hash;
      payload.timestamp_cod_verifica = new Date();

      novoEmailConfirmacao = {
        email: payload.email,
        nome: nome || utilizador.nome,
        codigo: codigoEmail.codigo
      };
    }

    // SUBSTITUIÇÃO DINÂMICA DE FICHEIROS (EXPURGO EM DISCO):
    if (req.file?.filename) {
      const avatarAntigo = utilizador.avatar; // Captura e guarda em memória temporária o nome da foto antiga
      const avatarFinal = moveTempAvatarToFinal(req.file.filename, utilizador.id_utilizador);
      payload.avatar = avatarFinal;

      await utilizador.update(payload, { transaction });

      // Se a atualização na base de dados sucedeu perfeitamente, expulsa em definitivo a foto velha do disco
      removeAvatarIfNeeded(avatarAntigo);
    } else if (avatar) {
      payload.avatar = avatar;
      await utilizador.update(payload, { transaction });
    } else {
      await utilizador.update(payload, { transaction });
    }

    // SINCRONIZAÇÃO DE PERFIS NA TABELA PIVOT perfil_utilizador:
    // Se o pedido for feito por um Gestor e a propriedade perfis (ex: [4, 2, 3]) for enviada no req.body
    if (isGestor && req.body.perfis !== undefined) {
      let perfisIds = Array.isArray(req.body.perfis) ? req.body.perfis.map(Number).filter(Boolean) : [];

      // Garantir que o perfil Consultor (4) permanece sempre ativo
      if (!perfisIds.includes(PERFIL_CONSULTOR)) {
        perfisIds.push(PERFIL_CONSULTOR);
      }

      // Preservar o perfil Admin (1) se a conta editada for a conta do Admin Principal
      const jaEraAdmin = await PerfilUtilizador.findOne({
        where: { id_utilizador, id_perfil: PERFIS.ADMIN, relacionamentoAtivo: true },
        transaction
      });
      if (jaEraAdmin && !perfisIds.includes(PERFIS.ADMIN)) {
        perfisIds.push(PERFIS.ADMIN);
      }

      // 1. Desativa perfis associados que deixaram de pertencer à nova seleção
      await PerfilUtilizador.update(
        { relacionamentoAtivo: false },
        {
          where: {
            id_utilizador,
            id_perfil: { [Op.notIn]: perfisIds }
          },
          transaction
        }
      );

      // 2. Garante que todos os perfis selecionados ficam ativos na tabela pivot
      for (const id_perfil of perfisIds) {
        const [registo, created] = await PerfilUtilizador.findOrCreate({
          where: { id_utilizador, id_perfil },
          defaults: { id_utilizador, id_perfil, relacionamentoAtivo: true },
          transaction
        });

        if (!created && !registo.relacionamentoAtivo) {
          await registo.update({ relacionamentoAtivo: true }, { transaction });
        }
      }
    }

    await transaction.commit(); // Consolida as operações

    // Enviar e-mail de confirmação se o endereço foi atualizado
    if (novoEmailConfirmacao) {
      try {
        const tempoRestanteTexto = formatTempoRestante(EMAIL_VERIFICATION_CODE_VALID_MINUTES);
        const { text: textoEmail, html: htmlEmail } = templateReenvioCodigo({
          nome: novoEmailConfirmacao.nome,
          codigo: novoEmailConfirmacao.codigo,
          validadeMinutos: EMAIL_VERIFICATION_CODE_VALID_MINUTES
        });
        await enviarEmail(novoEmailConfirmacao.email, 'Confirmação de Alteração de E-mail - SoftBadge', textoEmail, htmlEmail);
      } catch (emailError) {
        console.error("Erro ao enviar email de nova verificação de email:", emailError.message);
      }
    }

    // NOTIFICAÇÃO EM TEMPO REAL VIA WEBSOCKET:
    // Se houve alteração nos perfis, busca a lista atualizada de perfis ativos e emite para o socket do utilizador
    if (isGestor && req.body.perfis !== undefined) {
      try {
        const uAtualizado = await Utilizador.findOne({
          where: { id_utilizador },
          attributes: ['id_utilizador', 'nome', 'apelido', 'email'],
          include: buildInclude(req.lang || 'pt')
        });

        if (uAtualizado) {
          const perfisLimpos = mapUtilizador(uAtualizado, req.lang || 'pt').perfis;
          emitToRoom(`user_${id_utilizador}`, 'profile_updated', {
            id_utilizador,
            perfis: perfisLimpos,
            message: "Os seus perfis de acesso foram atualizados pelo administrador."
          });
        }
      } catch (wsErr) {
        console.error("Erro ao emitir notificacao de perfil por websocket:", wsErr.message);
      }
    }

    res.status(200).json({ success: true, message: "Utilizador atualizado com sucesso." });

  } catch (error) {
    // Proteção em caso de erro na atualização: remove o novo ficheiro que falhou ao tentar entrar
    if (req.file?.filename) removeAvatarIfNeeded(req.file.filename);
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao atualizar utilizador.", error: error.message });
  }
};

/**
 * PATCH /utilizador/:id/status
 * Permite alternar rapidamente o estado booleano de bloqueio ou ativação administrativa da conta.
 */
controllersUtilizador.updateStatusUtilizador = async (req, res) => {
  try {
    const id_utilizador = req.params.id;
    if (!id_utilizador) return res.status(400).json({ success: false, message: "ID inválido." });

    const { conta_ativa } = req.body;
    if (typeof conta_ativa !== 'boolean') {
      return res.status(400).json({ success: false, message: "O campo 'conta_ativa' deve be boolean." });
    }

    if (id_utilizador === '019d6cd2-baad-721b-8e8d-9761f013ceb6' && conta_ativa === false) {
      return res.status(403).json({ success: false, message: "Acesso negado. A conta do Administrador principal não pode ser desativada." });
    }

    const utilizador = await Utilizador.findByPk(id_utilizador);
    if (!utilizador) return res.status(404).json({ success: false, message: "Utilizador não encontrado." });

    await utilizador.update({ conta_ativa }); // Executa atualização parcial direta

    res.status(200).json({
      success: true,
      message: `Conta ${conta_ativa ? 'ativada' : 'desativada'} com sucesso.`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao atualizar estado da conta.", error: error.message });
  }
};

/**
 * PATCH /utilizador/:id/unlock
 * Desbloqueia uma conta que foi travada por excesso de tentativas falhadas de login.
 * Reinicia as falhas e remove o bloqueio de segurança.
 */
controllersUtilizador.unlockUtilizador = async (req, res) => {
  try {
    const id_utilizador = req.params.id;
    if (!id_utilizador) return res.status(400).json({ success: false, message: "ID inválido." });

    const utilizador = await Utilizador.findByPk(id_utilizador);
    if (!utilizador) return res.status(404).json({ success: false, message: "Utilizador não encontrado." });

    if (!utilizador.conta_bloqueada) {
      return res.status(400).json({ success: false, message: "Esta conta não se encontra bloqueada por segurança." });
    }

    await utilizador.update({
      conta_bloqueada: false,
      contador_bloqueio: 0
    });

    res.status(200).json({
      success: true,
      message: "Conta desbloqueada com sucesso. O utilizador já pode voltar a tentar fazer login."
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao desbloquear conta.", error: error.message });
  }
};

/**
 * DELETE /utilizador/:id
 * Executa uma remoção lógica (Soft Delete) na conta garantindo a integridade retroativa do histórico.
 */
controllersUtilizador.deleteUtilizador = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const id_utilizador = req.params.id;

    if (id_utilizador === '019d6cd2-baad-721b-8e8d-9761f013ceb6') {
      return res.status(403).json({ success: false, message: "Acesso negado. A conta do Administrador principal não pode ser eliminada nem desativada." });
    }

    const utilizador = await Utilizador.findByPk(id_utilizador);

    if (!utilizador) return res.status(404).json({ success: false, message: "Utilizador não encontrado." });

    // SOFT DELETE: Não apaga a linha fisicamente da tabela.
    // Alterar o estado para falso blinda o sistema e impede quebras lógicas em cascata nas tabelas de candidaturas.
    await utilizador.update({ conta_ativa: false }, { transaction });
    await transaction.commit();

    res.status(200).json({ success: true, message: "Conta de utilizador desativada (soft-delete)." });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao desativar utilizador.", error: error.message });
  }
};

/**
 * GET /utilizador/public/:id
 * Devolve os dados do perfil público do consultor (nome, apelido, avatar, data de registo)
 * e a lista dos badges conquistados que o consultor marcou como partilháveis.
 * Apenas devolve 200 se o consultor tiver pelo menos 1 badge partilhado publicamente.
 */
controllersUtilizador.getPublicProfile = async (req, res) => {
  try {
    const id_utilizador = req.params.id;
    if (!validaUUID(id_utilizador, 7)) {
      return res.status(400).json({ success: false, message: 'ID de utilizador inválido.' });
    }

    const lang = req.lang || 'pt';

    const utilizador = await Utilizador.findOne({
      where: { id_utilizador, conta_ativa: true },
      attributes: ['id_utilizador', 'nome', 'apelido', 'avatar', 'data_registo']
    });

    if (!utilizador) {
      return res.status(404).json({ success: false, message: 'Utilizador não encontrado ou inativo.' });
    }

    // Procura candidaturas normais (estado 4) e especiais (estado 2) com partilha pública ativa
    const [publicCandidaturas, publicEspeciais, lpMap] = await Promise.all([
      Candidatura.findAll({
        where: {
          id_utilizador,
          id_estado_candidatura: 4, // CLOSED_OK (Aprovada)
          partilhar_conclusao: true,
          candidaturaAtiva: true
        },
        include: [
          {
            association: 'badge',
            include: [
              { association: 'traducao_titulo' },
              { association: 'traducao_descricao' },
              {
                association: 'competencias',
                through: { attributes: [] },
                include: [
                  { association: 'traducao_titulo' },
                  { association: 'traducao_descricao' }
                ]
              },
              {
                association: 'nivel_area',
                include: [
                  { association: 'traducao_nivel_area' },
                  {
                    association: 'area',
                    include: [
                      { association: 'traducao_area' },
                      {
                        association: 'service_line',
                        include: [
                          { association: 'traducao_service_line' }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            association: 'renovacoes',
            where: { renovacaoAtiva: true },
            required: false
          }
        ],
        order: [['data_candidatura', 'DESC']] // Mostra as mais recentes primeiro
      }),
      CandidaturaEspecial.findAll({
        where: {
          id_utilizador,
          id_estado_candidatura_especial: 2, // Aprovada
          candidaturaEspecialAtiva: true
        },
        include: [
          {
            association: 'conquista_especial',
            include: [
              { association: 'traducao_titulo' },
              { association: 'traducao_descricao' }
            ]
          },
          {
            association: 'conquista_atribuida',
            where: {
              rgpd_partilha_conquista: true,
              atribuicaoAtiva: true
            },
            required: true
          }
        ],
        order: [['data_decisao', 'DESC']]
      }),
      getLearningPathsMap(lang)
    ]);

    // Regra: O perfil público só fica disponível se o utilizador possuir pelo menos 1 badge ou badge especial partilhado publicamente
    if (publicCandidaturas.length === 0 && publicEspeciais.length === 0) {
      return res.status(404).json({ success: false, message: 'Este utilizador não possui badges partilhados publicamente e o seu perfil não está disponível.' });
    }

    const listagemBadges = publicCandidaturas.map(cand => {
      const badge = cand.badge;
      const sl = badge?.nivel_area?.area?.service_line;
      const idLp = sl?.id_learning_path;
      const nomeLp = (idLp && lpMap[idLp]) ? lpMap[idLp] : '';
      const dataConquista = cand.data_encerramento_candidatura || cand.updatedAt;

      // Identifica se houve renovação aprovada mais recente
      const renovacoesAprovadas = (cand.renovacoes || [])
        .filter(r => r.renovacao_aprovada === true && r.data_renovacao)
        .sort((a, b) => new Date(b.data_renovacao) - new Date(a.data_renovacao));
      const ultimaRenovacao = renovacoesAprovadas[0];
      const dataReferencia = (cand.candidatura_renovada && ultimaRenovacao)
        ? ultimaRenovacao.data_renovacao
        : dataConquista;

      let dataExpiracao = null;
      if (badge.badge_expiravel && badge.tempo_expiracao) {
        const expDate = new Date(dataReferencia);
        expDate.setDate(expDate.getDate() + badge.tempo_expiracao);
        dataExpiracao = expDate;
      }

      const competencias = (badge.competencias || []).map(comp => ({
        id_competencia: comp.id_competencia,
        codigo_competencia: comp.codigo_competencia,
        nome: comp.traducao_titulo?.[lang] || comp.traducao_titulo?.['pt'] || '',
        descricao: comp.traducao_descricao?.[lang] || comp.traducao_descricao?.['pt'] || ''
      }));

      return {
        id_candidatura: cand.id_candidatura,
        badge_nome: badge.traducao_titulo?.[lang] || badge.traducao_titulo?.['pt'] || '',
        badge_descricao: badge.traducao_descricao?.[lang] || badge.traducao_descricao?.['pt'] || '',
        badge_logo: badge.logo,
        badge_pontos: badge.pontos,
        id_learning_path: idLp,
        lp: nomeLp,
        lp_nome: nomeLp,
        sl_nome: sl?.traducao_service_line?.[lang] || sl?.traducao_service_line?.['pt'] || '',
        area_nome: badge.nivel_area?.area?.traducao_area?.[lang] || badge.nivel_area?.area?.traducao_area?.['pt'] || '',
        nivel_nome: badge.nivel_area?.traducao_nivel_area?.[lang] || badge.nivel_area?.traducao_nivel_area?.['pt'] || '',
        competencias,
        candidatura_renovada: cand.candidatura_renovada,
        consultor_avisado: cand.consultor_avisado,
        data_conquista: dataConquista,
        data_ultima_renovacao: (cand.candidatura_renovada && ultimaRenovacao) ? ultimaRenovacao.data_renovacao : null,
        data_expiracao: dataExpiracao
      };
    });

    const listagemEspeciais = publicEspeciais.map(esp => {
      const ce = esp.conquista_especial;
      const dataConquista = esp.conquista_atribuida?.data_atribuicao_conquista || esp.data_decisao || esp.updatedAt;
      return {
        id_candidatura_especial: esp.id_candidatura_especial,
        id_conquista_especial: esp.id_conquista_especial,
        tipo: 'especial',
        badge_nome: ce?.traducao_titulo?.[lang] || ce?.traducao_titulo?.pt || '',
        badge_descricao: ce?.traducao_descricao?.[lang] || ce?.traducao_descricao?.pt || '',
        badge_logo: ce?.logo_conquista || 'default_special_badge.svg',
        badge_pontos: ce?.pontos_bonus || esp.conquista_atribuida?.pontos_conquistados || 0,
        url_comprovativo: esp.url_comprovativo,
        ficheiro_comprovativo: esp.ficheiro_comprovativo,
        data_conquista: dataConquista,
        rgpd_partilha_conquista: true,
        partilhar_conquista_especial: true
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Perfil público recuperado com sucesso.',
      data: {
        nome_utilizador: `${utilizador.nome} ${utilizador.apelido}`,
        avatar_utilizador: utilizador.avatar,
        data_registo: utilizador.data_registo,
        badges: listagemBadges,
        badges_especiais: listagemEspeciais
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao recuperar perfil público do utilizador.', error: error.message });
  }
};

/**
 * PUT /utilizador/rgpd
 * Atualiza o estado de aceitação do RGPD do utilizador logado.
 */
controllersUtilizador.aceitarRGPD = async (req, res) => {
  try {
    const { aceitou_rgpd } = req.body;
    
    if (typeof aceitou_rgpd !== 'boolean') {
      return res.status(400).json({ success: false, message: 'O campo "aceitou_rgpd" (booleano) é obrigatório.' });
    }

    const utilizador = await Utilizador.findByPk(req.auth.sub, {
      include: [{
        association: 'perfis',
        through: { attributes: ['relacionamentoAtivo'] }
      }]
    });

    if (!utilizador) {
      return res.status(404).json({ success: false, message: 'Utilizador não encontrado.' });
    }

    await utilizador.update({ aceitou_rgpd });

    let novoToken = null;
    if (aceitou_rgpd) {
      const controllersAuth = require('./auth.controller');
      const perfisAtivos = controllersAuth.buildPerfisAtivos(utilizador);
      novoToken = controllersAuth.buildAuthToken(utilizador, perfisAtivos, req.auth?.saudacao);
    }

    return res.status(200).json({
      success: true,
      message: `Consentimento RGPD ${aceitou_rgpd ? 'aceite' : 'revogado'} com sucesso.`,
      data: {
        aceitou_rgpd,
        token: novoToken
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao atualizar consentimento RGPD.', error: error.message });
  }
};

module.exports = controllersUtilizador;