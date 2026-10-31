const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const EstadoCandidaturaEspecial = sequelize.define('estado_candidatura_especial', {
  id_estado_candidatura_especial: {
    type: Sequelize.SMALLINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_traducao_estado: {
    type: Sequelize.UUID,
    allowNull: false
  }
}, {
  freezeTableName: true
});

module.exports = EstadoCandidaturaEspecial;
