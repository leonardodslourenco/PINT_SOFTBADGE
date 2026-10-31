const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const ConquistaEspecial = sequelize.define('conquista_especial', {
  id_conquista_especial: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => gerarUUIDv7()
  },
  id_traducao_conquista_especial: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_descricao_conquista_especial: {
    type: Sequelize.UUID,
    allowNull: false
  },
  pontos_bonus: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 100,
    validate: {
      isInt: { msg: 'Os pontos bónus devem ser um número inteiro.' },
      min: { args: [1], msg: 'Os pontos bónus mínimos são 1.' },
      max: { args: [1000], msg: 'Os pontos bónus máximos são 1000.' }
    }
  },
  logo_conquista: {
    type: Sequelize.STRING(255),
    allowNull: false,
    defaultValue: 'default_special_badge.svg'
  },
  conquistaEspecialAtiva: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = ConquistaEspecial;
