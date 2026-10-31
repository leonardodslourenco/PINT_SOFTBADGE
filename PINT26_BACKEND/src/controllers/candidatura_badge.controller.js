const { Op } = require('sequelize');                                       // Operadores lógicos do Sequelize (ex: Op.in, Op.ne)
const Candidatura = require('../models/candidatura_badge.model');           // Modelo da tabela principal de candidaturas
const EvidenciaCandidatura = require('../models/evidencia.model');         // Modelo das evidências/provas anexadas
const Badge = require('../models/badge.model');                             // Modelo dos Badges
const RequisitoBadge = require('../models/requisito_badge.model');           // Modelo de requisitos por Badge
const sequelize = require('../config/database');                            // Ligação à base de dados para controlo de transações
const { PERFIS } = require('../middlewares/permissao.middleware');          // Lista de perfis do sistema (ADMIN, SLL, TM)
const validaUUID = require('../services/valida_UUID');                      // Utilitário para validação de formato UUIDv7
const { TIPOS_ACAO, criarAcao } = require('../services/acao_candidatura.service'); // Histórico de ações da candidatura
const { emitToRoom } = require('../services/websocket.service');
const { getSllServiceLineId, checkSllScope } = require('../services/scope_check');
const Utilizador = require('../models/utilizador.model');
const enviarEmail = require('../config/smtp');
const { templateCandidaturaCriada } = require('../services/emailTemplates');
const { verificarEAtribuirMarcos } = require('../services/marco.service');
const LearningPath = require('../models/learning_path.model');
const { buscarDetalhesBadgeParaEmail, enviarEmailParaTMsExcetoUsuario } = require('../services/candidatura_email_helper');

const controllersCandidatura = {};

// Dicionário com os códigos correspondentes aos estados lógicos da candidatura
const ESTADOS = {
  OPEN: 1,
  SUBMITTED: 2,
  EM_VALIDACAO: 3,
  CLOSED_OK: 4,
  CLOSED_NOK: 5
};

// Perfis administrativos autorizados a fazer gestão global e auditoria
const perfisGestao = [PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM];

// =========================================================================
// FUNÇÕES AUXILIARES / INTERNAS (MÉTODOS PRIVADOS DE SUPORTE)
// =========================================================================

/**
 * HELPER: getLearningPathsMap
 * Mapeia os identificadores de Learning Path para os respetivos nomes traduzidos no idioma ativo.
 * Evita o limite de 63 caracteres de aliases do PostgreSQL em junções profundas.
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
    console.error("Erro ao carregar mapa de Learning Paths:", err);
    return {};
  }
};

/**
 * HELPER: buildBadgeInclude
 * Constrói dinamicamente o JOIN do Badge filtrando os títulos e descrições no idioma ativo.
 */
function buildBadgeInclude(lang) {
  return {
    association: 'badge',
    include: [
      { association: 'traducao_titulo', attributes: [lang] },
      { association: 'traducao_descricao', attributes: [lang] },
      {
        association: 'competencias',
        through: { attributes: [] },
        include: [
          { association: 'traducao_titulo', attributes: [lang] },
          { association: 'traducao_descricao', attributes: [lang] }
        ]
      },
      {
        association: 'nivel_area',
        include: [{ association: 'area' }]
      }
    ]
  };
}

/**
 * HELPER: temPerfil
 * Valida se os perfis contidos no token JWT do utilizador coincidem com uma lista permitida.
 */
function temPerfil(req, perfis) {
  const perfisToken = req.auth?.perfis || [];
  return perfis.some(perfil => perfisToken.includes(perfil));
}

/**
 * HELPER: getUtilizadorAutenticado
 * Extrai de forma encriptada e segura o ID do utilizador logado a partir do token.
 */
function getUtilizadorAutenticado(req) {
  return req.auth?.sub || req.auth?.id_utilizador || null;
}

