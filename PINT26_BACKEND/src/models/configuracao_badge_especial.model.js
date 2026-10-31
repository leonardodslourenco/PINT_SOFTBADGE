const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const ConfiguracaoBadgeEspecial = sequelize.define('configuracao_badge_especial', {
  id_configuracao_badge_especial: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => gerarUUIDv7()
  },
  id_tipo_badge_especial: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_conquista_especial: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_nome: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_descricao: {
    type: Sequelize.UUID,
    allowNull: false
  },
  ativo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = ConfiguracaoBadgeEspecial;
