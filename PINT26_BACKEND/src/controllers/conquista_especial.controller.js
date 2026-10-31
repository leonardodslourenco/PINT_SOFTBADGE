const ConquistaEspecial = require('../models/conquista_especial.model');
const ConfiguracaoBadgeEspecial = require('../models/configuracao_badge_especial.model');
const TipoBadgeEspecial = require('../models/tipo_badge_especial.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');
const { tratarPayloadTraducao } = require('../services/tradutor_helper');
const { emitGlobal } = require('../services/websocket.service');

const controllersConquistaEspecial = {};

/**
 * POST /conquista-especial
 * Regista um novo Badge Especial (Apenas Admin).
 */
controllersConquistaEspecial.createConquistaEspecial = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const lang = req.lang || 'pt';
    const { titulo, descricao, id_configuracao_badge_especial } = req.body;
    let { pontos_bonus, logo_conquista } = req.body;

    if (typeof pontos_bonus === 'string') pontos_bonus = parseInt(pontos_bonus);

    if (!titulo || (typeof titulo !== 'string' && typeof titulo !== 'object') ||
        !descricao || (typeof descricao !== 'string' && typeof descricao !== 'object')) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Os campos "titulo" e "descricao" são obrigatórios.' });
    }

    if (!pontos_bonus || isNaN(pontos_bonus) || pontos_bonus < 1 || pontos_bonus > 1000) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'O campo "pontos_bonus" deve ser um número inteiro entre 1 e 1000.' });
    }

    if (req.file) {
      logo_conquista = req.file.filename;
    }

    let tituloTraduzido, descricaoTraduzida;
    try {
      tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
      descricaoTraduzida = await tratarPayloadTraducao(descricao, lang);
    } catch (transError) {
      await transaction.rollback();
      return res.status(422).json({
        success: false,
        code: 'TRANSLATION_API_FAILED',
        message: 'O serviço de tradução automática está temporariamente indisponível.',
        error: transError.message
      });
    }

    const idTraducaoTitulo = gerarUUIDv7();
    const idTraducaoDescricao = gerarUUIDv7();

    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoTitulo,
      tabela: 'conquista_especial',
      coluna: 'id_traducao_conquista_especial',
      pt: tituloTraduzido.pt,
      en: tituloTraduzido.en,
      es: tituloTraduzido.es
    }, { transaction });

    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoDescricao,
      tabela: 'conquista_especial',
      coluna: 'id_traducao_descricao_conquista_especial',
      pt: descricaoTraduzida.pt,
      en: descricaoTraduzida.en,
      es: descricaoTraduzida.es
    }, { transaction });

    const idConquistaEspecial = gerarUUIDv7();

    const novoBadgeEspecial = await ConquistaEspecial.create({
      id_conquista_especial: idConquistaEspecial,
      id_traducao_conquista_especial: idTraducaoTitulo,
      id_traducao_descricao_conquista_especial: idTraducaoDescricao,
      pontos_bonus,
      logo_conquista: logo_conquista || 'default_special_badge.svg',
      conquistaEspecialAtiva: true
    }, { transaction });

    // Se foi fornecida uma configuração para associar
    if (id_configuracao_badge_especial) {
      const config = await ConfiguracaoBadgeEspecial.findByPk(id_configuracao_badge_especial, { transaction });
      if (config) {
        await config.update({ id_conquista_especial: idConquistaEspecial }, { transaction });
      }
    }

    await transaction.commit();

    emitGlobal('conquista_especial_criada', { id: idConquistaEspecial });

    return res.status(201).json({
      success: true,
      message: 'Badge Especial criado com sucesso.',
      data: {
        id_conquista_especial: novoBadgeEspecial.id_conquista_especial,
        titulo: tituloTraduzido[lang] || tituloTraduzido.pt,
        descricao: descricaoTraduzida[lang] || descricaoTraduzida.pt,
        pontos_bonus: novoBadgeEspecial.pontos_bonus,
        logo_conquista: novoBadgeEspecial.logo_conquista
      }
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao criar Badge Especial.', error: error.message });
  }
};

/**
 * GET /conquista-especial
 * Lista todos os Badges Especiais ativos com suporte a i18n e informações do tipo/configuração.
 */