/**
 * REGRA DE SEGURANÇA: Um utilizador só acede à candidatura se for gestor com perfil ativo correspondente ou o próprio dono dela.
 */
function podeAcederCandidatura(req, candidatura) {
  const activeRole = req.activeRole;
  if ([1, 2, 3].includes(activeRole)) return true;
  return candidatura.id_utilizador === getUtilizadorAutenticado(req);
}

/**
 * HELPER LÓGICO: Procura na base de dados todos os requisitos atados ao nível de um badge.
 */
async function getRequisitosDoBadge(id_badge, transaction = null, apenasObrigatorios = false) {
  const badge = await Badge.findOne({ where: { id_badge, badgeAtivo: true }, transaction });
  if (!badge) return null;

  const where = { id_badge: badge.id_badge, requisitoAtivo: true };
  if (apenasObrigatorios) where.obrigatoriedade_req = true; // Filtra apenas o que bloqueia a submissão

  return RequisitoBadge.findAll({ where, transaction });
}

/**
 * MOTOR DE VALIDAÇÃO: Cruza os requisitos obrigatórios do badge com as evidências submetidas.
 * Determina se a candidatura está "completa" ou se faltam documentos de prova.
 */
async function verificarCandidaturaCompleta(candidatura, transaction = null) {
  const requisitos = await getRequisitosDoBadge(candidatura.id_badge, transaction, true);
  if (!requisitos) {
    return { badgeExiste: false, completa: false, requisitos_obrigatorios: [], requisitos_em_falta: [] };
  }

  const idsRequisitos = requisitos.map(req => req.id_requisito);
  if (idsRequisitos.length === 0) {
    return { badgeExiste: true, completa: true, requisitos_obrigatorios: [], requisitos_em_falta: [] }; // Sem barreiras, está completa
  }

  // Procura se existem evidências ativas inseridas para os IDs de requisitos obrigatórios encontrados
  const evidencias = await EvidenciaCandidatura.findAll({
    where: {
      id_candidatura: candidatura.id_candidatura,
      id_requisito: { [Op.in]: idsRequisitos }, // Operador SQL: IN (...)
      evidenciaAtiva: true
    },
    transaction
  });

  // Utiliza um Set em memória para mapear de forma rápida os IDs únicos que possuem evidência
  const requisitosComEvidencia = new Set(evidencias.map(ev => ev.id_requisito));
  // Filtra quais os IDs obrigatórios ficaram de fora (não têm correspondência no Set)
  const requisitosEmFalta = idsRequisitos.filter(id => !requisitosComEvidencia.has(id));

  return {
    badgeExiste: true,
    completa: requisitosEmFalta.length === 0, // Se o array for zero, significa que está 100% completa
    requisitos_obrigatorios: idsRequisitos,
    requisitos_em_falta: requisitosEmFalta
  };
}

/**
 * CORE LOGIC SUBMIT: Altera o estado para SUBMITTED e dispara o registo histórico da ação.
 */
async function submeterCandidaturaInterno(candidatura, id_utilizador, transaction) {
  if (candidatura.id_estado_candidatura !== ESTADOS.OPEN) {
    throw new Error('Apenas candidaturas em estado Open podem ser submetidas para análise.');
  }

  // Invoca o motor de validação antes de autorizar a mudança de estado na BD
  const validacao = await verificarCandidaturaCompleta(candidatura, transaction);
  if (!validacao.badgeExiste) throw new Error('Badge não encontrado ou inativo.');

  // Abordagem Defensiva: Se o array de faltas tiver dados, lança um erro customizado acoplado à lista em falta
  if (!validacao.completa) {
    const erro = new Error('A candidatura ainda não tem todas as evidências obrigatórias.');
    erro.requisitos_em_falta = validacao.requisitos_em_falta;
    throw erro; // Interrompe o fluxo imediatamente
  }

  // Atualiza o estado da tabela principal para enviado/análise
  await candidatura.update({ id_estado_candidatura: ESTADOS.SUBMITTED }, { transaction });

  // Escreve na tabela de auditoria a ação cronológica do envio
  await criarAcao({
    id_candidatura: candidatura.id_candidatura,
    id_utilizador,
    tipo_acao_candidatura: TIPOS_ACAO.CANDIDATURA_ENVIADA_ANALISE,
    transaction
  });

  return validacao;
}

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API)
// =========================================================================

