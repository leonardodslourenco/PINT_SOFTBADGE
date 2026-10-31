const CandidaturaEspecial = require('../models/candidatura_especial.model');
const ConquistaEspecial = require('../models/conquista_especial.model');
const ConquistaAtribuida = require('../models/conquista_atribuida.model');
const EstadoCandidaturaEspecial = require('../models/estado_candidatura_especial.model');
const ConfiguracaoBadgeEspecial = require('../models/configuracao_badge_especial.model');
const TipoBadgeEspecial = require('../models/tipo_badge_especial.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const Notificacao = require('../models/notificacao.model');
const Utilizador = require('../models/utilizador.model');
const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');
const { gerarUUIDv7 } = require('../services/geradores');
const { emitGlobal } = require('../services/websocket.service');
const { criarENotificar } = require('../services/notificacao.service');
const { verificarObjetivosConsultor } = require('../services/objetivo.service');
const validaUUID = require('../services/valida_UUID');

const controllersCandidaturaEspecial = {};

/**
 * POST /candidatura_especial
 * O Consultor submete a candidatura a um Badge Especial.
 * Valida anti-duplicação (não permite se já tiver pendente ou já conquistado).
 */
controllersCandidaturaEspecial.createCandidatura = async (req, res) => {
  try {
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const { id_conquista_especial, url_comprovativo } = req.body;

    if (!id_conquista_especial) {
      return res.status(400).json({ success: false, message: 'O campo "id_conquista_especial" é obrigatório.' });
    }

    // Validação de Consentimento RGPD Geral
    const consultorObj = await Utilizador.findByPk(userId);
    if (!consultorObj || !consultorObj.aceitou_rgpd) {
      return res.status(403).json({
        success: false,
        code: 'RGPD_NOT_ACCEPTED',
        message: 'É obrigatório aceitar os Termos Gerais de RGPD antes de submeter candidaturas a Badges Especiais.'
      });
    }

    // 1. Verificar se o Badge Especial existe e está ativo
    const badgeEspecial = await ConquistaEspecial.findOne({
      where: { id_conquista_especial, conquistaEspecialAtiva: true },
      include: [
        { association: 'traducao_titulo' },
        {
          association: 'configuracoes',
          where: { ativo: true },
          required: false,
          include: [{ association: 'tipo_badge_especial' }]
        }
      ]
    });

    if (!badgeEspecial) {
      return res.status(404).json({ success: false, message: 'Badge Especial não encontrado ou inativo.' });
    }

    // 2. Proteção Anti-Fraude e Anti-Duplicação:
    // a) Verificar se o consultor JÁ conquistou este badge especial
    const jaConquistado = await ConquistaAtribuida.findOne({
      where: { id_utilizador: userId, id_conquista_especial, atribuicaoAtiva: true }
    });

    if (jaConquistado) {
      return res.status(409).json({
        success: false,
        message: 'Já possui este Badge Especial conquistado. Não é permitida a submissão de novas candidaturas.'
      });
    }

    // b) Verificar se já tem candidatura pendente (Estado 1 - Enviada)
    const candidaturaPendente = await CandidaturaEspecial.findOne({
      where: {
        id_utilizador: userId,
        id_conquista_especial,
        id_estado_candidatura_especial: 1, // Enviada
        candidaturaEspecialAtiva: true
      }
    });

    if (candidaturaPendente) {
      return res.status(409).json({
        success: false,
        message: 'Já possui uma candidatura pendente de aprovação para este Badge Especial.'
      });
    }

    // 3. Validar tipo de comprovativo necessário
    const config = badgeEspecial.configuracoes?.[0];
    const tipo = config?.tipo_badge_especial;

    let ficheiroNome = null;
    if (req.file) {
      ficheiroNome = req.file.filename;
    }

    if (tipo) {
      if (tipo.requer_link && !url_comprovativo) {
        return res.status(400).json({
          success: false,
          message: 'Este Badge Especial exige a indicação de um URL público comprovativo (ex.: link Credly).'
        });
      }

      if (tipo.requer_ficheiro && !ficheiroNome) {
        return res.status(400).json({
          success: false,
          message: 'Este Badge Especial exige o envio de um comprovativo em formato PDF.'
        });
      }
    } else {
      // Fallback genérico: exige pelo menos link ou ficheiro
      if (!url_comprovativo && !ficheiroNome) {
        return res.status(400).json({
          success: false,
          message: 'Deve fornecer um URL comprovativo ou anexar um ficheiro PDF.'
        });
      }
    }

    const idCandidaturaEspecial = gerarUUIDv7();

    const novaCandidatura = await CandidaturaEspecial.create({
      id_candidatura_especial: idCandidaturaEspecial,
      id_utilizador: userId,
      id_conquista_especial,
      id_estado_candidatura_especial: 1, // Enviada
      url_comprovativo: url_comprovativo || null,
      ficheiro_comprovativo: ficheiroNome || null,
      data_candidatura: new Date(),
      candidaturaEspecialAtiva: true
    });

    // 4. Notificar todos os Administradores (BD persistente i18n + WebSockets em tempo real)
    const consultor = await Utilizador.findByPk(userId);
    const nomeConsultor = consultor ? `${consultor.nome} ${consultor.apelido}` : 'Consultor';
    const badgeTituloPT = badgeEspecial.traducao_titulo?.pt || 'Badge Especial';
    const badgeTituloEN = badgeEspecial.traducao_titulo?.en || badgeTituloPT;
    const badgeTituloES = badgeEspecial.traducao_titulo?.es || badgeTituloPT;

    const admins = await Utilizador.findAll({
      include: [{
        association: 'perfis',
        where: { id_perfil: 1 }, // 1: Administrador
        attributes: []
      }]
    });

    for (const admin of admins) {
      await criarENotificar({
        id_user_notificador: userId,
        id_user_alvo_notificacao: admin.id_utilizador,
        codigo_tipo: 'nova_candidatura_especial',
        titulo: {
          pt: 'Nova Candidatura a Badge Especial',
          en: 'New Special Badge Application',
          es: 'Nueva Solicitud de Insignia Especial'
        },
        mensagem: {
          pt: `O consultor ${nomeConsultor} candidatou-se ao Badge Especial "${badgeTituloPT}".`,
          en: `Consultant ${nomeConsultor} applied for the Special Badge "${badgeTituloEN}".`,
          es: `El consultor ${nomeConsultor} se ha postulado para la Insignia Especial "${badgeTituloES}".`
        },
        parametros: {
          id_candidatura_especial: idCandidaturaEspecial,
          id_conquista_especial,
          id_consultor: userId
        }
      });
    }

    emitGlobal('candidatura_especial_submetida', {
      id_candidatura_especial: idCandidaturaEspecial,
      id_utilizador: userId,
      id_conquista_especial,
      consultor: {
        id_utilizador: userId,
        nome: nomeConsultor
      },
      badge_titulo: badgeTituloPT
    });

    return res.status(201).json({
      success: true,
      message: 'Candidatura a Badge Especial submetida com sucesso.',
      data: novaCandidatura
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao submeter candidatura especial.',
      error: error.message
    });
  }
};

/**
 * GET /candidatura_especial/minhas
 * O Consultor lista as suas próprias candidaturas a badges especiais.
 */
controllersCandidaturaEspecial.listMinhasCandidaturas = async (req, res) => {
  try {
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';

    const candidaturas = await CandidaturaEspecial.findAll({
      where: { id_utilizador: userId, candidaturaEspecialAtiva: true },
      include: [
        {
          association: 'conquista_especial',
          include: [
            { association: 'traducao_titulo' },
            { association: 'traducao_descricao' }
          ]
        },
        {
          association: 'estado',
          include: [{ association: 'traducao_estado' }]
        },
        {
          association: 'conquista_atribuida'
        }
      ],
      order: [['data_candidatura', 'DESC']]
    });

    const data = candidaturas.map(c => ({
      id_candidatura_especial: c.id_candidatura_especial,
      id_conquista_especial: c.id_conquista_especial,
      badge_titulo: c.conquista_especial?.traducao_titulo?.[lang] || c.conquista_especial?.traducao_titulo?.pt || '',
      badge_descricao: c.conquista_especial?.traducao_descricao?.[lang] || c.conquista_especial?.traducao_descricao?.pt || '',
      pontos_bonus: c.conquista_especial?.pontos_bonus,
      logo_conquista: c.conquista_especial?.logo_conquista,
      id_estado: c.id_estado_candidatura_especial,
      estado: c.estado?.traducao_estado?.[lang] || c.estado?.traducao_estado?.pt || '',
      url_comprovativo: c.url_comprovativo,
      ficheiro_comprovativo: c.ficheiro_comprovativo,
      data_candidatura: c.data_candidatura,
      data_decisao: c.data_decisao,
      motivo_recusa: c.motivo_recusa,
      conquistado: !!c.conquista_atribuida,
      rgpd_partilha_conquista: c.conquista_atribuida?.rgpd_partilha_conquista || false,
      partilhar_conquista_especial: c.conquista_atribuida?.rgpd_partilha_conquista || false
    }));

    return res.status(200).json({ success: true, data });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar candidaturas.', error: error.message });
  }
};

/**
 * GET /candidatura_especial
 * O Administrador lista todas as candidaturas especiais com filtros opcionais.
 */
controllersCandidaturaEspecial.listAllCandidaturas = async (req, res) => {
  try {
    const lang = req.lang || 'pt';
    const { estado } = req.query;

    const where = { candidaturaEspecialAtiva: true };
    if (estado) where.id_estado_candidatura_especial = parseInt(estado);

    const candidaturas = await CandidaturaEspecial.findAll({
      where,
      include: [
        {
          association: 'consultor',
          attributes: ['id_utilizador', 'nome', 'apelido', 'email', 'avatar']
        },
        {
          association: 'conquista_especial',
          include: [
            { association: 'traducao_titulo' },
            { association: 'traducao_descricao' }
          ]
        },
        {
          association: 'estado',
          include: [{ association: 'traducao_estado' }]
        },
        {
          association: 'conquista_atribuida'
        }
      ],
      order: [['data_candidatura', 'DESC']]
    });

    const data = candidaturas.map(c => ({
      id_candidatura_especial: c.id_candidatura_especial,
      consultor: {
        id_utilizador: c.consultor?.id_utilizador,
        nome: `${c.consultor?.nome} ${c.consultor?.apelido}`,
        email: c.consultor?.email,
        avatar: c.consultor?.avatar
      },
      conquista_especial: {
        id_conquista_especial: c.conquista_especial?.id_conquista_especial,
        titulo: c.conquista_especial?.traducao_titulo?.[lang] || c.conquista_especial?.traducao_titulo?.pt || '',
        descricao: c.conquista_especial?.traducao_descricao?.[lang] || c.conquista_especial?.traducao_descricao?.pt || '',
        pontos_bonus: c.conquista_especial?.pontos_bonus,
        logo_conquista: c.conquista_especial?.logo_conquista
      },
      id_estado: c.id_estado_candidatura_especial,
      estado: c.estado?.traducao_estado?.[lang] || c.estado?.traducao_estado?.pt || '',
      url_comprovativo: c.url_comprovativo,
      ficheiro_comprovativo: c.ficheiro_comprovativo,
      data_candidatura: c.data_candidatura,
      data_decisao: c.data_decisao,
      motivo_recusa: c.motivo_recusa,
      conquistado: !!c.conquista_atribuida
    }));

    return res.status(200).json({ success: true, data });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar candidaturas.', error: error.message });
  }
};

/**
 * GET /candidatura_especial/:id
 * Detalhe de uma candidatura especial.
 */
controllersCandidaturaEspecial.getCandidaturaById = async (req, res) => {
  try {
    const lang = req.lang || 'pt';
    const { id } = req.params;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const perfis = req.auth?.perfis || [];
    const isAdmin = perfis.includes(1) || req.activeRole === 1;

    const candidatura = await CandidaturaEspecial.findOne({
      where: { id_candidatura_especial: id, candidaturaEspecialAtiva: true },
      include: [
        {
          association: 'consultor',
          attributes: ['id_utilizador', 'nome', 'apelido', 'email', 'avatar']
        },
        {
          association: 'conquista_especial',
          include: [
            { association: 'traducao_titulo' },
            { association: 'traducao_descricao' }
          ]
        },
        {
          association: 'estado',
          include: [{ association: 'traducao_estado' }]
        },
        {
          association: 'conquista_atribuida'
        }
      ]
    });

    if (!candidatura) {
      return res.status(404).json({ success: false, message: 'Candidatura especial não encontrada.' });
    }

    if (!isAdmin && candidatura.id_utilizador !== userId) {
      return res.status(403).json({ success: false, message: 'Sem permissão para consultar esta candidatura.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id_candidatura_especial: candidatura.id_candidatura_especial,
        consultor: {
          id_utilizador: candidatura.consultor?.id_utilizador,
          nome: `${candidatura.consultor?.nome} ${candidatura.consultor?.apelido}`,
          email: candidatura.consultor?.email,
          avatar: candidatura.consultor?.avatar
        },
        conquista_especial: {
          id_conquista_especial: candidatura.conquista_especial?.id_conquista_especial,
          titulo: candidatura.conquista_especial?.traducao_titulo?.[lang] || candidatura.conquista_especial?.traducao_titulo?.pt || '',
          descricao: candidatura.conquista_especial?.traducao_descricao?.[lang] || candidatura.conquista_especial?.traducao_descricao?.pt || '',
          pontos_bonus: candidatura.conquista_especial?.pontos_bonus,
          logo_conquista: candidatura.conquista_especial?.logo_conquista
        },
        id_estado: candidatura.id_estado_candidatura_especial,
        estado: candidatura.estado?.traducao_estado?.[lang] || candidatura.estado?.traducao_estado?.pt || '',
        url_comprovativo: candidatura.url_comprovativo,
        ficheiro_comprovativo: candidatura.ficheiro_comprovativo,
        data_candidatura: candidatura.data_candidatura,
        data_decisao: candidatura.data_decisao,
        motivo_recusa: candidatura.motivo_recusa,
        conquistado: !!candidatura.conquista_atribuida,
        rgpd_partilha_conquista: candidatura.conquista_atribuida?.rgpd_partilha_conquista || false,
        partilhar_conquista_especial: candidatura.conquista_atribuida?.rgpd_partilha_conquista || false
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao obter candidatura.', error: error.message });
  }
};

/**
 * GET /candidatura_especial/:id/ficheiro
 * Download / visualização segura do PDF do certificado.
 */
controllersCandidaturaEspecial.downloadFicheiro = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const perfis = req.auth?.perfis || [];
    const isAdmin = perfis.includes(1) || req.activeRole === 1;

    const candidatura = await CandidaturaEspecial.findOne({
      where: { id_candidatura_especial: id, candidaturaEspecialAtiva: true }
    });

    if (!candidatura || !candidatura.ficheiro_comprovativo) {
      return res.status(404).json({ success: false, message: 'Ficheiro comprovativo não encontrado.' });
    }

    if (!isAdmin && candidatura.id_utilizador !== userId) {
      return res.status(403).json({ success: false, message: 'Sem permissão para aceder a este ficheiro.' });
    }

    const filePath = path.join(__dirname, '../uploads/certificados', candidatura.id_utilizador, candidatura.ficheiro_comprovativo);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Ficheiro não existe no servidor.' });
    }

    return res.sendFile(filePath);

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao descarregar ficheiro.', error: error.message });
  }
};

/**
 * PATCH /candidatura_especial/:id/decisao
 * O Administrador Aprova ou Recusa uma candidatura especial.
 * Emite notificações i18n e WebSockets em tempo real.
 */
controllersCandidaturaEspecial.decidirCandidatura = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { aprovada, motivo_recusa } = req.body;

    if (typeof aprovada !== 'boolean') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'O campo "aprovada" (booleano) é obrigatório.' });
    }

    const candidatura = await CandidaturaEspecial.findOne({
      where: { id_candidatura_especial: id, candidaturaEspecialAtiva: true },
      include: [
        {
          association: 'conquista_especial',
          include: [{ association: 'traducao_titulo' }]
        }
      ],
      transaction
    });

    if (!candidatura) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Candidatura especial não encontrada.' });
    }

    if (candidatura.id_estado_candidatura_especial !== 1) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Esta candidatura já foi decidida anteriormente.' });
    }

    const badgeTituloPT = candidatura.conquista_especial?.traducao_titulo?.pt || 'Badge Especial';
    const badgeTituloEN = candidatura.conquista_especial?.traducao_titulo?.en || badgeTituloPT;
    const badgeTituloES = candidatura.conquista_especial?.traducao_titulo?.es || badgeTituloPT;

    if (aprovada) {
      // 1. Atualizar candidatura para Aprovada (Estado 2)
      await candidatura.update({
        id_estado_candidatura_especial: 2,
        data_decisao: new Date(),
        motivo_recusa: null
      }, { transaction });

      // 2. Criar registo em ConquistaAtribuida
      const idConquistaAtribuida = gerarUUIDv7();
      await ConquistaAtribuida.create({
        id_conquista_atribuida: idConquistaAtribuida,
        id_utilizador: candidatura.id_utilizador,
        id_conquista_especial: candidatura.id_conquista_especial,
        id_candidatura_especial: candidatura.id_candidatura_especial,
        data_atribuicao_conquista: new Date(),
        pontos_conquistados: candidatura.conquista_especial.pontos_bonus || 0,
        rgpd_partilha_conquista: false,
        atribuicaoAtiva: true
      }, { transaction });

      await transaction.commit();

      // 3. Disparar Notificação i18n e WebSockets
      await criarENotificar({
        id_user_notificador: req.auth?.sub || req.auth?.id_utilizador,
        id_user_alvo_notificacao: candidatura.id_utilizador,
        codigo_tipo: 'candidatura_aprovada',
        titulo: {
          pt: 'Badge Especial Aprovado!',
          en: 'Special Badge Approved!',
          es: '¡Insignia Especial Aprobada!'
        },
        mensagem: {
          pt: `Parabéns! A sua candidatura ao Badge Especial "${badgeTituloPT}" foi aprovada e conquistou ${candidatura.conquista_especial.pontos_bonus} pontos bónus.`,
          en: `Congratulations! Your application for the Special Badge "${badgeTituloEN}" was approved and you earned ${candidatura.conquista_especial.pontos_bonus} bonus points.`,
          es: `¡Felicidades! Su solicitud para la Insignia Especial "${badgeTituloES}" fue aprobada y ganó ${candidatura.conquista_especial.pontos_bonus} puntos de bonificación.`
        },
        parametros: {
          id_candidatura_especial: candidatura.id_candidatura_especial,
          id_conquista_especial: candidatura.id_conquista_especial
        }
      });

      emitGlobal('candidatura_especial_aprovada', {
        id_candidatura_especial: candidatura.id_candidatura_especial,
        id_utilizador: candidatura.id_utilizador,
        id_conquista_especial: candidatura.id_conquista_especial,
        pontos_bonus: candidatura.conquista_especial.pontos_bonus
      });

      // Avaliar e verificar objetivos pessoais do consultor
      (async () => {
        try {
          await verificarObjetivosConsultor(candidatura.id_utilizador);
        } catch (errObj) {
          console.error('Erro ao verificar objetivos do consultor após aprovação especial:', errObj.message);
        }
      })();

      return res.status(200).json({
        success: true,
        message: 'Candidatura especial aprovada com sucesso e conquista atribuída.'
      });

    } else {
      // Recusa (Estado 3)
      if (!motivo_recusa) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'O motivo de recusa é obrigatório ao rejeitar uma candidatura.' });
      }

      await candidatura.update({
        id_estado_candidatura_especial: 3,
        data_decisao: new Date(),
        motivo_recusa
      }, { transaction });

      await transaction.commit();

      // Disparar Notificação i18n e WebSockets
      await criarENotificar({
        id_user_notificador: req.auth?.sub || req.auth?.id_utilizador,
        id_user_alvo_notificacao: candidatura.id_utilizador,
        codigo_tipo: 'candidatura_rejeitada',
        titulo: {
          pt: 'Badge Especial Recusado',
          en: 'Special Badge Rejected',
          es: 'Insignia Especial Rechazada'
        },
        mensagem: {
          pt: `A sua candidatura ao Badge Especial "${badgeTituloPT}" foi recusada. Motivo: ${motivo_recusa}`,
          en: `Your application for the Special Badge "${badgeTituloEN}" was rejected. Reason: ${motivo_recusa}`,
          es: `Su solicitud para la Insignia Especial "${badgeTituloES}" fue rechazada. Motivo: ${motivo_recusa}`
        },
        parametros: {
          id_candidatura_especial: candidatura.id_candidatura_especial,
          id_conquista_especial: candidatura.id_conquista_especial,
          motivo_recusa
        }
      });

      emitGlobal('candidatura_especial_recusada', {
        id_candidatura_especial: candidatura.id_candidatura_especial,
        id_utilizador: candidatura.id_utilizador,
        motivo_recusa
      });

      return res.status(200).json({
        success: true,
        message: 'Candidatura especial recusada com sucesso.'
      });
    }

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao decidir candidatura especial.', error: error.message });
  }
};

