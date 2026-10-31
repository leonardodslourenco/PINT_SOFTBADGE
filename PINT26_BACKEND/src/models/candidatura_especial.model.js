const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const CandidaturaEspecial = sequelize.define('candidatura_especial', {
  id_candidatura_especial: {
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
  id_estado_candidatura_especial: {
    type: Sequelize.SMALLINT,
    allowNull: false
  },
  url_comprovativo: {
    type: Sequelize.STRING(500),
    allowNull: true,
    defaultValue: null
  },
  ficheiro_comprovativo: {
    type: Sequelize.STRING(255),
    allowNull: true,
    defaultValue: null
  },
  data_candidatura: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  data_decisao: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null
  },
  motivo_recusa: {
    type: Sequelize.TEXT,
    allowNull: true,
    defaultValue: null
  },
  candidaturaEspecialAtiva: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = CandidaturaEspecial;
