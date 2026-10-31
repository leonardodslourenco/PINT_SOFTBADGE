const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const RequisitoBadge = sequelize.define('requisito_badge', {
  id_requisito: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_badge: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_requisito: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_subtitulo_req: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_descritivo_req: {
    type: Sequelize.UUID,
    allowNull: false
  },
  obrigatoriedade_req: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  requisitoAtivo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, 
{
  freezeTableName: true
});

module.exports = RequisitoBadge;
