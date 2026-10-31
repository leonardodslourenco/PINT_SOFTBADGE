const Badge = require('../models/badge.model');                             // Modelo da entidade principal dos Badges
const CompetenciaBadge = require('../models/competencia_badge.model');       // Modelo da tabela de junção N-para-N com Competências
const NivelArea = require('../models/nivel.model');                         // Modelo relacional dos Níveis (ex: júnior, sénior)
const Area = require('../models/area.model');                               // Modelo relacional das Áreas associadas
const TraducaoConteudo = require('../models/traducao_conteudo.model');       // Tabela centralizada para persistência de traduções
const LearningPath = require('../models/learning_path.model');                 // Modelo de Learning Path
const sequelize = require('../config/database');                            // Instância de conexão para gerir transações robustas
const { gerarUUIDv7 } = require('../services/geradores');                   // Gerador de IDs universais baseados em tempo (UUIDv7)
const { processarTraducao, tratarPayloadTraducao } = require('../services/tradutor_helper');       // Serviço utilitário integrado com API de IA para tradução
const { Op } = require('sequelize');
const { getSllServiceLineId, checkSllScope } = require('../services/scope_check');
const { emitGlobal } = require('../services/websocket.service');

const controllersBadge = {};

// =========================================================================
// MÉTODOS AUXILIARES / HELPERS (ENCAPSULAMENTO DE LÓGICA REPETITIVA)
// =========================================================================

/**
 * HELPER: getLearningPathsMap
 * Mapeia os identificadores de Learning Path para os respetivos nomes traduzidos no idioma ativo.
 * Evita o limite de 63 caracteres de aliases do PostgreSQL em junções de 5 níveis de profundidade.
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
 * HELPER: buildInclude
 * Constrói uma árvore profunda de junções (Eager Loading) no Sequelize.
 * Garante que tanto o título e a descrição do badge, como o nível e a área pais,
 * venham exclusivamente filtrados no idioma ativo (`lang`) da requisição.
 */
const buildInclude = (lang) => [
  { association: 'traducao_titulo', attributes: [lang] },
  { association: 'traducao_descricao', attributes: [lang] },
  {
    association: 'nivel_area',
    include: [
      { association: 'traducao_nivel_area', attributes: [lang] },
      {
        association: 'area',
        include: [
          { association: 'traducao_area', attributes: [lang] },
          {
            association: 'service_line',
            include: [
              { association: 'traducao_service_line', attributes: [lang] }
            ]
          }
        ]
      }
    ]
  },
  {
    association: 'competencias',
    where: { competenciaAtiva: true },
    required: false,
    through: { where: { relacionamentoAtivo: true }, attributes: [] },
    include: [
      { association: 'traducao_titulo', attributes: [lang, 'pt', 'en', 'es'] }
    ]
  }
];

/**
 * HELPER: mapBadge
 * Atua como um Data Mapper (Transformador de Dados). Aplica uma limpeza nos nós complexos
 * gerados pelas associações do Sequelize, devolvendo ao Frontend uma estrutura plana, intuitiva e otimizada.
 */
const mapBadge = (b, lang, lpMap = null) => {
  const id_lp = b.nivel_area?.area?.service_line?.id_learning_path || null;
  const lpNome = (lpMap && id_lp && lpMap[id_lp])
    ? lpMap[id_lp]
    : (b.nivel_area?.area?.service_line?.learning_path?.traducao_learning_path?.[lang] || null);

  return {
    id_badge: b.id_badge,
    titulo: b.traducao_titulo?.[lang] || null,
    descricao: b.traducao_descricao?.[lang] || null,
    logo: b.logo,
    emissor: b.emissor,
    pontos: b.pontos,
    badge_expiravel: b.badge_expiravel,
    tempo_expiracao: b.tempo_expiracao,
    tempo_aviso: b.tempo_aviso,
    pontos_renovacao: b.pontos_renovacao,
    dias_submeter: b.dias_submeter,
    badgeAtivo: b.badgeAtivo,
    id_nivel_area: b.id_nivel_area,
    nivel_area: b.nivel_area?.traducao_nivel_area?.[lang] || null,
    area: b.nivel_area?.area?.traducao_area?.[lang] || null,
    id_area: b.nivel_area?.area?.id_area || null,
    id_service_line: b.nivel_area?.area?.id_service_line || null,
    service_line: b.nivel_area?.area?.service_line?.traducao_service_line?.[lang] || null,
    id_learning_path: id_lp,
    learning_path: lpNome,
    competencias: (b.competencias || []).map(c => ({
      id_competencia: c.id_competencia,
      titulo: c.traducao_titulo?.[lang] || c.traducao_titulo?.pt || null
    }))
  };
};

