const TipoObjetivo = require('../models/tipo_objetivo.model');
const { TIPOS_OBJETIVO_LIST } = require('./objetivos_data');

async function seedTipoObjetivo(transaction) {
  for (const tipo of TIPOS_OBJETIVO_LIST) {
    await TipoObjetivo.findOrCreate({
      where: { id_tipo_objetivo: tipo.id_tipo_objetivo },
      defaults: {
        id_tipo_objetivo: tipo.id_tipo_objetivo,
        codigo_tipo: tipo.codigo_tipo,
        id_traducao_titulo: tipo.id_traducao_titulo,
        id_traducao_descricao: tipo.id_traducao_descricao,
        tem_prazo: tipo.tem_prazo,
        ativo: true
      },
      transaction
    });
  }
  console.log(`Seed TipoObjetivo executado (${TIPOS_OBJETIVO_LIST.length} tipos registados)`);
}

module.exports = seedTipoObjetivo;
