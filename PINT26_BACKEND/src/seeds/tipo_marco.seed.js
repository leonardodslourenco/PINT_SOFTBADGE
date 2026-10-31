const TipoMarco = require('../models/tipo_marco.model');
const { TIPOS_MARCO_LIST } = require('./marcos_data');

async function seedTipoMarco(transaction) {
  for (const tipo of TIPOS_MARCO_LIST) {
    await TipoMarco.findOrCreate({
      where: { id_tipo_marco: tipo.id_tipo_marco },
      defaults: {
        id_tipo_marco: tipo.id_tipo_marco,
        codigo_tipo: tipo.codigo_tipo,
        id_traducao_titulo: tipo.id_traducao_titulo,
        id_traducao_descricao: tipo.id_traducao_descricao,
        ativo: true
      },
      transaction
    });
  }

  console.log(`Seed TipoMarco executado (${TIPOS_MARCO_LIST.length} tipos registados)`);
}

module.exports = seedTipoMarco;
