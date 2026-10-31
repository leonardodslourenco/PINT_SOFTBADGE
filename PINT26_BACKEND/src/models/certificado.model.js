const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const Certificado = sequelize.define('certificado', {
  id_certificado: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_candidatura: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_consultor: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_badge: {
    type: Sequelize.UUID,
    allowNull: false
  },
  data_emissao: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  codigo_validacao: {
    type: Sequelize.STRING(12),
    allowNull: false,
    unique: true
  },
  ficheiro_path: {
    type: Sequelize.STRING(500),
    allowNull: false
  }
}, {
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['codigo_validacao'],
      name: 'ux_certificado_codigo_validacao'
    }
  ]
});

module.exports = Certificado;
