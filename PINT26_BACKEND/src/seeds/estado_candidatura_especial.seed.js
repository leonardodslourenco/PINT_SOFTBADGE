const EstadoCandidaturaEspecial = require('../models/estado_candidatura_especial.model');
const { ESTADOS_CANDIDATURA_ESPECIAL_LIST } = require('./conquistas_especiais_data');

async function seedEstadoCandidaturaEspecial(transaction) {
  for (const estado of ESTADOS_CANDIDATURA_ESPECIAL_LIST) {
    await EstadoCandidaturaEspecial.findOrCreate({
      where: { id_estado_candidatura_especial: estado.id_estado_candidatura_especial },
      defaults: {
        id_estado_candidatura_especial: estado.id_estado_candidatura_especial,
        id_traducao_estado: estado.id_traducao_estado
      },
      transaction
    });
  }

  console.log(`Seed EstadoCandidaturaEspecial executado (${ESTADOS_CANDIDATURA_ESPECIAL_LIST.length} estados registados)`);
}

module.exports = seedEstadoCandidaturaEspecial;
