const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const AcaoCandidatura = sequelize.define('acao_candidatura', {
  id_acao_candidatura: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_candidatura: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_utilizador: {
    type: Sequelize.UUID,
    allowNull: false
  },
  tipo_acao_candidatura: {
    type: Sequelize.SMALLINT,
    allowNull: false
  },
  id_traducao_comentario_acao: {
    type: Sequelize.UUID,
    allowNull: true
  },
  data_acao_candidatura: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  acaoAtiva: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, 
{
  freezeTableName: true
});

module.exports = AcaoCandidatura;