const BadgeAtribuido = require('../models/badge_atribuido.model'); // Modelo da tabela de Badges Atribuídos
const Badge = require('../models/badge.model');
const ServiceLine = require('../models/service_line.model');
const NivelArea = require('../models/nivel.model');
const Area = require('../models/area.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const validaUUID = require('../services/valida_UUID');               // Utilitário para validar IDs no formato estrito UUID v7

// Objeto que vai agrupar e exportar todos os métodos deste controlador
const controllers = {};

// =========================================================================
// MÉTODOS DO CONTROLADOR (ENDPOINTS DA API REST)
// =========================================================================

/**
 * 1. LISTAR BADGES ATRIBUÍDOS
 * Retorna todos os badges atribuídos no sistema com suporte a filtragem opcional por candidato.
 * URL Exemplo: GET /badges/atribuidos?id_candidato=UUID_AQUI
 */
controllers.listBadgesAtribuidos = async (req, res) => {
  try {
    const { id_candidato } = req.query; // Captura o parâmetro de filtro opcional vindo do URL (?id_candidato=...)
    const where = { atribuicaoAtiva: true }; // Regra de Negócio: Filtra apenas atribuições ativas (ignora remoções lógicas)

    // Se o filtro de candidato foi fornecido no pedido
    if (id_candidato) {
      // Valida defensivamente se o ID enviado obedece ao padrão UUID versão 7
      if (!validaUUID(id_candidato, 7)) {
        return res.status(400).json({ success: false, message: 'id_candidato inválido.' });
      }
      where.id_candidato = id_candidato; // Injeta o filtro na cláusula WHERE do Sequelize
    }

    // Consulta a base de dados aplicando as condições estruturadas no objeto "where"
    const badges = await BadgeAtribuido.findAll({ where });
    
    // Retorna a resposta HTTP de sucesso com o array de badges
    res.status(200).json({ success: true, data: badges });
  } catch (error) {
    // Tratamento de exceções em caso de falha de ligação ou erro interno do servidor
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 2. DETALHE DE UM BADGE ATRIBUÍDO
 * Retorna as informações completas de uma atribuição específica com base no ID recebido por parâmetro de rota.
 * URL Exemplo: GET /badges/atribuidos/:id
 */
controllers.detailBadgeAtribuido = async (req, res) => {
  try {
    // Valida se o ID da atribuição presente no URL é um UUIDv7 válido
    if (!validaUUID(req.params.id, 7)) {
      return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    // Procura o registo diretamente pela sua Chave Primária (PK)
    const badge = await BadgeAtribuido.findByPk(req.params.id);
    
    // Regra de Negócio: Se o badge não existir ou a atribuição tiver sido desativada logicamente, retorna 404
    if (!badge || !badge.atribuicaoAtiva) {
      return res.status(404).json({ success: false, message: "Não encontrado" });
    }
    
    // Retorna com sucesso o objeto correspondente à atribuição solicitada
    res.status(200).json({ success: true, data: badge });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 3. EMITIR / ATRIBUIR NOVO BADGE
 * Regista o ganho de um badge na base de dados após a aprovação de uma candidatura.
 * URL Exemplo: POST /badges/atribuidos
 */
controllers.createBadgeAtribuido = async (req, res) => {
  try {
    // Desestrutura o corpo da requisição para capturar as chaves estrangeiras necessárias
    const { id_candidato, id_badge, id_candidatura } = req.body;
    
    // Cibersegurança Rígida: Garante que os três pilares do relacionamento são UUIDs versão 7 válidos
    if (!validaUUID(id_candidato, 7) || !validaUUID(id_badge, 7) || !validaUUID(id_candidatura, 7)) {
      return res.status(400).json({ success: false, message: 'IDs inválidos no corpo do pedido.' });
    }

    // Insere o novo registo na base de dados utilizando o corpo completo enviado pelo cliente
    const novoBadge = await BadgeAtribuido.create(req.body);
    
    // Devolve o status 200 de sucesso com a estrutura do badge atribuído criado
    res.status(200).json({ success: true, data: novoBadge });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 4. DASHBOARD DA SERVICE LINE (RESUMO SLL)
 * Retorna a contagem total de atribuições e o resumo de badges atribuídos da Service Line do SLL.
 */
controllers.getDashboardSlSummary = async (req, res) => {
  try {
    const id_utilizador = req.auth?.sub || req.auth?.id_utilizador;
    const activeRole = req.activeRole;
    const lang = req.lang || 'pt';

    // Regra de Negócio: Apenas SLL (2) ou Admin (1) podem obter estas informações
    if (activeRole !== 1 && activeRole !== 2) {
      return res.status(403).json({ success: false, message: "Acesso negado: Perfil sem permissão para este dashboard." });
    }

    let id_service_line;

    if (activeRole === 2) {
      // Se for SLL, busca a Service Line liderada por este utilizador
      const serviceLine = await ServiceLine.findOne({
        where: { id_sl_lider: id_utilizador }
      });
      if (!serviceLine) {
        return res.status(200).json({
          success: true,
          data: {
            total_badges_atribuidos: 0,
            lista_badges: []
          }
        });
      }
      id_service_line = serviceLine.id_service_line;
    } else {
      // Se for Admin, pode passar id_service_line como query param, ou listar todas se não enviado
      id_service_line = req.query.id_service_line;
    }

    // Filtro para buscar os badges da Service Line correspondente
    const whereArea = {};
    if (id_service_line) {
      whereArea.id_service_line = Number(id_service_line);
    }

    // Busca todos os badges, incluindo o número de atribuições ativas e caminhos relacionais traduzidos
    const badges = await Badge.findAll({
      include: [
        { association: 'traducao_titulo', attributes: [lang] },
        {
          association: 'nivel_area',
          required: true,
          include: [
            { association: 'traducao_nivel_area', attributes: [lang] },
            {
              association: 'area',
              required: true,
              where: whereArea,
              include: [
                { association: 'traducao_area', attributes: [lang] },
                {
                  association: 'service_line',
                  include: [{ association: 'traducao_service_line', attributes: [lang] }]
                }
              ]
            }
          ]
        },
        {
          association: 'atribuidos',
          where: { atribuicaoAtiva: true },
          required: false // Queremos todos os badges da SL, mesmo com 0 atribuições
        }
      ]
    });

    // Mapeia e filtra apenas os badges que têm pelo menos 1 atribuição ativa
    const listaBadgesObj = badges.map(b => {
      const totalAtribuidos = b.atribuidos ? b.atribuidos.length : 0;
      return {
        id_badge: b.id_badge,
        titulo: b.traducao_titulo?.[lang] || null,
        nivel_area: b.nivel_area?.traducao_nivel_area?.[lang] || null,
        area: b.nivel_area?.area?.traducao_area?.[lang] || null,
        service_line: b.nivel_area?.area?.service_line?.traducao_service_line?.[lang] || null,
        total_atribuidos: totalAtribuidos
      };
    }).filter(b => b.total_atribuidos > 0);

    // Calcula o total geral de atribuições de badges da Service Line
    const totalBadgesAtribuidos = listaBadgesObj.reduce((sum, b) => sum + b.total_atribuidos, 0);

    res.status(200).json({
      success: true,
      message: "Resumo do dashboard da Service Line recuperado.",
      data: {
        total_badges_atribuidos: totalBadgesAtribuidos,
        lista_badges: listaBadgesObj
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Exporta o controlador para que as rotas possam aceder aos métodos
module.exports = controllers;