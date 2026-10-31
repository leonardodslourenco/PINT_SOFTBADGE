// =========================================================================
// IMPORTAÇÃO DE MODELOS ORM, DEPENDÊNCIAS DE BASE DE DADOS E VALIDADORES
// =========================================================================
const NivelArea = require('../models/nivel.model');                 // Modelo da tabela de Níveis
const Area = require('../models/area.model');                       // Modelo da tabela de Áreas (Entidade Pai)
const TraducaoConteudo = require('../models/traducao_conteudo.model'); // Tabela central de persistência idiomática
const sequelize = require('../config/database');                    // Instância do Sequelize para controlo de transações SQL
const { gerarUUIDv7 } = require('../services/geradores');           // Gerador de identificadores únicos cronológicos (UUIDv7)
const validaIDInteiro = require('../services/valida_id_inteiro');     // Utilitário de segurança que higieniza e valida inteiros
const { processarTraducao } = require('../services/tradutor_helper'); // Serviço integrado que traduz texto automaticamente via IA
const { getSllServiceLineId, checkSllScope } = require('../services/scope_check');
const { emitGlobal } = require('../services/websocket.service');

const controllersNivelArea = {};

// =========================================================================
// MÉTODOS AUXILIARES / HELPERS (ENCAPSULAMENTO DE LÓGICA DE SUPORTE)
// =========================================================================

/**
 * HELPER: buildInclude
 * Cria dinamicamente a árvore de junções (Eager Loading) para o Sequelize.
 * Garante que apenas o idioma ativo (lang) da requisição seja extraído do banco de dados,
 * tanto para o nome do Nível como para a Área pai associada.
 */
const buildInclude = (lang) => [
  {
    association: 'traducao_nivel_area',
    attributes: [lang] // Traz apenas a coluna do idioma atual (ex: 'pt', 'en' ou 'es')
  },
  {
    association: 'area',
    include: [
      {
        association: 'traducao_area',
        attributes: [lang] // Traz também o nome da Área correspondente traduzido
      }
    ]
  }
];

/**
 * HELPER: mapNivel
 * Atua como um transformador de dados (Data Mapper). Limpa e aplana o objeto complexo do ORM,
 * isolando as strings idiomáticas corretas numa resposta JSON limpa e ideal para o Frontend.
 */
const mapNivel = (n, lang) => ({
  id_nivel_area: n.id_nivel_area,
  nivel_area: n.traducao_nivel_area?.[lang] || null, // Acede dinamicamente à chave do idioma
  id_area_sl: n.id_area_sl,
  area: n.area?.traducao_area?.[lang] || null,
  candidatura_com_prazo: n.candidatura_com_prazo,
  tempo_concluir_candidatura: n.tempo_concluir_candidatura,
  nivelAtivo: n.nivelAtivo
});

/**
 * HELPER: buildAtivoFilter
 * Higieniza os parâmetros de consulta opcionais do URL (?ativo=true).
 * Caso não seja passado nenhum filtro, devolve um objeto vazio, listando ativos e inativos.
 */
const buildAtivoFilter = (ativo) => {
  if (ativo === undefined || ativo === null || ativo === '') return {};
  return { nivelAtivo: ativo === 'true' || ativo === '1' };
};

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * POST /nivel_area
 * Cria um novo nível de competência gerando traduções paralelas em background.
 */
