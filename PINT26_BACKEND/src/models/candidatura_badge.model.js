const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const Candidatura = sequelize.define('candidatura', {
  id_candidatura: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_utilizador: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_badge: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_estado_candidatura: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    //defaultValue: 1 // Assumindo que 1 é o estado "OPEN"
  },
  data_candidatura: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  data_encerramento_candidatura: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null
  },
  partilhar_conclusao: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  candidatura_renovada: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  consultor_avisado: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  candidaturaAtiva: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, 
{
  freezeTableName: true
});

module.exports = Candidatura;