/**
 * POST /candidatura
 * Cria um rascunho de candidatura (OPEN). Permite a submissão direta se a flag "submeter" for true.
 */
controllersCandidatura.createCandidatura = async (req, res) => {
  const transaction = await sequelize.transaction(); // Inicia transação SQL
  try {
    const idUtilizadorToken = getUtilizadorAutenticado(req);
    const { id_utilizador, id_badge, submeter } = req.body;
    // Se não for passado um id de utilizador explicitamente, assume o id do token de quem está logado
    const idUtilizadorCandidatura = id_utilizador || idUtilizadorToken;

    // Validações rigorosas de formato UUIDv7
    if (!validaUUID(idUtilizadorCandidatura, 7) || !validaUUID(id_badge, 7)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'ID de utilizador e ID de badge são obrigatórios e devem ser válidos.' });
    }

    // Bloqueio de Privacidade: Um consultor comum não pode forçar a criação de candidaturas em nome de outro consultor
    const activeRole = req.activeRole;
    if (![1, 2, 3].includes(activeRole) && idUtilizadorCandidatura !== idUtilizadorToken) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Não é permitido criar candidatura para outro utilizador.' });
    }

    // Validação de Consentimento RGPD Geral
    const utilizadorCand = await Utilizador.findByPk(idUtilizadorCandidatura, { transaction });
    if (!utilizadorCand || !utilizadorCand.aceitou_rgpd) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        code: 'RGPD_NOT_ACCEPTED',
        message: 'É obrigatório aceitar os Termos Gerais de RGPD antes de submeter candidaturas a badges.'
      });
    }

    const badge = await Badge.findOne({ where: { id_badge, badgeAtivo: true }, transaction });
    if (!badge) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Badge não encontrado ou inativo.' });
    }

    // Regra de Negócio Crítica: Verifica se já existe um processo em aberto/análise (Não CLOSED) para este mesmo Badge
    const candidaturaAberta = await Candidatura.findOne({
      where: {
        id_utilizador: idUtilizadorCandidatura,
        id_badge: id_badge,
        id_estado_candidatura: { [Op.notIn]: [ESTADOS.CLOSED_NOK] }, // Apenas permite nova candidatura se a anterior foi recusada
        candidaturaAtiva: true
      },
      transaction
    });

    if (candidaturaAberta) {
      await transaction.rollback();
      return res.status(409).json({ // Status 409 Conflict (Conflito de Regras de Negócio)
        success: false,
        message: 'Já existe uma candidatura ativa para este badge.',
        data: { id_candidatura: candidaturaAberta.id_candidatura }
      });
    }

    // Cria o registo inicial da candidatura em modo aberto (OPEN)
    const novaCandidatura = await Candidatura.create({
      id_utilizador: idUtilizadorCandidatura,
      id_badge,
      id_estado_candidatura: ESTADOS.OPEN
    }, { transaction });

    // Regista no histórico que o rascunho da candidatura foi gerado
    await criarAcao({
      id_candidatura: novaCandidatura.id_candidatura,
      id_utilizador: idUtilizadorCandidatura,
      tipo_acao_candidatura: TIPOS_ACAO.CANDIDATURA_CRIADA,
      transaction
    });

    let validacao = await verificarCandidaturaCompleta(novaCandidatura, transaction);

    // Se o frontend pediu para "Criar e Submeter Direto" tudo num só clique
    if (submeter === true) {
      validacao = await submeterCandidaturaInterno(novaCandidatura, idUtilizadorCandidatura, transaction);
    }

    await transaction.commit(); // Grava em definitivo tudo na BD de forma atómica
    
    // Disparar verificação assíncrona de marcos (INICIO_CANDIDATURA)
    verificarEAtribuirMarcos(idUtilizadorCandidatura, 'INICIO_CANDIDATURA').catch(err =>
      console.error('[Trigger Marcos - createCandidatura] Erro:', err.message)
    );

    // Enviar e-mail de confirmação ao Consultor e aos TMs em segundo plano
    (async () => {
      try {
        const utilizador = await Utilizador.findByPk(idUtilizadorCandidatura);
        if (utilizador) {
          const nomeCompleto = `${utilizador.nome} ${utilizador.apelido}`.trim();
          const lang = utilizador.idioma_preferencial || 'pt';
          const dadosBadge = await buscarDetalhesBadgeParaEmail(id_badge, lang);

          if (dadosBadge) {
            const { text, html, assunto } = templateCandidaturaCriada({
              nome: nomeCompleto,
              lang,
              badgeNome: dadosBadge.badgeNome,
              pontos: dadosBadge.pontos,
              lpNome: dadosBadge.lpNome,
              slNome: dadosBadge.slNome,
              areaNome: dadosBadge.areaNome,
              nivelNome: dadosBadge.nivelNome,
              requisitos: dadosBadge.requisitos
            });

            await enviarEmail(utilizador.email, assunto, text, html);
          }

          // Se a candidatura foi diretamente submetida (Estado 2), enviar email a todos os TMs (excepto o próprio)
          if (submeter === true) {
            await enviarEmailParaTMsExcetoUsuario(id_badge, idUtilizadorCandidatura, nomeCompleto);
          }
        }
      } catch (mailErr) {
        console.error("Erro ao enviar email(s) no registo de candidatura:", mailErr.message);
      }
    })();

    if (submeter === true) {
      // Estado 2 (SUBMITTED): Avisar TM, Admin, SLL e o Consultor
      emitToRoom('room_tm', 'candidatura_submetida', {
        id_candidatura: novaCandidatura.id_candidatura,
        mensagem: "Nova candidatura pendente de análise e pré-aprovação"
      });
      emitToRoom('room_tm', 'candidatura_avancou', { id_candidatura: novaCandidatura.id_candidatura });
      emitToRoom('room_admin', 'candidatura_submetida', {
        id_candidatura: novaCandidatura.id_candidatura,
        mensagem: "Nova candidatura pendente de análise e pré-aprovação"
      });
      emitToRoom('room_admin', 'candidatura_avancou', { id_candidatura: novaCandidatura.id_candidatura });
      emitToRoom('room_sll', 'candidatura_submetida', { id_candidatura: novaCandidatura.id_candidatura });
      emitToRoom('room_sll', 'candidatura_avancou', { id_candidatura: novaCandidatura.id_candidatura });
      emitToRoom(`user_${novaCandidatura.id_utilizador}`, 'candidatura_submetida', { id_candidatura: novaCandidatura.id_candidatura });
      emitToRoom(`user_${novaCandidatura.id_utilizador}`, 'candidatura_avancou', { id_candidatura: novaCandidatura.id_candidatura });
    } else {
      // Estado 1 (OPEN / RASCUNHO): Avisar o consultor e as salas para sincronização de contadores
      emitToRoom(`user_${novaCandidatura.id_utilizador}`, 'candidatura_criada', { id_candidatura: novaCandidatura.id_candidatura });
      emitToRoom(`user_${novaCandidatura.id_utilizador}`, 'candidatura_avancou', { id_candidatura: novaCandidatura.id_candidatura });
      emitToRoom('room_tm', 'candidatura_avancou', { id_candidatura: novaCandidatura.id_candidatura });
      emitToRoom('room_sll', 'candidatura_avancou', { id_candidatura: novaCandidatura.id_candidatura });
      emitToRoom('room_admin', 'candidatura_avancou', { id_candidatura: novaCandidatura.id_candidatura });
    }
    return res.status(201).json({
      success: true,
      message: submeter === true ? 'Candidatura criada e enviada para análise.' : 'Candidatura criada em estado Open.',
      data: {
        id_candidatura: novaCandidatura.id_candidatura,
        id_estado_candidatura: novaCandidatura.id_estado_candidatura,
        completa: validacao.completa,
        requisitos_em_falta: validacao.requisitos_em_falta
      }
    });
  } catch (error) {
    await transaction.rollback(); // Desfaz qualquer alteração e aborta se estourar alguma exceção

    // Inteligência de Resposta: Se o erro contiver "requisitos_em_falta", responde com 400 (Bad Request), senão 500 (Erro de Servidor)
    const status = error.requisitos_em_falta ? 400 : 500;
    return res.status(status).json({
      success: false,
      message: error.requisitos_em_falta ? error.message : 'Erro ao criar candidatura.',
      error: error.requisitos_em_falta ? undefined : error.message,
      requisitos_em_falta: error.requisitos_em_falta || undefined
    });
  }
};

