// =========================================================================
// IMPORTAÇÃO DE MODELOS ORM, COMPONENTES DE BASE DE DADOS E DEPENDÊNCIAS
// =========================================================================
const ServiceLine = require('../models/service_line.model');         // Modelo da tabela de Service Lines (Linhas de Serviço)
const LearningPath = require('../models/learning_path.model');       // Modelo da tabela de Learning Paths (Trilhos de Aprendizagem)
const TraducaoConteudo = require('../models/traducao_conteudo.model'); // Tabela unificada para persistência idiomática
const sequelize = require('../config/database');                    // Instância do Sequelize para isolamento e transações ACID
const { gerarUUIDv7 } = require('../services/geradores');           // Gerador de identificadores criptográficos baseados em tempo (UUIDv7)
const validaIDInteiro = require('../services/valida_id_inteiro');     // Utilitário defensivo para higienização e validação de inteiros
const { processarTraducao, tratarPayloadTraducao } = require('../services/tradutor_helper'); // Serviço integrado que traduz texto automaticamente via IA
const { criarENotificar } = require('../services/notificacao.service');
const { getSllServiceLineId, checkSllScope } = require('../services/scope_check');
const { emitGlobal, emitToRoom } = require('../services/websocket.service');

const controllersServiceLine = {};

// =========================================================================
// MÉTODOS AUXILIARES / HELPERS (EAGER LOADING, DATA MAPPERS E FILTROS)
// =========================================================================

/**
 * HELPER: buildInclude
 * Desenha uma árvore profunda de junções relacionais (Eager Loading) para o Sequelize.
 * Filtra as tabelas de internacionalização trazendo única e exclusivamente os atributos
 * correspondentes ao idioma ativo (`lang`) da requisição, unindo ainda o Líder da Linha (SLL).
 */
const buildInclude = (lang) => [
  {
    association: 'traducao_service_line',
    attributes: [lang] // Traz apenas a coluna do idioma atual (ex: 'pt', 'en' ou 'es')
  },
  {
    association: 'learning_path',
    include: [
      {
        association: 'traducao_learning_path',
        attributes: [lang] // Traz o nome do Trilho de Aprendizagem pai devidamente traduzido
      }
    ]
  },
  {
    association: 'lider_service_line',
    attributes: ['nome', 'apelido'] // Traz exclusivamente as propriedades textuais de identificação do líder
  }
];

/**
 * HELPER: mapServiceLine
 * Atua como um transformador de dados (Data Mapper). Desestrutura a árvore complexa
 * retornada pelo ORM, lê as strings dinâmicas idiomáticas e entrega uma resposta JSON plana ao Frontend.
 */
const mapServiceLine = (sl, lang) => ({
  id_service_line: sl.id_service_line,
  service_line: sl.traducao_service_line?.[lang] || null, // Acede dinamicamente à propriedade do idioma
  id_learning_path: sl.id_learning_path,
  learning_path: sl.learning_path?.traducao_learning_path?.[lang] || null,
  id_sl_lider: sl.id_sl_lider,
  // Interpolação de Strings para agrupar o nome e o apelido do líder numa única chave visual
  nome_sll: sl.lider_service_line
    ? `${sl.lider_service_line.nome} ${sl.lider_service_line.apelido}`
    : null,
  slAtivo: sl.slAtivo
});

/**
 * HELPER: buildAtivoFilter
 * Normaliza os parâmetros opcionais passados na URL (?ativo=true ou ?ativo=1).
 * Caso não seja enviado, retorna um objeto vazio, o que faz listar tanto ativos como inativos.
 */
const buildAtivoFilter = (ativo) => {
  if (ativo === undefined || ativo === null || ativo === '') return {};
  return { slAtivo: ativo === 'true' || ativo === '1' };
};

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * POST /service_line
 * Cria uma nova Linha de Serviço disparando traduções automatizadas com suporte transacional.
 */
