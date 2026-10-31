const Notificacao = require('../models/notificacao.model');
const TipoNotificacao = require('../models/tipo_notificacao.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const Utilizador = require('../models/utilizador.model');

const controllerNotificacao = {};

/**
 * GET /notificacao
 * Retorna as notificações do utilizador autenticado com suporte a i18n (?lang=pt|en|es).
 */
controllerNotificacao.listMinhasNotificacoes = async (req, res) => {
  try {
    const id_utilizador = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';

    if (!id_utilizador) {
      return res.status(401).json({ success: false, message: "Utilizador não autenticado." });
    }

    const notificacoes = await Notificacao.findAll({
      where: { id_user_alvo_notificacao: id_utilizador },
      include: [
        {
          association: 'notificador',
          attributes: ['id_utilizador', 'nome', 'apelido', 'avatar']
        },
        {
          association: 'tipo',
          attributes: ['id_tipo_notificacao', 'codigo_tipo'],
          include: [{ association: 'traducao_descricao', attributes: [lang] }]
        },
        {
          association: 'traducao_titulo',
          attributes: [lang]
        },
        {
          association: 'traducao_mensagem',
          attributes: [lang]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const dataFormatada = notificacoes.map(n => ({
      id_notificacao: n.id_notificacao,
      id_user_notificador: n.id_user_notificador,
      notificador: n.notificador ? {
        nome: n.notificador.nome,
        apelido: n.notificador.apelido,
        avatar: n.notificador.avatar
      } : null,
      tipo: n.tipo?.codigo_tipo || null,
      descricao_tipo: n.tipo?.traducao_descricao ? n.tipo.traducao_descricao[lang] : null,
      titulo: n.traducao_titulo ? n.traducao_titulo[lang] : null,
      mensagem: n.traducao_mensagem ? n.traducao_mensagem[lang] : null,
      lida: n.lida,
      data_leitura: n.data_leitura,
      parametros: n.parametros,
      data_criacao: n.createdAt
    }));

    const totalNaoLidas = notificacoes.filter(n => !n.lida).length;

    res.status(200).json({
      success: true,
      message: "Notificações recuperadas com sucesso.",
      total_nao_lidas: totalNaoLidas,
      data: dataFormatada
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao listar notificações.",
      error: error.message
    });
  }
};

/**
 * PUT /notificacao/:id/lida ou PATCH /notificacao/:id/lida
 * Marca uma notificação individual como lida.
 */
controllerNotificacao.marcarComoLida = async (req, res) => {
  try {
    const id_notificacao = req.params.id;
    const id_utilizador = req.auth?.sub || req.auth?.id_utilizador;

    const notificacao = await Notificacao.findOne({
      where: {
        id_notificacao,
        id_user_alvo_notificacao: id_utilizador
      }
    });

    if (!notificacao) {
      return res.status(404).json({ success: false, message: "Notificação não encontrada." });
    }

    if (!notificacao.lida) {
      await notificacao.update({
        lida: true,
        data_leitura: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: "Notificação marcada como lida."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar notificação.",
      error: error.message
    });
  }
};

/**
 * PUT /notificacao/lidas-todas
 * Marca TODAS as notificações não lidas do utilizador como lidas.
 */
controllerNotificacao.marcarTodasComoLidas = async (req, res) => {
  try {
    const id_utilizador = req.auth?.sub || req.auth?.id_utilizador;

    await Notificacao.update(
      {
        lida: true,
        data_leitura: new Date()
      },
      {
        where: {
          id_user_alvo_notificacao: id_utilizador,
          lida: false
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Todas as notificações foram marcadas como lidas."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao marcar todas as notificações como lidas.",
      error: error.message
    });
  }
};

/**
 * GET /notificacao/nao-lidas-count
 * Retorna a contagem exata de notificações não lidas do utilizador autenticado.
 */
controllerNotificacao.countNaoLidas = async (req, res) => {
  try {
    const id_utilizador = req.auth?.sub || req.auth?.id_utilizador;

    const totalNaoLidas = await Notificacao.count({
      where: {
        id_user_alvo_notificacao: id_utilizador,
        lida: false
      }
    });

    res.status(200).json({
      success: true,
      total_nao_lidas: totalNaoLidas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao contar notificações não lidas.",
      error: error.message
    });
  }
};

module.exports = controllerNotificacao;
