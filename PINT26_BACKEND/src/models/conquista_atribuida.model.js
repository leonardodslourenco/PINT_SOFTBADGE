const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const ConquistaAtribuida = sequelize.define('conquista_atribuida', {
  id_conquista_atribuida: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => gerarUUIDv7()
  },
  id_utilizador: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_conquista_especial: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_candidatura_especial: {
    type: Sequelize.UUID,
    allowNull: true
  },
  data_atribuicao_conquista: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  pontos_conquistados: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 0
  },
  rgpd_partilha_conquista: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  atribuicaoAtiva: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = ConquistaAtribuida;
