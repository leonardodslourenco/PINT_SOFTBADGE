var Sequelize = require('sequelize');
var sequelize = require('../config/database');

var PerfilUtilizador = sequelize.define('perfil_utilizador', {

  id_utilizador: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false
  },
  id_perfil: {
    type: Sequelize.SMALLINT,
    primaryKey: true,
    allowNull: false
  },
  relacionamentoAtivo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }

}, {
  freezeTableName: true
});

module.exports = PerfilUtilizador;