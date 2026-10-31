// =========================================================================
// IMPORTAÇÃO DE MODELOS ORM, MÓDULOS DE TRANSAÇÃO E VALIDADORES SEGURA
// =========================================================================
const RequisitoBadge = require('../models/requisito_badge.model');   // Modelo de Requisitos associados ao Badge
const Badge = require('../models/badge.model');                     // Modelo relacional do Badge pai
const TraducaoConteudo = require('../models/traducao_conteudo.model'); // Tabela central para persistência de dados multi-idioma
const sequelize = require('../config/database');                    // Instância do Sequelize para isolamento e controlo transacional
const { gerarUUIDv7 } = require('../services/geradores');           // Gerador de chaves criptográficas ordenadas por tempo (UUIDv7)
const validaIDInteiro = require('../services/valida_id_inteiro');     // Utilitário defensivo que limpa e valida números inteiros
const validaUUID = require('../services/valida_UUID');               // Utilitário defensivo que limpa e valida UUIDs
const { processarTraducao, tratarPayloadTraducao } = require('../services/tradutor_helper'); // Serviço integrado que traduz o texto automaticamente
const { getSllServiceLineId, checkSllScope } = require('../services/scope_check');
const { emitGlobal } = require('../services/websocket.service');

const controllersRequisitoBadge = {};

// =========================================================================
// MÉTODOS AUXILIARES / HELPERS (EAGER LOADING E MAPEAMENTO DE RESPOSTAS)
// =========================================================================

/**
 * HELPER: buildInclude
 * Configura uma árvore profunda de junções relacionais (Eager Loading).
 * Garante que as 3 tabelas de texto do requisito (título, subtítulo e descrição) 
 * e o seu nó pai (Badge) tragam apenas a coluna do idioma ativo (lang).
 */
const buildInclude = (lang) => [
  { association: 'traducao_titulo', attributes: [lang] },
  { association: 'traducao_subtitulo', attributes: [lang] },
  { association: 'traducao_descricao', attributes: [lang] },
  {
    association: 'badge',
    include: [
      { association: 'traducao_titulo', attributes: [lang] }
    ]
  }
];

/**
 * HELPER: mapRequisito
 * Atua como um transformador de dados (Data Mapper). Desestrutura a árvore complexa
 * retornada pelo ORM, lê as strings dinâmicas idiomáticas e entrega um JSON plano ao Frontend.
 */
const mapRequisito = (r, lang) => ({
  id_requisito: r.id_requisito,
  id_requisito_badge: r.id_requisito, // Alias de retrocompatibilidade
  titulo: r.traducao_titulo?.[lang] || null,
  subtitulo: r.traducao_subtitulo?.[lang] || null,
  descricao: r.traducao_descricao?.[lang] || null,
  id_badge: r.id_badge,
  badge: r.badge?.traducao_titulo?.[lang] || null,
  obrigatoriedade_req: r.obrigatoriedade_req,
  requisitoAtivo: r.requisitoAtivo
});

/**
 * HELPER: buildAtivoFilter
 * Normaliza os parâmetros opcionais passados na URL do browser (?ativo=true).
 */
const buildAtivoFilter = (ativo) => {
  if (ativo === undefined || ativo === null || ativo === '') return {};
  return { requisitoAtivo: ativo === 'true' || ativo === '1' };
};

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * POST /requisito_badge
 * Cria um requisito para um Badge exigindo a matriz linguística completa.
 */
