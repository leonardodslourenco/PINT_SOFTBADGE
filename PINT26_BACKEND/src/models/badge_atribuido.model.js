const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const BadgeAtribuido = sequelize.define('badge_atribuido', {
  id_atribuicao: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_candidato: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_candidatura: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_badge: {
    type: Sequelize.UUID,
    allowNull: false
  },
  data_atribuicao_badge: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  data_expiracao: {
    type: Sequelize.DATE,
    allowNull: true
  },
  url_publico_badge: {
    type: Sequelize.STRING(150),
    allowNull: true
  },
  pontos_adquiridos: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  rgdp_partilha_badge: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  atribuicaoAtiva: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, 
{
  freezeTableName: true
});

module.exports = BadgeAtribuido;