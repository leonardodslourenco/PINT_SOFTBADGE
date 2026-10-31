const ServiceLine = require('../models/service_line.model');
const Area = require('../models/area.model');
const NivelArea = require('../models/nivel.model');
const Badge = require('../models/badge.model');
const RequisitoBadge = require('../models/requisito_badge.model');
const Candidatura = require('../models/candidatura_badge.model');

const Utilizador = require('../models/utilizador.model');

/**
 * Retorna o ID da Service Line liderada pelo utilizador logado.
 * Retorna null se não liderar nenhuma.
 */
async function getSllServiceLineId(userId) {
  if (!userId) return null;
  // Verificar se é líder direto de uma Service Line
  const sl = await ServiceLine.findOne({ where: { id_sl_lider: userId } });
  if (sl) return sl.id_service_line;

  return null;
}

/**
 * Verifica se uma determinada entidade pertence à Service Line do SLL.
 * @param {string} userId ID do utilizador logado (UUID).
 * @param {string} entityType Tipo de entidade ('service_line', 'area', 'nivel', 'badge', 'requisito', 'candidatura').
 * @param {string|number} entityId ID da entidade a verificar.
 * @returns {Promise<boolean>} true se pertence, false caso contrário.
 */
async function checkSllScope(userId, entityType, entityId) {
  const slId = await getSllServiceLineId(userId);
  if (!slId) return false;

  try {
    switch (entityType) {
      case 'service_line':
        return Number(entityId) === Number(slId);

      case 'area': {
        const area = await Area.findByPk(entityId);
        return area && Number(area.id_service_line) === Number(slId);
      }

      case 'nivel': {
        const nivel = await NivelArea.findByPk(entityId, {
          include: [{ association: 'area' }]
        });
        return nivel && nivel.area && Number(nivel.area.id_service_line) === Number(slId);
      }

      case 'badge': {
        const badge = await Badge.findByPk(entityId, {
          include: [{
            association: 'nivel_area',
            include: [{ association: 'area' }]
          }]
        });
        return badge && badge.nivel_area && badge.nivel_area.area && 
               Number(badge.nivel_area.area.id_service_line) === Number(slId);
      }

      case 'requisito': {
        const req = await RequisitoBadge.findByPk(entityId, {
          include: [{
            association: 'badge',
            include: [{
              association: 'nivel_area',
              include: [{ association: 'area' }]
            }]
          }]
        });
        return req && req.badge && req.badge.nivel_area && req.badge.nivel_area.area && 
               Number(req.badge.nivel_area.area.id_service_line) === Number(slId);
      }

      case 'candidatura': {
        const cand = await Candidatura.findByPk(entityId, {
          include: [{
            association: 'badge',
            include: [{
              association: 'nivel_area',
              include: [{ association: 'area' }]
            }]
          }]
        });
        return cand && cand.badge && cand.badge.nivel_area && cand.badge.nivel_area.area && 
               Number(cand.badge.nivel_area.area.id_service_line) === Number(slId);
      }

      default:
        return false;
    }
  } catch (error) {
    console.error("Erro no checkSllScope:", error);
    return false;
  }
}

module.exports = {
  getSllServiceLineId,
  checkSllScope
};
