const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const AlertaExpiracao = sequelize.define('alerta_expiracao', {
  id_alerta_expiracao: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_candidatura: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: 'candidatura',
      key: 'id_candidatura'
    }
  },
  id_badge: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: 'badge',
      key: 'id_badge'
    }
  },
  data_conquista: {
    type: Sequelize.DATE,
    allowNull: false
  },
  data_expiracao: {
    type: Sequelize.DATE,
    allowNull: false
  },
  utilizador_avisado: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  data_aviso: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  freezeTableName: true,
  tableName: 'alerta_expiracao'
});

module.exports = AlertaExpiracao;