/**
 * PATCH /candidatura_especial/:id/share
 * O Consultor comuta a partilha pública (RGPD) do seu Badge Especial conquistado.
 * Suporta os campos 'rgpd_partilha_conquista' e 'partilhar_conquista_especial'.
 */
controllersCandidaturaEspecial.toggleShare = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const { rgpd_partilha_conquista, partilhar_conquista_especial } = req.body;

    const valorPartilha = typeof rgpd_partilha_conquista === 'boolean'
      ? rgpd_partilha_conquista
      : (typeof partilhar_conquista_especial === 'boolean' ? partilhar_conquista_especial : null);

    if (valorPartilha === null) {
      return res.status(400).json({
        success: false,
        message: 'O campo "rgpd_partilha_conquista" (ou "partilhar_conquista_especial") deve ser booleano.'
      });
    }

    const candidatura = await CandidaturaEspecial.findOne({
      where: { id_candidatura_especial: id, id_utilizador: userId, candidaturaEspecialAtiva: true },
      include: [{ association: 'conquista_atribuida' }]
    });

    if (!candidatura || !candidatura.conquista_atribuida) {
      return res.status(404).json({ success: false, message: 'Conquista especial conquistada não encontrada.' });
    }

    await candidatura.conquista_atribuida.update({ rgpd_partilha_conquista: valorPartilha });

    return res.status(200).json({
      success: true,
      message: `Partilha pública do Badge Especial ${valorPartilha ? 'ativada' : 'desativada'} com sucesso.`,
      data: {
        id_candidatura_especial: id,
        rgpd_partilha_conquista: valorPartilha,
        partilhar_conquista_especial: valorPartilha
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao alterar partilha pública.', error: error.message });
  }
};

/**
 * GET /candidatura_especial/public/:id
 * GET /candidatura_especial/public/:id_candidatura/:id_conquista
 * Rota pública para visualização e partilha de Badges Especiais no Microsite.
 * Não requer autenticação JWT.
 */
controllersCandidaturaEspecial.detailCandidaturaEspecialPublic = async (req, res) => {
  try {
    const id = req.params.id || req.params.id_candidatura;
    const id_conquista = req.params.id_conquista;

    if (!id || !validaUUID(id, 7)) {
      return res.status(400).json({ success: false, message: 'ID de candidatura especial inválido.' });
    }

    const lang = req.lang || 'pt';

    const whereClause = {
      id_candidatura_especial: id,
      candidaturaEspecialAtiva: true
    };

    if (id_conquista && validaUUID(id_conquista, 7)) {
      whereClause.id_conquista_especial = id_conquista;
    }

    const candidatura = await CandidaturaEspecial.findOne({
      where: whereClause,
      include: [
        {
          association: 'consultor',
          attributes: ['id_utilizador', 'nome', 'apelido', 'avatar']
        },
        {
          association: 'conquista_especial',
          include: [
            { association: 'traducao_titulo' },
            { association: 'traducao_descricao' }
          ]
        },
        {
          association: 'conquista_atribuida',
          where: { atribuicaoAtiva: true },
          required: false
        }
      ]
    });

    // Se não existir, se não estiver aprovada (estado 2) ou se não tiver partilha RGPD ativa
    if (
      !candidatura ||
      candidatura.id_estado_candidatura_especial !== 2 ||
      !candidatura.conquista_atribuida ||
      !candidatura.conquista_atribuida.rgpd_partilha_conquista
    ) {
      return res.status(404).json({
        success: false,
        message: 'Candidatura especial pública não encontrada ou indisponível.'
      });
    }

    const ce = candidatura.conquista_especial;
    const dataConquista = candidatura.conquista_atribuida.data_atribuicao_conquista || candidatura.data_decisao || candidatura.updatedAt;

    return res.status(200).json({
      success: true,
      message: 'Candidatura especial pública recuperada com sucesso.',
      data: {
        id_candidatura_especial: candidatura.id_candidatura_especial,
        id_conquista_especial: candidatura.id_conquista_especial,
        tipo: 'especial',
        nome_utilizador: `${candidatura.consultor?.nome || ''} ${candidatura.consultor?.apelido || ''}`.trim(),
        avatar_utilizador: candidatura.consultor?.avatar || null,
        id_utilizador: candidatura.consultor?.id_utilizador,
        badge_nome: ce?.traducao_titulo?.[lang] || ce?.traducao_titulo?.pt || '',
        badge_descricao: ce?.traducao_descricao?.[lang] || ce?.traducao_descricao?.pt || '',
        badge_logo: ce?.logo_conquista || 'default_special_badge.svg',
        badge_pontos: ce?.pontos_bonus || candidatura.conquista_atribuida.pontos_conquistados || 0,
        url_comprovativo: candidatura.url_comprovativo,
        ficheiro_comprovativo: candidatura.ficheiro_comprovativo,
        data_conquista: dataConquista,
        rgpd_partilha_conquista: true,
        partilhar_conquista_especial: true
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter dados públicos da candidatura especial.',
      error: error.message
    });
  }
};

/**
 * GET /candidatura_especial/assinatura
 * Lista as conquistas especiais conquistadas e autorizadas para partilha pública do consultor autenticado.
 * Endpoint dedicado para consumo na configuração da Assinatura de Email no Frontend.
 */
controllersCandidaturaEspecial.listConquistasAssinatura = async (req, res) => {
  try {
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';

    const candidaturas = await CandidaturaEspecial.findAll({
      where: {
        id_utilizador: userId,
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
    });

    const data = candidaturas.map(c => {
      const ce = c.conquista_especial;
      const dataConquista = c.conquista_atribuida?.data_atribuicao_conquista || c.data_decisao || c.updatedAt;
      return {
        id_candidatura_especial: c.id_candidatura_especial,
        id_conquista_especial: c.id_conquista_especial,
        tipo: 'especial',
        badge_titulo: ce?.traducao_titulo?.[lang] || ce?.traducao_titulo?.pt || '',
        badge_descricao: ce?.traducao_descricao?.[lang] || ce?.traducao_descricao?.pt || '',
        badge_logo: ce?.logo_conquista || 'default_special_badge.svg',
        pontos_bonus: ce?.pontos_bonus || c.conquista_atribuida?.pontos_conquistados || 0,
        data_conquista: dataConquista,
        rgpd_partilha_conquista: true,
        partilhar_conquista_especial: true,
        public_url: `https://www.softbadge.pt/shares/${userId}/${c.id_candidatura_especial}?tipo=especial`
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar conquistas especiais para assinatura.',
      error: error.message
    });
  }
};

module.exports = controllersCandidaturaEspecial;