/**
 * HELPER: buildAtivoFilter
 * Normaliza os parâmetros opcionais passados na URL do browser (?ativo=true).
 * Se o parâmetro não for enviado, retorna um objeto vazio, listando todos os registos.
 */
const buildAtivoFilter = (ativo, dataInicio) => {
  const filter = {};

  //Filtro de estado 
  if (ativo !== undefined && ativo !== null && ativo !== '') {
    return { badgeAtivo: ativo === 'true' || ativo === '1' };
  }

  //Filtro de data
  if(dataInicio){
    filter.tempo_expiracao = { [Op.gte]: dataInicio }; //Filtra registos criados a partir da data de início fornecida
  }

  return filter;
};

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * POST /badge
 * Regista um novo badge no sistema, efetuando traduções paralelas em background.
 */
controllersBadge.createBadge = async (req, res) => {
  const transaction = await sequelize.transaction(); // Inicia o bloco de transação isolada

  try {
    const lang = req.lang; // Identifica o idioma do utilizador extraído no middleware
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const { titulo, descricao, emissor } = req.body;
    let { id_nivel_area, pontos, badge_expiravel, tempo_expiracao, tempo_aviso, pontos_renovacao, dias_submeter, logo } = req.body;

    // Tratamento de conversão por causa do multipart/form-data (Multer envia tudo como string)
    if (typeof id_nivel_area === 'string') id_nivel_area = parseInt(id_nivel_area);
    if (typeof pontos === 'string') pontos = parseInt(pontos);
    if (typeof badge_expiravel === 'string') badge_expiravel = badge_expiravel === 'true';
    if (typeof tempo_expiracao === 'string' && tempo_expiracao !== 'null' && tempo_expiracao !== '') {
        tempo_expiracao = parseInt(tempo_expiracao);
    } else if (tempo_expiracao === 'null' || tempo_expiracao === '') {
        tempo_expiracao = null;
    }
    if (typeof tempo_aviso === 'string' && tempo_aviso !== 'null' && tempo_aviso !== '') {
        tempo_aviso = parseInt(tempo_aviso);
    } else if (tempo_aviso === 'null' || tempo_aviso === '') {
        tempo_aviso = 30;
    }
    if (typeof pontos_renovacao === 'string' && pontos_renovacao !== 'null' && pontos_renovacao !== '') {
        pontos_renovacao = parseInt(pontos_renovacao);
    } else if (pontos_renovacao === 'null' || pontos_renovacao === '') {
        pontos_renovacao = 0;
    }
    if (typeof dias_submeter === 'string' && dias_submeter !== 'null' && dias_submeter !== '') {
        dias_submeter = parseInt(dias_submeter);
    } else if (dias_submeter === 'null' || dias_submeter === '' || dias_submeter === undefined) {
        dias_submeter = 7;
    }

    // Validação estrita do limite de dias_submeter (1 a 30 dias)
    if (dias_submeter !== undefined) {
      if (isNaN(dias_submeter) || dias_submeter < 1 || dias_submeter > 30) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "O campo 'dias_submeter' deve ser um número inteiro entre 1 e 30 dias." });
      }
    }

    // Se houve upload de imagem através do middleware Multer, sobrepõe a variável logo
    if (req.file) {
      logo = req.file.filename;
    }

    // Validações defensivas básicas de obrigatoriedade e tipo de dados
    if (!id_nivel_area || isNaN(id_nivel_area)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "O campo 'id_nivel_area' é obrigatório." });
    }

    // Se for SLL, valida se o nível pertence à sua Service Line
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'nivel', id_nivel_area);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Não pode associar badges a um nível fora do escopo da sua Service Line." });
      }
    }

    if (!titulo || (typeof titulo !== 'string' && typeof titulo !== 'object') || 
        !descricao || (typeof descricao !== 'string' && typeof descricao !== 'object')) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Os campos 'titulo' e 'descricao' são obrigatórios." });
    }

    // Cria IDs UUIDv7 indexáveis e cronológicos para as tabelas de traduções
    const idTraducaoTitulo = gerarUUIDv7();
    const idTraducaoDescricao = gerarUUIDv7();

    let tituloTraduzido, descricaoTraduzida;
    try {
      tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
      descricaoTraduzida = await tratarPayloadTraducao(descricao, lang);
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha na tradução automática no createBadge:", transError.message);
      return res.status(422).json({
        success: false,
        code: "TRANSLATION_API_FAILED",
        message: "O serviço de tradução automática está temporariamente indisponível.",
        originalData: {
          titulo: typeof titulo === 'string' ? titulo : (titulo[lang] || titulo.pt || ""),
          descricao: typeof descricao === 'string' ? descricao : (descricao[lang] || descricao.pt || "")
        },
        lang
      });
    }

    // Gravação em lote (Bulk Create) das duas traduções numa única instrução SQL
    await TraducaoConteudo.bulkCreate([
      { id_traducao_conteudo: idTraducaoTitulo, tabela: 'badge', coluna: 'titulo', pt: tituloTraduzido.pt, en: tituloTraduzido.en, es: tituloTraduzido.es },
      { id_traducao_conteudo: idTraducaoDescricao, tabela: 'badge', coluna: 'descricao', pt: descricaoTraduzida.pt, en: descricaoTraduzida.en, es: descricaoTraduzida.es }
    ], { transaction });

    // Preparação dinâmica do payload do Badge com valores padrão seguros
    const payload = {
      id_nivel_area,
      id_traducao_badge: idTraducaoTitulo,
      id_traducao_descricao_badge: idTraducaoDescricao,
      badge_expiravel: badge_expiravel || false,
      pontos: pontos || 0,
      pontos_renovacao: (pontos_renovacao !== undefined && !isNaN(pontos_renovacao)) ? pontos_renovacao : 0,
      dias_submeter: dias_submeter || 7
    };
    if (logo) payload.logo = logo;
    if (emissor) payload.emissor = emissor;
    // Injeta tempo de expiração e aviso apenas se a flag de badge expirável estiver ativa
    if (badge_expiravel) {
      if (tempo_expiracao) payload.tempo_expiracao = tempo_expiracao;
      if (tempo_aviso) payload.tempo_aviso = tempo_aviso;
    } else {
      payload.tempo_expiracao = null;
      payload.tempo_aviso = null;
    }

    // Cria o badge na BD e efetua o re-fetch completo para trazer os relacionamentos consolidados
    const novoBadge = await Badge.create(payload, { transaction });

    // Sincronização de competências associadas (se enviadas no pedido)
    let compArray = req.body.competencias;
    if (typeof compArray === 'string') {
      try { compArray = JSON.parse(compArray); } catch (_) { compArray = []; }
    }
    if (Array.isArray(compArray) && compArray.length > 0) {
      const relacoes = compArray.map(idComp => ({
        id_badge: novoBadge.id_badge,
        id_competencia: idComp,
        relacionamentoAtivo: true
      }));
      await CompetenciaBadge.bulkCreate(relacoes, { transaction, ignoreDuplicates: true });
    }

    const badgeCompleto = await Badge.findByPk(novoBadge.id_badge, {
      include: buildInclude(lang),
      transaction
    });

    await transaction.commit(); // Fecha e consolida a transação com sucesso

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'create', entity: 'badge', id: novoBadge.id_badge });
    emitGlobal('badge_updated', { type: 'create', id: novoBadge.id_badge });

    res.status(200).json({
      success: true,
      message: "Badge criado com sucesso.",
      data: mapBadge(badgeCompleto, lang)
    });

  } catch (error) {
    await transaction.rollback(); // Desfaz qualquer alteração nas tabelas caso ocorra erro
    console.error("ERRO DETALHADO NO BACKEND - createBadge:", error);
    res.status(500).json({ success: false, message: "Erro ao criar Badge.", error: error.message });
  }
};