/**
 * POST /candidatura/submit/:id
 * Endpoint acionado quando o utilizador tem um rascunho OPEN e decide submetê-lo autonomamente.
 */
controllersCandidatura.submitCandidatura = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    if (!validaUUID(req.params.id, 7)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'ID de candidatura inválido.' });
    }

    const idUtilizadorToken = getUtilizadorAutenticado(req);
    const candidatura = await Candidatura.findByPk(req.params.id, { transaction });

    if (!candidatura || !candidatura.candidaturaAtiva) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Candidatura não encontrada.' });
    }

    // Filtro de Segurança: Impede intromissão de terceiros na submissão
    if (!podeAcederCandidatura(req, candidatura)) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Sem permissão para submeter esta candidatura.' });
    }

    const validacao = await submeterCandidaturaInterno(candidatura, idUtilizadorToken, transaction);
    await transaction.commit();

    // Disparar verificação assíncrona de marcos (INICIO_CANDIDATURA)
    verificarEAtribuirMarcos(idUtilizadorToken, 'INICIO_CANDIDATURA').catch(err =>
      console.error('[Trigger Marcos - createCandidaturaExpress] Erro:', err.message)
    );

    // Enviar email a todos os TMs (excepto o consultor dono da candidatura) em segundo plano
    (async () => {
      try {
        const consultor = await Utilizador.findByPk(candidatura.id_utilizador);
        const nomeConsultor = consultor ? `${consultor.nome} ${consultor.apelido}`.trim() : 'Consultor';
        await enviarEmailParaTMsExcetoUsuario(candidatura.id_badge, candidatura.id_utilizador, nomeConsultor);
      } catch (tmMailErr) {
        console.error("Erro ao enviar email aos TMs no submit:", tmMailErr.message);
      }
    })();

    // DISPARO DE NOTIFICAÇÃO EM TEMPO REAL PARA A SALA DOS TALENT MANAGERS, ADMINS, SLL E CONSULTOR
    emitToRoom('room_tm', 'candidatura_submetida', {
      id_candidatura: candidatura.id_candidatura,
      mensagem: "Nova candidatura pendente de análise e pré-aprovação"
    });
    emitToRoom('room_tm', 'candidatura_avancou', { id_candidatura: candidatura.id_candidatura });
    emitToRoom('room_admin', 'candidatura_submetida', {
      id_candidatura: candidatura.id_candidatura,
      mensagem: "Nova candidatura pendente de análise e pré-aprovação"
    });
    emitToRoom('room_admin', 'candidatura_avancou', { id_candidatura: candidatura.id_candidatura });
    emitToRoom('room_sll', 'candidatura_submetida', { id_candidatura: candidatura.id_candidatura });
    emitToRoom('room_sll', 'candidatura_avancou', { id_candidatura: candidatura.id_candidatura });
    emitToRoom(`user_${candidatura.id_utilizador}`, 'candidatura_submetida', { id_candidatura: candidatura.id_candidatura });
    emitToRoom(`user_${candidatura.id_utilizador}`, 'candidatura_avancou', { id_candidatura: candidatura.id_candidatura });

    return res.status(200).json({
      success: true,
      message: 'Candidatura enviada para análise do Talent Manager.',
      data: {
        id_candidatura: candidatura.id_candidatura,
        id_estado_candidatura: ESTADOS.SUBMITTED,
        completa: validacao.completa,
        requisitos_em_falta: []
      }
    });
  } catch (error) {
    await transaction.rollback();
    const status = error.requisitos_em_falta ? 400 : 500;
    return res.status(status).json({
      success: false,
      message: error.requisitos_em_falta ? error.message : 'Erro ao submeter candidatura.',
      error: error.requisitos_em_falta ? undefined : error.message,
      requisitos_em_falta: error.requisitos_em_falta || undefined
    });
  }
};

