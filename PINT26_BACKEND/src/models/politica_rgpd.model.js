const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const PoliticaRGPD = sequelize.define('politica_rgpd', {
  id_politica: {
    type: Sequelize.SMALLINT,
    primaryKey: true,
    allowNull: false,
    defaultValue: 1
  },
  geral_pt: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  geral_en: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  geral_es: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  candidatura_pt: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  candidatura_en: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  candidatura_es: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {
  freezeTableName: true
});

module.exports = PoliticaRGPD;
