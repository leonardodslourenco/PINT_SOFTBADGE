const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const CompetenciaBadge = sequelize.define('competencia_badge', {
  id_competencia: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'competencia',
      key: 'id_competencia'
    }
  },
  id_badge: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    references: {
      model: 'badge',
      key: 'id_badge'
    }
  },
  relacionamentoAtivo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true,
  tableName: 'competencia_badge'
});

module.exports = CompetenciaBadge;