const Competencia = require('../models/competencia.model');
const { COMPETENCIAS_LIST } = require('./competencias_data');

async function seedCompetencia(transaction) {
  for (const comp of COMPETENCIAS_LIST) {
    await Competencia.findOrCreate({
      where: { id_competencia: comp.id_competencia },
      defaults: {
        id_competencia: comp.id_competencia,
        id_traducao_titulo_competencia: comp.id_traducao_titulo,
        id_traducao_descricao_competencia: comp.id_traducao_descricao,
        competenciaAtiva: true
      },
      transaction
    });
  }

  console.log(`Seed Competencia executado (${COMPETENCIAS_LIST.length} competências registadas)`);
}

module.exports = seedCompetencia;