controllersNivelArea.createNivelArea = async (req, res) => {
  const transaction = await sequelize.transaction(); // Inicia uma transação segura

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const { id_area_sl, titulo, candidatura_com_prazo, tempo_concluir_candidatura } = req.body;

    // Validações defensivas precoces sobre campos obrigatórios e tipos de dados
    if (!id_area_sl) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "O campo 'id_area_sl' é obrigatório.", data: null });
    }

    // Se for SLL, valida se a área pertence à sua Service Line
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'area', id_area_sl);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Não pode associar níveis a uma área fora do escopo da sua Service Line." });
      }
    }

    if (!titulo || typeof titulo !== 'string') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "O campo 'titulo' é obrigatório e deve ser texto.", data: null });
    }

    // Cria um ID UUIDv7 sequencial por tempo para o dicionário idiomático
    const idTraducaoTitulo = gerarUUIDv7();
    const tituloTraduzido = await processarTraducao(titulo, lang); // Comunica assincronamente com o tradutor/IA

    // Grava o par de chaves idiomáticas em PT, EN e ES na tabela central de traduções
    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoTitulo,
      tabela: 'nivel_area',
      coluna: 'nivel_area',
      pt: tituloTraduzido.pt,
      en: tituloTraduzido.en,
      es: tituloTraduzido.es
    }, { transaction });

    // Prepara de forma flexível o payload do Nível
    const payload = {
      id_area_sl,
      id_traducao_nivel_area: idTraducaoTitulo,
      candidatura_com_prazo: candidatura_com_prazo || false
    };
    
    // Regra de Negócio: Injeta o tempo de conclusão apenas se o nível exigir controlo estrito de prazos
    if (candidatura_com_prazo && tempo_concluir_candidatura !== undefined) {
      payload.tempo_concluir_candidatura = tempo_concluir_candidatura;
    }

    // Insere a entidade Nível na BD e faz re-fetch completo dos relacionamentos
    const novoNivel = await NivelArea.create(payload, { transaction });
    const nivelCompleto = await NivelArea.findByPk(novoNivel.id_nivel_area, {
      include: buildInclude(lang),
      transaction
    });

    await transaction.commit(); // Fecha a transação salvando tudo em definitivo

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'create', entity: 'nivel_area', id: novoNivel.id_nivel_area });
    emitGlobal('nivel_updated', { type: 'create', id: novoNivel.id_nivel_area });

    res.status(200).json({
      success: true,
      message: "Nível Área criado com sucesso.",
      data: mapNivel(nivelCompleto, lang) // Devolve formatado pelo transformador plano
    });

  } catch (error) {
    await transaction.rollback(); // Cancela qualquer escrita efetuada caso ocorra uma falha intermédia
    res.status(500).json({ success: false, message: "Erro ao criar Nível Área.", error: error.message });
  }
};

/**
 * GET /nivel_area
 * Lista todos os níveis registados na plataforma ordenados de forma crescente pelo ID.
 */
controllersNivelArea.listNivelArea = async (req, res) => {
  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const where = buildAtivoFilter(req.query.ativo); // Aplica filtragem de estado lógico

    if (activeRole === 2) {
      const slId = await getSllServiceLineId(userId);
      if (!slId) {
        return res.status(200).json({ success: true, data: [] });
      }
      where['$area.id_service_line$'] = slId;
    }

    const niveis = await NivelArea.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_nivel_area', 'ASC']] // Organização sequencial dos patamares
    });

    res.status(200).json({
      success: true,
      message: "Níveis recuperados com sucesso.",
      data: niveis.map(n => mapNivel(n, lang)) // Formata toda a coleção através do Mapper (.map)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar Níveis.", error: error.message });
  }
};

/**
 * GET /nivel_area/area/:id
 * Filtra e retorna de forma isolada todos os níveis pertencentes a uma única Área de negócio.
 */
controllersNivelArea.listNivelByArea = async (req, res) => {
  const id_area_sl = validaIDInteiro(req.params.id); // Sanitiza o ID numérico vindo do URL
  if (!id_area_sl) {
    return res.status(400).json({ success: false, message: "ID de Área inválido.", data: null });
  }

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    // Se for SLL, valida o escopo da área
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'area', id_area_sl);
      if (!belongs) {
        return res.status(403).json({ success: false, message: "Acesso negado: Esta área não pertence à sua Service Line." });
      }
    }

    // Acopla a chave estrangeira da Área ao filtro de estado normalizado
    const where = { id_area_sl, ...buildAtivoFilter(req.query.ativo) };

    const niveis = await NivelArea.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_nivel_area', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: `Níveis da Área ${id_area_sl} recuperados.`,
      data: niveis.map(n => mapNivel(n, lang))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar por Área.", error: error.message });
  }
};