controllersRequisitoBadge.createRequisitoBadge = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const { id_badge, titulo, subtitulo, descricao, obrigatoriedade_req } = req.body;

    if (!id_badge || !validaUUID(id_badge)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "O campo 'id_badge' deve ser um UUID válido." });
    }

    // Se for SLL, valida se o badge pertence à sua Service Line
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'badge', id_badge);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Não pode associar requisitos a um badge fora do escopo da sua Service Line." });
      }
    }
    if (!titulo || (typeof titulo !== 'string' && typeof titulo !== 'object') ||
        !subtitulo || (typeof subtitulo !== 'string' && typeof subtitulo !== 'object') ||
        !descricao || (typeof descricao !== 'string' && typeof descricao !== 'object')) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Todos os campos (titulo, subtitulo, descricao) são obrigatórios." });
    }

    const idTraducaoTitulo = gerarUUIDv7();
    const idTraducaoSubtitulo = gerarUUIDv7();
    const idTraducaoDescricao = gerarUUIDv7();

    let tituloTraduzido, subtituloTraduzido, descricaoTraduzida;
    try {
      tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
      subtituloTraduzido = await tratarPayloadTraducao(subtitulo, lang);
      descricaoTraduzida = await tratarPayloadTraducao(descricao, lang);
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha na tradução automática no createRequisitoBadge:", transError.message);
      return res.status(422).json({
        success: false,
        code: "TRANSLATION_API_FAILED",
        message: "O serviço de tradução automática está temporariamente indisponível.",
        originalData: {
          titulo: typeof titulo === 'string' ? titulo : (titulo[lang] || titulo.pt || ""),
          subtitulo: typeof subtitulo === 'string' ? subtitulo : (subtitulo[lang] || subtitulo.pt || ""),
          descricao: typeof descricao === 'string' ? descricao : (descricao[lang] || descricao.pt || "")
        },
        lang
      });
    }

    await TraducaoConteudo.bulkCreate([
      { id_traducao_conteudo: idTraducaoTitulo, tabela: 'requisito_badge', coluna: 'id_traducao_requisito', pt: tituloTraduzido.pt, en: tituloTraduzido.en, es: tituloTraduzido.es },
      { id_traducao_conteudo: idTraducaoSubtitulo, tabela: 'requisito_badge', coluna: 'id_traducao_subtitulo_req', pt: subtituloTraduzido.pt, en: subtituloTraduzido.en, es: subtituloTraduzido.es },
      { id_traducao_conteudo: idTraducaoDescricao, tabela: 'requisito_badge', coluna: 'id_traducao_descritivo_req', pt: descricaoTraduzida.pt, en: descricaoTraduzida.en, es: descricaoTraduzida.es }
    ], { transaction });

    const novoRequisito = await RequisitoBadge.create({
      id_badge: id_badge,
      id_traducao_requisito: idTraducaoTitulo,
      id_traducao_subtitulo_req: idTraducaoSubtitulo,
      id_traducao_descritivo_req: idTraducaoDescricao,
      obrigatoriedade_req: obrigatoriedade_req !== undefined ? obrigatoriedade_req : true
    }, { transaction });

    const requisitoCompleto = await RequisitoBadge.findByPk(novoRequisito.id_requisito, {
      include: buildInclude(lang),
      transaction
    });

    await transaction.commit();

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'create', entity: 'requisito', id: novoRequisito.id_requisito });
    emitGlobal('requisito_updated', { type: 'create', id: novoRequisito.id_requisito });

    res.status(200).json({
      success: true,
      message: "Requisito de Badge criado com sucesso.",
      data: mapRequisito(requisitoCompleto, lang)
    });

  } catch (error) {
    await transaction.rollback();
    console.error("ERRO DETALHADO NO BACKEND - createRequisitoBadge:", error);
    res.status(500).json({ success: false, message: "Erro ao criar Requisito de Badge.", error: error.message });
  }
};

/**
 * GET /requisito_badge
 * Lista todos os requisitos registados aplicando o filtro de estado.
 */
controllersRequisitoBadge.listRequisitoBadge = async (req, res) => {
  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const where = buildAtivoFilter(req.query.ativo);

    const id_badge = req.query.id_badge;
    if (id_badge) {
      if (!validaUUID(id_badge)) {
        return res.status(400).json({ success: false, message: "ID de Badge inválido." });
      }
      
      // Se for SLL, valida se o badge pertence à sua Service Line
      if (activeRole === 2) {
        const belongs = await checkSllScope(userId, 'badge', id_badge);
        if (!belongs) {
          return res.status(403).json({ success: false, message: "Acesso negado: Este badge não pertence à sua Service Line." });
        }
      }
      where.id_badge = id_badge;
    } else if (activeRole === 2) {
      // Se não passou id_badge mas é SLL, filtra todos os requisitos da Service Line
      const slId = await getSllServiceLineId(userId);
      if (!slId) {
        return res.status(200).json({ success: true, data: [] });
      }
      where['$badge.nivel_area.area.id_service_line$'] = slId;
    }

    const requisitos = await RequisitoBadge.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_requisito', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: "Requisitos recuperados com sucesso.",
      data: requisitos.map(r => mapRequisito(r, lang))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar Requisitos de Badge.", error: error.message });
  }
};

/**
 * GET /requisito_badge/badge/:id
 * Lista todos os requisitos associados a um único Badge.
 */
