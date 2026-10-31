const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const Badge = sequelize.define('badge', {
  id_badge: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_nivel_area: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'nivel_area', // Nome da tabela referenciada
      key: 'id_nivel_area' // Coluna da tabela referenciada
    }
  },
  id_traducao_badge: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: 'traducao_conteudo',
      key: 'id_traducao_conteudo'
    }
  },
  logo: {
    type: Sequelize.STRING(255),
    allowNull: false,
    defaultValue: 'default_badge.svg'
  },
  emissor: {
    type: Sequelize.STRING(150),
    allowNull: false,
    defaultValue: 'Sistema Integração'
  },
  id_traducao_descricao_badge: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: 'traducao_conteudo',
      key: 'id_traducao_conteudo'
    }
  },
  pontos: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    }
  },
  badge_expiravel: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  tempo_expiracao: {
    type: Sequelize.SMALLINT,
    allowNull: true,
    defaultValue: null
  },
  tempo_aviso: {
    type: Sequelize.SMALLINT,
    allowNull: true,
    defaultValue: 30,
    validate: {
      min: 1,
      max: 90,
      isInt: true
    }
  },
  pontos_renovacao: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    }
  },
  dias_submeter: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 7,
    validate: {
      min: 1,
      max: 30,
      isInt: true
    }
  },
  badgeAtivo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, 
{
    freezeTableName: true,
  tableName: 'badge', // Define explicitamente o nome da tabela no banco de dados
});

module.exports = Badge;