controllersServiceLine.createServiceLine = async (req, res) => {
  const transaction = await sequelize.transaction(); // Inicia o bloco de transação segura

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    
    // Apenas Administrador pode criar novas Service Lines
    if (activeRole !== 1) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Acesso negado: Apenas o Administrador pode criar Service Lines." });
    }

    const { id_learning_path, titulo, id_sl_lider } = req.body;

    // Validações defensivas precoces (Early Returns) para blindagem de integridade
    if (!id_learning_path) {
      return res.status(400).json({
        success: false,
        message: "O campo 'id_learning_path' é obrigatório.",
        data: null
      });
    }

    if (!titulo || (typeof titulo !== 'string' && typeof titulo !== 'object')) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "O campo 'titulo' é obrigatório.",
        data: null
      });
    }

    // Passos de internacionalização automática
    const idTraducaoTitulo = gerarUUIDv7(); // Cria um ID ordenável cronologicamente por tempo (UUID v7)
    
    let tituloTraduzido;
    try {
      tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha na tradução automática no createServiceLine:", transError.message);
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

    // Regista o dicionário com as variantes PT, EN e ES na tabela central de traduções
    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoTitulo,
      tabela: 'service_line',
      coluna: 'service_line',
      pt: tituloTraduzido.pt,
      en: tituloTraduzido.en,
      es: tituloTraduzido.es
    }, { transaction });

    // Preparação dinâmica do payload do registo
    const dataObj = { id_learning_path, id_traducao_service_line: idTraducaoTitulo };
    // Atribuição flexível: só acopla o líder se ele for explicitamente enviado no body do pedido
    if (id_sl_lider) dataObj.id_sl_lider = id_sl_lider;

    // Cria a entidade Service Line na BD e faz o re-fetch completo dos relacionamentos
    const novoSL = await ServiceLine.create(dataObj, { transaction });

    const slCompleto = await ServiceLine.findByPk(novoSL.id_service_line, {
      include: buildInclude(lang),
      transaction
    });

    await transaction.commit(); // Fecha e consolida a transação com sucesso total na BD

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'create', entity: 'service_line', id: novoSL.id_service_line });
    emitGlobal('service_line_updated', { type: 'create', id: novoSL.id_service_line });
    if (id_sl_lider) {
      emitToRoom(`user_${id_sl_lider}`, 'profile_updated', { reason: 'sl_assigned', id_service_line: novoSL.id_service_line });
    }

    // Notifica o SLL responsável em tempo real caso tenha sido atribuído um líder
    if (id_sl_lider) {
      try {
        const id_user_notificador = req.auth?.sub || req.auth?.id_utilizador;
        await criarENotificar({
          id_user_notificador,
          id_user_alvo_notificacao: id_sl_lider,
          codigo_tipo: 'gestao_service_line',
          titulo: 'Atribuição de Linha de Serviço',
          mensagem: `Foi-lhe atribuída a gestão da Service Line '${titulo}'.`,
          parametros: { id_service_line: novoSL.id_service_line }
        });
      } catch (notifErr) {
        console.error("Erro ao notificar SLL na criação da SL:", notifErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Service Line criado com sucesso.",
      data: mapServiceLine(slCompleto, lang) // Resposta estruturada através do transformador plano
    });

  } catch (error) {
    await transaction.rollback(); // Desfaz todas as inserções nas tabelas caso ocorra qualquer quebra de fluxo
    res.status(500).json({ success: false, message: "Erro ao criar Service Line.", error: error.message });
  }
};

/**
 * GET /service_line
 * Recupera e lista todas as Linhas de Serviço registadas com paginação lúdica e filtros lógicos.
 */
