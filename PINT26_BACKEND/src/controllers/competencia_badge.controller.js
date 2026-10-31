// =========================================================================
// CONTROLADOR DE RELACIONAMENTO COMPETÊNCIA <-> BADGE
// =========================================================================
const CompetenciaBadge = require('../models/competencia_badge.model');
const Competencia = require('../models/competencia.model');
const Badge = require('../models/badge.model');
const validaUUID = require('../services/valida_UUID');

const controllersCompetenciaBadge = {};

/**
 * 1. CRIAR OU REATIVAR RELACIONAMENTO (Competência <-> Badge)
 * POST /competencia-badge
 */
controllersCompetenciaBadge.createRelacionamento = async (req, res) => {
  try {
    const { id_competencia, id_badge } = req.body;

    if (!validaUUID(id_competencia, 7) || !validaUUID(id_badge, 7)) {
      return res.status(400).json({ success: false, message: 'id_competencia ou id_badge inválidos (UUID v7 esperado).' });
    }

    const competencia = await Competencia.findByPk(id_competencia);
    const badge = await Badge.findByPk(id_badge);
    
    if (!competencia || !competencia.competenciaAtiva) {
      return res.status(404).json({ success: false, message: 'Competência não encontrada ou inativa.' });
    }
    if (!badge || !badge.badgeAtivo) {
      return res.status(404).json({ success: false, message: 'Badge não encontrado ou inativo.' });
    }

    const [relacao] = await CompetenciaBadge.findOrCreate({
      where: { id_competencia, id_badge },
      defaults: { relacionamentoAtivo: true }
    });

    if (!relacao.relacionamentoAtivo) {
      await relacao.update({ relacionamentoAtivo: true });
    }

    return res.status(201).json({
      success: true,
      message: 'Relacionamento competência-badge criado com sucesso.',
      data: relacao
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao criar relacionamento.', error: error.message });
  }
};

/**
 * 2. LISTAR TODOS OS RELACIONAMENTOS
 * GET /competencia-badge
 */
controllersCompetenciaBadge.listRelacionamentos = async (req, res) => {
  try {
    const lang = req.lang || 'pt';
    const where = {};
    if (req.query.ativo !== undefined) {
      where.relacionamentoAtivo = req.query.ativo === 'true' || req.query.ativo === '1';
    }

    const dados = await CompetenciaBadge.findAll({
      where,
      include: [
        {
          association: 'competencia',
          include: [
            { association: 'traducao_titulo', attributes: [lang, 'pt', 'en', 'es'] },
            { association: 'traducao_descricao', attributes: [lang, 'pt', 'en', 'es'] }
          ]
        },
        {
          association: 'badge',
          include: [
            { association: 'traducao_titulo', attributes: [lang, 'pt', 'en', 'es'] }
          ]
        }
      ]
    });

    const formatado = dados.map(r => ({
      id_competencia: r.id_competencia,
      id_badge: r.id_badge,
      relacionamentoAtivo: r.relacionamentoAtivo,
      competencia_titulo: r.competencia?.traducao_titulo?.[lang] || r.competencia?.traducao_titulo?.pt || null,
      badge_titulo: r.badge?.traducao_titulo?.[lang] || r.badge?.traducao_titulo?.pt || null
    }));

    return res.status(200).json({ success: true, message: 'Relacionamentos recuperados com sucesso.', data: formatado });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar relacionamentos.', error: error.message });
  }
};

/**
 * 3. LISTAR COMPETÊNCIAS ASSOCIADAS A UM BADGE (Autenticado / Público)
 * GET /competencia-badge/badge/:idBadge
 */
controllersCompetenciaBadge.listByBadge = async (req, res) => {
  const { idBadge } = req.params;
  if (!validaUUID(idBadge, 7)) {
    return res.status(400).json({ success: false, message: 'ID de badge inválido.' });
  }

  try {
    const lang = req.lang || req.query.lang || 'pt';
    const dados = await CompetenciaBadge.findAll({
      where: { id_badge: idBadge, relacionamentoAtivo: true },
      include: [
        {
          association: 'competencia',
          where: { competenciaAtiva: true },
          include: [
            { association: 'traducao_titulo', attributes: [lang, 'pt', 'en', 'es'] },
            { association: 'traducao_descricao', attributes: [lang, 'pt', 'en', 'es'] }
          ]
        }
      ]
    });

    const formatado = dados.map(r => ({
      id_competencia: r.id_competencia,
      titulo: r.competencia?.traducao_titulo?.[lang] || r.competencia?.traducao_titulo?.pt || null,
      descricao: r.competencia?.traducao_descricao?.[lang] || r.competencia?.traducao_descricao?.pt || null
    }));

    return res.status(200).json({
      success: true,
      message: 'Competências do badge recuperadas com sucesso.',
      data: formatado
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar competências do badge.', error: error.message });
  }
};

/**
 * 4. REMOVER/DESATIVAR RELACIONAMENTO (Soft Delete)
 * DELETE /competencia-badge/:idCompetencia/:idBadge
 */
controllersCompetenciaBadge.deleteRelacionamento = async (req, res) => {
  const { idCompetencia, idBadge } = req.params;
  if (!validaUUID(idCompetencia, 7) || !validaUUID(idBadge, 7)) {
    return res.status(400).json({ success: false, message: 'IDs inválidos.' });
  }

  try {
    const relacao = await CompetenciaBadge.findOne({
      where: { id_competencia: idCompetencia, id_badge: idBadge }
    });
    if (!relacao) {
      return res.status(404).json({ success: false, message: 'Relacionamento não encontrado.' });
    }

    await relacao.update({ relacionamentoAtivo: false });
    return res.status(200).json({ success: true, message: 'Relacionamento inativado com sucesso.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao inativar relacionamento.', error: error.message });
  }
};

module.exports = controllersCompetenciaBadge;