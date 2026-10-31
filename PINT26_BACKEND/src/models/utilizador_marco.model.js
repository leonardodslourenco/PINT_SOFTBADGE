const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const UtilizadorMarco = sequelize.define('utilizador_marco', {
  id_utilizador: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false
  },
  id_marco: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false
  },
  data_conquista_marco: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null
  },
  celebrado: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  freezeTableName: true
});

module.exports = UtilizadorMarco;
