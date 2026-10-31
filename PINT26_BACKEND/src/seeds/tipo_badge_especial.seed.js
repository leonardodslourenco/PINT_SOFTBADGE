const TipoBadgeEspecial = require('../models/tipo_badge_especial.model');
const { TIPOS_BADGE_ESPECIAL_LIST } = require('./conquistas_especiais_data');

async function seedTipoBadgeEspecial(transaction) {
  for (const tipo of TIPOS_BADGE_ESPECIAL_LIST) {
    await TipoBadgeEspecial.findOrCreate({
      where: { id_tipo_badge_especial: tipo.id_tipo_badge_especial },
      defaults: {
        id_tipo_badge_especial: tipo.id_tipo_badge_especial,
        codigo_tipo: tipo.codigo_tipo,
        id_traducao_titulo: tipo.id_traducao_titulo,
        id_traducao_descricao: tipo.id_traducao_descricao,
        requer_link: tipo.requer_link,
        requer_ficheiro: tipo.requer_ficheiro,
        ativo: true
      },
      transaction
    });
  }

  console.log(`Seed TipoBadgeEspecial executado (${TIPOS_BADGE_ESPECIAL_LIST.length} tipos registados)`);
}

module.exports = seedTipoBadgeEspecial;
