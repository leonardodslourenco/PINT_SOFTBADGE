const fs = require('fs');
const path = require('path');
const RenovacaoBadge = require('../models/renovacao_badge.model');
const EvidenciaRenovacao = require('../models/evidencia_renovacao.model');
const Candidatura = require('../models/candidatura_badge.model');
const Badge = require('../models/badge.model');
const Utilizador = require('../models/utilizador.model');
const BadgeAtribuido = require('../models/badge_atribuido.model');
const AcaoCandidatura = require('../models/acao_candidatura.model');
const RequisitoBadge = require('../models/requisito_badge.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const { getSllServiceLineId } = require('../services/scope_check');
const { emitGlobal, emitToRoom } = require('../services/websocket.service');
const { PERFIS } = require('../middlewares/permissao.middleware');
const validaUUID = require('../services/valida_UUID');
const { Op } = require('sequelize');
const LearningPath = require('../models/learning_path.model');

const controllersRenovacao = {};

/**
 * HELPER: getLearningPathsMap
 * Evita o truncamento de aliases de 63 caracteres do PostgreSQL em junções profundas
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
    lps.forEach(lp => {
      map[lp.id_learning_path] = lp.traducao_learning_path?.[lang] || lp.traducao_learning_path?.pt || lp.nome || '';
    });
    return map;
  } catch (e) {
    return {};
  }
};

/**
 * POST /renovacao_badge/solicitar
 * Cria um novo pedido de renovação para um badge expirável previamente conquistado.
 */
controllersRenovacao.solicitarRenovacao = async (req, res) => {
  try {
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const { id_candidatura } = req.body;

    if (!id_candidatura) {
      return res.status(400).json({ success: false, message: 'O id_candidatura é obrigatório.' });
    }

    // 1. Verificar se a candidatura pertence ao consultor autenticado e se está aprovada (estado 4)
    const candidatura = await Candidatura.findOne({
      where: {
        id_candidatura,
        candidaturaAtiva: true
      },
      include: [{ association: 'badge' }]
    });

    if (!candidatura) {
      return res.status(404).json({ success: false, message: 'Candidatura não encontrada.' });
    }

    if (candidatura.id_utilizador !== userId) {
      return res.status(403).json({ success: false, message: 'Não tem permissão para renovar esta candidatura.' });
    }

    if (Number(candidatura.id_estado_candidatura) !== 4) {
      return res.status(400).json({ success: false, message: 'Apenas candidaturas aprovadas (concluídas) podem ser renovadas.' });
    }

    // 2. Verificar se o badge associado é expirável
    if (!candidatura.badge?.badge_expiravel) {
      return res.status(400).json({ success: false, message: 'Este badge não é expirável e não requer renovação.' });
    }

    // 3. Verificar se já existe um pedido de renovação pendente
    const pendente = await RenovacaoBadge.findOne({
      where: {
        id_candidatura,
        renovacao_aprovada: null,
        renovacaoAtiva: true
      }
    });

    if (pendente) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um pedido de renovação pendente para esta candidatura.',
        data: pendente
      });
    }

    // 4. Criar o pedido de renovação (com pontos_renovacao a null até aprovação do moderador)
    const novaRenovacao = await RenovacaoBadge.create({
      id_candidatura,
      id_moderador: null,
      pontos_renovacao: null,
      data_pedido: new Date(),
      data_renovacao: null,
      renovacao_aprovada: null,
      renovacaoAtiva: true
    });

    // Notificar moderadores e atualizar frontend via WebSockets
    try {
      emitGlobal('renovacao_criada', {
        id_renovacao_badge: novaRenovacao.id_renovacao_badge,
        id_candidatura,
        id_utilizador: userId
      });
      emitGlobal('renovacao_updated', {
        type: 'create',
        id_renovacao_badge: novaRenovacao.id_renovacao_badge
      });
    } catch (wsErr) {
      console.error('Erro ao emitir websocket de nova renovacao:', wsErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Pedido de renovação registado com sucesso.',
      data: novaRenovacao
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /renovacao_badge/elegiveis
 * (Exclusivo para o Consultor autenticado - Aba 1)
 * Lista os badges do próprio consultor que são expiráveis e estão no período de renovação (tempo_aviso) ou já expirados,
 * indicando se pode solicitar nova renovação ou se já existe um pedido em análise.
 */
controllersRenovacao.listarElegiveis = async (req, res) => {
  try {
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';
    const lpMap = await getLearningPathsMap(lang);

    const candidaturas = await Candidatura.findAll({
      where: {
        id_utilizador: userId,
        id_estado_candidatura: 4, // Apenas candidaturas aprovadas / concluídas
        candidaturaAtiva: true
      },
      include: [
        {
          association: 'badge',
          where: {
            badge_expiravel: true,
            tempo_expiracao: { [Op.gt]: 0 }
          },
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
          required: false,
          include: [
            { association: 'moderador', attributes: ['id_utilizador', 'nome', 'apelido', 'avatar'] }
          ]
        }
      ],
      order: [['data_candidatura', 'DESC']]
    });

    const agora = new Date();
    const resultado = [];

    for (const cand of candidaturas) {
      const badge = cand.badge;
      if (!badge) continue;

      const dataConquista = cand.data_encerramento_candidatura || cand.updatedAt;
      const renovacoes = cand.renovacoes || [];

      // Renovações aprovadas
      const renovacoesAprovadas = renovacoes
        .filter(r => r.renovacao_aprovada === true && r.data_renovacao)
        .sort((a, b) => new Date(b.data_renovacao) - new Date(a.data_renovacao));
      const ultimaRenovacaoAprovada = renovacoesAprovadas[0];

      const dataReferencia = (cand.candidatura_renovada && ultimaRenovacaoAprovada)
        ? ultimaRenovacaoAprovada.data_renovacao
        : dataConquista;

      const dataExpiracao = new Date(dataReferencia);
      dataExpiracao.setDate(dataExpiracao.getDate() + badge.tempo_expiracao);

      const diasRestantes = Math.ceil((dataExpiracao - agora) / (1000 * 60 * 60 * 24));
      const tempoAviso = badge.tempo_aviso || 30;

      // Verificar se há pedido pendente ou última renovação rejeitada
      const renovacoesOrdenadas = [...renovacoes].sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido));
      const ultimaRenovacao = renovacoesOrdenadas[0];

      const temPedidoPendente = renovacoes.some(r => r.renovacao_aprovada === null);
      const ultimoPedidoRejeitado = ultimaRenovacao && ultimaRenovacao.renovacao_aprovada === false;

      // Condição de Elegibilidade / Exibição:
      // 1. Está dentro da janela de aviso (diasRestantes <= tempoAviso) ou já expirou (diasRestantes <= 0)
      // 2. OU tem um pedido de renovação pendente em análise
      const dentroJanelaAviso = diasRestantes <= tempoAviso;

      if (!dentroJanelaAviso && !temPedidoPendente) {
        continue; // Badge ainda válido e longe da expiração
      }

      let status_renovacao = 'elegivel';
      let pode_solicitar = true;
      let mensagem_status = '';
      let id_renovacao_ativa = null;

      if (temPedidoPendente) {
        const ped = renovacoes.find(r => r.renovacao_aprovada === null);
        status_renovacao = 'pendente';
        pode_solicitar = false;
        id_renovacao_ativa = ped?.id_renovacao_badge || null;
        mensagem_status = 'Pedido de renovação em análise pela moderação.';
      } else if (ultimoPedidoRejeitado) {
        status_renovacao = 'rejeitado';
        pode_solicitar = true;
        id_renovacao_ativa = ultimaRenovacao?.id_renovacao_badge || null;
        mensagem_status = 'Último pedido de renovação foi recusado. Pode submeter novo pedido.';
      } else if (diasRestantes <= 0) {
        status_renovacao = 'expirado';
        pode_solicitar = true;
        mensagem_status = 'Badge expirado. Pode solicitar renovação.';
      } else {
        status_renovacao = 'expirando';
        pode_solicitar = true;
        mensagem_status = `Badge expira em ${diasRestantes} dias. Pode solicitar renovação.`;
      }

      resultado.push({
        id_candidatura: cand.id_candidatura,
        id_badge: badge.id_badge,
        badge_nome: badge.traducao_titulo?.[lang] || badge.traducao_titulo?.pt || '',
        badge_descricao: badge.traducao_descricao?.[lang] || badge.traducao_descricao?.pt || '',
        badge_logo: badge.logo,
        badge_pontos: badge.pontos,
        pontos_renovacao: badge.pontos_renovacao || 0,
        tempo_expiracao_dias: badge.tempo_expiracao,
        tempo_aviso_dias: tempoAviso,
        lp_nome: lpMap[badge.nivel_area?.area?.service_line?.id_learning_path] || '',
        sl_nome: badge.nivel_area?.area?.service_line?.traducao_service_line?.[lang] || badge.nivel_area?.area?.service_line?.traducao_service_line?.pt || '',
        area_nome: badge.nivel_area?.area?.traducao_area?.[lang] || badge.nivel_area?.area?.traducao_area?.pt || '',
        nivel_nome: badge.nivel_area?.traducao_nivel_area?.[lang] || badge.nivel_area?.traducao_nivel_area?.pt || '',
        data_conquista: dataConquista,
        data_ultima_renovacao: (cand.candidatura_renovada && ultimaRenovacaoAprovada) ? ultimaRenovacaoAprovada.data_renovacao : null,
        data_expiracao: dataExpiracao,
        dias_restantes: diasRestantes,
        candidatura_renovada: cand.candidatura_renovada,
        status_renovacao,
        pode_solicitar,
        mensagem_status,
        id_renovacao_ativa
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Badges elegíveis para renovação recuperados com sucesso.',
      data: resultado
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /renovacao_badge/gestao/expirando
 * (Exclusivo para Admin e SLL - Gestão de Renovações)
 * Lista todos os badges de TODOS os consultores que estão no período de aviso, expirados ou pendentes de moderação.
 * Se for SLL, filtra automaticamente apenas os consultores/badges da Service Line pela qual é responsável.
 */
controllersRenovacao.listarGestaoExpirando = async (req, res) => {
  try {
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';
    const lpMap = await getLearningPathsMap(lang);

    let whereServiceLine = {};
    if (activeRole === PERFIS.SLL) {
      const slId = await getSllServiceLineId(userId);
      if (!slId) {
        return res.status(200).json({
          success: true,
          message: 'SLL não lidera nenhuma Service Line ativa.',
          data: []
        });
      }
      whereServiceLine = { '$badge.nivel_area.area.id_service_line$': slId };
    } else if (req.query.id_service_line) {
      whereServiceLine = { '$badge.nivel_area.area.id_service_line$': req.query.id_service_line };
    }

    let whereCandidatura = {
      id_estado_candidatura: 4, // Aprovadas
      candidaturaAtiva: true,
      ...whereServiceLine
    };

    if (req.query.id_utilizador && validaUUID(req.query.id_utilizador, 7)) {
      whereCandidatura.id_utilizador = req.query.id_utilizador;
    }
    if (req.query.id_badge && validaUUID(req.query.id_badge, 7)) {
      whereCandidatura.id_badge = req.query.id_badge;
    }

    const candidaturas = await Candidatura.findAll({
      where: whereCandidatura,
      include: [
        {
          association: 'consultor',
          attributes: ['id_utilizador', 'nome', 'apelido', 'avatar', 'email']
        },
        {
          association: 'badge',
          where: {
            badge_expiravel: true,
            tempo_expiracao: { [Op.gt]: 0 }
          },
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
          required: false,
          include: [
            { association: 'moderador', attributes: ['id_utilizador', 'nome', 'apelido', 'avatar'] }
          ]
        }
      ],
      order: [['data_candidatura', 'DESC']]
    });

    const agora = new Date();
    const resultado = [];

    for (const cand of candidaturas) {
      const badge = cand.badge;
      const consultor = cand.consultor;
      if (!badge || !consultor) continue;

      const dataConquista = cand.data_encerramento_candidatura || cand.updatedAt;
      const renovacoes = cand.renovacoes || [];

      // Renovações aprovadas
      const renovacoesAprovadas = renovacoes
        .filter(r => r.renovacao_aprovada === true && r.data_renovacao)
        .sort((a, b) => new Date(b.data_renovacao) - new Date(a.data_renovacao));
      const ultimaRenovacaoAprovada = renovacoesAprovadas[0];

      const dataReferencia = (cand.candidatura_renovada && ultimaRenovacaoAprovada)
        ? ultimaRenovacaoAprovada.data_renovacao
        : dataConquista;

      const dataExpiracao = new Date(dataReferencia);
      dataExpiracao.setDate(dataExpiracao.getDate() + badge.tempo_expiracao);

      const diasRestantes = Math.ceil((dataExpiracao - agora) / (1000 * 60 * 60 * 24));
      const tempoAviso = badge.tempo_aviso || 30;

      const renovacoesOrdenadas = [...renovacoes].sort((a, b) => new Date(b.data_pedido) - new Date(a.data_pedido));
      const ultimaRenovacao = renovacoesOrdenadas[0];

      const temPedidoPendente = renovacoes.some(r => r.renovacao_aprovada === null);
      const ultimoPedidoRejeitado = ultimaRenovacao && ultimaRenovacao.renovacao_aprovada === false;

      const dentroJanelaAviso = diasRestantes <= tempoAviso;

      if (!dentroJanelaAviso && !temPedidoPendente) {
        continue; // Badge longe de expirar
      }

      let status_renovacao = 'elegivel';
      let mensagem_status = '';
      let id_renovacao_ativa = null;

      if (temPedidoPendente) {
        const ped = renovacoes.find(r => r.renovacao_aprovada === null);
        status_renovacao = 'pendente';
        id_renovacao_ativa = ped?.id_renovacao_badge || null;
        mensagem_status = 'Pedido de renovação em análise pela moderação.';
      } else if (ultimoPedidoRejeitado) {
        status_renovacao = 'rejeitado';
        id_renovacao_ativa = ultimaRenovacao?.id_renovacao_badge || null;
        mensagem_status = 'Último pedido de renovação foi recusado.';
      } else if (diasRestantes <= 0) {
        status_renovacao = 'expirado';
        mensagem_status = 'Badge expirado. Aguardando pedido do consultor.';
      } else {
        status_renovacao = 'expirando';
        mensagem_status = `Badge expira em ${diasRestantes} dias.`;
      }

      // Filtro opcional por status na query
      if (req.query.status && req.query.status !== status_renovacao) {
        continue;
      }

      resultado.push({
        id_candidatura: cand.id_candidatura,
        consultor: {
          id_utilizador: consultor.id_utilizador,
          nome: `${consultor.nome} ${consultor.apelido}`,
          avatar: consultor.avatar,
          email: consultor.email
        },
        id_badge: badge.id_badge,
        badge_nome: badge.traducao_titulo?.[lang] || badge.traducao_titulo?.pt || '',
        badge_descricao: badge.traducao_descricao?.[lang] || badge.traducao_descricao?.pt || '',
        badge_logo: badge.logo,
        badge_pontos: badge.pontos,
        pontos_renovacao: badge.pontos_renovacao || 0,
        tempo_expiracao_dias: badge.tempo_expiracao,
        tempo_aviso_dias: tempoAviso,
        id_service_line: badge.nivel_area?.area?.service_line?.id_service_line,
        lp_nome: lpMap[badge.nivel_area?.area?.service_line?.id_learning_path] || '',
        sl_nome: badge.nivel_area?.area?.service_line?.traducao_service_line?.[lang] || badge.nivel_area?.area?.service_line?.traducao_service_line?.pt || '',
        area_nome: badge.nivel_area?.area?.traducao_area?.[lang] || badge.nivel_area?.area?.traducao_area?.pt || '',
        nivel_nome: badge.nivel_area?.traducao_nivel_area?.[lang] || badge.nivel_area?.traducao_nivel_area?.pt || '',
        data_conquista: dataConquista,
        data_ultima_renovacao: (cand.candidatura_renovada && ultimaRenovacaoAprovada) ? ultimaRenovacaoAprovada.data_renovacao : null,
        data_expiracao: dataExpiracao,
        dias_restantes: diasRestantes,
        candidatura_renovada: cand.candidatura_renovada,
        consultor_avisado: cand.consultor_avisado,
        status_renovacao,
        mensagem_status,
        id_renovacao_ativa
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Gestão de badges a expirar listada com sucesso.',
      total: resultado.length,
      data: resultado
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /renovacao_badge/gestao/pedidos
 * (Exclusivo para Admin e SLL)
 * Lista todos os pedidos de renovação de todos os consultores (com filtros de estado: todos, pendente, aprovado, recusado).
 */
controllersRenovacao.listarGestaoPedidos = async (req, res) => {
  try {
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';
    const { estado, id_utilizador, id_badge, id_service_line } = req.query;

    let whereServiceLine = {};
    if (activeRole === PERFIS.SLL) {
      const slId = await getSllServiceLineId(userId);
      if (!slId) {
        return res.status(200).json({ success: true, data: [] });
      }
      whereServiceLine = { '$candidatura.badge.nivel_area.area.id_service_line$': slId };
    } else if (id_service_line) {
      whereServiceLine = { '$candidatura.badge.nivel_area.area.id_service_line$': id_service_line };
    }

    let whereRenovacao = {
      renovacaoAtiva: true,
      ...whereServiceLine
    };

    if (estado === 'pendente') {
      whereRenovacao.renovacao_aprovada = null;
    } else if (estado === 'aprovado') {
      whereRenovacao.renovacao_aprovada = true;
    } else if (estado === 'recusado') {
      whereRenovacao.renovacao_aprovada = false;
    }

    if (id_utilizador && validaUUID(id_utilizador, 7)) {
      whereRenovacao['$candidatura.id_utilizador$'] = id_utilizador;
    }
    if (id_badge && validaUUID(id_badge, 7)) {
      whereRenovacao['$candidatura.id_badge$'] = id_badge;
    }

    const lpMap = await getLearningPathsMap(lang);

    const renovacoes = await RenovacaoBadge.findAll({
      where: whereRenovacao,
      include: [
        {
          association: 'candidatura',
          include: [
            {
              association: 'badge',
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
              association: 'consultor',
              attributes: ['id_utilizador', 'nome', 'apelido', 'avatar', 'email']
            }
          ]
        },
        {
          association: 'moderador',
          attributes: ['id_utilizador', 'nome', 'apelido', 'avatar']
        },
        {
          association: 'evidencias',
          where: { evidenciaAtiva: true },
          required: false,
          include: [
            {
              association: 'requisito',
              include: [
                { association: 'traducao_titulo' },
                { association: 'traducao_descricao' }
              ]
            }
          ]
        }
      ],
      order: [['data_pedido', 'DESC']]
    });

    const dataFormatada = renovacoes.map(ren => {
      const cand = ren.candidatura;
      const badge = cand?.badge;
      const consultor = cand?.consultor;

      let status_texto = 'Pendente';
      if (ren.renovacao_aprovada === true) status_texto = 'Aprovado';
      else if (ren.renovacao_aprovada === false) status_texto = 'Recusado';

      return {
        id_renovacao_badge: ren.id_renovacao_badge,
        id_candidatura: ren.id_candidatura,
        data_pedido: ren.data_pedido,
        data_renovacao: ren.data_renovacao,
        renovacao_aprovada: ren.renovacao_aprovada,
        status_texto,
        pontos_renovacao: ren.pontos_renovacao || badge?.pontos_renovacao || 0,
        consultor: consultor ? {
          id_utilizador: consultor.id_utilizador,
          nome: `${consultor.nome} ${consultor.apelido}`,
          avatar: consultor.avatar,
          email: consultor.email
        } : null,
        moderador: ren.moderador ? {
          id_utilizador: ren.moderador.id_utilizador,
          nome: `${ren.moderador.nome} ${ren.moderador.apelido}`,
          avatar: ren.moderador.avatar
        } : null,
        badge: badge ? {
          id_badge: badge.id_badge,
          nome: badge.traducao_titulo?.[lang] || badge.traducao_titulo?.pt || '',
          descricao: badge.traducao_descricao?.[lang] || badge.traducao_descricao?.pt || '',
          logo: badge.logo,
          pontos: badge.pontos,
          pontos_renovacao: badge.pontos_renovacao,
          tempo_expiracao: badge.tempo_expiracao,
          lp_nome: lpMap[badge?.nivel_area?.area?.service_line?.id_learning_path] || '',
          sl_nome: badge.nivel_area?.area?.service_line?.traducao_service_line?.[lang] || badge.nivel_area?.area?.service_line?.traducao_service_line?.pt || '',
          area_nome: badge.nivel_area?.area?.traducao_area?.[lang] || badge.nivel_area?.area?.traducao_area?.pt || '',
          nivel_nome: badge.nivel_area?.traducao_nivel_area?.[lang] || badge.nivel_area?.traducao_nivel_area?.pt || ''
        } : null,
        evidencias: (ren.evidencias || []).map(ev => ({
          id_evidencia_renovacao: ev.id_evidencia_renovacao,
          id_requisito: ev.id_requisito,
          requisito_nome: ev.requisito?.traducao_titulo?.[lang] || ev.requisito?.traducao_titulo?.pt || '',
          nome_ficheiro: ev.nome_ficheiro,
          url_ficheiro: ev.url_ficheiro,
          data_upload_evidencia: ev.data_upload_evidencia,
          validado_moderador: ev.validado_moderador
        }))
      };
    });

    return res.status(200).json({
      success: true,
      data: dataFormatada
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /renovacao_badge/pendentes
 * Lista todas as renovações pendentes de aprovação (para Admin e SLL).
 */
controllersRenovacao.listarPendentes = async (req, res) => {
  try {
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';

    let whereServiceLine = {};
    if (activeRole === PERFIS.SLL) {
      const slId = await getSllServiceLineId(userId);
      if (slId) {
        whereServiceLine = { '$candidatura.badge.nivel_area.area.id_service_line$': slId };
      }
    }

    const lpMap = await getLearningPathsMap(lang);

    const renovacoes = await RenovacaoBadge.findAll({
      where: {
        renovacao_aprovada: null,
        renovacaoAtiva: true,
        ...whereServiceLine
      },
      include: [
        {
          association: 'candidatura',
          include: [
            {
              association: 'badge',
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
              association: 'consultor',
              attributes: ['id_utilizador', 'nome', 'apelido', 'avatar', 'email']
            }
          ]
        },
        {
          association: 'evidencias',
          where: { evidenciaAtiva: true },
          required: false,
          include: [
            {
              association: 'requisito',
              include: [
                { association: 'traducao_titulo' },
                { association: 'traducao_descricao' }
              ]
            }
          ]
        }
      ],
      order: [['data_pedido', 'ASC']]
    });

    const dataFormatada = renovacoes.map(ren => {
      const cand = ren.candidatura;
      const badge = cand?.badge;
      const consultor = cand?.consultor;

      return {
        id_renovacao_badge: ren.id_renovacao_badge,
        id_candidatura: ren.id_candidatura,
        data_pedido: ren.data_pedido,
        data_renovacao: ren.data_renovacao,
        renovacao_aprovada: ren.renovacao_aprovada,
        status_texto: 'Pendente',
        pontos_renovacao: badge?.pontos_renovacao || 0,
        consultor: consultor ? {
          id_utilizador: consultor.id_utilizador,
          nome: `${consultor.nome} ${consultor.apelido}`,
          avatar: consultor.avatar,
          email: consultor.email
        } : null,
        badge: badge ? {
          id_badge: badge.id_badge,
          nome: badge.traducao_titulo?.[lang] || badge.traducao_titulo?.pt || '',
          descricao: badge.traducao_descricao?.[lang] || badge.traducao_descricao?.pt || '',
          logo: badge.logo,
          pontos: badge.pontos,
          pontos_renovacao: badge.pontos_renovacao,
          tempo_expiracao: badge.tempo_expiracao,
          lp_nome: lpMap[badge?.nivel_area?.area?.service_line?.id_learning_path] || '',
          sl_nome: badge.nivel_area?.area?.service_line?.traducao_service_line?.[lang] || badge.nivel_area?.area?.service_line?.traducao_service_line?.pt || '',
          area_nome: badge.nivel_area?.area?.traducao_area?.[lang] || badge.nivel_area?.area?.traducao_area?.pt || '',
          nivel_nome: badge.nivel_area?.traducao_nivel_area?.[lang] || badge.nivel_area?.traducao_nivel_area?.pt || ''
        } : null,
        evidencias: (ren.evidencias || []).map(ev => ({
          id_evidencia_renovacao: ev.id_evidencia_renovacao,
          id_requisito: ev.id_requisito,
          requisito_nome: ev.requisito?.traducao_titulo?.[lang] || ev.requisito?.traducao_titulo?.pt || '',
          nome_ficheiro: ev.nome_ficheiro,
          url_ficheiro: ev.url_ficheiro,
          data_upload_evidencia: ev.data_upload_evidencia,
          validado_moderador: ev.validado_moderador
        }))
      };
    });

    return res.status(200).json({
      success: true,
      data: dataFormatada
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /renovacao_badge/minhas
 * Lista todas as renovações do consultor autenticado (ou consultor alvo se solicitado por Admin/SLL).
 */
controllersRenovacao.listarMinhas = async (req, res) => {
  try {
    const authUserId = req.auth?.sub || req.auth?.id_utilizador;
    const activeRole = req.activeRole;
    const requestedUserId = req.query.id_consultor || req.query.id_utilizador;

    let targetUserId = authUserId;
    if (requestedUserId && validaUUID(requestedUserId, 7)) {
      if ([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM].includes(activeRole)) {
        targetUserId = requestedUserId;
      }
    }

    const lang = req.lang || 'pt';
    const lpMap = await getLearningPathsMap(lang);

    const renovacoes = await RenovacaoBadge.findAll({
      where: {
        renovacaoAtiva: true,
        '$candidatura.id_utilizador$': targetUserId
      },
      include: [
        {
          association: 'candidatura',
          include: [
            {
              association: 'badge',
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
        },
        {
          association: 'moderador',
          attributes: ['id_utilizador', 'nome', 'apelido', 'avatar']
        },
        {
          association: 'evidencias',
          where: { evidenciaAtiva: true },
          required: false,
          include: [
            {
              association: 'requisito',
              include: [
                { association: 'traducao_titulo' },
                { association: 'traducao_descricao' }
              ]
            }
          ]
        }
      ],
      order: [['data_pedido', 'DESC']]
    });

    const dataFormatada = renovacoes.map(ren => {
      const cand = ren.candidatura;
      const badge = cand?.badge;

      let status_texto = 'Pendente';
      if (ren.renovacao_aprovada === true) status_texto = 'Aprovado';
      else if (ren.renovacao_aprovada === false) status_texto = 'Recusado';

      return {
        id_renovacao_badge: ren.id_renovacao_badge,
        id_candidatura: ren.id_candidatura,
        data_pedido: ren.data_pedido,
        data_renovacao: ren.data_renovacao,
        renovacao_aprovada: ren.renovacao_aprovada,
        status_texto,
        pontos_renovacao: ren.pontos_renovacao,
        moderador: ren.moderador ? {
          id_utilizador: ren.moderador.id_utilizador,
          nome: `${ren.moderador.nome} ${ren.moderador.apelido}`,
          avatar: ren.moderador.avatar
        } : null,
        badge: badge ? {
          id_badge: badge.id_badge,
          nome: badge.traducao_titulo?.[lang] || badge.traducao_titulo?.pt || '',
          descricao: badge.traducao_descricao?.[lang] || badge.traducao_descricao?.pt || '',
          logo: badge.logo,
          pontos: badge.pontos,
          pontos_renovacao: badge.pontos_renovacao,
          tempo_expiracao: badge.tempo_expiracao,
          lp_nome: lpMap[badge?.nivel_area?.area?.service_line?.id_learning_path] || '',
          sl_nome: badge.nivel_area?.area?.service_line?.traducao_service_line?.[lang] || badge.nivel_area?.area?.service_line?.traducao_service_line?.pt || '',
          area_nome: badge.nivel_area?.area?.traducao_area?.[lang] || badge.nivel_area?.area?.traducao_area?.pt || '',
          nivel_nome: badge.nivel_area?.traducao_nivel_area?.[lang] || badge.nivel_area?.traducao_nivel_area?.pt || ''
        } : null,
        evidencias: (ren.evidencias || []).map(ev => ({
          id_evidencia_renovacao: ev.id_evidencia_renovacao,
          id_requisito: ev.id_requisito,
          requisito_nome: ev.requisito?.traducao_titulo?.[lang] || ev.requisito?.traducao_titulo?.pt || '',
          nome_ficheiro: ev.nome_ficheiro,
          url_ficheiro: ev.url_ficheiro,
          data_upload_evidencia: ev.data_upload_evidencia,
          validado_moderador: ev.validado_moderador
        }))
      };
    });

    return res.status(200).json({
      success: true,
      data: dataFormatada
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /renovacao_badge/:id
 * Retorna os detalhes de um pedido de renovação específico.
 */
controllersRenovacao.obterDetalhe = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.lang || 'pt';

    const lpMap = await getLearningPathsMap(lang);

    const renovacao = await RenovacaoBadge.findOne({
      where: {
        id_renovacao_badge: id,
        renovacaoAtiva: true
      },
      include: [
        {
          association: 'candidatura',
          include: [
            {
              association: 'badge',
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
              association: 'consultor',
              attributes: ['id_utilizador', 'nome', 'apelido', 'avatar', 'email']
            }
          ]
        },
        {
          association: 'moderador',
          attributes: ['id_utilizador', 'nome', 'apelido', 'avatar']
        },
        {
          association: 'evidencias',
          where: { evidenciaAtiva: true },
          required: false,
          include: [
            {
              association: 'requisito',
              include: [
                { association: 'traducao_titulo' },
                { association: 'traducao_descricao' }
              ]
            }
          ]
        }
      ]
    });

    if (!renovacao) {
      return res.status(404).json({ success: false, message: 'Pedido de renovação não encontrado.' });
    }

    const cand = renovacao.candidatura;
    const badge = cand?.badge;
    const consultor = cand?.consultor;

    let status_texto = 'Pendente';
    if (renovacao.renovacao_aprovada === true) status_texto = 'Aprovado';
    else if (renovacao.renovacao_aprovada === false) status_texto = 'Recusado';

    const dataFormatada = {
      id_renovacao_badge: renovacao.id_renovacao_badge,
      id_candidatura: renovacao.id_candidatura,
      data_pedido: renovacao.data_pedido,
      data_renovacao: renovacao.data_renovacao,
      renovacao_aprovada: renovacao.renovacao_aprovada,
      status_texto,
      pontos_renovacao: renovacao.pontos_renovacao,
      consultor: consultor ? {
        id_utilizador: consultor.id_utilizador,
        nome: `${consultor.nome} ${consultor.apelido}`,
        avatar: consultor.avatar,
        email: consultor.email
      } : null,
      moderador: renovacao.moderador ? {
        id_utilizador: renovacao.moderador.id_utilizador,
        nome: `${renovacao.moderador.nome} ${renovacao.moderador.apelido}`,
        avatar: renovacao.moderador.avatar
      } : null,
      badge: badge ? {
        id_badge: badge.id_badge,
        nome: badge.traducao_titulo?.[lang] || badge.traducao_titulo?.pt || '',
        descricao: badge.traducao_descricao?.[lang] || badge.traducao_descricao?.pt || '',
        logo: badge.logo,
        pontos: badge.pontos,
        pontos_renovacao: badge.pontos_renovacao,
        tempo_expiracao: badge.tempo_expiracao,
        lp_nome: lpMap[badge?.nivel_area?.area?.service_line?.id_learning_path] || '',
        sl_nome: badge.nivel_area?.area?.service_line?.traducao_service_line?.[lang] || badge.nivel_area?.area?.service_line?.traducao_service_line?.pt || '',
        area_nome: badge.nivel_area?.area?.traducao_area?.[lang] || badge.nivel_area?.area?.traducao_area?.pt || '',
        nivel_nome: badge.nivel_area?.traducao_nivel_area?.[lang] || badge.nivel_area?.traducao_nivel_area?.pt || ''
      } : null,
      evidencias: (renovacao.evidencias || []).map(ev => ({
        id_evidencia_renovacao: ev.id_evidencia_renovacao,
        id_requisito: ev.id_requisito,
        requisito_nome: ev.requisito?.traducao_titulo?.[lang] || ev.requisito?.traducao_titulo?.pt || '',
        nome_ficheiro: ev.nome_ficheiro,
        url_ficheiro: ev.url_ficheiro,
        data_upload_evidencia: ev.data_upload_evidencia,
        validado_moderador: ev.validado_moderador
      }))
    };

    return res.status(200).json({
      success: true,
      data: dataFormatada
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /renovacao_badge/:id/aprovar
 * Aprova o pedido de renovação (Admin ou SLL), preenchendo automaticamente os pontos do badge e a data.
 */
controllersRenovacao.aprovarRenovacao = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    const renovacao = await RenovacaoBadge.findOne({
      where: {
        id_renovacao_badge: id,
        renovacaoAtiva: true
      },
      include: [
        {
          association: 'candidatura',
          include: [{ association: 'badge' }]
        }
      ]
    });

    if (!renovacao) {
      return res.status(404).json({ success: false, message: 'Pedido de renovação não encontrado.' });
    }

    if (renovacao.renovacao_aprovada !== null) {
      return res.status(400).json({ success: false, message: 'Este pedido de renovação já foi decidido.' });
    }

    const badge = renovacao.candidatura?.badge;
    const pontosBadge = badge?.pontos_renovacao || 0;
    const tempoExp = badge?.tempo_expiracao || 365;

    // 1. Atualizar o registo de renovação com moderador, data, estado de aprovação e pontos conquistados
    await renovacao.update({
      renovacao_aprovada: true,
      data_renovacao: new Date(),
      id_moderador: userId,
      pontos_renovacao: pontosBadge
    });

    // 1.1. Atualizar a candidatura: marcar como renovada e resetar o aviso do consultor para o novo ciclo
    await Candidatura.update({
      candidatura_renovada: true,
      consultor_avisado: false
    }, {
      where: { id_candidatura: renovacao.id_candidatura }
    });

    // 2. Atualizar a data de expiração no registo de BadgeAtribuído se existir
    const atribuicao = await BadgeAtribuido.findOne({
      where: {
        id_candidatura: renovacao.id_candidatura,
        atribuicaoAtiva: true
      }
    });

    if (atribuicao) {
      const novaDataExpiracao = new Date(Date.now() + (tempoExp * 24 * 60 * 60 * 1000));
      await atribuicao.update({
        data_expiracao: novaDataExpiracao
      });
    }

    // 3. Registar a ação na candidatura
    try {
      await AcaoCandidatura.create({
        id_candidatura: renovacao.id_candidatura,
        id_utilizador: userId,
        tipo_acao_candidatura: 6, // Aprovada
        id_traducao_comentario_acao: null,
        data_acao_candidatura: new Date(),
        acaoAtiva: true
      });
    } catch (errAcao) {
      console.warn('Aviso ao registar ação de renovação:', errAcao.message);
    }

    const consultorId = renovacao.candidatura?.id_utilizador;

    // 4. Disparar notificações WebSockets em tempo real para recalcular pontos no frontend
    try {
      emitGlobal('renovacao_aprovada', {
        id_renovacao_badge: renovacao.id_renovacao_badge,
        id_candidatura: renovacao.id_candidatura,
        id_utilizador: consultorId,
        pontos_renovacao: pontosBadge
      });
      emitGlobal('pontos_atualizados', {
        id_utilizador: consultorId,
        motivo: 'renovacao_badge',
        pontos_adicionados: pontosBadge
      });
      if (consultorId) {
        emitToRoom(`user_${consultorId}`, 'badge_renovado', {
          id_renovacao_badge: renovacao.id_renovacao_badge,
          id_badge: badge?.id_badge,
          pontos_adicionados: pontosBadge
        });
      }
    } catch (wsErr) {
      console.error('Erro ao emitir websocket de aprovacao de renovacao:', wsErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Renovação de badge aprovada com sucesso.',
      data: {
        id_renovacao_badge: renovacao.id_renovacao_badge,
        renovacao_aprovada: true,
        pontos_renovacao: pontosBadge,
        data_renovacao: renovacao.data_renovacao,
        id_moderador: userId
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /renovacao_badge/:id/rejeitar
 * Rejeita o pedido de renovação (Admin ou SLL).
 */
controllersRenovacao.rejeitarRenovacao = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const { comentario } = req.body;

    const renovacao = await RenovacaoBadge.findOne({
      where: {
        id_renovacao_badge: id,
        renovacaoAtiva: true
      },
      include: [
        {
          association: 'candidatura',
          include: [{ association: 'badge' }]
        }
      ]
    });

    if (!renovacao) {
      return res.status(404).json({ success: false, message: 'Pedido de renovação não encontrado.' });
    }

    if (renovacao.renovacao_aprovada !== null) {
      return res.status(400).json({ success: false, message: 'Este pedido de renovação já foi decidido.' });
    }

    // 1. Atualizar o registo de renovação com moderador, data e estado de recusa (pontos = 0)
    await renovacao.update({
      renovacao_aprovada: false,
      data_renovacao: new Date(),
      id_moderador: userId,
      pontos_renovacao: 0
    });

    // 2. Registar a ação na candidatura
    try {
      let idTraducaoComentario = null;
      if (comentario && typeof comentario === 'string' && comentario.trim().length > 0) {
        const trad = await TraducaoConteudo.create({
          pt: comentario.trim(),
          en: comentario.trim(),
          es: comentario.trim()
        });
        idTraducaoComentario = trad.id_traducao;
      }

      await AcaoCandidatura.create({
        id_candidatura: renovacao.id_candidatura,
        id_utilizador: userId,
        tipo_acao_candidatura: 5, // Rejeitada SLL
        id_traducao_comentario_acao: idTraducaoComentario,
        data_acao_candidatura: new Date(),
        acaoAtiva: true
      });
    } catch (errAcao) {
      console.warn('Aviso ao registar ação de rejeição de renovação:', errAcao.message);
    }

    const consultorId = renovacao.candidatura?.id_utilizador;

    // 3. Disparar notificações WebSockets em tempo real
    try {
      emitGlobal('renovacao_rejeitada', {
        id_renovacao_badge: renovacao.id_renovacao_badge,
        id_candidatura: renovacao.id_candidatura,
        id_utilizador: consultorId
      });
      if (consultorId) {
        emitToRoom(`user_${consultorId}`, 'badge_renovacao_rejeitada', {
          id_renovacao_badge: renovacao.id_renovacao_badge,
          id_badge: renovacao.candidatura?.badge?.id_badge
        });
      }
    } catch (wsErr) {
      console.error('Erro ao emitir websocket de rejeicao de renovacao:', wsErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Pedido de renovação recusado com sucesso.',
      data: {
        id_renovacao_badge: renovacao.id_renovacao_badge,
        renovacao_aprovada: false,
        data_renovacao: renovacao.data_renovacao,
        id_moderador: userId
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /renovacao_badge/:id/evidencia
 * Faz upload de uma evidência para o pedido de renovação.
 */
controllersRenovacao.uploadEvidencia = async (req, res) => {
  try {
    const { id } = req.params; // id_renovacao_badge
    const { id_candidatura, id_requisito } = req.body;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const activeRole = req.activeRole;

    if (!validaUUID(id, 7)) {
      return res.status(400).json({ success: false, message: 'O ID do pedido de renovação (id_renovacao_badge) é inválido.' });
    }

    if (!id_candidatura || !validaUUID(id_candidatura, 7)) {
      return res.status(400).json({ success: false, message: 'O campo id_candidatura (UUID) é obrigatório no corpo do pedido.' });
    }

    if (!id_requisito || isNaN(Number(id_requisito))) {
      return res.status(400).json({ success: false, message: 'O campo id_requisito (numérico) é obrigatório.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Nenhum ficheiro anexado. Envie o ficheiro sob o campo "evidencia".' });
    }

    // 1. Procurar o registo de renovação pelo id_renovacao_badge
    const renovacao = await RenovacaoBadge.findOne({
      where: {
        id_renovacao_badge: id,
        id_candidatura: id_candidatura,
        renovacaoAtiva: true
      },
      include: [{ association: 'candidatura' }]
    });

    if (!renovacao) {
      return res.status(404).json({ success: false, message: 'Pedido de renovação não encontrado para a candidatura especificada.' });
    }

    // Validação de permissão: apenas o consultor dono da candidatura ou moderadores (Admin/SLL)
    const isOwner = renovacao.candidatura?.id_utilizador === userId;
    const isModerator = [PERFIS.ADMIN, PERFIS.SLL].includes(activeRole);
    if (!isOwner && !isModerator) {
      return res.status(403).json({ success: false, message: 'Não tem permissão para enviar evidências nesta renovação.' });
    }

    const idCandidatura = renovacao.id_candidatura;
    const folderDest = path.join(__dirname, '..', 'uploads', 'evidences', idCandidatura);
    if (!fs.existsSync(folderDest)) {
      fs.mkdirSync(folderDest, { recursive: true });
    }

    // Garantir que o ficheiro está fisicamente na pasta da candidatura
    const finalFilePath = path.join(folderDest, req.file.filename);
    if (req.file.path && req.file.path !== finalFilePath && fs.existsSync(req.file.path)) {
      fs.renameSync(req.file.path, finalFilePath);
    }

    const urlFicheiro = `/uploads/evidences/${idCandidatura}/${req.file.filename}`;

    // Desativar evidência anterior deste requisito nesta renovação, se houver
    await EvidenciaRenovacao.update({
      evidenciaAtiva: false
    }, {
      where: {
        id_renovacao_badge: renovacao.id_renovacao_badge,
        id_requisito: Number(id_requisito),
        evidenciaAtiva: true
      }
    });

    const novaEvidencia = await EvidenciaRenovacao.create({
      id_renovacao_badge: renovacao.id_renovacao_badge,
      id_requisito: Number(id_requisito),
      nome_ficheiro: req.file.originalname || req.file.filename,
      url_ficheiro: urlFicheiro,
      data_upload_evidencia: new Date(),
      validado_moderador: null,
      id_moderador_validador: null,
      evidenciaAtiva: true
    });

    try {
      emitGlobal('evidencia_renovacao_enviada', {
        id_evidencia_renovacao: novaEvidencia.id_evidencia_renovacao,
        id_renovacao_badge: renovacao.id_renovacao_badge,
        id_candidatura: idCandidatura
      });
    } catch (wsErr) {
      console.error('Erro ao emitir websocket de evidencia renovacao:', wsErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Evidência de renovação enviada com sucesso.',
      data: novaEvidencia
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /renovacao_badge/evidencia/:idEvidencia/validacao
 * Validação de evidência de renovação pelo moderador (Admin ou SLL).
 */
controllersRenovacao.validarEvidencia = async (req, res) => {
  try {
    const { idEvidencia } = req.params;
    const { validado_moderador } = req.body;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    if (typeof validado_moderador !== 'boolean') {
      return res.status(400).json({ success: false, message: 'O campo validado_moderador (boolean) é obrigatório.' });
    }

    const evidencia = await EvidenciaRenovacao.findByPk(idEvidencia);
    if (!evidencia || !evidencia.evidenciaAtiva) {
      return res.status(404).json({ success: false, message: 'Evidência de renovação não encontrada.' });
    }

    await evidencia.update({
      validado_moderador,
      id_moderador_validador: userId
    });

    return res.status(200).json({
      success: true,
      message: 'Evidência validada com sucesso.',
      data: evidencia
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /renovacao_badge/evidencia/:idEvidencia/view
 * Visualização inline do ficheiro PDF de evidência de renovação.
 */
controllersRenovacao.viewEvidencia = async (req, res) => {
  try {
    const { idEvidencia } = req.params;

    if (!validaUUID(idEvidencia, 7)) {
      return res.status(400).json({ success: false, message: 'ID de evidência inválido.' });
    }

    const evidencia = await EvidenciaRenovacao.findByPk(idEvidencia, {
      include: [
        {
          association: 'renovacao',
          include: [{ association: 'candidatura' }]
        }
      ]
    });

    if (!evidencia) {
      return res.status(404).json({ success: false, message: 'Evidência não encontrada.' });
    }

    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    if (![1, 2, 3].includes(activeRole) && evidencia.renovacao?.candidatura?.id_utilizador !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado: Sem permissão para visualizar esta evidência.' });
    }

    const relativePath = evidencia.url_ficheiro.replace(/^\/uploads\//, '');
    let filePhysicalPath = path.join(__dirname, '..', 'uploads', relativePath);

    if (!fs.existsSync(filePhysicalPath)) {
      // Fallback 1: Verificar na pasta da candidatura pelo nome do ficheiro
      const idCand = evidencia.renovacao?.id_candidatura;
      if (idCand) {
        const altPath = path.join(__dirname, '..', 'uploads', 'evidences', idCand, path.basename(evidencia.url_ficheiro));
        if (fs.existsSync(altPath)) filePhysicalPath = altPath;
      }
    }
    if (!fs.existsSync(filePhysicalPath)) {
      // Fallback 2: Verificar na pasta de seeds
      const seedPath = path.join(__dirname, '..', 'seeds', 'evidences', evidencia.url_ficheiro.replace(/^\/uploads\/evidences\//, ''));
      if (fs.existsSync(seedPath)) filePhysicalPath = seedPath;
    }

    if (!fs.existsSync(filePhysicalPath)) {
      return res.status(404).json({ success: false, message: 'Ficheiro físico da evidência não foi encontrado no servidor.' });
    }

    const ext = path.extname(filePhysicalPath).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : (ext === '.zip' ? 'application/zip' : 'application/octet-stream');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${evidencia.nome_ficheiro || 'evidencia_renovacao.pdf'}"`);
    return fs.createReadStream(filePhysicalPath).pipe(res);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao visualizar evidência de renovação.', error: error.message });
  }
};

/**
 * GET /renovacao_badge/evidencia/:idEvidencia/download
 * Download do ficheiro de evidência de renovação.
 */
controllersRenovacao.downloadEvidencia = async (req, res) => {
  try {
    const { idEvidencia } = req.params;

    if (!validaUUID(idEvidencia, 7)) {
      return res.status(400).json({ success: false, message: 'ID de evidência inválido.' });
    }

    const evidencia = await EvidenciaRenovacao.findByPk(idEvidencia, {
      include: [
        {
          association: 'renovacao',
          include: [{ association: 'candidatura' }]
        }
      ]
    });

    if (!evidencia) {
      return res.status(404).json({ success: false, message: 'Evidência não encontrada.' });
    }

    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;

    if (![1, 2, 3].includes(activeRole) && evidencia.renovacao?.candidatura?.id_utilizador !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado: Sem permissão para descarregar esta evidência.' });
    }

    const relativePath = evidencia.url_ficheiro.replace(/^\/uploads\//, '');
    let filePhysicalPath = path.join(__dirname, '..', 'uploads', relativePath);

    if (!fs.existsSync(filePhysicalPath)) {
      const idCand = evidencia.renovacao?.id_candidatura;
      if (idCand) {
        const altPath = path.join(__dirname, '..', 'uploads', 'evidences', idCand, path.basename(evidencia.url_ficheiro));
        if (fs.existsSync(altPath)) filePhysicalPath = altPath;
      }
    }
    if (!fs.existsSync(filePhysicalPath)) {
      const seedPath = path.join(__dirname, '..', 'seeds', 'evidences', evidencia.url_ficheiro.replace(/^\/uploads\/evidences\//, ''));
      if (fs.existsSync(seedPath)) filePhysicalPath = seedPath;
    }

    if (!fs.existsSync(filePhysicalPath)) {
      return res.status(404).json({ success: false, message: 'Ficheiro físico da evidência não foi encontrado no servidor.' });
    }

    return res.download(filePhysicalPath, evidencia.nome_ficheiro || 'evidencia_renovacao.pdf');
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao descarregar evidência de renovação.', error: error.message });
  }
};

module.exports = controllersRenovacao;