controllersServiceLine.listServiceLine = async (req, res) => {
  try {
    const lang = req.lang;
    const where = buildAtivoFilter(req.query.ativo); // Trata o filtro lógico de estado (?ativo=)

    // Filtra por líder apenas se for explicitamente solicitado via query param (?id_sl_lider= ou ?sll=)
    const id_sl_lider = req.query.id_sl_lider || req.query.sll;
    if (id_sl_lider) {
      where.id_sl_lider = id_sl_lider;
    }

    const serviceLines = await ServiceLine.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_service_line', 'ASC']] // Organização sequencial baseada no ID crescente
    });

    res.status(200).json({
      success: true,
      message: "Service Lines recuperados com sucesso.",
      data: serviceLines.map(sl => mapServiceLine(sl, lang)) // Aplica o Mapper em lote (.map)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar Service Lines.", error: error.message });
  }
};

/**
 * GET /service_line/lp/:id
 * Filtra e retorna de forma isolada todas as Service Lines vinculadas a um determinado Learning Path pai.
 */
controllersServiceLine.listServiceLineByLP = async (req, res) => {
  const id_learning_path = validaIDInteiro(req.params.id); // Sanitiza o parâmetro numérico contra injeções SQL
  if (!id_learning_path) {
    return res.status(400).json({ success: false, message: "ID de Learning Path inválido.", data: null });
  }

  try {
    const lang = req.lang;
    
    // Acopla a chave estrangeira do Learning Path ao filtro lógico de estado ativo
    const where = { id_learning_path, ...buildAtivoFilter(req.query.ativo) };

    const serviceLines = await ServiceLine.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_service_line', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: `Service Lines do Learning Path ${id_learning_path} recuperados.`,
      data: serviceLines.map(sl => mapServiceLine(sl, lang))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar por Learning Path.", error: error.message });
  }
};

/**
 * GET /service_line/:id
 * Detalha uma única Service Line com base no seu parâmetro de ID recebido no URL.
 */