controllersRequisitoBadge.listRequisitoByBadge = async (req, res) => {
  const id_badge = req.params.id;
  if (!id_badge || !validaUUID(id_badge)) {
    return res.status(400).json({ success: false, message: "ID de Badge inválido.", data: null });
  }

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    // Se for SLL, valida se o badge pertence à sua Service Line
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'badge', id_badge);
      if (!belongs) {
        return res.status(403).json({ success: false, message: "Acesso negado: Este badge não pertence à sua Service Line." });
      }
    }

    const where = { id_badge, ...buildAtivoFilter(req.query.ativo) };

    const requisitos = await RequisitoBadge.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_requisito', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: `Requisitos do Badge ${id_badge} recuperados.`,
      data: requisitos.map(r => mapRequisito(r, lang))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar por Badge.", error: error.message });
  }
};

/**
 * GET /requisito_badge/catalogo/badge/:id
 * Lista todos os requisitos associados a um Badge para exibição em catálogo (SLL, TM, Admin),
 * sem aplicar a restrição de escopo de Service Line do SLL.
 */
controllersRequisitoBadge.listRequisitoByBadgeCatalogo = async (req, res) => {
  const id_badge = req.params.id;
  if (!id_badge || !validaUUID(id_badge)) {
    return res.status(400).json({ success: false, message: "ID de Badge inválido.", data: null });
  }

  try {
    const lang = req.lang;
    const where = { id_badge, ...buildAtivoFilter(req.query.ativo) };

    const requisitos = await RequisitoBadge.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_requisito', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: `Requisitos do Catálogo para o Badge ${id_badge} recuperados.`,
      data: requisitos.map(r => mapRequisito(r, lang))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar requisitos do catálogo por Badge.", error: error.message });
  }
};

/**
 * GET /requisito_badge/:id
 * Recupera os dados traduzidos de um único requisito através da sua chave primária.
 */
controllersRequisitoBadge.detailRequisitoBadge = async (req, res) => {
  const id_requisito = validaIDInteiro(req.params.id);
  if (!id_requisito) return res.status(400).json({ success: false, message: "ID inválido." });

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'requisito', id_requisito);
      if (!belongs) {
        return res.status(403).json({ success: false, message: "Acesso negado: Este requisito não pertence à sua Service Line." });
      }
    }

    const reqInfo = await RequisitoBadge.findOne({
      where: { id_requisito },
      include: buildInclude(lang)
    });

    if (!reqInfo) return res.status(404).json({ success: false, message: "Requisito não encontrado." });

    res.status(200).json({ success: true, message: "Requisito recuperado.", data: mapRequisito(reqInfo, lang) });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao recuperar Requisito.", error: error.message });
  }
};

/**
 * PUT /requisito_badge/:id
 * Atualiza propriedades básicas ou traduções de um requisito de badge.
 */
