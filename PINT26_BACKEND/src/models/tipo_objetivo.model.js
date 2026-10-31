const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const TipoObjetivo = sequelize.define('tipo_objetivo', {
  id_tipo_objetivo: {
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
  tem_prazo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = TipoObjetivo;