/**
 * GET /badge
 * Retorna todos os badges registados ordenados de forma decrescente pelo peso dos seus pontos.
 */
controllersBadge.listBadge = async (req, res) => {
  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    //Extrair o 'ativo'  e a 'data' do pedido
    const { ativo, dataInicio } = req.query;
    
    const where = buildAtivoFilter(req.query.ativo, dataInicio); // Trata o filtro lógico de estado

    if (activeRole === 2) {
      const slId = await getSllServiceLineId(userId);
      if (!slId) {
        return res.status(200).json({ success: true, data: [] });
      }
      where['$nivel_area.area.id_service_line$'] = slId;
    }

    const [badges, lpMap] = await Promise.all([
      Badge.findAll({
        where,
        include: buildInclude(lang),
        order: [['pontos', 'DESC']] // Gamificação: Badges mais valiosos aparecem no topo
      }),
      getLearningPathsMap(lang)
    ]);

    res.status(200).json({
      success: true,
      message: "Badges recuperados com sucesso.",
      data: badges.map(b => mapBadge(b, lang, lpMap)) // Formata a coleção utilizando o Mapper
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar Badges.", error: error.message });
  }
};

/**
 * GET /badge/catalogo
 * Retorna o catálogo global de badges para consulta (SLL, TM, Admin),
 * sem aplicar a restrição de escopo de Service Line do SLL.
 * Suporta filtros por ativo, id_learning_path, id_service_line, id_area, id_nivel_area e q/search.
 */
controllersBadge.getCatalogoBadges = async (req, res) => {
  try {
    const lang = req.lang;
    const { ativo, id_learning_path, id_service_line, id_area, id_nivel_area, q, search } = req.query;

    const where = {};
    if (ativo !== undefined && ativo !== null && ativo !== '') {
      where.badgeAtivo = ativo === 'true' || ativo === '1';
    } else {
      where.badgeAtivo = true;
    }

    if (id_nivel_area && !isNaN(Number(id_nivel_area))) {
      where.id_nivel_area = Number(id_nivel_area);
    }
    if (id_area && !isNaN(Number(id_area))) {
      where['$nivel_area.id_area_sl$'] = Number(id_area);
    }
    if (id_service_line && !isNaN(Number(id_service_line))) {
      where['$nivel_area.area.id_service_line$'] = Number(id_service_line);
    }
    if (id_learning_path && !isNaN(Number(id_learning_path))) {
      where['$nivel_area.area.service_line.id_learning_path$'] = Number(id_learning_path);
    }

    const termo = (q || search || '').trim();
    if (termo) {
      where[Op.or] = [
        { '$traducao_titulo.pt$': { [Op.iLike]: `%${termo}%` } },
        { '$traducao_titulo.en$': { [Op.iLike]: `%${termo}%` } },
        { '$traducao_titulo.es$': { [Op.iLike]: `%${termo}%` } },
        { '$traducao_descricao.pt$': { [Op.iLike]: `%${termo}%` } },
        { '$traducao_descricao.en$': { [Op.iLike]: `%${termo}%` } },
        { '$traducao_descricao.es$': { [Op.iLike]: `%${termo}%` } }
      ];
    }

    const [badges, lpMap] = await Promise.all([
      Badge.findAll({
        where,
        include: buildInclude(lang),
        order: [['pontos', 'DESC'], ['id_badge', 'ASC']]
      }),
      getLearningPathsMap(lang)
    ]);

    res.status(200).json({
      success: true,
      message: "Catálogo de badges recuperado com sucesso.",
      data: badges.map(b => mapBadge(b, lang, lpMap))
    });

  } catch (error) {
    console.error("Erro ao obter catálogo de badges:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao obter catálogo de badges.",
      error: error.message
    });
  }
};