controllersRequisitoBadge.updateRequisitoBadge = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const id_requisito = validaIDInteiro(req.params.id);
    if (!id_requisito) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "ID inválido." });
    }

    const reqInfo = await RequisitoBadge.findByPk(id_requisito);
    if (!reqInfo) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Requisito não encontrado." });
    }

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'requisito', id_requisito);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Este requisito não pertence à sua Service Line." });
      }
    }

    const { id_badge, titulo, subtitulo, descricao, obrigatoriedade_req, requisitoAtivo } = req.body;

    // Se for SLL e estiver alterando o badge associado, valida o novo badge
    if (activeRole === 2 && id_badge !== undefined && id_badge !== reqInfo.id_badge) {
      const belongsNew = await checkSllScope(userId, 'badge', id_badge);
      if (!belongsNew) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Não pode associar este requisito a um badge fora do escopo da sua Service Line." });
      }
    }

    const payloadInfo = {};
    if (id_badge) {
      if (!validaUUID(id_badge)) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "ID de Badge inválido." });
      }
      payloadInfo.id_badge = id_badge;
    }
    if (obrigatoriedade_req !== undefined) payloadInfo.obrigatoriedade_req = obrigatoriedade_req;
    if (typeof requisitoAtivo === 'boolean') payloadInfo.requisitoAtivo = requisitoAtivo;

    if (Object.keys(payloadInfo).length > 0) await reqInfo.update(payloadInfo, { transaction });

    try {
      if (titulo && (typeof titulo === 'string' || typeof titulo === 'object')) {
        const tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
        await TraducaoConteudo.update({ pt: tituloTraduzido.pt, en: tituloTraduzido.en, es: tituloTraduzido.es },
          { where: { id_traducao_conteudo: reqInfo.id_traducao_requisito }, transaction });
      }
      if (subtitulo && (typeof subtitulo === 'string' || typeof subtitulo === 'object')) {
        const subtituloTraduzido = await tratarPayloadTraducao(subtitulo, lang);
        await TraducaoConteudo.update({ pt: subtituloTraduzido.pt, en: subtituloTraduzido.en, es: subtituloTraduzido.es },
          { where: { id_traducao_conteudo: reqInfo.id_traducao_subtitulo_req }, transaction });
      }
      if (descricao && (typeof descricao === 'string' || typeof descricao === 'object')) {
        const descricaoTraduzida = await tratarPayloadTraducao(descricao, lang);
        await TraducaoConteudo.update({ pt: descricaoTraduzida.pt, en: descricaoTraduzida.en, es: descricaoTraduzida.es },
          { where: { id_traducao_conteudo: reqInfo.id_traducao_descritivo_req }, transaction });
      }
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha na tradução automática no updateRequisitoBadge:", transError.message);
      return res.status(422).json({
        success: false,
        code: "TRANSLATION_API_FAILED",
        message: "O serviço de tradução automática está temporariamente indisponível.",
        originalData: {
          titulo: typeof titulo === 'string' ? titulo : (titulo ? (titulo[lang] || titulo.pt || "") : ""),
          subtitulo: typeof subtitulo === 'string' ? subtitulo : (subtitulo ? (subtitulo[lang] || subtitulo.pt || "") : ""),
          descricao: typeof descricao === 'string' ? descricao : (descricao ? (descricao[lang] || descricao.pt || "") : "")
        },
        lang
      });
    }

    await transaction.commit();

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'update', entity: 'requisito', id: id_requisito });
    emitGlobal('requisito_updated', { type: 'update', id: id_requisito });

    res.status(200).json({ success: true, message: "Requisito atualizado com sucesso." });

  } catch (error) {
    await transaction.rollback();
    console.error("ERRO DETALHADO NO BACKEND - updateRequisitoBadge:", error);
    res.status(500).json({ success: false, message: "Erro ao atualizar Requisito.", error: error.message });
  }
};

/**
 * PATCH /requisito_badge/:id/status
 * Método parcial (PATCH) usado para alternar a flag booleana de ativação do critério.
 */
controllersRequisitoBadge.updateStatusRequisitoBadge = async (req, res) => {
  try {
    const id_requisito = validaIDInteiro(req.params.id);
    if (!id_requisito) return res.status(400).json({ success: false, message: "ID inválido." });

    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    const { requisitoAtivo } = req.body;
    if (typeof requisitoAtivo !== "boolean") return res.status(400).json({ success: false, message: "Campo requisitoAtivo deve ser boolean." });

    const reqInfo = await RequisitoBadge.findByPk(id_requisito);
    if (!reqInfo) return res.status(404).json({ success: false, message: "Requisito não encontrado." });

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'requisito', id_requisito);
      if (!belongs) {
        return res.status(403).json({ success: false, message: "Acesso negado: Este requisito não pertence à sua Service Line." });
      }
    }

    await reqInfo.update({ requisitoAtivo });

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'status', entity: 'requisito', id: id_requisito, active: requisitoAtivo });
    emitGlobal('requisito_updated', { type: 'status', id: id_requisito, active: requisitoAtivo });

    res.status(200).json({ success: true, message: `Requisito ${requisitoAtivo ? 'ativado' : 'inativado'} com sucesso.` });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao atualizar estado.", error: error.message });
  }
};

/**
 * DELETE /requisito_badge/:id
 * Soft Delete do Requisito de Badge.
 */
controllersRequisitoBadge.deleteRequisitoBadge = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const id_requisito = validaIDInteiro(req.params.id);
    if (!id_requisito) return res.status(400).json({ success: false, message: "ID inválido." });

    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    const reqInfo = await RequisitoBadge.findByPk(id_requisito);
    if (!reqInfo) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Requisito não encontrado." });
    }

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'requisito', id_requisito);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Este requisito não pertence à sua Service Line." });
      }
    }

    await reqInfo.update({ requisitoAtivo: false }, { transaction });
    await transaction.commit();

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'delete', entity: 'requisito', id: id_requisito });
    emitGlobal('requisito_updated', { type: 'delete', id: id_requisito });

    res.status(200).json({ success: true, message: "Requisito desativado." });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao desativar Requisito.", error: error.message });
  }
};

module.exports = controllersRequisitoBadge;
