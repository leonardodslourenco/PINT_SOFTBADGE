const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const TipoBadgeEspecial = sequelize.define('tipo_badge_especial', {
  id_tipo_badge_especial: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => gerarUUIDv7()
  },
  codigo_tipo: {
    type: Sequelize.STRING(50),
    allowNull: false,
    unique: true
  },
  id_traducao_titulo: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_descricao: {
    type: Sequelize.UUID,
    allowNull: false
  },
  requer_link: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  requer_ficheiro: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = TipoBadgeEspecial;
