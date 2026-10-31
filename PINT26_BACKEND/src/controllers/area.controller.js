const Area = require('../models/area.model');                       // Modelo da tabela de Áreas
const ServiceLine = require('../models/service_line.model');         // Modelo da tabela de Linhas de Serviço (Pai)
const TraducaoConteudo = require('../models/traducao_conteudo.model'); // Tabela central de traduções multi-idioma
const sequelize = require('../config/database');                    // Ligação à BD para controlo de transações ACID
const { gerarUUIDv7 } = require('../services/geradores');           // Gerador de identificadores universais UUIDv7
const validaIDInteiro = require('../services/valida_id_inteiro');     // Utilitário que valida inteiros
const { processarTraducao, tratarPayloadTraducao } = require('../services/tradutor_helper'); // Serviço integrado que traduz o texto automaticamente
const { criarENotificar } = require('../services/notificacao.service'); // Serviço de disparo de notificações com WebSocket
const { getSllServiceLineId, checkSllScope } = require('../services/scope_check');
const { emitGlobal } = require('../services/websocket.service');

const controllersArea = {};

// Helper interno para notificar o SLL da Service Line associada
const notificarSLLArea = async ({ id_service_line, id_user_notificador, titulo, mensagem, parametros }) => {
  if (!id_service_line) return;
  try {
    const sl = await ServiceLine.findByPk(id_service_line);
    if (sl && sl.id_sl_lider) {
      await criarENotificar({
        id_user_notificador,
        id_user_alvo_notificacao: sl.id_sl_lider,
        codigo_tipo: 'gestao_area',
        titulo,
        mensagem,
        parametros
      });
    }
  } catch (err) {
    console.error("Erro ao notificar SLL da Área:", err.message);
  }
};

// =========================================================================
// FUNÇÕES AUXILIARES / HELPERS DE SUPORTE
// =========================================================================

/**
 * HELPER: buildInclude
 * Cria dinamicamente o array de relacionamentos (Eager Loading) para o Sequelize.
 * Garante que apenas o idioma atual (lang) seja extraído das tabelas de tradução.
 */
const buildInclude = (lang) => [
  {
    association: 'traducao_area',
    attributes: [lang] // Traz apenas a coluna do idioma ativo 
  },
  {
    association: 'service_line',
    include: [
      {
        association: 'traducao_service_line',
        attributes: [lang] // Traz o nome da Service Line traduzido
      },
      {
        association: 'lider_service_line',
        attributes: ['nome', 'apelido'] // Traz os dados do SLL
      }
    ]
  }
];

/**
 * HELPER: mapArea
 * Atua como um transformador de dados (Data Mapper). Formata o objeto retornado do banco
 * para entregar uma estrutura JSON limpa, plana e fácil de consumir no Frontend.
 */
const mapArea = (a, lang) => ({
  id_area: a.id_area,
  area: a.traducao_area?.[lang] || null, // Extrai diretamente a string no idioma correto
  id_service_line: a.id_service_line,
  service_line: a.service_line?.traducao_service_line?.[lang] || null,
  id_sl_lider: a.service_line?.id_sl_lider || null,
  // Interpolação de Strings para juntar o nome e o apelido do líder numa única propriedade
  nome_sll: a.service_line?.lider_service_line
    ? `${a.service_line.lider_service_line.nome} ${a.service_line.lider_service_line.apelido}`
    : null,
  areaAtiva: a.areaAtiva
});

/**
 * HELPER: buildAtivoFilter
 * Trata os filtros passados via URL (?ativo=true). Se não for passado nenhum filtro,
 * retorna um objeto vazio, o que faz com que o Sequelize liste tanto ativos como inativos.
 */
const buildAtivoFilter = (ativo) => {
  if (ativo === undefined || ativo === null || ativo === '') return {};
  return { areaAtiva: ativo === 'true' || ativo === '1' };
};

// =========================================================================
// MÉTODOS DO CONTROLADOR (ENDPOINTS DA API)
// =========================================================================

