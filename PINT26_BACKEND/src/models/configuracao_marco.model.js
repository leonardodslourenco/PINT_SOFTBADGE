const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const ConfiguracaoMarco = sequelize.define('configuracao_marco', {
  id_marco: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => gerarUUIDv7()
  },
  id_tipo_marco: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_nome: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_descricao: {
    type: Sequelize.UUID,
    allowNull: false
  },
  quantidade_objetivo: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 1,
    validate: {
      isInt: { msg: 'A quantidade objetivo deve ser um número inteiro.' },
      min: { args: [1], msg: 'A quantidade objetivo mínima é 1.' },
      max: { args: [100], msg: 'A quantidade objetivo máxima é 100.' }
    }
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = ConfiguracaoMarco;
