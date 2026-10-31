const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const EstadoCandidatura = sequelize.define('estado_candidatura', {
  id_estado_candidatura: {
    type: Sequelize.SMALLINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_traducao_estado_candidatura: {
    type: Sequelize.UUID,
    allowNull: false
  }
}, 
{
  freezeTableName: true
});

module.exports = EstadoCandidatura;