controllersServiceLine.detailServiceLine = async (req, res) => {
  const id_service_line = validaIDInteiro(req.params.id);
  if (!id_service_line) {
    return res.status(400).json({ success: false, message: "ID inválido.", data: null });
  }

  try {
    const lang = req.lang;

    const serviceLine = await ServiceLine.findOne({
      where: { id_service_line },
      include: buildInclude(lang)
    });

    if (!serviceLine) {
      return res.status(404).json({ success: false, message: "Service Line não encontrado.", data: null });
    }

    res.status(200).json({
      success: true,
      message: "Service Line recuperado com sucesso.",
      data: mapServiceLine(serviceLine, lang)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao recuperar Service Line.", error: error.message });
  }
};

/**
 * PUT /service_line/:id
 * Efetua mutações estruturais parciais e propaga as alterações de texto traduzido na tabela pivot.
 */
controllersServiceLine.updateServiceLine = async (req, res) => {
  const transaction = await sequelize.transaction(); // Inicia bloco isolado

  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const id_service_line = validaIDInteiro(req.params.id);
    if (!id_service_line) return res.status(400).json({ success: false, message: "ID inválido." });

    const serviceLine = await ServiceLine.findByPk(id_service_line);
    if (!serviceLine) return res.status(404).json({ success: false, message: "Service Line não encontrado." });
    
    // Validação de Escopo para SLL
    if (activeRole === 2 && serviceLine.id_sl_lider !== userId) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Acesso negado: Não é líder desta Service Line." });
    }

    // Regra de Negócio Bloqueante: Impede a mutação ou corrupção de entidades arquivadas (inativas)
    if (!serviceLine.slAtivo) return res.status(400).json({ success: false, message: "Não é possível editar um Service Line inativo." });

    const { id_learning_path, titulo, id_sl_lider } = req.body;

    // SLL não pode redefinir o líder da Service Line
    if (activeRole === 2 && id_sl_lider !== undefined && id_sl_lider !== serviceLine.id_sl_lider) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Acesso negado: Apenas o Administrador pode redefinir o líder da Service Line." });
    }

    // Constrói dinamicamente o payload parcial de modificações para evitar updates nulos ou destrutivos
    const payload = {};
    if (id_learning_path) payload.id_learning_path = id_learning_path;
    // Lógica Híbrida: Permite explicitamente redefinir o líder para nulo (retirar liderança) ou substituir pelo novo ID
    if (id_sl_lider !== undefined) payload.id_sl_lider = id_sl_lider === null ? null : id_sl_lider;
    
    // Se houve mutações em propriedades estruturais básicas, atualiza a tabela mãe
    if (Object.keys(payload).length > 0) await serviceLine.update(payload, { transaction });

    try {
      if (titulo && (typeof titulo === 'string' || typeof titulo === 'object')) {
        const tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
        await TraducaoConteudo.update({ pt: tituloTraduzido.pt, en: tituloTraduzido.en, es: tituloTraduzido.es }, {
          where: { id_traducao_conteudo: serviceLine.id_traducao_service_line },
          transaction
        });
      }
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha na tradução automática no updateServiceLine:", transError.message);
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

    const isNewLeader = id_sl_lider && id_sl_lider !== serviceLine.id_sl_lider;
    const oldLeader = serviceLine.id_sl_lider;

    await transaction.commit(); // Grava e aplica todas as alterações com sucesso na BD

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'update', entity: 'service_line', id: id_service_line });
    emitGlobal('service_line_updated', { type: 'update', id: id_service_line });
    if (isNewLeader) {
      emitToRoom(`user_${id_sl_lider}`, 'profile_updated', { reason: 'sl_assigned', id_service_line });
      if (oldLeader) {
        emitToRoom(`user_${oldLeader}`, 'profile_updated', { reason: 'sl_unassigned', id_service_line });
      }
    }

    // Notifica o SLL responsável caso a liderança tenha mudado ou sido atualizada
    const targetLider = id_sl_lider !== undefined ? id_sl_lider : serviceLine.id_sl_lider;
    if (targetLider) {
      try {
        const id_user_notificador = req.auth?.sub || req.auth?.id_utilizador;
        const isNewLeaderNotif = id_sl_lider && id_sl_lider !== serviceLine.id_sl_lider;
        await criarENotificar({
          id_user_notificador,
          id_user_alvo_notificacao: targetLider,
          codigo_tipo: 'gestao_service_line',
          titulo: isNewLeader ? 'Atribuição de Linha de Serviço' : 'Atualização de Linha de Serviço',
          mensagem: isNewLeader
            ? `Foi-lhe atribuída a gestão da Service Line '${titulo || 'existente'}'.`
            : `A Service Line '${titulo || 'existente'}' sob a sua gestão foi atualizada.`,
          parametros: { id_service_line: serviceLine.id_service_line }
        });
      } catch (notifErr) {
        console.error("Erro ao notificar SLL na atualização da SL:", notifErr.message);
      }
    }

    res.status(200).json({ success: true, message: "Service Line atualizado com sucesso." });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao atualizar Service Line.", error: error.message });
  }
};

/**
 * PATCH /service_line/:id/status
 * Método parcial (PATCH) usado para alternar rapidamente a flag booleana de ativação do departamento.
 */
controllersServiceLine.updateStatusServiceLine = async (req, res) => {
  try {
    const id_service_line = validaIDInteiro(req.params.id);
    if (!id_service_line) return res.status(400).json({ success: false, message: "ID inválido." });

    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    const { slAtivo } = req.body; // Captura sinalizador explicito do body
    if (typeof slAtivo !== "boolean") return res.status(400).json({ success: false, message: "Campo slAtivo deve ser boolean." });

    const serviceLine = await ServiceLine.findByPk(id_service_line);
    if (!serviceLine) return res.status(404).json({ success: false, message: "Service Line não encontrado." });

    // Apenas Administrador pode ativar/desativar Linhas de Serviço
    if (activeRole !== 1) {
      return res.status(403).json({ success: false, message: "Acesso negado: Apenas o Administrador pode alterar o estado das Service Lines." });
    }

    await serviceLine.update({ slAtivo }); // Executa atualização booleana direta

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'status', entity: 'service_line', id: id_service_line, active: slAtivo });
    emitGlobal('service_line_updated', { type: 'status', id: id_service_line, active: slAtivo });

    if (serviceLine.id_sl_lider) {
      try {
        const id_user_notificador = req.auth?.sub || req.auth?.id_utilizador;
        await criarENotificar({
          id_user_notificador,
          id_user_alvo_notificacao: serviceLine.id_sl_lider,
          codigo_tipo: 'gestao_service_line',
          titulo: 'Alteração de Estado de Service Line',
          mensagem: `A Service Line sob a sua gestão foi ${slAtivo ? 'ativada' : 'desativada'}.`,
          parametros: { id_service_line: serviceLine.id_service_line, slAtivo }
        });
      } catch (notifErr) {
        console.error("Erro ao notificar SLL no status da SL:", notifErr.message);
      }
    }

    res.status(200).json({ success: true, message: `Service Line ${slAtivo ? 'ativado' : 'inativado'} com sucesso.` });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao atualizar estado.", error: error.message });
  }
};

