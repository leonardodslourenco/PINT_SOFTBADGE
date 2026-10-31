const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const EvidenciaRenovacao = sequelize.define('evidencia_renovacao', {
  id_evidencia_renovacao: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_renovacao_badge: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: 'renovacao_badge',
      key: 'id_renovacao_badge'
    }
  },
  id_requisito: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'requisito_badge',
      key: 'id_requisito'
    }
  },
  nome_ficheiro: {
    type: Sequelize.STRING(150),
    allowNull: false
  },
  url_ficheiro: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  data_upload_evidencia: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  validado_moderador: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: null
  },
  id_moderador_validador: {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: 'utilizador',
      key: 'id_utilizador'
    }
  },
  evidenciaAtiva: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true,
  tableName: 'evidencia_renovacao'
});

module.exports = EvidenciaRenovacao;