/**
 * GET /candidatura/:id
 * Devolve a árvore completa de uma candidatura detalhada (inclui evidências, histórico de ações e estado traduzido).
 */
controllersCandidatura.detailCandidatura = async (req, res) => {
  try {
    if (!validaUUID(req.params.id, 7)) {
      return res.status(400).json({ success: false, message: 'ID de candidatura inválido.' });
    }

    // EAGER LOADING PROFUNDO: Junta 5 tabelas associadas com suporte a tradução multi-idioma em tempo de execução
    const candidatura = await Candidatura.findOne({
      where: { id_candidatura: req.params.id, candidaturaAtiva: true },
      include: [
        { association: 'estado', include: [{ association: 'traducao_estado', attributes: [req.lang] }] },
        buildBadgeInclude(req.lang),
        { association: 'consultor', attributes: ['id_utilizador', 'nome', 'apelido', 'email', 'avatar'] },
        { association: 'evidencias' },
        {
          association: 'certificado',
          attributes: ['id_certificado', 'codigo_validacao', 'data_emissao', 'ficheiro_path']
        },
        {
          association: 'acoes',
          include: [
            { association: 'tipo_acao', include: [{ association: 'traducao_acao', attributes: [req.lang] }] },
            { association: 'comentario', attributes: [req.lang] },
            { association: 'autor_acao', attributes: ['id_utilizador', 'nome', 'apelido', 'email'] }
          ]
        }
      ]
    });

    if (!candidatura) return res.status(404).json({ success: false, message: 'Candidatura não encontrada.' });

    // Validação de Escopo para SLL
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'candidatura', req.params.id);
      if (!belongs) {
        return res.status(403).json({ success: false, message: 'Acesso negado: Esta candidatura não pertence a um badge da sua Service Line.' });
      }
    }

    if (!podeAcederCandidatura(req, candidatura)) return res.status(403).json({ success: false, message: 'Sem permissão para consultar esta candidatura.' });

    // Recalcula o estado de preenchimento para enviar no JSON final
    const validacao = await verificarCandidaturaCompleta(candidatura);
    return res.status(200).json({
      success: true,
      message: 'Candidatura recuperada com sucesso.',
      // Converte a instância do Sequelize para um objeto plano (toJSON) e anexa as flags do motor de validação
      data: { ...candidatura.toJSON(), completa: validacao.completa, requisitos_em_falta: validacao.requisitos_em_falta }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao recuperar candidatura.', error: error.message });
  }
};