/**
 * POST /area
 * Cria uma nova Área e gera as suas respetivas traduções automáticas.
 */
controllersArea.createArea = async (req, res) => {
  const transaction = await sequelize.transaction(); // Inicia uma transação segura

  try {
    const lang = req.lang; // Idioma do utilizador detetado no middleware
    const activeRole = req.activeRole;

    // Apenas Administradores podem criar novas áreas e associar a SLL
    if (activeRole !== 1) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Acesso negado: Apenas o Administrador pode criar novas áreas." });
    }

    const { id_service_line, titulo } = req.body;

    // Validações de integridade dos dados recebidos
    if (!id_service_line) {
      return res.status(400).json({ success: false, message: "O campo 'id_service_line' é obrigatório.", data: null });
    }
    if (!titulo || (typeof titulo !== 'string' && typeof titulo !== 'object')) {
      return res.status(400).json({ success: false, message: "O campo 'titulo' é obrigatório e deve ser texto ou objeto de tradução.", data: null });
    }

    // Passos de tradução automática ou manual
    const idTraducaoTitulo = gerarUUIDv7(); // Cria um ID único baseado em tempo (UUID v7)
    let tituloTraduzido;
    try {
      tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha ao processar tradução do título da área:", transError.message);
      return res.status(422).json({
        success: false,
        code: "TRANSLATION_API_FAILED",
        message: "O serviço de tradução automática está temporariamente indisponível.",
        originalData: {
          titulo: typeof titulo === 'string' ? titulo : (titulo[lang] || titulo.pt || "")
        },
        lang
      });
    }

    // Cria o registo de tradução com os textos gerados em PT, EN e ES
    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoTitulo,
      tabela: 'area',
      coluna: 'area',
      pt: tituloTraduzido.pt,
      en: tituloTraduzido.en,
      es: tituloTraduzido.es
    }, { transaction });

    // Cria a entidade Área vinculando-a ao ID da tradução e ao seu Service Line pai
    const novaArea = await Area.create({ id_service_line, id_traducao_area: idTraducaoTitulo }, { transaction });

    // Procura a área recém-criada para carregar os Joins completos dos relacionamentos
    const areaCompleta = await Area.findByPk(novaArea.id_area, {
      include: buildInclude(lang),
      transaction
    });

    await transaction.commit(); // Grava tudo definitivamente na BD

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'create', entity: 'area', id: novaArea.id_area });
    emitGlobal('area_updated', { type: 'create', id: novaArea.id_area });

    // Notifica o SLL responsável pela Service Line pai
    await notificarSLLArea({
      id_service_line,
      id_user_notificador: req.auth?.sub || req.auth?.id_utilizador,
      titulo: 'Nova Área Criada',
      mensagem: `Foi criada uma nova Área ('${titulo}') na sua Service Line.`,
      parametros: { id_area: novaArea.id_area, id_service_line }
    });

    res.status(200).json({
      success: true,
      message: "Área criada com sucesso.",
      data: mapArea(areaCompleta, lang) // Envia formatado pelo Mapper
    });

  } catch (error) {
    await transaction.rollback(); // Cancela tudo o que foi feito em caso de falha
    res.status(500).json({ success: false, message: "Erro ao criar Área.", error: error.message });
  }
};

/**
 * GET /area
 * Lista todas as áreas registadas com suporte a paginação/filtros lógicos.
 */
