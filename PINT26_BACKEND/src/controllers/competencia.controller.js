// =========================================================================
// CONTROLADOR DE COMPETÊNCIAS (SKILLS)
// Gestão de Competências com suporte a Multi-idioma (i18n), UUID v7 e Consulta Pública
// =========================================================================
const Competencia = require('../models/competencia.model');
const CompetenciaBadge = require('../models/competencia_badge.model');
const Badge = require('../models/badge.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const sequelize = require('../config/database');
const validaUUID = require('../services/valida_UUID');
const { gerarUUIDv7 } = require('../services/geradores');
const { tratarPayloadTraducao } = require('../services/tradutor_helper');

const controllersCompetencia = {};

// =========================================================================
// HELPERS / AUXILIARES
// =========================================================================

/**
 * Constrói o array de includes para carregar título e descrição traduzidos.
 */
const buildInclude = (lang) => [
  { association: 'traducao_titulo', attributes: [lang, 'pt', 'en', 'es'] },
  { association: 'traducao_descricao', attributes: [lang, 'pt', 'en', 'es'] }
];

/**
 * Transforma a entidade Competência num formato plano e limpo para o cliente.
 */
const mapCompetencia = (c, lang) => ({
  id_competencia: c.id_competencia,
  titulo: c.traducao_titulo?.[lang] || c.traducao_titulo?.pt || null,
  descricao: c.traducao_descricao?.[lang] || c.traducao_descricao?.pt || null,
  traducoes_titulo: c.traducao_titulo ? {
    pt: c.traducao_titulo.pt,
    en: c.traducao_titulo.en,
    es: c.traducao_titulo.es
  } : null,
  traducoes_descricao: c.traducao_descricao ? {
    pt: c.traducao_descricao.pt,
    en: c.traducao_descricao.en,
    es: c.traducao_descricao.es
  } : null,
  competenciaAtiva: c.competenciaAtiva,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt
});

const buildAtivoFilter = (ativo) => {
  if (ativo === undefined || ativo === null || ativo === '') return {};
  return { competenciaAtiva: ativo === 'true' || ativo === '1' };
};

// =========================================================================
// MÉTODOS CONTROLADORES
// =========================================================================

/**
 * 1. CRIAR COMPETÊNCIA (Apenas ADMIN)
 * POST /competencia
 */
controllersCompetencia.createCompetencia = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { titulo, descricao, competencia } = req.body;
    const lang = req.lang || 'pt';

    const rawTitulo = titulo || competencia;
    if (!rawTitulo) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'O título da competência é obrigatório.' });
    }

    // Processamento de tradução (automática com IA se string única, ou objeto manual { pt, en, es })
    const { payload: payloadTitulo, hasValidTranslation: hasValidTitulo } = await tratarPayloadTraducao(rawTitulo, lang);
    if (!hasValidTitulo) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tradução do título incompleta ou inválida.' });
    }

    const rawDescricao = descricao || rawTitulo;
    const { payload: payloadDescricao, hasValidTranslation: hasValidDescricao } = await tratarPayloadTraducao(rawDescricao, lang);
    if (!hasValidDescricao) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Tradução da descrição incompleta ou inválida.' });
    }

    const idTraducaoTitulo = gerarUUIDv7();
    const idTraducaoDescricao = gerarUUIDv7();
    const idCompetencia = gerarUUIDv7();

    // 1. Criar traduções
    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoTitulo,
      tabela: 'competencia',
      coluna: 'titulo_competencia',
      pt: payloadTitulo.pt,
      en: payloadTitulo.en,
      es: payloadTitulo.es
    }, { transaction });

    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoDescricao,
      tabela: 'competencia',
      coluna: 'descricao_competencia',
      pt: payloadDescricao.pt,
      en: payloadDescricao.en,
      es: payloadDescricao.es
    }, { transaction });

    // 2. Criar a competência
    const novaCompetencia = await Competencia.create({
      id_competencia: idCompetencia,
      id_traducao_titulo_competencia: idTraducaoTitulo,
      id_traducao_descricao_competencia: idTraducaoDescricao,
      competenciaAtiva: true
    }, { transaction });

    await transaction.commit();

    const detalhe = await Competencia.findByPk(novaCompetencia.id_competencia, {
      include: buildInclude(lang)
    });

    return res.status(201).json({
      success: true,
      message: 'Competência criada com sucesso.',
      data: mapCompetencia(detalhe, lang)
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao criar competência.', error: error.message });
  }
};