/**
 * GET /badge/catalogo/:id
 * Recupera os detalhes completos de um único Badge para visualização em catálogo (SLL, TM, Admin),
 * sem aplicar a restrição de escopo de Service Line do SLL.
 */
controllersBadge.getBadgeDetailCatalogo = async (req, res) => {
  const id_badge = req.params.id;
  if (!id_badge || id_badge.length < 32) {
    return res.status(400).json({ success: false, message: "ID inválido." });
  }

  try {
    const lang = req.lang;
    const [badgeInfo, lpMap] = await Promise.all([
      Badge.findOne({
        where: { id_badge },
        include: buildInclude(lang)
      }),
      getLearningPathsMap(lang)
    ]);

    if (!badgeInfo) {
      return res.status(404).json({ success: false, message: "Badge não encontrado." });
    }

    res.status(200).json({
      success: true,
      message: "Badge do catálogo recuperado com sucesso.",
      data: mapBadge(badgeInfo, lang, lpMap)
    });

  } catch (error) {
    console.error("Erro ao recuperar badge do catálogo:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao recuperar Badge do catálogo.",
      error: error.message
    });
  }
};

/**
 * GET /badge/nivel/:id
 * Lista de forma focada todos os badges pertencentes a um nível de competência específico (parâmetro de rota numérico).
 */
