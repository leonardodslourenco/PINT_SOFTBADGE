const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const LeituraPostagem = sequelize.define('leitura_postagem', {
  id_leitura: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_postagem_miniforum: {
    type: DataTypes.UUID,
    allowNull: false
  },
  id_utilizador: {
    type: DataTypes.UUID,
    allowNull: false
  },
  data_leitura: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  freezeTableName: true
});

module.exports = LeituraPostagem;