/**
 * 2. LISTAR TODAS AS COMPETÊNCIAS (Autenticado)
 * GET /competencia
 */
controllersCompetencia.listCompetencias = async (req, res) => {
  try {
    const lang = req.lang || 'pt';
    const competencias = await Competencia.findAll({
      where: buildAtivoFilter(req.query.ativo),
      include: buildInclude(lang),
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: 'Competências recuperadas com sucesso.',
      data: competencias.map(c => mapCompetencia(c, lang))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar competências.', error: error.message });
  }
};

/**
 * 3. DETALHE DE UMA COMPETÊNCIA (Autenticado)
 * GET /competencia/:id
 */
controllersCompetencia.detailCompetencia = async (req, res) => {
  const { id } = req.params;
  if (!validaUUID(id, 7)) {
    return res.status(400).json({ success: false, message: 'ID de competência inválido (UUID v7 esperado).' });
  }

  try {
    const lang = req.lang || 'pt';
    const competencia = await Competencia.findByPk(id, {
      include: [
        ...buildInclude(lang),
        {
          association: 'badges',
          where: { badgeAtivo: true },
          required: false,
          through: { attributes: [] },
          include: [
            { association: 'traducao_titulo', attributes: [lang, 'pt', 'en', 'es'] },
            { association: 'traducao_descricao', attributes: [lang, 'pt', 'en', 'es'] }
          ]
        }
      ]
    });

    if (!competencia) {
      return res.status(404).json({ success: false, message: 'Competência não encontrada.' });
    }

    const resultado = mapCompetencia(competencia, lang);
    resultado.badges = (competencia.badges || []).map(b => ({
      id_badge: b.id_badge,
      titulo: b.traducao_titulo?.[lang] || b.traducao_titulo?.pt || null,
      descricao: b.traducao_descricao?.[lang] || b.traducao_descricao?.pt || null,
      logo: b.logo,
      pontos: b.pontos
    }));

    return res.status(200).json({
      success: true,
      message: 'Competência recuperada com sucesso.',
      data: resultado
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao recuperar competência.', error: error.message });
  }
};

/**
 * 4. DETALHE PÚBLICO DE UMA COMPETÊNCIA (Sem autenticação — para o Microsite /skill/:id)
 * GET /competencia/public/:id
 */
controllersCompetencia.detailCompetenciaPublic = async (req, res) => {
  const { id } = req.params;
  if (!validaUUID(id, 7)) {
    return res.status(400).json({ success: false, message: 'ID de competência inválido.' });
  }

  try {
    const lang = req.query.lang || req.lang || 'pt';
    const competencia = await Competencia.findOne({
      where: { id_competencia: id, competenciaAtiva: true },
      include: [
        ...buildInclude(lang),
        {
          association: 'badges',
          where: { badgeAtivo: true },
          required: false,
          through: { where: { relacionamentoAtivo: true }, attributes: [] },
          include: [
            { association: 'traducao_titulo', attributes: [lang, 'pt', 'en', 'es'] },
            { association: 'traducao_descricao', attributes: [lang, 'pt', 'en', 'es'] },
            {
              association: 'nivel_area',
              include: [
                { association: 'traducao_nivel_area', attributes: [lang, 'pt', 'en', 'es'] },
                {
                  association: 'area',
                  include: [{ association: 'traducao_area', attributes: [lang, 'pt', 'en', 'es'] }]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!competencia) {
      return res.status(404).json({ success: false, message: 'Competência não encontrada ou inativa.' });
    }

    const data = {
      id_competencia: competencia.id_competencia,
      titulo: competencia.traducao_titulo?.[lang] || competencia.traducao_titulo?.pt || 'Competência',
      descricao: competencia.traducao_descricao?.[lang] || competencia.traducao_descricao?.pt || '',
      badges: (competencia.badges || []).map(b => ({
        id_badge: b.id_badge,
        titulo: b.traducao_titulo?.[lang] || b.traducao_titulo?.pt || null,
        descricao: b.traducao_descricao?.[lang] || b.traducao_descricao?.pt || null,
        logo: b.logo,
        pontos: b.pontos,
        nivel: b.nivel_area?.traducao_nivel_area?.[lang] || b.nivel_area?.traducao_nivel_area?.pt || null,
        area: b.nivel_area?.area?.traducao_area?.[lang] || b.nivel_area?.area?.traducao_area?.pt || null
      }))
    };

    return res.status(200).json({
      success: true,
      message: 'Competência pública recuperada com sucesso.',
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao recuperar competência pública.', error: error.message });
  }
};

/**
 * 4.b LISTAGEM PÚBLICA DE COMPETÊNCIAS (Sem autenticação — para o Microsite /skill/list)
 * GET /competencia/public
 */
controllersCompetencia.listCompetenciasPublic = async (req, res) => {
  try {
    const lang = req.query.lang || req.lang || 'pt';
    const competencias = await Competencia.findAll({
      where: { competenciaAtiva: true },
      include: buildInclude(lang),
      order: [['createdAt', 'ASC']]
    });

    const data = competencias.map(c => ({
      id_competencia: c.id_competencia,
      titulo: c.traducao_titulo?.[lang] || c.traducao_titulo?.pt || 'Competência',
      descricao: c.traducao_descricao?.[lang] || c.traducao_descricao?.pt || ''
    }));

    return res.status(200).json({
      success: true,
      message: 'Competências públicas listadas com sucesso.',
      data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar competências públicas.', error: error.message });
  }
};

/**
 * 5. ATUALIZAR COMPETÊNCIA (Apenas ADMIN)
 * PUT /competencia/:id
 */
controllersCompetencia.updateCompetencia = async (req, res) => {
  const transaction = await sequelize.transaction();
  const { id } = req.params;
  if (!validaUUID(id, 7)) {
    await transaction.rollback();
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }

  try {
    const competencia = await Competencia.findByPk(id, { transaction });
    if (!competencia) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Competência não encontrada.' });
    }

    const { titulo, descricao, competenciaAtiva } = req.body;
    const lang = req.lang || 'pt';

    // Atualização de estado ativo se fornecido
    if (competenciaAtiva !== undefined) {
      await competencia.update({ competenciaAtiva: !!competenciaAtiva }, { transaction });
      if (competenciaAtiva === false) {
        await CompetenciaBadge.update(
          { relacionamentoAtivo: false },
          { where: { id_competencia: id }, transaction }
        );
      }
    }

    // Atualização do título
    if (titulo) {
      const { payload, hasValidTranslation } = await tratarPayloadTraducao(titulo, lang);
      if (hasValidTranslation) {
        await TraducaoConteudo.update(
          { pt: payload.pt, en: payload.en, es: payload.es },
          { where: { id_traducao_conteudo: competencia.id_traducao_titulo_competencia }, transaction }
        );
      }
    }

    // Atualização da descrição
    if (descricao) {
      const { payload, hasValidTranslation } = await tratarPayloadTraducao(descricao, lang);
      if (hasValidTranslation) {
        await TraducaoConteudo.update(
          { pt: payload.pt, en: payload.en, es: payload.es },
          { where: { id_traducao_conteudo: competencia.id_traducao_descricao_competencia }, transaction }
        );
      }
    }

    await transaction.commit();
    return res.status(200).json({ success: true, message: 'Competência atualizada com sucesso.' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao atualizar competência.', error: error.message });
  }
};

/**
 * 6. INATIVAR COMPETÊNCIA (Soft Delete - Apenas ADMIN)
 * DELETE /competencia/:id
 */
controllersCompetencia.deleteCompetencia = async (req, res) => {
  const transaction = await sequelize.transaction();
  const { id } = req.params;
  if (!validaUUID(id, 7)) {
    await transaction.rollback();
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }

  try {
    const competencia = await Competencia.findByPk(id, { transaction });
    if (!competencia) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Competência não encontrada.' });
    }

    await competencia.update({ competenciaAtiva: false }, { transaction });
    await CompetenciaBadge.update(
      { relacionamentoAtivo: false },
      { where: { id_competencia: id }, transaction }
    );

    await transaction.commit();
    return res.status(200).json({ success: true, message: 'Competência inativada com sucesso.' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao inativar competência.', error: error.message });
  }
};

module.exports = controllersCompetencia;