controllersBadge.listBadgeByNivel = async (req, res) => {
  const id_nivel_area = parseInt(req.params.id); // Converte e limpa o ID vindo da URL
  if (!id_nivel_area || isNaN(id_nivel_area)) {
    return res.status(400).json({ success: false, message: "ID de Nível inválido.", data: null });
  }

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    // Se for SLL, valida se o nível pertence à sua Service Line
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'nivel', id_nivel_area);
      if (!belongs) {
        return res.status(403).json({ success: false, message: "Acesso negado: Este nível não pertence à sua Service Line." });
      }
    }

    const where = { id_nivel_area, ...buildAtivoFilter(req.query.ativo) };

    const [badges, lpMap] = await Promise.all([
      Badge.findAll({
        where,
        include: buildInclude(lang),
        order: [['pontos', 'DESC']]
      }),
      getLearningPathsMap(lang)
    ]);

    res.status(200).json({
      success: true,
      message: `Badges do Nível ${id_nivel_area} recuperados.`,
      data: badges.map(b => mapBadge(b, lang, lpMap))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar por Nível.", error: error.message });
  }
};

/**
 * GET /badge/:id
 * Recupera os detalhes específicos de um único Badge com base na sua chave primária UUID.
 */
controllersBadge.detailBadge = async (req, res) => {
  const id_badge = req.params.id;
  // Validação básica do tamanho da string do UUID de forma defensiva
  if (!id_badge || id_badge.length < 32) return res.status(400).json({ success: false, message: "ID inválido." });

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'badge', id_badge);
      if (!belongs) {
        return res.status(403).json({ success: false, message: "Acesso negado: Este badge não pertence à sua Service Line." });
      }
    }

    const [badgeInfo, lpMap] = await Promise.all([
      Badge.findOne({ where: { id_badge }, include: buildInclude(lang) }),
      getLearningPathsMap(lang)
    ]);

    if (!badgeInfo) return res.status(404).json({ success: false, message: "Badge não encontrado." });

    res.status(200).json({ success: true, message: "Badge recuperado.", data: mapBadge(badgeInfo, lang, lpMap) });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao recuperar Badge.", error: error.message });
  }
};

/**
 * PUT /badge/:id
 * Atualiza campos parciais da entidade Badge e propaga atualizações textuais traduzidas nas tabelas de tradução.
 */
