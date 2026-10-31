const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const RenovacaoBadge = sequelize.define('renovacao_badge', {
  id_renovacao_badge: {
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
  id_moderador: {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'utilizador',
      key: 'id_utilizador'
    }
  },
  pontos_renovacao: {
    type: Sequelize.SMALLINT,
    allowNull: true,
    defaultValue: null
  },
  data_pedido: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  data_renovacao: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null
  },
  renovacao_aprovada: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: null
  },
  renovacaoAtiva: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true,
  tableName: 'renovacao_badge'
});

module.exports = RenovacaoBadge;
