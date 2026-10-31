// modelTraducaoConteudo.js
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const TraducaoConteudo = sequelize.define('traducao_conteudo', {
  id_traducao_conteudo: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  tabela: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  coluna: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  pt: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  en: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  es: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  freezeTableName: true,
  indexes: [
    {
      fields: ['tabela', 'coluna'],
      name: 'ix_traducao_conteudo'
    }
  ]
});

module.exports = TraducaoConteudo;