/**
 * GET /candidatura
 * Lista candidaturas. Se for consultor comum, injeta silenciosamente uma cláusula que restringe a listagem às dele.
 */
controllersCandidatura.listCandidaturas = async (req, res) => {
  try {
    const { id_utilizador, estado } = req.query;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const where = { candidaturaAtiva: true };
    if (estado) where.id_estado_candidatura = Number(estado); // Filtro opcional por estado numérico

    // Verificação de Autorização Baseada em Regras de Contexto do Perfil Ativo:
    if (activeRole === 1 || activeRole === 3) {
      // Admin (1) ou TM (3) - Acesso irrestrito às candidaturas, com filtro opcional por consultor
      if (id_utilizador) {
        if (!validaUUID(id_utilizador, 7)) {
          return res.status(400).json({ success: false, message: 'id_utilizador inválido.' });
        }
        where.id_utilizador = id_utilizador;
      }
    } else if (activeRole === 2) {
      // SLL (2) - Restringe a candidaturas de badges da sua Service Line
      const slId = await getSllServiceLineId(userId);
      if (!slId) {
        return res.status(200).json({ success: true, data: [] });
      }
      where['$badge.nivel_area.area.id_service_line$'] = slId;
      
      // Também pode opcionalmente filtrar por consultor
      if (id_utilizador) {
        if (!validaUUID(id_utilizador, 7)) {
          return res.status(400).json({ success: false, message: 'id_utilizador inválido.' });
        }
        where.id_utilizador = id_utilizador;
      }
    } else {
      // Consultor (4) ou outros casos - Restringe estritamente às candidaturas do próprio utilizador logado
      where.id_utilizador = userId;
    }

    const candidaturas = await Candidatura.findAll({
      where,
      include: [
        { association: 'estado', include: [{ association: 'traducao_estado', attributes: [req.lang] }] },
        buildBadgeInclude(req.lang),
        { association: 'consultor', attributes: ['id_utilizador', 'nome', 'apelido', 'email', 'avatar'] },
        { association: 'evidencias' },
        {
          association: 'certificado',
          attributes: ['id_certificado', 'codigo_validacao', 'data_emissao', 'ficheiro_path']
        },
        {
          association: 'acoes',
          include: [
            { association: 'tipo_acao', include: [{ association: 'traducao_acao', attributes: [req.lang] }] }
          ]
        }
      ],
      order: [['data_candidatura', 'DESC']] // Mostra os processos mais recentes no topo
    });

    return res.status(200).json({ success: true, message: 'Candidaturas recuperadas com sucesso.', data: candidaturas });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar candidaturas.', error: error.message });
  }
};

