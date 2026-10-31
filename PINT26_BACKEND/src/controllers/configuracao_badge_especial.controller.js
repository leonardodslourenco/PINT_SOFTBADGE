const ConfiguracaoBadgeEspecial = require('../models/configuracao_badge_especial.model');
const TipoBadgeEspecial = require('../models/tipo_badge_especial.model');
const ConquistaEspecial = require('../models/conquista_especial.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');
const { tratarPayloadTraducao } = require('../services/tradutor_helper');

const controllersConfigBadgeEspecial = {};

/**
 * POST /configuracao-badge-especial
 * Admin cria nova configuração de badge especial.
 */
controllersConfigBadgeEspecial.createConfiguracao = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const lang = req.lang || 'pt';
    const { id_tipo_badge_especial, id_conquista_especial, nome, descricao } = req.body;

    if (!id_tipo_badge_especial || !id_conquista_especial || !nome || !descricao) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    const tipo = await TipoBadgeEspecial.findByPk(id_tipo_badge_especial, { transaction });
    if (!tipo) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Tipo de badge especial não encontrado.' });
    }

    const conquista = await ConquistaEspecial.findByPk(id_conquista_especial, { transaction });
    if (!conquista) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Badge Especial não encontrado.' });
    }

    const nomeTrad = await tratarPayloadTraducao(nome, lang);
    const descTrad = await tratarPayloadTraducao(descricao, lang);

    const idTradNome = gerarUUIDv7();
    const idTradDesc = gerarUUIDv7();

    await TraducaoConteudo.create({
      id_traducao_conteudo: idTradNome,
      tabela: 'configuracao_badge_especial',
      coluna: 'id_traducao_nome',
      pt: nomeTrad.pt,
      en: nomeTrad.en,
      es: nomeTrad.es
    }, { transaction });

    await TraducaoConteudo.create({
      id_traducao_conteudo: idTradDesc,
      tabela: 'configuracao_badge_especial',
      coluna: 'id_traducao_descricao',
      pt: descTrad.pt,
      en: descTrad.en,
      es: descTrad.es
    }, { transaction });

    const novaConfig = await ConfiguracaoBadgeEspecial.create({
      id_configuracao_badge_especial: gerarUUIDv7(),
      id_tipo_badge_especial,
      id_conquista_especial,
      id_traducao_nome: idTradNome,
      id_traducao_descricao: idTradDesc,
      ativo: true
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({ success: true, message: 'Configuração criada com sucesso.', data: novaConfig });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao criar configuração.', error: error.message });
  }
};

/**
 * GET /configuracao-badge-especial
 * Lista todas as configurações ativas com suporte a i18n.
 */
controllersConfigBadgeEspecial.listConfiguracoes = async (req, res) => {
  try {
    const lang = req.lang || 'pt';

    const configs = await ConfiguracaoBadgeEspecial.findAll({
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

    const data = configs.map(c => ({
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
    return res.status(500).json({ success: false, message: 'Erro ao listar configurações.', error: error.message });
  }
};

/**
 * DELETE /configuracao-badge-especial/:id
 * Desativa uma configuração.
 */
controllersConfigBadgeEspecial.deleteConfiguracao = async (req, res) => {
  try {
    const { id } = req.params;
    const config = await ConfiguracaoBadgeEspecial.findByPk(id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuração não encontrada.' });
    }

    await config.update({ ativo: false });
    return res.status(200).json({ success: true, message: 'Configuração desativada com sucesso.' });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao desativar configuração.', error: error.message });
  }
};

module.exports = controllersConfigBadgeEspecial;
