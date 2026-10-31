const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const EvidenciaCandidatura = sequelize.define('evidencia_candidatura', {
  id_evidencia_candidatura: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_candidatura: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_requisito: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  nome_ficheiro: {
    type: Sequelize.STRING(150),
    allowNull: false
  },
  url_ficheiro: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  data_upload_evidencia: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  validado_tm: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  id_tm_validador: {
    type: Sequelize.UUID,
    allowNull: true
  },
  validado_sll: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  id_sll_validador: {
    type: Sequelize.UUID,
    allowNull: true
  },
  evidenciaAtiva: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, 
{
  freezeTableName: true
});

module.exports = EvidenciaCandidatura;