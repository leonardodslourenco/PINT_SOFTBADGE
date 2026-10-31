const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategoriaMiniforum = sequelize.define('categoria_miniforum', {
  id_categoria_miniforum: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_traducao_nome_categoria: {
    type: DataTypes.UUID,
    allowNull: false // Chave para traducao_conteudo (i18n do nome da categoria)
  },
  relacionamentoAtivo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = CategoriaMiniforum;
