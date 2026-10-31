const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TipoNotificacao = sequelize.define('tipo_notificacao', {
  id_tipo_notificacao: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  codigo_tipo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  id_traducao_descricao: {
    type: DataTypes.UUID,
    allowNull: false
  },
  relacionamentoAtivo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = TipoNotificacao;