/**
 * PATCH /candidatura_badge/:id/share
 * Ativa/desativa a partilha pública de uma candidatura aprovada (estado 4).
 */
controllersCandidatura.togglePublicSharing = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id_candidatura = req.params.id;
    if (!validaUUID(id_candidatura, 7)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'ID de candidatura inválido.' });
    }

    const { partilhar_conclusao } = req.body;
    if (typeof partilhar_conclusao !== 'boolean') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "O campo 'partilhar_conclusao' deve ser do tipo boolean." });
    }

    const userId = getUtilizadorAutenticado(req);

    const candidatura = await Candidatura.findByPk(id_candidatura, { transaction });
    if (!candidatura || !candidatura.candidaturaAtiva) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Candidatura não encontrada.' });
    }

    // Regra: Apenas o dono da candidatura pode alterar a partilha pública
    if (candidatura.id_utilizador !== userId && req.activeRole !== PERFIS.ADMIN) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Sem permissão para partilhar esta candidatura.' });
    }

    // Regra: Apenas candidaturas aprovadas (estado 4) podem ser partilhadas publicamente
    if (candidatura.id_estado_candidatura !== ESTADOS.CLOSED_OK) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Apenas candidaturas aprovadas e finalizadas podem ser partilhadas publicamente.' });
    }

    await candidatura.update({ partilhar_conclusao }, { transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `Partilha pública ${partilhar_conclusao ? 'ativada' : 'desativada'} com sucesso.`,
      data: { id_candidatura, partilhar_conclusao }
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao alterar partilha pública da candidatura.', error: error.message });
  }
};