controllersBadge.updateBadge = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const id_badge = req.params.id;
    if (!id_badge) return res.status(400).json({ success: false, message: "ID inválido." });

    const badgeInfo = await Badge.findByPk(id_badge);
    if (!badgeInfo) return res.status(404).json({ success: false, message: "Badge não encontrado." });

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'badge', id_badge);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Este badge não pertence à sua Service Line." });
      }
    }

    // Impedimento de segurança: Entidades arquivadas na plataforma são imutáveis até serem reativadas
    if (!badgeInfo.badgeAtivo) return res.status(400).json({ success: false, message: "Não é possível editar um Badge inativo." });

    const { titulo, descricao, emissor } = req.body;
    let { id_nivel_area, pontos, badge_expiravel, tempo_expiracao, tempo_aviso, pontos_renovacao, dias_submeter, logo } = req.body;

    // Se for SLL e estiver mudando o nível, valida o novo escopo
    if (activeRole === 2 && id_nivel_area !== undefined && Number(id_nivel_area) !== Number(badgeInfo.id_nivel_area)) {
      const belongsNew = await checkSllScope(userId, 'nivel', id_nivel_area);
      if (!belongsNew) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Não pode mover o badge para um nível fora do escopo da sua Service Line." });
      }
    }

    // Tratamento de conversão por causa do multipart/form-data
    if (typeof id_nivel_area === 'string') id_nivel_area = parseInt(id_nivel_area);
    if (typeof pontos === 'string') pontos = parseInt(pontos);
    if (typeof badge_expiravel === 'string') badge_expiravel = badge_expiravel === 'true';
    if (typeof tempo_expiracao === 'string' && tempo_expiracao !== 'null' && tempo_expiracao !== '') {
        tempo_expiracao = parseInt(tempo_expiracao);
    } else if (tempo_expiracao === 'null' || tempo_expiracao === '') {
        tempo_expiracao = null;
    }
    if (typeof tempo_aviso === 'string' && tempo_aviso !== 'null' && tempo_aviso !== '') {
        tempo_aviso = parseInt(tempo_aviso);
    } else if (tempo_aviso === 'null' || tempo_aviso === '') {
        tempo_aviso = null;
    }
    if (typeof pontos_renovacao === 'string' && pontos_renovacao !== 'null' && pontos_renovacao !== '') {
        pontos_renovacao = parseInt(pontos_renovacao);
    } else if (pontos_renovacao === 'null' || pontos_renovacao === '') {
        pontos_renovacao = 0;
    }
    if (typeof dias_submeter === 'string' && dias_submeter !== 'null' && dias_submeter !== '') {
        dias_submeter = parseInt(dias_submeter);
    }

    if (req.file) {
      logo = req.file.filename;
    }

    // Constrói dinamicamente o objeto de campos alterados (payloadInfo) para evitar updates nulos ou destrutivos
    const payloadInfo = {};
    if (id_nivel_area !== undefined && !isNaN(id_nivel_area)) payloadInfo.id_nivel_area = id_nivel_area;
    if (pontos !== undefined && !isNaN(pontos)) payloadInfo.pontos = pontos;
    if (badge_expiravel !== undefined) {
      payloadInfo.badge_expiravel = badge_expiravel;
      if (!badge_expiravel) {
        payloadInfo.tempo_expiracao = null;
        payloadInfo.tempo_aviso = null;
      }
    }
    if (tempo_expiracao !== undefined) payloadInfo.tempo_expiracao = tempo_expiracao;
    if (tempo_aviso !== undefined) payloadInfo.tempo_aviso = tempo_aviso;
    if (pontos_renovacao !== undefined && !isNaN(pontos_renovacao)) payloadInfo.pontos_renovacao = pontos_renovacao;

    // Validação estrita do limite de dias_submeter (1 a 30 dias)
    if (dias_submeter !== undefined && dias_submeter !== 'null' && dias_submeter !== '') {
      if (isNaN(dias_submeter) || dias_submeter < 1 || dias_submeter > 30) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "O campo 'dias_submeter' deve ser um número inteiro entre 1 e 30 dias." });
      }
      payloadInfo.dias_submeter = dias_submeter;
    }
    if (logo) payloadInfo.logo = logo;
    if (emissor) payloadInfo.emissor = emissor;
    
    // Se houve alterações nas propriedades básicas do Badge, atualiza
    if (Object.keys(payloadInfo).length > 0) await badgeInfo.update(payloadInfo, { transaction });

    try {
      if (titulo && (typeof titulo === 'string' || typeof titulo === 'object')) {
        const tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
        await TraducaoConteudo.update({ pt: tituloTraduzido.pt, en: tituloTraduzido.en, es: tituloTraduzido.es },
          { where: { id_traducao_conteudo: badgeInfo.id_traducao_badge }, transaction });
      }
      
      if (descricao && (typeof descricao === 'string' || typeof descricao === 'object')) {
        const descricaoTraduzida = await tratarPayloadTraducao(descricao, lang);
        await TraducaoConteudo.update({ pt: descricaoTraduzida.pt, en: descricaoTraduzida.en, es: descricaoTraduzida.es },
          { where: { id_traducao_conteudo: badgeInfo.id_traducao_descricao_badge }, transaction });
      }
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha na tradução automática no updateBadge:", transError.message);
      return res.status(422).json({
        success: false,
        code: "TRANSLATION_API_FAILED",
        message: "O serviço de tradução automática está temporariamente indisponível.",
        originalData: {
          titulo: typeof titulo === 'string' ? titulo : (titulo ? (titulo[lang] || titulo.pt || "") : ""),
          descricao: typeof descricao === 'string' ? descricao : (descricao ? (descricao[lang] || descricao.pt || "") : "")
        },
        lang
      });
    }

    // Sincronização de competências se fornecido no pedido
    if (req.body.competencias !== undefined) {
      let compArray = req.body.competencias;
      if (typeof compArray === 'string') {
        try { compArray = JSON.parse(compArray); } catch (_) { compArray = []; }
      }
      if (Array.isArray(compArray)) {
        // Desativar relacionamentos antigos
        await CompetenciaBadge.update(
          { relacionamentoAtivo: false },
          { where: { id_badge }, transaction }
        );
        // Ativar/criar novos relacionamentos
        for (const idComp of compArray) {
          const [rel, created] = await CompetenciaBadge.findOrCreate({
            where: { id_badge, id_competencia: idComp },
            defaults: { relacionamentoAtivo: true },
            transaction
          });
          if (!created && !rel.relacionamentoAtivo) {
            await rel.update({ relacionamentoAtivo: true }, { transaction });
          }
        }
      }
    }

    await transaction.commit();
    
    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'update', entity: 'badge', id: id_badge });
    emitGlobal('badge_updated', { type: 'update', id: id_badge });

    res.status(200).json({ success: true, message: "Badge updated com sucesso." });

  } catch (error) {
    await transaction.rollback();
    console.error("ERRO DETALHADO NO BACKEND - updateBadge:", error);
    res.status(500).json({ success: false, message: "Erro ao atualizar Badge.", error: error.message });
  }
};

