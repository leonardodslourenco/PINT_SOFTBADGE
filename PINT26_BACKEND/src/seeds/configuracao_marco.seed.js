const ConfiguracaoMarco = require('../models/configuracao_marco.model');
const { CONFIGURACOES_MARCO_DEFAULT } = require('./marcos_data');

async function seedConfiguracaoMarco(transaction) {
  for (const cm of CONFIGURACOES_MARCO_DEFAULT) {
    await ConfiguracaoMarco.findOrCreate({
      where: { id_marco: cm.id_marco },
      defaults: {
        id_marco: cm.id_marco,
        id_tipo_marco: cm.id_tipo_marco,
        id_traducao_nome: cm.id_traducao_nome,
        id_traducao_descricao: cm.id_traducao_descricao,
        quantidade_objetivo: cm.quantidade_objetivo,
        ativo: true
      },
      transaction
    });
  }

  console.log(`Seed ConfiguracaoMarco executado (${CONFIGURACOES_MARCO_DEFAULT.length} marcos padrão registados)`);
}

module.exports = seedConfiguracaoMarco;