/**
 * GET /candidatura_badge/public/:id
 * Recupera dados públicos de uma candidatura aprovada se o consultor autorizou a partilha.
 */
controllersCandidatura.detailCandidaturaPublic = async (req, res) => {
  try {
    const id_candidatura = req.params.id;
    if (!validaUUID(id_candidatura, 7)) {
      return res.status(400).json({ success: false, message: 'ID de candidatura inválido.' });
    }

    // Fallback garantido para o idioma PT
    const lang = req.lang || 'pt';

    const [candidatura, lpMap] = await Promise.all([
      Candidatura.findOne({
        where: { id_candidatura, candidaturaAtiva: true },
        include: [
          {
            association: 'consultor',
            attributes: ['id_utilizador', 'nome', 'apelido', 'avatar']
          },
          {
            association: 'renovacoes',
            where: { renovacaoAtiva: true },
            required: false
          },
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
          }
        ]
      }),
      getLearningPathsMap(lang)
    ]);

    // Se não existir ou se não for pública/aprovada, retorna 404
    if (!candidatura || candidatura.id_estado_candidatura !== ESTADOS.CLOSED_OK || !candidatura.partilhar_conclusao) {
      return res.status(404).json({ success: false, message: 'Candidatura pública não encontrada ou indisponível.' });
    }

    const badge = candidatura.badge;
    const sl = badge?.nivel_area?.area?.service_line;
    const idLp = sl?.id_learning_path;
    const nomeLp = (idLp && lpMap[idLp]) ? lpMap[idLp] : '';
    const dataConquista = candidatura.data_encerramento_candidatura || candidatura.updatedAt;
    
    // Identifica se houve renovação aprovada mais recente
    const renovacoesAprovadas = (candidatura.renovacoes || [])
      .filter(r => r.renovacao_aprovada === true && r.data_renovacao)
      .sort((a, b) => new Date(b.data_renovacao) - new Date(a.data_renovacao));
    const ultimaRenovacao = renovacoesAprovadas[0];
    const dataReferencia = (candidatura.candidatura_renovada && ultimaRenovacao)
      ? ultimaRenovacao.data_renovacao
      : dataConquista;

    // Calcula expiração em DIAS (badge.tempo_expiracao) a partir da data de referência
    let dataExpiracao = null;
    if (badge.badge_expiravel && badge.tempo_expiracao) {
      const expDate = new Date(dataReferencia);
      expDate.setDate(expDate.getDate() + badge.tempo_expiracao);
      dataExpiracao = expDate;
    }

    // Mapeamento das competências associadas com fallback i18n
    const competencias = (badge.competencias || []).map(comp => ({
      id_competencia: comp.id_competencia,
      codigo_competencia: comp.codigo_competencia,
      nome: comp.traducao_titulo?.[lang] || comp.traducao_titulo?.['pt'] || '',
      descricao: comp.traducao_descricao?.[lang] || comp.traducao_descricao?.['pt'] || ''
    }));

    return res.status(200).json({
      success: true,
      message: 'Candidatura pública recuperada com sucesso.',
      data: {
        id_candidatura: candidatura.id_candidatura,
        nome_utilizador: `${candidatura.consultor.nome} ${candidatura.consultor.apelido}`,
        avatar_utilizador: candidatura.consultor.avatar,
        id_utilizador: candidatura.consultor.id_utilizador,
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
        candidatura_renovada: candidatura.candidatura_renovada,
        consultor_avisado: candidatura.consultor_avisado,
        data_conquista: dataConquista,
        data_ultima_renovacao: (candidatura.candidatura_renovada && ultimaRenovacao) ? ultimaRenovacao.data_renovacao : null,
        data_expiracao: dataExpiracao
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao obter dados públicos da candidatura.', error: error.message });
  }
};

module.exports = controllersCandidatura;