controllersConquistaEspecial.listConquistasEspeciais = async (req, res) => {
  try {
    const lang = req.lang || 'pt';

    const conquistas = await ConquistaEspecial.findAll({
      where: { conquistaEspecialAtiva: true },
      include: [
        { association: 'traducao_titulo' },
        { association: 'traducao_descricao' },
        {
          association: 'configuracoes',
          where: { ativo: true },
          required: false,
          include: [
            { association: 'traducao_nome' },
            { association: 'traducao_descricao' },
            {
              association: 'tipo_badge_especial',
              include: [
                { association: 'traducao_titulo' },
                { association: 'traducao_descricao' }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    const data = conquistas.map(c => {
      const config = c.configuracoes?.[0] || null;
      const tipo = config?.tipo_badge_especial || null;

      return {
        id_conquista_especial: c.id_conquista_especial,
        titulo: c.traducao_titulo?.[lang] || c.traducao_titulo?.pt || '',
        descricao: c.traducao_descricao?.[lang] || c.traducao_descricao?.pt || '',
        pontos_bonus: c.pontos_bonus,
        logo_conquista: c.logo_conquista,
        tipo_badge_especial: tipo ? {
          id_tipo_badge_especial: tipo.id_tipo_badge_especial,
          codigo_tipo: tipo.codigo_tipo,
          nome: tipo.traducao_titulo?.[lang] || tipo.traducao_titulo?.pt || '',
          descricao: tipo.traducao_descricao?.[lang] || tipo.traducao_descricao?.pt || '',
          requer_link: tipo.requer_link,
          requer_ficheiro: tipo.requer_ficheiro
        } : null,
        configuracao: config ? {
          id_configuracao_badge_especial: config.id_configuracao_badge_especial,
          nome: config.traducao_nome?.[lang] || config.traducao_nome?.pt || '',
          descricao: config.traducao_descricao?.[lang] || config.traducao_descricao?.pt || ''
        } : null
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Badges Especiais recuperados com sucesso.',
      data
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar Badges Especiais.', error: error.message });
  }
};

/**
 * GET /conquista-especial/:id
 * Detalhe de um Badge Especial específico.
 */
controllersConquistaEspecial.getConquistaEspecialById = async (req, res) => {
  try {
    const lang = req.lang || 'pt';
    const { id } = req.params;

    const conquista = await ConquistaEspecial.findOne({
      where: { id_conquista_especial: id, conquistaEspecialAtiva: true },
      include: [
        { association: 'traducao_titulo' },
        { association: 'traducao_descricao' },
        {
          association: 'configuracoes',
          where: { ativo: true },
          required: false,
          include: [
            { association: 'traducao_nome' },
            { association: 'traducao_descricao' },
            {
              association: 'tipo_badge_especial',
              include: [
                { association: 'traducao_titulo' },
                { association: 'traducao_descricao' }
              ]
            }
          ]
        }
      ]
    });

    if (!conquista) {
      return res.status(404).json({ success: false, message: 'Badge Especial não encontrado.' });
    }

    const config = conquista.configuracoes?.[0] || null;
    const tipo = config?.tipo_badge_especial || null;

    return res.status(200).json({
      success: true,
      data: {
        id_conquista_especial: conquista.id_conquista_especial,
        titulo: conquista.traducao_titulo?.[lang] || conquista.traducao_titulo?.pt || '',
        descricao: conquista.traducao_descricao?.[lang] || conquista.traducao_descricao?.pt || '',
        traducoes: {
          titulo: { pt: conquista.traducao_titulo?.pt, en: conquista.traducao_titulo?.en, es: conquista.traducao_titulo?.es },
          descricao: { pt: conquista.traducao_descricao?.pt, en: conquista.traducao_descricao?.en, es: conquista.traducao_descricao?.es }
        },
        pontos_bonus: conquista.pontos_bonus,
        logo_conquista: conquista.logo_conquista,
        tipo_badge_especial: tipo ? {
          id_tipo_badge_especial: tipo.id_tipo_badge_especial,
          codigo_tipo: tipo.codigo_tipo,
          nome: tipo.traducao_titulo?.[lang] || tipo.traducao_titulo?.pt || '',
          descricao: tipo.traducao_descricao?.[lang] || tipo.traducao_descricao?.pt || '',
          requer_link: tipo.requer_link,
          requer_ficheiro: tipo.requer_ficheiro
        } : null,
        configuracao: config ? {
          id_configuracao_badge_especial: config.id_configuracao_badge_especial,
          nome: config.traducao_nome?.[lang] || config.traducao_nome?.pt || '',
          descricao: config.traducao_descricao?.[lang] || config.traducao_descricao?.pt || ''
        } : null
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao obter Badge Especial.', error: error.message });
  }
};

/**
 * PUT /conquista-especial/:id
 * Atualiza um Badge Especial (Apenas Admin).
 */
controllersConquistaEspecial.updateConquistaEspecial = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const lang = req.lang || 'pt';
    const { id } = req.params;
    const { titulo, descricao, id_configuracao_badge_especial } = req.body;
    let { pontos_bonus, logo_conquista } = req.body;

    const conquista = await ConquistaEspecial.findOne({
      where: { id_conquista_especial: id, conquistaEspecialAtiva: true },
      transaction
    });

    if (!conquista) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Badge Especial não encontrado.' });
    }

    if (pontos_bonus !== undefined) {
      if (typeof pontos_bonus === 'string') pontos_bonus = parseInt(pontos_bonus);
      if (isNaN(pontos_bonus) || pontos_bonus < 1 || pontos_bonus > 1000) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'O campo "pontos_bonus" deve ser um número inteiro entre 1 e 1000.' });
      }
      conquista.pontos_bonus = pontos_bonus;
    }

    if (req.file) {
      conquista.logo_conquista = req.file.filename;
    } else if (logo_conquista) {
      conquista.logo_conquista = logo_conquista;
    }

    if (titulo) {
      const tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
      await TraducaoConteudo.update(
        { pt: tituloTraduzido.pt, en: tituloTraduzido.en, es: tituloTraduzido.es },
        { where: { id_traducao_conteudo: conquista.id_traducao_conquista_especial }, transaction }
      );
    }

    if (descricao) {
      const descricaoTraduzida = await tratarPayloadTraducao(descricao, lang);
      await TraducaoConteudo.update(
        { pt: descricaoTraduzida.pt, en: descricaoTraduzida.en, es: descricaoTraduzida.es },
        { where: { id_traducao_conteudo: conquista.id_traducao_descricao_conquista_especial }, transaction }
      );
    }

    if (id_configuracao_badge_especial) {
      const config = await ConfiguracaoBadgeEspecial.findByPk(id_configuracao_badge_especial, { transaction });
      if (config) {
        await config.update({ id_conquista_especial: conquista.id_conquista_especial }, { transaction });
      }
    }

    await conquista.save({ transaction });
    await transaction.commit();

    emitGlobal('conquista_especial_atualizada', { id: conquista.id_conquista_especial });

    return res.status(200).json({ success: true, message: 'Badge Especial atualizado com sucesso.' });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao atualizar Badge Especial.', error: error.message });
  }
};

/**
 * DELETE /conquista-especial/:id
 * Desativação lógica (Soft Delete) do Badge Especial (Apenas Admin).
 */
controllersConquistaEspecial.deleteConquistaEspecial = async (req, res) => {
  try {
    const { id } = req.params;

    const conquista = await ConquistaEspecial.findByPk(id);
    if (!conquista) {
      return res.status(404).json({ success: false, message: 'Badge Especial não encontrado.' });
    }

    await conquista.update({ conquistaEspecialAtiva: false });

    emitGlobal('conquista_especial_removida', { id });

    return res.status(200).json({ success: true, message: 'Badge Especial desativado com sucesso.' });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao desativar Badge Especial.', error: error.message });
  }
};

/**
 * GET /conquista-especial/tipos
 * Lista os tipos de badges especiais disponíveis (para dropdowns).
 */
controllersConquistaEspecial.listTipos = async (req, res) => {
  try {
    const lang = req.lang || 'pt';

    const tipos = await TipoBadgeEspecial.findAll({
      where: { ativo: true },
      include: [
        { association: 'traducao_titulo' },
        { association: 'traducao_descricao' }
      ],
      order: [['codigo_tipo', 'ASC']]
    });

    const data = tipos.map(t => ({
      id_tipo_badge_especial: t.id_tipo_badge_especial,
      codigo_tipo: t.codigo_tipo,
      titulo: t.traducao_titulo?.[lang] || t.traducao_titulo?.pt || '',
      descricao: t.traducao_descricao?.[lang] || t.traducao_descricao?.pt || '',
      requer_link: t.requer_link,
      requer_ficheiro: t.requer_ficheiro
    }));

    return res.status(200).json({ success: true, data });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar tipos de badge especial.', error: error.message });
  }
};

/**
 * GET /conquista-especial/configuracoes
 * Lista configurações de badges especiais (para dropdowns e gestão).
 */
controllersConquistaEspecial.listConfiguracoes = async (req, res) => {
  try {
    const lang = req.lang || 'pt';

    const configuracoes = await ConfiguracaoBadgeEspecial.findAll({
      where: { ativo: true },
      include: [
        { association: 'traducao_nome' },
        { association: 'traducao_descricao' },
        {
          association: 'tipo_badge_especial',
          include: [
            { association: 'traducao_titulo' },
            { association: 'traducao_descricao' }
          ]
        },
        {
          association: 'conquista_especial',
          include: [
            { association: 'traducao_titulo' }
          ]
        }
      ]
    });

    const data = configuracoes.map(c => ({
      id_configuracao_badge_especial: c.id_configuracao_badge_especial,
      nome: c.traducao_nome?.[lang] || c.traducao_nome?.pt || '',
      descricao: c.traducao_descricao?.[lang] || c.traducao_descricao?.pt || '',
      tipo_badge_especial: c.tipo_badge_especial ? {
        id_tipo_badge_especial: c.tipo_badge_especial.id_tipo_badge_especial,
        codigo_tipo: c.tipo_badge_especial.codigo_tipo,
        titulo: c.tipo_badge_especial.traducao_titulo?.[lang] || c.tipo_badge_especial.traducao_titulo?.pt || '',
        requer_link: c.tipo_badge_especial.requer_link,
        requer_ficheiro: c.tipo_badge_especial.requer_ficheiro
      } : null,
      conquista_especial: c.conquista_especial ? {
        id_conquista_especial: c.conquista_especial.id_conquista_especial,
        titulo: c.conquista_especial.traducao_titulo?.[lang] || c.conquista_especial.traducao_titulo?.pt || '',
        pontos_bonus: c.conquista_especial.pontos_bonus
      } : null
    }));

    return res.status(200).json({ success: true, data });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar configurações de badge especial.', error: error.message });
  }
};

module.exports = controllersConquistaEspecial;
