const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const TipoAcao = sequelize.define('tipo_acao', {
  id_tipo_acao_candidatura: {
    type: Sequelize.SMALLINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_traducao_acao_candidatura: {
    type: Sequelize.UUID,
    allowNull: false
  }
}, 
{
  freezeTableName: true
});

module.exports = TipoAcao;