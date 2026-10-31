const ConfiguracaoBadgeEspecial = require('../models/configuracao_badge_especial.model');
const { CONQUISTAS_ESPECIAIS_LIST } = require('./conquistas_especiais_data');
const { gerarUUIDv7 } = require('../services/geradores');

async function seedConfiguracaoBadgeEspecial(transaction) {
  let count = 0;
  for (const c of CONQUISTAS_ESPECIAIS_LIST) {
    if (c.id_tipo_badge_especial) {
      // Cria a configuração associando o tipo à conquista
      const existing = await ConfiguracaoBadgeEspecial.findOne({
        where: { id_conquista_especial: c.id_conquista_especial, id_tipo_badge_especial: c.id_tipo_badge_especial },
        transaction
      });

      if (!existing) {
        await ConfiguracaoBadgeEspecial.create({
          id_configuracao_badge_especial: gerarUUIDv7(),
          id_tipo_badge_especial: c.id_tipo_badge_especial,
          id_conquista_especial: c.id_conquista_especial,
          id_traducao_nome: c.id_traducao_conquista_especial,
          id_traducao_descricao: c.id_traducao_descricao_conquista_especial,
          ativo: true
        }, { transaction });
        count++;
      }
    }
  }

  console.log(`Seed ConfiguracaoBadgeEspecial executado (${count} novas configurações registadas)`);
}

module.exports = seedConfiguracaoBadgeEspecial;