/**
 * GET /nivel_area/catalogo/area/:id
 * Lista os níveis de uma área específica para preenchimento de filtros no catálogo (BadgesList.jsx).
 * Acessível a ADMIN, SLL e TM SEM verificação restritiva de escopo checkSllScope.
 */
controllersNivelArea.listNivelByAreaCatalogo = async (req, res) => {
  const id_area_sl = validaIDInteiro(req.params.id);
  if (!id_area_sl) {
    return res.status(400).json({ success: false, message: "ID de Área inválido.", data: null });
  }

  try {
    const lang = req.lang;
    const where = { id_area_sl, ...buildAtivoFilter(req.query.ativo) };

    const niveis = await NivelArea.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_nivel_area', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: `Níveis da Área ${id_area_sl} recuperados para o catálogo.`,
      data: niveis.map(n => mapNivel(n, lang))
    });

  } catch (error) {
    console.error("Erro ao listar níveis da área no catálogo:", error);
    res.status(500).json({ success: false, message: "Erro ao listar níveis da área no catálogo.", error: error.message });
  }
};

/**
 * GET /nivel_area/catalogo
 * Lista todos os níveis globalmente para preenchimento de filtros no catálogo (BadgesList.jsx).
 * Acessível a ADMIN, SLL e TM SEM verificação restritiva de escopo.
 */
controllersNivelArea.listNivelAreaCatalogo = async (req, res) => {
  try {
    const lang = req.lang;
    const where = buildAtivoFilter(req.query.ativo);

    const niveis = await NivelArea.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_nivel_area', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: "Níveis recuperados para o catálogo.",
      data: niveis.map(n => mapNivel(n, lang))
    });

  } catch (error) {
    console.error("Erro ao listar níveis no catálogo:", error);
    res.status(500).json({ success: false, message: "Erro ao listar níveis no catálogo.", error: error.message });
  }
};

/**
 * GET /nivel_area/:id
 * Detalha um único nível específico validando o seu parâmetro contra injeções.
 */
controllersNivelArea.detailNivelArea = async (req, res) => {
  const id_nivel_area = validaIDInteiro(req.params.id);
  if (!id_nivel_area) {
    return res.status(400).json({ success: false, message: "ID inválido.", data: null });
  }

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'nivel', id_nivel_area);
      if (!belongs) {
        return res.status(403).json({ success: false, message: "Acesso negado: Este nível não pertence à sua Service Line." });
      }
    }

    const nivelInfo = await NivelArea.findOne({
      where: { id_nivel_area },
      include: buildInclude(lang)
    });

    if (!nivelInfo) return res.status(404).json({ success: false, message: "Nível não encontrado.", data: null });

    res.status(200).json({ success: true, message: "Nível recuperado com sucesso.", data: mapNivel(nivelInfo, lang) });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao recuperar Nível.", error: error.message });
  }
};

/**
 * PUT /nivel_area/:id
 * Efetua mutações parciais na entidade e sincroniza atualizações de texto nas tabelas de tradução.
 */