controllersArea.listArea = async (req, res) => {
  try {
    const lang = req.lang;
    const where = buildAtivoFilter(req.query.ativo); // Aplica filtro de ativo/inativo se existir

    const id_service_line = req.query.id_service_line;
    if (id_service_line) {
      where.id_service_line = Number(id_service_line);
    }

    const id_sl_lider = req.query.id_sl_lider || req.query.sll;

    const include = buildInclude(lang);
    if (id_sl_lider) {
      // Filtra na associação ServiceLine pelo id_sl_lider se explicitamente solicitado
      const slInclude = include.find(i => i.association === 'service_line');
      if (slInclude) {
        slInclude.where = { id_sl_lider };
        slInclude.required = true; // INNER JOIN para trazer apenas áreas cujo SLL seja o indicado
      }
    }

    const areas = await Area.findAll({
      where,
      include,
      order: [['id_area', 'ASC']] // Ordena os resultados pelo ID de forma crescente
    });

    res.status(200).json({
      success: true,
      message: "Áreas recuperadas com sucesso.",
      data: areas.map(a => mapArea(a, lang)) // Converte o array inteiro usando a função mapeadora
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar Áreas.", error: error.message });
  }
};

/**
 * GET /area/sl/:id
 * Lista todas as áreas específicas associadas a uma determinada Linha de Serviço.
 */
controllersArea.listAreaBySL = async (req, res) => {
  const id_service_line = validaIDInteiro(req.params.id);
  if (!id_service_line) {
    return res.status(400).json({ success: false, message: "ID de Service Line inválido.", data: null });
  }

  try {
    const lang = req.lang;

    // Constrói a cláusula WHERE forçando o ID da service line e concatenando filtros adicionais
    const where = { id_service_line, ...buildAtivoFilter(req.query.ativo) };

    const areas = await Area.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_area', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: `Áreas do Service Line ${id_service_line} recuperadas.`,
      data: areas.map(a => mapArea(a, lang))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar por Service Line.", error: error.message });
  }
};

/**
 * GET /area/:id
 * Retorna os detalhes e as sub-associações de uma única Área específica através do seu ID.
 */
controllersArea.detailArea = async (req, res) => {
  const id_area = validaIDInteiro(req.params.id);
  if (!id_area) {
    return res.status(400).json({ success: false, message: "ID de área inválido.", data: null });
  }

  try {
    const lang = req.lang;

    const area = await Area.findOne({ where: { id_area }, include: buildInclude(lang) });

    if (!area) return res.status(404).json({ success: false, message: "Área não encontrada.", data: null });

    res.status(200).json({ success: true, message: "Área recuperada com sucesso.", data: mapArea(area, lang) });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao recuperar Área.", error: error.message });
  }
};

/**
 * PUT /area/:id
 * Atualiza os dados de uma área e atualiza de forma assíncrona a sua tabela de traduções.
 */
controllersArea.updateArea = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const id_area = validaIDInteiro(req.params.id);
    if (!id_area) return res.status(400).json({ success: false, message: "ID inválido." });

    const area = await Area.findByPk(id_area);
    if (!area) return res.status(404).json({ success: false, message: "Área não encontrada." });

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'area', id_area);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Esta área não pertence à sua Service Line." });
      }
    }
    
    const { id_service_line, titulo, areaAtiva } = req.body;

    // SLL não pode redefinir o id_service_line da área (apenas Admin pode mover áreas)
    if (activeRole === 2 && id_service_line !== undefined && Number(id_service_line) !== Number(area.id_service_line)) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Acesso negado: Não é permitido mover a área para outra Service Line." });
    }

    const updates = {};
    if (id_service_line) updates.id_service_line = id_service_line;
    if (typeof areaAtiva === 'boolean') updates.areaAtiva = areaAtiva;

    // Se houver campos diretos a atualizar no modelo Area
    if (Object.keys(updates).length > 0) {
      await area.update(updates, { transaction });
    }

    // Se o título foi alterado, processa a nova tradução e atualiza a tabela de traduções
    if (titulo && (typeof titulo === 'string' || typeof titulo === 'object')) {
      try {
        const tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
        await TraducaoConteudo.update({ pt: tituloTraduzido.pt, en: tituloTraduzido.en, es: tituloTraduzido.es }, {
          where: { id_traducao_conteudo: area.id_traducao_area },
          transaction
        });
      } catch (transError) {
        await transaction.rollback();
        console.error("Falha ao processar tradução do título da área no updateArea:", transError.message);
        return res.status(422).json({
          success: false,
          code: "TRANSLATION_API_FAILED",
          message: "O serviço de tradução automática está temporariamente indisponível.",
          originalData: {
            titulo: typeof titulo === 'string' ? titulo : (titulo ? (titulo[lang] || titulo.pt || "") : "")
          },
          lang
        });
      }
    }

    await transaction.commit();

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'update', entity: 'area', id: id_area });
    emitGlobal('area_updated', { type: 'update', id: id_area });

    // Notifica o SLL da Service Line associada
    const targetSL = id_service_line || area.id_service_line;
    await notificarSLLArea({
      id_service_line: targetSL,
      id_user_notificador: req.auth?.sub || req.auth?.id_utilizador,
      titulo: 'Área Atualizada',
      mensagem: `Uma Área da sua Service Line foi atualizada${areaAtiva !== undefined ? (areaAtiva ? ' (Ativada)' : ' (Desativada)') : ''}.`,
      parametros: { id_area: area.id_area, id_service_line: targetSL }
    });

    res.status(200).json({ success: true, message: "Área updated successful." });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao atualizar Área.", error: error.message });
  }
};

