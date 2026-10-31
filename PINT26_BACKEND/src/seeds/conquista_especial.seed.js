const ConquistaEspecial = require('../models/conquista_especial.model');
const { CONQUISTAS_ESPECIAIS_LIST } = require('./conquistas_especiais_data');

async function seedConquistaEspecial(transaction) {
  for (const c of CONQUISTAS_ESPECIAIS_LIST) {
    const [conquista, created] = await ConquistaEspecial.findOrCreate({
      where: { id_conquista_especial: c.id_conquista_especial },
      defaults: {
        id_conquista_especial: c.id_conquista_especial,
        id_traducao_conquista_especial: c.id_traducao_conquista_especial,
        id_traducao_descricao_conquista_especial: c.id_traducao_descricao_conquista_especial,
        pontos_bonus: c.pontos_bonus,
        logo_conquista: c.logo_conquista,
        conquistaEspecialAtiva: true
      },
      transaction
    });

    if (!created) {
      await conquista.update({
        logo_conquista: c.logo_conquista,
        pontos_bonus: c.pontos_bonus
      }, { transaction });
    }
  }

  console.log(`Seed ConquistaEspecial executado (${CONQUISTAS_ESPECIAIS_LIST.length} badges especiais registados)`);
}

module.exports = seedConquistaEspecial;