/**
 * PATCH /badge/:id/status
 * Permite alternar rapidamente o estado booleano do Badge, efetuando desativações em cascata lógica.
 */
controllersBadge.updateStatusBadge = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id_badge = req.params.id;
    if (!id_badge) return res.status(400).json({ success: false, message: "ID inválido." });

    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    const { badgeAtivo } = req.body;
    if (typeof badgeAtivo !== "boolean") return res.status(400).json({ success: false, message: "Campo boolean." });

    const badgeInfo = await Badge.findByPk(id_badge, { transaction });
    if (!badgeInfo) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Badge não encontrado." });
    }

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'badge', id_badge);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Este badge não pertence à sua Service Line." });
      }
    }

    await badgeInfo.update({ badgeAtivo }, { transaction });

    // DESATIVAÇÃO EM CASCATA LÓGICA: Se o badge foi desativado (false), 
    // desativa automaticamente todos os seus vínculos com competências associadas
    if (badgeAtivo === false) {
      await CompetenciaBadge.update(
        { relacionamentoAtivo: false },
        { where: { id_badge }, transaction }
      );
    }

    await transaction.commit();

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'status', entity: 'badge', id: id_badge, active: badgeAtivo });
    emitGlobal('badge_updated', { type: 'status', id: id_badge, active: badgeAtivo });

    res.status(200).json({ success: true, message: `Badge ${badgeAtivo ? 'ativado' : 'inativado'} com sucesso.` });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao atualizar estado.", error: error.message });
  }
};