controllersNivelArea.updateNivelArea = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const id_nivel_area = validaIDInteiro(req.params.id);
    if (!id_nivel_area) return res.status(400).json({ success: false, message: "ID inválido." });

    const nivelInfo = await NivelArea.findByPk(id_nivel_area);
    if (!nivelInfo) return res.status(404).json({ success: false, message: "Nível não encontrado." });

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'nivel', id_nivel_area);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Este nível não pertence à sua Service Line." });
      }
    }
    
    // Regra de Negócio Impeditiva: Bloqueia a edição de entidades arquivadas no sistema
    if (!nivelInfo.nivelAtivo) return res.status(400).json({ success: false, message: "Não é possível editar um Nível inativo." });

    const { id_area_sl, titulo, candidatura_com_prazo, tempo_concluir_candidatura } = req.body;

    // Se for SLL e estiver mudando de área, valida se a nova área pertence à sua Service Line
    if (activeRole === 2 && id_area_sl !== undefined && Number(id_area_sl) !== Number(nivelInfo.id_area_sl)) {
      const belongsNew = await checkSllScope(userId, 'area', id_area_sl);
      if (!belongsNew) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Não pode mover o nível para uma área fora do escopo da sua Service Line." });
      }
    }

    // Constrói dinamicamente o payload de campos alterados para evitar atualizações em branco ou destrutivas
    const payloadInfo = {};
    if (id_area_sl) payloadInfo.id_area_sl = id_area_sl;
    if (candidatura_com_prazo !== undefined) payloadInfo.candidatura_com_prazo = candidatura_com_prazo;
    if (tempo_concluir_candidatura !== undefined) payloadInfo.tempo_concluir_candidatura = tempo_concluir_candidatura;
    
    // Se houve mutação de propriedades estruturais, atualiza a tabela mãe
    if (Object.keys(payloadInfo).length > 0) await nivelInfo.update(payloadInfo, { transaction });

    // Atualização condicional do título: se enviado texto válido, gera nova tradução e atualiza a tabela pivot
    if (titulo && typeof titulo === 'string') {
      const tituloTraduzido = await processarTraducao(titulo, lang);
      await TraducaoConteudo.update({ pt: tituloTraduzido.pt, en: tituloTraduzido.en, es: tituloTraduzido.es }, {
        where: { id_traducao_conteudo: nivelInfo.id_traducao_nivel_area },
        transaction
      });
    }

    await transaction.commit(); // Aplica em definitivo na BD

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'update', entity: 'nivel_area', id: id_nivel_area });
    emitGlobal('nivel_updated', { type: 'update', id: id_nivel_area });
    res.status(200).json({ success: true, message: "Nível atualizado com sucesso." });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao atualizar Nível.", error: error.message });
  }
};

/**
 * PATCH /nivel_area/:id/status
 * Método de acesso parcial (PATCH) para ativar ou desativar rapidamente o nível no painel administrativo.
 */
controllersNivelArea.updateStatusNivelArea = async (req, res) => {
  try {
    const id_nivel_area = validaIDInteiro(req.params.id);
    if (!id_nivel_area) return res.status(400).json({ success: false, message: "ID inválido." });

    const { nivelAtivo } = req.body;
    if (typeof nivelAtivo !== "boolean") return res.status(400).json({ success: false, message: "Campo nivelAtivo deve ser boolean." });

    const nivelInfo = await NivelArea.findByPk(id_nivel_area);
    if (!nivelInfo) return res.status(404).json({ success: false, message: "Nível não encontrado." });

    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'nivel', id_nivel_area);
      if (!belongs) {
        return res.status(403).json({ success: false, message: "Acesso negado: Este nível não pertence à sua Service Line." });
      }
    }

    await nivelInfo.update({ nivelAtivo }); // Atualização rápida e direta da flag booleana

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'status', entity: 'nivel_area', id: id_nivel_area, active: nivelAtivo });
    emitGlobal('nivel_updated', { type: 'status', id: id_nivel_area, active: nivelAtivo });
    res.status(200).json({ success: true, message: `Nível ${nivelAtivo ? 'ativado' : 'inativado'} com sucesso.` });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao atualizar estado.", error: error.message });
  }
};

/**
 * DELETE /nivel_area/:id
 * Aplica o conceito profissional de Soft Delete (Remoção Lógica) salvaguardando a integridade referencial.
 */
controllersNivelArea.deleteNivelArea = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const id_nivel_area = validaIDInteiro(req.params.id);
    if (!id_nivel_area) return res.status(400).json({ success: false, message: "ID inválido." });

    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    const nivelInfo = await NivelArea.findByPk(id_nivel_area);
    if (!nivelInfo) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Nível não encontrado." });
    }

    // Validação de Escopo para SLL
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'nivel', id_nivel_area);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: "Acesso negado: Este nível não pertence à sua Service Line." });
      }
    }

    // Preservação de Dados Históricos: Altera apenas a flag para inativo
    await nivelInfo.update({ nivelAtivo: false }, { transaction });
    await transaction.commit();

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'delete', entity: 'nivel_area', id: id_nivel_area });
    emitGlobal('nivel_updated', { type: 'delete', id: id_nivel_area });

    res.status(200).json({ success: true, message: "Nível desativado." });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao desativar Nível.", error: error.message });
  }
};

module.exports = controllersNivelArea;