/**
 * DELETE /service_line/:id
 * Aplica o padrão profissional de Soft Delete (Remoção Lógica) resguardando dados e integridade referencial.
 */
controllersServiceLine.deleteServiceLine = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const id_service_line = validaIDInteiro(req.params.id);
    if (!id_service_line) return res.status(400).json({ success: false, message: "ID inválido." });

    const activeRole = req.activeRole;
    if (activeRole !== 1) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Acesso negado: Apenas o Administrador pode eliminar Service Lines." });
    }

    const serviceLine = await ServiceLine.findByPk(id_service_line);
    if (!serviceLine) return res.status(404).json({ success: false, message: "Service Line não encontrado." });

    // Preservação Histórica: Não destrói a linha fisicamente (.destroy). Altera apenas a flag para inativo.
    await serviceLine.update({ slAtivo: false }, { transaction });
    await transaction.commit();

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'delete', entity: 'service_line', id: id_service_line });
    emitGlobal('service_line_updated', { type: 'delete', id: id_service_line });
    if (serviceLine.id_sl_lider) {
      emitToRoom(`user_${serviceLine.id_sl_lider}`, 'profile_updated', { reason: 'sl_unassigned', id_service_line });
    }

    if (serviceLine.id_sl_lider) {
      try {
        const id_user_notificador = req.auth?.sub || req.auth?.id_utilizador;
        await criarENotificar({
          id_user_notificador,
          id_user_alvo_notificacao: serviceLine.id_sl_lider,
          codigo_tipo: 'gestao_service_line',
          titulo: 'Desativação de Linha de Serviço',
          mensagem: `A Service Line sob a sua gestão foi desativada.`,
          parametros: { id_service_line: serviceLine.id_service_line }
        });
      } catch (notifErr) {
        console.error("Erro ao notificar SLL na desativação da SL:", notifErr.message);
      }
    }

    res.status(200).json({ success: true, message: "Service Line desativado." });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao desativar Service Line.", error: error.message });
  }
};

/**
 * GET /service_line/sll/:id
 * Filtra e retorna todas as Linhas de Serviço sob a alçada de auditoria de um Líder técnico específico (SLL).
 */
controllersServiceLine.listServiceLineBySLL = async (req, res) => {
  const id_sl_lider = req.params.id; // Captura a chave UUIDv7 identificadora do líder no URL amigável
  if (!id_sl_lider) {
    return res.status(400).json({ success: false, message: "ID de SL Lider inválido.", data: null });
  }

  try {
    const lang = req.lang;
    const where = { id_sl_lider, ...buildAtivoFilter(req.query.ativo) };

    const serviceLines = await ServiceLine.findAll({
      where,
      include: buildInclude(lang),
      order: [['id_service_line', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: `Service Lines do Lider ${id_sl_lider} recuperados.`,
      data: serviceLines.map(sl => mapServiceLine(sl, lang))
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar por SL Lider.", error: error.message });
  }
};

module.exports = controllersServiceLine;