/**
 * PATCH /area/:id/status
 * Método parcial usado para ativar ou desativar uma Área de forma rápida na plataforma.
 */
controllersArea.updateStatusArea = async (req, res) => {
  try {
    const id_area = validaIDInteiro(req.params.id);
    if (!id_area) return res.status(400).json({ success: false, message: "ID inválido." });

    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    const { areaAtiva } = req.body;
    if (typeof areaAtiva !== "boolean") return res.status(400).json({ success: false, message: "Campo areaAtiva deve ser boolean." });

    const area = await Area.findByPk(id_area);
    if (!area) return res.status(404).json({ success: false, message: "Área não encontrada." });

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'area', id_area);
      if (!belongs) {
        return res.status(403).json({ success: false, message: "Acesso negado: Esta área não pertence à sua Service Line." });
      }
    }

    await area.update({ areaAtiva }); // Atualiza diretamente o estado booleano

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'status', entity: 'area', id: id_area, active: areaAtiva });
    emitGlobal('area_updated', { type: 'status', id: id_area, active: areaAtiva });

    await notificarSLLArea({
      id_service_line: area.id_service_line,
      id_user_notificador: req.auth?.sub || req.auth?.id_utilizador,
      titulo: 'Alteração de Estado da Área',
      mensagem: `Uma Área da sua Service Line foi ${areaAtiva ? 'ativada' : 'desativada'}.`,
      parametros: { id_area: area.id_area, id_service_line: area.id_service_line, areaAtiva }
    });

    res.status(200).json({ success: true, message: `Área ${areaAtiva ? 'ativada' : 'inativada'} com sucesso.` });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao atualizar estado.", error: error.message });
  }
};

/**
 * DELETE /area/:id
 * Executa uma desativação (Soft Delete) no sistema para preservar a integridade referencial.
 */
controllersArea.deleteArea = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const id_area = validaIDInteiro(req.params.id);
    if (!id_area) return res.status(400).json({ success: false, message: "ID inválido." });

    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    const area = await Area.findByPk(id_area);
    if (!area) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Área não encontrada." });
    }

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'area', id_area);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Esta área não pertence à sua Service Line." });
      }
    }

    // Em vez de destruir o registo (destroy), faz-se um update para inativo
    await area.update({ areaAtiva: false }, { transaction });
    await transaction.commit();

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'delete', entity: 'area', id: id_area });
    emitGlobal('area_updated', { type: 'delete', id: id_area });

    await notificarSLLArea({
      id_service_line: area.id_service_line,
      id_user_notificador: req.auth?.sub || req.auth?.id_utilizador,
      titulo: 'Área Desativada',
      mensagem: `Uma Área da sua Service Line foi desativada.`,
      parametros: { id_area: area.id_area, id_service_line: area.id_service_line }
    });

    res.status(200).json({ success: true, message: "Área desativada." });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao desativar Área.", error: error.message });
  }
};

module.exports = controllersArea;