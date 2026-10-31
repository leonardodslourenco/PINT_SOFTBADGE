const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const Competencia = sequelize.define('competencia', {
  id_competencia: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_traducao_titulo_competencia: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_descricao_competencia: {
    type: Sequelize.UUID,
    allowNull: false
  },
  competenciaAtiva: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true,
  tableName: 'competencia'
});

module.exports = Competencia;