/**
 * DELETE /badge/:id
 * Aplica uma desativação definitiva (Soft Delete) no badge e limpa as suas competências dependentes.
 */
  controllersBadge.deleteBadge = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const id_badge = req.params.id;
      if (!id_badge) return res.status(400).json({ success: false, message: "ID inválido." });

      const activeRole = req.activeRole;
      const userId = req.auth?.sub || req.auth?.id_utilizador;

      const badgeInfo = await Badge.findByPk(id_badge);
      if (!badgeInfo) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: "Badge não encontrado." });
      }

      // Validação de Escopo para SLL
      if (activeRole === 2) {
        const belongs = await checkSllScope(userId, 'badge', id_badge);
        if (!belongs) {
          await transaction.rollback();
          return res.status(403).json({ success: false, message: "Acesso negado: Este badge não pertence à sua Service Line." });
        }
      }

      // Preservação de dados: Aplica Soft Delete alterando flags lógicas para inativo
      await badgeInfo.update({ badgeAtivo: false }, { transaction });
      await CompetenciaBadge.update(
        { relacionamentoAtivo: false },
        { where: { id_badge }, transaction }
      );
      
      await transaction.commit();

      // Emissão de evento em tempo real via WebSockets
      emitGlobal('gestao_area', { type: 'delete', entity: 'badge', id: id_badge });
      emitGlobal('badge_updated', { type: 'delete', id: id_badge });

      res.status(200).json({ success: true, message: "Badge desativado." });

    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: "Erro ao desativar Badge.", error: error.message });
    }
};

controllersBadge.sync = async (req, res) => {
  try {
    const { lastSync } = req.query; // Recebe a data do último sync do Flutter
    const lang = req.lang;

    // Filtra apenas o que foi alterado após a última sincronização
    // Nota defensiva: se lastSync for nulo, convém tratar isso
    let whereClause = {};
    if (lastSync && lastSync !== 'null') {
      whereClause = { updatedAt: { [Op.gt]: new Date(lastSync) } };
    }

    const badges = await Badge.findAll({
      where: whereClause,
      include: buildInclude(lang)
    });

    res.status(200).json({
      success: true,
      data: badges.map(b => mapBadge(b, lang))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /badge/public/random
 * Devolve 3 badges ativos de forma aleatória com metadados detalhados para o microsite.
 * Não requer autenticação (token). Fallback padrão em PT.
 */
controllersBadge.getRandomBadgesPublic = async (req, res) => {
  try {
    const lang = req.lang || 'pt'; // Fallback garantido para o idioma PT

    const [badges, lpMap] = await Promise.all([
      Badge.findAll({
        where: { badgeAtivo: true },
        order: sequelize.random(),
        limit: 3,
        include: [
          { association: 'traducao_titulo' },
          { association: 'traducao_descricao' },
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
                      { association: 'traducao_service_line' },
                      { association: 'lider_service_line', attributes: ['nome', 'apelido'] }
                    ]
                  }
                ]
              }
            ]
          },
          {
            association: 'requisitos',
            where: { requisitoAtivo: true },
            required: false
          }
        ]
      }),
      getLearningPathsMap(lang)
    ]);

    const result = badges.map(b => {
      const sl = b.nivel_area?.area?.service_line;
      const slLider = sl?.lider_service_line;
      const liderNome = slLider ? `${slLider.nome} ${slLider.apelido}` : 'N/A';
      const idLp = sl?.id_learning_path;
      const nomeLp = (idLp && lpMap[idLp]) ? lpMap[idLp] : '';

      return {
        id_badge: b.id_badge,
        titulo: b.traducao_titulo?.[lang] || b.traducao_titulo?.['pt'] || '',
        descricao: b.traducao_descricao?.[lang] || b.traducao_descricao?.['pt'] || '',
        logo: b.logo,
        pontos: b.pontos,
        lp: nomeLp,
        lp_nome: nomeLp,
        id_learning_path: idLp,
        sl: sl?.traducao_service_line?.[lang] || sl?.traducao_service_line?.['pt'] || '',
        sl_responsavel: liderNome,
        area: b.nivel_area?.area?.traducao_area?.[lang] || b.nivel_area?.area?.traducao_area?.['pt'] || '',
        nivel: b.nivel_area?.traducao_nivel_area?.[lang] || b.nivel_area?.traducao_nivel_area?.['pt'] || '',
        requisitos_count: (b.requisitos || []).length
      };
    });

    return res.status(200).json({
      success: true,
      message: '3 Badges aleatórios recuperados com sucesso para o microsite.',
      data: result
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao obter badges aleatórios.', error: error.message });
  }
};

module.exports = controllersBadge;